# Conversion tracking implementation report

Implemented on the isolated `codex/conversion-tracking` worktree from production baseline `089da908d84e2296c70caaebebd62b50ac4d69a7`.

## Changed

- Added default-denied Arabic consent UI and a shared `public/analytics.js` loader for the static SPA and Next public pages; admin paths are excluded.
- Added sanitized hash-route page views, checkout start, and consent-gated `order_submitted` events. Browser purchase events are never emitted.
- Added optional validated consent attribution to orders and a server-built analytics summary from priced catalog items.
- Added a first-paid marker in the same Mongo update pipeline as the paid state,
  plus token-guarded leases, a three-attempt ceiling, and an authenticated,
  rate-limited retry endpoint. A retry invocation processes at most three
  distinct orders.
- Purchase payloads use `transaction_id` (order number), EGP, net item value excluding shipping, and do not infer refunds from cancellation.

## Verification

- `npx tsx --test tests/analytics-purchase.test.ts` — 6 passed, exit 0.
- `npx tsc --noEmit` — exit 0.
- Targeted backend/test ESLint — exit 0 with no output.
- `npx eslint public/app.js` — exit 0 with 30 pre-existing warnings and no errors.
- Lead combined unit run: `npx tsx --test tests/analytics-purchase.test.ts tests/product-catalog-contract.test.ts tests/google-customer-reviews-contract.test.ts` — 16 passed, exit 0.
- Lead intercepted browser run — 13 passed, exit 0 (17.6 seconds): nine conversion cases, three Google Customer Reviews cases, and home product order. The dedicated config uses port 3107 and disposable local-only environment values. On this Windows host the managed server teardown hung after all tests; an ignored external-server config reran the identical cases against that same lead-owned server and exited cleanly. The server was then stopped.
- Lead targeted ESLint — 0 errors; only the existing 30 `public/app.js` warnings. Mobile consent screenshot inspected; 320/360/390/430px overflow assertions passed.
- Lead `npm run build` — exit 0: compilation, TypeScript, generation of 21 static pages and final optimization completed. Run with disposable localhost-only environment values, not production credentials. Existing workspace-root and deprecated-middleware warnings remain.
- No credentials were read, no live Google requests were sent, and no real orders were created.

## Operating limits

Missing `GA4_API_SECRET` returns `not-configured` before claiming work or making
a request. Measurement Protocol HTTP success is transport acceptance, not proof
of GA4 semantic receipt. The initial query-construction check did not prove
Mongo atomicity; the six persistence cases subsequently passed on an isolated
localhost database (see the dated continuation below). Production database
testing was not attempted. Delayed payments older than 72
hours are retained as rejected rather than backdated or transmitted. Ambiguous
timeouts and retryable transport failures require the authenticated manual retry
path; rejected 4xx payloads are not retried blindly. Refund events require a
confirmed refund lifecycle, which this codebase does not currently expose.

Live receipt is not verified. Deployment, a legitimate paid order, and
verification in Google are distinct checks. On 2026-09-07 the lead
created the Google secret and verified `GA4_API_SECRET` saved in the matching
Vercel project as a Secret for Production only; no redeployment was triggered.
Enhanced Measurement was saved OFF and rechecked in the correct stream after
owner approval (see `SEO-HANDOFF.md`). No local test
establishes GA4 receipt, attribution classification, or production delivery.

## Initial lead review and historical blockers

- Shared browser measurements use coarse route groups and fixed titles, not private path segments, raw titles or arbitrary query text. Only bounded `srsltid` is retained from queries. Referrers are reduced to the origin of an explicit search/AI-source allowlist; other referrers are blank.
- Acceptance/rejection is persisted; the privacy button reopens the choice. Denial stops subsequent client events, and a blocked Google loader resolves attribution after 1.5 seconds without blocking checkout. The prompt is not shown unsolicited on cart, checkout, wizard, preview or success routes, and is dismissed when entering those routes, so it cannot cover order controls. This corrected a failure in the existing Google Reviews browser tests.
- `order_submitted` deduplication retains at most 50 order numbers per browser-tab session. No browser `purchase` event is emitted. Purchase timestamp is a numeric `timestamp_micros`, and session IDs are bounded to safely representable positive integers.
- The order retains a consent snapshot taken at submission. Changing the browser choice does not update that already-saved order snapshot. Before release, resolve/document how withdrawal requests suppress pending server-side purchases; do not promise that the browser button withdraws already-stored order consent or deletes previously sent data.
- No live Mongo concurrency/lease integration test was available. Docker discovery was attempted without a usable daemon response; no Docker service/container or production database was started or modified. Query-construction assertions are not proof of atomic database execution. Validate first-paid concurrency, lease expiry/recovery, and sent-marker preservation on an isolated database before release.
- Existing tracked test-result artifacts were restored after the first harness run. New output is isolated by `playwright.conversion.config.ts` in ignored `.conversion-test-results/`. The home product test now respects the configured base URL instead of hardcoding port 3000.
- Native delegates used: `gpt-5.6-luna` draft (not accepted), then `gpt-5.6-sol` backend repair, with lead-owned client completion and independent backend review. No concurrent writers shared files. Usage/cost were not reported.

## Follow-up verification attempt (2026-09-07)

- One Sol worker added `tests/analytics-purchase.integration.test.ts` for a
  dedicated localhost Mongo instance. The lead reviewed its database-target
  restrictions, real persistence assertions, and intercepted Google transport.
  Review requested a bounded concurrent test that keeps the first transport
  in flight until the second worker has proved it cannot claim the active lease;
  the test was amended accordingly. This is source review, not a passing run.
- A new lead `node node_modules/typescript/bin/tsc --noEmit` attempt produced
  no output for approximately five minutes and was cancelled. It is not a
  fresh passing typecheck and does not supersede the earlier build evidence.
- Core production-file hashes remained unchanged during this follow-up.
  New integration-test execution is still a release gate until completed
  output demonstrates success. No production database or Google transport was
  used for these attempts.

## Approved release continuation (2026-09-07)

- Owner explicitly authorized finishing and publishing. The initial blockers
  above are history, not the current source of deployment status; read the
  newest `SEO-HANDOFF.md` checkpoint for the actual release result.
- Lead baseline verification: six purchase unit cases passed (exit 0), followed
  by six real Mongo persistence cases (exit 0, 5.79 seconds) using the dedicated
  local database documented in `conversion-mongo-verification.md`.
- Seventeen existing finance, catalog, Google Reviews and SEO-content contract
  cases passed together (exit 0). Command: `node --import tsx --test
  tests/finance-calculations.test.ts tests/product-catalog-contract.test.ts
  tests/google-customer-reviews-contract.test.ts tests/seo-content-contract.test.ts`.
- Public production preflight checked 59 sitemap URLs: HTTP success, title,
  description, canonical presence and no meta noindex issues. Merchant feed
  returned HTTP 200 and six products. These are limited technical checks, not
  evidence of ranking, full structured-data validity or purchase receipt.
- Same Sol worker owns the coupled withdrawal implementation. Lead reviews
  independently, owns documentation and the final browser/build/release gate.
  No additional review agent was dispatched. Withdrawal validation and final
  integrated checks remain pending until recorded below.

### Final local acceptance

- Lead combined consent/purchase/Mongo run: **18 passed**, exit 0. The nine real
  Mongo cases were rerun after adding normal-query attribution hiding assertions:
  **9 passed**, exit 0 (2.09 seconds). Only outbound Google transport is replaced.
- Final intercepted browser suite: **17 passed**, exit 0 (18.4 seconds), including
  retained-token recovery when receipt-queue persistence fails and the first
  network attempt returns 503. Reload without reacceptance resubmits the same
  token; only explicit server acknowledgement clears it.
- Final targeted client/test ESLint: exit 0, no output. Full changed-file lint
  previously completed with zero errors and 30 existing public SPA warnings.
- Lead inspected the short-mobile screenshot. The consent panel stays on screen
  and scrolls internally when needed, with reachable accept/reject controls.
- The stored attribution is excluded from ordinary order queries. Withdrawal
  records store hashes, never raw browser capabilities; the dispatcher explicitly
  selects attribution and rechecks revocation before Google transport.
- Queue submissions are limited to 20 tokens with a five-second browser timeout.
  Failure leaves a durable receipt (or retained token) for public-load/online
  retries. Clearing storage/using another device can require contacting the store;
  events already sent or in flight cannot be recalled by this choice control.
- The owner authorized publication. Build and actual deployment outcome are
  recorded in the release checkpoint, separately from Google receipt validation.

### Build correction and final result

The first final build compiled but failed TypeScript on Mongoose's inferred
nested Boolean schema definition. The worker extracted an explicit attribution
schema with a true-only validator, preserving required hashes and hidden
projection. Test fixture/timer typing was corrected without disabling checks.
Lead review accepted this scoped fix; all 18 consent/purchase/Mongo cases passed
again (exit 0), and changed schema/test lint returned exit 0 without output.

Final `npm run build`: **exit 0**. Compilation, TypeScript, all 21 static pages
and optimization completed using disposable local-only environment values.
No production credentials were pulled for the build. Existing workspace-root
and deprecated-middleware warnings remain.
