// Shared TypeScript types for Kidzapp API + CSV + future backend model
// Phase 07: Fas7a Helwa Data Extraction

// ─── Kidzapp API Types ───────────────────────────────────────────────

export interface KidzappCategory {
  id: number;
  name: string;
  name_en: string;
  name_ar: string | null;
  slug: string;
}

export interface KidzappPriceOption {
  id: number;
  type_en: string;
  type_ar: string;
  final_price: number;
  currency: string;
}

export interface KidzappWorkingHour {
  day: string;
  from_time: string;
  to_time: string;
  is_closed: boolean;
}

export interface KidzappExperience {
  id: number;
  uid: string;
  name: string;
  title: string;
  title_en: string;
  slug: string;
  url: string;
  description: string;
  top_tip: string;
  type: string; // "venue" | "event" | "course"
  show: boolean;
  phone: string;
  website: string;
  instagram_link: string;
  address: string;
  brief_address: string;
  location: { lat: number; lon: number };
  image_url: string;
  image_carousel_list: string[];
  venue_type: string[]; // ["indoors"] | ["outdoors"] | []
  price_range: number; // 1-5 scale
  booking_required: boolean;
  ages_display: number[];
  working_hours: KidzappWorkingHour[];
  working_hours_brief: string;
  categories: KidzappCategory[];
  primary_category: KidzappCategory;
  subcategory: KidzappCategory[];
  area: { id: number; name_en: string; name_ar: string | null } | null;
  city: { id: number; name_en: string; name_ar: string } | null;
  price: KidzappPriceOption[];
  price_age_groups: string;
  price_age_prices: string;
  created_at: string;
}

export interface KidzappPaginatedResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: KidzappExperience[];
}

// ─── Unified PlaceRow Schema (CSV + future MongoDB model) ────────────

export interface PlaceRow {
  id: number;
  name_ar: string;
  name_en: string;
  description_short: string;
  area: string;
  city: string;
  address: string;
  lat: number;
  lon: number; // SIMPLE { lat, lon } — NOT GeoJSON, no 2dsphere for MVP
  min_price: number;
  max_price: number;
  price_range_id: number; // 1-5
  min_age: number;
  max_age: number;
  avg_duration_hours: number;
  is_free: boolean;
  indoor_outdoor: "indoor" | "outdoor" | "mixed" | "unknown";
  booking_required: boolean;
  website_url: string;
  external_source: string;
  external_detail_url: string;
  phone: string;
  facebook_url: string;
  instagram_url: string;
  category_ids: string; // semicolon-separated
  image_url: string;
  last_price_update: string; // YYYY-MM-DD
}

// ─── Mappings ────────────────────────────────────────────────────────

export const VENUE_TYPE_MAP = (venueTypes: string[]): "indoor" | "outdoor" | "mixed" | "unknown" => {
  if (!venueTypes || venueTypes.length === 0) return "unknown";
  const hasIndoor = venueTypes.some(v => v.toLowerCase() === "indoors" || v.toLowerCase() === "indoor");
  const hasOutdoor = venueTypes.some(v => v.toLowerCase() === "outdoors" || v.toLowerCase() === "outdoor");
  if (hasIndoor && hasOutdoor) return "mixed";
  if (hasIndoor) return "indoor";
  if (hasOutdoor) return "outdoor";
  return "unknown";
};

// Kidzapp category IDs → local simplified category IDs
export const CATEGORY_MAP: Record<number, number> = {
  66517: 1, // Fun & Play
  66514: 2, // Shows & Cinema
  66518: 3, // Outdoor & Nature
  66512: 4, // Art, Music & Dance
  37: 5,    // Animal Fun
  66513: 1, // Baby & Toddler → Fun & Play
  38: 3,    // Theme Parks → Outdoor & Parks
  49: 3,    // Water Fun → Outdoor & Parks
  45: 1,    // Sports & Active → Fun & Play
  48: 3,    // Explore The City → Outdoor & Parks
  66516: 6, // Eat Out
  66515: 4, // Courses, Camps & Workshops → Art & Educational
  46: 3,    // Nature & Outdoor → Outdoor & Parks
};

export const LOCAL_CATEGORIES: Record<number, string> = {
  1: "Fun & Play",
  2: "Shows & Cinema",
  3: "Outdoor & Parks",
  4: "Art & Educational",
  5: "Farms & Animals",
  6: "Eat Out",
};

// CSV column order for output
export const CSV_FIELDS: (keyof PlaceRow)[] = [
  "id", "name_ar", "name_en", "description_short", "area", "city", "address",
  "lat", "lon", "min_price", "max_price", "price_range_id",
  "min_age", "max_age", "avg_duration_hours", "is_free", "indoor_outdoor",
  "booking_required", "website_url", "external_source", "external_detail_url",
  "phone", "facebook_url", "instagram_url", "category_ids", "image_url", "last_price_update",
];
