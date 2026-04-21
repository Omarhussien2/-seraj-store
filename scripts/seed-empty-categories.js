/**
 * seed-empty-categories.js
 * Fetches coloring pages for empty categories from SuperColoring
 * Uses their search/category pages to get thumbnail URLs
 * 
 * Usage: npx dotenv-cli -e .env.local -- node scripts/seed-empty-categories.js
 */

const mongoose = require('mongoose');
const https = require('https');
const http = require('http');

// Load env
require('dotenv').config({ path: require('path').join(__dirname, '../.env.local') });

const CategorySchema = new mongoose.Schema({}, { strict: false, timestamps: true });
const ItemSchema = new mongoose.Schema({}, { strict: false, timestamps: true });
const Category = mongoose.models.ColoringCategory || mongoose.model('ColoringCategory', CategorySchema);
const Item = mongoose.models.ColoringItem || mongoose.model('ColoringItem', ItemSchema);

// Targets: empty categories with SuperColoring URLs
const TARGETS = [
  {
    slug: 'col-vehicles',
    nameAr: 'مركبات وسيارات',
    url: 'https://www.supercoloring.com/coloring-pages/transport',
    max: 15,
    type: 'coloring'
  },
  {
    slug: 'ws-arabic',
    nameAr: 'حروف عربية',
    url: 'https://www.supercoloring.com/coloring-pages/arabic-letters',
    max: 10,
    type: 'worksheet'
  },
  {
    slug: 'ws-english',
    nameAr: 'حروف إنجليزية',
    url: 'https://www.supercoloring.com/coloring-pages/alphabet',
    max: 10,
    type: 'worksheet'
  },
  {
    slug: 'ws-mazes',
    nameAr: 'متاهات',
    url: 'https://www.supercoloring.com/coloring-pages/mazes',
    max: 10,
    type: 'worksheet'
  },
  {
    slug: 'craft-masks',
    nameAr: 'أقنعة',
    url: 'https://www.supercoloring.com/paper-crafts/masks',
    max: 8,
    type: 'craft'
  },
  {
    slug: 'craft-models',
    nameAr: 'مجسمات ورقية',
    url: 'https://www.supercoloring.com/paper-crafts/paper-models',
    max: 8,
    type: 'craft'
  },
  {
    slug: 'craft-art',
    nameAr: 'أعمال حرفية',
    url: 'https://www.supercoloring.com/coloring-pages/crafts',
    max: 8,
    type: 'craft'
  }
];

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    };
    mod.get(url, options, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchUrl(res.headers.location).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
      res.on('error', reject);
    }).on('error', reject);
  });
}

function extractImages(html) {
  const results = [];
  // Match SuperColoring thumbnail patterns
  const patterns = [
    // Standard coloring page thumbnails
    /<img[^>]+src="(https:\/\/cdn\.supercoloring\.com\/[^"]+)"[^>]*alt="([^"]*)"[^>]*>/gi,
    /<img[^>]+alt="([^"]*)"[^>]+src="(https:\/\/cdn\.supercoloring\.com\/[^"]+)"[^>]*>/gi,
    // Smaller thumbnails
    /<img[^>]+src="(https:\/\/www\.supercoloring\.com\/sites\/default\/files\/styles\/thumbnail\/[^"]+)"[^>]*alt="([^"]*)"[^>]*>/gi,
    /<img[^>]+alt="([^"]*)"[^>]+src="(https:\/\/www\.supercoloring\.com\/sites\/default\/files\/styles\/thumbnail\/[^"]+)"[^>]*>/gi,
  ];

  const seen = new Set();
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(html)) !== null) {
      let url, title;
      if (match[0].indexOf('src=') < match[0].indexOf('alt=')) {
        url = match[1]; title = match[2];
      } else {
        title = match[1]; url = match[2];
      }
      
      if (!url || seen.has(url) || url.includes('logo') || url.includes('banner') || url.includes('avatar')) continue;
      seen.add(url);

      // Clean title
      title = (title || '').replace(/ coloring page.*/i, '').replace(/ \| .*/, '').trim();
      if (!title || title.length < 2) continue;

      // Try to find the page link
      const linkMatch = html.match(new RegExp(`<a[^>]+href="([^"]*)"[^>]*>[^<]*<img[^>]+src="${url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`));
      const pageUrl = linkMatch ? linkMatch[1] : '';

      results.push({ thumbnail: url, title, pageUrl: pageUrl.startsWith('http') ? pageUrl : '' });
    }
  }
  return results;
}

// Manual fallback data for categories that can't be scraped easily
const MANUAL_DATA = {
  'ws-arabic': [
    { title: 'حرف ألف - أرنب', thumbnail: 'https://cdn.supercoloring.com/sites/default/files/styles/coloring_medium/public/cif/2024/01/arabic-letter-alif-rabbit-coloring-page.png', type: 'worksheet' },
    { title: 'حرف باء - بطة', thumbnail: 'https://cdn.supercoloring.com/sites/default/files/styles/coloring_medium/public/cif/2024/01/arabic-letter-ba-duck-coloring-page.png', type: 'worksheet' },
    { title: 'حرف تاء - تفاحة', thumbnail: 'https://cdn.supercoloring.com/sites/default/files/styles/coloring_medium/public/cif/2024/01/arabic-letter-ta-apple-coloring-page.png', type: 'worksheet' },
    { title: 'حرف ثاء - ثعلب', thumbnail: 'https://cdn.supercoloring.com/sites/default/files/styles/coloring_medium/public/cif/2024/01/arabic-letter-tha-fox-coloring-page.png', type: 'worksheet' },
    { title: 'حرف جيم - جمل', thumbnail: 'https://cdn.supercoloring.com/sites/default/files/styles/coloring_medium/public/cif/2024/01/arabic-letter-jim-camel-coloring-page.png', type: 'worksheet' },
    { title: 'حرف حاء - حصان', thumbnail: 'https://cdn.supercoloring.com/sites/default/files/styles/coloring_medium/public/cif/2024/01/arabic-letter-ha-horse-coloring-page.png', type: 'worksheet' },
    { title: 'حرف خاء - خروف', thumbnail: 'https://cdn.supercoloring.com/sites/default/files/styles/coloring_medium/public/cif/2024/01/arabic-letter-kha-sheep-coloring-page.png', type: 'worksheet' },
    { title: 'حرف دال - دجاجة', thumbnail: 'https://cdn.supercoloring.com/sites/default/files/styles/coloring_medium/public/cif/2024/01/arabic-letter-dal-chicken-coloring-page.png', type: 'worksheet' },
    { title: 'حرف راء - رمان', thumbnail: 'https://cdn.supercoloring.com/sites/default/files/styles/coloring_medium/public/cif/2024/01/arabic-letter-ra-pomegranate-coloring-page.png', type: 'worksheet' },
    { title: 'حرف زاي - زرافة', thumbnail: 'https://cdn.supercoloring.com/sites/default/files/styles/coloring_medium/public/cif/2024/01/arabic-letter-zay-giraffe-coloring-page.png', type: 'worksheet' },
  ],
  'ws-english': [
    { title: 'Letter A - Apple', thumbnail: 'https://cdn.supercoloring.com/sites/default/files/styles/coloring_medium/public/cif/2015/06/letter-a-is-for-apple-coloring-page.png', type: 'worksheet' },
    { title: 'Letter B - Butterfly', thumbnail: 'https://cdn.supercoloring.com/sites/default/files/styles/coloring_medium/public/cif/2015/06/letter-b-is-for-butterfly-coloring-page.png', type: 'worksheet' },
    { title: 'Letter C - Cat', thumbnail: 'https://cdn.supercoloring.com/sites/default/files/styles/coloring_medium/public/cif/2015/06/letter-c-is-for-cat-coloring-page.png', type: 'worksheet' },
    { title: 'Letter D - Dog', thumbnail: 'https://cdn.supercoloring.com/sites/default/files/styles/coloring_medium/public/cif/2015/06/letter-d-is-for-dog-coloring-page.png', type: 'worksheet' },
    { title: 'Letter E - Elephant', thumbnail: 'https://cdn.supercoloring.com/sites/default/files/styles/coloring_medium/public/cif/2015/06/letter-e-is-for-elephant-coloring-page.png', type: 'worksheet' },
    { title: 'Letter F - Fish', thumbnail: 'https://cdn.supercoloring.com/sites/default/files/styles/coloring_medium/public/cif/2015/06/letter-f-is-for-fish-coloring-page.png', type: 'worksheet' },
    { title: 'Letter G - Giraffe', thumbnail: 'https://cdn.supercoloring.com/sites/default/files/styles/coloring_medium/public/cif/2015/06/letter-g-is-for-giraffe-coloring-page.png', type: 'worksheet' },
    { title: 'Letter H - House', thumbnail: 'https://cdn.supercoloring.com/sites/default/files/styles/coloring_medium/public/cif/2015/06/letter-h-is-for-house-coloring-page.png', type: 'worksheet' },
    { title: 'Letter L - Lion', thumbnail: 'https://cdn.supercoloring.com/sites/default/files/styles/coloring_medium/public/cif/2015/06/letter-l-is-for-lion-coloring-page.png', type: 'worksheet' },
    { title: 'Letter S - Sun', thumbnail: 'https://cdn.supercoloring.com/sites/default/files/styles/coloring_medium/public/cif/2015/06/letter-s-is-for-sun-coloring-page.png', type: 'worksheet' },
  ]
};

async function seedCategory(target) {
  console.log(`\n📂 ${target.nameAr} (${target.slug})`);

  // Check if already has items
  const existingCount = await Item.countDocuments({ categorySlug: target.slug });
  if (existingCount >= target.max) {
    console.log(`  ⏩ Already has ${existingCount} items — skipping`);
    return { inserted: 0, skipped: existingCount };
  }

  // Try manual data first
  if (MANUAL_DATA[target.slug]) {
    console.log('  📝 Using manual data...');
    let inserted = 0;
    for (let i = 0; i < MANUAL_DATA[target.slug].length; i++) {
      const data = MANUAL_DATA[target.slug][i];
      const itemSlug = `${target.slug}-${i + 1}`;
      const exists = await Item.findOne({ slug: itemSlug });
      if (exists) { continue; }

      await Item.create({
        title: data.title,
        slug: itemSlug,
        categorySlug: target.slug,
        thumbnail: data.thumbnail,
        fullImageUrl: null,
        sourceUrl: 'https://www.supercoloring.com/',
        sourceName: 'SuperColoring',
        type: data.type || target.type,
        difficulty: ['easy', 'easy', 'medium'][i % 3],
        ageRange: ['3-6', '3-6', '7-10'][i % 3],
        tags: [target.nameAr],
        license: 'free-link',
        active: true,
        featured: i < 3,
        printable: true,
        order: i,
        savedCount: 0, printCount: 0, shareCount: 0
      });
      inserted++;
      process.stdout.write(`  ✅ ${inserted} — ${data.title}\n`);
    }

    // Update category count
    const count = await Item.countDocuments({ categorySlug: target.slug, active: true });
    await Category.updateOne({ slug: target.slug }, { $set: { itemCount: count } });
    console.log(`  📊 Total: ${count} items`);
    return { inserted, skipped: 0 };
  }

  // Try web scraping
  console.log(`  🌐 Fetching: ${target.url}`);
  try {
    const html = await fetchUrl(target.url);
    const images = extractImages(html);
    console.log(`  Found ${images.length} images in HTML`);

    if (images.length === 0) {
      console.log('  ⚠️ No images found — will need manual seed');
      return { inserted: 0, skipped: 0 };
    }

    let inserted = 0;
    for (let i = 0; i < Math.min(target.max, images.length); i++) {
      const img = images[i];
      const itemSlug = `${target.slug}-${i + 1}`;
      const exists = await Item.findOne({ slug: itemSlug });
      if (exists) continue;

      await Item.create({
        title: img.title || `${target.nameAr} ${i + 1}`,
        slug: itemSlug,
        categorySlug: target.slug,
        thumbnail: img.thumbnail,
        fullImageUrl: null,
        sourceUrl: img.pageUrl || target.url,
        sourceName: 'SuperColoring',
        type: target.type,
        difficulty: ['easy', 'easy', 'medium'][i % 3],
        ageRange: ['3-6', '3-6', '7-10'][i % 3],
        tags: [target.nameAr],
        license: 'free-link',
        active: true,
        featured: i < 3,
        printable: true,
        order: i,
        savedCount: 0, printCount: 0, shareCount: 0
      });
      inserted++;
      process.stdout.write(`  ✅ ${inserted}/${Math.min(target.max, images.length)} ${img.title.substring(0, 30)}\n`);
    }

    // Update category count
    const count = await Item.countDocuments({ categorySlug: target.slug, active: true });
    await Category.updateOne({ slug: target.slug }, { $set: { itemCount: count } });
    console.log(`  📊 Total: ${count} items`);
    return { inserted, skipped: 0 };

  } catch (err) {
    console.log(`  ❌ Error: ${err.message}`);
    return { inserted: 0, skipped: 0 };
  }
}

async function run() {
  console.log('🎨 Seeding Empty Coloring Categories\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ MongoDB connected\n');

  let totalInserted = 0;

  for (const target of TARGETS) {
    const result = await seedCategory(target);
    totalInserted += result.inserted;
  }

  // Final stats
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const totalItems = await Item.countDocuments({ active: true });
  const totalCats = await Category.countDocuments({ active: true });
  const catsWithItems = await Category.countDocuments({ active: true, itemCount: { $gt: 0 } });
  console.log(`\n🎉 DONE! Inserted: ${totalInserted}`);
  console.log(`📊 Total items: ${totalItems} across ${catsWithItems}/${totalCats} active categories`);

  // Show empty categories
  const empty = await Category.find({ active: true, itemCount: 0 }).select('slug nameAr').lean();
  if (empty.length > 0) {
    console.log('\n⚠️ Still empty:');
    empty.forEach(c => console.log(`  - ${c.nameAr} (${c.slug})`));
  }

  await mongoose.disconnect();
}

run().catch(err => { console.error('Fatal:', err); process.exit(1); });
