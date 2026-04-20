import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import ColoringItem from "@/lib/models/ColoringItem";

export const dynamic = "force-dynamic";

/**
 * GET /api/coloring/featured
 * Returns featured coloring items for display on Mama World homepage.
 * Returns up to 12 items distributed across types.
 */
export async function GET() {
  try {
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

    return NextResponse.json({
      success: true,
      data: combined.slice(0, 12),
    });
  } catch (err) {
    console.error("[GET /api/coloring/featured]", err);
    return NextResponse.json(
      { success: false, error: "فشل جلب العناصر المميزة" },
      { status: 500 }
    );
  }
}
