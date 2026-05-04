import mongoose from "mongoose";

export interface IPaymentSettings {
  _id: string;
  depositEnabled: boolean;
  depositPercent: number; // 0–100
  createdAt?: string;
  updatedAt?: string;
}

const PaymentSettingsSchema = new mongoose.Schema(
  {
    _id: { type: String, default: "payment-settings" },
    depositEnabled: { type: Boolean, default: true },
    depositPercent: { type: Number, default: 60, min: 0, max: 100 },
  },
  { timestamps: true }
);

export default (mongoose.models.PaymentSettings as mongoose.Model<IPaymentSettings>) ||
  mongoose.model<IPaymentSettings>("PaymentSettings", PaymentSettingsSchema);
