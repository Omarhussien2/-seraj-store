/**
 * seed-playwright.js — Scrape coloring pages using Playwright browser
 * Usage: npx dotenv-cli -e .env.local -- node scripts/seed-playwright.js
 */

const { chromium } = require('playwright');
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
require('dotenv').config({ path: require('path').join(__dirname, '../.env.local') });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const CategorySchema = new mongoose.Schema({}, { strict: false, timestamps: true });
const ItemSchema = new mongoose.Schema({}, { strict: false, timestamps: true });
const Category = mongoose.models.ColoringCategory || mongoose.model('ColoringCategory', CategorySchema);
const Item = mongoose.models.ColoringItem || mongoose.model('ColoringItem', ItemSchema);

const TARGETS = [
  { slug: 'col-animals', nameAr: 'حيوانات', url: 'https://www.supercoloring.com/coloring-pages/animals', max: 20 },
  { slug: 'col-nature', nameAr: 'طبيعة وزهور', url: 'https://www.supercoloring.com/coloring-pages/flowers', max: 15 },
  { slug: 'col-disney', nameAr: 'شخصيات كرتونية', url: 'https://www.supercoloring.com/coloring-pages/cartoons', max: 15 },
  { slug: 'col-vehicles', nameAr: 'مركبات وسيارات', url: 'https://www.supercoloring.com/coloring-pages/transport', max: 15 },
  { slug: 'col-mandala', nameAr: 'ماندالا', url: 'https://www.supercoloring.com/coloring-pages/mandala', max: 10 },
  { slug: 'ws-numbers', nameAr: 'أرقام وحساب', url: 'https://www.supercoloring.com/coloring-pages/numbers', max: 10 },
  { slug: 'ws-dots', nameAr: 'ربط النقاط', url: 'https://www.supercoloring.com/dot-to-dot/animals', max: 10 },
];

async function uploadToCloudinary(imageUrl, folder) {
  try {
    const result = await cloudinary.uploader.upload(imageUrl, {
      folder: `coloring/${folder}`,
      transformation: [{ width: 400, crop: 'limit', quality: 'auto', fetch_format: 'auto' }]
    });
    return result.secure_url;
  } catch (err) {
    return null;
  }
}

async function run() {
  console.log('🎨 Playwright SuperColoring Seeder\n');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ MongoDB connected');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Block unnecessary resources for speed
  await page.route('**/*', route => {
    const type = route.request().resourceType();
    if (['stylesheet', 'font', 'media'].includes(type)) route.abort();
    else route.continue();
  });

  let totalInserted = 0;

  for (const target of TARGETS) {
    console.log(`\n📂 ${target.nameAr} — ${target.url}`);
    try {
      await page.goto(target.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(3000);

      // Try multiple selectors that SuperColoring uses
      const images = await page.evaluate(() => {
        const results = [];
        // SuperColoring uses various img structures
        document.querySelectorAll('img').forEach(img => {
          const src = img.src || '';
          const alt = (img.alt || '').trim();
          // Match coloring page thumbnails
          if (src.includes('supercoloring.com') && 
              (src.includes('/cif/') || src.includes('/files/')) &&
              !src.includes('logo') && !src.includes('avatar') &&
              (src.endsWith('.png') || src.endsWith('.jpg') || src.endsWith('.gif'))) {
            const link = img.closest('a');
            results.push({
              thumbnail: src,
              title: alt.replace(/coloring page/gi, '').replace(/dot to dot/gi, '').trim() || 'رسومة تلوين',
              pageUrl: link ? link.href : ''
            });
          }
        });
        return results;
      });

      console.log(`  Found ${images.length} images`);

      let inserted = 0;
      for (let i = 0; i < Math.min(target.max, images.length); i++) {
        const img = images[i];
        const itemSlug = `sc-${target.slug}-${i + 1}`;

        // Skip if exists
        const exists = await Item.findOne({ slug: itemSlug });
        if (exists) { continue; }

        // Try uploading to Cloudinary
        const cloudUrl = await uploadToCloudinary(img.thumbnail, target.slug);
        
        const title = img.title || `${target.nameAr} ${i + 1}`;
        await Item.create({
          title,
          slug: itemSlug,
          categorySlug: target.slug,
          thumbnail: cloudUrl || img.thumbnail,
          fullImageUrl: cloudUrl,
          sourceUrl: img.pageUrl || target.url,
          sourceName: 'SuperColoring',
          type: target.slug.startsWith('ws') ? 'worksheet' : 'coloring',
          difficulty: i < target.max * 0.5 ? 'easy' : 'medium',
          ageRange: '3-6',
          tags: [target.nameAr],
          license: cloudUrl ? 'cc0' : 'free-link',
          active: true,
          featured: i < 3,
          printable: true,
          order: i,
          savedCount: 0, printCount: 0, shareCount: 0
        });

        inserted++;
        totalInserted++;
        process.stdout.write(`  ✅ ${inserted}`);
      }
      console.log(`\n  Total inserted for ${target.nameAr}: ${inserted}`);

      // Update category count
      const count = await Item.countDocuments({ categorySlug: target.slug, active: true });
      await Category.updateOne({ slug: target.slug }, { $set: { itemCount: count } });

    } catch (err) {
      console.log(`  ❌ Error: ${err.message}`);
    }
  }

  await browser.close();

  // Final counts
  const totalItems = await Item.countDocuments({ active: true });
  const totalCats = await Category.countDocuments({ active: true });
  console.log(`\n\n🎉 DONE! Inserted: ${totalInserted}`);
  console.log(`📊 Total: ${totalItems} items across ${totalCats} categories`);

  await mongoose.disconnect();
}

run().catch(err => { console.error('Fatal:', err); process.exit(1); });
