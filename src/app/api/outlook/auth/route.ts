import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const clientId = process.env.OUTLOOK_CLIENT_ID!;
  const redirectUri = encodeURIComponent(process.env.OUTLOOK_REDIRECT_URI!);
  const scopes = encodeURIComponent("offline_access Calendars.ReadWrite");

  const url = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&response_mode=query&scope=${scopes}&prompt=consent`;
  return NextResponse.redirect(url);
}


