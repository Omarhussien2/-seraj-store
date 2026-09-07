import assert from "node:assert/strict";
import test from "node:test";
import Order from "../src/lib/models/Order";
import {
  buildPurchaseEvent,
  firstPaidOrderUpdateQuery,
  sendPurchaseEvent,
  type PurchaseOrderLike,
} from "../src/lib/analyticsPurchase";

const confirmedAt = new Date("2026-09-07T10:00:00.000Z");

function paidOrder(overrides: Partial<PurchaseOrderLike> = {}): PurchaseOrderLike {
  const document = new Order({
    orderNumber: "SRJ-TEST-1",
    total: 329,
    subtotal: 300,
    shippingFee: 40,
    discounts: { shipping: 10, subtotal: 0, products: 1 },
    discountTotal: 11,
    deposit: 0,
    remaining: 0,
    paymentMethod: "instapay",
    paymentMode: "full",
    paymentStatus: "fully_paid",
    orderStatus: "pending",
    analyticsAttribution: { consent: true, clientId: "123.456", sessionId: "789" },
    customerName: "PRIVATE CUSTOMER",
    customerPhone: "01123456789",
    address: "PRIVATE ADDRESS",
    items: [
      {
        productSlug: "trusted-sku",
        name: "PRIVATE CATALOG NAME",
        price: 100,
        qty: 3,
        discountShare: 1,
        netRevenue: 299,
      },
      {
        productSlug: "free-sku",
        name: "PRIVATE FREE NAME",
        price: 50,
        qty: 1,
        discountShare: 50,
        netRevenue: 0,
      },
    ],
  });

  return { ...document.toObject(), ...overrides } as PurchaseOrderLike;
}

test("paid purchase uses exact net item revenue, discounted shipping, and SKU-only items", () => {
  const event = buildPurchaseEvent(paidOrder());

  assert.ok(event);
  assert.equal(event.params.transaction_id, "SRJ-TEST-1");
  assert.equal(event.params.value, 299);
  assert.equal(event.params.shipping, 30);
  assert.equal(event.params.currency, "EGP");
  assert.deepEqual(event.params.items, [
    { item_id: "trusted-sku", price: 299 / 3, quantity: 3 },
    { item_id: "free-sku", price: 0, quantity: 1 },
  ]);
  assert.doesNotMatch(JSON.stringify(event), /PRIVATE|01123456789/);
});

test("first-paid query is an accepted Mongoose update pipeline with one atomic marker update", () => {
  const query = firstPaidOrderUpdateQuery({
    orderId: "68bd29e939b254893fc4d345",
    updateFields: { paymentStatus: "fully_paid", notes: "$literal text" },
    confirmedAt,
  });
  const update = query.getUpdate();

  assert.equal(
    (query as unknown as { _mongooseOptions: { updatePipeline?: boolean } })
      ._mongooseOptions.updatePipeline,
    true
  );
  assert.ok(Array.isArray(update));
  assert.equal(update.length, 1);
  const setStage = (
    update as Array<{ $set: Record<string, unknown> }>
  )[0].$set;
  const purchaseExpression = setStage.analyticsPurchase as {
    $cond: [{ $and: Array<{ $ne: unknown[] }> }];
  };
  assert.deepEqual(setStage.notes, { $literal: "$literal text" });
  const conditions = purchaseExpression.$cond[0].$and;
  assert.equal(conditions[0].$ne[0], "$paymentStatus");
  assert.deepEqual(conditions[2], { $ne: ["$analyticsPurchase.status", "sent"] });
  assert.deepEqual(conditions[4], { $ne: ["$orderStatus", "cancelled"] });
});

test("unpaid, deposit-paid, cancelled, and unattributed orders cannot produce a purchase", () => {
  const attribution = {
    analyticsAttribution: { consent: true as const, clientId: "123.456", sessionId: "789" },
  };
  assert.equal(buildPurchaseEvent(paidOrder({ ...attribution, paymentStatus: "unpaid" })), null);
  assert.equal(buildPurchaseEvent(paidOrder({ ...attribution, paymentStatus: "deposit_paid" })), null);
  assert.equal(buildPurchaseEvent(paidOrder({ ...attribution, orderStatus: "cancelled" })), null);
  assert.equal(buildPurchaseEvent(paidOrder({ analyticsAttribution: undefined })), null);
});

test("missing API secret and stale confirmations make zero Google requests", async () => {
  let requests = 0;
  const fetchImpl = async () => {
    requests += 1;
    return new Response(null, { status: 204 });
  };
  const event = buildPurchaseEvent(
    paidOrder({ analyticsAttribution: { consent: true, clientId: "123.456", sessionId: "789" } })
  );
  assert.ok(event);

  const notConfigured = await sendPurchaseEvent({
    event,
    attribution: { consent: true, clientId: "123.456", sessionId: "789" },
    confirmedAt,
    now: confirmedAt,
    fetchImpl,
  });
  const stale = await sendPurchaseEvent({
    event,
    attribution: { consent: true, clientId: "123.456", sessionId: "789" },
    confirmedAt,
    now: new Date("2026-09-10T10:00:00.001Z"),
    apiSecret: "test-secret",
    fetchImpl,
  });

  assert.deepEqual(notConfigured, { status: "not-configured" });
  assert.deepEqual(stale, { status: "stale" });
  assert.equal(requests, 0);
});

test("Measurement Protocol request carries confirmation time and denied advertising consent", async () => {
  let requestUrl = "";
  let requestBody = "";
  const event = buildPurchaseEvent(
    paidOrder({ analyticsAttribution: { consent: true, clientId: "123.456", sessionId: "789" } })
  );
  assert.ok(event);

  const delivery = await sendPurchaseEvent({
    event,
    attribution: { consent: true, clientId: "123.456", sessionId: "789" },
    confirmedAt,
    now: confirmedAt,
    apiSecret: "test-secret",
    fetchImpl: async (input, init) => {
      requestUrl = String(input);
      requestBody = String(init?.body);
      return new Response(null, { status: 204 });
    },
  });

  const payload = JSON.parse(requestBody);
  assert.deepEqual(delivery, { status: "delivered-to-transport" });
  assert.match(requestUrl, /^https:\/\/www\.google-analytics\.com\/mp\/collect\?/);
  assert.equal(requestUrl.includes("test-secret"), true);
  assert.equal(payload.client_id, "123.456");
  assert.equal(payload.timestamp_micros, 1788775200000000);
  assert.deepEqual(payload.consent, { ad_user_data: "DENIED", ad_personalization: "DENIED" });
  assert.equal(payload.events[0].params.session_id, 789);
  assert.equal("non_personalized_ads" in payload, false);
});

test("invalid 4xx is terminal while throttling, 5xx, and timeout remain distinguishable", async () => {
  const event = buildPurchaseEvent(
    paidOrder({ analyticsAttribution: { consent: true, clientId: "123.456", sessionId: "789" } })
  );
  assert.ok(event);
  const request = {
    event,
    attribution: { consent: true as const, clientId: "123.456", sessionId: "789" },
    confirmedAt,
    now: confirmedAt,
    apiSecret: "test-secret",
  };

  const rejected = await sendPurchaseEvent({
    ...request,
    fetchImpl: async () => new Response(null, { status: 400 }),
  });
  const retryable = await sendPurchaseEvent({
    ...request,
    fetchImpl: async () => new Response(null, { status: 503 }),
  });
  const throttled = await sendPurchaseEvent({
    ...request,
    fetchImpl: async () => new Response(null, { status: 429 }),
  });
  const ambiguous = await sendPurchaseEvent({
    ...request,
    fetchImpl: async () => {
      throw new DOMException("timed out", "AbortError");
    },
  });

  assert.deepEqual(rejected, { status: "rejected" });
  assert.deepEqual(retryable, { status: "retryable" });
  assert.deepEqual(throttled, { status: "retryable" });
  assert.deepEqual(ambiguous, { status: "ambiguous" });
});
