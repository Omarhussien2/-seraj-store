import mongoose, { type Document, type Model } from "mongoose";

// ---------- ColoringItem schema ----------
export type ColoringLicense = "cc0" | "cc-by" | "cc-by-sa" | "free-link" | "seraj";
export type ColoringType = "coloring" | "worksheet" | "craft";
export type ColoringDifficulty = "easy" | "medium" | "hard";
export type ColoringAgeRange = "3-6" | "7-10" | "11+";

export interface IColoringItem extends Document {
  slug: string;           // unique, URL-friendly
  title: string;          // Arabic title
  categorySlug: string;   // references ColoringCategory.slug
  
  // Images — Hybrid Model
  thumbnail: string;      // Cloudinary URL (≤50KB, w_300, f_auto, q_auto)
  fullImageUrl?: string;  // Cloudinary URL for full image (only for cc0/cc-by/cc-by-sa/seraj)
  sourceUrl?: string;     // Link to original source page (for free-link license items)
  sourceName?: string;    // e.g. "SuperColoring", "Coloring.ws"
  
  // Classification
  type: ColoringType;
  difficulty: ColoringDifficulty;
  ageRange: ColoringAgeRange;
  tags: string[];
  
  // License
  license: ColoringLicense;
  attribution?: string;   // required for cc-by, cc-by-sa
  
  // Stats (lightweight — updated on events)
  savedCount: number;
  printCount: number;
  shareCount: number;
  
  // Management
  active: boolean;
  featured: boolean;
  printable: boolean;     // can be included in a print order?
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const ColoringItemSchema = new mongoose.Schema<IColoringItem>(
  {
    slug: { type: String, required: true, unique: true, index: true, trim: true },
    title: { type: String, required: true, trim: true },
    categorySlug: { type: String, required: true, index: true, trim: true },

    // Images
    thumbnail: { type: String, required: true },
    fullImageUrl: { type: String },
    sourceUrl: { type: String },
    sourceName: { type: String },

    // Classification
    type: {
      type: String,
      required: true,
      enum: ["coloring", "worksheet", "craft"],
      default: "coloring",
    },
    difficulty: {
      type: String,
      required: true,
      enum: ["easy", "medium", "hard"],
      default: "easy",
    },
    ageRange: {
      type: String,
      required: true,
      enum: ["3-6", "7-10", "11+"],
      default: "3-6",
    },
    tags: [{ type: String }],

    // License
    license: {
      type: String,
      required: true,
      enum: ["cc0", "cc-by", "cc-by-sa", "free-link", "seraj"],
      default: "free-link",
    },
    attribution: { type: String },

    // Stats
    savedCount: { type: Number, default: 0, min: 0 },
    printCount: { type: Number, default: 0, min: 0 },
    shareCount: { type: Number, default: 0, min: 0 },

    // Management
    active: { type: Boolean, default: true, index: true },
    featured: { type: Boolean, default: false },
    printable: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Indexes for common query patterns
ColoringItemSchema.index({ categorySlug: 1, active: 1, order: 1 });
ColoringItemSchema.index({ type: 1, active: 1 });
ColoringItemSchema.index({ featured: 1, active: 1 });
ColoringItemSchema.index({ license: 1 });
ColoringItemSchema.index({ title: "text", tags: "text" });

const ColoringItem: Model<IColoringItem> =
  mongoose.models.ColoringItem ||
  mongoose.model<IColoringItem>("ColoringItem", ColoringItemSchema);

export default ColoringItem;
