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
  reservedStock: z.number().min(0).optional(),
  lowStockThreshold: z.number().min(0).optional(),
  trackInventory: z.boolean().optional(),
});

export async function GET() {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    await connectDB();
    const [products, financeDocs] = await Promise.all([
      Product.find({}).sort({ order: 1 }).select("_id slug name price active order").lean(),
      ProductFinance.find({}).lean(),
    ]);

    const financeMap = new Map(financeDocs.map((doc) => [doc.productSlug, doc]));
    const data = products.map((product) => {
      const finance = financeMap.get(product.slug);
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
      "reservedStock",
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
