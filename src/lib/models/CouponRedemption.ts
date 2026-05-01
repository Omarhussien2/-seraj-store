import mongoose, { type Document, type Model } from "mongoose";

export interface ICouponRedemption extends Document {
  couponId: mongoose.Types.ObjectId;
  orderId: mongoose.Types.ObjectId;
  customerPhone: string;
  code: string;
  discountTotal: number;
  createdAt: Date;
  updatedAt: Date;
}

const CouponRedemptionSchema = new mongoose.Schema<ICouponRedemption>(
  {
    couponId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Coupon",
      required: true,
      index: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      unique: true,
      index: true,
    },
    customerPhone: { type: String, required: true, trim: true, index: true },
    code: { type: String, required: true, trim: true, index: true },
    discountTotal: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

CouponRedemptionSchema.index({ couponId: 1, customerPhone: 1 });

const CouponRedemption: Model<ICouponRedemption> =
  mongoose.models.CouponRedemption ||
  mongoose.model<ICouponRedemption>("CouponRedemption", CouponRedemptionSchema);

export default CouponRedemption;
