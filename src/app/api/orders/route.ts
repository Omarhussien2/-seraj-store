import { NextResponse } from "next/server";
import { z } from "zod";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import Order, { generateOrderNumber } from "@/lib/models/Order";
import Product from "@/lib/models/Product";
import { requireAdmin } from "@/lib/requireAdmin";
import { isRateLimited, getClientIp } from "@/lib/rateLimit";
import {
  applyCouponOrThrow,
  redeemCouponOrThrow,
  rollbackCouponRedemption,
} from "@/lib/coupons/apply";
import { normalizeCouponCode } from "@/lib/coupons/normalize";

import { getOrCreatePaymentSettings, toPublic as toPaymentPublic } from "@/lib/paymentSettings";
import { computeDeposit } from "@/lib/depositCalc";
import { apiCache } from "@/lib/apiCache";
import {
  canDeleteOrder,
  getFinanceProfileMap,
  profileForSlug,
  reserveInventoryForOrder,
} from "@/lib/financeOperations";
import { lineGrossRevenue, roundMoney } from "@/lib/financeMath";

// Force dynamic rendering — prevent Vercel from caching or treating as static
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const statsCache = apiCache("stats");

// ---------- Zod validation schemas ----------
const OrderItemSchema = z.object({
  productSlug: z.string().min(1),
  name: z.string().min(1),
  price: z.number().min(0),
  qty: z.number().int().min(1).default(1),
});

const CustomStorySchema = z
  .object({
    heroName: z.string().min(1),
    age: z.preprocess(
      (val) => Number(val),
      z.number().int().min(1).max(18)
    ),
    gender: z.enum(["boy", "girl"]),
    challenge: z.string().trim().min(1),
    customChallenge: z.string().max(500).optional(),
    language: z.literal("ar").default("ar"),
    dedicationType: z.enum(["none", "warm", "dream", "custom"]).default("none"),
    dedicationText: z.string().trim().max(500).optional(),
    deliveryRecipientType: z.enum(["customer", "other"]).default("customer"),
    recipientName: z.string().trim().max(120).optional(),
    recipientPhone: z.string().regex(/^01[0-9]{9}$/).optional(),
    recipientAddress: z.string().trim().max(500).optional(),
    photoUrl: z.string().url().optional().nullable(),
    photoUrls: z.array(z.string().url()).max(5).optional().nullable(),
  })
  .superRefine((story, context) => {
    if (!story.photoUrl && !story.photoUrls?.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "صورة الطفل مطلوبة",
        path: ["photoUrls"],
      });
    }
    if (story.dedicationType === "custom" && !story.dedicationText) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "نص الإهداء المخصص مطلوب",
        path: ["dedicationText"],
      });
    }
    if (story.deliveryRecipientType === "other") {
      if (!story.recipientName) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "اسم مستلم القصة مطلوب",
          path: ["recipientName"],
        });
      }
      if (!story.recipientPhone) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "رقم موبايل مستلم القصة مطلوب",
          path: ["recipientPhone"],
        });
      }
      if (!story.recipientAddress) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "عنوان مستلم القصة مطلوب",
          path: ["recipientAddress"],
        });
      }
    }
  });

const CreateOrderSchema = z.object({
  items: z.array(OrderItemSchema).min(1, "سلة التسوق فاضية"),
  total: z.number().min(0),
  shippingFee: z.number().min(0).default(0),
  deposit: z.number().min(0).default(0),
  paymentMethod: z.enum(["instapay"]).default("instapay"),
  paymentMode: z.enum(["full", "deposit"]).default("full"),
  couponCode: z.string().min(1).max(64).optional(),
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

    const qtyBySlug = new Map<string, number>();
    for (const item of validated.items) {
      qtyBySlug.set(item.productSlug, (qtyBySlug.get(item.productSlug) || 0) + item.qty);
    }

    const slugs = Array.from(qtyBySlug.keys());
    const products = await Product.find({ slug: { $in: slugs }, active: true })
      .select("slug name price depositAmount action")
      .lean();

    const productMap = new Map(
      products.map((p) => [
        p.slug,
        {
          name: p.name,
          price: p.price,
          depositAmount: p.depositAmount ?? null,
          action: p.action,
        },
      ])
    );
    const financeProfiles = await getFinanceProfileMap(slugs);

    let subtotal = 0;
    const pricedItems: {
      productSlug: string;
      qty: number;
      unitPrice: number;
      depositAmount?: number | null;
      isCustom?: boolean;
    }[] = [];

    for (const [productSlug, qty] of qtyBySlug) {
      const item = { productSlug, qty };

      const productInfo = productMap.get(item.productSlug);
      if (productInfo === undefined) {
        return NextResponse.json(
          { success: false, error: `المنتج "${item.productSlug}" غير موجود أو غير متاح` },
          { status: 400 }
        );
      }

      subtotal += productInfo.price * item.qty;
      pricedItems.push({
        productSlug: item.productSlug,
        qty: item.qty,
        unitPrice: productInfo.price,
        depositAmount: productInfo.depositAmount,
        isCustom: productInfo.action === "wizard",
      });
    }

    const shippingFee = validated.shippingFee || 0;
    let discountTotal = 0;
    let discounts = { shipping: 0, subtotal: 0, products: 0 };
    let coupon: { code: string; couponId: mongoose.Types.ObjectId } | undefined;
    let totalAfterDiscount = subtotal + shippingFee;
    let itemDiscounts = new Map<string, number>();

    if (validated.couponCode) {
      try {
        const applied = await applyCouponOrThrow({
          code: validated.couponCode,
          items: pricedItems,
          subtotal,
          shippingFee,
          customerPhone: validated.customerPhone,
        });

        discountTotal = applied.discountTotal;
        discounts = applied.discountBreakdown;
        coupon = { code: applied.code, couponId: applied.couponId };
        totalAfterDiscount = applied.totalAfterDiscount;
        itemDiscounts = new Map(applied.itemDiscounts.map((item) => [item.productSlug, item.discount]));
      } catch (e) {
        return NextResponse.json(
          {
            success: false,
            error: "الكوبون غير صالح أو غير مناسب للسلة",
            details: {
              code: normalizeCouponCode(validated.couponCode),
              reason: (e as Error).message,
            },
          },
          { status: 400 }
        );
      }
    }

    // Compute deposit server-side from product data + global settings — never
    // trust the client. If `paymentMode === "full"`, deposit is 0.
    const orderItems = pricedItems.map((item) => {
      const productInfo = productMap.get(item.productSlug)!;
      const profile = profileForSlug(financeProfiles, item.productSlug);
      const grossRevenue = lineGrossRevenue({
        productSlug: item.productSlug,
        qty: item.qty,
        unitPriceSnapshot: item.unitPrice,
      });
      const discountShare = roundMoney(itemDiscounts.get(item.productSlug) || 0);

      return {
        productSlug: item.productSlug,
        name: productInfo.name,
        price: item.unitPrice,
        qty: item.qty,
        unitPriceSnapshot: item.unitPrice,
        nameSnapshot: productInfo.name,
        estimatedUnitCost: profile.averageUnitCost || 0,
        discountShare,
        netRevenue: roundMoney(Math.max(0, grossRevenue - discountShare)),
      };
    });

    let deposit = 0;
    if (validated.paymentMode === "deposit") {
      const paymentSettings = toPaymentPublic(await getOrCreatePaymentSettings());
      deposit = computeDeposit(pricedItems, paymentSettings);
      if (deposit <= 0 || deposit >= totalAfterDiscount) {
        // Either deposit is disabled / zero / >= total → force full payment.
        deposit = 0;
      }
    }

    const orderNumber = await generateOrderNumber();
    const orderId = new mongoose.Types.ObjectId();

    if (coupon && discountTotal > 0) {
      try {
        await redeemCouponOrThrow({
          couponId: coupon.couponId,
          code: coupon.code,
          orderId,
          customerPhone: validated.customerPhone,
          discountTotal,
        });
      } catch (e) {
        return NextResponse.json(
          {
            success: false,
            error: "تم انتهاء الكوبون أو تم استخدامه بالحد الأقصى",
            details: { code: coupon.code, reason: (e as Error).message },
          },
          { status: 400 }
        );
      }
    }

    let order;
    let stockWarnings: { productSlug: string; requestedQty: number; availableQty: number }[] = [];
    try {
      order = await Order.create({
        _id: orderId,
        orderNumber,
        items: orderItems,
        total: totalAfterDiscount,
        subtotal,
        shippingFee,
        discountTotal,
        discounts,
        coupon,
        deposit,
        remaining: Math.max(0, totalAfterDiscount - deposit),
        paymentMethod: validated.paymentMethod,
        paymentStatus: "unpaid",
        paymentMode: deposit > 0 ? "deposit" : "full",
        orderStatus: "pending",
        customStory: validated.customStory
          ? {
              heroName: validated.customStory.heroName,
              age: validated.customStory.age,
              gender: validated.customStory.gender,
              challenge: validated.customStory.challenge,
              language: validated.customStory.language,
              dedicationType: validated.customStory.dedicationType,
              deliveryRecipientType: validated.customStory.deliveryRecipientType,
              ...(validated.customStory.dedicationText
                ? { dedicationText: validated.customStory.dedicationText }
                : {}),
              ...(validated.customStory.customChallenge
                ? { customChallenge: validated.customStory.customChallenge }
                : {}),
              ...(validated.customStory.deliveryRecipientType === "other"
                ? {
                    recipientName: validated.customStory.recipientName,
                    recipientPhone: validated.customStory.recipientPhone,
                    recipientAddress: validated.customStory.recipientAddress,
                  }
                : {}),
              ...(validated.customStory.photoUrl
                ? { photoUrl: validated.customStory.photoUrl }
                : {}),
              ...(validated.customStory.photoUrls?.length
                ? { photoUrls: validated.customStory.photoUrls }
                : {}),
            }
          : undefined,
        customerName: validated.customerName,
        customerPhone: validated.customerPhone,
        address: validated.address,
        notes: validated.notes,
        finance: { costingStatus: "snapshot" },
      });
      const reservation = await reserveInventoryForOrder(order);
      stockWarnings = reservation.warnings;
    } catch (e) {
      if (coupon && discountTotal > 0) {
        await rollbackCouponRedemption({ couponId: coupon.couponId, orderId });
      }
      throw e;
    }


    statsCache.invalidate();

    return NextResponse.json(
      {
        success: true,
        data: {
          orderNumber: order.orderNumber,
          _id: order._id,
          total: order.total,
          subtotal: order.subtotal,
          shippingFee: order.shippingFee,
          discountTotal: order.discountTotal,
          discounts: order.discounts,
           couponCode: order.coupon?.code,
          deposit: order.deposit,
          remaining: order.remaining,
          paymentMode: order.paymentMode,
          orderStatus: order.orderStatus,
          paymentStatus: order.paymentStatus,
          warnings: stockWarnings.length ? { stock: stockWarnings } : undefined,
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

    const orders = await Order.find({ _id: { $in: ids } }).lean();
    const protectedOrders: string[] = [];
    for (const order of orders) {
      if (!(await canDeleteOrder(order))) {
        protectedOrders.push(order.orderNumber);
      }
    }

    if (protectedOrders.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Some orders have financial or inventory impact. Cancel them instead of deleting.",
          data: { protectedOrders },
        },
        { status: 409 }
      );
    }

    const result = await Order.deleteMany({ _id: { $in: ids } });

    statsCache.invalidate();

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
