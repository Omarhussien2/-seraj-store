# Test Plan — PR #2: eliminate product image flicker on refresh

## What changed (user-visible)
On refresh, product images no longer flash or swap from CSS mockups to Cloudinary photos. The SW now caches images cache-first, and the API response is cached in `localStorage` so returning visitors render real images immediately.

## Setup
- **PR build** served locally at `http://localhost:8080` (`public/` from branch `devin/1776962840-fix-image-flicker-on-refresh`, SW = `seraj-v10` + `seraj-images-v1`).
- **Master baseline** served locally at `http://localhost:8081` (`public/` from `master`, SW = `seraj-v9`).
- Both servers proxy `/api/*` to production `seraj-store.vercel.app` so real Cloudinary URLs load (same product data). Static files are served with `cache-control: no-cache` so the only caching under test is the SW + localStorage behaviour added by this PR.

## Scope
One primary end-to-end flow: verify the refresh flicker is gone on the PR build, and demonstrate it still exists on master for contrast. Plus two instrumented assertions that would fail if the PR code were broken.

---

## Test 1 — Service Worker registers with the new caches (PR build)
Evidence for the SW-side change.

1. Open `http://localhost:8080/` in Chrome, wait for "Products loaded from API" in console.
2. In DevTools Console run:
   ```js
   (async () => ({
     controller: !!navigator.serviceWorker.controller,
     caches: await caches.keys()
   }))()
   ```

**Pass criteria** (all must hold):
- `controller` is `true`.
- `caches` contains **both** `"seraj-v10"` and `"seraj-images-v1"`.
- `caches` does **not** contain `"seraj-v9"` (old cache was cleaned).

Fails if: either cache name is missing, or the SW failed to register. An unchanged/broken PR would still show `seraj-v9` only.

---

## Test 2 — Cloudinary images are served from `seraj-images-v1` (PR build)
Evidence that the cache-first image strategy is active.

1. On the loaded page, run:
   ```js
   (async () => {
     const c = await caches.open('seraj-images-v1');
     const urls = (await c.keys()).map(r => r.url);
     return {
       total: urls.length,
       cloudinary: urls.filter(u => u.includes('res.cloudinary.com')).length,
       sample: urls.filter(u => u.includes('res.cloudinary.com')).slice(0, 3)
     };
   })()
   ```

**Pass criteria**:
- `cloudinary` is **≥ 1** (at least one Cloudinary product photo is cached).
- Each sample URL matches `https://res.cloudinary.com/.../upload/w_\d+,c_limit,f_auto,q_auto/...`.

Fails if: `cloudinary === 0`, which would mean `cacheFirstImage` never persisted the fetched image (e.g. opaque response not accepted, or the handler was bypassed).

---

## Test 3 — `/api/products` response is cached to localStorage (PR build)
Evidence that the hydration path will work on the next refresh.

1. After load, run in console:
   ```js
   (() => {
     const raw = localStorage.getItem('seraj-products-cache-v1');
     if (!raw) return { present: false };
     const parsed = JSON.parse(raw);
     return {
       present: true,
       count: parsed.data && parsed.data.length,
       ageMs: Date.now() - parsed.ts,
       firstSlug: parsed.data && parsed.data[0] && parsed.data[0].slug,
       firstImageUrl: parsed.data && parsed.data[0] && parsed.data[0].imageUrl
     };
   })()
   ```

**Pass criteria**:
- `present` is `true`.
- `count` is **≥ 3**.
- `ageMs` is `< 10000` (populated within the last 10s).
- `firstImageUrl` starts with `https://res.cloudinary.com/`.

Fails if: localStorage is empty (hydration will never kick in on reload) — broken `fetchProducts` write path.

---

## Test 4 — No mockup→photo swap on refresh (PR build, primary flow)
The core user-visible assertion. Uses a `MutationObserver` wired up before any script runs, so we objectively record whether `.book3d` / `.cards-fan` elements ever appear and then get replaced.

1. Paste the instrumentation snippet into the console on `http://localhost:8080/`:
   ```js
   sessionStorage.setItem('__flickerProbe', JSON.stringify({
     mockupEverSeen: 0,
     swapsObserved: 0
   }));
   ```
2. Install a probe that runs as early as possible by pasting and running this BEFORE the reload:
   ```js
   window.__probeInstalled || (() => {
     window.__probeInstalled = true;
     const hit = { mockupEverSeen: 0, swapsObserved: 0, firstMockupAtMs: null };
     const t0 = performance.now();
     const check = () => {
       const mockups = document.querySelectorAll('.products-grid .product-media .book3d, .products-grid .product-media .cards-fan');
       if (mockups.length > 0) {
         hit.mockupEverSeen += mockups.length;
         if (hit.firstMockupAtMs === null) hit.firstMockupAtMs = performance.now() - t0;
       }
     };
     const mo = new MutationObserver(() => {
       check();
       const photos = document.querySelectorAll('.products-grid .product-media .product-photo');
       if (photos.length > 0 && hit.firstPhotoAtMs === undefined) {
         hit.firstPhotoAtMs = performance.now() - t0;
       }
     });
     mo.observe(document.documentElement, { childList: true, subtree: true });
     document.addEventListener('DOMContentLoaded', check);
     window.addEventListener('load', () => setTimeout(() => {
       check();
       window.__flickerResult = hit;
       console.log('FLICKER PROBE', hit);
     }, 2500));
   })();
   ```
3. Hard-reload (`Ctrl+Shift+R`), let the page settle, then run `window.__flickerResult`.

**Pass criteria**:
- `firstPhotoAtMs` is defined and `< 1000` ms (real photo rendered within 1s).
- `mockupEverSeen` is `0` **OR** `firstMockupAtMs` is `< 100` ms AND `firstPhotoAtMs - firstMockupAtMs < 150` ms (if the initial static HTML still flashes, it must be replaced nearly immediately via `decode()` + preload, so the user cannot perceive it).
- No "Mockup visible > 200ms" entries in the probe (derived by comparing `firstMockupAtMs` to `firstPhotoAtMs`).

Fails if: `firstPhotoAtMs > 1500` ms, or there's a > 300ms window where only mockups are visible — the original bug.

---

## Test 5 — Regression baseline on master (port 8081)
Shows the bug still exists without the fix — so Test 4's result is meaningful.

1. Open `http://localhost:8081/` (master branch).
2. Run the same probe snippet from Test 4.
3. Hard-reload, collect `window.__flickerResult`.

**Expected (bug reproduction)**:
- `firstMockupAtMs` ≈ a few ms.
- `firstPhotoAtMs - firstMockupAtMs` is measurably large (visible flicker window).
- Visually: mockup → empty container → photo.

If master shows the flicker but PR does not, the fix is validated.

---

## Evidence to capture
- Screen recording of master (port 8081) showing visible mockup/photo swap on refresh.
- Screen recording of PR build (port 8080) showing stable product images across refreshes.
- Console output from tests 1–5 captured in the test report.
