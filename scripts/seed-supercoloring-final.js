/**
 * seed-superColoring-final.js
 * Scrapes SuperColoring using Playwright with correct CDN selectors
 * Usage: npx dotenv-cli -e .env.local -- node scripts/seed-supercoloring-final.js
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
  { slug: 'col-animals', nameAr: 'حيوانات', url: 'https://www.supercoloring.com/coloring-pages/animals', max: 25 },
  { slug: 'col-nature', nameAr: 'طبيعة وزهور', url: 'https://www.supercoloring.com/coloring-pages/flowers', max: 15 },
  { slug: 'col-disney', nameAr: 'شخصيات كرتونية', url: 'https://www.supercoloring.com/coloring-pages/cartoons', max: 15 },
  { slug: 'col-vehicles', nameAr: 'مركبات وسيارات', url: 'https://www.supercoloring.com/coloring-pages/transport', max: 15 },
  { slug: 'col-mandala', nameAr: 'ماندالا', url: 'https://www.supercoloring.com/coloring-pages/mandala', max: 10 },
  { slug: 'col-superheroes', nameAr: 'أبطال خارقون', url: 'https://www.supercoloring.com/coloring-pages/superheroes', max: 10 },
  { slug: 'col-islamic', nameAr: 'إسلامي ورمضان', url: 'https://www.supercoloring.com/coloring-pages/islamic', max: 10 },
  { slug: 'ws-numbers', nameAr: 'أرقام وحساب', url: 'https://www.supercoloring.com/coloring-pages/numbers', max: 10 },
  { slug: 'ws-dots', nameAr: 'ربط النقاط', url: 'https://www.supercoloring.com/dot-to-dot/animals', max: 10 },
  { slug: 'ws-arabic', nameAr: 'حروف عربية', url: 'https://www.supercoloring.com/coloring-pages/arabic-letters', max: 10 },
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
  console.log('🎨 SuperColoring Final Seeder\n');
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
  let totalSkipped = 0;
  let totalUploaded = 0;

  for (const target of TARGETS) {
    console.log(`\n📂 ${target.nameAr} — ${target.url}`);
    try {
      await page.goto(target.url, { waitUntil: 'networkidle', timeout: 60000 });
      await page.waitForTimeout(2000);
      await page.evaluate(() => window.scrollTo(0, 3000));
      await page.waitForTimeout(2000);

      const images = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('img[src*="cdn.supercoloring.com/coloring/"]'))
          .filter(img => img.src.includes('-sm.webp') && img.naturalWidth > 50)
          .map(img => ({
            thumbnail: img.src,
            title: (img.alt || '').split(' from ')[0].trim() || '',
            pageUrl: img.closest('a')?.href || ''
          }))
          .filter(img => img.title.length > 0);
      });

      console.log(`  Found ${images.length} coloring images`);

      let catInserted = 0;
      for (let i = 0; i < Math.min(target.max, images.length); i++) {
        const img = images[i];
        const itemSlug = `sc-${target.slug}-${i + 1}`;

        // Skip if exists
        const exists = await Item.findOne({ slug: itemSlug });
        if (exists) { totalSkipped++; continue; }

        // Upload to Cloudinary (optional — skip for free-link model)
        // Use CDN thumbnail directly — no hosting cost
        const thumbnailUrl = img.thumbnail;
        const uploaded = false;

        const title = img.title;
        const difficulties = ['easy', 'easy', 'medium'];
        const ages = ['3-6', '3-6', '7-10'];

        await Item.create({
          title,
          slug: itemSlug,
          categorySlug: target.slug,
          thumbnail: thumbnailUrl,
          fullImageUrl: null,
          sourceUrl: img.pageUrl || target.url,
          sourceName: 'SuperColoring',
          type: target.slug.startsWith('ws') ? 'worksheet' : 'coloring',
          difficulty: difficulties[i % 3],
          ageRange: ages[i % 3],
          tags: [target.nameAr],
          license: 'free-link',
          active: true,
          featured: i < 3,
          printable: true,
          order: i,
          savedCount: 0, printCount: 0, shareCount: 0
        });

        catInserted++;
        totalInserted++;
        process.stdout.write(`  ✅ ${catInserted}/${Math.min(target.max, images.length)} [${uploaded ? '☁' : '🔗'}] ${title.substring(0, 30)}\n`);
      }

      // Update category count
      const count = await Item.countDocuments({ categorySlug: target.slug, active: true });
      await Category.updateOne({ slug: target.slug }, { $set: { itemCount: count } });
      console.log(`  📊 ${target.nameAr}: ${count} items`);

    } catch (err) {
      console.log(`  ❌ Error: ${err.message}`);
    }
  }

  await browser.close();

  const totalItems = await Item.countDocuments({ active: true });
  console.log(`\n🎉 DONE! Inserted: ${totalInserted}, Skipped: ${totalSkipped}, Cloudinary: ${totalUploaded}`);
  console.log(`📊 Total in DB: ${totalItems} items`);

  await mongoose.disconnect();
}

run().catch(err => { console.error('Fatal:', err); process.exit(1); });
