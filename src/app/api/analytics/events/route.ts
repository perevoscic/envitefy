import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getUserIdByEmail,
  insertEventTrackingEvent,
  type EventTrackingEventName,
} from "@/lib/db";

export const runtime = "nodejs";

type SessionLike = {
  user?: {
    email?: string | null;
  } | null;
} | null;

type TrackingRequestBody = {
  eventId?: unknown;
  eventName?: unknown;
  targetUrl?: unknown;
  targetDomain?: unknown;
  targetLabel?: unknown;
  sourceSurface?: unknown;
  visitorId?: unknown;
  path?: unknown;
  referrer?: unknown;
  metadata?: unknown;
};

const EVENT_NAMES: readonly EventTrackingEventName[] = [
  "public_event_view",
  "share_link_click",
  "registry_click",
  "event_link_click",
];

function readText(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function readEventName(value: unknown): EventTrackingEventName | null {
  const text = readText(value);
  if (!text) return null;
  return EVENT_NAMES.includes(text as EventTrackingEventName)
    ? (text as EventTrackingEventName)
    : null;
}

function readMetadata(value: unknown): Record<string, string | number | boolean | null> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const result: Record<string, string | number | boolean | null> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (!key || key.length > 80) continue;
    if (
      typeof entry === "string" ||
      typeof entry === "number" ||
      typeof entry === "boolean" ||
      entry === null
    ) {
      result[key] = typeof entry === "string" && entry.length > 240 ? entry.slice(0, 240) : entry;
    }
  }
  return Object.keys(result).length ? result : null;
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as TrackingRequestBody;
  const eventId = readText(body.eventId);
  const eventName = readEventName(body.eventName);

  if (!eventId || !eventName) {
    return NextResponse.json({ error: "Missing eventId or eventName" }, { status: 400 });
  }

  let viewerUserId: string | null = null;
  try {
    const session = (await getServerSession(authOptions)) as SessionLike;
    const email = readText(session?.user?.email);
    viewerUserId = email ? await getUserIdByEmail(email) : null;
  } catch {
    viewerUserId = null;
  }

  try {
    await insertEventTrackingEvent({
      eventId,
      eventName,
      targetUrl: readText(body.targetUrl),
      targetDomain: readText(body.targetDomain),
      targetLabel: readText(body.targetLabel),
      sourceSurface: readText(body.sourceSurface),
      viewerUserId,
      visitorId: readText(body.visitorId),
      path: readText(body.path) || request.nextUrl.pathname,
      referrer: readText(body.referrer) || request.headers.get("referer"),
      userAgent: request.headers.get("user-agent"),
      metadata: readMetadata(body.metadata),
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[analytics/events] failed to record event", error);
    return NextResponse.json({ error: "Unable to record event" }, { status: 500 });
  }
}
