import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  googleProductCategoryId,
  GOOGLE_PRODUCT_TAXONOMY_URL,
} from "@/lib/googleProductCategories";
import {
  RETURN_POLICY_ID,
  SHIPPING_SERVICE_ID,
} from "@/lib/commercePolicies";
import { seoCategoryForProduct } from "@/lib/seoCategories";
import {
  CUSTOM_STORY_SLUG,
  GIFT_PAGE_PATH,
  HOW_IT_WORKS_PATH,
  personalizedStoryFaqs,
  personalizedStoryProofPoints,
  personalizedStoryProductCopy,
} from "@/lib/personalizedStoryContent";
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

const CUSTOM_STORY_SEO_TITLE = "قصة أطفال مخصصة باسم وصورة طفلك في مصر";
const CUSTOM_STORY_H1 = "قصة تُكتب لطفلك من البداية";

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getActiveProduct(decodeURIComponent(slug));

  if (!product) {
    return {
      title: "المنتج غير موجود",
      robots: { index: false, follow: true },
    };
  }

  const path = encodedPath("/product", product.slug);
  const isCustomStory = product.slug === CUSTOM_STORY_SLUG;
  const title = isCustomStory ? CUSTOM_STORY_SEO_TITLE : product.name;
  const description = isCustomStory
    ? "قصة سراج المخصصة: بتتكتب لطفلك من البداية حسب القيمة اللي تختارها، مع تصميم شخصية متكامل وعينة تعتمدها قبل استكمال القصة، وإهداء وتوصيل داخل مصر."
    : productDescription(product);

  return {
    title,
    description,
    alternates: { canonical: siteUrl(path) },
    openGraph: {
      title: `${title} | سراج`,
      description,
      url: siteUrl(path),
      type: "website",
      locale: "ar_EG",
      siteName: "سراج",
      images: [{ url: productImageUrl(product), alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | سراج`,
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
  const category = seoCategoryForProduct(product);
  const googleCategoryId = googleProductCategoryId(product);
  const image = productImageUrl(product);
  const isCustomStory = product.slug === CUSTOM_STORY_SLUG;
  const displayName = isCustomStory ? personalizedStoryProductCopy.name : product.name;
  const displayLongDescription = isCustomStory
    ? personalizedStoryProductCopy.longDescription
    : product.longDesc;
  const displayFeatures = isCustomStory
    ? personalizedStoryProductCopy.features
    : product.features;
  const description = isCustomStory
    ? "قصة سراج المخصصة: بتتكتب لطفلك من البداية حسب القيمة اللي تختارها، مع تصميم شخصية متكامل وعينة تعتمدها قبل استكمال القصة، وإهداء وتوصيل داخل مصر."
    : productDescription(product);
  const offer =
    product.price > 0 && product.action !== "none"
      ? {
          "@type": "Offer",
          priceCurrency: "EGP",
          price: product.price,
          availability: product.comingSoon
            ? "https://schema.org/PreOrder"
            : "https://schema.org/InStock",
          itemCondition: "https://schema.org/NewCondition",
          url: siteUrl(productPath),
          seller: { "@id": `${siteUrl("/")}#organization` },
          shippingDetails: {
            "@type": "OfferShippingDetails",
            hasShippingService: { "@id": SHIPPING_SERVICE_ID },
          },
          hasMerchantReturnPolicy: { "@id": RETURN_POLICY_ID },
        }
      : undefined;
  const productJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        "@id": `${siteUrl(productPath)}#product`,
        name: displayName,
        sku: product.slug,
        description,
        image: [image],
        url: siteUrl(productPath),
        category: googleCategoryId
          ? {
              "@type": "CategoryCode",
              inCodeSet: GOOGLE_PRODUCT_TAXONOMY_URL,
              codeValue: googleCategoryId,
            }
          : undefined,
        brand: { "@type": "Brand", name: "سراج" },
        offers: offer,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "الرئيسية", item: siteUrl("/") },
          { "@type": "ListItem", position: 2, name: "المنتجات", item: siteUrl("/products") },
          ...(category
            ? [{
                "@type": "ListItem",
                position: 3,
                name: category.name,
                item: siteUrl(`/category/${category.slug}`),
              }]
            : []),
          {
            "@type": "ListItem",
            position: category ? 4 : 3,
            name: displayName,
            item: siteUrl(productPath),
          },
        ],
      },
    ],
  };

  return (
    <main className="min-h-screen bg-[#f7f1e7] px-4 py-8 text-[#26170f]" dir="rtl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(productJsonLd) }}
      />
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_1.05fr] lg:items-start">
        <section className="space-y-4">
          <nav className="flex flex-wrap gap-2 text-sm font-semibold text-[#1f7a5c]" aria-label="مسار التنقل">
            <Link href="/products">كل المنتجات</Link>
            {category && (
              <>
                <span aria-hidden="true">/</span>
                <Link href={`/category/${category.slug}`}>{category.name}</Link>
              </>
            )}
          </nav>
          <div className="overflow-hidden rounded-lg border border-[#dcc9ad] bg-white shadow-sm">
            <img alt={displayName} className="w-full object-cover" src={image} />
          </div>
        </section>

        <article className="space-y-6">
          <div className="space-y-3">
            {product.badge && (
              <p className="text-sm font-bold text-[#a15c1b]">{product.badge}</p>
            )}
            <h1 className="text-3xl font-extrabold leading-tight md:text-5xl">
              {isCustomStory ? CUSTOM_STORY_H1 : displayName}
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-[#5f5044]">
              {isCustomStory
                ? "احكيلنا عن طفلك والرسالة اللي تهمك — شجاعة، ثقة، صبر، حب تعلم، أو موقف خاص. نصمم له شخصية متكاملة، نرسل لك عينة لاعتمادها، ثم نحولها إلى حكاية عربية يكون هو بطلها."
                : description}
            </p>
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

          {displayLongDescription && (
            <section className="space-y-2">
              <h2 className="text-2xl font-extrabold">عن المنتج</h2>
              <p className="whitespace-pre-line leading-8 text-[#4f4036]">
                {displayLongDescription}
              </p>
            </section>
          )}

          {Boolean(displayFeatures?.length) && (
            <section className="space-y-3">
              <h2 className="text-2xl font-extrabold">مميزات المنتج</h2>
              <ul className="grid gap-2 sm:grid-cols-2">
                {displayFeatures?.map((feature) => (
                  <li className="rounded-md bg-white px-4 py-3 shadow-sm" key={feature}>
                    {feature}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {isCustomStory && (
            <>
              <section className="space-y-4" aria-labelledby="custom-story-facts-title">
                <h2 className="text-2xl font-extrabold" id="custom-story-facts-title">
                  إيه اللي بيميز الخدمة دي؟
                </h2>
                <ul className="space-y-2">
                  {personalizedStoryProofPoints.map((point) => (
                    <li className="rounded-md bg-white px-4 py-3 shadow-sm" key={point}>
                      {point}
                    </li>
                  ))}
                </ul>
              </section>

              <section className="space-y-4 rounded-lg border border-[#dcc9ad] bg-white p-5 shadow-sm">
                <h2 className="text-2xl font-extrabold">قبل ما تطلب</h2>
                <p className="leading-8 text-[#4f4036]">
                  عشان نجهز الحكاية، محتاجين من ولي الأمر: اسم الطفل وعمره،
                  القيمة أو الرسالة اللي تحب القصة تحملها، وصور واضحة لوجه الطفل.
                  وممكن كمان تختار إهداء يظهر في بداية القصة، وتحدد مستلم آخر
                  يستلم الهدية مباشرةً نيابةً عنك.
                </p>
                <p className="leading-8 text-[#4f4036]">
                  قبل استكمال القصة، بنرسل لولي الأمر عينة من تصميم الشخصية
                  (Character Sheet) للاعتماد. ولأن القصة بتُصنع خصيصًا لطفل بعينه،
                  فلها شروط استرجاع مختلفة عن باقي منتجات المتجر —{" "}
                  <Link className="font-bold text-[#1f7a5c]" href="/returns">
                    راجع سياسة الاسترجاع والاستبدال
                  </Link>
                  .
                </p>
                <div className="flex flex-wrap gap-3 pt-1">
                  <Link
                    className="rounded-md border border-[#1f7a5c] px-4 py-2 font-bold text-[#1f7a5c]"
                    href={HOW_IT_WORKS_PATH}
                  >
                    خطوات صناعة القصة بالتفصيل
                  </Link>
                  <Link
                    className="rounded-md border border-[#1f7a5c] px-4 py-2 font-bold text-[#1f7a5c]"
                    href={GIFT_PAGE_PATH}
                  >
                    ابعتها هدية لمستلم آخر
                  </Link>
                </div>
              </section>

              <section className="space-y-4" aria-labelledby="custom-story-faq-title">
                <h2 className="text-2xl font-extrabold" id="custom-story-faq-title">
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
            </>
          )}

          <div className="flex flex-wrap gap-3">
            <Link
              className="rounded-md bg-[#1f7a5c] px-5 py-3 font-bold text-white"
              href={`/index.html#/product/${encodeURIComponent(product.slug)}`}
            >
              {isCustomStory ? "ابدأ قصة طفلك في المتجر" : "افتح المنتج في المتجر"}
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
