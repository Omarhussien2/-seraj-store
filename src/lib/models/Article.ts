import mongoose, { type Document, type Model } from "mongoose";

// ---------- Source sub-schema ----------
const SourceSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    url: { type: String },
    note: { type: String },
  },
  { _id: false }
);

// ---------- Article interface ----------
export interface ISource {
  label: string;
  url?: string;
  note?: string;
}

export interface IArticle extends Document {
  slug: string;
  title: string;
  seoTitle?: string;
  section: string;
  ageGroup?: string;
  tags: string[];
  excerpt: string;
  contentMarkdown: string;
  coverImage?: string;
  coverImageAlt: string;
  sources: ISource[];
  readingTime: number;
  author: string;
  publishedAt?: Date;
  active: boolean;
  order: number;
  metaDescription?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ---------- Article schema ----------
const ArticleSchema = new mongoose.Schema<IArticle>(
  {
    // Identity
    slug: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    seoTitle: { type: String },

    // Classification
    section: { type: String, required: true },
    ageGroup: { type: String },
    tags: [{ type: String }],

    // Content
    excerpt: { type: String, required: true },
    contentMarkdown: { type: String, required: true },

    // Media
    coverImage: { type: String },
    coverImageAlt: { type: String, default: "" },

    // Sources
    sources: [SourceSchema],

    // Meta
    readingTime: { type: Number, default: 5 },
    author: { type: String, default: "فريق سراج" },
    publishedAt: { type: Date },
    active: { type: Boolean, default: true, index: true },
    order: { type: Number, default: 0 },

    // SEO
    metaDescription: { type: String },
  },
  { timestamps: true }
);

// Full-text search index for Arabic content
ArticleSchema.index({ title: "text", excerpt: "text", contentMarkdown: "text", tags: "text" });

// Compound index for listing queries
ArticleSchema.index({ active: 1, section: 1, order: 1 });

const Article: Model<IArticle> =
  mongoose.models.Article ||
  mongoose.model<IArticle>("Article", ArticleSchema);

export default Article;
