import assert from "node:assert/strict";
import test from "node:test";
import { articleRevisionState, articleSeoHash, articleSeoRevisions } from "../src/lib/articleSeoRevision";

const before = { title: "العنوان السابق", contentMarkdown: "النص الأصلي" };
const after = {
  title: "عنوان المقال بعد المراجعة",
  seoTitle: "عنوان واضح للمقال في نتائج البحث",
  metaDescription: "وصف واضح للمحتوى الحالي يشرح للقارئ موضوع المقال وما يستطيع قراءته فيه دون وعود أو مبالغة في النتائج.",
  excerpt: "ملخص للمقال يوضح موضوعه الحالي ويساعد القارئ على اختيار ما يناسب سؤاله.",
  contentMarkdown: "نص المقال ومحتواه المفيد للقارئ. ".repeat(8),
};
const revision = { slug: "article-one", beforeHash: articleSeoHash(before), after };

test("publication accepts the reviewed baseline, is idempotent, and refuses newer editorial changes", () => {
  assert.equal(articleRevisionState(before, revision), "ready");
  assert.equal(articleRevisionState(after, revision), "already-applied");
  assert.throws(() => articleRevisionState({ ...before, title: "تحرير أحدث من المالك" }, revision), /changed since review/);
});

test("a publication manifest cannot apply two conflicting revisions to the same article", () => {
  assert.equal(articleSeoRevisions.safeParse([revision]).success, true);
  assert.equal(articleSeoRevisions.safeParse([revision, revision]).success, false);
});
