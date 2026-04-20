import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import ColoringCategory from "@/lib/models/ColoringCategory";
import ColoringItem from "@/lib/models/ColoringItem";
import { requireAdmin } from "@/lib/requireAdmin";

export const dynamic = "force-dynamic";

/**
 * GET /api/coloring/categories/[slug]
 * Returns one category + its paginated items.
 * Query params:
 *   ?page=1&limit=24
 *   ?type=coloring|worksheet|craft
 *   ?difficulty=easy|medium|hard
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await connectDB();

    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(48, Math.max(6, parseInt(searchParams.get("limit") || "24", 10)));
    const type = searchParams.get("type");
    const difficulty = searchParams.get("difficulty");

    const category = await ColoringCategory.findOne({ slug, active: true }).lean();
    if (!category) {
      return NextResponse.json(
        { success: false, error: "الفئة غير موجودة" },
        { status: 404 }
      );
    }

    // Build items filter
    const itemFilter: Record<string, unknown> = {
      categorySlug: slug,
      active: true,
    };
    if (type) itemFilter.type = type;
    if (difficulty) itemFilter.difficulty = difficulty;

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      ColoringItem.find(itemFilter)
        .sort({ order: 1, savedCount: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ColoringItem.countDocuments(itemFilter),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        category,
        items,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasMore: page * limit < total,
        },
      },
    });
  } catch (err) {
    console.error("[GET /api/coloring/categories/[slug]]", err);
    return NextResponse.json(
      { success: false, error: "فشل جلب الفئة" },
      { status: 500 }
    );
  }
}

// ---------- Zod schema for PATCH ----------
const PatchCategorySchema = z.object({
  nameAr: z.string().min(1).optional(),
  nameEn: z.string().optional().nullable(),
  parentSlug: z.string().nullable().optional(),
  icon: z.string().optional(),
  description: z.string().optional().nullable(),
  thumbnail: z.string().optional().nullable(),
  order: z.number().optional(),
  active: z.boolean().optional(),
  featured: z.boolean().optional(),
  source: z
    .enum(["supercoloring", "kidipage", "seraj", "mixed", "other"])
    .optional()
    .nullable(),
});

/**
 * PATCH /api/coloring/categories/[slug]
 * Update a coloring category (admin)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    await connectDB();

    const { slug } = await params;
    const body = await request.json();
    const validated = PatchCategorySchema.parse(body);

    const category = await ColoringCategory.findOneAndUpdate(
      { slug },
      { $set: validated },
      { new: true, runValidators: true }
    ).lean();

    if (!category) {
      return NextResponse.json(
        { success: false, error: "الفئة غير موجودة" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: category });
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

    console.error("[PATCH /api/coloring/categories/[slug]]", error);
    return NextResponse.json(
      { success: false, error: "فشل تحديث الفئة" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/coloring/categories/[slug]
 * Soft-delete (active → false), or hard-delete if already inactive.
 * Hard-deleting also deactivates items in that category.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    await connectDB();

    const { slug } = await params;
    const category = await ColoringCategory.findOne({ slug }).lean();

    if (!category) {
      return NextResponse.json(
        { success: false, error: "الفئة غير موجودة" },
        { status: 404 }
      );
    }

    if (category.active) {
      // Soft delete
      const updated = await ColoringCategory.findOneAndUpdate(
        { slug },
        { $set: { active: false } },
        { new: true }
      ).lean();

      return NextResponse.json({
        success: true,
        data: updated,
        message: "تم إخفاء الفئة (Soft Delete)",
      });
    } else {
      // Hard delete — also deactivate items in this category
      await ColoringItem.updateMany(
        { categorySlug: slug },
        { $set: { active: false } }
      );
      await ColoringCategory.findOneAndDelete({ slug });

      return NextResponse.json({
        success: true,
        data: null,
        message: "تم حذف الفئة نهائياً وإخفاء عناصرها",
      });
    }
  } catch (error) {
    console.error("[DELETE /api/coloring/categories/[slug]]", error);
    return NextResponse.json(
      { success: false, error: "فشل حذف الفئة" },
      { status: 500 }
    );
  }
}
