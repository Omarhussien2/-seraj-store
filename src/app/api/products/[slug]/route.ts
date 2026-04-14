import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import Product from "@/lib/models/Product";
import { requireAdmin } from "@/lib/requireAdmin";

/**
 * GET /api/products/[slug]
 * Returns a single product by slug (includes inactive for admin)
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await connectDB();
    const { slug } = await params;

    // Check if admin wants all (including inactive)
    const { searchParams } = new URL(request.url);
    const showAll = searchParams.get("all") === "true";

    const filter: Record<string, unknown> = { slug };
    if (!showAll) {
      filter.active = true;
    }

    const product = await Product.findOne(filter).lean();

    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error("GET /api/products/[slug] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

// ---------- Zod schema for PATCH ----------
const PatchProductSchema = z.object({
  name: z.string().min(1).optional(),
  badge: z.string().min(1).optional(),
  badgeSoon: z.boolean().optional(),
  price: z.number().min(0).optional(),
  originalPrice: z.number().min(0).nullable().optional(),
  priceText: z.string().min(1).optional(),
  originalPriceText: z.string().nullable().optional(),
  category: z.enum(["قصص جاهزة", "قصص مخصصة", "فلاش كاردز", "مجموعات"]).optional(),
  longDesc: z.string().min(1).optional(),
  features: z.array(z.string()).optional(),
  imageUrl: z.string().optional(),
  media: z.object({
    type: z.enum(["book3d", "cards-fan", "bundle-stack"]).optional(),
    image: z.string().optional(),
    title: z.string().optional(),
    bg: z.enum(["emerald", "sand", "teal"]).optional(),
  }).optional(),
  gallery: z.array(z.object({
    _id: z.string().optional(),
    url: z.string().url(),
    publicId: z.string().optional(),
    resourceType: z.enum(["image", "video"]).default("image"),
    alt: z.string().optional().default(""),
    sortOrder: z.number().optional().default(0),
  })).optional(),
  action: z.enum(["cart", "wizard", "none"]).optional(),
  ctaText: z.string().min(1).optional(),
  comingSoon: z.boolean().optional(),
  reviews: z.array(z.object({
    text: z.string().min(1),
    name: z.string().min(1),
    place: z.string().min(1),
    color: z.string().min(1),
    initial: z.string().min(1),
  })).optional(),
  related: z.array(z.string()).optional(),
  active: z.boolean().optional(),
  order: z.number().optional(),
});

/**
 * PATCH /api/products/[slug]
 * Update a product (admin)
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
    const validated = PatchProductSchema.parse(body);

    const product = await Product.findOneAndUpdate(
      { slug },
      { $set: validated },
      { new: true, runValidators: true }
    ).lean();

    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: product,
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

    console.error("PATCH /api/products/[slug] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update product" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/products/[slug]
 * Soft-delete a product (sets active: false)
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

    const product = await Product.findOneAndUpdate(
      { slug },
      { $set: { active: false } },
      { new: true }
    ).lean();

    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: product,
      message: "Product deactivated (soft delete)",
    });
  } catch (error) {
    console.error("DELETE /api/products/[slug] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete product" },
      { status: 500 }
    );
  }
}
