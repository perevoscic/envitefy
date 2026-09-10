import { NextResponse } from "next/server";
import { getAuthenticatedRequestUser } from "@/lib/auth";
import { getGoogleRefreshToken, getMicrosoftRefreshToken } from "@/lib/db";
import { getCalendarAccountEmail } from "@/lib/calendar-account-email";
import { getGoogleCalendarRefreshToken } from "@/lib/google-calendar-connection";
import { getAppleCalendarSubscription } from "@/lib/apple-calendar-subscription";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const STATUS_HEADERS = { "Cache-Control": "private, no-store", Vary: "Cookie" };

export async function GET(request: Request) {
  const includeAccounts = new URL(request.url).searchParams.get("includeAccounts") === "1";
  let googleConnected = false;
  let microsoftConnected = false;
  let appleSubscription: { ready: boolean; connected: boolean } | null = null;
  const accountEmails: { google: string | null; microsoft: string | null } = {
    google: null,
    microsoft: null,
  };
  try {
    const account = await getAuthenticatedRequestUser(request);
    if (account.ok) {
      const email = account.email;
      const [google, microsoft, apple] = await Promise.allSettled([
        getGoogleCalendarRefreshToken(email),
        getMicrosoftRefreshToken(email),
        // Reuse Settings' status request; no Apple provider or feed request is needed.
        includeAccounts ? getAppleCalendarSubscription(account.userId) : null,
      ]);
      if (includeAccounts && apple.status === "fulfilled") {
        appleSubscription = { ready: Boolean(apple.value), connected: Boolean(apple.value?.last_fetched_at) };
      }
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
      // Only Settings needs identity details; other calendar-status consumers stay lightweight.
      if (includeAccounts) {
        const [googleEmail, microsoftEmail] = await Promise.all([
          google.value ? getCalendarAccountEmail("google", google.value) : null,
          microsoft.value ? getCalendarAccountEmail("microsoft", microsoft.value) : null,
        ]);
        const [currentGoogleToken, currentMicrosoftToken] = await Promise.all([
          getGoogleRefreshToken(email),
          getMicrosoftRefreshToken(email),
        ]);
        // Disconnect/reconnect can finish during a provider lookup. Never return the old identity.
        if (
          (google.value && currentGoogleToken !== google.value) ||
          (microsoft.value && currentMicrosoftToken !== microsoft.value)
        ) {
          return NextResponse.json(
            { error: "Calendar connections changed. Please refresh again." },
            { status: 503, headers: STATUS_HEADERS },
          );
        }
        accountEmails.google = googleConnected ? googleEmail : null;
        accountEmails.microsoft = microsoftConnected ? microsoftEmail : null;
      }
    }
  } catch {
    // A missing or invalid session never falls back to browser-wide OAuth cookies.
  }
  return NextResponse.json(
    {
      google: googleConnected,
      microsoft: microsoftConnected,
      apple: false,
      ...(includeAccounts ? { accountEmails, appleSubscription } : {}),
    },
    { headers: STATUS_HEADERS },
  );
}
