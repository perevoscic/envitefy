import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { assertConciergeV2Enabled, isConciergeV2FlagEnabled } from "@/config/concierge-v2-flags";
import { authOptions, resolveSessionUserId } from "@/lib/auth";
import { ConciergeV2OperationError } from "@/lib/concierge-v2/operations";
import {
  createConciergeV2SourceImport,
  getConciergeV2ImportCenter,
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

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertImportsEnabled();
    const { id } = await params;
    const userId = await currentUserId();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Sign in to import source material." }, { status: 401 });
    }
    const imports = await getConciergeV2ImportCenter({ eventHistoryId: id, userId });
    return NextResponse.json({ ok: true, imports });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: String(error?.message || "Unable to load source imports.") },
      { status: statusFor(error) },
    );
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertImportsEnabled();
    const { id } = await params;
    const userId = await currentUserId();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Sign in to import source material." }, { status: 401 });
    }
    const body = await req.json().catch(() => ({}));
    const document = await createConciergeV2SourceImport({
      eventHistoryId: id,
      userId,
      sourceKind: cleanString(body?.sourceKind, 80) || "pasted_text",
      text: cleanString(body?.text || body?.pastedText, 20_000),
    });
    const imports = await getConciergeV2ImportCenter({ eventHistoryId: id, userId });
    return NextResponse.json({ ok: true, document, imports });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: String(error?.message || "Unable to import source material.") },
      { status: statusFor(error) },
    );
  }
}
