"use client";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { createEmailTemplate, escapeHtml } from "@/lib/email-template";

export default function PasswordResetPreviewPage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="p-6">Loading…</div>;
  }
  if (status !== "authenticated") {
    return (
      <div className="p-6">
        <p className="mb-3">You must sign in to view this page.</p>
        <Link href="/">Go home</Link>
      </div>
    );
  }

  const isAdmin = (session?.user as any)?.isAdmin;
  if (!isAdmin) {
    return (
      <div className="p-6">
        <p className="mb-3">Forbidden: Admins only.</p>
        <Link href="/">Go home</Link>
      </div>
    );
  }

  // Generate sample email
  const resetUrl = "https://snapmydate.com/reset?token=abc123xyz456";
  const preheader = "We received a request to reset your password.";

  const body = `
    <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6;">We received a request to reset your password for your Snap My Date account.</p>
    <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6;">Click the button below to create a new password:</p>
  `;

  const footerText = `This link will expire soon for your security. If the button doesn't work, copy and paste this URL into your browser:<br/><br/>
    <a href="${escapeHtml(
      resetUrl
    )}" target="_blank" style="color:#2DD4BF; word-break: break-all;">${escapeHtml(
    resetUrl
  )}</a><br/><br/>
    If you didn't request this password reset, you can safely ignore this email.`;

  const html = createEmailTemplate({
    preheader,
    title: "Reset your password",
    body,
    buttonText: "Reset Your Password",
    buttonUrl: resetUrl,
    footerText,
  });

  return (
    <div
      className="min-h-[100dvh] landing-dark-gradient bg-background text-foreground transition-colors"
      suppressHydrationWarning
    >
      <div
        className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6"
        suppressHydrationWarning
      >
        {/* Header */}
        <div className="flex flex-col gap-2 pt-8" suppressHydrationWarning>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/emails"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
            </Link>
            <h1
              className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent"
              suppressHydrationWarning
            >
              🔐 Password Reset Email
            </h1>
          </div>
          <p
            className="text-sm text-muted-foreground ml-9"
            suppressHydrationWarning
          >
            Sent when user requests a password reset via /forgot
          </p>
        </div>

        {/* Email Preview */}
        <section suppressHydrationWarning>
          <div className="bg-surface rounded-xl ring-1 ring-border/60 overflow-hidden shadow-lg">
            <div className="px-6 py-4 border-b border-border bg-surface/80">
              <h2 className="text-lg font-semibold text-foreground">
                Email Preview
              </h2>
            </div>
            <div className="p-6">
              <iframe
                srcDoc={html}
                className="w-full border border-border rounded-lg"
                style={{ height: "600px" }}
                title="Email Preview"
                suppressHydrationWarning
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
