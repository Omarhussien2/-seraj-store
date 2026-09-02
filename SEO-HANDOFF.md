# Seraj Store SEO, Search, Merchant, and AI Discovery Handoff

Read this file before any work involving SEO, structured data, Google Search
Console, Bing Webmaster Tools, Google Merchant Center, product feeds, crawler
access, search-platform logos, or AI-search discoverability.

For customer-facing positioning, content architecture, search intent, evidence
requirements, and the owner-confirmed personalized-story workflow, read
`SEO-CONTENT-STRATEGY.md` in full before drafting or changing public copy.

Last verified: **2026-09-01, Africa/Cairo**. External dashboards change over
time. Treat counts below as dated observations, not permanent facts.

## Accounts and production identity

- Production store: `https://seraj-store.vercel.app/`
- Google operator account: `hussien.impression@gmail.com`
- Google Merchant Center account: **سِراج**, ID `5847247567`
- Search Console property: `https://seraj-store.vercel.app/`
- Bing Webmaster property: `https://seraj-store.vercel.app/`
- Do not use `samawah.pod@gmail.com` for Seraj. Its Search Console access and
  obsolete verification token were removed.

Never invent a legal name, address component, phone number, email address,
shipping promise, or return-policy term. Ask the owner to confirm current
values before changing them in code or an external dashboard.

## Code sources of truth

- Site URL and SEO helpers: `src/lib/seoContent.ts`
- Legal identity, shipping values, and machine-readable return policy:
  `src/lib/commercePolicies.ts`
- Public return policy: `src/app/returns/page.tsx`
- Public shipping policy: `src/app/shipping/page.tsx`
- Public customer-service details: `src/app/contact/page.tsx`
- Root Organization JSON-LD: `public/index.html`
- Sitemap generator: `src/app/sitemap.ts`
- Crawler rules: `public/robots.txt`
- Merchant feed: `src/app/merchant-feed.xml/route.ts`
- PWA identity: `public/manifest.json`
- Search and platform logo assets: `public/assets/logo/`
- Organic-discovery messaging and content source of truth:
  `SEO-CONTENT-STRATEGY.md`

The root static SPA and the Next.js SEO pages expose the same business facts
through different files. A business-identity or policy change must update every
relevant source above in the same pull request.

## Verified external-service state

### Google Search Console

- The property is verified under the correct Google account. **Users and
  permissions** showed one user only: `hussien.impression@gmail.com`, verified
  owner. There were 0 unused ownership tokens.
- `https://seraj-store.vercel.app/sitemap.xml` was last read successfully on
  2026-09-01 and contained 56 discovered pages.
- The live report showed 40 indexed pages and 10 not indexed. The exclusions
  were 9 pages marked **Discovered - currently not indexed** and the expected
  `/index.html` duplicate marked **Alternate page with proper canonical tag**.
- Validation for the 9 discovered-but-not-indexed pages was started on
  2026-09-01 after their production responses, metadata, canonicals, and
  structured data were rechecked.
- Manual indexing requests reached Google's daily quota on 2026-09-01. This was
  a quota response, not a page failure.
- Manual Actions and Security Issues both reported **No issues detected**.
- Search Console reported `robots.txt` as valid and 304 crawl requests during
  the preceding 90 days.
- The Search generative AI control was **Include**, inherited from the
  production property. This permits links and content from the site to appear
  in Google Search AI features; it does not guarantee inclusion or ranking.
- The obsolete `samawah.pod@gmail.com` user and its verification token were
  removed. Do not restore them.

### Bing Webmaster Tools

- The property was imported from Search Console under the correct account.
  User management showed only `hussien.impression@gmail.com`, with Administrator
  access.
- Only `https://seraj-store.vercel.app/sitemap.xml` should remain as the sitemap;
  an invalid root-URL submission was removed. On 2026-09-01 Bing reported the
  remaining sitemap as **Success**, with 56 URLs discovered, 0 errors, and 0
  warnings.
- All 56 URLs known on 2026-09-01 were submitted through URL Submission. Bing
  showed 56 URLs submitted that day and said new reports could take up to 48
  hours to process.
- Bing AI Performance was available for the property but showed 0 citations and
  0 cited pages before the new property data had finished processing. Treat this
  as a dated baseline, not evidence that the site is excluded from Copilot.

### Google Merchant Center

- Account setup is complete under `hussien.impression@gmail.com`; the store is
  verified and claimed.
- Product source: `https://seraj-store.vercel.app/merchant-feed.xml`
- The Merchant Center UI showed the feed update completed successfully at 15:16
  on 2026-09-01.
  Merchant Center reported 6 updated products, all attribute names recognized,
  and no product-file issues.
- Shipping for Egypt: 40 EGP, free from 500 EGP, estimated 5–7 business days.
- Standard return policy: **Standard for Egypt**, 14 days, new products only,
  by mail with a free electronic return label, no restocking fee, and 7-day
  refund processing time. It was verified on 2026-09-01. Google policy ID:
  `9298593099`.
- Books and personalized stories use the `books-personalized` exception. It
  accepts defective-product returns and exchanges only. Google exception ID:
  `9298594050`.
- Business address and customer-service details were visible as saved on
  2026-09-01. The public contact URL, correct Google email, and phone were also
  visible in Business info.
- Product status immediately after setup: 5 under review and 1 not approved.
  The single issue was **Image not processed**; Google said no action was needed
  and that the image would be processed again within 3 days. This remained the
  live status after the successful feed refresh on 2026-09-01; **Pending initial
  review** was also shown for the affected product.

### Production website

- The approved Arabic return policy is live at
  `https://seraj-store.vercel.app/returns`.
- Organization JSON-LD includes the confirmed legal identity and postal address.
- `MerchantReturnPolicy` JSON-LD mirrors the Merchant Center return settings.
- A production crawl on 2026-09-01 checked every one of the 56 sitemap URLs:
  all returned HTTP 200, had a non-empty title and description, used a
  self-referencing canonical, were indexable, exposed at least one valid JSON-LD
  block, and had no JSON-LD parse errors.
- The same crawl confirmed Product, Offer, BreadcrumbList, Article,
  CollectionPage, Organization, shipping, and return-policy structured data.
- All six Merchant feed images and the search-platform logo, icon, maskable,
  Apple touch, and 1200x630 social-card assets returned HTTP 200.
- `robots.txt` permits Google, Bing, `ChatGPT-User`, `OAI-SearchBot`, and
  `PerplexityBot` to crawl public pages while keeping admin and API paths out of
  search. `GPTBot` and `Google-Extended` remain blocked from training use by
  deliberate policy; this does not block Google Search AI inclusion.
- Production build, targeted ESLint, desktop rendering, and 320px no-overflow
  checks passed for the policy release merged in PR #48.

## Content rollout implementation status (2026-09-02)

Implemented on branch `codex/seo-content-implementation` (not yet deployed;
production state above predates this work). Verified with `npm run build`,
targeted ESLint (`npx eslint public/app.js`: 0 errors, 30 pre-existing
warnings), product catalog contract tests (6/6 pass), DOM-based visual checks
at 1280px and 320/360/390/430px (no horizontal overflow), valid JSON-LD,
self-canonicals, and no broken internal links across the touched pages.

Published code changes (visible after deploy):

- New canonical page `/how-personalized-stories-work` (how-it-works,
  WebPage + BreadcrumbList JSON-LD, live price from the products API).
- New canonical page `/personalized-gifts-for-children` (gifting, dedication,
  direct delivery; explicit note that personalized items have different
  return conditions with a link to `/returns`).
- `/product/custom-story` now uses the strategy title/H1, adds a confirmed
  facts section, buyer-supply summary, visible FAQ, and internal links to the
  two new pages and `/returns`.
- `/category/personalized-stories` copy now states the owner-confirmed offer
  (guardian-led story, character sheet, approval sample, dedication, direct
  delivery) with related-links nav; other categories unchanged.
- `/about` (Next.js and SPA banner) updated with the positioning and links.
- SPA homepage hero (heading, supporting copy, primary/secondary CTAs, four
  proof points), title/meta/OG wording, wizard "how it works" accordion
  (now six confirmed steps), custom-story zigzag steps, success-page wording
  ("عينة الشخصية" instead of "البروفة"), showcase section, and footer links
  to the new pages.
- `public/app.js` fallback `custom-story` record and
  `src/lib/seed/contentDefaults.ts` hero/showcase defaults aligned with the
  strategy; sitemap includes the two new routes.
- Shared confirmed facts centralized in `src/lib/personalizedStoryContent.ts`
  to keep all pages consistent.

Required follow-up after merge/deploy (owner/admin action):

- Update `SiteContent` via `/admin/content`: the live DB values for
  `hero.title`, `hero.cta_primary`, `hero.cta_secondary`, and
  `showcase.cat2.title`/`showcase.cat2.desc` still override the new defaults
  with the old hero wording until updated. Code defaults are ready.
- Resubmit/refresh the two new URLs (sitemap already lists them; consider
  IndexNow per the strategy) only after production HTML is verified.

Intentionally not implemented (blocked, see SEO-CONTENT-STRATEGY.md gates):

- `/child-photo-privacy`: requires owner-confirmed storage/retention/deletion
  facts; the wizard photo note keeps its existing production wording until
  the policy is approved.
- Evidence gallery, before/after resemblance examples, and first-hand case
  study: require approved visual assets and guardian consent.
- Buyer's guide and any landing pages for extra goals/occasions: require
  confirmed package specifications (page count, materials, production time,
  revision rounds) that are still pending owner confirmation.
- No new FAQPage or HowTo markup was added (per strategy guidance); FAQ
  content is visible text only.

## Unfinished work

### Near-term business-data revision

The owner wants the legal and customer-service details reviewed and updated in
the near future. This is intentionally unfinished.

1. Ask the owner for the current complete registered address, especially the
   building number and unit/floor if applicable.
2. Reconfirm the legal name, postal code, customer-service email and phone,
   shipping price and threshold, delivery promise, return window, refund time,
   and treatment of personalized products.
3. Update Google Merchant Center under **Settings → Business info** and
   **Products & store → Shipping and returns**.
4. Synchronize `src/lib/commercePolicies.ts`, `public/index.html`, and every
   affected policy/contact page.
5. Run targeted ESLint and `npm run build`, deploy, and verify the production
   HTML and JSON-LD before considering the update complete.

### Merchant Center follow-up

- On or after **2026-09-04**, check whether the image-processing issue cleared.
  If it remains, identify the affected product, verify the image URL returns
  HTTP 200 with a supported image content type, confirm crawler access and image
  dimensions, then refresh the feed after any fix.
- The production feed associates `story-khaled`, `custom-story`, and
  `hero-conqueror` with the `books-personalized` exception. Reconfirm this after
  any future feed or policy change; the remaining products must continue using
  the default policy.
- Re-read the status of all 6 products. Do not assume an item still under review
  or rejected has the same reason recorded above.

### Search indexing follow-up

- Monitor the Search Console validation started on 2026-09-01 for the 9
  discovered-but-not-indexed URLs. Use individual priority URL requests only
  after Google's daily quota resets and only where the live inspection still
  shows that a request is useful.
- Re-check page indexing, rich-result eligibility, and any new enhancement,
  security, or manual-action report after Google refreshes the dated report.
- Confirm Bing's imported property reports finish processing after the stated
  48-hour window, then retain evidence of any URLs that remain excluded.

### AI-search discoverability follow-up

- Re-audit that public product, category, article, about, contact, shipping, and
  return pages are crawlable and contain useful visible Arabic text.
- Verify Organization, Product, Offer, Breadcrumb, Article, shipping, and return
  structured data against the production output.
- Evaluate an optional `/llms.txt` only against a concrete consumer or platform
  requirement. It is not currently present and must not be presented as a
  guaranteed ranking signal.
- Keep claims about AI visibility evidence-based. Record the engine, query,
  country/language, date, and observed result for every visibility test.

## Completion rule for future agents

An external-dashboard task is complete only when the saved state is visible on
the correct account and the corresponding production source matches it. Record
the verification date and any review or processing delay. Never report a queued,
under-review, or quota-limited state as approved or indexed.
