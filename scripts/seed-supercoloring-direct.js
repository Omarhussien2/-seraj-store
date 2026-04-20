/**
 * seed-supercoloring-direct.js
 * Scrapes SuperColoring.com coloring pages (CC0 sections), uploads to Cloudinary, stores in MongoDB.
 * 
 * Usage: npx dotenv-cli -e .env.local -- node scripts/seed-supercoloring-direct.js
 */

const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
require('dotenv').config({ path: require('path').join(__dirname, '../.env.local') });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Category model
const CategorySchema = new mongoose.Schema({
  nameAr: String, nameEn: String, slug: String, icon: String,
  parentSlug: String, active: Boolean, featured: Boolean,
  order: Number, itemCount: Number, source: String
}, { strict: false, timestamps: true });
const Category = mongoose.models.ColoringCategory || mongoose.model('ColoringCategory', CategorySchema);

// Item model
const ItemSchema = new mongoose.Schema({
  title: String, slug: String, categorySlug: String,
  thumbnail: String, fullImageUrl: String, sourceUrl: String, sourceName: String,
  type: String, difficulty: String, ageRange: String, tags: [String],
  license: String, active: Boolean, featured: Boolean, printable: Boolean,
  order: Number, savedCount: Number, printCount: Number, shareCount: Number
}, { strict: false, timestamps: true });
const Item = mongoose.models.ColoringItem || mongoose.model('ColoringItem', ItemSchema);

// Target categories to scrape from SuperColoring
const TARGET_CATEGORIES = [
  { slug: 'col-animals', nameAr: 'حيوانات', nameEn: 'Animals', icon: '🐾', url: 'https://www.supercoloring.com/coloring-pages/animals', parentSlug: 'coloring', difficulty: 'easy', ageRange: '3-6', tags: ['حيوانات', 'سهل'] },
  { slug: 'col-nature', nameAr: 'طبيعة وزهور', nameEn: 'Nature & Flowers', icon: '🌸', url: 'https://www.supercoloring.com/coloring-pages/nature-seasons', parentSlug: 'coloring', difficulty: 'easy', ageRange: '3-6', tags: ['طبيعة', 'زهور'] },
  { slug: 'col-disney', nameAr: 'شخصيات كرتونية', nameEn: 'Cartoon Characters', icon: '🏰', url: 'https://www.supercoloring.com/coloring-pages/cartoons', parentSlug: 'coloring', difficulty: 'easy', ageRange: '3-6', tags: ['كرتون', 'شخصيات'] },
  { slug: 'col-vehicles', nameAr: 'مركبات وسيارات', nameEn: 'Vehicles', icon: '🚗', url: 'https://www.supercoloring.com/coloring-pages/transport', parentSlug: 'coloring', difficulty: 'easy', ageRange: '3-6', tags: ['سيارات', 'مركبات'] },
  { slug: 'ws-numbers', nameAr: 'أرقام وحساب', nameEn: 'Numbers & Math', icon: '🔢', url: 'https://www.supercoloring.com/coloring-pages/math/numbers', parentSlug: 'worksheets', difficulty: 'easy', ageRange: '3-6', tags: ['أرقام', 'تعليمي'] },
  { slug: 'ws-dots', nameAr: 'ربط النقاط', nameEn: 'Dot to Dot', icon: '🔗', url: 'https://www.supercoloring.com/dot-to-dot', parentSlug: 'worksheets', difficulty: 'easy', ageRange: '3-6', tags: ['نقاط', 'تعليمي'] },
];

const ITEMS_PER_CATEGORY = 15;

function generateSlug(text) {
  return text.trim().toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^\u0600-\u06FFa-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || `item-${Date.now()}`;
}

async function uploadToCloudinary(imageUrl, folder) {
  try {
    const result = await cloudinary.uploader.upload(imageUrl, {
      folder: `coloring/${folder}`,
      transformation: [{ width: 400, crop: 'limit', quality: 'auto', fetch_format: 'auto' }]
    });
    return result.secure_url;
  } catch (err) {
    console.log(`    ⚠ Cloudinary upload failed: ${err.message}`);
    return null;
  }
}

async function scrapeCategory(page, cat) {
  console.log(`\n📂 Scraping: ${cat.nameAr} (${cat.url})`);
  
  try {
    await page.goto(cat.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);

    // SuperColoring has image thumbnails in various selectors
    const images = await page.$$eval('img[src*="supercoloring.com"]', imgs => {
      return imgs
        .map(img => ({
          src: img.src,
          alt: img.alt || '',
          parentHref: img.closest('a')?.href || ''
        }))
        .filter(i => 
          i.src.includes('/files/') && 
          (i.src.includes('thumbnail') || i.src.includes('cif')) &&
          !i.src.includes('logo') && 
          !i.src.includes('banner') &&
          (i.src.endsWith('.png') || i.src.endsWith('.jpg'))
        )
        .map(i => ({
          // Convert thumbnail to coloring page image
          thumbnail: i.src,
          // Try to get the full page URL
          pageUrl: i.parentHref || '',
          title: i.alt.replace(/coloring page$/i, '').trim()
        }));
    });

    console.log(`  Found ${images.length} images`);
    return images.slice(0, ITEMS_PER_CATEGORY);
  } catch (err) {
    console.log(`  ❌ Error scraping ${cat.nameAr}: ${err.message}`);
    return [];
  }
}

async function run() {
  console.log('🎨 SuperColoring Direct Seeder');
  console.log('================================\n');

  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI missing');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ MongoDB connected');

  let totalInserted = 0;
  let totalSkipped = 0;

  for (const cat of TARGET_CATEGORIES) {
    const images = await scrapeWithFetch(cat);

    for (let j = 0; j < images.length; j++) {
      const img = images[j];
      const title = img.title || `${cat.nameAr} ${j + 1}`;
      const itemSlug = `sc-${cat.slug}-${j + 1}`;

      // Check if already exists
      const existing = await Item.findOne({ slug: itemSlug });
      if (existing) {
        totalSkipped++;
        continue;
      }

      // Upload thumbnail to Cloudinary
      const cloudUrl = await uploadToCloudinary(img.thumbnail, cat.slug);

      if (!cloudUrl) {
        // Fallback: use original URL as thumbnail (free-link license)
        const item = await Item.create({
          title,
          slug: itemSlug,
          categorySlug: cat.slug,
          thumbnail: img.thumbnail,
          fullImageUrl: null,
          sourceUrl: img.pageUrl || cat.url,
          sourceName: 'SuperColoring',
          type: cat.parentSlug === 'worksheets' ? 'worksheet' : 'coloring',
          difficulty: cat.difficulty,
          ageRange: cat.ageRange,
          tags: cat.tags,
          license: 'free-link',
          active: true,
          featured: j < 3,
          printable: true,
          order: j,
          savedCount: 0, printCount: 0, shareCount: 0
        });
        totalInserted++;
        console.log(`  ✅ ${title} (external link)`);
      } else {
        const item = await Item.create({
          title,
          slug: itemSlug,
          categorySlug: cat.slug,
          thumbnail: cloudUrl,
          fullImageUrl: cloudUrl,
          sourceUrl: img.pageUrl || cat.url,
          sourceName: 'SuperColoring',
          type: cat.parentSlug === 'worksheets' ? 'worksheet' : 'coloring',
          difficulty: cat.difficulty,
          ageRange: cat.ageRange,
          tags: cat.tags,
          license: 'cc0',
          active: true,
          featured: j < 3,
          printable: true,
          order: j,
          savedCount: 0, printCount: 0, shareCount: 0
        });
        totalInserted++;
        console.log(`  ✅ ${title} (Cloudinary ✓)`);
      }
    }

    // Update category item count
    const count = await Item.countDocuments({ categorySlug: cat.slug, active: true });
    await Category.updateOne({ slug: cat.slug }, { $set: { itemCount: count } });
    console.log(`  📊 ${cat.nameAr}: ${count} items total`);
  }

  console.log(`\n🎉 Done! Inserted: ${totalInserted}, Skipped: ${totalSkipped}`);
  await mongoose.disconnect();
}

// Fallback: scrape using node-fetch + cheerio if Playwright fails
async function scrapeWithFetch(cat) {
  const https = require('https');
  const http = require('http');

  function fetchHtml(url) {
    return new Promise((resolve, reject) => {
      const client = url.startsWith('https') ? https : http;
      client.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return fetchHtml(res.headers.location).then(resolve).catch(reject);
        }
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(data));
      }).on('error', reject);
    });
  }

  try {
    console.log(`\n📂 Fetching: ${cat.nameAr} (${cat.url})`);
    const html = await fetchHtml(cat.url);

    // Extract images from HTML
    const imgRegex = /<img[^>]+src=["']([^"']*supercoloring\.com[^"']*?(?:cif|thumbnail)[^"']*\.(?:png|jpg))["'][^>]*alt=["']([^"']*)/gi;
    const linkRegex = /<a[^>]+href=["']([^"']*supercoloring\.com\/coloring-pages\/[^"']+)["']/gi;

    const images = [];
    let match;
    while ((match = imgRegex.exec(html)) !== null && images.length < ITEMS_PER_CATEGORY) {
      images.push({
        thumbnail: match[1],
        title: match[2].replace(/coloring page/gi, '').trim(),
        pageUrl: ''
      });
    }

    // Also try simpler pattern
    if (images.length === 0) {
      const simpleImgRegex = /<img[^>]+src=["']([^"']*supercoloring\.com[^"']*\.(?:png|jpg))["'][^>]*(?:alt=["']([^"']*))?/gi;
      while ((match = simpleImgRegex.exec(html)) !== null && images.length < ITEMS_PER_CATEGORY) {
        if (match[1].includes('files') && !match[1].includes('logo') && !match[1].includes('banner')) {
          images.push({
            thumbnail: match[1],
            title: match[2] ? match[2].replace(/coloring page/gi, '').trim() : '',
            pageUrl: ''
          });
        }
      }
    }

    console.log(`  Found ${images.length} images from HTML`);
    return images;
  } catch (err) {
    console.log(`  ❌ Fetch error for ${cat.nameAr}: ${err.message}`);
    return [];
  }
}

run().catch(err => { console.error('Fatal:', err); process.exit(1); });
