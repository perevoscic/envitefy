import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, resolveSessionUserId } from "@/lib/auth";
import {
  getEventHistoryById,
  updateEventHistoryData,
  updateEventHistoryTitle,
} from "@/lib/db";
import { invalidateUserHistory } from "@/lib/history-cache";
import { invalidateUserDashboard } from "@/lib/dashboard-cache";
import { computeGymBuilderStatuses } from "@/lib/meet-discovery";
import { hasProductScope, normalizeProductScopes } from "@/lib/product-scopes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const MEET_DEBUG = process.env.NODE_ENV !== "production";

function estimateJsonBytes(value: unknown): number | null {
  try {
    return Buffer.byteLength(JSON.stringify(value), "utf8");
  } catch {
    return null;
  }
}

async function getSessionAccess() {
  const session: any = await getServerSession(authOptions as any);
  return {
    userId: await resolveSessionUserId(session),
    productScopes: normalizeProductScopes((session?.user as any)?.productScopes),
  };
}

function deepMerge(base: any, patch: any): any {
  if (patch === undefined) return base;
  if (patch === null || typeof patch !== "object" || Array.isArray(patch)) {
    return patch;
  }
  const source = base && typeof base === "object" ? base : {};
  const out: Record<string, any> = { ...source };
  for (const [key, value] of Object.entries(patch)) {
    out[key] = deepMerge(source[key], value);
  }
  return out;
}

export async function GET(
  _req: Request,
  context: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await context.params;
    const row = await getEventHistoryById(eventId);
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { userId: sessionUserId, productScopes } = await getSessionAccess();
    if (!hasProductScope(productScopes, "gymnastics")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (row.user_id && row.user_id !== sessionUserId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const meetData = row.data || {};
    const body = {
      ok: true,
      eventId: row.id,
      title: row.title,
      meet_page_json: meetData,
      statuses: computeGymBuilderStatuses(meetData),
    };
    if (MEET_DEBUG) {
      console.error("[meet] GET: response_bytes", {
        eventId: row.id,
        bytes: estimateJsonBytes(body),
      });
    }
    return NextResponse.json(body);
  } catch (err: any) {
    return NextResponse.json(
      { error: String(err?.message || err || "Failed to load meet") },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  context: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await context.params;
    const { userId: sessionUserId, productScopes } = await getSessionAccess();
    if (!sessionUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!hasProductScope(productScopes, "gymnastics")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const row = await getEventHistoryById(eventId);
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (row.user_id && row.user_id !== sessionUserId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const patch = body?.patch;
    if (!patch || typeof patch !== "object") {
      return NextResponse.json({ error: "patch object is required" }, { status: 400 });
    }

    const currentData = row.data || {};
    const nextData = deepMerge(currentData, patch);
    await updateEventHistoryData(eventId, nextData);

    const incomingTitle = typeof body?.title === "string" ? body.title.trim() : "";
    if (incomingTitle) {
      await updateEventHistoryTitle(eventId, incomingTitle);
    }

    if (row.user_id) {
      invalidateUserHistory(row.user_id);
      invalidateUserDashboard(row.user_id);
    }

    return NextResponse.json({
      ok: true,
      eventId,
      meet_page_json: nextData,
      statuses: computeGymBuilderStatuses(nextData),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: String(err?.message || err || "Failed to update meet") },
      { status: 500 }
    );
  }
}
