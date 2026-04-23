# سجل التحديات والحلول — سِراج ستور (Seraj Store)

> **⚠️ هذا الملف MUST يتم تحديثه مع كل تغيير.**
> آخر مهمة دائمة في أي task: تحديث CHANGELOG.md + DEVLOG.md
> لو لقيت الملف قديم أو ناقص → حدّثه فوراً

---

## 📋 التحدي 13: شريط الشحن المجاني — UX غير مزعج

**التاريخ:** 2026-04-23 | **Commits:** `666a697`

### المشكلة
المستخدمين مش عارفين إن فيه شحن مجاني فوق حد معين — المعلومة موجودة بس في صفحة الشحن اللي حد بيدخلها.

### الحل
3 عناصر متكاملة:
1. **شريط رفيع** تحت التوب بار — أخضر خفيف، فونت 12px، أيقونة شاحنة صغيرة
2. **شريط تقدم في السلة** — "فاوتي بـ ٣٠٠ ج.م والشحن يجي مجاني!" + progress bar أخضر
3. **رسالة احتفال** لما الحد يتحقق — "🎉 الشحن مجاني! نيالك ✦"

### نقطة مهمة
الحد بيتقرأ من `/api/config` → `freeShippingAbove` — يتغير من الأدمن بدون deploy. الـ fallback = 500 ج.م.

### الدرس المستفاد
> **"أعلن عن الميزات"** — لو فيه ميزة زي الشحن المجاني، لازم المستخدم يعرفها في أول زيارة. شريط رفيع مش مزعج بس بيعمل الفعل: يخلي المستخدم يضيف منتج أكتر عشان يوصل للحد.

---

## 📋 التحدي 12: فلتر المناطق الفرعية — القاهرة كبيرة ومتنوعة

**التاريخ:** 2026-04-23

### المشكلة
القاهرة فيها 480+ مكان لكن المستخدم يختار "القاهرة" ويلاقي كل الأماكن مختلطة — التجمع والمعادي ومصر الجديدة كلهم في نفس النتايج. الصعب إن الأم تدور على مكان قريب منها في منطقة معينة.

### الحل
فلتر فرعي (sub-filter) بيظهر بس لما المستخدم يختار "القاهرة":
1. HTML: `#areaFilterGroup` مخفي افتراضياً — يظهر لما city = Cairo
2. JS: `outingsState.area` + event listeners + API parameter
3. API: `filter.area = area` في GET /api/places
4. Seed script: 35+ مكان جديد بأسماء مناطق متطابقة

### نقطة مهمة
قيم الـ `data-area` في HTML لازم تتطابق بالظبط مع قيم `area` في الـ database. لو فيه mismatch، الفلتر مش هيرجع نتايج.

### الدرس المستفاد
> **"Area filter = UX game changer"** — لما مدينة كبيرة زي القاهرة فيها 480+ مكان، فلتر المناطق مش رفاهية ده ضرورة. المستخدم بيقعد يلف ويدور لحد ما يزهق. فلتر بسيط بيخلي التجربة أسرع 10x.

---

## 📋 التحدي 11: API Key من Agent Router — مش شغال مباشرة

**التاريخ:** 2026-04-23 | **Commits:** `28b536b`

### المشكلة
API key من "Agent Router" (`sk-VYJTQ...`) مش شغال مع DeepSeek API مباشرة — بيرجع 401 Authentication Fails.

### السبب
الـ key من مزود تالت (proxy/aggregator) مش من DeepSeek مباشرة. حاولت:
- `api.deepseek.com` → 401
- `openrouter.ai` → 401
- `api.fireworks.ai` → 404 (model not found) — ده معناه إن الـ key **بياخد authentication** بس مفيش models متاحة
- `api.agentrouter.com` → SSL error

### الحل
الكود اتبنى بشكل **configurable** — 3 environment variables:
- `DEEPSEEK_API_KEY` — أي OpenAI-compatible API key
- `DEEPSEEK_BASE_URL` — أي base URL
- `DEEPSEEK_MODEL` — اسم الـ model

الـ user يحتاج يوفر:
1. Either DeepSeek API key مباشر (أرخص وأضمن — من platform.deepseek.com)
2. Or يحدد الـ BASE_URL الصحيح لمزوده

### الدرس المستفاد
> **"API key proxy complications"** — لو الـ API key من مزود وسيط (proxy/aggregator)، لازم تعرف الـ base URL والـ model name بتوعه. الأحسن تستخدم API key مباشر من المزود الأصلي. بناء الكود configurable من الأول بيوفر وقت كتير.

---

## 📋 التحدي 1: Order Flow مكسور تماماً للكشكول

**التاريخ:** 2026-04-21 | **Commits:** `d4d1b47`

### المشكلة
لما عميل بيضيف كشكول تلوين للسلة وبيعمل checkout، الطلب كان بيفشل بصمت — مفيش رسالة خطأ، بس الطلب مش بيتبعت.

### السبب (Root Cause)
سلسلة من الأخطاء المتتابعة:
1. منتج `coloring-workbook` مش موجود في MongoDB → lookup بيرجع null
2. Frontend بيبعت `coloringDetails` لكن الـ API مش بيستقبله (مش في Zod schema)
3. `coverImage` vs `coverImageUrl` — اسم الحقل مختلف بين frontend و backend
4. Slug مختلف: frontend بيبعت `coloring-workbook` لكن API بيدور على `coloring_book`

### المحاولات
| # | الحل | النتيجة |
|---|------|---------|
| 1 | إضافة المنتج في DB بس | فشل — الـ validation رافض `coloringDetails` |
| 2 | تعديل Zod schema بدون تعديل price calculation | فشل — السعر بيرجع 0 |
| 3 | كل الإصلاحات مع بعض | ✅ نجح |

### الحل النهائي
1. Seed product `coloring-workbook` في MongoDB
2. إضافة `ColoringDetailsSchema` في Zod validation
3. تعديل `submitOrder` يبعت `coloringDetails` في payload
4. توحيد اسم الحقل: `coverImage` في كل مكان
5. السعر الديناميكي: `coloring-workbook` سعره من الكلاينت مش من DB

### الدرس المستفاد
> **"Validation chain"** — لو فيه 4 حاجات لازم تتعدل مع بعض، تعديل واحدة لوحدها مش هيحل المشكلة وهتبوظ أكتر. لازم تتتبع الـ flow كامل من أول الزرار لحد الـ DB.

---

## 📋 التحدي 2: صور الشخصيات PNG بخلفية بيضاء

**التاريخ:** 2026-04-21 | **Commits:** `50ac964`, `1dbd308`

### المشكلة
صور شخصيات سراج (خالد، سِراج، ليلى) PNG بخلفية بيضاء — لما حطيناهامستطيلة كانت شكلها وحش.

### المحاولات
| # | الحل | النتيجة |
|---|------|---------|
| 1 | `mix-blend-mode: multiply` | شبه ناجح بس بيسحب اللون من الخلفية |
| 2 | Frosted glass background (`::before` دائرة) | كويس بس الصورة مستطيلة بره الدائرة |
| 3 | **`border-radius: 50%` على الصورة + `object-fit: cover`** | ✅ مثالي |

### الحل النهائي
```css
.wizard-character img {
  width: 180px;
  height: 180px;         /* Square */
  border-radius: 50%;    /* Circle */
  object-fit: cover;     /* Crop to fit */
  border: 4px solid #fff;
  box-shadow: 0 8px 24px rgba(0,0,0,.15);
}
```

### الدرس المستفاد
> **"PNG بخلفية بيضاء + border-radius: 50%"** أحسن حل بدون ما تحتاج توقف على شفافية الصورة. الـ `object-fit: cover` بيضمن إن الصورة بتملأ الدائرة بالكامل.

---

## 📋 التحدي 3: SPA + SEO — Google مش شايف الصفحات

**التاريخ:** 2026-04-21 | **Commits:** `9446a1b`, `6c234b4`

### المشكلة
الموقع SPA بـ hash routing (`#/home`, `#/products`) — Google مش بيقدر يindex الصفحات الفرعية.

### السبب
- Hash fragments (`#`) مش بتتبعت للسيرفر — Google مش بيعرف لها
- مفيش `robots.txt` ولا `sitemap.xml`
- مفيش structured data

### الحل
ماقدرناش نغير الـ architecture (SPA → SSR) لكن حسّنا اللي نقدر عليه:
1. `robots.txt` مع AI bot rules + Content-Signal
2. `sitemap.ts` ديناميكي من MongoDB (المقالات + فئات التلوين ليها URLs حقيقية)
3. JSON-LD Structured Data (Organization + WebSite + Product)
4. Canonical URL + Link headers في middleware
5. النتيجة: فحص agent-ready ارتفع من 25 لـ ~50-55

### الدرس المستفاد
> **"Hash routing و SEO متكاملين"** — في SPA بـ hash routing، الـ SEO الحقيقي بيكون في: (1) structured data، (2) robots.txt + sitemap، (3) canonical URL. الصفحات الفرعية مش هتترanker بس على الأقل Google يعرف إن الموقع موجود.

---

## 📋 التحدي 4: صور المنتجات مش ظاهرة

**التاريخ:** 2026-04-14 → 2026-04-15 | **Commits:** `b12cddd`, `85e01a1`, `ceab76a`

### المشكلة
صور المنتجات في صفحة الكتالوج وتفاصيل المنتج مش بتظهر.

### السبب
1. المنتجات القديمة كانت بـ CSS mockup images ( gradients) مش صور حقيقية
2. الحقل `imageUrl` كان فاضي — الصور كانت في `media.image`
3. Admin بيستخدم حقل `image` لكن الـ frontend بيدور على `imageUrl`

### المحاولات
| # | الحل | النتيجة |
|---|------|---------|
| 1 | CSS mockup background images | مؤقت — مش حقيقي |
| 2 | Cloudinary upload pipeline | كويس بس admin مش بيستخدمه |
| 3 | **Fallback chain: `media.image` → `imageUrl` → CSS fallback** | ✅ |

### الحل النهائي
- Pipeline كامل: Admin يرفع صور → Cloudinary → `imageUrl` في DB
- Frontend fallback: يجرب `media.image` الأول، بعدين `imageUrl`، بعدين placeholder
- `object-fit: contain` عشان الصور ما تتشوهش

### الدرس المستفاد
> **"Image fallback chain"** — لازم دايماً يكون فيه fallback لكل مصدر صورة. الـ Admin والـ frontend ممكن يستخدموا أسماء حقول مختلفة — توحيدها أو عمل fallback هو الحل.

---

## 📋 التحدي 5: فيديوهات كبيرة + GitHub 100MB limit

**التاريخ:** 2026-04-13 | **Commits:** `6856ca7`, `d1b7caa`, `1a12f4e`

### المشكلة
فيديوهات المنتجات حجمهم 30MB+ — GitHub بيرفض ملفات فوق 100MB، وVercel بيأخذ وقت طويل في التحميل.

### المحاولات
| # | الحل | النتيجة |
|---|------|---------|
| 1 | Git LFS | مشكلة — Vercel مش بيقرأ LFS pointers صح |
| 2 | ضغط شديد (CRF 35) | حجم صغير جداً بس الجودة وحشة |
| 3 | **ضغط متوازن (720p CRF28)** | ✅ 30MB → 4.3MB بجودة كويسة |

### الحل النهائي
- FFmpeg: `ffmpeg -i input.mp4 -vf scale=1280:-1 -c:v libx264 -crf 28 -preset slow output.mp4`
- 720p بدل 1080p — فارق مش ملحوظ على موبايل
- CRF 28 = sweet spot بين الحجم والجودة

### الدرس المستفاد
> **"اضغط الفيديو قبل ما ترفعه"** — حجم الفيديو هو أكبر مشكلة في deployment. FFmpeg بـ CRF 28 + 720p بيقلل الحجم 85-95% بجودة مقبولة. Git LFS مش حل مع Vercel.

---

## 📋 التحدي 6: Next.js Caching يرجع بيانات قديمة

**التاريخ:** 2026-04-17 → 2026-04-18 | **Commits:** `0309813`, `9c9f166`

### المشكلة
بعد تعديل المنتجات من الأدمن، الكتالوج بيفضل يعرض البيانات القديمة لفترة طويلة.

### السبب
- Next.js بيـ cache الـ API responses بشكل شبه دائم
- `force-dynamic` مش مضاف في كل API routes
- `revalidatePath` مش بيتم استدعاؤه بعد كل update

### الحل
1. إضافة `export const dynamic = "force-dynamic"` في كل API route
2. `revalidatePath("/api/products")` بعد كل POST/PATCH/DELETE
3. Frontend: `cache: 'no-store'` في fetch calls المهمة

### الدرس المستفاد
> **"Next.js caching trap"** — Next.js بيحب يـ cache كل حاجة. لو البيانات بتتغير ديناميكياً، لازم تبقى صريح إنك عايز `force-dynamic`. الافتراض إن API route = dynamic هو افتراض خاطئ.

---

## 📋 التحدي 7: أرقام عربية بتكسر الـ Validation

**التاريخ:** 2026-04-13 | **Commits:** `7a14aeb`

### المشكلة
عميلة بتكتب رقم الموبايل بأرقام عربية (٠١٠١٢٣٤٥٦٧) → الـ validation بيرفضه → الطلب مش بيتم.

### السبب
Zod schema بتقبل أرقام لاتينية بس (`/^[0-9]+$/`) — الأرقام العربية (Unicode) مش متضمنة.

### الحل
```javascript
// Convert Arabic numerals before validation
phone = phone.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
phone = phone.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));
```

### الدرس المستفاد
> **"لو المستخدم عربي، استقبل أرقام عربية"** — الـ input normalization لازم يكون أول خطوة قبل أي validation. حوّل كل الأرقام (عربي/فارسي) للاتيني ثم validate.

---

## 📋 التحدي 8: OG Image مش ظاهرة على WhatsApp

**التاريخ:** 2026-04-14 | **Commits:** `574b056`, `4e1fcd7`, `0d6dc1a`

### المشكلة
رابط الموقع مش بيظهر صورة preview على WhatsApp.

### المحاولات
| # | الحل | النتيجة |
|---|------|---------|
| 1 | OG meta tags بس | فشل — WhatsApp مش شايف الصورة |
| 2 | إضافة `og:image:width` + `height` | شبه ناجح |
| 3 | **صورة أكبر (1200x630+) + Q95 mozjpeg** | ✅ |

### السبب
WhatsApp بيحتاج:
- صورة حجمها على الأقل 600x315 (المثالي 1200x630)
- `og:image` بـ URL كامل (مش relative)
- `og:image:type` + `og:image:width` + `og:image:height`

### الدرس المستفاد
> **"OG Image debugging"** — استخدم [opengraph.xyz](https://opengraph.xyz) عشان تشوف كيف كل منصة (WhatsApp, Facebook, Twitter) بتعرض الرابط. الصورة لازم تكون URL كامل و حجم كافي.

---

## 📋 التحدي 9: Scraper بيطلع "Invalid URL"

**التاريخ:** 2026-04-21 | **Commits:** `fb74633`

### المشكلة
Script `seed-empty-categories.js` بيعمل scraping من SuperColoring لكن بيرجع "Invalid URL" لكل فئة.

### السبب
- Node.js `http.get()` مش بيتعامل صح مع HTTPS redirect
- SuperColoring بيعمل redirect من HTTP لـ HTTPS
- الـ URL parsing في `fetchUrl()` مش شغال على Windows

### المحاولات
| # | الحل | النتيجة |
|---|------|---------|
| 1 | إصلاح `fetchUrl()` function | فشل — نفس المشكلة |
| 2 | استخدام Playwright | كويس بس بطيء وبيحتاج browser |
| 3 | **Curated data بـ CDN URLs يدوية** | ✅ سريع ومضمون |

### الحل النهائي
بدل ما نعمل scraping، استخدمنا URLs مباشرة من SuperColoring CDN:
```
https://cdn.supercoloring.com/sites/default/files/styles/coloring_medium/public/cif/2015/06/slug-coloring-page.png
```
Pattern ثابت — بنغيّر الـ slug بس.

### الدرس المستفاد
> **"Curated data > scraping"** — لو الـ scraper مش شغال، مفيش مشكلة نكتب البيانات يدوياً. 50 عنصر بـ CDN URLs يدوية أحسن من 0 عنصر بناءً على scraper عطلان. المصدر (SuperColoring) عنده URL pattern ثابت — استغله.

---

## 📋 التحدي 10: TypeScript strict mode و bulkWrite

**التاريخ:** 2026-04-21 | **Commits:** `842849c`

### المشكلة
Build فشل بـ TypeScript error: `null is not assignable to AnyBulkWriteOperation`.

### السبب
```typescript
// filter(Boolean) مش بيـ narrow النوع في TypeScript
const ops = items.map(...).filter(Boolean);
// TypeScript بيعتبر إن ops ممكن يحتوي null
```

### الحل
```typescript
const ops = items
  .map(item => item ? { updateOne: {...} } : undefined)
  .filter((op): op is NonNullable<typeof op> => op !== undefined);
```
Type predicate `op is NonNullable<typeof op>` بيخلي TypeScript يفهم إن النتيجة مش فيها `undefined`.

### الدرس المستفاد
> **"TypeScript type narrowing مع filter"** — `filter(Boolean)` مش بيكفي لـ TypeScript strict mode. استخدم type predicate: `.filter((x): x is NonNullable<typeof x> => x !== undefined)`.

---

## 📊 ملخص الدروس المستفادة

| # | التحدي | الدرس الرئيسي |
|---|--------|---------------|
| 1 | Order Flow مكسور | تتبع الـ flow كامل — تعديل حتة واحدة مش كافي |
| 2 | صور PNG بخلفية بيضاء | `border-radius: 50%` + `object-fit: cover` = أحسن حل |
| 3 | SPA + SEO | Structured data + robots.txt أهم من SPA routing |
| 4 | صور مش ظاهرة | Image fallback chain: جرب كل المصادر |
| 5 | فيديوهات كبيرة | اضغط قبل الرفع: FFmpeg CRF 28 + 720p |
| 6 | Next.js caching | `force-dynamic` + `revalidatePath` = ديناميك حقيقي |
| 7 | أرقام عربية | Input normalization قبل validation دايماً |
| 8 | OG Image | URL كامل + حجم 1200x630+ + testing بـ opengraph.xyz |
| 9 | Scraper عطلان | Curated data > scraper — استغل URL patterns الثابتة |
| 10 | TypeScript strict | Type predicates لـ `.filter()` مش `filter(Boolean)` |
| 11 | API key proxy | كون الكود configurable — استخدم API key مباشر من المزود |
| 12 | Area sub-filter | فلتر المناطط ضرورة للمدن الكبيرة — قيم area لازم تتطابق بالظبط |
| 13 | Free shipping banner | أعلن عن الميزات — شريط رفيع + progress bar = زيادة في قيمة السلة |
