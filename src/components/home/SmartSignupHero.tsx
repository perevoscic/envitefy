"use client";

import Link from "next/link";
import { ClipboardCheck, ListChecks, Users } from "lucide-react";

export function SmartSignupHero() {
  return (
    <section className="rounded-[40px] bg-gradient-to-br from-[#E4F3FF] via-white to-[#F7EDFF] p-6 shadow-xl shadow-[#C4D4FF]/60 sm:p-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-4 lg:max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/85 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-[#3975C3] shadow-sm shadow-[#BAD4FF]">
            Smart sign-up forms
          </span>
          <div className="space-y-3">
            <h2 className="text-3xl font-semibold text-[#18243B] sm:text-4xl">
              Slots, RSVPs, and waitlists in one shareable link.
            </h2>
            <p className="text-base leading-relaxed text-[#30435F]">
              Build drag-and-drop sign-up forms for volunteers, team parents, or
              class helpers. Guests reserve slots instantly, and you see
              confirmations roll in without juggling spreadsheets.
            </p>
          </div>
          <Link
            href="/smart-signup-form"
            className="inline-flex w-full items-center justify-center rounded-full bg-[#3975C3] px-6 py-3 text-base font-semibold text-white shadow-lg shadow-[#3975C3]/40 transition hover:-translate-y-0.5 sm:w-auto"
          >
            Open sign-up builder
          </Link>
        </div>
        <div className="grid flex-1 gap-4 rounded-[28px] border border-[#D9E8FF] bg-white/95 p-5 shadow-lg shadow-[#D3E0FF]/60 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: ClipboardCheck,
              label: "Reserve slots",
              copy: "Limit spots per time, auto-move waitlisted guests.",
            },
            {
              icon: Users,
              label: "Track attendance",
              copy: "Capture names, contact info, and custom questions.",
            },
            {
              icon: ListChecks,
              label: "Sync responses",
              copy: "See confirmations inside Envitefy and export anytime.",
            },
            {
              icon: Users,
              label: "Waitlist automation",
              copy: "Promote the next guest when someone cancels.",
            },
            {
              icon: ListChecks,
              label: "Reminders & nudges",
              copy: "Send one-tap reminders to families who haven't replied.",
            },
            {
              icon: ListChecks,
              label: "Printable rosters",
              copy: "Download sign-in sheets and cheat-sheets for the event.",
            },
            {
              icon: ListChecks,
              label: "Co-host sharing",
              copy: "Give helpers access without sharing logins.",
            },
          ].map((feature) => (
            <div key={feature.label} className="space-y-2">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#EEF4FF] text-[#3975C3]">
                <feature.icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-semibold text-[#1D2E48]">
                  {feature.label}
                </p>
                <p className="text-xs text-[#445570]">{feature.copy}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
