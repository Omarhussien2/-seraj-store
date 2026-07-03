import mongoose, { type Document, type Model } from "mongoose";

export type InventoryMovementType =
  | "opening"
  | "purchase"
  | "reserve"
  | "release"
  | "sale"
  | "adjustment"
  | "cancel";

export interface IInventoryMovement extends Document {
  movementKey?: string;
  type: InventoryMovementType;
  productId?: mongoose.Types.ObjectId;
  productSlug: string;
  orderId?: mongoose.Types.ObjectId;
  orderNumber?: string;
  qty: number;
  unitCost: number;
  totalCost: number;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

const InventoryMovementSchema = new mongoose.Schema<IInventoryMovement>(
  {
    movementKey: { type: String, unique: true, sparse: true, index: true },
    type: {
      type: String,
      required: true,
      enum: ["opening", "purchase", "reserve", "release", "sale", "adjustment", "cancel"],
      index: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      index: true,
    },
    productSlug: { type: String, required: true, trim: true, index: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", index: true },
    orderNumber: { type: String, trim: true, index: true },
    qty: { type: Number, required: true },
    unitCost: { type: Number, min: 0, default: 0 },
    totalCost: { type: Number, default: 0 },
    note: { type: String, trim: true },
  },
  { timestamps: true }
);

InventoryMovementSchema.index({ productSlug: 1, createdAt: -1 });
InventoryMovementSchema.index({ orderId: 1, type: 1 });

const InventoryMovement: Model<IInventoryMovement> =
  mongoose.models.InventoryMovement ||
  mongoose.model<IInventoryMovement>("InventoryMovement", InventoryMovementSchema);

export default InventoryMovement;
