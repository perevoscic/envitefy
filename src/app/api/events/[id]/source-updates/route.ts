import { NextResponse } from "next/server";
import { getAuthenticatedRequestUser } from "@/lib/auth";
import { getEventDiscoveryByEventId, getEventHistoryById } from "@/lib/db";
import { getEventPermissions } from "@/lib/event-collaboration";
import { eventSourceUrl, sourceUpdateCutoff } from "@/lib/event-source-updates";
import { checkEventSource } from "@/lib/event-source-updates.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** Eligibility only. Opening the editor never crawls or parses the source. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedRequestUser(request);
  if (!user.ok) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const { id } = await params;
  const row = await getEventHistoryById(id);
  if (!row || !(await getEventPermissions(row, user.userId)).canEdit)
    return NextResponse.json({ error: "Event not found." }, { status: 404 });
  const discovery = await getEventDiscoveryByEventId(id);
  const url =
    discovery?.source.type === "url"
      ? eventSourceUrl({ discoverySource: { input: discovery.source } })
      : eventSourceUrl(row.data || {});
  return NextResponse.json(
    {
      eligible: Boolean(url),
      ...(url
        ? {
            url,
            ...sourceUpdateCutoff(row.data || {}),
            lastCheckedAt: row.data?.sourceUpdates?.lastCheckedAt,
          }
        : {}),
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedRequestUser(request);
  if (!user.ok) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const { id } = await params;
  const row = await getEventHistoryById(id);
  if (!row || !(await getEventPermissions(row, user.userId)).canEdit)
    return NextResponse.json({ error: "Event not found." }, { status: 404 });
  const cutoff = sourceUpdateCutoff(row.data || {});
  if (cutoff.ended)
    return NextResponse.json({ error: cutoff.reason, ended: true }, { status: 409 });
  const discovery = await getEventDiscoveryByEventId(id);
  if (discovery?.source.type !== "url" && !eventSourceUrl(row.data || {}))
    return NextResponse.json({ error: "This event was not created from a URL." }, { status: 400 });
  try {
    const result = await checkEventSource(
      row.data || {},
      discovery,
      AbortSignal.any([request.signal, AbortSignal.timeout(270_000)]),
    );
    return NextResponse.json(result, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "The source could not be checked. Your event is unchanged.",
      },
      { status: 502 },
    );
  }
}
