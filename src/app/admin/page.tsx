"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface RecentOrder {
  _id: string;
  orderNumber: string;
  customerName: string;
  total: number;
  deposit?: number;
  remaining?: number;
  paymentMode?: "full" | "deposit";
  orderStatus: string;
  paymentStatus: string;
  createdAt: string;
}

interface TopColoringItem {
  _id: string;
  slug: string;
  title: string;
  thumbnail: string;
  savedCount: number;
  printCount: number;
  categorySlug: string;
}

interface Stats {
  totalOrders: number;
  pendingOrders: number;
  pendingStories: number;
  totalRevenue: number;
  revenue7d: number;
  revenue30d: number;
  revenuePrev30d: number;
  depositPendingCount: number;
  depositPendingRemaining: number;
  oldPendingOrdersCount: number;
  recentOrders: RecentOrder[];
  topColoringItems?: TopColoringItem[];
}

const orderStatusLabels: Record<string, string> = {
  pending: "جديد",
  in_progress: "جاري التنفيذ",
  shipped: "تم الشحن",
  delivered: "تم التسليم",
  cancelled: "ملغي",
};

const orderStatusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  in_progress: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-gray-200 text-gray-700",
};

const paymentStatusLabels: Record<string, string> = {
  unpaid: "لم يُدفع",
  deposit_paid: "عربون مدفوع",
  fully_paid: "مدفوع بالكامل",
};

const paymentStatusColors: Record<string, string> = {
  unpaid: "bg-red-100 text-red-800",
  deposit_paid: "bg-amber-100 text-amber-800",
  fully_paid: "bg-emerald-100 text-emerald-800",
};

function formatEgp(n: number): string {
  return `${Math.round(n).toLocaleString("ar-EG")} ج.م`;
}

function formatTrend(current: number, previous: number): {
  text: string;
  positive: boolean;
} | null {
  if (!previous || previous === 0) return null;
  const delta = ((current - previous) / previous) * 100;
  const positive = delta >= 0;
  const sign = positive ? "▲" : "▼";
  return { text: `${sign} ${Math.abs(delta).toFixed(0)}٪ مقارنة بالشهر السابق`, positive };
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [shippingFee, setShippingFee] = useState(35);
  const [freeShippingAbove, setFreeShippingAbove] = useState(0);
  const [checkoutContinueShoppingText, setCheckoutContinueShoppingText] = useState("كمل تسوق");
  const [checkoutDeliveryEstimateText, setCheckoutDeliveryEstimateText] = useState("عادةً الطلب بيوصل خلال 5 إلى 7 أيام عمل.");
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  useEffect(() => {
    fetch("/api/stats")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setStats(json.data);
      })
      .finally(() => setLoading(false));

    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setShippingFee(json.data.shippingFee);
          setFreeShippingAbove(json.data.freeShippingAbove);
          setCheckoutContinueShoppingText(json.data.checkoutContinueShoppingText || "كمل تسوق");
          setCheckoutDeliveryEstimateText(json.data.checkoutDeliveryEstimateText || "عادةً الطلب بيوصل خلال 5 إلى 7 أيام عمل.");
        }
      })
      .catch(() => {});
  }, []);

  function saveSettings() {
    setSettingsLoading(true);
    setSettingsSaved(false);
    fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shippingFee,
        freeShippingAbove,
        checkoutContinueShoppingText,
        checkoutDeliveryEstimateText,
      }),
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setSettingsSaved(true);
      })
      .finally(() => setSettingsLoading(false));
  }

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">جاري التحميل...</div>;
  }

  if (!stats) {
    return <div className="text-center py-12 text-red-600">فشل تحميل البيانات</div>;
  }

  const trend30 = formatTrend(stats.revenue30d, stats.revenuePrev30d);

  // Quick action items — links + counts so the admin can see what's pending at a glance.
  const quickActions = [
    {
      href: "/admin/orders?status=pending",
      label: "طلبات جديدة",
      count: stats.pendingOrders,
      icon: "🆕",
      tone: "bg-yellow-50 hover:bg-yellow-100 border-yellow-200",
    },
    {
      href: "/admin/orders",
      label: "عربون لم يُحصَّل بعد",
      count: stats.depositPendingCount,
      icon: "💳",
      tone: "bg-amber-50 hover:bg-amber-100 border-amber-200",
    },
    {
      href: "/admin/products",
      label: "إضافة منتج",
      count: null as number | null,
      icon: "➕",
      tone: "bg-emerald-50 hover:bg-emerald-100 border-emerald-200",
    },
    {
      href: "/admin/chat-settings",
      label: "إعدادات الشات",
      count: null as number | null,
      icon: "💬",
      tone: "bg-blue-50 hover:bg-blue-100 border-blue-200",
    },
    {
      href: "/admin/coloring",
      label: "كشكول التلوين",
      count: null as number | null,
      icon: "🎨",
      tone: "bg-orange-50 hover:bg-orange-100 border-orange-200",
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Alerts */}
      {stats.oldPendingOrdersCount > 0 && (
        <div className="rounded-md border border-orange-300 bg-orange-50 px-4 py-3 text-sm flex items-center gap-2">
          <span className="text-xl">⏰</span>
          <span>
            عندك <strong>{stats.oldPendingOrdersCount}</strong> طلب مفتوح من أكتر من ٢٤ ساعة —{" "}
            <Link href="/admin/orders?status=pending" className="underline font-semibold">
              راجعهم
            </Link>
          </span>
        </div>
      )}

      {stats.depositPendingCount > 0 && (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm flex items-center gap-2">
          <span className="text-xl">💰</span>
          <span>
            <strong>{stats.depositPendingCount}</strong> طلب بعربون متبقّى يجمعه{" "}
            <strong>{formatEgp(stats.depositPendingRemaining)}</strong> كاش عند التوصيل —{" "}
            <Link href="/admin/orders" className="underline font-semibold">
              قائمة الطلبات
            </Link>
          </span>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {quickActions.map((qa) => (
          <Link
            key={qa.label}
            href={qa.href}
            className={`flex items-center gap-3 rounded-lg border ${qa.tone} px-4 py-3 transition-colors`}
          >
            <span className="text-2xl">{qa.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm">{qa.label}</div>
              {qa.count !== null && (
                <div className="text-xs text-muted-foreground">
                  {qa.count > 0 ? `${qa.count} في الانتظار` : "كله مظبوط"}
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">إجمالي الطلبات</CardTitle>
            <span className="text-2xl">📦</span>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.totalOrders}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">طلبات جديدة</CardTitle>
            <span className="text-2xl">🆕</span>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.pendingOrders}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">قصص بانتظار المراجعة</CardTitle>
            <span className="text-2xl">📖</span>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.pendingStories}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">إجمالي الإيرادات</CardTitle>
            <span className="text-2xl">💰</span>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatEgp(stats.totalRevenue)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue period cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">آخر ٧ أيام</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatEgp(stats.revenue7d)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">آخر ٣٠ يوم</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatEgp(stats.revenue30d)}</p>
            {trend30 && (
              <p className={`text-xs mt-1 ${trend30.positive ? "text-emerald-600" : "text-red-600"}`}>
                {trend30.text}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">عربون منتظر تحصيله</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatEgp(stats.depositPendingRemaining)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.depositPendingCount} طلب
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle>آخر ١٠ طلبات</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recentOrders.length === 0 ? (
            <p className="text-muted-foreground text-sm">لا توجد طلبات بعد</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم الطلب</TableHead>
                  <TableHead>العميل</TableHead>
                  <TableHead>المبلغ</TableHead>
                  <TableHead>حالة الدفع</TableHead>
                  <TableHead>حالة الطلب</TableHead>
                  <TableHead>التاريخ</TableHead>
                  <TableHead className="text-left">إجراء</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.recentOrders.map((order) => (
                  <TableRow key={order._id}>
                    <TableCell className="font-mono text-sm">{order.orderNumber}</TableCell>
                    <TableCell>{order.customerName}</TableCell>
                    <TableCell>
                      {formatEgp(order.total)}
                      {order.paymentMode === "deposit" && order.remaining ? (
                        <div className="text-xs text-amber-700">
                          متبقي {formatEgp(order.remaining)}
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={paymentStatusColors[order.paymentStatus] || ""}
                      >
                        {paymentStatusLabels[order.paymentStatus] || order.paymentStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={orderStatusColors[order.orderStatus] || ""}
                      >
                        {orderStatusLabels[order.orderStatus] || order.orderStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString("ar-EG")}
                    </TableCell>
                    <TableCell className="text-left">
                      <Link href="/admin/orders" className="text-blue-600 hover:underline text-sm">
                        عرض
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Top coloring sheets — quick visibility into which assets are
          driving the workbook customizer (savedCount = added to a kit). */}
      {stats.topColoringItems && stats.topColoringItems.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>🎨 أكثر رسومات التلوين طلباً</CardTitle>
            <Link href="/admin/coloring/items" className="text-sm text-blue-600 hover:underline">
              إدارة الرسومات →
            </Link>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {stats.topColoringItems.map((item, idx) => (
                <Link
                  key={item._id}
                  href={`/admin/coloring/items?q=${encodeURIComponent(item.slug)}`}
                  className="group block rounded-xl border border-gray-200 overflow-hidden hover:border-amber-400 hover:shadow-md transition"
                >
                  <div className="relative aspect-square bg-gray-50 flex items-center justify-center">
                    <span className="absolute top-1 right-1 text-xs font-bold bg-amber-100 text-amber-800 rounded-full w-6 h-6 flex items-center justify-center">
                      {idx + 1}
                    </span>
                    {item.thumbnail ? (
                      <img
                        src={item.thumbnail}
                        alt={item.title}
                        className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform"
                        loading="lazy"
                      />
                    ) : (
                      <span className="text-3xl">🎨</span>
                    )}
                  </div>
                  <div className="p-2 text-center">
                    <p className="text-xs font-bold truncate" title={item.title}>
                      {item.title}
                    </p>
                    <p className="text-[11px] text-gray-500 mt-1">
                      {item.savedCount.toLocaleString("ar-EG")} اختيار · {item.printCount.toLocaleString("ar-EG")} طبع
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Shipping & checkout copy settings */}
      <Card>
        <CardHeader>
          <CardTitle>🚚 إعدادات الشحن والـ Checkout</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>رسوم الشحن (ج.م)</Label>
              <Input
                type="number"
                min="0"
                value={shippingFee}
                onChange={(e) => setShippingFee(parseInt(e.target.value, 10) || 0)}
              />
              <p className="text-xs text-muted-foreground">رسوم الشحن لكل طلب. ضع 0 للشحن المجاني.</p>
            </div>
            <div className="space-y-2">
              <Label>شحن مجاني فوق (ج.م)</Label>
              <Input
                type="number"
                min="0"
                value={freeShippingAbove}
                onChange={(e) => setFreeShippingAbove(parseInt(e.target.value, 10) || 0)}
              />
              <p className="text-xs text-muted-foreground">لو الطلب فوق هذا المبلغ الشحن يكون مجاني. ضع 0 عشان مفيش شحن مجاني أبداً.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t">
            <div className="space-y-2">
              <Label>نص زر كمل التسوق</Label>
              <Input
                value={checkoutContinueShoppingText}
                onChange={(e) => setCheckoutContinueShoppingText(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>جملة موعد وصول الطلب</Label>
              <Input
                value={checkoutDeliveryEstimateText}
                onChange={(e) => setCheckoutDeliveryEstimateText(e.target.value)}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            💬 تحكّم في ودجت الشات (تشغيل/إيقاف، صفحات الظهور، النبضة، الذكاء الاصطناعي…) من{" "}
            <Link href="/admin/chat-settings" className="underline text-blue-600">
              إعدادات سِراج (الشات)
            </Link>
            .
          </p>
          <div className="flex items-center gap-3">
            <Button onClick={saveSettings} disabled={settingsLoading}>
              {settingsLoading ? "جاري الحفظ..." : "حفظ الإعدادات"}
            </Button>
            {settingsSaved && <span className="text-sm text-green-600 font-semibold">تم الحفظ ✓</span>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
