"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Settings = {
  depositEnabled: boolean;
  depositPercent: number;
};

export default function PaymentSettingsEditor({
  initial,
}: {
  initial: Settings;
}) {
  const [data, setData] = useState<Settings>(initial);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/payment-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = await res.json();
      if (!res.ok || !body.success) throw new Error(body.error || "فشل الحفظ");
      setData(body.data);
      setMessage("تم الحفظ بنجاح — التغييرات تظهر للزائرين فوراً.");
      setTimeout(() => setMessage(null), 4000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطأ غير معروف");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border rounded-xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-base font-semibold">تفعيل خيار العربون</Label>
            <p className="text-sm text-muted-foreground mt-1">
              لو معطّل، كل الطلبات تدفع كامل بـ InstaPay.
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              setData((prev) => ({ ...prev, depositEnabled: !prev.depositEnabled }))
            }
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              data.depositEnabled ? "bg-green-600" : "bg-gray-300"
            }`}
            aria-pressed={data.depositEnabled}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                data.depositEnabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        <div className="space-y-2">
          <Label htmlFor="depositPercent" className="text-base font-semibold">
            نسبة العربون الافتراضية (%)
          </Label>
          <p className="text-sm text-muted-foreground">
            مثلاً 60 يعني العميل يدفع 60% من سعر المنتج الآن، والباقي 40% كاش عند التوصيل.
            يتم تجاهل هذه النسبة لأي منتج له قيمة عربون مخصصة.
          </p>
          <div className="flex items-center gap-3 max-w-xs">
            <Input
              id="depositPercent"
              type="number"
              min={0}
              max={100}
              step={1}
              value={data.depositPercent}
              onChange={(e) =>
                setData((prev) => ({
                  ...prev,
                  depositPercent: Math.max(
                    0,
                    Math.min(100, Number(e.target.value) || 0)
                  ),
                }))
              }
              disabled={!data.depositEnabled}
            />
            <span className="text-lg font-semibold">%</span>
          </div>
        </div>

        <div className="rounded-md border bg-blue-50 border-blue-200 text-blue-900 p-3 text-sm leading-relaxed">
          <strong>كيف يعمل:</strong> عند الدفع، الخيار الأساسي للعميل هو <em>دفع كامل</em>{" "}
          (الأسرع، الموصى به). تحت الزرّ يظهر رابط صغير{" "}
          <em>«ادفع عربون والباقي كاش عند التوصيل»</em>. <br />
          <strong>سياسة العربون:</strong> العربون لا يُردّ في حالة الإلغاء (رسوم تجهيز).
        </div>

        {error && (
          <div className="rounded-md border bg-red-50 border-red-200 text-red-900 p-3 text-sm">
            {error}
          </div>
        )}
        {message && (
          <div className="rounded-md border bg-green-50 border-green-200 text-green-900 p-3 text-sm">
            {message}
          </div>
        )}

        <div className="flex justify-end pt-2 border-t">
          <Button onClick={save} disabled={saving}>
            {saving ? "جاري الحفظ..." : "حفظ"}
          </Button>
        </div>
      </div>
    </div>
  );
}
