import mongoose from "mongoose";

export interface ITestimonial {
  _id?: string;
  name: string;
  quote: string;
  location: string;
  childAge: string;
  avatarInitials: string;
  avatarColor: string;
  screenshotUrl?: string;
  screenshotAlt?: string;
  order: number;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const TestimonialSchema = new mongoose.Schema(
  {
    name: { type: String, default: "عميلة سراج" },
    quote: { type: String, default: "" },
    location: { type: String, default: "" },
    childAge: { type: String, default: "" },
    avatarInitials: { type: String, default: "س" },
    avatarColor: { type: String, required: true, default: "#6bbf3f" },
    screenshotUrl: { type: String, trim: true },
    screenshotAlt: { type: String, trim: true },
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Testimonial =
  mongoose.models.Testimonial ||
  mongoose.model("Testimonial", TestimonialSchema);

export default Testimonial;
