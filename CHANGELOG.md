# سجل التغييرات — سِراج ستور (Seraj Store)

> **⚠️ هذا الملف MUST يتم تحديثه مع كل تغيير.**
> آخر مهمة دائمة في أي task: تحديث CHANGELOG.md + DEVLOG.md
> لو لقيت الملف قديم أو ناقص → حدّثه فوراً

---

## [v2.8.0] — 2026-04-30

### Added
- شات سِراج المخصص — ودجت شات flotation مبني على Gemini API بدل Mojeeb
- `POST /api/chat-seraj` route بشخصية سِراج + streaming + rate limiting
- أزرار سريعة: المنتجات والأسعار / القصة المخصصة / قصة خالد / الشحن / تواصل واتساب
- زر واتساب في كل رد بوت للتحويل لدعم بشري
- واجهة شات كاملة: message bubbles، typing indicator، responsive design

### Removed
- Mojeeb third-party widget — استبدليناه بحل مخصص بالكامل

---

## [v2.7.0] — 2026-04-23

### Added
- فلتر المناطق الفرعية للقاهرة في فسحة حلوة — 11 منطقة (التجمع، أكتوبر، المعادي، مصر الجديدة، الشروق، مدينة نصر، المهندسين، القاهرة القديمة، الزمالك، الجيزة)
- `area` parameter في `GET /api/places` — فلترة الأماكن حسب المنطقة
- سكربت `seed-new-places.ts` — 35+ مكان جديد في القاهرة (مولات، نوادي، متاحف، حدائق، مزارع، فنون، سينما)
- Area filter يظهر تلقائياً لما المستخدم يختار "القاهرة" ويختفي مع المدن التانية
- تحسين روابط البحث — Google Search بدل Kidzapp links القديمة
- شريط إعلاني للشحن المجاني تحت التوب بار — ديناميكي من `/api/config` [`666a697`]
- شريط تقدم في السلة بيوضح المبلغ المتبقي للشحن المجاني [`666a697`]
- `FREE_SHIPPING_ABOVE` fallback = 500 ج.م (قابل للتعديل من الأدمن) [`666a697`]

### Changed
- `outingsState` يدعم `area` state جديد مع reset تلقائي عند تغيير المدينة
- `getPlaceSearchUrl()` بيستخدم Google Search بـ اسم المكان + المدينة + "مصر"

---

## [v2.6.0] — 2026-04-23

### Added
- بوت الجدة زينب — AI parenting advisor في صفحة عالم ماما [`28b536b`]
- `POST /api/chat` route مع SSE streaming + rate limiting (30 رسالة/ساعة لكل IP) [`28b536b`]
- System prompt: شخصية الجدة زينب المصرية، عامية، تربية إسلامية، أمثال شعبية [`28b536b`]
- 5 few-shot examples: العند، النوم، الأكل، القراءة، الضرب [`28b536b`]
- واجهة شات كاملة: message bubbles، typing indicator، suggestion chips [`28b536b`]
- حفظ تاريخ المحادثة في localStorage (آخر 50 رسالة) [`28b536b`]
- Configurable API: `DEEPSEEK_API_KEY` + `DEEPSEEK_BASE_URL` + `DEEPSEEK_MODEL` [`28b536b`]

---

## [v2.5.0] — 2026-04-21

### Added
- صفحة تسعير الكشكول في الأدمن (`/admin/coloring/pricing`) — تحكم في سعر الورقة والغلاف والحدود بدون deploy [`842849c`]
- `PUT /api/coloring/pricing` endpoint محمي بـ admin auth مع Zod validation [`842849c`]
- مثال حي (live preview) في صفحة التسعير بيحسب الأسعار تلقائي [`842849c`]
- كارت "التسعير 💰" في صفحة إدارة ألوان سراج [`842849c`]
- Seeder script جديد (`seed-fill-categories.js`) لملء الفئات الفاضية ببيانات منتقاة [`fb74633`]
- 29 عنصر تلوين جديد: مركبات (12)، متاهات (8)، أقنعة (8)، مجسمات (8)، أعمال حرفية (8) [`fb74633`]

### Changed
- ألوان صفحة الكتالوج: كل قسم لونه المميز — برونزي (default)، تركوازي (tales)، أخضر (seraj-stories) [`9f2c2ea`]

### Fixed
- شخصيات الـ Wizard (سِراج، خالد، هدى) بقت دائرية `border-radius: 50%` بدل مستطيلة [`50ac964`]
- شخصية التوليد (Step 4) كمان بقت دائرية [`50ac964`]

---

## [v2.4.0] — 2026-04-21

### Added
- SEO: `robots.txt` مع AI bot rules + `Content-Signal` header [`9446a1b`]
- SEO: `sitemap.ts` ديناميكي من MongoDB (مقالات + فئات تلوين) [`9446a1b`]
- SEO: JSON-LD Structured Data (Organization + WebSite + Product) [`9446a1b`]
- SEO: Canonical URL + Link headers في middleware [`6c234b4`]

### Fixed
- إصلاح Order Flow الكامل: منتج `coloring-workbook` في DB، `coloringDetails` في payload، Zod schema [`d4d1b47`]
- إظهار تفاصيل الكشكول في السلة (كارت خاص بـ format + count + cover) [`d4d1b47`]
- تفاصيل كشكول في أدمن الطلبات (Card أخضر بكل التفاصيل) [`d4d1b47`]
- شخصيات قسم التلوين الدائرية مع حركة float [`1dbd308`]

---

## [v2.3.0] — 2026-04-21

### Added
- UX overhaul لقسم التلوين: زر ❤️ أضيفي للكشكول + 🔗 مشاركة [`3c9522f`]
- شريط "كشكولك" sticky bar مع عداد الصفحات [`3c9522f`]
- صفحة الكشكول: خيار ورق/كشكول بغلاف + اختيار الغلاف (4 شخصيات) + اسم مخصص [`3c9522f`]
- حساب سعر ديناميكي (3 ج.م/ورقة + 20 ج.م للغلاف) [`3c9522f`]
- فلتر العمر (3-6، 7-10، 11+) [`3c9522f`]
- مشاركة الكشكول برابط base64 encoded [`3c9522f`]

---

## [v2.2.0] — 2026-04-20

### Added
- نظام كشكول الألوان الكامل: 135 عنصر في 12 فئة مع SuperColoring CDN [`e6dae95`]
- بانر قسم التلوين بشخصيات سراج دائرية [`8880044`]
- Toast notifications عند الإضافة/الحذف من الكشكول [`8880044`]

### Changed
- نقل التلوين داخل "عالم ماما" كـ tab "أنشطة وتلوين" [`a798a44`]

### Fixed
- إصلاح Next.js 16 dynamic route params (Promise type) [`d7a36ce`]
- إزالة duplicate coloring IDs [`bc89d4d`]
- إضافة رابط التلوين في navbar [`90e8e53`]

---

## [v2.1.0] — 2026-04-18

### Added
- Dynamic CMS لإدارة كل نصوص الموقع من الأدمن [`84f7e35`]
- نظام شهادات العملاء (testimonials CRUD) [`15147f0`]
- إعادة تصميم صفحة المنتجات: أقسام ملونة، sticky filter bar، portrait cards [`a967790`]
- Catalog page بـ pill filter، hero bar، responsive grid [`34e17e9`]
- SEO optimizations + meta tags [`15147f0`]

### Changed
- تحديث المصطلحات لـ "عوالم" بدل "أقسام" [`3e10677`]
- صور الكتالوج: استخدام صور محلية لكل فئة [`b8f2778`]

### Fixed
- منع تخزين مؤقت لـ products API (`force-dynamic`) [`9c9f166`]
- إصلاح double-render flash و stale cache [`0309813`]
- حذف ناعم للمنتجات (two-step delete) [`4dc22e5`]
- إصلاح ترميز العربي في index.html [`2934d0c`]

---

## [v2.0.0] — 2026-04-17

### Added
- إعادة هيكلة استراتيجية: المتجر متعدد الفئات (قصص + ألعاب + قصة مخصوصة + حكايات) [`b5728ef`]
- صفحة منتجات ديناميكية بالكامل مع scroll-spy و bundle strip [`03d705f`]
- حقول `section` و `series` في schema المنتج [`46d71bc`]

### Changed
- أزرار الـ homepage CTAs بتوجه لأقسام المنتجات [`81744ea`]
- Service worker cache bump لـ seraj-v3 [`079bf43`]

---

## [v1.9.0] — 2026-04-16

### Added
- نظام "فسحة حلوة": 480 مكان في مصر من Kidzapp API [`6640de6`]
- Place model + CRUD API routes [`5a9aed6`]
- صفحة فلترة: budget slider، city/type/category chips [`a55b008`]
- Kidzapp Egypt scraper مع retry error handling [`d9e8f8b`]

### Fixed
- استبدال 480 رابط Kidzapp بـ Google Maps links [`420c413`]

---

## [v1.8.0] — 2026-04-15

### Added
- نظام رسوم الشحن مع تحكم من الأدمن [`e59eef7`]
- إعدادات الشحن في لوحة التحكم (رسوم + حد الشحن المجاني) [`8de4f78`]
- textarea للقيم المخصصة في الخطوة 2 من الـ wizard [`4303ed1`]

### Changed
- إزالة خيارات الدفع deposit/VIP — التبسيط [`577c4de`]

### Fixed
- صور المنتجات: fallback من `media.image` لـ `imageUrl` [`85e01a1`]
- صور المنتجات: natural proportions بدل forced portrait [`ceab76a`]

---

## [v1.7.0] — 2026-04-14

### Added
- نظام مقالات "عالم ماما" الكامل (scraping + seeding + rendering) [`d6e8c82`]
- OG meta tags لمعاينة الروابط على WhatsApp [`574b056`]
- Social sharing banner image [`5c05015`]
- Product image pipeline: صور حقيقية من Cloudinary بدل CSS mockups [`b12cddd`]

### Fixed
- إصلاح عداد CMS: 3 حقول منفصلة (prefix, number, suffix) [`fa41d75`]
- إعادة تشغيل counter animation بعد dynamic content injection [`3bca115`]
- OG banner: upgrade لـ full resolution Q95 [`0d6dc1a`]
- إصلاح duplicate sources + mobile horizontal scroll [`efdd81a`]

---

## [v1.6.0] — 2026-04-13

### Added
- لوحة تحكم كاملة (Phase 4): NextAuth v5 + admin layout + sidebar [`69cdb1a`]
- إدارة الطلبات + المنتجات + القصص في الأدمن [`216d117`, `e4ea603`, `9214b19`]
- Product CRUD API routes [`cb6b4f3`]
- Admin dashboard مع stats + recent orders [`95c3f4d`]

### Security
- حماية كل admin API routes بـ auth middleware [`096ba68`]

---

## [v1.5.0] — 2026-04-13

### Added
- ربط الـ frontend بـ API: products fetch، cart persistence، checkout [`072acdc`]
- MongoDB connection + models + seed script [`b374958`]
- WhatsApp + InstaPay config ديناميكي من API [`25870c4`]
- رفع صورة الطفل في wizard step 3 [`5e559f4`]
- SEO metadata + Arabic layout [`91e1ab0`]
- 404 page للـ SPA hash router [`c8fd30e`]
- Error boundary للوحة التحكم [`9e6a1f7`]
- WhatsApp button لكل طلب + 30s polling [`7b6ac10`]
- PWA: manifest + service worker [`fd632be`]
- Lazy loading لكل الصور [`f458ad2`]

### Fixed
- Order submission crash — أرقام عربية + validation [`7a14aeb`]
- API validation — null/empty customStory fields [`674c2cf`]
- 5 critical bugs: data loss, price validation, pagination, rate limiting [`fb96350`]
- NextAuth auth() middleware → standard cookie check [`00e4116`]

### Performance
- ضغط فيديوهات 98% (30.7MB → 0.7MB) [`d1b7caa`]
- إعادة ضغط بجودة عالية (720p CRF28 → 4.3MB) [`1a12f4e`]

---

## [v1.0.0] — 2026-04-13

### Added
- النسخة الأولية: SPA frontend (HTML + CSS + JS) مع hash router [`7d19ffa`]
- صفحة الرئيسية + المنتجات + عالم ماما + wizard [`c91647a`, `0b093c3`]
- نظام سلة مشتريات + checkout [`0b093c3`]
- Next.js backend مع API routes [`b374958`]
- shadcn/ui components [`be3798b`]

### Changed
- تغيير اسم الجدة فاطمة → الجدة زينب [`73dbe20`]

---

## فئات التغييرات

| النوع | الوصف |
|-------|-------|
| **Added** | ميزة أو وظيفة جديدة |
| **Changed** | تغيير في وظيفة موجودة |
| **Fixed** | إصلاح bug أو خطأ |
| **Removed** | حذف ميزة أو كود |
| **Security** | إصلاح أمني أو حماية |
| **Performance** | تحسين أداء |
