import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserIdByEmail, listEventHistoryByUser, listRecentEventHistory } from "@/lib/db";
import { redactHistoryHeavyFields } from "@/lib/history-view";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session: any = await getServerSession(authOptions as any);
    const sessionUser: any = (session && (session as any).user) || null;
    let userId: string | null = (sessionUser?.id as string | undefined) || null;
    if (!userId && sessionUser?.email) {
      userId = (await getUserIdByEmail(String(sessionUser.email))) || null;
    }

    const mine = userId ? await listEventHistoryByUser(userId, 10) : [];
    const recent = await listRecentEventHistory(10);

    const scrub = (rows: any[]) =>
      (rows || []).map((r) => ({
        id: r.id,
        user_id: r.user_id,
        title: r.title,
        created_at: r.created_at,
        data: redactHistoryHeavyFields(r.data),
      }));

    return NextResponse.json({
      user: sessionUser ? { id: userId, email: sessionUser.email || null } : null,
      mineCount: mine.length,
      recentCount: recent.length,
      mine: scrub(mine),
      recent: scrub(recent),
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: String(err?.message || err || "unknown error") },
      { status: 500 }
    );
  }
}


