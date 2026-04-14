import mongoose from "mongoose";

export interface ISiteContent {
  _id: string;
  key: string;
  value: string;
  section: string;
  createdAt?: string;
  updatedAt?: string;
}

const SiteContentSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    value: { type: String, required: true },
    section: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

// Add indexes for efficient querying
SiteContentSchema.index({ section: 1 });
SiteContentSchema.index({ key: 1 });

export default mongoose.models.SiteContent ||
  mongoose.model<ISiteContent>("SiteContent", SiteContentSchema);
