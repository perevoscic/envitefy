import { persistImageMediaValue } from "@/utils/media-upload-client";
import {
  type CustomEventPage,
  customEventPageData,
  normalizeCustomEventPage,
  normalizeEventCustomDesign,
  normalizeCustomEventDetails,
  customEventCategory,
  EVENT_DETAIL_FIELDS,
  safeEventLink,
} from "./event-custom-design";
import { parseCalendarDateTimeToIso } from "./calendar-date-time";

export function customEventFieldErrors(page: CustomEventPage, publishing: boolean): Record<string, string> {
  const d = page.details;
  const errors: Record<string, string> = {};
  for (const key of EVENT_DETAIL_FIELDS) {
    const limit = key === "description" ? 6000 : key === "location" ? 1000 : 300;
    if (d[key].trim().length > limit) errors[key] = `Keep this field under ${limit + 1} characters.`;
  }
  if (publishing) {
    if (!d.title.trim()) errors.title = "Add an event title.";
    if (!d.date) errors.date = "Add an event date.";
    if (!d.location.trim() && !d.venue.trim()) errors.venue = "Add a venue or location.";
  }
  for (const key of ["date", "endDate"] as const) {
    if (d[key] && (!/^\d{4}-\d{2}-\d{2}$/.test(d[key]) || !parseCalendarDateTimeToIso(d[key], "UTC")))
      errors[key] = "Enter a valid date.";
  }
  for (const key of ["time", "endTime"] as const) {
    if (d[key] && !/^([01]\d|2[0-3]):[0-5]\d$/.test(d[key])) errors[key] = "Enter a valid time.";
  }
  d.registryLinks.forEach((link, i) => {
    if (link.url && !safeEventLink(link.url)) errors[`registry-${i}-url`] = "Enter a valid website link (https://example.com).";
    if (link.label.length > 180) errors[`registry-${i}-label`] = "Keep the registry label under 181 characters.";
  });
  d.sections.forEach((section, i) => {
    if (section.title.length > 180) errors[`section-${i}-title`] = "Keep the section heading under 181 characters.";
    if (section.body.length > 6000) errors[`section-${i}-body`] = "Keep the section content under 6001 characters.";
  });
  d.sections.forEach((section, i) => {
    if (section.title.length > 180) errors[`section-${i}-title`] = "Keep the section heading under 181 characters.";
    if (section.body.length > 6000) errors[`section-${i}-body`] = "Keep the section content under 6001 characters.";
  });
  if (!errors.date && !errors.endDate && !errors.time && !errors.endTime) {
    const canonical = customEventPageData(withCustomEventTimezone(page));
    if (canonical.end && canonical.start && Date.parse(canonical.end) <= Date.parse(canonical.start))
      errors.endTime = "End time must be after the start.";
  }
  return errors;
}

export function withCustomEventTimezone(page: CustomEventPage): CustomEventPage {
  if (page.details.timezone) return page;
  return {
    ...page,
    details: {
      ...page.details,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    },
  };
}

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
  const errors = customEventFieldErrors(page, status === "published");
  if (Object.keys(errors).length) throw new Error(Object.values(errors).join(" "));
  const valid = normalizeCustomEventPage(withCustomEventTimezone(page));
  if (!valid) {
    if (page.version !== 1 || !customEventCategory(page.category))
      throw new Error("This event page format could not be read. Return to Templates and reopen the page.");
    if (!normalizeEventCustomDesign(page.design))
      throw new Error("The page design could not be read. Open Edit details & design and choose Redesign with Envitefy.");
    if (!normalizeCustomEventDetails(page.details))
      throw new Error("The event details could not be read. Open Edit details & design and check the date, time, time zone, sections and registry links.");
    if (page.artwork.length > 12_000_000)
      throw new Error("The hero image is too large to save. Use Replace hero image to choose a smaller image.");
    throw new Error("The hero image is not in a supported save format. Open Edit details & design and use Replace hero image or Redesign with Envitefy.");
  }
  if (status === "published") {
    if (
      !valid.details.title ||
      !valid.details.date ||
      !(valid.details.location || valid.details.venue)
    )
      throw new Error("Add an event title, date, and location before publishing.");
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
