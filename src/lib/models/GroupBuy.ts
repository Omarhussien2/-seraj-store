import mongoose, { type Document, type Model } from "mongoose";

export interface IGroupBuyTier {
  minOrders: number;
  discountType: "percent" | "fixed" | "free_shipping";
  discountValue: number;
}

export interface IGroupBuy extends Document {
  code: string;
  
  createdByName: string;
  createdByPhone: string;
  
  tiers: IGroupBuyTier[];
  
  targetOrders: number;
  confirmedOrders: number;
  currentTier: number | null;
  status: "open" | "completed" | "expired" | "cancelled";
  
  durationHours: number;
  expiresAt: Date;
  
  orderIds: mongoose.Types.ObjectId[];
  
  content: {
    shareTitle: string;
    shareMessage: string;
    successMessage: string;
  };
  
  createdAt: Date;
  updatedAt: Date;
}

const GroupBuyTierSchema = new mongoose.Schema<IGroupBuyTier>(
  {
    minOrders: { type: Number, required: true, min: 2 },
    discountType: {
      type: String,
      required: true,
      enum: ["percent", "fixed", "free_shipping"],
    },
    discountValue: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const GroupBuySchema = new mongoose.Schema<IGroupBuy>(
  {
    code: { type: String, required: true, unique: true, index: true, trim: true },
    
    createdByName: { type: String, required: true, trim: true },
    createdByPhone: { type: String, default: "", trim: true, index: true },
    
    tiers: {
      type: [GroupBuyTierSchema],
      required: true,
      validate: (v: unknown[]) => Array.isArray(v) && v.length > 0,
    },
    
    targetOrders: { type: Number, required: true, min: 2 },
    confirmedOrders: { type: Number, default: 0, min: 0 },
    currentTier: { type: Number, default: null },
    status: {
      type: String,
      required: true,
      default: "open",
      enum: ["open", "completed", "expired", "cancelled"],
    },
    
    durationHours: { type: Number, required: true, min: 1 },
    expiresAt: { type: Date, required: true },
    
    orderIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Order" }],
    
    content: {
      shareTitle: { type: String, required: true },
      shareMessage: { type: String, required: true },
      successMessage: { type: String, required: true },
    },
  },
  { timestamps: true }
);

// Indexes for faster querying
GroupBuySchema.index({ status: 1, expiresAt: 1 });

const GroupBuy: Model<IGroupBuy> =
  mongoose.models.GroupBuy || mongoose.model<IGroupBuy>("GroupBuy", GroupBuySchema);

export default GroupBuy;
