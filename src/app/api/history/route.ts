import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserIdByEmail, insertEventHistory, listEventHistoryByUser } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session: any = await getServerSession(authOptions as any);
  const sessionUser: any = (session && (session as any).user) || null;
  let userId: string | null = (sessionUser?.id as string | undefined) || null;
  if (!userId && sessionUser?.email) {
    userId = (await getUserIdByEmail(String(sessionUser.email))) || null;
  }
  if (!userId) return NextResponse.json({ items: [] });
  const items = await listEventHistoryByUser(userId, 100);
  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const session: any = await getServerSession(authOptions as any);
  const sessionUser: any = (session && (session as any).user) || null;
  let userId: string | null = (sessionUser?.id as string | undefined) || null;
  if (!userId && sessionUser?.email) {
    userId = (await getUserIdByEmail(String(sessionUser.email))) || null;
  }
  const body = await req.json().catch(() => ({}));
  const title = (body.title as string) || "Event";
  const data = body.data ?? {};
  const row = await insertEventHistory({ userId, title, data });
  return NextResponse.json(row, { status: 201 });
}


