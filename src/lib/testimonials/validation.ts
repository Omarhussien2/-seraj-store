import { z } from "zod";

const TestimonialFields = {
  name: z.string().trim().min(1).max(100).default("عميلة سراج"),
  quote: z.string().trim().max(1500).default(""),
  location: z.string().trim().max(100).default(""),
  childAge: z.string().trim().max(60).default(""),
  avatarInitials: z.string().trim().min(1).max(2).default("س"),
  avatarColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  screenshotUrl: z.string().url().or(z.literal("")).optional().nullable(),
  screenshotAlt: z.string().trim().max(220).optional().nullable(),
  order: z.number().int().min(0).default(0),
  active: z.boolean().default(true),
};

export const CreateTestimonialSchema = z.object(TestimonialFields).refine(
  (testimonial) => Boolean(testimonial.quote || testimonial.screenshotUrl),
  { message: "اكتب نص الشهادة أو ارفع صورة واتساب", path: ["quote"] }
);
export const PatchTestimonialSchema = z.object(TestimonialFields).partial();
