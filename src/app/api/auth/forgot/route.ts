import { NextResponse } from "next/server";
import { createPasswordResetToken, getUserByEmail } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";
import { absoluteUrl } from "@/lib/absolute-url";
import { createSupabaseRecoveryLink, isSupabaseAuthConfigured } from "@/lib/supabase-auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({} as any));
    const email = String(body.email || "").trim().toLowerCase();
    if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });

    // Always respond 200 to prevent user enumeration; but create a token if user exists
    const user = await getUserByEmail(email).catch(() => null);
    if (user) {
      const fallbackReset = await createPasswordResetToken(email, 30);
      const fallbackResetUrl = new URL(await absoluteUrl("/reset"));
      fallbackResetUrl.searchParams.set("token", fallbackReset.token);
      let resetUrl = fallbackResetUrl.toString();
      if (isSupabaseAuthConfigured()) {
        try {
          const baseResetUrl = await absoluteUrl("/reset");
          resetUrl = await createSupabaseRecoveryLink({
            email,
            baseResetUrl,
          });
        } catch (supabaseErr) {
          try {
            console.error("[auth/forgot] Supabase recovery link generation failed, using local token", {
              email,
              error:
                supabaseErr instanceof Error
                  ? supabaseErr.message
                  : String(supabaseErr),
            });
          } catch {}
        }
      }
      let emailSent = false;
      try {
        await sendPasswordResetEmail({ toEmail: email, resetUrl });
        emailSent = true;
      } catch (err: unknown) {
        // In non-production, include URL and error to aid testing if email fails
        const includeLink = process.env.NODE_ENV !== "production";
        const message = err instanceof Error ? err.message : String(err);
        return NextResponse.json({ ok: true, emailSent: false, ...(includeLink ? { resetUrl, reason: message } : {}) });
      }
      return NextResponse.json({ ok: true, emailSent });
    }
    return NextResponse.json({ ok: true, emailSent: false });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
