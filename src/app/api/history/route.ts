import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, resolveSessionUserId } from "@/lib/auth";
import {
  listDashboardHistoryFallbackForUser,
  insertEventHistory,
  listDashboardHistoryWindowForUser,
  listHistoryForUser,
  listSidebarHistoryForUserFast,
  upsertSignupForm,
} from "@/lib/db";
import {
  getCachedHistory,
  getCachedHistoryStale,
  setCachedHistory,
  invalidateUserHistory,
} from "@/lib/history-cache";
import { invalidateUserDashboard } from "@/lib/dashboard-cache";
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

function summarizeHistoryItemsForLog(items: any[]) {
  return (items || []).slice(0, 8).map((item) => ({
    id: item?.id || null,
    title: item?.title || null,
    createdAt: item?.created_at || null,
    ownership: item?.data?.ownership ?? null,
    invitedFromScan: item?.data?.invitedFromScan ?? null,
    shareStatus: item?.data?.shareStatus ?? null,
    shared: item?.data?.shared ?? null,
    sharedOut: item?.data?.sharedOut ?? null,
    createdVia: item?.data?.createdVia ?? null,
    status: item?.data?.status ?? null,
    startAt:
      item?.data?.startAt ??
      item?.data?.startISO ??
      item?.data?.start ??
      item?.data?.fieldsGuess?.start ??
      item?.data?.event?.start ??
      null,
  }));
}

function isStatementTimeoutError(err: unknown): boolean {
  const anyErr = err as { code?: unknown; message?: unknown } | null;
  const code = String(anyErr?.code || "");
  const message = String(anyErr?.message || "");
  return (
    code === "57014" ||
    /statement timeout|canceling statement due to statement timeout/i.test(
      message
    )
  );
}

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
    const userId = await resolveSessionUserId(session);
    if (!userId) {
      if (HISTORY_DEBUG) {
        console.log("[history] GET: no userId resolved", {
          hasSession: Boolean(sessionUser),
          sessionEmail: sessionUser?.email || null,
        });
      }
      return NextResponse.json({
        items: [],
        diagnostics: {
          emptyReason: "no-resolved-user",
          view,
          timeFilter,
          hasSession: Boolean(sessionUser),
        },
      });
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
    const allowEmptySidebarCache = !(view === "sidebar" && timeFilter === "all");
    const cachedRaw = useCache ? getCachedHistory(userId, view, limit, timeFilter) : null;
    const cached =
      !allowEmptySidebarCache && Array.isArray(cachedRaw) && cachedRaw.length === 0
        ? null
        : cachedRaw;
    const staleCached =
      useCache ? getCachedHistoryStale(userId, view, limit, timeFilter) : null;
    let light: any[] | null = null;
    let degradedReason: string | null = null;
    let shouldCacheResponse = true;
    let responseSource = cached ? "cache" : "query";
    if (cached) {
      light = cached;
    } else {
      let rows: any[] = [];
      if (view === "sidebar" && timeFilter === "all") {
        responseSource = "dashboard-fallback";
        try {
          rows = await listDashboardHistoryFallbackForUser(userId, limit, limit);
          if (!rows.length) {
            rows = await listHistoryForUser({ userId, view, limit, timeFilter });
            responseSource = "dashboard-fallback-empty-union-fallback";
          }
        } catch (err) {
          if (!isStatementTimeoutError(err)) throw err;
          if (Array.isArray(staleCached)) {
            light = staleCached;
            rows = [];
            responseSource = "stale-cache";
          } else {
            try {
              rows = await listDashboardHistoryWindowForUser(userId, limit);
              responseSource = "dashboard-window-timeout-fallback";
            } catch (fallbackErr) {
              if (!isStatementTimeoutError(fallbackErr)) throw fallbackErr;
              try {
                rows = await listSidebarHistoryForUserFast(userId, limit);
                responseSource = "fast-sidebar-timeout-fallback";
              } catch (finalErr) {
                if (!isStatementTimeoutError(finalErr)) throw finalErr;
                light = [];
                responseSource = "degraded-empty";
                degradedReason = "statement-timeout";
                shouldCacheResponse = false;
              }
            }
          }
        }
      } else {
        responseSource = "history-union";
        try {
          rows = await listHistoryForUser({ userId, view, limit, timeFilter });
        } catch (err) {
          const canUseFastSidebarFallback =
            view === "sidebar" &&
            timeFilter === "all" &&
            isStatementTimeoutError(err);
          if (!canUseFastSidebarFallback) throw err;
          if (process.env.NODE_ENV !== "production") {
            console.warn("[history] falling back to fast sidebar query after statement timeout");
          }
          try {
            rows = await listSidebarHistoryForUserFast(userId, limit);
            responseSource = "fast-sidebar-fallback";
          } catch (fastErr) {
            if (!isStatementTimeoutError(fastErr)) throw fastErr;
            if (Array.isArray(staleCached)) {
              light = staleCached;
              rows = [];
              responseSource = "stale-cache";
            } else {
              light = [];
              responseSource = "degraded-empty";
            }
            degradedReason = "statement-timeout";
            shouldCacheResponse = false;
          }
        }
      }
      if (!light) {
        light = finalizeItems(rows);
      }
      if (useCache && shouldCacheResponse && light !== staleCached) {
        setCachedHistory(userId, view, limit, timeFilter, light);
      }
    }
    const diagnostics = {
      itemCount: Array.isArray(light) ? light.length : 0,
      degradedReason,
      source: responseSource,
      emptyReason:
        Array.isArray(light) && light.length === 0
          ? degradedReason
            ? "query-degraded-empty"
            : "no-matching-rows"
          : null,
      view,
      timeFilter,
    };

    // Conditional response with ETag/Last-Modified
    const seed = JSON.stringify(light);
    const etag = '"h:' + createHash("sha1").update(seed).digest("hex") + '"';
    const lastModifiedIso = light[0]?.created_at ? new Date(light[0].created_at) : new Date();
    const headers: Record<string, string> = {
      ETag: etag,
      "Last-Modified": lastModifiedIso.toUTCString(),
      "Cache-Control": "private, max-age=30, stale-while-revalidate=120",
    };
    if (degradedReason) {
      headers["X-History-Degraded"] = degradedReason;
    }

    const ifNoneMatch = req.headers.get("if-none-match");
    if (ifNoneMatch && ifNoneMatch === etag) {
      return new Response(null, { status: 304, headers });
    }

    if (HISTORY_DEBUG) {
      console.error("[history] GET: returning items", {
        userId,
        count: Array.isArray(light) ? light.length : 0,
        top: light?.[0] ? { id: light[0].id, created_at: light[0].created_at } : null,
        view,
        limit,
        timeFilter,
        diagnostics,
        sample: summarizeHistoryItemsForLog(Array.isArray(light) ? light : []),
      });
    }

    return NextResponse.json({ items: light, diagnostics }, { headers });
  } catch (err: any) {
    if (!HISTORY_DEBUG && process.env.NODE_ENV !== "production") {
      console.error("[history] GET error", err);
    }
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
    const userId = await resolveSessionUserId(session);
    if (sessionUser && !userId) {
      if (HISTORY_DEBUG) {
        console.warn("[history] POST: unable to resolve signed-in account", {
          sessionEmail: sessionUser?.email || null,
          rawSessionUserId:
            typeof sessionUser?.id === "string" ? sessionUser.id : null,
        });
      }
      return NextResponse.json(
        { error: "Unable to resolve signed-in account" },
        { status: 409 },
      );
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
          rawSessionUserId:
            typeof sessionUser?.id === "string" ? sessionUser.id : null,
          title,
          category: data?.category || null,
          createdVia: data?.createdVia || null,
          startISO: data?.startISO || null,
          startAt: data?.startAt || null,
          payloadBytes: dataPayloadBytes,
        }
      );
    }
    const row = await insertEventHistory({ userId, title, data });
    
    // Invalidate cache for this user since we just added a new event
    if (userId) {
      invalidateUserHistory(userId);
      invalidateUserDashboard(userId);
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
