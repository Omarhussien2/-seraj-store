#!/usr/bin/env node
/**
 * سِراج — Product Audit Script
 * 
 * Compares frontend fallback products (in app.js PRODUCTS object)
 * against backend DB products (via /api/products?all=true)
 * and checks:
 *  1. Slug mismatches (frontend-only / backend-only)
 *  2. Section assignment for every product
 *  3. Image/Storage URLs (imageUrl, media.image, gallery[].url) are reachable
 *  4. Required fields are populated
 *  5. Price consistency (priceText matches price)
 *
 * Usage:  node scripts/audit-products.js [--base-url http://localhost:3000]
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

// ── Config ──────────────────────────────────────────────
const args = process.argv.slice(2);
let BASE_URL = 'http://localhost:3000';
const baseIdx = args.indexOf('--base-url');
if (baseIdx !== -1 && args[baseIdx + 1]) BASE_URL = args[baseIdx + 1];

// ── Helpers ─────────────────────────────────────────────
function get(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    lib.get(url, { timeout: 10000 }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(get(res.headers.location)); // follow redirect
      }
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => resolve({ status: res.statusCode, body }));
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function urlReachable(url) {
  if (!url) return { ok: false, reason: 'empty URL' };
  // Skip local asset paths
  if (url.startsWith('assets/') || url.startsWith('/assets/')) {
    const localPath = path.join(__dirname, '..', 'public', url.replace(/^\//, ''));
    const exists = fs.existsSync(localPath);
    return { ok: exists, reason: exists ? 'local file OK' : `local file missing: ${localPath}` };
  }
  try {
    const r = await get(url);
    return { ok: r.status >= 200 && r.status < 400, reason: `HTTP ${r.status}` };
  } catch (e) {
    return { ok: false, reason: String(e.message || e) };
  }
}

// ── Extract frontend PRODUCTS slugs ─────────────────────
function extractFrontendSlugs() {
  const appJsPath = path.join(__dirname, '..', 'public', 'app.js');
  const src = fs.readFileSync(appJsPath, 'utf-8');

  // Find the PRODUCTS object and extract slugs
  const slugs = {};
  const regex = /'([a-z0-9-]+)'\s*:\s*\{[\s\S]*?section:\s*'?([a-z-]+)?'?/g;

  // Simple but reliable: extract slug+section from lines near `var PRODUCTS`
  const productsStart = src.indexOf('var PRODUCTS = {');
  if (productsStart === -1) {
    console.error('❌ Could not find PRODUCTS object in app.js');
    return slugs;
  }

  // Find the closing of the PRODUCTS block (next `};`)
  let depth = 0;
  let productsEnd = productsStart;
  for (let i = productsStart; i < src.length; i++) {
    if (src[i] === '{') depth++;
    if (src[i] === '}') {
      depth--;
      if (depth === 0) { productsEnd = i + 1; break; }
    }
  }

  const productsBlock = src.substring(productsStart, productsEnd);

  // Extract each product entry
  const entryRegex = /'([a-z0-9-]+)'\s*:\s*\{/g;
  let match;
  while ((match = entryRegex.exec(productsBlock)) !== null) {
    const slug = match[1];
    // Find section for this slug
    const sectionMatch = productsBlock.substring(match.index).match(/section:\s*'([a-z-]+)'/);
    const sectionNull = productsBlock.substring(match.index, match.index + 300).match(/section:\s*null/);
    slugs[slug] = {
      section: sectionMatch ? sectionMatch[1] : (sectionNull ? null : 'MISSING'),
    };
  }
  return slugs;
}

// ── Extract CATALOG_META sections ───────────────────────
function extractCatalogSections() {
  const appJsPath = path.join(__dirname, '..', 'public', 'app.js');
  const src = fs.readFileSync(appJsPath, 'utf-8');
  const sections = [];
  const regex = /'([a-z-]+)'\s*:\s*\{\s*title:/g;
  const metaStart = src.indexOf('var CATALOG_META = {');
  if (metaStart === -1) return sections;

  let depth = 0, metaEnd = metaStart;
  for (let i = metaStart; i < src.length; i++) {
    if (src[i] === '{') depth++;
    if (src[i] === '}') { depth--; if (depth === 0) { metaEnd = i + 1; break; } }
  }
  const block = src.substring(metaStart, metaEnd);
  let m;
  while ((m = regex.exec(block)) !== null) {
    if (m[1] !== 'all') sections.push(m[1]);
  }
  return sections;
}

// ── Main ────────────────────────────────────────────────
async function main() {
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║   سِراج — Product Audit Report                      ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log(`Base URL: ${BASE_URL}\n`);

  // 1. Frontend slugs
  const frontendSlugs = extractFrontendSlugs();
  const fSlugs = Object.keys(frontendSlugs);
  console.log(`📋 Frontend fallback PRODUCTS: ${fSlugs.length} products`);
  fSlugs.forEach((s) => console.log(`   • ${s} (section: ${frontendSlugs[s].section || '—'})`));

  // 2. Catalog sections
  const catalogSections = extractCatalogSections();
  console.log(`\n📂 CATALOG_META sections: ${catalogSections.join(', ')}`);

  // 3. Fetch backend products
  console.log(`\n🔄 Fetching backend products from ${BASE_URL}/api/products?all=true ...`);
  let backendProducts = [];
  try {
    const res = await get(`${BASE_URL}/api/products?all=true`);
    const json = JSON.parse(res.body);
    if (json.success && json.data) {
      backendProducts = json.data;
      console.log(`   ✅ Backend returned ${backendProducts.length} products`);
    } else {
      console.log(`   ⚠️  Backend returned success=false or empty data`);
    }
  } catch (e) {
    console.log(`   ❌ Failed to reach backend: ${e.message}`);
    console.log(`   ℹ️  Make sure the dev server is running (npm run dev)`);
    console.log(`   Proceeding with frontend-only audit...\n`);
  }

  const bSlugs = backendProducts.map((p) => p.slug);
  const bMap = {};
  backendProducts.forEach((p) => (bMap[p.slug] = p));

  // ══════════════════════════════════════════════════════
  // AUDIT 1: Slug Sync
  // ══════════════════════════════════════════════════════
  console.log('\n━━━ AUDIT 1: Slug Sync (Frontend ↔ Backend) ━━━');
  const frontendOnly = fSlugs.filter((s) => !bSlugs.includes(s));
  const backendOnly = bSlugs.filter((s) => !fSlugs.includes(s));
  const inBoth = fSlugs.filter((s) => bSlugs.includes(s));

  if (frontendOnly.length === 0 && backendOnly.length === 0) {
    console.log('   ✅ All slugs are in sync!');
  } else {
    if (frontendOnly.length > 0) {
      console.log(`   ⚠️  Frontend-only (NOT in backend DB — ${frontendOnly.length}):`);
      frontendOnly.forEach((s) => console.log(`      🔴 ${s}`));
    }
    if (backendOnly.length > 0) {
      console.log(`   ℹ️  Backend-only (NOT in frontend fallback — ${backendOnly.length}):`);
      backendOnly.forEach((s) => console.log(`      🟡 ${s}`));
    }
  }
  console.log(`   📊 In both: ${inBoth.length} | Frontend-only: ${frontendOnly.length} | Backend-only: ${backendOnly.length}`);

  // ══════════════════════════════════════════════════════
  // AUDIT 2: Section Assignment
  // ══════════════════════════════════════════════════════
  console.log('\n━━━ AUDIT 2: Section Assignment ━━━');
  const validSections = [...catalogSections];
  let sectionIssues = 0;

  for (const p of backendProducts) {
    if (!p.section && !p.comingSoon) {
      // Bundles (مجموعات) intentionally have no section — they show in "all" only
      if (p.category === 'مجموعات') {
        console.log(`   ℹ️  ${p.slug}: section is NULL (by design — مجموعات)`);
      } else {
        console.log(`   ⚠️  ${p.slug}: section is NULL — won't appear in filtered view`);
        sectionIssues++;
      }
    } else if (p.section && !validSections.includes(p.section)) {
      console.log(`   🔴 ${p.slug}: section "${p.section}" not in CATALOG_META!`);
      sectionIssues++;
    }
  }
  if (sectionIssues === 0) {
    console.log('   ✅ All backend products have valid sections');
  }

  // Also check frontend
  for (const slug of fSlugs) {
    const s = frontendSlugs[slug].section;
    if (s && s !== 'MISSING' && !validSections.includes(s)) {
      console.log(`   🔴 Frontend ${slug}: section "${s}" not in CATALOG_META`);
    }
  }

  // ══════════════════════════════════════════════════════
  // AUDIT 3: Required Fields
  // ══════════════════════════════════════════════════════
  console.log('\n━━━ AUDIT 3: Required Fields ━━━');
  const requiredFields = ['name', 'price', 'priceText', 'category', 'longDesc', 'action', 'ctaText'];
  let fieldIssues = 0;

  for (const p of backendProducts) {
    const missing = [];
    for (const f of requiredFields) {
      if (!p[f] && p[f] !== 0) missing.push(f);
    }
    if (!p.media || !p.media.bg) missing.push('media.bg');
    if (missing.length > 0) {
      console.log(`   🔴 ${p.slug}: missing [${missing.join(', ')}]`);
      fieldIssues++;
    }
  }
  if (fieldIssues === 0) {
    console.log('   ✅ All required fields are populated');
  }

  // ══════════════════════════════════════════════════════
  // AUDIT 4: Image/Storage URL Checks
  // ══════════════════════════════════════════════════════
  console.log('\n━━━ AUDIT 4: Image & Storage URL Checks ━━━');
  const urlChecks = [];

  for (const p of backendProducts) {
    if (p.imageUrl) {
      urlChecks.push({ slug: p.slug, field: 'imageUrl', url: p.imageUrl });
    }
    if (p.media && p.media.image) {
      urlChecks.push({ slug: p.slug, field: 'media.image', url: p.media.image });
    }
    if (p.gallery && p.gallery.length > 0) {
      p.gallery.forEach((g, i) => {
        urlChecks.push({ slug: p.slug, field: `gallery[${i}].url`, url: g.url });
      });
    }
  }

  // Also check frontend local assets
  for (const slug of fSlugs) {
    const appJsPath = path.join(__dirname, '..', 'public', 'app.js');
    const src = fs.readFileSync(appJsPath, 'utf-8');
    // Check assets/ references in the product block
    const assetRegex = new RegExp(`'${slug}'[\\s\\S]*?image:\\s*'(assets\\/[^']+)'`, 'g');
    let am;
    while ((am = assetRegex.exec(src)) !== null) {
      urlChecks.push({ slug, field: 'frontend-media.image', url: am[1] });
    }
  }

  if (urlChecks.length === 0) {
    console.log('   ℹ️  No URLs to check');
  } else {
    console.log(`   Checking ${urlChecks.length} URLs...`);
    let urlFails = 0;
    for (const check of urlChecks) {
      const result = await urlReachable(check.url);
      if (!result.ok) {
        console.log(`   🔴 ${check.slug}.${check.field}: ${check.url}`);
        console.log(`      └ ${result.reason}`);
        urlFails++;
      }
    }
    if (urlFails === 0) {
      console.log(`   ✅ All ${urlChecks.length} URLs are reachable`);
    } else {
      console.log(`   ⚠️  ${urlFails}/${urlChecks.length} URLs failed`);
    }
  }

  // ══════════════════════════════════════════════════════
  // AUDIT 5: Price Consistency
  // ══════════════════════════════════════════════════════
  console.log('\n━━━ AUDIT 5: Price Consistency ━━━');
  let priceIssues = 0;
  for (const p of backendProducts) {
    if (p.originalPrice && p.originalPrice <= p.price) {
      console.log(`   ⚠️  ${p.slug}: originalPrice (${p.originalPrice}) <= price (${p.price})`);
      priceIssues++;
    }
    if (p.originalPrice && !p.originalPriceText) {
      console.log(`   ⚠️  ${p.slug}: has originalPrice but no originalPriceText`);
      priceIssues++;
    }
    if (!p.originalPrice && p.originalPriceText) {
      console.log(`   ⚠️  ${p.slug}: has originalPriceText but no originalPrice`);
      priceIssues++;
    }
  }
  if (priceIssues === 0) {
    console.log('   ✅ All prices are consistent');
  }

  // ══════════════════════════════════════════════════════
  // AUDIT 6: Frontend fetchProducts merge logic
  // ══════════════════════════════════════════════════════
  console.log('\n━━━ AUDIT 6: fetchProducts() Merge Logic ━━━');
  const appJs = fs.readFileSync(path.join(__dirname, '..', 'public', 'app.js'), 'utf-8');

  if (appJs.includes('PRODUCTS = apiProducts')) {
    console.log('   ✅ Frontend replaces PRODUCTS with API data on success');
  } else {
    console.log('   🔴 Frontend does NOT replace PRODUCTS — API data may be ignored');
  }

  if (appJs.includes('fallback = PRODUCTS[p.slug]')) {
    console.log('   ✅ Merge logic uses local fallback for missing fields');
  } else {
    console.log('   ⚠️  No merge/fallback logic found');
  }

  // Check populateCatalog is called after fetch
  if (appJs.includes('populateCatalog()')) {
    console.log('   ✅ populateCatalog() is called to render catalog');
  } else {
    console.log('   ⚠️  populateCatalog() not found');
  }

  // ══════════════════════════════════════════════════════
  // AUDIT 7: Admin panel section labels sync
  // ══════════════════════════════════════════════════════
  console.log('\n━━━ AUDIT 7: Admin Panel <-> Frontend Section Labels ━━━');
  const adminPage = fs.readFileSync(
    path.join(__dirname, '..', 'src', 'app', 'admin', 'products', 'page.tsx'),
    'utf-8'
  );

  const adminSections = [];
  const adminSectionRegex = /SelectItem\s+value="([a-z-]+)"/g;
  let aMatch;
  // Find section select specifically (after the "القسم (Section)" label)
  const sectionSelectStart = adminPage.indexOf('القسم (Section)');
  const sectionSelectBlock = adminPage.substring(sectionSelectStart, sectionSelectStart + 1200);
  while ((aMatch = adminSectionRegex.exec(sectionSelectBlock)) !== null) {
    if (aMatch[1] !== 'none') adminSections.push(aMatch[1]);
  }

  console.log(`   Admin section options: ${adminSections.join(', ')}`);
  console.log(`   Catalog sections:      ${catalogSections.join(', ')}`);

  const missingInAdmin = catalogSections.filter((s) => !adminSections.includes(s));
  const missingInCatalog = adminSections.filter((s) => !catalogSections.includes(s));

  if (missingInAdmin.length === 0 && missingInCatalog.length === 0) {
    console.log('   ✅ Admin and catalog sections are in sync');
  } else {
    if (missingInAdmin.length > 0)
      console.log(`   🔴 In catalog but NOT in admin dropdown: ${missingInAdmin.join(', ')}`);
    if (missingInCatalog.length > 0)
      console.log(`   🔴 In admin but NOT in catalog: ${missingInCatalog.join(', ')}`);
  }

  // ══════════════════════════════════════════════════════
  // AUDIT 8: Admin sectionLabelMap sync with CATALOG_META
  // ══════════════════════════════════════════════════════
  console.log('\n━━━ AUDIT 8: Admin sectionLabelMap vs CATALOG_META titles ━━━');
  // Match both quoted and unquoted keys: tales: "..." or "play-learn": "..."
  const labelMapRegex = /["']?([a-z][\w-]*)["']?\s*:\s*["']([^"']+)["']/g;
  const labelMapStart = adminPage.indexOf('const sectionLabelMap');
  const labelMapEnd = adminPage.indexOf('};', labelMapStart);
  const labelMapBlock = adminPage.substring(labelMapStart, labelMapEnd + 2);
  const adminLabels = {};
  let lm;
  while ((lm = labelMapRegex.exec(labelMapBlock)) !== null) {
    adminLabels[lm[1]] = lm[2];
  }

  // Compare with CATALOG_META titles
  const catalogMetaRegex = /'([a-z-]+)'\s*:\s*\{[^}]*title:\s*'([^']+)'/g;
  const metaStart = appJs.indexOf('var CATALOG_META = {');
  let depth2 = 0, metaEnd2 = metaStart;
  for (let i = metaStart; i < appJs.length; i++) {
    if (appJs[i] === '{') depth2++;
    if (appJs[i] === '}') { depth2--; if (depth2 === 0) { metaEnd2 = i + 1; break; } }
  }
  const metaBlock = appJs.substring(metaStart, metaEnd2);
  const catalogTitles = {};
  let cm;
  while ((cm = catalogMetaRegex.exec(metaBlock)) !== null) {
    if (cm[1] !== 'all') catalogTitles[cm[1]] = cm[2];
  }

  let labelMismatches = 0;
  for (const key of Object.keys(catalogTitles)) {
    if (adminLabels[key] && adminLabels[key] !== catalogTitles[key]) {
      console.log(`   ⚠️  "${key}": admin="${adminLabels[key]}" vs catalog="${catalogTitles[key]}"`);
      labelMismatches++;
    }
    if (!adminLabels[key]) {
      console.log(`   ⚠️  "${key}": in catalog but not in admin sectionLabelMap`);
      labelMismatches++;
    }
  }
  if (labelMismatches === 0) {
    console.log('   ℹ️  Labels may differ by design — review above if needed');
  }

  // ══════════════════════════════════════════════════════
  // Summary
  // ══════════════════════════════════════════════════════
  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║   AUDIT SUMMARY                                     ║');
  console.log('╠══════════════════════════════════════════════════════╣');
  console.log(`║ Frontend products:     ${fSlugs.length.toString().padEnd(30)}║`);
  console.log(`║ Backend products:      ${backendProducts.length.toString().padEnd(30)}║`);
  console.log(`║ Frontend-only:         ${frontendOnly.length.toString().padEnd(30)}║`);
  console.log(`║ Backend-only:          ${backendOnly.length.toString().padEnd(30)}║`);
  console.log(`║ Section issues:        ${sectionIssues.toString().padEnd(30)}║`);
  console.log(`║ Field issues:          ${fieldIssues.toString().padEnd(30)}║`);
  console.log(`║ Price issues:          ${priceIssues.toString().padEnd(30)}║`);
  console.log('╚══════════════════════════════════════════════════════╝');

  // Action items
  if (frontendOnly.length > 0) {
    console.log('\n🔧 ACTION REQUIRED: Seed these frontend products into the database:');
    frontendOnly.forEach((s) => console.log(`   → node -e "... seed ${s}"`));
    console.log('   Or add them via the admin panel at /admin/products');
  }
}

main().catch(console.error);
