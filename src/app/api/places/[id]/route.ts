import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import Place from "@/lib/models/Place";
import { requireAdmin } from "@/lib/requireAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/places/[id]
 * Returns a single place by _id (includes inactive only if ?all=true for admin)
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    // Check if admin wants all (including inactive)
    const { searchParams } = new URL(request.url);
    const showAll = searchParams.get("all") === "true";

    const filter: Record<string, unknown> = { _id: id };
    if (!showAll) {
      filter.active = true;
    }

    const place = await Place.findOne(filter).lean();

    if (!place) {
      return NextResponse.json(
        { success: false, error: "Place not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: place,
    });
  } catch (error) {
    console.error("GET /api/places/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch place" },
      { status: 500 }
    );
  }
}

// ---------- Zod schema for PATCH ----------
const PatchPlaceSchema = z.object({
  name_ar: z.string().min(1).optional(),
  name_en: z.string().min(1).optional(),
  description_short: z.string().optional(),
  area: z.string().optional(),
  city: z.string().min(1).optional(),
  address: z.string().optional(),
  location: z.object({
    lat: z.number().optional(),
    lon: z.number().optional(),
  }).optional(),
  min_price: z.number().min(0).optional(),
  max_price: z.number().min(0).optional(),
  price_range_id: z.number().min(1).max(5).optional(),
  min_age: z.number().min(0).optional(),
  max_age: z.number().min(0).optional(),
  avg_duration_hours: z.number().min(0).optional(),
  is_free: z.boolean().optional(),
  indoor_outdoor: z.enum(["indoor", "outdoor", "mixed", "unknown"]).optional(),
  booking_required: z.boolean().optional(),
  website_url: z.string().optional(),
  external_source: z.string().optional(),
  external_detail_url: z.string().optional(),
  phone: z.string().optional(),
  facebook_url: z.string().optional(),
  instagram_url: z.string().optional(),
  category_ids: z.array(z.number()).optional(),
  image_url: z.string().optional(),
  last_price_update: z.string().or(z.date()).optional().nullable(),
  offer_text: z.string().optional(),
  offer_active: z.boolean().optional(),
  offer_expiry: z.string().or(z.date()).optional().nullable(),
  active: z.boolean().optional(),
  order: z.number().optional(),
});

/**
 * PATCH /api/places/[id]
 * Update a place (admin)
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    await connectDB();
    const { id } = await params;

    const body = await request.json();
    const validated = PatchPlaceSchema.parse(body);

    // Convert date strings to Date if provided
    const updateData: Record<string, unknown> = { ...validated };
    if (validated.last_price_update) {
      updateData.last_price_update = new Date(validated.last_price_update as string | Date);
    }
    if (validated.offer_expiry) {
      updateData.offer_expiry = new Date(validated.offer_expiry as string | Date);
    }

    const place = await Place.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).lean();

    if (!place) {
      return NextResponse.json(
        { success: false, error: "Place not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: place,
    });
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

    console.error("PATCH /api/places/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update place" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/places/[id]
 * Soft-delete a place (sets active: false)
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    await connectDB();
    const { id } = await params;

    const place = await Place.findByIdAndUpdate(
      id,
      { $set: { active: false } },
      { new: true }
    ).lean();

    if (!place) {
      return NextResponse.json(
        { success: false, error: "Place not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: place,
      message: "Place deactivated (soft delete)",
    });
  } catch (error) {
    console.error("DELETE /api/places/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete place" },
      { status: 500 }
    );
  }
}
