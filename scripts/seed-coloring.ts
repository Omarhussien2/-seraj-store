/**
 * seed-coloring.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Seeds the coloring categories and sample items into MongoDB.
 *
 * Usage:
 *   npx ts-node -r tsconfig-paths/register scripts/seed-coloring.ts
 *   npx ts-node -r tsconfig-paths/register scripts/seed-coloring.ts --clear
 *
 * --clear flag: wipe existing coloring data before seeding
 *
 * In production, run this once locally to populate the DB.
 * Additional items are added via the Admin Dashboard.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import mongoose from "mongoose";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

// Import models (path aliases resolved by tsconfig-paths)
import ColoringCategory from "../src/lib/models/ColoringCategory";
import ColoringItem from "../src/lib/models/ColoringItem";

// ─── Category seed data ───────────────────────────────────────────────────────

const CATEGORIES = [
  // ── Top-level ──
  { slug: "coloring",    nameAr: "رسومات تلوين", nameEn: "Coloring",    icon: "🎨", parentSlug: null, order: 1, featured: true,  source: "mixed"        },
  { slug: "worksheets",  nameAr: "تمارين تعليمية", nameEn: "Worksheets", icon: "📝", parentSlug: null, order: 2, featured: true,  source: "supercoloring" },
  { slug: "crafts",      nameAr: "أنشطة يدوية",  nameEn: "Crafts",      icon: "✂️", parentSlug: null, order: 3, featured: false, source: "mixed"        },

  // ── Coloring sub-categories ──
  { slug: "col-animals",      nameAr: "حيوانات",           icon: "🐾", parentSlug: "coloring", order: 1, featured: true,  source: "supercoloring" },
  { slug: "col-disney",       nameAr: "شخصيات كرتونية",    icon: "🏰", parentSlug: "coloring", order: 2, featured: true,  source: "supercoloring" },
  { slug: "col-nature",       nameAr: "طبيعة وزهور",       icon: "🌸", parentSlug: "coloring", order: 3, featured: false, source: "supercoloring" },
  { slug: "col-vehicles",     nameAr: "مركبات وسيارات",    icon: "🚗", parentSlug: "coloring", order: 4, featured: false, source: "supercoloring" },
  { slug: "col-superheroes",  nameAr: "أبطال خارقون",      icon: "🦸", parentSlug: "coloring", order: 5, featured: false, source: "supercoloring" },
  { slug: "col-islamic",      nameAr: "إسلامي ورمضان",     icon: "🌙", parentSlug: "coloring", order: 6, featured: true,  source: "seraj"         },
  { slug: "col-seraj",        nameAr: "شخصيات سراج ⭐",   icon: "🐰", parentSlug: "coloring", order: 7, featured: true,  source: "seraj"         },
  { slug: "col-mandala",      nameAr: "ماندالا",            icon: "🎯", parentSlug: "coloring", order: 8, featured: false, source: "supercoloring" },

  // ── Worksheet sub-categories ──
  { slug: "ws-numbers",   nameAr: "أرقام وحساب",     icon: "🔢", parentSlug: "worksheets", order: 1, featured: true,  source: "supercoloring" },
  { slug: "ws-arabic",    nameAr: "حروف عربية",       icon: "🔤", parentSlug: "worksheets", order: 2, featured: true,  source: "mixed"         },
  { slug: "ws-english",   nameAr: "حروف إنجليزية",   icon: "🔤", parentSlug: "worksheets", order: 3, featured: false, source: "supercoloring" },
  { slug: "ws-dots",      nameAr: "ربط النقاط",       icon: "🔗", parentSlug: "worksheets", order: 4, featured: false, source: "supercoloring" },
  { slug: "ws-mazes",     nameAr: "متاهات",           icon: "🧩", parentSlug: "worksheets", order: 5, featured: false, source: "supercoloring" },

  // ── Craft sub-categories ──
  { slug: "craft-masks",  nameAr: "أقنعة",            icon: "🎭", parentSlug: "crafts", order: 1, featured: false, source: "supercoloring" },
  { slug: "craft-models", nameAr: "مجسمات ورقية",     icon: "📦", parentSlug: "crafts", order: 2, featured: false, source: "supercoloring" },
  { slug: "craft-art",    nameAr: "أعمال حرفية",      icon: "🎨", parentSlug: "crafts", order: 3, featured: false, source: "mixed"         },
];

// ─── Sample item seed data ────────────────────────────────────────────────────
// These are SAMPLE items from SuperColoring (CC0 / Public Domain section)
// Full seeding from automated scraping runs separately.
// All CC0 items below are safe to host on Cloudinary.

const SAMPLE_ITEMS = [
  // ── Animals - Cats ──
  {
    slug: "cat-sitting-cc0",
    title: "قطة جالسة للتلوين",
    categorySlug: "col-animals",
    thumbnail: "https://www.supercoloring.com/sites/default/files/styles/thumbnail/public/cif/2014/02/domestic-cat-sitting-coloring-page.png",
    sourceUrl: "https://www.supercoloring.com/coloring-pages/domestic-cat-sitting",
    sourceName: "SuperColoring",
    type: "coloring" as const,
    difficulty: "easy" as const,
    ageRange: "3-6" as const,
    tags: ["حيوانات", "قطط", "سهل"],
    license: "cc0" as const,
    printable: true,
    featured: true,
    order: 1,
  },
  // ── Animals - Dogs ──
  {
    slug: "dog-happy-cc0",
    title: "كلب سعيد للتلوين",
    categorySlug: "col-animals",
    thumbnail: "https://www.supercoloring.com/sites/default/files/styles/thumbnail/public/cif/2014/02/happy-dog-coloring-page.png",
    sourceUrl: "https://www.supercoloring.com/coloring-pages/happy-dog",
    sourceName: "SuperColoring",
    type: "coloring" as const,
    difficulty: "easy" as const,
    ageRange: "3-6" as const,
    tags: ["حيوانات", "كلاب", "سهل"],
    license: "cc0" as const,
    printable: true,
    featured: false,
    order: 2,
  },
  // ── Numbers worksheet ──
  {
    slug: "numbers-1-10-worksheet",
    title: "تمرين الأرقام من ١ إلى ١٠",
    categorySlug: "ws-numbers",
    thumbnail: "https://www.supercoloring.com/sites/default/files/styles/thumbnail/public/cif/2015/09/count-and-color-1-to-10.png",
    sourceUrl: "https://www.supercoloring.com/coloring-pages/count-and-color-1-to-10",
    sourceName: "SuperColoring",
    type: "worksheet" as const,
    difficulty: "easy" as const,
    ageRange: "3-6" as const,
    tags: ["أرقام", "تعليمي", "حساب"],
    license: "cc0" as const,
    printable: true,
    featured: true,
    order: 1,
  },
  // ── Mandala ──
  {
    slug: "simple-mandala-easy",
    title: "ماندالا بسيطة للأطفال",
    categorySlug: "col-mandala",
    thumbnail: "https://www.supercoloring.com/sites/default/files/styles/thumbnail/public/cif/2015/04/simple-mandala.png",
    sourceUrl: "https://www.supercoloring.com/coloring-pages/simple-mandala",
    sourceName: "SuperColoring",
    type: "coloring" as const,
    difficulty: "medium" as const,
    ageRange: "7-10" as const,
    tags: ["ماندالا", "هادئ", "تركيز"],
    license: "cc0" as const,
    printable: true,
    featured: false,
    order: 1,
  },
  // ── Dot-to-dot worksheet ──
  {
    slug: "dot-to-dot-elephant",
    title: "وصّل النقاط — فيل",
    categorySlug: "ws-dots",
    thumbnail: "https://www.supercoloring.com/sites/default/files/styles/thumbnail/public/cif/2016/01/elephant-dot-to-dot.png",
    sourceUrl: "https://www.supercoloring.com/dot-to-dot/elephant-dot-to-dot",
    sourceName: "SuperColoring",
    type: "worksheet" as const,
    difficulty: "easy" as const,
    ageRange: "3-6" as const,
    tags: ["نقاط", "فيلة", "تعليمي"],
    license: "cc0" as const,
    printable: true,
    featured: false,
    order: 1,
  },
];

// ─── Main seed function ───────────────────────────────────────────────────────

async function seedColoring() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("❌ Missing MONGODB_URI in environment");
    process.exit(1);
  }

  const clearFirst = process.argv.includes("--clear");

  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(uri);
    console.log("✅ Connected");

    if (clearFirst) {
      console.log("🗑️  Clearing existing coloring data...");
      await Promise.all([
        ColoringCategory.deleteMany({}),
        ColoringItem.deleteMany({}),
      ]);
      console.log("✅ Cleared");
    }

    // ── Seed Categories ──
    console.log(`\n📂 Seeding ${CATEGORIES.length} categories...`);
    let catInserted = 0;
    for (const cat of CATEGORIES) {
      const result = await ColoringCategory.updateOne(
        { slug: cat.slug },
        { $setOnInsert: { ...cat, active: true } },
        { upsert: true }
      );
      if (result.upsertedId) catInserted++;
    }
    console.log(`   ✅ ${catInserted} new categories inserted (${CATEGORIES.length - catInserted} already existed)`);

    // ── Seed Sample Items ──
    console.log(`\n🖼️  Seeding ${SAMPLE_ITEMS.length} sample items...`);
    let itemInserted = 0;
    for (const item of SAMPLE_ITEMS) {
      const result = await ColoringItem.updateOne(
        { slug: item.slug },
        { $setOnInsert: { ...item, active: true, savedCount: 0, printCount: 0, shareCount: 0 } },
        { upsert: true }
      );
      if (result.upsertedId) itemInserted++;
    }
    console.log(`   ✅ ${itemInserted} new items inserted`);

    // ── Update category item counts ──
    console.log("\n🔢 Updating category item counts...");
    const allCats = await ColoringCategory.find({}).select("slug").lean();
    for (const cat of allCats) {
      const count = await ColoringItem.countDocuments({ categorySlug: cat.slug, active: true });
      await ColoringCategory.updateOne({ slug: cat.slug }, { $set: { itemCount: count } });
    }
    console.log("   ✅ Item counts updated");

    console.log("\n🎉 Coloring seed complete!");
    console.log("   Next step: Add more items via Admin Dashboard → التلوين");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seed error:", err);
    process.exit(1);
  }
}

seedColoring();
