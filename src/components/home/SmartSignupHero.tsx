"use client";

import Link from "next/link";
import { ClipboardCheck, ListChecks, Users } from "lucide-react";

type SmartSignupHeroProps = {
  className?: string;
};

export function SmartSignupHero({ className }: SmartSignupHeroProps) {
  return (
    <section
      className={`rounded-[40px] bg-gradient-to-br from-[#E4F3FF] via-white to-[#F7EDFF] p-6 shadow-xl shadow-[#C4D4FF]/60 sm:p-8 ${
        className || ""
      }`}
    >
      <div className="flex flex-col gap-6">
        <div className="space-y-4">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/85 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-[#3975C3] shadow-sm shadow-[#BAD4FF]">
            Smart sign-up forms
          </span>
          <br />
          <Link
            href="/smart-signup-form"
            className="inline-flex w-full items-center justify-center rounded-full bg-[#3975C3] px-6 py-3 text-base font-semibold text-white shadow-lg shadow-[#3975C3]/40 transition hover:-translate-y-0.5 sm:w-auto"
          >
            Open sign-up builder
          </Link>
        </div>
      </div>
    </section>
  );
}
