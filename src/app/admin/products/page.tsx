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
  longDesc: string;
  features: string[];
  media: {
    type: string;
    image?: string;
    title?: string;
    bg: string;
  };
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
  longDesc: "",
  features: [],
  media: { type: "book3d", bg: "emerald" },
  action: "cart",
  ctaText: "أضف للسلة",
  comingSoon: false,
  active: true,
  order: 0,
  related: [],
  reviews: [],
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

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
      if (isEditing) {
        // PATCH existing product
        const { slug, _id, createdAt, updatedAt, ...updateData } = editingProduct as Product;
        const res = await fetch(`/api/products/${slug}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
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
          body: JSON.stringify(editingProduct),
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

  async function handleDelete(slug: string) {
    if (!confirm(`هل أنت متأكد من حذف هذا المنتج؟\nسيتم إلغاء تفعيله (soft delete).`)) return;

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

  function updateField(field: string, value: unknown) {
    if (!editingProduct) return;
    setEditingProduct((prev) => prev ? { ...prev, [field]: value } : prev);
  }

  function updateMedia(field: string, value: string) {
    if (!editingProduct?.media) return;
    setEditingProduct((prev) =>
      prev ? { ...prev, media: { ...prev.media, [field]: value } } : prev
    );
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
                <TableHead>التصنيف</TableHead>
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
                  <TableCell>{product.category}</TableCell>
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
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(product.slug)}
                      >
                        حذف
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
                    onValueChange={(v) => updateField("category", v)}
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
                        e.target.value ? Number(e.target.value) : null
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
                    onChange={(e) => updateField("originalPriceText", e.target.value)}
                    placeholder="اتركه فارغ لو مفيش خصم"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label>الوصف</Label>
                <Textarea
                  value={editingProduct.longDesc || ""}
                  onChange={(e) => updateField("longDesc", e.target.value)}
                  rows={3}
                />
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
                    onValueChange={(v) => updateField("action", v)}
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

              {/* Media */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>نوع الوسائط</Label>
                  <Select
                    value={editingProduct.media?.type || "book3d"}
                    onValueChange={(v) => updateMedia("type", v)}
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
                  <Label>الصورة</Label>
                  <Input
                    value={editingProduct.media?.image || ""}
                    onChange={(e) => updateMedia("image", e.target.value)}
                    placeholder="khaled-v2.png"
                  />
                </div>
                <div className="space-y-2">
                  <Label>الخلفية</Label>
                  <Select
                    value={editingProduct.media?.bg || "emerald"}
                    onValueChange={(v) => updateMedia("bg", v)}
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
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>نشط</Label>
                  <Select
                    value={editingProduct.active ? "true" : "false"}
                    onValueChange={(v) => updateField("active", v === "true")}
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
                    onValueChange={(v) => updateField("comingSoon", v === "true")}
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
