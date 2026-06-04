import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { assertConciergeV2Enabled } from "@/config/concierge-v2-flags";
import { authOptions, resolveSessionUserId } from "@/lib/auth";
import { applyConciergeV2Session } from "@/lib/concierge-v2/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertConciergeV2Enabled();
    const session: any = await getServerSession(authOptions as any);
    const userId = await resolveSessionUserId(session);
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Sign in to use Concierge V2." }, { status: 401 });
    }
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const result = await applyConciergeV2Session({
      userId,
      sessionId: id,
      draft: body?.draft && typeof body.draft === "object" ? body.draft : null,
    });
    return NextResponse.json({ ok: true, result });
  } catch (error: any) {
    const status = /not found/i.test(String(error?.message || ""))
      ? 404
      : /disabled/i.test(String(error?.message || ""))
        ? 404
        : 500;
    return NextResponse.json(
      { ok: false, error: String(error?.message || "Unable to apply Concierge V2 session.") },
      { status },
    );
  }
}
