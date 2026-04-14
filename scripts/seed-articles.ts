/**
 * Seed Articles Script
 * Reads ARTICALS.md, parses 40 articles, maps them to 12 sections,
 * and upserts them into MongoDB.
 *
 * Usage: npx tsx scripts/seed-articles.ts
 */

import mongoose from "mongoose";
import fs from "fs";
import path from "path";

// ─── Section mapping (corrected by actual article content) ───
const SECTION_MAP: Record<number, string> = {
  1: "العلاقة مع الأم نفسيا",    // توازن أدوار الأم
  2: "العلاقة مع الأم نفسيا",    // عبء الشيفت الثاني
  3: "العلاقة مع الأم نفسيا",    // الإرهاق النفسي والجسدي
  4: "الحمل والرضاعة",           // الغلاء والمصاريف
  5: "الحمل والرضاعة",           // الأم المعيلة/المطلقة
  6: "المدرسة والضغط الدراسي",   // نظام التعليم والحفظ
  7: "المدرسة والضغط الدراسي",   // الدروس الخصوصية والمذاكرة
  8: "القيم والمراحل العمرية",   // طبيعة كل مرحلة عمرية
  9: "من 2 إلى 5 سنوات",        // الحزم vs العنف
  10: "من 2 إلى 5 سنوات",       // وقف الضرب والعقاب البدني
  11: "من 2 إلى 5 سنوات",       // الضرب غلط لكن الحولي بيضربوا
  12: "من 2 إلى 5 سنوات",       // التساهل والقسوة والتذبذب
  13: "العلاقة مع الأم نفسيا",   // التحكم في العصبية والصراخ
  14: "من 2 إلى 5 سنوات",       // نوبات الغضب والعناد 2-5 سنوات
  15: "من 2 إلى 5 سنوات",       // تنظيم النوم والأكل والحمام
  16: "العلاقة مع الأم نفسيا",   // خوف كلام الناس
  17: "الأهل والأسرة الممتدة",   // حدود تدخل الأهل
  18: "الأهل والأسرة الممتدة",   // هدم الكلام قدام الأولاد
  19: "العدل بين الولد والبنت",  // العدالة والمساواة
  20: "العدل بين الولد والبنت",  // فرص البنات
  21: "المدرسة والضغط الدراسي",  // الضغط المدرسي
  22: "المدرسة والضغط الدراسي",  // المدرسة الضعيفة
  23: "المدرسة والضغط الدراسي",  // علاقة مع المعلمين
  24: "الشاشات والإنترنت",       // تنظيم الشاشات
  25: "الشاشات والإنترنت",       // حماية من المحتوى الضار
  26: "الشاشات والإنترنت",       // إدمان الألعاب والفيديوهات
  27: "الشاشات والإنترنت",       // التنمر الإلكتروني
  28: "السلوكيات الصعبة والصحة النفسية", // العدوان والكذب وفرط الحركة
  29: "السلوكيات الصعبة والصحة النفسية", // القلق والاكتئاب
  30: "السلوكيات الصعبة والصحة النفسية", // المساعدة النفسية
  31: "السلوكيات الصعبة والصحة النفسية", // وصمة الأخصائي النفسي
  32: "السلوكيات الصعبة والصحة النفسية", // الخلافات قدام الأولاد
  33: "الأب والتربية المشتركة",  // اتفاق على أسلوب تربية
  34: "الأب والتربية المشتركة",  // غياب الأب
  35: "مشاعر الأم وصورتها عن نفسها", // شعور الذنب
  36: "مشاعر الأم وصورتها عن نفسها", // صورة الأم المثالية في السوشيال
  37: "القيم والمراحل العمرية",   // توازن القيم
  38: "من 2 إلى 5 سنوات",       // التعلق والخوف من الحضانة 2-5
  39: "من 5 إلى 10 سنوات",      // التركيز والتنمر 6-9 سنوات
  40: "القيم والمراحل العمرية",   // بداية المراهقة 10-12
};

const AGE_GROUP_MAP: Record<string, string> = {
  "الحمل والرضاعة": "الحمل",
  "من الولادة إلى سنتين": "0-2",
  "من 2 إلى 5 سنوات": "2-5",
  "من 5 إلى 10 سنوات": "5-10",
  "العلاقة مع الأم نفسيا": "متنوع",
  "الأهل والأسرة الممتدة": "متنوع",
  "العدل بين الولد والبنت": "متنوع",
  "المدرسة والضغط الدراسي": "5-10",
  "الشاشات والإنترنت": "متنوع",
  "السلوكيات الصعبة والصحة النفسية": "متنوع",
  "الأب والتربية المشتركة": "متنوع",
  "مشاعر الأم وصورتها عن نفسها": "متنوع",
  "القيم والمراحل العمرية": "متنوع",
};

// ─── Article Schema (inline for seed script) ───
const SourceSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    url: { type: String },
    note: { type: String },
  },
  { _id: false }
);

const ArticleSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    seoTitle: { type: String },
    section: { type: String, required: true },
    ageGroup: { type: String },
    tags: [{ type: String }],
    excerpt: { type: String, required: true },
    contentMarkdown: { type: String, required: true },
    coverImage: { type: String },
    coverImageAlt: { type: String, default: "" },
    sources: [SourceSchema],
    readingTime: { type: Number, default: 5 },
    author: { type: String, default: "فريق سراج" },
    publishedAt: { type: Date },
    active: { type: Boolean, default: true, index: true },
    order: { type: Number, default: 0 },
    metaDescription: { type: String },
  },
  { timestamps: true }
);

ArticleSchema.index({ title: "text", excerpt: "text", contentMarkdown: "text", tags: "text" });
ArticleSchema.index({ active: 1, section: 1, order: 1 });

const Article =
  mongoose.models.Article ||
  mongoose.model("Article", ArticleSchema);

// ─── Parse Articles from Markdown ───
interface ParsedArticle {
  id: number;
  title: string;
  content: string;
}

interface SeedArticle {
  slug: string;
  title: string;
  section: string;
  ageGroup: string;
  excerpt: string;
  contentMarkdown: string;
  sources: { label: string; url?: string; note?: string }[];
  tags: string[];
  readingTime: number;
  author: string;
  publishedAt: Date;
  active: boolean;
  order: number;
  metaDescription: string;
}

function parseArticles(content: string): ParsedArticle[] {
  const articles: ParsedArticle[] = [];

  // Split by article markers:
  // 1. "## **المقال N**"
  // 2. "مقال N:" (inline format used in some sections)
  // 3. "## **أتعامل إزاي لما الأب غايب**" — article 34 has no header, we detect by position
  // Only match real article headers (## heading with "المقال N" or article 34's exact title)
  // Must be at start of line — avoids matching inline references inside content
  const articleRegex = /(?:^##\s*\*\*المقال\s+(\d+)\*\*|^##\s*\*\*أتعامل إزاي لما الأب غايب\s*\*\*)/gm;

  const splits: { id: number; startIndex: number; rawTitle?: string }[] = [];
  let match;

  while ((match = articleRegex.exec(content)) !== null) {
    const id = match[1]
      ? parseInt(match[1], 10)
      : match[2]
        ? parseInt(match[2], 10)
        : 34; // The father absence article
    const rawTitle = match[3]; // For article 34
    splits.push({ id, startIndex: match.index, rawTitle });
  }

  // Also check for "مقال 21:" format at the end of the file
  for (let i = 0; i < splits.length; i++) {
    // For most articles, content starts after the "المقال N" header line
    // For article 34, the header IS the title, so content starts after it
    const markerEnd = splits[i].rawTitle
      ? splits[i].startIndex + content.substring(splits[i].startIndex).indexOf("\n")
      : content.indexOf("\n", splits[i].startIndex);

    const start = markerEnd + 1;
    const end = i + 1 < splits.length ? splits[i + 1].startIndex : content.length;
    const articleContent = content.substring(start, end).trim();

    // Extract title: first ## heading after the marker
    let title: string;
    let bodyStart = 0;

    if (splits[i].rawTitle) {
      // Article 34 — the marker itself is the title
      title = splits[i].rawTitle!;
      bodyStart = 0;
    } else {
      const titleMatch = articleContent.match(/^##\s*\*\*(.+?)\*\*/m);
      title = titleMatch ? titleMatch[1].trim() : `مقال ${splits[i].id}`;
      bodyStart = titleMatch ? titleMatch.index! + titleMatch[0].length : 0;
    }

    // Remove the title line from content
    const bodyContent = bodyStart > 0
      ? articleContent.substring(bodyStart)
      : articleContent;

    articles.push({
      id: splits[i].id,
      title: title.replace(/[#*]/g, "").trim(),
      content: bodyContent.trim(),
    });
  }

  return articles;
}

function generateSlug(id: number, title: string): string {
  // Create a slug from article number + transliterated title keywords
  const simplified = title
    .replace(/[^\u0621-\u064A\s-]/g, "")
    .replace(/\s+/g, "-")
    .substring(0, 60)
    .replace(/-+$/, "");

  return `article-${id}-${simplified}`;
}

function extractExcerpt(content: string): string {
  // Get the first meaningful paragraph (after the title)
  const lines = content.split("\n").filter((l) => l.trim());
  for (const line of lines) {
    const clean = line.replace(/[#*]/g, "").trim();
    if (clean.length > 30 && !clean.startsWith("http") && !clean.startsWith("مصادر") && !clean.startsWith("فيديوهات")) {
      return clean.substring(0, 180).trim() + (clean.length > 180 ? "..." : "");
    }
  }
  return "مقال تربوي من سلسلة عالم ماما";
}

function extractSources(content: string): { label: string; url?: string; note?: string }[] {
  const sources: { label: string; url?: string; note?: string }[] = [];

  // Truncate content at "فيديوهات" or "شكل المقالات الجاية" or next article marker
  let cleanContent = content
    .replace(/##\s*\*\*فيديوهات وروابط سوشيال في نفس الموضوع\*\*[\s\S]*?(?=##\s*\*\*المقال\s+\d+\*\*|$)/gi, "")
    .replace(/##\s*\*\*شكل المقالات الجاية\*\*[\s\S]*?(?=##\s*\*\*المقال\s+\d+\*\*|$)/gi, "");

  // Find all source sections
  const sourcePatterns = [
    /##\s*\*\*مصادر وروابط مفيدة\*\*([\s\S]*?)(?=##|$)/i,
    /##\s*\*\*مصادر وروابط\*\*([\s\S]*?)(?=##|$)/i,
  ];

  for (const pattern of sourcePatterns) {
    const match = cleanContent.match(pattern);
    if (match) {
      extractSourcesFromBlock(match[1], sources);
    }
  }

  // Also catch bare "مصادر وروابط" without ## (inline format in some articles)
  const bareMatch = cleanContent.match(/(?:^|\n)مصادر وروابط\s*\n([\s\S]*?)(?=\n##|$)/i);
  if (bareMatch) {
    extractSourcesFromBlock(bareMatch[1], sources);
  }

  return sources;
}

function extractSourcesFromBlock(block: string, sources: { label: string; url?: string; note?: string }[]) {
  const lines = block.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    // Match: * Label: URL
    const linkMatch = trimmed.match(/^\*\s*(.+?)\s*:\s*(https?:\/\/\S+)/);
    if (linkMatch) {
      sources.push({
        label: linkMatch[1].replace(/\*/g, "").trim(),
        url: linkMatch[2],
      });
      continue;
    }

    // Match: * Label:  URL (label ends with separator, then URL)
    const simpleMatch = trimmed.match(/^\*\s*(.+?)(https:\/\/\S+)/);
    if (simpleMatch) {
      const label = simpleMatch[1].replace(/[:\-–]\s*$/, "").replace(/\*/g, "").trim();
      if (label && label.length > 2) {
        sources.push({ label, url: simpleMatch[2] });
      }
      continue;
    }

    // Match bare URLs on their own line (some articles have this format)
    const bareUrl = trimmed.match(/^(https?:\/\/\S+)/);
    if (bareUrl) {
      sources.push({ label: bareUrl[1], url: bareUrl[1] });
      continue;
    }
  }
}

function calculateReadingTime(content: string): number {
  const wordCount = content.split(/\s+/).filter((w) => w.length > 0).length;
  return Math.max(1, Math.ceil(wordCount / 200));
}

function extractTags(title: string, section: string): string[] {
  const tags: string[] = [section];

  const keywords: Record<string, string[]> = {
    "الحمل والرضاعة": ["حمل", "رضاعة", "أم جديدة"],
    "من الولادة إلى سنتين": ["حديثي الولادة", "رضع", "أول سنة"],
    "من 2 إلى 5 سنوات": ["أطفال صغار", "روضة", "عند"],
    "من 5 إلى 10 سنوات": ["مدرسة", "أطفال", "تعليم"],
    "العلاقة مع الأم نفسيا": ["الأم", "صحة نفسية", "رعاية ذاتية"],
    "الأهل والأسرة الممتدة": ["أجداد", "عائلة", "حدود"],
    "العدل بين الولد والبنت": ["مساواة", "بنات", "أولاد"],
    "المدرسة والضغط الدراسي": ["مدرسة", "دراسة", "دروس"],
    "الشاشات والإنترنت": ["شاشات", "إنترنت", "ألعاب"],
    "السلوكيات الصعبة والصحة النفسية": ["سلوك", "صحة نفسية", "قلق"],
    "الأب والتربية المشتركة": ["أب", "تربية مشتركة", "شراكة"],
    "مشاعر الأم وصورتها عن نفسها": ["ذنب", "سوشيال", "صورة ذاتية"],
    "القيم والمراحل العمرية": ["قيم", "مراحل", "توازن"],
  };

  if (keywords[section]) {
    tags.push(...keywords[section].slice(0, 2));
  }

  return [...new Set(tags)];
}

// ─── Main ───
async function main() {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    console.error("❌ MONGODB_URI not set");
    process.exit(1);
  }

  console.log("🔌 Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);
  console.log("✅ Connected");

  // Read ARTICALS.md
  const articlesPath = path.join(process.cwd(), "docs", "ARTICALS.md");
  console.log("📖 Reading ARTICALS.md...");
  const rawContent = fs.readFileSync(articlesPath, "utf-8");

  // Parse articles
  const parsed = parseArticles(rawContent);
  console.log(`📋 Found ${parsed.length} articles`);

  // Convert to seed documents
  const seedArticles: SeedArticle[] = parsed.map((a) => {
    const section = SECTION_MAP[a.id] || "القيم والمراحل العمرية";
    const ageGroup = AGE_GROUP_MAP[section] || "متنوع";

    // Clean content: remove everything after sources + videos sections
    let cleanContent = a.content;
    // Remove "فيديوهات وروابط سوشيال" section and everything after
    cleanContent = cleanContent.replace(/##\s*\*\*فيديوهات وروابط سوشيال في نفس الموضوع\*\*[\s\S]*$/i, "");
    // Remove "شكل المقالات الجاية" section and everything after
    cleanContent = cleanContent.replace(/##\s*\*\*شكل المقالات الجاية\*\*[\s\S]*$/i, "");
    // Trim trailing whitespace
    cleanContent = cleanContent.trim();

    return {
      slug: generateSlug(a.id, a.title),
      title: a.title,
      section,
      ageGroup,
      excerpt: extractExcerpt(cleanContent),
      contentMarkdown: cleanContent,
      sources: extractSources(a.content),
      tags: extractTags(a.title, section),
      readingTime: calculateReadingTime(cleanContent),
      author: "فريق سراج",
      publishedAt: new Date(),
      active: true,
      order: a.id,
      metaDescription: extractExcerpt(cleanContent),
    };
  });

  // Force update all articles (section/content/sources may have changed)
  let created = 0;
  let updated = 0;

  for (const article of seedArticles) {
    try {
      const existing = await Article.findOne({ slug: article.slug });
      if (existing) {
        // Always update — section/content/sources may have been corrected
        await Article.updateOne({ slug: article.slug }, { $set: article });
        updated++;
        console.log(`  🔄 Updated: ${article.slug}`);
      } else {
        await Article.create(article);
        created++;
        console.log(`  ✅ Created: ${article.slug} (${article.section})`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  ❌ Error with article ${article.slug}: ${msg}`);
    }
  }

  console.log("\n📊 Seed complete:");
  console.log(`  ✅ Created: ${created}`);
  console.log(`  🔄 Updated: ${updated}`);

  // Verify
  const total = await Article.countDocuments({ active: true });
  console.log(`  📚 Total active articles in DB: ${total}`);

  await mongoose.disconnect();
  console.log("👋 Done");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
