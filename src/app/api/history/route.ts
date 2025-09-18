import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserIdByEmail, insertEventHistory, listEventHistoryByUser } from "@/lib/db";

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
    if (!userId) {
      try {
        console.log(
          "[history] GET: no userId resolved",
          {
            hasSession: Boolean(sessionUser),
            sessionEmail: sessionUser?.email || null,
          }
        );
      } catch {}
      return NextResponse.json({ items: [] });
    }
    const items = await listEventHistoryByUser(userId, 100);
    try {
      console.log(
        "[history] GET: returning items",
        {
          userId,
          count: Array.isArray(items) ? items.length : 0,
          top: items?.[0]
            ? { id: items[0].id, created_at: items[0].created_at }
            : null,
        }
      );
    } catch {}
    return NextResponse.json({ items });
  } catch (err: any) {
    try {
      console.error("[history] GET error", err);
    } catch {}
    return NextResponse.json(
      { error: String(err?.message || err || "unknown error") },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session: any = await getServerSession(authOptions as any);
    const sessionUser: any = (session && (session as any).user) || null;
    let userId: string | null = (sessionUser?.id as string | undefined) || null;
    if (!userId && sessionUser?.email) {
      userId = (await getUserIdByEmail(String(sessionUser.email))) || null;
    }
    const body = await req.json().catch(() => ({}));
    const rawTitle = (body.title as string) || "Event";
    const title = String(rawTitle).slice(0, 300);
    const data = body.data ?? {};
    try {
      console.log(
        "[history] POST: inserting",
        {
          resolvedUserId: userId,
          sessionEmail: sessionUser?.email || null,
          title,
          category: data?.category || null,
        }
      );
    } catch {}
    const row = await insertEventHistory({ userId, title, data });
    try {
      console.log(
        "[history] POST: inserted",
        {
          id: row?.id,
          userId: row?.user_id || null,
          created_at: row?.created_at || null,
        }
      );
    } catch {}
    return NextResponse.json(row, { status: 201 });
  } catch (err: any) {
    try {
      console.error("[history] POST error", err);
    } catch {}
    return NextResponse.json(
      { error: String(err?.message || err || "unknown error") },
      { status: 500 }
    );
  }
}


