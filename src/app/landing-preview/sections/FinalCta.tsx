"use client";

import Link from "next/link";
import { ArrowRight, CalendarHeart, Upload } from "lucide-react";
import { useState } from "react";
import AuthModal from "@/components/auth/AuthModal";

export default function FinalCta() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("signup");

  return (
    <section
      id="final-cta"
      className="px-4 pb-24 pt-20 sm:px-6 lg:px-8 lg:pb-28 lg:pt-24"
      aria-labelledby="final-cta-heading"
    >
      <div className="mx-auto max-w-5xl rounded-[2.4rem] border border-[#d8e3f0] bg-[linear-gradient(135deg,#eff8f6_0%,#ffffff_48%,#fff7ea_100%)] p-8 shadow-[0_24px_70px_rgba(15,23,42,0.08)] sm:p-10 lg:p-12">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.26em] text-[#4d8fb4]">
            Final CTA
          </p>
          <h2
            id="final-cta-heading"
            className="mt-4 font-['Poppins'] text-4xl font-semibold tracking-[-0.04em] text-[#0b2035] sm:text-5xl"
          >
            Create your first meet event
          </h2>
          <p className="mt-5 text-lg leading-8 text-[#587088]">
            Upload your meet info and let Envitefy build the page for you. The
            meet story stays primary here, with birthday and wedding uploads
            available as a secondary path.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <button
              type="button"
              onClick={() => {
                setAuthMode("signup");
                setAuthModalOpen(true);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#102a43] px-6 py-4 text-sm font-semibold text-white shadow-[0_16px_34px_rgba(16,42,67,0.2)] transition hover:-translate-y-0.5 hover:bg-[#0b2237]"
            >
              <Upload className="h-4 w-4" />
              Upload Meet
            </button>
            <Link
              href="#other-uploads"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-[#c7d6e6] bg-white px-6 py-4 text-sm font-semibold text-[#16324d] transition hover:-translate-y-0.5 hover:border-[#95b6d3]"
            >
              <CalendarHeart className="h-4 w-4" />
              Try Birthday or Wedding Uploads
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      <AuthModal
        open={authModalOpen}
        mode={authMode}
        onClose={() => setAuthModalOpen(false)}
        onModeChange={setAuthMode}
      />
    </section>
  );
}
