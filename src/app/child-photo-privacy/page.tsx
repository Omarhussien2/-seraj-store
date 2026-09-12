import type { Metadata } from "next";
import Link from "next/link";
import { merchantIdentity } from "@/lib/commercePolicies";
import { DEFAULT_SOCIAL_IMAGE, jsonLd, siteUrl } from "@/lib/seoContent";

export const metadata: Metadata = {
  title: "سياسة خصوصية وحماية صور الأطفال | سراج",
  description:
    "تعرف على سياسة سراج الصارمة في حماية وخصوصية صور الأطفال: استخدام الصور فقط لتصميم شخصية القصة، عدم تدريب نماذج الذكاء الاصطناعي العامة، وحذف تلقائي خلال 30 يوماً أو فوراً بطلب ولي الأمر.",
  alternates: { canonical: siteUrl("/child-photo-privacy") },
  openGraph: {
    title: "سياسة خصوصية وحماية صور الأطفال | سراج",
    description:
      "نلتزم بأعلى معايير الأمان لحماية صور أطفالكم: خصوصية تامة، عدم بيع أو مشاركة، وحذف تلقائي خلال 30 يوماً من استلام القصة أو فوراً عند الطلب.",
    url: siteUrl("/child-photo-privacy"),
    type: "website",
    locale: "ar_EG",
    siteName: "سراج",
    images: [DEFAULT_SOCIAL_IMAGE],
  },
};

const pageUrl = siteUrl("/child-photo-privacy");

const privacyPageJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": `${pageUrl}#webpage`,
      name: "سياسة خصوصية وحماية صور الأطفال",
      description: metadata.description,
      url: pageUrl,
      inLanguage: "ar-EG",
      isPartOf: { "@id": siteUrl("/#website") },
      about: { "@id": siteUrl("/#organization") },
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "الرئيسية", item: siteUrl("/") },
        {
          "@type": "ListItem",
          position: 2,
          name: "القصة المخصصة",
          item: siteUrl("/category/personalized-stories"),
        },
        {
          "@type": "ListItem",
          position: 3,
          name: "خصوصية صور الأطفال",
          item: pageUrl,
        },
      ],
    },
    {
      "@type": "Organization",
      "@id": siteUrl("/#organization"),
      name: "سِراج",
      ...merchantIdentity,
      url: siteUrl("/"),
    },
  ],
};

const whatsappNumber = "01152806034";
const whatsappUrl = `https://wa.me/20${whatsappNumber.slice(1)}?text=${encodeURIComponent(
  "السلام عليكم، أرغب في الاستفسار عن سياسة خصوصية الصور / طلب حذف صور طفلي من سجلاتكم."
)}`;

export default function ChildPhotoPrivacyPage() {
  return (
    <main className="min-h-screen bg-[#f7f1e7] px-4 py-8 text-[#26170f]" dir="rtl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(privacyPageJsonLd) }}
      />
      <article className="mx-auto max-w-3xl space-y-8">
        <header className="space-y-4">
          <nav className="flex flex-wrap gap-2 text-sm font-semibold text-[#1f7a5c]" aria-label="مسار التنقل">
            <Link href="/">الرئيسية</Link>
            <span aria-hidden="true">/</span>
            <Link href="/category/personalized-stories">القصة المخصصة</Link>
            <span aria-hidden="true">/</span>
            <span className="text-[#67594e]">خصوصية صور الأطفال</span>
          </nav>
          <p className="text-sm font-bold text-[#a15c1b]">أمان طفلك أولويتنا المطلقة</p>
          <h1 className="text-3xl font-extrabold leading-tight md:text-5xl">
            سياسة خصوصية وحماية صور الأطفال
          </h1>
          <p className="text-lg leading-8 text-[#5f5044]">
            في سِراج، ندرك تماماً قيمة وأهمية خصوصية صور أطفالكم. نتعامل مع كل صورة
            بأقصى درجات المسؤولية والأمان والسرية منذ لحظة رفعها وحتى حذفها النهائي.
          </p>
          <p className="text-sm font-semibold text-[#67594e]">آخر تحديث: سبتمبر 2026</p>
        </header>

        {/* 1. Our core commitment */}
        <section className="space-y-4 rounded-2xl border border-[#dcc9ad] bg-white p-6 leading-8 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1f7a5c]/10 text-xl font-extrabold text-[#1f7a5c]">
              ١
            </span>
            <h2 className="text-2xl font-extrabold">التزامنا الأساسي تجاه خصوصية طفلك</h2>
          </div>
          <p>
            أمان طفلك الرقمي ليس مجرد ميزة إضافية، بل هو الركيزة الأساسية في نموذج عملنا.
            عندما تشاركونا صور طفلكم لصناعة قصته المخصصة، فإننا نعتبر هذه أمانة شخصية.
            نحن ملتزمون بحماية هذه الصور وعدم استخدامها في أي غرض تجاري، تسويقي، أو تقني خارج نطاق
            تنفيذ كتابكم المخصص.
          </p>
        </section>

        {/* 2. How photos are used */}
        <section className="space-y-4 rounded-2xl border border-[#dcc9ad] bg-white p-6 leading-8 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1f7a5c]/10 text-xl font-extrabold text-[#1f7a5c]">
              ٢
            </span>
            <h2 className="text-2xl font-extrabold">فيمَ تُستخدم صور طفلك؟</h2>
          </div>
          <p>
            تُستخدم الصور المرفوعة حصرياً ولغرض واحد فقط:
          </p>
          <ul className="list-disc space-y-2 pr-6">
            <li>
              <strong>تصميم وتطوير ورقة الشخصية (Character Sheet):</strong> استخلاص ملامح الطفل الكرتونية اللطيفة (لون العينين، تسريحة الشعر، والابتسامة المميزة) لدمجها كبطل في رسومات صفحات القصة.
            </li>
            <li>
              <strong>عرض عينة الشخصية للاعتماد:</strong> إرسال عينة من تصميم الشخصية لولي الأمر لمراجعتها والتأكد من مطابقتها وتفاصيلها قبل الشروع في طباعة وتجليد الكتاب.
            </li>
          </ul>
        </section>

        {/* 3. What we NEVER do */}
        <section className="space-y-4 rounded-2xl border border-[#e5a882] bg-[#fffaf5] p-6 leading-8 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#a15c1b]/15 text-xl font-extrabold text-[#a15c1b]">
              ٣
            </span>
            <h2 className="text-2xl font-extrabold text-[#26170f]">ما الذي لا نفعله أبداً بصور طفلك؟</h2>
          </div>
          <p className="font-semibold text-[#87460e]">
            خطوط حمراء لا نتنازل عنها تحت أي ظرف:
          </p>
          <ul className="list-disc space-y-2.5 pr-6">
            <li>
              <strong>لا نستخدم الصور لتدريب نماذج الذكاء الاصطناعي العامة:</strong> ملفات وصور طفلك لا تدخل في أي مجموعات تدريب أو تحسين لنماذج عامة مفتوحة.
            </li>
            <li>
              <strong>لا نبيع أو نؤجر البيانات نهائياً:</strong> لا نشارك، ولا نبيع، ولا نمنح أي حق وصول لشركات إعلانات أو أطراف ترويجية خارجية.
            </li>
            <li>
              <strong>لا ننشر صور الأطفال الحقيقية على منصاتنا العامة:</strong> لا ننشر الصور الحقيقية للطفل في وسائل التواصل الاجتماعي أو الإعلانات الترويجية إلا إذا تم منح موافقة كتابية صريحة ومستقلة من ولي الأمر.
            </li>
          </ul>
        </section>

        {/* 4. Retention & Auto-deletion */}
        <section className="space-y-4 rounded-2xl border border-[#dcc9ad] bg-white p-6 leading-8 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1f7a5c]/10 text-xl font-extrabold text-[#1f7a5c]">
              ٤
            </span>
            <h2 className="text-2xl font-extrabold">مدة الاحتفاظ بالصور وسياسة الحذف التلقائي</h2>
          </div>
          <p>
            نحن نؤمن بمبدأ &quot;الحد الأدنى من البيانات&quot;؛ لذلك نحتفظ بالصور الأصلية فقط للمدة الضرورية
            لإتمام مراحل التصميم والمراجعة والطباعة والتسليم.
          </p>
          <div className="rounded-xl bg-[#f7f1e7] p-5">
            <p className="font-bold text-[#1f7a5c]">
              ✦ آلية الحذف التلقائي بعد التسليم:
            </p>
            <p className="mt-2 text-[#5f5044]">
              تُحذف جميع صور الأطفال الأصلية وملفات التصميم الأولية بشكل تلقائي وآمن من خوادمنا وسجلاتنا خلال <strong>30 يوماً كحد أقصى</strong> من استلامكم للنسخة المطبوعة من الكتاب، وذلك لإتاحة مهلة كافية في حال طلبتم إعادة طباعة أو مراجعة أي عيب تصنيعي.
            </p>
          </div>
        </section>

        {/* 5. Right to immediate deletion */}
        <section className="space-y-4 rounded-2xl border border-[#dcc9ad] bg-white p-6 leading-8 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1f7a5c]/10 text-xl font-extrabold text-[#1f7a5c]">
              ٥
            </span>
            <h2 className="text-2xl font-extrabold">حقك الكامل في طلب الحذف الفوري</h2>
          </div>
          <p>
            بصفتك ولي أمر الطفل، تملك الحق القانوني والأخلاقي الكامل لطلب مسح صور طفلك من خوادمنا وسجلات العمل في أي وقت—حتى قبل انقضاء مهلة الـ 30 يوماً، وفور استلامك لطلبك أو حتى أثناء العمل.
          </p>
          <p>
            ببساطة، يمكنك مراسلتنا مباشرة عبر واتساب على الرقم{" "}
            <a
              href={`https://wa.me/20${whatsappNumber.slice(1)}`}
              className="font-bold text-[#1f7a5c] underline"
              dir="ltr"
            >
              0115 280 6034
            </a>
            ، وسيقوم فريقنا بحذف الملفات نهائياً وتأكيد عملية المسح لك على الفور.
          </p>
        </section>

        {/* 6. Security and restricted access */}
        <section className="space-y-4 rounded-2xl border border-[#dcc9ad] bg-white p-6 leading-8 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1f7a5c]/10 text-xl font-extrabold text-[#1f7a5c]">
              ٦
            </span>
            <h2 className="text-2xl font-extrabold">كيف نؤمّن ملفات الصور والبيانات؟</h2>
          </div>
          <p>
            نطبق تدابير تقنية وإدارية دقيقة لضمان حماية صور الأطفال:
          </p>
          <ul className="list-disc space-y-2 pr-6">
            <li>
              <strong>تشفير أثناء النقل:</strong> جميع عمليات الرفع والتنزيل مشفرة بالكامل عبر بروتوكول HTTPS المشفر (SSL/TLS).
            </li>
            <li>
              <strong>وصول داخلي محدود وصارم:</strong> لا يُسمح بالوصول إلى صور الطفل إلا لفريق التصميم والإنتاج المعني مباشرة بتنفيذ القصة.
            </li>
            <li>
              <strong>بيئة سحابية آمنة:</strong> الملفات تُخزن في مساحات تخزين سحابية خاصة ومحمية بأحدث جدران الحماية، وغير مفهرسة لمحركات البحث أو مستعرضات الإنترنت العامة.
            </li>
          </ul>
        </section>

        {/* Action CTAs */}
        <section className="space-y-4 rounded-2xl border border-[#dcc9ad] bg-white p-6 shadow-sm">
          <h2 className="text-xl font-extrabold">هل لديك أي استفسار أو ترغب في بدء قصة طفلك؟</h2>
          <p className="text-[#5f5044]">
            فريق سراج متاح دائماً للإجابة عن أسئلتكم ومساعدتكم في خلق تجربة ساحرة وآمنة لطفلكم.
          </p>
          <div className="flex flex-wrap gap-4 pt-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-lg bg-[#1f7a5c] px-6 py-3 text-base font-bold text-white transition-opacity hover:opacity-95"
            >
              تواصل معنا لحذف الصور فوراً أو الاستفسار
            </a>
            <Link
              href="/category/personalized-stories"
              className="inline-flex items-center justify-center rounded-lg border-2 border-[#1f7a5c] px-6 py-3 text-base font-bold text-[#1f7a5c] transition-colors hover:bg-[#1f7a5c] hover:text-white"
            >
              تخصيص قصة لطفلك الآن
            </Link>
            <Link
              href="/how-personalized-stories-work"
              className="inline-flex items-center justify-center rounded-lg border border-[#dcc9ad] px-5 py-3 text-base font-bold text-[#5f5044] transition-colors hover:bg-[#f7f1e7]"
            >
              كيف تصنع قصة طفلك؟
            </Link>
          </div>
        </section>
      </article>
    </main>
  );
}