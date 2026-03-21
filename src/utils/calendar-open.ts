/**
 * Resolve relative /api/ics links for client-side navigation.
 */
export function toAbsoluteCalendarUrl(href: string): string {
  if (typeof window === "undefined") return href;
  if (/^https?:\/\//i.test(href)) return href;
  return new URL(href, window.location.origin).href;
}

function isAppleOS(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const iPadOS = /Macintosh/i.test(ua) && navigator.maxTouchPoints > 1;
  return /iPad|iPhone|iPod/i.test(ua) || /Macintosh/i.test(ua) || iPadOS;
}

let lastAppleOpenAt = 0;
let lastAppleHref = "";

/**
 * Open an ICS URL in Apple Calendar when possible.
 *
 * - Opening `https://.../api/ics` in a new tab often makes Chrome/Safari treat the
 *   response as a file download ("Save" dialog) instead of handing off to Calendar.
 * - Replacing `https?://` with `webcal://` is registered to the Calendar app on
 *   macOS and iOS, which avoids the browser download flow for the same resource.
 * - We use a hidden iframe so the invite page stays open (no full-page navigation).
 * - A short debounce avoids duplicate prompts from double-firing handlers (e.g. Strict Mode).
 */
export function openAppleCalendarIcs(href: string): void {
  if (typeof window === "undefined") return;
  const abs = toAbsoluteCalendarUrl(href);
  const now = Date.now();
  if (abs === lastAppleHref && now - lastAppleOpenAt < 1500) {
    return;
  }
  lastAppleHref = abs;
  lastAppleOpenAt = now;

  if (isAppleOS()) {
    const webcalUrl = abs.replace(/^https?:\/\//i, "webcal://");
    try {
      const iframe = document.createElement("iframe");
      iframe.setAttribute("aria-hidden", "true");
      iframe.setAttribute("tabindex", "-1");
      iframe.style.cssText =
        "position:fixed;width:0;height:0;border:0;opacity:0;pointer-events:none;left:-9999px;top:0;";
      iframe.src = webcalUrl;
      document.body.appendChild(iframe);
      window.setTimeout(() => {
        try {
          iframe.remove();
        } catch {
          /* ignore */
        }
      }, 5000);
      return;
    } catch {
      window.location.assign(webcalUrl);
    }
    return;
  }

  const opened = window.open(abs, "_blank", "noopener,noreferrer");
  if (!opened) {
    window.location.href = abs;
  }
}
