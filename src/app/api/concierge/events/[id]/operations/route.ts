import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { assertConciergeV2Enabled } from "@/config/concierge-v2-flags";
import { authOptions, resolveSessionUserId } from "@/lib/auth";
import {
  ConciergeV2OperationError,
  getConciergeV2OperationsSummary,
} from "@/lib/concierge-v2/operations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertConciergeV2Enabled();
    const { id } = await params;
    const session: any = await getServerSession(authOptions as any);
    const userId = await resolveSessionUserId(session);
    const summary = await getConciergeV2OperationsSummary({
      eventHistoryId: id,
      userId,
      includePrivate: true,
    });
    return NextResponse.json({ ok: true, summary });
  } catch (error: any) {
    const status =
      error instanceof ConciergeV2OperationError
        ? error.status
        : /disabled/i.test(String(error?.message || ""))
          ? 404
          : 500;
    return NextResponse.json(
      { ok: false, error: String(error?.message || "Unable to load event operations.") },
      { status },
    );
  }
}
