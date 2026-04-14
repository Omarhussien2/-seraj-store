import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Order from "@/lib/models/Order";
import { requireAdmin } from "@/lib/requireAdmin";

/**
 * GET /api/stats
 * Dashboard statistics for admin panel (admin only)
 */
export async function GET() {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    await connectDB();

    const [stats] = await Order.aggregate([
      {
        $facet: {
          totalOrders: [{ $count: "count" }],
          pendingOrders: [
            { $match: { orderStatus: "pending" } },
            { $count: "count" },
          ],
          pendingStories: [
            {
              $match: {
                "customStory.heroName": { $exists: true },
                orderStatus: { $in: ["pending", "in_progress"] },
              },
            },
            { $count: "count" },
          ],
          totalRevenue: [
            { $group: { _id: null, total: { $sum: "$total" } } },
          ],
          recentOrders: [
            { $sort: { createdAt: -1 } },
            { $limit: 5 },
            { $project: { orderNumber: 1, customerName: 1, total: 1, orderStatus: 1, paymentStatus: 1, createdAt: 1 } },
          ],
        },
      },
    ]);

    return NextResponse.json({
      success: true,
      data: {
        totalOrders: stats.totalOrders[0]?.count || 0,
        pendingOrders: stats.pendingOrders[0]?.count || 0,
        pendingStories: stats.pendingStories[0]?.count || 0,
        totalRevenue: stats.totalRevenue[0]?.total || 0,
        recentOrders: stats.recentOrders || [],
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
