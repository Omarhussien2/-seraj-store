import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import SiteContent from "@/lib/models/SiteContent";
import { requireAdmin } from "@/lib/requireAdmin";

export const dynamic = "force-dynamic";

// Fallback defaults (used when DB is unavailable or key not seeded yet)
const DEFAULTS = {
  pricePerPage: 3,        // ج.م per printed page
  coverPrice: 20,         // ج.م extra for book cover
  minPages: 5,            // minimum pages per order
  maxPages: 50,           // maximum pages per order
  freeShippingMin: 100,   // EGP threshold for free shipping
};

// DB key ↔ response field mapping
const KEY_MAP: Record<string, string> = {
  coloring_price_per_page: "pricePerPage",
  coloring_cover_price: "coverPrice",
  coloring_min_pages: "minPages",
  coloring_max_pages: "maxPages",
  coloring_free_shipping_min: "freeShippingMin",
};
const FIELD_TO_KEY: Record<string, string> = Object.fromEntries(
  Object.entries(KEY_MAP).map(([k, v]) => [v, k])
);

/**
 * GET /api/coloring/pricing
 * Returns current coloring print pricing from SiteContent (admin-configurable).
 * Falls back to hardcoded defaults if DB is unavailable.
 */
export async function GET() {
  const pricing = { ...DEFAULTS };

  try {
    await connectDB();
    const settings = await SiteContent.find({
      key: { $in: Object.keys(KEY_MAP) },
    }).lean();

    for (const s of settings) {
      const val = parseInt(s.value, 10);
      if (isNaN(val)) continue;
      const field = KEY_MAP[s.key];
      if (field) (pricing as any)[field] = val;
    }
  } catch {
    // DB unavailable — use defaults silently
  }

  return NextResponse.json({ success: true, data: pricing });
}

// Zod schema for PUT (admin update)
const PricingUpdateSchema = z.object({
  pricePerPage: z.number().int().min(1).max(100).optional(),
  coverPrice: z.number().int().min(0).max(500).optional(),
  minPages: z.number().int().min(1).max(20).optional(),
  maxPages: z.number().int().min(10).max(200).optional(),
  freeShippingMin: z.number().int().min(0).max(10000).optional(),
});

/**
 * PUT /api/coloring/pricing
 * Admin-only: Update coloring workbook pricing settings.
 * Creates or updates SiteContent entries for each provided field.
 */
export async function PUT(request: Request) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    await connectDB();
    const body = await request.json();
    const validated = PricingUpdateSchema.parse(body);

    const ops = Object.entries(validated)
      .map(([field, value]) => {
        const dbKey = FIELD_TO_KEY[field];
        if (!dbKey) return undefined;
        return {
          updateOne: {
            filter: { key: dbKey },
            update: { $set: { value: String(value), section: "coloring_pricing" } },
            upsert: true,
          },
        };
      })
      .filter((op): op is NonNullable<typeof op> => op !== undefined);

    if (ops.length > 0) {
      await SiteContent.bulkWrite(ops);
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${ops.length} pricing setting(s).`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    console.error("PUT /api/coloring/pricing error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update pricing" },
      { status: 500 }
    );
  }
}
