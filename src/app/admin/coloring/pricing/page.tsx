"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface PricingData {
  pricePerPage: number;
  coverPrice: number;
  minPages: number;
  maxPages: number;
  freeShippingMin: number;
}

const FIELDS: { key: keyof PricingData; label: string; unit: string; desc: string }[] = [
  { key: "pricePerPage", label: "سعر الورقة الواحدة", unit: "ج.م", desc: "سعر طباعة كل رسمة تلوين" },
  { key: "coverPrice", label: "سعر الغلاف المخصص", unit: "ج.م", desc: "سعر إضافي لغلاف كشكول بغلاف" },
  { key: "minPages", label: "أقل عدد رسومات", unit: "رسومة", desc: "الحد الأدنى لطلب الكشكول" },
  { key: "maxPages", label: "أقصى عدد رسومات", unit: "رسومة", desc: "الحد الأقصى لطلب الكشكول" },
  { key: "freeShippingMin", label: "حد الشحن المجاني", unit: "ج.م", desc: "الحد الأدنى للطلب عشان الشحن يكون مجاني" },
];

export default function PricingPage() {
  const [data, setData] = useState<PricingData>({
    pricePerPage: 3,
    coverPrice: 20,
    minPages: 5,
    maxPages: 50,
    freeShippingMin: 100,
  });
  const [original, setOriginal] = useState<PricingData>({ ...data });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/coloring/pricing")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setData(res.data);
          setOriginal(res.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (key: keyof PricingData, value: string) => {
    const num = parseInt(value, 10);
    if (!isNaN(num) && num >= 0) {
      setData((prev) => ({ ...prev, [key]: num }));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/coloring/pricing", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "فشل التحديث");
      setOriginal({ ...data });
      setMessage("تم حفظ الأسعار بنجاح! ✅");
      setTimeout(() => setMessage(null), 4000);
    } catch (err: any) {
      alert("خطأ: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = JSON.stringify(data) !== JSON.stringify(original);

  if (loading) {
    return (
      <div dir="rtl" className="flex items-center justify-center py-20">
        <span className="text-lg text-gray-500">جاري التحميل...</span>
      </div>
    );
  }

  return (
    <div dir="rtl" className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">تسعير كشكول الألوان</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          عدّلي أسعار الطباعة والحدود — التغييرات تظهر فوراً للعملاء
        </p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-6">
        {FIELDS.map((f) => (
          <div key={f.key} className="flex items-center justify-between gap-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
            <div className="flex-1">
              <label className="text-sm font-bold text-gray-800 block">{f.label}</label>
              <p className="text-xs text-gray-500 mt-0.5">{f.desc}</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                value={data[f.key]}
                onChange={(e) => handleChange(f.key, e.target.value)}
                className="w-24 text-center text-lg font-bold border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
              <span className="text-sm text-gray-500 font-medium min-w-[50px]">{f.unit}</span>
            </div>
          </div>
        ))}

        {/* Live Preview */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
          <p className="text-sm font-bold text-amber-800 mb-2">💡 مثال حي:</p>
          <p className="text-sm text-amber-700">
            كشكول بـ <strong>{data.minPages}</strong> رسومات + غلاف ={" "}
            <strong>{data.minPages * data.pricePerPage + data.coverPrice} ج.م</strong>
          </p>
          <p className="text-sm text-amber-700 mt-1">
            كشكول بـ <strong>20</strong> رسمة + غلاف ={" "}
            <strong>{20 * data.pricePerPage + data.coverPrice} ج.م</strong>
          </p>
          <p className="text-sm text-amber-700 mt-1">
            شحن مجاني فوق <strong>{data.freeShippingMin} ج.م</strong>
          </p>
        </div>

        <div className="pt-4 border-t border-gray-100 flex items-center gap-4">
          <Button onClick={handleSave} disabled={saving || !hasChanges}>
            {saving ? "جاري الحفظ..." : "حفظ الأسعار"}
          </Button>
          {hasChanges && !saving && (
            <span className="text-xs text-amber-600 font-medium">فيه تغييرات غير محفوظة</span>
          )}
          {message && <span className="text-sm text-green-600 font-medium">{message}</span>}
        </div>
      </div>
    </div>
  );
}
