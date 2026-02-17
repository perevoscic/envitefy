"use client";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function EmailPreviewsPage() {
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

  const emailTypes = [
    {
      title: "Password Reset",
      description: "Email sent when user requests a password reset",
      href: "/admin/emails/password-reset",
      icon: "🔐",
      color: "from-[#cbbcf8] to-[#9d84e9]",
    },
    {
      title: "Password Changed",
      description:
        "Confirmation email sent after password is successfully changed",
      href: "/admin/emails/password-changed",
      icon: "✓",
      color: "from-[#bfaef4] to-[#8669d8]",
    },
    {
      title: "Event Share",
      description: "Email sent when an event is shared with another user",
      href: "/admin/emails/event-share",
      icon: "📅",
      color: "from-[#cab9f7] to-[#8c71de]",
    },
  ];

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
              href="/admin"
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
              className="text-3xl font-bold bg-gradient-to-r from-[#6f57c8] to-[#9278e3] bg-clip-text text-transparent"
              suppressHydrationWarning
            >
              Email Templates
            </h1>
          </div>
          <p className="text-sm text-[#8c80b6] ml-9" suppressHydrationWarning>
            Preview all outgoing email templates
          </p>
        </div>

        {/* Email Type Grid */}
        <section suppressHydrationWarning>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {emailTypes.map((email) => (
              <Link
                key={email.href}
                href={email.href}
                className="group relative overflow-hidden rounded-xl bg-white border border-[#ddd5f6] transition-all shadow-sm cursor-pointer ring-1 ring-[#ede7ff] hover:shadow-md hover:scale-[1.02] hover:ring-[#d7ccf7]"
              >
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-12 h-12 rounded-lg bg-gradient-to-br ${email.color} flex items-center justify-center text-2xl shadow-lg flex-shrink-0`}
                    >
                      {email.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-[#43366f] mb-1 group-hover:text-[#6f57c8] transition-colors">
                        {email.title}
                      </h3>
                      <p className="text-sm text-[#8c80b6]">
                        {email.description}
                      </p>
                    </div>
                    <svg
                      className="w-5 h-5 text-[#9a8fc0] group-hover:text-[#5f49bb] group-hover:translate-x-1 transition-all flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
                <div
                  className={`h-1 bg-gradient-to-r ${email.color} opacity-60 group-hover:opacity-100 transition-opacity`}
                />
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
