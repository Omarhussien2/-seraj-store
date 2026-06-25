/**
 * Tiny TTL cache for the public coloring listings (items + categories).
 *
 * The coloring browser hits `/api/coloring/items` and
 * `/api/coloring/categories` on every page load and on every filter change.
 * Each query is small but the underlying collection has thousands of rows,
 * so paying the Mongo round-trip on every request is wasteful when the data
 * changes only when the admin uploads a new sheet.
 *
 * Uses a 60s TTL in-memory Map keyed by the
 * full querystring. Admin requests with `?all=true` skip the cache entirely
 * so the admin dashboard stays fresh. Mutating routes call
 * `invalidateColoringCache()` so visitors see the new state immediately on
 * warm functions.
 */

type CacheEntry = { body: string; expiresAt: number };

const CACHE_TTL_MS = 60 * 1000;
const coloringCache = new Map<string, CacheEntry>();

export function getColoringCache(key: string): string | null {
  const hit = coloringCache.get(key);
  if (!hit) return null;
  if (hit.expiresAt <= Date.now()) {
    coloringCache.delete(key);
    return null;
  }
  return hit.body;
}

export function setColoringCache(key: string, body: string): void {
  coloringCache.set(key, { body, expiresAt: Date.now() + CACHE_TTL_MS });
}

export function invalidateColoringCache(): void {
  coloringCache.clear();
}
