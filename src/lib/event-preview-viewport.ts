import { normalizeEventPageColor } from "./event-page-chrome.ts";

export const EVENT_PREVIEW_DEVICES = {
  desktop: { label: "Desktop view", width: 1440, height: 900 },
  tablet: { label: "iPad / tablet view", width: 820, height: 1180 },
  mobile: { label: "Mobile view", width: 390, height: 844 },
} as const;

export type EventPreviewDevice = keyof typeof EVENT_PREVIEW_DEVICES;

export function initialEventPreviewDevice(width: number): EventPreviewDevice {
  return width < 768 ? "mobile" : width < 1024 ? "tablet" : "desktop";
}

/** Cards open in Design; event pages open in the event viewer. */
export function buildOwnerEventViewHref(
  eventHref: string,
  productKind: "card" | "event" | "signup" | "unknown" = "event",
): string {
  const url = new URL(eventHref, "https://envitefy.local");
  for (const key of ["edit", "editor", "eventColor", "preview", "embed", "returnTo", "view", "updated", "created", "t"]) {
    url.searchParams.delete(key);
  }
  url.searchParams.set("tab", productKind === "card" ? "design" : "event");
  return `${url.pathname}${url.search}${url.hash}`;
}

export function fitEventPreview(device: EventPreviewDevice, width: number, height: number) {
  const viewport = EVENT_PREVIEW_DEVICES[device];
  const scale = Math.max(0, Math.min(1, width / viewport.width, height / viewport.height));
  return { scale, width: viewport.width * scale, height: viewport.height * scale };
}

/** A phone viewing Mobile uses its own CSS pixels, with no scaled device frame. */
export function getEventPreviewLayout(
  device: EventPreviewDevice,
  width: number,
  height: number,
  nativeMobile = false,
) {
  if (nativeMobile && device === "mobile" && width > 0 && height > 0) {
    return { viewport: { width, height }, fit: { scale: 1, width, height } };
  }
  return { viewport: EVENT_PREVIEW_DEVICES[device], fit: fitEventPreview(device, width, height) };
}

export function buildOwnerEventEditHref(editHref: string, eventHref?: string, backgroundColor?: string): string {
  const url = new URL(editHref, "https://envitefy.local");
  url.searchParams.set("editor", "menu");
  if (eventHref) url.searchParams.set("returnTo", buildOwnerEventViewHref(eventHref));
  const eventColor = normalizeEventPageColor(backgroundColor);
  if (eventColor) url.searchParams.set("eventColor", eventColor);
  return `${url.pathname}${url.search}${url.hash}`;
}

/** Closing an owner editing menu returns to the event canvas, not its legacy inline preview. */
export function ownerEventEditorReturnHref(search: Pick<URLSearchParams, "get"> | null): string | null {
  if (search?.get("editor") !== "menu") return null;
  const returnTo = eventPreviewReturnHref(search.get("returnTo") || undefined, "");
  if (returnTo) return buildOwnerEventViewHref(returnTo);
  const eventId = search.get("edit")?.trim();
  return eventId ? buildOwnerEventViewHref(`/event/${encodeURIComponent(eventId)}`) : null;
}

export type EventPreviewEntryContext = Partial<Record<
  "created" | "calendarSync" | "calendarProvider" | "calendarSetup" |
  "googleAuth" | "outlookAuth" | "googleAuthReason" | "outlookAuthReason",
  string
>>;

export function buildEmbeddedEventPreviewHref(publicUrl: string, entryContext?: EventPreviewEntryContext): string {
  const url = new URL(publicUrl, "https://envitefy.local");
  for (const key of ["edit", "editor", "eventColor", "tab", "returnTo", "updated", "created", "t"]) {
    url.searchParams.delete(key);
  }
  url.searchParams.set("preview", "owner");
  url.searchParams.set("embed", "dashboard-preview");
  // Post-publish calendar notices stay in the owner frame, outside the shared URL.
  for (const [key, value] of Object.entries(entryContext || {})) {
    if (value) url.searchParams.set(key, value);
  }
  return `${url.pathname}${url.search}${url.hash}`;
}

/** Open the clean fullscreen preview and return to this event's owner canvas. */
export function buildOwnerEventPreviewHref(publicUrl: string): string {
  const url = new URL(buildEmbeddedEventPreviewHref(publicUrl), "https://envitefy.local");
  url.searchParams.delete("embed");
  url.searchParams.set("returnTo", buildOwnerEventViewHref(publicUrl));
  return `${url.pathname}${url.search}${url.hash}`;
}

export function eventPreviewReturnHref(
  value: string | string[] | undefined,
  fallback: string,
): string {
  const href = Array.isArray(value) ? value[0] : value;
  if (!href?.startsWith("/") || href.startsWith("//")) return fallback;
  try {
    const url = new URL(href, "https://envitefy.local");
    return url.origin === "https://envitefy.local"
      ? `${url.pathname}${url.search}${url.hash}`
      : fallback;
  } catch {
    return fallback;
  }
}
