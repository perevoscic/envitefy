import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { parse as parseCookie } from "cookie";
import { authOptions, resolveSessionUserId } from "@/lib/auth";
import { getEventHistoryById, isEventSharedWithUser } from "@/lib/db";
import { getEventPermissions } from "@/lib/event-collaboration";
import { isEventDraft } from "@/lib/event-draft-access";
import {
  getEventAccessCookieName,
  verifyEventAccessCookieValue,
  type StoredAccessControl,
} from "@/lib/event-access";
import { normalizeCustomEventPage } from "@/lib/event-custom-design";
import { parseEventWeatherTarget, type EventWeatherTarget } from "@/lib/event-weather";
import { getEventWeather } from "@/lib/event-weather-server";

export const runtime = "nodejs";
export const maxDuration = 30;
const requests = new Map<string, { count: number; expires: number }>();
const json = (body: object, status = 200) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });

export async function POST(request: Request) {
  if (request.headers.get("sec-fetch-site") === "cross-site")
    return json({ error: "Open the event page to check its weather." }, 403);
  try {
    if (!request.headers.get("content-type")?.startsWith("application/json"))
      return json({ error: "Invalid weather request." }, 415);
    const reader = request.body?.getReader();
    if (!reader) return json({ error: "Invalid weather request." }, 400);
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 4096) {
        await reader.cancel();
        return json({ error: "Weather request is too large." }, 413);
      }
      chunks.push(value);
    }
    let raw: unknown;
    try {
      raw = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    } catch {
      return json({ error: "Invalid weather request." }, 400);
    }
    if (!raw || typeof raw !== "object" || Array.isArray(raw))
      return json({ error: "Invalid weather request." }, 400);
    const body = raw as Record<string, unknown>;
    const userId = await resolveSessionUserId(await getServerSession(authOptions));
    let target: EventWeatherTarget | null;
    let requestKey: string;
    if (typeof body.eventId === "string") {
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.eventId))
        return json({ error: "Event not found." }, 404);
      const event = await getEventHistoryById(body.eventId);
      if (!event) return json({ error: "Event not found." }, 404);
      const permissions = await getEventPermissions(event, userId);
      if (isEventDraft(event.data) && !permissions.canEdit)
        return json({ error: "Event not found." }, 404);
      const access = event.data?.accessControl as StoredAccessControl | undefined;
      if (access?.requirePasscode && access.passcodeHash && !permissions.canEdit) {
        const recipient = userId && (await isEventSharedWithUser(event.id, userId));
        const cookies = parseCookie(request.headers.get("cookie") || "");
        if (
          !recipient &&
          !verifyEventAccessCookieValue(
            cookies[getEventAccessCookieName(event.id)],
            event.id,
            access.passcodeHash,
          )
        )
          return json({ error: "Unlock the event to check its weather." }, 403);
      }
      // Only read the published snapshot; private saved changes must stay in the editor.
      const page = normalizeCustomEventPage(event.data?.customEventPage);
      if (!page?.details.weather?.enabled)
        return json({ error: "Weather is not enabled for this event." }, 404);
      target = parseEventWeatherTarget({
        location: page.details.location || page.details.venue,
        date: page.details.date,
        time: page.details.time,
      });
      requestKey = `event:${event.id}`;
    } else {
      if (!userId) return json({ error: "Sign in to preview event weather." }, 401);
      target = parseEventWeatherTarget(body);
      requestKey = `user:${userId}`;
    }
    if (!target) return json({ error: "Enter a valid event date, time and location." }, 400);
    const now = Date.now();
    for (const [key, entry] of requests) if (entry.expires <= now) requests.delete(key);
    const entry = requests.get(requestKey) || { count: 0, expires: now + 60_000 };
    if (entry.count >= 60 || requests.size >= 10_000)
      return json({ error: "Please wait a minute before checking weather again." }, 429);
    entry.count++;
    requests.set(requestKey, entry);
    return json(await getEventWeather(target));
  } catch {
    return json({ status: "unavailable" }, 503);
  }
}
