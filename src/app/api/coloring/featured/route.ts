import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import ColoringItem from "@/lib/models/ColoringItem";
import { apiCache } from "@/lib/apiCache";

export const dynamic = "force-dynamic";

const cache = apiCache("coloring-featured");
const CACHE_KEY = "__featured__";

/**
 * GET /api/coloring/featured
 * Returns featured coloring items for display on Mama World homepage.
 * Returns up to 12 items distributed across types.
 */
export async function GET() {
  try {
    const hit = cache.get(CACHE_KEY);
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

    await connectDB();

    // Get a mix: featured items + recently popular items
    const [featured, popular] = await Promise.all([
      ColoringItem.find({ active: true, featured: true })
        .sort({ order: 1 })
        .limit(8)
        .lean(),
      ColoringItem.find({ active: true, featured: false })
        .sort({ savedCount: -1 })
        .limit(4)
        .lean(),
    ]);

    // Merge and deduplicate by _id
    const seen = new Set<string>();
    const combined = [...featured, ...popular].filter((item) => {
      const id = item._id.toString();
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });

    const body = JSON.stringify({
      success: true,
      data: combined.slice(0, 12),
    });

    cache.set(CACHE_KEY, body);

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "X-Cache": "MISS",
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (err) {
    console.error("[GET /api/coloring/featured]", err);
    return NextResponse.json(
      { success: false, error: "فشل جلب العناصر المميزة" },
      { status: 500 }
    );
  }
}
