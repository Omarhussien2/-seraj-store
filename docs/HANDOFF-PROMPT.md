# 🔧 سراج — مهام تحسينات متبقية (Handoff Prompt)

## السياق
أنت تكمل تحسينات متجر سِراج. المشروع شغال 100% على Vercel + MongoDB Atlas.
- **Repo:** https://github.com/Omarhussien2/-seraj-store
- **Tech:** Next.js 16 (App Router) + static SPA frontend (public/) + MongoDB Atlas
- **الوصول:** `.env.local` فيه كل البيانات (MongoDB, Cloudinary, WhatsApp, InstaPay, Admin)

## ما تم إنجازه ✅
1. Frontend كامل (10 صفحات + hash routing + SPA)
2. Backend API كامل (products, orders, upload, stats, auth)
3. لوحة تحكم admin كاملة (dashboard, orders, products, stories)
4. MongoDB Atlas متصل + 4 منتجات seeded
5. سلة مشتريات + localStorage persistence + checkout form
6. إرسال طلبات للـ API + WhatsApp dynamic link
7. InstaPay QR حقيقي + رابط دفع
8. API routes محمية بـ auth (requireAdmin)
9. فيديوهات مضغوطة 98% (30.7MB → 0.7MB)
10. Git LFS + GitHub + Vercel جاهز

---

## المهام المتبقية (مرتبة بالأولوية)

### 🔴 مهم — وظائف ناقصة

#### 1. رفع صورة الطفل في wizard (خطوة 3)
**الملف:** `public/app.js` (function `setupWizard`)
**المشكلة:** الـ UI موجود (file input + dropzone) بس مفيش upload logic فعلي.
**المطلوب:**
```javascript
// في wizard step 3، عند اختيار صورة:
// 1. اقرأ الملف من #photoInput
// 2. اعرض preview للصورة في الـ dropzone
// 3. خزّن الملف في state.photoFile
// 4. عند الانتقال لخطوة 4 (runGenerator):
//    - ارفع الصورة لـ POST /api/upload (بس لو المستخدم admin — أو اجعل الـ upload route عام للزبون)
//    - خزّن الـ URL في state.photoUrl
//    - include photoUrl في saveWizardData()
```
**ملاحظة:** `/api/upload` حالياً محمي بـ auth. لازم إما:
- (أ) تعمل route عام `/api/upload-child-photo` خاص برفع صور الأطفال، أو
- (ب) تزيل الحماية عن `/api/upload` وتضيف rate limiting
- **الأفضل:** خيار (أ) — route منفصل بـ validation أقوى

#### 2. inject WhatsApp + InstaPay من env vars بدل hardcoded
**الملفات:** `public/app.js`, `src/app/page.tsx`
**المشكلة:** `WHATSAPP_NUMBER` و InstaPay info hardcoded في app.js — لو اتغيروا لازم نعدل الكود.
**الحل:** 
- أنشئ `/api/config` route عام يرجع `NEXT_PUBLIC_WHATSAPP_NUMBER` و `NEXT_PUBLIC_INSTAPAY_*`
- أو: أنشئ `public/config.js` يتم توليده من env vars عند الـ build
- app.js يقرأ من `window.SERAJ_CONFIG` أو من الـ API

### 🟡 متوسط — تحسينات

#### 3. تنظيف ملفات مكررة
- احذف `public/assets/assets/` (نسخة مكررة من كل الصور والفيديوهات)
- احذف `demo/` folder نهائياً (نسخة قديمة standalone)
- احذف `charachters images/` folder (فيديوهات مكررة في أماكن تانية)

#### 4. تحسين metadata في layout
**الملف:** `src/app/layout.tsx`
- غيّر title من "Create Next App" لـ "سِراج — متعة القراءة واللعب"
- غيّر description لوصف حقيقي
- أضف Open Graph image
- غيّر الـ fonts لـ Tajawal/Baloo Bhaijaan (عربي)

#### 5. فيديوهات منتجات مستقبلية (GIF أو MP4 صغير)
**الملف:** `public/app.js` (renderProductDetail)
- قسم "فيديو المنتج" موجود كـ placeholder
- مستقبلاً: أضف حقل `videoUrl` في Product model
- ممكن تحويل فيديوهات قصيرة لـ GIF (animiated, tiny)
- أو MP4 صغير (مثل الفيديوهات المضغوطة: 100-300KB)

#### 6. 404 page للمتجر
- لو المستخدم دخل URL غلط (مثلاً `#/product/xyz`)
- أضف صفحة 404 داخل الـ SPA

#### 7. Error boundary للـ admin panel
- أضف `error.tsx` في `src/app/admin/`

### 🟢 تحسينات أداء

#### 8. Lazy loading للصور
- أضف `loading="lazy"` لكل `<img>` في index.html
- أو استخدم IntersectionObserver في app.js

#### 9. Service Worker (PWA)
- أضف service worker للتخزين المؤقت (offline support)
- manifest.json for PWA install

#### 10. CSS splitting
- `public/styles.css` = 2500+ سطر ملف واحد
- ممكن تقسيمه: `home.css`, `product.css`, `checkout.css`, `admin.css`
- أو: استخدم CSS minification في الـ build

---

## ملفات مهمة للمرجع
- `public/app.js` — الـ SPA router + كل الـ logic (~1090 سطر)
- `public/index.html` — كل الـ HTML sections (~1081 سطر)
- `public/styles.css` — كل التصميم (~2500 سطر)
- `src/lib/requireAdmin.ts` — auth helper للـ API routes
- `src/lib/auth.ts` — NextAuth v5 config
- `src/lib/models/Product.ts` — Product schema
- `src/lib/models/Order.ts` — Order schema (مع customStory sub-schema)
- `src/app/api/` — كل الـ API routes
- `src/app/admin/` — لوحة التحكم (React + shadcn/ui)
- `.env.local` — كل البيانات الحقيقية (محلي فقط)

## Credentials (.env.local)
```
MONGODB_URI=mongodb+srv://seraj:7msvPkMQe4XlN1MM@cluster0.5n23wnz.mongodb.net/seraj?retryWrites=true&w=majority&appName=Cluster0
CLOUDINARY_CLOUD_NAME=dkhndsrhr
CLOUDINARY_API_KEY=536322588485367
CLOUDINARY_API_SECRET=aKHAVgIk5wOFrRMwLg2pkD4o-tY
NEXT_PUBLIC_WHATSAPP_NUMBER=201152806034
NEXT_PUBLIC_INSTAPAY_NUMBER=omarhussien22
NEXT_PUBLIC_INSTAPAY_LINK=https://ipn.eg/S/omarhussien22/instapay/72tQbs
ADMIN_EMAIL=hussien.impression@gmail.com
ADMIN_PASSWORD=Zxcv@2090
NEXTAUTH_SECRET=seraj-secret-2026-change-in-production
```

## قواعد مهمة
- **لا تغيّر تصميم الموقع** — نفس CSS, نفس layout
- **لا تكسر hash routing** أو أي functionality موجودة
- **اقرأ app.js كامل** قبل أي تعديل
- **اختبر كل حاجة:** products من API + سلة persistent + طلب يتحفظ في DB + فيديوهات بتشتغل
- **كل task في commit منفصل** مع message واضح
