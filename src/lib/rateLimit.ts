/**
 * Simple in-memory rate limiter using a sliding window.
 * Works per-process — sufficient for single-instance deployments (Vercel hobby/pro).
 * For multi-instance, replace the Map with Redis.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt < now) store.delete(key);
  }
}, 5 * 60 * 1000);

/**
 * Check if a key has exceeded the rate limit.
 * @param key      - Unique identifier (e.g. IP address)
 * @param limit    - Max requests allowed in the window
 * @param windowMs - Window duration in milliseconds
 * @returns `true` if rate limit exceeded, `false` if request is allowed
 */
export function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  if (entry.count >= limit) return true;

  entry.count += 1;
  return false;
}

/**
 * Extract the client IP from a Next.js Request.
 * Checks x-forwarded-for (set by Vercel/proxies) then falls back to a placeholder.
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "unknown";
}
