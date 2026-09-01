import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Testimonial from "@/lib/models/Testimonial";
import { requireAdmin } from "@/lib/requireAdmin";
import { apiCache } from "@/lib/apiCache";
import {
  CreateTestimonialSchema,
  PatchTestimonialSchema,
} from "@/lib/testimonials/validation";
import { z } from "zod";

export const dynamic = "force-dynamic";

const cache = apiCache("testimonials");

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    await connectDB();
    const body = PatchTestimonialSchema.parse(await request.json());
    const { id } = await params;
    const testimonial = await Testimonial.findById(id);
    if (!testimonial) {
      return NextResponse.json(
        { success: false, error: "Not found" },
        { status: 404 }
      );
    }

    CreateTestimonialSchema.parse({ ...testimonial.toObject(), ...body });
    testimonial.set(body);
    const updated = await testimonial.save();

    cache.invalidate();

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "بيانات الشهادة غير صالحة", details: error.issues },
        { status: 400 }
      );
    }
    console.error("PATCH /api/testimonials/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    await connectDB();
    const { id } = await params;

    const deleted = await Testimonial.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Not found" },
        { status: 404 }
      );
    }

    cache.invalidate();

    return NextResponse.json({ success: true, data: {} });
  } catch (error) {
    console.error("DELETE /api/testimonials/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete" },
      { status: 500 }
    );
  }
}
