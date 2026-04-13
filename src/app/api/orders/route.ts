import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import Order, { generateOrderNumber } from "@/lib/models/Order";
import { requireAdmin } from "@/lib/requireAdmin";

// ---------- Zod validation schemas ----------
const OrderItemSchema = z.object({
  productSlug: z.string().min(1),
  name: z.string().min(1),
  price: z.number().min(0),
  qty: z.number().int().min(1).default(1),
});

const CustomStorySchema = z.object({
  heroName: z.string().min(1),
  age: z.number().int().min(1).max(18),
  challenge: z.string().min(1),
  photoUrl: z.string().url().optional(),
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

    const filter: Record<string, unknown> = {};
    if (status) {
      filter.orderStatus = status;
    }

    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      count: orders.length,
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
  try {
    await connectDB();

    const body = await request.json();
    const validated = CreateOrderSchema.parse(body);

    const orderNumber = await generateOrderNumber();
    const remaining = validated.total - validated.deposit;

    const order = await Order.create({
      orderNumber,
      items: validated.items,
      total: validated.total,
      deposit: validated.deposit,
      remaining,
      paymentMethod: validated.paymentMethod,
      paymentStatus: "unpaid",
      orderStatus: "pending",
      customStory: validated.customStory || undefined,
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
