import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ArticleContent from "@/components/seo/ArticleContent";
import ArticleSerajRecommendation from "@/components/seo/ArticleSerajRecommendation";
import StoreCategoryLinks from "@/components/seo/StoreCategoryLinks";
import {
  DEFAULT_SOCIAL_IMAGE,
  absoluteAssetUrl,
  articleDescription,
  encodedPath,
  getPublishedArticle,
  jsonLd,
  siteUrl,
} from "@/lib/seoContent";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type ArticlePageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getPublishedArticle(decodeURIComponent(slug));

  if (!article) {
    return {
      title: "المقال غير موجود",
      robots: { index: false, follow: true },
    };
  }

  const path = encodedPath("/article", article.slug);
  const description = articleDescription(article);

  return {
    title: article.seoTitle || article.title,
    description,
    alternates: { canonical: siteUrl(path) },
    openGraph: {
      title: `${article.seoTitle || article.title} | سراج`,
      description,
      url: siteUrl(path),
      type: "article",
      locale: "ar_EG",
      siteName: "سراج",
      images: article.coverImage
        ? [{ url: absoluteAssetUrl(article.coverImage), alt: article.coverImageAlt || article.title }]
        : [DEFAULT_SOCIAL_IMAGE],
    },
  };
}

export default async function ArticleSeoPage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = await getPublishedArticle(decodeURIComponent(slug));
  if (!article) notFound();

  const articlePath = encodedPath("/article", article.slug);
  const description = articleDescription(article);
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": `${siteUrl(articlePath)}#article`,
        headline: article.seoTitle || article.title,
        description,
        image: article.coverImage
          ? [absoluteAssetUrl(article.coverImage)]
          : [DEFAULT_SOCIAL_IMAGE.url],
        url: siteUrl(articlePath),
        mainEntityOfPage: siteUrl(articlePath),
        inLanguage: "ar-EG",
        author: {
          "@type": "Organization",
          "@id": siteUrl("/#organization"),
          name: article.author || "فريق سراج",
          url: siteUrl("/about"),
        },
        publisher: {
          "@type": "Organization",
          "@id": `${siteUrl("/")}#organization`,
          name: "سراج",
          logo: {
            "@type": "ImageObject",
            url: siteUrl("/assets/logo/google-logo-512.png"),
            width: 512,
            height: 512,
          },
        },
        datePublished: article.publishedAt?.toISOString(),
        dateModified: article.updatedAt?.toISOString(),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "الرئيسية", item: siteUrl("/") },
          { "@type": "ListItem", position: 2, name: "عالم ماما وبابا", item: siteUrl("/mama-world") },
          { "@type": "ListItem", position: 3, name: article.title, item: siteUrl(articlePath) },
        ],
      },
    ],
  };

  return (
    <main className="min-h-screen bg-[#f7f1e7] px-4 py-8 text-[#26170f]" dir="rtl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(articleJsonLd) }}
      />
      <article className="mx-auto max-w-3xl space-y-8">
        {/* Navigation Breadcrumbs */}
        <nav
          className="flex flex-wrap items-center justify-between gap-2 text-sm text-[#7a6a5e]"
          aria-label="مسار التنقل"
        >
          <div className="flex flex-wrap items-center gap-2">
            <Link className="hover:text-[#1f7a5c] transition-colors" href="/">
              الرئيسية
            </Link>
            <span>/</span>
            <Link className="hover:text-[#1f7a5c] transition-colors" href="/mama-world">
              عالم ماما وبابا
            </Link>
            <span>/</span>
            <span className="font-semibold text-[#26170f] truncate max-w-[200px] sm:max-w-xs">
              {article.title}
            </span>
          </div>
          <Link
            className="text-xs font-bold text-[#1f7a5c] hover:underline"
            href="/mama-world"
          >
            ← كل المقالات
          </Link>
        </nav>

        {/* Article Header */}
        <header className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-[#1f7a5c]/10 px-3 py-1 text-xs font-bold text-[#1f7a5c]">
              {article.section}
            </span>
            {article.readingTime && (
              <span className="text-xs font-medium text-[#7a6a5e]">
                ⏱ {article.readingTime} دقائق قراءة
              </span>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black leading-tight text-[#26170f]">
            {article.title}
          </h1>

          <p className="text-base sm:text-lg md:text-xl leading-relaxed text-[#5f5044]">
            {description}
          </p>

          <div className="flex items-center gap-3 pt-2 text-xs sm:text-sm text-[#7a6a5e] border-t border-[#ebdcc8]">
            <span className="font-bold text-[#26170f]">
              {article.author || "فريق سراج"}
            </span>
            {article.publishedAt && (
              <>
                <span>·</span>
                <time dateTime={article.publishedAt.toISOString()}>
                  {new Date(article.publishedAt).toLocaleDateString("ar-EG", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
              </>
            )}
          </div>
        </header>

        {/* Cover Image */}
        {article.coverImage && (
          <div className="overflow-hidden rounded-2xl shadow-sm border border-[#dcc9ad]">
            <img
              alt={article.coverImageAlt || article.title}
              className="max-h-[480px] w-full object-cover"
              src={absoluteAssetUrl(article.coverImage)}
            />
          </div>
        )}

        {/* Article Body Content */}
        <ArticleContent article={article} />

        {/* Context-Aware Seraj Recommendation Box (صندوق ترشيح سراج للأسرة) */}
        <ArticleSerajRecommendation article={article} />

        {/* Quick App Actions & Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#dcc9ad] bg-white p-4 sm:p-5 shadow-xs">
          <Link
            className="text-sm font-bold text-[#1f7a5c] hover:underline"
            href="/mama-world"
          >
            ← رجوع لجميع مقالات عالم ماما وبابا
          </Link>
          <Link
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#f7f1e7] px-4 py-2.5 text-xs sm:text-sm font-bold text-[#8a4316] border border-[#dcc9ad] hover:bg-[#ede0ce] transition-colors"
            href={`/index.html#/article/${article.slug}`}
          >
            <span>فتح المقال في تجربة المتجر التفاعلية</span>
            <span>📱</span>
          </Link>
        </div>

        {/* Internal Store Categories */}
        <StoreCategoryLinks />
      </article>
    </main>
  );
}
