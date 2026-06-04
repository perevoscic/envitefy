import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { assertConciergeV2Enabled, isConciergeV2FlagEnabled } from "@/config/concierge-v2-flags";
import { authOptions, resolveSessionUserId } from "@/lib/auth";
import { ConciergeV2OperationError } from "@/lib/concierge-v2/operations";
import {
  getConciergeV2ImportCenter,
  updateConciergeV2ExtractedItemStatus,
} from "@/lib/concierge-v2/source-imports";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function assertImportsEnabled() {
  assertConciergeV2Enabled();
  if (!isConciergeV2FlagEnabled("ENABLE_OCR_IMPORTS")) {
    throw new Error("Source imports are disabled.");
  }
}

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
  { params }: { params: Promise<{ id: string; documentId: string; itemId: string }> },
) {
  try {
    assertImportsEnabled();
    const { id, documentId, itemId } = await params;
    const userId = await currentUserId();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Sign in to review extracted items." }, { status: 401 });
    }
    const body = await req.json().catch(() => ({}));
    const item = await updateConciergeV2ExtractedItemStatus({
      eventHistoryId: id,
      userId,
      documentId,
      itemId,
      status: cleanString(body?.status, 40),
    });
    const imports = await getConciergeV2ImportCenter({ eventHistoryId: id, userId });
    return NextResponse.json({ ok: true, item, imports });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: String(error?.message || "Unable to update extracted item.") },
      { status: statusFor(error) },
    );
  }
}
