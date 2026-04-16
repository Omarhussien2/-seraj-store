"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/* ─── Constants ─── */
const CITIES = ["Cairo", "Alexandria", "North Coast", "Sharm El Sheikh", "Hurghada", "Ain Sokhna", "Dahab", "Al Fayoum", "Ras Sudr", "El Gouna", "Tanta"];
const INDOOR_OUTDOOR = ["indoor", "outdoor", "mixed", "unknown"];
const CATEGORIES: Record<number, string> = {
  1: "🎠 لعب ومرح",
  2: "🎬 سينما وعروض",
  3: "🌳 حدائق ومتنزهات",
  4: "🎨 فنون وتعليم",
  5: "🐾 مزارع وحيوانات",
  6: "🍕 مطاعم",
};
const CATEGORY_IDS = Object.keys(CATEGORIES).map(Number);

interface Place {
  _id: string;
  name_ar: string;
  name_en: string;
  description_short: string;
  area: string;
  city: string;
  address: string;
  location: { lat: number; lon: number };
  min_price: number;
  max_price: number;
  price_range_id: number;
  min_age: number;
  max_age: number;
  avg_duration_hours: number;
  is_free: boolean;
  indoor_outdoor: string;
  booking_required: boolean;
  website_url: string;
  external_source: string;
  external_detail_url: string;
  phone: string;
  facebook_url: string;
  instagram_url: string;
  category_ids: number[];
  image_url: string;
  last_price_update: string;
  offer_text: string;
  offer_active: boolean;
  offer_expiry: string | null;
  active: boolean;
  order: number;
}

const emptyPlace: Partial<Place> = {
  name_ar: "",
  name_en: "",
  description_short: "",
  area: "",
  city: "",
  address: "",
  location: { lat: 0, lon: 0 },
  min_price: 0,
  max_price: 0,
  price_range_id: 1,
  min_age: 0,
  max_age: 12,
  avg_duration_hours: 3,
  is_free: false,
  indoor_outdoor: "unknown",
  booking_required: false,
  website_url: "",
  external_source: "Admin",
  external_detail_url: "",
  phone: "",
  facebook_url: "",
  instagram_url: "",
  category_ids: [],
  image_url: "",
  last_price_update: new Date().toISOString().split("T")[0],
  offer_text: "",
  offer_active: false,
  offer_expiry: null,
  active: true,
  order: 0,
};

export default function PlacesAdmin() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [cityFilter, setCityFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlace, setEditingPlace] = useState<Partial<Place> | null>(null);
  const [saving, setSaving] = useState(false);
  const [isEdit, setIsEdit] = useState(false);

  const fetchPlaces = useCallback(async () => {
    try {
      const params = new URLSearchParams({ all: "true", limit: "100" });
      if (cityFilter) params.set("city", cityFilter);
      const res = await fetch(`/api/places?${params}`);
      const data = await res.json();
      if (data.success) {
        let items = data.data;
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          items = items.filter(
            (p: Place) =>
              p.name_en.toLowerCase().includes(q) ||
              (p.name_ar && p.name_ar.toLowerCase().includes(q))
          );
        }
        setPlaces(items);
      }
    } catch (err) {
      console.error("Failed to fetch places:", err);
    } finally {
      setLoading(false);
    }
  }, [cityFilter, searchQuery]);

  useEffect(() => {
    fetchPlaces();
  }, [fetchPlaces]);

  const openCreate = () => {
    setEditingPlace({ ...emptyPlace });
    setIsEdit(false);
    setDialogOpen(true);
  };

  const openEdit = (place: Place) => {
    setEditingPlace({
      ...place,
      last_price_update: place.last_price_update
        ? new Date(place.last_price_update).toISOString().split("T")[0]
        : "",
      offer_expiry: place.offer_expiry
        ? new Date(place.offer_expiry).toISOString().split("T")[0]
        : "",
    });
    setIsEdit(true);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingPlace) return;
    setSaving(true);
    try {
      const url = isEdit
        ? `/api/places/${editingPlace._id}`
        : "/api/places";
      const method = isEdit ? "PATCH" : "POST";

      const body = { ...editingPlace };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.success) {
        setDialogOpen(false);
        fetchPlaces();
      } else {
        alert(data.error || "Failed to save place");
      }
    } catch (err) {
      console.error("Save error:", err);
      alert("Failed to save place");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا المكان؟")) return;
    try {
      const res = await fetch(`/api/places/${id}`, { method: "DELETE" });
      if ((await res.json()).success) fetchPlaces();
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const updateField = (field: string, value: unknown) => {
    setEditingPlace((prev) =>
      prev ? { ...prev, [field]: value } : prev
    );
  };

  const toggleCategory = (catId: number) => {
    setEditingPlace((prev) => {
      if (!prev) return prev;
      const ids = prev.category_ids || [];
      const newIds = ids.includes(catId)
        ? ids.filter((id) => id !== catId)
        : [...ids, catId];
      return { ...prev, category_ids: newIds };
    });
  };

  return (
    <div dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">إدارة الأماكن (فسحة حلوة)</h1>
        <Button onClick={openCreate}>+ مكان جديد</Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-4">
        <select
          className="border rounded-lg px-3 py-2 text-sm"
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
        >
          <option value="">كل المدن</option>
          {CITIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="بحث بالاسم..."
          className="border rounded-lg px-3 py-2 text-sm flex-1 max-w-xs"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Places Table */}
      {loading ? (
        <p className="text-gray-500">جاري التحميل...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-gray-600">
                <th className="text-right py-3 px-2">#</th>
                <th className="text-right py-3 px-2">الاسم</th>
                <th className="text-right py-3 px-2">المدينة</th>
                <th className="text-right py-3 px-2">التصنيف</th>
                <th className="text-right py-3 px-2">النوع</th>
                <th className="text-right py-3 px-2">عرض</th>
                <th className="text-right py-3 px-2">الحالة</th>
                <th className="text-right py-3 px-2">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {places.map((place, i) => (
                <tr key={place._id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-2 text-gray-400">{i + 1}</td>
                  <td className="py-3 px-2 font-medium max-w-xs truncate">
                    {place.name_ar || place.name_en}
                  </td>
                  <td className="py-3 px-2">{place.city}</td>
                  <td className="py-3 px-2">
                    <div className="flex gap-1 flex-wrap">
                      {(place.category_ids || []).map((id) => (
                        <span
                          key={id}
                          className="px-1.5 py-0.5 rounded text-xs bg-gray-100"
                        >
                          {CATEGORIES[id] || id}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-2 text-xs">
                    {place.indoor_outdoor === "indoor"
                      ? "مغلق"
                      : place.indoor_outdoor === "outdoor"
                      ? "مفتوح"
                      : place.indoor_outdoor === "mixed"
                      ? "مختلط"
                      : "—"}
                  </td>
                  <td className="py-3 px-2">
                    {place.offer_active && place.offer_text ? (
                      <span className="px-2 py-0.5 rounded text-xs bg-orange-100 text-orange-700">
                        🎁 {place.offer_text}
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="py-3 px-2">
                    <span
                      className={`px-2 py-0.5 rounded text-xs ${
                        place.active
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {place.active ? "نشط" : "مخفي"}
                    </span>
                  </td>
                  <td className="py-3 px-2">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEdit(place)}
                      >
                        تعديل
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600"
                        onClick={() => handleDelete(place._id)}
                      >
                        حذف
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {places.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-400">
                    لا توجد أماكن
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
            <DialogTitle>{isEdit ? "تعديل مكان" : "مكان جديد"}</DialogTitle>
          </DialogHeader>

          {editingPlace && (
            <div className="space-y-4">
              {/* Basic Info */}
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="الاسم بالعربي"
                  className="w-full border rounded-lg px-3 py-2"
                  value={editingPlace.name_ar || ""}
                  onChange={(e) => updateField("name_ar", e.target.value)}
                />
                <input
                  type="text"
                  placeholder="الاسم بالإنجليزي *"
                  className="w-full border rounded-lg px-3 py-2"
                  value={editingPlace.name_en || ""}
                  onChange={(e) => updateField("name_en", e.target.value)}
                />
              </div>

              <textarea
                rows={2}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                placeholder="وصف مختصر..."
                value={editingPlace.description_short || ""}
                onChange={(e) => updateField("description_short", e.target.value)}
              />

              {/* Location */}
              <div className="flex gap-3">
                <select
                  className="border rounded-lg px-3 py-2 flex-1"
                  value={editingPlace.city || ""}
                  onChange={(e) => updateField("city", e.target.value)}
                >
                  <option value="">المدينة *</option>
                  {CITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="المنطقة (Area)"
                  className="border rounded-lg px-3 py-2 flex-1"
                  value={editingPlace.area || ""}
                  onChange={(e) => updateField("area", e.target.value)}
                />
              </div>

              <input
                type="text"
                placeholder="العنوان التفصيلي"
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={editingPlace.address || ""}
                onChange={(e) => updateField("address", e.target.value)}
              />

              {/* GPS + Type */}
              <div className="flex gap-3">
                <input
                  type="number"
                  step="any"
                  placeholder="Latitude"
                  className="border rounded-lg px-3 py-2 flex-1"
                  value={editingPlace.location?.lat || ""}
                  onChange={(e) =>
                    updateField("location", {
                      ...editingPlace.location,
                      lat: parseFloat(e.target.value) || 0,
                    })
                  }
                />
                <input
                  type="number"
                  step="any"
                  placeholder="Longitude"
                  className="border rounded-lg px-3 py-2 flex-1"
                  value={editingPlace.location?.lon || ""}
                  onChange={(e) =>
                    updateField("location", {
                      ...editingPlace.location,
                      lon: parseFloat(e.target.value) || 0,
                    })
                  }
                />
                <select
                  className="border rounded-lg px-3 py-2 flex-1"
                  value={editingPlace.indoor_outdoor || "unknown"}
                  onChange={(e) => updateField("indoor_outdoor", e.target.value)}
                >
                  {INDOOR_OUTDOOR.map((t) => (
                    <option key={t} value={t}>
                      {t === "indoor"
                        ? "مغلق"
                        : t === "outdoor"
                        ? "مفتوح"
                        : t === "mixed"
                        ? "مختلط"
                        : "غير محدد"}
                    </option>
                  ))}
                </select>
              </div>

              {/* Categories */}
              <div>
                <label className="block text-sm font-medium mb-2">التصنيفات</label>
                <div className="flex gap-2 flex-wrap">
                  {CATEGORY_IDS.map((id) => (
                    <button
                      key={id}
                      type="button"
                      className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                        (editingPlace.category_ids || []).includes(id)
                          ? "bg-gray-900 text-white border-gray-900"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                      }`}
                      onClick={() => toggleCategory(id)}
                    >
                      {CATEGORIES[id]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Age + Duration */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-sm">أصغر عمر</label>
                  <input
                    type="number"
                    className="w-full border rounded-lg px-3 py-2"
                    value={editingPlace.min_age ?? 0}
                    onChange={(e) => updateField("min_age", parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="flex-1">
                  <label className="text-sm">أكبر عمر</label>
                  <input
                    type="number"
                    className="w-full border rounded-lg px-3 py-2"
                    value={editingPlace.max_age ?? 12}
                    onChange={(e) => updateField("max_age", parseInt(e.target.value) || 12)}
                  />
                </div>
                <div className="flex-1">
                  <label className="text-sm">مدة الزيارة (ساعات)</label>
                  <input
                    type="number"
                    className="w-full border rounded-lg px-3 py-2"
                    value={editingPlace.avg_duration_hours ?? 3}
                    onChange={(e) => updateField("avg_duration_hours", parseInt(e.target.value) || 3)}
                  />
                </div>
              </div>

              {/* Contact */}
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="تليفون"
                  className="border rounded-lg px-3 py-2 flex-1"
                  value={editingPlace.phone || ""}
                  onChange={(e) => updateField("phone", e.target.value)}
                />
                <input
                  type="text"
                  placeholder="الموقع الإلكتروني"
                  className="border rounded-lg px-3 py-2 flex-1"
                  value={editingPlace.website_url || ""}
                  onChange={(e) => updateField("website_url", e.target.value)}
                />
              </div>
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="رابط انستجرام"
                  className="border rounded-lg px-3 py-2 flex-1"
                  value={editingPlace.instagram_url || ""}
                  onChange={(e) => updateField("instagram_url", e.target.value)}
                />
                <input
                  type="text"
                  placeholder="رابط فيسبوك"
                  className="border rounded-lg px-3 py-2 flex-1"
                  value={editingPlace.facebook_url || ""}
                  onChange={(e) => updateField("facebook_url", e.target.value)}
                />
              </div>

              {/* Image URL */}
              <input
                type="text"
                placeholder="رابط الصورة (Image URL)"
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={editingPlace.image_url || ""}
                onChange={(e) => updateField("image_url", e.target.value)}
              />

              {/* Offer Section */}
              <div className="border rounded-lg p-4 bg-orange-50 space-y-3">
                <h3 className="font-bold text-sm flex items-center gap-2">
                  🎁 العروض والتخفيضات
                </h3>
                <div className="flex gap-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editingPlace.offer_active ?? false}
                      onChange={(e) => updateField("offer_active", e.target.checked)}
                    />
                    <span className="text-sm">تفعيل العرض</span>
                  </label>
                </div>
                <input
                  type="text"
                  placeholder="نص العرض (مثال: خصم ٢٠٪ على التذاكر)"
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  value={editingPlace.offer_text || ""}
                  onChange={(e) => updateField("offer_text", e.target.value)}
                />
                <div>
                  <label className="text-sm">تاريخ انتهاء العرض</label>
                  <input
                    type="date"
                    className="border rounded-lg px-3 py-2 text-sm ml-2"
                    value={editingPlace.offer_expiry || ""}
                    onChange={(e) => updateField("offer_expiry", e.target.value || null)}
                  />
                </div>
              </div>

              {/* Meta fields */}
              <div className="flex gap-3 flex-wrap">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingPlace.active ?? true}
                    onChange={(e) => updateField("active", e.target.checked)}
                  />
                  <span className="text-sm">نشط</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingPlace.is_free ?? false}
                    onChange={(e) => updateField("is_free", e.target.checked)}
                  />
                  <span className="text-sm">مجاني</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingPlace.booking_required ?? false}
                    onChange={(e) => updateField("booking_required", e.target.checked)}
                  />
                  <span className="text-sm">يتطلب حجز</span>
                </label>
                <div>
                  <label className="text-sm">الترتيب: </label>
                  <input
                    type="number"
                    className="border rounded px-2 py-1 w-20 text-sm"
                    value={editingPlace.order || 0}
                    onChange={(e) => updateField("order", parseInt(e.target.value))}
                  />
                </div>
              </div>

              {/* Source info */}
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="المصدر (Kidzapp / Manual / Admin)"
                  className="border rounded-lg px-3 py-2 flex-1 text-sm"
                  value={editingPlace.external_source || ""}
                  onChange={(e) => updateField("external_source", e.target.value)}
                />
                <input
                  type="text"
                  placeholder="رابط خارجي (External Detail URL)"
                  className="border rounded-lg px-3 py-2 flex-1 text-sm"
                  value={editingPlace.external_detail_url || ""}
                  onChange={(e) => updateField("external_detail_url", e.target.value)}
                />
              </div>

              {/* Save/Cancel */}
              <div className="flex gap-3 pt-2">
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? "جاري الحفظ..." : "حفظ المكان"}
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
