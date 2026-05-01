import mongoose, { type Document, type Model } from "mongoose";

export type CouponDiscountScope = "shipping" | "subtotal" | "products";
export type CouponDiscountType = "percent" | "fixed";

export interface ICouponDiscountRule {
  scope: CouponDiscountScope;
  type: CouponDiscountType;
  value: number; // percent (0-100] or fixed amount >= 0
  maxDiscount?: number; // cap the discount amount for this rule
  productSlugs?: string[]; // only for scope="products"
  excludeProductSlugs?: string[];
}

export interface ICouponLimits {
  maxRedemptionsTotal?: number;
  maxRedemptionsPerCustomerPhone?: number;
  minSubtotal?: number;
}

export interface ICoupon extends Document {
  code: string; // normalized uppercase, no spaces
  active: boolean;
  title?: string;
  description?: string;
  validFrom?: Date;
  validTo?: Date;
  discounts: ICouponDiscountRule[];
  limits: ICouponLimits;
  redeemedCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const CouponDiscountRuleSchema = new mongoose.Schema<ICouponDiscountRule>(
  {
    scope: {
      type: String,
      required: true,
      enum: ["shipping", "subtotal", "products"],
    },
    type: { type: String, required: true, enum: ["percent", "fixed"] },
    value: { type: Number, required: true, min: 0 },
    maxDiscount: { type: Number, min: 0 },
    productSlugs: [{ type: String, trim: true }],
    excludeProductSlugs: [{ type: String, trim: true }],
  },
  { _id: false }
);

const CouponSchema = new mongoose.Schema<ICoupon>(
  {
    code: { type: String, required: true, unique: true, index: true, trim: true },
    active: { type: Boolean, default: true, index: true },
    title: { type: String, trim: true },
    description: { type: String, trim: true },
    validFrom: { type: Date },
    validTo: { type: Date, index: true },
    discounts: {
      type: [CouponDiscountRuleSchema],
      required: true,
      validate: (v: unknown[]) => Array.isArray(v) && v.length > 0,
    },
    limits: {
      maxRedemptionsTotal: { type: Number, min: 1 },
      maxRedemptionsPerCustomerPhone: { type: Number, min: 1 },
      minSubtotal: { type: Number, min: 0 },
    },
    redeemedCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

CouponSchema.index({ active: 1, validTo: 1 });

const Coupon: Model<ICoupon> =
  mongoose.models.Coupon || mongoose.model<ICoupon>("Coupon", CouponSchema);

export default Coupon;
