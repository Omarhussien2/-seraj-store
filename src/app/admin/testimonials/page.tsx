"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Testimonial {
  _id: string;
  name: string;
  quote: string;
  location: string;
  childAge: string;
  avatarInitials: string;
  avatarColor: string;
  order: number;
  active: boolean;
}

const emptyTestimonial: Partial<Testimonial> = {
  name: "",
  quote: "",
  location: "",
  childAge: "",
  avatarInitials: "",
  avatarColor: "#6bbf3f",
  order: 0,
  active: true,
};

export default function TestimonialsAdmin() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<Partial<Testimonial> | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchTestimonials = useCallback(async () => {
    try {
      const res = await fetch("/api/testimonials?all=true");
      const data = await res.json();
      if (data.success) {
        setTestimonials(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch testimonials:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTestimonials();
  }, [fetchTestimonials]);

  const openCreate = () => {
    setEditingTestimonial({ ...emptyTestimonial });
    setDialogOpen(true);
  };

  const openEdit = (testimonial: Testimonial) => {
    setEditingTestimonial({ ...testimonial });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingTestimonial) return;
    setSaving(true);
    try {
      const isEdit = !!editingTestimonial._id;
      const url = isEdit
        ? `/api/testimonials/${editingTestimonial._id}`
        : "/api/testimonials";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingTestimonial),
      });

      const data = await res.json();
      if (data.success) {
        setDialogOpen(false);
        fetchTestimonials();
      } else {
        alert(data.error || "Failed to save");
      }
    } catch (err) {
      console.error("Save error:", err);
      alert("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الرأي؟")) return;
    try {
      const res = await fetch(`/api/testimonials/${id}`, { method: "DELETE" });
      if ((await res.json()).success) fetchTestimonials();
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const updateField = (field: keyof Testimonial, value: any) => {
    setEditingTestimonial((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  return (
    <div dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">إدارة الآراء</h1>
        <Button onClick={openCreate}>+ إضافة رأي</Button>
      </div>

      {loading ? (
        <p className="text-gray-500">جاري التحميل...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-gray-600">
                <th className="text-right py-3 px-2">#</th>
                <th className="text-right py-3 px-2">الاسم</th>
                <th className="text-right py-3 px-2">الرأي</th>
                <th className="text-right py-3 px-2">الحالة</th>
                <th className="text-right py-3 px-2">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {testimonials.map((t, i) => (
                <tr key={t._id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-2">{i + 1}</td>
                  <td className="py-3 px-2 font-medium">
                    <div className="flex items-center gap-2">
                       <span className="w-6 h-6 rounded-full flex items-center justify-center text-white" style={{ background: t.avatarColor }}>{t.avatarInitials}</span>
                       <span>{t.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-2 max-w-xs truncate">{t.quote}</td>
                  <td className="py-3 px-2">
                    <span
                      className={`px-2 py-0.5 rounded text-xs ${
                        t.active
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {t.active ? "نشط" : "مخفي"}
                    </span>
                  </td>
                  <td className="py-3 px-2">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEdit(t)}
                      >
                        تعديل
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600"
                        onClick={() => handleDelete(t._id)}
                      >
                        حذف
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {testimonials.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400">
                    لا توجد آراء مسجلة
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Editor Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>
              {editingTestimonial?._id ? "تعديل رأي" : "رأي جديد"}
            </DialogTitle>
          </DialogHeader>

          {editingTestimonial && (
            <div className="space-y-4 pt-2">
              <input
                type="text"
                placeholder="اسم الأم"
                className="w-full border rounded-lg px-3 py-2"
                value={editingTestimonial.name || ""}
                onChange={(e) => updateField("name", e.target.value)}
              />
              <textarea
                placeholder="الرأي / الاقتباس"
                rows={3}
                className="w-full border rounded-lg px-3 py-2"
                value={editingTestimonial.quote || ""}
                onChange={(e) => updateField("quote", e.target.value)}
              />
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="المكان (مثال: القاهرة)"
                  className="flex-1 border rounded-lg px-3 py-2"
                  value={editingTestimonial.location || ""}
                  onChange={(e) => updateField("location", e.target.value)}
                />
                <input
                  type="text"
                  placeholder="سن الطفل (مثال: ٥ سنين)"
                  className="flex-1 border rounded-lg px-3 py-2"
                  value={editingTestimonial.childAge || ""}
                  onChange={(e) => updateField("childAge", e.target.value)}
                />
              </div>
              <div className="flex gap-3">
                 <input
                  type="text"
                  placeholder="أول حرف (أيقونة)"
                  maxLength={2}
                  className="w-24 border rounded-lg px-3 py-2"
                  value={editingTestimonial.avatarInitials || ""}
                  onChange={(e) => updateField("avatarInitials", e.target.value)}
                />
                <input
                  type="color"
                  title="لون الأيقونة"
                  className="w-12 h-10 border rounded-lg p-0 cursor-pointer"
                  value={editingTestimonial.avatarColor || "#6bbf3f"}
                  onChange={(e) => updateField("avatarColor", e.target.value)}
                />
                <input
                  type="number"
                  placeholder="الترتيب"
                  title="الترتيب"
                  className="w-24 border rounded-lg px-3 py-2"
                  value={editingTestimonial.order || 0}
                  onChange={(e) => updateField("order", parseInt(e.target.value))}
                />
                 <label className="flex items-center gap-2 mr-4">
                  <input
                    type="checkbox"
                    checked={editingTestimonial.active ?? true}
                    onChange={(e) => updateField("active", e.target.checked)}
                  />
                  <span className="text-sm">نشط</span>
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? "جاري الحفظ..." : "حفظ الرأي"}
                </Button>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  إلغاء
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
