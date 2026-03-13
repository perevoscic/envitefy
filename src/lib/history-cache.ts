import type { CacheableHistoryView, HistoryTimeFilter } from "@/lib/history-view";

/**
 * Simple in-memory cache for projected event history responses.
 * Cache is invalidated on mutations (POST, PATCH, DELETE).
 */

type CacheEntry<T> = {
  data: T;
  timestamp: number;
};

const CACHE_TTL_MS = 30 * 1000; // 30 seconds
const cache = new Map<string, CacheEntry<any>>();

function getCacheKey(
  userId: string,
  view: CacheableHistoryView,
  limit: number,
  timeFilter: HistoryTimeFilter
): string {
  return `history:v3:${userId}:${view}:${limit}:${timeFilter}`;
}

export function getCachedHistory(
  userId: string,
  view: CacheableHistoryView,
  limit: number,
  timeFilter: HistoryTimeFilter
): any[] | null {
  const key = getCacheKey(userId, view, limit, timeFilter);
  const entry = cache.get(key);
  if (!entry) return null;

  const age = Date.now() - entry.timestamp;
  if (age > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }

  return entry.data;
}

export function setCachedHistory(
  userId: string,
  view: CacheableHistoryView,
  limit: number,
  timeFilter: HistoryTimeFilter,
  items: any[]
): void {
  const key = getCacheKey(userId, view, limit, timeFilter);
  cache.set(key, {
    data: items,
    timestamp: Date.now(),
  });
}

export function invalidateUserHistory(userId: string): void {
  const prefix = `history:v`;
  for (const key of cache.keys()) {
    if (key.startsWith(prefix) && key.includes(`:${userId}:`)) {
      cache.delete(key);
    }
  }
}

export function invalidateAllHistory(): void {
  cache.clear();
}

export function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (now - entry.timestamp > CACHE_TTL_MS) {
      cache.delete(key);
    }
  }
}



