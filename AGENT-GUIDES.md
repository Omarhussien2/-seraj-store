# Seraj Store - Agent Session Guides

## Project Overview

Next.js 16.2.3 e-commerce store for Arabic children's books. RTL Arabic UI.
- **Frontend**: Static SPA in `public/` (HTML + vanilla JS) — NOT React
- **Backend**: Next.js App Router API routes + MongoDB (Mongoose)
- **Admin**: Next.js pages under `src/app/admin/` with NextAuth v5 auth
- **Deploy**: Vercel (production)

---

## Agent 1: Frontend (public/ SPA)

### Read These Files First
```
public/app.js          — Main app: routing, cart, wizard, product rendering, checkout form
public/index.html      — HTML structure: all pages, wizard steps, modals
public/styles.css      — Full design system: CSS variables, animations, RTL layout
public/sw.js           — Service worker: offline caching strategy
public/manifest.json   — PWA manifest
```

### Architecture
- Single Page Application using hash routing (`#/home`, `#/products`, `#/wizard`, `#/checkout`, etc.)
- All client state in `app.js`: `state` object + `cart` array in localStorage
- Products defined in `PRODUCTS` object inside `app.js` (hardcoded) AND fetched from `/api/products`
- Wizard flow: collects heroName, age, challenge, photoUrl for custom stories
- Cart stored in localStorage key `seraj-cart`, wizard data in `seraj-wizard`

### Key Functions in app.js
- `renderProductsPage()` — Product catalog grid
- `renderProductDetail(slug)` — Single product page
- `renderCartPage()` — Shopping cart
- `renderCheckoutPage()` — Checkout form + order submission
- `setupWizard()` — Custom story wizard (4 steps)
- `addCustomStoryToCart()` — Adds custom-story item to cart
- `handleRoute()` — Hash-based SPA router
- `fetchProducts()` / `fetchConfig()` — API data fetching

### Design System (styles.css)
- CSS variables: `--clr-emerald`, `--clr-brass`, `--clr-ember`, `--clr-parchment`
- Fonts: Baloo Bhaijaan 2, Tajawal, Lalezar
- RTL-first layout with `dir="rtl"`
- Responsive breakpoints in media queries
- Animations: `fadeUp`, `float`, `pulse-soft`, gear rotations

### Important Notes
- This is **vanilla JS**, not React/Vue — no components, no build step
- All rendering is string concatenation (`h += '<div>...'`)
- Products have `action` field: `"cart"` (add to cart), `"wizard"` (start wizard), `"none"` (coming soon)
- The checkout form POSTs to `/api/orders`
- Photo upload goes to `/api/upload-child-photo`

---

## Agent 2: Backend (API + DB + Auth)

### Read These Files First
```
src/lib/db.ts                        — MongoDB singleton connection (connectDB)
src/lib/auth.ts                      — NextAuth v5 config (JWT, credentials provider)
src/lib/requireAdmin.ts              — Admin auth check helper for API routes
src/lib/rateLimit.ts                 — In-memory rate limiter (isRateLimited, getClientIp)
src/lib/models/Product.ts            — Product Mongoose schema/model
src/lib/models/Order.ts              — Order Mongoose schema/model + generateOrderNumber()
src/app/api/orders/route.ts          — POST (create order, public) + GET (list orders, admin)
src/app/api/orders/[id]/route.ts     — GET + PATCH single order (admin)
src/app/api/products/route.ts        — GET (list) + POST (create, admin)
src/app/api/products/[slug]/route.ts — GET + PATCH single product (admin)
src/app/api/upload/route.ts          — Admin image upload (Cloudinary, 10MB)
src/app/api/upload-child-photo/route.ts — Public photo upload (Cloudinary, 5MB, rate-limited)
src/app/api/config/route.ts          — Public config (WhatsApp, InstaPay numbers)
src/app/api/stats/route.ts           — Admin dashboard stats (aggregated)
src/app/api/auth/[...nextauth]/route.ts — NextAuth route handler
src/middleware.ts                     — Edge middleware: cookie-based admin route protection
```

### Architecture
- **Auth**: NextAuth v5 with JWT strategy, single admin user from env vars (ADMIN_EMAIL, ADMIN_PASSWORD)
- **DB**: MongoDB Atlas via Mongoose, singleton connection cached on globalThis
- **Validation**: Zod schemas on all POST/PATCH endpoints
- **Rate Limiting**: In-memory sliding window per IP (resets per serverless cold start)
- **File Uploads**: Cloudinary (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET)
- **Middleware**: Standard function (NOT NextAuth auth() wrapper — incompatible with Next.js 16 edge runtime)

### Data Models
**Product**: slug (unique), name, price, category, features[], media, action, reviews[], active, order
**Order**: orderNumber (SRJ-YYYY-XXXX), items[], total, deposit, remaining, paymentMethod, paymentStatus, orderStatus, customStory (nested), customerName, customerPhone, address

### Environment Variables
```
MONGODB_URI              — MongoDB Atlas connection string
ADMIN_EMAIL              — Admin login email
ADMIN_PASSWORD           — Admin login password
NEXTAUTH_SECRET          — JWT signing secret
CLOUDINARY_CLOUD_NAME    — Cloudinary account
CLOUDINARY_API_KEY       — Cloudinary key
CLOUDINARY_API_SECRET    — Cloudinary secret
NEXT_PUBLIC_WHATSAPP_NUMBER  — WhatsApp contact
NEXT_PUBLIC_INSTAPAY_NUMBER  — InstaPay username
NEXT_PUBLIC_INSTAPAY_LINK    — InstaPay payment link
NEXT_PUBLIC_INSTAPAY_NAME    — InstaPay display name
```

### Important Notes
- POST /api/orders is PUBLIC (no auth) — customers create orders
- GET /api/orders is ADMIN ONLY — uses requireAdmin()
- Order total is recalculated server-side from DB prices (never trusts client)
- Rate limit: 10 orders per 15 min per IP, 20 photo uploads per 10 min per IP
- `runtime = "nodejs"` and `dynamic = "force-dynamic"` on all API routes

---

## Agent 3: Admin Dashboard (src/app/admin/)

### Read These Files First
```
src/app/admin/layout.tsx        — Sidebar navigation + logout, hides on login page
src/app/admin/page.tsx          — Dashboard: stats cards + recent orders table
src/app/admin/login/page.tsx    — Login form (credentials auth)
src/app/admin/orders/page.tsx   — Order management: list, filter, pagination, status update
src/app/admin/products/page.tsx — Product CRUD: list, edit/create modal, toggle active
src/app/admin/stories/page.tsx  — Custom story orders: filter by story status, photo viewer
src/app/admin/error.tsx         — Error boundary with retry
src/components/ui/*.tsx         — shadcn/ui components (button, dialog, table, tabs, etc.)
```

### Architecture
- All admin pages are `"use client"` React components
- Layout has sidebar nav with active state detection
- Auth: middleware checks session cookie, pages fetch data from admin-protected API routes
- All data fetching via `fetch()` to `/api/*` endpoints
- UI components from shadcn/ui (Tailwind-based)

---

## Agent 4: Integration Testing

### What to Test

#### 1. Customer Order Flow (Frontend → Backend)
```
public/app.js → POST /api/orders → src/app/api/orders/route.ts → MongoDB
```
- Add product to cart → checkout → submit order
- Verify: order created in DB with correct total (server-recalculated)
- Verify: rate limiting works (10 orders per 15 min)
- Verify: Zod validation rejects bad input (missing name, invalid phone)

#### 2. Custom Story Flow
```
public/app.js (wizard) → POST /api/upload-child-photo → POST /api/orders (with customStory)
```
- Complete wizard → upload photo → checkout → submit
- Verify: customStory data (heroName, age, challenge, photoUrl) saved correctly
- Verify: photo upload rate limiting (20 per 10 min)

#### 3. Admin Auth Flow
```
/admin/login → POST /api/auth/[...nextauth] → session cookie → /admin/*
```
- Login with correct credentials → redirected to dashboard
- Login with wrong credentials → error message
- Access /admin without login → redirected to /admin/login
- API routes reject unauthorized requests (401)

#### 4. Admin CRUD
```
/admin/orders → GET /api/orders → PATCH /api/orders/[id]
/admin/products → GET /api/products → POST /api/products → PATCH /api/products/[slug]
```
- List orders with filters (status, pagination)
- Update order status and payment status
- Create/edit/deactivate products
- View custom story details and update story status

#### 5. Frontend ↔ Backend Data Consistency
- Product slugs in `app.js` PRODUCTS object must match DB slugs
- Prices in `app.js` are for display only — server recalculates from DB
- Cart item structure must match Zod schema (productSlug, name, price, qty)

### Key Files to Read
```
public/app.js                   — Frontend fetch calls (lines 553, 478)
src/app/api/orders/route.ts     — Order validation + creation
src/app/api/products/route.ts   — Product listing
src/lib/models/Order.ts         — Order schema + generateOrderNumber
src/lib/models/Product.ts       — Product schema
src/lib/rateLimit.ts            — Rate limit logic
src/lib/requireAdmin.ts         — Auth guard
scripts/seed.ts                 — Seed data (reference for expected DB state)
```

---

## Agent 5: Code Cleanup & Optimization

### Read These Files First
```
public/app.js           — ~1245 lines, vanilla JS, string-based rendering
public/styles.css       — Full CSS, check for unused rules
src/middleware.ts        — Recently refactored, verify correctness
src/lib/rateLimit.ts    — In-memory rate limiter, check for edge cases
src/lib/db.ts           — MongoDB connection singleton
next.config.ts          — Minimal config with rewrite
package.json            — Check for unused dependencies
```

### Known Issues & Areas to Review
1. **Deprecated middleware**: Next.js 16 warns "middleware file convention deprecated, use proxy". Currently functional but should migrate eventually.
2. **Hardcoded products in app.js**: PRODUCTS object duplicates DB data — prices can diverge. Consider fetching all product data from API.
3. **Rate limiter resets on cold start**: In-memory Map lost when serverless function restarts. Acceptable for now but not reliable under load.
4. **No CSRF protection** on public POST endpoints (orders, photo upload).
5. **Admin password stored as plaintext** in env vars and compared directly (no hashing).
6. **setInterval in rateLimit.ts**: Runs cleanup every 5 min — may keep serverless function warm unnecessarily.
7. **next.config.ts rewrite**: `/ → /index.html` plus `page.tsx redirect to /index.html` — redundant double mechanism.
8. **Error messages mix Arabic and English**: API errors are partly Arabic, partly English.

### Performance Checks
- `public/app.js`: Large file — check if all product rendering could be lazier
- `public/styles.css`: Check for unused CSS selectors
- MongoDB queries: Verify indexes are used (Order: orderStatus+createdAt, customerPhone; Product: slug, category text, active)
- Cloudinary uploads: Check if image optimization/transformation is applied

### Security Checks
- Zod validation coverage on all inputs
- SQL/NoSQL injection via Mongoose (should be safe with schema)
- XSS in string concatenation in app.js (product names, reviews rendered as HTML)
- Rate limiting effectiveness (IP-based, bypassable with proxies)
- File upload validation (type, size)
