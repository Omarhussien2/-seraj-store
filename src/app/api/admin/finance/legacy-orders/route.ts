import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/requireAdmin";
import Order from "@/lib/models/Order";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    await connectDB();

    const status = request.nextUrl.searchParams.get("status");

    let filter: Record<string, unknown>;

    if (status === "approved") {
      // Return orders that have been financially approved
      filter = {
        orderStatus: "delivered",
        paymentStatus: "fully_paid",
        "finance.costingStatus": "final",
      };
    } else {
      // Return orders pending financial review
      filter = {
        orderStatus: "delivered",
        paymentStatus: "fully_paid",
        $or: [
          { "finance.costingStatus": { $exists: false } },
          { "finance.costingStatus": "legacy_missing" },
        ],
      };
    }

    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, data: orders });
  } catch (error) {
    console.error("GET /api/admin/finance/legacy-orders error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load legacy orders" },
      { status: 500 }
    );
  }
}
