export type FeatureVisibilityApiPayload = {
  persona?: unknown;
  personas?: unknown;
  visibleTemplateKeys: unknown[];
  dashboardLayout?: unknown;
  defaultCreateIntent?: unknown;
  sportPreferences?: unknown;
  sportPreferenceSuggestion?: unknown;
  quickAccess?: unknown;
};

export const FEATURE_VISIBILITY_TIMEOUT_MS = 10_000;
const RETRY_DELAY_MS = 300;
const pending = new Map<string, Promise<FeatureVisibilityApiPayload>>();

class PreferenceResponseError extends Error {
  constructor(readonly status: number) { super("Could not load feature visibility"); }
}

export function invalidateFeatureVisibility() {
  pending.clear();
}

/** Share in-flight reads only within the current account, including one transient retry. */
export function loadFeatureVisibility(identity: string): Promise<FeatureVisibilityApiPayload> {
  const existing = pending.get(identity);
  if (existing) return existing;
  const controller = new AbortController();
  let timeoutTimer: ReturnType<typeof setTimeout>;
  let retryTimer: ReturnType<typeof setTimeout> | undefined;
  let finishRetryDelay: (() => void) | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutTimer = setTimeout(() => {
      reject(new Error("Loading your workspace preferences took too long. Please retry."));
      controller.abort();
    }, FEATURE_VISIBILITY_TIMEOUT_MS);
  });
  const read = (async () => {
    for (let attempt = 0; ; attempt += 1) {
      try {
        const response = await fetch("/api/user/feature-visibility", {
          credentials: "include", cache: "no-store", signal: controller.signal,
        });
        if (!response.ok) throw new PreferenceResponseError(response.status);
        const payload = await response.json();
        if (!payload || !Array.isArray(payload.visibleTemplateKeys)) {
          throw new Error("Invalid workspace preferences response");
        }
        return payload as FeatureVisibilityApiPayload;
      } catch (error) {
        const retryable = !(error instanceof PreferenceResponseError) ||
          error.status === 408 || error.status === 429 || error.status >= 500;
        if (attempt > 0 || !retryable || controller.signal.aborted) throw error;
        await new Promise<void>((resolve) => {
          finishRetryDelay = resolve;
          retryTimer = setTimeout(resolve, RETRY_DELAY_MS);
        });
        finishRetryDelay = undefined;
        if (controller.signal.aborted) throw error;
      }
    }
  })();
  const request = Promise.race([read, timeout]).finally(() => {
    clearTimeout(timeoutTimer);
    clearTimeout(retryTimer);
    finishRetryDelay?.();
    if (pending.get(identity) === request) pending.delete(identity);
  });
  pending.set(identity, request);
  return request;
}
