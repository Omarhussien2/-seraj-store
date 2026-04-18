#!/usr/bin/env node
/**
 * سِراج — Seed Products to MongoDB
 * 
 * Seeds all frontend fallback products into the database so they
 * are fully managed via the admin panel.
 *
 * Usage:  node scripts/seed-products.js
 * 
 * Requires: MONGODB_URI in .env.local
 */

require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found. Check .env.local');
  process.exit(1);
}

// ── Product Schema (mirrors src/lib/models/Product.ts) ──
const ReviewSchema = new mongoose.Schema(
  { text: String, name: String, place: String, color: String, initial: String },
  { _id: false }
);

const MediaSchema = new mongoose.Schema(
  {
    type: { type: String, required: true, enum: ['book3d', 'cards-fan', 'bundle-stack'] },
    image: String,
    title: String,
    bg: { type: String, required: true, enum: ['emerald', 'sand', 'teal'] },
  },
  { _id: false }
);

const GalleryItemSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: String,
    resourceType: { type: String, required: true, enum: ['image', 'video'], default: 'image' },
    alt: { type: String, default: '' },
    sortOrder: { type: Number, default: 0 },
  },
  { _id: true }
);

const ProductSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    badge: { type: String, required: true },
    badgeSoon: { type: Boolean, default: false },
    price: { type: Number, required: true },
    originalPrice: Number,
    priceText: { type: String, required: true },
    originalPriceText: String,
    category: {
      type: String,
      required: true,
      enum: ['قصص جاهزة', 'قصص مخصصة', 'فلاش كاردز', 'مجموعات'],
    },
    section: {
      type: String,
      enum: ['tales', 'seraj-stories', 'custom-stories', 'play-learn'],
      index: true,
    },
    series: String,
    shortDesc: { type: String, default: '' },
    longDesc: { type: String, required: true },
    features: [String],
    imageUrl: String,
    media: { type: MediaSchema, required: true },
    gallery: { type: [GalleryItemSchema], default: [] },
    action: { type: String, required: true, enum: ['cart', 'wizard', 'none'] },
    ctaText: { type: String, required: true },
    comingSoon: { type: Boolean, default: false },
    reviews: [ReviewSchema],
    related: [String],
    active: { type: Boolean, default: true, index: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

// ── Product Data (matches app.js PRODUCTS) ──────────────
const PRODUCTS = [
  {
    slug: 'story-khaled',
    name: 'قصة خالد بن الوليد',
    badge: 'الأكثر طلباً',
    price: 140,
    priceText: '١٤٠ ج.م',
    category: 'قصص جاهزة',
    section: 'tales',
    series: 'سباق الفتوحات',
    shortDesc: 'قصة بطولة وشجاعة بأسلوب تعليمي ممتع',
    longDesc: 'تابع بطلنا في مغامرة ملهمة مع القائد خالد بن الوليد — القائد اللي ما خسرش معركة في حياته. القصة بتعلّم إن الشجاعة الحقيقية مش في القوة بس، لكن في الثبات والمرونة والجرأة إنه يعمل الصح حتى لو كان صعب.',
    features: ['٢٤ صفحة ملوّنة بجودة عالية', 'غلاف مقوّى مقاوم', 'رسوم أصلية بإيد فنانين مصريين', 'بتعلّم قيمة الشجاعة والإقدام', 'مناسبة من ٤ لـ ٩ سنين'],
    media: { type: 'book3d', image: 'assets/khaled-v2.png', title: 'خالد بن الوليد', bg: 'emerald' },
    action: 'cart',
    ctaText: 'أضيفي للسلة',
    comingSoon: false,
    reviews: [
      { text: 'ابني قعد يقرأ القصة مرتين في نفس اليوم! بقى بيقول "أنا شجاع زي خالد".', name: 'منى — أم يوسف', place: 'القاهرة · ٦ سنين', color: '#6bbf3f', initial: 'م' },
      { text: 'الرسومات تحفة والقصة مكتوبة بلغة بسيطة مفهومة. بنقرأها مع بعض كل يوم.', name: 'سارة — أم عمر', place: 'المنصورة · ٥ سنين', color: '#c9974e', initial: 'س' },
    ],
    related: ['hero-conqueror', 'custom-story', 'bundle'],
    active: true,
    order: 1,
  },
  {
    slug: 'hero-conqueror',
    name: 'بطل قهر المستحيل',
    badge: 'جديد',
    price: 140,
    priceText: '١٤٠ ج.م',
    category: 'قصص جاهزة',
    section: 'tales',
    series: 'سباق الفتوحات',
    shortDesc: 'مغامرة ملحمية من سلسلة سباق الفتوحات',
    longDesc: 'مغامرة ملحمية من سلسلة سباق الفتوحات — قصة بطلنا اللي واجه المستحيل وقدره. رسوم أصلية بإيد فنانين مصريين بتعلّم الأطفال معاني الثبات والإرادة.',
    features: ['٢٤ صفحة ملوّنة بجودة عالية', 'غلاف مقوّى مقاوم', 'رسوم أصلية بإيد فنانين مصريين', 'بتعلّم قيمة الإرادة والثبات', 'مناسبة من ٤ لـ ٩ سنين'],
    media: { type: 'book3d', image: 'assets/seraj.png', title: 'بطل قهر المستحيل', bg: 'emerald' },
    action: 'cart',
    ctaText: 'أضيفي للسلة',
    comingSoon: false,
    reviews: [
      { text: 'القصة الجديدة من السلسلة تحفة! ابني مستني كل قصة جديدة.', name: 'هدى — أم ياسين', place: 'الإسكندرية · ٥ سنين', color: '#36a39a', initial: 'ه' },
    ],
    related: ['story-khaled', 'custom-story', 'bundle'],
    active: true,
    order: 2,
  },
  {
    slug: 'custom-story',
    name: 'القصة المخصصة',
    badge: 'مخصصة باسم بطلنا',
    price: 220,
    priceText: '٢٢٠ ج.م',
    category: 'قصص مخصصة',
    section: 'custom-stories',
    shortDesc: 'قصة كاملة باسم طفلك وصورته',
    longDesc: 'قصة مغامرة كاملة باسم بطلك وبتعلّم قيمة من اختيارك. سراج بيكتب القصة مخصوص ليه وبيرسمها بإيد فنانين مصريين. غلاف مقوّى وورق سميك يستحمل كل مرات القراية.',
    features: ['٢٤ صفحة ملوّنة باسم طفلك', 'غلاف مقوّى مقاوم', 'رسوم أصلية بإيد فنانين مصريين', 'باسم طفلك على الغلاف والصفحات', 'اختاري القيمة اللي عايزاه يتعلمها'],
    media: { type: 'book3d', image: 'assets/seraj.png', title: 'حكاية بطلنا', bg: 'emerald' },
    action: 'wizard',
    ctaText: 'ابدئي القصة',
    comingSoon: false,
    reviews: [
      { text: 'ابني لسه مش مصدق إن فيه قصة باسمه! قعد يقراها مع بابا لحد ما نام.', name: 'منى — أم أحمد', place: 'القاهرة · ٦ سنين', color: '#6bbf3f', initial: 'م' },
      { text: 'أحلى حاجة إن القصة بتعلّم قيمة.. بنتي بقت بتقول "أنا شجاعة زي خالد".', name: 'نور — أم ليلى', place: 'الإسكندرية · ٥ سنين', color: '#e85d4c', initial: 'ن' },
      { text: 'الطباعة تحفة، الغلاف مقوّى والورق سميك.. تستاهل كل قرش وزيادة.', name: 'سارة — أم زين', place: 'المنصورة · ٤ سنين', color: '#c9974e', initial: 'س' },
    ],
    related: ['story-khaled', 'bundle'],
    active: true,
    order: 3,
  },
  {
    slug: 'flash-cards',
    name: 'كروت الروتين اليومي',
    badge: 'قريباً',
    badgeSoon: true,
    price: 150,
    priceText: '١٥٠ ج.م',
    category: 'فلاش كاردز',
    section: 'play-learn',
    shortDesc: '٣٠ كارت مصوّر بتساعد بطلنا ينظم يومه',
    longDesc: '٣٠ كارت مصوّر بتصميم ملوّن وجذاب، بتساعد طفلك ينظم يومه ويتعلم عادات صحية بشكل ممتع. كل كارت فيه رسمة واضحة لنشاط من أنشطة اليوم.',
    features: ['٣٠ كارت مصوّر ملوّن', 'بتغطي كل أنشطة اليوم', 'تصميم جذاب ومحبب للأطفال', 'بتعلّم المسؤولية والتنظيم', 'مناسبة من ٣ لـ ٧ سنين'],
    media: { type: 'cards-fan', bg: 'sand' },
    action: 'none',
    ctaText: 'قريباً',
    comingSoon: true,
    reviews: [
      { text: 'الكروت غيّرت روتين بنتي بالكامل! بقت هي اللي بتذكرني بأوقات الصلاة والأكل.', name: 'هدى — أم مريم', place: 'الإسكندرية · ٤ سنين', color: '#36a39a', initial: 'ه' },
      { text: 'أحلى استثمار لفلوسي. بنتي بقت بتظبط يومها لوحدها من غير ما أزعّلها.', name: 'ريم — أم آدم', place: 'الجيزة · ٥ سنين', color: '#6bbf3f', initial: 'ر' },
    ],
    related: ['story-khaled', 'bundle'],
    active: true,
    order: 4,
  },
  {
    slug: 'bundle',
    name: 'مجموعة الأبطال الصغار',
    badge: 'وفّري ٢٠٪',
    price: 420,
    originalPrice: 530,
    priceText: '٤٢٠ ج.م',
    originalPriceText: '٥٣٠ ج.م',
    category: 'مجموعات',
    // section is intentionally null — bundles appear only in "all" view
    shortDesc: 'قصة مخصصة + كروت + قصة من السلسلة',
    longDesc: 'المجموعة الكاملة لبطلنا! قصة مخصصة باسمه + كروت روتين يومي + قصة من سلسلة سباق الفتوحات. وفّري ٢٠٪ لما تطلبيهم مع بعض!',
    features: ['قصة مخصصة باسم طفلك (٢٤ صفحة)', 'كروت الروتين اليومي (٣٠ كارت)', 'قصة من سلسلة سباق الفتوحات', 'غلاف مقوّى لكل المنتجات', 'بتوفّري ١١٠ جنيه!'],
    media: { type: 'bundle-stack', bg: 'teal' },
    action: 'cart',
    ctaText: 'أضيفي للسلة',
    comingSoon: false,
    reviews: [
      { text: 'طلبت المجموعة الكاملة وأولادي ماخلصوش منها لحد دلوقتي! كل قرش يستاهل.', name: 'أمينة — أم توأم', place: 'القاهرة · ٥ سنين', color: '#c9974e', initial: 'أ' },
      { text: 'أحلى هدية لأحفادي! الجودة ممتازة والمحتوى تعليمي وممتع في نفس الوقت.', name: 'فاطمة — جدة', place: 'المنصورة · ٤ و ٦ سنين', color: '#6bbf3f', initial: 'ف' },
    ],
    related: ['story-khaled', 'custom-story'],
    active: true,
    order: 5,
  },
];

// ── Seed Logic ──────────────────────────────────────────
async function seed() {
  console.log('🔌 Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI, {
    maxPoolSize: 5,
    serverSelectionTimeoutMS: 10000,
  });
  console.log('✅ Connected to:', mongoose.connection.host);

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const productData of PRODUCTS) {
    const existing = await Product.findOne({ slug: productData.slug });

    if (existing) {
      // Update existing product to ensure fields are current
      await Product.updateOne(
        { slug: productData.slug },
        { $set: productData },
        { runValidators: true }
      );
      console.log(`   🔄 Updated: ${productData.slug}`);
      updated++;
    } else {
      await Product.create(productData);
      console.log(`   ✅ Created: ${productData.slug}`);
      created++;
    }
  }

  console.log(`\n📊 Seed Summary: ${created} created, ${updated} updated, ${skipped} skipped`);
  console.log('   Total products in DB:', await Product.countDocuments());

  await mongoose.disconnect();
  console.log('🔌 Disconnected from MongoDB');
}

seed()
  .then(() => {
    console.log('\n✅ Seed completed successfully!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ Seed failed:', err);
    process.exit(1);
  });
