import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { assertConciergeV2Enabled, isConciergeV2FlagEnabled } from "@/config/concierge-v2-flags";
import { authOptions, resolveSessionUserId } from "@/lib/auth";
import { ConciergeV2OperationError } from "@/lib/concierge-v2/operations";
import {
  createConciergeV2HubParticipant,
  getConciergeV2TeamClassHub,
} from "@/lib/concierge-v2/team-class-hub";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function assertHubEnabled() {
  assertConciergeV2Enabled();
  if (!isConciergeV2FlagEnabled("ENABLE_TEAM_CLASS_HUB")) {
    throw new Error("Team/Class Hub is disabled.");
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

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertHubEnabled();
    const { id } = await params;
    const userId = await currentUserId();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Sign in to manage participants." }, { status: 401 });
    }
    const body = await req.json().catch(() => ({}));
    const participant = await createConciergeV2HubParticipant({
      eventHistoryId: id,
      userId,
      firstName: cleanString(body?.firstName || body?.first_name, 80),
      lastName: cleanString(body?.lastName || body?.last_name, 80),
      familyName: cleanString(body?.familyName || body?.family_name, 160),
      role: cleanString(body?.role, 80),
      groupName: cleanString(body?.groupName || body?.group_name, 120),
      grade: cleanString(body?.grade, 80),
      schoolName: cleanString(body?.schoolName || body?.school_name, 160),
      allergies: cleanString(body?.allergies, 500),
      notes: cleanString(body?.notes, 500),
    });
    const hub = await getConciergeV2TeamClassHub({ eventHistoryId: id, userId });
    return NextResponse.json({ ok: true, participant, hub });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: String(error?.message || "Unable to add participant.") },
      { status: statusFor(error) },
    );
  }
}
