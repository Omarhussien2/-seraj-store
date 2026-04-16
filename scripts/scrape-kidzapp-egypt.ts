// scripts/scrape-kidzapp-egypt.ts
// Fetches all Egypt kids experiences from Kidzapp API, transforms to CSV
// Phase 07: Fas7a Helwa Data Extraction — Plan 01

import { writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { Parser } from "json2csv";
import type {
  KidzappExperience,
  KidzappPaginatedResponse,
  PlaceRow,
} from "./kidzapp-types.js";
import {
  VENUE_TYPE_MAP,
  CATEGORY_MAP,
  CSV_FIELDS,
} from "./kidzapp-types.js";

// ─── Configuration ───────────────────────────────────────────────────

const API_BASE = "https://api.kidzapp.com/api/3.0";
const PAGE_SIZE = 100;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const PAGE_DELAY_MS = 200;

// ─── Fetch with retry ────────────────────────────────────────────────

async function fetchWithRetry(url: string, retries = MAX_RETRIES): Promise<Response> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.warn(`  ⚠ Attempt ${attempt}/${retries} failed for ${url}: ${msg}`);
      if (attempt < retries) {
        await sleep(RETRY_DELAY_MS);
      } else {
        throw error;
      }
    }
  }
  throw new Error("Unreachable");
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ─── Fetch all Egypt experiences ──────────────────────────────────────

async function fetchAllEgyptExperiences(): Promise<KidzappExperience[]> {
  const allResults: KidzappExperience[] = [];
  let url: string | null = `${API_BASE}/experiences/?country_code=eg&page_size=${PAGE_SIZE}`;
  let pageNum = 1;

  while (url) {
    try {
      const response = await fetchWithRetry(url);
      const data: KidzappPaginatedResponse = await response.json();
      allResults.push(...data.results);
      console.log(`  📄 Page ${pageNum}: fetched ${allResults.length}/${data.count} experiences`);
      url = data.next;
      pageNum++;
      if (url) await sleep(PAGE_DELAY_MS);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`  ❌ Failed page ${pageNum}: ${msg}`);
      console.log(`  💾 Saving ${allResults.length} results fetched so far...`);
      break;
    }
  }

  return allResults;
}

// ─── Extract price from text fields ──────────────────────────────────

function extractPricesFromText(priceAgePrices: string): number[] {
  if (!priceAgePrices) return [];
  const matches = priceAgePrices.match(/EGP\s*([\d.]+)/gi);
  if (!matches) return [];
  return matches
    .map(m => parseFloat(m.replace(/EGP\s*/i, "")))
    .filter(p => !isNaN(p) && p > 0);
}

// ─── Estimate average duration ───────────────────────────────────────

function estimateDuration(exp: KidzappExperience): number {
  const text = (exp.description || "").toLowerCase() +
    (exp.top_tip || "").toLowerCase() +
    (exp.price_age_groups || "").toLowerCase();

  if (text.includes("full day") || text.includes("full-day")) return 6;
  if (text.includes("half day") || text.includes("half-day")) return 4;
  if (text.includes("2 hours") || text.includes("2 hour")) return 2;
  if (text.includes("3 hours") || text.includes("3 hour")) return 3;
  if (text.includes("4 hours") || text.includes("4 hour")) return 4;

  // Indoor play areas typically 2h
  const venueType = VENUE_TYPE_MAP(exp.venue_type);
  if (venueType === "indoor") return 2;
  if (venueType === "outdoor") return 3;

  return 2; // default
}

// ─── Map categories to local IDs ─────────────────────────────────────

function mapCategories(categories: KidzappExperience["categories"]): string {
  const localIds = new Set<number>();
  for (const cat of categories) {
    const localId = CATEGORY_MAP[cat.id];
    if (localId !== undefined) {
      localIds.add(localId);
    }
  }
  return localIds.size > 0
    ? Array.from(localIds).sort().join(";")
    : "1"; // default to Fun & Play
}

// ─── Transform single experience ─────────────────────────────────────

function transformExperience(exp: KidzappExperience, seqId: number): PlaceRow {
  // Prices from structured price[] array
  const structuredPrices = (exp.price || [])
    .map(p => p.final_price)
    .filter(p => p > 0);

  // Prices from text fields as fallback
  const textPrices = structuredPrices.length > 0
    ? structuredPrices
    : extractPricesFromText(exp.price_age_prices || "");

  const minPrice = textPrices.length > 0 ? Math.min(...textPrices) : 0;
  const maxPrice = textPrices.length > 0 ? Math.max(...textPrices) : 0;

  // Ages
  const ages = exp.ages_display || [];
  const minAge = ages.length > 0 ? Math.min(...ages) : 0;
  const maxAge = ages.length > 0 ? Math.max(...ages) : 100;

  // Last price update from created_at
  const lastPriceUpdate = exp.created_at ? exp.created_at.split("T")[0] : "2024-01-01";

  // Facebook detection from website URL
  const facebookUrl = (exp.website && exp.website.includes("facebook")) ? exp.website : "";

  // Instagram
  const instagramUrl = exp.instagram_link
    ? (exp.instagram_link.startsWith("http") ? exp.instagram_link : `https://instagram.com/${exp.instagram_link}`)
    : "";

  return {
    id: seqId,
    name_ar: exp.name || "",
    name_en: exp.name || "",
    description_short: exp.top_tip || (exp.description || "").substring(0, 120) || "",
    area: exp.area?.name_en || "",
    city: exp.city?.name_en || "",
    address: exp.address || "",
    lat: exp.location?.lat || 0,
    lon: exp.location?.lon || 0,
    min_price: minPrice,
    max_price: maxPrice,
    price_range_id: exp.price_range || 1,
    min_age: minAge,
    max_age: maxAge,
    avg_duration_hours: estimateDuration(exp),
    is_free: minPrice === 0 && maxPrice === 0,
    indoor_outdoor: VENUE_TYPE_MAP(exp.venue_type || []),
    booking_required: exp.booking_required || false,
    website_url: (exp.website && !exp.website.includes("facebook")) ? exp.website : "",
    external_source: "Kidzapp",
    external_detail_url: `https://kidzapp.com/${exp.url || ""}`,
    phone: exp.phone || "",
    facebook_url: facebookUrl,
    instagram_url: instagramUrl,
    category_ids: mapCategories(exp.categories || []),
    image_url: exp.image_url || "",
    last_price_update: lastPriceUpdate,
  };
}

// ─── Main ────────────────────────────────────────────────────────────

async function main() {
  console.log("🚀 Fetching all Egypt kids experiences from Kidzapp API...\n");

  // 1. Fetch all experiences
  const experiences = await fetchAllEgyptExperiences();
  console.log(`\n✅ Total fetched: ${experiences.length} experiences`);

  // 2. Filter to venues only
  const venues = experiences.filter(exp => exp.type === "venue" && exp.show === true);
  console.log(`📍 Venues (type=venue, show=true): ${venues.length}`);

  // 3. Transform to PlaceRow with per-row error handling
  const rows: PlaceRow[] = [];
  const skipped: { id: number; error: string }[] = [];

  for (let i = 0; i < venues.length; i++) {
    const exp = venues[i];
    try {
      const row = transformExperience(exp, rows.length + 1);
      rows.push(row);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      skipped.push({ id: exp.id, error: msg });
      console.warn(`  ⚠ Skipped experience id=${exp.id}: ${msg}`);
    }
  }

  console.log(`\n📊 Transformed: ${rows.length} rows, skipped: ${skipped.length}`);

  // 4. City breakdown
  const cityBreakdown: Record<string, number> = {};
  for (const row of rows) {
    const city = row.city || "Unknown";
    cityBreakdown[city] = (cityBreakdown[city] || 0) + 1;
  }
  console.log("\n🏙 City breakdown:");
  Object.entries(cityBreakdown)
    .sort((a, b) => b[1] - a[1])
    .forEach(([city, count]) => console.log(`  ${city}: ${count}`));

  // 5. Category breakdown
  const catBreakdown: Record<string, number> = {};
  for (const row of rows) {
    const cats = row.category_ids.split(";");
    for (const cat of cats) {
      catBreakdown[cat] = (catBreakdown[cat] || 0) + 1;
    }
  }
  console.log("\n📂 Category breakdown:");
  Object.entries(catBreakdown)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => console.log(`  Category ${cat}: ${count}`));

  // 6. Write CSV with BOM prefix for Arabic text
  const parser = new Parser<PlaceRow>({ fields: CSV_FIELDS });
  const csv = parser.parse(rows);
  const outputPath = resolve(dirname(fileURLToPath(import.meta.url)), "..", "data", "fas7a-helwa-kidzapp.csv");
  writeFileSync(outputPath, "\uFEFF" + csv, "utf-8");
  console.log(`\n📄 CSV written to data/fas7a-helwa-kidzapp.csv (${rows.length} rows)`);

  // 7. Summary
  const freeCount = rows.filter(r => r.is_free).length;
  console.log(`\n✅ Summary: Fetched ${experiences.length}, ${venues.length} venues, ${rows.length} in CSV, ${skipped.length} skipped, ${freeCount} free`);
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
