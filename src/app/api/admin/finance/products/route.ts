import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/requireAdmin";
import Product from "@/lib/models/Product";
import ProductFinance from "@/lib/models/ProductFinance";
import InventoryMovement from "@/lib/models/InventoryMovement";
import { roundMoney } from "@/lib/financeMath";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const PatchSchema = z.object({
  productSlug: z.string().min(1),
  averageUnitCost: z.number().min(0).optional(),
  currentStock: z.number().optional(),
  lowStockThreshold: z.number().min(0).optional(),
  trackInventory: z.boolean().optional(),
});

type MovementSummary = {
  openingQty: number;
  purchasedQty: number;
  adjustmentQty: number;
  soldQty: number;
  returnedQty: number;
  totalInQty: number;
  totalOutQty: number;
};

type MovementDoc = {
  productSlug: string;
  type: string;
  qty: number;
  unitCost?: number;
  totalCost?: number;
  orderNumber?: string;
  note?: string;
  createdAt?: Date;
};

const emptyMovementSummary: MovementSummary = {
  openingQty: 0,
  purchasedQty: 0,
  adjustmentQty: 0,
  soldQty: 0,
  returnedQty: 0,
  totalInQty: 0,
  totalOutQty: 0,
};

function summarizeMovements(movements: MovementDoc[]) {
  return movements.reduce<MovementSummary>((summary, movement) => {
    const qty = Number(movement.qty) || 0;
    if (movement.type === "opening") summary.openingQty += qty;
    if (movement.type === "purchase") summary.purchasedQty += qty;
    if (movement.type === "adjustment") summary.adjustmentQty += qty;
    if (movement.type === "sale") summary.soldQty += Math.abs(qty);
    if (movement.type === "cancel") summary.returnedQty += qty;

    if (["opening", "purchase", "cancel"].includes(movement.type) && qty > 0) {
      summary.totalInQty += qty;
    }
    if (movement.type === "adjustment") {
      if (qty > 0) summary.totalInQty += qty;
      if (qty < 0) summary.totalOutQty += Math.abs(qty);
    }
    if (movement.type === "sale" && qty < 0) {
      summary.totalOutQty += Math.abs(qty);
    }
    return summary;
  }, { ...emptyMovementSummary });
}

export async function GET() {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    await connectDB();
    const products = await Product.find({})
      .sort({ order: 1 })
      .select("_id slug name price active order")
      .lean();
    const productSlugs = products.map((product) => product.slug);
    const [financeDocs, movementDocs] = await Promise.all([
      ProductFinance.find({ productSlug: { $in: productSlugs } }).lean(),
      InventoryMovement.find({ productSlug: { $in: productSlugs } })
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    const financeMap = new Map(financeDocs.map((doc) => [doc.productSlug, doc]));
    const movementsByProduct = new Map<string, MovementDoc[]>();
    for (const movement of movementDocs as MovementDoc[]) {
      const movements = movementsByProduct.get(movement.productSlug) || [];
      movements.push(movement);
      movementsByProduct.set(movement.productSlug, movements);
    }

    const data = products.map((product) => {
      const finance = financeMap.get(product.slug);
      const productMovements = movementsByProduct.get(product.slug) || [];
      const averageUnitCost = finance?.averageUnitCost || 0;
      const currentStock = finance?.currentStock || 0;
      const reservedStock = finance?.reservedStock || 0;
      const availableStock = currentStock - reservedStock;
      const lowStockThreshold = finance?.lowStockThreshold || 0;
      const expectedUnitProfit = roundMoney((product.price || 0) - averageUnitCost);
      const expectedMargin =
        product.price > 0 ? roundMoney((expectedUnitProfit / product.price) * 100) : 0;

      return {
        productId: product._id,
        productSlug: product.slug,
        name: product.name,
        price: product.price,
        active: product.active,
        order: product.order,
        averageUnitCost,
        currentStock,
        reservedStock,
        availableStock,
        lowStockThreshold,
        trackInventory: finance?.trackInventory || false,
        inventoryValue: roundMoney(currentStock * averageUnitCost),
        movementSummary: summarizeMovements(productMovements),
        recentMovements: productMovements.slice(0, 5).map((movement) => ({
          type: movement.type,
          qty: movement.qty,
          unitCost: movement.unitCost || 0,
          totalCost: movement.totalCost || 0,
          orderNumber: movement.orderNumber,
          note: movement.note,
          createdAt: movement.createdAt,
        })),
        expectedUnitProfit,
        expectedMargin,
        isLowStock:
          Boolean(finance?.trackInventory) &&
          lowStockThreshold > 0 &&
          availableStock <= lowStockThreshold,
      };
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("GET /api/admin/finance/products error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load finance products" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    await connectDB();
    const body = await request.json();
    const validated = PatchSchema.parse(body);

    const product = await Product.findOne({ slug: validated.productSlug })
      .select("_id slug")
      .lean();
    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    const before = await ProductFinance.findOne({ productSlug: validated.productSlug }).lean();
    const update: Record<string, unknown> = {
      productId: product._id,
      productSlug: product.slug,
    };
    for (const key of [
      "averageUnitCost",
      "currentStock",
      "lowStockThreshold",
      "trackInventory",
    ] as const) {
      if (validated[key] !== undefined) update[key] = validated[key];
    }

    const saved = await ProductFinance.findOneAndUpdate(
      { productSlug: product.slug },
      { $set: update },
      { upsert: true, new: true, runValidators: true }
    ).lean();

    if (validated.currentStock !== undefined && before?.currentStock !== validated.currentStock) {
      const delta = validated.currentStock - (before?.currentStock || 0);
      await InventoryMovement.create({
        type: before ? "adjustment" : "opening",
        productId: product._id,
        productSlug: product.slug,
        qty: delta,
        unitCost: saved?.averageUnitCost || 0,
        totalCost: roundMoney(delta * (saved?.averageUnitCost || 0)),
        note: before
          ? "Manual stock adjustment from finance products"
          : "Opening stock from finance products",
      });
    }

    return NextResponse.json({ success: true, data: saved });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    console.error("PATCH /api/admin/finance/products error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update product finance" },
      { status: 500 }
    );
  }
}
