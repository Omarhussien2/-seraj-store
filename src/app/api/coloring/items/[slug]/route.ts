import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import ColoringItem from "@/lib/models/ColoringItem";
import ColoringCategory from "@/lib/models/ColoringCategory";
import { requireAdmin } from "@/lib/requireAdmin";

export const dynamic = "force-dynamic";

/**
 * GET /api/coloring/items/[slug]
 * Returns a single coloring item by slug.
 * Also increments a lightweight "view" counter via a side-channel approach
 * to avoid blocking the response.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    await connectDB();

    const { slug } = params;
    const item = await ColoringItem.findOne({ slug, active: true }).lean();

    if (!item) {
      return NextResponse.json(
        { success: false, error: "العنصر غير موجود" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: item });
  } catch (err) {
    console.error("[GET /api/coloring/items/[slug]]", err);
    return NextResponse.json(
      { success: false, error: "فشل جلب العنصر" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/coloring/items/[slug]
 * Increment a stat counter (savedCount | shareCount | printCount).
 * Body: { action: "save" | "share" | "print" }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    await connectDB();

    const { slug } = params;
    const body = await request.json().catch(() => ({}));
    const action = body?.action;

    const fieldMap: Record<string, string> = {
      save: "savedCount",
      share: "shareCount",
      print: "printCount",
    };
    const field = fieldMap[action];
    if (!field) {
      return NextResponse.json(
        { success: false, error: "action غير صالح" },
        { status: 400 }
      );
    }

    await ColoringItem.findOneAndUpdate(
      { slug, active: true },
      { $inc: { [field]: 1 } }
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[POST /api/coloring/items/[slug]]", err);
    return NextResponse.json(
      { success: false, error: "فشل تحديث الإحصائية" },
      { status: 500 }
    );
  }
}

// ---------- Zod schema for PATCH ----------
const PatchItemSchema = z.object({
  title: z.string().min(1).optional(),
  categorySlug: z.string().min(1).optional(),
  thumbnail: z.string().min(1).optional(),
  fullImageUrl: z.string().optional().nullable(),
  sourceUrl: z.string().optional().nullable(),
  sourceName: z.string().optional().nullable(),
  type: z.enum(["coloring", "worksheet", "craft"]).optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  ageRange: z.enum(["3-6", "7-10", "11+"]).optional(),
  tags: z.array(z.string()).optional(),
  license: z
    .enum(["cc0", "cc-by", "cc-by-sa", "free-link", "seraj"])
    .optional(),
  attribution: z.string().optional().nullable(),
  active: z.boolean().optional(),
  featured: z.boolean().optional(),
  printable: z.boolean().optional(),
  order: z.number().optional(),
});

/**
 * PATCH /api/coloring/items/[slug]
 * Update a coloring item (admin).
 * If categorySlug changes, adjusts itemCount on both old and new categories.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    await connectDB();

    const { slug } = params;
    const body = await request.json();
    const validated = PatchItemSchema.parse(body);

    // If categorySlug is changing, we need the old category to adjust counts
    let oldCategorySlug: string | null = null;
    if (validated.categorySlug) {
      const current = await ColoringItem.findOne({ slug }).lean();
      if (current && current.categorySlug !== validated.categorySlug) {
        oldCategorySlug = current.categorySlug;
      }
    }

    const item = await ColoringItem.findOneAndUpdate(
      { slug },
      { $set: validated },
      { new: true, runValidators: true }
    ).lean();

    if (!item) {
      return NextResponse.json(
        { success: false, error: "العنصر غير موجود" },
        { status: 404 }
      );
    }

    // Update itemCount on both categories if category changed
    if (oldCategorySlug && validated.categorySlug) {
      await Promise.all([
        ColoringCategory.findOneAndUpdate(
          { slug: oldCategorySlug },
          { $inc: { itemCount: -1 } }
        ),
        ColoringCategory.findOneAndUpdate(
          { slug: validated.categorySlug },
          { $inc: { itemCount: 1 } }
        ),
      ]);
    }

    return NextResponse.json({ success: true, data: item });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "فشل التحقق من البيانات",
          details: error.issues.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    console.error("[PATCH /api/coloring/items/[slug]]", error);
    return NextResponse.json(
      { success: false, error: "فشل تحديث العنصر" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/coloring/items/[slug]
 * Soft-delete (active → false), or hard-delete if already inactive.
 * Hard-deleting decrements parent category's itemCount.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    await connectDB();

    const { slug } = params;
    const item = await ColoringItem.findOne({ slug }).lean();

    if (!item) {
      return NextResponse.json(
        { success: false, error: "العنصر غير موجود" },
        { status: 404 }
      );
    }

    if (item.active) {
      // Soft delete
      const updated = await ColoringItem.findOneAndUpdate(
        { slug },
        { $set: { active: false } },
        { new: true }
      ).lean();

      return NextResponse.json({
        success: true,
        data: updated,
        message: "تم إخفاء العنصر (Soft Delete)",
      });
    } else {
      // Hard delete — decrement parent category's itemCount
      await ColoringCategory.findOneAndUpdate(
        { slug: item.categorySlug },
        { $inc: { itemCount: -1 } }
      );
      await ColoringItem.findOneAndDelete({ slug });

      return NextResponse.json({
        success: true,
        data: null,
        message: "تم حذف العنصر نهائياً",
      });
    }
  } catch (error) {
    console.error("[DELETE /api/coloring/items/[slug]]", error);
    return NextResponse.json(
      { success: false, error: "فشل حذف العنصر" },
      { status: 500 }
    );
  }
}
