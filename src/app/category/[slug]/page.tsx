import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SeoProductCard from "@/components/seo/SeoProductCard";
import {
  getSeoCategory,
  productMatchesSeoCategory,
  SEO_CATEGORIES,
} from "@/lib/seoCategories";
import {
  DEFAULT_SOCIAL_IMAGE,
  getActiveProducts,
  jsonLd,
  siteUrl,
} from "@/lib/seoContent";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type CategoryPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return SEO_CATEGORIES.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = getSeoCategory(slug);

  if (!category) {
    return {
      title: "القسم غير موجود",
      robots: { index: false, follow: true },
    };
  }

  const url = siteUrl(`/category/${category.slug}`);
  return {
    title: category.title,
    description: category.description,
    alternates: { canonical: url },
    openGraph: {
      title: `${category.title} | سراج`,
      description: category.description,
      url,
      type: "website",
      locale: "ar_EG",
      siteName: "سراج",
      images: [DEFAULT_SOCIAL_IMAGE],
    },
  };
}

export default async function CategorySeoPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = getSeoCategory(slug);
  if (!category) notFound();

  const products = (await getActiveProducts()).filter((product) =>
    productMatchesSeoCategory(product, category)
  );
  const categoryPath = `/category/${category.slug}`;
  const categoryJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${siteUrl(categoryPath)}#collection`,
        name: category.title,
        description: category.description,
        url: siteUrl(categoryPath),
        inLanguage: "ar-EG",
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: products.length,
          itemListElement: products.map((product, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: product.name,
            url: siteUrl(`/product/${encodeURIComponent(product.slug)}`),
          })),
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "الرئيسية", item: siteUrl("/") },
          { "@type": "ListItem", position: 2, name: "المنتجات", item: siteUrl("/products") },
          { "@type": "ListItem", position: 3, name: category.name, item: siteUrl(categoryPath) },
        ],
      },
      {
        "@type": "FAQPage",
        "@id": `${siteUrl(categoryPath)}#faq`,
        mainEntity: category.faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer,
          },
        })),
      },
    ],
  };

  return (
    <main className="min-h-screen bg-[#f7f1e7] px-4 py-8 text-[#26170f]" dir="rtl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(categoryJsonLd) }}
      />
      <div className="mx-auto max-w-6xl space-y-10">
        <header className="space-y-5">
          <nav className="flex flex-wrap gap-2 text-sm font-semibold text-[#1f7a5c]" aria-label="مسار التنقل">
            <a href="/">الرئيسية</a>
            <span aria-hidden="true">/</span>
            <Link href="/products">المنتجات</Link>
            <span aria-hidden="true">/</span>
            <span className="text-[#67594e]">{category.name}</span>
          </nav>
          <div className="max-w-4xl space-y-3">
            <p className="text-sm font-bold text-[#a15c1b]">{category.eyebrow}</p>
            <h1 className="text-3xl font-extrabold leading-tight md:text-5xl">
              {category.title}
            </h1>
            <p className="text-lg leading-8 text-[#5f5044]">{category.description}</p>
          </div>
        </header>

        <section className="grid gap-5 rounded-lg border border-[#dcc9ad] bg-white p-6 leading-8 shadow-sm md:grid-cols-[1.5fr_1fr]">
          <div className="space-y-4">
            {category.introduction.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <ul className="space-y-3">
            {category.highlights.map((highlight) => (
              <li className="rounded-md bg-[#f7f1e7] px-4 py-3 font-semibold" key={highlight}>
                {highlight}
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-5" aria-labelledby="category-products-title">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-[#a15c1b]">اختيارات سراج</p>
              <h2 className="text-2xl font-extrabold md:text-3xl" id="category-products-title">
                منتجات {category.name}
              </h2>
            </div>
            <Link className="font-bold text-[#1f7a5c]" href="/products">
              مشاهدة كل المنتجات
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <SeoProductCard key={product.slug} product={product} />
            ))}
          </div>
        </section>

        <section className="grid gap-6 rounded-lg border border-[#dcc9ad] bg-white p-6 shadow-sm lg:grid-cols-2">
          <div className="space-y-4">
            <p className="text-sm font-bold text-[#a15c1b]">دليل الاختيار</p>
            <h2 className="text-2xl font-extrabold">كيف تختارين الأنسب لطفلك؟</h2>
            {category.selectionGuide.map((paragraph) => (
              <p className="leading-8 text-[#5f5044]" key={paragraph}>
                {paragraph}
              </p>
            ))}
          </div>
          <div className="space-y-4" aria-labelledby="category-faq-title">
            <p className="text-sm font-bold text-[#a15c1b]">أسئلة شائعة</p>
            <h2 className="text-2xl font-extrabold" id="category-faq-title">
              قبل اختيار المنتج
            </h2>
            <dl className="space-y-4">
              {category.faqs.map((faq) => (
                <div className="rounded-md bg-[#f7f1e7] p-4" key={faq.question}>
                  <dt className="font-extrabold">{faq.question}</dt>
                  <dd className="mt-2 leading-7 text-[#5f5044]">{faq.answer}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <div className="rounded-lg bg-[#26170f] p-6 text-white">
          <h2 className="text-2xl font-extrabold">اختَر التجربة المناسبة لطفلك</h2>
          <p className="mt-2 max-w-2xl leading-8 text-white/80">
            افتح المتجر الكامل لمشاهدة الصور والتفاصيل وإضافة اختيارك إلى السلة.
          </p>
          <Link
            className="mt-4 inline-flex rounded-md bg-[#d89b45] px-5 py-3 font-bold text-[#26170f]"
            href="/index.html#/products"
          >
            فتح متجر سراج
          </Link>
        </div>
      </div>
    </main>
  );
}
