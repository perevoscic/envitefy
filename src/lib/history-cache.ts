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
const userRevisions = new Map<string, number>();
const inflight = new Map<string, Promise<any[]>>();
let clearRevision = 0;

export function getHistoryCacheRevision(userId: string): string {
  return `${clearRevision}:${userRevisions.get(userId) || 0}`;
}

function getCacheKey(
  userId: string,
  view: CacheableHistoryView,
  limit: number,
  timeFilter: HistoryTimeFilter
): string {
  return `history:v4:${userId}:${view}:${limit}:${timeFilter}`;
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

export function getCachedHistoryStale(
  userId: string,
  view: CacheableHistoryView,
  limit: number,
  timeFilter: HistoryTimeFilter
): any[] | null {
  const key = getCacheKey(userId, view, limit, timeFilter);
  const entry = cache.get(key);
  return entry?.data ?? null;
}

export function setCachedHistory(
  userId: string,
  view: CacheableHistoryView,
  limit: number,
  timeFilter: HistoryTimeFilter,
  items: any[],
  expectedRevision = getHistoryCacheRevision(userId),
): void {
  if (expectedRevision !== getHistoryCacheRevision(userId)) return;
  const key = getCacheKey(userId, view, limit, timeFilter);
  cache.set(key, {
    data: items,
    timestamp: Date.now(),
  });
}

export function invalidateUserHistory(userId: string): void {
  userRevisions.set(userId, (userRevisions.get(userId) || 0) + 1);
  const prefix = `history:v`;
  for (const key of cache.keys()) {
    if (key.startsWith(prefix) && key.includes(`:${userId}:`)) {
      cache.delete(key);
    }
  }
}

export function invalidateAllHistory(): void {
  clearRevision += 1;
  userRevisions.clear();
  cache.clear();
  inflight.clear();
}

/** Scope concurrent reads to the account, filters and mutation revision. */
export function coalesceHistoryRead(
  userId: string,
  view: CacheableHistoryView,
  limit: number,
  timeFilter: HistoryTimeFilter,
  load: () => Promise<any[]>,
): Promise<any[]> {
  const key = `${getCacheKey(userId, view, limit, timeFilter)}:${getHistoryCacheRevision(userId)}`;
  const pending = inflight.get(key);
  if (pending) return pending;
  const promise = Promise.resolve().then(load).finally(() => {
    if (inflight.get(key) === promise) inflight.delete(key);
  });
  inflight.set(key, promise);
  return promise;
}

export function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (now - entry.timestamp > CACHE_TTL_MS) {
      cache.delete(key);
    }
  }
}


