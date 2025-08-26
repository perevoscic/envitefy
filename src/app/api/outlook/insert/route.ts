import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, start, end, location, description, timezone = "America/Chicago" } = body || {};

    const refreshToken = (request.headers.get("x-refresh-token") || "").trim();
    if (!refreshToken) return NextResponse.json({ error: "Missing refresh token" }, { status: 401 });

    const tenant = process.env.OUTLOOK_TENANT_ID || "common";
    const tokenUrl = `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`;
    const params = new URLSearchParams();
    params.append("client_id", process.env.OUTLOOK_CLIENT_ID!);
    params.append("client_secret", process.env.OUTLOOK_CLIENT_SECRET!);
    params.append("grant_type", "refresh_token");
    params.append("refresh_token", refreshToken);
    // Request Graph access token with calendar scope on refresh
    params.append("scope", "offline_access https://graph.microsoft.com/Calendars.ReadWrite");

    const tokenResp = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params
    });

    if (!tokenResp.ok) {
      const text = await tokenResp.text();
      return NextResponse.json({ error: text || "Failed to refresh access token" }, { status: 500 });
    }

    const tokens: { access_token?: string } = await tokenResp.json();
    const accessToken = tokens.access_token;
    if (!accessToken) return NextResponse.json({ error: "No access token" }, { status: 500 });

    const graphUrl = "https://graph.microsoft.com/v1.0/me/events";
    const graphBody = {
      subject: title || "Event",
      body: {
        contentType: "text",
        content: description || ""
      },
      location: {
        displayName: location || ""
      },
      start: {
        dateTime: start,
        timeZone: timezone
      },
      end: {
        dateTime: end,
        timeZone: timezone
      }
    };

    const createResp = await fetch(graphUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify(graphBody)
    });

    if (!createResp.ok) {
      const text = await createResp.text();
      return NextResponse.json({ error: text || "Failed to create event" }, { status: 500 });
    }

    const created: { webLink?: string } = await createResp.json();
    return NextResponse.json({ htmlLink: created.webLink });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


