import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import ColoringCategory from "@/lib/models/ColoringCategory";
import { requireAdmin } from "@/lib/requireAdmin";

export const dynamic = "force-dynamic";

/**
 * GET /api/coloring/categories
 * Returns all active categories as a flat list or nested tree.
 * Query params:
 *   ?tree=1   → nested tree (parents with children array)
 *   ?featured →  featured categories only
 *   ?parent=[slug] → children of a specific parent (null = top-level)
 */
export async function GET(request: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const wantTree = searchParams.get("tree") === "1";
    const featuredOnly = searchParams.has("featured");
    const parentSlug = searchParams.get("parent");

    const showAll = searchParams.get("all") === "true";
    const filter: Record<string, unknown> = {};
    if (!showAll) filter.active = true;
    if (featuredOnly) filter.featured = true;
    if (parentSlug !== null) {
      // "parent=root" means top-level (parentSlug = null in DB)
      filter.parentSlug = parentSlug === "root" ? null : parentSlug;
    }

    const categories = await ColoringCategory.find(filter)
      .sort({ order: 1, nameAr: 1 })
      .lean();

    if (wantTree) {
      // Build parent → children tree
      const topLevel = categories.filter((c) => !c.parentSlug);
      const tree = topLevel.map((parent) => ({
        ...parent,
        children: categories.filter((c) => c.parentSlug === parent.slug),
      }));
      return NextResponse.json({ success: true, data: tree });
    }

    return NextResponse.json({ success: true, data: categories });
  } catch (err) {
    console.error("[GET /api/coloring/categories]", err);
    return NextResponse.json(
      { success: false, error: "فشل جلب الفئات" },
      { status: 500 }
    );
  }
}

// ---------- Slug helper ----------
function generateSlug(text: string): string {
  const slug = text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\u0600-\u06FFa-z0-9-]/g, "") // keep Arabic, latin, digits, hyphens
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return slug || `cat-${Date.now()}`;
}

// ---------- Zod schema for category creation ----------
const CreateCategorySchema = z.object({
  nameAr: z.string().min(1, "اسم الفئة بالعربية مطلوب"),
  nameEn: z.string().optional(),
  slug: z.string().optional(),
  parentSlug: z.string().nullable().optional(),
  icon: z.string().default("🎨"),
  description: z.string().optional(),
  thumbnail: z.string().optional(),
  order: z.number().default(0),
  active: z.boolean().default(true),
  featured: z.boolean().default(false),
  source: z
    .enum(["supercoloring", "kidipage", "seraj", "mixed", "other"])
    .optional(),
});

/**
 * POST /api/coloring/categories
 * Create a new coloring category (admin)
 */
export async function POST(request: Request) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    await connectDB();

    const body = await request.json();
    const validated = CreateCategorySchema.parse(body);

    // Auto-generate slug if not provided
    const slug = validated.slug?.trim() || generateSlug(validated.nameAr);

    // Check for duplicate slug
    const existing = await ColoringCategory.findOne({ slug });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "يوجد فئة بنفس الـ slug بالفعل" },
        { status: 409 }
      );
    }

    const category = await ColoringCategory.create({ ...validated, slug });

    return NextResponse.json(
      { success: true, data: category },
      { status: 201 }
    );
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

    console.error("[POST /api/coloring/categories]", error);
    return NextResponse.json(
      { success: false, error: "فشل إنشاء الفئة" },
      { status: 500 }
    );
  }
}
