import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { assertConciergeV2Enabled, isConciergeV2FlagEnabled } from "@/config/concierge-v2-flags";
import { authOptions, resolveSessionUserId } from "@/lib/auth";
import { ConciergeV2OperationError } from "@/lib/concierge-v2/operations";
import {
  checkOutConciergeV2Attendance,
  getConciergeV2ResourcePlanningCenter,
} from "@/lib/concierge-v2/resource-planning";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function cleanString(value: any, maxLength = 500): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, maxLength) : "";
}

function assertResourcesEnabled() {
  assertConciergeV2Enabled();
  if (!isConciergeV2FlagEnabled("ENABLE_RESOURCE_PLANNING")) throw new Error("Resource planning is disabled.");
}

function statusFor(error: any) {
  return error instanceof ConciergeV2OperationError
    ? error.status
    : /disabled/i.test(String(error?.message || ""))
      ? 404
      : 500;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertResourcesEnabled();
    const { id } = await params;
    const session: any = await getServerSession(authOptions as any);
    const userId = await resolveSessionUserId(session);
    if (!userId) return NextResponse.json({ ok: false, error: "Sign in to check out participants." }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const attendance = await checkOutConciergeV2Attendance({
      eventHistoryId: id,
      userId,
      occurrenceId: cleanString(body?.occurrenceId || body?.occurrence_id, 80),
      participantId: cleanString(body?.participantId || body?.participant_id, 80),
      notes: cleanString(body?.notes, 500),
    });
    const resources = await getConciergeV2ResourcePlanningCenter({ eventHistoryId: id, userId });
    return NextResponse.json({ ok: true, attendance, resources });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: String(error?.message || "Unable to check out participant.") },
      { status: statusFor(error) },
    );
  }
}
