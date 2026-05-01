"use client";

import { useEffect, useMemo, useState } from "react";
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

type CouponDiscountScope = "shipping" | "subtotal" | "products";
type CouponDiscountType = "percent" | "fixed";

interface Coupon {
  _id: string;
  code: string;
  active: boolean;
  title?: string;
  validTo?: string;
  redeemedCount: number;
  discounts: {
    scope: CouponDiscountScope;
    type: CouponDiscountType;
    value: number;
    maxDiscount?: number;
    productSlugs?: string[];
  }[];
  limits?: {
    maxRedemptionsTotal?: number;
    maxRedemptionsPerCustomerPhone?: number;
    minSubtotal?: number;
  };
}

const scopeLabels: Record<CouponDiscountScope, string> = {
  shipping: "الشحن",
  subtotal: "السلة",
  products: "منتجات محددة",
};

function formatDiscount(coupon: Coupon) {
  return coupon.discounts
    .map((discount) => {
      const amount =
        discount.type === "percent"
          ? `${discount.value}%`
          : `${discount.value} ج.م`;
      return `${scopeLabels[discount.scope]}: ${amount}`;
    })
    .join(" + ");
}

function splitSlugs(value: string) {
  return value
    .split(",")
    .map((slug) => slug.trim())
    .filter(Boolean);
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [scope, setScope] = useState<CouponDiscountScope>("subtotal");
  const [type, setType] = useState<CouponDiscountType>("percent");
  const [value, setValue] = useState(10);
  const [maxDiscount, setMaxDiscount] = useState("");
  const [productSlugs, setProductSlugs] = useState("");
  const [minSubtotal, setMinSubtotal] = useState("");
  const [maxTotal, setMaxTotal] = useState("");
  const [maxPerPhone, setMaxPerPhone] = useState("1");
  const [validTo, setValidTo] = useState("");

  const activeCount = useMemo(
    () => coupons.filter((coupon) => coupon.active).length,
    [coupons]
  );

  async function fetchCoupons() {
    setLoading(true);
    try {
      const res = await fetch("/api/coupons?limit=100");
      const json = await res.json();
      if (json.success) setCoupons(json.data as Coupon[]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCoupons();
  }, []);

  function resetForm() {
    setCode("");
    setTitle("");
    setScope("subtotal");
    setType("percent");
    setValue(10);
    setMaxDiscount("");
    setProductSlugs("");
    setMinSubtotal("");
    setMaxTotal("");
    setMaxPerPhone("1");
    setValidTo("");
  }

  async function createCoupon() {
    setSaving(true);
    setMessage("");
    try {
      const discount: {
        scope: CouponDiscountScope;
        type: CouponDiscountType;
        value: number;
        maxDiscount?: number;
        productSlugs?: string[];
      } = { scope, type, value };

      const maxDiscountValue = Number(maxDiscount);
      if (maxDiscount.trim() && !Number.isNaN(maxDiscountValue)) {
        discount.maxDiscount = maxDiscountValue;
      }
      if (scope === "products") {
        discount.productSlugs = splitSlugs(productSlugs);
      }

      const limits: Record<string, number> = {};
      const minSubtotalValue = Number(minSubtotal);
      const maxTotalValue = Number(maxTotal);
      const maxPerPhoneValue = Number(maxPerPhone);
      if (minSubtotal.trim() && !Number.isNaN(minSubtotalValue)) {
        limits.minSubtotal = minSubtotalValue;
      }
      if (maxTotal.trim() && !Number.isNaN(maxTotalValue)) {
        limits.maxRedemptionsTotal = maxTotalValue;
      }
      if (maxPerPhone.trim() && !Number.isNaN(maxPerPhoneValue)) {
        limits.maxRedemptionsPerCustomerPhone = maxPerPhoneValue;
      }

      const res = await fetch("/api/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          title,
          validTo: validTo || undefined,
          discounts: [discount],
          limits,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "فشل إنشاء الكوبون");

      setMessage("تم إنشاء الكوبون بنجاح");
      resetForm();
      fetchCoupons();
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleCoupon(coupon: Coupon) {
    const res = await fetch(`/api/coupons/${coupon._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !coupon.active }),
    });
    const json = await res.json();
    if (json.success) {
      setCoupons((prev) =>
        prev.map((item) => (item._id === coupon._id ? json.data : item))
      );
    }
  }

  async function deleteCoupon(coupon: Coupon) {
    if (!confirm(`حذف كوبون ${coupon.code}؟`)) return;
    const res = await fetch(`/api/coupons/${coupon._id}`, { method: "DELETE" });
    const json = await res.json();
    if (json.success) {
      setCoupons((prev) => prev.filter((item) => item._id !== coupon._id));
    }
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">أكواد الخصم</h1>
          <p className="text-sm text-muted-foreground">
            إدارة خصومات الشحن والسلة والمنتجات المحددة من مكان واحد.
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="secondary">النشطة: {activeCount}</Badge>
          <Badge variant="outline">الإجمالي: {coupons.length}</Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">إنشاء كوبون جديد</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label>الكود</Label>
              <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="SERAJ10" dir="ltr" />
            </div>
            <div className="space-y-2">
              <Label>اسم مختصر</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="خصم افتتاحي" />
            </div>
            <div className="space-y-2">
              <Label>نوع الخصم</Label>
              <Select value={scope} onValueChange={(v) => setScope(v as CouponDiscountScope)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="subtotal">خصم على السلة</SelectItem>
                  <SelectItem value="shipping">خصم على الشحن</SelectItem>
                  <SelectItem value="products">منتجات محددة</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>طريقة الحساب</Label>
              <Select value={type} onValueChange={(v) => setType(v as CouponDiscountType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="percent">نسبة مئوية</SelectItem>
                  <SelectItem value="fixed">مبلغ ثابت</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
            <div className="space-y-2">
              <Label>القيمة</Label>
              <Input type="number" min="0" value={value} onChange={(e) => setValue(Number(e.target.value) || 0)} />
            </div>
            <div className="space-y-2">
              <Label>حد أقصى للخصم</Label>
              <Input type="number" min="0" value={maxDiscount} onChange={(e) => setMaxDiscount(e.target.value)} placeholder="اختياري" />
            </div>
            <div className="space-y-2">
              <Label>حد أدنى للسلة</Label>
              <Input type="number" min="0" value={minSubtotal} onChange={(e) => setMinSubtotal(e.target.value)} placeholder="اختياري" />
            </div>
            <div className="space-y-2">
              <Label>عدد الاستخدامات</Label>
              <Input type="number" min="1" value={maxTotal} onChange={(e) => setMaxTotal(e.target.value)} placeholder="مفتوح" />
            </div>
            <div className="space-y-2">
              <Label>لكل رقم هاتف</Label>
              <Input type="number" min="1" value={maxPerPhone} onChange={(e) => setMaxPerPhone(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>منتجات محددة</Label>
              <Input
                value={productSlugs}
                onChange={(e) => setProductSlugs(e.target.value)}
                placeholder="product-slug-1, product-slug-2"
                dir="ltr"
                disabled={scope !== "products"}
              />
            </div>
            <div className="space-y-2">
              <Label>تاريخ الانتهاء</Label>
              <Input type="date" value={validTo} onChange={(e) => setValidTo(e.target.value)} />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={createCoupon} disabled={saving || !code.trim() || value <= 0}>
              {saving ? "جاري الحفظ..." : "إنشاء الكوبون"}
            </Button>
            {message && <span className="text-sm text-muted-foreground">{message}</span>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">الكوبونات الحالية</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-10 text-center text-muted-foreground">جاري التحميل...</div>
          ) : coupons.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">لا توجد كوبونات بعد</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الكود</TableHead>
                  <TableHead>الخصم</TableHead>
                  <TableHead>الاستخدام</TableHead>
                  <TableHead>الصلاحية</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.map((coupon) => (
                  <TableRow key={coupon._id}>
                    <TableCell>
                      <div className="font-mono font-bold" dir="ltr">{coupon.code}</div>
                      {coupon.title && <div className="text-xs text-muted-foreground">{coupon.title}</div>}
                    </TableCell>
                    <TableCell className="text-sm">{formatDiscount(coupon)}</TableCell>
                    <TableCell className="text-sm">
                      {coupon.redeemedCount}
                      {coupon.limits?.maxRedemptionsTotal ? ` / ${coupon.limits.maxRedemptionsTotal}` : ""}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {coupon.validTo ? new Date(coupon.validTo).toLocaleDateString("ar-EG") : "بدون انتهاء"}
                    </TableCell>
                    <TableCell>
                      <Badge className={coupon.active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"}>
                        {coupon.active ? "نشط" : "متوقف"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => toggleCoupon(coupon)}>
                          {coupon.active ? "إيقاف" : "تفعيل"}
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-600" onClick={() => deleteCoupon(coupon)}>
                          حذف
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
