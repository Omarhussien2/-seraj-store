# سِراج — ملف الذاكرة الكامل (MEMORY)
> هذا الملف هو المرجع الأساسي لأي وكيل جديد يعمل على المشروع.
> آخر تحديث: 2026-04-13

---

## 1. ما هو مشروع "سِراج"؟

سِراج هو **متجر إلكتروني مصري** متخصص في:
- **قصص أطفال جاهزة** — من سلسلة "سباق الفتوحات" (مثل: خالد بن الوليد)
- **قصص أطفال مخصصة** — تُكتب يدوياً باسم الطفل وبتعلم قيمة من اختيارك
- **فلاش كاردز** — كروت تعليمية (روتين يومي، مشاعر، الخ)
- **مجموعات (Bundles)** — قصة مخصصة + كروت + قصة من السلسلة
- **ألعاب تعليمية** — قريباً (بورد جيم، بازل، ذاكرة)

**المنتجات المحذوفة:** ملصقات + بوستر + حزمة رمضان — **لم تعد موجودة**

**الشخصية الرئيسية:** سِراج — أرنب أخضر بأسلوب Steampunk يرشد المستخدم في كل الصفحات.

**الستيل:** Duolingo-style — ألوان دافئة، أنيميشن خفيف، أزرار 3D، RTL عربي.

**المستخدمون:** 90% موبايل — كل شيء Mobile-First.

**التكلفة:** صفر — Vercel + MongoDB Atlas + Cloudinary + GitHub كلها مجانية.

**توليد القصص:** يدوي — لا API توليد. الأدمن يستلم بيانات المعالج ويرسل عينة يدوياً عبر واتساب.

**الدفع:** InstaPay فقط — عربون إلزامي (٥٠ ج.م) + الباقي كاش عند الاستلام. لا فودافون كاش.

---

## 2. هيكل الملفات

```
C:\Users\omarh\Downloads\code projects\seraj-store\
├── PLAN.md                          ← خطة التنفيذ الكاملة (11 مرحلة)
├── MEMORY.md                        ← هذا الملف
├── وثيقة المراجعة التقنية_....md     ← التفاصيل التقنية
├── وثيقة رحلة المستخدم...md         ← UX/UI Blueprint
├── المحتوى النصي...md               ← النصوص المرجعية (Single Source of Truth)
├── _التصور المتكامل...md            ← وصف الشخصيات
├── صفحة الهبوط...md                 ← محتوى الصفحات بالشخصيات
│
├── demo/                            ← النسخة التفاعلية (Static HTML Prototype)
│   ├── index.html                   ← كل الصفحات كـ SPA
│   ├── styles.css                   ← Design System كامل
│   ├── app.js                       ← Router + Products + Cart + Wizard + Videos
│   ├── HANDOFF.md                   ← توثيق الديمو
│   └── assets/                      ← صور + فيديوهات
│       ├── seraj.png
│       ├── khaled-v2.png            ← غلاف قصة خالد
│       ├── family-photo.mp4         ← فيديو Hero
│       ├── 1-.mp4, 2.mp4, 3.mp4    ← فيديوهات Zig-Zag
│       └── (9 شخصيات + family-group.png)
│
├── ui&ux - سراج.../                  ← صور UI أصلية (placeholder)
└── charachters images/فيديوهات/     ← مصدر الفيديوهات الأصلية
```

---

## 3. حالة الديمو الحالية

### صفحات مبنية وتعمل ✅
| Route | الصفحة | Status |
|-------|--------|--------|
| `#/home` | الصفحة الرئيسية | ✅ كامل |
| `#/products` | كتالوج المنتجات (4 منتجات + فلترات شغالة) | ✅ كامل |
| `#/product/*` | تفصيل منتج (ديناميكي — data-driven) | ✅ كامل |
| `#/cart` | سلة التسوق (عرض + حذف + ملخص) | ✅ كامل |
| `#/about` | حكايتنا + العيلة (9 شخصيات) | ✅ كامل |
| `#/wizard` | معالج التأليف (4 خطوات) | ✅ كامل |
| `#/preview` | معاينة القصة | ✅ كامل |
| `#/checkout` | الدفع (عربون + VIP + InstaPay QR) | ✅ كامل |
| `#/success` | النجاح + كونفيتي | ✅ كامل |
| `#/how-it-works` | scroll لقسم في home | ✅ كامل |
| `#/mama-world` | عالم ماما (مقالات+فسحة+شات) | ✅ كامل |

### أقسام الصفحة الرئيسية (من أعلى لأسفل)
1. **Topbar** — Logo + Nav + أيقونة السلة + CTA pill
2. **Hero** — فيديو يمين + نص يسار (Desktop RTL) / فيديو فوق + نص تحت (Mobile)
3. **Marquee** — شريط متحرك صغير
4. **Products** — خالد بن الوليد + القصة المخصصة + كروت (قريباً)
5. **Social Proof** — عداد + صور قصص مخصصة
6. **Zig-Zag** — "إزاي سراج بيعمل قصة بصورة ابنك؟" — 3 خطوات بفيديوهات
7. **Values** — 5 كاردز قيم (شجاعة، نظافة، علم، احترام، صبر)
8. **Testimonials** — 3 آراء أمهات
9. **CTA Ribbon** — "مستنية إيه؟ خلّي بطلنا يبدأ حكايته النهاردة!"
10. **Footer** — روابط + واتساب
11. **Bottom Nav** — Mobile فقط

---

## 4. Design System

### الألوان
```css
--seraj: #6bbf3f       /* أخضر رئيسي */
--seraj-dark: #4a9128  /* ظل الأزرار */
--brass: #c9974e       /* نحاسي */
--ember: #e85d4c       /* أحمر */
--teal: #36a39a        /* فيروزي */
--ink: #231a14         /* أسود النصوص */
--cream: #ffffff       /* خلفية */
```

### الخطوط
- **عناوين:** Baloo Bhaijaan 2 (weight: 800)
- **نصوص:** Tajawal (weight: 500)
- **Logo:** Lalezar

### مبادئ مهمة
- **كل الفيديوهات:** `muted` + `loop` + `playsinline` + `autoplay` + `preload="none"`
- **Lazy loading:** IntersectionObserver لكل فيديو — يتحمل لما يظهر فقط
- **أزرار:** 3D effect بـ `box-shadow: 0 Npx 0 var(--color)` + `translateY` on active
- **RTL:** `dir="rtl"` + `lang="ar"` في الـ html tag
- **Bottom Nav:** يختفي فوق 900px
- **منتجات "قريباً":** `.coming-soon` class → opacity .55 + grayscale + pointer-events none + `.soon-overlay`

### الـ Green Highlight (Duolingo-style)
```css
.highlight {
  background: linear-gradient(180deg, transparent 55%, var(--seraj-light) 55%, var(--seraj-light) 90%, transparent 90%);
  padding: 0 6px;
  border-radius: 4px;
}
```

---

## 5. النصوص المعتمدة (لا تُغيّر بدون إذن)

> ⚠️ المرجع الوحيد هو ملف "المحتوى النصي بالعامية المصرية"

### Hero Banner
- **العنوان:** متعة القراءة واللعب.. في حكايات بتصنع أبطال بجد!
- **CTA أساسي:** يلا يا سراج.. ألف قصة لبطلنا (أخضر)
- **CTA ثانوي:** شوفي المنتجات (أبيض بحدود)

### Zig-Zag Section
- **العنوان:** إزاي سراج بيعمل قصة بصورة ابنك؟
- **خطوة 1:** قولي لسراج اسم بطلنا وسنه
- **خطوة 2:** سراج هيدخل ورشه السحرية يكتب ويرسم القصة مخصوص ليه
- **خطوة 3:** القصة هتجيلك مطبوعة بجودة عالية لحد باب البيت

### المعالج (Wizard)
- **خطوة 1:** أهلاً بيكي! قوليلي اسم بطلنا إيه؟ وعنده كام سنة؟
- **خطوة 2:** البطل القوي محتاج صفة تميزه.. تحب بطلنا يكون إزاي؟
- **خطوة 3:** ارفعي صورة بطلنا هنا.. وأنا هطير بيها لورشة سِراج فوراً!
- **خطوة 4:** ثواني.. ورشة سِراج بدأت شغل!

### الدفع
- **عربون:** ادفعي ٥٠ جنيه بس والباقي بعد البروفة
- **VIP:** خلصي الدفع دلوقتي وطلباتك هتخلص أول واحدة!

### النجاح
- **سِراج استلم الإيصال.. الحكاية بدأت!**

---

## 6. الشخصيات (9 شخصيات + 1 طائر)

| الاسم | الملف | الدور | يظهر في |
|-------|-------|-------|---------|
| سِراج ★ | seraj.png | البطل الرئيسي — الأرنب الأخضر | كل الصفحات |
| الجدة زينب | grandma-fatima-seated.png | حارسة الحكايات | About + Mama World |
| تقى (الأم) | mom-amira.png | مخترعة آلة الزمن | About |
| عمر (الأب) | dad-mostafa.png | المؤرخ | About |
| القائد خالد | khaled-v2.png | بطل الشجاعة | Wizard Step 2 + Product Detail |
| ليلى | layla.png | رفيقة الرحلة الوفيّة | About |
| يونس | omar.png | رفيق المغامرات | About |
| داوود الصغير | zain.png | أخو يونس | About |
| هدى | huda-bird.png | الحمامة الآلية | Wizard Step 3 + About |

---

## 7. الفيديوهات

| الملف | الموقع | الحالة |
|-------|--------|--------|
| family-photo.mp4 | Hero banner | ✅ موجود |
| 1-.mp4 | Zig-Zag خطوة 1 | ✅ موجود |
| 2.mp4 | Zig-Zag خطوة 2 | ✅ موجود |
| 3.mp4 | Zig-Zag خطوة 3 | ✅ موجود |
| *(فيديو خالد)* | صفحة تفصيل خالد | 🔲 placeholder — لازم يتضاف |
| *(فيديو الكروت)* | صفحة تفصيل الكروت | 🔲 placeholder — لازم يتضاف |
| *(فيديو المجموعة)* | صفحة تفصيل المجموعة | 🔲 placeholder — لازم يتضاف |

**كل الفيديوهات بدون صوت (muted) وبدون borders — مندمجة في الصفحة.**

---

## 8. المنتجات الحالية

### كائن المنتجات (الـ Data Model)

```
PRODUCTS = {
  'story-khaled': {
    name: 'قصة خالد بن الوليد',
    badge: 'الأكثر طلباً',
    price: 140,           // جنيه مصري
    priceText: '١٤٠ ج.م',
    category: 'قصص جاهزة',
    action: 'cart',       // → يضاف للسلة
    media: { type: 'book3d', image: 'khaled-v2.png', bg: 'emerald' },
    reviews: [...],       // 2-3 آراء أمهات
    related: ['custom-story', 'bundle']
  },
  'custom-story': {
    name: 'القصة المخصصة',
    badge: 'مخصصة باسم بطلنا',
    price: 220,
    priceText: '٢٢٠ ج.م',
    category: 'قصص مخصصة',
    action: 'wizard',     // → يروح للمعالج
    media: { type: 'book3d', image: 'seraj.png', bg: 'emerald' },
    reviews: [...],
    related: ['story-khaled', 'bundle']
  },
  'flash-cards': {
    name: 'كروت الروتين اليومي',
    badge: 'قريباً',
    price: 150,
    priceText: '١٥٠ ج.م',
    category: 'فلاش كاردز',
    action: 'none',       // → معطل (قريباً)
    comingSoon: true,
    media: { type: 'cards-fan', bg: 'sand' },
    reviews: [...],
    related: ['story-khaled', 'bundle']
  },
  'bundle': {
    name: 'مجموعة الأبطال الصغار',
    badge: 'وفّري ٢٠٪',
    price: 420,
    originalPrice: 530,   // السعر قبل الخصم
    priceText: '٤٢٠ ج.م',
    category: 'مجموعات',
    action: 'cart',
    media: { type: 'bundle-stack', bg: 'teal' },
    reviews: [...],
    related: ['story-khaled', 'custom-story']
  }
}
```

### أنواع المنتجات ومسارها
| النوع | الـ action | المسار |
|-------|-----------|--------|
| قصة جاهزة | `cart` | صفحة تفصيل → أضيفي للسلة → سلة → checkout → InstaPay |
| قصة مخصصة | `wizard` | صفحة تفصيل → ابدئي القصة → Wizard → Preview → Checkout |
| كروت فلاش | `none` | صفحة تفصيل → زر "قريباً" معطل |
| مجموعة | `cart` | صفحة تفصيل → أضيفي للسلة → سلة → checkout → InstaPay |
| ألعاب تعليمية | TBD | 🔲 قريباً |

---

## 9. سلة التسوق — النظام الحالي

### Flow
1. المستخدم يضغط "أضيفي للسلة" في صفحة المنتج
2. المنتج بيتضاف لـ `cart[]` array في JS
3. Badge counter بيتحدث في التوب بار
4. Toast بتظهر: "اسم المنتج اتضاف للسلة ✦"
5. المستخدم يضغط أيقونة السلة → صفحة `#/cart`
6. الصفحة بتعرد: منتجات + ملخص (إجمالي + شحن + عربون)
7. "إتمام الطلب" → `#/checkout` → InstaPay QR → `#/success`

### الصفحة بتعرض:
- **لو فاضية:** رسالة + زرار "شوفي المنتجات"
- **لو فيها منتجات:** كروت المنتجات + زرار ✕ للحذف + ملخص + إتمام الطلب

### ملاحظات للباك إند:
- الدنيا دلوقتي **client-side only** (لا session, لا DB)
- لما نربط الباك إند: `cart` هيحصل في MongoDB session أو localStorage
- الأسعار حالياً hardcoded في JS — لازم تتحط في DB
- Arabون (٥٠ ج.م) ثابت — لازم يكون configurable من admin

---

## 10. فلترات الكتالوج

### آلية العمل:
- كل chip فيه `data-filter` (all / قصص جاهزة / قصص مخصصة / فلاش كاردز / مجموعات)
- كل كارت منتج فيه `data-cat` بالتصنيف
- لما المستخدم يضغط chip → JS بيخفي/يظهر الكروت حسب التصنيف
- `auto-fill` مش `auto-fit` عشان الكروت متمدّش بالعرض الكامل

---

## 11. ما تم تعديله — سجل الجلسات

### الجلسة الأولى
1. ✅ إعادة كتابة PLAN.md
2. ✅ تحديث وثائق التقنية و UX
3. ✅ توحيد النصوص (Single Source of Truth)
4. ✅ تعديل Hero + Zig-Zag + فيديوهات + Marquee

### الجلسة الثانية — مراجعة شاملة وإصلاح أعطال
5. ✅ إضافة `@keyframes bob` المفقود
6. ✅ إصلاح `href="#"` → ما بتعملش صفحة بيضاء
7. ✅ إصلاح WhatsApp button في صفحة النجاح
8. ✅ منع Form submission في Wizard
9. ✅ إصلاح Wizard stuck in loop
10. ✅ إصلاح Speech Bubble + Book 3D RTL + value-card active + filter chips
11. ✅ إعادة ترتيب أقسام الصفحة الرئيسية

### الجلسة الثالثة — تعديل كروت الصفحة الرئيسية
12. ✅ استبدال كروت المنتجات الـ 3 (خالد + مخصصة + كروت قريباً)
13. ✅ حذف كارت bundle من الصفحة الرئيسية
14. ✅ إضافة CSS لـ coming-soon cards

### الجلسة الرابعة — صفحات تفصيلية + سلة + فلترات (2026-04-13)
15. ✅ حذف 3 منتجات: ملصقات + بوستر + حزمة رمضان
16. ✅ تحديث فلتر الكتالوج (5 فلاتر شغالة)
17. ✅ بناء نظام صفحات تفصيلية data-driven (`PRODUCTS` object)
18. ✅ كل صفحة تفصيلية: back nav + hero + features + video placeholder + آراء + مقترحات
19. ✅ 3 أنواع CTA: cart / wizard / none (قريباً)
20. ✅ Bundle يعرض سعر مشطوب + خصم
21. ✅ أيقونة سلة في التوب بار + badge counter
22. ✅ Toast notification عند الإضافة
23. ✅ صفحة سلة كاملة (`#/cart`) — عرض + حذف + ملخص
24. ✅ إصلاح الفلاتر (كانت بتغير اللون بس من غير ما تخفي المنتجات)
25. ✅ إصلاح عرض الكروت بعد الفلتر (`auto-fill` بدل `auto-fit`)

---

## 12. ما لم يُبنَ بعد (المهام القادمة)

### أولوية عالية — الديمو
- [ ] إضافة فيديوهات حقيقية لصفحات المنتجات (حالياً placeholder)
- [ ] ضبط أحجام الفيديوهات على الموبايل — **محتاج مراجعة يدوية**
- [ ] إزالة/تعديل أي قسم مش مكتمل

### أولوية عالية — سلة + checkout
- [ ] صفحة checkout تتحدث ديناميكياً حسب محتوى السلة (حالياً static)
- [ ] ربط checkout بـ InstaPay API حقيقي
- [ ] إرسال طلب واتساب بالتفاصيل تلقائياً
- [ ] حفظ السلة في localStorage (تبقى موجودة بعد reload)

### أولوية عالية — Next.js (الباك إند الحقيقي)
- [ ] إنشاء مشروع Next.js 15 + TypeScript + Tailwind
- [ ] تحويل الـ Demo لـ React components
- [ ] Wizard state → Zustand store
- [ ] API Routes للـ Orders و Stories

---

## 13. 🏗️ الباك إند — الخطة التقنية

### Tech Stack (المقرر)
| الأداة | الاستخدام | التكلفة |
|--------|----------|---------|
| Next.js 15 | Framework + API Routes + SSR | مجاني |
| MongoDB Atlas | قاعدة البيانات | مجاني (512MB) |
| Cloudinary | رفع صور الأطفال | مجاني (25GB) |
| Vercel | Hosting + Deployment | مجاني (Hobby) |
| InstaPay | الدفع | — |
| WhatsApp API | إرسال تفاصيل الطلب | مجاني |

### Database Schema (MongoDB)
```javascript
// المنتجات
products {
  _id: ObjectId,
  slug: "story-khaled",           // unique identifier
  name: "قصة خالد بن الوليد",
  nameEn: "Khalid ibn Al-Walid Story",
  badge: "الأكثر طلباً",
  category: "قصص جاهزة",          // قصص جاهزة | قصص مخصصة | فلاش كاردز | مجموعات | ألعاب
  price: 140,
  originalPrice: null,            // لو فيه خصم
  description: "...",
  features: ["..."],
  media: { type: "book3d", image: "khaled-v2.png", bg: "emerald" },
  video: "assets/khaled-video.mp4",  // null لو مفيش
  action: "cart",                 // cart | wizard | none
  comingSoon: false,
  reviews: [{ text, name, place, color, initial }],
  related: ["custom-story", "bundle"],
  active: true,
  order: 1,                       // ترتيب العرض
  createdAt, updatedAt
}

// الطلبات
orders {
  _id: ObjectId,
  orderNumber: "SRJ-2026-0847",
  items: [{ productSlug, productName, price, qty }],
  total: 420,
  deposit: 50,                    // العربون المدفوع
  paymentMethod: "instapay",
  paymentStatus: "deposit_paid",  // deposit_paid | fully_paid | unpaid
  orderStatus: "pending",         // pending | in_progress | shipped | delivered
  // لو فيها قصة مخصصة:
  customStory: {
    heroName: "يوسف",
    age: 5,
    challenge: "شجاعة",
    photo: "cloudinary-url",
    wizardCompleted: true
  },
  customerPhone: "01012345678",
  customerName: "منى",
  shippingAddress: "...",
  notes: "",
  createdAt, updatedAt
}

// آراء الأمهات (لو عايزين إدارة منفصلة)
reviews {
  _id: ObjectId,
  productSlug: "story-khaled",
  text: "...",
  name: "منى — أم يوسف",
  place: "القاهرة · ٦ سنين",
  color: "#6bbf3f",
  initial: "م",
  approved: true,
  createdAt
}
```

### API Routes (Next.js)
```
GET    /api/products              → كل المنتجات (active only)
GET    /api/products/[slug]       → منتج واحد
GET    /api/products?category=قصص جاهزة  → فلتر بالتصنيف

POST   /api/orders                → إنشاء طلب جديد
GET    /api/orders/[id]           → تفاصيل طلب
PATCH  /api/orders/[id]/status    → تحديث حالة الطلب (admin)

POST   /api/upload/photo          → رفع صورة الطفل (Cloudinary)

POST   /api/whatsapp/notify       → إرسال واتساب بالتفاصيل

GET    /api/reviews?product=slug  → آراء منتج
POST   /api/reviews               → إضافة رأي (admin approve)
```

### Workflow — من الديمو للإنتاج
```
1. Demo (الحالي)           → Static HTML + JS + data in PRODUCTS object
                                ↓
2. Next.js Migration       → تحويل لـ React components
   - صفحات SPA → React pages
   - PRODUCTS object → /api/products
   - cart[] array → Zustand store + localStorage
   - Wizard state → Zustand
   - Router → next/router
                                ↓
3. Backend Integration     → MongoDB + API
   - المنتجات من DB مش hardcoded
   - الطلبات تتخزن في MongoDB
   - صور الأطفال تتخزن في Cloudinary
                                ↓
4. Payment Integration     → InstaPay
   - Checkout page تتصل بـ InstaPay API
   - webhook لتحديث حالة الدفع
                                ↓
5. Admin Dashboard         → Next.js route (/admin)
   - إضافة/تعديل منتجات
   - إدارة الطلبات
   - إدارة الآراء
   - رفع صور وفيديوهات
```

### Cart Flow (الإنتاج)
```
User يضيف منتج → POST /api/orders (create draft)
                → localStorage يحتفظ بالـ cart ID
                → كل إضافة/حذف → PATCH /api/orders/[id]/items

Checkout:
  1. POST /api/orders/[id]/checkout
  2. → InstaPay payment link (50 ج.م عربون)
  3. → User يدفع → InstaPay webhook → PATCH order status
  4. → WhatsApp notification للأدمن
  5. → Success page مع رقم الطلب
```

### ملاحظات مهمة للباك إند
- **الأسعار:** لازم تكون في DB مش hardcoded — عشان الأدمن يقدر يغيرها
- **العربون:** ٥٠ ج.م ثابت حالياً — لازم يكون configurable per product
- **الشحن:** حالياً "مجاناً" — ممكن يتغير حسب المنطقة
- **الفيديوهات:** لازم تتخزن على Cloudinary مش في assets/
- **صور الأطفال:** Cloudinary بـ upload preset آمن
- **الواتساب:** ممكن يتبعت عبر WhatsApp Business API أو مجرد deep link `wa.me`
- **SEO:** كل صفحة منتج محتاجة meta tags + Open Graph + structured data
- **الألعاب التعليمية:** نفس الـ data model بس `category: "ألعاب"` + `action: "cart"`

---

## 14. طريقة تشغيل الديمو

```bash
cd "C:\Users\omarh\Downloads\code projects\seraj-store\demo"
python -m http.server 3000
# ثم افتح: http://127.0.0.1:3000
```

أو افتح `demo/index.html` مباشرة في المتصفح (الفيديوهات تحتاج server).

---

## 15. قواعد مهمة لأي وكيل

1. **لا تُغيّر النصوص** بدون الرجوع لملف "المحتوى النصي" — هو المرجع الوحيد
2. **كل فيديو muted دائماً** — لا صوت أبداً
3. **لا borders على الفيديوهات** — مندمجة في الصفحة بدون إطارات
4. **Mobile-First دائماً** — 90% من المستخدمين موبايل
5. **RTL عربي** — كل شيء من اليمين لليسار
6. **لا مكتبات مدفوعة** — كل شيء مجاني
7. **لا توليد آلي للقصص** — الأدمن يراجع يدوياً
8. **افتح الديمو في المتصفح بعد كل تعديل** وتأكد أنه يشتغل
9. **لا تضيف Lottie أو Three.js** — Framer Motion فقط للأنيميشن
10. **أخطاء الـ console؟** صلحها فوراً — لا تترك أخطاء
11. **منتجات "قريباً":** `.coming-soon` class → باهت + غير قابل للضغط + overlay
12. **كل منتج جديد:** أضيفه في `PRODUCTS` object في app.js + في الكتالوج + في الصفحة الرئيسية
13. **الأسعار:** استخدم أرقام عربية (١٤٠ مش 140) في الـ display بس أرقام إنجليزية في الكود
