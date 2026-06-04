import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { assertConciergeV2Enabled, isConciergeV2FlagEnabled } from "@/config/concierge-v2-flags";
import { authOptions, resolveSessionUserId } from "@/lib/auth";
import {
  ConciergeV2OperationError,
  createConciergeV2PaymentCheckout,
} from "@/lib/concierge-v2/operations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; paymentRequestId: string }> },
) {
  try {
    assertConciergeV2Enabled();
    if (!isConciergeV2FlagEnabled("ENABLE_MANUAL_PAYMENTS")) {
      throw new Error("Payments are disabled.");
    }
    const { id, paymentRequestId } = await params;
    const session: any = await getServerSession(authOptions as any);
    const userId = await resolveSessionUserId(session);
    const body = await req.json().catch(() => ({}));
    const checkout = await createConciergeV2PaymentCheckout({
      eventHistoryId: id,
      paymentRequestId,
      userId,
      guestName: cleanString(body?.guestName, 180) || null,
      origin: cleanString(req.headers.get("origin"), 500) || null,
    });
    return NextResponse.json({ ok: true, checkout });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: String(error?.message || "Unable to create checkout session.") },
      { status: statusFor(error) },
    );
  }
}
