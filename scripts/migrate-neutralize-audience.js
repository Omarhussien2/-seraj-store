/**
 * Migration: overwrite feminine-addressed DB copy with neutral (masculine singular) forms.
 *
 * Targets:
 *   1) SiteContent entries driven by `src/lib/seed/contentDefaults.ts`
 *   2) Product ctaText / badge / longDesc / features where the source-of-truth in
 *      `scripts/seed.ts` was feminine.
 *
 * Safe to re-run (idempotent upserts / conditional updates).
 *
 * Usage:
 *   node scripts/migrate-neutralize-audience.js
 *
 * Requires MONGODB_URI in .env.local (or environment).
 */

require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

// ---------------- Source-of-truth for SiteContent (mirrors contentDefaults.ts after PR A) ----------------
const CONTENT_UPDATES = [
  // Hero
  { key: 'hero.kicker', val: 'قصص وكتب وأكتر — مصنوعة بحب في مصر' },
  { key: 'hero.title', val: 'متعة القراءة واللعب..' },
  { key: 'hero.subtitle', val: 'في <strong class="highlight">حكايات</strong> بتصنع <strong class="highlight">أبطال بجد!</strong>' },
  { key: 'hero.cta_primary', val: 'يلا يا سراج.. ألف قصة لبطلنا' },
  { key: 'hero.cta_secondary', val: 'شوف المنتجات' },

  // Products
  { key: 'products.kicker', val: 'أبطالنا الصغار بيحبوهم' },
  { key: 'products.heading', val: 'منتجات سِراج الأكتر طلباً' },

  // Counter
  { key: 'counter.kicker', val: 'من قلب البيوت المصرية' },
  { key: 'counter.subtext', val: 'صور حقيقية من عائلات وثقت في سِراج عشان ترسم الفرحة على وشوش أطفالها.' },

  // How it works
  { key: 'how.kicker', val: '٣ خطوات بس' },
  { key: 'how.heading', val: 'إزاي سراج بيعمل قصة بصورة ابنك؟' },
  { key: 'how.step1_title', val: 'قول لسراج اسم بطلنا وسنه' },
  { key: 'how.step1_desc', val: 'اكتب بياناته واختار القيمة الأخلاقية اللي محتاج يتعلمها.' },
  { key: 'how.step2_title', val: 'ارفع أحلى صورة ليه' },
  { key: 'how.step2_desc', val: 'سراج هياخد الصورة ويخلي ابنك هو البطل الحقيقي للقصة.' },
  { key: 'how.step3_title', val: 'استلم قصتك لحد البيت' },
  { key: 'how.step3_desc', val: 'هتستلم قصة مطبوعة بألوان مبهجة وتغليف يفرّح القلب.' },

  // Values
  { key: 'values.kicker', val: 'القيم اللي هيتعلمها' },
  { key: 'values.heading', val: 'اختار القيمة اللي بطلنا محتاجها النهاردة' },

  // Testimonials
  { key: 'testimonials.kicker', val: 'كلام عائلاتنا' },
  { key: 'testimonials.heading', val: 'اللي قالتوه عن سِراج' },

  // Ribbon
  { key: 'ribbon.heading', val: 'مستني إيه؟ خلّي بطلنا يبدأ حكايته النهاردة!' },
  { key: 'ribbon.subtext', val: 'بس ٣ خطوات صغيرة.. والقصة هتكون بين إيديه.' },
  { key: 'ribbon.cta', val: 'اصنع قصة لابنك' },

  // Mama section (still called "عالم ماما" until PR B renames it)
  { key: 'mama.hero_title', val: 'أهلاً بيك في عالم ماما' },
  { key: 'mama.hero_desc', val: 'مساحة من القلب للأهل.. مقالات، نصايح، وأماكن هتحبها لبطلنا الصغير ✦' },

  // Wizard speech bubbles
  { key: 'wizard.step1_speech', val: 'أنا سراج! عشان أكتب قصة حلوة، محتاج أعرف اسم بطلنا وسنه وتقوللي هو ولد ولا بنت؟' },
  { key: 'wizard.step2_speech', val: 'أبطالنا ساعات بيقابلوا تحديات. اختار قيمة محتاج البطل يتعلمها.' },
  { key: 'wizard.step3_speech', val: 'عشان اخلي البطل في القصة شبه ابنك، محتاج أحلى صورة ليه يكون وشه فيها واضح.' },
  { key: 'wizard.step2_q', val: 'اختار قيمة محتاج البطل يتعلمها' },
  { key: 'wizard.step3_q', val: 'ارفع صورة لبطلنا' },
];

// ---------------- Product updates ----------------
// Key is product slug, value is partial update to $set.
const PRODUCT_UPDATES = {
  'story-khaled': {
    ctaText: 'أضيف للسلة',
  },
  'hero-conqueror': {
    ctaText: 'أضيف للسلة',
  },
  'custom-story': {
    ctaText: 'ابدأ القصة',
    features: [
      '٢٤ صفحة ملوّنة باسم طفلك',
      'غلاف مقوّى مقاوم',
      'رسوم أصلية بإيد فنانين مصريين',
      'باسم طفلك على الغلاف والصفحات',
      'اختار القيمة اللي عايزه يتعلمها',
    ],
  },
  bundle: {
    ctaText: 'أضيف للسلة',
    badge: 'وفّر ٢٠٪',
    longDesc:
      'المجموعة الكاملة لبطلنا! قصة مخصصة باسمه + كروت روتين يومي + قصة من سلسلة سباق الفتوحات. وفّر ٢٠٪ لما تطلبهم مع بعض!',
    features: [
      'قصة مخصصة باسم طفلك (٢٤ صفحة)',
      'كروت الروتين اليومي (٣٠ كارت)',
      'قصة من سلسلة سباق الفتوحات',
      'غلاف مقوّى لكل المنتجات',
      'بتوفّر ١١٠ جنيه!',
    ],
  },
};

// Section inference for SiteContent (derives from key prefix).
function sectionFor(key) {
  const prefix = key.split('.')[0];
  return prefix || 'misc';
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI is not set. Put it in .env.local or export it.');
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

  const Product =
    mongoose.models.Product ||
    mongoose.model(
      'Product',
      new mongoose.Schema({}, { strict: false, timestamps: true })
    );

  // ---- SiteContent ----
  console.log(`📝 Updating ${CONTENT_UPDATES.length} SiteContent entries...`);
  let contentUpdated = 0;
  let contentInserted = 0;
  for (const row of CONTENT_UPDATES) {
    const res = await SiteContent.updateOne(
      { key: row.key },
      { $set: { value: row.val, section: sectionFor(row.key) } },
      { upsert: true }
    );
    if (res.upsertedCount) contentInserted++;
    else if (res.modifiedCount) contentUpdated++;
  }
  console.log(`   ✓ ${contentUpdated} updated, ${contentInserted} inserted.`);

  // ---- Products ----
  console.log(`🛍  Updating ${Object.keys(PRODUCT_UPDATES).length} products...`);
  let productUpdated = 0;
  for (const [slug, fields] of Object.entries(PRODUCT_UPDATES)) {
    const res = await Product.updateOne({ slug }, { $set: fields });
    if (res.modifiedCount) {
      productUpdated++;
      console.log(`   ✓ Updated product: ${slug}`);
    } else if (res.matchedCount === 0) {
      console.log(`   ⚠ No product with slug="${slug}" — skipped.`);
    }
  }
  console.log(`   ✓ ${productUpdated} products updated.`);

  console.log('✅ Migration complete.');
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
