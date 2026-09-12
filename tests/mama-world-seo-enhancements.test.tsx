import React from "react";
import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { load } from "cheerio";
import MamaWorldArticlesExplorer from "../src/components/seo/MamaWorldArticlesExplorer";
import ArticleSerajRecommendation from "../src/components/seo/ArticleSerajRecommendation";

test("MamaWorldArticlesExplorer renders category tabs, articles, and navigation links", () => {
  const sampleArticles = [
    {
      slug: "screen-time-balance",
      title: "كيف ننظم وقت الشاشات للأطفال؟",
      section: "الشاشات والإنترنت",
      description: "دليل عملي لتنظيم وقت الأجهزة وبدائل الشاشات.",
      coverImage: "/assets/sample.webp",
      readingTime: 5,
      tags: ["شاشات", "موبايل"],
    },
    {
      slug: "tantrums-and-behavior",
      title: "التعامل مع نوبات الغضب والعناد",
      section: "من 2 إلى 5 سنوات",
      description: "طرق تربوية فعالة للتعامل مع غضب الأطفال الصغار.",
      coverImage: null,
      readingTime: 4,
      tags: ["عناد", "غضب", "سنتين"],
    },
  ];

  const html = renderToStaticMarkup(<MamaWorldArticlesExplorer articles={sampleArticles} />);
  const $ = load(html);

  // Check tabs
  assert.match($.text(), /كل المقالات/);
  assert.match($.text(), /التربية والصحة النفسية/);
  assert.match($.text(), /الشاشات والبدائل/);
  assert.match($.text(), /القراءة واللعب والأنشطة/);
  assert.match($.text(), /المراحل العمرية/);

  // Check articles rendering
  assert.match($.text(), /كيف ننظم وقت الشاشات للأطفال؟/);
  assert.match($.text(), /التعامل مع نوبات الغضب والعناد/);

  // Check article links
  assert.equal($('a[href="/article/screen-time-balance"]').length > 0, true);
  assert.equal($('a[href="/article/tantrums-and-behavior"]').length > 0, true);
  assert.equal($('a[href="/index.html#/article/screen-time-balance"]').length > 0, true);
});

test("ArticleSerajRecommendation features Screen-Free Games for screen/play articles", () => {
  const screenArticle = {
    slug: "stop-mobile-addiction",
    title: "علاج إدمان ألعاب الموبايل والشاشات عند الأطفال",
    section: "الشاشات والإنترنت",
    excerpt: "كيف نساعد أطفالنا على تقليل وقت الشاشات واستبدالها بأنشطة حقيقية.",
    tags: ["شاشات", "موبايل", "ألعاب إلكترونية"],
  };

  const html = renderToStaticMarkup(<ArticleSerajRecommendation article={screenArticle} />);
  const $ = load(html);

  // Should feature educational games without screens
  assert.match($.text(), /ألعاب سراج بدون شاشات/);
  assert.equal($('a[href="/category/educational-games"]').length > 0, true);

  // Should include the weekend outing "فسحة حلوة" recommendation
  assert.match($.text(), /فسحة حلوة/);
  assert.equal($('a[href="/index.html#/mama-world"]').length > 0, true);
});

test("ArticleSerajRecommendation features Personalized Story for values/behavior articles", () => {
  const valuesArticle = {
    slug: "teaching-honesty-and-courage",
    title: "غرس قيمة الشجاعة والصدق في شخصية الطفل",
    section: "القيم والمراحل العمرية",
    excerpt: "خطوات لبناء شخصية واثقة تغرس الصدق والشجاعة في طفلك.",
    tags: ["قيم", "تربية", "شخصية"],
  };

  const html = renderToStaticMarkup(<ArticleSerajRecommendation article={valuesArticle} />);
  const $ = load(html);

  // Should feature personalized story & authentic heroes
  assert.match($.text(), /بطل قصته/);
  assert.equal($('a[href="/category/personalized-stories"]').length > 0, true);

  // Should also include the weekend outing "فسحة حلوة" recommendation
  assert.match($.text(), /فسحة حلوة/);
  assert.equal($('a[href="/index.html#/mama-world"]').length > 0, true);
});
