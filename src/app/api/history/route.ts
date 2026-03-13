import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserIdByEmail, insertEventHistory, listHistoryForUser, upsertSignupForm } from "@/lib/db";
import { getCachedHistory, setCachedHistory, invalidateUserHistory } from "@/lib/history-cache";
import { createHash } from "crypto";
import { normalizeAccessControlPayload } from "@/lib/event-access";
import {
  isCacheableHistoryView,
  normalizeHistoryTimeFilter,
  normalizeHistoryView,
  redactHistoryHeavyFields,
} from "@/lib/history-view";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const HISTORY_DEBUG = process.env.HISTORY_DEBUG === "1";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const limitRaw = url.searchParams.get("limit");
    const viewRaw = url.searchParams.get("view");
    const timeRaw = url.searchParams.get("time");
    const limit = Math.max(1, Math.min(200, Number.parseInt(limitRaw || "40", 10)));
    const view = normalizeHistoryView(viewRaw);
    const timeFilter = normalizeHistoryTimeFilter(timeRaw);

    const session: any = await getServerSession(authOptions as any);
    const sessionUser: any = (session && (session as any).user) || null;
    let userId: string | null = (sessionUser?.id as string | undefined) || null;
    if (!userId && sessionUser?.email) {
      userId = (await getUserIdByEmail(String(sessionUser.email))) || null;
    }
    if (!userId) {
      if (HISTORY_DEBUG) {
        console.log("[history] GET: no userId resolved", {
          hasSession: Boolean(sessionUser),
          sessionEmail: sessionUser?.email || null,
        });
      }
      return NextResponse.json({ items: [] });
    }

    const finalizeItems = (rows: any[]) =>
      (rows || []).map((row) => {
        let data =
          view === "full"
            ? redactHistoryHeavyFields(row?.data)
            : row?.data && typeof row.data === "object"
            ? { ...row.data }
            : row?.data;
        if (view === "sidebar" && data && typeof data === "object" && data.signupForm == null) {
          data = { ...data };
          delete (data as any).signupForm;
        }
        return {
          id: row.id,
          title: row.title,
          created_at: row.created_at || null,
          data,
        };
      });

    const useCache = isCacheableHistoryView(view);
    const cached = useCache ? getCachedHistory(userId, view, limit, timeFilter) : null;
    let light: any[];
    if (cached) {
      light = cached;
    } else {
      const rows = await listHistoryForUser({ userId, view, limit, timeFilter });
      light = finalizeItems(rows);
      if (useCache) {
        setCachedHistory(userId, view, limit, timeFilter, light);
      }
    }

    // Conditional response with ETag/Last-Modified
    const seed = JSON.stringify(light);
    const etag = '"h:' + createHash("sha1").update(seed).digest("hex") + '"';
    const lastModifiedIso = light[0]?.created_at ? new Date(light[0].created_at) : new Date();
    const headers: Record<string, string> = {
      ETag: etag,
      "Last-Modified": lastModifiedIso.toUTCString(),
      "Cache-Control": "private, max-age=30, stale-while-revalidate=120",
    };

    const ifNoneMatch = req.headers.get("if-none-match");
    if (ifNoneMatch && ifNoneMatch === etag) {
      return new Response(null, { status: 304, headers });
    }

    if (HISTORY_DEBUG) {
      console.log("[history] GET: returning items", {
        userId,
        count: Array.isArray(light) ? light.length : 0,
        top: light?.[0] ? { id: light[0].id, created_at: light[0].created_at } : null,
        view,
        limit,
        timeFilter,
      });
    }

    return NextResponse.json({ items: light }, { headers });
  } catch (err: any) {
    if (HISTORY_DEBUG) {
      console.error("[history] GET error", err);
    }
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
    const dataJson = JSON.stringify(data);
    const dataPayloadBytes = Buffer.byteLength(dataJson, "utf8");
    if (data && typeof data === "object" && "accessControl" in data) {
      data.accessControl = await normalizeAccessControlPayload(
        data.accessControl
      );
      if (!data.accessControl) delete data.accessControl;
    }
    if (HISTORY_DEBUG) {
      console.log(
        "[history] POST: inserting",
        {
          resolvedUserId: userId,
          sessionEmail: sessionUser?.email || null,
          title,
          category: data?.category || null,
          payloadBytes: dataPayloadBytes,
        }
      );
    }
    const row = await insertEventHistory({ userId, title, data });
    
    // Invalidate cache for this user since we just added a new event
    if (userId) {
      invalidateUserHistory(userId);
    }
    
    // Only upsert into signup_forms when payload clearly includes a signup form
    try {
      const sf = data && typeof data === "object" ? (data as any).signupForm : null;
      if (
        sf &&
        typeof sf === "object" &&
        Array.isArray((sf as any).sections) &&
        typeof (sf as any).version === "number"
      ) {
        await upsertSignupForm(row.id, sf);
      }
    } catch {}
    if (HISTORY_DEBUG) {
      console.log(
        "[history] POST: inserted",
        {
          id: row?.id,
          userId: row?.user_id || null,
          created_at: row?.created_at || null,
        }
      );
    }
    return NextResponse.json(row, { status: 201 });
  } catch (err: any) {
    if (HISTORY_DEBUG) {
      console.error("[history] POST error", err);
    }
    return NextResponse.json(
      { error: String(err?.message || err || "unknown error") },
      { status: 500 }
    );
  }
}
