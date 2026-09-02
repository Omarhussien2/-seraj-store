import { connectDB } from "../src/lib/db";
import Product from "../src/lib/models/Product";

// Product data with section/series for multi-category store
const PRODUCTS = [
  {
    slug: "story-khaled",
    name: "سيف الله المسلول | خالد بن الوليد – قصة البطل الذي قهر المستحيل",
    badge: "إصدار سراج",
    badgeSoon: false,
    price: 140,
    originalPrice: 185,
    priceText: "140 ج.م",
    originalPriceText: "185 ج.م",
    category: "قصص جاهزة",
    section: "tales",
    series: "سباق الفتوحات",
    shortDesc: "قصة بطولة وشجاعة بأسلوب تعليمي ممتع من سن 2 الى 12 سنة",
    longDesc:
      "رحلة ملهمة مع أحد أعظم قادة الإسلام، يتعرف فيها الطفل على عبقرية وشجاعة خالد بن الوليد رضي الله عنه، وكيف استطاع بحسن التخطيط والتوكل على الله أن يقود جيشه عبر طريق ظنه الجميع مستحيلاً، لينقذ المسلمين ويحقق النصر. تقدم القصة أحداثًا حقيقية من التاريخ الإسلامي بأسلوب عربي بسيط ومشوق يناسب الأطفال، مع رسومات جذابة تساعد على ترسيخ المعاني والقيم، وتغرس في الطفل أن البطولة ليست بالقوة وحدها، بل بالحكمة، والتخطيط، والثقة بالله، وعدم الاستسلام أمام الصعوبات.",
    features: [
      "هدية تعليمية رائعة للأطفال في المنزل والمدرسة وحلقات التحفيظ.",
      "قصة مستوحاة من أحداث حقيقية في التاريخ الإسلامي.",
      "تعرف الأطفال بسيرة خالد بن الوليد رضي الله عنه الملقب بسيف الله المسلول.",
      "مناسبة لكل أفراد الأسرة.",
      "تغرس قيم الشجاعة، الذكاء، التخطيط، والتوكل على الله.",
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
    reviews: [],
    related: ["hero-conqueror", "custom-story", "bundle"],
    active: true,
    order: 1,
  },
  {
    slug: "hero-conqueror",
    name: "فاتح خيبر | قصة علي بن أبي طالب رضي الله عنه",
    badge: "إصدار سراج",
    badgeSoon: false,
    price: 140,
    priceText: "140 ج.م",
    category: "قصص جاهزة",
    section: "tales",
    series: "سباق الفتوحات",
    shortDesc: "مغامرة ملحمية من سلسلة سباق الفتوحات (6–9 سنوات)",
    longDesc:
      "اصطحب طفلك في رحلة شيقة إلى أحداث فتح خيبر، ليتعرف على واحدة من أعظم قصص الشجاعة والثبات في التاريخ الإسلامي. تروي هذه القصة بأسلوب بسيط ومشوق كيف اختار النبي ﷺ علي بن أبي طالب رضي الله عنه لحمل الراية، وكيف واجه التحديات بقلبٍ مؤمن وشجاعةٍ عظيمة حتى فتح الله على يديه.",
    features: [
      "قصة إسلامية مستوحاة من أحداث السيرة النبوية.",
      "رسومات ملونة عالية الجودة تجذب انتباه الطفل.",
      "تغرس قيم الشجاعة، والثقة بالله، والثبات على الحق.",
      "معلومات مبسطة من السيرة في نهاية القصة.",
      "لغة عربية سهلة وواضحة تناسب الأطفال.",
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
    reviews: [],
    related: ["story-khaled", "custom-story", "bundle"],
    active: true,
    order: 2,
  },
  {
    slug: "custom-story",
    name: "قصة مخصصة بطلها طفلك",
    badge: "مخصصة باسم بطلنا",
    badgeSoon: false,
    price: 310,
    originalPrice: 340,
    priceText: "310 ج.م",
    originalPriceText: "340 ج.م",
    category: "قصص مخصصة",
    section: "custom-stories",
    shortDesc: "قصة كاملة بتتكتب لطفلك من البداية",
    longDesc:
      "في سراج، القصة المخصصة مش مجرد اسم وصورة داخل حكاية جاهزة: احكيلنا عن طفلك والرسالة اللي تهمك — شجاعة، ثقة، صبر، حب تعلم، أو موقف خاص — وارفع صوره. نجهز له تصميم شخصية متكامل (Character Sheet) يساعدنا نحافظ على اتساق شكل البطل وملامحه عبر المشاهد، ونرسل لك عينة لاعتمادها قبل استكمال القصة. بعدها نحولها لحكاية عربية بطلها هو، وممكن نضيف إهداء ونوصل الكتاب مباشرةً لمستلم الهدية داخل مصر.",
    features: [
      "قصة تُبنى على أولوية ولي الأمر، وليست مجرد تبديل الاسم",
      "تصميم شخصية متكامل (Character Sheet) يساعد على اتساق شكل البطل",
      "عينة الشخصية للاعتماد قبل استكمال القصة",
      "إهداء وتوصيل مباشر لمستلم الهدية داخل مصر",
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
    reviews: [],
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
    reviews: [],
    related: ["story-khaled", "bundle"],
    active: true,
    order: 4,
  },
  {
    slug: "bundle",
    name: "مجموعة الأبطال الصغار",
    badge: "عرض مجموعة",
    badgeSoon: false,
    price: 420,
    priceText: "420 ج.م",
    category: "مجموعات",
    // No section — bundles appear as cross-sell
    longDesc:
      "مجموعة تجمع قصة مخصصة باسم طفلك + كروت روتين يومي + قصة من سلسلة سباق الفتوحات في طلب واحد.",
    features: [
      "قصة مخصصة باسم طفلك",
      "كروت الروتين اليومي",
      "قصة من سلسلة سباق الفتوحات",
      "تجربة قراءة ولعب في طلب واحد",
    ],
    media: { type: "bundle-stack", bg: "teal" },
    action: "cart",
    ctaText: "أضيف للسلة",
    comingSoon: false,
    reviews: [],
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
