/**
 * seed-debug.js — Debug what SuperColoring returns
 */
const { chromium } = require('playwright');
require('dotenv').config({ path: require('path').join(__dirname, '../.env.local') });

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('https://www.supercoloring.com/coloring-pages/animals', { waitUntil: 'networkidle', timeout: 60000 });
  
  // Scroll to trigger lazy loading
  await page.evaluate(() => window.scrollTo(0, 2000));
  await page.waitForTimeout(3000);
  
  // Get all images with their details
  const allImages = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('img')).map(img => ({
      src: img.src?.substring(0, 100),
      dataSrc: img.dataset.src?.substring(0, 100),
      alt: img.alt?.substring(0, 60),
      cls: img.className?.substring(0, 50),
      parent: img.parentElement?.tagName,
      width: img.naturalWidth,
      loaded: img.complete && img.naturalWidth > 0
    }));
  });
  
  console.log('Total <img> tags:', allImages.length);
  console.log('\nAll images:');
  allImages.forEach((img, i) => {
    if (img.src || img.dataSrc)
      console.log(`  ${i}: src=${img.src || 'none'} dataSrc=${img.dataSrc || 'none'} alt=${img.alt} loaded=${img.loaded}`);
  });

  // Check for background images
  const bgImages = await page.evaluate(() => {
    const divs = document.querySelectorAll('[style*="background"]');
    return Array.from(divs).slice(0, 10).map(d => ({
      tag: d.tagName,
      style: d.style.backgroundImage?.substring(0, 80)
    }));
  });
  console.log('\nBackground images:', bgImages.length);
  bgImages.forEach((b, i) => console.log(`  ${i}: ${b.tag} ${b.style}`));

  // Get page title & basic structure
  const title = await page.title();
  console.log('\nPage title:', title);
  
  // Take screenshot for debugging
  await page.screenshot({ path: 'debug-sc.png', fullPage: false });
  console.log('Screenshot saved to debug-sc.png');

  await browser.close();
}

run().catch(e => { console.error(e); process.exit(1); });
