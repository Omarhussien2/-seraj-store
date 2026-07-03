import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/requireAdmin";
import Order from "@/lib/models/Order";
import Product from "@/lib/models/Product";
import ProductFinance from "@/lib/models/ProductFinance";
import AdditionalCost from "@/lib/models/AdditionalCost";
import { summarizeFinance, roundMoney } from "@/lib/financeMath";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function parseDate(value: string | null) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export async function GET(request: Request) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const from = parseDate(searchParams.get("from"));
    const to = parseDate(searchParams.get("to"));

    const dateFilter: Record<string, unknown> = {};
    if (from || to) {
      dateFilter.createdAt = {
        ...(from ? { $gte: from } : {}),
        ...(to ? { $lte: to } : {}),
      };
    }

    const costDateFilter: Record<string, unknown> = {};
    if (from || to) {
      costDateFilter.incurredAt = {
        ...(from ? { $gte: from } : {}),
        ...(to ? { $lte: to } : {}),
      };
    }

    const [orders, costs, productFinances, products] = await Promise.all([
      Order.find(dateFilter).lean(),
      AdditionalCost.find(costDateFilter).lean(),
      ProductFinance.find({}).lean(),
      Product.find({}).select("slug name").lean(),
    ]);

    const productNameMap = new Map(products.map((product) => [product.slug, product.name]));
    const summary = summarizeFinance(orders, costs);

    const inventoryValue = productFinances.reduce(
      (sum, product) =>
        roundMoney(sum + Math.max(0, product.currentStock || 0) * (product.averageUnitCost || 0)),
      0
    );

    const lowStockProducts = productFinances
      .filter((product) => {
        if (!product.trackInventory || !product.lowStockThreshold) return false;
        return (product.currentStock || 0) - (product.reservedStock || 0) <= product.lowStockThreshold;
      })
      .map((product) => ({
        productSlug: product.productSlug,
        name: productNameMap.get(product.productSlug) || product.productSlug,
        currentStock: product.currentStock || 0,
        reservedStock: product.reservedStock || 0,
        availableStock: (product.currentStock || 0) - (product.reservedStock || 0),
        lowStockThreshold: product.lowStockThreshold || 0,
      }));

    const productStats = summary.productStats.map((stat) => ({
      ...stat,
      name: productNameMap.get(stat.productSlug) || stat.productSlug,
    }));

    return NextResponse.json({
      success: true,
      data: {
        cards: {
          netRevenue: summary.netRevenue,
          netProfit: summary.netProfit,
          profitMargin: summary.profitMargin,
          inventoryValue,
          lowStockCount: lowStockProducts.length,
        },
        summary,
        inventoryValue,
        lowStockProducts,
        topProducts: [...productStats].sort((a, b) => b.netProfit - a.netProfit).slice(0, 5),
        bottomProducts: [...productStats].sort((a, b) => a.netProfit - b.netProfit).slice(0, 5),
        legacy: {
          actualOrdersMissingCost: summary.legacyActualOrdersCount,
        },
      },
    });
  } catch (error) {
    console.error("GET /api/admin/finance/summary error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load finance summary" },
      { status: 500 }
    );
  }
}
