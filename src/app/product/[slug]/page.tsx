import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  encodedPath,
  getActiveProduct,
  jsonLd,
  productDescription,
  productImageUrl,
  siteUrl,
} from "@/lib/seoContent";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getActiveProduct(decodeURIComponent(slug));

  if (!product) {
    return {
      title: "المنتج غير موجود | سراج",
      robots: { index: false, follow: true },
    };
  }

  const path = encodedPath("/product", product.slug);
  const description = productDescription(product);

  return {
    title: `${product.name} | سراج`,
    description,
    alternates: { canonical: siteUrl(path) },
    openGraph: {
      title: `${product.name} | سراج`,
      description,
      url: siteUrl(path),
      type: "website",
      locale: "ar_EG",
      siteName: "سراج",
      images: [{ url: productImageUrl(product), alt: product.name }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.name} | سراج`,
      description,
      images: [productImageUrl(product)],
    },
  };
}

export default async function ProductSeoPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getActiveProduct(decodeURIComponent(slug));
  if (!product) notFound();

  const productPath = encodedPath("/product", product.slug);
  const image = productImageUrl(product);
  const description = productDescription(product);
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description,
    image,
    url: siteUrl(productPath),
    brand: { "@type": "Brand", name: "سراج" },
    offers: {
      "@type": "Offer",
      priceCurrency: "EGP",
      price: product.price,
      availability: "https://schema.org/InStock",
      url: siteUrl(productPath),
    },
  };

  return (
    <main className="min-h-screen bg-[#f7f1e7] px-4 py-8 text-[#26170f]" dir="rtl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(productJsonLd) }}
      />
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_1.05fr] lg:items-start">
        <section className="space-y-4">
          <Link className="text-sm font-semibold text-[#1f7a5c]" href="/products">
            كل المنتجات
          </Link>
          <div className="overflow-hidden rounded-lg border border-[#dcc9ad] bg-white shadow-sm">
            <img alt={product.name} className="w-full object-cover" src={image} />
          </div>
        </section>

        <article className="space-y-6">
          <div className="space-y-3">
            {product.badge && (
              <p className="text-sm font-bold text-[#a15c1b]">{product.badge}</p>
            )}
            <h1 className="text-3xl font-extrabold leading-tight md:text-5xl">
              {product.name}
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-[#5f5044]">{description}</p>
          </div>

          <div className="rounded-lg border border-[#dcc9ad] bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-[#67594e]">السعر</p>
            <div className="mt-1 flex flex-wrap items-end gap-3">
              <strong className="text-3xl text-[#8a4316]">
                {product.priceText || `${product.price} ج.م`}
              </strong>
              {product.originalPriceText && (
                <span className="text-lg text-[#8b7b6e] line-through">
                  {product.originalPriceText}
                </span>
              )}
            </div>
          </div>

          {product.longDesc && (
            <section className="space-y-2">
              <h2 className="text-2xl font-extrabold">عن المنتج</h2>
              <p className="whitespace-pre-line leading-8 text-[#4f4036]">
                {product.longDesc}
              </p>
            </section>
          )}

          {Boolean(product.features?.length) && (
            <section className="space-y-3">
              <h2 className="text-2xl font-extrabold">مميزات المنتج</h2>
              <ul className="grid gap-2 sm:grid-cols-2">
                {product.features?.map((feature) => (
                  <li className="rounded-md bg-white px-4 py-3 shadow-sm" key={feature}>
                    {feature}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="flex flex-wrap gap-3">
            <Link
              className="rounded-md bg-[#1f7a5c] px-5 py-3 font-bold text-white"
              href={`/index.html#/product/${product.slug}`}
            >
              افتح المنتج في المتجر
            </Link>
            <Link
              className="rounded-md border border-[#1f7a5c] px-5 py-3 font-bold text-[#1f7a5c]"
              href="/index.html#/cart"
            >
              السلة
            </Link>
          </div>
        </article>
      </div>
    </main>
  );
}
