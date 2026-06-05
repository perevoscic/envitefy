import { NextResponse } from "next/server";
import { createPasswordResetToken, getUserByEmail } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";
import { absoluteUrl } from "@/lib/absolute-url";
import { buildPublicPasswordResetUrl } from "@/lib/auth-reset-url";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch((): null => null);
    const email =
      typeof body === "object" && body !== null && "email" in body
        ? String(body.email || "")
            .trim()
            .toLowerCase()
        : "";
    if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });

    // Always respond 200 to prevent user enumeration; but create a token if user exists
    const user = await getUserByEmail(email).catch(() => null);
    if (user) {
      const reset = await createPasswordResetToken(email, 30);
      const resetUrlBuilder = new URL(buildPublicPasswordResetUrl(await absoluteUrl("/reset")));
      resetUrlBuilder.searchParams.set("token", reset.token);
      const resetUrl = resetUrlBuilder.toString();
      let emailSent = false;
      try {
        await sendPasswordResetEmail({ toEmail: email, resetUrl });
        emailSent = true;
      } catch (err: unknown) {
        // In non-production, include URL and error to aid testing if email fails
        const includeLink = process.env.NODE_ENV !== "production";
        const message = err instanceof Error ? err.message : String(err);
        return NextResponse.json({
          ok: true,
          emailSent: false,
          ...(includeLink ? { resetUrl, reason: message } : {}),
        });
      }
      return NextResponse.json({ ok: true, emailSent });
    }
    return NextResponse.json({ ok: true, emailSent: false });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
