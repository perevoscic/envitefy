/**
 * Simple in-memory cache for event history with TTL and user-specific keys
 * Cache is invalidated on mutations (POST, PATCH, DELETE)
 */

type CacheEntry<T> = {
  data: T;
  timestamp: number;
};

const CACHE_TTL_MS = 30 * 1000; // 30 seconds
const cache = new Map<string, CacheEntry<any>>();

/**
 * Get cache key for a user's event history
 */
function getCacheKey(userId: string): string {
  return `history:${userId}`;
}

/**
 * Get cached history for a user
 */
export function getCachedHistory(userId: string): any[] | null {
  const key = getCacheKey(userId);
  const entry = cache.get(key);
  if (!entry) return null;
  
  const age = Date.now() - entry.timestamp;
  if (age > CACHE_TTL_MS) {
    // Cache expired
    cache.delete(key);
    return null;
  }
  
  return entry.data;
}

/**
 * Set cached history for a user
 */
export function setCachedHistory(userId: string, items: any[]): void {
  const key = getCacheKey(userId);
  cache.set(key, {
    data: items,
    timestamp: Date.now(),
  });
}

/**
 * Invalidate cache for a specific user (e.g., when events are created/updated)
 */
export function invalidateUserHistory(userId: string): void {
  const key = getCacheKey(userId);
  cache.delete(key);
}

/**
 * Invalidate cache for all users (use sparingly, e.g., when shares change)
 */
export function invalidateAllHistory(): void {
  cache.clear();
}

/**
 * Clean up expired entries (optional, for memory management)
 */
export function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (now - entry.timestamp > CACHE_TTL_MS) {
      cache.delete(key);
    }
  }
}

