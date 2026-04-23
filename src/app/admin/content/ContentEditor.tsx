"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

// Map section codes to human friendly labels
const SECTION_LABELS: Record<string, string> = {
  hero: "الرئيسية (Hero)",
  products: "أقسام المنتجات",
  counter: "إحصائيات (العداد)",
  how: "إزاي بنعمل القصة",
  values: "القيم",
  testimonials: "آراء العملاء",
  ribbon: "شريط الدعوة للعمل (Ribbon)",
  about: "حكايتنا",
  mama: "عالم ماما وبابا",
  footer: "الفوتر",
  wizard: "معالج القصة (الساحر)",
  general: "نصوص عامة",
  pages: "الصفحات الثابتة"
};

export default function ContentEditor({ initialData }: { initialData: Record<string, Record<string, string>> }) {
  const [data, setData] = useState(initialData);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const sections = Object.keys(data);
  const firstSection = sections[0] || "hero";

  const handleTextChange = (section: string, key: string, newValue: string) => {
    setData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: newValue,
      },
    }));
  };

  const handleSave = async (section: string) => {
    setSaving(true);
    setMessage(null);

    try {
      // Build array of items just for this section
      const items = Object.entries(data[section]).map(([key, value]) => ({ key, value }));

      const res = await fetch("/api/content", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });

      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "فشل الحفظ");

      setMessage("تم الحفظ بنجاح!");
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <Tabs defaultValue={firstSection} dir="rtl">
        <TabsList className="mb-6 flex-wrap h-auto gap-1 bg-gray-50 border border-gray-100 p-1">
          {sections.map((sec) => (
            <TabsTrigger key={sec} value={sec} className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
              {SECTION_LABELS[sec] || sec}
            </TabsTrigger>
          ))}
        </TabsList>

        {sections.map((sec) => (
          <TabsContent key={sec} value={sec}>
            <div className="space-y-6">
              {Object.entries(data[sec]).map(([key, val]) => (
                <div key={key} className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 block" dir="ltr" style={{ textAlign: "left" }}>
                    {key}
                  </label>
                  <Textarea
                    dir="rtl"
                    value={val}
                    onChange={(e) => handleTextChange(sec, key, e.target.value)}
                    className="min-h-[100px] text-base leading-relaxed"
                  />
                  {key.includes("subtitle") || key.includes("title") ? (
                    <p className="text-xs text-muted-foreground">يمكنك استخدام <code>&lt;br/&gt;</code> لسطر جديد أو <code>&lt;span class="highlight"&gt;كلمة&lt;/span&gt;</code> للتمييز.</p>
                  ) : null}
                </div>
              ))}

              <div className="pt-4 border-t border-gray-100 flex items-center gap-4">
                <Button onClick={() => handleSave(sec)} disabled={saving}>
                  {saving ? "جاري الحفظ..." : `حفظ التعديلات (${SECTION_LABELS[sec] || sec})`}
                </Button>
                {message && <span className="text-sm text-green-600 font-medium">{message}</span>}
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
