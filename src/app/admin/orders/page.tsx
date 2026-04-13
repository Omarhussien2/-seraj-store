"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// ---------- Types ----------
interface OrderItem {
  productSlug: string;
  name: string;
  price: number;
  qty: number;
}

interface CustomStory {
  heroName: string;
  age: number;
  challenge: string;
  photoUrl?: string;
}

interface Order {
  _id: string;
  orderNumber: string;
  items: OrderItem[];
  total: number;
  deposit: number;
  remaining: number;
  paymentMethod: string;
  paymentStatus: "unpaid" | "deposit_paid" | "fully_paid";
  orderStatus: "pending" | "in_progress" | "shipped" | "delivered";
  customStory?: CustomStory;
  customerName: string;
  customerPhone: string;
  address: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ---------- Mappers ----------
const orderStatusLabels: Record<string, string> = {
  pending: "جديد",
  in_progress: "جاري التنفيذ",
  shipped: "تم الشحن",
  delivered: "تم التسليم",
};

const paymentStatusLabels: Record<string, string> = {
  unpaid: "غير مدفوع",
  deposit_paid: "دفعة مقدمة",
  fully_paid: "مدفوع بالكامل",
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  in_progress: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
};

const paymentColors: Record<string, string> = {
  unpaid: "bg-red-100 text-red-800",
  deposit_paid: "bg-yellow-100 text-yellow-800",
  fully_paid: "bg-green-100 text-green-800",
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      const url =
        filter === "all" ? "/api/orders" : `/api/orders?status=${filter}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) setOrders(json.data);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  async function updateOrderStatus(id: string, field: string, value: string) {
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      const json = await res.json();
      if (json.success) {
        // Update in local state
        setOrders((prev) =>
          prev.map((o) => (o._id === id ? { ...o, ...json.data } : o))
        );
        if (selectedOrder?._id === id) {
          setSelectedOrder((prev) => (prev ? { ...prev, ...json.data } : prev));
        }
      }
    } catch (err) {
      console.error("Failed to update order:", err);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">إدارة الطلبات</h1>
        <Select value={filter} onValueChange={(v) => { if (v) setFilter(v); }}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="فلتر الحالة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">الكل</SelectItem>
            <SelectItem value="pending">جديد</SelectItem>
            <SelectItem value="in_progress">جاري التنفيذ</SelectItem>
            <SelectItem value="shipped">تم الشحن</SelectItem>
            <SelectItem value="delivered">تم التسليم</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">جاري التحميل...</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">لا توجد طلبات</div>
      ) : (
        <div className="border rounded-lg bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>رقم الطلب</TableHead>
                <TableHead>اسم العميل</TableHead>
                <TableHead>التليفون</TableHead>
                <TableHead>المبلغ</TableHead>
                <TableHead>حالة الدفع</TableHead>
                <TableHead>حالة الطلب</TableHead>
                <TableHead>التاريخ</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order._id}>
                  <TableCell className="font-mono text-sm">
                    {order.orderNumber}
                  </TableCell>
                  <TableCell>{order.customerName}</TableCell>
                  <TableCell className="font-mono text-sm" dir="ltr">
                    {order.customerPhone}
                  </TableCell>
                  <TableCell>{order.total} ج.م</TableCell>
                  <TableCell>
                    <Select
                      value={order.paymentStatus}
                      onValueChange={(v) => {
                        if (v) updateOrderStatus(order._id, "paymentStatus", v);
                      }}
                    >
                      <SelectTrigger className="w-36">
                        <Badge
                          variant="secondary"
                          className={paymentColors[order.paymentStatus] || ""}
                        >
                          {paymentStatusLabels[order.paymentStatus]}
                        </Badge>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unpaid">غير مدفوع</SelectItem>
                        <SelectItem value="deposit_paid">دفعة مقدمة</SelectItem>
                        <SelectItem value="fully_paid">مدفوع بالكامل</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={order.orderStatus}
                      onValueChange={(v) => {
                        if (v) updateOrderStatus(order._id, "orderStatus", v);
                      }}
                    >
                      <SelectTrigger className="w-40">
                        <Badge
                          variant="secondary"
                          className={statusColors[order.orderStatus] || ""}
                        >
                          {orderStatusLabels[order.orderStatus]}
                        </Badge>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">جديد</SelectItem>
                        <SelectItem value="in_progress">جاري التنفيذ</SelectItem>
                        <SelectItem value="shipped">تم الشحن</SelectItem>
                        <SelectItem value="delivered">تم التسليم</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(order.createdAt).toLocaleDateString("ar-EG")}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedOrder(order)}
                    >
                      تفاصيل
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Order Detail Dialog */}
      <Dialog
        open={!!selectedOrder}
        onOpenChange={(open) => !open && setSelectedOrder(null)}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>
              تفاصيل الطلب {selectedOrder?.orderNumber}
            </DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              {/* Customer Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">بيانات العميل</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-1">
                  <p><strong>الاسم:</strong> {selectedOrder.customerName}</p>
                  <p><strong>التليفون:</strong> <span dir="ltr">{selectedOrder.customerPhone}</span></p>
                  <p><strong>العنوان:</strong> {selectedOrder.address}</p>
                  {selectedOrder.notes && (
                    <p><strong>ملاحظات:</strong> {selectedOrder.notes}</p>
                  )}
                </CardContent>
              </Card>

              {/* Order Items */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">المنتجات</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>المنتج</TableHead>
                        <TableHead>السعر</TableHead>
                        <TableHead>الكمية</TableHead>
                        <TableHead>المجموع</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedOrder.items.map((item, i) => (
                        <TableRow key={i}>
                          <TableCell>{item.name}</TableCell>
                          <TableCell>{item.price} ج.م</TableCell>
                          <TableCell>{item.qty}</TableCell>
                          <TableCell>{item.price * item.qty} ج.م</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="mt-3 pt-3 border-t space-y-1 text-sm">
                    <p><strong>الإجمالي:</strong> {selectedOrder.total} ج.م</p>
                    <p><strong>المقدم:</strong> {selectedOrder.deposit} ج.م</p>
                    <p><strong>المتبقي:</strong> {selectedOrder.remaining} ج.م</p>
                  </div>
                </CardContent>
              </Card>

              {/* Custom Story */}
              {selectedOrder.customStory && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">بيانات القصة المخصصة</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2">
                    <p><strong>اسم الطفل:</strong> {selectedOrder.customStory.heroName}</p>
                    <p><strong>السن:</strong> {selectedOrder.customStory.age} سنوات</p>
                    <p><strong>التحدي:</strong> {selectedOrder.customStory.challenge}</p>
                    {selectedOrder.customStory.photoUrl && (
                      <div>
                        <p className="mb-1"><strong>صورة الطفل:</strong></p>
                        <img
                          src={selectedOrder.customStory.photoUrl}
                          alt="صورة الطفل"
                          className="w-32 h-32 object-cover rounded-lg border"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
