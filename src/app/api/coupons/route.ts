import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import Coupon from "@/lib/models/Coupon";
import { requireAdmin } from "@/lib/requireAdmin";
import { normalizeCouponCode } from "@/lib/coupons/normalize";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const CouponDiscountRuleSchema = z.object({
  scope: z.enum(["shipping", "subtotal", "products"]),
  type: z.enum(["percent", "fixed"]),
  value: z.number().min(0),
  maxDiscount: z.number().min(0).optional(),
  productSlugs: z.array(z.string().min(1)).optional(),
  excludeProductSlugs: z.array(z.string().min(1)).optional(),
});

const CouponLimitsSchema = z.object({
  maxRedemptionsTotal: z.number().int().min(1).optional(),
  maxRedemptionsPerCustomerPhone: z.number().int().min(1).optional(),
  minSubtotal: z.number().min(0).optional(),
});

const CreateCouponSchema = z.object({
  code: z.string().min(1).max(64),
  active: z.boolean().optional().default(true),
  title: z.string().max(200).optional(),
  description: z.string().max(1000).optional(),
  validFrom: z.coerce.date().optional(),
  validTo: z.coerce.date().optional(),
  discounts: z.array(CouponDiscountRuleSchema).min(1),
  limits: CouponLimitsSchema.optional().default({}),
});

/**
 * GET /api/coupons (admin)
 */
export async function GET(request: Request) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    await connectDB();

    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || "").trim();
    const active = searchParams.get("active");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};
    if (q) {
      filter.$or = [
        { code: { $regex: q, $options: "i" } },
        { title: { $regex: q, $options: "i" } },
      ];
    }
    if (active === "true") filter.active = true;
    if (active === "false") filter.active = false;

    const [coupons, total] = await Promise.all([
      Coupon.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Coupon.countDocuments(filter),
    ]);

    return NextResponse.json({
      success: true,
      count: coupons.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      data: coupons,
    });
  } catch (error) {
    console.error("GET /api/coupons error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch coupons" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/coupons (admin)
 */
export async function POST(request: Request) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    await connectDB();

    const body = await request.json();
    const validated = CreateCouponSchema.parse(body);

    const code = normalizeCouponCode(validated.code);
    const created = await Coupon.create({
      ...validated,
      code,
      discounts: validated.discounts.map((d) => ({
        ...d,
        productSlugs: d.productSlugs?.map((s) => s.trim()).filter(Boolean),
        excludeProductSlugs: d.excludeProductSlugs?.map((s) => s.trim()).filter(Boolean),
      })),
    });

    return NextResponse.json({ success: true, data: created }, { status: 201 });
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

    const mongoCode = (error as { code?: unknown } | null)?.code;
    const msg =
      mongoCode === 11000
        ? "Coupon code already exists"
        : "Failed to create coupon";
    return NextResponse.json({ success: false, error: msg }, { status: 400 });
  }
}
