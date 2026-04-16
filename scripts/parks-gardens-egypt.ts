// scripts/parks-gardens-egypt.ts
// Hardcoded Egyptian parks/gardens dataset + merge with Kidzapp CSV
// Phase 07: Fas7a Helwa Data Extraction — Plan 01

import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { Parser } from "json2csv";
import type { PlaceRow } from "./kidzapp-types.js";
import { CSV_FIELDS } from "./kidzapp-types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, "..", "data");

// ─── Egyptian Parks & Gardens Dataset ────────────────────────────────

interface ParkData {
  name_ar: string;
  name_en: string;
  description_short: string;
  area: string;
  city: string;
  address: string;
  lat: number;
  lon: number;
  min_price: number;
  max_price: number;
  category_ids: number[]; // local category IDs
}

const PARKS: ParkData[] = [
  // ─── Cairo ────────────────────────────────────────────────────────
  {
    name_ar: "حديقة الأزهر",
    name_en: "Al-Azhar Park",
    description_short: "Beautiful hilltop park overlooking Islamic Cairo with gardens, restaurants and playgrounds.",
    area: "Salah Salem",
    city: "Cairo",
    address: "Al-Azhar Park, Salah Salem Road, Cairo",
    lat: 30.0444,
    lon: 31.2639,
    min_price: 20,
    max_price: 40,
    category_ids: [3],
  },
  {
    name_ar: "حديقة الأندلس",
    name_en: "Al-Andalus Garden",
    description_short: "Historic Nile-side garden in Zamalek with palm trees and Pharaonic-style statues.",
    area: "Zamalek",
    city: "Cairo",
    address: "Al-Andalus Garden, 26th July St, Zamalek, Cairo",
    lat: 30.0547,
    lon: 31.2243,
    min_price: 0,
    max_price: 0,
    category_ids: [3],
  },
  {
    name_ar: "الحديقة اليابانية",
    name_en: "Japanese Garden",
    description_short: "Serene Japanese-style garden in Helwan with pagodas, bridges and koi ponds.",
    area: "Helwan",
    city: "Cairo",
    address: "Japanese Garden, Helwan, Cairo",
    lat: 29.8465,
    lon: 31.3324,
    min_price: 5,
    max_price: 5,
    category_ids: [3],
  },
  {
    name_ar: "حديقة الأورمان",
    name_en: "Orman Botanical Garden",
    description_short: "One of the largest botanical gardens in Egypt with rare plants and a small zoo area.",
    area: "Giza",
    city: "Cairo",
    address: "Orman Botanical Garden, Giza University St, Giza",
    lat: 30.0199,
    lon: 31.2066,
    min_price: 10,
    max_price: 10,
    category_ids: [3],
  },
  {
    name_ar: "حديقة حيوان الجيزة",
    name_en: "Giza Zoo",
    description_short: "Egypt's largest zoo with over 100 species, gardens, and children's play areas.",
    area: "Giza",
    city: "Cairo",
    address: "Giza Zoo, Al-Haram St, Giza",
    lat: 30.0258,
    lon: 31.2139,
    min_price: 5,
    max_price: 10,
    category_ids: [3, 5],
  },
  {
    name_ar: "حديقة الأسماك",
    name_en: "Fish Garden (Aquarium Grotto)",
    description_short: "Unique underground aquarium built into natural rock formations in Zamalek.",
    area: "Zamalek",
    city: "Cairo",
    address: "Fish Garden, 26th July St, Zamalek, Cairo",
    lat: 30.0574,
    lon: 31.2215,
    min_price: 5,
    max_price: 5,
    category_ids: [3, 5],
  },
  {
    name_ar: "حديقة الحرية",
    name_en: "Al-Horreya Garden",
    description_short: "Spacious public garden in Heliopolis with walking paths and playground equipment.",
    area: "Heliopolis",
    city: "Cairo",
    address: "Al-Horreya Garden, El-Nozha St, Heliopolis, Cairo",
    lat: 30.0897,
    lon: 31.3197,
    min_price: 0,
    max_price: 0,
    category_ids: [3],
  },
  {
    name_ar: "حديقة العائلة",
    name_en: "Family Park",
    description_short: "Modern family park in Madinaty with play areas, green spaces and walking tracks.",
    area: "Madinaty",
    city: "Cairo",
    address: "Family Park, Madinaty, New Cairo",
    lat: 30.1158,
    lon: 31.4564,
    min_price: 0,
    max_price: 0,
    category_ids: [3, 1],
  },
  {
    name_ar: "سي إف سي بارك",
    name_en: "CFC Park",
    description_short: "Open green space in New Cairo popular for family outings and children's activities.",
    area: "New Cairo",
    city: "Cairo",
    address: "CFC Park, 90th St, New Cairo",
    lat: 30.0305,
    lon: 31.4315,
    min_price: 0,
    max_price: 0,
    category_ids: [3],
  },
  {
    name_ar: "حديقة الدولية",
    name_en: "International Park",
    description_short: "Large park in Nasr City themed after different countries with gardens and play areas.",
    area: "Nasr City",
    city: "Cairo",
    address: "International Park, Abbas El-Akkad St, Nasr City, Cairo",
    lat: 30.0686,
    lon: 31.3426,
    min_price: 10,
    max_price: 10,
    category_ids: [3],
  },
  {
    name_ar: "حديقة ميريلاند",
    name_en: "Merryland Park",
    description_short: "Popular family park with shaded areas, walking paths and children's playground.",
    area: "Heliopolis",
    city: "Cairo",
    address: "Merryland Park, Al-Ahram St, Heliopolis, Cairo",
    lat: 30.0793,
    lon: 31.3089,
    min_price: 10,
    max_price: 10,
    category_ids: [3],
  },
  {
    name_ar: "حدائق القبة",
    name_en: "El Kobba Gardens",
    description_short: "Historic garden area with green spaces for family relaxation in Cairo.",
    area: "El Kobba",
    city: "Cairo",
    address: "El Kobba Gardens, El Kobba, Cairo",
    lat: 30.0988,
    lon: 31.2823,
    min_price: 5,
    max_price: 5,
    category_ids: [3],
  },

  // ─── Alexandria ────────────────────────────────────────────────────
  {
    name_ar: "حدائق المنتزة",
    name_en: "Montazah Gardens",
    description_short: "Sprawling royal gardens on the Mediterranean coast with beaches, trees and palaces.",
    area: "Montazah",
    city: "Alexandria",
    address: "Montazah Gardens, Montazah, Alexandria",
    lat: 31.2796,
    lon: 30.0174,
    min_price: 0,
    max_price: 0,
    category_ids: [3],
  },
  {
    name_ar: "حديقة أنطونياديس",
    name_en: "Antoniadis Garden",
    description_short: "Elegant garden with Greek-style statues, rose garden and winding paths.",
    area: "Smouha",
    city: "Alexandria",
    address: "Antoniadis Garden, Smouha, Alexandria",
    lat: 31.2027,
    lon: 29.9394,
    min_price: 10,
    max_price: 10,
    category_ids: [3],
  },
  {
    name_ar: "حديقة حيوان الإسكندرية",
    name_en: "Alexandria Zoo",
    description_short: "Zoo with a variety of animals, play areas and green spaces for family visits.",
    area: "Smouha",
    city: "Alexandria",
    address: "Alexandria Zoo, Smouha, Alexandria",
    lat: 31.1974,
    lon: 29.9473,
    min_price: 5,
    max_price: 5,
    category_ids: [3, 5],
  },
  {
    name_ar: "كوبري ستانلي",
    name_en: "Stanley Bridge",
    description_short: "Iconic Alex waterfront promenade with sea views and family-friendly walking path.",
    area: "Stanley",
    city: "Alexandria",
    address: "Stanley Bridge, Alexandria Corniche, Alexandria",
    lat: 31.2321,
    lon: 29.9513,
    min_price: 0,
    max_price: 0,
    category_ids: [3],
  },
  {
    name_ar: "حدائق الشلالات",
    name_en: "Shallalat Gardens",
    description_short: "Historic garden with water features, ancient ruins and shaded walking paths.",
    area: "El Shatby",
    city: "Alexandria",
    address: "Shallalat Gardens, El Shatby, Alexandria",
    lat: 31.2009,
    lon: 29.9045,
    min_price: 0,
    max_price: 0,
    category_ids: [3],
  },

  // ─── Other Cities ──────────────────────────────────────────────────
  {
    name_ar: "حديقة أسوان النباتية",
    name_en: "Aswan Botanical Garden",
    description_short: "Island botanical garden on the Nile with exotic plants from around the world.",
    area: "Aswan",
    city: "Aswan",
    address: "Aswan Botanical Garden, Elephantine Island, Aswan",
    lat: 24.0875,
    lon: 32.8883,
    min_price: 20,
    max_price: 20,
    category_ids: [3],
  },
  {
    name_ar: "وادي الريان",
    name_en: "Wadi Elrayan",
    description_short: "Protected area with waterfalls, lakes and desert scenery — great for family day trips.",
    area: "Fayoum",
    city: "Al Fayoum",
    address: "Wadi Elrayan Protected Area, Fayoum",
    lat: 29.1818,
    lon: 30.4123,
    min_price: 20,
    max_price: 20,
    category_ids: [3, 5],
  },
  {
    name_ar: "وادي الحيتان",
    name_en: "Wadi El Hitan (Whale Valley)",
    description_short: "UNESCO World Heritage Site with ancient whale fossils and desert hiking trails.",
    area: "Fayoum",
    city: "Al Fayoum",
    address: "Wadi El Hitan, Wadi Elrayan, Fayoum",
    lat: 29.2589,
    lon: 30.0248,
    min_price: 50,
    max_price: 50,
    category_ids: [3, 4],
  },
  {
    name_ar: "رأس محمد",
    name_en: "Ras Muhammad National Park",
    description_short: "World-famous marine park with coral reefs, snorkeling and stunning Red Sea views.",
    area: "Sharm El Sheikh",
    city: "Sharm El Sheikh",
    address: "Ras Muhammad National Park, Sharm El Sheikh",
    lat: 27.7308,
    lon: 34.2503,
    min_price: 100,
    max_price: 100,
    category_ids: [3],
  },
  {
    name_ar: "الوادي الملون",
    name_en: "Colored Canyon",
    description_short: "Stunning natural canyon with colorful rock formations — adventurous family outing.",
    area: "Dahab",
    city: "Dahab",
    address: "Colored Canyon, Nuweiba-Dahab Road, South Sinai",
    lat: 28.9500,
    lon: 34.4333,
    min_price: 0,
    max_price: 0,
    category_ids: [3],
  },
  {
    name_ar: "البلو هول",
    name_en: "Blue Hole",
    description_short: "Famous diving spot with crystal-clear waters, snorkeling and Red Sea marine life.",
    area: "Dahab",
    city: "Dahab",
    address: "Blue Hole, Dahab, South Sinai",
    lat: 28.1086,
    lon: 34.5408,
    min_price: 0,
    max_price: 0,
    category_ids: [3],
  },
  {
    name_ar: "شلالات الفيوم",
    name_en: "Fayoum Waterfalls",
    description_short: "Natural waterfalls in the desert — a unique family adventure spot near Cairo.",
    area: "Fayoum",
    city: "Al Fayoum",
    address: "Fayoum Waterfalls, Wadi Elrayan, Fayoum",
    lat: 29.1700,
    lon: 30.4000,
    min_price: 0,
    max_price: 0,
    category_ids: [3],
  },
];

// ─── CSV Parsing (handles quoted fields with commas) ─────────────────

function parseCSV(csvText: string): Map<string, string>[] {
  const lines: string[] = [];
  let current = "";
  let inQuotes = false;

  for (const char of csvText) {
    if (char === '"') {
      inQuotes = !inQuotes;
      current += char;
    } else if (char === "\n" && !inQuotes) {
      lines.push(current.replace(/\r$/, ""));
      current = "";
    } else {
      current += char;
    }
  }
  if (current.trim()) lines.push(current.replace(/\r$/, ""));

  if (lines.length < 2) return [];

  // Parse header
  const headers = parseCSVLine(lines[0]);
  const rows: Map<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === 0 || (values.length === 1 && values[0] === "")) continue;
    const row = new Map<string, string>();
    for (let j = 0; j < headers.length; j++) {
      row.set(headers[j], values[j] || "");
    }
    rows.push(row);
  }

  return rows;
}

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      fields.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  fields.push(current);
  return fields;
}

// ─── CSV row to PlaceRow ─────────────────────────────────────────────

function csvRowToPlaceRow(row: Map<string, string>): PlaceRow {
  return {
    id: parseInt(row.get("id") || "0"),
    name_ar: row.get("name_ar") || "",
    name_en: row.get("name_en") || "",
    description_short: row.get("description_short") || "",
    area: row.get("area") || "",
    city: row.get("city") || "",
    address: row.get("address") || "",
    lat: parseFloat(row.get("lat") || "0"),
    lon: parseFloat(row.get("lon") || "0"),
    min_price: parseFloat(row.get("min_price") || "0"),
    max_price: parseFloat(row.get("max_price") || "0"),
    price_range_id: parseInt(row.get("price_range_id") || "1"),
    min_age: parseInt(row.get("min_age") || "0"),
    max_age: parseInt(row.get("max_age") || "100"),
    avg_duration_hours: parseFloat(row.get("avg_duration_hours") || "2"),
    is_free: row.get("is_free") === "true",
    indoor_outdoor: (row.get("indoor_outdoor") as PlaceRow["indoor_outdoor"]) || "unknown",
    booking_required: row.get("booking_required") === "true",
    website_url: row.get("website_url") || "",
    external_source: row.get("external_source") || "",
    external_detail_url: row.get("external_detail_url") || "",
    phone: row.get("phone") || "",
    facebook_url: row.get("facebook_url") || "",
    instagram_url: row.get("instagram_url") || "",
    category_ids: row.get("category_ids") || "",
    image_url: row.get("image_url") || "",
    last_price_update: row.get("last_price_update") || "",
  };
}

// ─── Main ────────────────────────────────────────────────────────────

function main() {
  console.log("🌳 Egyptian Parks & Gardens Compilation + Merge\n");

  // ── Step 1: Generate parks CSV ──────────────────────────────────────
  const parkRows: PlaceRow[] = PARKS.map((park, i) => ({
    id: i + 1,
    name_ar: park.name_ar,
    name_en: park.name_en,
    description_short: park.description_short,
    area: park.area,
    city: park.city,
    address: park.address,
    lat: park.lat,
    lon: park.lon,
    min_price: park.min_price,
    max_price: park.max_price,
    price_range_id: park.min_price === 0 ? 1 : (park.min_price <= 10 ? 2 : (park.min_price <= 50 ? 3 : 4)),
    min_age: 0,
    max_age: 100,
    avg_duration_hours: 3,
    is_free: park.min_price === 0 && park.max_price === 0,
    indoor_outdoor: "outdoor" as const,
    booking_required: false,
    website_url: "",
    external_source: "Manual",
    external_detail_url: "",
    phone: "",
    facebook_url: "",
    instagram_url: "",
    category_ids: park.category_ids.join(";"),
    image_url: "",
    last_price_update: "2024-01-01",
  }));

  const parser = new Parser<PlaceRow>({ fields: CSV_FIELDS });
  const parksCSV = parser.parse(parkRows);
  const parksPath = resolve(DATA_DIR, "fas7a-helwa-parks-gardens.csv");
  writeFileSync(parksPath, "\uFEFF" + parksCSV, "utf-8");
  console.log(`📄 Parks CSV: ${parkRows.length} rows → data/fas7a-helwa-parks-gardens.csv`);

  // ── Step 2: Read Kidzapp CSV ────────────────────────────────────────
  const kidzappPath = resolve(DATA_DIR, "fas7a-helwa-kidzapp.csv");
  const kidzappCSV = readFileSync(kidzappPath, "utf-8");
  // Remove BOM if present
  const cleanCSV = kidzappCSV.replace(/^\uFEFF/, "");
  const kidzappRows = parseCSV(cleanCSV).map(csvRowToPlaceRow);
  console.log(`📄 Kidzapp CSV: ${kidzappRows.length} rows loaded`);

  // ── Step 3: Merge + Deduplicate ─────────────────────────────────────
  const seen = new Set<string>();
  const merged: PlaceRow[] = [];

  // Add Kidzapp rows first (more complete data)
  for (const row of kidzappRows) {
    const key = row.name_en.trim().toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(row);
    }
  }

  // Add park rows (deduplicate against Kidzapp)
  let parkAdded = 0;
  let parkDuped = 0;
  for (const row of parkRows) {
    const key = row.name_en.trim().toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      parkAdded++;
      merged.push(row);
    } else {
      parkDuped++;
    }
  }

  // Re-number sequentially
  for (let i = 0; i < merged.length; i++) {
    merged[i].id = i + 1;
  }

  console.log(`\n🔗 Merge: ${kidzappRows.length} Kidzapp + ${parkAdded} parks added (${parkDuped} duplicates removed)`);

  // ── Step 4: Write merged CSV ────────────────────────────────────────
  const mergedCSV = parser.parse(merged);
  const mergedPath = resolve(DATA_DIR, "fas7a-helwa-merged.csv");
  writeFileSync(mergedPath, "\uFEFF" + mergedCSV, "utf-8");
  console.log(`📄 Merged CSV: ${merged.length} rows → data/fas7a-helwa-merged.csv`);

  // ── Step 5: Summary ─────────────────────────────────────────────────
  console.log("\n" + "═".repeat(50));
  console.log("📊 MERGE SUMMARY");
  console.log("═".repeat(50));
  console.log(`Total unique places: ${merged.length}`);

  // City breakdown
  const cityBreakdown: Record<string, number> = {};
  for (const row of merged) {
    const city = row.city || "Unknown";
    cityBreakdown[city] = (cityBreakdown[city] || 0) + 1;
  }
  console.log("\n🏙 City breakdown:");
  Object.entries(cityBreakdown)
    .sort((a, b) => b[1] - a[1])
    .forEach(([city, count]) => console.log(`  ${city}: ${count}`));

  // Source breakdown
  const sourceBreakdown: Record<string, number> = {};
  for (const row of merged) {
    const src = row.external_source || "Unknown";
    sourceBreakdown[src] = (sourceBreakdown[src] || 0) + 1;
  }
  console.log("\n📂 Source breakdown:");
  Object.entries(sourceBreakdown)
    .sort((a, b) => b[1] - a[1])
    .forEach(([src, count]) => console.log(`  ${src}: ${count}`));

  // Free count
  const freeCount = merged.filter(r => r.is_free).length;
  console.log(`\n🆓 Free places: ${freeCount}`);

  // Stale price count (before 2023)
  const staleCount = merged.filter(r => {
    if (!r.last_price_update) return true;
    return r.last_price_update < "2023-01-01";
  }).length;
  console.log(`⚠️  Stale prices (before 2023): ${staleCount}`);

  console.log("\n✅ Done! data/fas7a-helwa-merged.csv is ready for MongoDB seeding.");
}

main();
