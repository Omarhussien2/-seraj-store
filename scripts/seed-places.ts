/**
 * Seed Places Script
 * Reads fas7a-helwa-merged.csv, parses 480+ places,
 * and inserts them into MongoDB Place collection.
 *
 * Usage: npx dotenv-cli -e .env.local -- npx tsx scripts/seed-places.ts --force
 */

import mongoose from "mongoose";
import fs from "fs";
import path from "path";

// Import Place model (relative path for seed script, NOT @/ alias)
import Place from "../src/lib/models/Place";

// ─── CSV Parser (handles quoted fields with embedded commas) ───

function parseCSV(content: string): Record<string, string>[] {
  const lines: string[] = [];
  let current = "";
  let inQuotes = false;

  // Split into lines respecting quoted newlines
  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    if (char === '"') {
      if (inQuotes && i + 1 < content.length && content[i + 1] === '"') {
        // Escaped double quote
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
        current += char;
      }
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (current.trim().length > 0) {
        lines.push(current.trim());
      }
      current = "";
      // Skip \r\n as pair
      if (char === '\r' && i + 1 < content.length && content[i + 1] === '\n') {
        i++;
      }
    } else {
      current += char;
    }
  }
  if (current.trim().length > 0) {
    lines.push(current.trim());
  }

  if (lines.length < 2) return [];

  // Parse header
  const header = parseCSVLine(lines[0]);

  // Parse data rows
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: Record<string, string> = {};
    for (let j = 0; j < header.length; j++) {
      row[header[j]] = values[j] || "";
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
    } else if (char === ',' && !inQuotes) {
      fields.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  fields.push(current.trim());

  return fields;
}

// ─── Map CSV row to Place document ───

interface PlaceDoc {
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
  indoor_outdoor: "indoor" | "outdoor" | "mixed" | "unknown";
  booking_required: boolean;
  website_url: string;
  external_source: string;
  external_detail_url: string;
  phone: string;
  facebook_url: string;
  instagram_url: string;
  category_ids: number[];
  image_url: string;
  last_price_update: Date;
  active: boolean;
  order: number;
}

function mapRowToPlace(row: Record<string, string>, index: number): PlaceDoc {
  return {
    name_ar: row.name_ar || row.name_en || "",
    name_en: row.name_en || "",
    description_short: row.description_short || "",
    area: row.area || "",
    city: row.city || "",
    address: row.address || "",
    location: {
      lat: parseFloat(row.lat) || 0,
      lon: parseFloat(row.lon) || 0,
    },
    min_price: parseInt(row.min_price) || 0,
    max_price: parseInt(row.max_price) || 0,
    price_range_id: parseInt(row.price_range_id) || 1,
    min_age: parseInt(row.min_age) || 0,
    max_age: parseInt(row.max_age) || 100,
    avg_duration_hours: parseInt(row.avg_duration_hours) || 3,
    is_free: row.is_free === "true",
    indoor_outdoor: (["indoor", "outdoor", "mixed"].includes(row.indoor_outdoor)
      ? row.indoor_outdoor
      : "unknown") as PlaceDoc["indoor_outdoor"],
    booking_required: row.booking_required === "true",
    website_url: row.website_url || "",
    external_source: row.external_source || "Manual",
    external_detail_url: row.external_detail_url || "",
    phone: row.phone || "",
    facebook_url: row.facebook_url || "",
    instagram_url: row.instagram_url || "",
    category_ids: row.category_ids
      ? row.category_ids
          .split(";")
          .map(Number)
          .filter((n) => !isNaN(n) && n > 0)
      : [],
    image_url: row.image_url || "",
    last_price_update: new Date(row.last_price_update || "2019-01-01"),
    active: true,
    order: index,
  };
}

// ─── Main ───

async function main() {
  // Force flag check (interactive prompts don't work in npx tsx)
  if (!process.argv.includes("--force")) {
    console.log("⚠️  This will DELETE all existing places and re-seed.");
    console.log("   Add --force to confirm: npx tsx scripts/seed-places.ts --force");
    process.exit(0);
  }

  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    console.error("❌ MONGODB_URI not set");
    process.exit(1);
  }

  console.log("🔌 Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);
  console.log("✅ Connected");

  // Read CSV
  const csvPath = path.join(process.cwd(), "data", "fas7a-helwa-merged.csv");
  console.log(`📖 Reading ${csvPath}...`);

  if (!fs.existsSync(csvPath)) {
    console.error(`❌ CSV not found: ${csvPath}`);
    process.exit(1);
  }

  const rawContent = fs.readFileSync(csvPath, "utf-8");
  const rows = parseCSV(rawContent);
  console.log(`📋 Parsed ${rows.length} rows from CSV`);

  // Map to Place documents
  const placeDocs = rows.map((row, i) => mapRowToPlace(row, i));

  // Clear existing places
  console.log("🗑️  Clearing existing places...");
  const deleteResult = await Place.deleteMany({});
  console.log(`   Deleted ${deleteResult.deletedCount} existing places`);

  // Bulk insert
  console.log("📝 Inserting places...");
  const inserted = await Place.insertMany(placeDocs, { ordered: false });
  console.log(`✅ Imported ${inserted.length} places`);

  // Stats
  const total = await Place.countDocuments({});
  console.log(`📊 Total places in DB: ${total}`);

  // Breakdown by city
  const cityBreakdown = await Place.aggregate([
    { $group: { _id: "$city", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
  console.log("\n🏙️  By city:");
  for (const { _id, count } of cityBreakdown) {
    console.log(`   ${_id}: ${count}`);
  }

  // Breakdown by source
  const sourceBreakdown = await Place.aggregate([
    { $group: { _id: "$external_source", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
  console.log("\n📡 By source:");
  for (const { _id, count } of sourceBreakdown) {
    console.log(`   ${_id}: ${count}`);
  }

  // Free places count
  const freeCount = await Place.countDocuments({ is_free: true });
  console.log(`\n🆓 Free places: ${freeCount}`);

  await mongoose.disconnect();
  console.log("\n👋 Done");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
