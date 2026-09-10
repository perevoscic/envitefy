import { NextResponse } from "next/server";
import { absoluteUrl } from "@/lib/absolute-url";
import { buildAppleCalendarFeed, type AppleCalendarEvent } from "@/lib/apple-calendar-feed";
import { markAppleCalendarFetched, resolveAppleCalendarSubscriber } from "@/lib/apple-calendar-subscription";
import { query } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex, nofollow", "Referrer-Policy": "no-referrer" };

export async function GET(_request: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  try {
    const userId = await resolveAppleCalendarSubscriber(token);
    if (!userId) return new NextResponse("Calendar subscription is unavailable.", { status: 404, headers });
    // Export the subscriber's saved events only, with no draft, artwork, RSVP or account data.
    const result = await query<AppleCalendarEvent>(
      `SELECT id, title, jsonb_build_object(
        'startAt', coalesce(nullif(data->>'startAt', ''), nullif(data->>'startISO', ''), data->>'start'),
        'endAt', coalesce(nullif(data->>'endAt', ''), nullif(data->>'endISO', ''), data->>'end'),
        'timezone', coalesce(data->>'timezone', data->>'tz'),
        'allDay', data->'allDay', 'timeFound', data->'timeFound',
        'status', data->>'status', 'draftStatus', data->>'draftStatus',
        'location', coalesce(data->>'location', data->>'address'),
        'venue', data->>'venue', 'description', data->>'description',
        'recurrence', data->>'recurrence', 'reminders', data->'reminders'
      ) AS data FROM event_history WHERE user_id = $1 ORDER BY created_at, id`,
      [userId],
    );
    const feed = buildAppleCalendarFeed(result.rows, await absoluteUrl());
    if (_request.method === "GET") await markAppleCalendarFetched(userId, token);
    return new NextResponse(feed, {
      headers: { ...headers, "Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": 'inline; filename="envitefy.ics"' },
    });
  } catch {
    return new NextResponse("Calendar is temporarily unavailable. Please try again later.", { status: 503, headers });
  }
}
