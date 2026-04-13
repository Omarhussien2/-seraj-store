import mongoose, { type Document, type Model } from "mongoose";

// ---------- OrderItem sub-schema ----------
const OrderItemSchema = new mongoose.Schema(
  {
    productSlug: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    qty: { type: Number, required: true, min: 1, default: 1 },
  },
  { _id: false }
);

// ---------- CustomStory sub-schema ----------
const CustomStorySchema = new mongoose.Schema(
  {
    heroName: { type: String, required: true },
    age: { type: Number, required: true, min: 1, max: 18 },
    challenge: { type: String, required: true },
    customChallenge: { type: String },
    photoUrl: { type: String },
    storyStatus: {
      type: String,
      default: "pending",
      enum: ["pending", "reviewed", "sent_to_print", "delivered"],
    },
  },
  { _id: false }
);

// ---------- Order schema ----------
export interface IOrder extends Document {
  orderNumber: string;
  items: {
    productSlug: string;
    name: string;
    price: number;
    qty: number;
  }[];
  total: number;
  deposit: number;
  remaining: number;
  paymentMethod: string;
  paymentStatus: "unpaid" | "deposit_paid" | "fully_paid";
  orderStatus: "pending" | "in_progress" | "shipped" | "delivered";
  customStory?: {
    heroName: string;
    age: number;
    challenge: string;
    customChallenge?: string;
    photoUrl?: string;
    storyStatus: "pending" | "reviewed" | "sent_to_print" | "delivered";
  };
  customerName: string;
  customerPhone: string;
  address: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new mongoose.Schema<IOrder>(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    items: { type: [OrderItemSchema], required: true, validate: (v: unknown[]) => v.length > 0 },
    total: { type: Number, required: true, min: 0 },
    deposit: { type: Number, required: true, min: 0, default: 50 },
    remaining: { type: Number, required: true, min: 0 },
    paymentMethod: {
      type: String,
      required: true,
      default: "instapay",
      enum: ["instapay"],
    },
    paymentStatus: {
      type: String,
      required: true,
      default: "unpaid",
      enum: ["unpaid", "deposit_paid", "fully_paid"],
    },
    orderStatus: {
      type: String,
      required: true,
      default: "pending",
      enum: ["pending", "in_progress", "shipped", "delivered"],
    },
    customStory: { type: CustomStorySchema },
    customerName: { type: String, required: true, trim: true },
    customerPhone: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

// Index for admin queries
OrderSchema.index({ orderStatus: 1, createdAt: -1 });
OrderSchema.index({ customerPhone: 1 });

/**
 * Generate a unique order number: SRJ-YYYY-XXXX
 */
export async function generateOrderNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await Order.countDocuments({
    orderNumber: new RegExp(`^SRJ-${year}-`),
  });
  const seq = String(count + 1).padStart(4, "0");
  return `SRJ-${year}-${seq}`;
}

const Order: Model<IOrder> =
  mongoose.models.Order ||
  mongoose.model<IOrder>("Order", OrderSchema);

export default Order;
