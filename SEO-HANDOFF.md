# Seraj Store SEO, Search, Merchant, and AI Discovery Handoff

Read this file before any work involving SEO, structured data, Google Search
Console, Bing Webmaster Tools, Google Merchant Center, product feeds, crawler
access, search-platform logos, or AI-search discoverability.

For customer-facing positioning, content architecture, search intent, evidence
requirements, and the owner-confirmed personalized-story workflow, read
`SEO-CONTENT-STRATEGY.md` in full before drafting or changing public copy.

Last follow-up: **2026-09-06, Africa/Cairo** (see dated update below). External dashboards change over
time. Treat counts below as dated observations, not permanent facts.

## Follow-up on 2026-09-06

### Individual article SEO update completed

At **14:07 UTC**, all 40 pre-existing articles received individually reviewed
titles, SEO titles, descriptions, excerpts, introductions and related links.
Three Codex subagents reviewed four batches after Antigravity's headless command
permission failed; Codex reviewed and applied the final proposals. This was a
delegation-tool limitation, not a Google Search restriction.

- Published 80 related-article links and 109 heading edits. Added one contextual
  product link to `/product/FROG` in article 6 and one category link to
  `/category/educational-games` in article 22. Shared store-category links and
  the product links in the existing buyer guide remain available.
- Removed draft remnants from article 20 and the exact duplicated article 34
  text appended to article 33. The standalone article 34 remains published.
- An atomic database update changed only five editorial fields and `updatedAt`.
  Verification matched all 40 revisions exactly and confirmed all other fields
  and the previously published buyer guide were unchanged: 41 articles total.
- All 40 production pages passed HTTP 200, title/H1/description/canonical,
  indexable metadata, introduction, internal-link and JSON-LD checks. Both
  commerce destinations returned 200. Browser verification found the product
  and related links; article 6 had no overflow at 320/360/390/430px.
- Build, targeted ESLint and four targeted tests passed. The middleware
  deprecation warning is existing project debt.

The repeat-safe publisher is `scripts/apply-article-seo.ts`; reviewed values are
in `content/seo-articles/editorial-revisions.json`. See
`docs/seo-article-review-2026-09-06.md` for the per-article record and remaining
source/medical-content review concerns. This batch did not comprehensively
fact-check existing advice, create external backlinks, or establish new Google
indexing/ranking results. Do not repeat the quota-limited indexing request today.

### Production release completed

The owner approved deployment and article publication on 2026-09-06. PR #59
was squash-merged as `4781371c379eedfd0f962dffa762b21a59ef0909`. Vercel
deployment `GAwnch8eXophBpWFfuBNSRPgS6Vh` completed successfully, and the
production homepage serves the broader store title and `hero.store_*` markup.

- Published `/article/choosing-childrens-stories-and-games` through the reviewed
  insert-only script after deployment. The article is now live, not a draft.
- After a dry run and catalog identity check against all six active product
  slugs, inserted only `hero.store_title` and `hero.store_subtitle` in
  SiteContent. Other CMS keys and product data were not modified.
- A production crawl at **2026-09-06 12:07 UTC** verified all **59 sitemap URLs**:
  HTTP 200, non-empty titles/descriptions, self-canonicals, indexable metadata,
  and parseable JSON-LD. The new guide is included in the sitemap.
- Verified the guide is linked from `/mama-world` and all three canonical
  categories, and all 13 distinct normal-path links in the guide return 200.
  There are now 41 published articles.
- Opened the published article in the browser and checked headings, complete
  content and links. It has no horizontal overflow at 320/360/390/430px.
- Search Console's daily quota was already exhausted earlier today. No further
  manual indexing request was made. Publication and sitemap inclusion do not
  establish that Google has indexed the new guide.

The pre-release notes below are retained as history. Deployment and guide
publication are complete; the remaining editorial topics require the evidence
listed in `docs/seo-editorial-plan-2026-09-06.md` before drafting/publishing.

Verified in the browser under `hussien.impression@gmail.com`:

- Merchant Center account `5847247567` reports **6 approved**, **0 limited**,
  **0 not approved**, and **0 under review**. The previous product-review/image
  issue is no longer reflected in the current product-status totals. The
  overview also reports 8 total clicks over the last 28 days.
- Search Console reports **40 indexed**, **10 not indexed** (9 discovered but
  not indexed; 1 alternate canonical). The report's own last update is
  **2026-08-28**. Validation for the 9 URLs is still **Started**.
- Individual inspection of `/how-personalized-stories-work` says **URL is
  unknown to Google**. One indexing request on 2026-09-06 returned **Quota
  Exceeded**. No request was accepted. Do not retry today; the gifting page
  was not submitted after the quota response.
- Bing and Customer Reviews were not rechecked during this batch.

Pre-release preparation from `33cc7914be305d3c05b793ae16a58f2123cb8241`
(subsequently published in PR #59 as recorded above):

- Broad store homepage title/H1 and metadata covering children's stories,
  educational/Islamic games, and personalized stories. New `hero.store_*`
  keys prevent the old personalized-only CMS heading from returning.
- Canonical article pages now render full Markdown with headings, lists,
  crawlable links and separate source records; HTML and unsafe URLs are
  filtered by `react-markdown`. The 18-paragraph truncation is removed.
- `/mama-world` links all 40 currently published articles instead of 24.
  Article pages and the index link the three store categories. Categories
  show up to three published articles tagged with their canonical slug.
- Educational-games wording names the current Islamic puzzles and arithmetic
  game. Product facts, prices, availability and policies are unchanged.
- One reviewed guide and an eight-topic editorial queue are ready in
  `content/seo-articles/` and `docs/seo-editorial-plan-2026-09-06.md`.
  `scripts/publish-seo-guide.ts` is dry-run by default and only inserts a new
  article with `--apply`; it preserves an already-existing article.

Checks completed: build with the existing local environment loaded (no secrets
copied into this checkout); 12 targeted tests; 3 SEO Playwright tests; targeted
ESLint with 0 errors and 33 existing warnings; guide publication dry run with
no DB connection; live-data local browser checks of home, article index,
educational-games category and one full article, all HTTP 200 with parseable
JSON-LD/self-canonicals and zero horizontal overflow at 320/360/390/430px.
The initial build without environment variables stopped at environment
validation, before the successful configured build.

Delegation: Gemini `gemini-3.8-flash-medium` via Antigravity 1.1.27, analysis
only, exit 0. Correct account verified in the CLI log; `useAiCredits` was
false. Codex reviewed and revised the editorial proposal. The relay's
`readOnlyViolation` was null (unknown); the two context files retained their
hashes and no extra file appeared in the delegated context directory. Usage
cost was not reported.

Remaining search work: retry eligible indexing requests after the quota resets.
Use the production verification above for release status; local verification
alone is not proof of production publication or search ranking.

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
- Google Customer Reviews order payload and delivery-date calculation:
  `src/lib/googleCustomerReviews.ts`
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
- On 2026-09-02 the correct account was confirmed in the browser through
  `authuser=1`. URL Inspection reported
  `/how-personalized-stories-work` as **URL is unknown to Google**. The ensuing
  indexing request was rejected with **Quota Exceeded**, so neither new landing
  page was submitted to Google that day. The active search-monitor automation
  is instructed to retry both pages once on or after 2026-09-03 and to verify
  Google's acknowledgement for each request.
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
- On 2026-09-02, the two new production landing pages were submitted through
  URL Submission:
  `/how-personalized-stories-work` and
  `/personalized-gifts-for-children`. Bing confirmed **2 URLs submitted
  successfully**.
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
- Google Customer Reviews uses Merchant ID `5847247567`. The storefront
  integration asks for a validated customer email during checkout and renders
  Google's optional survey opt-in only after the order API confirms creation.
  The API supplies the authoritative order number, `EG` delivery country, and
  an estimated delivery date seven Egypt business days after purchase (Friday
  and Saturday excluded). The email is stored with the order for operations but
  is deliberately omitted from `seraj-last-order` in localStorage.
- The opt-in module is loaded directly from Google's `platform.js` on the order
  confirmation route; do not move it into Google Tag Manager. The customer sees
  a disclosure and Google receives the email only to offer the optional survey.
- The Google Customer Reviews badge is intentionally not shown yet. Add it only
  after Merchant Center has enough eligible ratings to display useful rating
  information; until then it can show that no rating is available.
- Verified on 2026-09-03 under `hussien.impression@gmail.com`: Google Customer
  Reviews appears in **Settings → Add-ons → Your add-ons** with a Remove action,
  confirming the add-on is active and the signed agreement is available. Its
  overview still reported no collected data immediately after deployment, as
  expected before a real customer accepts the survey opt-in; Google notes that
  reporting can take a few days to appear.
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
- PR #53 was squash-merged to `master` as commit
  `81d0c9fccb7cd673fca23f02b453cc2940873c03` and deployed successfully to
  production on 2026-09-02.
- The production content migration was first run as a dry run, then applied.
  The new semantic homepage/showcase keys and approved `custom-story` copy are
  now present in the database. Price, availability, and media were deliberately
  left unchanged; the live custom-story price remained `310 EGP`.
- A fresh production crawl on 2026-09-02 checked all 58 current sitemap URLs.
  Every URL returned HTTP 200, had a non-empty title and meta description, used
  its own canonical URL, exposed at least one parseable JSON-LD block, and had
  no crawl failures.
- Production browser verification confirmed the homepage H1, semantic CTA
  labels/destinations, custom-story showcase, and approved SPA product copy.
  Horizontal overflow remained zero at 320, 360, 390, and 430px.
- `/api/products` and `merchant-feed.xml` expose the approved custom-story
  title and description while retaining the live `310 EGP` price.
- Google Customer Reviews was deployed through PR #57, squash-merged as commit
  `ec2ae33aa5597e616e230244e00c815e94aefc66` on 2026-09-03. Vercel reported the
  production deployment successful; direct production checks returned HTTP 200
  for `/` and `/app.js`, confirmed the HTML5 doctype, checkout email field,
  customer disclosure, and direct Google opt-in loader. The order summary kept
  in `seraj-last-order` does not contain the customer email.

## Content rollout implementation status (2026-09-02)

Implemented on branch `codex/seo-content-implementation`, merged in PR #53,
and verified in production on 2026-09-02. Pre-merge verification included
`npm run build`,
targeted ESLint (`npx eslint public/app.js`: 0 errors, 30 pre-existing
warnings), product catalog contract tests (7/7 pass), SEO content contract tests
(3/3 pass), SEO Playwright tests (3/3 pass), and the existing homepage ordering
test (1/1 pass). Browser checks cover 320/360/390/430px with no horizontal
overflow, valid JSON-LD, self-canonicals, semantic CTA destinations, and stale
CMS/product API responses. No broken internal links were found across the
touched pages.

Published code changes (live in production):

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
- SEO-critical custom-story wording is code-controlled in both the SPA and the
  canonical product page. Product API data continues to own price,
  availability, and media, but stale database copy cannot silently restore old
  positioning or unconfirmed claims in the storefront.
- The personalized-story hero and showcase use semantic CMS keys
  (`hero.story_*`, `hero.cta_custom_story`, `hero.cta_products`, and
  `showcase.custom_story.*`). This prevents the legacy positional keys from
  swapping CTA labels and destinations while rollout data is being migrated.

Completed rollout actions:

- `npm run migrate:seo-content` completed as a read-only production dry run,
  followed by `npm run migrate:seo-content -- --apply` after the output was
  reviewed. The command remains safe-by-default for future environments.
- The rendered homepage, `/api/products`, SPA and canonical custom-story pages,
  and `merchant-feed.xml` were verified after deployment. CTA destinations,
  synchronized product copy, and the unchanged live price were all confirmed.

Remaining external follow-up:

- Request indexing of `/how-personalized-stories-work` and
  `/personalized-gifts-for-children` in Search Console while signed in as
  `hussien.impression@gmail.com` after the daily request quota resets. The
  account is available through `authuser=1`; do not use the default
  `samawah.pod@gmail.com` session. Bing submission is complete. Both URLs are
  already present in the production sitemap and pass the technical crawl
  checks; Google indexing is an external processing step, not a code blocker.

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
- After the Google Customer Reviews release is live, place a genuine test order
  with a monitored inbox and confirm that the opt-in appears on the production
  success route. If the customer opts in, verify the survey timing after the
  estimated delivery date. Never use fabricated orders or reviews.
- Monitor Merchant Center for the first eligible store ratings. Reconsider the
  optional badge only when it can display useful rating information.

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

## Conversion implementation checkpoint: 2026-09-07 (Africa/Cairo)

- Scope: conversion tracking supplements the SEO goal; this is not a claim
  of improved rankings, complete indexing, or working live purchase delivery.
- Verified Google target: account `hussien.impression@gmail.com`, Merchant
  `5847247567`, GA4 property `535560370`, stream `14787160307`,
  measurement ID `G-FZW3R2J7Y9`. Merchant/GA4 link is Active and Merchant
  auto-tagging enabled. No other Google property/account was modified.
- Implementation is UNCOMMITTED and NOT DEPLOYED on branch
  `codex/conversion-tracking`, based on `089da90`, in the local worktree
  `D:/code - projects/seraj-store/.worktrees/conversion-tracking`.
  Do not remove this worktree or overwrite its changes. The main checkout's
  existing edits and the other SEO agent's clone were preserved.
- Read `docs/conversion-implementation-report.md` and the dated spec/plan
  under `docs/superpowers/` in that worktree before continuing. Shared
  consent-aware public tracking covers the SPA and Next public pages; no
  browser purchase is emitted. Server purchases require first fully-paid
  confirmation with stored consented attribution. Pending state is part of
  the same payment update; transport delivery uses bounded token/expiry leases.
- Independent local checks: 16 unit/contract tests passed; 13 browser tests
  passed with Google/checkout boundaries intercepted; build exit 0; targeted
  lint 0 errors (30 existing SPA warnings). Mobile screenshot inspected and
  overflow checked at 320/360/390/430px. No real orders or Google events used.
- RELEASE GATES: (1) isolated Mongo concurrency/lease integration, not mocked
  query assertions; (2) resolve/document withdrawal of already-saved order
  consent snapshots, since the browser button currently changes future client
  tracking only; (3) confirm Enhanced Measurement settings with the owner;
  (4) create/configure server-only `GA4_API_SECRET` securely; (5) separately
  authorize release and verify a legitimate paid order in GA4/Merchant.
- Enhanced Measurement remains in its previously saved ON configuration;
  the OFF confirmation was opened but not approved/confirmed. No Measurement
  Protocol secret was created. Never place secrets in chat, git or browser JS.
- HTTP 2xx from Measurement Protocol proves transport acceptance only.
  Missing secret preserves pending work; stale paid events older than 72 hours
  are not backdated. Refund events are out of scope without a real refund
  lifecycle. No scheduler/automation change was made in this implementation.

## Approved Analytics settings follow-up: 2026-09-07 (Africa/Cairo)

- The owner approved continuing the Enhanced Measurement and server-secret
  setup. The visible Google account was rechecked as
  `hussien.impression@gmail.com` for property `535560370`, stream `14787160307`.
- Enhanced Measurement was switched OFF and the saved OFF state was verified
  by closing and reopening the stream. This supersedes the ON/pending-approval
  checkpoint above; it is not evidence of purchase-event delivery.
- Measurement Protocol displayed no API secrets and required a User Data
  Collection Acknowledgement about end-user disclosures and rights. This agent
  did not accept that acknowledgement or create a secret. Verify the actual
  published disclosures and consent-withdrawal behavior before proceeding;
  owner approval to configure tracking does not establish those facts.
- The Vercel connector exposed only the unrelated Samawah team and was not used
  for mutations. Local project linkage identifies `seraj-store`, project
  `prj_p2FNZs8WEF8tEAqwVODIVfvAGFwm`, team `team_CPrxylwRcjjRd3nCtrblNKjk`.
  CLI identity verification failed on an OpenID network request. The browser
  opened Vercel's login page; correct-project login is required before safely
  configuring the server-only secret. Never paste the secret in chat or git.
- No secret, environment variable, deployment, live order, or live purchase
  event was created in this follow-up. Stored-order consent withdrawal and
  legitimate Google receipt verification remain release gates.

## Server-secret setup completed: 2026-09-07 (Africa/Cairo)

This checkpoint supersedes the login/secret blockers above, not the remaining
code release gates.

- After the owner completed Vercel sign-in, the browser showed
  `omarhussien2's projects` and the `seraj-store` project. General settings
  confirmed project ID `prj_p2FNZs8WEF8tEAqwVODIVfvAGFwm`. Its production
  deployment was Ready at commit `089da90`, matching the conversion worktree's
  baseline. No unrelated project or team was modified.
- The Google account was visibly rechecked as
  `hussien.impression@gmail.com`. Stream `14787160307` still showed Enhanced
  Measurement OFF. The secret screen now allowed Create without a Review terms
  prompt and initially contained no API secrets. This agent did not accept
  a data-collection acknowledgement or certify the site's disclosures.
- Created the Measurement Protocol secret named
  `seraj-server-purchase-production`. A delayed click result was reconciled
  against the saved row before taking further action; no duplicate was created.
- Saved that value as `GA4_API_SECRET` in Vercel's verified Seraj project,
  type **Secret**, environment **Production** only. The resulting row and
  successful-save notification were visible. The value passed only through
  private browser-runtime memory into Vercel; it was not printed in chat,
  written into code, or copied to a local environment file.
- Vercel explicitly says a new deployment is required for this configuration
  to take effect. No Redeploy, push, merge, or production event was performed.
  Secret provisioning is complete; purchase tracking is NOT operational yet.
- The delegated Mongo integration run remains unverified: the worker reports
  localhost Mongo readiness, but no completed test output before interruption.
  Read `docs/conversion-mongo-verification.md` in the conversion worktree.
  Its test server was stopped and disposable database removed by the worker;
  the ignored runtime/archive remain available. Do not count this as a pass.
- Remaining release gates: implement and verify withdrawal of saved-order
  analytics consent, confirm published disclosures match actual behavior,
  complete the isolated persistence tests, authorize deployment separately,
  then verify a legitimate paid order in Google. Existing configuration must
  not be confused with live receipt, attribution, or a ranking improvement.

## Conversion release gate: 2026-09-07 (Africa/Cairo)

This supersedes earlier code/configuration blockers. The owner explicitly
approved completing and publishing this change.

- Independent lead acceptance: 18 consent/purchase/persistence tests passed;
  the nine real-Mongo cases were rerun after the hidden-attribution assertion
  and passed again. Seventeen existing finance/catalog/GCR/SEO contract cases
  and seventeen intercepted browser cases passed. Final browser rerun: exit 0,
  18.4 seconds. No real orders or live Google events were generated.
- Saved-order withdrawal is implemented with a 256-bit browser capability,
  server-side SHA-256 hash, hidden order attribution and durable revocation
  records. It removes matching attribution and blocks unsent purchases. Failed
  withdrawal submissions retain their receipt and retry on public load/online;
  a retained token also survives failure to write the receipt queue. Reacceptance
  must not revive an old withdrawn consent period.
- Public Arabic disclosure describes pseudonymous identifiers, order numbers,
  public product IDs and amounts sent to Google; contact data, child photos and
  story details are excluded. Already transmitted data is not deleted by this
  preference change. Requests already in flight cannot be recalled. Clearing
  storage/changing devices may require contacting the store.
- Lead code/test/project guards found no remaining release-blocking issue.
  Targeted lint: exit 0, zero errors and 30 existing SPA warnings; final changed
  client/test lint: exit 0 with no output. Mobile widths 320/360/390/430 and
  short 320x568 viewport passed; the screenshot was inspected.
- Production preflight: 59 sitemap pages passed basic HTTP/title/description/
  canonical-presence/noindex checks; Merchant feed returned 200 with six items.
  This is not a full rich-result audit or proof of improved rankings.
- Correct Vercel Production is linked to GitHub master, previously at 089da90.
  A fresh Production build is required to consume the saved Production-only
  GA4_API_SECRET. Publication/result must be verified separately from these
  local checks. Follow the conversion pull request and latest checkpoint below.
- Final build gate passed: `npm run build` exit 0, including TypeScript and all
  21 static pages. An initial nested-schema typing failure was corrected and
  the 18 consent/purchase/Mongo cases passed again. No checks were disabled.
- Legitimate purchase receipt/attribution in GA4 and Merchant remains pending;
  never use fake live purchases to clear this gate. Google transport 2xx alone
  is not semantic receipt. No new scheduler, paid service or refund inference.
