export type DiscoveryRequestCache = {
  imageText: WeakMap<Buffer, Promise<string>>;
  optimizedDataUrl: WeakMap<Buffer, Promise<string | null>>;
  pdfPageImageBuckets: WeakMap<Buffer, Map<string, Promise<Buffer | null>>>;
};

export function createDiscoveryRequestCache(): DiscoveryRequestCache {
  return {
    imageText: new WeakMap(),
    optimizedDataUrl: new WeakMap(),
    pdfPageImageBuckets: new WeakMap(),
  };
}

export function getOrCreateWeakCacheValue<T>(
  cache: WeakMap<Buffer, Promise<T>>,
  key: Buffer,
  factory: () => Promise<T>
): Promise<T> {
  const existing = cache.get(key);
  if (existing) return existing;
  const created = factory().catch((error) => {
    cache.delete(key);
    throw error;
  });
  cache.set(key, created);
  return created;
}

export function getOrCreatePdfPageImage(
  cache: DiscoveryRequestCache,
  pdfBuffer: Buffer,
  pageIndex: number,
  factory: () => Promise<Buffer | null>
): Promise<Buffer | null> {
  let bucket = cache.pdfPageImageBuckets.get(pdfBuffer);
  if (!bucket) {
    bucket = new Map<string, Promise<Buffer | null>>();
    cache.pdfPageImageBuckets.set(pdfBuffer, bucket);
  }
  const key = String(pageIndex);
  const existing = bucket.get(key);
  if (existing) return existing;
  const created = factory().catch((error) => {
    bucket.delete(key);
    throw error;
  });
  bucket.set(key, created);
  return created;
}
