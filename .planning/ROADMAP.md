# Seraj Store — Project Roadmap

## Phase 6: Product Photos & Shipping ✅
**Status:** COMPLETE

---

## Phase 7: Fas7a Helwa — Data + Backend
**Goal:** Extract 600+ Egyptian kids' entertainment places from Kidzapp API + compile public parks/gardens → store in MongoDB → expose via API routes for the "فسحة حلوة" section under "عالم ماما"
**Plans:** 2 plans in 2 waves

Plans:
- [ ] 07-01-PLAN.md — Kidzapp API scraper (615 venues) + parks/gardens + merged CSV output
- [ ] 07-02-PLAN.md — MongoDB Place model + CRUD API routes + seed script

**Key Decisions:**
- English names are fine for now — Arabic translation later
- Show real price dates from Kidzapp (mostly 2019) for transparency/trust
- Include public parks & gardens across Egypt (not just commercial venues)
- Source attribution on every row (Kidzapp / Manual)
- Place model follows same Mongoose pattern as Product model
- API routes follow same pattern as /api/products (public GET, admin POST/PATCH/DELETE)
- Soft delete for places (active: false) — same as products

**Data Sources:**
| Source | Type | Count | API |
|--------|------|-------|-----|
| Kidzapp | REST API (public) | ~615 experiences | `api.kidzapp.com/api/3.0/` |
| Manual Parks/Gardens | Hardcoded | ~25+ | N/A |
| Ahram Online | Existing seed data | 11 rows | N/A |

**Architecture:**
```
Kidzapp API ──→ scrape script ──→ CSV ──→ seed script ──→ MongoDB
Manual parks ──→ parks script  ──↗                    ↓
                                              GET /api/places?city=Cairo&category=3
                                              GET /api/places/[id]
                                              POST/PATCH/DELETE (admin)
```
