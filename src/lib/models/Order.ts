import mongoose, { type Document, type Model } from "mongoose";

// ---------- ColoringDetails sub-schema (for coloring print orders) ----------
const ColoringDetailsSchema = new mongoose.Schema(
  {
    items: [{ type: mongoose.Schema.Types.ObjectId, ref: "ColoringItem" }], // IDs of chosen ColoringItems
    itemCount: { type: Number, required: true, min: 1 },
    format: {
      type: String,
      required: true,
      enum: ["sheets", "book"],
      default: "sheets",
    },
    coverImageUrl: { type: String },  // Cloudinary URL of chosen cover (format=book only)
    coverTitle: { type: String },     // Custom title written on cover
    printStatus: {
      type: String,
      default: "pending",
      enum: ["pending", "downloading", "printing", "packed"],
    },
  },
  { _id: false }
);

// ---------- OrderItem sub-schema ----------
const OrderItemSchema = new mongoose.Schema(
  {
    productSlug: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    qty: { type: Number, required: true, min: 1, default: 1 },
    coloringDetails: { type: ColoringDetailsSchema }, // populated only for productSlug="coloring-print"
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
export interface IColoringDetails {
  items: mongoose.Types.ObjectId[];
  itemCount: number;
  format: "sheets" | "book";
  coverImageUrl?: string;
  coverTitle?: string;
  printStatus: "pending" | "downloading" | "printing" | "packed";
}

export interface IOrder extends Document {
  orderNumber: string;
  items: {
    productSlug: string;
    name: string;
    price: number;
    qty: number;
    coloringDetails?: IColoringDetails;
  }[];
  total: number;
  subtotal: number;
  shippingFee: number;
  deposit: number;
  remaining: number;
  paymentMethod: string;
  paymentStatus: "unpaid" | "deposit_paid" | "fully_paid";
  orderStatus: "pending" | "in_progress" | "shipped" | "delivered" | "cancelled";
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
    subtotal: { type: Number, min: 0, default: 0 },
    shippingFee: { type: Number, min: 0, default: 0 },
    deposit: { type: Number, required: true, min: 0, default: 0 },
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
      enum: ["pending", "in_progress", "shipped", "delivered", "cancelled"],
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

// ---------- Counter schema for atomic order numbers ----------
interface ICounter {
  _id: string; // e.g., "order-2024"
  seq: number;
}
const CounterSchema = new mongoose.Schema<ICounter>({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});
const Counter: Model<ICounter> =
  mongoose.models.Counter || mongoose.model<ICounter>("Counter", CounterSchema);

/**
 * Generate a unique order number: SRJ-YYYY-XXXX
 * Uses a Counter collection to prevent race conditions during concurrent orders.
 */
export async function generateOrderNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const counterId = `order-${year}`;

  // Check if counter for this year exists, if not initialize it from existing orders
  let counter = await Counter.findById(counterId);
  if (!counter) {
    const existingCount = await Order.countDocuments({
      orderNumber: new RegExp(`^SRJ-${year}-`),
    });
    try {
      await Counter.create({ _id: counterId, seq: existingCount });
    } catch (e) {
      // Ignore E11000 duplicate key error in case another request created it first
    }
  }

  // Atomically increment the counter
  counter = await Counter.findByIdAndUpdate(
    counterId,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  const seq = String(counter!.seq).padStart(4, "0");
  return `SRJ-${year}-${seq}`;
}

const Order: Model<IOrder> =
  mongoose.models.Order ||
  mongoose.model<IOrder>("Order", OrderSchema);

export default Order;
