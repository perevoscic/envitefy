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
  for (const key of ["edit", "preview", "embed", "returnTo", "view", "updated", "created", "t"]) {
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

export function buildEmbeddedEventPreviewHref(publicUrl: string): string {
  const url = new URL(publicUrl, "https://envitefy.local");
  for (const key of ["edit", "tab", "returnTo", "updated", "created", "t"]) {
    url.searchParams.delete(key);
  }
  url.searchParams.set("preview", "owner");
  url.searchParams.set("embed", "dashboard-preview");
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
