import { NextResponse } from "next/server";

export const runtime = "nodejs";

function normalizeInternalRedirect(value: string | null): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return null;
  }
  return value;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const clientId = process.env.OUTLOOK_CLIENT_ID!;
  const redirectUri = process.env.OUTLOOK_REDIRECT_URI!;
  const scopes = "offline_access https://graph.microsoft.com/Calendars.ReadWrite";
  const tenant = process.env.OUTLOOK_TENANT_ID || "common";
  const nextPath = normalizeInternalRedirect(searchParams.get("next"));
  const state = nextPath
    ? Buffer.from(
        encodeURIComponent(JSON.stringify({ type: "oauth_redirect", next: nextPath })),
      ).toString("base64")
    : null;

  const authorizationUrl = new URL(
    `https://login.microsoftonline.com/${encodeURIComponent(tenant)}/oauth2/v2.0/authorize`,
  );
  authorizationUrl.search = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    response_mode: "query",
    scope: scopes,
    ...(state ? { state } : {}),
  }).toString();
  return NextResponse.redirect(authorizationUrl);
}


