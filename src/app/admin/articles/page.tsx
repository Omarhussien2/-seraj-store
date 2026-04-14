"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/* ─── Section Colors ─── */
const SECTION_COLORS: Record<string, string> = {
  "الحمل والرضاعة": "#e85d4c",
  "من الولادة إلى سنتين": "#f59e42",
  "من 2 إلى 5 سنوات": "#6bbf3f",
  "العلاقة مع الأم نفسها": "#c9974e",
  "الأهل والأسرة الممتدة": "#36a39a",
  "العدل بين الولد والبنت": "#8b5e2a",
  "المدرسة والضغط الدراسي": "#5b7fc7",
  "الشاشات والإنترنت": "#9b59b6",
  "السلوكيات الصعبة والصحة النفسية": "#e74c3c",
  "الأب والتربية المشتركة": "#2c3e50",
  "مشاعر الأم وصورتها عن نفسها": "#e08283",
  "القيم والمراحل العمرية": "#27ae60",
};

const SECTIONS = Object.keys(SECTION_COLORS);
const AGE_GROUPS = ["الحمل", "0-2", "2-5", "5-10", "10-12", "متنوع"];

interface Source {
  label: string;
  url?: string;
  note?: string;
}

interface Article {
  _id: string;
  slug: string;
  title: string;
  section: string;
  ageGroup?: string;
  tags: string[];
  excerpt: string;
  contentMarkdown: string;
  coverImage?: string;
  coverImageAlt: string;
  sources: Source[];
  readingTime: number;
  author: string;
  publishedAt?: string;
  active: boolean;
  order: number;
  metaDescription?: string;
}

const emptyArticle: Partial<Article> = {
  slug: "",
  title: "",
  section: "",
  ageGroup: "",
  tags: [],
  excerpt: "",
  contentMarkdown: "",
  coverImage: "",
  coverImageAlt: "",
  sources: [],
  readingTime: 5,
  author: "فريق سراج",
  publishedAt: new Date().toISOString().split("T")[0],
  active: true,
  order: 0,
  metaDescription: "",
};

export default function ArticlesAdmin() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [sectionFilter, setSectionFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Partial<Article> | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchArticles = useCallback(async () => {
    try {
      const params = new URLSearchParams({ all: "true", limit: "100" });
      if (sectionFilter) params.set("section", sectionFilter);
      const res = await fetch(`/api/articles?${params}`);
      const data = await res.json();
      if (data.success) {
        let items = data.data;
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          items = items.filter((a: Article) => a.title.toLowerCase().includes(q));
        }
        setArticles(items);
      }
    } catch (err) {
      console.error("Failed to fetch articles:", err);
    } finally {
      setLoading(false);
    }
  }, [sectionFilter, searchQuery]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const openCreate = () => {
    setEditingArticle({ ...emptyArticle });
    setDialogOpen(true);
  };

  const openEdit = (article: Article) => {
    setEditingArticle({
      ...article,
      publishedAt: article.publishedAt
        ? new Date(article.publishedAt).toISOString().split("T")[0]
        : "",
      tags: article.tags || [],
      sources: article.sources || [],
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingArticle) return;
    setSaving(true);
    try {
      const isEdit = articles.some((a) => a.slug === editingArticle.slug);
      const url = isEdit
        ? `/api/articles/${editingArticle.slug}`
        : "/api/articles";
      const method = isEdit ? "PATCH" : "POST";

      // Clean up empty sources
      const cleanSources = (editingArticle.sources || []).filter(
        (s) => s.label.trim()
      );

      const body = {
        ...editingArticle,
        sources: cleanSources,
        tags: typeof editingArticle.tags === "string"
          ? (editingArticle.tags as string).split(",").map((t) => t.trim()).filter(Boolean)
          : editingArticle.tags,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.success) {
        setDialogOpen(false);
        fetchArticles();
      } else {
        alert(data.error || "Failed to save article");
      }
    } catch (err) {
      console.error("Save error:", err);
      alert("Failed to save article");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (slug: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا المقال؟")) return;
    try {
      const res = await fetch(`/api/articles/${slug}`, { method: "DELETE" });
      if ((await res.json()).success) fetchArticles();
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const handleCoverUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success && data.data?.[0]) {
        setEditingArticle((prev) => ({
          ...prev!,
          coverImage: data.data[0].url,
        }));
      }
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
    }
  };

  const updateField = (field: string, value: unknown) => {
    setEditingArticle((prev) => prev ? { ...prev, [field]: value } : prev);
  };

  const addSource = () => {
    setEditingArticle((prev) => ({
      ...prev!,
      sources: [...(prev?.sources || []), { label: "", url: "", note: "" }],
    }));
  };

  const updateSource = (index: number, field: string, value: string) => {
    setEditingArticle((prev) => {
      const sources = [...(prev?.sources || [])];
      sources[index] = { ...sources[index], [field]: value };
      return { ...prev!, sources };
    });
  };

  const removeSource = (index: number) => {
    setEditingArticle((prev) => {
      const sources = [...(prev?.sources || [])];
      sources.splice(index, 1);
      return { ...prev!, sources };
    });
  };

  return (
    <div dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">إدارة المقالات</h1>
        <Button onClick={openCreate}>+ مقال جديد</Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-4">
        <select
          className="border rounded-lg px-3 py-2 text-sm"
          value={sectionFilter}
          onChange={(e) => setSectionFilter(e.target.value)}
        >
          <option value="">كل الأقسام</option>
          {SECTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="بحث بالعنوان..."
          className="border rounded-lg px-3 py-2 text-sm flex-1 max-w-xs"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Articles Table */}
      {loading ? (
        <p className="text-gray-500">جاري التحميل...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-gray-600">
                <th className="text-right py-3 px-2">#</th>
                <th className="text-right py-3 px-2">العنوان</th>
                <th className="text-right py-3 px-2">القسم</th>
                <th className="text-right py-3 px-2">الحالة</th>
                <th className="text-right py-3 px-2">الترتيب</th>
                <th className="text-right py-3 px-2">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {articles.map((article, i) => (
                <tr key={article._id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-2 text-gray-400">{i + 1}</td>
                  <td className="py-3 px-2 font-medium max-w-xs truncate">
                    {article.title}
                  </td>
                  <td className="py-3 px-2">
                    <span
                      className="px-2 py-0.5 rounded text-white text-xs"
                      style={{
                        backgroundColor:
                          SECTION_COLORS[article.section] || "#666",
                      }}
                    >
                      {article.section}
                    </span>
                  </td>
                  <td className="py-3 px-2">
                    <span
                      className={`px-2 py-0.5 rounded text-xs ${
                        article.active
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {article.active ? "نشط" : "مسودة"}
                    </span>
                  </td>
                  <td className="py-3 px-2">{article.order}</td>
                  <td className="py-3 px-2">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEdit(article)}
                      >
                        تعديل
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600"
                        onClick={() => handleDelete(article.slug)}
                      >
                        حذف
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {articles.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400">
                    لا توجد مقالات
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>
              {editingArticle &&
              articles.some((a) => a.slug === editingArticle.slug)
                ? "تعديل مقال"
                : "مقال جديد"}
            </DialogTitle>
          </DialogHeader>

          {editingArticle && (
            <div className="space-y-4">
              {/* Cover Image */}
              <div className="flex gap-4 items-start">
                <div className="w-40 h-24 border-2 border-dashed rounded-lg flex flex-col items-center justify-center relative overflow-hidden bg-gray-50">
                  {editingArticle.coverImage ? (
                    <>
                      <img
                        src={editingArticle.coverImage}
                        alt="غلاف"
                        className="absolute inset-0 object-cover w-full h-full"
                      />
                      <button
                        className="absolute top-1 left-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center z-10"
                        onClick={() => updateField("coverImage", "")}
                      >
                        ✕
                      </button>
                    </>
                  ) : (
                    <label className="cursor-pointer text-center text-xs text-gray-400">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleCoverUpload(file);
                        }}
                      />
                      {uploading ? "جاري الرفع..." : "رفع صورة غلاف"}
                    </label>
                  )}
                </div>

                <div className="flex-1 space-y-3">
                  <input
                    type="text"
                    placeholder="العنوان *"
                    className="w-full border rounded-lg px-3 py-2"
                    value={editingArticle.title || ""}
                    onChange={(e) => updateField("title", e.target.value)}
                  />
                  <div className="flex gap-3">
                    <select
                      className="border rounded-lg px-3 py-2 flex-1"
                      value={editingArticle.section || ""}
                      onChange={(e) => updateField("section", e.target.value)}
                    >
                      <option value="">القسم *</option>
                      {SECTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <select
                      className="border rounded-lg px-3 py-2 flex-1"
                      value={editingArticle.ageGroup || ""}
                      onChange={(e) => updateField("ageGroup", e.target.value)}
                    >
                      <option value="">المرحلة العمرية</option>
                      {AGE_GROUPS.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Slug */}
              <input
                type="text"
                placeholder="Slug (يُولّد تلقائياً من العنوان)"
                className="w-full border rounded-lg px-3 py-2 text-sm text-gray-500"
                value={editingArticle.slug || ""}
                onChange={(e) => updateField("slug", e.target.value)}
              />

              {/* Excerpt */}
              <div>
                <label className="block text-sm font-medium mb-1">الملخص *</label>
                <textarea
                  rows={2}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="ملخص قصير يظهر في كارت المقال..."
                  value={editingArticle.excerpt || ""}
                  onChange={(e) => updateField("excerpt", e.target.value)}
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  المحتوى (Markdown) *
                </label>
                <textarea
                  rows={15}
                  className="w-full border rounded-lg px-3 py-2 text-sm font-mono"
                  placeholder="المحتوى بصيغة Markdown..."
                  value={editingArticle.contentMarkdown || ""}
                  onChange={(e) => updateField("contentMarkdown", e.target.value)}
                />
              </div>

              {/* Sources */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  المصادر والمراجع
                </label>
                <div className="space-y-2">
                  {(editingArticle.sources || []).map((source, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input
                        type="text"
                        placeholder="اسم المصدر"
                        className="border rounded px-2 py-1 text-sm flex-1"
                        value={source.label}
                        onChange={(e) => updateSource(i, "label", e.target.value)}
                      />
                      <input
                        type="text"
                        placeholder="الرابط"
                        className="border rounded px-2 py-1 text-sm flex-1"
                        value={source.url || ""}
                        onChange={(e) => updateSource(i, "url", e.target.value)}
                      />
                      <input
                        type="text"
                        placeholder="ملاحظة"
                        className="border rounded px-2 py-1 text-sm w-28"
                        value={source.note || ""}
                        onChange={(e) => updateSource(i, "note", e.target.value)}
                      />
                      <button
                        className="text-red-500 text-sm"
                        onClick={() => removeSource(i)}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <button
                    className="text-sm text-blue-600 hover:underline"
                    onClick={addSource}
                  >
                    + إضافة مصدر
                  </button>
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Tags (مفصولة بفواصل)
                </label>
                <input
                  type="text"
                  placeholder="تربية, سلوك, ٣-٦ سنين"
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  value={
                    Array.isArray(editingArticle.tags)
                      ? editingArticle.tags.join(", ")
                      : editingArticle.tags || ""
                  }
                  onChange={(e) => updateField("tags", e.target.value)}
                />
              </div>

              {/* Meta fields */}
              <div className="flex gap-3 flex-wrap">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingArticle.active ?? true}
                    onChange={(e) => updateField("active", e.target.checked)}
                  />
                  <span className="text-sm">نشط</span>
                </label>
                <div>
                  <label className="text-sm">الترتيب: </label>
                  <input
                    type="number"
                    className="border rounded px-2 py-1 w-20 text-sm"
                    value={editingArticle.order || 0}
                    onChange={(e) => updateField("order", parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <label className="text-sm">تاريخ النشر: </label>
                  <input
                    type="date"
                    className="border rounded px-2 py-1 text-sm"
                    value={editingArticle.publishedAt || ""}
                    onChange={(e) => updateField("publishedAt", e.target.value)}
                  />
                </div>
              </div>

              {/* Save/Cancel */}
              <div className="flex gap-3 pt-2">
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? "جاري الحفظ..." : "حفظ المقال"}
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
