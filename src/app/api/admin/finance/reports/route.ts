import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/requireAdmin";
import Order from "@/lib/models/Order";
import Product from "@/lib/models/Product";
import AdditionalCost from "@/lib/models/AdditionalCost";
import {
  hasCostSnapshot,
  isActualFinanceOrder,
  roundMoney,
  summarizeFinance,
} from "@/lib/financeMath";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function monthKey(date: Date | string | undefined) {
  const d = date ? new Date(date) : new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export async function GET() {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    await connectDB();
    const [orders, costs, products] = await Promise.all([
      Order.find({}).sort({ createdAt: 1 }).lean(),
      AdditionalCost.find({}).lean(),
      Product.find({}).select("slug name").lean(),
    ]);

    const productNameMap = new Map(products.map((product) => [product.slug, product.name]));
    const summary = summarizeFinance(orders, costs);
    const byProduct = summary.productStats.map((stat) => ({
      ...stat,
      name: productNameMap.get(stat.productSlug) || stat.productSlug,
    }));

    const monthly = new Map<string, { month: string; netRevenue: number; cogs: number; netProfit: number }>();
    for (const order of orders) {
      if (!isActualFinanceOrder(order) || !hasCostSnapshot(order)) continue;
      const key = monthKey(order.createdAt);
      const current = monthly.get(key) || { month: key, netRevenue: 0, cogs: 0, netProfit: 0 };
      const monthSummary = summarizeFinance([order], []);
      current.netRevenue = roundMoney(current.netRevenue + monthSummary.netRevenue);
      current.cogs = roundMoney(current.cogs + monthSummary.cogs);
      current.netProfit = roundMoney(current.netProfit + monthSummary.netProfit);
      monthly.set(key, current);
    }

    return NextResponse.json({
      success: true,
      data: {
        byProduct,
        monthly: Array.from(monthly.values()),
        topProducts: [...byProduct].sort((a, b) => b.netProfit - a.netProfit).slice(0, 10),
        bottomProducts: [...byProduct].sort((a, b) => a.netProfit - b.netProfit).slice(0, 10),
        legacy: {
          actualOrdersMissingCost: summary.legacyActualOrdersCount,
        },
      },
    });
  } catch (error) {
    console.error("GET /api/admin/finance/reports error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load finance reports" },
      { status: 500 }
    );
  }
}
