import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import ColoringItem from "@/lib/models/ColoringItem";
import ColoringCategory from "@/lib/models/ColoringCategory";
import { requireAdmin } from "@/lib/requireAdmin";

export const dynamic = "force-dynamic";

/**
 * GET /api/coloring/items
 * Search + filter coloring items with pagination.
 * Query params:
 *   ?q=search text
 *   ?category=slug
 *   ?type=coloring|worksheet|craft
 *   ?difficulty=easy|medium|hard
 *   ?age=3-6|7-10|11+
 *   ?license=cc0|cc-by|cc-by-sa|free-link|seraj
 *   ?featured=1
 *   ?page=1&limit=24
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();
    const category = searchParams.get("category");
    const type = searchParams.get("type");
    const difficulty = searchParams.get("difficulty");
    const age = searchParams.get("age");
    const license = searchParams.get("license");
    const featured = searchParams.get("featured") === "1";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(48, Math.max(6, parseInt(searchParams.get("limit") || "24", 10)));

    const showAll = searchParams.get("all") === "true";
    const filter: Record<string, unknown> = {};
    if (!showAll) filter.active = true;
    if (category) filter.categorySlug = category;
    if (type) filter.type = type;
    if (difficulty) filter.difficulty = difficulty;
    if (age) filter.ageRange = age;
    if (license) filter.license = license;
    if (featured) filter.featured = true;
    if (q) filter.$text = { $search: q };

    const skip = (page - 1) * limit;

    let items, total;
    if (q) {
      // Text search — sort by relevance score
      [items, total] = await Promise.all([
        ColoringItem.find(filter)
          .sort({ score: { $meta: "textScore" }, savedCount: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        ColoringItem.countDocuments(filter),
      ]);
    } else {
      // Regular sort — order ASC, then most saved
      [items, total] = await Promise.all([
        ColoringItem.find(filter)
          .sort({ order: 1, savedCount: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        ColoringItem.countDocuments(filter),
      ]);
    }

    return NextResponse.json({
      success: true,
      data: items,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    });
  } catch (err) {
    console.error("[GET /api/coloring/items]", err);
    return NextResponse.json(
      { success: false, error: "فشل جلب العناصر" },
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
    .replace(/[^\u0600-\u06FFa-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return slug || `item-${Date.now()}`;
}

// ---------- Zod schema for item creation ----------
const CreateItemSchema = z.object({
  title: z.string().min(1, "عنوان العنصر مطلوب"),
  slug: z.string().optional(),
  categorySlug: z.string().min(1, "فئة العنصر مطلوبة"),
  thumbnail: z.string().min(1, "صورة مصغرة مطلوبة"),
  fullImageUrl: z.string().optional(),
  sourceUrl: z.string().optional(),
  sourceName: z.string().optional(),
  type: z.enum(["coloring", "worksheet", "craft"]).default("coloring"),
  difficulty: z.enum(["easy", "medium", "hard"]).default("easy"),
  ageRange: z.enum(["3-6", "7-10", "11+"]).default("3-6"),
  tags: z.array(z.string()).optional().default([]),
  license: z
    .enum(["cc0", "cc-by", "cc-by-sa", "free-link", "seraj"])
    .default("free-link"),
  attribution: z.string().optional(),
  active: z.boolean().default(true),
  featured: z.boolean().default(false),
  printable: z.boolean().default(true),
  order: z.number().default(0),
});

/**
 * POST /api/coloring/items
 * Create a new coloring item (admin)
 */
export async function POST(request: NextRequest) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    await connectDB();

    const body = await request.json();
    const validated = CreateItemSchema.parse(body);

    // Auto-generate slug if not provided
    const slug = validated.slug?.trim() || generateSlug(validated.title);

    // Check for duplicate slug
    const existing = await ColoringItem.findOne({ slug });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "يوجد عنصر بنفس الـ slug بالفعل" },
        { status: 409 }
      );
    }

    const item = await ColoringItem.create({ ...validated, slug });

    // Increment parent category's itemCount
    await ColoringCategory.findOneAndUpdate(
      { slug: validated.categorySlug },
      { $inc: { itemCount: 1 } }
    );

    return NextResponse.json(
      { success: true, data: item },
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

    console.error("[POST /api/coloring/items]", error);
    return NextResponse.json(
      { success: false, error: "فشل إنشاء العنصر" },
      { status: 500 }
    );
  }
}
