import mongoose from "mongoose";

export interface ITestimonial {
  _id?: string;
  name: string;
  quote: string;
  location: string;
  childAge: string;
  avatarInitials: string;
  avatarColor: string;
  order: number;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const TestimonialSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    quote: { type: String, required: true },
    location: { type: String, required: true },
    childAge: { type: String, required: true },
    avatarInitials: { type: String, required: true },
    avatarColor: { type: String, required: true, default: "#6bbf3f" },
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Testimonial =
  mongoose.models.Testimonial ||
  mongoose.model("Testimonial", TestimonialSchema);

export default Testimonial;
