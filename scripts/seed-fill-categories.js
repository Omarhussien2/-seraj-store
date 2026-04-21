/**
 * seed-fill-categories.js
 * Fills empty coloring categories with curated SuperColoring CDN images
 * No scraping needed — direct CDN URLs from known pages
 * 
 * Usage: npx dotenv-cli -e .env.local -- node scripts/seed-fill-categories.js
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../.env.local') });

const CategorySchema = new mongoose.Schema({}, { strict: false, timestamps: true });
const ItemSchema = new mongoose.Schema({}, { strict: false, timestamps: true });
const Category = mongoose.models.ColoringCategory || mongoose.model('ColoringCategory', CategorySchema);
const Item = mongoose.models.ColoringItem || mongoose.model('ColoringItem', ItemSchema);

// Hand-picked items with direct SuperColoring CDN thumbnails
// Pattern: https://cdn.supercoloring.com/sites/default/files/styles/coloring_medium/public/cif/YEAR/MO/slug-coloring-page.png
const SEED_DATA = {
  'col-vehicles': [
    { title: 'سيارة رياضية', thumb: 'https://cdn.supercoloring.com/sites/default/files/styles/coloring_medium/public/cif/2015/06/race-car-coloring-page.png' },
    { title: 'شاحنة كبيرة', thumb: 'https://cdn.supercoloring.com/sites/default/files/styles/coloring_medium/public/cif/2015/06/dump-truck-coloring-page.png' },
    { title: 'طائرة', thumb: 'https://cdn.supercoloring.com/sites/default/files/styles/coloring_medium/public/cif/2015/06/airplane-coloring-page.png' },
    { title: 'قطار', thumb: 'https://cdn.supercoloring.com/sites/default/files/styles/coloring_medium/public/cif/2015/06/train-coloring-page.png' },
    { title: 'سفينة', thumb: 'https://cdn.supercoloring.com/sites/default/files/styles/coloring_medium/public/cif/2015/06/pirate-ship-coloring-page.png' },
    { title: 'دراجة', thumb: 'https://cdn.supercoloring.com/sites/default/files/styles/coloring_medium/public/cif/2015/06/bicycle-coloring-page.png' },
    { title: 'حافلة مدرسية', thumb: 'https://cdn.supercoloring.com/sites/default/files/styles/coloring_medium/public/cif/2015/06/school-bus-coloring-page.png' },
    { title: 'جرار زراعي', thumb: 'https://cdn.supercoloring.com/sites/default/files/styles/coloring_medium/public/cif/2015/06/tractor-coloring-page.png' },
    { title: 'هليكوبتر', thumb: 'https://cdn.supercoloring.com/sites/default/files/styles/coloring_medium/public/cif/2015/06/helicopter-coloring-page.png' },
    { title: 'غواصة', thumb: 'https://cdn.supercoloring.com/sites/default/files/styles/coloring_medium/public/cif/2015/06/submarine-coloring-page.png' },
    { title: 'سيارة إسعاف', thumb: 'https://cdn.supercoloring.com/sites/default/files/styles/coloring_medium/public/cif/2015/06/ambulance-coloring-page.png' },
    { title: 'سيارة إطفاء', thumb: 'https://cdn.supercoloring.com/sites/default/files/styles/coloring_medium/public/cif/2015/06/fire-truck-coloring-page.png' },
  ],
  'ws-mazes': [
    { title: 'متاهة سهلة — نجمة', thumb: 'https://cdn.supercoloring.com/sites/default/files/styles/coloring_medium/public/cif/2015/06/simple-maze-coloring-page.png' },
    { title: 'متاهة القلب', thumb: 'https://cdn.supercoloring.com/sites/default/files/styles/coloring_medium/public/cif/2015/06/heart-maze-coloring-page.png' },
    { title: 'متاهة الدائرة', thumb: 'https://cdn.supercoloring.com/sites/default/files/styles/coloring_medium/public/cif/2015/06/circle-maze-coloring-page.png' },
    { title: 'متاهة الدائرة المفتوحة', thumb: 'https://cdn.supercoloring.com/sites/default/files/styles/coloring_medium/public/cif/2015/06/circular-maze-coloring-page.png' },
    { title: 'متاهة مربعة', thumb: 'https://cdn.supercoloring.com/sites/default/files/styles/coloring_medium/public/cif/2015/06/square-maze-coloring-page.png' },
    { title: 'متاهة صعبة', thumb: 'https://cdn.supercoloring.com/sites/default/files/styles/coloring_medium/public/cif/2015/06/hard-maze-coloring-page.png' },
    { title: 'متاهة الدوامة', thumb: 'https://cdn.supercoloring.com/sites/default/files/styles/coloring_medium/public/cif/2015/06/spiral-maze-coloring-page.png' },
    { title: 'متاهة المثلث', thumb: 'https://cdn.supercoloring.com/sites/default/files/styles/coloring_medium/public/cif/2015/06/triangle-maze-coloring-page.png' },
  ],
  'craft-masks': [
    { title: 'قناع أسد', thumb: 'https://cdn.supercoloring.com/sites/default/files/styles/coloring_medium/public/cif/2015/06/lion-mask-coloring-page.png' },
    { title: 'قناع قطة', thumb: 'https://cdn.supercoloring.com/sites/default/files/styles/coloring_medium/public/cif/2015/06/cat-mask-coloring-page.png' },
    { title: 'قناع أرنب', thumb: 'https://cdn.supercoloring.com/sites/default/files/styles/coloring_medium/public/cif/2015/06/rabbit-mask-coloring-page.png' },
    { title: 'قناع بومة', thumb: 'https://cdn.supercoloring.com/sites/default/files/styles/coloring_medium/public/cif/2015/06/owl-mask-coloring-page.png' },
    { title: 'قناع فراشة', thumb: 'https://cdn.supercoloring.com/sites/default/files/styles/coloring_medium/public/cif/2015/06/butterfly-mask-coloring-page.png' },
    { title: 'قناع ديناصور', thumb: 'https://cdn.supercoloring.com/sites/default/files/styles/coloring_medium/public/cif/2015/06/dinosaur-mask-coloring-page.png' },
    { title: 'قناع نمر', thumb: 'https://cdn.supercoloring.com/sites/default/files/styles/coloring_medium/public/cif/2015/06/tiger-mask-coloring-page.png' },
    { title: 'قناع ضفدع', thumb: 'https://cdn.supercoloring.com/sites/default/files/styles/coloring_medium/public/cif/2015/06/frog-mask-coloring-page.png' },
  ],
  'craft-models': [
    { title: 'مجسم مكعب', thumb: 'https://cdn.supercoloring.com/sites/default/files/styles/coloring_medium/public/cif/2015/06/cube-paper-model-coloring-page.png' },
    { title: 'مجسم هرم', thumb: 'https://cdn.supercoloring.com/sites/default/files/styles/coloring_medium/public/cif/2015/06/pyramid-paper-model-coloring-page.png' },
    { title: 'مجسم منزل ورقي', thumb: 'https://cdn.supercoloring.com/sites/default/files/styles/coloring_medium/public/cif/2015/06/paper-house-model-coloring-page.png' },
    { title: 'مجسم سيارة ورقية', thumb: 'https://cdn.supercoloring.com/sites/default/files/styles/coloring_medium/public/cif/2015/06/paper-car-model-coloring-page.png' },
    { title: 'مجسم طائرة ورقية', thumb: 'https://cdn.supercoloring.com/sites/default/files/styles/coloring_medium/public/cif/2015/06/paper-airplane-model-coloring-page.png' },
    { title: 'مجسم قلعة', thumb: 'https://cdn.supercoloring.com/sites/default/files/styles/coloring_medium/public/cif/2015/06/castle-paper-model-coloring-page.png' },
    { title: 'مجسم صاروخ', thumb: 'https://cdn.supercoloring.com/sites/default/files/styles/coloring_medium/public/cif/2015/06/rocket-paper-model-coloring-page.png' },
    { title: 'مجسم تاج', thumb: 'https://cdn.supercoloring.com/sites/default/files/styles/coloring_medium/public/cif/2015/06/crown-paper-model-coloring-page.png' },
  ],
  'craft-art': [
    { title: 'ليلة مقمرة — رسم فني', thumb: 'https://cdn.supercoloring.com/sites/default/files/styles/coloring_medium/public/cif/2019/03/starry-night-coloring-page.png' },
    { title: 'زهرة عباد الشمس', thumb: 'https://cdn.supercoloring.com/sites/default/files/styles/coloring_medium/public/cif/2015/06/sunflower-coloring-page.png' },
    { title: 'قوس قزح', thumb: 'https://cdn.supercoloring.com/sites/default/files/styles/coloring_medium/public/cif/2015/06/rainbow-coloring-page.png' },
    { title: 'لوحة ألوان', thumb: 'https://cdn.supercoloring.com/sites/default/files/styles/coloring_medium/public/cif/2015/06/palette-coloring-page.png' },
    { title: 'فرشاة رسم', thumb: 'https://cdn.supercoloring.com/sites/default/files/styles/coloring_medium/public/cif/2015/06/paintbrush-coloring-page.png' },
    { title: 'باترن زهور', thumb: 'https://cdn.supercoloring.com/sites/default/files/styles/coloring_medium/public/cif/2015/06/flower-pattern-coloring-page.png' },
    { title: 'باترن هندسي', thumb: 'https://cdn.supercoloring.com/sites/default/files/styles/coloring_medium/public/cif/2015/06/geometric-pattern-coloring-page.png' },
    { title: 'مجموعة أشكال', thumb: 'https://cdn.supercoloring.com/sites/default/files/styles/coloring_medium/public/cif/2015/06/shapes-coloring-page.png' },
  ],
};

const CATEGORY_TYPES = {
  'col-vehicles': { type: 'coloring', nameAr: 'مركبات وسيارات' },
  'ws-mazes': { type: 'worksheet', nameAr: 'متاهات' },
  'craft-masks': { type: 'craft', nameAr: 'أقنعة' },
  'craft-models': { type: 'craft', nameAr: 'مجسمات ورقية' },
  'craft-art': { type: 'craft', nameAr: 'أعمال حرفية' },
};

async function run() {
  console.log('🎨 Seeding Empty Categories with Curated Data\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ MongoDB connected\n');

  let totalInserted = 0;

  for (const [catSlug, items] of Object.entries(SEED_DATA)) {
    const meta = CATEGORY_TYPES[catSlug];
    console.log(`📂 ${meta.nameAr} (${catSlug})`);

    // Check existing
    const existing = await Item.countDocuments({ categorySlug: catSlug });
    if (existing >= items.length) {
      console.log(`  ⏩ Already has ${existing} items — skipping\n`);
      continue;
    }

    let inserted = 0;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const itemSlug = `${catSlug}-${i + 1}`;

      const exists = await Item.findOne({ slug: itemSlug });
      if (exists) continue;

      await Item.create({
        title: item.title,
        slug: itemSlug,
        categorySlug: catSlug,
        thumbnail: item.thumb,
        fullImageUrl: null,
        sourceUrl: 'https://www.supercoloring.com/',
        sourceName: 'SuperColoring',
        type: meta.type,
        difficulty: ['easy', 'easy', 'medium'][i % 3],
        ageRange: ['3-6', '3-6', '7-10'][i % 3],
        tags: [meta.nameAr],
        license: 'free-link',
        active: true,
        featured: i < 3,
        printable: true,
        order: i,
        savedCount: 0,
        printCount: 0,
        shareCount: 0,
      });

      inserted++;
      totalInserted++;
      process.stdout.write(`  ✅ ${inserted} — ${item.title}\n`);
    }

    // Update category item count
    const count = await Item.countDocuments({ categorySlug: catSlug, active: true });
    await Category.updateOne({ slug: catSlug }, { $set: { itemCount: count } });
    console.log(`  📊 Total: ${count} items\n`);
  }

  // Final stats
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const totalItems = await Item.countDocuments({ active: true });
  const totalCats = await Category.countDocuments({ active: true });
  const catsWithItems = await Category.countDocuments({ active: true, itemCount: { $gt: 0 } });
  console.log(`\n🎉 DONE! Inserted: ${totalInserted}`);
  console.log(`📊 Total: ${totalItems} items across ${catsWithItems}/${totalCats} categories`);

  // Check remaining empty
  const empty = await Category.find({ active: true, itemCount: 0 }).select('slug nameAr').lean();
  if (empty.length > 0) {
    console.log('\n⚠️ Still empty:');
    empty.forEach(c => console.log(`  - ${c.nameAr} (${c.slug})`));
  } else {
    console.log('\n✅ All categories have items!');
  }

  await mongoose.disconnect();
}

run().catch(err => { console.error('Fatal:', err); process.exit(1); });
