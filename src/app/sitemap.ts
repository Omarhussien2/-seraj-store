import { type MetadataRoute } from "next";
import { connectDB } from "@/lib/db";
import Product from "@/lib/models/Product";
import Article from "@/lib/models/Article";
import { SEO_CATEGORIES } from "@/lib/seoCategories";
import { encodedPath, siteUrl } from "@/lib/seoContent";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Sitemap should list crawlable canonical URLs only. The public storefront can
 * still use hash routes, but Google needs normal paths for products/articles.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteUrl("/"), changeFrequency: "daily", priority: 1.0 },
    { url: siteUrl("/products"), changeFrequency: "daily", priority: 0.9 },
    ...SEO_CATEGORIES.map((category) => ({
      url: siteUrl(`/category/${category.slug}`),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    { url: siteUrl("/mama-world"), changeFrequency: "weekly", priority: 0.7 },
    { url: siteUrl("/about"), changeFrequency: "monthly", priority: 0.6 },
    { url: siteUrl("/contact"), changeFrequency: "monthly", priority: 0.5 },
    { url: siteUrl("/shipping"), changeFrequency: "monthly", priority: 0.5 },
    { url: siteUrl("/returns"), changeFrequency: "monthly", priority: 0.5 },
  ];

  let dynamicRoutes: MetadataRoute.Sitemap = [];

  if (!process.env.MONGODB_URI) {
    console.warn("⚠️ MONGODB_URI is not defined. Returning static routes only for sitemap.");
    return staticRoutes;
  }

  try {
    await connectDB();

    const [products, articles] = await Promise.all([
      Product.find({ active: true })
        .select("slug updatedAt")
        .lean(),
      Article.find({ active: true, publishedAt: { $ne: null, $lte: now } })
        .select("slug updatedAt")
        .lean(),
    ]);

    const productRoutes: MetadataRoute.Sitemap = products.map((product) => ({
      url: siteUrl(encodedPath("/product", product.slug)),
      lastModified: product.updatedAt || now,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    }));

    const articleRoutes: MetadataRoute.Sitemap = articles.map((article) => ({
      url: siteUrl(encodedPath("/article", article.slug)),
      lastModified: article.updatedAt || now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));

    dynamicRoutes = [...productRoutes, ...articleRoutes];
  } catch (error) {
    console.error("Failed to build dynamic sitemap routes:", error);
  }

  return [...staticRoutes, ...dynamicRoutes];
}
