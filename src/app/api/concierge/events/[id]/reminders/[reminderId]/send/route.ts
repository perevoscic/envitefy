import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { assertConciergeV2Enabled, isConciergeV2FlagEnabled } from "@/config/concierge-v2-flags";
import { authOptions, resolveSessionUserId } from "@/lib/auth";
import { ConciergeV2OperationError } from "@/lib/concierge-v2/operations";
import { sendConciergeV2ReminderNow } from "@/lib/concierge-v2/reminders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function statusFor(error: any) {
  return error instanceof ConciergeV2OperationError
    ? error.status
    : /disabled/i.test(String(error?.message || ""))
      ? 404
      : 500;
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string; reminderId: string }> },
) {
  try {
    assertConciergeV2Enabled();
    if (!isConciergeV2FlagEnabled("ENABLE_REMINDER_ENGINE")) {
      throw new Error("Reminder engine is disabled.");
    }
    const { id, reminderId } = await params;
    const session: any = await getServerSession(authOptions as any);
    const userId = await resolveSessionUserId(session);
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Sign in to send reminders." }, { status: 401 });
    }
    const delivery = await sendConciergeV2ReminderNow({ eventHistoryId: id, reminderId, userId });
    return NextResponse.json({ ok: true, delivery });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: String(error?.message || "Unable to send reminder.") },
      { status: statusFor(error) },
    );
  }
}
