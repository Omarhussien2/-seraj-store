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
interface Order {
  _id: string;
  orderNumber: string;
  customStory?: {
    heroName: string;
    age: number;
    challenge: string;
    customChallenge?: string;
    photoUrl?: string;
    storyStatus: "pending" | "reviewed" | "sent_to_print" | "delivered";
  };
  customerName: string;
  orderStatus: string;
  createdAt: string;
}

const storyStatusLabels: Record<string, string> = {
  pending: "بانتظار المراجعة",
  reviewed: "تمت المراجعة",
  sent_to_print: "أُرسلت للطباعة",
  delivered: "تم التسليم",
};

const storyStatusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  reviewed: "bg-blue-100 text-blue-800",
  sent_to_print: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
};

export default function AdminStoriesPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const fetchStories = useCallback(async () => {
    try {
      // Fetch all orders, we'll filter for those with customStory
      const res = await fetch("/api/orders");
      const json = await res.json();
      if (json.success) {
        const withStories = json.data.filter(
          (o: Order) => o.customStory && o.customStory.heroName
        );
        setOrders(withStories);
      }
    } catch (err) {
      console.error("Failed to fetch stories:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  async function updateStoryStatus(orderId: string, newStatus: "pending" | "reviewed" | "sent_to_print" | "delivered") {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customStory: { storyStatus: newStatus },
        }),
      });
      const json = await res.json();
      if (json.success) {
        setOrders((prev) =>
          prev.map((o) =>
            o._id === orderId
              ? {
                  ...o,
                  customStory: { ...o.customStory!, storyStatus: newStatus },
                }
              : o
          )
        );
        if (selectedOrder?._id === orderId) {
          setSelectedOrder((prev) =>
            prev
              ? {
                  ...prev,
                  customStory: { ...prev.customStory!, storyStatus: newStatus },
                }
              : prev
          );
        }
      }
    } catch (err) {
      console.error("Failed to update story status:", err);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">إدارة القصص المخصصة</h1>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">جاري التحميل...</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          لا توجد طلبات قصص مخصصة بعد
        </div>
      ) : (
        <div className="border rounded-lg bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>رقم الطلب</TableHead>
                <TableHead>اسم الطفل</TableHead>
                <TableHead>السن</TableHead>
                <TableHead>التحدي</TableHead>
                <TableHead>التحدي المخصص</TableHead>
                <TableHead>الصورة</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order._id}>
                  <TableCell className="font-mono text-sm">
                    {order.orderNumber}
                  </TableCell>
                  <TableCell className="font-medium">
                    {order.customStory?.heroName}
                  </TableCell>
                  <TableCell>{order.customStory?.age} سنوات</TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {order.customStory?.challenge}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {order.customStory?.customChallenge || "—"}
                  </TableCell>
                  <TableCell>
                    {order.customStory?.photoUrl ? (
                      <img
                        src={order.customStory.photoUrl}
                        alt="صورة الطفل"
                        className="w-10 h-10 object-cover rounded-full border cursor-pointer"
                        onClick={() => setSelectedOrder(order)}
                      />
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={order.customStory?.storyStatus || "pending"}
                      onValueChange={(v) => { if (v) updateStoryStatus(order._id, v); }}
                    >
                      <SelectTrigger className="w-44">
                        <Badge
                          variant="secondary"
                          className={
                            storyStatusColors[order.customStory?.storyStatus || "pending"] || ""
                          }
                        >
                          {storyStatusLabels[order.customStory?.storyStatus || "pending"]}
                        </Badge>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">بانتظار المراجعة</SelectItem>
                        <SelectItem value="reviewed">تمت المراجعة</SelectItem>
                        <SelectItem value="sent_to_print">أُرسلت للطباعة</SelectItem>
                        <SelectItem value="delivered">تم التسليم</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="cursor-pointer"
                      onClick={() => setSelectedOrder(order)}
                    >
                      عرض
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Story Detail Dialog */}
      <Dialog
        open={!!selectedOrder}
        onOpenChange={(open) => !open && setSelectedOrder(null)}
      >
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>تفاصيل القصة — {selectedOrder?.orderNumber}</DialogTitle>
          </DialogHeader>
          {selectedOrder?.customStory && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">بيانات القصة</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <p>
                    <strong>اسم الطفل:</strong> {selectedOrder.customStory.heroName}
                  </p>
                  <p>
                    <strong>السن:</strong> {selectedOrder.customStory.age} سنوات
                  </p>
                  <p>
                    <strong>التحدي:</strong> {selectedOrder.customStory.challenge}
                  </p>
                  {selectedOrder.customStory.customChallenge && (
                    <p>
                      <strong>التحدي المخصص:</strong>{" "}
                      {selectedOrder.customStory.customChallenge}
                    </p>
                  )}
                  <p>
                    <strong>حالة القصة:</strong>{" "}
                    <Badge
                      variant="secondary"
                      className={
                        storyStatusColors[selectedOrder.customStory.storyStatus] || ""
                      }
                    >
                      {storyStatusLabels[selectedOrder.customStory.storyStatus]}
                    </Badge>
                  </p>
                </CardContent>
              </Card>

              {selectedOrder.customStory.photoUrl && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">صورة الطفل</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <img
                      src={selectedOrder.customStory.photoUrl}
                      alt="صورة الطفل"
                      className="w-48 h-48 object-cover rounded-lg border"
                    />
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">بيانات العميل</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-1">
                  <p><strong>الاسم:</strong> {selectedOrder.customerName}</p>
                  <p><strong>رقم الطلب:</strong> {selectedOrder.orderNumber}</p>
                  <p>
                    <strong>التاريخ:</strong>{" "}
                    {new Date(selectedOrder.createdAt).toLocaleDateString("ar-EG")}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
