import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { assertConciergeV2Enabled } from "@/config/concierge-v2-flags";
import { authOptions, resolveSessionUserId } from "@/lib/auth";
import {
  claimConciergeV2VolunteerSlot,
  ConciergeV2OperationError,
} from "@/lib/concierge-v2/operations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function cleanString(value: any, maxLength = 1000): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, maxLength) : "";
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; slotId: string }> },
) {
  try {
    assertConciergeV2Enabled();
    const { id, slotId } = await params;
    const body = await req.json().catch(() => ({}));
    const session: any = await getServerSession(authOptions as any).catch(() => null);
    const userId = session ? await resolveSessionUserId(session) : null;
    const claim = await claimConciergeV2VolunteerSlot({
      eventHistoryId: id,
      slotId,
      userId,
      guestName: cleanString(body?.guestName || body?.name, 180),
      guestEmail: cleanString(body?.guestEmail || body?.email, 240),
      quantity: Number(body?.quantity || 1),
      notes: cleanString(body?.notes, 1000) || null,
    });
    return NextResponse.json({ ok: true, claim });
  } catch (error: any) {
    const status =
      error instanceof ConciergeV2OperationError
        ? error.status
        : /disabled/i.test(String(error?.message || ""))
          ? 404
          : 500;
    return NextResponse.json(
      { ok: false, error: String(error?.message || "Unable to claim this slot.") },
      { status },
    );
  }
}
