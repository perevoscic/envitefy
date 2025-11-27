import { NextResponse } from "next/server";
import { getEventHistoryById } from "@/lib/db";
import {
  createEventAccessCookieValue,
  EVENT_ACCESS_COOKIE_MAX_AGE_MS,
  getEventAccessCookieName,
  verifyAccessCode,
} from "@/lib/event-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const body = await req.json().catch(() => ({}));
  const codeRaw = typeof body.code === "string" ? body.code.trim() : "";
  if (!codeRaw) {
    return NextResponse.json({ error: "Enter the access code" }, { status: 400 });
  }

  const row = await getEventHistoryById(id);
  if (!row) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }
  const accessControl = (row.data as any)?.accessControl;
  if (!accessControl || !accessControl.passcodeHash) {
    return NextResponse.json(
      { error: "This event is not using an access code" },
      { status: 400 }
    );
  }

  const ok = await verifyAccessCode(codeRaw, accessControl.passcodeHash);
  if (!ok) {
    return NextResponse.json({ error: "That code does not match" }, { status: 401 });
  }

  const cookieName = getEventAccessCookieName(row.id);
  const cookieValue = createEventAccessCookieValue(
    row.id,
    accessControl.passcodeHash
  );

  const res = NextResponse.json({ ok: true });
  res.cookies.set(cookieName, cookieValue, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: Math.floor(EVENT_ACCESS_COOKIE_MAX_AGE_MS / 1000),
  });
  return res;
}
