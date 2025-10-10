"use client";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { createEmailTemplate, escapeHtml } from "@/lib/email-template";

export default function GiftCodePreviewPage() {
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
  const recipientName = "Alex";
  const giftCode = "SNAP2025GIFT";
  const months = 3;
  const message = "Happy Birthday! Enjoy 3 months of Snap My Date on me! 🎂";
  const preheader = `You've been gifted ${months} months of Snap My Date.`;
  const greeting = `Hi ${escapeHtml(recipientName)}`;

  const body = `
    <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6;">${greeting},</p>
    <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6;">
      🎁 Exciting news! Someone has gifted you <strong>${months} months</strong> of Snap My Date premium access!
    </p>
    <div style="background: #F9FAFB; border-left: 4px solid #2DD4BF; padding: 16px; margin: 20px 0; border-radius: 8px;">
      <p style="margin: 0 0 4px 0; font-size: 13px; font-weight: 600; color: #737373;">💌 Message from sender:</p>
      <p style="margin: 0; font-size: 15px; color: #4E4E50; font-style: italic;">${escapeHtml(
        message
      )}</p>
    </div>
    <div style="background: #FFFBEB; border: 1px solid #FCD34D; padding: 16px; margin: 20px 0; border-radius: 8px; text-align: center;">
      <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 600; color: #92400E;">Your Gift Code:</p>
      <p style="margin: 0; font-size: 20px; font-weight: 700; font-family: 'Courier New', monospace; color: #78350F; letter-spacing: 2px;">
        ${giftCode}
      </p>
    </div>
    <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6;">
      Click the button below to redeem your gift and start enjoying premium features.
    </p>
  `;

  const footerText = `Having trouble? Copy and paste this code on the subscription page: <strong>${giftCode}</strong>`;

  const html = createEmailTemplate({
    preheader,
    title: "You've received a gift",
    body,
    buttonText: "Redeem My Gift",
    buttonUrl: "https://snapmydate.com/subscription",
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
              className="text-2xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent"
              suppressHydrationWarning
            >
              🎁 Gift Code Email
            </h1>
          </div>
          <p
            className="text-sm text-muted-foreground ml-9"
            suppressHydrationWarning
          >
            Sent when recipient receives a gift code to redeem (new user or user
            without account)
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
                style={{ height: "800px" }}
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
