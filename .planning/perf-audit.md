# Seraj Store Performance Audit Baseline

Generated: 2026-05-05T15:19:43.650Z
Production URL: https://seraj-store.vercel.app

This PR is diagnostic only. It documents the current bottlenecks and before-fix measurements; it does not change runtime code, DB schema, API contracts, or cache behavior.

## Scope and source files reviewed

Phase 1 requested reading the project before writing code. Reviewed:

- General context: `.planning/ROADMAP.md`, `.planning/STATE.md`, `.planning/implementation_plan.colorseraj.md`, `.planning/4-admin-SUMMARY.md`, `.planning/neutralize-audience.md`, `AGENT-GUIDES.md`
- SPA shell: `public/index.html`, `public/styles.css`, `public/app.js`, `public/sw.js`
- Current cache helpers: `src/lib/productsCache.ts`, `src/lib/coloringCache.ts`
- API routes: products, coloring items/categories/featured/pricing, articles, orders, stats, chat-config, config, content, places, testimonials
- Mongo connection: `src/lib/db.ts`
- Models: `src/lib/models/*.ts`
- Next config: `next.config.ts`

Notes on requested paths:

- `README.md` is not present at repo root.
- `src/lib/mongodb.ts` is not present; Mongo connection pooling lives in `src/lib/db.ts`.
- `.github/PULL_REQUEST_TEMPLATE.md` is not present in this checkout, so future PRs should use an equivalent structured body.

## Production API baseline

Method: five sequential `curl` runs per endpoint from this VM using response headers captured separately. Values are wall-clock totals and TTFB.

| Endpoint | Avg total | Min | Max | Avg TTFB | Size | X-Cache | Vercel | Cache-Control |
|---|---:|---:|---:|---:|---:|---|---|---|
| `/api/products` | 0.212s | 0.193s | 0.229s | 0.212s | 4728 B | HIT | MISS | public, max-age=0, must-revalidate |
| `/api/articles?limit=12` | 0.540s | 0.528s | 0.555s | 0.539s | 15210 B | none | MISS | public, max-age=0, must-revalidate |
| `/api/content` | 0.122s | 0.107s | 0.129s | 0.121s | 9036 B | none | HIT | public |
| `/api/config` | 0.543s | 0.532s | 0.560s | 0.542s | 482 B | none | MISS | public, max-age=0, must-revalidate |
| `/api/chat-config` | 0.123s | 0.116s | 0.130s | 0.123s | 830 B | none | STALE/HIT | public |
| `/api/coloring/categories` | 0.209s | 0.198s | 0.219s | 0.209s | 4134 B | HIT | MISS | public, max-age=0, must-revalidate |
| `/api/coloring/items?limit=24` | 0.200s | 0.196s | 0.209s | 0.199s | 15674 B | HIT | MISS | public, max-age=0, must-revalidate |
| `/api/coloring/featured` | 0.324s | 0.308s | 0.361s | 0.324s | 7724 B | none | MISS | public, max-age=0, must-revalidate |
| `/api/coloring/pricing` | 0.316s | 0.307s | 0.326s | 0.315s | 107 B | none | MISS | public, max-age=0, must-revalidate |
| `/api/places?limit=20` | 0.471s | 0.415s | 0.546s | 0.471s | 21421 B | none | MISS | public, max-age=0, must-revalidate |
| `/api/testimonials` | 0.324s | 0.310s | 0.333s | 0.323s | 26 B | none | MISS | public, max-age=0, must-revalidate |

### API observations

1. Endpoints already using in-memory TTL cache are fast on warm hits:
   - `/api/products`: avg 0.212s with `X-Cache: HIT`.
   - `/api/coloring/categories`: avg 0.209s with `X-Cache: HIT`.
   - `/api/coloring/items?limit=24`: avg 0.200s with `X-Cache: HIT`.
2. Endpoints with Vercel CDN caching only are similarly fast when Vercel returns HIT/STALE:
   - `/api/content`: avg 0.122s with `x-vercel-cache: HIT`.
   - `/api/chat-config`: avg 0.123s with `x-vercel-cache: STALE/HIT`.
3. Public GET endpoints without either `X-Cache` or CDN HIT are materially slower:
   - `/api/config`: avg 0.543s.
   - `/api/articles?limit=12`: avg 0.540s.
   - `/api/places?limit=20`: avg 0.471s.
   - `/api/coloring/featured`: avg 0.324s.
   - `/api/coloring/pricing`: avg 0.316s.
   - `/api/testimonials`: avg 0.324s despite a tiny 26 B response.
4. Current in-memory cache headers do not leverage Vercel edge cache: cached route responses still show `x-vercel-cache: MISS` and `Cache-Control: public, max-age=0, must-revalidate`.

## Lighthouse mobile baseline

Tool: Lighthouse CLI 12.8.2 against `https://seraj-store.vercel.app` with mobile emulation 390×844 through the existing Chrome CDP port.

```text
Performance score: 57
FCP: 2271 ms
LCP: 53658 ms
TBT: 315 ms
CLS: 0.010344453463764435
Speed Index: 9366 ms
Opportunities:
- render-blocking-resources: Eliminate render-blocking resources | Est savings of 660 ms
- unused-javascript: Reduce unused JavaScript | Est savings of 37 KiB
- unused-css-rules: Reduce unused CSS | Est savings of 27 KiB
- modern-image-formats: Serve images in next-gen formats | Est savings of 5,042 KiB
- uses-optimized-images: Efficiently encode images | 
- uses-responsive-images: Properly size images | 
- efficient-animated-content: Use video formats for animated content | 
- total-byte-weight: Avoid enormous network payloads | Total size was 32,806 KiB
- third-party-summary: Minimize third-party usage | Third-party code blocked the main thread for 0 ms
```

Key Lighthouse findings:

- Performance score: **57**.
- LCP: **53.7s**, with the LCP element being the hero `h1.display`. Lighthouse attributes 98% of this to render delay rather than image load time.
- Total transfer: **32,806 KiB**.
- Main opportunities:
  - Render-blocking CSS/fonts: estimated 660 ms savings.
  - Next-gen/local image formats: estimated 5,042 KiB savings.
  - Unused JS: estimated 37 KiB savings from `app.js`.
  - Unused CSS: estimated 27 KiB savings from `styles.css`.

Top network payloads recorded by Lighthouse:

| Resource | Transfer |
|---|---:|
| `assets/videos/قسم مغامرات سراج.mp4` | ~6.0 MiB |
| `assets/logo/logo.svg` | ~4.2 MiB |
| `assets/logo/logo-icon.svg` | ~4.0 MiB |
| `assets/videos/قسم الفتوحات (2).mp4` | ~3.4 MiB |
| `assets/videos/قسم القصة المخصصة.mp4` | ~3.2 MiB |
| `assets/videos/قسم ماما.mp4` | ~2.7 MiB |
| `assets/catagory/catalog-all.png` | ~2.4 MiB |
| `assets/videos/العاب التعليمية.mp4` | ~1.8 MiB |
| `assets/layla.png`, `assets/seraj.png`, `assets/khaled-v2.png` | ~1.2 MiB each |

Local file-size check confirms large assets in `public/assets`, including a 9.6 MB source video, ~5.9 MB SVG logos, and multiple 1–2.8 MB PNGs.

## Mongo query audit

### Query patterns found in code

- `/api/products`: `Product.find(filter).sort({ order: 1 }).select(...).lean()`; filter commonly includes `active`, `category`, `section`, `series`.
- `/api/articles`: active/published filters, optional `section`, `ageGroup`, tag, text search, pagination, and section-count aggregation.
- `/api/coloring/items`: active filter plus optional category/type/difficulty/age/license/featured, text search, pagination, `countDocuments`, sort by `order` and `savedCount`.
- `/api/coloring/categories`: active/category tree queries sorted by `order`.
- `/api/coloring/featured`: two finds, `active+featured` sorted by `order`, and `active+featured:false` sorted by `savedCount`.
- `/api/places`: active plus city/category/free/indoor/area/price filters, optional text search, pagination and `countDocuments`.
- `/api/stats`: `Order.aggregate($facet)` plus `ColoringItem.find({ active: true }).sort({ savedCount: -1, printCount: -1 })`.
- `/api/orders`: admin listing sorted/filtered by status/payment/customer/date, plus recent dashboard queries.

### Current indexes reviewed

- Product: text index on name/category/section, `{ section: 1, order: 1 }`.
- Article: text index, `{ active: 1, section: 1, order: 1 }`.
- Order: `{ orderStatus: 1, createdAt: -1 }`, `{ customerPhone: 1 }`, `{ paymentStatus: 1, createdAt: -1 }`, `{ createdAt: -1 }`.
- ColoringItem: `{ categorySlug: 1, active: 1, order: 1 }`, `{ type: 1, active: 1 }`, `{ featured: 1, active: 1 }`, `{ license: 1 }`, text index.
- ColoringCategory: `{ parentSlug: 1, order: 1 }`, `{ active: 1, featured: 1 }`.
- Place: text index, `{ active: 1, city: 1, category_ids: 1 }`, single-field indexes on city/free/indoor/category/active.
- Testimonial: no explicit index for `{ active, order, createdAt }` list query.

### Mongo `.explain()` baseline

After receiving a corrected read-only `SERAJ_STORE_MONGODB_URI`, the URI connected successfully. The provided URI defaults to database `test`, which contains the active app collections: products 5, articles 40, orders 2, coloringitems 137, coloringcategories 15, places 480, testimonials 0, sitecontents 90. Database `seraj` only has products 4 and orders 19.

| Query | ms | Keys | Docs | Returned | Plan | Indexes |
|---|---:|---:|---:|---:|---|---|
| `products.list.active.sortOrder` | 1 | 2 | 2 | 2 | SORT > FETCH > IXSCAN | `active_1` |
| `articles.list.activePublished.sortOrderCreated` | 4 | 40 | 40 | 12 | PROJECTION_SIMPLE > SORT > FETCH > IXSCAN | `active_1` |
| `coloring.items.active.sortOrderSaved` | 2 | 119 | 119 | 24 | SORT > FETCH > IXSCAN | `active_1` |
| `coloring.categories.active.sortOrderName` | 2 | 14 | 14 | 14 | SORT > FETCH > IXSCAN | `active_1` |
| `coloring.featured.activeFeatured.sortOrder` | 1 | 22 | 22 | 8 | SORT > FETCH > IXSCAN | `featured_1_active_1` |
| `coloring.popular.activeNonFeatured.sortSaved` | 0 | 97 | 97 | 4 | SORT > FETCH > IXSCAN | `featured_1_active_1` |
| `places.list.active.sortOrder` | 5 | 480 | 480 | 20 | SORT > FETCH > IXSCAN | `active_1` |
| `testimonials.list.active.sortOrderCreated` | 1 | 0 | 0 | 0 | SORT > COLLSCAN | none |
| `orders.admin.recent.sortCreated` | 1 | 2 | 2 | 2 | LIMIT > FETCH > IXSCAN | `createdAt_-1` |

Aggregation explains for `articles.sectionCounts.aggregate` and `stats.orders.facet` completed with `ok: 1`, but the Node driver returned the modern aggregation explain shape without direct top-level `executionStats` counters. They should be revisited during Cluster B if index work targets those aggregations.

Mongo findings:

- Current data volumes are small enough that absolute query execution times are low (0–5 ms), so production endpoint latency is dominated more by serverless/connection/cache behavior than raw Mongo scan time.
- Several hot list queries use a single-field filter index and then in-memory sort: products (`active_1` then sort by `order`), articles (`active_1` then sort by `order, createdAt`), coloring items (`active_1` then sort by `order, savedCount`), coloring categories (`active_1` then sort by `order, nameAr`), and places (`active_1` scanning 480 docs then sorting by `order`).
- Evidence-backed Cluster B candidates, after Cluster A caching, are compound indexes that match filter+sort patterns such as `active+order`, `active+order+createdAt`, `active+order+savedCount`, `featured+active+order`, `featured+active+savedCount`, and `active+order+nameAr`. Add only if the post-cache baseline still shows Mongo-bound latency.

## Prioritized bottleneck list

1. **Large above-the-fold payloads and eager autoplay media**: Lighthouse transferred ~32.8 MiB, dominated by local videos, huge SVG logo files, and PNG character/catalog art. This is likely the biggest user-visible mobile bottleneck.
2. **Public APIs without reusable cache/edge caching**: `/api/config`, `/api/articles`, `/api/places`, `/api/coloring/featured`, `/api/coloring/pricing`, and `/api/testimonials` all return `x-vercel-cache: MISS` and no `X-Cache`.
3. **Current in-memory caches are serverless-local**: products/coloring TTL caches help warm function invocations but do not share state across Vercel instances and do not use CDN HITs.
4. **SPA fetch waterfall/local SWR gaps**: `public/app.js` hydrates products from localStorage, but config/content/articles/places/testimonials/coloring pricing/categories do not use the same stale-while-revalidate pattern.
5. **Service worker does not cache API responses**: `public/sw.js` intentionally bypasses `/api/`; it only cache-firsts Cloudinary and network-firsts static assets.
6. **Potential Mongo index misses**: query patterns suggest possible compound indexes for active+sort/filter combinations, but actual index changes should wait for corrected explain output to avoid speculative schema/index churn.
7. **Admin/App Router bundle opportunities**: admin pages are sizeable, but lucide imports are already named imports; dynamic imports should be driven by build analysis rather than assumed.

## Proposed PR sequence after this diagnostic PR

### PR #2 — Cluster A: cache layer

- Add a small shared TTL cache helper or per-domain helpers matching the existing `Map<string, { body, expiresAt }>` pattern.
- Add cache to stable public GET endpoints first: `/api/articles`, `/api/config`, `/api/coloring/featured`, `/api/coloring/pricing`, `/api/places`, `/api/testimonials`.
- Keep/admin-protect `?fresh=1` bypass where useful for admin dashboards/config.
- Add `X-Cache: HIT|MISS|BYPASS` and `Cache-Control: public, s-maxage=60, stale-while-revalidate=300` where safe.
- Invalidate on POST/PATCH/PUT/DELETE handlers that mutate the backing data.

### PR #3 — Cluster B: Mongo/index/query tuning

- Re-run `.explain()` after corrected Mongo secret.
- Add only evidence-backed indexes.
- Add missing `.lean()` and `.select()` where response contracts allow.
- Avoid migrations/schema shape changes.

### PR #4 — Cluster C: frontend and assets

- Add localStorage stale-while-revalidate for non-product stable reads.
- Defer/lazy-load autoplay videos or switch to poster-first user/viewport-triggered loading.
- Convert/compress local oversized PNG/SVG assets or move selected display assets through Cloudinary transforms.
- Revisit service-worker API strategy after API cache headers are consistent.

### PR #5 — Cluster D: bundle/admin

- Run build/analyze baseline.
- Split admin-heavy editors only where measured chunks justify it.
- Keep lucide named imports.

## Verification notes

- `npm ci` completed, with Node engine warning because current VM uses Node v22.12.0 while `eslint-visitor-keys@5.0.1` wants `^20.19.0 || ^22.13.0 || >=24`.
- `npm run lint` currently fails on pre-existing repo files unrelated to this PR, notably root scripts using CommonJS `require()` under `@typescript-eslint/no-require-imports`. The diagnostic markdown does not introduce linted runtime code.
- PageSpeed API fallback was attempted but blocked by quota; Lighthouse CLI via existing Chrome CDP succeeded.
