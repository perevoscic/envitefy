import { NextRequest, NextResponse } from "next/server";
import { NormalizedEvent } from "@/lib/mappers";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

type BulkBody = {
  events: NormalizedEvent[];
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
    parts.push(parts.length === 0 ? chunk : " " + chunk);
    i = end;
  }
  return parts.join("\r\n");
}

function buildIcs(events: NormalizedEvent[]): string {
  const lines: string[] = [];
  lines.push("BEGIN:VCALENDAR");
  lines.push("PRODID:-//Envitefy//Bulk Export//EN");
  lines.push("VERSION:2.0");
  lines.push("CALSCALE:GREGORIAN");
  lines.push("METHOD:PUBLISH");

  const now = formatIcsDate(new Date().toISOString());

  for (const ev of events) {
    const uid = `${randomUUID()}@envitefy.com`;
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${uid}`);
    lines.push(`DTSTAMP:${now}`);

    if (ev.allDay) {
      const ds = formatIcsDateOnly(ev.start);
      const de = formatIcsDateOnly(ev.end);
      lines.push(`DTSTART;VALUE=DATE:${ds}`);
      lines.push(`DTEND;VALUE=DATE:${de}`);
    } else {
      lines.push(`DTSTART:${formatIcsDate(ev.start)}`);
      lines.push(`DTEND:${formatIcsDate(ev.end)}`);
    }

    if (ev.recurrence) {
      lines.push(`RRULE:${ev.recurrence}`);
    }

    if (ev.title) lines.push(foldLine(`SUMMARY:${escapeText(ev.title)}`));
    if (ev.description) lines.push(foldLine(`DESCRIPTION:${escapeText(ev.description)}`));
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
  return lines.join("\r\n") + "\r\n";
}

export async function POST(request: NextRequest) {
  try {
    const body: BulkBody = await request.json();
    const events = Array.isArray(body?.events) ? body.events : [];
    if (!events.length) {
      return NextResponse.json({ error: "No events provided" }, { status: 400 });
    }
    const ics = buildIcs(events);
    const filename = (body?.filename || "events") + ".ics";
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

