import { CheckCircle2, Code2, KeyRound, Mail, Newspaper, Send, Share2 } from "lucide-react";
import Link from "next/link";
import { AdminPageHeader, AdminPanel, AdminStatusBadge } from "@/components/admin/AdminPrimitives";
import AdminEmailPromptGenerator from "@/components/admin/AdminEmailPromptGenerator";
import EmailCampaignsClient from "@/components/admin/EmailCampaignsClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const emailTools = [
  {
    title: "Campaigns",
    description: "Create, preview, send, and review bulk email campaigns.",
    href: "/admin/emails?tab=campaigns",
    icon: Send,
    badge: "Workflow",
  },
  {
    title: "HTML Editor",
    description: "Paste an HTML document, preview live, and send it as a campaign.",
    href: "/admin/emails/editor",
    icon: Code2,
    badge: "Editor",
  },
  {
    title: "Relaunch Magazine",
    description: "Preview the magazine-style relaunch announcement.",
    href: "/admin/emails/magazine",
    icon: Newspaper,
    badge: "Template",
  },
  {
    title: "Password Reset",
    description: "Preview the reset email sent from the auth flow.",
    href: "/admin/emails/password-reset",
    icon: KeyRound,
    badge: "Template",
  },
  {
    title: "Password Changed",
    description: "Preview the post-change confirmation email.",
    href: "/admin/emails/password-changed",
    icon: CheckCircle2,
    badge: "Template",
  },
  {
    title: "Event Share",
    description: "Preview the email sent when an event is shared.",
    href: "/admin/emails/event-share",
    icon: Share2,
    badge: "Template",
  },
];

type EmailAdminPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EmailAdminPage({ searchParams }: EmailAdminPageProps) {
  const params = searchParams ? await searchParams : {};
  const rawTab = params.tab;
  const tab = Array.isArray(rawTab) ? rawTab[0] : rawTab;
  const rawCompose = params.compose;
  const compose = Array.isArray(rawCompose) ? rawCompose[0] : rawCompose;

  if (tab === "campaigns") {
    return <EmailCampaignsClient initialShowComposer={compose === "1"} />;
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Messaging"
        title="Emails"
        description="Prompt-generated campaign drafts, send workflows, and transactional email previews live here instead of the executive dashboard."
      />

      <AdminEmailPromptGenerator />

      <AdminPanel title="Email Workflows">
        <div className="grid gap-3 md:grid-cols-2">
          {emailTools.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link
                key={tool.href}
                href={tool.href}
                className="group rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-violet-300 hover:shadow-md"
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-violet-50 text-violet-700 ring-1 ring-violet-100">
                    <Icon size={20} strokeWidth={1.8} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-3">
                      <span className="text-base font-semibold text-slate-950 group-hover:text-violet-800">
                        {tool.title}
                      </span>
                      <AdminStatusBadge tone={tool.badge === "Workflow" ? "violet" : "neutral"}>
                        {tool.badge}
                      </AdminStatusBadge>
                    </span>
                    <span className="mt-1 block text-sm leading-5 text-slate-600">
                      {tool.description}
                    </span>
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </AdminPanel>

      <AdminPanel title="Operational Note">
        <div className="flex items-start gap-3 text-sm text-slate-700">
          <Mail className="mt-0.5 shrink-0 text-violet-700" size={18} strokeWidth={1.8} />
          <p>
            Campaign history remains backed by{" "}
            <code className="rounded bg-slate-100 px-1">email_campaigns</code>. Transactional
            template pages are previews and do not send mail.
          </p>
        </div>
      </AdminPanel>
    </div>
  );
}
