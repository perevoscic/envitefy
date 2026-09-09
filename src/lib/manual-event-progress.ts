import { parseCalendarDateTimeToIso } from "./calendar-date-time";
import { replaceDraftMedia, retainDraftMedia, type EditorSnapshot } from "./template-draft-storage";

const EDITOR_PATHS = new Set([
  "/event/manual", "/event/general", "/event/special-events",
  ...["general", "special-events", "appointments", "workshops", "soccer", "football", "football-season", "cheerleading", "dance-ballet"].map((category) => `/event/${category}/customize`),
]);

export function manualEventEditHref(eventId: string, data: Record<string, unknown> | null | undefined): string | null {
  const editor = data?.manualEditor;
  if (!editor || typeof editor !== "object" || Array.isArray(editor)) return null;
  const path = (editor as Record<string, unknown>).path;
  return typeof path === "string" && EDITOR_PATHS.has(path)
    ? `${path}?edit=${encodeURIComponent(eventId)}`
    : null;
}

/** Save incomplete manual input without invoking publish validation or calendars. */
export async function saveManualEventProgress({ eventId, snapshot, category, templateId, path, clientDraftId }: {
  eventId?: string;
  snapshot: EditorSnapshot;
  category: string;
  templateId?: string;
  path: string;
  clientDraftId: string;
}): Promise<string> {
  if (!EDITOR_PATHS.has(path)) throw new Error("This editor cannot save progress here.");
  let existing: EditorSnapshot = {};
  if (eventId) {
    const response = await fetch(`/api/history/${encodeURIComponent(eventId)}`, { credentials: "include" });
    if (!response.ok) throw new Error("Unable to open this event. Please retry saving.");
    const row = await response.json();
    existing = row.data || {};
  }
  const assets: Record<string, Blob> = {};
  await retainDraftMedia(snapshot, assets);
  const remoteMedia: Record<string, string> = {};
  for (const [key, file] of Object.entries(assets)) {
    const body = new FormData();
    body.set("file", file, file instanceof File ? file.name : "event-photo");
    if (eventId) body.set("eventId", eventId);
    const response = await fetch("/api/templates/media", { method: "POST", credentials: "include", body });
    const result = await response.json();
    if (!response.ok || !result.url) throw new Error(result.error || "A photo could not be saved. Please retry.");
    remoteMedia[key] = result.url;
  }
  const saved = replaceDraftMedia(snapshot, remoteMedia);
  const raw = saved.data || saved;
  const data = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  const timezone = String(data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone);
  const date = data.date || data.whenDate;
  const time = data.time || data.startTime;
  const start = date ? parseCalendarDateTimeToIso(`${date}${time && !data.fullDay ? `T${time}` : ""}`, timezone) : null;
  const title = String(data.title || "Event draft");
  const response = await fetch(eventId ? `/api/history/${encodeURIComponent(eventId)}` : "/api/history", {
    method: eventId ? "PATCH" : "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      clientDraftId,
      title: existing.status === "published" ? existing.title || title : title,
      data: {
        ...existing,
        ...(existing.status === "published" ? {} : {
          ...data, title, category, templateId, timezone, tz: timezone,
          startAt: start, startISO: start, start,
          status: "draft", draftStatus: "draft", ownership: "owned", createdVia: "manual", createdManually: true,
        }),
        manualEditor: { path, snapshot: saved },
      },
    }),
  });
  const result = await response.json();
  if (!response.ok || !result.id) throw new Error(result.error || "Unable to save your progress. Please try again.");
  window.dispatchEvent(new CustomEvent("history:updated", { detail: { id: result.id } }));
  return result.id;
}
