# Seraj Store SEO, Search, Merchant, and AI Discovery Handoff

Read this file before any work involving SEO, structured data, Google Search
Console, Bing Webmaster Tools, Google Merchant Center, product feeds, crawler
access, search-platform logos, or AI-search discoverability.

For customer-facing positioning, content architecture, search intent, evidence
requirements, and the owner-confirmed personalized-story workflow, read
`SEO-CONTENT-STRATEGY.md` in full before drafting or changing public copy.

Last verified: **2026-09-03, Africa/Cairo**. External dashboards change over
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
- On 2026-09-03, `/how-personalized-stories-work` was still unknown to Google.
  Its indexing request again reached the daily quota, so no request was accepted
  and `/personalized-gifts-for-children` was not attempted that day. Retry the
  two URLs individually on or after 2026-09-04.
- On 2026-09-03, the report remained at 40 indexed and 10 not indexed; validation
  for the 9 discovered-but-not-indexed pages remained **Started**. Manual Actions
  and Security Issues both still reported **No issues detected**.
- On 2026-09-03, `/sitemap.xml` still showed **Success**, last read on 2026-09-01
  with 56 discovered pages. Search Console also retained an old invalid `/`
  submission dated 2026-07-04 with 1 error; this is separate from the valid
  sitemap.
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
- PR #53 added two SEO landing pages, bringing the production sitemap to 58
  URLs. A production crawl on 2026-09-02 checked all 58:
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
- Production build, targeted ESLint, desktop rendering, and mobile no-overflow
  checks at 320px, 360px, 390px, and 430px passed for the PR #53 release.

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
- Retry `/how-personalized-stories-work` first on or after 2026-09-04. If Google
  accepts it, request `/personalized-gifts-for-children` separately and confirm
  each acknowledgement. If the quota message recurs, do not retry again that day.
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

## Follow-up evidence: 2026-09-06 (Africa/Cairo)

This section records a new public-production check only. It does not refresh
the dated external-dashboard observations above.

- The live sitemap contained 59 URLs. A read-only HTTP crawl checked all 59:
  59 returned HTTP 200, non-empty titles and meta descriptions,
  self-referencing canonicals (URL-decoded, trailing slash normalized), and at
  least one parseable JSON-LD block, with zero JSON-LD parse failures.
- No `noindex` was detected in the checked robots/Googlebot meta tags or
  `X-Robots-Tag` response headers. These checks establish technical signals,
  not actual index inclusion, content quality, or rich-result eligibility.
- The public `/app.js` still contains the Google Customer Reviews integration:
  it queues the successful order response's `googleCustomerReview` payload,
  loads Google's `platform.js`, and calls `surveyoptin.render`. A real
  production opt-in and subsequent survey delivery remain unverified; do not
  create fabricated orders or reviews to test them.
- Browser inventory returned no available browsers; the subsequent attempt to
  open Search Console returned `No browser is available`. Merchant approval,
  the current `FROG` issue, Google indexing/validation, and Bing processing
  were therefore not inspected. Do not describe them as unchanged or resolved.
- Next required action: restore browser access and sign in to the relevant
  dashboards as `hussien.impression@gmail.com`; verify the visible account
  before reading or changing anything. Then resume the pending dashboard
  checks above, using their live results rather than the old counts.
- No production code, platform submissions, or automation settings were
  changed in this follow-up. Existing local handoff edits were preserved.

## Merchant and Analytics verification: 2026-09-07 (Africa/Cairo)

This dated observation supersedes the older Merchant product-review state,
not the older Search Console or Bing reports.

- The visible Google account was `hussien.impression@gmail.com` in both
  Merchant Center and Analytics. Merchant Center account `5847247567` showed
  6 approved products, 0 limited, 0 not approved, and 0 under review.
- Merchant Center auto-tagging was enabled. After the owner explicitly
  approved data sharing, GA4 property `seraj-store` (`535560370`) was linked.
  The confirmation stated that Google Analytics had been linked; after
  refreshing conversion sources, the saved row showed **Active**, attribution
  **Data driven**, and lookback window **90 days**.
- Analytics account `393345334`, web stream `14787160307`, and measurement ID
  `G-FZW3R2J7Y9` were confirmed in the UI for
  `https://seraj-store.vercel.app/`. The stream reported data collection active
  in the past 48 hours. Do not confuse this property with the separate
  `seraj` property `535567527`, which was not linked or changed.
- The code audit was delegated to one native `gpt-5.6-luna` worker and checked
  independently against the newer clone at commit `089da90`. The existing tag
  is in `src/app/layout.tsx`; `public/index.html` and `public/app.js` do not
  contain the corresponding GA4 initialization or checkout events. The root
  rewrite serves the static SPA, so the Next layout is not sufficient coverage.
- Order creation initially saves `paymentStatus: "unpaid"`. Both full and
  deposit payment modes exist, and admin updates can set `fully_paid`.
  Therefore an order-submission event must not be presented as confirmed paid
  revenue. Purchase-event implementation, consent behavior, attribution,
  duplicate prevention, and end-to-end validation remain pending; the active
  platform link alone does not establish working purchase measurement.
- No production code or Analytics collection settings were changed in this
  session. No new Analytics property or Measurement Protocol secret was created.

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

## Conversion production release verified: 2026-09-07 (Africa/Cairo)

This is the latest state and supersedes earlier uncommitted/not-deployed
conversion checkpoints. Implementation PR #62 was merged and published:
https://github.com/Omarhussien2/-seraj-store/pull/62

- Production commit: `7d9cc66a402538898d545f8f7aa6d4613cbd5e5a`.
  Vercel Production Deployment `3ugVPzy53bJFN7HkBpgnDhEkncFd` was visibly
  Ready in the correct Seraj project, on the public `seraj-store.vercel.app`
  alias. It was a fresh master build, not promotion of a Preview artifact.
- Live verification exited 0: four published assets match the accepted source;
  59 sitemap pages passed basic SEO/HTTP checks; Merchant feed has six products;
  anonymous retry is 401 and foreign-origin withdrawal is 403. An isolated
  fresh browser produced zero Google analytics requests before/after rejection
  across the homepage and `/about`; no attribution was returned.
- Final local acceptance: 18 consent/purchase/real-Mongo, 17 existing contract
  and 17 intercepted browser tests passed (52 distinct cases). Build passed
  including TypeScript and 21 static pages. Zero lint errors; 30 existing SPA
  warnings remain. Initial typing failure and its repair are recorded in the
  implementation report; no checks were disabled.
- Durable post-deployment evidence is recorded on the merged PR:
  https://github.com/Omarhussien2/-seraj-store/pull/62#issuecomment-5570954123
- No real orders were created and no fake live Google events were sent. Local
  Next and Mongo test servers were stopped. The ignored portable Mongo runtime
  and disposable data directory remain available; no user data was removed.
- STILL OPEN: verify the first legitimate consented, fully-paid purchase in the
  existing GA4/Merchant reports. Deployment and HTTP transport acceptance alone
  do not establish Google receipt, attribution or improved rankings. Do not
  mark this gate complete or send fake purchases to satisfy it.
- Keep the conversion worktree (`codex/conversion-tracking`, commit `2ceb621`)
  and other agents' edits. These post-release handoff notes are local additions;
  the code/test/documentation implementation is merged, and the verification
  comment above is the published release record.
