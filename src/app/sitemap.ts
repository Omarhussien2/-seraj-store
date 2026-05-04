import { type MetadataRoute } from "next";
import { connectDB } from "@/lib/db";
import Product from "@/lib/models/Product";
import Article from "@/lib/models/Article";
import ColoringCategory from "@/lib/models/ColoringCategory";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://seraj-store.vercel.app";

/**
 * Sitemap covering both the SPA (hash routes) and dynamic content.
 *
 * The store is a single-page app so every "page" lives at the root URL with a
 * `#/...` hash route. Search engines do follow the canonical URL plus the
 * structured-data hints, so we list a static set of high-value top-level
 * routes alongside dynamic routes for every active product, article, and
 * coloring category. lastModified comes from the document's `updatedAt`.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE_URL}/#/products`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/#/wizard`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/#/mama-world`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/#/coloring`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/#/fas7a-helwa`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${BASE_URL}/#/about`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
  ];

  let dynamicRoutes: MetadataRoute.Sitemap = [];

  try {
    await connectDB();

    const [products, articles, categories] = await Promise.all([
      Product.find({ active: true })
        .select("slug updatedAt")
        .lean()
        .catch(() => []),
      Article.find({ active: true })
        .select("slug updatedAt")
        .lean()
        .catch(() => []),
      ColoringCategory.find({ active: true, itemCount: { $gt: 0 } })
        .select("slug updatedAt")
        .lean()
        .catch(() => []),
    ]);

    const productRoutes: MetadataRoute.Sitemap = products.map((p) => ({
      url: `${BASE_URL}/#/product/${p.slug}`,
      lastModified: p.updatedAt || now,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    }));

    const articleRoutes: MetadataRoute.Sitemap = articles.map((a) => ({
      url: `${BASE_URL}/#/article/${a.slug}`,
      lastModified: a.updatedAt || now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));

    const categoryRoutes: MetadataRoute.Sitemap = categories.map((c) => ({
      url: `${BASE_URL}/#/coloring/${c.slug}`,
      lastModified: c.updatedAt || now,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    }));

    dynamicRoutes = [...productRoutes, ...articleRoutes, ...categoryRoutes];
  } catch {
    // DB unavailable — return static routes only.
  }

  return [...staticRoutes, ...dynamicRoutes];
}
