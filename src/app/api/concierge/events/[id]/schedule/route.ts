import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { assertConciergeV2Enabled, isConciergeV2FlagEnabled } from "@/config/concierge-v2-flags";
import { authOptions, resolveSessionUserId } from "@/lib/auth";
import { ConciergeV2OperationError } from "@/lib/concierge-v2/operations";
import {
  createConciergeV2Occurrence,
  getConciergeV2ScheduleHub,
} from "@/lib/concierge-v2/schedule";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function assertScheduleHubEnabled() {
  assertConciergeV2Enabled();
  if (!isConciergeV2FlagEnabled("ENABLE_SCHEDULE_HUB")) {
    throw new Error("Schedule Hub is disabled.");
  }
}

function cleanString(value: any, maxLength = 1000): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, maxLength) : "";
}

function statusFor(error: any) {
  return error instanceof ConciergeV2OperationError
    ? error.status
    : /disabled/i.test(String(error?.message || ""))
      ? 404
      : 500;
}

async function currentUserId() {
  const session: any = await getServerSession(authOptions as any);
  return resolveSessionUserId(session);
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertScheduleHubEnabled();
    const { id } = await params;
    const userId = await currentUserId();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Sign in to manage the schedule." }, { status: 401 });
    }
    const schedule = await getConciergeV2ScheduleHub({ eventHistoryId: id, userId });
    return NextResponse.json({ ok: true, schedule });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: String(error?.message || "Unable to load schedule.") },
      { status: statusFor(error) },
    );
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertScheduleHubEnabled();
    const { id } = await params;
    const userId = await currentUserId();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Sign in to manage the schedule." }, { status: 401 });
    }
    const body = await req.json().catch(() => ({}));
    const occurrence = await createConciergeV2Occurrence({
      eventHistoryId: id,
      userId,
      title: cleanString(body?.title, 220),
      occurrenceType: cleanString(body?.occurrenceType || body?.type, 80) || "event",
      startAt: cleanString(body?.startAt, 100) || null,
      endAt: cleanString(body?.endAt, 100) || null,
      timezone: cleanString(body?.timezone, 80) || "America/Chicago",
      locationText: cleanString(body?.locationText || body?.location, 220) || null,
      notes: cleanString(body?.notes, 1000) || null,
    });
    const schedule = await getConciergeV2ScheduleHub({ eventHistoryId: id, userId });
    return NextResponse.json({ ok: true, occurrence, schedule });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: String(error?.message || "Unable to add schedule item.") },
      { status: statusFor(error) },
    );
  }
}
