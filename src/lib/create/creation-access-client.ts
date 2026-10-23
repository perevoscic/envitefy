import type { CreationAccess } from "@/lib/creation-access";

export type InitialCreationAccess = { identity: string; access: CreationAccess };
export const CREATION_ACCESS_TIMEOUT_MS = 10_000;
const FIRST_ATTEMPT_TIMEOUT_MS = 4_000;
const RETRY_DELAY_MS = 300;
const pending = new Map<string, Promise<CreationAccess>>();

class AccessResponseError extends Error {
  constructor(readonly status: number, message: string) { super(message); }
}

export function invalidateCreationAccess(identity: string) {
  pending.delete(identity);
}

/** Share concurrent reads and one transient retry within a ten-second deadline. */
export function loadCreationAccess(identity: string): Promise<CreationAccess> {
  const existing = pending.get(identity);
  if (existing) return existing;
  let controller: AbortController | undefined;
  let expired = false;
  let timer: ReturnType<typeof setTimeout>;
  let attemptTimer: ReturnType<typeof setTimeout> | undefined;
  let retryTimer: ReturnType<typeof setTimeout> | undefined;
  let finishRetryDelay: (() => void) | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      expired = true;
      reject(new Error("Loading your event types took too long. Please try again."));
      controller?.abort();
    }, CREATION_ACCESS_TIMEOUT_MS);
  });
  const read = (async () => {
    for (let attempt = 0; ; attempt += 1) {
      const transport = new AbortController();
      controller = transport;
      try {
        const responseRead = (async () => {
          const response = await fetch("/api/user/creation-access?summary=1", {
            credentials: "include", cache: "no-store", signal: transport.signal,
          });
          const payload = await response.json();
          if (!response.ok) throw new AccessResponseError(response.status, payload?.error || "Could not load your event access.");
          const access = payload?.access;
          if (!access || !["standard", "restricted"].includes(access.policy) ||
            !Array.isArray(access.allowedCategories) || !access.allowedCategories.every((value: unknown) => typeof value === "string") ||
            !Array.isArray(access.allowedProducts) || !access.allowedProducts.every((value: unknown) => typeof value === "string")) {
            throw new Error("Could not load your event access. Please try again.");
          }
          return access as CreationAccess;
        })();
        // A stalled first connection must leave time for automatic recovery,
        // even if fetch fails to acknowledge its AbortSignal.
        return await (attempt === 0 ? Promise.race([
          responseRead,
          new Promise<never>((_, reject) => {
            attemptTimer = setTimeout(() => {
              reject(new Error("Loading your event types took too long. Please try again."));
              transport.abort();
            }, FIRST_ATTEMPT_TIMEOUT_MS);
          }),
        ]) : responseRead);
      } catch (failure) {
        clearTimeout(attemptTimer);
        const retryable = !(failure instanceof AccessResponseError) ||
          failure.status === 408 || failure.status === 429 || failure.status >= 500;
        if (attempt > 0 || !retryable || expired) throw failure;
        await new Promise<void>((resolve) => {
          finishRetryDelay = resolve;
          retryTimer = setTimeout(resolve, RETRY_DELAY_MS);
        });
        finishRetryDelay = undefined;
        if (expired) throw failure;
      } finally {
        clearTimeout(attemptTimer);
      }
    }
  })();
  const request = Promise.race([read, timeout]).finally(() => {
    clearTimeout(timer);
    clearTimeout(attemptTimer);
    clearTimeout(retryTimer);
    finishRetryDelay?.();
    if (pending.get(identity) === request) pending.delete(identity);
  });
  pending.set(identity, request);
  return request;
}
