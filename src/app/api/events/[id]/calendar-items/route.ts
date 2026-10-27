import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions, resolveSessionUserId } from "@/lib/auth";
import { getEventHistoryById } from "@/lib/db";
import { absoluteUrl } from "@/lib/absolute-url";
import { buildEventProductPath } from "@/utils/event-product-route";
import {
  SchoolMemoCalendarInputError,
  schoolMemoCalendarAdditions,
  syncSelectedSchoolMemoDates,
} from "@/lib/school-memo-calendar-sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 180;

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (request.headers.get("sec-fetch-site") === "cross-site")
    return NextResponse.json(
      { error: "Open your memo in Envitefy to add its dates." },
      { status: 403 },
    );
  try {
    const session = await getServerSession(authOptions);
    const userId = await resolveSessionUserId(session);
    const email = session?.user?.email?.trim().toLowerCase();
    if (!userId || !email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await context.params;
    const row = await getEventHistoryById(id);
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (row.user_id !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (row.data?.status !== "published" || row.data?.draftStatus === "draft")
      return NextResponse.json({ error: "Publish your memo before adding dates to a calendar." }, { status: 409 });
    const body = await request.json().catch(() => null);
    if (
      !body ||
      !["google", "microsoft"].includes(body.provider) ||
      !Array.isArray(body.itemIds) ||
      !body.itemIds.length ||
      body.itemIds.length > 50 ||
      body.itemIds.some((value: unknown) => typeof value !== "string" || value.length > 160)
    )
      return NextResponse.json(
        { error: "Select dates and a connected calendar." },
        { status: 400 },
      );
    const path = buildEventProductPath({
      eventId: id,
      title: row.title,
      data: row.data,
      publicSlug: row.public_slug,
    });
    const results = await syncSelectedSchoolMemoDates({
      eventId: id,
      userId,
      email,
      eventUrl: await absoluteUrl(path),
      provider: body.provider,
      data: row.data || {},
      itemIds: body.itemIds,
    });
    return NextResponse.json({ results }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (error instanceof SchoolMemoCalendarInputError)
      return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(
      {
        error:
          "Could not add these dates right now. Please retry; dates already added will be retained.",
      },
      { status: 503 },
    );
  }
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const userId = await resolveSessionUserId(session);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const row = await getEventHistoryById(id);
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (row.user_id !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json(
    { additions: schoolMemoCalendarAdditions(id, row.data || {}) },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
