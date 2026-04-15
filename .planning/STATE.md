# Seraj Store — Project State

## Current Position
- **Phase:** 6 — Product Photos & Shipping
- **Status:** COMPLETE
- **Last Updated:** 2026-04-15

## Progress
| Phase | Name | Status |
|-------|------|--------|
| 1 | Foundation + Deploy | ✅ Complete |
| 2 | Database + API | ✅ Complete |
| 3 | Frontend ↔ API Integration | ✅ Complete |
| 4 | Admin Dashboard | ✅ Complete |
| 5 | Polish & Integration | ✅ Complete |
| 6 | Product Photos & Shipping | ✅ Complete |

## Decisions
1. No users collection — Admin auth via env vars with NextAuth Credentials
2. JWT session strategy (24h expiry)
3. Soft delete for products (active: false)
4. Story status stored as sub-field in order's customStory
5. Admin panel uses LTR layout with Arabic labels
6. Child photo upload uses separate public route `/api/upload-child-photo` (no auth, strict validation)
7. Dynamic config via `/api/config` for WhatsApp + InstaPay + shipping (graceful fallback)
8. PWA with network-first strategy, cache fallback for offline
9. ~116MB of duplicate files removed (demo/, charachters images/, assets/assets/)
10. Product images: `resolvePhotoUrl()` checks imageUrl → media.image (Cloudinary) → CSS mockup fallback
11. `object-fit: cover` for product cards, `contain` for detail page hero
12. Gallery: main image + thumbnail strip + lightbox + swipe + keyboard nav
13. Shipping fee: stored in SiteContent DB, configurable from admin dashboard (/admin → إعدادات الشحن)
14. No deposit/VIP — full payment via InstaPay only, `deposit: 0` always
15. Order model: `subtotal` + `shippingFee` + `total` fields
16. Admin settings API: `GET/PUT /api/admin/settings` (requires admin auth)

## Session Info
- **Stopped At:** Completed Phase 6 — Product Photos & Shipping
- **Next Step:** Continue with any remaining features or deploy updates
