/**
 * Migration: rename "عالم ماما" → "عالم ماما وبابا" in SiteContent.
 *
 * Also fixes two hero CTA keys that were still feminine in the DB
 * (PR A's first migration missed them because they weren't in contentDefaults).
 *
 * Idempotent. Safe to re-run.
 *
 * Usage:
 *   node scripts/migrate-mama-baba-rename.js
 */

require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

const UPDATES = [
  // Renamed mama world labels
  { key: 'mama.hero_title', val: 'أهلاً بيك في عالم ماما وبابا' },
  { key: 'nav.mama', val: 'عالم ماما وبابا' },

  // Hero CTAs (remaining feminine forms missed by PR A's migration)
  { key: 'hero.cta_primary', val: 'استكشف عالم سراج' },
  { key: 'hero.cta_secondary', val: 'اصنع قصة لابنك' },
];

function sectionFor(key) {
  return key.split('.')[0] || 'misc';
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI is not set.');
    process.exit(1);
  }

  console.log('🔌 Connecting to MongoDB...');
  await mongoose.connect(uri);

  const SiteContent =
    mongoose.models.SiteContent ||
    mongoose.model(
      'SiteContent',
      new mongoose.Schema(
        { key: String, value: String, section: String },
        { timestamps: true, strict: false }
      )
    );

  console.log(`📝 Upserting ${UPDATES.length} entries...`);
  let updated = 0;
  let inserted = 0;
  for (const row of UPDATES) {
    const res = await SiteContent.updateOne(
      { key: row.key },
      { $set: { value: row.val, section: sectionFor(row.key) } },
      { upsert: true }
    );
    if (res.upsertedCount) inserted++;
    else if (res.modifiedCount) updated++;
    console.log(`   ✓ ${row.key} = "${row.val}"`);
  }
  console.log(`✅ Done: ${updated} updated, ${inserted} inserted.`);
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
