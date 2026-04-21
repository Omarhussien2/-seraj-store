"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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
interface ColoringDetails {
  itemCount: number;
  format: "sheets" | "book";
  coverImage?: string;
  coverTitle?: string;
  items: string[];
}

interface OrderItem {
  productSlug: string;
  name: string;
  price: number;
  qty: number;
  coloringDetails?: ColoringDetails;
}

interface CustomStory {
  heroName: string;
  age: number;
  challenge: string;
  customChallenge?: string;
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
  orderStatus: "pending" | "in_progress" | "shipped" | "delivered" | "cancelled";
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
  cancelled: "ملغى",
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
  cancelled: "bg-gray-100 text-gray-800",
};

const paymentColors: Record<string, string> = {
  unpaid: "bg-red-100 text-red-800",
  deposit_paid: "bg-yellow-100 text-yellow-800",
  fully_paid: "bg-green-100 text-green-800",
};

// ---------- WhatsApp helper ----------
function getWhatsAppLink(order: Order): string {
  const msg = encodeURIComponent(
    `السلام عليكم، بخصوص طلبكم رقم ${order.orderNumber} على متجر سِراج. المبلغ: ${order.total} ج.م`
  );
  return `https://wa.me/2${order.customerPhone}?text=${msg}`;
}

const PAGE_SIZE = 20;

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const prevTotalRef = useRef(0);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const fetchOrders = useCallback(async (currentPage = page) => {
    try {
      const params = new URLSearchParams({ page: String(currentPage), limit: String(PAGE_SIZE) });
      if (filter !== "all") params.set("status", filter);
      const res = await fetch(`/api/orders?${params}`);
      const json = await res.json();
      if (json.success) {
        // Detect new orders via total count change (polling on page 1)
        if (currentPage === 1 && prevTotalRef.current > 0 && json.total > prevTotalRef.current) {
          setNewOrdersCount((prev) => prev + (json.total - prevTotalRef.current));
        }
        prevTotalRef.current = json.total;
        setOrders(json.data as Order[]);
        setTotalPages(json.totalPages ?? 1);
        setTotal(json.total ?? 0);
      }
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    } finally {
      setLoading(false);
    }
  }, [filter, page]);

  useEffect(() => {
    setLoading(true);
    fetchOrders(page);
  }, [fetchOrders, page]);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setPage(1);
    setSelectedIds([]);
  }, [filter]);

  // Polling: refresh current page every 30 seconds
  useEffect(() => {
    pollingRef.current = setInterval(() => {
      fetchOrders(page);
    }, 30000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [fetchOrders, page]);

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

  async function handleBulkDelete() {
    if (selectedIds.length === 0) return;
    if (!confirm(`هل أنت متأكد من حذف ${selectedIds.length} طلب نهائياً؟ هذا الإجراء لا يمكن التراجع عنه.`)) return;
    
    try {
      const res = await fetch("/api/orders", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds }),
      });
      const json = await res.json();
      if (json.success) {
        setSelectedIds([]);
        fetchOrders(page);
      } else {
        alert(json.error || "خطأ أثناء الحذف");
      }
    } catch (err) {
      console.error("Bulk delete error:", err);
      alert("حدث خطأ في النظام");
    }
  }

  async function handleDeleteSingle(id: string) {
    if (!confirm("هل أنت متأكد من حذف هذا الطلب نهائياً؟")) return;
    try {
      const res = await fetch(`/api/orders/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        // Remove from selection if previously selected
        setSelectedIds(prev => prev.filter(vid => vid !== id));
        fetchOrders(page);
      } else {
        alert(json.error || "خطأ أثناء الحذف");
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  }

  function toggleSelectAll() {
    if (selectedIds.length === orders.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(orders.map(o => o._id));
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(vid => vid !== id) : [...prev, id]
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">إدارة الطلبات</h1>
          {newOrdersCount > 0 && (
            <Badge className="bg-green-500 text-white animate-pulse">
              +{newOrdersCount} جديد
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
              حذف المحدد ({selectedIds.length})
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => { fetchOrders(page); setNewOrdersCount(0); setSelectedIds([]); }}>
            🔄 تحديث
          </Button>
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
              <SelectItem value="cancelled">ملغى</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">جاري التحميل...</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">لا توجد طلبات</div>
      ) : (
        <div className="space-y-2">
        <div className="text-sm text-muted-foreground">
          إجمالي الطلبات: <strong>{total}</strong>
        </div>
        <div className="border rounded-lg bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    className="w-4 h-4 cursor-pointer align-middle"
                    checked={orders.length > 0 && selectedIds.length === orders.length}
                    onChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead>رقم الطلب</TableHead>
                <TableHead>اسم العميل</TableHead>
                <TableHead>التليفون</TableHead>
                <TableHead>المبلغ</TableHead>
                <TableHead>حالة الدفع</TableHead>
                <TableHead>حالة الطلب</TableHead>
                <TableHead>التاريخ</TableHead>
                <TableHead>إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order._id} className={selectedIds.includes(order._id) ? "bg-muted/50" : ""}>
                  <TableCell>
                    <input
                      type="checkbox"
                      className="w-4 h-4 cursor-pointer align-middle"
                      checked={selectedIds.includes(order._id)}
                      onChange={() => toggleSelect(order._id)}
                    />
                  </TableCell>
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
                        <SelectItem value="cancelled">ملغى</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(order.createdAt).toLocaleDateString("ar-EG")}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedOrder(order)}
                      >
                        تفاصيل
                      </Button>
                      <a
                        href={getWhatsAppLink(order)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="outline" size="sm" title="مراسلة" className="text-green-600 hover:text-green-700 hover:bg-green-50">
                          💬
                        </Button>
                      </a>
                      <Button
                        variant="outline"
                        size="sm"
                        title="حذف"
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => handleDeleteSingle(order._id)}
                      >
                        🗑️
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            السابق
          </Button>
          <span className="text-sm text-muted-foreground">
            صفحة {page} من {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            التالي
          </Button>
        </div>
      )}

      {/* Order Detail Dialog */}
      <Dialog
        open={!!selectedOrder}
        onOpenChange={(open) => !open && setSelectedOrder(null)}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>
                تفاصيل الطلب {selectedOrder?.orderNumber}
              </DialogTitle>
              {selectedOrder && (
                <a
                  href={getWhatsAppLink(selectedOrder)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="default" size="sm" className="bg-green-600 hover:bg-green-700 text-white gap-1">
                    💬 واتساب العميل
                  </Button>
                </a>
              )}
            </div>
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
                    {selectedOrder.customStory.customChallenge && (
                      <p><strong>تفاصيل خاصة:</strong> {selectedOrder.customStory.customChallenge}</p>
                    )}
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

              {/* Coloring Workbook Details */}
              {selectedOrder.items.some(item => item.coloringDetails) && (
                <Card className="border-2 border-green-300 bg-green-50/50">
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      📚 تفاصيل كشكول الألوان
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-3">
                    {selectedOrder.items.filter(item => item.coloringDetails).map((item, i) => {
                      const cd = item.coloringDetails!;
                      return (
                        <div key={i} className="space-y-2">
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline" className="bg-white">
                              {cd.format === "book" ? "📚 كشكول بغلاف مخصص" : "📄 ورق مطبوع"}
                            </Badge>
                            <Badge variant="outline" className="bg-white">
                              {cd.itemCount} رسمة
                            </Badge>
                            {cd.coverImage && (
                              <Badge variant="outline" className="bg-white">
                                غلاف: {cd.coverImage.replace("cover-", "")}
                              </Badge>
                            )}
                          </div>
                          {cd.coverTitle && (
                            <p><strong>اسم الكشكول:</strong> {cd.coverTitle}</p>
                          )}
                          <div>
                            <p className="font-bold mb-1">الرسومات المطلوبة ({cd.items.length}):</p>
                            <div className="bg-white rounded-lg p-2 border text-xs text-muted-foreground break-all">
                              IDs: {cd.items.join("، ")}
                            </div>
                          </div>
                        </div>
                      );
                    })}
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
