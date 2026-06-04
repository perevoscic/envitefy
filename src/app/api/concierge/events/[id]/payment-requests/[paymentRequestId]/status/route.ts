import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { assertConciergeV2Enabled } from "@/config/concierge-v2-flags";
import { authOptions, resolveSessionUserId } from "@/lib/auth";
import {
  ConciergeV2OperationError,
  updateConciergeV2PaymentStatus,
} from "@/lib/concierge-v2/operations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function cleanString(value: any, maxLength = 1000): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, maxLength) : "";
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; paymentRequestId: string }> },
) {
  try {
    assertConciergeV2Enabled();
    const { id, paymentRequestId } = await params;
    const session: any = await getServerSession(authOptions as any);
    const userId = await resolveSessionUserId(session);
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Sign in to manage payments." }, { status: 401 });
    }
    const body = await req.json().catch(() => ({}));
    const payment = await updateConciergeV2PaymentStatus({
      eventHistoryId: id,
      paymentRequestId,
      userId,
      status: cleanString(body?.status, 40),
      notes: cleanString(body?.notes, 1000) || null,
      manualMethod: cleanString(body?.manualMethod, 120) || null,
    });
    return NextResponse.json({ ok: true, payment });
  } catch (error: any) {
    const status =
      error instanceof ConciergeV2OperationError
        ? error.status
        : /disabled/i.test(String(error?.message || ""))
          ? 404
          : 500;
    return NextResponse.json(
      { ok: false, error: String(error?.message || "Unable to update payment status.") },
      { status },
    );
  }
}
