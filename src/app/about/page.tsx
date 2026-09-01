import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { DEFAULT_SOCIAL_IMAGE, jsonLd, siteUrl } from "@/lib/seoContent";

export const metadata: Metadata = {
  title: "حكاية سراج وعيلته",
  description:
    "تعرف على عالم سراج وعيلته، وكيف نحول القراءة والقيم والتاريخ إلى قصص عربية ومغامرات يحبها الأطفال.",
  alternates: { canonical: siteUrl("/about") },
  openGraph: {
    title: "حكاية سراج وعيلته | قصص أطفال عربية",
    description:
      "عالم عربي يجمع بين الخيال والمعرفة والقيم ليصنع للأطفال أبطالًا حقيقيين.",
    url: siteUrl("/about"),
    type: "website",
    images: [DEFAULT_SOCIAL_IMAGE],
  },
};

const aboutPageJsonLd = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  name: "حكاية سراج وعيلته",
  description: metadata.description,
  url: siteUrl("/about"),
  inLanguage: "ar-EG",
  isPartOf: { "@id": siteUrl("/#website") },
  about: { "@id": siteUrl("/#organization") },
  primaryImageOfPage: siteUrl("/assets/family-group.webp"),
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#f7f1e7] px-4 py-8 text-[#26170f]" dir="rtl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(aboutPageJsonLd) }}
      />
      <div className="mx-auto max-w-5xl space-y-10">
        <header className="space-y-4">
          <Link className="text-sm font-semibold text-[#1f7a5c]" href="/#/home">
            الرجوع للمتجر
          </Link>
          <p className="text-sm font-bold text-[#a15c1b]">من قلب قرية الابتكار</p>
          <h1 className="text-3xl font-extrabold md:text-5xl">حكاية سراج وعيلته</h1>
          <p className="max-w-3xl text-lg leading-8 text-[#5f5044]">
            بدأنا من سؤال بسيط: إزاي نخلي الطفل يحب القراءة زي اللعب؟ ومن هنا
            اتولد عالم سراج؛ عالم عربي يجمع الخيال والمعرفة والقيم في مغامرات
            يكون الطفل جزءًا منها.
          </p>
        </header>

        <section className="grid items-center gap-8 rounded-2xl border border-[#dcc9ad] bg-white p-5 shadow-sm md:grid-cols-2 md:p-8">
          <Image
            alt="عائلة سراج"
            className="w-full rounded-xl object-cover"
            height={896}
            priority
            src="/assets/family-group.webp"
            unoptimized
            width={1200}
          />
          <div className="space-y-4 leading-8 text-[#5f5044]">
            <h2 className="text-2xl font-extrabold text-[#26170f]">بطل من نوع مختلف</h2>
            <p>
              كان سراج ولدًا عاديًا من أسرة استثنائية؛ والده عمر مؤرخ يبحث في
              سير أبطال المسلمين، ووالدته تُقى عالمة اخترعت آلة الزمن لتكون
              جسرًا بين الماضي والحاضر.
            </p>
            <p>
              بعد أن وجد نفسه في جسد أرنب أخضر، بدأت رحلته بين عالمنا الحديث
              وعالم المعرفة؛ ليعيد للأطفال متعة الحكاية ويعرّفهم بأبطال حقيقيين.
            </p>
          </div>
        </section>

        <section className="space-y-4 rounded-2xl bg-[#e9f4df] p-6 md:p-8">
          <h2 className="text-2xl font-extrabold">ماذا نصنع في سراج؟</h2>
          <p className="max-w-4xl leading-8 text-[#5f5044]">
            نصنع قصصًا عربية مخصصة باسم وصورة الطفل، وكتبًا جاهزة، وأنشطة
            تعليمية تساعده على حب القراءة وبناء شخصيته بطريقة دافئة وممتعة.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              className="rounded-md bg-[#1f7a5c] px-5 py-3 font-bold text-white"
              href="/products"
            >
              استكشف المنتجات
            </Link>
            <Link
              className="rounded-md border border-[#1f7a5c] px-5 py-3 font-bold text-[#1f7a5c]"
              href="/mama-world"
            >
              اقرأ عالم ماما وبابا
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
