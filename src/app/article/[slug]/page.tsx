import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  DEFAULT_SOCIAL_IMAGE,
  absoluteAssetUrl,
  articleDescription,
  encodedPath,
  getPublishedArticle,
  jsonLd,
  plainText,
  siteUrl,
} from "@/lib/seoContent";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type ArticlePageProps = {
  params: Promise<{ slug: string }>;
};

function articleParagraphs(markdown?: string) {
  return (markdown || "")
    .split(/\n{2,}/)
    .map((paragraph) => plainText(paragraph))
    .filter(Boolean)
    .slice(0, 18);
}

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
  const paragraphs = articleParagraphs(article.contentMarkdown);
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
        author: { "@type": "Organization", name: article.author || "فريق سراج" },
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
        <header className="space-y-4">
          <Link className="text-sm font-semibold text-[#1f7a5c]" href="/mama-world">
            عالم ماما وبابا
          </Link>
          <div className="space-y-3">
            <p className="text-sm font-bold text-[#a15c1b]">{article.section}</p>
            <h1 className="text-3xl font-extrabold leading-tight md:text-5xl">
              {article.title}
            </h1>
            <p className="text-lg leading-8 text-[#5f5044]">{description}</p>
            <p className="text-sm text-[#7a6a5e]">
              {article.author || "فريق سراج"}
              {article.readingTime ? ` · ${article.readingTime} دقائق قراءة` : ""}
            </p>
          </div>
        </header>

        {article.coverImage && (
          <img
            alt={article.coverImageAlt || article.title}
            className="max-h-[460px] w-full rounded-lg object-cover shadow-sm"
            src={absoluteAssetUrl(article.coverImage)}
          />
        )}

        <section className="space-y-5 rounded-lg bg-white p-6 leading-8 shadow-sm">
          {paragraphs.length > 0 ? (
            paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)
          ) : (
            <p>{article.excerpt}</p>
          )}
        </section>

        <Link
          className="inline-flex rounded-md bg-[#1f7a5c] px-5 py-3 font-bold text-white"
          href={`/index.html#/article/${article.slug}`}
        >
          فتح المقال في تجربة المتجر
        </Link>
      </article>
    </main>
  );
}
