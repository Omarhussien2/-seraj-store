/**
 * Tiny TTL cache for the public products listing.
 *
 * Lives in its own module so that `/api/products` and `/api/products/[slug]`
 * share the *same* Map instance when they're co-located in a single Vercel
 * serverless function — and so that within a warm function, a PATCH/DELETE
 * really does invalidate the listing cache the GET handler reads from.
 *
 * Caveat: on Vercel each route.ts becomes its own serverless function, so
 * if the slug route runs on a different warm instance than the listing
 * route, that instance's cache won't be cleared until its own TTL expires
 * (60s). That's an acceptable upper bound.
 */

type CacheEntry = { body: string; expiresAt: number };

const CACHE_TTL_MS = 60 * 1000;
const productsCache = new Map<string, CacheEntry>();

export function getProductsCache(key: string): string | null {
  const hit = productsCache.get(key);
  if (!hit) return null;
  if (hit.expiresAt <= Date.now()) {
    productsCache.delete(key);
    return null;
  }
  return hit.body;
}

export function setProductsCache(key: string, body: string): void {
  productsCache.set(key, { body, expiresAt: Date.now() + CACHE_TTL_MS });
}

export function invalidateProductsCache(): void {
  productsCache.clear();
}
