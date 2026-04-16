import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import Place from "@/lib/models/Place";
import { requireAdmin } from "@/lib/requireAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/places
 * Query params: ?city=Cairo&category=3&is_free=true&indoor_outdoor=outdoor&q=search&all=true&limit=20&page=1&min_price_above=100&max_price_below=300
 * Returns active places sorted by order (or all if ?all=true for admin)
 */
export async function GET(request: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const city = searchParams.get("city");
    const category = searchParams.get("category");
    const isFree = searchParams.get("is_free");
    const indoorOutdoor = searchParams.get("indoor_outdoor");
    const q = searchParams.get("q");
    const showAll = searchParams.get("all") === "true";
    const minPriceAbove = searchParams.get("min_price_above");
    const maxPriceBelow = searchParams.get("max_price_below");

    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "20", 10)));

    const filter: Record<string, unknown> = {};
    if (!showAll) {
      filter.active = true;
    }
    if (city) {
      filter.city = city;
    }
    if (category) {
      const catNum = parseInt(category, 10);
      if (!isNaN(catNum)) {
        filter.category_ids = { $in: [catNum] };
      }
    }
    if (isFree !== null) {
      filter.is_free = isFree === "true";
    }
    if (indoorOutdoor) {
      filter.indoor_outdoor = indoorOutdoor;
    }
    if (minPriceAbove !== null) {
      const val = parseInt(minPriceAbove, 10);
      if (!isNaN(val)) {
        filter.min_price = { ...((filter.min_price as Record<string, unknown>) || {}), $gte: val };
      }
    }
    if (maxPriceBelow !== null) {
      const val = parseInt(maxPriceBelow, 10);
      if (!isNaN(val)) {
        filter.max_price = { ...((filter.max_price as Record<string, unknown>) || {}), $lte: val };
      }
    }

    // Text search (only if q param provided)
    let query = Place.find(q ? { ...filter, $text: { $search: q } } : filter)
      .sort(q ? { score: { $meta: "textScore" }, order: 1 } : { order: 1 });

    // Pagination
    const total = await Place.countDocuments(q ? { ...filter, $text: { $search: q } } : filter);
    const totalPages = Math.ceil(total / limit);
    query = query.skip((page - 1) * limit).limit(limit);

    const places = await query.lean();

    return NextResponse.json({
      success: true,
      count: total,
      data: places,
      page,
      totalPages,
    });
  } catch (error) {
    console.error("GET /api/places error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch places" },
      { status: 500 }
    );
  }
}

// ---------- Zod schema for place creation ----------
const CreatePlaceSchema = z.object({
  name_ar: z.string().min(1),
  name_en: z.string().min(1),
  description_short: z.string().optional().default(""),
  area: z.string().optional().default(""),
  city: z.string().min(1),
  address: z.string().optional().default(""),
  location: z.object({
    lat: z.number().optional().default(0),
    lon: z.number().optional().default(0),
  }).optional().default({ lat: 0, lon: 0 }),
  min_price: z.number().min(0).optional().default(0),
  max_price: z.number().min(0).optional().default(0),
  price_range_id: z.number().min(1).max(5).optional().default(1),
  min_age: z.number().min(0).optional().default(0),
  max_age: z.number().min(0).optional().default(100),
  avg_duration_hours: z.number().min(0).optional().default(3),
  is_free: z.boolean().optional().default(false),
  indoor_outdoor: z.enum(["indoor", "outdoor", "mixed", "unknown"]).optional().default("unknown"),
  booking_required: z.boolean().optional().default(false),
  website_url: z.string().optional().default(""),
  external_source: z.string().optional().default("Admin"),
  external_detail_url: z.string().optional().default(""),
  phone: z.string().optional().default(""),
  facebook_url: z.string().optional().default(""),
  instagram_url: z.string().optional().default(""),
  category_ids: z.array(z.number()).optional().default([]),
  image_url: z.string().optional().default(""),
  last_price_update: z.string().or(z.date()).optional().nullable(),
  active: z.boolean().optional().default(true),
  order: z.number().optional().default(0),
});

/**
 * POST /api/places
 * Create a new place (admin)
 */
export async function POST(request: Request) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    await connectDB();

    const body = await request.json();
    const validated = CreatePlaceSchema.parse(body);

    // Check for duplicate name_en
    const existing = await Place.findOne({ name_en: validated.name_en });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "Place with this name_en already exists" },
        { status: 409 }
      );
    }

    // Convert last_price_update string to Date if needed
    const placeData = {
      ...validated,
      last_price_update: validated.last_price_update
        ? new Date(validated.last_price_update)
        : new Date(),
    };

    const place = await Place.create(placeData);

    return NextResponse.json(
      { success: true, data: place },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: error.issues.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    console.error("POST /api/places error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create place" },
      { status: 500 }
    );
  }
}
