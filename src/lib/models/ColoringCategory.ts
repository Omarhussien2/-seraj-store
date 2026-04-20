import mongoose, { type Document, type Model } from "mongoose";

// ---------- ColoringCategory schema ----------
export interface IColoringCategory extends Document {
  slug: string;         // unique, URL-friendly, e.g. "animals-cats"
  nameAr: string;       // Arabic display name
  nameEn?: string;      // optional English name (for admin)
  parentSlug?: string | null; // null = top-level category
  icon: string;         // emoji icon, e.g. "🐱"
  description?: string;
  thumbnail?: string;   // Cloudinary URL for category cover image
  itemCount: number;    // cached count (updated on seed/add)
  source?: string;      // primary source: "supercoloring" | "seraj" | "mixed"
  order: number;        // display order
  active: boolean;
  featured: boolean;    // show on Mama World homepage?
  createdAt: Date;
  updatedAt: Date;
}

const ColoringCategorySchema = new mongoose.Schema<IColoringCategory>(
  {
    slug: { type: String, required: true, unique: true, index: true, trim: true },
    nameAr: { type: String, required: true, trim: true },
    nameEn: { type: String, trim: true },
    parentSlug: { type: String, default: null },
    icon: { type: String, required: true, default: "🎨" },
    description: { type: String, trim: true },
    thumbnail: { type: String },
    itemCount: { type: Number, default: 0, min: 0 },
    source: {
      type: String,
      enum: ["supercoloring", "kidipage", "seraj", "mixed", "other"],
      default: "mixed",
    },
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true, index: true },
    featured: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

// Indexes
ColoringCategorySchema.index({ parentSlug: 1, order: 1 });
ColoringCategorySchema.index({ active: 1, featured: 1 });

const ColoringCategory: Model<IColoringCategory> =
  mongoose.models.ColoringCategory ||
  mongoose.model<IColoringCategory>("ColoringCategory", ColoringCategorySchema);

export default ColoringCategory;
