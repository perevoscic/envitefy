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
      color: "from-blue-500 to-cyan-500",
    },
    {
      title: "Password Changed",
      description:
        "Confirmation email sent after password is successfully changed",
      href: "/admin/emails/password-changed",
      icon: "✓",
      color: "from-green-500 to-emerald-500",
    },
    {
      title: "Subscription Change",
      description:
        "Email sent when upgrading from trial or switching plans (monthly/yearly)",
      href: "/admin/emails/subscription-change",
      icon: "💳",
      color: "from-indigo-500 to-purple-500",
    },
    {
      title: "Event Share",
      description: "Email sent when an event is shared with another user",
      href: "/admin/emails/event-share",
      icon: "📅",
      color: "from-emerald-500 to-teal-500",
    },
    {
      title: "Gift - Code",
      description: "Email sent when user receives a gift code to redeem",
      href: "/admin/emails/gift-code",
      icon: "🎁",
      color: "from-purple-500 to-pink-500",
    },
    {
      title: "Gift - Auto-Redeemed",
      description:
        "Email sent when gift is automatically applied to existing user",
      href: "/admin/emails/gift-auto",
      icon: "🎉",
      color: "from-amber-500 to-yellow-500",
    },
  ];

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
              href="/admin"
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
              className="text-3xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent"
              suppressHydrationWarning
            >
              Email Templates
            </h1>
          </div>
          <p
            className="text-sm text-muted-foreground ml-9"
            suppressHydrationWarning
          >
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
                className="group relative overflow-hidden rounded-xl bg-surface transition-all shadow-sm cursor-pointer ring-1 ring-border/50 hover:shadow-md hover:scale-[1.02] hover:ring-border/80"
              >
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-12 h-12 rounded-lg bg-gradient-to-br ${email.color} flex items-center justify-center text-2xl shadow-lg flex-shrink-0`}
                    >
                      {email.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-foreground mb-1 group-hover:text-indigo-500 transition-colors">
                        {email.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {email.description}
                      </p>
                    </div>
                    <svg
                      className="w-5 h-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all flex-shrink-0"
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
