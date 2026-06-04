import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { assertConciergeV2Enabled } from "@/config/concierge-v2-flags";
import { authOptions, resolveSessionUserId } from "@/lib/auth";
import { ConciergeV2OperationError } from "@/lib/concierge-v2/operations";
import { getConciergeV2RsvpBoard } from "@/lib/concierge-v2/rsvp-board";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
    assertConciergeV2Enabled();
    const { id } = await params;
    const userId = await currentUserId();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Sign in to manage RSVPs." }, { status: 401 });
    }
    const board = await getConciergeV2RsvpBoard({ eventHistoryId: id, userId });
    return NextResponse.json({ ok: true, board });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: String(error?.message || "Unable to load RSVP board.") },
      { status: statusFor(error) },
    );
  }
}
