import type { CalendarProvider, EventCalendarLinks } from "../lib/calendar-preference.ts";

/**
 * Resolve relative /api/ics links for client-side navigation.
 */
export function toAbsoluteCalendarUrl(href: string): string {
  if (typeof window === "undefined") return href;
  if (/^https?:\/\//i.test(href)) return href;
  return new URL(href, window.location.origin).href;
}

let lastAppleOpenAt = 0;
let lastAppleHref = "";

/**
 * Open an ICS URL in Apple Calendar when possible.
 *
 * - Navigate to an inline text/calendar response on Apple devices so the browser
 *   can offer its Calendar import sheet (or an ICS file to open on Mac).
 * - Do not use webcal: here: that requests a read-only calendar subscription,
 *   rather than adding this one event to a calendar the guest already uses.
 * - A short debounce avoids duplicate prompts from double-firing handlers (e.g. Strict Mode).
 */
export function openAppleCalendarIcs(href: string): void {
  if (typeof window === "undefined") return;
  const url = new URL(toAbsoluteCalendarUrl(href));
  url.searchParams.set("disposition", "inline");
  const abs = url.href;
  const now = Date.now();
  if (abs === lastAppleHref && now - lastAppleOpenAt < 1500) {
    return;
  }
  lastAppleHref = abs;
  lastAppleOpenAt = now;

  const device = currentDevice();
  if (device === "ios" || device === "mac") {
    window.location.assign(abs);
    return;
  }

  // noopener may return null even when the tab opened. Do not also navigate the
  // current page, which would start a second download/import.
  window.open(abs, "_blank", "noopener,noreferrer");
}
export type CalendarDevice = "android" | "ios" | "mac" | "other";

export function calendarDevice(userAgent: string, maxTouchPoints = 0): CalendarDevice {
  if (/Android/i.test(userAgent)) return "android";
  if (/iPad|iPhone|iPod/i.test(userAgent) || (/Macintosh/i.test(userAgent) && maxTouchPoints > 1))
    return "ios";
  return /Macintosh|Mac OS X/i.test(userAgent) ? "mac" : "other";
}

function currentDevice(): CalendarDevice {
  return typeof navigator === "undefined"
    ? "other"
    : calendarDevice(navigator.userAgent, navigator.maxTouchPoints);
}

/** Best-effort Outlook compose handoff. App versions may ignore fields, so the
 * caller must also offer the original web/ICS links. This is not install detection.
 * https://learn.microsoft.com/en-us/answers/questions/202137/ms-outlook-events-new-scheme-url
 */
export function outlookNativeUrl(webHref: string, device: CalendarDevice): string | null {
  if (device !== "android" && device !== "ios") return null;
  try {
    const web = new URL(webHref);
    if (
      web.protocol !== "https:" ||
      !["outlook.live.com", "outlook.office.com", "outlook.office365.com"].includes(web.hostname)
    )
      return null;
    const source = web.searchParams;
    const start = source.get("startdt");
    // The mobile scheme has no documented all-day contract. Keep those events
    // in the web flow rather than silently turning them into timed appointments.
    if (
      source.get("allday") === "true" ||
      !start ||
      !/(?:Z|[+-]\d{2}:?\d{2})$/i.test(start) ||
      !Number.isFinite(Date.parse(start))
    )
      return null;
    const params = new URLSearchParams({
      title: source.get("subject") || "Event",
      start,
      location: source.get("location") || "",
      description: source.get("body") || "",
    });
    const end = source.get("enddt");
    if (end) params.set("end", end);
    const path = `events/new?${params.toString().replace(/\+/g, "%20")}`;
    if (device === "ios") return `ms-outlook://${path}`;
    // Chrome resolves the installed handler and owns the fallback. Keep this
    // navigation synchronous with the tap; timers lose the user gesture.
    // https://developer.chrome.com/docs/android/intents
    return `intent://${path}#Intent;scheme=ms-outlook;package=com.microsoft.office.outlook;S.browser_fallback_url=${encodeURIComponent(web.href)};end`;
  } catch {
    return null;
  }
}

/** Returns true only when a native attempt needs visible fallback controls. */
export function openCalendarProvider(
  links: EventCalendarLinks,
  provider: CalendarProvider,
): boolean {
  if (typeof window === "undefined") return false;
  if (provider === "apple") {
    openAppleCalendarIcs(links.appleInline);
    return false;
  }
  const device = currentDevice();
  const href = provider === "google" ? links.google : links.outlook;
  const nativeHref = provider === "microsoft" ? outlookNativeUrl(href, device) : null;
  if (nativeHref) {
    try {
      window.location.assign(nativeHref);
      return true;
    } catch {
      // Browsers that reject custom schemes can still open the complete event.
      window.location.assign(href);
      return false;
    }
  }
  if (device === "android" || device === "ios") window.location.assign(href);
  else window.open(href, "_blank", "noopener,noreferrer");
  return false;
}
