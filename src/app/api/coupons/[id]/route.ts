import { NextResponse } from "next/server";
import { z } from "zod";
import mongoose from "mongoose";
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

const PatchCouponSchema = z.object({
  code: z.string().min(1).max(64).optional(),
  active: z.boolean().optional(),
  title: z.string().max(200).optional().nullable(),
  description: z.string().max(1000).optional().nullable(),
  validFrom: z.coerce.date().optional().nullable(),
  validTo: z.coerce.date().optional().nullable(),
  discounts: z.array(CouponDiscountRuleSchema).min(1).optional(),
  limits: CouponLimitsSchema.optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    await connectDB();
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: "Invalid coupon id" }, { status: 400 });
    }

    const coupon = await Coupon.findById(id).lean();
    if (!coupon) {
      return NextResponse.json({ success: false, error: "Coupon not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: coupon });
  } catch (error) {
    console.error("GET /api/coupons/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch coupon" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    await connectDB();
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: "Invalid coupon id" }, { status: 400 });
    }

    const body = await request.json();
    const validated = PatchCouponSchema.parse(body);

    const update: Record<string, unknown> = { ...validated };
    if (validated.code) update.code = normalizeCouponCode(validated.code);
    if (validated.discounts) {
      update.discounts = validated.discounts.map((d) => ({
        ...d,
        productSlugs: d.productSlugs?.map((s) => s.trim()).filter(Boolean),
        excludeProductSlugs: d.excludeProductSlugs?.map((s) => s.trim()).filter(Boolean),
      }));
    }

    const coupon = await Coupon.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true, runValidators: true }
    ).lean();

    if (!coupon) {
      return NextResponse.json({ success: false, error: "Coupon not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: coupon });
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
        : "Failed to update coupon";
    return NextResponse.json({ success: false, error: msg }, { status: 400 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    await connectDB();
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: "Invalid coupon id" }, { status: 400 });
    }

    const deleted = await Coupon.findByIdAndDelete(id).lean();
    if (!deleted) {
      return NextResponse.json({ success: false, error: "Coupon not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: deleted });
  } catch (error) {
    console.error("DELETE /api/coupons/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete coupon" },
      { status: 500 }
    );
  }
}
