import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB");

  const Order = (await import("./src/lib/models/Order.js")).default;
  const AdditionalCost = (await import("./src/lib/models/AdditionalCost.js")).default;
  const { deductInventoryForOrder } = await import("./src/lib/financeOperations.js");

  // Find a legacy order
  const order = await Order.findOne({
    orderStatus: "delivered",
    paymentStatus: "fully_paid",
    "finance.costingStatus": { $exists: false }
  });

  if (!order) {
    console.log("No legacy order found to test.");
    process.exit(0);
  }

  console.log("Testing with order:", order.orderNumber);

  try {
    const validated = {
      items: order.items.map(i => ({ productSlug: i.productSlug, finalUnitCost: 100 })),
      actualShipping: 50,
      otherCosts: 20,
      deductInventory: true
    };

    for (const item of order.items) {
      const match = validated.items.find((i) => i.productSlug === item.productSlug);
      if (match) {
        item.finalUnitCost = match.finalUnitCost;
        if (typeof item.netRevenue !== "number") {
          item.netRevenue = (item.price * item.qty) - (item.discountShare || 0);
        }
      }
    }

    order.finance = {
      ...order.finance,
      costingStatus: "final",
      legacyReviewedAt: new Date(),
      legacyReviewedBy: "test@example.com",
    };

    if (validated.deductInventory) {
      await deductInventoryForOrder(order);
    } else {
      order.finance.inventoryDeductedAt = new Date();
      await order.save();
    }

    await order.save();

    console.log("Success!");
  } catch (err) {
    console.error("Error occurred:");
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
