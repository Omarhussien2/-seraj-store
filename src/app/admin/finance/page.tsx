"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type SummaryData = {
  cards: {
    netRevenue: number;
    netProfit: number;
    profitMargin: number;
    inventoryValue: number;
    lowStockCount: number;
  };
  summary: {
    cogs: number;
    grossProfit: number;
    additionalCosts: number;
    productRevenue: number;
    shippingRevenue: number;
    actualOrdersCount: number;
    expectedOrdersCount: number;
  };
  lowStockProducts: {
    productSlug: string;
    name: string;
    availableStock: number;
    lowStockThreshold: number;
  }[];
  topProducts: ProductReport[];
  bottomProducts: ProductReport[];
  legacy: { actualOrdersMissingCost: number };
};

type FinanceProduct = {
  productSlug: string;
  name: string;
  price: number;
  averageUnitCost: number;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  lowStockThreshold: number;
  trackInventory: boolean;
  expectedUnitProfit: number;
  expectedMargin: number;
  isLowStock: boolean;
  inventoryValue: number;
  movementSummary: {
    openingQty: number;
    purchasedQty: number;
    adjustmentQty: number;
    soldQty: number;
    returnedQty: number;
    totalInQty: number;
    totalOutQty: number;
  };
  recentMovements: {
    type: string;
    qty: number;
    unitCost: number;
    totalCost: number;
    orderNumber?: string;
    note?: string;
    createdAt?: string;
  }[];
};

type Expense = {
  _id: string;
  scope: "general" | "product" | "order";
  type: string;
  amount: number;
  description: string;
  productSlug?: string;
  incurredAt: string;
};

type ProductReport = {
  productSlug: string;
  name: string;
  qty: number;
  netRevenue: number;
  cogs: number;
  additionalCosts: number;
  netProfit: number;
  margin: number;
};

type ReportsData = {
  byProduct: ProductReport[];
  monthly: {
    month: string;
    netRevenue: number;
    cogs: number;
    netProfit: number;
  }[];
  legacy: { actualOrdersMissingCost: number };
};

type FinanceSettings = {
  inventoryDeductionStatus: "in_progress" | "shipped" | "delivered";
  defaultLowStockThreshold: number;
};

const expenseTypeLabels: Record<string, string> = {
  ai_subscription: "اشتراك ذكاء اصطناعي",
  labor: "ساعات عمل",
  packaging: "تغليف",
  actual_shipping: "شحن فعلي",
  design_printing: "تصميم/طباعة/إنتاج",
  other: "أخرى",
};

const expenseScopeLabels: Record<string, string> = {
  general: "عامة",
  product: "منتج",
  order: "طلب",
};

const movementTypeLabels: Record<string, string> = {
  opening: "رصيد افتتاحي",
  purchase: "شراء/إنتاج",
  adjustment: "تسوية",
  reserve: "حجز تلقائي",
  release: "إفراج تلقائي",
  sale: "بيع تلقائي",
  cancel: "إرجاع تلقائي",
};

const movementTypeHints: Record<string, string> = {
  opening: "يستخدم مرة واحدة فقط عند بدء جرد المخزن. الكمية المدخلة تمثل الموجود الفعلي حالياً.",
  purchase: "يستخدم عند شراء أو إنتاج كميات جديدة لزيادة المخزون.",
  adjustment: "يستخدم لتسوية الفروقات اليدوية (+ لزيادة المخزون، - لتقليله).",
};

function formatQty(value: number) {
  return typeof value === "number" ? value.toLocaleString("en-US") : "-";
}

function signedQty(value: number) {
  const formatted = Math.abs(value).toLocaleString("en-US");
  return value > 0 ? `+${formatted}` : value < 0 ? `-${formatted}` : "0";
}

function formatEgp(value: number) {
  return `${Math.round(value || 0).toLocaleString("en-US")} ج.م`;
}

function formatPercent(value: number) {
  return `${(value || 0).toLocaleString("en-US", { maximumFractionDigits: 1 })}%`;
}

export default function AdminFinancePage() {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [products, setProducts] = useState<FinanceProduct[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [reports, setReports] = useState<ReportsData | null>(null);
  const [settings, setSettings] = useState<FinanceSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingSlug, setSavingSlug] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [expenseForm, setExpenseForm] = useState({
    scope: "general",
    type: "other",
    amount: "",
    description: "",
    productSlug: "",
  });
  const [movementForm, setMovementForm] = useState({
    productSlug: "",
    type: "purchase",
    qty: "",
    unitCost: "",
    note: "",
  });

  const [legacyOrders, setLegacyOrders] = useState<any[]>([]);
  const [approvedOrders, setApprovedOrders] = useState<any[]>([]);
  const [legacyReviewForm, setLegacyReviewForm] = useState<Record<string, {
    items: { productSlug: string; finalUnitCost: number }[];
    actualShipping: string;
    otherCosts: string;
    deductInventory: boolean;
  }>>({});
  const [submittingLegacyId, setSubmittingLegacyId] = useState<string | null>(null);
  const [reopeningId, setReopeningId] = useState<string | null>(null);

  const showToast = useCallback((message: string, type: "success" | "error" = "success") => {
    setToast({ type, message });
    window.setTimeout(() => setToast(null), 3000);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [summaryRes, productsRes, expensesRes, reportsRes, settingsRes, legacyOrdersRes, approvedOrdersRes] = await Promise.all([
        fetch("/api/admin/finance/summary"),
        fetch("/api/admin/finance/products"),
        fetch("/api/admin/finance/expenses"),
        fetch("/api/admin/finance/reports"),
        fetch("/api/admin/finance/settings"),
        fetch("/api/admin/finance/legacy-orders"),
        fetch("/api/admin/finance/legacy-orders?status=approved"),
      ]);

      const [summaryJson, productsJson, expensesJson, reportsJson, settingsJson, legacyOrdersJson, approvedOrdersJson] =
        await Promise.all([
          summaryRes.json(),
          productsRes.json(),
          expensesRes.json(),
          reportsRes.json(),
          settingsRes.json(),
          legacyOrdersRes.json(),
          approvedOrdersRes.json(),
        ]);

      if (summaryJson.success) setSummary(summaryJson.data);
      if (productsJson.success) setProducts(productsJson.data);
      if (expensesJson.success) setExpenses(expensesJson.data);
      if (reportsJson.success) setReports(reportsJson.data);
      if (settingsJson.success) setSettings(settingsJson.data);

      if (legacyOrdersJson.success) {
        setLegacyOrders(legacyOrdersJson.data);
        const initialFormState: typeof legacyReviewForm = {};
        legacyOrdersJson.data.forEach((order: any) => {
          initialFormState[order._id] = {
            items: order.items.map((item: any) => ({
              productSlug: item.productSlug,
              finalUnitCost: item.finalUnitCost || 0
            })),
            actualShipping: "",
            otherCosts: "",
            deductInventory: false
          };
        });
        setLegacyReviewForm(initialFormState);
      }
      if (approvedOrdersJson.success) {
        setApprovedOrders(approvedOrdersJson.data);
      }
    } catch (error) {
      console.error("Failed to load finance data:", error);
      showToast("فشل تحميل بيانات المالية", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function updateProduct(index: number, field: keyof FinanceProduct, value: unknown) {
    setProducts((prev) =>
      prev.map((product, i) => {
        if (i !== index) return product;
        const updated = { ...product, [field]: value };
        if (field === "currentStock") {
          updated.availableStock = (Number(value) || 0) - (product.reservedStock || 0);
          updated.isLowStock =
            Boolean(product.trackInventory) &&
            product.lowStockThreshold > 0 &&
            updated.availableStock <= product.lowStockThreshold;
        }
        if (field === "trackInventory") {
          updated.isLowStock =
            Boolean(value) &&
            product.lowStockThreshold > 0 &&
            product.availableStock <= product.lowStockThreshold;
        }
        if (field === "lowStockThreshold") {
          updated.isLowStock =
            Boolean(product.trackInventory) &&
            (Number(value) || 0) > 0 &&
            product.availableStock <= (Number(value) || 0);
        }
        return updated;
      })
    );
  }

  async function saveProduct(product: FinanceProduct) {
    setSavingSlug(product.productSlug);
    try {
      const res = await fetch("/api/admin/finance/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productSlug: product.productSlug,
          averageUnitCost: Number(product.averageUnitCost) || 0,
          currentStock: Number(product.currentStock) || 0,
          lowStockThreshold: Number(product.lowStockThreshold) || 0,
          trackInventory: Boolean(product.trackInventory),
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Save failed");
      showToast("تم حفظ بيانات المنتج المالية");
      loadData();
    } catch (error) {
      console.error("Failed to save finance product:", error);
      showToast("فشل حفظ بيانات المنتج", "error");
    } finally {
      setSavingSlug(null);
    }
  }

  async function createExpense() {
    try {
      const amount = Number(expenseForm.amount);
      const res = await fetch("/api/admin/finance/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope: expenseForm.scope,
          type: expenseForm.type,
          amount,
          description: expenseForm.description,
          productSlug:
            expenseForm.scope === "product" ? expenseForm.productSlug || undefined : undefined,
          allocationMethod: expenseForm.scope === "general" ? "net_revenue" : "none",
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Expense failed");
      setExpenseForm({
        scope: "general",
        type: "other",
        amount: "",
        description: "",
        productSlug: "",
      });
      showToast("تمت إضافة التكلفة");
      loadData();
    } catch (error) {
      console.error("Failed to create expense:", error);
      showToast("فشل إضافة التكلفة", "error");
    }
  }

  async function createMovement() {
    const qty = Number(movementForm.qty) || 0;
    if (qty === 0) {
      showToast("الكمية لا يمكن أن تكون صفراً", "error");
      return;
    }
    if (movementForm.type !== "adjustment" && qty < 0) {
      showToast("الكمية يجب أن تكون موجبة لعمليات الشراء والرصيد الافتتاحي", "error");
      return;
    }
    try {
      const res = await fetch("/api/admin/finance/inventory-movements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productSlug: movementForm.productSlug,
          type: movementForm.type,
          qty,
          unitCost: movementForm.unitCost ? Number(movementForm.unitCost) : undefined,
          note: movementForm.note || undefined,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Movement failed");
      setMovementForm({ productSlug: "", type: "purchase", qty: "", unitCost: "", note: "" });
      showToast("تم تسجيل حركة المخزون");
      loadData();
    } catch (error) {
      console.error("Failed to create inventory movement:", error);
      showToast(error instanceof Error ? error.message : "فشل تسجيل حركة المخزون", "error");
    }
  }

  async function saveSettings() {
    if (!settings) return;
    try {
      const res = await fetch("/api/admin/finance/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Settings failed");
      showToast("تم حفظ الإعدادات");
      loadData();
    } catch (error) {
      console.error("Failed to save finance settings:", error);
      showToast("فشل حفظ الإعدادات", "error");
    }
  }

  async function submitLegacyReview(orderId: string) {
    const formData = legacyReviewForm[orderId];
    if (!formData) return;

    setSubmittingLegacyId(orderId);
    try {
      const res = await fetch(`/api/admin/finance/legacy-orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: formData.items,
          actualShipping: formData.actualShipping ? Number(formData.actualShipping) : undefined,
          otherCosts: formData.otherCosts ? Number(formData.otherCosts) : undefined,
          deductInventory: formData.deductInventory,
        }),
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Review failed");

      showToast("تم اعتماد الطلب ماليًا بنجاح");
      loadData();
    } catch (error) {
      console.error("Failed to submit legacy review:", error);
      showToast("فشل اعتماد الطلب ماليًا", "error");
    } finally {
      setSubmittingLegacyId(null);
    }
  }

  async function reopenOrder(orderId: string) {
    setReopeningId(orderId);
    try {
      const res = await fetch(`/api/admin/finance/legacy-orders/${orderId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Reopen failed");
      showToast("تم إعادة فتح الطلب للتعديل");
      loadData();
    } catch (error) {
      console.error("Failed to reopen order:", error);
      showToast("فشل إعادة فتح الطلب", "error");
    } finally {
      setReopeningId(null);
    }
  }

  const selectedMovementProduct = products.find(
    (p) => p.productSlug === movementForm.productSlug
  );

  const movementStockPreview = selectedMovementProduct
    ? selectedMovementProduct.currentStock + (Number(movementForm.qty) || 0)
    : null;

  const recentInventoryMovements = products
    .flatMap((p) =>
      (p.recentMovements || []).map((m) => ({
        ...m,
        productName: p.name,
        productSlug: p.productSlug,
      }))
    )
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, 12);

  if (loading) {
    return <div className="py-12 text-center text-muted-foreground">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-6" dir="rtl">
      {toast && (
        <div
          className={`fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-lg px-5 py-3 text-sm font-semibold text-white shadow-lg ${
            toast.type === "success" ? "bg-emerald-600" : "bg-red-600"
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">المالية والمخزون</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            الربح الفعلي يعتمد على الطلبات المسلمة والمدفوعة بالكامل فقط.
          </p>
        </div>
        <Button type="button" variant="outline" onClick={loadData}>
          تحديث
        </Button>
      </div>

      {summary && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <MetricCard title="صافي الإيرادات" value={formatEgp(summary.cards.netRevenue)} />
          <MetricCard
            title="صافي الربح"
            value={formatEgp(summary.cards.netProfit)}
            tone={summary.cards.netProfit >= 0 ? "good" : "bad"}
          />
          <MetricCard title="هامش الربح" value={formatPercent(summary.cards.profitMargin)} />
          <MetricCard title="قيمة المخزون" value={formatEgp(summary.cards.inventoryValue)} />
          <MetricCard title="منخفض المخزون" value={`${summary.cards.lowStockCount}`} />
        </div>
      )}

      <Tabs defaultValue="overview" dir="rtl">
        <TabsList className="mb-4 flex h-auto flex-wrap gap-1 bg-gray-100 p-1">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="products">المنتجات</TabsTrigger>
          <TabsTrigger value="expenses">التكاليف</TabsTrigger>
          <TabsTrigger value="reports">التقارير</TabsTrigger>
          <TabsTrigger value="settings">الإعدادات</TabsTrigger>
          <TabsTrigger value="legacy">الطلبـات السـابقة</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {summary && (
            <>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
                <MetricCard title="تكلفة البضاعة المباعة (COGS)" value={formatEgp(summary.summary.cogs)} />
                <MetricCard title="الربح الإجمالي" value={formatEgp(summary.summary.grossProfit)} />
                <MetricCard
                  title="التكاليف الإضافية"
                  value={formatEgp(summary.summary.additionalCosts)}
                />
                <MetricCard
                  title="طلبات بتكلفة قديمة"
                  value={`${summary.legacy.actualOrdersMissingCost}`}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <ProductRankTable title="الأكثر ربحية" products={summary.topProducts} />
                <ProductRankTable title="الأقل ربحية" products={summary.bottomProducts} />
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">تنبيهات نقص المخزون</CardTitle>
                </CardHeader>
                <CardContent>
                  {summary.lowStockProducts.length === 0 ? (
                    <p className="text-sm text-muted-foreground">لا توجد تنبيهات حالية</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>المنتج</TableHead>
                          <TableHead>المتاح</TableHead>
                          <TableHead>حد التنبيه</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {summary.lowStockProducts.map((product) => (
                          <TableRow key={product.productSlug}>
                            <TableCell>{product.name}</TableCell>
                            <TableCell>{product.availableStock}</TableCell>
                            <TableCell>{product.lowStockThreshold}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">حركة مخزون</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-6">
                <Select
                  value={movementForm.productSlug || undefined}
                  onValueChange={(value) => {
                    if (value) setMovementForm((prev) => ({ ...prev, productSlug: value }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="المنتج" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.productSlug} value={product.productSlug}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={movementForm.type}
                  onValueChange={(value) => {
                    if (value) setMovementForm((prev) => ({ ...prev, type: value }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="opening">رصيد افتتاحي</SelectItem>
                    <SelectItem value="purchase">شراء/إنتاج</SelectItem>
                    <SelectItem value="adjustment">تسوية</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  placeholder={movementForm.type === "adjustment" ? "فرق التسوية +/-" : "الكمية"}
                  value={movementForm.qty}
                  onChange={(e) => setMovementForm((prev) => ({ ...prev, qty: e.target.value }))}
                />
                <Input
                  type="number"
                  placeholder="تكلفة الوحدة"
                  value={movementForm.unitCost}
                  onChange={(e) =>
                    setMovementForm((prev) => ({ ...prev, unitCost: e.target.value }))
                  }
                />
                <Input
                  placeholder="ملاحظة"
                  value={movementForm.note}
                  onChange={(e) => setMovementForm((prev) => ({ ...prev, note: e.target.value }))}
                />
                <Button type="button" onClick={createMovement} disabled={!movementForm.productSlug}>
                  تسجيل
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-3 rounded-md border bg-muted/30 p-3 text-sm md:grid-cols-3">
                <div>
                  <span className="font-semibold">معنى الحركة: </span>
                  <span className="text-muted-foreground">
                    {movementTypeHints[movementForm.type] || "حركة مخزون"}
                  </span>
                </div>
                <div>
                  <span className="font-semibold">المخزون الحالي: </span>
                  <span>{selectedMovementProduct ? formatQty(selectedMovementProduct.currentStock) : "-"}</span>
                </div>
                <div>
                  <span className="font-semibold">بعد الحركة: </span>
                  <span>{movementStockPreview === null ? "-" : formatQty(movementStockPreview)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">المنتجات والمخزون</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>المنتج</TableHead>
                    <TableHead>المخزون (متاح/محجوز)</TableHead>
                    <TableHead>إحصائيات المخزن</TableHead>
                    <TableHead>قيمة المخزون</TableHead>
                    <TableHead>تكلفة الوحدة</TableHead>
                    <TableHead>سعر البيع</TableHead>
                    <TableHead>ربح الوحدة</TableHead>
                    <TableHead>حد التنبيه</TableHead>
                    <TableHead>تتبع</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product, index) => (
                    <TableRow key={product.productSlug}>
                      <TableCell className="min-w-48 font-medium">
                        {product.name}
                        {product.isLowStock && (
                          <Badge className="mr-2 bg-red-100 text-red-700">منخفض</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          className="w-24 font-mono"
                          value={product.currentStock}
                          onChange={(e) =>
                            updateProduct(index, "currentStock", Number(e.target.value) || 0)
                          }
                        />
                        <div className="mt-1 text-xs flex flex-col gap-1">
                          <span className="text-orange-600">محجوز: {formatQty(product.reservedStock)}</span>
                          <span className="text-emerald-600 font-bold">متاح للبيع: {formatQty(product.availableStock)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const totalIn = product.movementSummary?.totalInQty || 0;
                          const sold = product.movementSummary?.soldQty || 0;
                          const totalOut = product.movementSummary?.totalOutQty || 0;
                          const missing = totalOut - sold;
                          const soldPercent = totalIn > 0 ? Math.round((sold / totalIn) * 100) : 0;
                          return (
                            <div className="text-xs leading-5 min-w-36">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">إجمالي الدخول:</span>
                                <span className="font-medium text-emerald-600">{formatQty(totalIn)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">إجمالي المباع:</span>
                                <span className="font-medium text-blue-600">{formatQty(sold)} <span className="text-[10px]">({soldPercent}%)</span></span>
                              </div>
                              {missing > 0 && (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">نواقص/تسويات:</span>
                                  <span className="font-medium text-orange-600">{formatQty(missing)}</span>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </TableCell>
                      <TableCell>
                        {formatEgp(product.inventoryValue || 0)}
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          className="w-28"
                          value={product.averageUnitCost}
                          onChange={(e) =>
                            updateProduct(index, "averageUnitCost", Number(e.target.value) || 0)
                          }
                        />
                      </TableCell>
                      <TableCell>{formatEgp(product.price)}</TableCell>
                      <TableCell>
                        {formatEgp(product.price - (Number(product.averageUnitCost) || 0))}
                        <div className="text-xs text-muted-foreground">
                          {formatPercent(
                            product.price > 0
                              ? ((product.price - (Number(product.averageUnitCost) || 0)) /
                                  product.price) *
                                  100
                              : 0
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          className="w-24"
                          value={product.lowStockThreshold}
                          onChange={(e) =>
                            updateProduct(
                              index,
                              "lowStockThreshold",
                              Number(e.target.value) || 0
                            )
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={product.trackInventory ? "true" : "false"}
                          onValueChange={(value) => {
                            if (value) updateProduct(index, "trackInventory", value === "true");
                          }}
                        >
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="true">نعم</SelectItem>
                            <SelectItem value="false">لا</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => saveProduct(product)}
                          disabled={savingSlug === product.productSlug}
                        >
                          حفظ
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">آخر حركات المخزون</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {recentInventoryMovements.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  لا توجد حركات مخزون مسجلة بعد
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>المنتج</TableHead>
                      <TableHead>الحركة</TableHead>
                      <TableHead>الكمية</TableHead>
                      <TableHead>تكلفة الوحدة</TableHead>
                      <TableHead>الطلب/الملاحظة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentInventoryMovements.map((movement, idx) => (
                      <TableRow key={`${movement.productSlug}-${movement.createdAt}-${idx}`}>
                        <TableCell>
                          {movement.createdAt
                            ? new Date(movement.createdAt).toLocaleDateString("ar-EG")
                            : "-"}
                        </TableCell>
                        <TableCell className="font-medium">{movement.productName}</TableCell>
                        <TableCell>{movementTypeLabels[movement.type] || movement.type}</TableCell>
                        <TableCell>{signedQty(movement.qty)}</TableCell>
                        <TableCell>{formatEgp(movement.unitCost)}</TableCell>
                        <TableCell className="min-w-40 text-sm text-muted-foreground">
                          {movement.orderNumber || movement.note || "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">إضافة تكلفة</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-6">
              <Select
                value={expenseForm.scope}
                onValueChange={(value) => {
                  if (value) setExpenseForm((prev) => ({ ...prev, scope: value }));
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">عامة</SelectItem>
                  <SelectItem value="product">منتج</SelectItem>
                  <SelectItem value="order">طلب</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={expenseForm.type}
                onValueChange={(value) => {
                  if (value) setExpenseForm((prev) => ({ ...prev, type: value }));
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(expenseTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                placeholder="المبلغ"
                value={expenseForm.amount}
                onChange={(e) => setExpenseForm((prev) => ({ ...prev, amount: e.target.value }))}
              />
              <Input
                placeholder="الوصف"
                value={expenseForm.description}
                onChange={(e) =>
                  setExpenseForm((prev) => ({ ...prev, description: e.target.value }))
                }
              />
              <Select
                value={expenseForm.productSlug || undefined}
                disabled={expenseForm.scope !== "product"}
                onValueChange={(value) => {
                  if (value) setExpenseForm((prev) => ({ ...prev, productSlug: value }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر المنتج" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.productSlug} value={product.productSlug}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                onClick={createExpense}
                disabled={!expenseForm.amount || !expenseForm.description}
              >
                إضافة
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">آخر التكاليف</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>النوع</TableHead>
                    <TableHead>النطاق</TableHead>
                    <TableHead>الوصف</TableHead>
                    <TableHead>المبلغ</TableHead>
                    <TableHead>التاريخ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((expense) => (
                    <TableRow key={expense._id}>
                      <TableCell>{expenseTypeLabels[expense.type] || expense.type}</TableCell>
                      <TableCell>{expenseScopeLabels[expense.scope] || expense.scope}</TableCell>
                      <TableCell>{expense.description}</TableCell>
                      <TableCell>{formatEgp(expense.amount)}</TableCell>
                      <TableCell>{new Date(expense.incurredAt).toLocaleDateString("ar-EG")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">أرباح حسب المنتج</CardTitle>
            </CardHeader>
            <CardContent>
              <ProductReportTable products={reports?.byProduct || []} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">أرباح حسب الشهر</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الشهر</TableHead>
                    <TableHead>صافي الإيراد</TableHead>
                    <TableHead>تكلفة البضاعة (COGS)</TableHead>
                    <TableHead>صافي الربح</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(reports?.monthly || []).map((row) => (
                    <TableRow key={row.month}>
                      <TableCell>{row.month}</TableCell>
                      <TableCell>{formatEgp(row.netRevenue)}</TableCell>
                      <TableCell>{formatEgp(row.cogs)}</TableCell>
                      <TableCell>{formatEgp(row.netProfit)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">إعدادات الحساب والمخزون</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>خصم المخزون عند</Label>
                <Select
                  value={settings?.inventoryDeductionStatus || "in_progress"}
                  onValueChange={(value) => {
                    if (!value) return;
                    setSettings((prev) =>
                      prev
                        ? {
                            ...prev,
                            inventoryDeductionStatus:
                              value as FinanceSettings["inventoryDeductionStatus"],
                          }
                        : prev
                    );
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in_progress">جاري التنفيذ</SelectItem>
                    <SelectItem value="shipped">تم الشحن</SelectItem>
                    <SelectItem value="delivered">تم التسليم</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>حد تنبيه افتراضي</Label>
                <Input
                  type="number"
                  value={settings?.defaultLowStockThreshold || 0}
                  onChange={(e) =>
                    setSettings((prev) =>
                      prev
                        ? { ...prev, defaultLowStockThreshold: Number(e.target.value) || 0 }
                        : prev
                    )
                  }
                />
              </div>
              <div className="flex items-end">
                <Button type="button" onClick={saveSettings}>
                  حفظ الإعدادات
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="legacy" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">اعتماد الطلبات السابقة (التي ينقصها تكلفة)</CardTitle>
            </CardHeader>
            <CardContent>
              {legacyOrders.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">لا توجد طلبات سابقة معلقة ماليًا</p>
              ) : (
                <div className="space-y-6">
                  {legacyOrders.map((order) => (
                    <div key={order._id} className="border rounded-lg p-4 bg-gray-50/50 space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
                        <div className="space-y-1 text-right">
                          <span className="font-semibold text-base text-gray-800">{order.orderNumber}</span>
                          <span className="text-xs text-muted-foreground mr-3">
                            {new Date(order.createdAt).toLocaleDateString("ar-EG")}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant="outline">{order.customerName}</Badge>
                          <Badge variant="outline">{order.customerPhone}</Badge>
                          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
                            {order.orderStatus === "delivered" ? "تم التسليم" : order.orderStatus}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Items Costs */}
                        <div className="space-y-3 text-right">
                          <Label className="text-sm font-semibold">تكلفة العناصر وقت البيع</Label>
                          {order.items.map((item: any, index: number) => {
                            const currentProdFinance = products.find(p => p.productSlug === item.productSlug);
                            const recCost = currentProdFinance?.averageUnitCost || 0;
                            const itemVal = legacyReviewForm[order._id]?.items.find(i => i.productSlug === item.productSlug)?.finalUnitCost ?? 0;

                            return (
                              <div key={item.productSlug} className="flex items-center justify-between gap-3 border-b border-dashed pb-2 last:border-0 last:pb-0">
                                <div className="text-sm text-gray-700 flex-1">
                                  <span>{item.name}</span>
                                  <span className="text-xs text-muted-foreground block">
                                    الكمية: {item.qty} | سعر البيع: {formatEgp(item.price)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Label className="text-xs text-muted-foreground">تكلفة القطعة:</Label>
                                  <div className="flex flex-col items-end">
                                    <Input
                                      type="number"
                                      className={`w-24 h-8 text-sm ${(itemVal || recCost) === 0 ? "border-red-400 bg-red-50/50 focus-visible:ring-red-400" : ""}`}
                                      placeholder={`${recCost}`}
                                      value={itemVal === 0 ? "" : itemVal}
                                      onChange={(e) => {
                                        const val = Number(e.target.value) || 0;
                                        setLegacyReviewForm(prev => {
                                          const orderForm = prev[order._id];
                                          if (!orderForm) return prev;
                                          return {
                                            ...prev,
                                            [order._id]: {
                                              ...orderForm,
                                              items: orderForm.items.map(i => 
                                                i.productSlug === item.productSlug ? { ...i, finalUnitCost: val } : i
                                              )
                                            }
                                          };
                                        });
                                      }}
                                    />
                                    {(itemVal || recCost) === 0 && (
                                      <span className="text-[9px] text-red-500 font-semibold mt-0.5">التكلفة 0!</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Extra Costs & Options */}
                        <div className="space-y-3 bg-white p-3 rounded-md border text-right">
                          <Label className="text-sm font-semibold">التكاليف الإضافية والخيارات</Label>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label className="text-xs">الشحن الفعلي (ج.م)</Label>
                              <Input
                                type="number"
                                className="h-8"
                                placeholder={`الافتراضي: ${order.shippingFee}`}
                                value={legacyReviewForm[order._id]?.actualShipping || ""}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setLegacyReviewForm(prev => ({
                                    ...prev,
                                    [order._id]: {
                                      ...prev[order._id],
                                      actualShipping: val
                                    }
                                  }));
                                }}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">تكاليف إضافية (ج.م)</Label>
                              <Input
                                type="number"
                                className="h-8"
                                placeholder="0"
                                value={legacyReviewForm[order._id]?.otherCosts || ""}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setLegacyReviewForm(prev => ({
                                    ...prev,
                                    [order._id]: {
                                      ...prev[order._id],
                                      otherCosts: val
                                    }
                                  }));
                                }}
                              />
                            </div>
                          </div>

                          <div className="flex items-center gap-2 pt-2 border-t mt-2">
                            <input
                              type="checkbox"
                              id={`deduct-${order._id}`}
                              className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                              checked={legacyReviewForm[order._id]?.deductInventory || false}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setLegacyReviewForm(prev => ({
                                  ...prev,
                                  [order._id]: {
                                    ...prev[order._id],
                                    deductInventory: checked
                                  }
                                }));
                              }}
                            />
                            <Label htmlFor={`deduct-${order._id}`} className="text-xs font-normal cursor-pointer select-none">
                              تطبيق أثر مخزني (خصم المنتجات من المخزون الحالي مجددًا)
                            </Label>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end pt-2 border-t">
                        <Button
                          type="button"
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                          disabled={submittingLegacyId === order._id}
                          onClick={() => submitLegacyReview(order._id)}
                        >
                          {submittingLegacyId === order._id ? "جاري الاعتماد..." : "اعتماد في الحسابات"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Approved Orders - editable */}
          {approvedOrders.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">الطلبات المعتمدة ماليًا (يمكن إعادة فتحها للتعديل)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {approvedOrders.map((order) => (
                    <div key={order._id} className="flex flex-wrap items-center justify-between gap-3 border rounded-lg p-3 bg-emerald-50/30">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-sm">{order.orderNumber}</span>
                        <Badge variant="outline">{order.customerName}</Badge>
                        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300">✓ معتمد</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {order.items?.map((i: any) => `${i.name} (تكلفة: ${i.finalUnitCost})`).join(" | ")}
                        </span>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="text-orange-600 border-orange-300 hover:bg-orange-50"
                          disabled={reopeningId === order._id}
                          onClick={() => reopenOrder(order._id)}
                        >
                          {reopeningId === order._id ? "جاري الإعادة..." : "🔄 إعادة فتح للتعديل"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MetricCard({
  title,
  value,
  tone,
}: {
  title: string;
  value: string;
  tone?: "good" | "bad";
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className={`text-2xl font-bold ${tone === "bad" ? "text-red-600" : ""}`}>
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

function ProductRankTable({ title, products }: { title: string; products: ProductReport[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ProductReportTable products={products} compact />
      </CardContent>
    </Card>
  );
}

function ProductReportTable({
  products,
  compact = false,
}: {
  products: ProductReport[];
  compact?: boolean;
}) {
  if (products.length === 0) {
    return <p className="text-sm text-muted-foreground">لا توجد بيانات دقيقة بعد</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>المنتج</TableHead>
          <TableHead>الكمية</TableHead>
          <TableHead>صافي الإيراد</TableHead>
          {!compact && <TableHead>تكلفة البضاعة (COGS)</TableHead>}
          {!compact && <TableHead>تكاليف إضافية</TableHead>}
          <TableHead>صافي الربح</TableHead>
          <TableHead>الهامش</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((product) => (
          <TableRow key={product.productSlug}>
            <TableCell className="font-medium">{product.name || product.productSlug}</TableCell>
            <TableCell>{product.qty}</TableCell>
            <TableCell>{formatEgp(product.netRevenue)}</TableCell>
            {!compact && <TableCell>{formatEgp(product.cogs)}</TableCell>}
            {!compact && <TableCell>{formatEgp(product.additionalCosts)}</TableCell>}
            <TableCell>{formatEgp(product.netProfit)}</TableCell>
            <TableCell>{formatPercent(product.margin)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
