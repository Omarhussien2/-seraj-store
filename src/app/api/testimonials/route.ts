import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Testimonial from "@/lib/models/Testimonial";
import { requireAdmin } from "@/lib/requireAdmin";
import { apiCache } from "@/lib/apiCache";

export const dynamic = "force-dynamic";

const cache = apiCache("testimonials");

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const all = searchParams.get("all") === "true"; // return inactive as well
    const fresh = searchParams.get("fresh") === "1";

    const cacheKey = all ? null : "__public__";

    if (cacheKey && !fresh) {
      const hit = cache.get(cacheKey);
      if (hit) {
        return new NextResponse(hit, {
          status: 200,
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            "X-Cache": "HIT",
            "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
          },
        });
      }
    }

    await connectDB();
    const query = all ? {} : { active: true };
    const items = await Testimonial.find(query).sort({ order: 1, createdAt: -1 });

    const body = JSON.stringify({ success: true, data: items });

    if (cacheKey) {
      cache.set(cacheKey, body);
    }

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "X-Cache": cacheKey ? (fresh ? "BYPASS" : "MISS") : "BYPASS",
        "Cache-Control": all
          ? "private, no-store"
          : "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
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

    cache.invalidate();

    return NextResponse.json({ success: true, data: newDoc }, { status: 201 });
  } catch (error) {
    console.error("POST /api/testimonials error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create testimonial" },
      { status: 500 }
    );
  }
}
