import type { Metadata } from "next";
import Link from "next/link";
import {
  FREE_SHIPPING_MINIMUM_EGP,
  SHIPPING_FEE_EGP,
} from "@/lib/commercePolicies";
import {
  CUSTOM_STORY_SLUG,
  personalizedStoryFaqs,
  personalizedStorySteps,
} from "@/lib/personalizedStoryContent";
import {
  DEFAULT_SOCIAL_IMAGE,
  getActiveProduct,
  jsonLd,
  siteUrl,
} from "@/lib/seoContent";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const metadata: Metadata = {
  title: "كيف نصنع قصة طفلك المخصصة؟",
  description:
    "خطوات طلب القصة المخصصة من سراج: احكيلنا عن طفلك والقيمة اللي تهمك، ارفع صوره، نجهز تصميم شخصية متكامل، تراجع عينة الشخصية قبل استكمال القصة، وتوصلك هدية بإهداء داخل مصر.",
  alternates: { canonical: siteUrl("/how-personalized-stories-work") },
  openGraph: {
    title: "كيف نصنع قصة طفلك المخصصة؟ | سراج",
    description:
      "من احكيلنا عن طفلك لغاية الكتاب اللي بيوصلك: اعرف خطوات القصة المخصصة وعينة الشخصية اللي تراجعها قبل التنفيذ.",
    url: siteUrl("/how-personalized-stories-work"),
    type: "website",
    locale: "ar_EG",
    siteName: "سراج",
    images: [DEFAULT_SOCIAL_IMAGE],
  },
};

const pageUrl = siteUrl("/how-personalized-stories-work");

const howItWorksJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": `${pageUrl}#webpage`,
      name: "كيف نصنع قصة طفلك المخصصة؟",
      description: metadata.description,
      url: pageUrl,
      inLanguage: "ar-EG",
      isPartOf: { "@id": siteUrl("/#website") },
      about: { "@id": siteUrl("/#organization") },
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "الرئيسية", item: siteUrl("/") },
        {
          "@type": "ListItem",
          position: 2,
          name: "القصة المخصصة",
          item: siteUrl("/category/personalized-stories"),
        },
        {
          "@type": "ListItem",
          position: 3,
          name: "كيف نصنع قصة طفلك المخصصة؟",
          item: pageUrl,
        },
      ],
    },
  ],
};

export default async function HowPersonalizedStoriesWorkPage() {
  const customStory = await getActiveProduct(CUSTOM_STORY_SLUG);

  return (
    <main className="min-h-screen bg-[#f7f1e7] px-4 py-8 text-[#26170f]" dir="rtl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(howItWorksJsonLd) }}
      />
      <div className="mx-auto max-w-4xl space-y-10">
        <header className="space-y-4">
          <nav className="flex flex-wrap gap-2 text-sm font-semibold text-[#1f7a5c]" aria-label="مسار التنقل">
            <a href="/">الرئيسية</a>
            <span aria-hidden="true">/</span>
            <Link href="/category/personalized-stories">القصة المخصصة</Link>
            <span aria-hidden="true">/</span>
            <span className="text-[#67594e]">كيف نصنع قصة طفلك؟</span>
          </nav>
          <p className="text-sm font-bold text-[#a15c1b]">خدمة القصة المخصصة</p>
          <h1 className="text-3xl font-extrabold leading-tight md:text-5xl">
            من صورة طفلك إلى بطل حكاية كاملة
          </h1>
          <p className="max-w-3xl text-lg leading-8 text-[#5f5044]">
            احكيلنا عن طفلك والرسالة اللي تهمك — شجاعة، ثقة، صبر، حب تعلم، أو موقف
            خاص. نصمم له شخصية متكاملة، نرسل لك عينة لاعتمادها، ثم نحولها إلى
            حكاية عربية يكون هو بطلها.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              className="rounded-md bg-[#1f7a5c] px-5 py-3 font-bold text-white"
              href={`/product/${CUSTOM_STORY_SLUG}`}
            >
              ابدأ قصة طفلك
            </Link>
            <Link
              className="rounded-md border border-[#1f7a5c] px-5 py-3 font-bold text-[#1f7a5c]"
              href="/personalized-gifts-for-children"
            >
              ابعتها هدية لمستلم آخر
            </Link>
          </div>
        </header>

        <section className="space-y-5" aria-labelledby="steps-title">
          <h2 className="text-2xl font-extrabold md:text-3xl" id="steps-title">
            خطوات طلب القصة المخصصة
          </h2>
          <ol className="space-y-4">
            {personalizedStorySteps.map((step, index) => (
              <li
                className="rounded-lg border border-[#dcc9ad] bg-white p-5 shadow-sm"
                key={step.title}
              >
                <div className="flex items-start gap-4">
                  <span
                    aria-hidden="true"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1f7a5c] text-lg font-extrabold text-white"
                  >
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="text-xl font-extrabold">{step.title}</h3>
                    <p className="mt-2 leading-8 text-[#4f4036]">{step.body}</p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
          <p className="rounded-lg bg-[#e9f4df] p-4 leading-8 text-[#3c5a48]">
            جاهز تبدأ؟ صفحة القصة المخصصة فيها تفاصيل الخدمة والسعر الحالي، وخطوات
            الطلب جوا المتجر.
          </p>
        </section>

        <section className="space-y-4" aria-labelledby="what-you-review-title">
          <h2 className="text-2xl font-extrabold md:text-3xl" id="what-you-review-title">
            إيه اللي هتشوفه قبل استكمال القصة؟
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-[#dcc9ad] bg-white p-5 shadow-sm">
              <h3 className="text-lg font-extrabold">تصميم شخصية متكامل</h3>
              <p className="mt-2 leading-8 text-[#4f4036]">
                قبل كتابة وتنفيذ القصة كاملة، نجهز تصميم شخصية متكامل
                (Character Sheet) لطفلك. التصميم ده هو المرجع اللي بيخلي ملامح
                بطل الحكاية ثابتة من أول صفحة لآخر صفحة.
              </p>
            </div>
            <div className="rounded-lg border border-[#dcc9ad] bg-white p-5 shadow-sm">
              <h3 className="text-lg font-extrabold">عينة الشخصية للاعتماد</h3>
              <p className="mt-2 leading-8 text-[#4f4036]">
                نرسل لولي الأمر عينة من تصميم الشخصية للمراجعة قبل استكمال
                القصة، ومستكملين التنفيذ بعد اعتمادك. عينة الشخصية دي نقطة
                المراجعة الأساسية في رحلة الطلب.
              </p>
            </div>
          </div>
          <p className="leading-8 text-[#5f5044]">
            بنصمم شخصية قريبة من ملامح الطفل بناءً على الصور المناسبة، ومش
            بنَعِد بتطابق فوتوغرافي أو نتيجة متماثلة مع كل صورة.
          </p>
        </section>

        <section className="space-y-4" aria-labelledby="how-faq-title">
          <h2 className="text-2xl font-extrabold md:text-3xl" id="how-faq-title">
            أسئلة شائعة عن القصة المخصصة
          </h2>
          <dl className="space-y-4">
            {personalizedStoryFaqs.map((faq) => (
              <div
                className="rounded-lg border border-[#dcc9ad] bg-white p-5 shadow-sm"
                key={faq.question}
              >
                <dt className="font-extrabold">{faq.question}</dt>
                <dd className="mt-2 leading-8 text-[#5f5044]">{faq.answer}</dd>
              </div>
            ))}
          </dl>
        </section>

        {customStory && (
          <section className="rounded-lg bg-[#26170f] p-6 text-white">
            <h2 className="text-2xl font-extrabold">ابدأ حكاية طفلك النهارده</h2>
            <p className="mt-2 max-w-2xl leading-8 text-white/80">
              القصة المخصصة حاليًا بـ {customStory.priceText || `${customStory.price} ج.م`}
              {customStory.originalPriceText ? ` بدل ${customStory.originalPriceText}` : ""}
              ، والشحن داخل مصر بـ {SHIPPING_FEE_EGP} ج.م ومجاني للطلبات من{" "}
              {FREE_SHIPPING_MINIMUM_EGP} ج.م.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                className="rounded-md bg-[#d89b45] px-5 py-3 font-bold text-[#26170f]"
                href={`/index.html#/product/${CUSTOM_STORY_SLUG}`}
              >
                ابدأ قصة طفلك في المتجر
              </Link>
              <Link
                className="rounded-md border border-white px-5 py-3 font-bold text-white"
                href={`/product/${CUSTOM_STORY_SLUG}`}
              >
                تفاصيل القصة المخصصة
              </Link>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
