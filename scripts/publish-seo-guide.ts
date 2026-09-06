import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import mongoose from "mongoose";
import { connectDB } from "../src/lib/db";
import Article from "../src/lib/models/Article";

const slug = "choosing-childrens-stories-and-games";
const draft = {
  slug,
  title: "قصة أطفال أم بازل أم قصة مخصصة؟ دليل اختيار من سراج",
  seoTitle: "كيف تختار قصص وألعاب الأطفال؟ دليل القصة والبازل والتخصيص",
  section: "القراءة واللعب",
  tags: ["islamic-stories", "educational-games", "personalized-stories"],
  excerpt: "دليل عملي لاختيار قصة أطفال عربية أو إسلامية، أو بازل ولعبة حساب، أو قصة مخصصة باسم وصورة طفلك، مع أمثلة من منتجات سراج.",
  metaDescription: "قارن بين قصص الأطفال والبازل وألعاب الحساب والقصص المخصصة، وراجع المكونات والتخصيص قبل الشراء. دليل عملي من متجر سراج للأهل داخل مصر.",
  contentMarkdown: readFileSync(resolve("content/seo-articles/choosing-childrens-stories-and-games.md"), "utf8"),
  author: "فريق سراج",
  readingTime: 5,
  sources: [],
  active: true,
  order: -1,
};

async function publishGuide() {
  if (!process.argv.includes("--apply")) {
    console.log(JSON.stringify({ mode: "dry-run", article: draft }, null, 2));
    return;
  }
  await connectDB();
  const publication = await Article.updateOne(
    { slug },
    { $setOnInsert: { ...draft, publishedAt: new Date() } },
    { upsert: true, runValidators: true }
  );
  console.log(publication.upsertedCount === 1 ? `Published ${slug}` : `Already exists; preserved ${slug}`);
}

publishGuide().catch((error) => {
  console.error("Could not publish SEO guide:", error);
  process.exitCode = 1;
}).finally(async () => {
  await mongoose.disconnect();
});
