import { randomUUID } from "node:crypto";
import type { Types } from "mongoose";
import { consentTokenIsRevoked } from "@/lib/analyticsConsent";
import Order from "@/lib/models/Order";

export type PurchaseItemLike = {
  productSlug: string;
  price: number;
  qty: number;
  discountShare?: number;
  netRevenue?: number;
};

export type PurchaseOrderLike = {
  orderNumber: string;
  shippingFee: number;
  discounts?: { shipping?: number };
  paymentStatus: string;
  orderStatus: string;
  items: PurchaseItemLike[];
  analyticsAttribution?: AnalyticsAttribution;
};

export type AnalyticsAttribution = {
  consent: true;
  clientId: string;
  sessionId: string;
  consentTokenHash?: string;
};

export type PurchaseEvent = {
  name: "purchase";
  params: {
    transaction_id: string;
    value: number;
    currency: "EGP";
    shipping: number;
    items: Array<{ item_id: string; price: number; quantity: number }>;
  };
};

type FetchImplementation = (
  input: string | URL | Request,
  init?: RequestInit
) => Promise<Response>;

type SendPurchaseRequest = {
  event: PurchaseEvent;
  attribution: AnalyticsAttribution;
  confirmedAt: Date;
  now: Date;
  fetchImpl: FetchImplementation;
  apiSecret?: string;
};

type DeliveryStatus =
  | "delivered-to-transport"
  | "not-configured"
  | "retryable"
  | "rejected"
  | "ambiguous"
  | "stale";

const MEASUREMENT_ID = "G-FZW3R2J7Y9";
const MAX_EVENT_AGE_MS = 72 * 60 * 60 * 1000;
const MAX_DELIVERY_ATTEMPTS = 3;
const LEASE_MS = 60_000;
const SEND_TIMEOUT_MS = 8_000;

const money = (amount: number) => Math.round(amount * 100) / 100;

function lineNetRevenue(item: PurchaseItemLike) {
  if (item.netRevenue !== undefined) return money(Math.max(0, item.netRevenue));
  return money(Math.max(0, item.price * item.qty - (item.discountShare || 0)));
}

type FirstPaidUpdateRequest = {
  orderId: string;
  updateFields: Record<string, unknown>;
  confirmedAt: Date;
  requestedOrderStatus?: string;
};

export function firstPaidOrderUpdateQuery({
  orderId,
  updateFields,
  confirmedAt,
  requestedOrderStatus,
}: FirstPaidUpdateRequest) {
  const pipelineFields: Record<string, unknown> = Object.fromEntries(
    Object.entries(updateFields).map(([field, fieldValue]) => [
      field,
      { $literal: fieldValue },
    ])
  );
  const effectiveOrderStatus = requestedOrderStatus
    ? { $literal: requestedOrderStatus }
    : "$orderStatus";
  pipelineFields.analyticsPurchase = {
    $cond: [
      {
        $and: [
          { $ne: ["$paymentStatus", "fully_paid"] },
          { $eq: ["$analyticsAttribution.consent", true] },
          { $ne: ["$analyticsPurchase.status", "sent"] },
          {
            $eq: [
              { $ifNull: ["$analyticsPurchase.confirmedAt", null] },
              null,
            ],
          },
          { $ne: [effectiveOrderStatus, "cancelled"] },
        ],
      },
      {
        status: "pending",
        transactionId: "$orderNumber",
        attemptCount: 0,
        confirmedAt: { $literal: confirmedAt },
      },
      "$analyticsPurchase",
    ],
  };

  return Order.findByIdAndUpdate(orderId, [{ $set: pipelineFields }], {
    new: true,
    updatePipeline: true,
  });
}

export function buildPurchaseEvent(
  order: PurchaseOrderLike
): PurchaseEvent | null {
  if (
    order.paymentStatus !== "fully_paid" ||
    order.orderStatus === "cancelled" ||
    order.analyticsAttribution?.consent !== true
  ) {
    return null;
  }

  const items = order.items.map((item) => ({
    item_id: item.productSlug.slice(0, 100),
    price: lineNetRevenue(item) / item.qty,
    quantity: item.qty,
  }));
  const value = money(order.items.reduce((sum, item) => sum + lineNetRevenue(item), 0));
  const shippingDiscount = order.discounts?.shipping || 0;

  return {
    name: "purchase",
    params: {
      transaction_id: order.orderNumber,
      value,
      currency: "EGP",
      shipping: money(Math.max(0, order.shippingFee - shippingDiscount)),
      items,
    },
  };
}

export async function sendPurchaseEvent({
  event,
  attribution,
  confirmedAt,
  now,
  fetchImpl,
  apiSecret,
}: SendPurchaseRequest): Promise<{ status: DeliveryStatus }> {
  if (!apiSecret) return { status: "not-configured" };
  if (now.getTime() - confirmedAt.getTime() > MAX_EVENT_AGE_MS) {
    return { status: "stale" };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SEND_TIMEOUT_MS);
  try {
    const response = await fetchImpl(
      `https://www.google-analytics.com/mp/collect?measurement_id=${MEASUREMENT_ID}&api_secret=${encodeURIComponent(apiSecret)}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          client_id: attribution.clientId,
          timestamp_micros: confirmedAt.getTime() * 1000,
          consent: { ad_user_data: "DENIED", ad_personalization: "DENIED" },
          events: [
            {
              ...event,
              params: { ...event.params, session_id: Number(attribution.sessionId) },
            },
          ],
        }),
        signal: controller.signal,
      }
    );
    if (response.ok) return { status: "delivered-to-transport" };
    const retryable =
      response.status === 408 || response.status === 429 || response.status >= 500;
    return { status: retryable ? "retryable" : "rejected" };
  } catch (error) {
    if (
      error instanceof TypeError ||
      (error instanceof DOMException && error.name === "AbortError")
    ) {
      return { status: "ambiguous" };
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

type DeliverPendingOptions = {
  limit: number;
  orderIds?: string[];
};

type DeliveryRecord = {
  orderNumber: string;
  status: DeliveryStatus | "skipped";
};

async function releaseLease(
  orderId: Types.ObjectId,
  leaseToken: string,
  status: "pending" | "retryable" | "rejected",
  lastError: string
) {
  await Order.updateOne(
    { _id: orderId, "analyticsPurchase.leaseToken": leaseToken },
    {
      $set: {
        "analyticsPurchase.status": status,
        "analyticsPurchase.lastError": lastError,
      },
      $unset: {
        "analyticsPurchase.leaseToken": 1,
        "analyticsPurchase.leaseUntil": 1,
      },
    }
  );
}

async function markTransportAccepted(
  orderId: Types.ObjectId,
  leaseToken: string,
  now: Date
) {
  await Order.updateOne(
    { _id: orderId, "analyticsPurchase.leaseToken": leaseToken },
    {
      $set: { "analyticsPurchase.status": "sent", "analyticsPurchase.sentAt": now },
      $unset: {
        "analyticsPurchase.leaseToken": 1,
        "analyticsPurchase.leaseUntil": 1,
        "analyticsPurchase.lastError": 1,
      },
    }
  );
}

export async function deliverPendingPurchases({
  limit,
  orderIds,
}: DeliverPendingOptions): Promise<{
  status: "not-configured" | "processed";
  deliveries: DeliveryRecord[];
}> {
  const apiSecret = process.env.GA4_API_SECRET;
  if (!apiSecret) return { status: "not-configured", deliveries: [] };

  const deliveries: DeliveryRecord[] = [];
  const boundedLimit = Math.min(3, Math.max(1, limit));
  const claimedOrderIds: unknown[] = [];
  for (let index = 0; index < boundedLimit; index += 1) {
    const now = new Date();
    const leaseToken = randomUUID();
    const eligibility: Record<string, unknown> = {
      paymentStatus: "fully_paid",
      orderStatus: { $ne: "cancelled" },
      "analyticsAttribution.consent": true,
      $and: [
        {
          $or: [
            { "analyticsPurchase.attemptCount": { $exists: false } },
            { "analyticsPurchase.attemptCount": { $lt: MAX_DELIVERY_ATTEMPTS } },
          ],
        },
        {
          $or: [
            { "analyticsPurchase.status": { $in: ["pending", "retryable"] } },
            {
              "analyticsPurchase.status": "leased",
              "analyticsPurchase.leaseUntil": { $lt: now },
            },
          ],
        },
      ],
    };
    eligibility._id = orderIds
      ? { $in: orderIds, $nin: claimedOrderIds }
      : { $nin: claimedOrderIds };

    const claimed = await Order.findOneAndUpdate(
      eligibility,
      {
        $set: {
          "analyticsPurchase.status": "leased",
          "analyticsPurchase.leaseToken": leaseToken,
          "analyticsPurchase.leaseUntil": new Date(now.getTime() + LEASE_MS),
        },
        $inc: { "analyticsPurchase.attemptCount": 1 },
      },
      { new: true, sort: { "analyticsPurchase.confirmedAt": 1 } }
    ).lean();
    if (!claimed) break;
    claimedOrderIds.push(claimed._id);

    const current = await Order.findOne({
      _id: claimed._id,
      paymentStatus: "fully_paid",
      orderStatus: { $ne: "cancelled" },
      "analyticsPurchase.status": "leased",
      "analyticsPurchase.leaseToken": leaseToken,
      "analyticsAttribution.consent": true,
    })
      .select("+analyticsAttribution")
      .lean();
    const confirmedAt = current?.analyticsPurchase?.confirmedAt;
    const attribution = current?.analyticsAttribution;
    const revoked = attribution?.consentTokenHash
      ? await consentTokenIsRevoked(attribution.consentTokenHash)
      : true;
    const event = current && confirmedAt && !revoked
      ? buildPurchaseEvent(current)
      : null;
    if (!event || !confirmedAt || !attribution) {
      if (revoked) {
        await Order.updateOne(
          { _id: claimed._id, "analyticsAttribution.consentTokenHash": attribution?.consentTokenHash },
          { $unset: { analyticsAttribution: 1 } }
        );
      }
      await releaseLease(claimed._id, leaseToken, "rejected", "ineligible");
      deliveries.push({ orderNumber: claimed.orderNumber, status: "skipped" });
      continue;
    }

    const delivery = await sendPurchaseEvent({
      event,
      attribution,
      confirmedAt,
      now,
      apiSecret,
      fetchImpl: fetch,
    });
    if (delivery.status === "delivered-to-transport") {
      await markTransportAccepted(claimed._id, leaseToken, now);
    } else if (delivery.status === "rejected" || delivery.status === "stale") {
      await releaseLease(claimed._id, leaseToken, "rejected", delivery.status);
    } else {
      await releaseLease(claimed._id, leaseToken, "retryable", delivery.status);
    }
    deliveries.push({ orderNumber: claimed.orderNumber, status: delivery.status });
  }

  return { status: "processed", deliveries };
}
