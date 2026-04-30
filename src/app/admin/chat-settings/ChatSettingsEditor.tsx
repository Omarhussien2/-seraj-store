"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type Chip = { label: string; question: string };
type Settings = {
  enabled: boolean;
  whatsappNumber: string;
  welcomeTitle: string;
  welcomeSubtitle: string;
  chips: Chip[];
  systemPrompt: string;
};

export default function ChatSettingsEditor({ initial }: { initial: Settings }) {
  const [data, setData] = useState<Settings>(initial);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    setData((prev) => ({ ...prev, [key]: value }));
  }

  function updateChip(idx: number, patch: Partial<Chip>) {
    setData((prev) => ({
      ...prev,
      chips: prev.chips.map((c, i) => (i === idx ? { ...c, ...patch } : c)),
    }));
  }

  function addChip() {
    if (data.chips.length >= 8) return;
    setData((prev) => ({
      ...prev,
      chips: [...prev.chips, { label: "", question: "" }],
    }));
  }

  function removeChip(idx: number) {
    setData((prev) => ({
      ...prev,
      chips: prev.chips.filter((_, i) => i !== idx),
    }));
  }

  function moveChip(idx: number, dir: -1 | 1) {
    setData((prev) => {
      const next = [...prev.chips];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return { ...prev, chips: next };
    });
  }

  async function save() {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/chat-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = await res.json();
      if (!res.ok || !body.success) throw new Error(body.error || "فشل الحفظ");
      setData(body.data);
      setMessage("تم الحفظ بنجاح — التغييرات تظهر للزائرين خلال أقل من دقيقة.");
      setTimeout(() => setMessage(null), 4000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطأ غير معروف");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Master toggle */}
      <section className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">تشغيل ودجت الشات</h2>
            <p className="text-sm text-muted-foreground mt-1">
              لو معطّل: زر سِراج العائم لن يظهر للزائرين، والـ API هيرجّع 403.
            </p>
          </div>
          <label className="inline-flex items-center gap-2 cursor-pointer select-none">
            <span className="text-sm font-medium">
              {data.enabled ? "مُفعّل" : "معطّل"}
            </span>
            <input
              type="checkbox"
              className="h-5 w-5 accent-green-600"
              checked={data.enabled}
              onChange={(e) => update("enabled", e.target.checked)}
            />
          </label>
        </div>
      </section>

      {/* Welcome message */}
      <section className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 space-y-3">
        <h2 className="text-lg font-semibold">رسالة الترحيب</h2>
        <div>
          <Label htmlFor="welcomeTitle">العنوان</Label>
          <Input
            id="welcomeTitle"
            value={data.welcomeTitle}
            onChange={(e) => update("welcomeTitle", e.target.value)}
            maxLength={120}
            placeholder="أهلاً بيك في سِراج! 👋"
          />
        </div>
        <div>
          <Label htmlFor="welcomeSubtitle">الوصف</Label>
          <Textarea
            id="welcomeSubtitle"
            value={data.welcomeSubtitle}
            onChange={(e) => update("welcomeSubtitle", e.target.value)}
            maxLength={400}
            rows={3}
          />
        </div>
      </section>

      {/* WhatsApp number */}
      <section className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 space-y-3">
        <h2 className="text-lg font-semibold">رقم الواتساب</h2>
        <p className="text-sm text-muted-foreground">
          بصيغة دولية بدون + (مثلاً 201152806034). يُستخدم في chip «واتساب مباشرة» وفي روابط الخطأ.
        </p>
        <Input
          inputMode="tel"
          value={data.whatsappNumber}
          onChange={(e) => update("whatsappNumber", e.target.value)}
          placeholder="201152806034"
          dir="ltr"
        />
      </section>

      {/* Quick chips */}
      <section className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">الاقتراحات السريعة (Chips)</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addChip}
            disabled={data.chips.length >= 8}
          >
            + إضافة اقتراح
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          تظهر أسفل نافذة الشات قبل أول رسالة. عند الضغط، تُرسَل الرسالة إلى سِراج تلقائياً. حد أقصى 8.
        </p>
        {data.chips.length === 0 && (
          <p className="text-sm italic text-muted-foreground">لا توجد اقتراحات حالياً.</p>
        )}
        <div className="space-y-3">
          {data.chips.map((chip, idx) => (
            <div
              key={idx}
              className="grid grid-cols-1 md:grid-cols-[140px_1fr_auto] gap-2 items-start border border-gray-100 rounded-md p-3"
            >
              <div>
                <Label className="text-xs">النص الظاهر</Label>
                <Input
                  value={chip.label}
                  onChange={(e) => updateChip(idx, { label: e.target.value })}
                  maxLength={60}
                  placeholder="المنتجات والأسعار"
                />
              </div>
              <div>
                <Label className="text-xs">الرسالة المرسلة</Label>
                <Input
                  value={chip.question}
                  onChange={(e) => updateChip(idx, { question: e.target.value })}
                  maxLength={240}
                  placeholder="إيه المنتجات والأسعار؟"
                />
              </div>
              <div className="flex flex-col md:flex-row gap-1 md:gap-2 mt-2 md:mt-5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => moveChip(idx, -1)}
                  disabled={idx === 0}
                  title="فوق"
                >
                  ↑
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => moveChip(idx, 1)}
                  disabled={idx === data.chips.length - 1}
                  title="تحت"
                >
                  ↓
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:bg-red-50"
                  onClick={() => removeChip(idx)}
                  title="حذف"
                >
                  حذف
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* System prompt */}
      <section className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 space-y-3">
        <h2 className="text-lg font-semibold">شخصية الذكاء الاصطناعي (System Prompt)</h2>
        <p className="text-sm text-muted-foreground">
          البرومبت الذي يحدد طريقة كلام سِراج، أسعار المنتجات، قواعد الرد. لو فاضي، النظام يستخدم البرومبت الافتراضي المضمَّن في الكود.
        </p>
        <Textarea
          value={data.systemPrompt}
          onChange={(e) => update("systemPrompt", e.target.value)}
          maxLength={8000}
          rows={18}
          dir="rtl"
          placeholder="اكتب هنا برومبت سِراج المخصّص — أو اتركه فاضي لاستخدام الافتراضي."
          className="font-mono text-sm"
        />
        <p className="text-xs text-muted-foreground">{data.systemPrompt.length} / 8000 حرف</p>
      </section>

      {/* Save bar */}
      <div className="sticky bottom-0 bg-white p-4 rounded-lg shadow-md border border-gray-200 flex items-center justify-between">
        <div className="text-sm">
          {message && <span className="text-green-700">{message}</span>}
          {error && <span className="text-red-700">{error}</span>}
        </div>
        <Button onClick={save} disabled={saving} size="lg">
          {saving ? "جاري الحفظ..." : "حفظ التغييرات"}
        </Button>
      </div>
    </div>
  );
}
