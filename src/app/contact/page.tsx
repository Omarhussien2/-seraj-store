import type { Metadata } from "next";
import Link from "next/link";
import { jsonLd, siteUrl } from "@/lib/seoContent";

const supportPhone = "+201152806034";
const whatsappUrl = `https://wa.me/${supportPhone.replace("+", "")}`;

export const metadata: Metadata = {
  title: "تواصل مع سراج",
  description:
    "تواصل مع فريق سراج للاستفسار عن قصص الأطفال المخصصة، المنتجات التعليمية، الطلبات، والشحن داخل مصر.",
  alternates: { canonical: siteUrl("/contact") },
  openGraph: {
    title: "تواصل مع سراج",
    description: "فريق سراج جاهز لمساعدتك في المنتجات والطلبات عبر واتساب.",
    url: siteUrl("/contact"),
    type: "website",
  },
};

const contactPageJsonLd = {
  "@context": "https://schema.org",
  "@type": "ContactPage",
  name: "تواصل مع سراج",
  description: metadata.description,
  url: siteUrl("/contact"),
  inLanguage: "ar-EG",
  isPartOf: { "@id": siteUrl("/#website") },
  mainEntity: {
    "@type": "Organization",
    "@id": siteUrl("/#organization"),
    name: "سِراج",
    telephone: supportPhone,
    contactPoint: {
      "@type": "ContactPoint",
      telephone: supportPhone,
      contactType: "customer service",
      areaServed: "EG",
      availableLanguage: ["Arabic"],
    },
  },
};

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[#f7f1e7] px-4 py-8 text-[#26170f]" dir="rtl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(contactPageJsonLd) }}
      />
      <div className="mx-auto max-w-3xl space-y-8">
        <header className="space-y-4">
          <Link className="text-sm font-semibold text-[#1f7a5c]" href="/#/home">
            الرجوع للمتجر
          </Link>
          <p className="text-sm font-bold text-[#a15c1b]">نحن هنا لمساعدتك</p>
          <h1 className="text-3xl font-extrabold md:text-5xl">تواصل مع سراج</h1>
          <p className="text-lg leading-8 text-[#5f5044]">
            عندك سؤال عن قصة مخصصة، منتج، طلب، أو شحن؟ تواصل مع فريق سراج عبر
            واتساب وسنساعدك.
          </p>
        </header>

        <section className="space-y-5 rounded-2xl border border-[#dcc9ad] bg-white p-6 shadow-sm md:p-8">
          <h2 className="text-2xl font-extrabold">خدمة العملاء</h2>
          <p className="leading-8 text-[#5f5044]">
            رقم التواصل: <bdi dir="ltr">0115 280 6034</bdi>
          </p>
          <a
            className="inline-flex rounded-md bg-[#1f7a5c] px-5 py-3 font-bold text-white"
            href={whatsappUrl}
            rel="noopener noreferrer"
            target="_blank"
          >
            ابدأ محادثة واتساب
          </a>
        </section>

        <nav className="flex flex-wrap gap-3" aria-label="روابط مساعدة">
          <Link
            className="rounded-md border border-[#dcc9ad] bg-white px-4 py-3 font-bold"
            href="/products"
          >
            تصفح المنتجات
          </Link>
          <Link
            className="rounded-md border border-[#dcc9ad] bg-white px-4 py-3 font-bold"
            href="/about"
          >
            تعرف على سراج
          </Link>
        </nav>
      </div>
    </main>
  );
}
