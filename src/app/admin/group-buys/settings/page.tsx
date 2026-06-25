"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";

interface Tier {
  minOrders: number;
  discountType: "percent" | "fixed" | "free_shipping";
  discountValue: number;
}

type GroupBuyContent = Record<string, string | string[]>;

export default function AdminGroupBuySettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [active, setActive] = useState(true);
  const [defaultDurationHours, setDefaultDurationHours] = useState(24);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [content, setContent] = useState<GroupBuyContent>({});

  useEffect(() => {
    fetch("/api/group-buys/config")
      .then(res => res.json())
      .then(json => {
        if (json.success && json.data) {
          setActive(json.data.active);
          setDefaultDurationHours(json.data.defaultDurationHours);
          setTiers(json.data.defaultTiers || []);
          setContent(json.data.content || {});
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    
    // Cleanup empty bullet points
    const cleanedContent = { ...content };
    if (Array.isArray(cleanedContent.modalBullets)) {
      cleanedContent.modalBullets = cleanedContent.modalBullets.filter((b: string) => b.trim() !== "");
    }

    try {
      const res = await fetch("/api/group-buys/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          active,
          defaultDurationHours,
          defaultTiers: tiers,
          content: cleanedContent
        })
      });
      const json = await res.json();
      if (json.success) setSaved(true);
    } catch (err) {
      console.error("Save error", err);
    } finally {
      setSaving(false);
    }
  }

  function handleContentChange(key: string, value: string | string[]) {
    setContent(prev => ({ ...prev, [key]: value }));
  }

  function updateTier<K extends keyof Tier>(index: number, field: K, value: Tier[K]) {
    const newTiers = [...tiers];
    newTiers[index] = { ...newTiers[index], [field]: value };
    setTiers(newTiers);
  }

  function removeTier(index: number) {
    setTiers(tiers.filter((_, i) => i !== index));
  }

  function addTier() {
    setTiers([...tiers, { minOrders: 2, discountType: "percent", discountValue: 10 }]);
  }

  if (loading) return <div className="p-10 text-center text-muted-foreground">جاري التحميل...</div>;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/group-buys">
            <Button variant="ghost" size="sm">🔙 رجوع</Button>
          </Link>
          <h1 className="text-2xl font-bold">إعدادات الشراء الجماعي</h1>
        </div>
        <div className="flex items-center gap-3">
          {saved && <span className="text-green-600 font-bold text-sm">تم الحفظ بنجاح ✓</span>}
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "جاري الحفظ..." : "💾 حفظ الإعدادات"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* General Settings */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>إعدادات عامة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
              <div>
                <Label className="text-base font-bold text-gray-900">تفعيل نظام الشراء الجماعي بالكامل</Label>
                <p className="text-sm text-gray-500 mt-1">لو قفلته، الأزرار هتختفي والناس مش هتعرف تعمل جروبات جديدة.</p>
              </div>
              <Select value={active ? "true" : "false"} onValueChange={(v) => setActive(v === "true")}>
                <SelectTrigger className="w-32 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">✅ مفعّل</SelectItem>
                  <SelectItem value="false">❌ معطّل</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>المدة الافتراضية للجروب (بالساعات)</Label>
                <Input 
                  type="number" min="1" 
                  value={defaultDurationHours} 
                  onChange={(e) => setDefaultDurationHours(parseInt(e.target.value) || 24)} 
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tiers Configuration */}
        <Card className="md:col-span-2 border-blue-100">
          <CardHeader className="bg-blue-50/50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>مستويات الخصم (Tiers)</CardTitle>
                <CardDescription>العميل بيقدر يختار مستوى الخصم اللي يناسبه وهو بيكريت الجروب.</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={addTier}>+ إضافة مستوى</Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {tiers.map((tier, idx) => (
              <div key={idx} className="flex flex-wrap items-end gap-3 p-4 border rounded-lg bg-white shadow-sm">
                <div className="space-y-1">
                  <Label className="text-xs">الطلبات المطلوبة</Label>
                  <Input 
                    type="number" min="2" className="w-24"
                    value={tier.minOrders} 
                    onChange={e => updateTier(idx, "minOrders", parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">نوع الخصم</Label>
                  <Select value={tier.discountType} onValueChange={(v) => updateTier(idx, "discountType", v as Tier["discountType"])}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percent">نسبة مئوية (%)</SelectItem>
                      <SelectItem value="fixed">مبلغ ثابت (ج.م)</SelectItem>
                      <SelectItem value="free_shipping">شحن مجاني</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {tier.discountType !== "free_shipping" && (
                  <div className="space-y-1">
                    <Label className="text-xs">القيمة</Label>
                    <Input 
                      type="number" min="1" className="w-24"
                      value={tier.discountValue} 
                      onChange={e => updateTier(idx, "discountValue", parseInt(e.target.value))}
                    />
                  </div>
                )}
                <Button variant="ghost" className="text-red-500 hover:text-red-700 ml-auto" onClick={() => removeTier(idx)}>
                  حذف 🗑️
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Content Settings - Column 1 */}
        <Card>
          <CardHeader>
            <CardTitle>نصوص صفحة المنتج والمودال</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>نص الزر الأساسي (CTA)</Label>
              <Input 
                value={content.ctaButton || ""} 
                onChange={e => handleContentChange("ctaButton", e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <Label>الجملة تحت الزر</Label>
              <Input 
                value={content.ctaSubtext || ""} 
                onChange={e => handleContentChange("ctaSubtext", e.target.value)} 
              />
            </div>
            <hr />
            <div className="space-y-2">
              <Label>عنوان المودال (النافذة)</Label>
              <Input 
                value={content.modalTitle || ""} 
                onChange={e => handleContentChange("modalTitle", e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <Label>شرح المودال</Label>
              <Textarea 
                value={content.modalDesc || ""} 
                onChange={e => handleContentChange("modalDesc", e.target.value)} 
                placeholder="متغير {hours} بيتم استبداله برقم الساعات"
              />
            </div>
          </CardContent>
        </Card>

        {/* Content Settings - Column 2 */}
        <Card>
          <CardHeader>
            <CardTitle>نصوص صفحة الجروب والمشاركة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>عنوان نجاح إنشاء الجروب</Label>
              <Input 
                value={content.groupCreatedTitle || ""} 
                onChange={e => handleContentChange("groupCreatedTitle", e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <Label>رسالة نجاح الاكتمال</Label>
              <Input 
                value={content.completedTitle || ""} 
                onChange={e => handleContentChange("completedTitle", e.target.value)} 
              />
            </div>
            <hr />
            <div className="space-y-2">
              <Label>عنوان بانر دعوة الصديق</Label>
              <Input 
                value={content.friendBannerTitle || ""} 
                onChange={e => handleContentChange("friendBannerTitle", e.target.value)} 
                placeholder="متغير {name} بيتم استبداله باسم المنشئ"
              />
            </div>
            <div className="space-y-2">
              <Label>رسالة المشاركة (واتساب)</Label>
              <Textarea 
                className="h-24"
                value={content.shareMessage || ""} 
                onChange={e => handleContentChange("shareMessage", e.target.value)} 
                placeholder="متغير {url} بيتم استبداله برابط الجروب"
              />
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
