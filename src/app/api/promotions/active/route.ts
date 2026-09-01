import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Coupon, { type ICouponDiscountRule } from "@/lib/models/Coupon";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function offerText(discounts: ICouponDiscountRule[]): string {
  const primary = discounts[0];
  if (primary.scope === "shipping" && primary.type === "percent" && primary.value === 100) {
    return "شحن مجاني";
  }
  const value = primary.type === "percent" ? `${primary.value}%` : `${primary.value} ج.م`;
  return `خصم ${value}`;
}

export async function GET() {
  try {
    await connectDB();
    const now = new Date();
    const candidates = await Coupon.find({
      active: true,
      "promotion.featured": true,
      $and: [
        { $or: [{ validFrom: { $exists: false } }, { validFrom: null }, { validFrom: { $lte: now } }] },
        { $or: [{ validTo: { $exists: false } }, { validTo: null }, { validTo: { $gte: now } }] },
      ],
    })
      .sort({ updatedAt: -1 })
      .limit(5)
      .lean();

    const coupon = candidates.find((candidate) => {
      const maximum = candidate.limits?.maxRedemptionsTotal;
      return maximum == null || candidate.redeemedCount < maximum;
    });

    if (!coupon) {
      return NextResponse.json(
        { success: true, data: null },
        { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" } }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          code: coupon.code,
          offerText: offerText(coupon.discounts),
          headline: coupon.promotion?.headline || coupon.title || "هدية ترحيبية من سراج",
          message: coupon.promotion?.message || coupon.description || "خلي أول حكاية لبطلنا تبدأ بخصم مميز.",
          ctaText: coupon.promotion?.ctaText || "فعّلي الخصم وابدئي القصة",
          validTo: coupon.validTo || null,
        },
      },
      { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" } }
    );
  } catch (error) {
    console.error("GET /api/promotions/active error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch active promotion" },
      { status: 500 }
    );
  }
}
