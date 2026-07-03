import { NextResponse } from "next/server";
import { z } from "zod";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import Order from "@/lib/models/Order";
import { requireAdmin } from "@/lib/requireAdmin";
import { apiCache } from "@/lib/apiCache";
import {
  canDeleteOrder,
  deductInventoryForOrder,
  getOrCreateFinanceSettings,
  releaseOrReverseInventoryForOrder,
} from "@/lib/financeOperations";

const deductionRank = {
  in_progress: 1,
  shipped: 2,
  delivered: 3,
};

const statsCache = apiCache("stats");

// ---------- Zod schema for PATCH ----------
const PatchOrderSchema = z.object({
  orderStatus: z
    .enum(["pending", "in_progress", "shipped", "delivered", "cancelled"])
    .optional(),
  paymentStatus: z
    .enum(["unpaid", "deposit_paid", "fully_paid"])
    .optional(),
  notes: z.string().optional(),
  storyStatus: z
    .enum(["pending", "reviewed", "sent_to_print", "delivered"])
    .optional(),
});

/**
 * GET /api/orders/[id]
 * Returns a single order by ID
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid order ID" },
        { status: 400 }
      );
    }

    const order = await Order.findById(id).lean();

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error("GET /api/orders/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch order" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/orders/[id]
 * Update order status (orderStatus, paymentStatus)
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid order ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validated = PatchOrderSchema.parse(body);

    const updateFields: Record<string, unknown> = {};
    if (validated.orderStatus !== undefined) updateFields.orderStatus = validated.orderStatus;
    if (validated.paymentStatus !== undefined) updateFields.paymentStatus = validated.paymentStatus;
    if (validated.notes !== undefined) updateFields.notes = validated.notes;
    if (validated.storyStatus !== undefined) updateFields["customStory.storyStatus"] = validated.storyStatus;

    let order = await Order.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).lean();

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    if (validated.orderStatus === "cancelled") {
      await releaseOrReverseInventoryForOrder(order);
      order = await Order.findById(id).lean();
    } else if (validated.orderStatus && validated.orderStatus in deductionRank) {
      const settings = await getOrCreateFinanceSettings();
      const targetRank = deductionRank[validated.orderStatus as keyof typeof deductionRank];
      const configuredRank = deductionRank[settings.inventoryDeductionStatus];
      if (targetRank >= configuredRank) {
        await deductInventoryForOrder(order);
        order = await Order.findById(id).lean();
      }
    }

    statsCache.invalidate();

    return NextResponse.json({
      success: true,
      data: order,
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

    console.error("PATCH /api/orders/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update order" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/orders/[id]
 * Permanently delete an order (admin only)
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid order ID" },
        { status: 400 }
      );
    }

    const existing = await Order.findById(id).lean();

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    if (!(await canDeleteOrder(existing))) {
      return NextResponse.json(
        {
          success: false,
          error: "Order has financial or inventory impact. Cancel it instead of deleting.",
          data: { orderNumber: existing.orderNumber },
        },
        { status: 409 }
      );
    }

    const order = await Order.findByIdAndDelete(id).lean();

    statsCache.invalidate();

    return NextResponse.json({
      success: true,
      message: `Order ${existing.orderNumber} deleted permanently`,
      data: { orderNumber: existing.orderNumber, _id: order?._id },
    });
  } catch (error) {
    console.error("DELETE /api/orders/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete order" },
      { status: 500 }
    );
  }
}
