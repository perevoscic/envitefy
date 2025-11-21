"use client";

import Link from "next/link";
import { ClipboardCheck } from "lucide-react";

type SmartSignupHeroProps = {
  className?: string;
};

export function SmartSignupHero({ className }: SmartSignupHeroProps) {
  return (
    <section
      className={`rounded-[40px] bg-gradient-to-br from-[#E8F5E9] via-white to-[#F1F8E9] p-6 shadow-xl shadow-[#C8E6C9]/60 sm:p-8 ${
        className || ""
      }`}
    >
      <div className="flex flex-col gap-6">
        <div className="space-y-4">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/85 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-[#4CAF50] shadow-sm shadow-[#C8E6C9]">
            Smart sign-up forms
          </span>
          <div className="flex justify-center">
            <Link
              href="/smart-signup-form"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#4CAF50] px-6 py-3 text-base font-semibold text-white shadow-lg shadow-[#4CAF50]/40 transition hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4CAF50]/50 sm:w-auto"
            >
              <ClipboardCheck className="h-5 w-5" aria-hidden="true" />
              Open sign-up builder
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
