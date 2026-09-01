import type { Metadata } from "next";
import Link from "next/link";
import {
  DELIVERY_ESTIMATE_BUSINESS_DAYS,
  FREE_SHIPPING_MINIMUM_EGP,
  merchantIdentity,
  SHIPPING_FEE_EGP,
  shippingService,
} from "@/lib/commercePolicies";
import {
  DEFAULT_SOCIAL_IMAGE,
  jsonLd,
  siteUrl,
} from "@/lib/seoContent";

export const metadata: Metadata = {
  title: "سياسة الشحن والتوصيل",
  description:
    "تعرف على تكلفة الشحن داخل مصر، حد الشحن المجاني، والمدة المتوقعة لوصول طلبات سراج.",
  alternates: { canonical: siteUrl("/shipping") },
  openGraph: {
    title: "سياسة الشحن والتوصيل | سراج",
    description:
      "تفاصيل تكلفة ومدة توصيل قصص وألعاب سراج داخل مصر.",
    url: siteUrl("/shipping"),
    type: "website",
    images: [DEFAULT_SOCIAL_IMAGE],
  },
};

const shippingPageJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": siteUrl("/#organization"),
  name: "سِراج",
  ...merchantIdentity,
  url: siteUrl("/"),
  hasShippingService: shippingService,
};

export default function ShippingPolicyPage() {
  return (
    <main className="min-h-screen bg-[#f7f1e7] px-4 py-8 text-[#26170f]" dir="rtl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(shippingPageJsonLd) }}
      />
      <article className="mx-auto max-w-3xl space-y-8">
        <header className="space-y-4">
          <Link className="text-sm font-semibold text-[#1f7a5c]" href="/">
            الرجوع إلى سراج
          </Link>
          <p className="text-sm font-bold text-[#a15c1b]">معلومات الطلب</p>
          <h1 className="text-3xl font-extrabold md:text-5xl">سياسة الشحن والتوصيل</h1>
          <p className="text-lg leading-8 text-[#5f5044]">
            نشحن طلبات سراج داخل مصر إلى العنوان المسجل عند إتمام الطلب.
          </p>
        </header>

        <section className="grid gap-4 sm:grid-cols-3" aria-label="ملخص الشحن">
          <div className="rounded-lg border border-[#dcc9ad] bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-[#67594e]">تكلفة الشحن</p>
            <p className="mt-2 text-2xl font-extrabold">{SHIPPING_FEE_EGP} جنيه</p>
          </div>
          <div className="rounded-lg border border-[#dcc9ad] bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-[#67594e]">الشحن المجاني</p>
            <p className="mt-2 text-2xl font-extrabold">
              من {FREE_SHIPPING_MINIMUM_EGP} جنيه
            </p>
          </div>
          <div className="rounded-lg border border-[#dcc9ad] bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-[#67594e]">الوصول المعتاد</p>
            <p className="mt-2 text-2xl font-extrabold">
              {DELIVERY_ESTIMATE_BUSINESS_DAYS.min}–{DELIVERY_ESTIMATE_BUSINESS_DAYS.max} أيام عمل
            </p>
          </div>
        </section>

        <section className="space-y-4 rounded-lg bg-white p-6 leading-8 shadow-sm">
          <h2 className="text-2xl font-extrabold">كيف تُحسب التكلفة؟</h2>
          <p>
            تكلفة التوصيل القياسية داخل مصر هي {SHIPPING_FEE_EGP} جنيه. عندما
            تصل قيمة المنتجات في الطلب إلى {FREE_SHIPPING_MINIMUM_EGP} جنيه أو
            أكثر يصبح الشحن مجانيًا.
          </p>
          <p>
            يصل الطلب عادةً خلال {DELIVERY_ESTIMATE_BUSINESS_DAYS.min} إلى{" "}
            {DELIVERY_ESTIMATE_BUSINESS_DAYS.max} أيام عمل. إذا احتجت متابعة
            الطلب أو تعديل بيانات العنوان، تواصل مع فريق سراج عبر صفحة التواصل.
          </p>
        </section>

        <nav className="flex flex-wrap gap-3" aria-label="روابط سياسات المتجر">
          <Link className="rounded-md bg-[#1f7a5c] px-5 py-3 font-bold text-white" href="/contact">
            تواصل معنا
          </Link>
          <Link className="rounded-md border border-[#1f7a5c] px-5 py-3 font-bold text-[#1f7a5c]" href="/returns">
            سياسة الاسترجاع والاستبدال
          </Link>
        </nav>
      </article>
    </main>
  );
}
