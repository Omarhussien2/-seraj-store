import type { SeoProduct } from "@/lib/seoContent";

export const GOOGLE_PRODUCT_TAXONOMY_URL =
  "https://www.google.com/basepages/producttype/taxonomy-with-ids.en-US.txt";

const GOOGLE_PRODUCT_CATEGORY_BY_SLUG: Record<string, string> = {
  "story-khaled": "543543",
  "custom-story": "543543",
  "hero-conqueror": "543543",
  ershad: "2618",
  "quran-puzzle": "2618",
  FROG: "1262",
};

export function googleProductCategoryId(product: Pick<SeoProduct, "slug">) {
  return GOOGLE_PRODUCT_CATEGORY_BY_SLUG[product.slug];
}
