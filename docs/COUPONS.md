# نظام أكواد الخصم (Coupons)

هذا المستند يشرح واجهات الـ API والمنطق الذي تم إضافته لدعم أكواد خصم:
- خصم الشحن
- خصم إجمالي المنتجات (Subtotal)
- خصم على منتجات محددة (بالـ `productSlug`)

## 1) إنشاء/إدارة الكوبونات (Admin)

> كل مسارات الإدارة تتطلب تسجيل دخول Admin (حسب `requireAdmin`).

### GET `/api/coupons`
يعيد قائمة بالكوبونات (يدعم `page`, `limit`, `q`, `active`).

### POST `/api/coupons`
إنشاء كوبون جديد.

مثال Body:
```json
{
  "code": "SHIP50",
  "active": true,
  "title": "خصم شحن",
  "validFrom": "2026-05-01",
  "validTo": "2026-06-01",
  "discounts": [
    { "scope": "shipping", "type": "percent", "value": 50, "maxDiscount": 40 }
  ],
  "limits": { "maxRedemptionsTotal": 200, "maxRedemptionsPerCustomerPhone": 1, "minSubtotal": 200 }
}
```

### PATCH `/api/coupons/:id`
تعديل كوبون.

### DELETE `/api/coupons/:id`
حذف كوبون.

## 2) التحقق/التسعير (Public)

### POST `/api/coupons/validate`
يحسب الخصم للسلة على السيرفر (لا يثق في الأسعار المرسلة من العميل، ما عدا عناصر التسعير الديناميكي مثل `coloring-workbook`).

مثال Body:
```json
{
  "code": "SHIP50",
  "shippingFee": 60,
  "customerPhone": "01012345678",
  "items": [
    { "productSlug": "story-1", "qty": 1 },
    { "productSlug": "coloring-workbook", "qty": 1, "price": 150 }
  ]
}
```

## 3) ربط الكوبون بالطلب

### POST `/api/orders`
أُضيف حقل اختياري: `couponCode`.

السيرفر يحسب:
- `subtotal` من أسعار قاعدة البيانات
- يطبق الكوبون إن وُجد
- يحفظ في الـ Order: `coupon`, `discountTotal`, `discounts`
- ويُسجل استخدام الكوبون في `CouponRedemption` لمنع تجاوز حدود الاستخدام

## 4) ملاحظات تنفيذية للـ Agents القادمة

### تحديات تم حلها
- **عدم الثقة في أسعار العميل:** إنشاء الطلب والتحقق من الكوبون يعيدان حساب أسعار المنتجات من MongoDB، مع استثناء واضح لعناصر التسعير الديناميكي مثل `coloring-workbook`.
- **حدود استخدام الكوبون:** تم فصل `CouponRedemption` عن `Coupon` حتى يمكن تتبع الاستخدام لكل طلب ولكل رقم هاتف.
- **الضغط والتزامن:** يتم حجز استخدام الكوبون قبل إنشاء الطلب مع rollback إذا فشل حفظ الطلب، حتى لا يزيد `redeemedCount` بسبب طلب لم يكتمل.
- **الخصومات المركبة:** عند وجود خصم على السلة وخصم منتجات، لا يمكن لخصم المنتجات تجاوز الجزء المتبقي من قيمة المنتجات.
- **تجربة العميل:** صفحة checkout تطلب التحقق من الكوبون من السيرفر قبل التأكيد، وتعيد حساب الإجمالي المعروض بعد الخصم.
- **تجربة الأدمن:** تمت إضافة `/admin/coupons` لإدارة الكوبونات بدون الحاجة لتعديل قاعدة البيانات يدويًا.

### نقاط يجب الانتباه لها
- لا تعتمد على `total` المرسل من المتصفح كمصدر حقيقة. السيرفر هو مصدر التسعير النهائي.
- لا تستخدم `git add -A` في هذا المشروع بدون مراجعة، لأن الـ worktree قد يحتوي ملفات جلسات أو مذكرات غير مرتبطة.
- `npm run lint` على كامل المشروع يفشل بسبب مشاكل قديمة خارج نطاق الكوبونات. استخدم فحوصات مركزة عند تعديل جزء محدد، ثم شغل `npm run build`.
- واجهات public الحالية مبنية في `public/app.js` و `public/styles.css` وليست React components، لذلك أي تحسين checkout يجب أن يراعي هذا النمط أو يخطط لهجرة مستقلة.

### فحوصات استخدمت بعد الإضافة
- `npx tsc --noEmit --pretty false`
- `node --check public/app.js`
- `npm run build`
- فحص API يدوي لـ `/api/coupons/validate` مع كوبون غير موجود.
- فحص Playwright سريع لتأكد ظهور حقل الكوبون في checkout على شاشة موبايل.
