import type { Metadata } from "next";
import Link from "next/link";
import SeoProductCard from "@/components/seo/SeoProductCard";
import { SEO_CATEGORIES } from "@/lib/seoCategories";
import {
  DEFAULT_SOCIAL_IMAGE,
  getActiveProducts,
  jsonLd,
  siteUrl,
} from "@/lib/seoContent";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const metadata: Metadata = {
  title: "قصص أطفال وألعاب تعليمية وإسلامية وقصص مخصصة",
  description:
    "تصفح قصص الأطفال العربية والإسلامية، وبازل السيرة وقصص القرآن وألعاب الحساب، وقصص مخصصة باسم وصورة طفلك من متجر سراج.",
  alternates: { canonical: siteUrl("/products") },
  openGraph: {
    title: "منتجات سراج | قصص وألعاب تعليمية للأطفال",
    description:
      "قصص مخصصة وجاهزة وأنشطة تعليمية للأطفال من سراج، مصنوعة بحب وجودة عالية.",
    url: siteUrl("/products"),
    type: "website",
    images: [DEFAULT_SOCIAL_IMAGE],
  },
};

export default async function ProductsSeoPage() {
  const products = await getActiveProducts();
  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "منتجات سراج",
    description: metadata.description,
    url: siteUrl("/products"),
    inLanguage: "ar-EG",
    mainEntity: {
      "@type": "ItemList",
      itemListElement: products.map((product, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: product.name,
        url: siteUrl(`/product/${encodeURIComponent(product.slug)}`),
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
          <Link className="text-sm font-semibold text-[#1f7a5c]" href="/index.html#/home">
            الرجوع للمتجر
          </Link>
          <div className="space-y-3">
            <p className="text-sm font-bold text-[#a15c1b]">سراج للأطفال</p>
            <h1 className="max-w-3xl text-3xl font-extrabold md:text-5xl">
              منتجات سراج
            </h1>
            <p className="max-w-3xl text-lg leading-8 text-[#5f5044]">
              قصص عربية مخصصة، كتب جاهزة، وألعاب تعليمية تساعد الطفل يحب القراءة
              ويتعلم القيم بطريقة ممتعة.
            </p>
          </div>
        </header>

        <nav className="grid gap-3 sm:grid-cols-3" aria-label="فئات منتجات سراج">
          {SEO_CATEGORIES.map((category) => (
            <Link
              className="rounded-lg border border-[#dcc9ad] bg-white p-4 shadow-sm transition hover:border-[#1f7a5c]"
              href={`/category/${category.slug}`}
              key={category.slug}
            >
              <strong className="block text-lg text-[#1f7a5c]">{category.name}</strong>
              <span className="mt-1 block text-sm leading-6 text-[#67594e]">
                {category.eyebrow}
              </span>
            </Link>
          ))}
        </nav>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <SeoProductCard key={product.slug} product={product} />
          ))}
        </section>

        <div className="rounded-lg bg-[#26170f] p-6 text-white">
          <h2 className="text-2xl font-extrabold">جاهز تطلب؟</h2>
          <p className="mt-2 max-w-2xl leading-8 text-white/80">
            افتح تجربة المتجر الكاملة لاختيار المنتج، إضافة للسلة، وإتمام الطلب.
          </p>
          <Link
            className="mt-4 inline-flex rounded-md bg-[#d89b45] px-5 py-3 font-bold text-[#26170f]"
            href="/index.html#/products"
          >
            فتح المتجر
          </Link>
        </div>
      </div>
    </main>
  );
}
