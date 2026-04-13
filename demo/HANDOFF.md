# سِراج — Session Handoff Document
> ملف التسليم بين الجلسات — المرجع الكامل للحالة الحالية

---

## ما تم بناؤه (Demo Frontend — Static HTML Prototype)

### الملفات
```
seraj-store/demo/
├── index.html          — كل الصفحات كـ SPA (hash routing)
├── styles.css          — نظام التصميم الكامل (CSS Variables + Animations)
├── app.js              — Router + Wizard State + Scroll Reveals + Confetti
├── HANDOFF.md          — هذا الملف
└── assets/             — صور الشخصيات (9 شخصيات)
    ├── seraj.png               — سِراج (الأرنب الأخضر — بطل الماسكوت)
    ├── grandma-fatima-seated.png — الجدة فاطمة (جالسة على عثماني — الأدق للوصف)
    ├── grandma-fatima.png        — الجدة فاطمة (واقفة — نسخة بديلة)
    ├── mom-amira.png           — أميرة الأم (حجاب أحمر + مخططات + بوصلة ✓ الصحيحة)
    ├── dad-mostafa.png         — مصطفى الأب (ثوب + حزام أدوات + مخطوطة)
    ├── layla.png               — ليلى (كتاب "قصص وحكايات" + ترس ذهبي)
    ├── layla-nobook.png        — ليلى (بدون كتاب — نسخة بديلة)
    ├── omar.png                — عمر (نظارة مكبّرة + حقيبة تروس)
    ├── zain.png                — زين (قبعة طيار + يحمل هدى)
    ├── khaled-v2.png           — القائد خالد (خلفية بيضاء — الأنظف)
    ├── khaled.png              — القائد خالد (نسخة بديلة)
    ├── huda-bird.png           — هدى (الطائر النحاسي الآلي)
    └── family-group.png        — صورة العيلة كلها (للـ About hero)
```

### الصفحات المبنية
| الـ Route | الصفحة | data-page |
|---|---|---|
| `#/home` | الصفحة الرئيسية | `home` |
| `#/products` | كتالوج المنتجات | `products` |
| `#/about` | حكايتنا (+ العيلة الكاملة) | `about` |
| `#/wizard` | معالج التأليف (4 خطوات) | `wizard` |
| `#/preview` | معاينة القصة | `preview` |
| `#/checkout` | الدفع (٢ خيار + QR) | `checkout` |
| `#/success` | النجاح + كونفيتي | `success` |
| `#/product/*` | تفصيل منتج | `product` |
| `#/how-it-works` | يـ scroll لـ home#how-it-works | `home` |

---

## الـ Design System

### الألوان (CSS Variables في `styles.css`)
| المتغير | القيمة | الاستخدام |
|---|---|---|
| `--seraj` | `#6bbf3f` | الأخضر الأساسي (سِراج) |
| `--seraj-dark` | `#4a9128` | ظل الأزرار الخضراء |
| `--brass` | `#c9974e` | النحاسي/الذهبي (ستيم بانك) |
| `--ember` | `#e85d4c` | الأحمر الدافئ |
| `--teal` | `#36a39a` | الفيروزي |
| `--cream` | `#fdf4e4` | خلفية البيج الدافئة |
| `--ink` | `#231a14` | الأسود الداكن |

### الخطوط
- **العناوين:** `Baloo Bhaijaan 2` (font-weight: 800)
- **النص:** `Tajawal` (body)
- **الـ Logo:** `Lalezar` (decorative fallback)

---

## الـ Wizard State (في `app.js`)
```js
const state = {
  heroName: '',   // اسم الطفل — من Step 1
  age: null,      // السن — من Step 1
  challenge: null, // القيمة المختارة — من Step 2
  wizardStep: 1,  // الخطوة الحالية (1–4)
};
```
- Step 4 يشغّل `runGenerator()` — يحاكي loading ثم يحول لـ `#/preview`
- Preview يعرض `state.heroName` في الغلاف والنص

---

## ما لم يُبنَ بعد (للجلسة القادمة)

### الأولوية العالية
- [ ] **Next.js scaffold** — إنشاء المشروع الفعلي بـ `npx create-next-app@latest`
- [ ] **تحويل الـ Demo لـ React components** — كل section → component
- [ ] **Wizard state → Zustand store** (`src/store/wizardStore.ts`)
- [ ] **صفحة المنتج الكاملة** (`/products/[slug]`) مع cross-sell حقيقي
- [ ] **API Routes** للـ Orders و Stories

### الأولوية المتوسطة
- [ ] **MongoDB connection** (`src/lib/db.ts`)
- [ ] **Order model + submit flow** (form → API → DB)
- [ ] **Admin dashboard** (لوحة تحكم لمراجعة الطلبات)
- [ ] **Cloudinary integration** (رفع صور الأطفال)

### الأولوية المنخفضة
- [ ] **WhatsApp webhook** (إرسال بيانات الطلب على الواتساب)
- [ ] **SEO meta tags** + Open Graph
- [ ] **Tests** (Vitest + Playwright)

---

## ملاحظات التصميم المهمة

1. **Mobile-first**: 90% من المستخدمين موبايل — كل layout RTL + safe-area
2. **الـ Bottom Nav** يختفي على desktop (900px+)
3. **الـ Duolingo-style bounce**: كل `.mascot-bob` و `.wizard-character img` عندها `animation: bob`
4. **الـ Reveal**: `IntersectionObserver` مع `threshold: 0.12` — عند `.reveal.is-visible`
5. **الـ Button Shadow**: Duolingo-style `box-shadow: 0 6px 0 var(--seraj-dark)` + `translateY(4px)` on `:active`

---

## الـ Character Mapping الكامل والمُصحَّح

| الاسم | الملف | الوصف | الدور في الـ UI |
|---|---|---|---|
| سِراج | `seraj.png` | أرنب أخضر ستيم بانك | Hero mascot — في كل الصفحات |
| الجدة فاطمة | `grandma-fatima-seated.png` | جالسة على عثماني، نقاب أخضر، عقد تروس | حارسة الحكايات |
| أميرة (الأم) | `mom-amira.png` | حجاب أحمر، مخططات + بوصلة | مصممة المغامرات |
| مصطفى (الأب) | `dad-mostafa.png` | ثوب بيج، حزام أدوات، مخطوطة | المؤرخ المستكشف |
| القائد خالد | `khaled-v2.png` | درع نحاسي، عمامة، سيف مقوّس | بطل الشجاعة (Step 2 في الـ Wizard) |
| هدى | `huda-bird.png` | حمامة نحاسية آلية | رفع الصورة (Step 3 في الـ Wizard) |
| ليلى | `layla.png` | كتاب "قصص وحكايات"، ترس ذهبي | الأكبر — تمثل القراءة |
| عمر | `omar.png` | نظارة مكبّرة، حقيبة تروس | الأوسط — يمثل الابتكار |
| زين | `zain.png` | قبعة طيار، يحمل هدى | الأصغر — يمثل الخيال |

---

## طريقة تشغيل الـ Demo
```bash
cd "seraj-store/demo"
python -m http.server 3000
# ثم افتح: http://127.0.0.1:3000
```

---

## الـ Tech Stack المختار (من PLAN.md)
- **Framework:** Next.js 15 App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **Animations:** Framer Motion
- **State:** Zustand
- **DB:** MongoDB Atlas (M0 Free)
- **Images:** Cloudinary Free
- **Deployment:** Vercel (Hobby — مجاني)
- **Payment:** InstaPay (يدوي) + WhatsApp
