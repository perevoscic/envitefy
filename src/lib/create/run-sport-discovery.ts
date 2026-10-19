import { resolveDiscoveryClientParseTimeoutMs } from "@/lib/discovery-budget";
import { discoveryTargetForSport } from "./create-intent";

const STAGE_PROGRESS: Record<string, number> = { ingested: 30, extract: 42, parse: 62, map: 82, enrich: 94, compose_public: 97, review_ready: 100 };
export function sportDiscoveryStageLabel(progress: number, sourceType: "file" | "url" | "text"): string {
  if (progress < 18) return sourceType === "file" ? "Uploading your file…" : sourceType === "text" ? "Reading your event details…" : "Checking the page…";
  if (progress < 45) return "Reading the schedule and event details…";
  if (progress < 72) return "Finding games, sessions and venues…";
  if (progress < 90) return "Organizing dates, venues and links…";
  if (progress < 100) return "Building your editable event page…";
  return "Opening the editor…";
}

/** Call only for the host's explicit cancellation, never a transient request failure/unmount. */
export async function cancelSportDiscovery(eventId: string | null, clientIntakeId?: string) {
  if (clientIntakeId) {
    const response = await fetch(`/api/discovery/intake?clientIntakeId=${encodeURIComponent(clientIntakeId)}`, { method: "DELETE", credentials: "include", keepalive: true });
    if (!response.ok) throw new Error("Cancellation could not be confirmed. Please retry.");
    return;
  }
  if (!eventId) return;
  const response = await fetch(`/api/discovery/${encodeURIComponent(eventId)}/cancel`, { method: "POST", credentials: "include", keepalive: true });
  if (!response.ok) throw new Error("Cancellation could not be confirmed. Please retry.");
}

function pause(signal: AbortSignal, ms = 1000) {
  return new Promise<void>((resolve, reject) => {
    signal.throwIfAborted();
    const abort = () => { clearTimeout(timer); reject(signal.reason); };
    const timer = setTimeout(() => { signal.removeEventListener("abort", abort); resolve(); }, ms);
    signal.addEventListener("abort", abort, { once: true });
  });
}

/** Preserve each existing editor's design selector when opening a completed import. */
export function sportDiscoveryBuilderHref(sport: string, eventId: string, pageTemplateId?: string): string {
  const target = discoveryTargetForSport(sport);
  const [pathname, query = ""] = target.builderHref(eventId).split("?");
  const params = new URLSearchParams(query);
  if (pageTemplateId) {
    params.set("templateId", pageTemplateId);
    const prefix = `${target.activityProfile}--`;
    if (target.workflow === "sports" && pageTemplateId.startsWith(prefix)) {
      const style = pageTemplateId.slice(prefix.length);
      if (style) params.set("style", style);
    }
  }
  return `${pathname}?${params}`;
}

export async function runSportDiscovery(params: {
  sport: string; file?: File; files?: File[]; url?: string; text?: string;
  clientIntakeId?: string; existingEventId?: string | null; pageTemplateId?: string;
  signal: AbortSignal; onProgress: (progress: number) => void;
  onEventId: (eventId: string) => void | Promise<void>;
}): Promise<string> {
  const { signal, onProgress, onEventId } = params;
  const target = discoveryTargetForSport(params.sport);
  const files = params.files?.length ? params.files : params.file ? [params.file] : [];
  const sourceType = files.length || !params.url ? "file" : "url";
  let eventId = params.existingEventId || "";
  signal.throwIfAborted();
  onProgress(files.length ? 5 : 8);
  if (!eventId && params.clientIntakeId) {
    const response = await fetch(`/api/discovery/intake?clientIntakeId=${encodeURIComponent(params.clientIntakeId)}`, { credentials: "include", cache: "no-store", signal });
    if (!response.ok) throw new Error("Your previous import could not be checked. Please retry; your source is kept.");
    const recovered = await response.json();
    if (typeof recovered.eventId === "string") eventId = recovered.eventId;
  }
  if (!eventId) {
    let body: BodyInit;
    let headers: Record<string, string> | undefined;
    const values = { workflow: target.workflow, activityProfile: target.activityProfile || undefined, text: params.text, clientIntakeId: params.clientIntakeId, pageTemplateId: params.pageTemplateId };
    if (files.length) {
      const form = new FormData();
      for (const file of files) form.append("file", file);
      for (const [key, value] of Object.entries(values)) if (value) form.append(key, value);
      body = form;
    } else {
      headers = { "Content-Type": "application/json" };
      body = JSON.stringify({ ...values, url: params.url });
    }
    const response = await fetch("/api/discovery/intake", { method: "POST", credentials: "include", headers, body, signal });
    const intake = await response.json().catch(() => ({}));
    if (!response.ok || !intake.eventId) throw new Error(intake.error || "Your event source could not be imported.");
    eventId = intake.eventId;
  }
  signal.throwIfAborted();
  await onEventId(eventId);
  signal.throwIfAborted();
  onProgress(28);
  const runResponse = await fetch(`/api/discovery/${encodeURIComponent(eventId)}/run`, { method: "POST", credentials: "include", signal });
  const run = await runResponse.json().catch(() => ({}));
  if (!runResponse.ok) throw new Error(run.error || "The import could not be resumed. Your source is kept.");
  const startedAt = Date.now();
  const timeoutMs = resolveDiscoveryClientParseTimeoutMs(sourceType);
  let transientFailures = 0;
  while (Date.now() - startedAt < timeoutMs) {
    signal.throwIfAborted();
    let response: Response;
    try { response = await fetch(`/api/discovery/${encodeURIComponent(eventId)}/status`, { credentials: "include", cache: "no-store", signal }); }
    catch (error) {
      if (signal.aborted || ++transientFailures > 3) throw error;
      await pause(signal);
      continue;
    }
    const status = await response.json().catch(() => ({}));
    if (response.status >= 500 && ++transientFailures <= 3) { await pause(signal); continue; }
    if (!response.ok) throw new Error(status.error || "Progress could not be checked. Please retry to resume this import.");
    transientFailures = 0;
    if (status.errorCode) throw new Error(status.errorMessage || "The event needs another import attempt. Your source is kept.");
    onProgress(STAGE_PROGRESS[status.processingStage] || 35);
    if (status.builderReady) {
      onProgress(100);
      return sportDiscoveryBuilderHref(params.sport, eventId, params.pageTemplateId);
    }
    await pause(signal);
  }
  throw new Error("Reading this event is taking longer than expected. Retry to resume your existing import.");
}
