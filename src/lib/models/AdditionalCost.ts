import mongoose, { type Document, type Model } from "mongoose";

export type AdditionalCostScope = "general" | "product" | "order";
export type AdditionalCostType =
  | "ai_subscription"
  | "labor"
  | "packaging"
  | "actual_shipping"
  | "design_printing"
  | "other";
export type AdditionalCostAllocation = "net_revenue" | "units" | "none";

export interface IAdditionalCost extends Document {
  scope: AdditionalCostScope;
  type: AdditionalCostType;
  amount: number;
  description: string;
  productSlug?: string;
  orderId?: mongoose.Types.ObjectId;
  periodStart?: Date;
  periodEnd?: Date;
  incurredAt: Date;
  allocationMethod: AdditionalCostAllocation;
  createdAt: Date;
  updatedAt: Date;
}

const AdditionalCostSchema = new mongoose.Schema<IAdditionalCost>(
  {
    scope: {
      type: String,
      required: true,
      enum: ["general", "product", "order"],
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        "ai_subscription",
        "labor",
        "packaging",
        "actual_shipping",
        "design_printing",
        "other",
      ],
      index: true,
    },
    amount: { type: Number, required: true, min: 0 },
    description: { type: String, required: true, trim: true },
    productSlug: { type: String, trim: true, index: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", index: true },
    periodStart: { type: Date },
    periodEnd: { type: Date },
    incurredAt: { type: Date, required: true, default: Date.now, index: true },
    allocationMethod: {
      type: String,
      required: true,
      enum: ["net_revenue", "units", "none"],
      default: "net_revenue",
    },
  },
  { timestamps: true }
);

AdditionalCostSchema.index({ incurredAt: -1, scope: 1 });

const AdditionalCost: Model<IAdditionalCost> =
  mongoose.models.AdditionalCost ||
  mongoose.model<IAdditionalCost>("AdditionalCost", AdditionalCostSchema);

export default AdditionalCost;
