import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { assertConciergeV2Enabled } from "@/config/concierge-v2-flags";
import { authOptions, resolveSessionUserId } from "@/lib/auth";
import { ConciergeV2OperationError } from "@/lib/concierge-v2/operations";
import { updateConciergeV2ReminderStatus } from "@/lib/concierge-v2/reminders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function cleanString(value: any, maxLength = 1000): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, maxLength) : "";
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; reminderId: string }> },
) {
  try {
    assertConciergeV2Enabled();
    const { id, reminderId } = await params;
    const session: any = await getServerSession(authOptions as any);
    const userId = await resolveSessionUserId(session);
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Sign in to update reminders." }, { status: 401 });
    }
    const body = await req.json().catch(() => ({}));
    const reminder = await updateConciergeV2ReminderStatus({
      eventHistoryId: id,
      reminderId,
      userId,
      status: cleanString(body?.status, 40),
    });
    return NextResponse.json({ ok: true, reminder });
  } catch (error: any) {
    const status =
      error instanceof ConciergeV2OperationError
        ? error.status
        : /disabled/i.test(String(error?.message || ""))
          ? 404
          : 500;
    return NextResponse.json(
      { ok: false, error: String(error?.message || "Unable to update reminder.") },
      { status },
    );
  }
}
