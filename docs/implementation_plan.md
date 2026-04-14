# Dynamic Content Management System (CMS)

## Goal
Build a flexible Content Management System (CMS) that securely stores all of the site's textual content in the database instead of hardcoded HTML, allowing the Admin to edit any text directly from the dashboard and having it reflect instantly on the public storefront.

## User Review Required
> [!IMPORTANT]
> - There are many texts in the website (Hero section, 'Mama World', 'About Us', Footer, etc.). 
> - To make this perfectly stable with your Vanilla JS frontend, we will map text elements to specific `IDs` or `data-content-key` attributes in the HTML, and the frontend script will inject the text into them automatically on load.
> - Please confirm if there are any specific sections you want to prioritize (e.g. Mama World articles, Hero section) or if we should make the entire site dynamic at once.

---

## Proposed Changes

---

### Phase 1: Database & Models

#### [NEW] `src/lib/models/SiteContent.ts`
- Create a Mongoose Schema using a **flat key-value** approach instead of deeply nested objects.
- Each document = one content entry with a unique `key`, its `value`, and a `section` grouping.
- This allows partial updates per-key without overwriting other sections, and avoids complex nested Zod validation.

```ts
// Schema structure:
{
  key:     String,  // unique, e.g. "hero.title", "hero.subtitle", "footer.copyright"
  value:   String,  // the Arabic text content
  section: String,  // grouping: "hero" | "products" | "howItWorks" | "values" | "testimonials" | "about" | "footer" | "wizard" | "mamaWorld" | "general"
}
```

**Why flat key-value instead of singleton nested document:**
1. Partial updates — admin edits one field, only that field gets written (no race conditions if two admins edit different sections).
2. Simpler Zod validation — each PATCH validates a single `{ key, value }` or bulk `{ items: [{key, value}] }`.
3. Easier to extend — adding a new editable text is just inserting a new key, no schema migration.

#### [NEW] `src/lib/seed/contentDefaults.ts`
- Contains a `DEFAULT_CONTENT` map of all keys with their default values (the current hardcoded Arabic text).
- Used by a seed script **and** as fallback in the frontend if a key is missing from the DB.
- This ensures the site never breaks even if the DB has no content yet.

#### [NEW] Seed Script (`scripts/seed-content.ts`)
- Reads `DEFAULT_CONTENT` and upserts each key into MongoDB (only inserts if the key doesn't exist yet, preserving admin edits).
- Run once on first deploy: `npx tsx scripts/seed-content.ts`
- Safe to re-run — won't overwrite existing admin-edited values.

---

### Phase 2: Backend API Routes

#### [NEW] `src/app/api/content/route.ts`

**`GET` (Public)**:
- Fetches all content documents, returns them grouped by `section`.
- Adds `Cache-Control: public, s-maxage=60, stale-while-revalidate=120` header so Vercel CDN caches responses. This avoids hitting MongoDB on every page load.
- Response shape:
```json
{
  "success": true,
  "data": {
    "hero": { "hero.title": "متعة القراءة واللعب..", "hero.subtitle": "..." },
    "footer": { "footer.copyright": "© ٢٠٢٦ سِراج..." }
  }
}
```

**`PATCH` (Admin-only)**:
- Protected by `requireAdmin()`.
- Accepts bulk updates: `{ items: [{ key: "hero.title", value: "..." }, ...] }`.
- Validates with Zod: each `key` must match an existing key (prevents typo-based orphan keys), and `value` must be a non-empty string.
- After successful update, calls `revalidatePath('/')` to bust the Next.js cache so changes reflect immediately on the public site.
- Returns the updated documents.

**`POST` (Admin-only)** — optional, for adding new content keys:
- Only needed if the admin wants to add new editable text not in the original seed. Can be deferred to Phase 2+.

---

### Phase 3: Admin Dashboard

#### [MODIFIED] `src/app/admin/layout.tsx`
- Add a new sidebar nav item: `{ href: "/admin/content", label: "المحتوى", icon: "✏️" }`.

#### [NEW] `src/app/admin/content/page.tsx`
- Admin UI to edit the textual content.
- Uses `shadcn/ui` **Tabs** component (already in the project at `src/components/ui/tabs.tsx`) to split editing by section:
  - **الرئيسية** (Hero): title, subtitle, CTA texts, marquee items
  - **المنتجات** (Products section headers): kicker, heading
  - **إزاي بنعمل القصة** (How it works): step titles & descriptions
  - **القيم** (Values section): headings
  - **آراء العملاء** (Testimonials): section header (actual reviews are per-product)
  - **حكايتنا** (About): all paragraphs
  - **الفوتر** (Footer): brand text, column headings, contact info
  - **عالم ماما** (Mama World): page header and section texts
  - **الويزارد** (Wizard): step questions and UI text
- Each tab shows a simple form with labeled `<Textarea>` inputs for each key in that section.
- **RTL support**: All textareas must have `dir="rtl"` since content is Arabic.
- **Save per-section**: Each tab has its own "حفظ" button that PATCHes only the keys in that section.
- **Loading state**: Show skeleton loaders while fetching, and a toast/alert on successful save.
- **Unsaved changes warning**: Track dirty state and warn before navigating away (simple `beforeunload` event).

---

### Phase 4: Frontend SPA Integration (Vanilla JS)

#### [MODIFIED] `public/index.html`
- Add `data-content-key="<key>"` attributes to all editable text elements.
- Keep the current hardcoded text as the default fallback (if JS fails or API is slow, the user still sees content).

**Full Content Key Map:**

| Section | Key | Current Element / Text |
|---------|-----|----------------------|
| Hero | `hero.title` | `h1.display` — "متعة القراءة واللعب.." |
| Hero | `hero.subtitle` | `h1 .highlight` lines |
| Hero | `hero.cta_primary` | Primary CTA — "يلا يا سراج.. ألف قصة لبطلنا" |
| Hero | `hero.cta_secondary` | Secondary CTA — "شوفي المنتجات" |
| Products | `products.kicker` | "أبطالنا الصغار بيحبوهم" |
| Products | `products.heading` | "منتجات سِراج الأكتر طلباً" |
| Counter | `counter.kicker` | "من قلب البيوت المصرية" |
| Counter | `counter.heading` | "أكتر من ... قصة اتألفت لأبطالنا" |
| Counter | `counter.subtext` | "صور حقيقية من أمهات..." |
| HowItWorks | `how.kicker` | "٣ خطوات بس" |
| HowItWorks | `how.heading` | "إزاي سراج بيعمل قصة بصورة ابنك؟" |
| HowItWorks | `how.step1_title` | "قولي لسراج اسم بطلنا وسنه" |
| HowItWorks | `how.step1_desc` | Step 1 paragraph |
| HowItWorks | `how.step2_title` | Step 2 heading |
| HowItWorks | `how.step2_desc` | Step 2 paragraph |
| HowItWorks | `how.step3_title` | Step 3 heading |
| HowItWorks | `how.step3_desc` | Step 3 paragraph |
| Values | `values.kicker` | "القيم اللي هيتعلمها" |
| Values | `values.heading` | "اختاري القيمة اللي بطلنا محتاجها النهاردة" |
| Testimonials | `testimonials.kicker` | "كلام أمهاتنا" |
| Testimonials | `testimonials.heading` | "اللي قالتوه عن سِراج" |
| CTA Ribbon | `ribbon.heading` | "مستنية إيه؟ خلّي بطلنا يبدأ حكايته النهاردة!" |
| CTA Ribbon | `ribbon.subtext` | "بس ٣ خطوات صغيرة..." |
| CTA Ribbon | `ribbon.cta` | "اصنع قصة لابنك" |
| Footer | `footer.brand_text` | "قصص مخصصة بتعلّم بطلنا..." |
| Footer | `footer.copyright` | "© ٢٠٢٦ سِراج. صُنع بحب في مصر." |
| About | `about.kicker` | "قصتنا من قلب قرية الابتكار" |
| About | `about.heading` | "حكاية سِراج وعيلته" |
| About | `about.quote` | Long about quote paragraph |
| About | `about.story` | Second about paragraph |

#### [MODIFIED] `public/app.js`
- Add `fetchSiteContent()` function, called in parallel with `fetchProducts()` on app init.
- Implementation:

```js
function fetchSiteContent() {
  fetch('/api/content')
    .then(function(res) { return res.json(); })
    .then(function(result) {
      if (!result.success) return; // keep hardcoded defaults
      var flat = {};
      // flatten grouped response into { "hero.title": "...", ... }
      Object.keys(result.data).forEach(function(section) {
        Object.keys(result.data[section]).forEach(function(key) {
          flat[key] = result.data[section][key];
        });
      });
      // inject into DOM
      document.querySelectorAll('[data-content-key]').forEach(function(el) {
        var key = el.getAttribute('data-content-key');
        if (flat[key] != null) {
          el.textContent = flat[key];
        }
      });
    })
    .catch(function() {
      // silently fail — hardcoded defaults remain visible
    });
}
```

**FOUC Prevention**: 
- The hardcoded text stays in the HTML, so the user sees content immediately.
- The JS fetch runs in the background and swaps text if different — no visible flash since the text is usually the same (admin rarely changes it).
- No loading spinners or blank states for content — it's an enhancement, not a requirement.

---

## Edge Cases & Risks Addressed

### 1. Race Conditions (Multiple Admins)
- Flat key-value design means two admins editing different sections won't overwrite each other.
- If two admins edit the **same key** simultaneously, last-write-wins (acceptable for a small team).

### 2. Empty Database / First Deploy
- Seed script populates defaults. Frontend always shows hardcoded text as fallback.
- If the API returns empty, the DOM text doesn't change — no blank page.

### 3. Performance
- `Cache-Control` headers on the GET endpoint let Vercel CDN serve cached content.
- `stale-while-revalidate` ensures users get fast responses even when cache expires.
- Content fetch runs in parallel with product fetch — no added latency.

### 4. Security
- PATCH endpoint uses `requireAdmin()` (same pattern as products API).
- Zod validates all input — no arbitrary keys can be injected.
- `textContent` (not `innerHTML`) used in the frontend to prevent XSS if someone injects HTML via the admin panel.

### 5. Content with HTML (Bold, Line Breaks)
- Some content (like the hero title) uses `<br/>` and `<span class="highlight">`. 
- For these specific keys, use `innerHTML` instead of `textContent`, but **only** for a whitelisted set of keys that need HTML formatting.
- The whitelist is defined in `app.js` (e.g., `var HTML_KEYS = ['hero.title', 'hero.subtitle']`).
- Admin UI should note which fields support HTML and which are plain text.

---

## Decisions on Open Questions

### Mama World Articles
- **Phase 1 (this plan):** Make the Mama World **page headers and section texts** dynamic only.
- **Phase 2 (future):** Build a full CRUD system for individual articles (Create/Edit/Delete). This is a separate feature that deserves its own plan since it requires a new `Article` model, admin listing page, and dynamic rendering in `app.js`.

### Wizard Step Texts
- **Phase 1 (this plan):** Make wizard **step titles and question texts** dynamic (4 keys for the 4 steps).
- Exclude the spinning gears animation text and technical UI labels — these are tightly coupled to the JS logic and rarely need changing.

---

## Implementation Order

| Step | Task | Estimated Complexity |
|------|------|---------------------|
| 1 | Create `SiteContent` model + `contentDefaults.ts` | Low |
| 2 | Create seed script + run it | Low |
| 3 | Build `GET /api/content` with caching | Low |
| 4 | Build `PATCH /api/content` with Zod validation | Medium |
| 5 | Add `data-content-key` attributes to `index.html` | Medium (many elements) |
| 6 | Add `fetchSiteContent()` to `app.js` | Low |
| 7 | Build admin content page with tabs | Medium-High |
| 8 | Add sidebar link in admin layout | Low |
| 9 | End-to-end testing | Medium |

---

## Verification Plan

### Automated
- `npx tsc` — type checking passes with the new model.
- Seed script runs without errors on a fresh DB.

### Manual Testing
1. Run seed script → verify content documents appear in MongoDB.
2. `GET /api/content` → returns all sections grouped correctly.
3. `PATCH /api/content` without auth → returns 401.
4. `PATCH /api/content` with admin auth → updates successfully.
5. Open public site → verify hardcoded text loads immediately.
6. Edit Hero title in admin → save → refresh public site → new title appears.
7. Delete all content from DB → public site still shows hardcoded defaults (no blank page).
8. Check response headers → `Cache-Control` is set correctly.
