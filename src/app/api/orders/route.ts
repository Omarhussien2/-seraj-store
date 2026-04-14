import { NextResponse } from "next/server";
import { z } from "zod";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import Order, { generateOrderNumber } from "@/lib/models/Order";
import Product from "@/lib/models/Product";
import { requireAdmin } from "@/lib/requireAdmin";
import { isRateLimited, getClientIp } from "@/lib/rateLimit";

// Force dynamic rendering — prevent Vercel from caching or treating as static
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// ---------- Zod validation schemas ----------
const OrderItemSchema = z.object({
  productSlug: z.string().min(1),
  name: z.string().min(1),
  price: z.number().min(0),
  qty: z.number().int().min(1).default(1),
});

const CustomStorySchema = z.object({
  heroName: z.string().min(1),
  age: z.preprocess(
    (val) => (val === null || val === undefined || val === "" ? 5 : Number(val)),
    z.number().int().min(1).max(18)
  ),
  challenge: z.preprocess(
    (val) => (val === null || val === undefined || val === "" ? "شجاعة" : val),
    z.string().min(1)
  ),
  photoUrl: z.string().url().optional().nullable(),
});

const CreateOrderSchema = z.object({
  items: z.array(OrderItemSchema).min(1, "سلة التسوق فاضية"),
  total: z.number().min(0),
  deposit: z.number().min(0).default(50),
  paymentMethod: z.enum(["instapay"]).default("instapay"),
  customStory: CustomStorySchema.optional(),
  customerName: z.string().min(1, "اسم العميل مطلوب"),
  customerPhone: z
    .string()
    .regex(/^01[0-9]{9}$/, "رقم الموبايل لازم يبدأ بـ 01 ويتكون من 11 رقم"),
  address: z.string().min(1, "العنوان مطلوب"),
  notes: z.string().optional(),
});

/**
 * GET /api/orders
 * Query params: ?status=pending
 * Returns all orders (admin only)
 */
export async function GET(request: Request) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const hasStory = searchParams.get("hasStory") === "true";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};
    if (status) filter.orderStatus = status;
    if (hasStory) filter["customStory.heroName"] = { $exists: true };

    const [orders, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Order.countDocuments(filter),
    ]);

    return NextResponse.json({
      success: true,
      count: orders.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      data: orders,
    });
  } catch (error) {
    console.error("GET /api/orders error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/orders
 * Create a new order with Zod validation
 */
export async function POST(request: Request) {
  // Rate limit: 10 orders per 15 minutes per IP
  const ip = getClientIp(request);
  if (isRateLimited(`orders:${ip}`, 10, 15 * 60 * 1000)) {
    return NextResponse.json(
      { success: false, error: "طلبات كتير أوي، حاول تاني بعد شوية" },
      { status: 429 }
    );
  }

  try {
    await connectDB();

    const body = await request.json();
    const validated = CreateOrderSchema.parse(body);

    // Recalculate total from actual DB prices — never trust client-side total
    const slugs = validated.items.map((i) => i.productSlug);
    const products = await Product.find({ slug: { $in: slugs }, active: true })
      .select("slug price")
      .lean();

    const productMap = new Map(products.map((p) => [p.slug, p.price]));

    let calculatedTotal = 0;
    for (const item of validated.items) {
      const price = productMap.get(item.productSlug);
      if (price === undefined) {
        return NextResponse.json(
          { success: false, error: `المنتج "${item.productSlug}" غير موجود أو غير متاح` },
          { status: 400 }
        );
      }
      calculatedTotal += price * item.qty;
    }

    const orderNumber = await generateOrderNumber();
    const remaining = Math.max(0, calculatedTotal - validated.deposit);

    const order = await Order.create({
      orderNumber,
      items: validated.items,
      total: calculatedTotal,
      deposit: validated.deposit,
      remaining,
      paymentMethod: validated.paymentMethod,
      paymentStatus: "unpaid",
      orderStatus: "pending",
      customStory: validated.customStory
        ? {
            heroName: validated.customStory.heroName,
            age: validated.customStory.age,
            challenge: validated.customStory.challenge,
            ...(validated.customStory.photoUrl
              ? { photoUrl: validated.customStory.photoUrl }
              : {}),
          }
        : undefined,
      customerName: validated.customerName,
      customerPhone: validated.customerPhone,
      address: validated.address,
      notes: validated.notes,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          orderNumber: order.orderNumber,
          _id: order._id,
          total: order.total,
          deposit: order.deposit,
          remaining: order.remaining,
          orderStatus: order.orderStatus,
          paymentStatus: order.paymentStatus,
          createdAt: order.createdAt,
        },
      },
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

    console.error("POST /api/orders error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create order" },
      { status: 500 }
    );
  }
}

// ---------- Zod schema for bulk DELETE ----------
const BulkDeleteSchema = z.object({
  ids: z.array(z.string().min(1)).min(1, "At least one order ID required").max(100),
});

/**
 * DELETE /api/orders
 * Bulk-delete orders by IDs (admin only).
 * Body: { "ids": ["id1", "id2", ...] }
 */
export async function DELETE(request: Request) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    await connectDB();

    const body = await request.json();
    const { ids } = BulkDeleteSchema.parse(body);

    // Validate all IDs are valid ObjectIds
    const invalidIds = ids.filter((id) => !mongoose.Types.ObjectId.isValid(id));
    if (invalidIds.length > 0) {
      return NextResponse.json(
        { success: false, error: `Invalid order IDs: ${invalidIds.join(", ")}` },
        { status: 400 }
      );
    }

    const result = await Order.deleteMany({ _id: { $in: ids } });

    return NextResponse.json({
      success: true,
      message: `${result.deletedCount} order(s) deleted permanently`,
      data: { deletedCount: result.deletedCount, requestedCount: ids.length },
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

    console.error("DELETE /api/orders error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete orders" },
      { status: 500 }
    );
  }
}
