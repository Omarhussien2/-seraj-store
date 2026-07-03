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

const CreateMovementSchema = z.object({
  productSlug: z.string().min(1),
  type: z.enum(["opening", "purchase", "adjustment"]),
  qty: z.number(),
  unitCost: z.number().min(0).optional(),
  note: z.string().max(500).optional(),
});

export async function POST(request: Request) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    await connectDB();
    const body = await request.json();
    const validated = CreateMovementSchema.parse(body);

    if (validated.type !== "adjustment" && validated.qty <= 0) {
      return NextResponse.json(
        { success: false, error: "Opening and purchase quantities must be positive" },
        { status: 400 }
      );
    }

    const product = await Product.findOne({ slug: validated.productSlug })
      .select("_id slug")
      .lean();
    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    const before =
      (await ProductFinance.findOne({ productSlug: product.slug }).lean()) ||
      ({
        currentStock: 0,
        reservedStock: 0,
        averageUnitCost: 0,
        lowStockThreshold: 0,
        trackInventory: true,
      } as const);

    const unitCost = validated.unitCost ?? before.averageUnitCost ?? 0;
    const nextStock = (before.currentStock || 0) + validated.qty;
    const nextAverageCost =
      validated.type === "purchase" || validated.type === "opening"
        ? nextStock > 0
          ? roundMoney(
              ((before.currentStock || 0) * (before.averageUnitCost || 0) +
                validated.qty * unitCost) /
                nextStock
            )
          : unitCost
        : before.averageUnitCost || unitCost;

    const finance = await ProductFinance.findOneAndUpdate(
      { productSlug: product.slug },
      {
        $set: {
          productId: product._id,
          productSlug: product.slug,
          currentStock: nextStock,
          averageUnitCost: nextAverageCost,
          trackInventory: true,
        },
        $setOnInsert: {
          reservedStock: before.reservedStock || 0,
          lowStockThreshold: before.lowStockThreshold || 0,
        },
      },
      { upsert: true, new: true, runValidators: true }
    ).lean();

    const movement = await InventoryMovement.create({
      type: validated.type,
      productId: product._id,
      productSlug: product.slug,
      qty: validated.qty,
      unitCost,
      totalCost: roundMoney(validated.qty * unitCost),
      note: validated.note,
    });

    return NextResponse.json({ success: true, data: { finance, movement } }, { status: 201 });
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

    console.error("POST /api/admin/finance/inventory-movements error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create inventory movement" },
      { status: 500 }
    );
  }
}
