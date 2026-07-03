import mongoose, { type Document, type Model } from "mongoose";

export interface IProductFinance extends Document {
  productId?: mongoose.Types.ObjectId;
  productSlug: string;
  averageUnitCost: number;
  currentStock: number;
  reservedStock: number;
  lowStockThreshold: number;
  trackInventory: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProductFinanceSchema = new mongoose.Schema<IProductFinance>(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      index: true,
    },
    productSlug: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    averageUnitCost: { type: Number, min: 0, default: 0 },
    currentStock: { type: Number, default: 0 },
    reservedStock: { type: Number, min: 0, default: 0 },
    lowStockThreshold: { type: Number, min: 0, default: 0 },
    trackInventory: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

ProductFinanceSchema.index({ trackInventory: 1, currentStock: 1 });

const ProductFinance: Model<IProductFinance> =
  mongoose.models.ProductFinance ||
  mongoose.model<IProductFinance>("ProductFinance", ProductFinanceSchema);

export default ProductFinance;
