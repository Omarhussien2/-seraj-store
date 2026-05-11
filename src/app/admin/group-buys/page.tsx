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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

interface GroupBuyOrder {
  _id: string;
  orderNumber: string;
  total: number;
  paymentStatus: string;
}

interface GroupBuy {
  _id: string;
  code: string;
  createdByName: string;
  createdByPhone: string;
  targetOrders: number;
  confirmedOrders: number;
  status: "open" | "completed" | "expired" | "cancelled";
  expiresAt: string;
  createdAt: string;
  orderIds: GroupBuyOrder[];
}

const statusLabels: Record<string, string> = {
  open: "مفتوح",
  completed: "مكتمل",
  expired: "منتهي",
  cancelled: "ملغى",
};

const statusColors: Record<string, string> = {
  open: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  expired: "bg-yellow-100 text-yellow-800",
  cancelled: "bg-red-100 text-red-800",
};

export default function AdminGroupBuysPage() {
  const [groups, setGroups] = useState<GroupBuy[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchGroups = useCallback(async (currentPage = page) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: String(currentPage), limit: "20" });
      if (filter !== "all") params.set("status", filter);
      
      const res = await fetch(`/api/group-buys?${params}`);
      const json = await res.json();
      if (json.success) {
        setGroups(json.data);
        setTotalPages(json.totalPages || 1);
        setTotal(json.total || 0);
      }
    } catch (err) {
      console.error("Failed to fetch group buys", err);
    } finally {
      setLoading(false);
    }
  }, [filter, page]);

  useEffect(() => {
    fetchGroups(page);
  }, [fetchGroups, page]);

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [filter]);

  async function handleStatusChange(code: string, newStatus: string) {
    try {
      const res = await fetch(`/api/group-buys/${code}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (json.success) {
        setGroups((prev) =>
          prev.map((g) => (g.code === code ? { ...g, status: newStatus as any } : g))
        );
      }
    } catch (err) {
      console.error("Failed to update status", err);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold">إدارة جروبات الخصم</h1>
        
        <div className="flex items-center gap-3">
          <Link href="/admin/group-buys/settings">
            <Button variant="outline">⚙️ الإعدادات والمحتوى</Button>
          </Link>
          <Button variant="outline" onClick={() => fetchGroups(page)}>🔄 تحديث</Button>
          <Select value={filter} onValueChange={(v) => { if (v) setFilter(v); }}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="فلتر الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              <SelectItem value="open">مفتوح</SelectItem>
              <SelectItem value="completed">مكتمل</SelectItem>
              <SelectItem value="expired">منتهي</SelectItem>
              <SelectItem value="cancelled">ملغى</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">جاري التحميل...</div>
      ) : groups.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">لا يوجد جروبات</div>
      ) : (
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            إجمالي الجروبات: <strong>{total}</strong>
          </div>
          
          <div className="border rounded-lg bg-white overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الكود</TableHead>
                  <TableHead>المنشئ</TableHead>
                  <TableHead>التقدم</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الطلبات المرتبطة</TableHead>
                  <TableHead>تاريخ الانتهاء</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groups.map((group) => {
                  const progress = Math.min(100, Math.round((group.confirmedOrders / group.targetOrders) * 100));
                  const isExpired = new Date(group.expiresAt) < new Date();
                  
                  return (
                    <TableRow key={group._id}>
                      <TableCell className="font-mono text-sm font-bold">
                        {group.code}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{group.createdByName}</div>
                        <div className="text-xs text-muted-foreground font-mono mt-1" dir="ltr">
                          {group.createdByPhone}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${progress >= 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-xs whitespace-nowrap">
                            {group.confirmedOrders} / {group.targetOrders}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={group.status}
                          onValueChange={(v) => { if (v) handleStatusChange(group.code, v); }}
                        >
                          <SelectTrigger className={`w-32 h-8 text-xs font-semibold ${statusColors[group.status] || ""}`}>
                            {statusLabels[group.status]}
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">مفتوح</SelectItem>
                            <SelectItem value="completed">مكتمل</SelectItem>
                            <SelectItem value="expired">منتهي</SelectItem>
                            <SelectItem value="cancelled">ملغى</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {group.orderIds.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {group.orderIds.map((o) => (
                              <Link key={o._id} href="/admin/orders">
                                <Badge variant="outline" className="cursor-pointer hover:bg-gray-100 font-mono text-[10px]">
                                  {o.orderNumber}
                                </Badge>
                              </Link>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(group.expiresAt).toLocaleDateString("ar-EG")}
                        </div>
                        <div className={`text-xs mt-1 ${isExpired && group.status === 'open' ? 'text-red-500 font-bold' : 'text-muted-foreground'}`}>
                          {new Date(group.expiresAt).toLocaleTimeString("ar-EG", { hour: '2-digit', minute: '2-digit' })}
                          {isExpired && group.status === 'open' && " (الوقت انتهى)"}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
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
        </div>
      )}
    </div>
  );
}
