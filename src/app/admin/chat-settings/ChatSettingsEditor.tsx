"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type Chip = { label: string; question: string };
type RoutesMode = "all" | "whitelist" | "blacklist";
type AiProvider = "auto" | "gemini" | "deepseek";
type Settings = {
  enabled: boolean;
  whatsappNumber: string;
  welcomeTitle: string;
  welcomeSubtitle: string;
  chips: Chip[];
  systemPrompt: string;
  routesMode: RoutesMode;
  routesList: string[];
  pulseEnabled: boolean;
  pulseFirstDelayMs: number;
  pulseIntervalMs: number;
  themeColor: string;
  aiProvider: AiProvider;
  aiModel: string;
  aiTemperature: number;
  aiMaxTokens: number;
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

      {/* Routes whitelist / blacklist */}
      <section className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 space-y-3">
        <h2 className="text-lg font-semibold">صفحات ظهور الشات</h2>
        <p className="text-sm text-muted-foreground">
          تحكم في أي صفحات يظهر فيها زر سِراج العائم. الـ paths تتطابق ببداية الـ URL (مثلاً <code className="bg-gray-100 px-1 rounded">/checkout</code> يطابق أي صفحة تبدأ بكده).
        </p>
        <div className="space-y-2">
          {(["all", "whitelist", "blacklist"] as const).map((mode) => (
            <label key={mode} className="flex items-start gap-2 cursor-pointer">
              <input
                type="radio"
                name="routesMode"
                checked={data.routesMode === mode}
                onChange={() => update("routesMode", mode)}
                className="mt-1"
              />
              <span className="text-sm">
                {mode === "all" && <strong>كل الصفحات</strong>}
                {mode === "whitelist" && <strong>إظهار على الصفحات دي بس</strong>}
                {mode === "blacklist" && <strong>إخفاء على الصفحات دي</strong>}
              </span>
            </label>
          ))}
        </div>
        {data.routesMode !== "all" && (
          <div>
            <Label htmlFor="routesList">قائمة الـ paths (سطر لكل path)</Label>
            <Textarea
              id="routesList"
              value={data.routesList.join("\n")}
              onChange={(e) =>
                update(
                  "routesList",
                  e.target.value.split("\n").map((s) => s.trim()).filter(Boolean)
                )
              }
              rows={6}
              dir="ltr"
              placeholder={"/checkout\n/admin\n/order"}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">
              مثال: <code className="bg-gray-100 px-1 rounded">/checkout</code> يخفي الزر على /checkout، /checkout/success، إلخ.
            </p>
          </div>
        )}
      </section>

      {/* Pulse animation */}
      <section className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">نبضة الزر العائم</h2>
            <p className="text-sm text-muted-foreground mt-1">
              حلقة نبض حوالين الزر تلفت انتباه الزائر قبل أول فتح للشات.
            </p>
          </div>
          <label className="inline-flex items-center gap-2 cursor-pointer select-none">
            <span className="text-sm font-medium">
              {data.pulseEnabled ? "مُفعّل" : "معطّل"}
            </span>
            <input
              type="checkbox"
              className="h-5 w-5 accent-green-600"
              checked={data.pulseEnabled}
              onChange={(e) => update("pulseEnabled", e.target.checked)}
            />
          </label>
        </div>
        {data.pulseEnabled && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="pulseFirstDelay">أول نبضة بعد (ثانية)</Label>
              <Input
                id="pulseFirstDelay"
                type="number"
                min={0}
                max={600}
                value={Math.round(data.pulseFirstDelayMs / 1000)}
                onChange={(e) =>
                  update("pulseFirstDelayMs", Math.max(0, Number(e.target.value || 0)) * 1000)
                }
              />
            </div>
            <div>
              <Label htmlFor="pulseInterval">تكرار كل (ثانية)</Label>
              <Input
                id="pulseInterval"
                type="number"
                min={5}
                max={600}
                value={Math.round(data.pulseIntervalMs / 1000)}
                onChange={(e) =>
                  update("pulseIntervalMs", Math.max(0, Number(e.target.value || 0)) * 1000)
                }
              />
            </div>
          </div>
        )}
      </section>

      {/* Theme color */}
      <section className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 space-y-3">
        <h2 className="text-lg font-semibold">لون الشات</h2>
        <p className="text-sm text-muted-foreground">
          يطبّق على هيدر الشات + الـ chips + رسائل المستخدم + زر الإرسال. الافتراضي أخضر سِراج (<code className="bg-gray-100 px-1 rounded">#6bbf3f</code>).
        </p>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={data.themeColor}
            onChange={(e) => update("themeColor", e.target.value)}
            className="h-10 w-16 rounded border border-gray-300 cursor-pointer"
          />
          <Input
            value={data.themeColor}
            onChange={(e) => update("themeColor", e.target.value)}
            className="font-mono"
            dir="ltr"
            maxLength={7}
            placeholder="#6bbf3f"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => update("themeColor", "#6bbf3f")}
          >
            استرجاع الأصلي
          </Button>
        </div>
      </section>

      {/* AI provider / model */}
      <section className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 space-y-3">
        <h2 className="text-lg font-semibold">الذكاء الاصطناعي (Provider & Model)</h2>
        <p className="text-sm text-muted-foreground">
          المفاتيح (Gemini, DeepSeek) لسه في الـ environment variables ولا تُكتب هنا. الإعدادات دي بتتحكم في إيه اللي يُستخدم وإزاي.
        </p>
        <div>
          <Label>Provider</Label>
          <div className="space-y-1 mt-1">
            {(["auto", "gemini", "deepseek"] as const).map((p) => (
              <label key={p} className="flex items-start gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="aiProvider"
                  checked={data.aiProvider === p}
                  onChange={() => update("aiProvider", p)}
                  className="mt-1"
                />
                <span className="text-sm">
                  {p === "auto" && <><strong>تلقائي (Gemini ثم DeepSeek كاحتياطي)</strong> — السلوك الافتراضي</>}
                  {p === "gemini" && <strong>Gemini فقط</strong>}
                  {p === "deepseek" && <strong>DeepSeek فقط</strong>}
                </span>
              </label>
            ))}
          </div>
        </div>
        <div>
          <Label htmlFor="aiModel">اسم الـ Model (اختياري)</Label>
          <Input
            id="aiModel"
            value={data.aiModel}
            onChange={(e) => update("aiModel", e.target.value)}
            placeholder={
              data.aiProvider === "deepseek"
                ? "deepseek-chat"
                : data.aiProvider === "gemini"
                ? "gemini-2.5-flash"
                : "اتركه فاضي للقيمة الافتراضية"
            }
            dir="ltr"
            className="font-mono text-sm"
            maxLength={80}
          />
          <p className="text-xs text-muted-foreground mt-1">
            لو فاضي، يستخدم القيمة من الـ env var (<code>GEMINI_MODEL</code> / <code>DEEPSEEK_MODEL</code>) أو الافتراضي.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label htmlFor="aiTemp">Temperature ({data.aiTemperature.toFixed(2)})</Label>
            <Input
              id="aiTemp"
              type="range"
              min={0}
              max={2}
              step={0.05}
              value={data.aiTemperature}
              onChange={(e) => update("aiTemperature", Number(e.target.value))}
            />
            <p className="text-xs text-muted-foreground mt-1">
              0 = ردود ثابتة جداً، 2 = ردود إبداعية متغيرة. الموصى به: 0.5–0.9
            </p>
          </div>
          <div>
            <Label htmlFor="aiMaxTokens">Max tokens (طول الرد الأقصى)</Label>
            <Input
              id="aiMaxTokens"
              type="number"
              min={64}
              max={4096}
              value={data.aiMaxTokens}
              onChange={(e) => update("aiMaxTokens", Math.max(64, Number(e.target.value || 0)))}
            />
          </div>
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
