import ical from "ical-generator";
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
  // intakeId no longer used without Supabase
  // const intakeId = searchParams.get("intakeId");

  if (!start || !end) {
    return NextResponse.json({ error: "Missing start or end" }, { status: 400 });
  }

  const cal = ical({ name: "Scanned Events", timezone });
  const evt = cal.createEvent({
    start: new Date(start),
    end: new Date(end),
    summary: title,
    location,
    description
  });
  if (recurrence) {
    evt.repeating({
      rrule: recurrence,
    } as any);
  }

  const body = cal.toString();
  const response = new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": "attachment; filename=event.ics"
    }
  });

  // Removed Supabase side-effect update
  return response;
}


