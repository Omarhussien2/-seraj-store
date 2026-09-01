import type { Metadata } from "next";
import Link from "next/link";
import { merchantReturnPolicy } from "@/lib/commercePolicies";
import {
  DEFAULT_SOCIAL_IMAGE,
  jsonLd,
  siteUrl,
} from "@/lib/seoContent";

export const metadata: Metadata = {
  title: "سياسة الاسترجاع والاستبدال",
  description:
    "تعرف على مدة طلب الاسترجاع أو الاستبدال وكيفية التواصل مع فريق سراج لمراجعة طلبك.",
  alternates: { canonical: siteUrl("/returns") },
  openGraph: {
    title: "سياسة الاسترجاع والاستبدال | سراج",
    description:
      "تفاصيل مدة وخطوات طلب الاسترجاع أو الاستبدال لدى سراج.",
    url: siteUrl("/returns"),
    type: "website",
    images: [DEFAULT_SOCIAL_IMAGE],
  },
};

const returnPageJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": siteUrl("/#organization"),
  name: "سِراج",
  url: siteUrl("/"),
  hasMerchantReturnPolicy: merchantReturnPolicy,
};

export default function ReturnPolicyPage() {
  return (
    <main className="min-h-screen bg-[#f7f1e7] px-4 py-8 text-[#26170f]" dir="rtl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(returnPageJsonLd) }}
      />
      <article className="mx-auto max-w-3xl space-y-8">
        <header className="space-y-4">
          <Link className="text-sm font-semibold text-[#1f7a5c]" href="/">
            الرجوع إلى سراج
          </Link>
          <p className="text-sm font-bold text-[#a15c1b]">حقوق العميل</p>
          <h1 className="text-3xl font-extrabold md:text-5xl">سياسة الاسترجاع والاستبدال</h1>
          <p className="text-lg leading-8 text-[#5f5044]">
            يمكنك طلب استرجاع أو استبدال المنتج خلال 14 يومًا.
          </p>
        </header>

        <section className="space-y-4 rounded-lg border border-[#dcc9ad] bg-white p-6 leading-8 shadow-sm">
          <h2 className="text-2xl font-extrabold">طريقة تقديم الطلب</h2>
          <p>
            تواصل مع فريق سراج خلال مدة الـ14 يومًا، واذكر رقم الطلب والمنتج
            المطلوب استرجاعه أو استبداله حتى يتمكن الفريق من مراجعة الطلب معك.
          </p>
          <p>
            ستُراجع تفاصيل كل حالة مع العميل قبل تأكيد الإجراء المناسب. للحصول
            على مساعدة سريعة يمكنك استخدام رقم واتساب الموجود في صفحة التواصل.
          </p>
        </section>

        <nav className="flex flex-wrap gap-3" aria-label="روابط سياسات المتجر">
          <Link className="rounded-md bg-[#1f7a5c] px-5 py-3 font-bold text-white" href="/contact">
            تواصل مع خدمة العملاء
          </Link>
          <Link className="rounded-md border border-[#1f7a5c] px-5 py-3 font-bold text-[#1f7a5c]" href="/shipping">
            سياسة الشحن والتوصيل
          </Link>
        </nav>
      </article>
    </main>
  );
}
