"use client";

import { useState } from "react";
import Link from "next/link";
import AuthModal from "@/components/auth/AuthModal";

export default function ClientHeroCtas({ isAuthed }: { isAuthed: boolean }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const primaryHref = "/subscription";
  const secondaryHref = isAuthed ? "/about" : "/landing";

  if (isAuthed) {
    return (
      <div className="mt-8 flex flex-col sm:flex-row gap-4 sm:gap-5 justify-center lg:justify-start">
        <Link
          href={primaryHref}
          className="inline-flex items-center justify-center rounded-2xl px-7 py-3.5 text-lg font-semibold bg-primary hover:opacity-95 active:opacity-90 text-on-primary shadow-lg shadow-teal-500/25"
        >
          Manage plan
        </Link>
        <Link
          href={secondaryHref}
          className="inline-flex items-center justify-center rounded-2xl px-7 py-3.5 text-lg font-semibold border border-border text-foreground/80 hover:text-foreground hover:bg-surface/70"
        >
          Learn more
        </Link>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="mt-8 flex flex-col sm:flex-row gap-4 sm:gap-5 justify-center lg:justify-start">
        <button
          className="inline-flex items-center justify-center rounded-2xl px-7 py-3.5 text-lg font-semibold bg-primary hover:opacity-95 active:opacity-90 text-on-primary shadow-lg shadow-teal-500/25"
          onClick={() => {
            setMode("signup");
            setOpen(true);
          }}
        >
          Get started free
        </button>
        <button
          className="inline-flex items-center justify-center rounded-2xl px-7 py-3.5 text-lg font-semibold border border-border text-foreground/80 hover:text-foreground hover:bg-surface/70"
          onClick={() => {
            setMode("login");
            setOpen(true);
          }}
        >
          Sign in
        </button>
      </div>
      <AuthModal
        open={open}
        mode={mode}
        onClose={() => setOpen(false)}
        onModeChange={setMode}
      />
    </div>
  );
}
