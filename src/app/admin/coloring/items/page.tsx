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
}

interface ColoringItem {
  _id: string;
  slug: string;
  title: string;
  categorySlug: string;
  thumbnail: string;
  fullImageUrl?: string;
  sourceUrl?: string;
  sourceName?: string;
  type: string;
  difficulty: string;
  ageRange: string;
  tags: string[];
  license: string;
  attribution?: string;
  active: boolean;
  featured: boolean;
  printable: boolean;
  order: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasMore: boolean;
}

const emptyItem: Partial<ColoringItem> = {
  title: "",
  categorySlug: "",
  thumbnail: "",
  fullImageUrl: "",
  sourceUrl: "",
  sourceName: "",
  type: "coloring",
  difficulty: "easy",
  ageRange: "3-6",
  tags: [],
  license: "free-link",
  attribution: "",
  active: true,
  featured: false,
  printable: true,
  order: 0,
};

export default function ColoringItemsAdmin() {
  const [items, setItems] = useState<ColoringItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<ColoringItem> | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingFull, setUploadingFull] = useState(false);

  // Filters
  const [filterCategory, setFilterCategory] = useState("");
  const [filterDifficulty, setFilterDifficulty] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 24,
    total: 0,
    pages: 0,
    hasMore: false,
  });

  // Tags input as comma-separated string
  const [tagsInput, setTagsInput] = useState("");

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/coloring/categories?all=true");
      const data = await res.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchItems = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "24");
      if (filterCategory) params.set("category", filterCategory);
      if (filterDifficulty) params.set("difficulty", filterDifficulty);
      if (searchQuery.trim()) params.set("q", searchQuery.trim());
      params.set("all", "true");

      const res = await fetch(`/api/coloring/items?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setItems(data.data);
        setPagination(data.pagination);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filterCategory, filterDifficulty, searchQuery]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchItems(1);
  }, [fetchItems]);

  const openCreate = () => {
    setEditingItem({ ...emptyItem });
    setTagsInput("");
    setDialogOpen(true);
  };

  const openEdit = (item: ColoringItem) => {
    setEditingItem({ ...item });
    setTagsInput(item.tags?.join(", ") || "");
    setDialogOpen(true);
  };

  const updateField = (field: string, value: any) => {
    setEditingItem((prev) => (prev ? { ...prev, [field]: value } : prev));
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

  const handleUploadFull = async (file: File) => {
    setUploadingFull(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success && data.data?.[0]) {
        updateField("fullImageUrl", data.data[0].url);
      }
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setUploadingFull(false);
    }
  };

  const handleSave = async () => {
    if (!editingItem || !editingItem.title) return alert("العنوان مطلوب");
    if (!editingItem.categorySlug) return alert("القسم مطلوب");
    if (!editingItem.thumbnail) return alert("الصورة المصغرة مطلوبة");

    setSaving(true);
    try {
      const isEdit = !!editingItem._id;
      const url = isEdit
        ? `/api/coloring/items/${editingItem.slug}`
        : "/api/coloring/items";
      const method = isEdit ? "PATCH" : "POST";

      // Parse tags from comma-separated input
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const body = { ...editingItem, tags };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.success) {
        setDialogOpen(false);
        fetchItems(pagination.page);
      } else {
        alert(data.error || "فشل الحفظ");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving item");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (slug: string) => {
    if (!window.confirm("تأكيد الحذف؟ سيتم إخفاء العنصر أولاً ثم حذفه نهائياً عند التأكيد مرة أخرى.")) return;
    try {
      const res = await fetch(`/api/coloring/items/${slug}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        fetchItems(pagination.page);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getCategoryName = (slug: string) => {
    const cat = categories.find((c) => c.slug === slug);
    return cat ? cat.nameAr : slug;
  };

  const getDifficultyBadge = (difficulty: string) => {
    const styles: Record<string, string> = {
      easy: "bg-green-500 text-white",
      medium: "bg-yellow-500 text-white",
      hard: "bg-red-500 text-white",
    };
    const labels: Record<string, string> = {
      easy: "سهل",
      medium: "متوسط",
      hard: "صعب",
    };
    return (
      <span className={`rounded-full px-2 py-0.5 text-xs ${styles[difficulty] || "bg-gray-200"}`}>
        {labels[difficulty] || difficulty}
      </span>
    );
  };

  const goToPage = (page: number) => {
    if (page < 1 || page > pagination.pages) return;
    fetchItems(page);
  };

  return (
    <div dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">إدارة الرسومات</h1>
        <Button onClick={openCreate}>+ إضافة رسمة جديدة</Button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-3 mb-4">
        <select
          className="border rounded px-3 py-2 text-sm"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option value="">كل الأقسام</option>
          {categories.map((cat) => (
            <option key={cat._id} value={cat.slug}>
              {cat.nameAr}
            </option>
          ))}
        </select>

        <select
          className="border rounded px-3 py-2 text-sm"
          value={filterDifficulty}
          onChange={(e) => setFilterDifficulty(e.target.value)}
        >
          <option value="">كل المستويات</option>
          <option value="easy">سهل</option>
          <option value="medium">متوسط</option>
          <option value="hard">صعب</option>
        </select>

        <input
          type="text"
          className="border rounded px-3 py-2 text-sm w-64"
          placeholder="بحث بالعنوان..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Items Table */}
      {loading ? (
        <p>جاري التحميل...</p>
      ) : (
        <>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-gray-600">
                <th className="text-right py-3 px-2">صورة مصغرة</th>
                <th className="text-right py-3 px-2">العنوان</th>
                <th className="text-right py-3 px-2">القسم</th>
                <th className="text-right py-3 px-2">الصعوبة</th>
                <th className="text-right py-3 px-2">النوع</th>
                <th className="text-right py-3 px-2">الترخيص</th>
                <th className="text-right py-3 px-2">نشط</th>
                <th className="text-right py-3 px-2">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item._id} className="border-b hover:bg-gray-50">
                  <td className="py-2 px-2">
                    {item.thumbnail ? (
                      <img
                        src={item.thumbnail}
                        alt={item.title}
                        className="w-12 h-12 rounded object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded bg-gray-200 flex items-center justify-center text-xs text-gray-400">
                        لا صورة
                      </div>
                    )}
                  </td>
                  <td className="py-2 px-2 font-medium">{item.title}</td>
                  <td className="py-2 px-2">{getCategoryName(item.categorySlug)}</td>
                  <td className="py-2 px-2">{getDifficultyBadge(item.difficulty)}</td>
                  <td className="py-2 px-2">{item.type}</td>
                  <td className="py-2 px-2">{item.license}</td>
                  <td className="py-2 px-2">
                    <span
                      className={`inline-block w-3 h-3 rounded-full ${
                        item.active ? "bg-green-500" : "bg-red-400"
                      }`}
                      title={item.active ? "نشط" : "غير نشط"}
                    />
                  </td>
                  <td className="py-2 px-2">
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEdit(item)}>
                        تعديل
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600"
                        onClick={() => handleDelete(item.slug)}
                      >
                        حذف
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-gray-500">
                    لا يوجد رسومات
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => goToPage(pagination.page - 1)}
              >
                السابق
              </Button>

              {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                .filter((p) => {
                  // Show first, last, and pages near current
                  return (
                    p === 1 ||
                    p === pagination.pages ||
                    Math.abs(p - pagination.page) <= 2
                  );
                })
                .map((p, idx, arr) => {
                  const elements = [];
                  // Add ellipsis if there's a gap
                  if (idx > 0 && p - arr[idx - 1] > 1) {
                    elements.push(
                      <span key={`ellipsis-${p}`} className="px-1 text-gray-400">
                        ...
                      </span>
                    );
                  }
                  elements.push(
                    <Button
                      key={p}
                      variant={p === pagination.page ? "default" : "outline"}
                      size="sm"
                      onClick={() => goToPage(p)}
                    >
                      {p}
                    </Button>
                  );
                  return elements;
                })}

              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.pages}
                onClick={() => goToPage(pagination.page + 1)}
              >
                التالي
              </Button>

              <span className="text-sm text-gray-500 mr-4">
                ({pagination.total} عنصر)
              </span>
            </div>
          )}
        </>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>
              {editingItem?._id ? "تعديل رسمة" : "إضافة رسمة جديدة"}
            </DialogTitle>
          </DialogHeader>

          {editingItem && (
            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="text-sm">العنوان</label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2 mt-1"
                  value={editingItem.title || ""}
                  onChange={(e) => updateField("title", e.target.value)}
                />
              </div>

              {/* Category + Type */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-sm">القسم</label>
                  <select
                    className="w-full border rounded px-3 py-2 mt-1"
                    value={editingItem.categorySlug || ""}
                    onChange={(e) => updateField("categorySlug", e.target.value)}
                  >
                    <option value="">-- اختر القسم --</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat.slug}>
                        {cat.nameAr}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-sm">النوع</label>
                  <select
                    className="w-full border rounded px-3 py-2 mt-1"
                    value={editingItem.type || "coloring"}
                    onChange={(e) => updateField("type", e.target.value)}
                  >
                    <option value="coloring">تلوين</option>
                    <option value="worksheet">ورقة عمل</option>
                    <option value="craft">أشغال يدوية</option>
                  </select>
                </div>
              </div>

              {/* Difficulty + Age Range */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-sm">الصعوبة</label>
                  <select
                    className="w-full border rounded px-3 py-2 mt-1"
                    value={editingItem.difficulty || "easy"}
                    onChange={(e) => updateField("difficulty", e.target.value)}
                  >
                    <option value="easy">سهل</option>
                    <option value="medium">متوسط</option>
                    <option value="hard">صعب</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-sm">الفئة العمرية</label>
                  <select
                    className="w-full border rounded px-3 py-2 mt-1"
                    value={editingItem.ageRange || "3-6"}
                    onChange={(e) => updateField("ageRange", e.target.value)}
                  >
                    <option value="3-6">3-6</option>
                    <option value="7-10">7-10</option>
                    <option value="11+">11+</option>
                  </select>
                </div>
              </div>

              {/* License */}
              <div>
                <label className="text-sm">الترخيص</label>
                <select
                  className="w-full border rounded px-3 py-2 mt-1"
                  value={editingItem.license || "free-link"}
                  onChange={(e) => updateField("license", e.target.value)}
                >
                  <option value="cc0">CC0 (ملكية عامة)</option>
                  <option value="cc-by">CC-BY (نسب المصنف)</option>
                  <option value="cc-by-sa">CC-BY-SA (نسب + مشاركة بالمثل)</option>
                  <option value="free-link">مجاني مع رابط المصدر</option>
                  <option value="seraj">سراج (محتوى خاص)</option>
                </select>
              </div>

              {/* Attribution (shown only for cc-by or cc-by-sa) */}
              {(editingItem.license === "cc-by" || editingItem.license === "cc-by-sa") && (
                <div>
                  <label className="text-sm">الإسناد</label>
                  <input
                    type="text"
                    className="w-full border rounded px-3 py-2 mt-1"
                    value={editingItem.attribution || ""}
                    onChange={(e) => updateField("attribution", e.target.value)}
                    placeholder="نص الإسناد المطلوب"
                  />
                </div>
              )}

              {/* Source */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-sm">المصدر</label>
                  <input
                    type="text"
                    className="w-full border rounded px-3 py-2 mt-1"
                    value={editingItem.sourceName || ""}
                    onChange={(e) => updateField("sourceName", e.target.value)}
                    placeholder="مثلاً: SuperColoring"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-sm">رابط المصدر</label>
                  <input
                    type="text"
                    className="w-full border rounded px-3 py-2 mt-1"
                    dir="ltr"
                    value={editingItem.sourceUrl || ""}
                    onChange={(e) => updateField("sourceUrl", e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              </div>

              {/* Thumbnail Upload */}
              <div>
                <label className="text-sm block mb-1">الصورة المصغرة</label>
                {editingItem.thumbnail && (
                  <img
                    src={editingItem.thumbnail}
                    className="w-24 h-24 object-cover rounded mb-2"
                    alt="thumbnail"
                  />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleUpload(f);
                  }}
                />
                {uploading && (
                  <span className="text-sm text-gray-500 mr-2">جاري الرفع...</span>
                )}
              </div>

              {/* Full Image Upload */}
              <div>
                <label className="text-sm block mb-1">الصورة الكاملة (اختياري)</label>
                {editingItem.fullImageUrl && (
                  <img
                    src={editingItem.fullImageUrl}
                    className="w-24 h-24 object-cover rounded mb-2"
                    alt="full image"
                  />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleUploadFull(f);
                  }}
                />
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2 mt-1 text-sm"
                  dir="ltr"
                  placeholder="أو أدخل الرابط مباشرة"
                  value={editingItem.fullImageUrl || ""}
                  onChange={(e) => updateField("fullImageUrl", e.target.value)}
                />
                {uploadingFull && (
                  <span className="text-sm text-gray-500 mr-2">جاري الرفع...</span>
                )}
              </div>

              {/* Tags */}
              <div>
                <label className="text-sm">الوسوم (مفصولة بفواصل)</label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2 mt-1"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="حيوانات, طبيعة, أطفال"
                />
              </div>

              {/* Order */}
              <div className="w-32">
                <label className="text-sm">الترتيب</label>
                <input
                  type="number"
                  className="w-full border rounded px-3 py-2 mt-1"
                  value={editingItem.order || 0}
                  onChange={(e) => updateField("order", parseInt(e.target.value) || 0)}
                />
              </div>

              {/* Checkboxes */}
              <div className="flex gap-4 items-center flex-wrap">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!!editingItem.active}
                    onChange={(e) => updateField("active", e.target.checked)}
                  />
                  <label className="text-sm">نشط</label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!!editingItem.featured}
                    onChange={(e) => updateField("featured", e.target.checked)}
                  />
                  <label className="text-sm">مميز</label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!!editingItem.printable}
                    onChange={(e) => updateField("printable", e.target.checked)}
                  />
                  <label className="text-sm">قابل للطباعة</label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4">
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? "جاري الحفظ..." : "حفظ"}
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
