import Link from "next/link";
import type { SeoArticle } from "@/lib/seoContent";

interface ArticleSerajRecommendationProps {
  article: SeoArticle;
}

export default function ArticleSerajRecommendation({
  article,
}: ArticleSerajRecommendationProps) {
  const text = `${article.title || ""} ${article.section || ""} ${article.excerpt || ""} ${(article.tags || []).join(" ")}`.toLowerCase();

  // Screen and play keywords
  const isScreenPlay =
    article.section?.includes("الشاشات") ||
    article.section?.includes("الإنترنت") ||
    /(شاش[ةات]|موبايل|هاتف|تابلت|أجهز[ةه]|إلكتروني|يوتيوب|تلفزيون|سوشيال|ألعاب فيديو|إدمان|رقمي|ملل|فراغ|لعب|ألعاب|لعب[ةه])/i.test(text);

  // Values, identity, reading, character, courage
  const isValuesHeroes =
    /(قيم|هوي[ةه]|قراء[ةه]|قص[ةه]|قصص|حكاي[ةه]|كتاب|كتب|سلوك|عناد|غضب|خوف|ثق[ةه]|أخلاق|شجاع[ةه]|تربي[ةه]|كذب|حزم|بطل|أبطال|تاريخ|إسلام)/i.test(text);

  // Determine primary showcase
  const showScreensAsPrimary = isScreenPlay && !isValuesHeroes;

  return (
    <section
      className="space-y-6 rounded-2xl border-2 border-[#1f7a5c]/25 bg-gradient-to-br from-[#fdfbf7] via-white to-[#f5ede2] p-6 sm:p-8 shadow-sm"
      aria-label="ترشيحات سراج للأسرة"
    >
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1f7a5c] text-base text-white">
          🏮
        </span>
        <div>
          <span className="text-xs font-extrabold uppercase tracking-wide text-[#a15c1b]">
            حلول عملية متكاملة من سراج
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-[#26170f]">
            صندوق ترشيح سراج لأسرتك
          </h2>
        </div>
      </div>

      <p className="text-sm sm:text-base leading-relaxed text-[#5f5044]">
        لأننا نؤمن أن التربية الواعية لا تكتمل بالنصائح وحدها، يقدم سراج لأسرتك
        بدائل عملية ملموسة تعزز نمو طفلك وتصنع ذكريات عائلية دافئة.
      </p>

      {/* Main Targeted Recommendation Card */}
      {showScreensAsPrimary ? (
        /* Screen-Free Games Card */
        <div className="rounded-xl border border-[#dcc9ad] bg-white p-5 sm:p-6 space-y-4 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1f7a5c]/10 px-3 py-1 text-xs font-bold text-[#1f7a5c]">
              <span>🎲</span>
              <span>بدائل عملية وممتعة للشاشات</span>
            </span>
            <span className="text-xs font-semibold text-[#8a796d]">
              أنشطة طاولة ولمة عيلة
            </span>
          </div>

          <h3 className="text-lg sm:text-xl font-black text-[#26170f]">
            ألعاب سراج العائلية: تخلّصوا من إدمان الموبايل والملل
          </h3>

          <p className="text-sm leading-relaxed text-[#67594e]">
            بدلاً من تشتت الشاشات وألعاب الفيديو المعزولة، اكتشفوا مجموعة ألعاب سراج
            التفاعلية (بازل السيرة النبوية والقرآن، ألعاب الحساب وميزان الضفدع،
            وبطاقات المهارات) المصممة خصيصاً لتنمية ذكاء طفلك وجمعه حول طاولة اللعب
            مع الوالدين والإخوة.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href="/category/educational-games"
              className="inline-flex items-center gap-2 rounded-xl bg-[#1f7a5c] px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#18634b] transition-colors"
            >
              <span>تصفح ألعاب سراج بدون شاشات</span>
              <span>←</span>
            </Link>
            <Link
              href="/category/personalized-stories"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#a15c1b] hover:text-[#26170f] hover:underline px-2 py-2"
            >
              <span>أو اصنع قصة مخصصة لطفلك</span>
              <span>←</span>
            </Link>
          </div>
        </div>
      ) : (
        /* Authentic Heroes & Custom Story Card */
        <div className="rounded-xl border border-[#dcc9ad] bg-white p-5 sm:p-6 space-y-4 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#a15c1b]/10 px-3 py-1 text-xs font-bold text-[#a15c1b]">
              <span>✨</span>
              <span>ترسيخ القيم والشخصية</span>
            </span>
            <span className="text-xs font-semibold text-[#8a796d]">
              بطلها طفلك باسمه وملامحه
            </span>
          </div>

          <h3 className="text-lg sm:text-xl font-black text-[#26170f]">
            اجعل طفلك بطل قصته: حكاية مخصصة تغرس فيه القيم
          </h3>

          <p className="text-sm leading-relaxed text-[#67594e]">
            التربية ليست مجرد تعليمات أو لوم؛ بل قدوة ومغامرة يعيشها الطفل. في
            سراج، نكتب قصة مخصصة لطفلك ونبني شخصية كرتونية متطابقة مع ملامحه
            وصورته، ليتعلم الشجاعة، الصدق، وحل المشكلات كبطل حقيقي. ونرسل لك عينة
            الرسم للمراجعة قبل الطباعة والتوصيل.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href="/category/personalized-stories"
              className="inline-flex items-center gap-2 rounded-xl bg-[#1f7a5c] px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#18634b] transition-colors"
            >
              <span>صمم قصة طفلك المخصصة الآن</span>
              <span>←</span>
            </Link>
            <Link
              href="/category/educational-games"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#a15c1b] hover:text-[#26170f] hover:underline px-2 py-2"
            >
              <span>ألعاب سراج التعليمية وبدائل الشاشات</span>
              <span>←</span>
            </Link>
            <Link
              href="/category/islamic-stories"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#5f5044] hover:text-[#26170f] hover:underline px-2 py-2"
            >
              <span>قصص الأبطال والتاريخ الإسلامي</span>
              <span>←</span>
            </Link>
          </div>
        </div>
      )}

      {/* Prominent Weekend Outing Recommendation ("فسحة حلوة للأطفال") */}
      <div className="rounded-xl border border-[#cbe1d9] bg-gradient-to-r from-[#eaf4f0] via-[#f0f7f4] to-white p-5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎪</span>
            <h4 className="text-base sm:text-lg font-black text-[#1f7a5c]">
              خروجة الويك إند مع الأولاد: دليل &quot;فسحة حلوة&quot;
            </h4>
          </div>
          <span className="rounded-full bg-[#1f7a5c] px-2.5 py-0.5 text-xs font-bold text-white">
            25+ مكان مجرب
          </span>
        </div>

        <p className="text-sm leading-relaxed text-[#4d6b5e]">
          هل تبحثين عن مكان خروجة مناسب للأولاد نهاية هذا الأسبوع؟ دليلك التفاعلي
          يجمع أفضل الحدائق والمتاحف والمراكز الترفيهية بالقاهرة والجيزة مع فلاتر
          محطات المترو القريبة، والأماكن المغلقة والمفتوحة، وتناسب الفئات العمرية.
        </p>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap gap-2 text-xs font-semibold text-[#5a7a6c]">
            <span className="rounded-md bg-white px-2 py-1 border border-[#cbe1d9]">🚇 قرب المترو</span>
            <span className="rounded-md bg-white px-2 py-1 border border-[#cbe1d9]">☀️ مغلقة ومفتوحة</span>
            <span className="rounded-md bg-white px-2 py-1 border border-[#cbe1d9]">🎯 من سنتين لـ 12 سنة</span>
          </div>

          <Link
            href="/index.html#/mama-world"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#1f7a5c] px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-xs hover:bg-[#18634b] transition-colors"
          >
            <span>استكشفي دليل فسحة حلوة</span>
            <span>🎡</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
