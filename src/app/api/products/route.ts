import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import Product from "@/lib/models/Product";
import { requireAdmin } from "@/lib/requireAdmin";

/**
 * GET /api/products
 * Query params: ?category=قصص جاهزة&section=tales&series=سباق الفتوحات&all=true
 * Returns active products sorted by order (or all if ?all=true)
 */
export async function GET(request: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const section = searchParams.get("section");
    const series = searchParams.get("series");
    const showAll = searchParams.get("all") === "true";

    const filter: Record<string, unknown> = {};
    if (!showAll) {
      filter.active = true;
    }
    if (category) {
      filter.category = category;
    }
    if (section) {
      filter.section = section;
    }
    if (series) {
      filter.series = series;
    }

    const products = await Product.find(filter)
      .sort({ section: 1, order: 1 })
      .lean();

    return NextResponse.json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    console.error("GET /api/products error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

// ---------- Zod schema for product creation ----------
const ReviewSchema = z.object({
  text: z.string().min(1),
  name: z.string().min(1),
  place: z.string().min(1),
  color: z.string().min(1),
  initial: z.string().min(1),
});

const MediaSchema = z.object({
  type: z.enum(["book3d", "cards-fan", "bundle-stack"]),
  image: z.string().optional(),
  title: z.string().optional(),
  bg: z.enum(["emerald", "sand", "teal"]),
});

const GalleryItemSchema = z.object({
  url: z.string().url(),
  publicId: z.string().optional(),
  resourceType: z.enum(["image", "video"]).default("image"),
  alt: z.string().optional().default(""),
  sortOrder: z.number().optional().default(0),
});

const CreateProductSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  badge: z.string().min(1),
  badgeSoon: z.boolean().optional(),
  price: z.number().min(0),
  originalPrice: z.number().min(0).nullable().optional(),
  priceText: z.string().min(1),
  originalPriceText: z.string().nullable().optional(),
  category: z.enum(["قصص جاهزة", "قصص مخصصة", "فلاش كاردز", "مجموعات"]),
  section: z.enum(["tales", "seraj-stories", "custom-stories", "play-learn"]).optional(),
  series: z.string().optional(),
  shortDesc: z.string().optional(),
  longDesc: z.string().min(1),
  features: z.array(z.string()),
  imageUrl: z.string().optional(),
  media: MediaSchema,
  gallery: z.array(GalleryItemSchema).optional().default([]),
  action: z.enum(["cart", "wizard", "none"]),
  ctaText: z.string().min(1),
  comingSoon: z.boolean().optional(),
  reviews: z.array(ReviewSchema).optional(),
  related: z.array(z.string()).optional(),
  active: z.boolean().optional(),
  order: z.number().optional(),
});

/**
 * POST /api/products
 * Create a new product (admin)
 */
export async function POST(request: Request) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    await connectDB();

    const body = await request.json();
    const validated = CreateProductSchema.parse(body);

    // Check for duplicate slug
    const existing = await Product.findOne({ slug: validated.slug });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "Product slug already exists" },
        { status: 409 }
      );
    }

    const product = await Product.create(validated);

    return NextResponse.json(
      { success: true, data: product },
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

    console.error("POST /api/products error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create product" },
      { status: 500 }
    );
  }
}
