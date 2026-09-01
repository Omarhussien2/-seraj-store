import { type MetadataRoute } from "next";
import { connectDB } from "@/lib/db";
import Product from "@/lib/models/Product";
import Article from "@/lib/models/Article";
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
    { url: siteUrl("/mama-world"), changeFrequency: "weekly", priority: 0.7 },
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
        .lean()
        .catch(() => []),
      Article.find({ active: true, publishedAt: { $ne: null, $lte: now } })
        .select("slug updatedAt")
        .lean()
        .catch(() => []),
    ]);

    const productRoutes: MetadataRoute.Sitemap = products.map((p) => ({
      url: siteUrl(encodedPath("/product", p.slug)),
      lastModified: p.updatedAt || now,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    }));

    const articleRoutes: MetadataRoute.Sitemap = articles.map((a) => ({
      url: siteUrl(encodedPath("/article", a.slug)),
      lastModified: a.updatedAt || now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));

    dynamicRoutes = [...productRoutes, ...articleRoutes];
  } catch {
    // DB unavailable — return static routes only.
  }

  return [...staticRoutes, ...dynamicRoutes];
}
