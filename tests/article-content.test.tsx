import React from "react";
import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { load } from "cheerio";
import ArticleContent from "../src/components/seo/ArticleContent";

test("canonical articles retain content beyond paragraph 18, headings, lists and crawlable links", () => {
  const paragraphs = Array.from({ length: 22 }, (_, index) => `فقرة ${index + 1}`).join("\n\n");
  const html = renderToStaticMarkup(<ArticleContent article={{
    slug: "reading-guide", title: "دليل القراءة", section: "القراءة", excerpt: "مقدمة",
    contentMarkdown: `# عنوان داخل المقال\n\n${paragraphs}\n\n## اختيارات\n\n- قصة\n- لعبة\n\n[قصص إسلامية](/category/islamic-stories)`,
    sources: [{ label: "مرجع", url: "https://example.org/reference", note: "تفاصيل المصدر" }],
  }} />);
  const $ = load(html);
  assert.match($.text(), /فقرة 22/);
  assert.equal($("h1").length, 0);
  assert.equal($("h2").first().text(), "عنوان داخل المقال");
  assert.equal($('a[href="/category/islamic-stories"]').text(), "قصص إسلامية");
  assert.equal($('a[href="https://example.org/reference"]').text(), "مرجع");
  assert.equal($("li").first().text(), "قصة");
});

test("article content and sources cannot inject executable HTML or JavaScript links", () => {
  const html = renderToStaticMarkup(<ArticleContent article={{
    slug: "unsafe", title: "مقال", section: "قراءة", excerpt: "مقدمة",
    contentMarkdown: '<script>alert(1)</script>\n\n<img src=x onerror="alert(1)">\n\n[رابط](javascript:alert%281%29)',
    sources: [{ label: "مرجع غير آمن", url: "javascript:alert(1)" }],
  }} />);
  const $ = load(html);
  assert.equal($("script, [onerror], a[href^='javascript:']").length, 0);
  assert.match($.text(), /مرجع غير آمن/);
});
