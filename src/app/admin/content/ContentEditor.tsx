"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

// Map section codes to human-friendly labels
const SECTION_LABELS: Record<string, string> = {
  hero: "🏠 الرئيسية (Hero)",
  products: "📚 أقسام المنتجات",
  showcase: "🎠 أقسام سراج",
  counter: "📊 إحصائيات (العداد)",
  how: "📋 إزاي بنعمل القصة",
  values: "💎 القيم",
  testimonials: "💬 آراء العملاء",
  ribbon: "🎗️ شريط الدعوة للعمل",
  about: "📖 حكايتنا",
  mama: "👩‍👧‍👦 عالم ماما وبابا",
  footer: "🔻 الفوتر",
  wizard: "🧙 معالج القصة",
  general: "⚙️ نصوص عامة",
  pages: "📄 الصفحات الثابتة",
};

// Order for tabs display
const SECTION_ORDER = [
  "hero", "products", "showcase", "counter", "how", "values",
  "testimonials", "ribbon", "about", "mama", "footer", "wizard",
  "general", "pages",
];

// Human-readable labels for each key, grouped by section
const KEY_LABELS: Record<string, string> = {
  // Hero
  "hero.title": "العنوان الرئيسي",
  "hero.subtitle": "العنوان الفرعي",
  "hero.cta_primary": "الزر الأساسي (استكشف)",
  "hero.cta_secondary": "الزر الثانوي (اصنع قصة)",
  "hero.marquee": "الشريط المتحرك (مفصول بـ ✦)",

  // Products
  "products.kicker": "العنوان الصغير",
  "products.heading": "العنوان الرئيسي",

  // Showcase
  "showcase.kicker": "العنوان الصغير",
  "showcase.heading": "العنوان الرئيسي",
  "showcase.subtext": "النص التحتي",
  "showcase.cat1.title": "القسم ١: العنوان (قصص الفتوحات)",
  "showcase.cat1.desc": "القسم ١: الوصف",
  "showcase.cat1.cta": "القسم ١: نص الزر",
  "showcase.cat2.title": "القسم ٢: العنوان (القصة المخصصة)",
  "showcase.cat2.desc": "القسم ٢: الوصف",
  "showcase.cat2.cta": "القسم ٢: نص الزر",
  "showcase.cat3.title": "القسم ٣: العنوان (ألعاب سراج)",
  "showcase.cat3.desc": "القسم ٣: الوصف",
  "showcase.cat3.cta": "القسم ٣: نص الزر",
  "showcase.cat4.title": "القسم ٤: العنوان (عالم ماما وبابا)",
  "showcase.cat4.desc": "القسم ٤: الوصف",
  "showcase.cat4.cta": "القسم ٤: نص الزر",
  "showcase.cat5.title": "القسم ٥: العنوان (مغامرات سراج)",
  "showcase.cat5.desc": "القسم ٥: الوصف",
  "showcase.cat5.cta": "القسم ٥: نص الزر",

  // Counter
  "counter.kicker": "العنوان الصغير",
  "counter.heading": "العنوان الرئيسي",
  "counter.subtext": "النص التحتي",

  // How
  "how.kicker": "العنوان الصغير",
  "how.heading": "العنوان الرئيسي",
  "how.step1_title": "خطوة ١: العنوان",
  "how.step1_desc": "خطوة ١: الوصف",
  "how.step2_title": "خطوة ٢: العنوان",
  "how.step2_desc": "خطوة ٢: الوصف",
  "how.step3_title": "خطوة ٣: العنوان",
  "how.step3_desc": "خطوة ٣: الوصف",

  // Values
  "values.kicker": "العنوان الصغير",
  "values.heading": "العنوان الرئيسي",

  // Testimonials
  "testimonials.kicker": "العنوان الصغير",
  "testimonials.heading": "العنوان الرئيسي",

  // Ribbon
  "ribbon.heading": "العنوان",
  "ribbon.subtext": "النص التحتي",
  "ribbon.cta": "نص الزر",

  // About
  "about.kicker": "العنوان الصغير",
  "about.heading": "العنوان الرئيسي",
  "about.quote": "الاقتباس",
  "about.story": "القصة",

  // Mama
  "mama.hero_title": "العنوان الرئيسي",
  "mama.hero_desc": "الوصف",

  // Footer
  "footer.brand_text": "نص العلامة التجارية",
  "footer.copyright": "حقوق النشر",
  "footer.whatsapp": "رقم الواتساب",
  "footer.email": "البريد الإلكتروني",
  "footer.instagram": "حساب الانستجرام",
  "footer.col1_title": "عمود ١: العنوان (سِراج)",
  "footer.col2_title": "عمود ٢: العنوان (تواصلي معانا)",
  "footer.col3_title": "عمود ٣: العنوان (الدعم)",

  // Wizard
  "wizard.step1_q": "خطوة ١: السؤال",
  "wizard.step1_speech": "خطوة ١: كلام سراج",
  "wizard.step2_q": "خطوة ٢: السؤال",
  "wizard.step2_speech": "خطوة ٢: كلام سراج",
  "wizard.step3_q": "خطوة ٣: السؤال",
  "wizard.step3_speech": "خطوة ٣: كلام سراج",

  // General
  "nav.mama": "رابط: عالم ماما وبابا",
  "nav.products": "رابط: المنتجات",
  "nav.about": "رابط: حكايتنا",
  "success.title": "نجاح الطلب: العنوان",
  "success.desc": "نجاح الطلب: الوصف",
  "notfound.title": "صفحة غير موجودة: العنوان",

  // Pages
  "faq.title": "الأسئلة المتكررة: العنوان",
  "faq.content": "الأسئلة المتكررة: المحتوى",
  "shipping.title": "الشحن والتوصيل: العنوان",
  "shipping.content": "الشحن والتوصيل: المحتوى",
  "returns.title": "سياسة الاسترجاع: العنوان",
  "returns.content": "سياسة الاسترجاع: المحتوى",

};

// Short single-line fields
const SHORT_KEYS = new Set([
  "hero.cta_primary", "hero.cta_secondary",
  "showcase.cat1.cta", "showcase.cat2.cta", "showcase.cat3.cta", "showcase.cat4.cta", "showcase.cat5.cta",
  "ribbon.cta",
  "nav.mama", "nav.products", "nav.about",
  "footer.col1_title", "footer.col2_title", "footer.col3_title",
  "footer.whatsapp", "footer.email", "footer.instagram",
]);

// Section-level grouping hints for visual separators
const GROUP_SEPARATORS: Record<string, Record<string, string>> = {
  showcase: {
    "showcase.kicker": "عنوان القسم",
    "showcase.cat1.title": "🐴 القسم ١ — قصص الفتوحات",
    "showcase.cat2.title": "⭐ القسم ٢ — القصة المخصصة",
    "showcase.cat3.title": "🧩 القسم ٣ — ألعاب سراج",
    "showcase.cat4.title": "👩‍👧‍👦 القسم ٤ — عالم ماما وبابا",
    "showcase.cat5.title": "🐰 القسم ٥ — مغامرات سراج",
  },
  how: {
    "how.kicker": "عنوان القسم",
    "how.step1_title": "١️⃣ الخطوة الأولى",
    "how.step2_title": "٢️⃣ الخطوة الثانية",
    "how.step3_title": "٣️⃣ الخطوة الثالثة",
  },
  wizard: {
    "wizard.step1_q": "١️⃣ الخطوة الأولى",
    "wizard.step2_q": "٢️⃣ الخطوة الثانية",
    "wizard.step3_q": "٣️⃣ الخطوة الثالثة",
  },
};

export default function ContentEditor({ initialData }: { initialData: Record<string, Record<string, string>> }) {
  const [data, setData] = useState(initialData);
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Sort sections by predefined order
  const sections = Object.keys(data).sort(
    (a, b) => SECTION_ORDER.indexOf(a) - SECTION_ORDER.indexOf(b)
  );
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
    setSaving(section);
    setMessage(null);

    try {
      const items = Object.entries(data[section]).map(([key, value]) => ({ key, value }));

      const res = await fetch("/api/content", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });

      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "فشل الحفظ");

      setMessage("تم الحفظ بنجاح! ✓");
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      alert("Error: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setSaving(null);
    }
  };

  const renderField = (section: string, key: string, val: string) => {
    const label = KEY_LABELS[key] || key;
    const isShort = SHORT_KEYS.has(key);
    const isHtml = key.includes("title") || key.includes("subtitle") || key.includes("heading") || key.includes("marquee") || section === "showcase" && key.includes(".desc");
    const isNumeric = false;

    return (
      <div key={key} className="space-y-1.5">
        <label className="text-sm font-semibold text-gray-800 block">
          {label}
        </label>
        {isShort || isNumeric ? (
          <Input
            dir="rtl"
            type={isNumeric ? "number" : "text"}
            value={val}
            onChange={(e) => handleTextChange(section, key, e.target.value)}
            className="text-base"
          />
        ) : (
          <Textarea
            dir="rtl"
            value={val}
            onChange={(e) => handleTextChange(section, key, e.target.value)}
            className="min-h-[90px] text-base leading-relaxed"
          />
        )}
        {isHtml && !isShort && (
          <p className="text-xs text-muted-foreground">
            يدعم HTML: <code>&lt;br/&gt;</code> سطر جديد · <code>&lt;span class=&quot;highlight&quot;&gt;كلمة&lt;/span&gt;</code> تمييز باللون
          </p>
        )}
      </div>
    );
  };

  const renderGroupSeparator = (label: string) => (
    <div className="flex items-center gap-3 pt-4 pb-1">
      <div className="h-px bg-gray-200 flex-1" />
      <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">{label}</span>
      <div className="h-px bg-gray-200 flex-1" />
    </div>
  );

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <Tabs defaultValue={firstSection} dir="rtl">
        <TabsList className="mb-6 flex-wrap h-auto gap-1 bg-gray-50 border border-gray-100 p-1">
          {sections.map((sec) => (
            <TabsTrigger
              key={sec}
              value={sec}
              className="data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs sm:text-sm"
            >
              {SECTION_LABELS[sec] || sec}
            </TabsTrigger>
          ))}
        </TabsList>

        {sections.map((sec) => {
          const entries = Object.entries(data[sec]);
          const separators = GROUP_SEPARATORS[sec];

          return (
            <TabsContent key={sec} value={sec}>
              <div className="space-y-5">
                {entries.map(([key, val], idx) => {
                  const separatorLabel = separators?.[key];
                  return (
                    <div key={key}>
                      {separatorLabel && renderGroupSeparator(separatorLabel)}
                      {renderField(sec, key, val)}
                    </div>
                  );
                })}

                <div className="pt-4 border-t border-gray-100 flex items-center gap-4">
                  <Button onClick={() => handleSave(sec)} disabled={saving !== null}>
                    {saving === sec ? "جاري الحفظ..." : `💾 حفظ (${SECTION_LABELS[sec]?.replace(/^[^\s]+\s/, "") || sec})`}
                  </Button>
                  {message && <span className="text-sm text-green-600 font-medium">{message}</span>}
                </div>
              </div>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
