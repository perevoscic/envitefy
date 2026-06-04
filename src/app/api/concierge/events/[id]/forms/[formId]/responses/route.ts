import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { assertConciergeV2Enabled } from "@/config/concierge-v2-flags";
import { authOptions, resolveSessionUserId } from "@/lib/auth";
import {
  ConciergeV2OperationError,
  submitConciergeV2FormResponse,
} from "@/lib/concierge-v2/operations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function cleanString(value: any, maxLength = 1000): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, maxLength) : "";
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; formId: string }> },
) {
  try {
    assertConciergeV2Enabled();
    const { id, formId } = await params;
    const body = await req.json().catch(() => ({}));
    const session: any = await getServerSession(authOptions as any).catch(() => null);
    const userId = session ? await resolveSessionUserId(session) : null;
    const response = await submitConciergeV2FormResponse({
      eventHistoryId: id,
      formId,
      userId,
      guestName: cleanString(body?.guestName || body?.name, 180),
      guestEmail: cleanString(body?.guestEmail || body?.email, 240),
      answers: body?.answers || {},
    });
    return NextResponse.json({ ok: true, response });
  } catch (error: any) {
    const status =
      error instanceof ConciergeV2OperationError
        ? error.status
        : /disabled/i.test(String(error?.message || ""))
          ? 404
          : 500;
    return NextResponse.json(
      { ok: false, error: String(error?.message || "Unable to submit form response.") },
      { status },
    );
  }
}
