import type { Metadata } from "next";
import Link from "next/link";
import MamaWorldArticlesExplorer from "@/components/seo/MamaWorldArticlesExplorer";
import StoreCategoryLinks from "@/components/seo/StoreCategoryLinks";
import {
  DEFAULT_SOCIAL_IMAGE,
  absoluteAssetUrl,
  articleDescription,
  getPublishedArticles,
  jsonLd,
  siteUrl,
} from "@/lib/seoContent";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const metadata: Metadata = {
  title: "مقالات للأهل عن قصص الأطفال واللعب والتربية | عالم ماما وبابا",
  description:
    "مقالات عملية للأمهات والآباء عن التربية، التعليم، بدائل الشاشات، ودليل خروجات الأطفال في القاهرة والجيزة.",
  alternates: { canonical: siteUrl("/mama-world") },
  openGraph: {
    title: "عالم ماما وبابا | سراج",
    description:
      "مقالات عملية للأمهات والآباء، بدائل الشاشات، ودليل خروجات الأطفال من فريق سراج.",
    url: siteUrl("/mama-world"),
    type: "website",
    images: [DEFAULT_SOCIAL_IMAGE],
  },
};

export default async function MamaWorldSeoPage() {
  const articles = await getPublishedArticles();

  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "عالم ماما وبابا",
    description: metadata.description,
    url: siteUrl("/mama-world"),
    inLanguage: "ar-EG",
    mainEntity: {
      "@type": "ItemList",
      itemListElement: articles.map((article, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: article.title,
        url: siteUrl(`/article/${encodeURIComponent(article.slug)}`),
      })),
    },
  };

  const explorerArticles = articles.map((article) => ({
    slug: article.slug,
    title: article.title,
    section: article.section,
    excerpt: article.excerpt,
    description: articleDescription(article),
    coverImage: article.coverImage ? absoluteAssetUrl(article.coverImage) : null,
    coverImageAlt: article.coverImageAlt || article.title,
    readingTime: article.readingTime,
    tags: article.tags,
  }));

  return (
    <main className="min-h-screen bg-[#f7f1e7] px-4 py-8 text-[#26170f]" dir="rtl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(collectionJsonLd) }}
      />
      <div className="mx-auto max-w-6xl space-y-10">
        {/* Top Breadcrumb & Quick Action */}
        <nav
          className="flex flex-wrap items-center justify-between gap-3 text-sm text-[#7a6a5e]"
          aria-label="مسار التنقل"
        >
          <div className="flex items-center gap-2">
            <Link className="hover:text-[#1f7a5c] transition-colors" href="/">
              الرئيسية
            </Link>
            <span>/</span>
            <span className="font-bold text-[#26170f]">عالم ماما وبابا</span>
          </div>
          <Link
            className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-1.5 font-bold text-[#1f7a5c] border border-[#dcc9ad] shadow-xs hover:bg-[#f2eae0] transition-colors"
            href="/index.html#/mama-world"
          >
            <span>فتح في تجربة المتجر التفاعلية</span>
            <span>📱</span>
          </Link>
        </nav>

        {/* 1. Hero Banner: Introducing "عالم ماما وبابا" */}
        <header className="overflow-hidden rounded-3xl border border-[#dcc9ad] bg-white p-6 sm:p-10 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f7f1e7] px-3.5 py-1 text-xs font-black text-[#a15c1b] border border-[#e5d5be]">
              <span>🏮</span>
              <span>سراج للأهل والتربية الواعية</span>
            </span>
            <span className="text-xs font-semibold text-[#8a796d]">
              {articles.length} مقال ودليل متخصص
            </span>
          </div>

          <div className="space-y-4 max-w-4xl">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black leading-tight text-[#26170f]">
              عالم ماما وبابا: رفيقك في رحلة التربية وبناء عقل طفلك
            </h1>
            <p className="text-base sm:text-lg md:text-xl leading-relaxed text-[#5f5044]">
              مساحة عربية عملية موجهة للأسر المصرية؛ نجمع لكِ بين الاستشارات
              التربوية والنفسية الموثوقة، وأفكار بدائل الشاشات والألعاب الهادفة،
              ودليل خروجات نهاية الأسبوع للأطفال في القاهرة والجيزة. خطوات واقعية
              تناسب بيوتنا وواقعنا اليومي.
            </p>
          </div>

          {/* Core Pillars Feature Grid */}
          <div className="grid gap-4 sm:grid-cols-3 pt-4 border-t border-[#f0e4d2]">
            <div className="rounded-2xl bg-[#fbf8f3] p-4.5 space-y-2 border border-[#ebdcc8]">
              <div className="text-2xl">🌱</div>
              <h2 className="text-base font-black text-[#26170f]">تربية ودعم نفسي</h2>
              <p className="text-xs sm:text-sm leading-relaxed text-[#67594e]">
                نصائح للتعامل مع العناد، نوبات الغضب، وفهم احتياجات المراحل العمرية دون جلد للذات.
              </p>
            </div>

            <div className="rounded-2xl bg-[#fbf8f3] p-4.5 space-y-2 border border-[#ebdcc8]">
              <div className="text-2xl">🎲</div>
              <h2 className="text-base font-black text-[#26170f]">بدائل حقيقية للشاشات</h2>
              <p className="text-xs sm:text-sm leading-relaxed text-[#67594e]">
                أنشطة تفاعلية وألعاب طاولة حركية وذهنية تعيد جمع العائلة وتحد من إدمان الأجهزة.
              </p>
            </div>

            <div className="rounded-2xl bg-[#fbf8f3] p-4.5 space-y-2 border border-[#ebdcc8]">
              <div className="text-2xl">🎪</div>
              <h2 className="text-base font-black text-[#26170f]">دليل خروجات الأطفال</h2>
              <p className="text-xs sm:text-sm leading-relaxed text-[#67594e]">
                ترشيحات لأماكن مجربة بالقاهرة والجيزة تناسب الويك إند مع فلاتر العمر والمترو.
              </p>
            </div>
          </div>
        </header>

        {/* 2. Prominent Callout Card: "فسحة حلوة للأطفال" */}
        <section
          className="relative overflow-hidden rounded-3xl border-2 border-[#1f7a5c]/30 bg-gradient-to-br from-[#eaf4f0] via-[#ffffff] to-[#f6ede2] p-6 sm:p-8 md:p-10 shadow-sm space-y-6"
          aria-label="دليل فسحة حلوة للأطفال"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-4 max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#1f7a5c] px-3.5 py-1 text-xs font-black text-white shadow-xs">
                <span>🎡</span>
                <span>جديد ومجرب للأسر · دليل الخروجات التفاعلي</span>
              </div>

              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black leading-tight text-[#14533d]">
                دليل &quot;فسحة حلوة&quot;: أكتر من 25 خروجة مجربة للأطفال في القاهرة والجيزة
              </h2>

              <p className="text-sm sm:text-base leading-relaxed text-[#3d5a4e]">
                بتدوري على خروجة ممتعة للأولاد في الويك إند بدون حيرة؟ جمعنا لكِ دليلاً تفاعلياً
                شاملاً لأفضل الحدائق، المتاحف، الملاهي ومراكز الأنشطة بالقاهرة والجيزة.
                يمكنك الفلترة بسهولة حسب: القرب من محطات المترو، الأماكن المغلقة (المكيفة)
                أو المفتوحة في الهواء الطلق، الفئات العمرية من سنتين حتى 12+ سنة، مع أرقام
                التواصل ومواقع خرائط جوجل مباشرة.
              </p>

              {/* Feature Chips */}
              <div className="flex flex-wrap gap-2.5 pt-1">
                <span className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-xs font-bold text-[#1f7a5c] border border-[#c3ded4] shadow-xs">
                  <span>🚇</span>
                  <span>قرب محطات المترو</span>
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-xs font-bold text-[#1f7a5c] border border-[#c3ded4] shadow-xs">
                  <span>☀️🌧️</span>
                  <span>أماكن مغلقة ومفتوحة</span>
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-xs font-bold text-[#1f7a5c] border border-[#c3ded4] shadow-xs">
                  <span>🎯</span>
                  <span>فلاتر حسب الفئة العمرية</span>
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-xs font-bold text-[#1f7a5c] border border-[#c3ded4] shadow-xs">
                  <span>📞</span>
                  <span>أرقام تواصل ومواقع Maps</span>
                </span>
              </div>
            </div>

            {/* Action Card Button */}
            <div className="flex flex-col items-center lg:items-end justify-center gap-3 lg:min-w-[280px]">
              <Link
                href="/index.html#/mama-world"
                className="w-full text-center sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-[#1f7a5c] px-7 py-4 text-base font-black text-white shadow-md hover:bg-[#18634b] hover:shadow-lg transition-all"
              >
                <span>استكشفي دليل فسحة حلوة التفاعلي</span>
                <span>←</span>
              </Link>
              <p className="text-xs text-[#5a786a] text-center lg:text-end">
                💡 يفتح داخل تجربة المتجر التفاعلية مع بحث وفلاتر فورية
              </p>
            </div>
          </div>
        </section>

        {/* 3. Categorized Articles & Search Filter Component */}
        <MamaWorldArticlesExplorer articles={explorerArticles} />

        {/* 4. Cross-Sell Conversion Banners: Core Brand Pillars */}
        <section
          className="space-y-6 pt-6 border-t border-[#dcc9ad]"
          aria-label="حلول سراج للأسر"
        >
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-extrabold text-[#a15c1b] tracking-wider uppercase">
              من المقال إلى التطبيق العملي
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#26170f]">
              حلول عملية من متجر سراج تدعم رحلتك مع أطفالك
            </h2>
            <p className="text-sm sm:text-base text-[#67594e]">
              منتجات تعليمية وقصص هادفة مصنوعة بحب وجودة عالية في مصر
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Banner 1: Screen-Free Games */}
            <div className="flex flex-col justify-between rounded-3xl border border-[#dcc9ad] bg-white p-6 sm:p-8 shadow-sm space-y-5">
              <div className="space-y-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1f7a5c]/10 px-3 py-1 text-xs font-black text-[#1f7a5c]">
                  <span>🎲</span>
                  <span>بدائل الشاشات والملل</span>
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-[#26170f]">
                  ألعاب سراج بدون شاشات
                </h3>
                <p className="text-sm leading-relaxed text-[#67594e]">
                  ألعاب طاولة وبطاقات وبازل إسلامي وتعليمي (بازل السيرة والقرآن، لعبة ميزان الحساب،
                  وبطاقات المهارات) تجمع الأسرة في نشاط مشترك، وتنمي التركيز والذكاء بعيداً
                  عن شاشات الموبايل والتلفزيون.
                </p>
              </div>
              <div className="pt-2">
                <Link
                  href="/category/educational-games"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#1f7a5c] px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-[#18634b] transition-colors"
                >
                  <span>تصفح ألعاب سراج بدون شاشات</span>
                  <span>←</span>
                </Link>
              </div>
            </div>

            {/* Banner 2: Personalized Stories */}
            <div className="flex flex-col justify-between rounded-3xl border border-[#dcc9ad] bg-white p-6 sm:p-8 shadow-sm space-y-5">
              <div className="space-y-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#a15c1b]/10 px-3 py-1 text-xs font-black text-[#a15c1b]">
                  <span>✨</span>
                  <span>طفلك هو بطل الحكاية</span>
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-[#26170f]">
                  القصة المخصصة لطفلك بالاسم والصورة
                </h3>
                <p className="text-sm leading-relaxed text-[#67594e]">
                  حوّلي القيم التربوية من نصائح مجردة إلى مغامرة ممتعة؛ نصمم شخصية تشبه
                  ملامح طفلك ونبني حكاية مخصصة لتعزيز ثقته بنفسه وغرس قيم الشجاعة
                  والصدق مع إمكانية مراجعة العينة قبل الطباعة والتوصيل.
                </p>
              </div>
              <div className="pt-2">
                <Link
                  href="/category/personalized-stories"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#a15c1b] px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-[#864b14] transition-colors"
                >
                  <span>صممي قصة طفلك المخصصة الآن</span>
                  <span>←</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 5. All Category Internal Links */}
        <StoreCategoryLinks />
      </div>
    </main>
  );
}
