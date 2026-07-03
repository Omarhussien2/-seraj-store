export type FinanceLineInput = {
  productSlug: string;
  name?: string;
  qty: number;
  price?: number;
  unitPriceSnapshot?: number;
  estimatedUnitCost?: number | null;
  finalUnitCost?: number | null;
  discountShare?: number | null;
  netRevenue?: number | null;
};

export type FinanceOrderInput = {
  _id?: unknown;
  orderStatus: string;
  paymentStatus: string;
  total: number;
  subtotal?: number;
  shippingFee?: number;
  discounts?: {
    shipping?: number;
    subtotal?: number;
    products?: number;
  };
  items: FinanceLineInput[];
  createdAt?: Date | string;
};

export type AdditionalCostInput = {
  scope: "general" | "product" | "order";
  amount: number;
  productSlug?: string;
  orderId?: unknown;
  allocationMethod?: "net_revenue" | "units" | "none";
};

export type StockWarningInput = {
  productSlug: string;
  requestedQty: number;
  availableQty: number;
};

export function roundMoney(value: number): number {
  return Math.round((Number(value) || 0) * 100) / 100;
}

export function isActualFinanceOrder(order: FinanceOrderInput): boolean {
  return order.orderStatus === "delivered" && order.paymentStatus === "fully_paid";
}

export function isExpectedFinanceOrder(order: FinanceOrderInput): boolean {
  return order.orderStatus !== "cancelled" && !isActualFinanceOrder(order);
}

export function lineGrossRevenue(item: FinanceLineInput): number {
  const unitPrice = item.unitPriceSnapshot ?? item.price ?? 0;
  return roundMoney(unitPrice * Math.max(0, item.qty || 0));
}

export function lineCost(item: FinanceLineInput): number | null {
  const unitCost = item.finalUnitCost ?? item.estimatedUnitCost;
  if (typeof unitCost !== "number" || !Number.isFinite(unitCost)) return null;
  return roundMoney(unitCost * Math.max(0, item.qty || 0));
}

export function lineNetRevenue(item: FinanceLineInput): number {
  if (typeof item.netRevenue === "number" && Number.isFinite(item.netRevenue)) {
    return roundMoney(item.netRevenue);
  }
  return roundMoney(lineGrossRevenue(item) - Math.max(0, item.discountShare ?? 0));
}

export function hasCostSnapshot(order: FinanceOrderInput): boolean {
  return order.items.every((item) => lineCost(item) !== null);
}

export function allocateDiscountByRevenue<T extends { productSlug: string; gross: number }>(
  lines: T[],
  discount: number
): Map<string, number> {
  const result = new Map<string, number>();
  const totalGross = lines.reduce((sum, line) => sum + Math.max(0, line.gross), 0);
  if (discount <= 0 || totalGross <= 0) return result;

  let allocated = 0;
  lines.forEach((line, index) => {
    const isLast = index === lines.length - 1;
    const share = isLast
      ? roundMoney(discount - allocated)
      : roundMoney((discount * Math.max(0, line.gross)) / totalGross);
    allocated = roundMoney(allocated + share);
    result.set(line.productSlug, roundMoney((result.get(line.productSlug) || 0) + share));
  });

  return result;
}

export function getStockWarning(args: {
  productSlug: string;
  trackInventory: boolean;
  currentStock: number;
  reservedStock: number;
  requestedQty: number;
}): StockWarningInput | null {
  if (!args.trackInventory) return null;
  const availableQty = (args.currentStock || 0) - (args.reservedStock || 0);
  if (availableQty >= args.requestedQty) return null;
  return {
    productSlug: args.productSlug,
    requestedQty: args.requestedQty,
    availableQty,
  };
}

export function canDeleteOrderFinancially(order: {
  orderStatus: string;
  paymentStatus: string;
  deposit?: number;
  coupon?: unknown;
  finance?: {
    inventoryReservedAt?: unknown;
    inventoryDeductedAt?: unknown;
    inventoryReleasedAt?: unknown;
    inventoryReversedAt?: unknown;
  };
}): boolean {
  if (order.orderStatus !== "pending") return false;
  if (order.paymentStatus !== "unpaid") return false;
  if ((order.deposit || 0) > 0) return false;
  if (order.coupon) return false;
  if (order.finance?.inventoryReservedAt) return false;
  if (order.finance?.inventoryDeductedAt) return false;
  if (order.finance?.inventoryReleasedAt) return false;
  if (order.finance?.inventoryReversedAt) return false;
  return true;
}

export function summarizeFinance(
  orders: FinanceOrderInput[],
  additionalCosts: AdditionalCostInput[] = []
) {
  const actualOrders = orders.filter(isActualFinanceOrder);
  const expectedOrders = orders.filter(isExpectedFinanceOrder);
  const costedActualOrders = actualOrders.filter(hasCostSnapshot);
  const legacyActualOrders = actualOrders.length - costedActualOrders.length;

  const productStats = new Map<
    string,
    {
      productSlug: string;
      qty: number;
      netRevenue: number;
      cogs: number;
      additionalCosts: number;
      grossProfit: number;
      netProfit: number;
      margin: number;
    }
  >();

  let netRevenue = 0;
  let productRevenue = 0;
  let shippingRevenue = 0;
  let cogs = 0;

  for (const order of costedActualOrders) {
    netRevenue = roundMoney(netRevenue + (order.total || 0));
    shippingRevenue = roundMoney(
      shippingRevenue + Math.max(0, (order.shippingFee || 0) - (order.discounts?.shipping || 0))
    );

    for (const item of order.items) {
      const itemRevenue = lineNetRevenue(item);
      const itemCost = lineCost(item) || 0;
      productRevenue = roundMoney(productRevenue + itemRevenue);
      cogs = roundMoney(cogs + itemCost);

      const current =
        productStats.get(item.productSlug) ||
        {
          productSlug: item.productSlug,
          qty: 0,
          netRevenue: 0,
          cogs: 0,
          additionalCosts: 0,
          grossProfit: 0,
          netProfit: 0,
          margin: 0,
        };
      current.qty += item.qty || 0;
      current.netRevenue = roundMoney(current.netRevenue + itemRevenue);
      current.cogs = roundMoney(current.cogs + itemCost);
      productStats.set(item.productSlug, current);
    }
  }

  const productRevenueTotal = Array.from(productStats.values()).reduce(
    (sum, stat) => sum + stat.netRevenue,
    0
  );

  const additionalCostTotal = additionalCosts.reduce(
    (sum, cost) => roundMoney(sum + Math.max(0, cost.amount || 0)),
    0
  );

  for (const cost of additionalCosts) {
    const amount = Math.max(0, cost.amount || 0);
    if (cost.scope === "product" && cost.productSlug) {
      const stat = productStats.get(cost.productSlug);
      if (stat) stat.additionalCosts = roundMoney(stat.additionalCosts + amount);
      continue;
    }

    if (cost.scope === "general" && productRevenueTotal > 0) {
      for (const stat of productStats.values()) {
        const share = roundMoney((amount * stat.netRevenue) / productRevenueTotal);
        stat.additionalCosts = roundMoney(stat.additionalCosts + share);
      }
    }
  }

  for (const stat of productStats.values()) {
    stat.grossProfit = roundMoney(stat.netRevenue - stat.cogs);
    stat.netProfit = roundMoney(stat.grossProfit - stat.additionalCosts);
    stat.margin = stat.netRevenue > 0 ? roundMoney((stat.netProfit / stat.netRevenue) * 100) : 0;
  }

  const grossProfit = roundMoney(productRevenue - cogs);
  const netProfit = roundMoney(netRevenue - cogs - additionalCostTotal);

  return {
    actualOrdersCount: costedActualOrders.length,
    expectedOrdersCount: expectedOrders.length,
    legacyActualOrdersCount: legacyActualOrders,
    netRevenue,
    productRevenue,
    shippingRevenue,
    cogs,
    additionalCosts: additionalCostTotal,
    grossProfit,
    netProfit,
    profitMargin: netRevenue > 0 ? roundMoney((netProfit / netRevenue) * 100) : 0,
    productStats: Array.from(productStats.values()),
  };
}
