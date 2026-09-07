# Seraj Conversion Tracking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkbox syntax.

**Goal:** Implement consent-aware journey measurement and truthful paid purchases in the linked GA4 property.

**Architecture:** A shared public script owns consent and sanitized client events. Order documents retain consented attribution and durable purchase-delivery state; an authenticated server sender claims pending events and uses GA4 Measurement Protocol. No tracking runs on admin pages.

**Tech Stack:** Existing vanilla JS SPA, Next.js 16, Mongoose, Zod, Node test runner/tsx, Playwright; no new dependencies.

**Spec:** `docs/superpowers/specs/2026-09-07-conversion-tracking-design.md`

## Global Constraints

- Measurement ID `G-FZW3R2J7Y9`; currency `EGP`; no new GA4 property.
- Preserve user edits, hash routes, cart/wizard keys, rate limits, server prices, and admin auth.
- No secrets read or written by delegate, no real orders, no live analytics events.
- Delegate does not commit, push, deploy, or recursively delegate. Lead owns integration and release.
- Default no analytics before consent. Never serialize arbitrary order/customer objects.
- Purchase requires first fully-paid confirmation, not POST success or deposit selection.
- Worker owns files below only; lead owns this plan, spec, and SEO-HANDOFF.md.

### Task 1: Consent and browser journey

Files: create `public/analytics.js`, `public/analytics.css`, `tests/conversion-tracking.spec.js`; modify `public/index.html`, `public/app.js`, `public/sw.js`, `src/app/layout.tsx`.

Interface: expose `window.SerajAnalytics` with `trackCheckout()`,
`trackOrderSubmitted(summary)`, and async `getAttribution()` (bounded timeout,
returns undefined without granted consent or available Google identifiers).
Attribution shape: `{ consent: true, clientId: string, sessionId: string,
consentToken: string }`. The random browser token is a withdrawal capability,
not a Google identifier; only its SHA-256 hash may be stored with the order.

- [ ] Add behavioral browser tests first. Intercept Google's loader/network; test public SPA and a Next page. Reject/absence must produce zero analytics traffic; accept must load only once. Revoke must stop subsequent events. Assert at 320/360/390/430px no banner overflow.
- [ ] Run `npx playwright test tests/conversion-tracking.spec.js`; record expected failures before implementation.
- [ ] Implement shared loader/choice UI and replace the unconditional Next gtag block. Both entry points reference the same public script and CSS. Preserve layout outside the small consent controls.
- [ ] Set ad storage/user data/personalization denied; never add advertising tracking. Suppress auto page view and use sanitized locations/titles/referrers; exclude `/admin`, private hash identifiers and unknown free-text route segments. Audit enhanced measurement interactions to avoid duplicate/history/form leakage; record any required GA UI setting.
- [ ] Integrate checkout and successful order callbacks without blocking checkout if Google fails. Send order summaries from the new server response, not customer-supplied item names. Bounded same-order markers prevent repeat `order_submitted`; never emit browser `purchase`.
- [ ] Re-run browser tests and targeted ESLint. Record results and remaining UI gates.

Example acceptance assertion (derive fixture values manually):

```js
expect(googleRequests).toHaveLength(0); // after reject, checkout and route change
expect(events.filter(e => e.name === 'purchase')).toHaveLength(0);
```

### Task 2: Attribution and paid purchase delivery

Files: modify `src/app/api/orders/route.ts`, `src/app/api/orders/[id]/route.ts`, `src/lib/models/Order.ts`, `.env.example`; create `src/lib/analyticsPurchase.ts`, `src/app/api/admin/analytics/retry/route.ts`, `tests/analytics-purchase.test.ts`.

Interface: optional validated `analyticsAttribution` in order creation. Return
`analyticsSummary` built from priced order items (IDs, quantities, prices,
net item value, shipping, currency, transaction ID); no customer or story data.
Expose `deliverPendingPurchases()` server-side for the payment hook and admin
retry route; results distinguish not-configured, delivered-to-transport,
pending/retryable, and skipped states.

- [ ] Write behavior tests first using real Mongoose documents for payload construction and a boundary fake only for external HTTP/clock. Name concurrent lease tests as integration checks if a real isolated test DB is unavailable; do not claim mock queries prove atomicity.
- [ ] Run `npx tsx --test tests/analytics-purchase.test.ts` and capture expected RED.
- [ ] Validate optional identifiers strictly and bound lengths; unconsented identifiers are not saved. Existing requests without analytics remain valid. Return sanitized summary from server-priced products, using no free-text fields.
- [ ] In the existing paid-state update, atomically retain pending purchase state when eligible, never reset a sent record. Claim work with an atomic lease/token and finite timeout. Recover expired leases. Use paid-time and stable transaction ID, and check current consent/payment/cancel status before delivery.
- [ ] POST fixed Google endpoint with server-only `GA4_API_SECRET`, bounded timeout, schema-valid payload, ad personalization denied. Never log secret URL or payload. Missing secret makes zero requests. HTTP success means transport acceptance only; malformed/4xx vs retryable failures must be distinguishable.
- [ ] Authenticated POST retry processes a small bounded batch, retains requireAdmin and appropriate rate limiting. No public purchase/retry mutation endpoint or automatic new scheduler. The bounded, capability-authenticated consent withdrawal endpoint is the sole new public mutation. Payment errors remain separate from analytics-delivery errors.
- [ ] Re-run tests, including net revenue/shipping, deposit/unpaid/cancel skips, fully-paid event, stable transaction ID, no PII, timeout/failure isolation, missing-secret behavior, and retry auth. Record live credential and Google receipt checks as pending.

Example expected payload for two 100 EGP items with 20 EGP item discount and 40 EGP shipping:

```ts
assert.equal(purchase.events[0].params.value, 180);
assert.equal(purchase.events[0].params.shipping, 40);
assert.equal(purchase.events[0].params.transaction_id, 'SRJ-TEST-1');
assert.equal(JSON.stringify(purchase).includes('child-photo'), false);
```

### Task 3: Integrated acceptance and handoff

Files: existing tests as above; lead-owned `SEO-HANDOFF.md` and this plan.

- [ ] Run `npm run build`, targeted lint, new tests, existing product/Google Reviews tests, and browser checks once integrated. Do not read production DB credentials for tests.
- [ ] Review changed files only against clean-code-guard, test-guard and seraj-store-guard. Verify no duplicate tag/PII/private-route leakage and no new dependency.
- [ ] Record actual results, unresolved integration checks, UI/secret prerequisites, and deployment state. Do not mark purchase tracking operational until a legitimate event is verified in Google.

## Execution ledger

- Baseline: `089da908d84e2296c70caaebebd62b50ac4d69a7`; isolated branch `codex/conversion-tracking`.
- Owner explicitly requested one delegate plus lead review to conserve tokens; use the same existing worker for the coupled implementation, no additional review agents.
- Task 1 / Task 2 share the attribution/summary interface above: implement serially in one worker, no parallel file writes.
- Task 1 tests and code agree on default-denied and no browser purchase. Task 2 tests and code agree on full payment and server values. Task 3 does not substitute local checks for production receipt.
- Plan approval: owner's approved chat design, 2026-09-07. No additional design approval gate; implementation proceeds.
- First implementation: gpt-5.6-luna produced an incomplete draft; its three unit checks passed, but lead review found an in-memory lease helper and missing production verification. Draft preserved, worker stopped, not accepted or published. Usage/cost unavailable.
- Repair: one gpt-5.6-sol worker (high effort for cross-file payment, consent and retry correctness) replaces the stopped worker. Same isolated worktree and file ownership; no simultaneous writers. Dependencies installed successfully (770 packages). Lead retains independent review. Credentials and release remain separate gates.
- Lead review refinement: retain only bounded Merchant `srsltid` after consent while removing other query data; stripping it together with private fields would undermine the approved auto-tagging workflow. Source: https://support.google.com/merchants/answer/15191080?hl=en . Add a mixed sensitive-query/allowed-identifier regression check; production attribution remains unverified.
- Final local ownership: Sol completed the backend and `public/app.js` interface; lead completed `analytics.js`/CSS, browser verification, and integration review. The first draft's test-only Map lease was removed. The lead fixed the numeric MP timestamp type and bounded session IDs.
- Local acceptance evidence: 16/16 combined unit/contract cases, 13/13 intercepted browser cases (external-server rerun exit 0), targeted ESLint 0 errors/30 legacy warnings, `npm run build` exit 0. Read `docs/conversion-implementation-report.md` for exact commands, initial failures, the Windows harness teardown workaround and test isolation.
- Not released: no commit, push, merge or deployment. Real Mongo concurrency/lease tests, withdrawal handling for stored consent snapshots, Enhanced Measurement configuration, server secret and actual Google receipt remain gates. Do not mark the SEO goal or live purchase tracking complete from these local checks.

### Release continuation, 2026-09-07

- Owner explicitly approved continuing and publishing. Enhanced Measurement OFF
  and the Production-only Vercel secret were verified before this continuation.
- Lead reran the six purchase unit cases and six real local Mongo integration
  cases: both runs passed with exit 0. Withdrawal changes are not covered by
  these baseline results and must pass their own checks before release.
- Ruling: extend withdrawal to unsent saved orders using a random browser
  capability, hashed server-side with durable revocation records. This closes
  the saved-snapshot privacy gap; it does not delete events already sent to
  Google, and an outbound request already in flight cannot be recalled.
- Ruling: keep one existing implementation worker and independent lead review,
  following the owner's explicit cost/coordination preference. No additional
  reviewer agents or concurrent edits to implementation files.
- Lead restricted Playwright output to `.conversion-test-results/playwright`
  so test startup cannot clear the sibling portable Mongo runtime/database.
- Production preflight: 59 sitemap pages passed basic HTTP/title/description/
  canonical-presence and noindex checks; Merchant feed returned 200 with six
  products. This is not a full ranking, rich-result or Google receipt test.

- Task 1: complete. Final intercepted browser suite 17/17, including saved-token
  retry after failed queue persistence; scoped client lint clean and mobile QA
  inspected.
- Task 2: complete. Final 18/18 consent/purchase/real-Mongo checks passed; schema
  correction preserves true-only consent, required hash and hidden attribution.
- Task 3 local acceptance: complete. Existing 17 finance/catalog/GCR/SEO contract
  checks passed; final `npm run build` exit 0 including TypeScript and 21 static
  pages. Full changed-file lint zero errors/30 existing warnings, scoped final
  schema/test lint clean. Publication and legitimate Google receipt are distinct
  external checks, not inferred from these results.
