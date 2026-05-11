import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import GroupBuy from "@/lib/models/GroupBuy";
import { requireAdmin } from "@/lib/requireAdmin";
import { isGroupExpired } from "@/lib/groupBuy/engine";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/group-buys/[code]
 * Public endpoint to fetch group buy details for the UI.
 * Automatically marks as expired if past time.
 */
export async function GET(
  request: Request,
  { params }: { params: { code: string } }
) {
  try {
    await connectDB();

    const code = params.code.toUpperCase();
    const group = await GroupBuy.findOne({ code });

    if (!group) {
      return NextResponse.json(
        { success: false, error: "الجروب ده مش موجود" },
        { status: 404 }
      );
    }

    // Auto-expire if time has passed
    if (isGroupExpired(group)) {
      group.status = "expired";
      await group.save();
    }

    // Return public-safe data
    return NextResponse.json({
      success: true,
      data: {
        code: group.code,
        createdByName: group.createdByName,
        tiers: group.tiers,
        targetOrders: group.targetOrders,
        confirmedOrders: group.confirmedOrders,
        currentTier: group.currentTier,
        status: group.status,
        expiresAt: group.expiresAt,
        content: group.content,
        timeRemainingMs: Math.max(0, new Date(group.expiresAt).getTime() - Date.now()),
      }
    });
  } catch (error) {
    console.error("GET /api/group-buys/[code] error:", error);
    return NextResponse.json(
      { success: false, error: "حدث خطأ أثناء جلب تفاصيل الجروب" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/group-buys/[code]
 * Admin endpoint to modify group status or expiry.
 */
export async function PATCH(
  request: Request,
  { params }: { params: { code: string } }
) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    await connectDB();
    const body = await request.json();
    const code = params.code.toUpperCase();

    const group = await GroupBuy.findOne({ code });
    if (!group) {
      return NextResponse.json(
        { success: false, error: "Group not found" },
        { status: 404 }
      );
    }

    // Allowed updates
    if (body.status && ["open", "completed", "expired", "cancelled"].includes(body.status)) {
      group.status = body.status;
    }
    
    if (body.extendHours && typeof body.extendHours === "number") {
      const newExpiry = new Date(group.expiresAt);
      newExpiry.setHours(newExpiry.getHours() + body.extendHours);
      group.expiresAt = newExpiry;
      if (group.status === "expired" && newExpiry > new Date()) {
        group.status = "open";
      }
    }

    await group.save();

    return NextResponse.json({
      success: true,
      data: group
    });
  } catch (error) {
    console.error("PATCH /api/group-buys/[code] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update group buy" },
      { status: 500 }
    );
  }
}
