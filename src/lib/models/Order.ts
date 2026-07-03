import mongoose, { type Document, type Model } from "mongoose";

// ---------- OrderItem sub-schema ----------
const OrderItemSchema = new mongoose.Schema(
  {
    productSlug: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    qty: { type: Number, required: true, min: 1, default: 1 },
    unitPriceSnapshot: { type: Number, min: 0 },
    nameSnapshot: { type: String },
    estimatedUnitCost: { type: Number, min: 0 },
    finalUnitCost: { type: Number, min: 0 },
    discountShare: { type: Number, min: 0, default: 0 },
    netRevenue: { type: Number, min: 0 },
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
    photoUrls: [{ type: String }],
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
    unitPriceSnapshot?: number;
    nameSnapshot?: string;
    estimatedUnitCost?: number;
    finalUnitCost?: number;
    discountShare?: number;
    netRevenue?: number;
  }[];
  total: number;
  subtotal: number;
  shippingFee: number;
  discountTotal: number;
  discounts: {
    shipping: number;
    subtotal: number;
    products: number;
  };
  coupon?: {
    code: string;
    couponId: mongoose.Types.ObjectId;
  };

  deposit: number;
  remaining: number;
  paymentMethod: string;
  paymentMode: "full" | "deposit";
  paymentStatus: "unpaid" | "deposit_paid" | "fully_paid";
  orderStatus: "pending" | "in_progress" | "shipped" | "delivered" | "cancelled";
  customStory?: {
    heroName: string;
    age: number;
    challenge: string;
    customChallenge?: string;
    photoUrl?: string;
    photoUrls?: string[];
    storyStatus: "pending" | "reviewed" | "sent_to_print" | "delivered";
  };
  customerName: string;
  customerPhone: string;
  address: string;
  notes?: string;
  finance?: {
    costingStatus?: "legacy_missing" | "snapshot" | "final";
    inventoryReservedAt?: Date;
    inventoryReleasedAt?: Date;
    inventoryDeductedAt?: Date;
    inventoryReversedAt?: Date;
    stockWarnings?: {
      productSlug: string;
      requestedQty: number;
      availableQty: number;
    }[];
  };
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
    discountTotal: { type: Number, min: 0, default: 0 },
    discounts: {
      shipping: { type: Number, min: 0, default: 0 },
      subtotal: { type: Number, min: 0, default: 0 },
      products: { type: Number, min: 0, default: 0 },
      _id: false,
    },
    coupon: {
      code: { type: String, trim: true },
      couponId: { type: mongoose.Schema.Types.ObjectId, ref: "Coupon" },
      _id: false,
    },

    deposit: { type: Number, required: true, min: 0, default: 0 },
    remaining: { type: Number, required: true, min: 0 },
    paymentMethod: {
      type: String,
      required: true,
      default: "instapay",
      enum: ["instapay"],
    },
    paymentMode: {
      type: String,
      required: true,
      default: "full",
      enum: ["full", "deposit"],
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
    finance: {
      costingStatus: {
        type: String,
        enum: ["legacy_missing", "snapshot", "final"],
      },
      inventoryReservedAt: { type: Date },
      inventoryReleasedAt: { type: Date },
      inventoryDeductedAt: { type: Date },
      inventoryReversedAt: { type: Date },
      stockWarnings: [
        {
          productSlug: { type: String, required: true },
          requestedQty: { type: Number, required: true },
          availableQty: { type: Number, required: true },
          _id: false,
        },
      ],
      _id: false,
    },
  },
  { timestamps: true }
);

// Index for admin queries
OrderSchema.index({ orderStatus: 1, createdAt: -1 });
OrderSchema.index({ customerPhone: 1 });
// Speeds up dashboard "deposit pending" lookup + recent-orders sort.
OrderSchema.index({ paymentStatus: 1, createdAt: -1 });
OrderSchema.index({ createdAt: -1 });

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
    } catch {
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
