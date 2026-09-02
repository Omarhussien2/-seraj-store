import type { Metadata } from "next";
import Link from "next/link";
import {
  FREE_SHIPPING_MINIMUM_EGP,
  SHIPPING_FEE_EGP,
} from "@/lib/commercePolicies";
import {
  CUSTOM_STORY_SLUG,
  HOW_IT_WORKS_PATH,
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
  title: "هدية طفل مخصصة مع إهداء وتوصيل داخل مصر",
  description:
    "هدية عيد ميلاد طفل مختلفة: قصة مخصصة بطلها الطفل نفسه، مع إهداء باسمك وتوصيل مباشرةً لمستلم الهدية داخل مصر نيابةً عنك من سراج.",
  alternates: { canonical: siteUrl("/personalized-gifts-for-children") },
  openGraph: {
    title: "هدية طفل مخصصة مع إهداء وتوصيل داخل مصر | سراج",
    description:
      "ابعت هدية عمرها ما بتتنسى: قصة بطلها الطفل نفسه، بإهداء باسمك، وتوصيل مباشرةً لمستلم الهدية داخل مصر.",
    url: siteUrl("/personalized-gifts-for-children"),
    type: "website",
    locale: "ar_EG",
    siteName: "سراج",
    images: [DEFAULT_SOCIAL_IMAGE],
  },
};

const giftPageUrl = siteUrl("/personalized-gifts-for-children");

const giftPageJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": `${giftPageUrl}#webpage`,
      name: "هدية طفل مخصصة مع إهداء وتوصيل داخل مصر",
      description: metadata.description,
      url: giftPageUrl,
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
          name: "هدية طفل مخصصة",
          item: giftPageUrl,
        },
      ],
    },
  ],
};

export default async function PersonalizedGiftsPage() {
  const customStory = await getActiveProduct(CUSTOM_STORY_SLUG);

  return (
    <main className="min-h-screen bg-[#f7f1e7] px-4 py-8 text-[#26170f]" dir="rtl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(giftPageJsonLd) }}
      />
      <div className="mx-auto max-w-4xl space-y-10">
        <header className="space-y-4">
          <nav className="flex flex-wrap gap-2 text-sm font-semibold text-[#1f7a5c]" aria-label="مسار التنقل">
            <a href="/">الرئيسية</a>
            <span aria-hidden="true">/</span>
            <Link href="/category/personalized-stories">القصة المخصصة</Link>
            <span aria-hidden="true">/</span>
            <span className="text-[#67594e]">هدية مخصصة لطفل</span>
          </nav>
          <p className="text-sm font-bold text-[#a15c1b]">هدية بطلها هو</p>
          <h1 className="text-3xl font-extrabold leading-tight md:text-5xl">
            ابعت له حكاية بطلها هو
          </h1>
          <p className="max-w-3xl text-lg leading-8 text-[#5f5044]">
            عيد ميلاد، بداية سنة دراسية، نجاح، أو مناسبة عائلية خاصة: قصة سراج
            المخصصة بتتحول لهدية شخصية بطلها الطفل نفسه، بإهداء باسمك، وتوصيل
            مباشرةً لمستلم الهدية داخل مصر نيابةً عنك.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              className="rounded-md bg-[#1f7a5c] px-5 py-3 font-bold text-white"
              href={`/index.html#/product/${CUSTOM_STORY_SLUG}`}
            >
              ابدأ هدية طفلك النهارده
            </Link>
            <Link
              className="rounded-md border border-[#1f7a5c] px-5 py-3 font-bold text-[#1f7a5c]"
              href={HOW_IT_WORKS_PATH}
            >
              اعرف خطوات صناعة القصة
            </Link>
          </div>
        </header>

        <section className="space-y-5" aria-labelledby="gift-features-title">
          <h2 className="text-2xl font-extrabold md:text-3xl" id="gift-features-title">
            إيه اللي بيخليها هدية مختلفة؟
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-[#dcc9ad] bg-white p-5 shadow-sm">
              <h3 className="text-lg font-extrabold">بطل الحكاية هو الطفل</h3>
              <p className="mt-2 leading-8 text-[#4f4036]">
                القصة بتتكتب لطفل واحد من البداية حسب رسالة ولي الأمر، مش مجرد
                اسم داخل حكاية جاهزة. لو بتفكر في هدية عيد ميلاد طفل، الهدية نفسها
                بتقول له: إنت البطل.
              </p>
            </div>
            <div className="rounded-lg border border-[#dcc9ad] bg-white p-5 shadow-sm">
              <h3 className="text-lg font-extrabold">إهداء باسم المرسل</h3>
              <p className="mt-2 leading-8 text-[#4f4036]">
                ممكن تختار إهداء جاهز أو تكتب رسالتك بنفسك، وتظهر في بداية القصة
                باسمك كمرسل الهدية.
              </p>
            </div>
            <div className="rounded-lg border border-[#dcc9ad] bg-white p-5 shadow-sm">
              <h3 className="text-lg font-extrabold">توصيل مباشرة لمستلم الهدية</h3>
              <p className="mt-2 leading-8 text-[#4f4036]">
                لو بتهدي طفل في عنوان مختلف عنك أو عايز تفاجئه على طول، بتحدد في
                خطوات الطلب اسم المستلم ورقمه وعنوانه، وسراج بيوصل الكتاب له
                نيابةً عنك داخل مصر.
              </p>
            </div>
            <div className="rounded-lg border border-[#dcc9ad] bg-white p-5 shadow-sm">
              <h3 className="text-lg font-extrabold">عينة الشخصية قبل التنفيذ</h3>
              <p className="mt-2 leading-8 text-[#4f4036]">
                قبل استكمال القصة، ولي الأمر بيراجع عينة من تصميم شخصية الطفل
                (Character Sheet) عشان الهدية تطلع بالشكل المتفق عليه.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-4" aria-labelledby="gift-occasions-title">
          <h2 className="text-2xl font-extrabold md:text-3xl" id="gift-occasions-title">
            مناسبات تصلح فيها الهدية
          </h2>
          <p className="leading-8 text-[#5f5044]">
            القصة المخصصة مناسبة كهدية عيد ميلاد طفل، أو لبداية سنة دراسية جديدة،
            أو للاحتفال بنجاح، أو كرسالة تربوية تختارها الأسرة في مناسبة عائلية.
            الرسالة اللي تحب القصة تحملها — شجاعة، صبر، ثقة بالنفس — بتحددها إنت
            في الطلب، وده اللي بيخلي كل هدية مختلفة عن التانية.
          </p>
        </section>

        <section className="space-y-4" aria-labelledby="gift-delivery-title">
          <h2 className="text-2xl font-extrabold md:text-3xl" id="gift-delivery-title">
            الشحن والاسترجاع للهدية
          </h2>
          <p className="leading-8 text-[#5f5044]">
            الشحن داخل مصر بـ {SHIPPING_FEE_EGP} ج.م، ومجاني للطلبات بقيمة{" "}
            {FREE_SHIPPING_MINIMUM_EGP} ج.م أو أكتر. ولأن القصة بتُصنع خصيصًا
            لطفل بعينه، فلها شروط استرجاع مختلفة عن باقي منتجات المتجر —{" "}
            <Link className="font-bold text-[#1f7a5c]" href="/returns">
              راجع سياسة الاسترجاع والاستبدال
            </Link>{" "}
            قبل الطلب، و{" "}
            <Link className="font-bold text-[#1f7a5c]" href="/shipping">
              تفاصيل الشحن والتوصيل
            </Link>{" "}
            متاحة كمان.
          </p>
        </section>

        {customStory && (
          <section className="rounded-lg bg-[#26170f] p-6 text-white">
            <h2 className="text-2xl font-extrabold">جرب هدية ها تتذكر</h2>
            <p className="mt-2 max-w-2xl leading-8 text-white/80">
              ابدأ الطلب دلوقتي: القصة المخصصة حاليًا بـ{" "}
              {customStory.priceText || `${customStory.price} ج.م`}
              {customStory.originalPriceText
                ? ` بدل ${customStory.originalPriceText}`
                : ""}
              ، وخطوات الطلب بتسألك عن الإهداء ومستلم الهدية في آخر خطوة.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                className="rounded-md bg-[#d89b45] px-5 py-3 font-bold text-[#26170f]"
                href={`/index.html#/product/${CUSTOM_STORY_SLUG}`}
              >
                ابدأ هدية طفلك
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
