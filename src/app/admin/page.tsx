"use client";

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

interface Stats {
  totalOrders: number;
  pendingOrders: number;
  pendingStories: number;
  totalRevenue: number;
  recentOrders: {
    _id: string;
    orderNumber: string;
    customerName: string;
    total: number;
    orderStatus: string;
    paymentStatus: string;
    createdAt: string;
  }[];
}

const statusLabels: Record<string, string> = {
  pending: "جديد",
  in_progress: "جاري التنفيذ",
  shipped: "تم الشحن",
  delivered: "تم التسليم",
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  in_progress: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [shippingFee, setShippingFee] = useState(35);
  const [freeShippingAbove, setFreeShippingAbove] = useState(0);
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
      body: JSON.stringify({ shippingFee, freeShippingAbove }),
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

  const statCards = [
    { title: "إجمالي الطلبات", value: stats.totalOrders, icon: "📦" },
    { title: "طلبات جديدة", value: stats.pendingOrders, icon: "🆕" },
    { title: "قصص بانتظار المراجعة", value: stats.pendingStories, icon: "📖" },
    { title: "إجمالي الإيرادات", value: `${stats.totalRevenue} ج.م`, icon: "💰" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <span className="text-2xl">{card.icon}</span>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle>آخر 5 طلبات</CardTitle>
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
                  <TableHead>حالة الطلب</TableHead>
                  <TableHead>التاريخ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.recentOrders.map((order) => (
                  <TableRow key={order._id}>
                    <TableCell className="font-mono text-sm">
                      {order.orderNumber}
                    </TableCell>
                    <TableCell>{order.customerName}</TableCell>
                    <TableCell>{order.total} ج.م</TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={statusColors[order.orderStatus] || ""}
                      >
                        {statusLabels[order.orderStatus] || order.orderStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString("ar-EG")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Shipping Settings */}
      <Card>
        <CardHeader>
          <CardTitle>🚚 إعدادات الشحن</CardTitle>
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
