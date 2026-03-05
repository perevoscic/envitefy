import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserIdByEmail, insertEventHistory, listEventHistoryByUser, listAcceptedSharedEventsForUser, listSharesByOwnerForEvents, upsertSignupForm } from "@/lib/db";
import { getCachedHistory, setCachedHistory, invalidateUserHistory } from "@/lib/history-cache";
import { createHash } from "crypto";
import { normalizeAccessControlPayload } from "@/lib/event-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const HISTORY_DEBUG = process.env.HISTORY_DEBUG === "1";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const limitRaw = url.searchParams.get("limit");
    const viewRaw = (url.searchParams.get("view") || "summary").toLowerCase();
    const limit = Math.max(1, Math.min(200, Number.parseInt(limitRaw || "40", 10)));
    const view: "summary" | "calendar" | "sidebar" | "full" =
      viewRaw === "full" || viewRaw === "calendar" || viewRaw === "sidebar"
        ? (viewRaw as any)
        : "summary";

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

    // In-memory cache guards DB load
    const cached = getCachedHistory(userId);
    let items: any[];
    if (cached) {
      items = cached;
    } else {
      const [own, shared] = await Promise.all([
        listEventHistoryByUser(userId, limit),
        (async () => {
          try {
            return await listAcceptedSharedEventsForUser(userId);
          } catch (e: any) {
            if (HISTORY_DEBUG) {
              console.warn(
                "[history] GET: shared events unavailable (likely no event_shares table yet)",
                String(e?.message || e)
              );
            }
            return [];
          }
        })(),
      ]);

      let ownWithShareOut = own;
      try {
        if (own.length > 0) {
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
            sharedOutSet.has(r.id) ? { ...r, data: { ...(r.data || {}), sharedOut: true } } : r
          );
        }
      } catch {}

      const annotatedShared = (shared || []).map((r) => ({
        ...r,
        data: { ...(r.data || {}), shared: true, category: "Shared events" },
      }));

      items = [...ownWithShareOut, ...annotatedShared].sort((a: any, b: any) => {
        const ta = new Date(a.created_at || 0).getTime();
        const tb = new Date(b.created_at || 0).getTime();
        return tb - ta;
      });

      setCachedHistory(userId, items);
    }

    // Scrub heavy fields based on view
    const scrub = (data: any) => {
      if (!data || typeof data !== "object") return data;
      const out: any = { ...data };
      if (view !== "full") {
        if (typeof out.ocrText === "string") out.ocrText = undefined;
        if (out.attachment && typeof out.attachment === "object") {
          out.attachment = { ...out.attachment, dataUrl: undefined };
        }
      }
      if (view === "summary") {
        return {
          category: out.category ?? null,
          shared: out.shared ?? false,
          sharedOut: out.sharedOut ?? false,
        };
      }
      if (view === "sidebar") {
        const responses = Array.isArray(out?.signupForm?.responses)
          ? out.signupForm.responses.map((row: any) => ({
              userId:
                typeof row?.userId === "string" ? row.userId : undefined,
              email: typeof row?.email === "string" ? row.email : undefined,
              status:
                typeof row?.status === "string" ? row.status : undefined,
              name: typeof row?.name === "string" ? row.name : undefined,
            }))
          : null;
        return {
          category: out.category ?? null,
          shared: out.shared ?? false,
          sharedOut: out.sharedOut ?? false,
          status: out.status ?? null,
          description:
            typeof out.description === "string" ? out.description : null,
          startISO: out.startISO ?? null,
          start: out.start ?? null,
          createdVia: out.createdVia ?? null,
          color: out.color ?? null,
          event:
            out.event && typeof out.event === "object"
              ? {
                  start: out.event.start ?? null,
                  color: out.event.color ?? null,
                }
              : null,
          signupForm: responses ? { responses } : undefined,
        };
      }
      return out;
    };

    const light = (items || []).map((r) => ({
      id: r.id,
      title: r.title,
      created_at: r.created_at || null,
      data: scrub(r.data),
    }));

    // Conditional response with ETag/Last-Modified
    const seed = JSON.stringify(
      light.map((i) => [
        i.id,
        i.created_at || null,
        i.title || "",
        i.data?.category ?? null,
        i.data?.shared ?? false,
        i.data?.sharedOut ?? false,
      ])
    );
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
