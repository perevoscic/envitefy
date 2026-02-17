"use client";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { createEmailTemplate, escapeHtml } from "@/lib/email-template";

export default function PasswordChangedPreviewPage() {
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
  const userName = "Jordan";
  const preheader = "Your password was successfully changed.";
  const greeting = `Hi ${escapeHtml(userName)}`;

  const timestamp = new Date().toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });

  const body = `
    <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6;">${greeting},</p>
    <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6;">
      Your Envitefy password was successfully changed.
    </p>
    <div style="background: #F0FDF4; border-left: 4px solid #10B981; padding: 16px; margin: 20px 0; border-radius: 8px;">
      <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #065F46;">✓ Password Changed</p>
      <p style="margin: 0; font-size: 13px; color: #047857;">
        <strong>Date:</strong> ${escapeHtml(timestamp)}
      </p>
    </div>
    <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6;">
      If you didn't make this change, please contact us immediately to secure your account.
    </p>
  `;

  const footerText =
    "If you didn't change your password, please reset it immediately or contact our support team.";

  const html = createEmailTemplate({
    preheader,
    title: "Password Changed",
    body,
    buttonText: "View My Account",
    buttonUrl: "https://envitefy.com/settings/profile",
    footerText,
  });

  return (
    <div
      className="min-h-[100dvh] bg-gradient-to-br from-[#ffffff] via-[#f6f3ff] to-[#f1ecff] text-[#3f3269] transition-colors"
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
              className="text-[#8c80b6] hover:text-[#43366f] transition-colors"
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
              className="text-2xl font-bold bg-gradient-to-r from-[#6f57c8] to-[#9278e3] bg-clip-text text-transparent"
              suppressHydrationWarning
            >
              ✓ Password Changed Confirmation
            </h1>
          </div>
          <p className="text-sm text-[#8c80b6] ml-9" suppressHydrationWarning>
            Sent when user successfully changes their password via
            /api/user/change-password
          </p>
        </div>

        {/* Email Preview */}
        <section suppressHydrationWarning>
          <div className="bg-white rounded-xl border border-[#ddd5f6] ring-1 ring-[#ede7ff] overflow-hidden shadow-lg">
            <div className="px-6 py-4 border-b border-[#e4def9] bg-[#faf8ff]">
              <h2 className="text-lg font-semibold text-[#43366f]">
                Email Preview
              </h2>
            </div>
            <div className="p-6">
              <iframe
                srcDoc={html}
                className="w-full border border-[#ddd5f6] rounded-lg"
                style={{ height: "650px" }}
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
