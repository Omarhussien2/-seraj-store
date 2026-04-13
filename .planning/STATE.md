# Seraj Store — Project State

## Current Position
- **Phase:** 4 — Admin Dashboard Panel
- **Status:** COMPLETE
- **Last Updated:** 2026-04-13

## Progress
| Phase | Name | Status |
|-------|------|--------|
| 1 | Foundation + Deploy | ✅ Complete |
| 2 | Database + API | ✅ Complete |
| 3 | Frontend ↔ API Integration | ✅ Complete |
| 4 | Admin Dashboard | ✅ Complete |
| 5 | Polish & Integration | ⬜ Upcoming |

## Decisions
1. No users collection — Admin auth via env vars with NextAuth Credentials
2. JWT session strategy (24h expiry)
3. Soft delete for products (active: false)
4. Story status stored as sub-field in order's customStory
5. Admin panel uses LTR layout with Arabic labels

## Session Info
- **Stopped At:** Completed Phase 4 — Admin Dashboard Panel
- **Next Step:** Phase 5 — Polish (Cloudinary uploads from wizard, WhatsApp notifications, SEO)
