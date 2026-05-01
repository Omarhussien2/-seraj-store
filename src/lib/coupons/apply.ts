import mongoose from "mongoose";
import Coupon, { type ICoupon, type ICouponDiscountRule } from "@/lib/models/Coupon";
import CouponRedemption from "@/lib/models/CouponRedemption";
import { normalizeCouponCode } from "@/lib/coupons/normalize";

export type CouponApplyItem = {
  productSlug: string;
  qty: number;
  unitPrice: number;
};

export type CouponApplyInput = {
  code: string;
  items: CouponApplyItem[];
  subtotal: number;
  shippingFee: number;
  customerPhone?: string;
  now?: Date;
};

export type CouponApplyResult = {
  couponId: mongoose.Types.ObjectId;
  code: string;
  title?: string;
  discountTotal: number;
  discountBreakdown: {
    shipping: number;
    subtotal: number;
    products: number;
  };
  totalAfterDiscount: number;
};

function cap(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function computeRuleDiscount(rule: ICouponDiscountRule, base: number): number {
  const raw =
    rule.type === "percent" ? (base * cap(rule.value, 0, 100)) / 100 : Math.max(0, rule.value);
  const capped = rule.maxDiscount != null ? Math.min(raw, Math.max(0, rule.maxDiscount)) : raw;
  return Math.round(Math.max(0, capped) * 100) / 100;
}

function computeProductsBase(rule: ICouponDiscountRule, items: CouponApplyItem[]): number {
  const include = new Set((rule.productSlugs || []).map((s) => s.trim()).filter(Boolean));
  const exclude = new Set((rule.excludeProductSlugs || []).map((s) => s.trim()).filter(Boolean));

  // If include list is provided, discount only those.
  // Otherwise discount all except excluded.
  let base = 0;
  for (const item of items) {
    if (exclude.has(item.productSlug)) continue;
    if (include.size > 0 && !include.has(item.productSlug)) continue;
    base += item.unitPrice * item.qty;
  }
  return Math.max(0, base);
}

export async function applyCouponOrThrow(input: CouponApplyInput): Promise<CouponApplyResult> {
  const now = input.now ?? new Date();
  const code = normalizeCouponCode(input.code);

  const coupon = await Coupon.findOne({ code }).lean<ICoupon>();
  if (!coupon || !coupon.active) {
    throw new Error("INVALID_COUPON");
  }

  if (coupon.validFrom && now < coupon.validFrom) {
    throw new Error("COUPON_NOT_STARTED");
  }
  if (coupon.validTo && now > coupon.validTo) {
    throw new Error("COUPON_EXPIRED");
  }

  const minSubtotal = coupon.limits?.minSubtotal ?? 0;
  if (minSubtotal > 0 && input.subtotal < minSubtotal) {
    throw new Error("COUPON_MIN_SUBTOTAL");
  }

  if (coupon.limits?.maxRedemptionsTotal != null && coupon.redeemedCount >= coupon.limits.maxRedemptionsTotal) {
    throw new Error("COUPON_MAX_REDEMPTIONS");
  }

  if (
    input.customerPhone &&
    coupon.limits?.maxRedemptionsPerCustomerPhone != null
  ) {
    const perCustomerCount = await CouponRedemption.countDocuments({
      couponId: coupon._id,
      customerPhone: input.customerPhone,
    });
    if (perCustomerCount >= coupon.limits.maxRedemptionsPerCustomerPhone) {
      throw new Error("COUPON_MAX_REDEMPTIONS_PER_CUSTOMER");
    }
  }

  let shippingDiscount = 0;
  let subtotalDiscount = 0;
  let productsDiscount = 0;
  let hasApplicableRule = false;

  for (const rule of coupon.discounts) {
    if (rule.scope === "shipping") {
      const d = computeRuleDiscount(rule, input.shippingFee);
      if (d > 0) hasApplicableRule = true;
      shippingDiscount += d;
      continue;
    }
    if (rule.scope === "subtotal") {
      const d = computeRuleDiscount(rule, input.subtotal);
      if (d > 0) hasApplicableRule = true;
      subtotalDiscount += d;
      continue;
    }
    if (rule.scope === "products") {
      const base = computeProductsBase(rule, input.items);
      if (base <= 0) continue;
      const d = computeRuleDiscount(rule, base);
      if (d > 0) hasApplicableRule = true;
      productsDiscount += d;
      continue;
    }
  }

  shippingDiscount = Math.min(shippingDiscount, Math.max(0, input.shippingFee));
  subtotalDiscount = Math.min(subtotalDiscount, Math.max(0, input.subtotal));
  productsDiscount = Math.min(
    productsDiscount,
    Math.max(0, input.subtotal - subtotalDiscount)
  );

  const discountTotal = shippingDiscount + subtotalDiscount + productsDiscount;
  if (!hasApplicableRule || discountTotal <= 0) {
    throw new Error("COUPON_NOT_APPLICABLE");
  }

  const totalBefore = input.subtotal + input.shippingFee;
  const totalAfterDiscount = Math.max(0, totalBefore - discountTotal);

  return {
    couponId: coupon._id,
    code,
    title: coupon.title,
    discountTotal,
    discountBreakdown: {
      shipping: shippingDiscount,
      subtotal: subtotalDiscount,
      products: productsDiscount,
    },
    totalAfterDiscount,
  };
}

export async function redeemCouponOrThrow(args: {
  couponId: mongoose.Types.ObjectId;
  code: string;
  orderId: mongoose.Types.ObjectId;
  customerPhone: string;
  discountTotal: number;
}): Promise<void> {
  const coupon = await Coupon.findById(args.couponId)
    .select("limits redeemedCount")
    .lean();
  if (!coupon) throw new Error("INVALID_COUPON");

  // 1) Record redemption (idempotent by orderId uniqueness)
  await CouponRedemption.create({
    couponId: args.couponId,
    orderId: args.orderId,
    customerPhone: args.customerPhone,
    code: args.code,
    discountTotal: args.discountTotal,
  });

  // 2) Increment redeemedCount with limit guard (atomic)
  // If limit reached concurrently, roll back redemption record.
  const max = coupon.limits?.maxRedemptionsTotal;
  const updated = await Coupon.findOneAndUpdate(
    {
      _id: args.couponId,
      ...(max != null ? { redeemedCount: { $lt: max } } : {}),
    },
    { $inc: { redeemedCount: 1 } },
    { new: true }
  ).lean();

  if (!updated) {
    await CouponRedemption.deleteOne({ orderId: args.orderId });
    throw new Error("COUPON_MAX_REDEMPTIONS");
  }
}

export async function rollbackCouponRedemption(args: {
  couponId: mongoose.Types.ObjectId;
  orderId: mongoose.Types.ObjectId;
}): Promise<void> {
  const deleted = await CouponRedemption.deleteOne({ orderId: args.orderId });
  if (deleted.deletedCount > 0) {
    await Coupon.updateOne(
      { _id: args.couponId, redeemedCount: { $gt: 0 } },
      { $inc: { redeemedCount: -1 } }
    );
  }
}
