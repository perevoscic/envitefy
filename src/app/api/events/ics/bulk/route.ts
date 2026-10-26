import { NextRequest, NextResponse } from "next/server";
import type { NormalizedEvent } from "@/lib/mappers";
import { randomUUID } from "node:crypto";
import { buildCalendarDescription } from "@/lib/calendar-description";

export const runtime = "nodejs";

type BulkCalendarEvent = Omit<NormalizedEvent, "end"> & { end?: string | null; uid?: string | null };
type BulkBody = {
  events: BulkCalendarEvent[];
  filename?: string | null;
};

function formatIcsDate(iso: string): string {
  try {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return (
      `${d.getUTCFullYear()}` +
      `${pad(d.getUTCMonth() + 1)}` +
      `${pad(d.getUTCDate())}` +
      "T" +
      `${pad(d.getUTCHours())}` +
      `${pad(d.getUTCMinutes())}` +
      `${pad(d.getUTCSeconds())}` +
      "Z"
    );
  } catch {
    return iso.replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  }
}

function formatIcsDateOnly(iso: string): string {
  // Civil dates have no UTC offset. Preserve them exactly across time zones.
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso.replaceAll("-", "");
  try {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}`;
  } catch {
    return iso.slice(0, 10).replace(/-/g, "");
  }
}

function escapeText(text: string): string {
  return (text || "")
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}

function foldLine(input: string): string {
  const bytes = new TextEncoder().encode(input);
  if (bytes.length <= 75) return input;
  const parts: string[] = [];
  let i = 0;
  while (i < bytes.length) {
    let end = Math.min(i + 75, bytes.length);
    // try not to break multi-byte chars
    while (end > i && (bytes[end] & 0b11000000) === 0b10000000) end--;
    const chunk = new TextDecoder().decode(bytes.slice(i, end));
    parts.push(parts.length === 0 ? chunk : ` ${chunk}`);
    i = end;
  }
  return parts.join("\r\n");
}

function buildIcs(events: BulkCalendarEvent[]): string {
  const lines: string[] = [];
  lines.push("BEGIN:VCALENDAR");
  lines.push("PRODID:-//Envitefy//Bulk Export//EN");
  lines.push("VERSION:2.0");
  lines.push("CALSCALE:GREGORIAN");
  lines.push("METHOD:PUBLISH");

  const now = formatIcsDate(new Date().toISOString());

  for (const ev of events) {
    // Only accept our bounded, single-line identity format. Legacy callers keep
    // their random UID; reviewed schedule items carry a persistent one.
    const uid = typeof ev.uid === "string" && /^[A-Za-z0-9._%+-]{1,400}@envitefy\.com$/.test(ev.uid)
      ? ev.uid
      : `${randomUUID()}@envitefy.com`;
    lines.push("BEGIN:VEVENT");
    lines.push(foldLine(`UID:${uid}`));
    lines.push(`DTSTAMP:${now}`);

    if (ev.allDay) {
      const ds = formatIcsDateOnly(ev.start);
      lines.push(`DTSTART;VALUE=DATE:${ds}`);
      if (ev.end) lines.push(`DTEND;VALUE=DATE:${formatIcsDateOnly(ev.end)}`);
    } else {
      lines.push(`DTSTART:${formatIcsDate(ev.start)}`);
      if (ev.end) lines.push(`DTEND:${formatIcsDate(ev.end)}`);
    }

    if (ev.recurrence) {
      lines.push(`RRULE:${ev.recurrence}`);
    }

    if (ev.title) lines.push(foldLine(`SUMMARY:${escapeText(ev.title)}`));
    lines.push(foldLine(`DESCRIPTION:${escapeText(buildCalendarDescription(ev))}`));
    if (ev.location) lines.push(foldLine(`LOCATION:${escapeText(ev.location)}`));

    const reminders = Array.isArray(ev.reminders) ? ev.reminders : [];
    for (const r of reminders) {
      const minutes = typeof r?.minutes === "number" ? Math.max(0, r.minutes) : null;
      if (minutes === null) continue;
      lines.push("BEGIN:VALARM");
      lines.push(`TRIGGER:-PT${minutes}M`);
      lines.push("ACTION:DISPLAY");
      lines.push("DESCRIPTION:Reminder");
      lines.push("END:VALARM");
    }

    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return `${lines.join("\r\n")}\r\n`;
}

export async function POST(request: NextRequest) {
  try {
    const body: BulkBody = await request.json();
    const events = Array.isArray(body?.events) ? body.events : [];
    if (!events.length) {
      return NextResponse.json({ error: "No events provided" }, { status: 400 });
    }
    const ics = buildIcs(events);
    const filename = `${body?.filename || "events"}.ics`;
    return new NextResponse(ics, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename=${JSON.stringify(filename)}`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

