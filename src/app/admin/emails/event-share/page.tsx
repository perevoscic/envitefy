"use client";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { createEmailTemplate, escapeHtml } from "@/lib/email-template";

export default function EventSharePreviewPage() {
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
  const senderName = "John Doe";
  const eventTitle = "Sarah's Birthday Party";
  const acceptUrl =
    "https://envitefy.com/event/sarahs-birthday-party-123?accept=1";
  const signupUrl = "https://envitefy.com/?auth=signup";
  const greeting = "Hi Emily";
  const preheader = `${senderName} shared "${eventTitle}" with you`;

  const body = `
    <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6;">${greeting},</p>
    <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6;">
      <strong>${escapeHtml(
        senderName,
      )}</strong> has shared an event with you on Envitefy.
    </p>
    <div style="background: #F9FAFB; border-left: 4px solid #2DD4BF; padding: 16px; margin: 20px 0; border-radius: 8px;">
      <p style="margin: 0; font-size: 18px; font-weight: 600; color: #2E2C2D;">📅 ${escapeHtml(
        eventTitle,
      )}</p>
    </div>
    <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6;">
      View the event details and add it to your calendar.
    </p>
  `;

  const footerText = `
    Don't have a Envitefy account yet? 
    <a href="${escapeHtml(
      signupUrl,
    )}" target="_blank" style="color:#2DD4BF; text-decoration: none;">Sign up now</a> 
    to manage all your events in one place.
  `;

  const html = createEmailTemplate({
    preheader,
    title: "Event shared with you",
    body,
    buttonText: "View & Accept Event",
    buttonUrl: acceptUrl,
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
              📅 Event Share Email
            </h1>
          </div>
          <p className="text-sm text-[#8c80b6] ml-9" suppressHydrationWarning>
            Sent when a user shares an event with another user via
            /api/events/share
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
                style={{ height: "700px" }}
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
