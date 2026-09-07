# Seraj consent-aware purchase measurement

Owner approved this design in conversation on 2026-09-07 and delegated
implementation with independent lead review. No storefront redesign.

## Required outcome

Measure the public shopping journey and confirmed paid purchases in the
existing GA4 property, connected to Merchant Center. Never treat an unpaid
order or a deposit selection as a completed paid purchase.

- GA4 measurement ID: `G-FZW3R2J7Y9`; property: `535560370`.
- Merchant account `5847247567` is linked, Active; auto-tagging is enabled.
- Both static SPA and Next public pages use one consent implementation.
- Explicit accept/reject choice in Arabic; default no analytics requests or
  identifiers. Provide a persistent way to change the choice. No admin tracking.
- Do not transmit names, contact details, addresses, photos, child attributes,
  free text, private route tokens, raw query strings, or raw referrers.
- Preserve only the bounded URL-safe Merchant `srsltid` measurement identifier
  in sanitized page locations after consent; arbitrary query parameters remain
  excluded. This keeps auto-tagging compatible with privacy filtering. Actual
  Merchant attribution still requires verification in Google after release.
- Track sanitized public page views, checkout start, and `order_submitted`.
  The last event uses only server-authoritative amounts and public catalog IDs.
- Consent-granted GA client/session IDs may accompany the order. No IDs are
  invented when Google is blocked, delayed, or the visitor rejects consent.
- Record `purchase` server-side at the first `fully_paid` confirmation, using
  order number as `transaction_id`, EGP, net item revenue excluding shipping,
  separate shipping, and server-priced items. Deposits are not purchases.
- Retain a durable pending event alongside the paid state. Atomic leases and
  sent markers prevent concurrent sends. Stable transaction IDs mitigate an
  ambiguous network retry; do not promise perfect distributed exactly-once.
- Analytics failure must not roll back or report failure for a saved payment.
  Authenticated manual retry is sufficient initially; no new paid scheduler.
- Browser withdrawal must also suppress unsent purchases from its saved orders.
  Persist a cryptographically random withdrawal capability before order
  attribution; store only its hash server-side. A bounded, rate-limited endpoint
  records durable revocations and removes matching saved attribution without
  returning order information. Retry failed withdrawal submissions until server
  acknowledgement. Reacceptance uses a new capability, not revived old consent.
  Clearing browser storage or changing devices may require contacting the store.
  Previously transmitted events are not deleted by this preference change.
- A server-only `GA4_API_SECRET` is required. Missing configuration reports
  blocked/not-configured and preserves pending work, never fake success.
- Timestamp purchase at payment confirmation, not order placement. Do not
  backdate stale events beyond Google's supported 72-hour window. Delayed
  payments may limit campaign attribution; no guarantee of perfect attribution.
- Refunds are not inferred from cancel/unpaid state: this codebase has no
  confirmed refund lifecycle. Document this boundary explicitly.

## Verification and release

Tests cover denial, acceptance, revocation for future tracking, SPA/Next page
coverage, hash navigation, no PII, failed orders, repeats/refresh, deposits,
fully-paid transitions, concurrent/retry behavior, safe failures, and admin
authorization. Unit tests use real logic, browser tests mock only external
services. Never create fake live orders or send fake live purchases.

Lead reviews the diff and runs build, targeted lint, and relevant tests.
External secret creation, hosting configuration, deployment, and real Google
receipt verification are separate recorded gates, not implied by local tests.
