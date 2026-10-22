import type { CreationAccess } from "@/lib/creation-access";

export type InitialCreationAccess = { identity: string; access: CreationAccess };
export const CREATION_ACCESS_TIMEOUT_MS = 10_000;
const pending = new Map<string, Promise<CreationAccess>>();

/** Share concurrent reads, but never reuse a response for another account. */
export function loadCreationAccess(identity: string): Promise<CreationAccess> {
  const existing = pending.get(identity);
  if (existing) return existing;
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error("Loading your event types took too long. Please try again."));
      controller.abort();
    }, CREATION_ACCESS_TIMEOUT_MS);
  });
  const read = (async () => {
    const response = await fetch("/api/user/creation-access?summary=1", {
      credentials: "include", cache: "no-store", signal: controller.signal,
    });
    const payload = await response.json();
    if (!response.ok || !payload.access) {
      throw new Error(payload.error || "Could not load your event access.");
    }
    return payload.access as CreationAccess;
  })();
  const request = Promise.race([read, timeout]).finally(() => {
    clearTimeout(timer);
    if (pending.get(identity) === request) pending.delete(identity);
  });
  pending.set(identity, request);
  return request;
}
