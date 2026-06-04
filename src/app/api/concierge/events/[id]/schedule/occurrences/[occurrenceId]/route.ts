import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { assertConciergeV2Enabled, isConciergeV2FlagEnabled } from "@/config/concierge-v2-flags";
import { authOptions, resolveSessionUserId } from "@/lib/auth";
import { ConciergeV2OperationError } from "@/lib/concierge-v2/operations";
import {
  getConciergeV2ScheduleHub,
  updateConciergeV2Occurrence,
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

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; occurrenceId: string }> },
) {
  try {
    assertScheduleHubEnabled();
    const { id, occurrenceId } = await params;
    const session: any = await getServerSession(authOptions as any);
    const userId = await resolveSessionUserId(session);
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Sign in to manage the schedule." }, { status: 401 });
    }
    const body = await req.json().catch(() => ({}));
    const occurrence = await updateConciergeV2Occurrence({
      eventHistoryId: id,
      occurrenceId,
      userId,
      title: body?.title === undefined ? undefined : cleanString(body.title, 220),
      occurrenceType: body?.occurrenceType === undefined ? undefined : cleanString(body.occurrenceType, 80),
      startAt: body?.startAt === undefined ? undefined : cleanString(body.startAt, 100),
      endAt: body?.endAt === undefined ? undefined : cleanString(body.endAt, 100),
      timezone: body?.timezone === undefined ? undefined : cleanString(body.timezone, 80),
      locationText: body?.locationText === undefined ? undefined : cleanString(body.locationText, 220),
      status: body?.status === undefined ? undefined : cleanString(body.status, 40),
      notes: body?.notes === undefined ? undefined : cleanString(body.notes, 1000),
    });
    const schedule = await getConciergeV2ScheduleHub({ eventHistoryId: id, userId });
    return NextResponse.json({ ok: true, occurrence, schedule });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: String(error?.message || "Unable to update schedule item.") },
      { status: statusFor(error) },
    );
  }
}
