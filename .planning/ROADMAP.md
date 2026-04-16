# Seraj Store — Project Roadmap

## Phase 6: Product Photos & Shipping ✅
**Status:** COMPLETE

---

## Phase 7: Fas7a Helwa — Data + Backend ✅
**Status:** COMPLETE
**Completed:** 2026-04-16

Plans:
- [x] 07-01-PLAN.md — Kidzapp API scraper (615 venues) + parks/gardens + merged CSV output
- [x] 07-02-PLAN.md — MongoDB Place model + CRUD API routes + seed script
- [x] 07-03-PLAN.md — Frontend UX/UI: filter bar (budget slider, city/type/category chips) + results grid + Google Maps + detail modal

**Key Decisions:**
- English names are fine for now — Arabic translation later
- Show real price dates from Kidzapp (mostly 2019) for transparency/trust
- Include public parks & gardens across Egypt (not just commercial venues)
- Source attribution on every row (Kidzapp / Manual)
- Place model follows same Mongoose pattern as Product model
- API routes follow same pattern as /api/products (public GET, admin POST/PATCH/DELETE)
- Soft delete for places (active: false) — same as products
- Simple `{ lat, lon }` location (no GeoJSON 2dsphere — not needed for MVP)
- Budget filter via visual slider bar (not boring dropdown)
- Place detail opens in bottom-sheet modal (mobile) / centered modal (desktop)
- Google Maps link on every card + in detail modal
- Price date warning for stale data (pre-2025)

**Data Sources:**
| Source | Type | Count | API |
|--------|------|-------|-----|
| Kidzapp | REST API (public) | ~615 experiences | `api.kidzapp.com/api/3.0/` |
| Manual Parks/Gardens | Hardcoded | ~25+ | N/A |
| Ahram Online | Existing seed data | 11 rows | N/A |

**Architecture:**
```
Wave 1: Kidzapp API ──→ scrape script ──→ CSV
        Manual parks ──→ parks script  ──→ CSV ──→ merged CSV

Wave 2: merged CSV ──→ seed script ──→ MongoDB
         Place model + API routes (GET/POST/PATCH/DELETE)

Wave 3: Frontend (public/app.js + index.html + styles.css)
         Budget slider + city/type/category chips → GET /api/places
         Place cards → detail modal → Google Maps
```
