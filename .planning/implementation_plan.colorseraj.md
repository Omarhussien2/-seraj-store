# خطة "كشكول ألوان سراج" 🎨 — الخطة الشاملة والنهائية

## ملخص الخدمة

خدمة جديدة في **عالم ماما** تتيح للأمهات تصفح آلاف صور التلوين والأنشطة التعليمية، حفظها ومشاركتها، ثم طلب طباعتها من سراج في صورتين:

| الخيار | الوصف | السعر |
|--------|-------|-------|
| **ورق مطبوع** | أوراق تلوين/أنشطة مفردة مطبوعة | سعر السوق أو أقل (متغير من الأدمن) |
| **كشكول سراج** | كتاب تلوين بغلاف مخصص تختاره الأم | سعر الورق + ٢٠ ج.م للغلاف (متغير من الأدمن) |

---

## استراتيجية المحتوى والتخزين

### النموذج الهجين (Hybrid Model) — مجاني 100%

> [!TIP]
> بدلاً من الاعتماد على KidiPage فقط (فهرس بدون حقوق)، نعتمد على **مواقع تقدم محتوى بتراخيص مفتوحة** تسمح بالاستخدام.

```
┌─────────────────────────────────────────────────────────┐
│          استراتيجية التخزين الهجين                       │
│                                                         │
│  ┌──────────────────┐    ┌──────────────────────────┐   │
│  │   Cloudinary      │    │   المصادر الأصلية         │   │
│  │   (Free 25GB)     │    │   (Hotlink / Source URL)  │   │
│  │                   │    │                           │   │
│  │  • صور مصغرة      │    │  • صور بجودة طباعة        │   │
│  │    (thumbnails)   │    │    (300 DPI)              │   │
│  │  • ≤50KB/صورة     │    │  • PDF أو PNG كبيرة       │   │
│  │  • غلاف محسّن     │    │  • رابط مباشر للتحميل     │   │
│  │  • f_auto,q_auto  │    │                           │   │
│  └──────────────────┘    └──────────────────────────┘   │
│                                                         │
│  Cloudinary 25GB ÷ 50KB = ~500,000 صورة مصغرة ✅        │
│  MongoDB 512MB للبيانات النصية = ~200,000 عنصر ✅        │
└─────────────────────────────────────────────────────────┘
```

### مصادر المحتوى المتعددة

| المصدر | الترخيص | المحتوى | الملاحظات |
|--------|---------|---------|-----------|
| **SuperColoring.com** | CC0 / CC-BY / CC-BY-SA (حسب الصورة) | +50,000 صفحة تلوين + أنشطة | ✅ أفضل مصدر — كل صورة فيها حقل "Permission" واضح |
| **Coloring.ws** | مجاني للاستخدام الشخصي | آلاف صفحات التلوين | ⚠️ نربط فقط، لا نستضيف |
| **ColoringPages101** | مجاني للطباعة | حيوانات، شخصيات، طبيعة | ⚠️ نربط فقط |
| **KidiPage.com/ar** | فهرس (لا يملك المحتوى) | +8,000 رابط لمواقع خارجية | 🔗 نستخدم كدليل فئات فقط |
| **محتوى سراج الأصلي** | ملك سراج 100% | شخصيات سراج للتلوين | ✅ نملكه بالكامل — أولوية عالية |

#### قاعدة ذهبية للمحتوى:

```
لكل عنصر، حقل license يحدد التعامل:

"cc0"       → نستضيف الصورة على Cloudinary بالكامل ✅
"cc-by"     → نستضيف مع ذكر المصدر ✅
"cc-by-sa"  → نستضيف مع ذكر المصدر + نفس الترخيص ✅
"free-link" → نعرض thumbnail + نربط بالمصدر الأصلي 🔗
"seraj"     → محتوى سراج الحصري — نملكه ✅
```

---

## Proposed Changes

### البنية التحتية (Backend)

---

#### [NEW] `src/lib/models/ColoringCategory.ts`

```typescript
// Schema فئات التلوين — شجرة هرمية
{
  slug: "animals-cats",            // unique, URL-friendly
  nameAr: "قطط",                   
  nameEn: "Cats",                  // اختياري — للأدمن
  parentSlug: "animals",           // null = فئة رئيسية
  icon: "🐱",                      
  description: "صفحات تلوين قطط جميلة للأطفال",
  thumbnail: "cloudinary-url",     // صورة الفئة
  itemCount: 45,                   // cached count
  source: "supercoloring",        // المصدر الأساسي
  order: 1,                       
  active: true,
  featured: false,                // تظهر في الصفحة الرئيسية؟
}
```

**الفئات الرئيسية المقترحة:**
```
🎨 تلوين
├── 🐾 حيوانات (قطط، كلاب، أسماك، طيور، ...)
├── 🏰 شخصيات كرتونية
├── 🌸 طبيعة وزهور
├── 🚗 مركبات
├── 🦸 أبطال خارقين
├── 🌙 إسلامي (مساجد، رمضان، عيد)
├── 🐰 شخصيات سراج ⭐ حصري
└── 🎯 ماندالا

📝 تمارين تعليمية
├── 🔢 أرقام وحساب
├── 🔤 حروف عربية
├── 🔤 حروف إنجليزية
├── 🔗 ربط النقاط
└── 🧩 متاهات

✂️ أنشطة يدوية
├── 🎭 أقنعة
├── 📦 مجسمات ورقية
└── 🎨 أعمال حرفية
```

---

#### [NEW] `src/lib/models/ColoringItem.ts`

```typescript
{
  title: "قطة جميلة تلعب بالكرة",
  slug: "cute-cat-playing-ball",    // unique
  categorySlug: "animals-cats",
  
  // صور — النموذج الهجين
  thumbnail: "cloudinary-url",      // صورة مصغرة مخزنة عندنا (≤50KB)
  fullImageUrl: "cloudinary-url",   // الصورة الكاملة (لو cc0/cc-by)
  sourceUrl: "https://original.com/cat.pdf", // رابط المصدر الأصلي
  sourceName: "SuperColoring",
  
  // تصنيف
  type: "coloring",                // coloring | worksheet | craft
  difficulty: "easy",              // easy | medium | hard
  ageRange: "3-6",                 // "3-6" | "7-10" | "11+"
  tags: ["حيوانات", "قطط", "سهل"],
  
  // ترخيص
  license: "cc0",                  // cc0 | cc-by | cc-by-sa | free-link | seraj
  attribution: "SuperColoring.com",
  
  // إحصائيات
  savedCount: 0,                   // عدد مرات الحفظ
  printCount: 0,                   // عدد مرات الطباعة
  shareCount: 0,
  
  // إدارة
  active: true,
  featured: false,
  order: 1,
  printable: true,                 // هل مسموح طباعتها؟
}
```

---

#### [MODIFY] `src/lib/models/Order.ts`

إضافة نوع طلب جديد: **طلب طباعة تلوين**

```typescript
// إضافة للـ OrderItemSchema — عنصر من نوع "coloring"
{
  productSlug: "coloring-print",     // ثابت لطلبات التلوين
  name: "كشكول ألوان سراج (15 ورقة)",
  price: 75,                         // محسوب: pages × perPage + coverPrice
  qty: 1,
  // حقل جديد:
  coloringDetails: {
    items: [ObjectId, ObjectId, ...], // قائمة عناصر التلوين
    itemCount: 15,
    format: "book",                   // "book" (كشكول بغلاف) | "sheets" (ورق مفرد)
    coverImageUrl: "cloudinary-url",  // صورة الغلاف (لو format=book)
    coverTitle: "كشكول يوسف للتلوين", // عنوان الغلاف
  }
}
```

---

#### [MODIFY] `src/lib/models/SiteContent.ts`

إضافة مفاتيح تسعير قابلة للتعديل من الأدمن:

```javascript
// Settings جديدة (section: "coloring-pricing")
{ key: "coloring_price_per_page",   value: "3",   section: "coloring-pricing" }  // سعر الورقة الواحدة
{ key: "coloring_cover_price",      value: "20",  section: "coloring-pricing" }  // زيادة الغلاف
{ key: "coloring_min_pages",        value: "5",   section: "coloring-pricing" }  // أقل عدد أوراق
{ key: "coloring_max_pages",        value: "50",  section: "coloring-pricing" }  // أكثر عدد أوراق
{ key: "coloring_free_shipping_min",value: "100", section: "coloring-pricing" }  // حد الشحن المجاني
```

---

#### [NEW] API Routes

```
GET    /api/coloring/categories                → شجرة الفئات
GET    /api/coloring/categories/[slug]         → فئة + عناصرها (paginated)
GET    /api/coloring/items?category=X&type=Y&age=Z&page=1&q=search
                                               → بحث + فلترة + pagination
GET    /api/coloring/items/[slug]              → عنصر واحد بالتفاصيل
GET    /api/coloring/featured                  → عناصر مميزة للصفحة الرئيسية
GET    /api/coloring/pricing                   → الأسعار الحالية (من SiteContent)
```

| ملف API | الوصف |
|---------|-------|
| `src/app/api/coloring/categories/route.ts` | [NEW] GET فئات |
| `src/app/api/coloring/categories/[slug]/route.ts` | [NEW] GET فئة + عناصر |
| `src/app/api/coloring/items/route.ts` | [NEW] GET عناصر + بحث |
| `src/app/api/coloring/items/[slug]/route.ts` | [NEW] GET عنصر واحد |
| `src/app/api/coloring/featured/route.ts` | [NEW] GET مميزات |
| `src/app/api/coloring/pricing/route.ts` | [NEW] GET أسعار |

---

### واجهة المستخدم (Frontend — SPA)

---

#### [MODIFY] `public/index.html`

إضافة صفحات جديدة في الـ SPA:

```html
<!-- صفحة التلوين الرئيسية -->
<section class="page" data-page="coloring">
  <!-- Hero خاص بالتلوين -->
  <div class="coloring-hero">
    <div class="coloring-hero-text">
      <span class="kicker">عالم ماما</span>
      <h1>كشكول ألوان سراج 🎨</h1>
      <p>آلاف صفحات التلوين والأنشطة التعليمية — حمّليها مجاناً أو اطلبيها مطبوعة!</p>
    </div>
    <!-- شخصية سراج بيرسم -->
  </div>

  <!-- فلاتر سريعة -->
  <div class="coloring-filters">
    <button class="filter-pill active" data-type="all">الكل</button>
    <button class="filter-pill" data-type="coloring">🎨 تلوين</button>
    <button class="filter-pill" data-type="worksheet">📝 تمارين</button>
    <button class="filter-pill" data-type="craft">✂️ أنشطة</button>
  </div>

  <!-- شبكة الفئات الرئيسية -->
  <div class="coloring-categories-grid" id="coloringCatsGrid">
    <!-- يتم تعبئتها ديناميكياً -->
  </div>
</section>

<!-- صفحة الفئة الفرعية -->
<section class="page" data-page="coloring-category">
  <div class="page-head">
    <button class="back-btn" onclick="navigateTo('#/coloring')">← رجوع</button>
    <h1 id="catTitle">قطط</h1>
    <p id="catDesc">صفحات تلوين قطط جميلة</p>
  </div>
  
  <!-- شبكة العناصر -->
  <div class="coloring-items-grid" id="coloringItemsGrid">
    <!-- كاردز الصور -->
  </div>
  
  <!-- تحميل المزيد -->
  <div class="load-more" id="loadMoreBtn">
    <button class="btn-secondary">حمّلي المزيد</button>
  </div>
</section>

<!-- صفحة كشكول سراج (السلة/المحفوظات) -->
<section class="page" data-page="coloring-cart">
  <div class="page-head">
    <h1>🎨 كشكول ألوان سراج</h1>
    <p>اختاري الصور اللي عايزاها واطلبيها مطبوعة!</p>
  </div>

  <!-- العناصر المحفوظة -->
  <div class="coloring-saved-grid" id="savedItemsGrid"></div>

  <!-- خيارات الطباعة -->
  <div class="print-options" id="printOptions">
    <div class="print-option-card">
      <input type="radio" name="format" value="sheets" id="formatSheets" checked>
      <label for="formatSheets">
        <span class="option-icon">📄</span>
        <span class="option-title">ورق مطبوع</span>
        <span class="option-desc">أوراق تلوين مفردة</span>
        <span class="option-price" id="sheetsPrice">٤٥ ج.م</span>
      </label>
    </div>
    <div class="print-option-card">
      <input type="radio" name="format" value="book" id="formatBook">
      <label for="formatBook">
        <span class="option-icon">📚</span>
        <span class="option-title">كشكول سراج</span>
        <span class="option-desc">كتاب تلوين بغلاف مخصص</span>
        <span class="option-price" id="bookPrice">٦٥ ج.م</span>
      </label>
    </div>
  </div>

  <!-- اختيار الغلاف (يظهر لما تختار كشكول) -->
  <div class="cover-selection" id="coverSelection" style="display:none;">
    <h3>اختاري غلاف الكشكول</h3>
    <div class="cover-options-grid" id="coverGrid">
      <!-- أغلفة جاهزة من شخصيات سراج -->
    </div>
    <div class="cover-custom">
      <label>اسم الكشكول:</label>
      <input type="text" id="coverTitle" placeholder="مثلاً: كشكول يوسف للتلوين">
    </div>
  </div>

  <!-- ملخص الطلب -->
  <div class="coloring-order-summary">
    <div class="summary-row">
      <span>عدد الأوراق:</span>
      <span id="pageCount">0</span>
    </div>
    <div class="summary-row">
      <span>سعر الأوراق:</span>
      <span id="pagesTotal">٠ ج.م</span>
    </div>
    <div class="summary-row" id="coverPriceRow" style="display:none;">
      <span>غلاف مخصص:</span>
      <span id="coverPrice">٢٠ ج.م</span>
    </div>
    <div class="summary-row total">
      <span>الإجمالي:</span>
      <span id="coloringTotal">٠ ج.م</span>
    </div>
    <button class="btn-cta" id="addColoringToCart">
      أضيفي للسلة 🛒
    </button>
  </div>
</section>
```

---

#### [MODIFY] `public/app.js`

```javascript
// === إضافات جديدة ===

// 1. Routes جديدة
// تحديث parseRoute() وshowPage() لدعم:
// #/coloring                    → صفحة التلوين الرئيسية
// #/coloring/[categorySlug]     → صفحة فئة
// #/coloring/cart               → كشكول سراج

// 2. كشكول سراج (localStorage)
var coloringWishlist = JSON.parse(localStorage.getItem('seraj-coloring') || '[]');

function addToColoring(item) { /* حفظ في localStorage + toast */ }
function removeFromColoring(itemId) { /* حذف + تحديث UI */ }
function getColoringCount() { return coloringWishlist.length; }

// 3. مشاركة
function shareColoringItem(item) {
  if (navigator.share) {
    navigator.share({ title: item.title, url: item.sourceUrl });
  } else {
    navigator.clipboard.writeText(item.sourceUrl);
    showToast('تم نسخ الرابط ✓');
  }
}

// 4. حساب السعر ديناميكياً
async function calculateColoringPrice() {
  var pricing = await fetch('/api/coloring/pricing').then(r => r.json());
  var pageCount = coloringWishlist.length;
  var format = document.querySelector('input[name="format"]:checked').value;
  var pagesTotal = pageCount * pricing.pricePerPage;
  var coverTotal = format === 'book' ? pricing.coverPrice : 0;
  var total = pagesTotal + coverTotal;
  // تحديث UI...
}

// 5. إضافة طلب التلوين للسلة الرئيسية
function addColoringOrderToCart() {
  var item = {
    productSlug: 'coloring-print',
    name: format === 'book' 
      ? 'كشكول ألوان سراج (' + pageCount + ' ورقة)' 
      : 'ورق تلوين مطبوع (' + pageCount + ' ورقة)',
    price: total,
    qty: 1,
    coloringDetails: {
      items: coloringWishlist.map(i => i._id),
      itemCount: pageCount,
      format: format,
      coverImageUrl: selectedCover,
      coverTitle: document.getElementById('coverTitle').value
    }
  };
  cart.push(item);
  // → ينتقل للسلة الرئيسية → checkout عادي مع باقي المنتجات
}
```

---

#### [MODIFY] `public/styles.css`

إضافة ستايلات التلوين — متماشية مع Design System سراج:

```css
/* ===== COLORING SECTION — كشكول ألوان سراج ===== */

/* Hero */
.coloring-hero {
  background: linear-gradient(135deg, #FFF9F0 0%, #E8F5E9 100%);
  padding: 48px 24px; text-align: center; border-radius: 24px;
  margin-bottom: 32px;
}
.coloring-hero h1 { font-size: 2rem; color: var(--ink); }

/* Category Cards */
.coloring-categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 16px; padding: 0 16px;
}
.coloring-cat-card {
  background: var(--paper); border-radius: 20px;
  padding: 20px; text-align: center; cursor: pointer;
  border: 2px solid var(--line);
  transition: all 0.2s; box-shadow: 0 4px 0 var(--line);
}
.coloring-cat-card:hover { transform: translateY(-2px); border-color: var(--green); }
.coloring-cat-card .cat-icon { font-size: 2.5rem; margin-bottom: 8px; }
.coloring-cat-card .cat-name { font-weight: 700; font-size: 0.95rem; }
.coloring-cat-card .cat-count { color: var(--ink-mute); font-size: 0.8rem; }

/* Item Cards */
.coloring-items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px; padding: 0 16px;
}
.coloring-item-card {
  background: #fff; border-radius: 16px; overflow: hidden;
  border: 2px solid var(--line); transition: all 0.2s;
  position: relative;
}
.coloring-item-card:hover { border-color: var(--green); transform: translateY(-2px); }
.coloring-item-card img {
  width: 100%; aspect-ratio: 1; object-fit: cover;
  background: #f5f5f5;
}
.coloring-item-actions {
  display: flex; gap: 8px; padding: 8px;
  justify-content: space-around;
}
.coloring-item-actions button {
  flex: 1; padding: 8px; border-radius: 12px;
  border: none; cursor: pointer; font-size: 1.1rem;
  transition: all 0.15s;
}
.btn-save { background: #FFE0E0; color: #E53935; }
.btn-save.saved { background: #E53935; color: #fff; }
.btn-share { background: #E3F2FD; color: #1976D2; }
.btn-add-print { background: var(--green-light); color: var(--green-dark); }

/* Print Options */
.print-option-card {
  border: 3px solid var(--line); border-radius: 20px;
  padding: 20px; margin: 8px 0; cursor: pointer;
  transition: all 0.2s;
}
.print-option-card:has(input:checked) {
  border-color: var(--green); background: #F1F8E9;
  box-shadow: 0 4px 0 var(--green-dark);
}

/* Cover Selection Grid */
.cover-options-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
}
.cover-option {
  border: 3px solid transparent; border-radius: 16px;
  overflow: hidden; cursor: pointer; transition: all 0.2s;
}
.cover-option.selected { border-color: var(--green); }

/* Order Summary */
.coloring-order-summary {
  background: var(--paper); border-radius: 20px;
  padding: 24px; margin-top: 24px;
  border: 2px solid var(--line);
}
.summary-row { display: flex; justify-content: space-between; padding: 8px 0; }
.summary-row.total { font-weight: 800; font-size: 1.2rem; border-top: 2px dashed var(--line); }

/* Responsive */
@media (max-width: 640px) {
  .coloring-categories-grid { grid-template-columns: repeat(3, 1fr); gap: 10px; }
  .coloring-items-grid { grid-template-columns: repeat(2, 1fr); gap: 8px; }
  .coloring-hero h1 { font-size: 1.5rem; }
}
```

---

### لوحة الأدمن (Admin Dashboard)

---

#### [NEW] `src/app/admin/coloring/page.tsx`

صفحة إدارة التلوين — تشمل:

**تبويب 1: إدارة الفئات**
- جدول بكل الفئات (اسم، أيقونة، عدد عناصر، مصدر، حالة)
- إضافة/تعديل/حذف فئة
- ترتيب السحب والإفلات

**تبويب 2: إدارة العناصر**
- جدول بكل العناصر مع فلترة بالفئة والنوع
- إضافة عنصر يدوياً (رفع صورة + بيانات)
- تعديل/حذف/إخفاء عنصر
- عرض إحصائيات (عدد الحفظ، الطباعة)

**تبويب 3: التسعير**
- سعر الورقة الواحدة (قابل للتعديل = SiteContent)
- سعر الغلاف (قابل للتعديل)
- أقل/أكثر عدد أوراق
- حد الشحن المجاني
- كل التغييرات فورية بدون deploy

**تبويب 4: طلبات الطباعة**
- جدول طلبات التلوين + روابط الصور للتحميل
- حالة الطلب (جديد → جاري الطباعة → تم الشحن)

---

#### [MODIFY] `src/app/admin/layout.tsx`

إضافة رابط "التلوين 🎨" في sidebar الأدمن

---

### سكريبت سحب البيانات

---

#### [NEW] `scripts/seed-coloring.ts`

سكريبت يسحب البيانات من المصادر المتعددة مرة واحدة:

```typescript
// المرحلة 1: سحب فئات من SuperColoring (CC0/CC-BY فقط)
// المرحلة 2: سحب thumbnails + sourceUrls
// المرحلة 3: رفع thumbnails على Cloudinary (f_auto,q_auto,w_300)
// المرحلة 4: حفظ في MongoDB

// يُشغل محلياً: npx ts-node scripts/seed-coloring.ts
// لا يحتاج سيرفر — يشتغل على جهازك
```

---

## خريطة التكامل مع المشروع

```
┌─────────────────────────────────────────────────────────────┐
│                    متجر سراج — الهيكل الكامل                 │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ المنتجات │  │ المعالج  │  │ عالم ماما │  │ الأدمن   │   │
│  │ Products │  │ Wizard   │  │ Mama World│  │ Admin    │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │
│       │              │             │              │         │
│       │              │       ┌─────┴──────┐       │         │
│       │              │       │            │       │         │
│       │              │   مقالات     🎨 تلوين      │         │
│       │              │   Articles   Coloring      │         │
│       │              │              │             │         │
│       │              │         ┌────┴────┐        │         │
│       │              │         │         │        │         │
│       │              │      تصفح     كشكول        │         │
│       │              │      Browse   Cart         │         │
│       │              │         │         │        │         │
│       ▼              ▼         ▼         ▼        ▼         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              🛒 سلة التسوق الموحدة                    │   │
│  │     (منتجات عادية + طلبات طباعة تلوين معاً)           │   │
│  └────────────────────────┬────────────────────────────┘   │
│                           ▼                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              💳 Checkout الموحد (InstaPay)            │   │
│  └────────────────────────┬────────────────────────────┘   │
│                           ▼                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              📦 Order (MongoDB) — موحد               │   │
│  │     items: [{productSlug, ...}, {coloring-print}]    │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### النقطة الحاسمة: التكامل مع السلة والطلبات

- طلب التلوين **يُضاف كعنصر** في نفس السلة الموجودة
- الأم تقدر تطلب **قصة خالد + كشكول تلوين** في نفس الطلب
- **Checkout واحد** → **Order واحد** في MongoDB
- الأدمن يشوف كل شيء في نفس لوحة التحكم
- **لا نبني نظام طلبات منفصل** = أبسط وأنظف

---

## رحلة المستخدم (User Flow)

```
الأم تدخل "عالم ماما" من الصفحة الرئيسية
    ↓
تضغط "كشكول ألوان سراج 🎨"
    ↓
تتصفح الفئات (حيوانات، شخصيات، تمارين...)
    ↓
تدخل فئة "قطط" → تشوف عشرات الصور
    ↓
لكل صورة 3 أزرار:
  ❤️ حفظي (يتضاف للكشكول)
  🔗 مشاركة (share / نسخ رابط)
  📱 حمّلي من المصدر (يفتح الموقع الأصلي)
    ↓
الأم تحفظ 15 صورة مثلاً
    ↓
تروح لـ "كشكول سراج" (السلة)
    ↓
تختار: ورق مطبوع أو كشكول بغلاف
    ↓
لو كشكول → تختار غلاف + تكتب اسم الكشكول
    ↓
تشوف الملخص: 15 ورقة × ٣ ج.م = ٤٥ + ٢٠ غلاف = ٦٥ ج.م
    ↓
"أضيفي للسلة 🛒" → العنصر يروح للسلة الرئيسية
    ↓
(ممكن تضيف منتجات تانية — قصة خالد مثلاً)
    ↓
Checkout عادي → InstaPay → واتساب → النجاح 🎉
    ↓
فريق سراج: يحمل الصور → يطبع → يشحن
```

---

## Phased Execution Plan

### Phase 1: Backend Foundation (المدة: ~2 ساعة)
1. إنشاء `ColoringCategory` model
2. إنشاء `ColoringItem` model  
3. تعديل `Order.ts` لدعم `coloringDetails`
4. إضافة مفاتيح التسعير في `SiteContent`
5. إنشاء API routes (6 ملفات)

### Phase 2: Data Seeding (المدة: ~3 ساعات)
1. بناء سكريبت سحب البيانات `seed-coloring.ts`
2. سحب فئات وعناصر من SuperColoring (CC0/CC-BY فقط)
3. رفع thumbnails على Cloudinary
4. إضافة فئات KidiPage كروابط (free-link)
5. إنشاء محتوى سراج الحصري (شخصيات سراج للتلوين)

### Phase 3: Frontend — Browsing (المدة: ~3 ساعات)
1. صفحة التلوين الرئيسية (فئات)
2. صفحة الفئة (عناصر + pagination)
3. كارد العنصر (صورة + أزرار حفظ/مشاركة)
4. نظام حفظ بـ localStorage
5. Routing جديد في app.js

### Phase 4: Frontend — Cart & Ordering (المدة: ~2 ساعة)
1. صفحة كشكول سراج (محفوظات)
2. خيارات الطباعة (ورق / كشكول)
3. اختيار الغلاف
4. حساب السعر الديناميكي
5. تكامل مع السلة الرئيسية

### Phase 5: Admin Dashboard (المدة: ~2 ساعة)
1. صفحة إدارة الفئات (CRUD)
2. صفحة إدارة العناصر (CRUD + رفع صور)
3. صفحة تعديل الأسعار
4. عرض طلبات التلوين + روابط التحميل

### Phase 6: Polish & Testing (المدة: ~1 ساعة)
1. اختبار الـ flow كامل على الموبايل
2. اختبار التكامل مع السلة والـ checkout
3. تحسين الأداء (lazy loading، skeleton)
4. توثيق الأسعار والإعدادات

**الإجمالي: ~5-7 أيام عمل**

---

## Verification Plan

### Automated Tests
```bash
# TypeScript compilation
npx tsc --noEmit

# Build
npm run build

# Seed coloring data
npx ts-node scripts/seed-coloring.ts

# API tests
npm run test
```

### Manual Verification
| # | Test | Expected |
|---|------|----------|
| 1 | تصفح فئات التلوين | عرض كل الفئات بأيقونات + عدد عناصر |
| 2 | دخول فئة | عرض صور مصغرة + أزرار حفظ/مشاركة |
| 3 | حفظ عنصر | يتضاف للكشكول + toast + عداد يتحدث |
| 4 | مشاركة عنصر | Share API أو نسخ رابط |
| 5 | صفحة الكشكول | عرض المحفوظات + خيارات الطباعة |
| 6 | اختيار كشكول بغلاف | يظهر UI الغلاف + السعر يتحدث |
| 7 | إضافة للسلة | العنصر يظهر في السلة الرئيسية |
| 8 | Checkout مع تلوين + منتج عادي | طلب واحد بكل العناصر |
| 9 | أدمن: تعديل سعر الورقة | السعر يتحدث فوراً في الواجهة |
| 10 | أدمن: إضافة فئة جديدة | تظهر في التصفح |
| 11 | موبايل (375px) | كل شيء responsive وسهل اللمس |
| 12 | كشكول فارغ | رسالة ودية + رابط للتصفح |
