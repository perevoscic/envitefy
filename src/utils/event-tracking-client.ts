"use client";

export type ClientTrackingEventName =
  | "public_event_view"
  | "share_link_click"
  | "registry_click"
  | "event_link_click";

export type ClientTrackingPayload = {
  eventId: string;
  eventName: ClientTrackingEventName;
  targetUrl?: string | null;
  targetDomain?: string | null;
  targetLabel?: string | null;
  sourceSurface?: string | null;
  metadata?: Record<string, string | number | boolean | null>;
};

const VISITOR_STORAGE_KEY = "envitefy:tracking-visitor-id:v1";

function getVisitorId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const existing = window.localStorage.getItem(VISITOR_STORAGE_KEY);
    if (existing) return existing;
    const next =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
    window.localStorage.setItem(VISITOR_STORAGE_KEY, next);
    return next;
  } catch {
    return null;
  }
}

function getTargetDomain(targetUrl: string | null | undefined): string | null {
  if (!targetUrl) return null;
  try {
    return new URL(targetUrl, window.location.origin).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

export function trackEventInteraction(payload: ClientTrackingPayload): void {
  if (typeof window === "undefined") return;
  const eventId = payload.eventId.trim();
  if (!eventId) return;

  const targetUrl = payload.targetUrl || null;
  const body = JSON.stringify({
    eventId,
    eventName: payload.eventName,
    targetUrl,
    targetDomain: payload.targetDomain || getTargetDomain(targetUrl),
    targetLabel: payload.targetLabel || null,
    sourceSurface: payload.sourceSurface || null,
    visitorId: getVisitorId(),
    path: `${window.location.pathname}${window.location.search}`,
    referrer: document.referrer || null,
    metadata: payload.metadata || null,
  });

  try {
    const blob = new Blob([body], { type: "application/json" });
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      const sent = navigator.sendBeacon("/api/analytics/events", blob);
      if (sent) return;
    }
  } catch {
    // Fall back to fetch below.
  }

  void fetch("/api/analytics/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => undefined);
}
