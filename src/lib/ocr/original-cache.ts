type CacheEntry = {
  bytes: Buffer;
  expiresAt: number;
  timer: ReturnType<typeof setTimeout>;
};

/** Server memory only. Callers must authorize every request before reading this cache. */
export function createScanOriginalCache({
  ttlMs = 5 * 60_000,
  maxBytes = 32 * 1024 * 1024,
  maxEntries = 32,
  now = Date.now,
} = {}) {
  const entries = new Map<string, CacheEntry>();
  const pending = new Map<string, Promise<Buffer>>();
  let sizeBytes = 0;

  function remove(key: string) {
    const entry = entries.get(key);
    if (!entry) return;
    clearTimeout(entry.timer);
    sizeBytes -= entry.bytes.length;
    entries.delete(key);
  }

  function prune() {
    const time = now();
    for (const [key, entry] of entries) {
      if (entry.expiresAt <= time) remove(key);
    }
  }

  function retain(key: string, bytes: Buffer) {
    prune();
    if (bytes.length > maxBytes) return;
    while (entries.size >= maxEntries || sizeBytes + bytes.length > maxBytes) {
      const oldest = entries.keys().next().value;
      if (oldest === undefined) return;
      remove(oldest);
    }
    const timer = setTimeout(() => remove(key), ttlMs);
    timer.unref();
    entries.set(key, { bytes, expiresAt: now() + ttlMs, timer });
    sizeBytes += bytes.length;
  }

  return {
    async read(key: string, load: () => Promise<Buffer>): Promise<Buffer> {
      prune();
      const cached = entries.get(key);
      if (cached) {
        // Touch the LRU order without extending the five-minute lifetime.
        entries.delete(key);
        entries.set(key, cached);
        return Buffer.from(cached.bytes);
      }
      let request = pending.get(key);
      if (!request) {
        // Bound the bookkeeping for simultaneous loads as well as retained files.
        if (pending.size >= maxEntries) return load();
        const started = Promise.resolve()
          .then(load)
          .then((bytes) => {
            if (pending.get(key) === started) retain(key, bytes);
            return bytes;
          })
          .finally(() => {
            if (pending.get(key) === started) pending.delete(key);
          });
        pending.set(key, started);
        request = started;
      }
      // Neither a download nor a caller modifying its copy can alter the cached original.
      return Buffer.from(await request);
    },
    clear(): void {
      for (const key of entries.keys()) remove(key);
      pending.clear();
    },
  };
}

export const scanOriginalCache = createScanOriginalCache();
