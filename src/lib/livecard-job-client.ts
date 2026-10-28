/** Status failures are connection failures, never evidence that paid work failed. */
export class ArtworkConnectionError extends Error {
  constructor(message: string, readonly retryable = true) { super(message); }
}
export type ArtworkJobStatus = Record<string, unknown> & { id: string; stage: string; state: string };
export async function readArtworkJobResponse(response: Response): Promise<ArtworkJobStatus> {
  if (response.status === 401) throw new ArtworkConnectionError("Sign in again, then reconnect to your artwork.", false);
  if (response.status === 403) throw new ArtworkConnectionError("You no longer have access to this artwork.", false);
  if (response.status === 404) throw new ArtworkConnectionError("Your artwork job could not be found. Reconnect to try again.", false);
  if (!response.ok) throw new ArtworkConnectionError("Artwork connection interrupted. Reconnect to the same job.", response.status === 408 || response.status === 429 || response.status >= 500);
  let body: unknown;
  try { body = await response.json(); }
  catch { throw new ArtworkConnectionError("Artwork connection interrupted. Reconnect to the same job."); }
  const job = body && typeof body === "object" ? (body as Record<string, unknown>).job : null;
  if (!job || typeof job !== "object" || Array.isArray(job)) throw new ArtworkConnectionError("Artwork status is temporarily unavailable. Reconnect to the same job.");
  const value = job as Record<string, unknown>;
  if (typeof value.id !== "string" || typeof value.stage !== "string" || !["queued", "running", "ready", "failed", "cancel_requested", "stopped"].includes(String(value.state)))
    throw new ArtworkConnectionError("Artwork status is temporarily unavailable. Reconnect to the same job.");
  return value as ArtworkJobStatus;
}
export function waitForArtworkPoll(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    signal.throwIfAborted();
    const abort = () => { clearTimeout(timer); reject(signal.reason); };
    const timer = setTimeout(() => { signal.removeEventListener("abort", abort); resolve(); }, ms);
    signal.addEventListener("abort", abort, { once: true });
  });
}
