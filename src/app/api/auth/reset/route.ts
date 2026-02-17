import { NextResponse } from "next/server";
import { getValidPasswordResetByToken, markPasswordResetUsed, setPasswordByEmail } from "@/lib/db";
import { getEmailFromSupabaseAccessToken, isSupabaseAuthConfigured } from "@/lib/supabase-auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({} as any));
    const token = String(body.token || "").trim();
    const supabaseAccessToken = String(body.supabaseAccessToken || "").trim();
    const newPassword = String(body.newPassword || "").trim();
    if (!newPassword) return NextResponse.json({ error: "newPassword is required" }, { status: 400 });

    if (supabaseAccessToken) {
      if (!isSupabaseAuthConfigured()) {
        return NextResponse.json({ error: "Supabase auth is not configured" }, { status: 400 });
      }
      const email = await getEmailFromSupabaseAccessToken(supabaseAccessToken);
      if (!email) return NextResponse.json({ error: "Invalid or expired reset session" }, { status: 400 });
      await setPasswordByEmail({ email, newPassword });
      return NextResponse.json({ ok: true });
    }

    if (!token) return NextResponse.json({ error: "Token and newPassword are required" }, { status: 400 });

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


