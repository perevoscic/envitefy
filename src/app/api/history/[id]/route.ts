import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getEventHistoryById,
  updateEventHistoryTitle,
  deleteEventHistoryById,
  getUserIdByEmail,
} from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  const row = await getEventHistoryById(id);
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(row);
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session: any = await getServerSession(authOptions as any);
  const sessionUser: any = (session && (session as any).user) || null;
  let userId: string | null = (sessionUser?.id as string | undefined) || null;
  if (!userId && sessionUser?.email) {
    userId = (await getUserIdByEmail(String(sessionUser.email))) || null;
  }
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = params.id;
  const body = await req.json().catch(() => ({}));
  const title = (body.title as string) || "";
  if (!title || title.trim().length === 0) {
    return NextResponse.json({ error: "Title required" }, { status: 400 });
  }
  const existing = await getEventHistoryById(id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (existing.user_id && existing.user_id !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const updated = await updateEventHistoryTitle(id, title.trim());
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session: any = await getServerSession(authOptions as any);
  const sessionUser: any = (session && (session as any).user) || null;
  let userId: string | null = (sessionUser?.id as string | undefined) || null;
  if (!userId && sessionUser?.email) {
    userId = (await getUserIdByEmail(String(sessionUser.email))) || null;
  }
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = params.id;
  const existing = await getEventHistoryById(id);
  if (!existing) return NextResponse.json({ ok: true });
  if (existing.user_id && existing.user_id !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await deleteEventHistoryById(id);
  return NextResponse.json({ ok: true });
}


