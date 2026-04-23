import { connectDB } from "../src/lib/db";
import Product from "../src/lib/models/Product";

// Product data with section/series for multi-category store
const PRODUCTS = [
  {
    slug: "story-khaled",
    name: "قصة خالد بن الوليد",
    badge: "الأكثر طلباً",
    badgeSoon: false,
    price: 140,
    priceText: "١٤٠ ج.م",
    category: "قصص جاهزة",
    section: "tales",
    series: "سباق الفتوحات",
    longDesc:
      "تابع بطلنا في مغامرة ملهمة مع القائد خالد بن الوليد — القائد اللي ما خسرش معركة في حياته. القصة بتعلّم إن الشجاعة الحقيقية مش في القوة بس، لكن في الثبات والمرونة والجرأة إنه يعمل الصح حتى لو كان صعب.",
    features: [
      "٢٤ صفحة ملوّنة بجودة عالية",
      "غلاف مقوّى مقاوم",
      "رسوم أصلية بإيد فنانين مصريين",
      "بتعلّم قيمة الشجاعة والإقدام",
      "مناسبة من ٤ لـ ٩ سنين",
    ],
    media: {
      type: "book3d",
      image: "assets/khaled-v2.png",
      title: "خالد بن<br/>الوليد",
      bg: "emerald",
    },
    action: "cart",
    ctaText: "أضيف للسلة",
    comingSoon: false,
    reviews: [
      {
        text: "ابني قعد يقرأ القصة مرتين في نفس اليوم! بقى بيقول \"أنا شجاع زي خالد\".",
        name: "منى — أم يوسف",
        place: "القاهرة · ٦ سنين",
        color: "#6bbf3f",
        initial: "م",
      },
      {
        text: "الرسومات تحفة والقصة مكتوبة بلغة بسيطة مفهومة. بنقرأها مع بعض كل يوم.",
        name: "سارة — أم عمر",
        place: "المنصورة · ٥ سنين",
        color: "#c9974e",
        initial: "س",
      },
    ],
    related: ["hero-conqueror", "custom-story", "bundle"],
    active: true,
    order: 1,
  },
  {
    slug: "hero-conqueror",
    name: "بطل قهر المستحيل",
    badge: "جديد",
    badgeSoon: false,
    price: 140,
    priceText: "١٤٠ ج.م",
    category: "قصص جاهزة",
    section: "tales",
    series: "سباق الفتوحات",
    longDesc:
      "مغامرة ملحمية من سلسلة سباق الفتوحات — قصة بطلنا اللي واجه المستحيل وقدره. رسوم أصلية بإيد فنانين مصريين بتعلّم الأطفال معاني الثبات والإرادة.",
    features: [
      "٢٤ صفحة ملوّنة بجودة عالية",
      "غلاف مقوّى مقاوم",
      "رسوم أصلية بإيد فنانين مصريين",
      "بتعلّم قيمة الإرادة والثبات",
      "مناسبة من ٤ لـ ٩ سنين",
    ],
    media: {
      type: "book3d",
      image: "assets/seraj.png",
      title: "بطل قهر<br/>المستحيل",
      bg: "emerald",
    },
    action: "cart",
    ctaText: "أضيف للسلة",
    comingSoon: false,
    reviews: [
      {
        text: "القصة الجديدة من السلسلة تحفة! ابني مستني كل قصة جديدة.",
        name: "هدى — أم ياسين",
        place: "الإسكندرية · ٥ سنين",
        color: "#36a39a",
        initial: "ه",
      },
    ],
    related: ["story-khaled", "custom-story", "bundle"],
    active: true,
    order: 2,
  },
  {
    slug: "custom-story",
    name: "القصة المخصصة",
    badge: "مخصصة باسم بطلنا",
    badgeSoon: false,
    price: 220,
    priceText: "٢٢٠ ج.م",
    category: "قصص مخصصة",
    section: "custom-stories",
    longDesc:
      "قصة مغامرة كاملة باسم بطلك وبتعلّم قيمة من اختيارك. سراج بيكتب القصة مخصوص ليه وبيرسمها بإيد فنانين مصريين. غلاف مقوّى وورق سميك يستحمل كل مرات القراية.",
    features: [
      "٢٤ صفحة ملوّنة باسم طفلك",
      "غلاف مقوّى مقاوم",
      "رسوم أصلية بإيد فنانين مصريين",
      "باسم طفلك على الغلاف والصفحات",
      "اختار القيمة اللي عايزه يتعلمها",
    ],
    media: {
      type: "book3d",
      image: "assets/seraj.png",
      title: "حكاية<br/>بطلنا",
      bg: "emerald",
    },
    action: "wizard",
    ctaText: "ابدأ القصة",
    comingSoon: false,
    reviews: [
      {
        text: "ابني لسه مش مصدق إن فيه قصة باسمه! قعد يقراها مع بابا لحد ما نام.",
        name: "منى — أم أحمد",
        place: "القاهرة · ٦ سنين",
        color: "#6bbf3f",
        initial: "م",
      },
      {
        text: "أحلى حاجة إن القصة بتعلّم قيمة.. بنتي بقت بتقول \"أنا شجاعة زي خالد\".",
        name: "نور — أم ليلى",
        place: "الإسكندرية · ٥ سنين",
        color: "#e85d4c",
        initial: "ن",
      },
      {
        text: "الطباعة تحفة، الغلاف مقوّى والورق سميك.. تستاهل كل قرش وزيادة.",
        name: "سارة — أم زين",
        place: "المنصورة · ٤ سنين",
        color: "#c9974e",
        initial: "س",
      },
    ],
    related: ["story-khaled", "bundle"],
    active: true,
    order: 3,
  },
  {
    slug: "flash-cards",
    name: "كروت الروتين اليومي",
    badge: "قريباً",
    badgeSoon: true,
    price: 150,
    priceText: "١٥٠ ج.م",
    category: "فلاش كاردز",
    section: "play-learn",
    longDesc:
      "٣٠ كارت مصوّر بتصميم ملوّن وجذاب، بتساعد طفلك ينظم يومه ويتعلم عادات صحية بشكل ممتع. كل كارت فيه رسمة واضحة لنشاط من أنشطة اليوم.",
    features: [
      "٣٠ كارت مصوّر ملوّن",
      "بتغطي كل أنشطة اليوم",
      "تصميم جذاب ومحبب للأطفال",
      "بتعلّم المسؤولية والتنظيم",
      "مناسبة من ٣ لـ ٧ سنين",
    ],
    media: { type: "cards-fan", bg: "sand" },
    action: "none",
    ctaText: "قريباً",
    comingSoon: true,
    reviews: [
      {
        text: "الكروت غيّرت روتين بنتي بالكامل! بقت هي اللي بتذكرني بأوقات الصلاة والأكل.",
        name: "هدى — أم مريم",
        place: "الإسكندرية · ٤ سنين",
        color: "#36a39a",
        initial: "ه",
      },
      {
        text: "أحلى استثمار لفلوسي. بنتي بقت بتظبط يومها لوحدها من غير ما أزعّلها.",
        name: "ريم — أم آدم",
        place: "الجيزة · ٥ سنين",
        color: "#6bbf3f",
        initial: "ر",
      },
    ],
    related: ["story-khaled", "bundle"],
    active: true,
    order: 4,
  },
  {
    slug: "bundle",
    name: "مجموعة الأبطال الصغار",
    badge: "وفّر ٢٠٪",
    badgeSoon: false,
    price: 420,
    originalPrice: 530,
    priceText: "٤٢٠ ج.م",
    originalPriceText: "٥٣٠ ج.م",
    category: "مجموعات",
    // No section — bundles appear as cross-sell
    longDesc:
      "المجموعة الكاملة لبطلنا! قصة مخصصة باسمه + كروت روتين يومي + قصة من سلسلة سباق الفتوحات. وفّر ٢٠٪ لما تطلبهم مع بعض!",
    features: [
      "قصة مخصصة باسم طفلك (٢٤ صفحة)",
      "كروت الروتين اليومي (٣٠ كارت)",
      "قصة من سلسلة سباق الفتوحات",
      "غلاف مقوّى لكل المنتجات",
      "بتوفّر ١١٠ جنيه!",
    ],
    media: { type: "bundle-stack", bg: "teal" },
    action: "cart",
    ctaText: "أضيف للسلة",
    comingSoon: false,
    reviews: [
      {
        text: "طلبت المجموعة الكاملة وأولادي ماخلصوش منها لحد دلوقتي! كل قرش يستاهل.",
        name: "أمينة — أم توأم",
        place: "القاهرة · ٥ سنين",
        color: "#c9974e",
        initial: "أ",
      },
      {
        text: "أحلى هدية لأحفادي! الجودة ممتازة والمحتوى تعليمي وممتع في نفس الوقت.",
        name: "فاطمة — جدة",
        place: "المنصورة · ٤ و ٦ سنين",
        color: "#6bbf3f",
        initial: "ف",
      },
    ],
    related: ["story-khaled", "custom-story"],
    active: true,
    order: 5,
  },
];

async function seed() {
  console.log("🌱 Connecting to MongoDB...");
  await connectDB();

  console.log("🗑️  Clearing existing products...");
  await Product.deleteMany({});

  console.log(`📦 Seeding ${PRODUCTS.length} products...`);
  const result = await Product.insertMany(PRODUCTS);
  console.log(
    `✅ Seeded ${result.length} products:`,
    result.map((p) => p.slug)
  );

  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
