import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { changePasswordByEmail, getUserByEmail } from "@/lib/db";
import { sendPasswordChangeConfirmationEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email as string | undefined;
    if (!email) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const body = await req.json().catch(() => ({} as any));
    const newPassword = String(body.newPassword || "");
    const currentPassword = String(body.currentPassword || "");

    if (!currentPassword || !newPassword)
      return NextResponse.json({ error: "Current and new passwords are required" }, { status: 400 });
    if (newPassword.length < 8)
      return NextResponse.json({ error: "New password must be at least 8 characters" }, { status: 400 });

    await changePasswordByEmail({ email, currentPassword, newPassword });
    
    // Send confirmation email
    try {
      const user = await getUserByEmail(email);
      const userName = user ? `${user.first_name || ""} ${user.last_name || ""}`.trim() || null : null;
      await sendPasswordChangeConfirmationEmail({ toEmail: email, userName });
    } catch (emailErr) {
      // Log but don't fail the request if email fails
      console.error("[change-password] Failed to send confirmation email:", emailErr);
    }
    
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    const message = typeof err?.message === "string" ? err.message : "Failed to change password";
    const status = /incorrect/i.test(message) ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}


