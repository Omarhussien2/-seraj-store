import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import SiteContent from "@/lib/models/SiteContent";
import { requireAdmin } from "@/lib/requireAdmin";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/content
 * Public API to fetch all site text grouped by section
 */
export async function GET() {
  try {
    await connectDB();
    const contents = await SiteContent.find({}).lean();
    
    // Group by section
    const grouped: Record<string, Record<string, string>> = {};
    contents.forEach((doc) => {
      const { section, key, value } = doc as unknown as { section: string, key: string, value: string };
      if (!grouped[section]) grouped[section] = {};
      grouped[section][key] = value;
    });

    const response = NextResponse.json({
      success: true,
      data: grouped,
    });
    
    // Cache heavily on Vercel CDN for 60 seconds
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');

    return response;
  } catch (error) {
    console.error("GET /api/content error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch content" },
      { status: 500 }
    );
  }
}

// Zod schema for bulk update
const PatchContentSchema = z.object({
  items: z.array(z.object({
    key: z.string().min(1),
    value: z.string().min(1)
  }))
});

/**
 * PATCH /api/content
 * Admin-only: Update multiple text keys at once
 */
export async function PATCH(request: Request) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    await connectDB();
    const body = await request.json();
    const validated = PatchContentSchema.parse(body);

    const updates = validated.items.map((item) => ({
      updateOne: {
        filter: { key: item.key },
        update: { $set: { value: item.value } }
      }
    }));

    if (updates.length > 0) {
      // Execute bulk write
      await SiteContent.bulkWrite(updates);
    }

    // Bust the Next.js cache so GET returns updated content immediately
    revalidatePath("/api/content");

    return NextResponse.json({
      success: true,
      message: `Updated ${updates.length} items.`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }

    console.error("PATCH /api/content error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update content" },
      { status: 500 }
    );
  }
}
