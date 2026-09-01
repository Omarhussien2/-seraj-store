import type { SeoProduct } from "@/lib/seoContent";

export type SeoCategory = {
  slug: string;
  name: string;
  eyebrow: string;
  title: string;
  description: string;
  introduction: string[];
  highlights: string[];
  productCategories: string[];
  productSections: string[];
};

export const SEO_CATEGORIES: SeoCategory[] = [
  {
    slug: "personalized-stories",
    name: "قصص أطفال مخصصة",
    eyebrow: "طفلك هو بطل الحكاية",
    title: "قصص أطفال مخصصة بالاسم والصورة",
    description:
      "اكتشف قصص أطفال مخصصة باسم وصورة طفلك، مصممة لتشجعه على القراءة وتقديم القيم اليومية داخل حكاية يعيشها بنفسه.",
    introduction: [
      "القصة المخصصة تجعل الطفل يرى اسمه وشخصيته داخل الأحداث، فتتحول القراءة من نشاط بعيد عنه إلى مغامرة يشعر أنها تخصه.",
      "في سراج تُجهز الحكاية لتكون هدية شخصية وذكرى جميلة، مع محتوى عربي يساعد الطفل على الارتباط بالكتاب بعيدًا عن الشاشات.",
    ],
    highlights: [
      "اسم الطفل وشخصية قريبة من ملامحه داخل القصة",
      "محتوى عربي دافئ يقدّم القيم من خلال الأحداث",
      "هدية شخصية مناسبة لأعياد الميلاد والمناسبات",
    ],
    productCategories: ["قصص مخصصة"],
    productSections: ["custom-stories"],
  },
  {
    slug: "islamic-stories",
    name: "قصص إسلامية للأطفال",
    eyebrow: "بطولات حقيقية بلغة تناسب الطفل",
    title: "قصص إسلامية وتاريخية للأطفال",
    description:
      "قصص إسلامية للأطفال تحكي سيرة الأبطال وأحداث التاريخ بأسلوب عربي بسيط ورسومات جذابة تغرس الشجاعة والثقة بالله.",
    introduction: [
      "تعرّف قصص سراج الطفل على أبطال حقيقيين من التاريخ الإسلامي من خلال أحداث مشوقة ولغة واضحة تناسب عمره.",
      "كل حكاية تجمع بين متعة المغامرة والمعلومة المبسطة، لتساعد الأسرة على فتح حوار عن الشجاعة والحكمة والثبات على الحق.",
    ],
    highlights: [
      "أحداث مستوحاة من التاريخ والسيرة الإسلامية",
      "لغة عربية مبسطة ورسومات تجذب الطفل",
      "قيم الشجاعة والتخطيط والثقة بالله داخل القصة",
    ],
    productCategories: ["قصص جاهزة"],
    productSections: ["tales"],
  },
  {
    slug: "educational-games",
    name: "ألعاب تعليمية للأطفال",
    eyebrow: "اللعب طريق ممتع للتعلم",
    title: "ألعاب تعليمية للأطفال تنمّي التفكير والمعرفة",
    description:
      "ألعاب تعليمية للأطفال تجمع بين البازل والقصص والحساب والأنشطة التفاعلية لتنمية التركيز والتفكير بطريقة ممتعة.",
    introduction: [
      "يتعلم الطفل بصورة أفضل عندما يشارك بيديه ويجرب بنفسه. لذلك تجمع ألعاب سراج بين المتعة والمعرفة في نشاط يمكن للأسرة مشاركته.",
      "تتنوع الاختيارات بين ألعاب الحساب والبازل المرتبط بالقصص الإسلامية والقرآنية، لتناسب اهتمامات ومراحل عمرية مختلفة.",
    ],
    highlights: [
      "أنشطة عملية تنمّي التركيز وحل المشكلات",
      "اختيارات تجمع اللعب بالقراءة والمشاهدة",
      "مناسبة للتعلم في المنزل أو كهدية تعليمية",
    ],
    productCategories: ["مجموعات", "فلاش كاردز"],
    productSections: ["play-learn", "bundle"],
  },
];

export function getSeoCategory(slug: string) {
  return SEO_CATEGORIES.find((category) => category.slug === slug);
}

export function productMatchesSeoCategory(product: SeoProduct, category: SeoCategory) {
  return (
    category.productCategories.includes(product.category || "") ||
    category.productSections.includes(product.section || "")
  );
}

export function seoCategoryForProduct(product: SeoProduct) {
  return SEO_CATEGORIES.find((category) => productMatchesSeoCategory(product, category));
}
