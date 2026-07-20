"use client";

import Link from "next/link";
import { Code2, Newspaper, Send, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export type AdminEmailsTab = "generator" | "campaigns" | "templates";

const tabs: Array<{
  id: AdminEmailsTab;
  label: string;
  href: string;
  description: string;
  icon: typeof Sparkles;
}> = [
  {
    id: "generator",
    label: "AI Generator",
    href: "/admin/emails",
    description: "Prompt and draft",
    icon: Sparkles,
  },
  {
    id: "campaigns",
    label: "Campaigns",
    href: "/admin/emails?tab=campaigns",
    description: "Compose and send",
    icon: Send,
  },
  {
    id: "templates",
    label: "Templates",
    href: "/admin/emails?tab=templates",
    description: "Previews and editor",
    icon: Newspaper,
  },
];

const quickLinks = [
  {
    label: "HTML Editor",
    href: "/admin/emails/editor",
    icon: Code2,
  },
];

export default function AdminEmailsSubnav({ active }: { active: AdminEmailsTab }) {
  return (
    <div className="space-y-3">
      <nav
        aria-label="Email admin sections"
        className="flex flex-wrap gap-2 rounded-lg border border-slate-200 bg-slate-50 p-1.5"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.id === active;
          return (
            <Link
              key={tab.id}
              href={tab.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-md px-3 text-sm font-semibold transition sm:flex-none sm:justify-start",
                isActive
                  ? "bg-white text-violet-800 shadow-sm ring-1 ring-violet-200"
                  : "text-slate-600 hover:bg-white/70 hover:text-slate-950",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" strokeWidth={1.8} />
              <span className="flex flex-col items-start leading-tight">
                <span>{tab.label}</span>
                <span className="hidden text-[11px] font-medium text-slate-500 sm:block">
                  {tab.description}
                </span>
              </span>
            </Link>
          );
        })}
      </nav>

      {active === "templates" ? (
        <div className="flex flex-wrap gap-2">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="inline-flex min-h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-violet-300 hover:text-violet-800"
              >
                <Icon className="h-3.5 w-3.5" strokeWidth={1.8} />
                {link.label}
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
