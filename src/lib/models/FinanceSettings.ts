import mongoose, { type Model } from "mongoose";

export interface IFinanceSettings {
  _id: string;
  revenueRecognition: "delivered_fully_paid";
  inventoryDeductionStatus: "in_progress" | "shipped" | "delivered";
  generalCostAllocation: "net_revenue";
  stockShortageBehavior: "warn";
  defaultLowStockThreshold: number;
  createdAt: Date;
  updatedAt: Date;
}

const FinanceSettingsSchema = new mongoose.Schema<IFinanceSettings>(
  {
    _id: { type: String, default: "finance-settings" },
    revenueRecognition: {
      type: String,
      enum: ["delivered_fully_paid"],
      default: "delivered_fully_paid",
    },
    inventoryDeductionStatus: {
      type: String,
      enum: ["in_progress", "shipped", "delivered"],
      default: "in_progress",
    },
    generalCostAllocation: {
      type: String,
      enum: ["net_revenue"],
      default: "net_revenue",
    },
    stockShortageBehavior: {
      type: String,
      enum: ["warn"],
      default: "warn",
    },
    defaultLowStockThreshold: { type: Number, min: 0, default: 0 },
  },
  { timestamps: true }
);

const FinanceSettings: Model<IFinanceSettings> =
  mongoose.models.FinanceSettings ||
  mongoose.model<IFinanceSettings>("FinanceSettings", FinanceSettingsSchema);

export default FinanceSettings;
