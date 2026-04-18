# Seraj Store — Multi-Category Refactor Plan

> **Created:** 2026-04-18
> **Reviewed:** 2026-04-18 (Code Review + Best Practices + Testing)
> **Goal:** Transition from "Single-product" focus (Custom Stories) to a "Multi-category Educational Brand"

---

## 1. Architecture Overview (Current vs Target)

### Current State
| Layer | Technology | Routing | Notes |
|-------|-----------|---------|-------|
| Frontend (Store) | Static SPA | `public/index.html` + `public/app.js` | Hash-based routing (`#/home`, `#/products`) |
| Frontend (Admin) | Next.js Pages | `src/app/admin/` | Server/Client React components |
| Backend API | Next.js API Routes | `src/app/api/` | MongoDB via Mongoose |
| Products | 4 products | 4 flat categories | No `series` field, no section grouping |

### Target State
| Layer | Change |
|-------|--------|
| Frontend (Store) | Products page restructured into 4 category sections with anchor scrolling |
| Frontend (Admin) | Product editor supports new `section` + `series` fields |
| Backend API | Schema updated with `section` and `series` fields, new filter params |
| Products | Migrated to new category structure, new products seeded |

---

## 2. New Category Architecture

### Section ↔ Category Mapping

```
┌─────────────────────────────────────────────────────┐
│ Section 1: حكايات (tales)                           │
│   ├── Series: سباق الفتوحات                         │
│   │   └── Product: قصة خالد بن الوليد               │
│   │   └── Product: بطل قهر المستحيل                 │
│   │   └── (Future: more series products)            │
│   └── Series: (future series)                       │
├─────────────────────────────────────────────────────┤
│ Section 2: حكايات سراج (seraj-stories)              │
│   └── Coming Soon placeholder (no products yet)     │
├─────────────────────────────────────────────────────┤
│ Section 3: القصص المخصصة (custom-stories)           │
│   └── Product: القصة المخصصة → links to wizard      │
├─────────────────────────────────────────────────────┤
│ Section 4: العب وتعلم (play-learn)                  │
│   ├── Product: كروت الروتين اليومي                   │
│   └── (Future: more educational games/tools)        │
├─────────────────────────────────────────────────────┤
│ Unsectioned: مجموعات (bundles)                      │
│   └── Product: مجموعة الأبطال الصغار                 │
│   └── Appears in all sections as cross-sell          │
└─────────────────────────────────────────────────────┘
```

### Database Fields (New)

| Field | Type | Required | Values | Purpose |
|-------|------|----------|--------|---------|
| `section` | String (enum) | **Optional** | `"tales"`, `"seraj-stories"`, `"custom-stories"`, `"play-learn"`, `null` | Groups products into page sections. `null` = bundles (shown across all sections) |
| `series` | String | No | `"سباق الفتوحات"`, `"حكايات سِراج"`, etc. | Groups products within a section |
| `category` | String (enum) | Yes | **KEEP ARABIC — see below** | Admin classification + legacy filter support |

### Category Enum — Decision: KEEP ARABIC VALUES

> **⚠️ Review Finding #1 — CRITICAL CHANGE**
>
> The original plan proposed changing `category` enum from Arabic (`"قصص جاهزة"`) to English (`"tales-historical"`). **This is rejected** for these reasons:
>
> 1. The `category` values appear in `public/index.html` as `data-cat` attributes — these are Arabic strings used for filter display
> 2. The admin panel dropdown shows these as display labels directly
> 3. Changing them adds migration complexity with zero user-facing benefit
> 4. The NEW `section` field (English) already provides the programmatic grouping
>
> **Decision:** Keep `category` as Arabic display labels. Use `section` (English) for programmatic grouping.

| Old Category | New Section | Category (KEEP) |
|-------------|-------------|-----------------|
| `"قصص جاهزة"` | `"tales"` | `"قصص جاهزة"` ← unchanged |
| `"قصص مخصصة"` | `"custom-stories"` | `"قصص مخصصة"` ← unchanged |
| `"فلاش كاردز"` | `"play-learn"` | `"فلاش كاردز"` ← unchanged |
| `"مجموعات"` | `null` (unsectioned) | `"مجموعات"` ← unchanged |

---

## 3. Files to Modify

### 3.1 Backend — Schema & API

| File | Change Type | Description |
|------|------------|-------------|
| `src/lib/models/Product.ts` | **MODIFY** | Add `section` (optional enum) and `series` (optional string) fields |
| `src/app/api/products/route.ts` | **MODIFY** | Add `?section=` and `?series=` query params; update Zod schema with new fields |
| `src/app/api/products/[slug]/route.ts` | **MODIFY** | Update Zod PATCH schema with new fields |
| `scripts/seed.ts` | **MODIFY** | Add `section` and `series` to all products + add "بطل قهر المستحيل" |
| `src/lib/seed/contentDefaults.ts` | **MODIFY** | Add CMS keys for section headers (optional) |

### 3.2 Frontend (SPA) — Store Pages

| File | Change Type | Description |
|------|------------|-------------|
| `public/index.html` | **MODIFY** | Hero CTAs, Products page → 4-section layout, showcase CTAs |
| `public/app.js` | **MODIFY** | Anchor routing, dynamic product section rendering, PRODUCTS fallback |
| `public/styles.css` | **MODIFY** | Styles for 4-section layout, section nav pills, coming soon state |
| `public/sw.js` | **MODIFY** | Bump cache version to `seraj-v3` |

### 3.3 Frontend (Admin) — Product Management

| File | Change Type | Description |
|------|------------|-------------|
| `src/app/admin/products/page.tsx` | **MODIFY** | Add `section` dropdown + `series` text input to product editor |

### 3.4 New Files

| File | Description |
|------|-------------|
| `src/app/api/products/__tests__/route.test.ts` | API route tests |
| `scripts/__tests__/seed-validation.test.ts` | Seed data validation tests |

### 3.5 Deprecated/Removed Code

| File/Section | Status | Reason |
|-------------|--------|--------|
| `public/index.html` → old flat products grid (lines 426-479) | **REPLACE** | Replaced with 4-section layout |
| `public/index.html` → old filter chips (lines 418-424) | **REPLACE** | Replaced with section navigation pills |
| `public/app.js` → filter chip click handler (lines 2148-2166) | **REPLACE** | Section pills use smooth scroll, not show/hide |
| `public/app.js` → old `parseRoute()` (line 1088) | **MODIFY** | Add anchor support |

---

## 4. Execution Plan (Phased)

### Phase 1: Backend Schema & API Update
**Duration:** ~30 min | **Files:** 4 backend files + seed script
**Why first:** Frontend depends on API having new fields

#### Task 1.1: Update Product Schema
- **File:** `src/lib/models/Product.ts`
- **Changes:**
  ```ts
  // Add to IProduct interface:
  section?: string | null;   // "tales" | "seraj-stories" | "custom-stories" | "play-learn" | null
  series?: string;           // "سباق الفتوحات" | "حكايات سِراج" | null

  // Add to ProductSchema (AFTER category field):
  section: {
    type: String,
    enum: ["tales", "seraj-stories", "custom-stories", "play-learn"],
    index: true,
    // NOT required — bundles have no section
  },
  series: { type: String },

  // Add compound index:
  ProductSchema.index({ section: 1, order: 1 });
  ```
- **⚠️ Important:** `section` is OPTIONAL (not `required: true`). Bundle products don't belong to any section.
- **⚠️ Important:** Do NOT change the existing `category` enum. Keep `["قصص جاهزة", "قصص مخصصة", "فلاش كاردز", "مجموعات"]`.
- **Verify:** Schema compiles with `npx tsc --noEmit`

#### Task 1.2: Update API Routes
- **File:** `src/app/api/products/route.ts`
- **Changes:**
  ```ts
  // In GET handler, add new query params:
  const section = searchParams.get("section");
  const series = searchParams.get("series");
  if (section) filter.section = section;
  if (series) filter.series = series;

  // In CreateProductSchema, add:
  section: z.enum(["tales", "seraj-stories", "custom-stories", "play-learn"]).optional(),
  series: z.string().optional(),
  // Keep category enum UNCHANGED
  ```
- **File:** `src/app/api/products/[slug]/route.ts`
- **Changes:**
  ```ts
  // In PatchProductSchema, add:
  section: z.enum(["tales", "seraj-stories", "custom-stories", "play-learn"]).optional().nullable(),
  series: z.string().optional().nullable(),
  // Keep category enum UNCHANGED
  ```
- **Verify:** `GET /api/products?section=tales` returns only tales products

#### Task 1.3: Update Seed Script
- **File:** `scripts/seed.ts`
- **Changes:**
  - Add `section` and `series` to all existing products
  - Add new product "بطل قهر المستحيل"
  - Keep all `category` values unchanged
  ```js
  { slug: "story-khaled", section: "tales", series: "سباق الفتوحات", category: "قصص جاهزة", ... }
  { slug: "hero-conqueror", name: "بطل قهر المستحيل", section: "tales", series: "سباق الفتوحات", category: "قصص جاهزة", ... }
  { slug: "custom-story", section: "custom-stories", category: "قصص مخصصة", ... }
  { slug: "flash-cards", section: "play-learn", category: "فلاش كاردز", ... }
  { slug: "bundle", section: null, category: "مجموعات", ... }
  ```
- **⚠️ Review Finding #2:** The bundle product needs `section: null` (not undefined) because the schema allows null. If using `undefined`, Mongoose won't store the field.
- **Verify:** `npm run seed` succeeds without errors

#### Task 1.4: Update Admin Product Editor
- **File:** `src/app/admin/products/page.tsx`
- **Changes:**
  - Add `section` dropdown (5 options: the 4 sections + "بدون قسم" for bundles)
  - Add `series` text input (shown always, optional)
  - Keep existing `category` dropdown unchanged
  - Update `emptyProduct` defaults: `section: undefined, series: ""`
  - Update Product interface to include `section?: string | null` and `series?: string`
- **Verify:** Admin can create/edit products with section and series fields

---

### Phase 2: Products Page — 4-Section Layout
**Duration:** ~45 min | **Files:** `public/index.html`, `public/app.js`, `public/styles.css`

#### Task 2.1: Restructure Products Page HTML
- **File:** `public/index.html` — replace lines 411-480 (`data-page="products"` section)
- **Changes:**
  Replace the flat grid with 4 sections:
  ```html
  <section class="page" data-page="products">
    <div class="page-head">
      <span class="kicker">استكشفي عالم سراج</span>
      <h1>منتجات سِراج</h1>
      <p>اختاري مغامرة بطلنا القادمة</p>
    </div>

    <!-- Section Nav Pills (NOT <a href="#x"> — see Review Finding #3) -->
    <div class="section-nav" id="sectionNav">
      <button class="section-pill" data-scroll-to="tales">🐎 حكايات</button>
      <button class="section-pill" data-scroll-to="seraj-stories">🐰 حكايات سراج</button>
      <button class="section-pill" data-scroll-to="custom-stories">✨ القصص المخصصة</button>
      <button class="section-pill" data-scroll-to="play-learn">🧩 العب وتعلم</button>
    </div>

    <!-- Section 1: حكايات -->
    <div class="product-section" id="tales">
      <header class="section-header">
        <h2>🐎 حكايات</h2>
        <p>قصص من سلاسل مختلفة — كل سلسلة ليها أبطالها</p>
      </header>
      <!-- Series: سباق الفتوحات -->
      <div class="series-group">
        <h3 class="series-title">سباق الفتوحات</h3>
        <div class="products-grid" id="talesGrid">
          <!-- Populated by JS from PRODUCTS / API -->
        </div>
      </div>
    </div>

    <!-- Section 2: حكايات سراج (Coming Soon) -->
    <div class="product-section" id="seraj-stories">
      <header class="section-header">
        <h2>🐰 حكايات سراج</h2>
        <p>مغامرات الأرنب الأخضر وأسرته</p>
      </header>
      <div class="coming-soon-state">
        <div class="soon-icon">🐰</div>
        <h3>قريباً إن شاء الله!</h3>
        <p>بنشتغل على حكايات الأرنب سِراج وأسرته... تابعينا عشان تعرفي أول!</p>
      </div>
    </div>

    <!-- Section 3: القصص المخصصة -->
    <div class="product-section" id="custom-stories">
      <header class="section-header">
        <h2>✨ القصص المخصصة</h2>
        <p>قصة باسم طفلك وصورته</p>
      </header>
      <div class="products-grid" id="customGrid">
        <!-- custom-story card populated by JS -->
      </div>
    </div>

    <!-- Section 4: العب وتعلم -->
    <div class="product-section" id="play-learn">
      <header class="section-header">
        <h2>🧩 العب وتعلم</h2>
        <p>ألعاب تعليمية وكروت تفاعلية</p>
      </header>
      <div class="products-grid" id="playLearnGrid">
        <!-- flash-cards and future products populated by JS -->
      </div>
    </div>
  </section>
  ```

- **⚠️ Review Finding #3 — CRITICAL: Section nav pills must use `<button>` not `<a href="#id">`**
  - `<a href="#tales">` would change `location.hash` to `"#tales"`, destroying the SPA hash route (`#/products`)
  - This causes the router to see page `"#tales"` → not in `validPages` → **404 error**
  - **Fix:** Use `<button data-scroll-to="tales">` with JS click handlers that call `scrollIntoView()`

- **⚠️ Review Finding #4 — Product cards must be dynamically rendered**
  - Current approach: Static HTML cards in `index.html`, API only updates prices
  - New approach: Product cards are generated by `populateProductSections()` in `app.js`
  - This is needed because products are now grouped by `section`, not flat
  - HTML containers (`#talesGrid`, `#customGrid`, etc.) start empty, JS fills them

- **Verify:** HTML structure is valid, section IDs exist, no `<a href="#id">` in section nav

#### Task 2.2: Update JS Routing & Rendering
- **File:** `public/app.js`
- **Changes:**

  **a) Fix `parseRoute()` to support anchors:**
  ```js
  function parseRoute() {
    var full = location.hash.replace(/^#\//, '') || 'home';
    // Split on '#' to extract anchor (e.g., "products#tales" → ["products", "tales"])
    var hashParts = full.split('#');
    var route = hashParts[0];
    var anchor = hashParts[1] || null;
    var segments = route.split('/');
    if (!segments[0] || segments[0] === '#') return { page: 'home', sub: undefined, anchor: null };
    return { page: segments[0], sub: segments[1], anchor: anchor };
  }
  ```

  **b) Update `handleRoute()` and `showPage()` to handle anchors:**
  ```js
  function handleRoute() {
    var route = parseRoute();
    showPage(route.page, route.sub);
    // Anchor scroll (after page is visible)
    if (route.anchor) {
      setTimeout(function() {
        var target = document.getElementById(route.anchor);
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300); // 300ms to allow page transition + JS rendering
    }
  }
  ```

  **c) Create `populateProductSections()` function:**
  ```js
  function populateProductSections() {
    // Clear all section grids
    ['talesGrid', 'customGrid', 'playLearnGrid'].forEach(function(id) {
      var el = document.getElementById(id);
      if (el) el.innerHTML = '';
    });

    // Group products by section
    var sectionMap = { tales: 'talesGrid', 'custom-stories': 'customGrid', 'play-learn': 'playLearnGrid' };
    Object.keys(PRODUCTS).forEach(function(slug) {
      var p = PRODUCTS[slug];
      var gridId = sectionMap[p.section];
      if (!gridId) return; // skip bundles (no section)
      var grid = document.getElementById(gridId);
      if (!grid) return;
      grid.innerHTML += renderProductCard(slug, p);
    });
  }
  ```

  **d) Create `renderProductCard()` helper:**
  ```js
  function renderProductCard(slug, p) {
    var isSoon = p.comingSoon;
    var href = isSoon ? '' : 'href="#/product/' + slug + '" data-link';
    var tag = isSoon ? 'div' : 'a';
    var soonClass = isSoon ? ' coming-soon' : '';
    var priceHtml = p.originalPriceText
      ? '<span class="price old-price">' + p.originalPriceText + '</span><span class="price">' + p.priceText + '</span>'
      : '<span class="price">' + p.priceText + '</span>';
    var ctaHtml = isSoon ? '<span class="cta-mini soon-text">قريباً</span>' : '<span class="cta-mini">شوفيها →</span>';

    return '<' + tag + ' ' + href + ' class="product-card reveal' + soonClass + '" data-cat="' + (p.category || '') + '">' +
      '<div class="product-media ' + (p.media.bg || 'emerald') + '">' +
        (p.badge ? '<span class="badge' + (p.badgeSoon ? ' soon-badge' : '') + '">' + p.badge + '</span>' : '') +
        renderMedia(p.media, false, p.imageUrl) +
        (isSoon ? '<div class="soon-overlay">قريباً</div>' : '') +
      '</div>' +
      '<div class="product-body">' +
        '<h3>' + p.name + '</h3>' +
        '<p>' + (p.shortDesc || '') + '</p>' +
        '<div class="product-foot">' + priceHtml + ctaHtml + '</div>' +
      '</div>' +
    '</' + tag + '>';
  }
  ```

  **e) Update PRODUCTS fallback object:**
  - Add `section` and `series` fields to each product
  - Add `shortDesc` field (short description for cards)
  - Add new "بطل قهر المستحيل" product with all required fields

  **f) Add section-nav click handlers:**
  ```js
  // Section nav pill smooth scroll (NOT hash change)
  document.addEventListener('click', function(e) {
    var pill = e.target.closest('.section-pill[data-scroll-to]');
    if (!pill) return;
    var targetId = pill.dataset.scrollTo;
    var target = document.getElementById(targetId);
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  ```

  **g) Call `populateProductSections()` in init flow:**
  - After `productsReady` in `DOMContentLoaded`, call `populateProductSections()` before `handleRoute()`
  - After `fetchProducts()` resolves, call `populateProductSections()` again with API data

  **h) Remove old filter chip handler (lines 2148-2166)**

- **⚠️ Review Finding #5 — `renderMedia()` must exist or be created**
  - `renderProductDetail()` calls `renderMedia()` — verify this function exists and works for card-size media
  - If it only works for detail view, create a simpler card version

- **Verify:**
  - `#/products` shows all 4 sections with correct products
  - `#/products#tales` scrolls to tales section
  - Section nav pills scroll without changing URL hash
  - `#/product/custom-story` still renders product detail correctly

#### Task 2.3: Add Section Styles
- **File:** `public/styles.css`
- **Changes:**
  ```css
  /* ===== PRODUCTS PAGE — SECTION LAYOUT ===== */

  /* Section Navigation Pills */
  .section-nav {
    display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;
    padding: 16px 0 32px; position: sticky; top: 0;
    background: var(--cream); z-index: 10;
  }
  .section-pill {
    padding: 10px 24px; border-radius: 24px; border: 2px solid var(--ink);
    background: var(--paper); color: var(--ink); font-weight: 700;
    font-size: 0.95rem; cursor: pointer; transition: all 0.2s;
    font-family: inherit;
  }
  .section-pill:hover,
  .section-pill.is-active {
    background: var(--green); color: #fff; border-color: var(--green);
  }

  /* Product Section */
  .product-section { padding: 40px 0; }
  .product-section + .product-section { border-top: 2px dashed rgba(0,0,0,.08); }
  .section-header { text-align: center; margin-bottom: 28px; }
  .section-header h2 { font-size: 1.8rem; margin-bottom: 4px; }
  .section-header p { color: var(--ink-mute); font-size: 0.95rem; }

  /* Series Group (within a section) */
  .series-group { margin-bottom: 24px; }
  .series-group + .series-group { margin-top: 32px; }
  .series-title {
    font-size: 1.15rem; color: var(--ink-mute); margin-bottom: 16px;
    padding-bottom: 8px; border-bottom: 1px solid var(--line);
  }

  /* Coming Soon Empty State */
  .coming-soon-state {
    text-align: center; padding: 60px 20px;
    background: var(--paper); border: 3px dashed var(--ink);
    border-radius: 24px; max-width: 420px; margin: 0 auto;
  }
  .soon-icon { font-size: 4rem; margin-bottom: 16px; line-height: 1; }
  .coming-soon-state h3 { font-size: 1.4rem; margin-bottom: 8px; }
  .coming-soon-state p { color: var(--ink-mute); line-height: 1.6; }

  /* Responsive */
  @media (max-width: 640px) {
    .section-nav { gap: 8px; padding: 12px 8px 20px; }
    .section-pill { padding: 8px 14px; font-size: 0.85rem; }
    .section-header h2 { font-size: 1.5rem; }
  }
  ```

- **⚠️ Review Finding #6 — Sticky nav for section pills**
  - Added `position: sticky; top: 0; z-index: 10;` so pills stay visible during scrolling
  - This improves UX when user scrolls through long product sections
- **Verify:** Products page renders 4 sections with proper spacing, sticky nav pills

---

### Phase 3: Homepage Links Update (Hero + Showcase)
**Duration:** ~15 min | **Files:** `public/index.html`
**⚠️ CRITICAL: This phase MUST run AFTER Phase 2 (products page exists with section IDs). The anchor links (`#tales`, `#play-learn`, etc.) won't work until the target elements exist.**

> **Why this matters:** The homepage has 7 CTAs that point to old destinations. After restructuring the products page into 4 sections, every homepage link must point to the correct section anchor. If we update these links BEFORE the products page is ready, users will see a broken/empty page.

#### Task 3.1: Update Hero CTA Buttons (line ~108-115)
- **File:** `public/index.html`
- **Changes:**
  - Primary Button: Text → `"استكشفي عالم سراج"`, href → `#/products`
  - Secondary Button: Text → `"اصنعي قصة لابنك"`, href → `#/product/custom-story`
  - Confirm NO `data-content-key` attributes (already removed)
- **Verify:** Both buttons render with correct text and link targets

#### Task 3.2: Update Showcase Category CTAs (lines ~237, 261, 285, 309, 333)
- **File:** `public/index.html` — the zig-zag showcase section (5 cards)
- **⚠️ This is the step the user flagged as critical — all 5 homepage showcase CTAs must be updated**

  **Detailed mapping with exact line numbers:**

  | Line | Card | Current `href` | New `href` | Why |
  |------|------|---------------|------------|-----|
  | ~237 | 🐎 قصص "سباق الفتوحات" | `#/products` | **`#/products#tales`** | Scroll to tales section |
  | ~261 | 🌟 قصة مخصوصة | `#/wizard` | **`#/product/custom-story`** | Product detail first, then wizard CTA |
  | ~285 | 🧩 ألعاب سراج | `#/products` | **`#/products#play-learn`** | Scroll to play-learn section |
  | ~309 | 👩‍👧‍👦 عالم ماما | `#/mama-world` | `#/mama-world` ✅ | No change needed |
  | ~333 | 🐰 سلسلة حكايات سراج | `#/products` | **`#/products#seraj-stories`** | Scroll to coming soon section |

  **4 out of 5 links need updating.** Only "عالم ماما" is already correct.

- **How to verify:**
  1. Click each showcase CTA from homepage
  2. Verify it navigates to the correct section on the products page
  3. Verify anchor scroll works (page scrolls to section, not just top)
  4. Verify back button returns to homepage

---

### Phase 4: Migration, Cache & Final Testing
**Duration:** ~20 min

#### Task 4.1: Run Seed Migration
- **Action:** Run `npm run seed` to wipe and re-seed products with new fields
- **Verify:** Run `node scripts/check-db.js` (if exists) or query API to confirm fields

#### Task 4.2: Bump Service Worker Cache
- **File:** `public/sw.js`
- **Change:** `CACHE_NAME = 'seraj-v3'`
- **Also:** If any new assets were added to `/assets/`, update `ASSETS_TO_CACHE` list
- **Verify:** Returning visitors get fresh content

#### Task 4.3: End-to-End Route Audit
- **Manual checklist — verify each route works:**

  | # | From | To | Expected |
  |---|------|----|----------|
  | 1 | Hero "استكشفي عالم سراج" | `#/products` | Products page, scroll top |
  | 2 | Hero "اصنعي قصة لابنك" | `#/product/custom-story` | Product detail page |
  | 3 | Showcase "سباق الفتوحات" | `#/products#tales` | Products → scroll to tales |
  | 4 | Showcase "قصة مخصوصة" | `#/product/custom-story` | Product detail page |
  | 5 | Showcase "ألعاب سراج" | `#/products#play-learn` | Products → scroll to play-learn |
  | 6 | Showcase "حكايات سراج" | `#/products#seraj-stories` | Products → scroll to coming soon |
  | 7 | Showcase "عالم ماما" | `#/mama-world` | Mama world page |
  | 8 | Product card "خالد بن الوليد" | `#/product/story-khaled` | Product detail |
  | 9 | Product card "القصة المخصصة" | `#/product/custom-story` | Product detail |
  | 10 | Product detail CTA (custom-story) | `#/wizard` | Wizard flow |
  | 11 | Product detail CTA (story-khaled) | Add to cart | Cart badge updates |
  | 12 | Bottom nav "اصنع قصة" | `#/wizard` | Wizard flow |
  | 13 | Bottom nav "المنتجات" | `#/products` | Products page |
  | 14 | Back button from product detail | `#/products` | Products page |
  | 15 | Section nav pill "حكايات" | Scroll only | No hash change, smooth scroll |

---

## 5. Review Findings & Best Practices

### Critical Findings (Must Fix Before Execution)

| # | Finding | Severity | Description | Fix |
|---|---------|----------|-------------|-----|
| 1 | Don't change `category` enum | **BLOCKER** | Renaming Arabic categories to English adds migration complexity with zero benefit. `section` (new field) already provides programmatic grouping. | Keep `category` values as Arabic, add `section` as English enum |
| 2 | Bundle needs `section: null` | **BLOCKER** | Schema says `section: required: true` but bundles don't belong to any section. Seed will fail. | Make `section` optional (no `required: true`) |
| 3 | Section pills must be `<button>` | **BLOCKER** | `<a href="#tales">` changes `location.hash` to `"#tales"`, destroying the SPA route → 404 | Use `<button data-scroll-to="tales">` with JS `scrollIntoView()` |
| 4 | Dynamic card rendering needed | **HIGH** | Current cards are static HTML. New layout groups by section, requiring dynamic JS rendering. | Create `populateProductSections()` + `renderProductCard()` |
| 5 | `renderMedia()` scope check | **MEDIUM** | Verify `renderMedia()` works for card-size context, not just product detail. | Test or create simplified card version |

### Best Practices Recommendations

| # | Practice | Recommendation |
|---|----------|---------------|
| 1 | **Graceful degradation** | `populateProductSections()` should work with fallback PRODUCTS data even if API fails. Test with `fetch('/api/products')` returning error. |
| 2 | **Section pills active state** | Use IntersectionObserver on `.product-section` elements to highlight the currently visible section pill (`.is-active` class). This gives users orientation while scrolling. |
| 3 | **Anchor scroll offset** | Account for sticky section nav height when scrolling to anchors: `scrollIntoView({ block: 'start' })` then adjust by `window.scrollBy(0, -60)`. |
| 4 | **Bundle products visibility** | Bundle (`section: null`) should still appear somewhere. Consider showing it as a "cross-sell" card at the bottom of the products page, or inside each section as a highlighted offer. |
| 5 | **Series grouping** | When products have the same `series`, group them under a `<div class="series-group">` with the series title. When no series, just render in the section without a series header. |
| 6 | **Empty state for sections** | If a section has no active products (API returns empty), show a "coming soon" empty state instead of a blank section. Reuse the `.coming-soon-state` design. |
| 7 | **Backward-compatible API** | `GET /api/products` without `?section=` should return ALL products (current behavior). Only filter when `?section=` is explicitly provided. |
| 8 | **Text index update** | Add `section` to the text index: `ProductSchema.index({ name: "text", category: "text", section: "text" })` for future search functionality. |

---

## 6. Testing Strategy

### 6.1 Backend Tests (API Routes)

#### Test File: `src/app/api/products/__tests__/route.test.ts`

> **Note:** The project doesn't currently have a test framework installed. We need to add one.
> **Recommended:** Use `vitest` (fast, ESM-native, works well with Next.js).

**Setup required:**
```bash
npm install -D vitest @vitejs/plugin-react jsdom
```

Add to `package.json`:
```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

**Test cases for `GET /api/products`:**

```typescript
describe("GET /api/products", () => {
  // 1. Returns all active products (no filter)
  test("returns all active products when no params", async () => {
    const res = await GET(new Request("http://localhost/api/products"));
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.length).toBeGreaterThan(0);
    // Every product should be active
    json.data.forEach((p: any) => expect(p.active).toBe(true));
  });

  // 2. Filters by section
  test("filters by section=tales", async () => {
    const res = await GET(new Request("http://localhost/api/products?section=tales"));
    const json = await res.json();
    expect(json.success).toBe(true);
    json.data.forEach((p: any) => expect(p.section).toBe("tales"));
  });

  // 3. Filters by series
  test("filters by series=سباق الفتوحات", async () => {
    const res = await GET(new Request("http://localhost/api/products?series=سباق الفتوحات"));
    const json = await res.json();
    json.data.forEach((p: any) => expect(p.series).toBe("سباق الفتوحات"));
  });

  // 4. Returns products without section when section=null
  test("returns unsectioned products (bundles)", async () => {
    const res = await GET(new Request("http://localhost/api/products?all=true"));
    const json = await res.json();
    const bundles = json.data.filter((p: any) => p.section === null || p.section === undefined);
    expect(bundles.length).toBeGreaterThan(0);
    bundles.forEach((p: any) => expect(p.category).toBe("مجموعات"));
  });

  // 5. Ignores invalid section value
  test("returns empty for invalid section", async () => {
    const res = await GET(new Request("http://localhost/api/products?section=nonexistent"));
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.length).toBe(0);
  });

  // 6. Combines section + series filters
  test("combines section and series filters", async () => {
    const res = await GET(new Request("http://localhost/api/products?section=tales&series=سباق الفتوحات"));
    const json = await res.json();
    json.data.forEach((p: any) => {
      expect(p.section).toBe("tales");
      expect(p.series).toBe("سباق الفتوحات");
    });
  });

  // 7. Returns products with correct fields
  test("each product has section and series fields", async () => {
    const res = await GET(new Request("http://localhost/api/products?all=true"));
    const json = await res.json();
    json.data.forEach((p: any) => {
      expect(p).toHaveProperty("section");
      expect(p).toHaveProperty("series");
      expect(p).toHaveProperty("category");
    });
  });
});
```

**Test cases for `POST /api/products` (admin):**

```typescript
describe("POST /api/products", () => {
  // 8. Creates product with section and series
  test("creates product with section and series fields", async () => {
    // ... mock admin auth, POST with section: "tales", series: "test"
  });

  // 9. Rejects invalid section value
  test("rejects invalid section enum value", async () => {
    // ... POST with section: "invalid" → expect 400
  });

  // 10. Allows null section (for bundles)
  test("allows creating product without section", async () => {
    // ... POST with section: undefined → expect 201
  });
});
```

### 6.2 Frontend Tests (Manual Checklist)

> The SPA (`public/app.js`) uses vanilla JS with no framework. Automated testing requires a browser environment (Playwright/Cypress). For now, manual testing is more practical.

#### Manual Test Matrix

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| F1 | Products page renders 4 sections | Navigate to `#/products` | See 4 sections: حكايات, حكايات سراج (coming soon), القصص المخصصة, العب وتعلم |
| F2 | Tales section shows series products | Check tales section | "سباق الفتوحات" series title visible, 2 product cards (خالد + بطل قهر المستحيل) |
| F3 | Coming soon section shows placeholder | Check حكايات سراج section | Shows 🐰 icon + "قريباً إن شاء الله!" message |
| F4 | Section nav pills scroll | Click each pill | Smooth scroll to corresponding section, hash stays `#/products` |
| F5 | Section nav pills don't change hash | Click "حكايات" pill | `location.hash` remains `#/products` (not `#tales`) |
| F6 | Anchor routing works | Navigate to `#/products#tales` | Products page shows, auto-scrolls to tales section |
| F7 | Hero primary button | Click "استكشفي عالم سراج" | Navigates to `#/products` |
| F8 | Hero secondary button | Click "اصنعي قصة لابنك" | Navigates to `#/product/custom-story` |
| F9 | Showcase anchor links | Click each showcase card CTA | Correct navigation with anchor scroll |
| F10 | Product detail renders | Click any product card | Product detail page shows all info correctly |
| F11 | Custom story → wizard flow | Navigate custom story product detail → click CTA | Opens wizard page |
| F12 | API failure fallback | Block `/api/products` in DevTools → reload | Products page shows fallback data from PRODUCTS object |
| F13 | Back button from product | Click back from product detail | Returns to products page |
| F14 | Mobile responsive | Test on 375px viewport | Section pills wrap, cards stack, coming soon state fits |
| F15 | SW cache bump | Hard refresh after deploy | Gets fresh content (no old cached version) |

### 6.3 Schema Validation Tests

#### Test File: `scripts/__tests__/seed-validation.test.ts`

```typescript
import { describe, test, expect } from "vitest";

describe("Seed Data Validation", () => {
  const PRODUCTS = [/* imported seed data */];

  test("every product has a section or null", () => {
    PRODUCTS.forEach((p) => {
      expect(
        [null, undefined, "tales", "seraj-stories", "custom-stories", "play-learn"]
      ).toContain(p.section ?? null);
    });
  });

  test("every tales product has a series", () => {
    PRODUCTS.filter((p) => p.section === "tales").forEach((p) => {
      expect(p.series).toBeDefined();
      expect(p.series).not.toBe("");
    });
  });

  test("no duplicate slugs", () => {
    const slugs = PRODUCTS.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  test("category values are valid Arabic enum", () => {
    const valid = ["قصص جاهزة", "قصص مخصصة", "فلاش كاردز", "مجموعات"];
    PRODUCTS.forEach((p) => {
      expect(valid).toContain(p.category);
    });
  });

  test("hero-conqueror product exists and is in tales section", () => {
    const hero = PRODUCTS.find((p) => p.slug === "hero-conqueror");
    expect(hero).toBeDefined();
    expect(hero!.section).toBe("tales");
    expect(hero!.series).toBe("سباق الفتوحات");
  });

  test("custom-story product links to wizard action", () => {
    const cs = PRODUCTS.find((p) => p.slug === "custom-story");
    expect(cs).toBeDefined();
    expect(cs!.action).toBe("wizard");
    expect(cs!.section).toBe("custom-stories");
  });
});
```

### 6.4 Post-Execution Verification Checklist

After ALL phases are complete, run this checklist in order:

```bash
# 1. TypeScript compilation
npx tsc --noEmit

# 2. Build succeeds
npm run build

# 3. Seed database
npm run seed

# 4. Start dev server
npm run dev

# 5. Run automated tests (if vitest is set up)
npm run test
```

Then perform manual test matrix (Section 6.2) in the browser.

---

## 7. Logic Changes Summary

### Backend Changes
| Component | Before | After |
|-----------|--------|-------|
| Product Schema | 4 flat categories, no series | + `section` (optional enum) + `series` (optional string) |
| API Filter | `?category=` only | `?section=`, `?series=`, `?category=` (backward compatible) |
| Seed Data | 4 products | 5 products with section/series metadata |
| Admin Editor | 4 category options | Section dropdown + series text input + same category options |
| Category Enum | `["قصص جاهزة", "قصص مخصصة", "فلاش كاردز", "مجموعات"]` | **UNCHANGED** |

### Frontend Changes
| Component | Before | After |
|-----------|--------|-------|
| Hero CTAs | "شوفي منتجات سراج" / "اصنعي قصة لابنك" | "استكشفي عالم سراج" / "اصنعي قصة لابنك" |
| Hero Secondary Link | `#/wizard` | `#/product/custom-story` |
| Products Page | Flat grid + filter chips | 4 section layout + sticky nav pills + anchor scroll |
| Product Cards | Static HTML | Dynamic JS rendering (`populateProductSections()`) |
| Routing | `#/products` only | `#/products#tales`, `#/products#play-learn`, etc. |
| Section Nav | N/A | `<button>` with `scrollIntoView()` (NOT `<a href>`) |
| Showcase CTAs | Generic `#/products` links | Section-specific anchor links |

---

## 8. Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|-----------|
| Existing DB products missing `section` field | **Medium** | Seed script does full re-seed (`deleteMany` + `insertMany`). API handles `section: undefined` gracefully (returns all products when no filter). |
| `<a href="#id">` breaks SPA routing | **HIGH** | Use `<button data-scroll-to>` instead. This is the #1 cause of 404 bugs in hash-based SPAs. |
| `renderMedia()` doesn't work for card context | **Medium** | Test early. If broken, create simplified `renderCardMedia()` function. |
| Bundle products invisible on products page | **Low** | Show bundle as cross-sell card at bottom, or in each section. Decide during Phase 2. |
| API failure leaves empty sections | **Medium** | `populateProductSections()` uses fallback PRODUCTS data when API fails. Test with network blocked. |
| Service worker caches old products page | **Low** | Bump to `seraj-v3`. |
| Anchor scroll position behind sticky nav | **Low** | Add `scrollBy(0, -60)` offset after `scrollIntoView()`. |

---

## 9. Implementation Order

```
Phase 1 (Backend) ──→ Phase 2 (Frontend) ──→ Phase 3 (Hero/Showcase) ──→ Phase 4 (Migration/Testing)
      │                      │                        │                           │
      │                      │                        │                           └── Seed + audit + tests
      │                      │                        └── Hero CTAs + showcase anchors
      │                      └── Products page + routing + rendering
      └── Schema + API + Admin + Seed script
```

**Execution order:**
1. **Phase 1** — Backend must support new fields first
2. **Phase 2** — Restructure products page to consume new data
3. **Phase 3** — Update hero/showcase CTAs to point to section anchors
4. **Phase 4** — Seed database + run tests + route audit + cache bump

> **Estimated total execution time:** ~2-3 hours
> **Suggested split:** Phase 1 in Plan 01, Phases 2+3+4 in Plan 02
