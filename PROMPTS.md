# برومتات تنفيذ متجر سِراج — مرحلة بمرحلة
> انسخ والصق كل برومت في جلسة جديدة عند بدء المرحلة

---

## برومت المرحلة 1: الإعداد + النشر الأول

```
أنا عايز أبدأ المرحلة 1 من خطة تحويل متجر سِراج للإنتاج.

## السياق
عندي ديمو شغال في `demo/` (index.html + styles.css + app.js + assets/) — متجر إلكتروني كامل لقصص أطفال بـ vanilla HTML/CSS/JS مع hash routing.

## المطلوب
1. أنشئ مشروع Next.js 15 (App Router + TypeScript + Tailwind) في مجلد المشروع الحالي
   - `npx create-next-app@latest . --typescript --tailwind --app --src-dir`
   - ثبت: `mongoose next-auth@beta zod bcryptjs cloudinary`
   - ثبت Dev: `@types/bcryptjs`

2. انقل ملفات الديمو لـ `public/`:
   - `demo/index.html` → `public/index.html`
   - `demo/styles.css` → `public/styles.css`
   - `demo/app.js` → `public/app.js`
   - `demo/assets/` → `public/assets/`

3. عدّل `next.config.ts`:
   - أضف rewrite: `{ source: '/', destination: '/index.html' }`
   - هذا يخلي `/` يعرض الديمو بدل صفحة Next.js الافتراضية

4. أنشئ `.env.example`:
   ```
   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/seraj
   NEXTAUTH_SECRET=your-random-secret-here
   NEXTAUTH_URL=http://localhost:3000
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   CLOUDINARY_UPLOAD_PRESET=seraj-uploads
   NEXT_PUBLIC_WHATSAPP_NUMBER=201234567890
   NEXT_PUBLIC_INSTAPAY_NUMBER=01234567890
   NEXT_PUBLIC_INSTAPAY_NAME=سراج ستور
   ADMIN_EMAIL=admin@seraj.com
   ADMIN_PASSWORD=change-me
   ```

5. أنشئ `.env.local` فاضي (أنا هملأه ببياناتي)

6. عدّل `.gitignore` ليشمل: `.env.local`, `.next/`, `node_modules/`

7. احذف `src/app/page.tsx` الافتراضي أو خليه redirect لـ `/index.html`

8. شغّل `npm run dev` وتأكد إن:
   - `localhost:3000` يعرض الديمو
   - كل الصفحات شغالة (home, products, wizard, checkout, about)
   - الفيديوهات والصور تشتغل

## قواعد مهمة
- لا تغيّر أي شيء في ملفات الديمو (index.html, styles.css, app.js) — بس انقلهم
- كل التقنيات مجانية — لا اشتراكات
- RTL عربي — `dir="rtl"` و `lang="ar"`
- اقرأ @MEMORY.md و @PRODUCTION-PLAN.md للسياق الكامل
```

---

## برومت المرحلة 2: قاعدة البيانات + API

```
أنا عايز أبدأ المرحلة 2 من خطة تحويل متجر سِراج.

## السياق
المرحلة 1 خلصت — عندي مشروع Next.js 15 شغال، والديمو في `public/` يشتغل تمام.

## المطلوب

### 1. اتصال MongoDB (`src/lib/db.ts`)
- Singleton connection pattern (يمنع اتصالات متعددة في Serverless)
- يقرأ `MONGODB_URI` من `.env.local`

### 2. Mongoose Models

**`src/lib/models/Product.ts`:**
```typescript
{
  slug: string,          // unique — "story-khaled"
  name: string,          // "قصة خالد بن الوليد"
  badge: string,         // "الأكثر طلباً"
  badgeSoon?: boolean,   // true لو badge "قريباً"
  price: number,         // 140
  originalPrice?: number, // 530 (لو فيه خصم)
  priceText: string,     // "١٤٠ ج.م"
  originalPriceText?: string, // "٥٣٠ ج.م"
  category: string,      // "قصص جاهزة" | "قصص مخصصة" | "فلاش كاردز" | "مجموعات"
  longDesc: string,      // الوصف الطويل
  features: string[],    // مميزات المنتج
  media: {
    type: string,        // "book3d" | "cards-fan" | "bundle-stack"
    image?: string,      // "assets/khaled-v2.png"
    title?: string,      // "خالد بن<br/>الوليد"
    bg: string           // "emerald" | "sand" | "teal"
  },
  action: string,        // "cart" | "wizard" | "none"
  ctaText: string,       // "أضيفي للسلة"
  comingSoon: boolean,
  reviews: [{
    text: string,
    name: string,
    place: string,
    color: string,
    initial: string
  }],
  related: string[],     // slugs
  active: boolean,
  order: number,
  createdAt: Date,
  updatedAt: Date
}
```

**`src/lib/models/Order.ts`:**
```typescript
{
  orderNumber: string,   // "SRJ-2026-XXXX" — auto-generated
  items: [{
    productSlug: string,
    name: string,
    price: number,
    qty: number
  }],
  total: number,
  deposit: number,       // 50 (العربون)
  remaining: number,     // total - deposit
  paymentMethod: "instapay",
  paymentStatus: "unpaid" | "deposit_paid" | "fully_paid",
  orderStatus: "pending" | "in_progress" | "shipped" | "delivered",
  customStory?: {
    heroName: string,
    age: number,
    challenge: string,
    photoUrl?: string
  },
  // ⭐ البيانات الأهم
  customerName: string,       // مطلوب
  customerPhone: string,      // مطلوب (01XXXXXXXXX)
  address: string,
  notes?: string,
  createdAt: Date,
  updatedAt: Date
}
```

### 3. Seed Script (`scripts/seed.ts`)
- اقرأ الـ `PRODUCTS` object من `public/app.js` (الأسطر 17-82)
- أنشئ seed script ينقل الـ 4 منتجات (story-khaled, custom-story, flash-cards, bundle) للـ MongoDB
- أضف script في package.json: `"seed": "npx tsx scripts/seed.ts"`
- البيانات الكاملة لكل منتج موجودة في الـ PRODUCTS object — انقلها كما هي

### 4. API Routes

**`GET /api/products`** (`src/app/api/products/route.ts`):
- يرجع كل المنتجات الـ active مرتبة حسب `order`
- يدعم query parameter: `?category=قصص جاهزة`

**`GET /api/products/[slug]`** (`src/app/api/products/[slug]/route.ts`):
- يرجع منتج واحد حسب الـ slug

**`POST /api/orders`** (`src/app/api/orders/route.ts`):
- ينشئ طلب جديد
- يولّد `orderNumber` تلقائي (SRJ-2026-XXXX)
- Zod validation: customerName مطلوب، customerPhone مصري (01XXXXXXXXX)، address مطلوب
- يرجع الطلب مع orderNumber

**`GET /api/orders`** (`src/app/api/orders/route.ts`):
- كل الطلبات (للأدمن — بدون حماية مؤقتاً)
- يدعم `?status=pending`

**`GET /api/orders/[id]`** (`src/app/api/orders/[id]/route.ts`):
- تفاصيل طلب واحد

**`PATCH /api/orders/[id]`** (`src/app/api/orders/[id]/route.ts`):
- تحديث حالة الطلب (orderStatus, paymentStatus)

**`POST /api/upload`** (`src/app/api/upload/route.ts`):
- يستقبل صورة (FormData)
- يرفعها لـ Cloudinary
- يرجع URL

### 5. التحقق
- `npm run seed` ← 4 منتجات في MongoDB
- `curl localhost:3000/api/products` ← يرجع JSON بالمنتجات
- `curl -X POST localhost:3000/api/orders` مع بيانات ← يرجع orderNumber

## قواعد مهمة
- كل endpoint يرجع JSON مع status codes صحيحة (200, 201, 400, 404, 500)
- Error handling موحد في كل route
- لا تغيّر ملفات الديمو (public/) — هنعدلها في المرحلة 3
- اقرأ @MEMORY.md و @PRODUCTION-PLAN.md للسياق الكامل
```

---

## برومت المرحلة 3: ربط الفرونت بالباك إند

```
أنا عايز أبدأ المرحلة 3 من خطة تحويل متجر سِراج.

## السياق
المرحلة 1 و 2 خلصوا:
- Next.js شغال + الديمو في `public/` شغال على Vercel
- MongoDB متصل + 4 منتجات seeded
- API Routes شغالة (`/api/products`, `/api/orders`, `/api/upload`)

الفرونت الحالي (`public/app.js`) فيه `PRODUCTS` object (سطر 17-82) hardcoded + `cart[]` array بتتمسح عند reload.

## المطلوب — تعديل `public/app.js` و `public/index.html`

### 1. جلب المنتجات من API
- عند تحميل الصفحة: `fetch('/api/products')` بدل الـ `PRODUCTS` object الثابت
- خزّن الناتج في متغير `PRODUCTS` (نفس الاسم عشان باقي الكود يشتغل)
- **Fallback مهم:** لو الـ fetch فشل ← استخدم البيانات المحلية الحالية (graceful degradation)
- كل function بتستخدم `PRODUCTS` لازم تشتغل بعد ما الـ fetch يكتمل
- ممكن تخلي الـ PRODUCTS object الحالي كـ fallback default ثم تعمل overwrite لما الـ API يرد

### 2. حفظ السلة في localStorage
- عند كل `addToCart` / `removeFromCart`:
  - `localStorage.setItem('seraj-cart', JSON.stringify(cart))`
- عند تحميل الصفحة:
  - `cart = JSON.parse(localStorage.getItem('seraj-cart') || '[]')`
  - حدّث badge counter
- السلة تبقى موجودة حتى بعد reload

### 3. إرسال الطلب للـ API عند الـ Checkout
- في صفحة `#/checkout`:
  - أضف حقول فورم حقيقية: **اسم الأم** + **رقم التليفون** (الأهم!) + العنوان + ملاحظات
  - عند "إتمام الطلب":
    ```javascript
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName, customerPhone, address, notes,
        items: cart.map(item => ({
          productSlug: item.slug,
          name: item.name,
          price: item.price,
          qty: item.qty || 1
        })),
        total: calculateTotal(),
        deposit: 50,
        paymentMethod: 'instapay'
      })
    });
    const order = await response.json();
    ```
  - عرض `order.orderNumber` في صفحة `#/success`
  - رابط واتساب ديناميكي: `wa.me/WHATSAPP_NUMBER?text=طلب رقم ${order.orderNumber}...`
  - مسح السلة (localStorage + cart array) بعد النجاح

### 4. حفظ بيانات المعالج
- في `#/wizard` Step 4 (runGenerator):
  - بعد اكتمال المعالج: أضف القصة المخصصة كـ order مع customStory data
  - أو: خزّن بيانات المعالج في localStorage وأرسلها مع الطلب في checkout

### 5. تعديل `public/index.html`
- أضف حقول الفورم في قسم checkout:
  - input: اسم الأم (required)
  - input: رقم التليفون (required, pattern="01[0-9]{9}")
  - input أو textarea: العنوان (required)
  - textarea: ملاحظات (optional)
- نفس الستيل الموجود — استخدم CSS classes الموجودة

## قواعد مهمة
- لا تغيّر شكل أو تصميم الموقع — نفس CSS, نفس layout
- لا تكسر الـ hash routing أو أي functionality موجودة
- اقرأ app.js كامل قبل أي تعديل — فيه functions كتير مترابطة
- اختبر: المنتجات من API + السلة persistent + الطلب يتحفظ في DB
- اقرأ @MEMORY.md و @PRODUCTION-PLAN.md للسياق
```

---

## برومت المرحلة 4: لوحة التحكم (Admin Panel)

```
أنا عايز أبدأ المرحلة 4 من خطة تحويل متجر سِراج.

## السياق
المراحل 1-3 خلصت:
- الديمو شغال على Vercel ومتصل بالباك إند
- المنتجات تيجي من MongoDB عبر `/api/products`
- الطلبات تتحفظ في DB عبر `POST /api/orders`
- محتاج لوحة تحكم على `/admin` لإدارة كل ده

أنا الأدمن الوحيد — لوحة تحكم بسيطة وعملية تكفي.

## المطلوب

### 1. المصادقة (Authentication)
- NextAuth.js v5 مع Credentials provider
- بيانات الأدمن في `.env.local` (ADMIN_EMAIL + ADMIN_PASSWORD)
- لا users collection في MongoDB — أدمن واحد فقط، المقارنة مع env vars مباشرة
- `src/middleware.ts`: يحمي كل `/admin/*` ما عدا `/admin/login`
- صفحة login بسيطة: `src/app/admin/login/page.tsx`

### 2. Admin Layout (`src/app/admin/layout.tsx`)
- Sidebar أو top tabs: Dashboard | الطلبات | المنتجات | القصص
- زر خروج (logout)
- تصميم: Tailwind + shadcn/ui
- ممكن يكون LTR — الأدمن يقدر يتعامل

### 3. Dashboard (`src/app/admin/page.tsx`)
- 4 بطاقات إحصائية:
  - إجمالي الطلبات
  - طلبات جديدة (pending)
  - قصص بانتظار المراجعة
  - إجمالي الإيرادات (مجموع total)
- آخر 5 طلبات في جدول صغير

### 4. إدارة الطلبات (`src/app/admin/orders/page.tsx`)
- جدول بكل الطلبات:
  - رقم الطلب | **اسم العميل** | **التليفون** | المبلغ | حالة الدفع | حالة الطلب | التاريخ
- فلترة حسب الحالة: pending / in_progress / shipped / delivered
- عرض تفاصيل الطلب:
  - المنتجات + الأسعار
  - بيانات القصة المخصصة (اسم الطفل + السن + التحدي + الصورة)
  - العنوان + الملاحظات
- تغيير حالة الطلب (dropdown) ← `PATCH /api/orders/[id]`
- تغيير حالة الدفع (dropdown)

### 5. إدارة المنتجات (`src/app/admin/products/page.tsx`)
- جدول: الاسم | التصنيف | السعر | الحالة (active/inactive) | قريباً؟ | الترتيب
- أزرار: إضافة | تعديل | حذف
- فورم إضافة/تعديل (dialog):
  - كل الحقول من الـ Product model
  - toggle: active / inactive
  - toggle: comingSoon
  - ترتيب العرض (order)
- **أضف API routes جديدة:**
  - `POST /api/products` — إضافة منتج جديد
  - `PATCH /api/products/[slug]` — تعديل منتج
  - `DELETE /api/products/[slug]` — حذف منتج (soft delete → active: false)

### 6. إدارة القصص (`src/app/admin/stories/page.tsx`)
- جدول بالطلبات اللي فيها customStory:
  - اسم الطفل | السن | التحدي | الصورة | الحالة
- عرض صورة الطفل (Cloudinary URL)
- تغيير الحالة: pending → reviewed → sent_to_print → delivered

### 7. تثبيت shadcn/ui
- `npx shadcn@latest init`
- أضف المكونات: Table, Card, Button, Input, Select, Dialog, Badge, DropdownMenu, Tabs

## التحقق
- `/admin` بدون login ← redirect لـ `/admin/login`
- دخول ببيانات صحيحة ← Dashboard
- تعديل سعر منتج ← يظهر في الموقع الرئيسي
- تغيير حالة طلب ← يتحدث في DB
- إضافة منتج جديد ← يظهر في الكتالوج

## قواعد مهمة
- لا تغيّر ملفات الديمو (`public/`)
- كل شيء مجاني — shadcn/ui مش مكتبة خارجية، هي ملفات في مشروعك
- بسيط وعملي — المهم يشتغل مش يكون جميل
- اقرأ @MEMORY.md و @PRODUCTION-PLAN.md للسياق
```

---

## برومت المرحلة 5: التحسينات (اختياري)

```
أنا عايز أبدأ المرحلة 5 (التحسينات) من خطة تحويل متجر سِراج.

## السياق
المراحل 1-4 خلصت:
- الموقع شغال على Vercel + متصل بالباك إند
- لوحة تحكم Admin شغالة

## المطلوب (اختر اللي محتاجه):

### أ. Cloudinary Upload في المعالج
- في Wizard Step 3 (رفع صورة الطفل في public/app.js):
  - استخدم Cloudinary unsigned upload مباشرة من المتصفح
  - عند اختيار الصورة: `POST` لـ `https://api.cloudinary.com/v1_1/CLOUD_NAME/image/upload`
  - خزّن الـ URL ← أرسله مع الطلب

### ب. WhatsApp Integration
- بعد إتمام الطلب: رابط واتساب ديناميكي
  `wa.me/WHATSAPP_NUMBER?text=مرحباً، أنا عملت طلب رقم SRJ-2026-XXXX على متجر سراج. المبلغ: XXX ج.م`
- في لوحة التحكم: زر واتساب جنب كل طلب لفتح محادثة مع العميل

### ج. SEO + Performance
- Meta tags (title + description + Open Graph)
- ضغط الصور PNG → WebP
- ضغط الفيديوهات MP4 → WebM
- Lighthouse audit + إصلاح المشاكل

### د. إشعارات
- لما طلب جديد يتعمل ← واتساب تلقائي للأدمن
- أو polling في الأدمن كل 30 ثانية للطلبات الجديدة

## قواعد مهمة
- كل شيء مجاني 100%
- لا تكسر أي functionality موجودة
- Mobile-first — 90% موبايل
- اقرأ @MEMORY.md و @PRODUCTION-PLAN.md للسياق
```
