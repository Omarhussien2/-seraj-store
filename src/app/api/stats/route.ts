import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Order from "@/lib/models/Order";

/**
 * GET /api/stats
 * Dashboard statistics for admin panel
 */
export async function GET() {
  try {
    await connectDB();

    const [
      totalOrders,
      pendingOrders,
      pendingStories,
      revenueResult,
      recentOrders,
    ] = await Promise.all([
      // Total orders count
      Order.countDocuments(),

      // Pending orders count
      Order.countDocuments({ orderStatus: "pending" }),

      // Orders with custom stories pending review
      Order.countDocuments({
        "customStory.heroName": { $exists: true },
        orderStatus: { $in: ["pending", "in_progress"] },
      }),

      // Total revenue (sum of all totals)
      Order.aggregate<{ total: number }>([
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]),

      // Last 5 orders
      Order.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select("orderNumber customerName total orderStatus paymentStatus createdAt")
        .lean(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        totalOrders,
        pendingOrders,
        pendingStories,
        totalRevenue: revenueResult[0]?.total || 0,
        recentOrders,
      },
    });
  } catch (error) {
    console.error("GET /api/stats error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
