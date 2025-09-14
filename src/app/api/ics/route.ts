import ical from "ical-generator";
import type { ICalAlarmType, ICalCalendarMethod } from "ical-generator";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title") || "Event";
  const start = searchParams.get("start");
  const end = searchParams.get("end");
  const location = searchParams.get("location") || "";
  const description = searchParams.get("description") || "";
  const timezone = searchParams.get("timezone") || "America/Chicago";
  const recurrence = searchParams.get("recurrence");
  const remindersStr = searchParams.get("reminders");
  const disposition = (searchParams.get("disposition") || "attachment").toLowerCase();
  // intakeId not used
  // const intakeId = searchParams.get("intakeId");

  if (!start || !end) {
    return NextResponse.json({ error: "Missing start or end" }, { status: 400 });
  }

  const cal = ical({ name: "Scanned Events", timezone });
  // Present as an invitation so iOS can show an explicit Accept/Add flow
  cal.method(("REQUEST" as unknown) as ICalCalendarMethod);
  const evt = cal.createEvent({
    id: (globalThis.crypto && globalThis.crypto.randomUUID ? globalThis.crypto.randomUUID() : `${Date.now()}-${Math.random()}`),
    start: new Date(start),
    end: new Date(end),
    summary: title,
    location,
    description,
    status: ("CONFIRMED" as unknown) as any,
  });
  evt.organizer({ name: "Snap My Date", email: "noreply@snapmydate.com" });
  if (recurrence) {
    evt.repeating({
      rrule: recurrence,
    } as any);
  }

  // Add VALARM reminders if provided as query param `reminders` (comma-separated minutes)
  if (remindersStr) {
    remindersStr
      .split(",")
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => Number.isFinite(n) && n > 0)
      .forEach((minutes) => {
        // ical-generator expects seconds for numeric trigger
        evt.createAlarm({ type: ("display" as unknown) as ICalAlarmType, trigger: minutes * 60 });
      });
  }

  const body = cal.toString();
  const response = new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8; method=REQUEST",
      // Allow caller to request inline to better trigger native handlers on iOS/macOS
      "Content-Disposition": `${disposition === "inline" ? "inline" : "attachment"}; filename=event.ics`,
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Pragma": "no-cache"
    }
  });

  // No side-effect update
  return response;
}


