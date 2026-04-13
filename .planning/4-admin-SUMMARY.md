# Phase 4: Admin Dashboard Panel Summary

## One-liner
Full admin panel with NextAuth v5 credentials auth, dashboard stats, orders/products/stories management using shadcn/ui + Tailwind

## Commits
| Commit | Description |
|--------|-------------|
| be3798b | chore(4-1): install shadcn/ui with components |
| 69cdb1a | feat(4-2): add NextAuth v5 credentials auth + middleware |
| f7010c7 | feat(4-3): add admin login page |
| c3e5f76 | feat(4-4): add admin layout with sidebar navigation |
| 95c3f4d | feat(4-5): add admin dashboard with stats + recent orders |
| 216d117 | feat(4-6): add admin orders management page |
| cb6b4f3 | feat(4-7): add product CRUD API routes (POST/PATCH/DELETE) |
| e4ea603 | feat(4-8): add admin products management page |
| 9214b19 | feat(4-9): add admin stories management page |
| 0b36cb6 | fix(4): resolve TypeScript build errors in admin pages |

## Files Created/Modified
| File | Type | Purpose |
|------|------|---------|
| `src/lib/auth.ts` | created | NextAuth v5 config with Credentials provider |
| `src/middleware.ts` | created | Route protection for /admin/* |
| `src/app/api/auth/[...nextauth]/route.ts` | created | NextAuth API route handler |
| `src/app/api/stats/route.ts` | created | Dashboard statistics endpoint |
| `src/app/api/products/route.ts` | modified | Added POST for creating products |
| `src/app/api/products/[slug]/route.ts` | modified | Added PATCH/DELETE + ?all=true support |
| `src/app/api/orders/[id]/route.ts` | modified | Added customStory.storyStatus to PATCH |
| `src/lib/models/Order.ts` | modified | Added storyStatus + customChallenge fields |
| `src/app/admin/login/page.tsx` | created | Admin login page with Suspense |
| `src/app/admin/layout.tsx` | created | Admin layout with sidebar + logout |
| `src/app/admin/page.tsx` | created | Dashboard with 4 stat cards + recent orders |
| `src/app/admin/orders/page.tsx` | created | Orders table with filters + detail dialog |
| `src/app/admin/products/page.tsx` | created | Products CRUD with add/edit/delete dialogs |
| `src/app/admin/stories/page.tsx` | created | Stories management with status workflow |
| `src/components/ui/*.tsx` | created | 11 shadcn/ui components |
| `src/lib/utils.ts` | created | shadcn/ui utility (cn function) |
| `components.json` | created | shadcn/ui configuration |
| `src/app/globals.css` | modified | Updated with shadcn/ui theme variables |

## API Routes Added/Modified
| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/auth/[...nextauth]` | NextAuth authentication |
| GET | `/api/stats` | Dashboard statistics |
| GET | `/api/products?all=true` | All products including inactive |
| POST | `/api/products` | Create new product |
| PATCH | `/api/products/[slug]` | Update product |
| DELETE | `/api/products/[slug]` | Soft delete product |
| PATCH | `/api/orders/[id]` | Now supports customStory.storyStatus |

## Key Decisions
1. **No users collection** — Admin credentials compared against env vars (ADMIN_EMAIL/ADMIN_PASSWORD) via NextAuth Credentials provider
2. **JWT strategy** — No session database needed, 24h token expiry
3. **Soft delete** — Products marked as active:false instead of actual deletion
4. **Story status workflow** — pending → reviewed → sent_to_print → delivered, stored as sub-field in customStory
5. **LTR admin layout** — Admin panel uses LTR while keeping Arabic labels for familiarity
6. **shadcn/ui** — Free components that live in the project as source files

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] TypeScript build errors with shadcn/ui Select onValueChange**
- **Found during:** Task 10 (build verification)
- **Issue:** shadcn/ui v4 Select's onValueChange can pass `null`, which doesn't match `string` state setters
- **Fix:** Added null guards `(v) => { if (v) ... }` to all Select components across admin pages
- **Files:** orders/page.tsx, products/page.tsx, stories/page.tsx

**2. [Rule 1 - Bug] useSearchParams requires Suspense boundary in Next.js 16**
- **Found during:** Task 10 (build verification)
- **Issue:** Static generation of login page failed because useSearchParams needs Suspense
- **Fix:** Extracted LoginForm component and wrapped in `<Suspense>` in AdminLoginPage
- **Files:** admin/login/page.tsx

**3. [Rule 3 - Missing] Added storyStatus + customChallenge to Order model**
- **Found during:** Task 9 (stories page implementation)
- **Issue:** Plan required story status tracking but model didn't have storyStatus field
- **Fix:** Added storyStatus and customChallenge to CustomStory sub-schema, updated PATCH API
- **Files:** models/Order.ts, api/orders/[id]/route.ts

## Self-Check: PASSED
- All 10+ created files verified to exist on disk
- All 10 commits verified in git log
- Production build passes clean (`next build` succeeds)
- TypeScript type checking passes
