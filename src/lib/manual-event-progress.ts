import { parseCalendarDateTimeToIso } from "./calendar-date-time";
import { normalizeFootballPageText } from "./football-page-text";
import { replaceDraftMedia, retainDraftMedia, type EditorSnapshot } from "./template-draft-storage";

const EDITOR_PATHS = new Set([
  "/event/manual",
  "/event/general",
  "/event/special-events",
  ...[
    "general",
    "special-events",
    "appointments",
    "workshops",
    "soccer",
    "football",
    "football-season",
    "cheerleading",
    "dance-ballet",
  ].map((category) => `/event/${category}/customize`),
]);

export function manualEventEditHref(
  eventId: string,
  data: Record<string, unknown> | null | undefined,
): string | null {
  const editor = data?.manualEditor;
  if (!editor || typeof editor !== "object" || Array.isArray(editor)) return null;
  const path = (editor as Record<string, unknown>).path;
  return typeof path === "string" && EDITOR_PATHS.has(path)
    ? `${path}?edit=${encodeURIComponent(eventId)}`
    : null;
}

/** Save incomplete manual input without invoking publish validation or calendars. */
export async function saveManualEventProgress({
  eventId,
  snapshot,
  category,
  templateId,
  path,
  clientDraftId,
}: {
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
    const response = await fetch(`/api/history/${encodeURIComponent(eventId)}`, {
      credentials: "include",
    });
    if (!response.ok) throw new Error("Unable to open this event. Please retry saving.");
    const row = await response.json();
    existing = row.data || {};
  }
  const assets: Record<string, Blob> = {};
  await retainDraftMedia(snapshot, assets);
  const remoteMedia: Record<string, string> = {};
  for (const [key, file] of Object.entries(assets)) {
    const body = new FormData();
    body.set(
      "file",
      file,
      file instanceof File
        ? file.name
        : file.type === "application/pdf"
          ? "event-document.pdf"
          : "event-photo",
    );
    body.set("usage", file.type === "application/pdf" ? "attachment" : "header");
    body.set("uploadToken", `manual-${clientDraftId}`);
    if (eventId) body.set("eventId", eventId);
    const response = await fetch("/api/upload", {
      method: "POST",
      credentials: "include",
      body,
    });
    const result = await response.json();
    const url =
      result.stored?.source?.url || result.stored?.display?.url || result.eventMedia?.thumbnail;
    if (!response.ok || !result.ok || !url)
      throw new Error(result.error || "A photo could not be saved. Please retry.");
    remoteMedia[key] = url;
  }
  const saved = replaceDraftMedia(snapshot, remoteMedia);
  const raw = saved.data || saved;
  const data = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  const timezone = String(data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone);
  const date = data.date || data.whenDate;
  const time = data.time || data.startTime;
  const start = date
    ? parseCalendarDateTimeToIso(`${date}${time && !data.fullDay ? `T${time}` : ""}`, timezone)
    : null;
  const endDate = data.endDate || date;
  const end =
    endDate && data.endTime
      ? parseCalendarDateTimeToIso(`${endDate}T${data.endTime}`, timezone)
      : null;
  const title = String(data.title || "Event draft");
  const response = await fetch(
    eventId ? `/api/history/${encodeURIComponent(eventId)}` : "/api/history",
    {
      method: eventId ? "PATCH" : "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientDraftId,
        title: existing.status === "published" ? existing.title || title : title,
        data: {
          ...existing,
          ...(existing.status === "published"
            ? {}
            : {
                title,
                category,
                templateId,
                timezone,
                tz: timezone,
                venue: data.venue || null,
                location: data.location || null,
                description: data.description || data.details || null,
                heroImage: data.hero || data.headerPreviewUrl || null,
                startAt: start,
                startISO: start,
                start,
                endAt: end,
                endISO: end,
                end,
                allDay: data.fullDay || data.allDay || false,
                status: "draft",
                draftStatus: "draft",
                ownership: "owned",
                createdVia: "manual",
                createdManually: true,
                ...(templateId === "football-season"
                  ? {
                      footballPageText: normalizeFootballPageText(data.footballPageText),
                      footballHiddenSections: data.footballHiddenSections || [],
                      pageTemplateId: saved.pageTemplateId,
                      heroImageFilterEnabled: data.heroImageFilterEnabled !== false,
                      extra: data.extra || {},
                      customFields: data.extra || {},
                      advancedSections: saved.advancedState || {},
                      guestPlanning: data.guestPlanning || {},
                      rsvpEnabled: data.rsvpEnabled === true,
                      rsvpDeadline: data.rsvpDeadline || "",
                    }
                  : {}),
              }),
          manualEditor: { path, snapshot: saved },
        },
      }),
    },
  );
  const result = await response.json();
  if (!response.ok || !result.id)
    throw new Error(result.error || "Unable to save your progress. Please try again.");
  if (!eventId && JSON.stringify(result.data?.manualEditor?.snapshot) !== JSON.stringify(saved)) {
    // A retried POST can recover a previously created identity without applying
    // newer input. Update that same owned draft before reporting success.
    return saveManualEventProgress({
      eventId: result.id,
      snapshot: saved,
      category,
      templateId,
      path,
      clientDraftId,
    });
  }
  window.dispatchEvent(new CustomEvent("history:updated", { detail: { id: result.id } }));
  return result.id;
}
