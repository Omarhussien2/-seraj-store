# Seraj Store — Project State

## Current Position
- **Phase:** 5 — Polish & Integration
- **Status:** COMPLETE
- **Last Updated:** 2026-04-13

## Progress
| Phase | Name | Status |
|-------|------|--------|
| 1 | Foundation + Deploy | ✅ Complete |
| 2 | Database + API | ✅ Complete |
| 3 | Frontend ↔ API Integration | ✅ Complete |
| 4 | Admin Dashboard | ✅ Complete |
| 5 | Polish & Integration | ✅ Complete |

## Decisions
1. No users collection — Admin auth via env vars with NextAuth Credentials
2. JWT session strategy (24h expiry)
3. Soft delete for products (active: false)
4. Story status stored as sub-field in order's customStory
5. Admin panel uses LTR layout with Arabic labels
6. Child photo upload uses separate public route `/api/upload-child-photo` (no auth, strict validation)
7. Dynamic config via `/api/config` for WhatsApp + InstaPay (graceful fallback)
8. PWA with network-first strategy, cache fallback for offline
9. ~116MB of duplicate files removed (demo/, charachters images/, assets/assets/)

## Session Info
- **Stopped At:** Completed Phase 5 — Polish & Integration
- **Next Step:** Deploy to Vercel (git push) → production ready
