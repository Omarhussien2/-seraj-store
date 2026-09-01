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

- The property is verified under the correct Google account.
- `https://seraj-store.vercel.app/sitemap.xml` was submitted successfully.
- The last observed report showed 56 sitemap URLs, with 40 indexed and 10 not
  indexed. Re-read the live report before quoting these numbers.
- Manual indexing requests reached Google's daily quota on 2026-09-01. This was
  a quota response, not a page failure.
- The obsolete `samawah.pod@gmail.com` user and its verification token were
  removed. Do not restore them.

### Bing Webmaster Tools

- The property was imported from Search Console under the correct account.
- Only `https://seraj-store.vercel.app/sitemap.xml` should remain as the sitemap;
  an invalid root-URL submission was removed.
- All 56 URLs known on 2026-09-01 were submitted through URL Submission. Check
  the live sitemap processing and indexing state before reporting completion.

### Google Merchant Center

- Account setup is complete.
- Product source: `https://seraj-store.vercel.app/merchant-feed.xml`
- The feed contained 6 products when last checked.
- Shipping for Egypt: 40 EGP, free from 500 EGP, estimated 5–7 business days.
- Standard return policy: **Standard for Egypt**, 14 days, new products only,
  by mail with a free electronic return label, no restocking fee, and 7-day
  refund processing time. It was verified on 2026-09-01. Google policy ID:
  `9298593099`.
- Books and personalized stories use the `books-personalized` exception. It
  accepts defective-product returns and exchanges only. Google exception ID:
  `9298594050`.
- Business address and customer-service details were saved on 2026-09-01.
- Product status immediately after setup: 5 under review and 1 not approved.
  The single issue was **Image not processed**; Google said no action was needed
  and that the image would be processed again within 3 days.

### Production website

- The approved Arabic return policy is live at
  `https://seraj-store.vercel.app/returns`.
- Organization JSON-LD includes the confirmed legal identity and postal address.
- `MerchantReturnPolicy` JSON-LD mirrors the Merchant Center return settings.
- Production build, targeted ESLint, desktop rendering, and 320px no-overflow
  checks passed for the policy release merged in PR #48.

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
- Confirm the refreshed feed associates `story-khaled`, `custom-story`, and
  `hero-conqueror` with the `books-personalized` exception. The remaining
  products must continue using the default policy.
- Re-read the status of all 6 products. Do not assume an item still under review
  or rejected has the same reason recorded above.

### Search indexing follow-up

- Retry priority URL indexing in Search Console after the daily quota resets.
- Re-check page indexing, sitemap discovery, rich-result eligibility, and any
  new enhancement or manual-action report.
- Confirm Bing finished processing the sitemap and retain evidence of any URLs
  that remain excluded.

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
