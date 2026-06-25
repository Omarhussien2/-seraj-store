# Seraj Store - Maintenance Guide for Agents

This document is intended for AI coding assistants and agents maintaining this repository. It documents the core architecture, recent radical fixes, and important constraints that must be observed to prevent regressions.

## 1. Project Architecture (Vanilla JS SPA)
- The public-facing site is a Single Page Application (SPA) built with Vanilla JavaScript, NOT React.
- `public/index.html` holds the base layout, navigation, and static structural elements.
- `public/styles.css` holds all styling (no Tailwind CSS).
- `public/app.js` handles routing, data fetching, caching, DOM updates, and animations.
- The Admin dashboard (`/src/app/admin`) uses Next.js and React. Do not confuse the two environments.

## 2. Product Rendering & The "Empty Grid" Bug
**Historical Bug:** Products would occasionally not render at all, show as mockups forever, or disappear when scrolling.
**Root Cause:**
1. Hardcoded product HTML in `index.html` would conflict with API-fetched product slugs.
2. The `IntersectionObserver` in `initReveals()` was failing or throwing exceptions on older mobile browsers (like old Oppo devices), leaving elements permanently with `opacity: 0`.
3. `loading="lazy"` on pre-fetched `Image` objects blocked the `onload` event on some mobile browsers.
4. Fallback images used `.webp`, which old browsers couldn't render.

**The Radical Solution (Implemented & Must Be Preserved):**
1. **Skeleton Loaders:** `index.html` now uses empty `<div class="product-skeleton"></div>` for the home grid. DO NOT hardcode product data back into `index.html`.
2. **Synchronous Rendering:** `renderHomeProductsPreview()` explicitly clears the skeleton and synchronously calls `initReveals()` immediately. DO NOT use `setTimeout` for UI reveals after DOM mutation here.
3. **Safe Observer:** `initReveals()` includes a `try-catch` block and feature detection. If the observer fails, it falls back to immediately adding `.is-visible` to all elements. DO NOT remove this safety net.
4. **Fallback Assets:** The hardcoded `PRODUCTS` object in `app.js` (lines ~50-120) MUST use `.png` assets (e.g., `khaled-v2.png`, `seraj.png`) for `media.image`, NOT `.webp`, to support older browsers when the API fails.

## 3. Handling Slugs and Order
- Product ordering and slugs are dictated entirely by the API response (`fetchProducts()`) and cached in `localStorage`.
- Because the grid is now dynamically populated over the skeleton loaders, you do NOT need to update `index.html` when an admin changes a slug or changes the display order. It will automatically reflect the API response.

## 4. Common Tasks
### Updating a Price or Text in the Fallback Cache
If you need to update a product price or description for the hardcoded fallback:
1. Open `public/app.js`.
2. Locate the `var PRODUCTS = { ... }` object near the top.
3. Update the values. DO NOT change the `media.image` to `.webp` unless you add progressive enhancement logic.

### Modifying CSS
- Add new styles to `public/styles.css`.
- Ensure mobile responsiveness by testing standard widths: 320px, 360px, 390px, 430px.

## 5. Deployment & Verification
- After making changes to `public/`, you generally do not need to build the Next.js app for them to take effect on the static side, but the user prefers `npm run build` as a verification step.
- Ensure changes are committed using `git add`, `git commit`, and `git push origin master`.
- The site is hosted on Vercel, so pushing to `master` will trigger an automatic deployment. Advise the user to test online via their phone.
