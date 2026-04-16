import mongoose, { type Document, type Model } from "mongoose";

// ---------- Location sub-schema ----------
const LocationSchema = new mongoose.Schema(
  {
    lat: { type: Number, default: 0 },
    lon: { type: Number, default: 0 },
  },
  { _id: false }
);

// ---------- Place interface ----------
export interface IPlace extends Document {
  name_ar: string;
  name_en: string;
  description_short: string;
  area: string;
  city: string;
  address: string;
  location: {
    lat: number;
    lon: number;
  };
  min_price: number;
  max_price: number;
  price_range_id: number;
  min_age: number;
  max_age: number;
  avg_duration_hours: number;
  is_free: boolean;
  indoor_outdoor: "indoor" | "outdoor" | "mixed" | "unknown";
  booking_required: boolean;
  website_url: string;
  external_source: string;
  external_detail_url: string;
  phone: string;
  facebook_url: string;
  instagram_url: string;
  category_ids: number[];
  image_url: string;
  last_price_update: Date;
  active: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

// ---------- Place schema ----------
const PlaceSchema = new mongoose.Schema<IPlace>(
  {
    name_ar: { type: String, required: true },
    name_en: { type: String, required: true },
    description_short: { type: String, default: "" },
    area: { type: String, default: "" },
    city: { type: String, required: true, index: true },
    address: { type: String, default: "" },
    location: { type: LocationSchema, default: { lat: 0, lon: 0 } },
    min_price: { type: Number, default: 0 },
    max_price: { type: Number, default: 0 },
    price_range_id: { type: Number, default: 1 },
    min_age: { type: Number, default: 0 },
    max_age: { type: Number, default: 100 },
    avg_duration_hours: { type: Number, default: 3 },
    is_free: { type: Boolean, default: false, index: true },
    indoor_outdoor: {
      type: String,
      enum: ["indoor", "outdoor", "mixed", "unknown"],
      default: "unknown",
      index: true,
    },
    booking_required: { type: Boolean, default: false },
    website_url: { type: String, default: "" },
    external_source: { type: String, default: "Manual" },
    external_detail_url: { type: String, default: "" },
    phone: { type: String, default: "" },
    facebook_url: { type: String, default: "" },
    instagram_url: { type: String, default: "" },
    category_ids: [{ type: Number, index: true }],
    image_url: { type: String, default: "" },
    last_price_update: { type: Date, default: null },
    active: { type: Boolean, default: true, index: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Text index for search
PlaceSchema.index({ name_en: "text", name_ar: "text", city: "text", area: "text" });

// Compound index for common filter queries
PlaceSchema.index({ active: 1, city: 1, category_ids: 1 });

const Place: Model<IPlace> =
  mongoose.models.Place ||
  mongoose.model<IPlace>("Place", PlaceSchema);

export default Place;
