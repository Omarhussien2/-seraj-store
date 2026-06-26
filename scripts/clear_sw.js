const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

async function run() {
  const artifactsDir = 'C:\\Users\\omarh\\.gemini\\antigravity\\brain\\c59599c5-ff74-4e70-b8e5-93f2a10460ac';
  if (!fs.existsSync(artifactsDir)) {
    fs.mkdirSync(artifactsDir, { recursive: true });
  }

  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  
  // Create a clean context
  const context = await browser.newContext({
    viewport: { width: 1280, height: 1000 },
    locale: 'ar-EG',
  });
  
  const page = await context.newPage();

  console.log('Navigating to live site to register/inspect SW...');
  await page.goto('https://seraj-store.vercel.app/#/home', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  console.log('Unregistering Service Workers on the page...');
  const swCleaned = await page.evaluate(async () => {
    if (!navigator.serviceWorker) return 'Service Worker not supported';
    const registrations = await navigator.serviceWorker.getRegistrations();
    let count = 0;
    for (let registration of registrations) {
      await registration.unregister();
      count++;
    }
    // Also clear Cache Storage
    if (window.caches) {
      const keys = await caches.keys();
      for (let key of keys) {
        await caches.delete(key);
      }
    }
    return `Unregistered ${count} service workers and cleared cache storage`;
  });
  console.log('SW Clean Result:', swCleaned);

  // Now reload the page so it fetches the fresh app.js from the network without service worker interception
  console.log('Reloading page after clearing SW...');
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  const gridHtml = await page.innerHTML('#homeProductsGrid');
  console.log('--- gridHtml content after SW clear ---');
  console.log(gridHtml);

  const styleDetails = await page.evaluate(() => {
    const card = document.querySelector('.product-card');
    if (!card) return 'No product-card found';
    const computed = window.getComputedStyle(card);
    return {
      classList: Array.from(card.classList),
      opacity: computed.opacity,
    };
  });
  console.log('Computed Style after SW clear:', JSON.stringify(styleDetails, null, 2));

  // Take screenshots
  await page.screenshot({ path: path.join(artifactsDir, 'screenshot_sw_cleared_1.png'), fullPage: true });

  // Reload one more time to verify persistence
  console.log('Reloading again...');
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(artifactsDir, 'screenshot_sw_cleared_2_refresh.png'), fullPage: true });

  await browser.close();
  console.log('Done!');
}

run().catch(console.error);
