# Seraj Store Agent Rules

This file is the local project contract for coding agents. Read it before
editing, reviewing, testing, or documenting this repository.

## Project Shape

- Customer frontend is a static Arabic RTL SPA in `public/` using vanilla
  JavaScript, not React.
- `public/app.js` owns hash routing, products, cart, checkout, wizard, group
  buys, and localStorage state.
- `public/index.html` owns the page shells and modals.
- `public/styles.css` owns the public design system and responsive behavior.
- Backend API routes live under `src/app/api/`.
- Admin UI lives under `src/app/admin/` and uses React client components.
- Read `AGENT-GUIDES.md` for deeper module-specific context.

## Guard Skills

The `amElnagdy/guard-skills` package is installed in Codex:

- `clean-code-guard` for production code changes.
- `test-guard` for test changes.
- `docs-guard` for documentation changes.
- `wp-guard` and `woo-guard` are available but normally not relevant to this
  repository unless WordPress or WooCommerce code is explicitly introduced.
- `seraj-store-guard` is the project wrapper that applies those guards to this
  repository's specific risks.

Use `seraj-store-guard` as the default review pass after meaningful changes.

## Public SPA Invariants

- Preserve hash routes such as `#/home`, `#/products`, `#/cart`, `#/checkout`,
  and `#/group-buy/:code`.
- Preserve localStorage keys: `seraj-cart`, `seraj-wizard`, and
  `seraj-group-buy`.
- Prefer delegated event listeners for dynamic or late-rendered DOM.
- New non-submit buttons should use `type="button"`.
- Modals should close through their close button, backdrop when appropriate,
  and Escape when they behave like dialogs.
- Mobile fixes must be checked for horizontal scrolling at 320px, 360px,
  390px, and 430px widths.

## Backend Invariants

- Client-side prices are display convenience only; order totals are recalculated
  server-side from database products.
- Public endpoints must keep Zod validation and rate limiting where present.
- Admin list/update routes must keep `requireAdmin()` or equivalent auth.
- Do not expose secrets from `.env.local`.

## Verification Defaults

- Run `npm run build` after production code changes.
- Run targeted linting such as `npx eslint public/app.js` after public SPA edits.
- Use Playwright or equivalent browser checks for product pages, modals, cart,
  checkout, and mobile overflow work.
- If full `npm run lint` reports unrelated legacy issues, mention them clearly
  instead of changing unrelated code.
