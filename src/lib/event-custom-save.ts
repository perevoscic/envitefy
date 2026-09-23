import { persistImageMediaValue } from "@/utils/media-upload-client";
import {
  type CustomEventPage,
  customEventPageData,
  normalizeCustomEventPage,
} from "./event-custom-design";

export async function saveCustomEventPage({
  page,
  eventId,
  clientDraftId,
  status,
  existing = {},
}: {
  page: CustomEventPage;
  eventId?: string;
  clientDraftId: string;
  status: "draft" | "published";
  existing?: Record<string, unknown>;
}): Promise<{ id: string; page: CustomEventPage; data: Record<string, unknown> }> {
  const valid = normalizeCustomEventPage(page);
  if (!valid) throw new Error("Check your event details and design, then try again.");
  if (status === "published") {
    if (
      !valid.details.title ||
      !valid.details.date ||
      !(valid.details.location || valid.details.venue)
    )
      throw new Error("Add an event title, date, and location before publishing.");
    if (valid.details.time && !valid.details.timezone)
      throw new Error("Choose the event's time zone before publishing.");
  }
  const canonical = customEventPageData(valid);
  if (canonical.end && canonical.start && Date.parse(canonical.end) <= Date.parse(canonical.start))
    throw new Error("End time must be after the start.");
  const artwork = await persistImageMediaValue({
    value: valid.artwork,
    fileName: "event-page-artwork.webp",
  });
  if (!artwork) throw new Error("Your artwork could not be saved. Please try again.");
  const savedPage = { ...valid, artwork };
  const keepLivePage = existing.status === "published" && status === "draft";
  const data: Record<string, unknown> = keepLivePage
    ? { ...existing, customEventPageDraft: savedPage }
    : { ...existing, ...customEventPageData(savedPage), status, draftStatus: status };
  const response = await fetch(
    eventId ? `/api/history/${encodeURIComponent(eventId)}` : "/api/history",
    {
      method: eventId ? "PATCH" : "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientDraftId,
        title: keepLivePage ? existing.title : savedPage.details.title || "Event page draft",
        data,
      }),
    },
  );
  const result = await response.json();
  if (!response.ok || !result.id)
    throw new Error(result.error || "Your event page could not be saved. Please try again.");
  // Retried POSTs may recover the original identity without applying the latest content.
  if (
    !eventId &&
    result.data &&
    JSON.stringify(result.data.customEventPage) !== JSON.stringify(data.customEventPage)
  ) {
    return saveCustomEventPage({
      page: savedPage,
      eventId: result.id,
      clientDraftId,
      status,
      existing,
    });
  }
  window.dispatchEvent(new CustomEvent("history:updated", { detail: { id: result.id } }));
  return { id: result.id, page: savedPage, data };
}
