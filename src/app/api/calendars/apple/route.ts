import { NextResponse } from "next/server";
import { getAuthenticatedRequestUser } from "@/lib/auth";
import { absoluteUrl } from "@/lib/absolute-url";
import {
  disconnectAppleCalendarSubscription,
  getAppleCalendarSubscription,
  prepareAppleCalendarSubscription,
} from "@/lib/apple-calendar-subscription";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer", Vary: "Cookie" };

export async function GET(request: Request) {
  const account = await getAuthenticatedRequestUser(request);
  if (!account.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers });
  try {
    const subscription = await getAppleCalendarSubscription(account.userId);
    return NextResponse.json({ ready: Boolean(subscription), connected: Boolean(subscription?.last_fetched_at) }, { headers });
  } catch {
    return NextResponse.json({ error: "Apple Calendar connection could not be checked." }, { status: 503, headers });
  }
}

export async function POST(request: Request) {
  const account = await getAuthenticatedRequestUser(request);
  if (!account.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers });
  try {
    const subscription = await prepareAppleCalendarSubscription(account.userId);
    const feedUrl = await absoluteUrl(`/api/calendars/apple/feed/${subscription.token}`);
    return NextResponse.json({
      feedUrl,
      subscribeUrl: feedUrl.replace(/^https?:\/\//, "webcal://"),
      connected: Boolean(subscription.last_fetched_at),
    }, { headers });
  } catch {
    return NextResponse.json({ error: "Apple Calendar setup could not be started. Please try again." }, { status: 503, headers });
  }
}

export async function DELETE(request: Request) {
  const account = await getAuthenticatedRequestUser(request);
  if (!account.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers });
  try {
    await disconnectAppleCalendarSubscription(account.userId);
    return NextResponse.json({ ok: true }, { headers });
  } catch {
    return NextResponse.json({ error: "Apple Calendar could not be disconnected. Please try again." }, { status: 503, headers });
  }
}
