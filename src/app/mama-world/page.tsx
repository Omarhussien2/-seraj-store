import type { Metadata } from "next";
import Link from "next/link";
import {
  articleDescription,
  getPublishedArticles,
  jsonLd,
  siteUrl,
  absoluteAssetUrl,
} from "@/lib/seoContent";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const metadata: Metadata = {
  title: "عالم ماما وبابا",
  description:
    "مقالات عملية للأمهات والآباء عن التربية، التعليم، السلوكيات، والقراءة للأطفال.",
  alternates: { canonical: siteUrl("/mama-world") },
  openGraph: {
    title: "عالم ماما وبابا | سراج",
    description: "مقالات عملية للأمهات والآباء من فريق سراج.",
    url: siteUrl("/mama-world"),
    type: "website",
  },
};

export default async function MamaWorldSeoPage() {
  const articles = await getPublishedArticles(24);
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

  return (
    <main className="min-h-screen bg-[#f7f1e7] px-4 py-8 text-[#26170f]" dir="rtl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(collectionJsonLd) }}
      />
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="space-y-4">
          <Link className="text-sm font-semibold text-[#1f7a5c]" href="/index.html#/mama-world">
            فتح عالم ماما وبابا في المتجر
          </Link>
          <div className="space-y-3">
            <p className="text-sm font-bold text-[#a15c1b]">سراج للأهل</p>
            <h1 className="text-3xl font-extrabold md:text-5xl">عالم ماما وبابا</h1>
            <p className="max-w-3xl text-lg leading-8 text-[#5f5044]">
              مساحة عربية عملية عن التربية، التعليم، السلوكيات، والمراحل العمرية.
            </p>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {articles.map((article) => (
            <article
              className="overflow-hidden rounded-lg border border-[#dcc9ad] bg-white shadow-sm"
              key={article.slug}
            >
              {article.coverImage && (
                <img
                  alt={article.coverImageAlt || article.title}
                  className="h-48 w-full object-cover"
                  loading="lazy"
                  src={absoluteAssetUrl(article.coverImage)}
                />
              )}
              <div className="space-y-3 p-5">
                <p className="text-sm font-bold text-[#1f7a5c]">{article.section}</p>
                <h2 className="text-xl font-extrabold">{article.title}</h2>
                <p className="text-sm leading-7 text-[#67594e]">
                  {articleDescription(article)}
                </p>
                <Link
                  className="inline-flex rounded-md bg-[#1f7a5c] px-4 py-2 text-sm font-bold text-white"
                  href={`/article/${encodeURIComponent(article.slug)}`}
                >
                  قراءة المقال
                </Link>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
