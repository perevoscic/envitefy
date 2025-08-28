import { NextResponse } from "next/server";
import { getValidPasswordResetByToken, markPasswordResetUsed, setPasswordByEmail } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({} as any));
    const token = String(body.token || "").trim();
    const newPassword = String(body.newPassword || "").trim();
    if (!token || !newPassword) return NextResponse.json({ error: "Token and newPassword are required" }, { status: 400 });

    const row = await getValidPasswordResetByToken(token);
    if (!row) return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });

    await setPasswordByEmail({ email: row.email, newPassword });
    await markPasswordResetUsed(row.id);
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


