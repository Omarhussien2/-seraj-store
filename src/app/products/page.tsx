import type { Metadata } from "next";
import Link from "next/link";
import {
  getActiveProducts,
  productDescription,
  productImageUrl,
  siteUrl,
} from "@/lib/seoContent";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const metadata: Metadata = {
  title: "منتجات سراج | قصص وألعاب تعليمية للأطفال",
  description:
    "تصفح منتجات سراج من قصص مخصصة، قصص جاهزة، وأنشطة تعليمية للأطفال بجودة عالية ومحتوى عربي دافئ.",
  alternates: { canonical: siteUrl("/products") },
  openGraph: {
    title: "منتجات سراج | قصص وألعاب تعليمية للأطفال",
    description:
      "قصص مخصصة وجاهزة وأنشطة تعليمية للأطفال من سراج، مصنوعة بحب وجودة عالية.",
    url: siteUrl("/products"),
    type: "website",
  },
};

export default async function ProductsSeoPage() {
  const products = await getActiveProducts();

  return (
    <main className="min-h-screen bg-[#f7f1e7] px-4 py-8 text-[#26170f]" dir="rtl">
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

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <article
              className="overflow-hidden rounded-lg border border-[#dcc9ad] bg-white shadow-sm"
              key={product.slug}
            >
              <img
                alt={product.name}
                className="h-56 w-full object-cover"
                loading="lazy"
                src={productImageUrl(product)}
              />
              <div className="space-y-3 p-5">
                {product.badge && (
                  <p className="text-sm font-bold text-[#1f7a5c]">{product.badge}</p>
                )}
                <h2 className="text-xl font-extrabold">{product.name}</h2>
                <p className="min-h-16 text-sm leading-7 text-[#67594e]">
                  {productDescription(product)}
                </p>
                <div className="flex items-center justify-between gap-3">
                  <strong className="text-lg text-[#8a4316]">
                    {product.priceText || `${product.price} ج.م`}
                  </strong>
                  <Link
                    className="rounded-md bg-[#1f7a5c] px-4 py-2 text-sm font-bold text-white"
                    href={`/product/${encodeURIComponent(product.slug)}`}
                  >
                    تفاصيل المنتج
                  </Link>
                </div>
              </div>
            </article>
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
