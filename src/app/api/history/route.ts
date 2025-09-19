import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserIdByEmail, insertEventHistory, listEventHistoryByUser, listAcceptedSharedEventsForUser, listSharesByOwnerForEvents } from "@/lib/db";

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
    const own = await listEventHistoryByUser(userId, 100);
    // Annotate own rows that have outgoing shares (pending or accepted)
    let ownWithShareOut = own;
    try {
      const ids = own.map((r: any) => r.id);
      const stats = await listSharesByOwnerForEvents(userId, ids);
      const sharedOutSet = new Set(
        (stats || [])
          .filter(
            (s) => Number(s.accepted_count || 0) + Number(s.pending_count || 0) > 0
          )
          .map((s) => s.event_id)
      );
      ownWithShareOut = own.map((r: any) =>
        sharedOutSet.has(r.id)
          ? { ...r, data: { ...(r.data || {}), sharedOut: true } }
          : r
      );
    } catch {}
    let shared: any[] = [];
    try {
      shared = await listAcceptedSharedEventsForUser(userId);
    } catch (e: any) {
      try {
        console.warn("[history] GET: shared events unavailable (likely no event_shares table yet)", String(e?.message || e));
      } catch {}
      shared = [];
    }
    // Annotate shared items with marker for UI and force category to Shared events
    const annotatedShared = (shared || []).map((r) => ({
      ...r,
      data: {
        ...(r.data || {}),
        shared: true,
        category: "Shared events",
      },
    }));
    const items = [...ownWithShareOut, ...annotatedShared].sort((a: any, b: any) => {
      const ta = new Date(a.created_at || 0).getTime();
      const tb = new Date(b.created_at || 0).getTime();
      return tb - ta;
    });
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


