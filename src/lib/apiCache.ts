/**
 * Generic in-memory TTL cache for public GET API responses.
 *
 * Same pattern as coloringCache.ts but domain-agnostic.
 * Each serverless function instance gets its own Map — acceptable because the
 * Vercel Edge Cache (via Cache-Control headers) provides cross-instance caching.
 *
 * Usage:
 *   import { apiCache } from "@/lib/apiCache";
 *   const { get, set, invalidate } = apiCache("articles");
 */

type CacheEntry = { body: string; expiresAt: number };

const DEFAULT_TTL_MS = 60_000; // 60 seconds

const caches = new Map<string, Map<string, CacheEntry>>();

function getStore(namespace: string): Map<string, CacheEntry> {
  let store = caches.get(namespace);
  if (!store) {
    store = new Map();
    caches.set(namespace, store);
  }
  return store;
}

export function apiCache(namespace: string, ttlMs = DEFAULT_TTL_MS) {
  const store = getStore(namespace);

  return {
    get(key: string): string | null {
      const hit = store.get(key);
      if (!hit) return null;
      if (hit.expiresAt <= Date.now()) {
        store.delete(key);
        return null;
      }
      return hit.body;
    },

    set(key: string, body: string): void {
      store.set(key, { body, expiresAt: Date.now() + ttlMs });
    },

    invalidate(): void {
      store.clear();
    },
  };
}
