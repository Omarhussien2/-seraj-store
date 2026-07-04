import { NextResponse } from "next/server";
import { z } from "zod";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/requireAdmin";
import { auth } from "@/lib/auth";
import Order from "@/lib/models/Order";
import AdditionalCost from "@/lib/models/AdditionalCost";
import { deductInventoryForOrder } from "@/lib/financeOperations";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ReviewSchema = z.object({
  items: z.array(
    z.object({
      productSlug: z.string(),
      finalUnitCost: z.number().min(0),
    })
  ),
  actualShipping: z.number().min(0).optional(),
  otherCosts: z.number().min(0).optional(),
  deductInventory: z.boolean().default(false),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "ID الطلب غير صالح" },
        { status: 400 }
      );
    }

    const session = await auth();
    const body = await request.json();
    const validated = ReviewSchema.parse(body);

    const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json(
        { success: false, error: "الطلب غير موجود" },
        { status: 404 }
      );
    }

    // 1. Update items finalUnitCost
    for (const item of order.items) {
      const match = validated.items.find((i) => i.productSlug === item.productSlug);
      if (match) {
        item.finalUnitCost = match.finalUnitCost;
        if (typeof item.netRevenue !== "number") {
          item.netRevenue = (item.price * item.qty) - (item.discountShare || 0);
        }
      }
    }

    // 2. Prepare finance update
    const financeUpdate = {
      ...order.finance,
      costingStatus: "final",
      legacyReviewedAt: new Date(),
      legacyReviewedBy: session?.user?.email || "unknown",
    };

    // 3. Handle inventory deduction
    if (validated.deductInventory) {
      // Deduct inventory actually using the helper
      await deductInventoryForOrder(order);
    } else {
      // Bypass inventory deduction by setting the stamp
      financeUpdate.inventoryDeductedAt = new Date();
    }

    // Save final state using updateOne to avoid full document validation on old orders
    await Order.updateOne(
      { _id: id },
      { 
        $set: { 
          items: order.items,
          finance: financeUpdate 
        } 
      }
    );

    // 4. Create expenses for shipping or others if provided
    if (validated.actualShipping && validated.actualShipping > 0) {
      await AdditionalCost.create({
        scope: "order",
        type: "actual_shipping",
        amount: validated.actualShipping,
        description: `شحن فعلي للطلب رقم ${order.orderNumber} (معتمد ماليًا)`,
        orderId: order._id,
        incurredAt: order.createdAt || new Date(), // Tie expense to order creation date for accurate monthly profit reports
        allocationMethod: "none",
      });
    }

    if (validated.otherCosts && validated.otherCosts > 0) {
      await AdditionalCost.create({
        scope: "order",
        type: "other",
        amount: validated.otherCosts,
        description: `تكاليف إضافية للطلب رقم ${order.orderNumber} (معتمد ماليًا)`,
        orderId: order._id,
        incurredAt: order.createdAt || new Date(),
        allocationMethod: "none",
      });
    }

    return NextResponse.json({ success: true, data: order });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "بيانات التحقق غير صالحة",
          details: error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }
    console.error("PATCH /api/admin/finance/legacy-orders/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "فشل في اعتماد الطلب ماليًا" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/finance/legacy-orders/[id]
 * Reopen a financially approved order so admin can re-enter costs.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "ID الطلب غير صالح" },
        { status: 400 }
      );
    }

    const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json(
        { success: false, error: "الطلب غير موجود" },
        { status: 404 }
      );
    }

    // 1. Delete associated inventory movements (sale type)
    const InventoryMovement = (await import("@/lib/models/InventoryMovement")).default;
    await InventoryMovement.deleteMany({ orderId: order._id, type: "sale" });

    // 2. Delete associated additional costs
    await AdditionalCost.deleteMany({ orderId: order._id });

    // 3. Reset items finalUnitCost
    const resetItems = order.items.map((item: any) => ({
      ...item.toObject ? item.toObject() : item,
      finalUnitCost: 0,
    }));

    // 4. Reset finance status
    await Order.updateOne(
      { _id: id },
      {
        $set: {
          items: resetItems,
          finance: { costingStatus: "legacy_missing", stockWarnings: [] },
        },
      }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/admin/finance/legacy-orders/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "فشل في إعادة فتح الطلب" },
      { status: 500 }
    );
  }
}
