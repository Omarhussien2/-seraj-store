# Seraj Store — Project Roadmap

## Phase 6: Product Photos & Shipping ✅
**Status:** COMPLETE

---

## Phase 7: Fas7a Helwa — Data + Backend ✅
**Status:** COMPLETE
**Completed:** 2026-04-16
**Updated:** 2026-04-16 (post-completion fixes)

Plans:
- [x] 07-01-PLAN.md — Kidzapp API scraper (615 venues) + parks/gardens + merged CSV output
- [x] 07-02-PLAN.md — MongoDB Place model + CRUD API routes + seed script
- [x] 07-03-PLAN.md — Frontend UX/UI: filter chips + results grid + Google Maps + detail modal

**Post-Completion Updates (2026-04-16):**
- Removed stale 2019 prices and budget slider — prices unreliable
- Replaced all 480 Kidzapp links with Google Maps links (lat,lon)
- Added offer system to Place model (offer_text, offer_active, offer_expiry)
- "اعرف أكتر عن المكان" button now opens Google Maps for phone/photos/reviews
- Built admin places page (/admin/places) with full CRUD + offer management
- Added 🎡 الأماكن link to admin sidebar

**Key Decisions:**
- English names are fine for now — Arabic translation later
- ~~Show real price dates from Kidzapp (mostly 2019)~~ REMOVED — prices too stale, confusing for users
- Include public parks & gardens across Egypt (not just commercial venues)
- Source attribution on every row (Kidzapp / Manual)
- Place model follows same Mongoose pattern as Product model
- API routes follow same pattern as /api/products (public GET, admin POST/PATCH/DELETE)
- Soft delete for places (active: false) — same as products
- Simple `{ lat, lon }` location (no GeoJSON 2dsphere — not needed for MVP)
- All external links point to Google Maps (not Kidzapp) for phone/photos/reviews
- Place detail opens in bottom-sheet modal (mobile) / centered modal (desktop)
- Offer badges on cards + offer banner in detail modal for active promotions

**Data Sources:**
| Source | Type | Count | API |
|--------|------|-------|-----|
| Kidzapp | REST API (public) | ~615 experiences | `api.kidzapp.com/api/3.0/` |
| Manual Parks/Gardens | Hardcoded | ~25+ | N/A |
| Ahram Online | Existing seed data | 11 rows | N/A |

**Final Dataset:** 480 places seeded in MongoDB (479 with coordinates, 458 Kidzapp-sourced, 22 manual)

**Architecture:**
```
Wave 1: Kidzapp API ──→ scrape script ──→ CSV
        Manual parks ──→ parks script  ──→ CSV ──→ merged CSV

Wave 2: merged CSV ──→ seed script ──→ MongoDB
         Place model + API routes (GET/POST/PATCH/DELETE)

Wave 3: Frontend (public/app.js + index.html + styles.css)
         Filter chips (city/type/category) → GET /api/places
         Place cards → detail modal → Google Maps links

Post:   Removed budget slider + stale prices
        All 480 links → Google Maps (lat,lon)
        Offer system (text + active flag + expiry)
        Admin places page (/admin/places)
```
