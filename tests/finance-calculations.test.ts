import assert from "node:assert/strict";
import test from "node:test";
import {
  canDeleteOrderFinancially,
  getStockWarning,
  summarizeFinance,
} from "../src/lib/financeMath";

test("summarizes actual profit only from delivered and fully paid costed orders", () => {
  const summary = summarizeFinance(
    [
      {
        orderStatus: "delivered",
        paymentStatus: "fully_paid",
        total: 235,
        subtotal: 220,
        shippingFee: 35,
        discounts: { shipping: 20, subtotal: 0, products: 0 },
        items: [
          {
            productSlug: "story-khaled",
            qty: 2,
            unitPriceSnapshot: 110,
            estimatedUnitCost: 40,
            finalUnitCost: 45,
            discountShare: 0,
            netRevenue: 220,
          },
        ],
      },
      {
        orderStatus: "pending",
        paymentStatus: "unpaid",
        total: 140,
        items: [{ productSlug: "story-omar", qty: 1, price: 140 }],
      },
    ],
    [{ scope: "general", amount: 30 }]
  );

  assert.equal(summary.actualOrdersCount, 1);
  assert.equal(summary.expectedOrdersCount, 1);
  assert.equal(summary.netRevenue, 235);
  assert.equal(summary.productRevenue, 220);
  assert.equal(summary.shippingRevenue, 15);
  assert.equal(summary.cogs, 90);
  assert.equal(summary.grossProfit, 130);
  assert.equal(summary.netProfit, 115);
  assert.equal(summary.productStats[0].additionalCosts, 30);
  assert.equal(summary.productStats[0].netProfit, 100);
});

test("separates delivered paid legacy orders without cost snapshots", () => {
  const summary = summarizeFinance([
    {
      orderStatus: "delivered",
      paymentStatus: "fully_paid",
      total: 140,
      items: [{ productSlug: "legacy", qty: 1, price: 140 }],
    },
  ]);

  assert.equal(summary.actualOrdersCount, 0);
  assert.equal(summary.legacyActualOrdersCount, 1);
  assert.equal(summary.netRevenue, 0);
});

test("stock shortage warning is non-blocking but explicit", () => {
  assert.deepEqual(
    getStockWarning({
      productSlug: "story-khaled",
      trackInventory: true,
      currentStock: 3,
      reservedStock: 2,
      requestedQty: 4,
    }),
    { productSlug: "story-khaled", requestedQty: 4, availableQty: 1 }
  );

  assert.equal(
    getStockWarning({
      productSlug: "custom-story",
      trackInventory: false,
      currentStock: 0,
      reservedStock: 0,
      requestedQty: 99,
    }),
    null
  );
});

test("orders with financial impact cannot be deleted", () => {
  assert.equal(
    canDeleteOrderFinancially({
      orderStatus: "pending",
      paymentStatus: "unpaid",
    }),
    true
  );

  assert.equal(
    canDeleteOrderFinancially({
      orderStatus: "pending",
      paymentStatus: "unpaid",
      finance: { inventoryReservedAt: new Date() },
    }),
    false
  );

  assert.equal(
    canDeleteOrderFinancially({
      orderStatus: "delivered",
      paymentStatus: "fully_paid",
    }),
    false
  );
});
