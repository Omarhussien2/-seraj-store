import mongoose, { type Document, type Model } from "mongoose";

// ---------- Review sub-schema ----------
const ReviewSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    name: { type: String, required: true },
    place: { type: String, required: true },
    color: { type: String, required: true },
    initial: { type: String, required: true },
  },
  { _id: false }
);

// ---------- Media sub-schema (hero display) ----------
const MediaSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ["book3d", "cards-fan", "bundle-stack"],
    },
    image: { type: String },
    title: { type: String },
    bg: {
      type: String,
      required: true,
      enum: ["emerald", "sand", "teal"],
    },
  },
  { _id: false }
);

// ---------- Gallery item sub-schema (multiple images/videos) ----------
const GalleryItemSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String },
    resourceType: {
      type: String,
      required: true,
      enum: ["image", "video"],
      default: "image",
    },
    alt: { type: String, default: "" },
    sortOrder: { type: Number, default: 0 },
  },
  { _id: true }
);

// ---------- Product schema ----------
export interface IGalleryItem {
  _id?: string;
  url: string;
  publicId?: string;
  resourceType: "image" | "video";
  alt?: string;
  sortOrder: number;
}

export interface IProduct extends Document {
  slug: string;
  name: string;
  badge: string;
  badgeSoon?: boolean;
  price: number;
  originalPrice?: number | null;
  priceText: string;
  originalPriceText?: string | null;
  category: string;
  section?: string | null;
  series?: string;
  longDesc: string;
  features: string[];
  imageUrl?: string;
  media: {
    type: string;
    image?: string;
    title?: string;
    bg: string;
  };
  gallery: IGalleryItem[];
  action: string;
  ctaText: string;
  comingSoon: boolean;
  reviews: {
    text: string;
    name: string;
    place: string;
    color: string;
    initial: string;
  }[];
  related: string[];
  active: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new mongoose.Schema<IProduct>(
  {
    slug: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    badge: { type: String, required: true },
    badgeSoon: { type: Boolean, default: false },
    price: { type: Number, required: true },
    originalPrice: { type: Number },
    priceText: { type: String, required: true },
    originalPriceText: { type: String },
    category: {
      type: String,
      required: true,
      enum: ["قصص جاهزة", "قصص مخصصة", "فلاش كاردز", "مجموعات"],
    },
    section: {
      type: String,
      enum: ["tales", "seraj-stories", "custom-stories", "play-learn"],
      index: true,
    },
    series: { type: String },
    longDesc: { type: String, required: true },
    features: [{ type: String }],
    imageUrl: { type: String },
    media: { type: MediaSchema, required: true },
    gallery: { type: [GalleryItemSchema], default: [] },
    action: {
      type: String,
      required: true,
      enum: ["cart", "wizard", "none"],
    },
    ctaText: { type: String, required: true },
    comingSoon: { type: Boolean, default: false },
    reviews: [ReviewSchema],
    related: [{ type: String }],
    active: { type: Boolean, default: true, index: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Indexes
ProductSchema.index({ name: "text", category: "text", section: "text" });
ProductSchema.index({ section: 1, order: 1 });

const Product: Model<IProduct> =
  mongoose.models.Product ||
  mongoose.model<IProduct>("Product", ProductSchema);

export default Product;
