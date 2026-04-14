import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import Article from "@/lib/models/Article";
import { requireAdmin } from "@/lib/requireAdmin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Zod schema for source
const SourceSchema = z.object({
  label: z.string().min(1),
  url: z.string().url().or(z.literal("")).optional(),
  note: z.string().optional(),
});

// Zod schema for article update
const UpdateArticleSchema = z.object({
  title: z.string().min(1).optional(),
  seoTitle: z.string().optional(),
  section: z.string().min(1).optional(),
  ageGroup: z.string().optional(),
  tags: z.array(z.string()).optional(),
  excerpt: z.string().min(1).optional(),
  contentMarkdown: z.string().min(1).optional(),
  coverImage: z.string().optional().nullable(),
  coverImageAlt: z.string().optional(),
  sources: z.array(SourceSchema).optional(),
  readingTime: z.number().min(1).optional(),
  author: z.string().optional(),
  publishedAt: z.string().nullable().optional().transform(v => v ? new Date(v) : v === null ? null : undefined),
  active: z.boolean().optional(),
  order: z.number().optional(),
  metaDescription: z.string().optional(),
});

/**
 * GET /api/articles/:slug
 * Returns full article with contentMarkdown, sources, and related articles.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await connectDB();

    const { slug } = await params;
    const article = await Article.findOne({ slug }).lean();

    if (!article || !article.active) {
      return NextResponse.json(
        { success: false, error: "Article not found" },
        { status: 404 }
      );
    }

    // Fetch related articles from same section (max 3)
    const related = await Article.find({
      section: article.section,
      active: true,
      slug: { $ne: slug },
    })
      .select("slug title excerpt coverImage readingTime section")
      .sort({ order: 1 })
      .limit(3)
      .lean();

    return NextResponse.json({
      success: true,
      data: article,
      related,
    });
  } catch (error) {
    console.error("GET /api/articles/:slug error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch article" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/articles/:slug
 * Update an article (admin only).
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    await connectDB();

    const { slug } = await params;
    const body = await request.json();
    const validated = UpdateArticleSchema.parse(body);

    // Auto-recalculate readingTime if content changed
    if (validated.contentMarkdown && !validated.readingTime) {
      const wordCount = validated.contentMarkdown.split(/\s+/).length;
      validated.readingTime = Math.max(1, Math.ceil(wordCount / 200));
    }

    const updated = await Article.findOneAndUpdate(
      { slug },
      { $set: validated },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Article not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updated,
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

    console.error("PATCH /api/articles/:slug error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update article" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/articles/:slug
 * Soft delete — sets active to false (admin only).
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    await connectDB();

    const { slug } = await params;
    const deleted = await Article.findOneAndUpdate(
      { slug },
      { $set: { active: false } }
    );

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Article not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Article deactivated",
    });
  } catch (error) {
    console.error("DELETE /api/articles/:slug error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete article" },
      { status: 500 }
    );
  }
}
