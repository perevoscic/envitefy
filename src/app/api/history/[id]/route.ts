import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getEventHistoryById,
  updateEventHistoryTitle,
  deleteEventHistoryById,
  getUserIdByEmail,
  updateEventHistoryDataMerge,
} from "@/lib/db";
import { invalidateUserHistory } from "@/lib/history-cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const row = await getEventHistoryById(id);
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(row);
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session: any = await getServerSession(authOptions as any);
  const sessionUser: any = (session && (session as any).user) || null;
  let userId: string | null = (sessionUser?.id as string | undefined) || null;
  if (!userId && sessionUser?.email) {
    userId = (await getUserIdByEmail(String(sessionUser.email))) || null;
  }
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const body = await req.json().catch(() => ({}));
  const existing = await getEventHistoryById(id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (existing.user_id && existing.user_id !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  // Support updating title or merging into data (e.g., category fix)
  if (typeof body.title === "string" && body.title.trim().length > 0) {
    const updated = await updateEventHistoryTitle(id, String(body.title).trim());
    // Invalidate cache for the owner
    if (existing.user_id) {
      invalidateUserHistory(existing.user_id);
    }
    return NextResponse.json(updated);
  }
  if (body && (body.category != null || body.data != null)) {
    const patch: any = {};
    if (body.category != null) patch.category = String(body.category);
    if (body.data && typeof body.data === "object") Object.assign(patch, body.data);
    const updated = await updateEventHistoryDataMerge(id, patch);
    // Invalidate cache for the owner
    if (existing.user_id) {
      invalidateUserHistory(existing.user_id);
    }
    return NextResponse.json(updated);
  }
  return NextResponse.json({ error: "No updatable fields" }, { status: 400 });
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session: any = await getServerSession(authOptions as any);
  const sessionUser: any = (session && (session as any).user) || null;
  let userId: string | null = (sessionUser?.id as string | undefined) || null;
  if (!userId && sessionUser?.email) {
    userId = (await getUserIdByEmail(String(sessionUser.email))) || null;
  }
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const existing = await getEventHistoryById(id);
  if (!existing) return NextResponse.json({ ok: true });
  if (existing.user_id && existing.user_id !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await deleteEventHistoryById(id);
  // Invalidate cache for the owner
  if (existing.user_id) {
    invalidateUserHistory(existing.user_id);
  }
  return NextResponse.json({ ok: true });
}

