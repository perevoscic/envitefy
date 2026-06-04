import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { assertConciergeV2Enabled } from "@/config/concierge-v2-flags";
import { authOptions, resolveSessionUserId } from "@/lib/auth";
import { getConciergeV2Session } from "@/lib/concierge-v2/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertConciergeV2Enabled();
    const session: any = await getServerSession(authOptions as any);
    const userId = await resolveSessionUserId(session);
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Sign in to use Concierge V2." }, { status: 401 });
    }
    const { id } = await params;
    const row = await getConciergeV2Session({ userId, sessionId: id });
    if (!row) return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
    return NextResponse.json({ ok: true, session: row, draft: row.normalized_output_json });
  } catch (error: any) {
    const status = /disabled/i.test(String(error?.message || "")) ? 404 : 500;
    return NextResponse.json(
      { ok: false, error: String(error?.message || "Unable to load Concierge V2 session.") },
      { status },
    );
  }
}
