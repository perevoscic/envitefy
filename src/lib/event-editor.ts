import { buildEventPath } from "@/utils/event-url";
import type { DraftValue } from "./template-draft-storage";

export type EventEditorStatus = "draft" | "published";
export type EventEditorPayload = {
  title: string;
  data: Record<string, DraftValue | undefined>;
  publicSlug?: string;
  claim?: boolean;
};
export type EventEditorRecord = {
  id: string;
  title?: string;
  public_slug?: string | null;
  revision?: string;
  data: Record<string, unknown>;
};
export type EventEditorHistoryFetch = (input: string, options?: RequestInit) => Promise<Response>;

// These describe the editing surface, not the event being saved.
const presentationFields = new Set([
  "activeView",
  "activeSection",
  "themesExpanded",
  "mobileMenuOpen",
]);
export function eventEditorContent(snapshot: object): object {
  return Object.fromEntries(
    Object.entries(snapshot).filter(([key]) => !presentationFields.has(key)),
  );
}

export function eventEditorActions(published: boolean, dirty: boolean) {
  return {
    showDraft: !published,
    showPrimary: !published || dirty,
    primaryLabel: published ? "Save changes" : "Publish",
  };
}

/** All authored page modules update the same saved identity through this writer. */
export async function persistEventEditorPayload({
  payload,
  eventId,
  clientDraftId,
  historyFetch,
  existing,
}: {
  payload: EventEditorPayload;
  eventId?: string;
  clientDraftId: string;
  historyFetch: EventEditorHistoryFetch;
  existing?: EventEditorRecord | null;
}): Promise<EventEditorRecord> {
  const data: Record<string, unknown> = {
    ...existing?.data,
    ...payload.data,
    status: "published",
    draftStatus: "published",
    manualEditor: null,
    // Guest activity is not part of an editor's sample content.
    ...(existing && "numberOfGuests" in existing.data
      ? { numberOfGuests: existing.data.numberOfGuests }
      : {}),
  };
  const body = JSON.stringify({ ...payload, data, clientDraftId });
  const send = async (id?: string) => {
    const response = await historyFetch(
      id ? `/api/history/${encodeURIComponent(id)}` : "/api/history",
      {
        method: id ? "PATCH" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body,
      },
    );
    const result = await response.json().catch(() => null);
    if (
      !response.ok ||
      !result ||
      typeof result.id !== "string" ||
      !result.data ||
      typeof result.data !== "object"
    ) {
      throw new Error(
        typeof result?.error === "string"
          ? result.error
          : "Your event could not be saved. Your changes are still here; please retry.",
      );
    }
    return result as EventEditorRecord;
  };
  let row = await send(eventId);
  // A retried create can return an existing identity without applying newer input.
  if (
    !eventId &&
    (row.data.status !== "published" ||
      Object.keys(payload.data).some(
        (key) => JSON.stringify(row.data[key]) !== JSON.stringify(data[key]),
      ))
  ) {
    row = await send(row.id);
  }
  return row;
}

export function eventEditorPublicHref(row: EventEditorRecord, title?: string) {
  return buildEventPath(
    row.id,
    title || row.title,
    undefined,
    row.public_slug || (typeof row.data.publicSlug === "string" ? row.data.publicSlug : undefined),
  );
}
