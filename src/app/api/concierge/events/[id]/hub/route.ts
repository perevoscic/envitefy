import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { assertConciergeV2Enabled, isConciergeV2FlagEnabled } from "@/config/concierge-v2-flags";
import { authOptions, resolveSessionUserId } from "@/lib/auth";
import { ConciergeV2OperationError } from "@/lib/concierge-v2/operations";
import { getConciergeV2TeamClassHub } from "@/lib/concierge-v2/team-class-hub";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function assertHubEnabled() {
  assertConciergeV2Enabled();
  if (!isConciergeV2FlagEnabled("ENABLE_TEAM_CLASS_HUB")) {
    throw new Error("Team/Class Hub is disabled.");
  }
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
    assertHubEnabled();
    const { id } = await params;
    const userId = await currentUserId();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Sign in to open the hub." }, { status: 401 });
    }
    const hub = await getConciergeV2TeamClassHub({ eventHistoryId: id, userId });
    return NextResponse.json({ ok: true, hub });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: String(error?.message || "Unable to load the hub.") },
      { status: statusFor(error) },
    );
  }
}
