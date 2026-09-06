import { connectDB } from "@/lib/db";
import Product from "@/lib/models/Product";
import Article from "@/lib/models/Article";

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://seraj-store.vercel.app"
).replace(/\/$/, "");

export type SeoProduct = {
  slug: string;
  name: string;
  badge?: string;
  price: number;
  priceText?: string;
  originalPriceText?: string | null;
  category?: string;
  section?: string | null;
  shortDesc?: string | null;
  longDesc?: string;
  features?: string[];
  imageUrl?: string;
  media?: { image?: string };
  gallery?: { url: string; resourceType?: string; alt?: string; sortOrder?: number }[];
  ctaText?: string;
  action?: "cart" | "wizard" | "none";
  comingSoon?: boolean;
  active?: boolean;
  updatedAt?: Date;
};

export type SeoArticle = {
  slug: string;
  tags?: string[];
  title: string;
  seoTitle?: string;
  section: string;
  excerpt: string;
  contentMarkdown?: string;
  coverImage?: string;
  coverImageAlt?: string;
  readingTime?: number;
  author?: string;
  publishedAt?: Date;
  metaDescription?: string;
  updatedAt?: Date;
  sources?: { label: string; url?: string; note?: string }[];
};

export function siteUrl(path = "") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${normalizedPath === "/" ? "" : normalizedPath}`;
}

export const DEFAULT_SOCIAL_IMAGE = {
  url: siteUrl("/assets/social-card-1200x630.jpg"),
  width: 1200,
  height: 630,
  alt: "شخصيات عالم سراج لقصص الأطفال العربية",
};

export function encodedPath(prefix: string, slug: string) {
  return `${prefix}/${encodeURIComponent(slug)}`;
}

export function absoluteAssetUrl(url?: string | null) {
  if (!url) return siteUrl("/assets/social-card-1200x630.webp");
  return new URL(url, SITE_URL).toString();
}

export function productImageUrl(product: SeoProduct) {
  const galleryImage = product.gallery
    ?.filter((item) => item.resourceType !== "video")
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))[0]?.url;

  return absoluteAssetUrl(product.imageUrl || product.media?.image || galleryImage);
}

export function plainText(value?: string | null) {
  return (value || "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)]\([^)]+\)/g, "$1")
    .replace(/[#>*_~|[\](){}]/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function shortText(value: string, maxLength = 155) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1).trim()}…`;
}

export function productDescription(product: SeoProduct) {
  return shortText(
    plainText(product.shortDesc || product.longDesc) ||
      "منتجات وقصص أطفال عربية من سراج، مصنوعة بحب وجودة عالية."
  );
}

export function articleDescription(article: SeoArticle) {
  return shortText(
    plainText(article.metaDescription || article.excerpt || article.contentMarkdown) ||
      "مقال من عالم ماما وبابا على سراج."
  );
}

export function jsonLd(payload: unknown) {
  return JSON.stringify(payload).replace(/</g, "\\u003c");
}

export async function getActiveProducts(limit?: number) {
  await connectDB();
  let query = Product.find({ active: true }).sort({ order: 1, updatedAt: -1 });
  if (limit) query = query.limit(limit);
  return (await query.lean()) as SeoProduct[];
}

export async function getActiveProduct(slug: string) {
  await connectDB();
  return (await Product.findOne({ slug, active: true }).lean()) as SeoProduct | null;
}

export async function getPublishedArticles(limit?: number, categoryTag?: string) {
  await connectDB();
  let query = Article.find({
    active: true,
    publishedAt: { $ne: null, $lte: new Date() },
    ...(categoryTag ? { tags: categoryTag } : {}),
  }).sort({ order: 1, publishedAt: -1 });

  if (limit) query = query.limit(limit);
  return (await query.lean()) as SeoArticle[];
}

export async function getPublishedArticle(slug: string) {
  await connectDB();
  return (await Article.findOne({
    slug,
    active: true,
    publishedAt: { $ne: null, $lte: new Date() },
  }).lean()) as SeoArticle | null;
}
