"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Category {
  _id: string;
  nameAr: string;
  slug: string;
  parentSlug?: string | null;
  order: number;
  featured: boolean;
  active: boolean;
  thumbnail?: string;
  icon: string;
  itemCount: number;
  children?: Category[];
}

const emptyCategory: Partial<Category> = {
  nameAr: "",
  slug: "",
  parentSlug: null,
  order: 0,
  featured: false,
  active: true,
  thumbnail: "",
  icon: "🎨"
};

export default function ColoringCategoriesAdmin() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Partial<Category> | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchCats = useCallback(async () => {
    try {
      const res = await fetch("/api/coloring/categories?tree=1&all=true");
      const data = await res.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCats();
  }, [fetchCats]);

  const openCreate = () => {
    setEditingCat({ ...emptyCategory });
    setDialogOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditingCat(cat);
    setDialogOpen(true);
  };

  const updateField = (field: string, value: any) => {
    setEditingCat((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success && data.data?.[0]) {
        updateField("thumbnail", data.data[0].url);
      }
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!editingCat || !editingCat.nameAr) return alert("الاسم مطلوب");
    setSaving(true);
    try {
      const isEdit = !!editingCat._id;
      const url = isEdit ? `/api/coloring/categories/${editingCat.slug}` : "/api/coloring/categories";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingCat),
      });

      const data = await res.json();
      if (data.success) {
        setDialogOpen(false);
        fetchCats();
      } else {
        alert(data.error || "فشل الحفظ");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving category");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (slug: string) => {
    if (!confirm("تأكيد الحذف؟ لن يمكن التراجع")) return;
    try {
      const res = await fetch(`/api/coloring/categories/${slug}`, { method: "DELETE" });
      if ((await res.json()).success) fetchCats();
    } catch(e) {}
  };

  // Flatten logic to render rows easily
  const renderRows = () => {
    const rows: React.ReactElement[] = [];
    categories.forEach(parent => {
       rows.push(
         <tr key={parent._id} className="border-b bg-gray-50">
            <td className="py-3 px-2 font-bold">{parent.icon} {parent.nameAr}</td>
            <td className="py-3 px-2">-</td>
            <td className="py-3 px-2">{parent.itemCount || 0}</td>
            <td className="py-3 px-2">{parent.featured ? "✅" : ""}</td>
            <td className="py-3 px-2">{parent.order}</td>
            <td className="py-3 px-2">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => openEdit(parent)}>تعديل</Button>
                <Button variant="outline" size="sm" className="text-red-600" onClick={() => handleDelete(parent.slug)}>حذف</Button>
              </div>
            </td>
         </tr>
       );
       if (parent.children) {
         parent.children.forEach(child => {
           rows.push(
             <tr key={child._id} className="border-b">
                <td className="py-3 px-2 pr-6">↳ {child.icon} {child.nameAr}</td>
                <td className="py-3 px-2">{parent.nameAr}</td>
                <td className="py-3 px-2">{child.itemCount || 0}</td>
                <td className="py-3 px-2">{child.featured ? "✅" : ""}</td>
                <td className="py-3 px-2">{child.order}</td>
                <td className="py-3 px-2">
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEdit(child)}>تعديل</Button>
                    <Button variant="outline" size="sm" className="text-red-600" onClick={() => handleDelete(child.slug)}>حذف</Button>
                  </div>
                </td>
             </tr>
           );
         });
       }
    });
    return rows;
  };

  return (
    <div dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">أقسام الألوان</h1>
        <Button onClick={openCreate}>+ قسم جديد</Button>
      </div>

      {loading ? <p>جاري التحميل...</p> : (
        <table className="w-full text-sm">
          <thead>
             <tr className="border-b text-gray-600">
               <th className="text-right py-3 px-2">القسم</th>
               <th className="text-right py-3 px-2">القسم الأب</th>
               <th className="text-right py-3 px-2">عدد الصور</th>
               <th className="text-right py-3 px-2">مميز</th>
               <th className="text-right py-3 px-2">الترتيب</th>
               <th className="text-right py-3 px-2">إجراءات</th>
             </tr>
          </thead>
          <tbody>
            {renderRows()}
            {categories.length === 0 && <tr><td colSpan={6} className="py-6 text-center">لا يوجد أقسام</td></tr>}
          </tbody>
        </table>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editingCat?._id ? "تعديل قسم" : "قسم جديد"}</DialogTitle>
          </DialogHeader>

          {editingCat && (
            <div className="space-y-4">
               <div>
                  <label className="text-sm">الاسم (عربي)</label>
                  <input type="text" className="w-full border rounded px-3 py-2 mt-1" value={editingCat.nameAr || ""} onChange={(e) => updateField("nameAr", e.target.value)} />
               </div>

               <div className="flex gap-4">
                 <div className="flex-1">
                   <label className="text-sm">الslug (اختياري)</label>
                   <input type="text" className="w-full border rounded px-3 py-2 mt-1 text-left" dir="ltr" value={editingCat.slug || ""} onChange={(e) => updateField("slug", e.target.value)} />
                 </div>
                 <div className="w-20">
                   <label className="text-sm">أيقونة</label>
                   <input type="text" className="w-full border rounded px-3 py-2 mt-1 text-center" value={editingCat.icon || ""} onChange={(e) => updateField("icon", e.target.value)} />
                 </div>
               </div>

               <div>
                 <label className="text-sm">القسم الأب</label>
                 <select className="w-full border rounded px-3 py-2 mt-1" value={editingCat.parentSlug || ""} onChange={(e) => updateField("parentSlug", e.target.value || null)}>
                   <option value="">بدون (قسم رئيسي)</option>
                   {categories.filter(c => c.slug !== editingCat.slug).map(c => (
                      <option key={c._id} value={c.slug}>{c.nameAr}</option>
                   ))}
                 </select>
               </div>

               <div className="flex gap-4 items-center flex-wrap">
                 <div className="flex items-center gap-2">
                    <input type="checkbox" checked={!!editingCat.featured} onChange={(e) => updateField("featured", e.target.checked)} />
                    <label className="text-sm">قسم مميز في الرئيسية</label>
                 </div>
                 <div className="flex items-center gap-2">
                    <input type="checkbox" checked={!!editingCat.active} onChange={(e) => updateField("active", e.target.checked)} />
                    <label className="text-sm">نشط (يظهر للزوار)</label>
                 </div>
                 <div className="flex items-center gap-2">
                    <label className="text-sm">الترتيب</label>
                    <input type="number" className="border rounded w-20 px-2 py-1" value={editingCat.order || 0} onChange={(e) => updateField("order", parseInt(e.target.value))} />
                 </div>
               </div>

               <div>
                 <label className="text-sm block mb-1">صورة الغلاف</label>
                 {editingCat.thumbnail && <img src={editingCat.thumbnail} className="w-32 h-32 object-cover rounded mb-2" />}
                 <input type="file" accept="image/*" onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleUpload(f);
                 }}/>
                 {uploading && <span className="text-sm text-gray-500 mr-2">جاري الرفع...</span>}
               </div>

               <div className="flex gap-2 pt-4">
                 <Button onClick={handleSave} disabled={saving}>{saving ? "جاري الحفظ..." : "حفظ"}</Button>
                 <Button variant="outline" onClick={() => setDialogOpen(false)}>إلغاء</Button>
               </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
