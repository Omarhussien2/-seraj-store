import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Order from "@/lib/models/Order";
import ColoringItem from "@/lib/models/ColoringItem";
import { requireAdmin } from "@/lib/requireAdmin";
import { apiCache } from "@/lib/apiCache";

const cache = apiCache("stats");
const CACHE_KEY = "__stats__";

/**
 * GET /api/stats
 * Dashboard statistics for admin panel (admin only).
 *
 * Returns:
 *   - totalOrders, pendingOrders, pendingStories, totalRevenue
 *   - revenue7d, revenue30d, revenuePrev30d (for trend display)
 *   - depositPendingCount, depositPendingRemaining
 *     (orders that paid the deposit but are awaiting COD remainder collection)
 *   - recentOrders (last 10 with paymentStatus)
 *   - oldPendingOrders (count of pending orders > 24 hours old — daily nag)
 *   - topColoringItems (top 5 most-saved coloring sheets so the admin can
 *     see which assets are driving the workbook customizer)
 */
export async function GET(request: Request) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const fresh = searchParams.get("fresh") === "1";

    if (!fresh) {
      const hit = cache.get(CACHE_KEY);
      if (hit) {
        return new NextResponse(hit, {
          status: 200,
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            "X-Cache": "HIT",
            "Cache-Control": "private, no-store",
          },
        });
      }
    }

    await connectDB();

    const now = new Date();
    const day = 24 * 60 * 60 * 1000;
    const last7 = new Date(now.getTime() - 7 * day);
    const last30 = new Date(now.getTime() - 30 * day);
    const prev30Start = new Date(now.getTime() - 60 * day);
    const prev30End = last30;
    const oldPendingCutoff = new Date(now.getTime() - day);

    const [orderStatsResult, topColoringItems] = await Promise.all([
      Order.aggregate([
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
            { $match: { orderStatus: { $ne: "cancelled" } } },
            { $group: { _id: null, total: { $sum: "$total" } } },
          ],
          revenue7d: [
            {
              $match: {
                orderStatus: { $ne: "cancelled" },
                createdAt: { $gte: last7 },
              },
            },
            { $group: { _id: null, total: { $sum: "$total" } } },
          ],
          revenue30d: [
            {
              $match: {
                orderStatus: { $ne: "cancelled" },
                createdAt: { $gte: last30 },
              },
            },
            { $group: { _id: null, total: { $sum: "$total" } } },
          ],
          revenuePrev30d: [
            {
              $match: {
                orderStatus: { $ne: "cancelled" },
                createdAt: { $gte: prev30Start, $lt: prev30End },
              },
            },
            { $group: { _id: null, total: { $sum: "$total" } } },
          ],
          depositPending: [
            {
              $match: {
                paymentMode: "deposit",
                paymentStatus: "deposit_paid",
                orderStatus: { $nin: ["cancelled", "delivered"] },
              },
            },
            {
              $group: {
                _id: null,
                count: { $sum: 1 },
                remaining: { $sum: "$remaining" },
              },
            },
          ],
          oldPendingOrders: [
            {
              $match: {
                orderStatus: "pending",
                createdAt: { $lt: oldPendingCutoff },
              },
            },
            { $count: "count" },
          ],
          recentOrders: [
            { $sort: { createdAt: -1 } },
            { $limit: 10 },
            {
              $project: {
                orderNumber: 1,
                customerName: 1,
                total: 1,
                deposit: 1,
                remaining: 1,
                paymentMode: 1,
                paymentStatus: 1,
                orderStatus: 1,
                createdAt: 1,
              },
            },
          ],
        },
      },
    ]),
      ColoringItem.find({ active: true })
        .sort({ savedCount: -1, printCount: -1 })
        .limit(5)
        .select("slug title thumbnail savedCount printCount categorySlug")
        .lean(),
    ]);

    const stats = orderStatsResult[0];

    const body = JSON.stringify({
      success: true,
      data: {
        totalOrders: stats.totalOrders[0]?.count || 0,
        pendingOrders: stats.pendingOrders[0]?.count || 0,
        pendingStories: stats.pendingStories[0]?.count || 0,
        totalRevenue: stats.totalRevenue[0]?.total || 0,
        revenue7d: stats.revenue7d[0]?.total || 0,
        revenue30d: stats.revenue30d[0]?.total || 0,
        revenuePrev30d: stats.revenuePrev30d[0]?.total || 0,
        depositPendingCount: stats.depositPending[0]?.count || 0,
        depositPendingRemaining: stats.depositPending[0]?.remaining || 0,
        oldPendingOrdersCount: stats.oldPendingOrders[0]?.count || 0,
        recentOrders: stats.recentOrders || [],
        topColoringItems: topColoringItems || [],
      },
    });

    cache.set(CACHE_KEY, body);

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "X-Cache": fresh ? "BYPASS" : "MISS",
        "Cache-Control": "private, no-store",
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
