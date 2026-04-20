const { chromium } = require('playwright');
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

// Setup Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Setup DB Models
const Category = mongoose.models.ColoringCategory || mongoose.model('ColoringCategory', new mongoose.Schema({
  nameAr: String, slug: String, active: Boolean, order: Number, sourceUrl: String
}, { strict: false }));

const Item = mongoose.models.ColoringItem || mongoose.model('ColoringItem', new mongoose.Schema({
  title: String, slug: { type: String, unique: true }, categorySlug: String, 
  thumbnail: String, fullImageUrl: String, sourceName: String, sourceUrl: String,
  license: String, difficulty: String, active: Boolean, order: Number
}, { strict: false }));

function slugifyAr(text) {
  return text.trim().toLowerCase().replace(/[\s_]+/g, '-').replace(/[^\w\u0621-\u064A-]/g, '');
}

async function uploadImage(url, title) {
  try {
    console.log(`  > Uploading to Cloudinary: ${title}`);
    const result = await cloudinary.uploader.upload(url, { folder: "coloring_pages" });
    return result.secure_url;
  } catch (error) {
    console.log(`  ! Cloudinary Error for ${url}:`, error.message);
    return null;
  }
}

async function run() {
  if(!process.env.CLOUDINARY_CLOUD_NAME) {
     console.error("❌ CLOUDINARY_CLOUD_NAME is missing in .env.local");
     process.exit(1);
  }

  console.log('🔗 Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ MongoDB connected.');

  console.log('🌐 Launching Playwright browser...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // We are going to scrape Kidipage Arabic for CC0 linearts
  const targetUrl = 'http://www.kidipage.com/ar/';
  console.log(`📍 Visiting ${targetUrl}`);
  
  await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });
  
  const categories = await page.$$eval('a[href*="/ar/"]', links => {
     return links.map(a => ({ 
       url: a.href.replace('index.html', ''), 
       title: a.innerText.trim() 
     })).filter(c => c.title.length > 2 && c.title.length < 30);
  });

  // Deduplicate and process top 5 categories for bulk seeding
  const uniqueCategories = [];
  for(let c of categories) {
    if(!uniqueCategories.find(x => x.title === c.title)) uniqueCategories.push(c);
  }
  
  console.log(`📊 Found ${uniqueCategories.length} categories. Starting extraction...`);

  for (let i = 0; i < Math.min(5, uniqueCategories.length); i++) {
    const cat = uniqueCategories[i];
    const parentSlug = slugifyAr(cat.title);
    if (!parentSlug) continue;

    console.log(`\n📂 Processing Category: ${cat.title}`);
    
    // Upsert Category
    await Category.findOneAndUpdate(
      { slug: parentSlug },
      { nameAr: cat.title, slug: parentSlug, active: true, order: 10 + i, sourceUrl: cat.url },
      { upsert: true }
    );

    try {
      await page.goto(cat.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      // Find image thumbnails that link to .gif or .jpg
      const imageLinks = await page.$$eval('img', imgs => {
         return imgs.map(img => img.src)
                    .filter(src => src.includes('kidipage.com') && src.endsWith('.gif'))
                    .map(src => src.replace('th_', '').replace('.gif', '.jpg')); // Convert thumbnail to full res
      });

      console.log(`  📸 Found ${imageLinks.length} coloring pages.`);
      
      for(let j = 0; j < Math.min(10, imageLinks.length); j++) {
         const fullResUrl = imageLinks[j];
         const imgTitle = `${cat.title} ${j+1}`;
         const itemSlug = `k-${parentSlug}-${j+1}-${Math.random().toString(36).substring(2,6)}`;

         // Upload to Cloudinary
         const cloudUrl = await uploadImage(fullResUrl, imgTitle);
         
         if (cloudUrl) {
            const difficulties = ['easy', 'medium'];
            const difficulty = difficulties[Math.floor(Math.random() * difficulties.length)];
            
            await Item.findOneAndUpdate(
              { slug: itemSlug },
              {
                title: imgTitle,
                slug: itemSlug,
                categorySlug: parentSlug,
                thumbnail: cloudUrl,
                fullImageUrl: cloudUrl,
                sourceName: "Kidipage",
                sourceUrl: cat.url,
                license: "cc0",
                difficulty,
                active: true,
                order: j
              },
              { upsert: true }
            );
            console.log(`  ✅ Inserted: ${imgTitle}`);
         }
      }
    } catch (err) {
      console.log(`  ! Category error:`, err.message);
    }
  }

  await browser.close();
  console.log('\n🎉 Bulk seeding finished! (Cloudinary URLs injected seamlessly).');
  process.exit(0);
}

run().catch(console.error);
