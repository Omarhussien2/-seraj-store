"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

export type TopicCategoryId = "all" | "parenting" | "screens" | "activities" | "ages";

export interface ExplorerArticleItem {
  slug: string;
  title: string;
  section: string;
  excerpt?: string;
  description: string;
  coverImage?: string | null;
  coverImageAlt?: string;
  readingTime?: number;
  tags?: string[];
}

interface CategoryDefinition {
  id: TopicCategoryId;
  label: string;
  icon: string;
  description: string;
}

const CATEGORIES: CategoryDefinition[] = [
  {
    id: "all",
    label: "كل المقالات",
    icon: "📚",
    description: "جميع مقالات التربية والأنشطة والنمو المنشورة",
  },
  {
    id: "parenting",
    label: "التربية والصحة النفسية",
    icon: "🌱",
    description: "السلوكيات، العناد، نوبات الغضب، والدعم النفسي للأسرة",
  },
  {
    id: "screens",
    label: "الشاشات والبدائل",
    icon: "📵",
    description: "تنظيم وقت الأجهزة، علاج إدمان الشاشات، والبدائل التفاعلية",
  },
  {
    id: "activities",
    label: "القراءة واللعب والأنشطة",
    icon: "🎨",
    description: "حب القراءة، ألعاب تنمية المهارات، وعلاج ملل الأطفال",
  },
  {
    id: "ages",
    label: "المراحل العمرية",
    icon: "👶",
    description: "دليل التعامل مع كل مرحلة من الرضاعة حتى المراهقة",
  },
];

function matchArticleTopics(article: ExplorerArticleItem): TopicCategoryId[] {
  const matched: TopicCategoryId[] = ["all"];
  const text = `${article.title || ""} ${article.section || ""} ${article.excerpt || ""} ${(article.tags || []).join(" ")}`.toLowerCase();

  // 1. Screens & Digital Balance
  const isScreens =
    article.section?.includes("الشاشات") ||
    article.section?.includes("الإنترنت") ||
    /(شاش[ةات]|موبايل|هاتف|تابلت|أجهز[ةه]|إلكتروني|يوتيوب|تلفزيون|سوشيال|ألعاب فيديو|إدمان|رقمي)/i.test(text);
  if (isScreens) matched.push("screens");

  // 2. Reading, Play & Activities
  const isActivities =
    /(قراء[ةه]|قصص|قص[ةه]|حكاي[ةه]|كتاب|كتب|لعب|ألعاب|لعب[ةه]|نشاط|أنشط[ةه]|فراغ|ملل|إبداع|مهار[ةات]|تفكير|رسم|تلوين|بازل)/i.test(text);
  if (isActivities) matched.push("activities");

  // 3. Age Stages
  const isAges =
    article.section?.includes("سنة") ||
    article.section?.includes("سنوات") ||
    article.section?.includes("الحمل") ||
    article.section?.includes("الرضاعة") ||
    article.section?.includes("المراحل العمرية") ||
    /(سنتين|سنوات|سن[ةه]|عمر|مرحل[ةه]|رضيع|رضاع[ةه]|حضان[ةه]|مراهق[ةه]|طفول[ةه]|مدرس[ةه]|سن ال)/i.test(text);
  if (isAges) matched.push("ages");

  // 4. Parenting & Mental Health (Behavior, emotions, discipline, communication)
  const isParenting =
    article.section?.includes("العلاقة مع الأم") ||
    article.section?.includes("الصحة النفسية") ||
    article.section?.includes("السلوكيات") ||
    article.section?.includes("مشاعر") ||
    article.section?.includes("الأسرة") ||
    article.section?.includes("الأهل") ||
    article.section?.includes("العدل") ||
    article.section?.includes("التربية") ||
    article.section?.includes("الأب") ||
    /(تربي[ةه]|سلوك|نفسي[ةه]|عناد|غضب|صراخ|عصبي[ةه]|ضرب|حزم|عقاب|قلق|خوف|اكتئاب|ذنب|ثق[ةه]|طاع[ةه]|كذب|فرط حرك[ةه]|تشتت|خلافات|مشاعر)/i.test(text);
  if (isParenting) matched.push("parenting");

  // Fallback: If no other category matched, group under parenting
  if (matched.length === 1) {
    matched.push("parenting");
  }

  return matched;
}

export default function MamaWorldArticlesExplorer({
  articles,
}: {
  articles: ExplorerArticleItem[];
}) {
  const [activeCategory, setActiveCategory] = useState<TopicCategoryId>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Map each article to its matching categories
  const articleCategoryMap = useMemo(() => {
    const map = new Map<string, TopicCategoryId[]>();
    for (const article of articles) {
      map.set(article.slug, matchArticleTopics(article));
    }
    return map;
  }, [articles]);

  // Count articles per category
  const categoryCounts = useMemo(() => {
    const counts: Record<TopicCategoryId, number> = {
      all: articles.length,
      parenting: 0,
      screens: 0,
      activities: 0,
      ages: 0,
    };

    for (const article of articles) {
      const categories = articleCategoryMap.get(article.slug) || ["all"];
      for (const cat of categories) {
        if (cat !== "all") {
          counts[cat] = (counts[cat] || 0) + 1;
        }
      }
    }
    return counts;
  }, [articles, articleCategoryMap]);

  // Filtered articles based on category + search
  const filteredArticles = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return articles.filter((article) => {
      const matchesCategory =
        activeCategory === "all" ||
        (articleCategoryMap.get(article.slug) || []).includes(activeCategory);

      if (!matchesCategory) return false;

      if (!query) return true;

      const searchable = `${article.title || ""} ${article.section || ""} ${article.excerpt || ""} ${(article.tags || []).join(" ")}`.toLowerCase();
      return searchable.includes(query);
    });
  }, [articles, activeCategory, searchQuery, articleCategoryMap]);

  const activeCategoryDef = CATEGORIES.find((c) => c.id === activeCategory) || CATEGORIES[0];

  return (
    <section className="space-y-6" aria-label="استعراض وتصفح المقالات">
      {/* Category Tabs & Search Bar */}
      <div className="rounded-2xl border border-[#dcc9ad] bg-white p-4 sm:p-6 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-[#26170f]">
              تصفح مقالات عالم ماما وبابا
            </h2>
            <p className="text-sm text-[#67594e] mt-1">
              {activeCategoryDef.description}
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <input
              type="search"
              aria-label="بحث في مقالات عالم ماما وبابا"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحثي في العناوين والموضوعات..."
              className="w-full rounded-xl border border-[#dcc9ad] bg-[#fcfaf7] px-4 py-2.5 pe-10 text-sm text-[#26170f] placeholder:text-[#9e8b7c] focus:border-[#1f7a5c] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1f7a5c]/20 transition-all"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="مسح البحث"
                className="absolute end-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#8a4316] hover:text-[#26170f]"
              >
                ✕
              </button>
            ) : (
              <span className="absolute end-3 top-1/2 -translate-y-1/2 text-[#9e8b7c] pointer-events-none">
                🔍
              </span>
            )}
          </div>
        </div>

        {/* Category Pills */}
        <div
          className="flex flex-wrap gap-2.5 pt-2 border-t border-[#f0e4d2]"
          role="tablist"
          aria-label="أقسام المقالات"
        >
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            const count = categoryCounts[cat.id];
            return (
              <button
                key={cat.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveCategory(cat.id)}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
                  isActive
                    ? "bg-[#1f7a5c] text-white shadow-sm ring-2 ring-[#1f7a5c]/30"
                    : "bg-[#f7f1e7] text-[#5f5044] hover:bg-[#ede3d3] hover:text-[#26170f]"
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
                <span
                  className={`ms-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-[#e8dcce] text-[#7a6a5e]"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Results Summary */}
      <div className="flex items-center justify-between px-1 text-sm text-[#7a6a5e]">
        <span>
          عرض <strong className="text-[#1f7a5c]">{filteredArticles.length}</strong> مقال
          {searchQuery && ` مطابق للبحث "${searchQuery}"`}
        </span>
        {(searchQuery || activeCategory !== "all") && (
          <button
            type="button"
            onClick={() => {
              setActiveCategory("all");
              setSearchQuery("");
            }}
            className="text-xs font-bold text-[#a15c1b] hover:underline"
          >
            إعادة ضبط الفلاتر ↺
          </button>
        )}
      </div>

      {/* Articles Grid */}
      {filteredArticles.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredArticles.map((article) => {
            const encodedSlug = encodeURIComponent(article.slug);

            return (
              <article
                key={article.slug}
                className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-[#dcc9ad] bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
              >
                <div>
                  {/* Article Cover Image */}
                  <Link
                    href={`/article/${encodedSlug}`}
                    className="block relative aspect-[16/9] w-full overflow-hidden bg-[#eadaea]/30"
                    tabIndex={-1}
                    aria-hidden="true"
                  >
                    {article.coverImage ? (
                      <img
                        alt={article.coverImageAlt || article.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                        src={article.coverImage}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#1f7a5c]/10 via-[#f7f1e7] to-[#a15c1b]/10 text-3xl">
                        📖
                      </div>
                    )}
                  </Link>

                  {/* Body Content */}
                  <div className="p-5 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-block rounded-md bg-[#1f7a5c]/10 px-2.5 py-1 text-xs font-bold text-[#1f7a5c]">
                        {article.section || "تربية وأسرة"}
                      </span>
                      {article.readingTime && (
                        <span className="text-xs text-[#8a796d]">
                          ⏱ {article.readingTime} دقائق قراءة
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-black leading-snug text-[#26170f] group-hover:text-[#1f7a5c] transition-colors line-clamp-2">
                      <Link href={`/article/${encodedSlug}`}>
                        {article.title}
                      </Link>
                    </h3>

                    <p className="text-sm leading-relaxed text-[#67594e] line-clamp-3">
                      {article.description}
                    </p>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="p-5 pt-0 border-t border-[#f7f1e7] mt-2 flex items-center justify-between gap-2">
                  <Link
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#1f7a5c] px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-[#18634b] transition-colors"
                    href={`/article/${encodedSlug}`}
                  >
                    <span>قراءة المقال</span>
                    <span>←</span>
                  </Link>
                  <Link
                    className="text-xs font-semibold text-[#a15c1b] hover:text-[#26170f] hover:underline"
                    href={`/index.html#/article/${article.slug}`}
                    title="فتح المقال في تجربة المتجر التفاعلية"
                  >
                    فتح في المتجر
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="rounded-2xl border border-dashed border-[#dcc9ad] bg-white p-10 text-center space-y-4">
          <div className="text-4xl">🔍</div>
          <h3 className="text-lg font-bold text-[#26170f]">
            لم نجد مقالات مطابقة لبحثك
          </h3>
          <p className="text-sm text-[#67594e] max-w-md mx-auto">
            جربي البحث بكلمات أخرى أو تصفحي كل المقالات لاكتشاف أفكار وحلول تربوية تناسبك.
          </p>
          <button
            type="button"
            onClick={() => {
              setActiveCategory("all");
              setSearchQuery("");
            }}
            className="inline-flex rounded-xl bg-[#1f7a5c] px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#18634b] transition-colors"
          >
            عرض جميع المقالات ({articles.length})
          </button>
        </div>
      )}
    </section>
  );
}
