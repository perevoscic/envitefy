import { google } from "googleapis";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const forceConsent = searchParams.get("consent") === "1";
  const state = searchParams.get("state") || undefined;
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
    process.env.GOOGLE_REDIRECT_URI!
  );

  const url = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    include_granted_scopes: true,
    scope: ["https://www.googleapis.com/auth/calendar.events"],
    ...(forceConsent ? { prompt: "consent" as const } : {}),
    ...(state ? { state } : {}),
  });
  return NextResponse.redirect(url);
}


