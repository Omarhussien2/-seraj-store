import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import Product from "@/lib/models/Product";
import { applyCouponOrThrow } from "@/lib/coupons/apply";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ValidateCouponSchema = z.object({
  code: z.string().min(1).max(64),
  shippingFee: z.number().min(0).default(0),
  customerPhone: z.string().regex(/^01[0-9]{9}$/).optional(),
  items: z
    .array(
      z.object({
        productSlug: z.string().min(1),
        qty: z.number().int().min(1).default(1),
        price: z.number().min(0).optional(), // required for dynamic-priced items
      })
    )
    .min(1),
});

/**
 * POST /api/coupons/validate
 * Public endpoint to validate/apply a coupon to a cart quote (server recalculates prices).
 */
export async function POST(request: Request) {
  try {
    await connectDB();

    const body = await request.json();
    const validated = ValidateCouponSchema.parse(body);

    const slugs = validated.items.map((i) => i.productSlug);
    const products = await Product.find({ slug: { $in: slugs }, active: true })
      .select("slug price")
      .lean();

    const productMap = new Map(products.map((p) => [p.slug, p.price]));

    let subtotal = 0;
    const pricedItems: { productSlug: string; qty: number; unitPrice: number }[] = [];
    for (const item of validated.items) {
      if (item.productSlug === "coloring-workbook") {
        if (item.price == null) {
          return NextResponse.json(
            { success: false, error: "Missing dynamic price for coloring-workbook" },
            { status: 400 }
          );
        }
        subtotal += item.price * item.qty;
        pricedItems.push({ productSlug: item.productSlug, qty: item.qty, unitPrice: item.price });
        continue;
      }

      const price = productMap.get(item.productSlug);
      if (price === undefined) {
        return NextResponse.json(
          { success: false, error: `المنتج "${item.productSlug}" غير موجود أو غير متاح` },
          { status: 400 }
        );
      }
      subtotal += price * item.qty;
      pricedItems.push({ productSlug: item.productSlug, qty: item.qty, unitPrice: price });
    }

    const applied = await applyCouponOrThrow({
      code: validated.code,
      items: pricedItems,
      subtotal,
      shippingFee: validated.shippingFee,
      customerPhone: validated.customerPhone,
    });

    return NextResponse.json({
      success: true,
      data: {
        code: applied.code,
        title: applied.title,
        couponId: applied.couponId,
        subtotal,
        shippingFee: validated.shippingFee,
        discountTotal: applied.discountTotal,
        discounts: applied.discountBreakdown,
        totalAfterDiscount: applied.totalAfterDiscount,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: error.issues.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    const msg = (error as Error).message || "UNKNOWN";
    return NextResponse.json(
      {
        success: false,
        error: "الكوبون غير صالح أو غير مناسب للسلة",
        details: { reason: msg },
      },
      { status: 400 }
    );
  }
}
