/**
 * Remove discovery source fields that could expose raw PDF/base64 or blob URLs to non-managing viewers.
 */
export function redactDiscoverySourceForPublicView<T extends Record<string, any>>(
  data: T | null | undefined,
): T {
  if (!data || typeof data !== "object") return (data ?? {}) as T;
  const ds = data.discoverySource;
  if (!ds || typeof ds !== "object") return data;
  const input = (ds as any).input;
  if (!input || typeof input !== "object" || input.type !== "file") {
    return data;
  }
  const {
    dataUrl: _d,
    storageUrl: _s,
    storagePathname: _p,
    ...restInput
  } = input as Record<string, unknown>;
  return {
    ...data,
    discoverySource: {
      ...ds,
      input: restInput,
    },
  } as T;
}
