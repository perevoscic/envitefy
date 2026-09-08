import { NextResponse } from "next/server";
import { getAuthenticatedRequestUser } from "@/lib/auth";
import { getMicrosoftRefreshToken } from "@/lib/db";
import { getGoogleCalendarRefreshToken } from "@/lib/google-calendar-connection";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const STATUS_HEADERS = { "Cache-Control": "private, no-store", Vary: "Cookie" };

export async function GET(request: Request) {
  let googleConnected = false;
  let microsoftConnected = false;
  try {
    const account = await getAuthenticatedRequestUser(request);
    if (account.ok) {
      const email = account.email;
      const [google, microsoft] = await Promise.allSettled([
        getGoogleCalendarRefreshToken(email),
        getMicrosoftRefreshToken(email),
      ]);
      if (google.status === "rejected" || microsoft.status === "rejected") {
        return NextResponse.json(
          { error: "Calendar connections could not be verified" },
          {
            status: 503,
            headers: STATUS_HEADERS,
          },
        );
      }
      googleConnected = google.status === "fulfilled" && Boolean(google.value);
      microsoftConnected = microsoft.status === "fulfilled" && Boolean(microsoft.value);
    }
  } catch {
    // A missing or invalid session never falls back to browser-wide OAuth cookies.
  }
  return NextResponse.json(
    { google: googleConnected, microsoft: microsoftConnected, apple: false },
    { headers: STATUS_HEADERS },
  );
}
