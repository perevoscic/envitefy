import { NextResponse } from "next/server";
import { getAuthenticatedRequestUser } from "@/lib/auth";
import { resolveEventLocationTimezone } from "@/lib/event-location-timezone-server";

export const runtime = "nodejs";

/** Address verification and geographic boundaries are shared with the location picker. */
export async function POST(request: Request) {
  const user = await getAuthenticatedRequestUser(request);
  if (!user.ok)
    return NextResponse.json({ error: "Sign in to find the event time zone." }, { status: 401 });
  const body = await request.json().catch(() => null);
  const query = typeof body?.query === "string" ? body.query.trim() : "";
  if (!query || query.length > 500) return NextResponse.json({ timezone: null }, { status: 400 });
  try {
    return NextResponse.json({ timezone: await resolveEventLocationTimezone(query) });
  } catch {
    return NextResponse.json({ timezone: null }, { status: 503 });
  }
}
