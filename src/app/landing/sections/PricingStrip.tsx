"use client";
import { useState } from "react";
import Link from "next/link";
import AuthModal from "@/components/auth/AuthModal";

export default function PricingStrip({ isAuthed }: { isAuthed: boolean }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const primaryHref = "/";

  return (
    <section className="w-full">
      <div className="max-w-5xl mx-auto px-6 pb-16">
        <div className="relative rounded-[40px] border border-border/60 bg-white/70 p-1 shadow-[0_35px_80px_rgba(43,27,22,0.1)]">
          <div className="wedding-glow-card rounded-[34px] bg-gradient-to-br from-[#f9efe6] via-[#f4dbc5] to-[#e5c7af] px-8 py-10 text-center">
            <div className="absolute inset-0 pointer-events-none rounded-[34px] border border-white/40" />
            <p className="wedding-kicker text-secondary/75">Plan with grace</p>
            <h3
              className="mt-3 text-3xl sm:text-4xl font-semibold text-foreground"
              style={{
                fontFamily: 'var(--font-playfair), "Times New Roman", serif',
              }}
            >
              Ready to plan the easy way?
            </h3>
            <p className="mt-4 text-base sm:text-lg text-foreground/75 max-w-2xl mx-auto">
              Envitefy turns flyers, text threads, and schedules into
              shareable calendar plans—complete with RSVP tracking, registries,
              and directions. Start in seconds, no credit card needed.
            </p>
            <div className="mt-8 flex justify-center">
              {isAuthed ? (
                <Link
                  href={primaryHref}
                  scroll={false}
                  className="btn btn-primary btn-lg"
                >
                  Open Envitefy
                </Link>
              ) : (
                <button
                  onClick={() => {
                    setMode("signup");
                    setOpen(true);
                  }}
                  className="btn btn-primary btn-lg"
                >
                  Get started free
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      <AuthModal
        open={open}
        mode={mode}
        onClose={() => setOpen(false)}
        onModeChange={setMode}
      />
    </section>
  );
}
