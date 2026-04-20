import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import SiteContent from "@/lib/models/SiteContent";

export const dynamic = "force-dynamic";

// Fallback defaults (used when DB is unavailable or key not seeded yet)
const DEFAULTS = {
  pricePerPage: 3,        // ج.م per printed page
  coverPrice: 20,         // ج.م extra for book cover
  minPages: 5,            // minimum pages per order
  maxPages: 50,           // maximum pages per order
  freeShippingMin: 100,   // EGP threshold for free shipping
};

/**
 * GET /api/coloring/pricing
 * Returns current coloring print pricing from SiteContent (admin-configurable).
 * Falls back to hardcoded defaults if DB is unavailable.
 */
export async function GET() {
  const pricing = { ...DEFAULTS };

  try {
    await connectDB();
    const keys = [
      "coloring_price_per_page",
      "coloring_cover_price",
      "coloring_min_pages",
      "coloring_max_pages",
      "coloring_free_shipping_min",
    ];
    const settings = await SiteContent.find({
      key: { $in: keys },
    }).lean();

    for (const s of settings) {
      const val = parseInt(s.value, 10);
      if (isNaN(val)) continue;
      switch (s.key) {
        case "coloring_price_per_page":   pricing.pricePerPage = val;   break;
        case "coloring_cover_price":       pricing.coverPrice = val;     break;
        case "coloring_min_pages":         pricing.minPages = val;       break;
        case "coloring_max_pages":         pricing.maxPages = val;       break;
        case "coloring_free_shipping_min": pricing.freeShippingMin = val; break;
      }
    }
  } catch {
    // DB unavailable — use defaults silently
  }

  return NextResponse.json({ success: true, data: pricing });
}
