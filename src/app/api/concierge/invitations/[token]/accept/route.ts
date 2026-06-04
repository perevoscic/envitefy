import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { assertConciergeV2Enabled, isConciergeV2FlagEnabled } from "@/config/concierge-v2-flags";
import { authOptions, resolveSessionUserId } from "@/lib/auth";
import { ConciergeV2OperationError } from "@/lib/concierge-v2/operations";
import { acceptConciergeV2HubInvitation } from "@/lib/concierge-v2/team-class-hub";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function statusFor(error: any) {
  return error instanceof ConciergeV2OperationError
    ? error.status
    : /disabled/i.test(String(error?.message || ""))
      ? 404
      : 500;
}

export async function POST(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    assertConciergeV2Enabled();
    if (!isConciergeV2FlagEnabled("ENABLE_TEAM_CLASS_HUB")) {
      throw new Error("Team/Class Hub is disabled.");
    }
    const session: any = await getServerSession(authOptions as any);
    const userId = await resolveSessionUserId(session);
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Sign in to accept this invitation." }, { status: 401 });
    }
    const { token } = await params;
    const invitation = await acceptConciergeV2HubInvitation({
      token,
      userId,
      email: session?.user?.email || null,
    });
    return NextResponse.json({ ok: true, invitation });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: String(error?.message || "Unable to accept invitation.") },
      { status: statusFor(error) },
    );
  }
}
