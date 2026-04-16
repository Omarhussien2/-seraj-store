---
phase: 07-fas7a-helwa-data
plan: 03
subsystem: ui
tags: [outings, filter-ui, chips, api-fetching, card-rendering, modal, google-maps, rtl, arabic, offers]

# Dependency graph
requires:
  - phase: 07-02
    provides: "GET /api/places with city/category/is_free/indoor_outdoor/text search/pagination"
provides:
  - "Live interactive Fas7a Helwa outings directory with city/type/category filters"
  - "API-backed card rendering with name, age, location, category badge, Google Maps link"
  - "Place detail modal with phone, website, Maps, and offer banners"
  - "Admin places page (/admin/places) with full CRUD + offer management"
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns: [filter-state-object, chip-toggle-groups, modal-bottom-sheet-mobile, offer-badge-on-cards]

key-files:
  created:
    - src/app/admin/places/page.tsx
  modified:
    - public/index.html
    - public/app.js
    - public/styles.css
    - src/lib/models/Place.ts
    - src/app/api/places/route.ts
    - src/app/api/places/[id]/route.ts
    - src/app/admin/layout.tsx

key-decisions:
  - "Removed stale 2019 prices and budget slider — prices unreliable and confusing for users"
  - "All 480 external_detail_url replaced with Google Maps links (lat,lon) — not Kidzapp"
  - "'اعرف أكتر عن المكان' button opens Google Maps for phone/photos/reviews/directions"
  - "Offer system: offer_text + offer_active + offer_expiry fields on Place model"
  - "Offer badge on cards (orange) + offer banner in detail modal (gold)"
  - "Admin places page with full CRUD, offer section, category toggles"
  - "Used existing escHtml() and toArabicNum() utilities — no duplicates"

patterns-established:
  - "Filter state pattern: outingsState object with filter fields + pagination"
  - "Chip group pattern: querySelectorAll for group, toggle is-active on click"
  - "Modal pattern: backdrop click + close button, body overflow hidden"
  - "Offer pattern: check offer_active && offer_text, show badge/banner with expiry"

# Metrics
duration: 10min + post-fixes
completed: 2026-04-16
updated: 2026-04-16
---

# Phase 7 Plan 03: Fas7a Helwa Frontend Summary

**Live interactive outings directory with city/type/category chips, API-backed card grid, Google Maps links, offer system, detail modal, and admin places management page**

## Performance

- **Duration:** 10 min (initial) + post-fixes
- **Tasks:** 2 (initial) + post-completion updates
- **Files modified:** 7 + 1 created

## Accomplishments

### Initial (Wave 3)
- Replaced static coming-soon overlay with fully interactive filter UI
- City chips (7 cities), Type chips (4 options), Category chips (7 categories)
- Dynamic card rendering from GET /api/places with all filter combinations
- Place detail modal with image, description, action buttons (Maps/Call/Website)
- Search input with 350ms debounce for text-based filtering
- Load more pagination, empty state, loading spinner, clear filters button

### Post-Completion Updates (2026-04-16)
- **Removed stale 2019 prices** and budget slider — prices were unreliable and confusing
- **Replaced all 480 Kidzapp links with Google Maps links** using lat/lon coordinates
- **"اعرف أكتر عن المكان" button** now opens Google Maps showing phone, photos, reviews, directions
- **Offer system** added: offer_text, offer_active, offer_expiry on Place model
  - Orange offer badge on cards when active
  - Gold offer banner in detail modal
  - Expiry date support in admin
- **Admin places page** (/admin/places) with full CRUD, offer management, category toggles
- **Admin sidebar** updated with 🎡 الأماكن link
- Cleaned up resetOutingsFilters() stale budget references

## Commits

1. `a55b008` - Build Filter Bar UI (initial)
2. `e5d972b` - Wire Up Filter Logic + Card Rendering (initial)
3. `0028297` - Complete fas7a helwa frontend plan (docs)
4. `36d77ee` - Remove stale prices, add 'اعرف عن المكان' links, offer system, admin places page
5. `420c413` - Replace all 480 kidzapp links with Google Maps links

## Files Created/Modified
- `public/index.html` - Removed budget slider, updated empty state text
- `public/styles.css` - Replaced map-btn/free-tag with info-btn/offer-tag styles, added offer banner + btn-search
- `public/app.js` - Removed budget logic, added getPlaceSearchUrl/getPlaceMapUrl, offer badge/banner rendering, cleaned resetOutingsFilters
- `src/lib/models/Place.ts` - Added offer_text, offer_active, offer_expiry fields
- `src/app/api/places/route.ts` - Added offer fields to Zod schemas + date conversion
- `src/app/api/places/[id]/route.ts` - Added offer fields to PatchSchema + date conversion
- `src/app/admin/layout.tsx` - Added 🎡 الأماكن nav item
- `src/app/admin/places/page.tsx` - **NEW** Full admin CRUD page with offer management

## Decisions Made
- Removed prices entirely instead of showing stale 2019 data — honesty > misinformation
- Google Maps links (lat,lon) chosen over Google Search — drops pin on exact location, shows business profile
- offer_active boolean flag allows easy toggle from admin without deleting text
- Admin page uses toggle buttons for categories instead of multi-select dropdown

## Issues Encountered
- None — build passes with zero TypeScript errors

## Next Phase Readiness
- Fas7a Helwa section fully live with interactive filtering
- 480 places with correct Google Maps links
- Admin can manage places and offers
- Phase 7 complete — ready for next phase
