import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { assertConciergeV2Enabled } from "@/config/concierge-v2-flags";
import { authOptions, resolveSessionUserId } from "@/lib/auth";
import { ConciergeV2OperationError } from "@/lib/concierge-v2/operations";
import {
  getConciergeV2RsvpBoard,
  updateConciergeV2RsvpResponse,
} from "@/lib/concierge-v2/rsvp-board";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; rsvpId: string }> },
) {
  try {
    assertConciergeV2Enabled();
    const { id, rsvpId } = await params;
    const userId = await currentUserId();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Sign in to manage RSVPs." }, { status: 401 });
    }
    const body = await req.json().catch(() => ({}));
    const rsvp = await updateConciergeV2RsvpResponse({
      eventHistoryId: id,
      userId,
      rsvpId,
      response: cleanString(body?.response, 20),
    });
    const board = await getConciergeV2RsvpBoard({ eventHistoryId: id, userId });
    return NextResponse.json({ ok: true, rsvp, board });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: String(error?.message || "Unable to update RSVP.") },
      { status: statusFor(error) },
    );
  }
}
