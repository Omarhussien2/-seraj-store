import { type MetadataRoute } from "next";
import { connectDB } from "@/lib/db";
import Product from "@/lib/models/Product";
import Article from "@/lib/models/Article";
import ColoringCategory from "@/lib/models/ColoringCategory";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://seraj-store.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // Static routes (SPA pages are all served from / but we list them for reference)
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
  ];

  let dynamicRoutes: MetadataRoute.Sitemap = [];

  try {
    await connectDB();

    // Articles from DB
    const articles = await Article.find({ active: true })
      .select("slug updatedAt")
      .lean()
      .catch(() => []);

    const articleRoutes: MetadataRoute.Sitemap = articles.map((a) => ({
      url: `${BASE_URL}/api/articles/${a.slug}`,
      lastModified: a.updatedAt || now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));

    // Coloring categories from DB
    const categories = await ColoringCategory.find({ active: true, itemCount: { $gt: 0 } })
      .select("slug updatedAt")
      .lean()
      .catch(() => []);

    const categoryRoutes: MetadataRoute.Sitemap = categories.map((c) => ({
      url: `${BASE_URL}/api/coloring/categories/${c.slug}`,
      lastModified: c.updatedAt || now,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    }));

    dynamicRoutes = [...articleRoutes, ...categoryRoutes];
  } catch {
    // DB unavailable — return static routes only
  }

  return [...staticRoutes, ...dynamicRoutes];
}
