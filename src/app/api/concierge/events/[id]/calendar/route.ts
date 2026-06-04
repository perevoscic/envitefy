import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { assertConciergeV2Enabled } from "@/config/concierge-v2-flags";
import { authOptions, resolveSessionUserId } from "@/lib/auth";
import {
  getConciergeV2CalendarCenter,
  regenerateConciergeV2CalendarFeed,
} from "@/lib/concierge-v2/calendar";
import { ConciergeV2OperationError } from "@/lib/concierge-v2/operations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
    assertConciergeV2Enabled();
    const { id } = await params;
    const userId = await currentUserId();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Sign in to manage the calendar feed." }, { status: 401 });
    }
    const calendar = await getConciergeV2CalendarCenter({ eventHistoryId: id, userId });
    return NextResponse.json({ ok: true, calendar });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: String(error?.message || "Unable to load calendar feed.") },
      { status: statusFor(error) },
    );
  }
}

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertConciergeV2Enabled();
    const { id } = await params;
    const userId = await currentUserId();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Sign in to manage the calendar feed." }, { status: 401 });
    }
    const calendar = await regenerateConciergeV2CalendarFeed({ eventHistoryId: id, userId });
    return NextResponse.json({ ok: true, calendar });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: String(error?.message || "Unable to regenerate calendar feed.") },
      { status: statusFor(error) },
    );
  }
}
