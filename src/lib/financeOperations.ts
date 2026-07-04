import mongoose from "mongoose";
import Order, { type IOrder } from "@/lib/models/Order";
import ProductFinance, { type IProductFinance } from "@/lib/models/ProductFinance";
import InventoryMovement from "@/lib/models/InventoryMovement";
import FinanceSettings from "@/lib/models/FinanceSettings";
import {
  canDeleteOrderFinancially,
  getStockWarning,
  roundMoney,
  type StockWarningInput,
} from "@/lib/financeMath";

export type FinanceProfile = Pick<
  IProductFinance,
  | "_id"
  | "productId"
  | "productSlug"
  | "averageUnitCost"
  | "currentStock"
  | "reservedStock"
  | "lowStockThreshold"
  | "trackInventory"
>;

export function defaultFinanceProfile(productSlug: string): FinanceProfile {
  return {
    _id: new mongoose.Types.ObjectId(),
    productSlug,
    averageUnitCost: 0,
    currentStock: 0,
    reservedStock: 0,
    lowStockThreshold: 0,
    trackInventory: false,
  } as FinanceProfile;
}

export async function getOrCreateFinanceSettings() {
  const doc = await FinanceSettings.findByIdAndUpdate(
    "finance-settings",
    { $setOnInsert: {} },
    { upsert: true, new: true, runValidators: true }
  ).lean();
  if (!doc) throw new Error("FinanceSettings upsert returned null");
  return doc;
}

export async function getFinanceProfileMap(slugs: string[]) {
  const uniqueSlugs = [...new Set(slugs.filter(Boolean))];
  const profiles = await ProductFinance.find({ productSlug: { $in: uniqueSlugs } }).lean();
  return new Map(profiles.map((profile) => [profile.productSlug, profile as FinanceProfile]));
}

export function profileForSlug(
  profiles: Map<string, FinanceProfile>,
  productSlug: string
): FinanceProfile {
  return profiles.get(productSlug) || defaultFinanceProfile(productSlug);
}

type OrderForFinance = Pick<
  IOrder,
  "_id" | "orderNumber" | "items" | "finance" | "orderStatus" | "paymentStatus" | "deposit" | "coupon"
>;

async function hasMovement(movementKey: string) {
  return Boolean(await InventoryMovement.exists({ movementKey }));
}

async function createMovementOnce(input: {
  movementKey: string;
  type: "reserve" | "release" | "sale" | "cancel";
  productSlug: string;
  productId?: mongoose.Types.ObjectId;
  orderId: mongoose.Types.ObjectId;
  orderNumber: string;
  qty: number;
  unitCost: number;
  note: string;
}) {
  if (await hasMovement(input.movementKey)) return false;

  try {
    await InventoryMovement.create({
      movementKey: input.movementKey,
      type: input.type,
      productSlug: input.productSlug,
      productId: input.productId,
      orderId: input.orderId,
      orderNumber: input.orderNumber,
      qty: input.qty,
      unitCost: input.unitCost,
      totalCost: roundMoney(input.qty * input.unitCost),
      note: input.note,
    });
    return true;
  } catch (error) {
    if (typeof error === "object" && error && "code" in error && error.code === 11000) {
      return false;
    }
    throw error;
  }
}

export async function reserveInventoryForOrder(order: OrderForFinance) {
  if (order.finance?.inventoryReservedAt) {
    return { warnings: order.finance.stockWarnings || [], reserved: false };
  }

  const profiles = await getFinanceProfileMap(order.items.map((item) => item.productSlug));
  const warnings: StockWarningInput[] = [];
  let reservedAny = false;

  for (const item of order.items) {
    const profile = profileForSlug(profiles, item.productSlug);
    if (!profile.trackInventory) continue;

    const warning = getStockWarning({
      productSlug: item.productSlug,
      trackInventory: profile.trackInventory,
      currentStock: profile.currentStock,
      reservedStock: profile.reservedStock,
      requestedQty: item.qty,
    });
    if (warning) warnings.push(warning);

    const movementCreated = await createMovementOnce({
      movementKey: `reserve:${order._id}:${item.productSlug}`,
      type: "reserve",
      productSlug: item.productSlug,
      productId: profile.productId,
      orderId: order._id,
      orderNumber: order.orderNumber,
      qty: item.qty,
      unitCost: profile.averageUnitCost || 0,
      note: "Order stock reservation",
    });

    if (movementCreated) {
      await ProductFinance.updateOne(
        { productSlug: item.productSlug },
        { $inc: { reservedStock: item.qty } }
      );
      reservedAny = true;
    }
  }

  if (reservedAny || warnings.length > 0) {
    await Order.findByIdAndUpdate(order._id, {
      $set: {
        "finance.inventoryReservedAt": new Date(),
        "finance.stockWarnings": warnings,
        "finance.costingStatus": "snapshot",
      },
    });
  } else {
    await Order.findByIdAndUpdate(order._id, {
      $set: { "finance.costingStatus": "snapshot" },
    });
  }

  return { warnings, reserved: reservedAny };
}

export async function deductInventoryForOrder(order: OrderForFinance) {
  if (order.finance?.inventoryDeductedAt) return { deducted: false };

  const profiles = await getFinanceProfileMap(order.items.map((item) => item.productSlug));
  const nextItems = order.items.map((item) => {
    const profile = profileForSlug(profiles, item.productSlug);
    const finalUnitCost =
      typeof item.finalUnitCost === "number"
        ? item.finalUnitCost
        : profile.averageUnitCost || item.estimatedUnitCost || 0;
    return { ...item, finalUnitCost };
  });

  let deductedAny = false;
  for (const item of order.items) {
    const profile = profileForSlug(profiles, item.productSlug);
    if (!profile.trackInventory) continue;

    const movementCreated = await createMovementOnce({
      movementKey: `sale:${order._id}:${item.productSlug}`,
      type: "sale",
      productSlug: item.productSlug,
      productId: profile.productId,
      orderId: order._id,
      orderNumber: order.orderNumber,
      qty: -item.qty,
      unitCost: profile.averageUnitCost || item.estimatedUnitCost || 0,
      note: "Order stock deduction",
    });

    if (movementCreated) {
      await ProductFinance.updateOne(
        { productSlug: item.productSlug },
        {
          $inc: { currentStock: -item.qty },
          $set: { reservedStock: Math.max(0, (profile.reservedStock || 0) - item.qty) },
        }
      );
      deductedAny = true;
    }
  }

  await Order.findByIdAndUpdate(order._id, {
    $set: {
      items: nextItems,
      "finance.inventoryDeductedAt": new Date(),
      "finance.costingStatus": "final",
    },
  });

  return { deducted: deductedAny };
}

export async function releaseOrReverseInventoryForOrder(order: OrderForFinance) {
  const profiles = await getFinanceProfileMap(order.items.map((item) => item.productSlug));

  if (order.finance?.inventoryDeductedAt && !order.finance?.inventoryReversedAt) {
    let reversedAny = false;
    for (const item of order.items) {
      const profile = profileForSlug(profiles, item.productSlug);
      if (!profile.trackInventory) continue;

      const movementCreated = await createMovementOnce({
        movementKey: `cancel:${order._id}:${item.productSlug}`,
        type: "cancel",
        productSlug: item.productSlug,
        productId: profile.productId,
        orderId: order._id,
        orderNumber: order.orderNumber,
        qty: item.qty,
        unitCost: item.finalUnitCost || profile.averageUnitCost || item.estimatedUnitCost || 0,
        note: "Cancelled order stock return",
      });

      if (movementCreated) {
        await ProductFinance.updateOne(
          { productSlug: item.productSlug },
          { $inc: { currentStock: item.qty } }
        );
        reversedAny = true;
      }
    }

    await Order.findByIdAndUpdate(order._id, {
      $set: { "finance.inventoryReversedAt": new Date() },
    });
    return { reversed: reversedAny, released: false };
  }

  if (order.finance?.inventoryReservedAt && !order.finance?.inventoryReleasedAt) {
    let releasedAny = false;
    for (const item of order.items) {
      const profile = profileForSlug(profiles, item.productSlug);
      if (!profile.trackInventory) continue;

      const movementCreated = await createMovementOnce({
        movementKey: `release:${order._id}:${item.productSlug}`,
        type: "release",
        productSlug: item.productSlug,
        productId: profile.productId,
        orderId: order._id,
        orderNumber: order.orderNumber,
        qty: -item.qty,
        unitCost: profile.averageUnitCost || item.estimatedUnitCost || 0,
        note: "Cancelled order stock release",
      });

      if (movementCreated) {
        await ProductFinance.updateOne(
          { productSlug: item.productSlug },
          { $set: { reservedStock: Math.max(0, (profile.reservedStock || 0) - item.qty) } }
        );
        releasedAny = true;
      }
    }

    await Order.findByIdAndUpdate(order._id, {
      $set: { "finance.inventoryReleasedAt": new Date() },
    });
    return { reversed: false, released: releasedAny };
  }

  return { reversed: false, released: false };
}

export async function canDeleteOrder(order: OrderForFinance) {
  if (!canDeleteOrderFinancially(order)) return false;
  const movement = await InventoryMovement.exists({ orderId: order._id });
  return !movement;
}
