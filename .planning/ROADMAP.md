# Seraj Store — Project Roadmap

## Phase 6: Product Photos & Shipping ✅
**Status:** COMPLETE

---

## Phase 7: Fas7a Helwa — Data Extraction
**Goal:** Extract 600+ Egyptian kids' entertainment places from Kidzapp API + compile public parks/gardens into structured CSV for the "فسحة حلوة" section under "عالم ماما"
**Plans:** 1 plan

Plans:
- [ ] 07-01-PLAN.md — Kidzapp API scraper (615 venues) + Egyptian parks/gardens compilation + merged CSV output

**Key Decisions:**
- English names are fine for now — Arabic translation later
- Show real price dates from Kidzapp (mostly 2019) for transparency/trust
- Include public parks & gardens across Egypt (not just commercial venues)
- Source attribution on every row (Kidzapp / Manual)

**Data Sources:**
| Source | Type | Count | API |
|--------|------|-------|-----|
| Kidzapp | REST API (public) | ~615 experiences | `api.kidzapp.com/api/3.0/` |
| Manual Parks/Gardens | Hardcoded | ~25+ | N/A |
| Ahram Online | Existing seed data | 11 rows | N/A |
