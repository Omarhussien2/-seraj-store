import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/requireAdmin";
import Order from "@/lib/models/Order";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    await connectDB();
    const orders = await Order.find({
      orderStatus: "delivered",
      paymentStatus: "fully_paid",
      "finance.costingStatus": { $exists: false },
    })
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
