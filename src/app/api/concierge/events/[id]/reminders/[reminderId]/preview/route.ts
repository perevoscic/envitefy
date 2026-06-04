import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { assertConciergeV2Enabled } from "@/config/concierge-v2-flags";
import { authOptions, resolveSessionUserId } from "@/lib/auth";
import { ConciergeV2OperationError } from "@/lib/concierge-v2/operations";
import { previewConciergeV2Reminder } from "@/lib/concierge-v2/reminders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string; reminderId: string }> },
) {
  try {
    assertConciergeV2Enabled();
    const { id, reminderId } = await params;
    const session: any = await getServerSession(authOptions as any);
    const userId = await resolveSessionUserId(session);
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Sign in to preview reminders." }, { status: 401 });
    }
    const preview = await previewConciergeV2Reminder({ eventHistoryId: id, reminderId, userId });
    return NextResponse.json({ ok: true, preview });
  } catch (error: any) {
    const status =
      error instanceof ConciergeV2OperationError
        ? error.status
        : /disabled/i.test(String(error?.message || ""))
          ? 404
          : 500;
    return NextResponse.json(
      { ok: false, error: String(error?.message || "Unable to preview reminder.") },
      { status },
    );
  }
}
