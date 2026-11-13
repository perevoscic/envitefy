import { normalizeEventPageColor } from "./event-page-chrome.ts";

export const EVENT_PREVIEW_DEVICES = {
  desktop: { label: "Desktop view", width: 1440, height: 900 },
  tablet: { label: "iPad / tablet view", width: 820, height: 1180 },
  mobile: { label: "Mobile view", width: 390, height: 844 },
} as const;

export type EventPreviewDevice = keyof typeof EVENT_PREVIEW_DEVICES;
export type EventPreviewOrientation = "portrait" | "landscape";

/** Desktop opens both framed devices; the unframed Desktop view stays explicit. */
export function initialEventPreviewDevice(width: number): EventPreviewDevice {
  return width >= 768 && width < 1024 ? "tablet" : "mobile";
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

// Pixel coordinates keep the supplied transparent device artwork proportional.
export const EVENT_PREVIEW_FRAMES = {
  mobile: {
    image: "/images/event-preview/phone-graphite.webp",
    imageWidth: 864, imageHeight: 1821,
    bounds: { x: 12, y: 22, width: 840, height: 1777 },
    screen: { x: 46, y: 50, width: 773, height: 1721, radius: 116 },
  },
  tablet: {
    image: "/images/event-preview/tablet-space-black.webp",
    imageWidth: 1082, imageHeight: 1454,
    bounds: { x: 52, y: 49, width: 979, height: 1355 },
    screen: { x: 99, y: 98, width: 883, height: 1260, radius: 40 },
  },
} as const;

/** Fit the supplied device image without stretching either axis. */
export function getEventPreviewFrameLayout(
  device: "tablet" | "mobile",
  width: number,
  height: number,
  orientation: EventPreviewOrientation = "portrait",
) {
  const frame = EVENT_PREVIEW_FRAMES[device];
  const screenWidth = EVENT_PREVIEW_DEVICES[device].width;
  const imageScale = screenWidth / frame.screen.width;
  const portraitShell = { width: frame.bounds.width * imageScale, height: frame.bounds.height * imageScale };
  const portraitViewport = { width: screenWidth, height: frame.screen.height * imageScale };
  const left = (frame.screen.x - frame.bounds.x) * imageScale;
  const top = (frame.screen.y - frame.bounds.y) * imageScale;
  const landscape = device === "tablet" && orientation === "landscape";
  const shell = landscape ? { width: portraitShell.height, height: portraitShell.width } : portraitShell;
  const viewport = landscape ? { width: portraitViewport.height, height: portraitViewport.width } : portraitViewport;
  const scale = Math.max(0, Math.min(1, width / shell.width, height / shell.height));
  return {
    frame,
    orientation: landscape ? "landscape" as const : "portrait" as const,
    artwork: {
      ...portraitShell,
      transform: landscape ? `translateY(${portraitShell.width}px) rotate(-90deg)` : "translateY(0px) rotate(0deg)",
    },
    screen: {
      left: landscape ? top : left,
      top: landscape ? portraitShell.width - left - portraitViewport.width : top,
      radius: frame.screen.radius * imageScale,
    },
    viewport,
    shell,
    fit: { scale, width: shell.width * scale, height: shell.height * scale },
  };
}

/** Fit both proportional frames at the same visual height on desktop. */
export function getEventPreviewPairLayout(width: number, height: number, orientation: EventPreviewOrientation = "portrait") {
  const phone = getEventPreviewFrameLayout("mobile", width, height);
  const tablet = getEventPreviewFrameLayout("tablet", width, height, orientation);
  const phoneRatio = phone.shell.width / phone.shell.height;
  const tabletRatio = tablet.shell.width / tablet.shell.height;
  const pairHeight = Math.max(0, Math.min(
    height, phone.shell.height, tablet.shell.height,
    Math.max(0, width - 32) / (phoneRatio + tabletRatio),
  ));
  return {
    mobile: getEventPreviewFrameLayout("mobile", pairHeight * phoneRatio, pairHeight),
    tablet: getEventPreviewFrameLayout("tablet", pairHeight * tabletRatio, pairHeight, orientation),
  };
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
