import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import Article from "@/lib/models/Article";
import { requireAdmin } from "@/lib/requireAdmin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Valid sections
const VALID_SECTIONS = [
  "الحمل والرضاعة",
  "من الولادة إلى سنتين",
  "من 2 إلى 5 سنوات",
  "من 5 إلى 10 سنوات",
  "العلاقة مع الأم نفسيا",
  "الأهل والأسرة الممتدة",
  "العدل بين الولد والبنت",
  "المدرسة والضغط الدراسي",
  "الشاشات والإنترنت",
  "السلوكيات الصعبة والصحة النفسية",
  "الأب والتربية المشتركة",
  "مشاعر الأم وصورتها عن نفسها",
  "القيم والمراحل العمرية",
];

// Zod schema for source
const SourceSchema = z.object({
  label: z.string().min(1),
  url: z.string().url().or(z.literal("")).optional(),
  note: z.string().optional(),
});

// Zod schema for article creation
const CreateArticleSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  seoTitle: z.string().optional(),
  section: z.string().min(1),
  ageGroup: z.string().optional(),
  tags: z.array(z.string()).optional().default([]),
  excerpt: z.string().min(1),
  contentMarkdown: z.string().min(1),
  coverImage: z.string().optional(),
  coverImageAlt: z.string().optional().default(""),
  sources: z.array(SourceSchema).optional().default([]),
  readingTime: z.number().min(1).optional(),
  author: z.string().optional().default("فريق سراج"),
  publishedAt: z.string().optional().transform(v => v ? new Date(v) : undefined),
  active: z.boolean().optional().default(true),
  order: z.number().optional().default(0),
  metaDescription: z.string().optional(),
});

/**
 * GET /api/articles
 * Public listing with pagination, search, and filters.
 * Returns articles WITHOUT contentMarkdown to save bandwidth.
 */
export async function GET(request: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const section = searchParams.get("section");
    const ageGroup = searchParams.get("ageGroup");
    const tag = searchParams.get("tag");
    const search = searchParams.get("search");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "12", 10)));
    const showAll = searchParams.get("all") === "true";

    // Build filter
    const filter: Record<string, unknown> = {};
    if (!showAll) {
      filter.active = true;
      filter.publishedAt = { $ne: null, $lte: new Date() };
    }
    if (section) filter.section = section;
    if (ageGroup) filter.ageGroup = ageGroup;
    if (tag) filter.tags = tag;

    // Text search
    let query = Article.find(filter);

    if (search) {
      // Use text search if available, otherwise regex
      filter.$text = { $search: search };
      query = Article.find(filter, { score: { $meta: "textScore" } }).sort({ score: { $meta: "textScore" } });
    } else {
      query = query.sort({ order: 1, createdAt: -1 });
    }

    // Count total
    const total = await Article.countDocuments(filter);

    // Paginate - exclude contentMarkdown
    const articles = await query
      .select("-contentMarkdown -sources")
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Get section counts for chips
    const sectionCounts = await Article.aggregate([
      { $match: showAll ? {} : { active: true, publishedAt: { $ne: null, $lte: new Date() } } },
      { $group: { _id: "$section", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const sections = sectionCounts.map(s => ({ name: s._id, count: s.count }));

    return NextResponse.json({
      success: true,
      data: articles,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      sections,
    });
  } catch (error) {
    console.error("GET /api/articles error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch articles" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/articles
 * Create a new article (admin only).
 * Auto-calculates readingTime and generates slug if not provided.
 */
export async function POST(request: Request) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    await connectDB();

    const body = await request.json();

    // Generate slug from title if not provided
    if (!body.slug && body.title) {
      body.slug = body.title
        .replace(/[^\u0621-\u064Aa-zA-Z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .substring(0, 80)
        .replace(/-+$/, "");
    }

    const validated = CreateArticleSchema.parse(body);

    // Auto-calculate readingTime if not provided
    if (!validated.readingTime && validated.contentMarkdown) {
      const wordCount = validated.contentMarkdown.split(/\s+/).length;
      validated.readingTime = Math.max(1, Math.ceil(wordCount / 200));
    }

    // Use excerpt as metaDescription fallback
    if (!validated.metaDescription) {
      validated.metaDescription = validated.excerpt;
    }

    // Check for duplicate slug
    const existing = await Article.findOne({ slug: validated.slug });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "Article slug already exists" },
        { status: 409 }
      );
    }

    const article = await Article.create(validated);

    return NextResponse.json(
      { success: true, data: article },
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

    console.error("POST /api/articles error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create article" },
      { status: 500 }
    );
  }
}
