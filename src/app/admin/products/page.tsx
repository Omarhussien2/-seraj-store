"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// ---------- Types ----------
interface Product {
  _id: string;
  slug: string;
  name: string;
  badge: string;
  badgeSoon?: boolean;
  price: number;
  originalPrice?: number | null;
  priceText: string;
  originalPriceText?: string | null;
  category: string;
  section?: string | null;
  series?: string;
  shortDesc?: string;
  longDesc: string;
  features: string[];
  imageUrl?: string;
  media: {
    type: string;
    image?: string;
    title?: string;
    bg: string;
  };
  gallery: {
    _id?: string;
    url: string;
    publicId?: string;
    resourceType: "image" | "video";
    alt?: string;
    sortOrder: number;
  }[];
  action: string;
  ctaText: string;
  comingSoon: boolean;
  active: boolean;
  order: number;
  reviews: { text: string; name: string; place: string; color: string; initial: string }[];
  related: string[];
}

const emptyProduct: Partial<Product> = {
  slug: "",
  name: "",
  badge: "",
  price: 0,
  priceText: "",
  category: "قصص جاهزة",
  section: undefined,
  series: "",
  shortDesc: "",
  longDesc: "",
  features: [],
  imageUrl: "",
  media: { type: "book3d", bg: "emerald" },
  gallery: [],
  action: "cart",
  ctaText: "أضف للسلة",
  comingSoon: false,
  active: true,
  order: 0,
  related: [],
  reviews: [],
};

const sectionLabelMap: Record<string, string> = {
  tales: "سباق الفتوحات",
  "seraj-stories": "حكايات سراج",
  "custom-stories": "قصة مخصوصة",
  "play-learn": "ألعاب سراج",
};

const sectionColorMap: Record<string, string> = {
  tales: "#6bbf3f",
  "seraj-stories": "#36a39a",
  "custom-stories": "#c9974e",
  "play-learn": "#e85d4c",
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch("/api/products?all=true");
      const json = await res.json();
      if (json.success) setProducts(json.data);
    } catch (err) {
      console.error("Failed to fetch products:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  function openCreateDialog() {
    setEditingProduct({ ...emptyProduct });
    setIsEditing(false);
    setDialogOpen(true);
  }

  function openEditDialog(product: Product) {
    setEditingProduct({ ...product });
    setIsEditing(true);
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!editingProduct) return;
    setSaving(true);

    try {
      const payload: any = { ...editingProduct };
      if (payload.originalPrice === "") payload.originalPrice = null;
      if (payload.originalPriceText === "") payload.originalPriceText = null;

      if (isEditing) {
        // PATCH existing product
        const { slug, _id, createdAt, updatedAt, ...cleanData } = payload as Product & { createdAt?: unknown; updatedAt?: unknown };
        void _id; void createdAt; void updatedAt; // unused — excluded intentionally
        const res = await fetch(`/api/products/${slug}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(cleanData),
        });
        const json = await res.json();
        if (!json.success) {
          alert(json.error || "Failed to update product");
          return;
        }
      } else {
        // POST new product
        const res = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!json.success) {
          alert(json.error || "Failed to create product");
          return;
        }
      }

      setDialogOpen(false);
      fetchProducts();
    } catch (err) {
      console.error("Save error:", err);
      alert("حدث خطأ أثناء الحفظ");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(slug: string, isActive: boolean) {
    const msg = isActive
      ? `هل أنت متأكد؟\nسيتم إخفاء المنتج من الموقع (يمكنك استعادته لاحقاً).`
      : `⚠️ المنتج معطّل بالفعل.\nهل تريد حذفه نهائياً من قاعدة البيانات؟\n\nهذا الإجراء لا يمكن التراجع عنه!`;
    if (!confirm(msg)) return;

    try {
      const res = await fetch(`/api/products/${slug}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        fetchProducts();
      } else {
        alert(json.error || "Failed to delete product");
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  }

  async function handleRestore(slug: string) {
    try {
      const res = await fetch(`/api/products/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: true }),
      });
      const json = await res.json();
      if (json.success) {
        fetchProducts();
      } else {
        alert(json.error || "Failed to restore product");
      }
    } catch (err) {
      console.error("Restore error:", err);
    }
  }

  function updateField(field: string, value: unknown) {
    if (!editingProduct) return;
    setEditingProduct((prev) => prev ? { ...prev, [field]: value } : prev);
  }

  function updateMedia(field: string, value: string) {
    if (!editingProduct?.media) return;
    const updatedMedia = { ...editingProduct.media, [field]: value };
    setEditingProduct((prev) =>
      prev ? { ...prev, media: updatedMedia as Product["media"] } : prev
    );
  }

  async function handleMediaImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.length || !editingProduct) return;
    setUploadingMedia(true);
    try {
      const formData = new FormData();
      formData.append("file", e.target.files[0]);

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const result = await res.json();

      if (result.success && result.data?.[0]) {
        updateMedia("image", result.data[0].url);
      } else {
        alert(result.error || "فشل رفع الصورة");
      }
    } catch (error) {
      console.error("Media image upload error:", error);
      alert("حدث خطأ أثناء رفع الصورة");
    } finally {
      setUploadingMedia(false);
      e.target.value = "";
    }
  }

  async function handleGalleryUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.length || !editingProduct) return;
    setUploadingGallery(true);
    try {
      const formData = new FormData();
      Array.from(e.target.files).forEach((file) => formData.append("files", file));

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const result = await res.json();

      if (result.success && result.data) {
        const newItems = result.data.map((item: any, i: number) => ({
          url: item.url,
          publicId: item.publicId,
          resourceType: item.resourceType,
          alt: "",
          sortOrder: (editingProduct.gallery?.length || 0) + i,
        }));
        updateField("gallery", [...(editingProduct.gallery || []), ...newItems]);
      } else {
        alert(result.error || "Upload failed");
      }
    } catch (error) {
      console.error("Gallery upload error:", error);
      alert("حدث خطأ أثناء رفع الملفات");
    } finally {
      setUploadingGallery(false);
      e.target.value = ""; // Reset file input
    }
  }

  function removeGalleryItem(index: number) {
    if (!editingProduct?.gallery) return;
    const newGallery = [...editingProduct.gallery];
    newGallery.splice(index, 1);
    // Re-index sortOrder
    newGallery.forEach((item, i) => (item.sortOrder = i));
    updateField("gallery", newGallery);
  }

  function moveGalleryItem(index: number, direction: "up" | "down") {
    if (!editingProduct?.gallery) return;
    const newGallery = [...editingProduct.gallery];
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= newGallery.length) return;
    [newGallery[index], newGallery[target]] = [newGallery[target], newGallery[index]];
    newGallery.forEach((item, i) => (item.sortOrder = i));
    updateField("gallery", newGallery);
  }

  function updateGalleryAlt(index: number, alt: string) {
    if (!editingProduct?.gallery) return;
    const newGallery = [...editingProduct.gallery];
    newGallery[index] = { ...newGallery[index], alt };
    updateField("gallery", newGallery);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">إدارة المنتجات</h1>
        <Button onClick={openCreateDialog}>+ إضافة منتج</Button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">جاري التحميل...</div>
      ) : products.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">لا توجد منتجات</div>
      ) : (
        <div className="border rounded-lg bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الاسم</TableHead>
                <TableHead>القسم</TableHead>
                <TableHead>السلسلة</TableHead>
                <TableHead>السعر</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>قريباً؟</TableHead>
                <TableHead>الترتيب</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product._id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>
                    {product.section ? (
                      <Badge variant="outline" style={{ borderColor: sectionColorMap[product.section] || undefined, color: sectionColorMap[product.section] || undefined }}>
                        {sectionLabelMap[product.section] || product.section}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>{product.series || "—"}</TableCell>
                  <TableCell>
                    <div>
                      <span>{product.price} ج.م</span>
                      {product.originalPrice && (
                        <span className="text-sm text-muted-foreground line-through mr-1">
                          {product.originalPrice} ج.م
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={product.active ? "default" : "secondary"}>
                      {product.active ? "نشط" : "غير نشط"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {product.comingSoon ? "⏳" : "—"}
                  </TableCell>
                  <TableCell>{product.order}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(product)}
                      >
                        تعديل
                      </Button>
                      {!product.active && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-green-600 border-green-300 hover:bg-green-50"
                          onClick={() => handleRestore(product.slug)}
                        >
                          استعادة
                        </Button>
                      )}
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(product.slug, product.active)}
                      >
                        {product.active ? "إخفاء" : "حذف نهائي"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add/Edit Product Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "تعديل منتج" : "إضافة منتج جديد"}
            </DialogTitle>
          </DialogHeader>

          {editingProduct && (
            <div className="space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Slug (معرف فريد)</Label>
                  <Input
                    value={editingProduct.slug || ""}
                    onChange={(e) => updateField("slug", e.target.value)}
                    disabled={isEditing}
                    placeholder="story-khaled"
                  />
                </div>
                <div className="space-y-2">
                  <Label>اسم المنتج</Label>
                  <Input
                    value={editingProduct.name || ""}
                    onChange={(e) => updateField("name", e.target.value)}
                    placeholder="قصة خالد بن الوليد"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>الشارة (Badge)</Label>
                  <Input
                    value={editingProduct.badge || ""}
                    onChange={(e) => updateField("badge", e.target.value)}
                    placeholder="القصة الأشهر"
                  />
                </div>
                <div className="space-y-2">
                  <Label>التصنيف</Label>
                  <Select
                    value={editingProduct.category || "قصص جاهزة"}
                    onValueChange={(v) => { if (v) updateField("category", v); }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="قصص جاهزة">قصص جاهزة</SelectItem>
                      <SelectItem value="قصص مخصصة">قصص مخصصة</SelectItem>
                      <SelectItem value="فلاش كاردز">فلاش كاردز</SelectItem>
                      <SelectItem value="مجموعات">مجموعات</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Section & Series */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>القسم (Section)</Label>
                  <Select
                    value={editingProduct.section || "none"}
                    onValueChange={(v) => updateField("section", v === "none" ? null : v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">بدون قسم (مجموعات)</SelectItem>
                      <SelectItem value="tales">🐎 سباق الفتوحات</SelectItem>
                      <SelectItem value="seraj-stories">🐰 حكايات سراج</SelectItem>
                      <SelectItem value="custom-stories">✨ قصة مخصوصة</SelectItem>
                      <SelectItem value="play-learn">🧩 ألعاب سراج</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>السلسلة (Series)</Label>
                  <Input
                    value={editingProduct.series || ""}
                    onChange={(e) => updateField("series", e.target.value || null)}
                    placeholder="سباق الفتوحات"
                  />
                  <p className="text-xs text-muted-foreground">اختياري — يظهر كعنوان فرعي داخل القسم</p>
                </div>
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>السعر (ج.م)</Label>
                  <Input
                    type="number"
                    value={editingProduct.price || 0}
                    onChange={(e) => updateField("price", Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>السعر الأصلي (قبل الخصم)</Label>
                  <Input
                    type="number"
                    value={editingProduct.originalPrice || ""}
                    onChange={(e) =>
                      updateField(
                        "originalPrice",
                        e.target.value === "" ? null : Number(e.target.value)
                      )
                    }
                    placeholder="اتركه فارغ لو مفيش خصم"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>نص السعر (مثلاً: ١٤٠ ج.م)</Label>
                  <Input
                    value={editingProduct.priceText || ""}
                    onChange={(e) => updateField("priceText", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>نص السعر الأصلي</Label>
                  <Input
                    value={editingProduct.originalPriceText || ""}
                    onChange={(e) => updateField("originalPriceText", e.target.value === "" ? null : e.target.value)}
                    placeholder="اتركه فارغ لو مفيش خصم"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label>الوصف المختصر (يظهر في كارت المنتج)</Label>
                <Input
                  value={editingProduct.shortDesc || ""}
                  onChange={(e) => updateField("shortDesc", e.target.value)}
                  placeholder="قصة بطولة وشجاعة بأسلوب تعليمي ممتع"
                  maxLength={100}
                />
              </div>
              <div className="space-y-2">
                <Label>الوصف الكامل</Label>
                <Textarea
                  value={editingProduct.longDesc || ""}
                  onChange={(e) => updateField("longDesc", e.target.value)}
                  rows={3}
                />
              </div>

              {/* Product Image — this is what customers see */}
              <div className="space-y-2 border-2 border-green-200 rounded-lg p-4 bg-green-50/30">
                <Label className="text-base font-semibold text-green-800">صورة المنتج للعملاء</Label>
                <p className="text-xs text-green-700 mb-2">
                  الصورة دي هي اللي هتظهر للعملاء في الكتالوج وصفحة المنتج بدل الموك آب
                </p>
                <div className="flex gap-3 items-start">
                  <div className="flex-1">
                    <Input
                      value={editingProduct.imageUrl || ""}
                      onChange={(e) => updateField("imageUrl", e.target.value)}
                      placeholder="رابط الصورة (بعد الرفع هيظهر هنا تلقائي)"
                    />
                    <label className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 text-sm border border-green-300 rounded-md cursor-pointer hover:bg-green-50 transition-colors bg-white">
                      📁 رفع صورة المنتج
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const formData = new FormData();
                          formData.append("file", file);
                          try {
                            const res = await fetch("/api/upload", {
                              method: "POST",
                              body: formData,
                            });
                            const json = await res.json();
                            if (json.success && json.data?.[0]) {
                              updateField("imageUrl", json.data[0].url);
                            } else {
                              alert(json.error || "فشل رفع الصورة");
                            }
                          } catch {
                            alert("حدث خطأ أثناء رفع الصورة");
                          }
                        }}
                      />
                    </label>
                  </div>
                  {editingProduct.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={editingProduct.imageUrl}
                      alt="معاينة"
                      className="w-20 h-24 object-contain rounded-lg border"
                    />
                  )}
                </div>
              </div>

              {/* Features */}
              <div className="space-y-2">
                <Label>المميزات (واحدة في كل سطر)</Label>
                <Textarea
                  value={(editingProduct.features || []).join("\n")}
                  onChange={(e) =>
                    updateField(
                      "features",
                      e.target.value.split("\n").filter(Boolean)
                    )
                  }
                  rows={4}
                />
              </div>

              {/* Action & CTA */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>نوع الإجراء</Label>
                  <Select
                    value={editingProduct.action || "cart"}
                    onValueChange={(v) => { if (v) updateField("action", v); }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cart">أضف للسلة</SelectItem>
                      <SelectItem value="wizard">معالج القصة</SelectItem>
                      <SelectItem value="none">بدون إجراء</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>نص الزر (CTA)</Label>
                  <Input
                    value={editingProduct.ctaText || ""}
                    onChange={(e) => updateField("ctaText", e.target.value)}
                  />
                </div>
              </div>

              {/* Media — mockup fallback config */}
              <div className="space-y-4 border rounded-lg p-4 bg-gray-50/50">
                <Label className="text-base font-semibold">إعدادات الموك آب (تظهر لو مفيش صورة منتج)</Label>
                <p className="text-xs text-muted-foreground">الشكل الاحتياطي لما المنتج ميكونش عنده صورة حقيقية — الكتاب ثلاثي الأبعاد</p>

                {/* Image preview + upload */}
                <div className="flex items-start gap-4">
                  <div className="w-28 h-28 flex-shrink-0 rounded-lg overflow-hidden border-2 border-dashed border-gray-300 bg-white flex items-center justify-center">
                    {editingProduct.media?.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={editingProduct.media.image}
                        alt="صورة المنتج"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground text-center px-2">لا توجد صورة</span>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="relative">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleMediaImageUpload}
                        disabled={uploadingMedia}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      <Button type="button" variant="outline" size="sm" disabled={uploadingMedia} className="w-full">
                        {uploadingMedia ? "جاري الرفع..." : "رفع صورة جديدة"}
                      </Button>
                    </div>
                    {editingProduct.media?.image && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 w-full"
                        onClick={() => updateMedia("image", "")}
                      >
                        إزالة الصورة
                      </Button>
                    )}
                  </div>
                </div>

                {/* Media type + bg + title */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>نوع العرض</Label>
                    <Select
                      value={editingProduct.media?.type || "book3d"}
                      onValueChange={(v) => { if (v) updateMedia("type", v); }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="book3d">كتاب 3D</SelectItem>
                        <SelectItem value="cards-fan">بطاقات</SelectItem>
                        <SelectItem value="bundle-stack">حزمة</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>الخلفية</Label>
                    <Select
                      value={editingProduct.media?.bg || "emerald"}
                      onValueChange={(v) => { if (v) updateMedia("bg", v); }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="emerald">أخضر</SelectItem>
                        <SelectItem value="sand">رملي</SelectItem>
                        <SelectItem value="teal">تركوازي</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>عنوان الغلاف</Label>
                    <Input
                      value={editingProduct.media?.title || ""}
                      onChange={(e) => updateMedia("title", e.target.value)}
                      placeholder="خالد بن الوليد"
                    />
                  </div>
                </div>
              </div>

              {/* Gallery */}
              <div className="space-y-4 border rounded-lg p-4 bg-gray-50/50">
                <div className="flex items-center justify-between">
                  <Label>معرض الصور والفيديو (Gallery)</Label>
                  <div className="relative">
                    <Input
                      type="file"
                      multiple
                      accept="image/*,video/*"
                      onChange={handleGalleryUpload}
                      disabled={uploadingGallery}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <Button type="button" variant="outline" size="sm" disabled={uploadingGallery}>
                      {uploadingGallery ? "جاري الرفع..." : "رفع ملفات..."}
                    </Button>
                  </div>
                </div>

                {editingProduct.gallery && editingProduct.gallery.length > 0 ? (
                  <div className="space-y-3 mt-4">
                    {editingProduct.gallery.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 bg-white border rounded-lg">
                        {/* Thumbnail */}
                        <div className="w-24 h-24 flex-shrink-0 rounded-md overflow-hidden bg-gray-100 border">
                          {item.resourceType === "video" ? (
                            <video src={item.url} controls muted className="w-full h-full object-cover" />
                          ) : (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={item.url} alt={item.alt || "Gallery item"} className="w-full h-full object-cover" />
                          )}
                        </div>

                        {/* Info & Alt text */}
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant={item.resourceType === "video" ? "secondary" : "default"}>
                              {item.resourceType === "video" ? "فيديو" : "صورة"}
                            </Badge>
                            <span className="text-xs text-muted-foreground truncate">#{idx + 1}</span>
                          </div>
                          <Input
                            placeholder="وصف الصورة (Alt text)"
                            value={item.alt || ""}
                            onChange={(e) => updateGalleryAlt(idx, e.target.value)}
                            className="h-8 text-sm"
                          />
                        </div>

                        {/* Actions: reorder + delete */}
                        <div className="flex flex-col gap-1 flex-shrink-0">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="w-7 h-7"
                            disabled={idx === 0}
                            onClick={() => moveGalleryItem(idx, "up")}
                            title="نقل لأعلى"
                          >
                            ▲
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="w-7 h-7"
                            disabled={idx === editingProduct.gallery!.length - 1}
                            onClick={() => moveGalleryItem(idx, "down")}
                            title="نقل لأسفل"
                          >
                            ▼
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="w-7 h-7"
                            onClick={() => removeGalleryItem(idx)}
                            title="حذف"
                          >
                            ✕
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">لم يتم رفع أي ملفات للمعرض</p>
                )}
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>نشط</Label>
                  <Select
                    value={editingProduct.active ? "true" : "false"}
                    onValueChange={(v) => { if (v) updateField("active", v === "true"); }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">نعم</SelectItem>
                      <SelectItem value="false">لا</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>قريباً</Label>
                  <Select
                    value={editingProduct.comingSoon ? "true" : "false"}
                    onValueChange={(v) => { if (v) updateField("comingSoon", v === "true"); }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">نعم</SelectItem>
                      <SelectItem value="false">لا</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>ترتيب العرض</Label>
                  <Input
                    type="number"
                    value={editingProduct.order || 0}
                    onChange={(e) => updateField("order", Number(e.target.value))}
                  />
                </div>
              </div>

              {/* Related products */}
              <div className="space-y-2">
                <Label>منتجات مرتبطة (slugs مفصولة بفواصل)</Label>
                <Input
                  value={(editingProduct.related || []).join(", ")}
                  onChange={(e) =>
                    updateField(
                      "related",
                      e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
                    )
                  }
                  placeholder="custom-story, bundle"
                />
              </div>

              {/* Save Button */}
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  إلغاء
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? "جاري الحفظ..." : isEditing ? "حفظ التعديلات" : "إضافة المنتج"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
