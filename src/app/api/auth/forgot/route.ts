import { NextResponse } from "next/server";
import { createPasswordResetToken, getUserByEmail } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({} as any));
    const email = String(body.email || "").trim().toLowerCase();
    if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });

    // Always respond 200 to prevent user enumeration; but create a token if user exists
    const user = await getUserByEmail(email).catch(() => null);
    if (user) {
      const reset = await createPasswordResetToken(email, 30);
      const base = process.env.NEXTAUTH_URL || process.env.PUBLIC_BASE_URL || new URL(request.url).origin;
      const resetUrl = new URL("/reset", base);
      resetUrl.searchParams.set("token", reset.token);
      let emailSent = false;
      try {
        await sendPasswordResetEmail({ toEmail: email, resetUrl: resetUrl.toString() });
        emailSent = true;
      } catch {
        // In non-production, include URL to aid testing if email fails
        const includeLink = process.env.NODE_ENV !== "production";
        return NextResponse.json({ ok: true, emailSent: false, ...(includeLink ? { resetUrl: resetUrl.toString() } : {}) });
      }
      return NextResponse.json({ ok: true, emailSent });
    }
    return NextResponse.json({ ok: true, emailSent: false });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


