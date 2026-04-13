# خطة تحويل ديمو سِراج لمتجر حقيقي على Vercel

## Context

**المشكلة:** الديمو الحالي (demo/) متجر كامل شغال كـ static HTML/CSS/JS (~4400 سطر) — لكن كل البيانات hardcoded في الكود، مفيش قاعدة بيانات، مفيش لوحة تحكم، ومفيش حفظ طلبات.

**الهدف:** تحويل الديمو لمتجر حقيقي على Vercel مع:
- منتجات تتدار من لوحة تحكم (مش hardcoded)
- طلبات تتحفظ في قاعدة بيانات
- لوحة تحكم لمتابعة الطلبات وتعديل المنتجات
- كل ده مجاني 100%

**الأسلوب:** تدريجي — نـ deploy الديمو الحالي فوراً + نضيف الباك إند خطوة بخطوة. بدون إعادة بناء الفرونت من الصفر.

**القرارات:**
- الحسابات: Vercel + MongoDB Atlas + Cloudinary ← جاهزين
- الدومين: vercel.app مجاني (مؤقتاً)
- الإدارة: أدمن واحد فقط ← لوحة تحكم بسيطة
- أهم بيانات العملاء: **الاسم + رقم الموبايل**

---

## البنية المعمارية

```
seraj-store/
├── public/                     # ← الديمو الحالي (يتنقل هنا)
│   ├── index.html              # الموقع الرئيسي (customer-facing)
│   ├── styles.css
│   ├── app.js
│   └── assets/                 # صور + فيديوهات
│       ├── seraj.png
│       ├── khaled-v2.png
│       ├── family-photo.mp4
│       └── ...
│
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout (للأدمن فقط)
│   │   │
│   │   ├── api/                # Serverless API Routes
│   │   │   ├── products/
│   │   │   │   └── route.ts    # GET all / POST new
│   │   │   ├── products/[slug]/
│   │   │   │   └── route.ts    # GET one / PATCH / DELETE
│   │   │   ├── orders/
│   │   │   │   └── route.ts    # GET all / POST new
│   │   │   ├── orders/[id]/
│   │   │   │   └── route.ts    # GET one / PATCH status
│   │   │   ├── upload/
│   │   │   │   └── route.ts    # POST photo → Cloudinary
│   │   │   └── auth/[...nextauth]/
│   │   │       └── route.ts    # NextAuth
│   │   │
│   │   └── admin/              # Admin Panel (Next.js/React)
│   │       ├── layout.tsx      # Admin layout + sidebar
│   │       ├── page.tsx        # Dashboard
│   │       ├── login/
│   │       │   └── page.tsx
│   │       ├── products/
│   │       │   └── page.tsx    # CRUD منتجات
│   │       ├── orders/
│   │       │   └── page.tsx    # إدارة طلبات
│   │       └── stories/
│   │           └── page.tsx    # طلبات القصص المخصصة
│   │
│   └── lib/
│       ├── db.ts               # MongoDB singleton connection
│       ├── models/
│       │   ├── Product.ts      # Mongoose schema
│       │   ├── Order.ts
│       │   └── Review.ts
│       └── auth.ts             # NextAuth config
│
├── scripts/
│   └── seed.ts                 # نقل بيانات PRODUCTS للـ DB
│
├── next.config.ts              # rewrites: / → /index.html
├── package.json
├── tsconfig.json
├── .env.local                  # المتغيرات (لا تُرفع)
├── .env.example                # نموذج المتغيرات
└── vercel.json                 # إعدادات Vercel
```

**الفكرة الأساسية:** Next.js يخدم فقط `/api/*` و `/admin/*`. الموقع الرئيسي (الزبائن) يبقى الديمو الحالي في `public/` — بدون أي تغيير في الشكل أو السلوك.

---

## المرحلة 1: الإعداد + النشر الأول (Foundation + Deploy)

**الهدف:** الديمو يشتغل على seraj-store.vercel.app + Next.js جاهز للباك إند

### المهام:

**1.1: إنشاء مشروع Next.js**
- `npx create-next-app@latest . --typescript --tailwind --app --src-dir`
- تثبيت: `mongoose`, `next-auth@beta`, `zod`, `bcryptjs`, `cloudinary`

**1.2: نقل ملفات الديمو لـ `public/`**
- `demo/index.html` → `public/index.html`
- `demo/styles.css` → `public/styles.css`
- `demo/app.js` → `public/app.js`
- `demo/assets/` → `public/assets/`
- تعديل `next.config.ts` مع rewrite: `/ → /index.html`

**1.3: إعداد البيئة**
- `.env.local` + `.env.example` + `.gitignore`

**1.4: Deploy على Vercel**
- ربط الـ repo + environment variables + أول deploy

**التحقق:** `seraj-store.vercel.app` ← الديمو يشتغل بالظبط زي ما هو locally

---

## المرحلة 2: قاعدة البيانات + API (Backend Foundation)

**الهدف:** MongoDB متصل + API Routes تخدم المنتجات والطلبات

### المهام:

**2.1: اتصال MongoDB + Models**
- `src/lib/db.ts`: Singleton connection
- `src/lib/models/Product.ts`: كل حقول المنتج (slug, name, price, category, media, reviews, etc.)
- `src/lib/models/Order.ts`: رقم الطلب + المنتجات + بيانات العميل (الاسم + الموبايل الأهم) + customStory
- `src/lib/models/Review.ts`: آراء الأمهات

**2.2: Seed Script**
- `scripts/seed.ts`: ينقل الـ 4 منتجات من `PRODUCTS` في app.js للـ MongoDB
- `npm run seed`

**2.3: API Routes**
- `GET /api/products` — كل المنتجات (+ فلتر بالتصنيف)
- `GET /api/products/[slug]` — منتج واحد
- `POST /api/orders` — إنشاء طلب (Zod validation)
- `GET /api/orders` — كل الطلبات (للأدمن)
- `GET /api/orders/[id]` — تفاصيل طلب
- `PATCH /api/orders/[id]` — تحديث حالة
- `POST /api/upload` — رفع صورة لـ Cloudinary

**التحقق:** كل endpoint يشتغل بـ curl

---

## المرحلة 3: ربط الفرونت بالباك إند (Frontend ↔ API)

**الهدف:** الديمو يقرأ من DB ويحفظ الطلبات

### المهام:

**3.1: المنتجات من API** — تعديل app.js ليعمل fetch بدل hardcoded data (مع fallback)

**3.2: حفظ السلة في localStorage** — تبقى موجودة بعد reload

**3.3: إرسال الطلب للـ API** — checkout يحفظ في MongoDB + يرجع orderNumber حقيقي

**3.4: حفظ بيانات المعالج** — wizard data تتحفظ مع الطلب

**3.5: تعديل checkout form** — إضافة حقول: اسم + موبايل (الأهم) + عنوان + ملاحظات

**التحقق:** المنتجات من DB + السلة persistent + الطلبات تتحفظ

---

## المرحلة 4: لوحة التحكم (Admin Panel)

**الهدف:** `/admin` لإدارة كل حاجة

### المهام:

**4.1: المصادقة** — NextAuth + Credentials (أدمن واحد)
**4.2: Dashboard** — إحصائيات + آخر 5 طلبات
**4.3: إدارة الطلبات** — جدول + فلترة + تغيير حالة + تفاصيل
**4.4: إدارة المنتجات** — CRUD كامل (إضافة/تعديل/حذف)
**4.5: إدارة القصص** — عرض طلبات المعالج + صور الأطفال + تحديث الحالة

**التحقق:** login → dashboard → تعديل منتج يظهر في الموقع

---

## المرحلة 5: التحسينات (اختياري)

- Cloudinary upload في المعالج
- WhatsApp integration ديناميكي
- SEO + Performance
- إشعارات الأدمن

---

## المتطلبات من المستخدم

### تم استلامها:
| # | المطلوب | الحالة |
|---|---------|--------|
| 1 | MongoDB Atlas credentials | ✅ |
| 2 | Cloudinary credentials | ✅ |

### لسه محتاج:
| # | المطلوب | التفاصيل |
|---|---------|----------|
| 3 | **Cloudinary Upload Preset** | اعمله من Settings → Upload → Add preset → Unsigned |
| 4 | **بيانات الأدمن** | إيميل + باسورد للوحة التحكم |
| 5 | **رقم واتساب** | بالكود الدولي (مثلاً 201012345678) |
| 6 | **بيانات InstaPay** | الاسم + الرقم اللي يظهر في الدفع |
| 7 | **تأكيد الأسعار** | أسعار المنتجات الـ 4 صحيحة؟ |

---

## Tech Stack (كله مجاني)

| الأداة | الاستخدام |
|--------|----------|
| Next.js 15 | API Routes + Admin Panel |
| MongoDB Atlas M0 | قاعدة البيانات (512MB مجاني) |
| Cloudinary Free | رفع الصور (25GB) |
| Vercel Hobby | Hosting + CDN |
| NextAuth.js v5 | حماية الأدمن |
| Tailwind + shadcn/ui | تصميم لوحة التحكم |
| Mongoose | ORM |
| Zod | Validation |
