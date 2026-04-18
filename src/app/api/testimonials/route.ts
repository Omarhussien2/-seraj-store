import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Testimonial from "@/lib/models/Testimonial";
import { requireAdmin } from "@/lib/requireAdmin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const all = searchParams.get("all") === "true"; // return inactive as well

    const query = all ? {} : { active: true };
    const items = await Testimonial.find(query).sort({ order: 1, createdAt: -1 });

    return NextResponse.json({ success: true, data: items });
  } catch (error) {
    console.error("GET /api/testimonials error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch testimonials" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    await connectDB();
    const body = await request.json();

    const newDoc = await Testimonial.create(body);

    return NextResponse.json({ success: true, data: newDoc }, { status: 201 });
  } catch (error) {
    console.error("POST /api/testimonials error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create testimonial" },
      { status: 500 }
    );
  }
}
