import { NextResponse } from "next/server";
import { createPasswordResetToken, getUserByEmail } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";
import { absoluteUrl } from "@/lib/absolute-url";

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
      const resetUrl = new URL(await absoluteUrl("/reset"));
      resetUrl.searchParams.set("token", reset.token);
      let emailSent = false;
      try {
        await sendPasswordResetEmail({ toEmail: email, resetUrl: resetUrl.toString() });
        emailSent = true;
      } catch (err: unknown) {
        // In non-production, include URL and error to aid testing if email fails
        const includeLink = process.env.NODE_ENV !== "production";
        const message = err instanceof Error ? err.message : String(err);
        return NextResponse.json({ ok: true, emailSent: false, ...(includeLink ? { resetUrl: resetUrl.toString(), reason: message } : {}) });
      }
      return NextResponse.json({ ok: true, emailSent });
    }
    return NextResponse.json({ ok: true, emailSent: false });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
