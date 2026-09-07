import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import mongoose from "mongoose";
import {
  deliverPendingPurchases,
  firstPaidOrderUpdateQuery,
} from "../src/lib/analyticsPurchase";
import {
  attributionUnlessRevoked,
  consentTokenHash,
  revokeConsentTokens,
} from "../src/lib/analyticsConsent";
import AnalyticsConsentRevocation from "../src/lib/models/AnalyticsConsentRevocation";
import Order from "../src/lib/models/Order";

const TEST_URI_ENV = "CONVERSION_TEST_MONGODB_URI";
const EXPECTED_PORT = "27107";
const originalFetch = globalThis.fetch;
const originalApiSecret = process.env.GA4_API_SECRET;
let outboundPayloads: string[] = [];
const capabilityToken = "A".repeat(43);
const storedTokenHash = consentTokenHash(capabilityToken);

function isolatedMongoUri() {
  const uri = process.env[TEST_URI_ENV];
  assert.ok(uri, `${TEST_URI_ENV} is required`);
  const parsed = new URL(uri);
  const databaseName = parsed.pathname.slice(1);
  assert.equal(parsed.protocol, "mongodb:");
  assert.equal(parsed.hostname, "127.0.0.1");
  assert.equal(parsed.port, EXPECTED_PORT);
  assert.match(databaseName, /^seraj_conversion_test_[a-z0-9_]+$/);
  assert.equal(parsed.username, "");
  assert.equal(parsed.password, "");
  return uri;
}

function orderFixture(orderNumber: string, confirmedAt?: Date) {
  return {
    orderNumber,
    items: [
      {
        productSlug: "trusted-sku",
        name: "Catalog snapshot",
        price: 100,
        qty: 1,
        netRevenue: 100,
      },
    ],
    total: 140,
    subtotal: 100,
    shippingFee: 40,
    discountTotal: 0,
    discounts: { shipping: 0, subtotal: 0, products: 0 },
    deposit: 0,
    remaining: confirmedAt ? 0 : 140,
    paymentMethod: "instapay",
    paymentMode: "full",
    paymentStatus: confirmedAt ? "fully_paid" : "unpaid",
    orderStatus: "pending",
    analyticsAttribution: {
      consent: true as const,
      clientId: "123.456",
      sessionId: "789",
      consentTokenHash: storedTokenHash,
    },
    analyticsPurchase: confirmedAt
      ? {
          status: "pending",
          transactionId: orderNumber,
          attemptCount: 0,
          confirmedAt,
        }
      : undefined,
    customerName: "Integration Test",
    customerPhone: "01123456789",
    customerEmail: "integration@example.test",
    address: "Isolated database only",
  };
}

function acceptedFetch() {
  return async (_input: string | URL | Request, init?: RequestInit) => {
    outboundPayloads.push(String(init?.body));
    return new Response(null, { status: 204 });
  };
}

before(async () => {
  await mongoose.connect(isolatedMongoUri(), { serverSelectionTimeoutMS: 5_000 });
  await mongoose.connection.db!.dropDatabase();
  await Promise.all([
    Order.syncIndexes(),
    AnalyticsConsentRevocation.syncIndexes(),
  ]);
});

beforeEach(async () => {
  await Order.deleteMany({});
  await AnalyticsConsentRevocation.deleteMany({});
  outboundPayloads = [];
  process.env.GA4_API_SECRET = "integration-test-secret";
  globalThis.fetch = acceptedFetch();
});

after(async () => {
  globalThis.fetch = originalFetch;
  if (originalApiSecret === undefined) delete process.env.GA4_API_SECRET;
  else process.env.GA4_API_SECRET = originalApiSecret;
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.db!.dropDatabase();
    await mongoose.disconnect();
  }
});

test("simultaneous first-paid updates persist one stable confirmation marker", async () => {
  const order = await Order.create(orderFixture("SRJ-INTEGRATION-FIRST"));
  const firstTime = new Date("2026-09-07T10:00:00.000Z");
  const secondTime = new Date("2026-09-07T10:00:01.000Z");

  await Promise.all([
    firstPaidOrderUpdateQuery({
      orderId: String(order._id),
      updateFields: { paymentStatus: "fully_paid" },
      confirmedAt: firstTime,
    }),
    firstPaidOrderUpdateQuery({
      orderId: String(order._id),
      updateFields: { paymentStatus: "fully_paid" },
      confirmedAt: secondTime,
    }),
  ]);

  const persisted = await Order.findById(order._id).lean();
  assert.equal(persisted?.paymentStatus, "fully_paid");
  assert.equal(persisted?.analyticsPurchase?.status, "pending");
  assert.equal(persisted?.analyticsPurchase?.transactionId, order.orderNumber);
  assert.equal(persisted?.analyticsPurchase?.attemptCount, 0);
  assert.ok(
    [firstTime.getTime(), secondTime.getTime()].includes(
      persisted!.analyticsPurchase!.confirmedAt!.getTime()
    )
  );

  const stableTime = persisted!.analyticsPurchase!.confirmedAt!.getTime();
  await firstPaidOrderUpdateQuery({
    orderId: String(order._id),
    updateFields: { paymentStatus: "fully_paid" },
    confirmedAt: new Date("2026-09-07T10:00:02.000Z"),
  });
  const repeated = await Order.findById(order._id).lean();
  assert.equal(repeated?.analyticsPurchase?.confirmedAt?.getTime(), stableTime);
});

test("an active lease excludes a concurrent delivery worker", { timeout: 10_000 }, async () => {
  const confirmedAt = new Date();
  const order = await Order.create(
    orderFixture("SRJ-INTEGRATION-CONCURRENT", confirmedAt)
  );
  let releaseFetch!: () => void;
  let notifyFetchStarted!: () => void;
  const fetchStarted = new Promise<void>((resolve) => {
    notifyFetchStarted = resolve;
  });
  const fetchRelease = new Promise<void>((resolve) => {
    releaseFetch = resolve;
  });
  globalThis.fetch = async (_input, init) => {
    outboundPayloads.push(String(init?.body));
    notifyFetchStarted();
    await fetchRelease;
    return new Response(null, { status: 204 });
  };

  const firstWorker = deliverPendingPurchases({
    limit: 1,
    orderIds: [String(order._id)],
  });
  let secondDelivery;
  try {
    await fetchStarted;
    secondDelivery = await deliverPendingPurchases({
      limit: 1,
      orderIds: [String(order._id)],
    });
    assert.deepEqual(secondDelivery.deliveries, []);
    assert.equal(outboundPayloads.length, 1);
  } finally {
    releaseFetch();
  }
  const firstDelivery = await firstWorker;

  assert.equal(outboundPayloads.length, 1);
  assert.equal(firstDelivery.deliveries.length, 1);
  const persisted = await Order.findById(order._id).lean();
  assert.equal(persisted?.analyticsPurchase?.status, "sent");
  assert.equal(persisted?.analyticsPurchase?.attemptCount, 1);
  assert.ok(persisted?.analyticsPurchase?.sentAt);
});

test("an expired lease is recovered and completed by a new token", async () => {
  const confirmedAt = new Date();
  const fixture = orderFixture("SRJ-INTEGRATION-EXPIRED", confirmedAt);
  fixture.analyticsPurchase = {
    ...fixture.analyticsPurchase!,
    status: "leased",
    attemptCount: 1,
    leaseToken: "expired-token",
    leaseUntil: new Date(Date.now() - 1_000),
  } as typeof fixture.analyticsPurchase & {
    leaseToken: string;
    leaseUntil: Date;
  };
  const order = await Order.create(fixture);

  const delivery = await deliverPendingPurchases({
    limit: 1,
    orderIds: [String(order._id)],
  });

  assert.equal(delivery.deliveries[0]?.status, "delivered-to-transport");
  assert.equal(outboundPayloads.length, 1);
  const persisted = await Order.findById(order._id).lean();
  assert.equal(persisted?.analyticsPurchase?.status, "sent");
  assert.equal(persisted?.analyticsPurchase?.attemptCount, 2);
  assert.equal(persisted?.analyticsPurchase?.leaseToken, undefined);
  assert.equal(persisted?.analyticsPurchase?.leaseUntil, undefined);
});

test("a sent marker survives unpaid and fully-paid status changes", async () => {
  const confirmedAt = new Date("2026-09-07T10:00:00.000Z");
  const sentAt = new Date("2026-09-07T10:00:05.000Z");
  const fixture = orderFixture("SRJ-INTEGRATION-SENT", confirmedAt);
  fixture.analyticsPurchase = {
    ...fixture.analyticsPurchase!,
    status: "sent",
    attemptCount: 1,
    sentAt,
  } as typeof fixture.analyticsPurchase & { sentAt: Date };
  const order = await Order.create(fixture);

  await Order.updateOne({ _id: order._id }, { $set: { paymentStatus: "unpaid" } });
  await firstPaidOrderUpdateQuery({
    orderId: String(order._id),
    updateFields: { paymentStatus: "fully_paid" },
    confirmedAt: new Date("2026-09-07T11:00:00.000Z"),
  });

  const persisted = await Order.findById(order._id).lean();
  assert.equal(persisted?.paymentStatus, "fully_paid");
  assert.equal(persisted?.analyticsPurchase?.status, "sent");
  assert.equal(persisted?.analyticsPurchase?.confirmedAt?.getTime(), confirmedAt.getTime());
  assert.equal(persisted?.analyticsPurchase?.sentAt?.getTime(), sentAt.getTime());
});

test("missing secret leaves pending state and attempt count untouched", async () => {
  const order = await Order.create(
    orderFixture("SRJ-INTEGRATION-NO-SECRET", new Date())
  );
  delete process.env.GA4_API_SECRET;
  globalThis.fetch = async () => {
    assert.fail("Google transport must not be called without a secret");
  };

  const delivery = await deliverPendingPurchases({
    limit: 1,
    orderIds: [String(order._id)],
  });

  assert.deepEqual(delivery, { status: "not-configured", deliveries: [] });
  const persisted = await Order.findById(order._id).lean();
  assert.equal(persisted?.analyticsPurchase?.status, "pending");
  assert.equal(persisted?.analyticsPurchase?.attemptCount, 0);
  assert.equal(persisted?.analyticsPurchase?.leaseToken, undefined);
});

test("one retry batch claims distinct orders and respects both caps", async () => {
  const baseTime = Date.now();
  const eligibleOrders = await Order.create(
    Array.from({ length: 4 }, (_, index) =>
      orderFixture(
        `SRJ-INTEGRATION-BATCH-${index + 1}`,
        new Date(baseTime + index)
      )
    )
  );
  const cappedFixture = orderFixture(
    "SRJ-INTEGRATION-CAPPED",
    new Date(baseTime - 1_000)
  );
  cappedFixture.analyticsPurchase = {
    ...cappedFixture.analyticsPurchase!,
    status: "retryable",
    attemptCount: 3,
  };
  const cappedOrder = await Order.create(cappedFixture);
  globalThis.fetch = async (_input, init) => {
    outboundPayloads.push(String(init?.body));
    return new Response(null, { status: 503 });
  };

  const delivery = await deliverPendingPurchases({ limit: 10 });

  const transactionIds = outboundPayloads.map(
    (body) => JSON.parse(body).events[0].params.transaction_id
  );
  assert.equal(delivery.deliveries.length, 3);
  assert.equal(outboundPayloads.length, 3);
  assert.equal(new Set(transactionIds).size, 3);
  const persistedEligible = await Order.find({
    _id: { $in: eligibleOrders.map((order) => order._id) },
  }).lean();
  assert.equal(
    persistedEligible.filter((order) => order.analyticsPurchase?.attemptCount === 1)
      .length,
    3
  );
  assert.equal(
    persistedEligible.filter((order) => order.analyticsPurchase?.attemptCount === 0)
      .length,
    1
  );
  const persistedCapped = await Order.findById(cappedOrder._id).lean();
  assert.equal(persistedCapped?.analyticsPurchase?.attemptCount, 3);
  assert.equal(persistedCapped?.analyticsPurchase?.status, "retryable");
});

test("withdrawing one consent period removes attribution from every matching order", async () => {
  const orders = await Order.create([
    orderFixture("SRJ-INTEGRATION-WITHDRAW-1"),
    orderFixture("SRJ-INTEGRATION-WITHDRAW-2"),
  ]);
  const hiddenByDefault = await Order.findById(orders[0]._id).lean();
  const selectedForDelivery = await Order.findById(orders[0]._id)
    .select("+analyticsAttribution")
    .lean();
  assert.equal(hiddenByDefault?.analyticsAttribution, undefined);
  assert.equal(
    selectedForDelivery?.analyticsAttribution?.consentTokenHash,
    storedTokenHash
  );

  await revokeConsentTokens([capabilityToken]);

  const persisted = await Order.find({
    _id: { $in: orders.map((order) => order._id) },
  })
    .select("+analyticsAttribution")
    .lean();
  assert.equal(persisted.every((order) => !order.analyticsAttribution), true);
  assert.ok(
    await AnalyticsConsentRevocation.exists({ tokenHash: storedTokenHash })
  );
});

test("a revoked token cannot be attached to a newly created order", async () => {
  await revokeConsentTokens([capabilityToken]);

  const attribution = await attributionUnlessRevoked({
    consent: true,
    clientId: "123.456",
    sessionId: "789",
    consentToken: capabilityToken,
  });

  assert.equal(attribution, undefined);
});

test("a tombstone prevents a leased purchase from reaching the transport", async () => {
  const order = await Order.create(
    orderFixture("SRJ-INTEGRATION-REVOKED-DELIVERY", new Date())
  );
  await AnalyticsConsentRevocation.create({ tokenHash: storedTokenHash });
  globalThis.fetch = async () => {
    assert.fail("Revoked analytics consent must be checked before transport");
  };

  const delivery = await deliverPendingPurchases({
    limit: 1,
    orderIds: [String(order._id)],
  });

  assert.equal(delivery.deliveries[0]?.status, "skipped");
  const persisted = await Order.findById(order._id)
    .select("+analyticsAttribution")
    .lean();
  assert.equal(persisted?.analyticsPurchase?.status, "rejected");
  assert.equal(persisted?.analyticsAttribution, undefined);
});
