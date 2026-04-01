function toAbortError(reason?: unknown) {
  if (reason instanceof Error) {
    if (reason.name !== "AbortError") {
      (reason as Error & { name: string }).name = "AbortError";
    }
    return reason;
  }
  const message =
    typeof reason === "string" && reason.trim() ? reason.trim() : "Discovery cancelled";
  const error = new Error(message) as Error & { name: string };
  error.name = "AbortError";
  return error;
}

const activeDiscoveryControllers = new Map<string, AbortController>();

export function beginDiscoveryPipelineCancellationScope(eventId: string) {
  const prior = activeDiscoveryControllers.get(eventId);
  if (prior && !prior.signal.aborted) {
    prior.abort(toAbortError("Discovery superseded"));
  }
  const controller = new AbortController();
  activeDiscoveryControllers.set(eventId, controller);
  return controller;
}

export function finishDiscoveryPipelineCancellationScope(
  eventId: string,
  controller: AbortController,
) {
  if (activeDiscoveryControllers.get(eventId) === controller) {
    activeDiscoveryControllers.delete(eventId);
  }
}

export function cancelDiscoveryPipeline(eventId: string) {
  const controller = activeDiscoveryControllers.get(eventId);
  if (!controller) return false;
  if (!controller.signal.aborted) {
    controller.abort(toAbortError());
  }
  return true;
}

export function throwIfDiscoveryCancelled(signal?: AbortSignal | null) {
  if (!signal?.aborted) return;
  throw toAbortError(signal.reason);
}

export function isDiscoveryCancellationError(error: unknown) {
  if (error instanceof Error && error.name === "AbortError") return true;
  const message =
    error instanceof Error ? error.message : typeof error === "string" ? error : String(error || "");
  return /cancel|abort/i.test(message);
}
