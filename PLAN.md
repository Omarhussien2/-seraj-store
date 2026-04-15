# خطة بناء متجر "سراج" الكاملة (Full Implementation Plan)

## ملخص المشروع
- **النوع:** متجر إلكتروني تفاعلي (قصص أطفال مخصصة + فلاش كاردز)
- **الستيل:** Duolingo-style (ألوان دافئة، شخصيات كرتونية، انيميشن خفيف)
- **المستخدمون:** 90% موبايل — كل التصميم Mobile-First
- **الاستضافة:** Vercel (مجاني 100%)
- **قاعدة البيانات:** MongoDB Atlas M0 (مجاني — يكفي 1000 طلب/شهر)
- **الدفع:** InstaPay + WhatsApp (يدوي، بدون بوابة دفع)
- **توليد القصص:** يدوي — الأدمن يستلم البيانات ويرسل عينة قبل الطباعة
- **الميزانية:** صفر — كل التقنيات مجانية بالكامل

---

## 1. الـ Tech Stack (كله مجاني — مع سبب الاختيار)

| المكون | الأداة | ليه اخترناها | الباقة المجانية |
|---|---|---|---|
| **Framework** | Next.js 15 (App Router) | Frontend + Backend في نفس المشروع، SEO ممتاز، سرعة عالية | مفتوح المصدر |
| **اللغة** | TypeScript | آمان أكثر، أخطاء أقل في وقت التشغيل، إكمال تلقائي أفضل | مفتوح المصدر |
| **Styling** | Tailwind CSS v4 | سرعة في التصميم، حجم صغير، RTL built-in | مفتوح المصدر |
| **UI Components** | shadcn/ui | مكونات جاهزة قابلة للتعديل، ليست مكتبة خارجية (ملفات في مشروعك) | مفتوح المصدر |
| **Animations** | Framer Motion فقط | أنيميشن خفيف مثل Duolingo بدون مكتبات إضافية تثقل الموبايل | مفتوح المصدر |
| **State Management** | Zustand | أخف من Redux، بسيط، مثالي لمعالج التأليف | مفتوح المصدر |
| **Forms** | React Hook Form + Zod | تحقق من المدخلات بدون إعادة تصيير | مفتوح المصدر |
| **Database** | MongoDB Atlas (M0 Free) | قاعدة بيانات سحابية، مرنة مع هيكل القصص المتغير | 512MB — يكفي لآلاف الطلبات |
| **ORM** | Mongoose | اتصال سهل بـ MongoDB، Schemas واضحة | مفتوح المصدر |
| **Auth (Admin)** | NextAuth.js v5 | حماية لوحة التحكم فقط (مش للمستخدمين) | مفتوح المصدر |
| **Image Storage** | Cloudinary Free Tier | رفع صور الأطفال + تحسين تلقائي + CDN عالمي | 25GB تخزين + 25GB باندويث/شهر |
| **Icons** | Lucide React | أيقونات بسيطة وخفيفة | مفتوح المصدر |
| **Fonts** | Cairo + Tajawal (Google Fonts) | خطوط عربية جميلة، next/font يحملها محلياً (سرعة) | مجاني |
| **Testing** | Vitest + Testing Library + Playwright | طبقات اختبار شاملة (وحدة + مكونات + E2E) | مفتوح المصدر |
| **Deployment** | Vercel | ربط مباشر بـ GitHub، CDN عالمي، SSL مجاني | Hobby: مجاني 100% |
| **Version Control** | Git + GitHub | كود على GitHub، نسخ احتياطي، تعاون | مجاني للمشاريع المفتوحة |

### ليش ما استخدمناش مكتبات أخرى؟
- **بدون Lottie:** Framer Motion يكفي لأنيميشن Duolingo-style — لا حاجة لمكتبة إضافية
- **بدون Three.js/3D Mockup:** استبدلنا بـ CSS perspective mockup أخف بكثير على الموبايل
- **بدون Redux:** Zustand أبسط وأخف للمتاجر الصغيرة
- **بدون Stripe/Paymob:** الدفع يدوي عبر InstaPay + WhatsApp = بدون رسوم اشتراك

---

## 2. هيكل المشروع (Folder Structure)

```
seraj-store/
├── public/
│   ├── images/
│   │   ├── characters/          # شخصيات سراج والعائلة (PNG / WebP)
│   │   │   ├── seraj.webp
│   │   │   ├── khaled.webp
│   │   │   ├── grandma-fatima.webp
│   │   │   ├── mom-amira.webp
│   │   │   ├── dad-mostafa.webp
│   │   │   ├── layla.webp
│   │   │   ├── omar.webp
│   │   │   ├── zain.webp
│   │   │   └── huda-bird.webp
│   │   ├── products/            # صور المنتجات
│   │   ├── placeholders/        # صور مؤقتة (لحد ما الفيديوهات تتحفظ)
│   │   └── backgrounds/         # خلفيات
│   └── videos/                  # ⭐ فيديوهات الأنيميشن (مضغوطة)
│       ├── seraj-hero.webm      # ≤ 500KB كل فيديو
│       ├── seraj-waving.webm
│       ├── seraj-writing.webm
│       └── seraj-celebrating.webm
│
├── src/
│   ├── app/                     # Next.js App Router
│   │   ├── (shop)/              # Route group للمتجر
│   │   │   ├── page.tsx         # الصفحة الرئيسية
│   │   │   ├── how-it-works/
│   │   │   │   └── page.tsx
│   │   │   ├── about/
│   │   │   │   └── page.tsx
│   │   │   ├── products/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [slug]/
│   │   │   │       └── page.tsx
│   │   │   ├── wizard/          # معالج التأليف
│   │   │   │   ├── page.tsx     # redirect لخطوة 1
│   │   │   │   ├── step-1/      # الاسم والسن
│   │   │   │   ├── step-2/      # التحدي
│   │   │   │   ├── step-3/      # رفع الصورة (اختياري)
│   │   │   │   ├── step-4/      # التوليد
│   │   │   │   └── preview/     # المعاينة
│   │   │   ├── checkout/
│   │   │   │   └── page.tsx
│   │   │   └── success/
│   │   │       └── page.tsx
│   │   ├── admin/               # لوحة تحكم الإدارة
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx         # dashboard
│   │   │   ├── orders/
│   │   │   │   └── page.tsx
│   │   │   ├── products/
│   │   │   │   └── page.tsx
│   │   │   └── stories/
│   │   │       └── page.tsx
│   │   ├── api/                 # Backend API Routes
│   │   │   ├── orders/
│   │   │   │   └── route.ts     # POST (create) + GET (list)
│   │   │   ├── products/
│   │   │   │   └── route.ts     # GET (list) + GET [slug]
│   │   │   ├── stories/
│   │   │   │   └── route.ts     # POST (save wizard data)
│   │   │   ├── upload/
│   │   │   │   └── route.ts     # POST (Cloudinary upload)
│   │   │   └── auth/[...nextauth]/
│   │   │       └── route.ts
│   │   ├── layout.tsx           # Root layout (RTL + fonts)
│   │   ├── globals.css
│   │   └── not-found.tsx
│   │
│   ├── components/
│   │   ├── ui/                  # shadcn components
│   │   ├── layout/
│   │   │   ├── Navbar.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── MobileNav.tsx
│   │   ├── home/
│   │   │   ├── Hero.tsx
│   │   │   ├── HowItWorks.tsx
│   │   │   ├── FamilySection.tsx
│   │   │   ├── FeaturedProducts.tsx
│   │   │   ├── SocialProof.tsx      # ⭐ جديد: قصص حقيقية + صور مطبوعة
│   │   │   └── Testimonials.tsx
│   │   ├── wizard/
│   │   │   ├── WizardLayout.tsx
│   │   │   ├── ProgressBar.tsx
│   │   │   ├── StepNavigator.tsx
│   │   │   ├── NameStep.tsx
│   │   │   ├── ChallengeStep.tsx
│   │   │   ├── PhotoStep.tsx
│   │   │   └── GeneratingStep.tsx
│   │   ├── products/
│   │   │   ├── ProductCard.tsx
│   │   │   ├── ProductGrid.tsx
│   │   │   ├── ProductDetails.tsx
│   │   │   ├── CartDrawer.tsx
│   │   │   └── CrossSell.tsx        # ⭐ جديد: ترشيحات ذكية
│   │   ├── characters/
│   │   │   ├── AnimatedCharacter.tsx # مكون ذكي: فيديو → صورة بديلة
│   │   │   └── CharacterCard.tsx
│   │   └── shared/
│   │       ├── Button.tsx
│   │       ├── WhatsAppButton.tsx
│   │       ├── LoadingSpinner.tsx
│   │       ├── ErrorBoundary.tsx     # ⭐ جديد: التقاط الأخطاء
│   │       └── Toast.tsx             # ⭐ جديد: إشعارات
│   │
│   ├── lib/
│   │   ├── db.ts                    # اتصال MongoDB (singleton)
│   │   ├── cloudinary.ts            # ⭐ إعداد Cloudinary
│   │   ├── models/                  # Mongoose schemas
│   │   │   ├── Order.ts
│   │   │   ├── Product.ts
│   │   │   ├── Story.ts
│   │   │   └── User.ts
│   │   ├── services/                # Business logic
│   │   │   ├── order.service.ts
│   │   │   ├── product.service.ts
│   │   │   └── story.service.ts
│   │   ├── validators/              # Zod schemas
│   │   │   ├── order.validator.ts
│   │   │   ├── product.validator.ts
│   │   │   └── story.validator.ts
│   │   ├── utils.ts
│   │   └── constants.ts
│   │
│   ├── store/                       # Zustand stores
│   │   ├── wizardStore.ts
│   │   └── cartStore.ts
│   │
│   ├── hooks/
│   │   ├── useCart.ts
│   │   └── useWizard.ts
│   │
│   └── types/
│       └── index.ts
│
├── __tests__/                       # ⭐ مجلد الاختبارات
│   ├── unit/                        # اختبارات الوحدة
│   │   ├── services/
│   │   └── validators/
│   ├── components/                  # اختبارات المكونات
│   │   ├── home/
│   │   ├── wizard/
│   │   └── products/
│   └── e2e/                         # اختبارات شاملة (Playwright)
│       ├── wizard-flow.spec.ts
│       ├── checkout-flow.spec.ts
│       └── admin-flow.spec.ts
│
├── .env.local                       # متغيرات البيئة (لا تُرفع على Git)
├── .env.example                     # نموذج المتغيرات
├── .gitignore
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── vitest.config.ts                 # ⭐ إعداد Vitest
├── playwright.config.ts             # ⭐ إعداد Playwright
├── package.json
└── README.md
```

---

## 3. هوية التصميم (Design System) — Duolingo Style

### الألوان (Colors)
```css
/* Primary — مستوحى من سراج الأخضر النعناعي */
--seraj-green: #58CC02;        /* Duolingo green — الأزرار الرئيسية */
--seraj-green-dark: #58A700;   /* Hover state */
--seraj-green-light: #89E219;  /* Backgrounds خفيفة */

/* Secondary — نحاسي وذهبي */
--copper: #B87333;             /* الشخصيات الستيم بانك */
--gold: #FFC800;               /* التمييز والعروض */
--warm-brown: #8B4513;         /* النصوص الثانوية */

/* Accent — ألوان الشخصيات */
--mom-red: #E74C3C;            /* حجاب الأم */
--hero-teal: #1CB0F6;          /* لون البطولة */
--challenge-purple: #CE82FF;   /* التحديات */

/* Neutrals — ألوان الخلفية */
--sand: #F5E6D3;               /* خلفية دافئة */
--cream: #FFF9F0;              /* خلفية رئيسية */
--dark: #3C3C3C;               /* النصوص */
--error-red: #FF4B4B;          /* أخطاء */
--success-green: #58CC02;      /* نجاح */
```

### الخطوط
- **العناوين:** Tajawal Bold (أكثر وضوحاً على الموبايل)
- **النصوص:** Cairo Regular (قراءة مريحة)
- **الأزرار:** Tajawal Bold (أحجام كبيرة للمس)

### مبادئ التصميم (Duolingo-inspired + Mobile-First)
- ✅ أزرار كبيرة مع ظل سفلي ملون (3D button effect) — سهلة اللمس على الموبايل
- ✅ زوايا مستديرة كبيرة (border-radius: 16-24px)
- ✅ أنيميشن بسيط عند hover/tap (scale خفيف 1.02)
- ✅ ألوان مبهجة ومتباينة
- ✅ RTL كامل (عربي من الأول)
- ✅ نصوص كبيرة (16px minimum للموبايل)
- ✅ مساحات كافية بين العناصر القابلة للمس (48px tap target)
- ✅ تحميل تدريجي (skeleton loading بدل blank screen)

### تصميم البانر الرئيسي (Hero Banner — مثل Duolingo)

> **مبدأ Duolingo:** عنصر واحد مركزي + مساحة بيضاء + شخصية بجانبه = وضوح فوري

```
┌──────────────────────────────────────────────────────┐
│  Navbar                                              │
├──────────────────────────────────────────────────────┤
│                                                      │
│                                                      │
│    متعة القراءة واللعب..                  ┌──────┐  │
│    في حكايات بتصنع أبطال بجد!              │ سراج │  │
│                                           │  🐰  │  │
│    ┌────────────────────────────┐         │ يشاور│  │
│    │  يلا يا سراج..             │         │ على  │  │
│    │     ألف قصة لبطلنا         │         │ الزر  │  │
│    └────────────────────────────┘         └──────┘  │
│                                                      │
│         خلفية: cream (#FFF9F0) — بدون صور            │
│                                                      │
├──────────────────────────────────────────────────────┤
│  How It Works (3 خطوات)...                           │
└──────────────────────────────────────────────────────┘

الموبايل (stacked):
┌────────────────────┐
│  Navbar            │
├────────────────────┤
│                    │
│  متعة القراءة     │
│  واللعب.. في      │
│  حكايات بتصنع     │
│  أبطال بجد!       │
│                    │
│  ┌──────────────┐  │
│  │ يلا يا سراج..│  │
│  │ألف قصة لبطلنا│  │
│  └──────────────┘  │
│                    │
│      ┌──────┐     │
│      │ سراج │     │
│      │  🐰  │     │
│      └──────┘     │
│                    │
├────────────────────┤
│  How It Works...   │
└────────────────────┘
```

**قواعد البانر:**
- **العنوان:** سطرين كحد أقصى — خط Tajawal Bold — حجم كبير (32-40px mobile / 48-64px desktop)
- **لا subtitle:** النص يكفي وحده (مثل Duolingo بالظبط)
- **الزر:** أخضر (#58CC02) + ظل سفلي (#58A700) + border-radius 16px — هو أبرز عنصر
- **الشخصية:** بحجم معقول (200px mobile / 300px desktop) — لا تطغى على النص
- **الخلفية:** لون واحد (cream) — بدون صور أو pattern معقد
- **المساحة:** padding كبير (40px+ حول المحتوى) — لا ازدحام

---

## 4. استراتيجية الأنيميشن (مثل Duolingo — خفيفة ومبهجة)

### المبدأ: بسيط = أسرع = أفضل للموبايل

| النوع | الأداة | الحجم | مثال |
|-------|--------|-------|------|
| حركات UI (hover, transitions) | Tailwind CSS transitions | 0KB إضافي | زر يكبر عند اللمس |
| حركات المكونات (scroll, appear) | Framer Motion | ~30KB | شخصية تظهر عند السكروول |
| شخصية ثابتة مع حركة بسيطة | صورة PNG + Framer Motion | ~50KB | سراج يهز رأسه |
| فيديو قصير (لو متاح) | WebM مضغوط | ≤ 500KB | سراج يلوح بيده |

### ضغط الفيديوهات للموبايل
```
كل فيديو لازم يكون:
- Format: WebM (VP9) — أصغر 50% من MP4
- Resolution: 480px max — يكفي على الموبايل
- Duration: 3-5 ثواني فقط
- Size: ≤ 500KB (نصف ميجا)
- Loop: نعم (يتكرر)
- Autoplay: بدون صوت (muted)
- Lazy: يتحمل بس لما يظهر على الشاشة
```

### مكون AnimatedCharacter الذكي
```
لو الفيديو موجود ومضغوط → يشغله (lazy loaded)
لو المشغّل بطيء (2G/3G) → يعرض صورة بديلة فقط
لو الفيديو مش موجود → يعرض صورة placeholder + أنيميشن Framer Motion بسيط
```

### ليش Framer Motion بس بدون Lottie؟
- Framer Motion يكفي لكل الأنيميشن المطلوبة (مثل Duolingo)
- Lottie ملفات JSON قد تكون كبيرة (100KB+ لكل ملف)
- تقليل المكتبات = تحميل أسرع على الموبايل = تجربة أفضل

---

## 5. آلية رفع الصور في بيئة Serverless

### المشكلة
Vercel Serverless لا يسمح بحفظ ملفات على السيرفر — كل طلب مستقل.

### الحل: Cloudinary Free Tier

| | صورة الطفل (المعالج) | إيصال الدفع |
|---|---|---|
| **الآلية** | رفع مباشر من المتصفح → Cloudinary | ❌ لا رفع — واتساب بديل |
| **التخزين** | Cloudinary Free (25GB) | النهائي على واتساب |
| **الربط** | URL يُحفظ في MongoDB مع بيانات القصة | — |
| **التحسين** | Cloudinary يضغط تلقائياً | — |
| **في الأدمن** | الأدمن يشوف الصورة في لوحة التحكم | الأدمن يستلمها على واتساب |

### تدفق رفع صورة الطفل
```
1. المستخدم يختار صورة في الخطوة 3
2. الصورة تُرفع مباشرة لـ Cloudinary (unsigned upload)
3. Cloudinary يرجّع URL
4. الـ URL يُحفظ في wizardStore
5. لما الطلب يتنشأ → الـ URL يُحفظ في MongoDB
6. الأدمن يشوف الصورة في لوحة التحكم ويستخدمها يدوياً
```

### تدفق إيصال الدفع (WhatsApp Bypass — بدون رفع)
```
1. المستخدم يدفع عبر InstaPay
2. صفحة النجاح تعرض زر واتساب ديناميكي:
   wa.me/201234567890?text=طلب رقم SRJ-2026-0001 — ها هي صورة الإيصال
3. المستخدم يضغط → يفتح واتساب → يرسل الإيصال كصورة عادية
4. فريق سراج يستلم على واتساب أعمال
```

**ليش Cloudinary مجاني؟**
- الباقة المجانية: 25GB تخزين + 25GB باندويث/شهر
- 25GB = تقريباً 25,000 صورة طفل (1MB لكل واحدة)
- أكثر من كافي لبداية المشروع
- CDN عالمي = صورة تتحمل بسرعة لأي مستخدم

---

## 6. استراتيجية الاختبار (Testing Strategy)

### طبقات الاختبار

| الطبقة | الأداة | نوع الملف | متى يشتغل | مثال |
|--------|--------|-----------|-----------|------|
| **اختبار الوحدة** | Vitest | `*.test.ts` | مع كل تعديل كود | التحقق من Zod schemas، حسابات الأسعار |
| **اختبار المكونات** | Vitest + Testing Library | `*.test.tsx` | مع كل تعديل كود | الأزرار تشتغل، الفورم تُرسل |
| **اختبار شامل (E2E)** | Playwright | `*.spec.ts` | قبل النشر | رحلة المستخدم الكاملة من الصفحة الرئيسية للدفع |
| **مراجعة يدوية** | قائمة تحقق | `QA-CHECKLIST.md` | كل مرحلة | الموبايل، RTL، الألوان |

### متى نختبر؟
- **أثناء التطوير:** اختبارات الوحدة + المكونات (Vitest)
- **نهاية كل مرحلة:** قائمة تحقق يدوية + اختبارات المكونات الجديدة
- **قبل النشر:** اختبارات E2E الكاملة (Playwright)
- **بعد النشر:** اختبار سريع على الموقع المنشور

### اختبارات E2E المطلوبة
```
1. wizard-flow.spec.ts:     الصفحة الرئيسية → المعالج (4 خطوات) → المعاينة
2. checkout-flow.spec.ts:   المنتجات → السلة → الدفع → واتساب
3. admin-flow.spec.ts:      تسجيل دخول → عرض طلبات → عرض قصص
```

---

## 7. ميزانية الأداء (Performance Budget) — Mobile-First

| المقياس | الهدف | ليه |
|---------|-------|------|
| First Contentful Paint | ≤ 1.5s | المستخدم يشوف محتوى بسرعة |
| Largest Contentful Paint | ≤ 2.5s | المحتوى الرئيسي يظهر بسرعة |
| Total Bundle Size | ≤ 200KB (gzipped) | تحميل سريع على 3G |
| كل فيديو | ≤ 500KB | لا يثقل الصفحة |
| كل صفحة images | ≤ 300KB | WebP + lazy loading |
| Time to Interactive | ≤ 3s على 3G | الموبايل أولاً |

### استراتيجيات التحسين
- **Lazy Loading:** كل الصور والفيديوهات تحت الشاشة الأولى
- **WebP:** كل الصور بصيغة WebP (أصغر 30% من PNG)
- **Font Optimization:** next/font يحمل فقط الأوزان المطلوبة
- **Code Splitting:** Next.js يفصل تلقائياً كل صفحة
- **Image Optimization:** Cloudinary يضغط + next/image يضبط الأحجام

---

## 8. النصوص المرجعية (Single Source of Truth)

> ⚠️ هذه هي النصوص النهائية — أي تناقض مع وثائق أخرى، هذا هو المعتمد.

### صفحة الهبوط
| الموضع | النص المعتمد |
|--------|-------------|
| **Hero Title** | "متعة القراءة واللعب.. في حكايات بتصنع أبطال بجد!" |
| **CTA Button** | "يلا يا سراج.. ألف قصة لبطلنا" |

### المعالج
| الخطوة | النص المعتمد |
|--------|-------------|
| **Step 1** | "أهلاً بيكي! قوليلي اسم بطلنا إيه؟ وعنده كام سنة؟" |
| **Step 2** | "بطلنا محتاج يشجع إيه النهاردة؟" |
| **Step 3** | "لو عندك صورة لبطلنا، ارفعيها وسراج هيتخيل شكل البطل!" |
| **Step 4** | "ثواني.. ورشة سراج بدأت شغل.. والريشة بدأت تكتب!" |

### الدفع
| الخيار | النص المعتمد |
|--------|-------------|
| **InstaPay** | ادفعي على InstaPay — الرقم + QR Code معروضين في صفحة الدفع |
| **الشحن** | رسوم شحن ديناميكية (افتراضي 35 ج.م) — قابلة للتعديل من لوحة الأدمن |

### النجاح
| النص المعتمد |
|-------------|
| "سراج استلم الإيصال بنجاح.. الحكاية بدأت!" |
| "مستعجلة؟ ابعتي رقم طلبك لورشة سراج فوراً" |

---

## 9. مراحل التنفيذ (Phases) — مرتبة بالاعتماديات الصحيحة

> **مبدأ مهم:** كل صفحة تُبنى بعد أن يكون الـ API الذي تحتاجه جاهزاً.

---

### المرحلة 1: الإعداد الأساسي (Foundation) — Wave 1
**الهدف:** مشروع شغال على localhost مع تصميم عربي

#### المهمة 1.1: إنشاء المشروع وتثبيت المكتبات
- **الملفات:** `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`
- **الخطوات:**
  1. `npx create-next-app@latest seraj-store --typescript --tailwind --app --src-dir`
  2. تثبيت: `npm install mongoose zustand framer-motion next-auth zod react-hook-form @hookform/resolvers lucide-react`
  3. تثبيت Dev: `npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom`
  4. `npx shadcn@latest init` (إعداد shadcn/ui)
- **التحقق:** `npm run dev` يشتغل بدون أخطاء + `npm run build` ينجح
- **تم:** localhost:3000 يعرض صفحة Next.js الافتراضية

#### المهمة 1.2: إعداد Git + البيئة + التصميم
- **الملفات:** `.gitignore`, `.env.local`, `.env.example`, `tailwind.config.ts`, `src/app/globals.css`
- **الخطوات:**
  1. `git init` + أول commit
  2. إنشاء `.env.local` بكل المتغيرات (شوف القسم 10)
  3. إضافة Design Tokens في Tailwind (ألوان سراج، خطوط، RTL)
  4. إعداد `globals.css` بالألوان CSS variables
  5. إضافة مجلدات `public/images/` و `public/videos/` مع `.gitkeep`
- **التحقق:** `npm run dev` يعرض ألوان سراج صحيحة في Inspect
- **تم:** Git repo جاهز + Tailwind يتعرف على ألوان سراج

#### المهمة 1.3: إعداد الخطوط العربية + RTL + ESLint
- **الملفات:** `src/app/layout.tsx`, `next.config.ts`, `.eslintrc.json`
- **الخطوات:**
  1. تحميل خطوط Cairo + Tajawal عبر `next/font/google`
  2. ضبط `dir="rtl"` و `lang="ar"` في root layout
  3. إعداد ESLint + Prettier (تنسيق تلقائي)
  4. رفع الصور المؤقتة (placeholders) من مجلد `ui&ux` لـ `public/images/placeholders/`
- **التحقق:** الصفحة تعرض خط عربي + RTL صحيح (النص من اليمين لليسار)
- **تم:** Foundation كامل — جاهز لبناء المكونات

---

### المرحلة 2: البنية التحتية للواجهات (Layout & Components) — Wave 1
**الهدف:** هيكل الموقع (Navbar + Footer) + مكونات مشتركة جاهزة

#### المهمة 2.1: الـ Layout الرئيسي + Navbar + Footer
- **الملفات:** `src/app/layout.tsx`, `src/components/layout/Navbar.tsx`, `src/components/layout/Footer.tsx`, `src/components/layout/MobileNav.tsx`
- **الخطوات:**
  1. Root layout مع RTL + Fonts + Theme
  2. Navbar: Logo + روابط (الرئيسية، المنتجات، كيف يعمل، من نحن) + زر CTA "يلا نألف"
  3. MobileNav: hamburger menu + drawer من اليمين (bottom sheet أو side drawer)
  4. Footer: روابط + واتساب + حقوق
  5. ErrorBoundary في الـ layout
- **التحقق:** التنقل بين الصفحات يعمل + الموبايل menu يفتح + RTL صحيح
- **تم:** كل صفحات المتجر ترث Navbar + Footer تلقائياً

#### المهمة 2.2: المكونات المشتركة (Shared Components)
- **الملفات:** `src/components/shared/Button.tsx`, `src/components/shared/WhatsAppButton.tsx`, `src/components/shared/LoadingSpinner.tsx`, `src/components/shared/ErrorBoundary.tsx`, `src/components/shared/Toast.tsx`, `src/components/ui/*` (shadcn)
- **الخطوات:**
  1. تثبيت مكونات shadcn: Button, Card, Input, Dialog, Drawer, Badge
  2. بناء Button بخاصية Duolingo 3D effect (shadow أسفل)
  3. بناء WhatsAppButton floating (زر واتساب عائم أسفل الشاشة)
  4. بناء LoadingSpinner بأنيميشن تروس
  5. بناء ErrorBoundary يعرض رسالة ودية + زر إعادة المحاولة
  6. بناء Toast للإشعارات (إضافة منتج للسلة، أخطاء)
- **التحقق:** كل مكون يعرض بشكل صحيح على Desktop + Mobile
- **تم:** مكتبة مكونات جاهزة لباقي المراحل

#### المهمة 2.3: مكون AnimatedCharacter + CharacterCard
- **الملفات:** `src/components/characters/AnimatedCharacter.tsx`, `src/components/characters/CharacterCard.tsx`
- **الخطوات:**
  1. AnimatedCharacter: يستقبل `name` + `fallbackImage` + `alt`
     - لو الفيديو موجود → `<video>` مع lazy loading + muted + autoplay + loop
     - لو مش موجود → `<img>` + Framer Motion animation (bounce خفيف)
     - لو اتصال بطيء → يعرض الصورة فقط بدون أنيميشن
  2. CharacterCard: كارد لكل شخصية مع اسم + وصف + أنيميشن ظهور
- **التحقق:** المكون يعرض صورة بديلة (بلاش فيديو) + أنيميشن Framer Motion يشتغل
- **تم:** مكون جاهز للاستخدام في كل صفحات الموقع

---

### المرحلة 3: البنية التحتية للخلفية (Backend Foundation) — Wave 1
**الهدف:** قاعدة بيانات + API Routes جاهزة تستقبل طلبات من الواجهات

> ⚠️ هذه المرحلة **قبل** بناء الصفحات التي تعتمد عليها. هكذا لما نبني صفحة المنتجات، الـ API يكون جاهزاً.

#### المهمة 3.1: اتصال MongoDB + Mongoose Models
- **الملفات:** `src/lib/db.ts`, `src/lib/models/Order.ts`, `src/lib/models/Product.ts`, `src/lib/models/Story.ts`, `src/lib/models/User.ts`
- **الخطوات:**
  1. `db.ts`: Singleton connection (يمنع اتصالات متعددة في Serverless)
  2. **Order Model:** orderId, customerName, phone, address, items[], totalPrice, paymentType (deposit/full), status (pending/confirmed/processing/shipped/delivered), createdAt
  3. **Product Model:** name, slug, description, price, images[], category (story/flashcards), featured, stock, ageRange
  4. **Story Model:** orderId (optional), childName, childAge, challengeType, photoUrl (Cloudinary), storyPreview, status (pending/reviewed/sent-to-print/delivered), createdAt
  5. **User Model:** email, passwordHash, role (admin)
  6. Seed script: `npm run seed` يضيف 3-4 منتجات تجريبية
- **التحقق:** `npm run seed` يضيف منتجات + `db.ts` يتصل بدون خطأ
- **تم:** قاعدة البيانات جاهزة + بيانات تجريبية

#### المهمة 3.2: API Routes + Validators
- **الملفات:** `src/app/api/orders/route.ts`, `src/app/api/products/route.ts`, `src/app/api/stories/route.ts`, `src/app/api/upload/route.ts`, `src/lib/validators/*.ts`
- **الخطوات:**
  1. `GET /api/products` → يرجّع كل المنتجات (مع pagination)
  2. `GET /api/products?slug=xxx` → منتج واحد
  3. `POST /api/orders` → ينشئ طلب جديد (بـ Zod validation)
  4. `GET /api/orders?status=pending` → طلبات حسب الحالة (للأدمن)
  5. `POST /api/stories` → يحفظ بيانات المعالج (اسم + سن + تحدي + صورة URL)
  6. `POST /api/upload` → يرفع صورة لـ Cloudinary ويرجّع URL
  7. كل route مع error handling موحد + status codes صحيحة
- **التحقق:** استخدام Thunder Client أو curl لاختبار كل endpoint يعطي النتيجة الصحيحة
- **تم:** API كامل جاهز — الواجهات تقدر تتصل بيه

#### المهمة 3.3: اختبارات الوحدة للـ Services + Validators
- **الملفات:** `__tests__/unit/validators/order.validator.test.ts`, `__tests__/unit/validators/story.validator.test.ts`
- **الخطوات:**
  1. اختبار Zod schema: بيانات صحيحة تُقبل، بيانات ناقصة تُرفض
  2. اختبار order validator: اسم مطلوب، رقم تليفون مصري صحيح
  3. اختبار story validator: اسم الطفل، العمر بين 3-12
- **التحقق:** `npm run test` — كل الاختبارات خضراء
- **تم:** طبقة حماية ضد البيانات الخاطئة

---

### المرحلة 4: الصفحة الرئيسية (Home Page) — Wave 2
**الهدف:** صفحة رئيسية كاملة تجذب الزائر وتحوله لعميل
**يعتمد على:** المرحلة 2 (Layout) + المرحلة 3 (Products API)

#### المهمة 4.1: Hero Section + How It Works
- **الملفات:** `src/app/(shop)/page.tsx`, `src/components/home/Hero.tsx`, `src/components/home/HowItWorks.tsx`
- **الخطوات:**
  1. Hero Banner (مثل Duolingo — بسيط وواضح):
     - **العنوان:** "متعة القراءة واللعب.. في حكايات بتصنع أبطال بجد!" (سطر واحد، خط كبير bold)
     - **لا نص ثانوي** — العنوان يكفي (زي Duolingo بالظبط)
     - **الزر:** "يلا يا سراج.. ألف قصة لبطلنا" (أخضر كبير 3D — هو العنصر الأهم)
     - **الشخصية:** سراج واقف جنب الزر بيشاور عليه (يمين الشاشة)
     - **المساحة:** whitespace كتير — العنوان + الزر + الشخصية فقط
     - **الخلفية:** لون دافئ (cream) بدون صور خلفية معقدة
     - **الموبايل:** الشخصية تحت العنوان والزر (stacked) — لا التفاف
  3. How It Works: 3 خطوات بأيقونات متحركة:
     - "قولي لسراج اسم بطلنا وسنه" (أيقونة قلم)
     - "سراج هيدخل ورشته يكتب القصة مخصوص ليه" (أيقونة تروس)
     - "القصة هتجيلك مطبوعة لحد باب البيت" (أيقونة بيت)
  4. كل خطوة تظهر مع scroll animation (fade-in + slide-up)
- **التحقق:** الصفحة الرئيسية تتحمل على الموبايل + الأنيميشن يعمل + CTA ينقل للمعالج
- **تم:** أول انطباع ممتاز للمستخدم

#### المهمة 4.2: Family Section + Featured Products
- **الملفات:** `src/components/home/FamilySection.tsx`, `src/components/home/FeaturedProducts.tsx`, `src/components/products/ProductCard.tsx`
- **الخطوات:**
  1. FamilySection: 3 كاردز (الجدة زينب، الأم تقى، الأب عمر) مع:
     - صورة الشخصية + الاسم + الدور
     - أنيميشن ظهور عند scroll (stagger effect)
     - كل كارد يقول جملته (مثال: الجدة: "أنا حارسة الحكايات")
  2. FeaturedProducts: يجيب 3-4 منتجات مميزة من `GET /api/products?featured=true`
  3. ProductCard: صورة + اسم + سعر + زر "أضيفي للسلة"
     - Duolingo-style: كارد بزوايا مستديرة + ظل + hover effect
- **التحقق:** الكاردز تظهر بالأنيميشن + المنتجات تأتي من API + كل كارد ينقل لصفحة المنتج
- **تم:** الصفحة الرئيسية تعرض الشخصيات والمنتجات

#### المهمة 4.3: Social Proof + Testimonials + اختبر المكونات
- **الملفات:** `src/components/home/SocialProof.tsx`, `src/components/home/Testimonials.tsx`, `__tests__/components/home/Hero.test.tsx`, `__tests__/components/home/FeaturedProducts.test.tsx`
- **الخطوات:**
  1. SocialProof: صور حقيقية لقصص مطبوعة (mockup) + عداد "أكثر من X قصة تم تأليفها"
  2. Testimonials: 3-4 آراء أمهات (ثابتة مؤقتاً من constants)
  3. اختبار المكونات:
     - Hero يعرض العنوان والزر
     - ProductCard يعرض السعر ويستدعي addToCart
     - FamilySection يعرض 3 شخصيات
- **التحقق:** كل الأقسام تظهر + اختبارات `npm run test` خضراء
- **تم:** صفحة رئيسية كاملة ومقنعة

---

### المرحلة 5: معالج التأليف — البنية التحتية (Wizard Infrastructure) — Wave 2
**الهدف:** هيكل المعالج + Zustand store + التنقل بين الخطوات
**يعتمد على:** المرحلة 2 (Shared Components) + المرحلة 3 (Upload API)

#### المهمة 5.1: Zustand Store + Wizard Layout
- **الملفات:** `src/store/wizardStore.ts`, `src/components/wizard/WizardLayout.tsx`, `src/components/wizard/ProgressBar.tsx`, `src/components/wizard/StepNavigator.tsx`, `src/app/(shop)/wizard/page.tsx`
- **الخطوات:**
  1. wizardStore يحفظ: currentStep, childName, childAge, challengeType, photoUrl, isGenerating
  2. WizardLayout: container ضيق (mobile-optimized) + AnimatedCharacter في الأعلى
  3. ProgressBar: 4 خطوات بصريين (الأيقونة تتغير عند كل خطوة)
  4. StepNavigator: أزرار "إرجع" و "يلا التالي" مع validation قبل الانتقال
  5. صفحة `/wizard` تعمل redirect لـ `/wizard/step-1`
- **التحقق:** التنقل بين الخطوات يشتغل + البيانات محفوظة في الـ store
- **تم:** هيكل المعالج جاهز لاستقبال خطوات المحتوى

#### المهمة 5.2: رفع الصور + اختبار Store
- **الملفات:** `src/lib/cloudinary.ts`, `src/hooks/useWizard.ts`, `__tests__/unit/services/wizardStore.test.ts`
- **الخطوات:**
  1. إعداد Cloudinary: `CLOUDINARY_CLOUD_NAME` + upload preset
  2. hook `useWizard`: يربط الـ store بالخطوات + validation لكل خطوة
  3. دالة `uploadPhoto(file)` → `POST /api/upload` → تُرجع URL
  4. اختبار wizardStore: حفظ البيانات + إعادة تعيين + validation
- **التحقق:** `uploadPhoto` يرفع صورة لـ Cloudinary ويرجّع URL + اختبارات خضراء
- **تم:** البنية التحتية للمعالج كاملة

---

### المرحلة 6: معالج التأليف — الخطوات (Wizard Steps) — Wave 3
**الهدف:** 4 خطوات تفاعلية + شاشة المعاينة
**يعتمد على:** المرحلة 5 (Wizard Infrastructure) + المرحلة 3 (Stories API)

#### المهمة 6.1: الخطوتين 1 و 2 (الاسم + التحدي)
- **الملفات:** `src/app/(shop)/wizard/step-1/page.tsx`, `src/components/wizard/NameStep.tsx`, `src/app/(shop)/wizard/step-2/page.tsx`, `src/components/wizard/ChallengeStep.tsx`
- **الخطوات:**
  1. **Step 1 — الاسم والسن:**
     - AnimatedCharacter: سراج يلوح (waving) + النص: "أهلاً بيكي! قوليلي اسم بطلنا إيه؟ وعنده كام سنة؟"
     - Input للاسم (React Hook Form + Zod: 2-30 حرف، عربي أو إنجليزي)
     - أزرار العمر: 3، 4، 5، 6، 7، 8، 9+ (tap-friendly, Duolingo-style)
     - Validation: الاسم مطلوب + العمر مطلوب
  2. **Step 2 — التحدي السلوكي:**
     - AnimatedCharacter: سراج بالنظارة + القائد خالد
     - النص: "بطلنا محتاج يشجع إيه النهاردة؟"
     - 5 كاردز تحدي: شجاعة، نظافة، علم/مذاكرة، احترام، صبر
     - كل كارد بأيقونة + لون خاص + أنيميشن عند الاختيار (scale + glow)
     - Validation: لازم يختار واحد على الأقل
- **التحقق:** البيانات محفوظة في wizardStore + الانتقال بين الخطوات سلس + validation يمنع المتابعة بدون إدخال
- **تم:** أول خطوتين من المعالج تعمل بالكامل

#### المهمة 6.2: الخطوتين 3 و 4 (الصورة + التوليد)
- **الملفات:** `src/app/(shop)/wizard/step-3/page.tsx`, `src/components/wizard/PhotoStep.tsx`, `src/app/(shop)/wizard/step-4/page.tsx`, `src/components/wizard/GeneratingStep.tsx`
- **الخطوات:**
  1. **Step 3 — رفع الصورة (اختياري):**
     - AnimatedCharacter: الحمامة هدى
     - النص: "لو عندك صورة لبطلنا، ارفعيها وسراج هيتخيل شكل البطل!"
     - Dropzone: سحب أو اختيار (accept: image/*, maxSize: 5MB)
     - معاينة الصورة قبل الرفع + زر إزالة
     - زر "تخطي هذه الخطوة" واضح
     - عند المتابعة: لو فيه صورة → رفع لـ Cloudinary → حفظ URL
  2. **Step 4 — التوليد:**
     - AnimatedCharacter: سراج يكتب بالريشة (أو صورة + أنيميشن تروس)
     - النص: "ثواني.. ورشة سراج بدأت شغل.. والريشة بدأت تكتب!"
     - Loading animation: تروس تدور + progress وهمي (3 ثواني)
     - بعد 3 ثواني: حفظ البيانات عبر `POST /api/stories`
     - redirect تلقائي لصفحة المعاينة
- **التحقق:** رفع صورة يشتغل + التخطي يعمل + شاشة التوليد تنقل للمعاينة
- **تم:** 4 خطوات المعالج تعمل بالكامل

#### المهمة 6.3: شاشة المعاينة (Teaser Preview) + اختبارات
- **الملفات:** `src/app/(shop)/wizard/preview/page.tsx`, `__tests__/components/wizard/NameStep.test.tsx`, `__tests__/components/wizard/ChallengeStep.test.tsx`
- **الخطوات:**
  1. **Preview:**
     - AnimatedCharacter: سراج متحمس + النص: "يااااه! مغامرة [اسم الطفل] طلعت رهيبة.. شوفتي الغلاف؟"
     - CSS Perspective Mockup للغلاف (اسم الطفل على الغلاف)
     - الفقرة الأولى من قصة نموذجية (ثابتة مؤقتاً — التوليد يدوي)
     - النص: "دي أول صفحة من الحكاية.. اطلبي النسخة المطبوعة دلوقتي!"
     - زر CTA: "اطلبي النسخة المطبوعة" → ينقل للـ Checkout
  2. اختبارات المكونات:
     - NameStep: validation يمنع الإرسال بدون اسم/عمر
     - ChallengeStep: يختار تحدي واحد بس
- **التحقق:** المعاينة تعرض اسم الطفل على الغلاف + CTA ينقل للدفع + اختبارات خضراء
- **تم:** المعالج الكامل يعمل من البداية للنهاية

---

### المرحلة 7: المنتجات والسلة (Products & Cart) — Wave 3
**الهدف:** تصفح المنتجات + إضافة للسلة + ترشيحات ذكية
**يعتمد على:** المرحلة 3 (Products API) + المرحلة 2 (ProductCard)

#### المهمة 7.1: صفحة المنتجات + صفحة المنتج
- **الملفات:** `src/app/(shop)/products/page.tsx`, `src/components/products/ProductGrid.tsx`, `src/app/(shop)/products/[slug]/page.tsx`, `src/components/products/ProductDetails.tsx`
- **الخطوات:**
  1. ProductGrid: يجيب المنتجات من `GET /api/products` + grid responsive (2 col mobile, 3 col tablet, 4 col desktop)
  2. ProductDetails: صور كبيرة + وصف + سعر + الفئة العمرية + زر "أضيفي للسلة"
  3. Skeleton loading أثناء تحميل المنتجات
  4. Error state لو API فشل (مع زر إعادة المحاولة)
- **التحقق:** المنتجات تأتي من API + الضغط على منتج ينقل لصفحة التفاصيل + skeleton يظهر أثناء التحميل
- **تم:** تصفح المنتجات يعمل بالكامل

#### المهمة 7.2: السلة + الترشيحات الذكية + اختبارات
- **الملفات:** `src/store/cartStore.ts`, `src/hooks/useCart.ts`, `src/components/products/CartDrawer.tsx`, `src/components/products/CrossSell.tsx`, `__tests__/components/products/ProductCard.test.tsx`, `__tests__/unit/services/cartStore.test.ts`
- **الخطوات:**
  1. cartStore: items[], addItem, removeItem, updateQuantity, clearCart, totalPrice
  2. CartDrawer: drawer من اليمين يعرض المنتجات + الكمية + الإجمالي + زر "اتمام الشراء"
  3. CrossSell: "سراج بيقولك: بطلنا اللي بيحب الشجاعة أكيد يحتاج كروت الروتين!" — يظهر في صفحة المنتج والسلة
  4. Badge على أيقونة السلة في Navbar بعدد المنتجات
  5. اختبارات:
     - cartStore: إضافة/حذف/تحديث الكمية
     - ProductCard: زر addToCart يستدعي cartStore.addItem
- **التحقق:** إضافة منتج للسلة تظهر في Drawer + Badge يتحدث + اختبارات خضراء
- **تم:** تجربة تسوق كاملة

---

### المرحلة 8: الدفع والتأكيد (Checkout & Success) — Wave 4
**الهدف:** إتمام الطلب + تأكيد عبر واتساب
**يعتمد على:** المرحلة 3 (Orders API) + المرحلة 7 (Cart)

#### المهمة 8.1: صفحة الدفع (Checkout)
- **الملفات:** `src/app/(shop)/checkout/page.tsx`, `src/lib/validators/order.validator.ts`
- **الخطوات:**
   1. نموذج بيانات الشحن (React Hook Form + Zod):
      - اسم الأم (مطلوب)
      - رقم التليفون (مطلوب — مصري)
      - العنوان (مطلوب)
      - ملاحظات (اختياري)
   2. ملخص الطلب: المنتجات + المجموع الفرعي + الشحن + الإجمالي
   3. InstaPay: الرقم + QR Code + رابط الدفع
   4. رسوم الشحن: تأتي من `/api/config` (محفوظة في DB، fallback من env vars)
   5. عند التأكيد: `POST /api/orders` → يحفظ الطلب → redirect لصفحة النجاح
- **التحقق:** ملء النموذج + التحقق من صحة البيانات + إنشاء الطلب في MongoDB
- **تم:** مسار الدفع يعمل بالكامل

#### المهمة 8.2: صفحة النجاح + واتساب + اختبارات
- **الملفات:** `src/app/(shop)/success/page.tsx`, `__tests__/e2e/checkout-flow.spec.ts`
- **الخطوات:**
  1. رسالة النجاح: "سراج استلم الإيصال بنجاح.. الحكاية بدأت!"
  2. رقم الطلب واضح وكبير (SRJ-2026-XXXX)
  3. AnimatedCharacter: سراج يحتفل بالورق الملون
  4. زر واتساب ديناميكي:
     ```
     wa.me/201234567890?text=مرحباً، أنا عملت طلب رقم SRJ-2026-0001 على متجر سراج. ها هي صورة الإيصال.
     ```
  5. زر ثانوي: "تصفحي المنتجات" → الرجوع للمتجر
  6. اختبار E2E: المنتج → السلة → الدفع → النجاح → واتساب
- **التحقق:** رقم الطلب يظهر + رابط واتساب صحيح + E2E test يمر
- **تم:** رحلة المستخدم الكاملة تعمل من البداية للنهاية

---

### المرحلة 9: لوحة الإدارة — المصادقة (Admin Auth) — Wave 5
**الهدف:** حماية لوحة التحكم + تسجيل دخول الأدمن
**يعتمد على:** المرحلة 3 (User Model + DB)

#### المهمة 9.1: NextAuth + Admin Layout + صفحة الدخول
- **الملفات:** `src/app/api/auth/[...nextauth]/route.ts`, `src/app/admin/layout.tsx`, `src/middleware.ts`
- **الخطوات:**
  1. NextAuth Credentials provider: email + password
  2. Admin Layout: sidebar أو tabs (الرئيسية، الطلبات، المنتجات، القصص)
  3. Middleware: يحمي كل `/admin/*` — غير المسجل يُعاد توجيهه لصفحة الدخول
  4. صفحة دخول بسيطة بتصميم سراج (ليست صفحة NextAuth الافتراضية)
  5. Admin seed: `npm run seed:admin` ينشئ حساب أدمن افتراضي
- **التحقق:** دخول ببيانات صحيحة ينجح + دخول خاطئ يفشل + URL مباشر لـ /admin يعيد توجيه غير المسجل
- **تم:** لوحة الإدارة محمية وجاهزة

#### المهمة 9.2: Dashboard رئيسي (إحصائيات)
- **الملفات:** `src/app/admin/page.tsx`
- **الخطوات:**
  1. بطاقات إحصائية:
     - إجمالي الطلبات
     - طلبات جديدة (pending)
     - قصص بانتظار المراجعة
     - إجمالي الإيرادات
  2. رسم بياني بسيط للطلبات آخر 7 أيام (مكتبة خفيفة أو CSS bars)
  3. آخر 5 طلبات في جدول
- **التحقق:** الأرقام تأتي من MongoDB + الصفحة تتحمل بسرعة
- **تم:** الأدمن يشوف نظرة عامة على المتجر

---

### المرحلة 10: لوحة الإدارة — العمليات (Admin CRUD) — Wave 6
**الهدف:** إدارة الطلبات + المنتجات + القصص
**يعتمد على:** المرحلة 9 (Admin Auth)

#### المهمة 10.1: إدارة الطلبات + عرض القصص
- **الملفات:** `src/app/admin/orders/page.tsx`, `src/app/admin/stories/page.tsx`
- **الخطوات:**
  1. **الطلبات:**
     - جدول بكل الطلبات (رقم، اسم، هاتف، المبلغ، الحالة، التاريخ)
     - فلترة حسب الحالة (pending, confirmed, processing, shipped, delivered)
     - تغيير حالة الطلب (dropdown)
     - عرض تفاصيل الطلب كاملة
  2. **القصص:**
     - جدول ببيانات القصص من المعالج (اسم الطفل، العمر، التحدي، الحالة)
     - عرض صورة الطفل (من Cloudinary)
     - تغيير الحالة: pending → reviewed → sent-to-print → delivered
     - هذا هو المكان اللي الأدمن يراجع فيه البيانات ويرسل العينة يدوياً عبر واتساب
- **التحقق:** الطلبات تظهر + تغيير الحالة يعمل + صورة الطفل تظهر
- **تم:** الأدمن يدير كل العمليات

#### المهمة 10.2: إدارة المنتجات (CRUD) + اختبارات الأدمن
- **الملفات:** `src/app/admin/products/page.tsx`, `__tests__/e2e/admin-flow.spec.ts`
- **الخطوات:**
  1. جدول المنتجات مع أزرار (إضافة، تعديل، حذف)
  2. نموذج إضافة/تعديل منتج (اسم، وصف، سعر، صور، فئة، مميز)
  3. حذف منتج (مع تأكيد)
  4. اختبار E2E: تسجيل دخول → عرض الطلبات → عرض القصص → إضافة منتج
- **التحقق:** إضافة منتج يظهر في المتجر + تعديل يحفظ + حذف يزيل + E2E يمر
- **تم:** لوحة إدارة كاملة وفعالة

---

### المرحلة 11: التحسينات والنشر (Polish & Deploy) — Wave 7
**الهدف:** صفحات ثابتة + SEO + اختبارات نهائية + نشر
**يعتمد على:** كل المراحل السابقة

#### المهمة 11.1: الصفحات الثابتة + Error Handling
- **الملفات:** `src/app/(shop)/about/page.tsx`, `src/app/(shop)/how-it-works/page.tsx`, `src/app/not-found.tsx`
- **الخطوات:**
  1. **About:** "حكاية سراج وعيلته في قرية الابتكار" + صورة جماعية للعيلة
  2. **How it Works:** 3 خطوات تفصيلية + Social proof + أسئلة شائعة
  3. **404:** صفحة not-found بتصميم سراج (سراج ضايع + زر للرئيسية)
  4. ErrorBoundary شامل لكل الصفحات
- **التحقق:** كل صفحة تتحمل + 404 تظهر لـ URL خاطئ + ErrorBoundary يلتقط الأخطاء
- **تم:** كل صفحات الموقع كاملة

#### المهمة 11.2: SEO + تحسين الأداء
- **الملفات:** `src/app/layout.tsx` (metadata), `src/app/sitemap.ts`, `src/app/robots.ts`, `next.config.ts`
- **الخطوات:**
  1. Metadata لكل صفحة (title, description, open graph image)
  2. sitemap.ts ديناميكي
  3. robots.ts
  4. تحسين الصور: كلها WebP + lazy loading + sizes attribute
  5. تحسين الخطوط: preload + display: swap
  6. Lighthouse audit: تصحيح أي مشاكل
- **التحقق:** Lighthouse score > 90 على Desktop + > 80 على Mobile
- **تم:** الموقع محسّن لمحركات البحث والسرعة

#### المهمة 11.3: اختبارات نهائية + نشر
- **الملفات:** `__tests__/e2e/wizard-flow.spec.ts`, `playwright.config.ts`
- **الخطوات:**
  1. تشغيل كل اختبارات E2E (wizard + checkout + admin)
  2. قائمة تحقق يدوية على الموبايل:
     - RTL صحيح
     - الخطوط واضحة
     - الأنيميشن سلس
     - التنقل سلس
     - السلة تحفظ البيانات
     - واتساب يفتح بالرسالة الصحيحة
  3. إنشاء GitHub repo + push
  4. ربط Vercel → deploy
  5. إضافة متغيرات البيئة في Vercel
  6. تشغيل `npm run seed` على قاعدة البيانات الإنتاجية
  7. اختبار سريع على الرابط المنشور
- **التحقق:** الموقع يعمل على `seraj-store.vercel.app` + كل المسارات تعمل
- **تم:** 🎉 المشروع منشور ومتاح للعالم

---

## 10. متغيرات البيئة (.env.local)

```bash
# MongoDB Atlas (مجاني)
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/seraj

# NextAuth (مجاني)
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=http://localhost:3000

# Cloudinary (مجاني — 25GB)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_UPLOAD_PRESET=seraj-uploads

# WhatsApp
NEXT_PUBLIC_WHATSAPP_NUMBER=201234567890

# InstaPay
NEXT_PUBLIC_INSTAPAY_NUMBER=your-instapay
NEXT_PUBLIC_INSTAPAY_NAME=سراج ستور

# Admin
ADMIN_EMAIL=admin@seraj.com
ADMIN_PASSWORD_HASH=bcrypt-hash
```

---

## 11. ملخص المراحل والاعتماديات

```
Wave 1 (بالتوازي):
  المرحلة 1: الإعداد الأساسي ← لا يعتمد على شيء
  المرحلة 2: البنية التحتية للواجهات ← لا يعتمد على شيء
  المرحلة 3: البنية التحتية للخلفية ← لا يعتمد على شيء

Wave 2:
  المرحلة 4: الصفحة الرئيسية ← يعتمد على 2 + 3
  المرحلة 5: معالج التأليف (البنية) ← يعتمد على 2 + 3

Wave 3:
  المرحلة 6: معالج التأليف (الخطوات) ← يعتمد على 5 + 3
  المرحلة 7: المنتجات والسلة ← يعتمد على 3 + 2

Wave 4:
  المرحلة 8: الدفع والتأكيد ← يعتمد على 7 + 3

Wave 5:
  المرحلة 9: لوحة الإدارة (مصادقة) ← يعتمد على 3

Wave 6:
  المرحلة 10: لوحة الإدارة (عمليات) ← يعتمد على 9

Wave 7:
  المرحلة 11: التحسينات والنشر ← يعتمد على كل المراحل
```

### جدول الموجات (Waves)

| Wave | المراحل | المهام الإجمالية | المدة التقديرية |
|------|---------|-----------------|----------------|
| 1 | 1 + 2 + 3 | 9 مهام | 3-4 أيام |
| 2 | 4 + 5 | 5 مهام | 2-3 أيام |
| 3 | 6 + 7 | 5 مهام | 3-4 أيام |
| 4 | 8 | 2 مهمة | 1-2 يوم |
| 5 | 9 | 2 مهمة | 1 يوم |
| 6 | 10 | 2 مهمة | 1-2 يوم |
| 7 | 11 | 3 مهام | 2-3 أيام |
| **المجموع** | **11 مرحلة** | **28 مهمة** | **13-19 يوم** |

---

## 12. ملاحظات مهمة

- **RTL:** كل شيء معكوس عربي من الأول — لا حاجة لإصلاح لاحق
- **الصور المؤقتة:** استخدم صورك المرفقة في `ui&ux` لحد ما تولد الفيديوهات
- **التوليد يدوي:** لا API توليد — الأدمن يراجع البيانات ويرسل عينة عبر واتساب
- **GitHub + Vercel:** كود على GitHub، Vercel يربط تلقائياً وينشر مع كل push
- **MongoDB:** حساب مجاني يكفي 1000 طلب في الشهر
- **Cloudinary:** مجاني 25GB — يكفي لآلاف صور الأطفال
- **بدون تكاليف:** كل شيء مجاني 100% — Vercel + MongoDB + Cloudinary + GitHub
- **90% موبايل:** كل تصميم Mobile-First — Desktop هو المكمل
