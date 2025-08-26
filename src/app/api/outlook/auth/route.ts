import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const clientId = process.env.OUTLOOK_CLIENT_ID!;
  const redirectUri = encodeURIComponent(process.env.OUTLOOK_REDIRECT_URI!);
  const scopes = encodeURIComponent("offline_access https://graph.microsoft.com/Calendars.ReadWrite");
  const tenant = encodeURIComponent(process.env.OUTLOOK_TENANT_ID || "common");

  const url = `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&response_mode=query&scope=${scopes}`;
  return NextResponse.redirect(url);
}


