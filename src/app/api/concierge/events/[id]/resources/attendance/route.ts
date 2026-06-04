import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { assertConciergeV2Enabled, isConciergeV2FlagEnabled } from "@/config/concierge-v2-flags";
import { authOptions, resolveSessionUserId } from "@/lib/auth";
import { ConciergeV2OperationError } from "@/lib/concierge-v2/operations";
import {
  getConciergeV2ResourcePlanningCenter,
  updateConciergeV2Attendance,
} from "@/lib/concierge-v2/resource-planning";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function assertResourcesEnabled() {
  assertConciergeV2Enabled();
  if (!isConciergeV2FlagEnabled("ENABLE_RESOURCE_PLANNING")) {
    throw new Error("Resource planning is disabled.");
  }
}

function cleanString(value: any, maxLength = 500): string {
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

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertResourcesEnabled();
    const { id } = await params;
    const userId = await currentUserId();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Sign in to mark attendance." }, { status: 401 });
    }
    const body = await req.json().catch(() => ({}));
    const attendance = await updateConciergeV2Attendance({
      eventHistoryId: id,
      userId,
      occurrenceId: cleanString(body?.occurrenceId || body?.occurrence_id, 80),
      participantId: cleanString(body?.participantId || body?.participant_id, 80),
      status: cleanString(body?.status, 80),
      notes: cleanString(body?.notes, 500),
    });
    const resources = await getConciergeV2ResourcePlanningCenter({ eventHistoryId: id, userId });
    return NextResponse.json({ ok: true, attendance, resources });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: String(error?.message || "Unable to update attendance.") },
      { status: statusFor(error) },
    );
  }
}
