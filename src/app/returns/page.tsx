import type { Metadata } from "next";
import Link from "next/link";
import {
  DEFECT_RETURN_WINDOW_DAYS,
  merchantIdentity,
  merchantReturnPolicy,
  REFUND_PROCESSING_DAYS,
  RETURN_WINDOW_DAYS,
} from "@/lib/commercePolicies";
import {
  DEFAULT_SOCIAL_IMAGE,
  jsonLd,
  siteUrl,
} from "@/lib/seoContent";

export const metadata: Metadata = {
  title: "سياسة الاسترجاع والاستبدال",
  description:
    "سياسة سراج لاسترجاع واستبدال الألعاب والمنتجات غير المخصصة، وحقوق العميل عند وجود عيب في القصص والكتب المخصصة.",
  alternates: { canonical: siteUrl("/returns") },
  openGraph: {
    title: "سياسة الاسترجاع والاستبدال | سراج",
    description:
      "تفاصيل المدد والشروط وخطوات طلب الاسترجاع أو الاستبدال لدى سراج.",
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
  ...merchantIdentity,
  url: siteUrl("/"),
  hasMerchantReturnPolicy: merchantReturnPolicy,
};

const whatsappUrl = "https://wa.me/201152806034";

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
            في سِراج بنجهّز كل طلب بعناية، وهدفنا إن المنتج يوصلك زي ما اتفقنا
            بالضبط. ولو حصل عيب أو خطأ من عندنا، حقك محفوظ بالكامل.
          </p>
          <p className="text-sm font-semibold text-[#67594e]">آخر تحديث: 1 سبتمبر 2026</p>
        </header>

        <section id="policy" className="space-y-5 rounded-lg border border-[#dcc9ad] bg-white p-6 leading-8 shadow-sm">
          <h2 className="text-2xl font-extrabold">المنتجات غير المخصصة</h2>
          <p>
            يمكن استرجاع أو استبدال الألعاب والمنتجات غير المخصصة خلال {RETURN_WINDOW_DAYS} يومًا
            من تاريخ الاستلام، من غير إبداء سبب ومن غير مصروفات إضافية، بشرط أن
            يكون المنتج غير مستخدم وبحالته وتغليفه الأصليين ومعه كل مكوناته.
          </p>
        </section>

        <section className="space-y-5 rounded-lg border border-[#dcc9ad] bg-white p-6 leading-8 shadow-sm">
          <h2 className="text-2xl font-extrabold">القصص المخصصة والكتب</h2>
          <p>
            القصص والمنتجات المصنوعة باسم أو صورة الطفل لا يمكن استرجاعها أو
            استبدالها لمجرد تغيير الرأي إذا نُفذت طبقًا للبيانات أو البروفة التي
            أكدها العميل. وينطبق ذلك أيضًا على الكتب الجاهزة.
          </p>
          <p>
            يُرجى مراجعة الاسم والصورة وباقي البيانات بعناية قبل التأكيد. الخطأ
            في البيانات التي أرسلها العميل واعتمدها لا يُعد عيبًا في المنتج.
          </p>
        </section>

        <section className="space-y-5 rounded-lg border border-[#dcc9ad] bg-white p-6 leading-8 shadow-sm">
          <h2 className="text-2xl font-extrabold">لو المنتج فيه عيب أو خطأ</h2>
          <p>
            إذا وصل المنتج تالفًا، أو به عيب في الطباعة أو التصنيع، أو مختلفًا
            عن الطلب المؤكد، يمكنك خلال {DEFECT_RETURN_WINDOW_DAYS} يومًا من الاستلام اختيار
            إعادة التنفيذ أو الاستبدال أو استرداد المبلغ كاملًا، من غير أي
            مصروفات إضافية. ويتحمل سِراج تكلفة استلام المنتج في هذه الحالات.
          </p>
        </section>

        <section className="space-y-5 rounded-lg border border-[#dcc9ad] bg-white p-6 leading-8 shadow-sm">
          <h2 className="text-2xl font-extrabold">طريقة تقديم الطلب ورد المبلغ</h2>
          <ol className="list-decimal space-y-2 pr-6">
            <li>
              تواصل معنا عبر واتساب على رقم <bdi dir="ltr">0115 280 6034</bdi>،
              واذكر رقم الطلب والمنتج المطلوب استرجاعه أو استبداله.
            </li>
            <li>أرسل صورًا واضحة توضح حالة المنتج أو العيب إن وُجد.</li>
            <li>
              بعد مراجعة الطلب، يرسل فريق سِراج ملصق الإرجاع المجاني أو تعليمات
              الاستلام اللازمة، ويرتب استلام المنتج عن طريق شركة الشحن.
            </li>
          </ol>
          <p>
            لا توجد رسوم إعادة تخزين. يُرد المبلغ بنفس وسيلة الدفع خلال
            {" "}{REFUND_PROCESSING_DAYS} أيام، أو بتحويل متفق عليه مع العميل إذا تعذّر استخدام
            وسيلة الدفع الأصلية.
          </p>
          <a
            className="inline-flex rounded-md bg-[#1f7a5c] px-5 py-3 font-bold text-white"
            href={whatsappUrl}
            rel="noopener noreferrer"
            target="_blank"
          >
            ابدأ طلب الاسترجاع عبر واتساب
          </a>
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
