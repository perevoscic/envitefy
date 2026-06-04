import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { assertConciergeV2Enabled, isConciergeV2FlagEnabled } from "@/config/concierge-v2-flags";
import { authOptions, resolveSessionUserId } from "@/lib/auth";
import { ConciergeV2OperationError } from "@/lib/concierge-v2/operations";
import { applyConciergeV2AcceptedImportItems } from "@/lib/concierge-v2/source-imports";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function assertImportsEnabled() {
  assertConciergeV2Enabled();
  if (!isConciergeV2FlagEnabled("ENABLE_OCR_IMPORTS")) {
    throw new Error("Source imports are disabled.");
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

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string; documentId: string }> },
) {
  try {
    assertImportsEnabled();
    const { id, documentId } = await params;
    const userId = await currentUserId();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Sign in to apply extracted items." }, { status: 401 });
    }
    const result = await applyConciergeV2AcceptedImportItems({
      eventHistoryId: id,
      userId,
      documentId,
    });
    return NextResponse.json({ ok: true, result });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: String(error?.message || "Unable to apply extracted items.") },
      { status: statusFor(error) },
    );
  }
}
