"use client";

import { useState } from "react";
import Link from "next/link";
import AuthModal from "@/components/auth/AuthModal";

export default function ClientHeroCtas({ isAuthed }: { isAuthed: boolean }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const primaryHref = "/subscription";
  const secondaryHref = isAuthed ? "/about" : "/";

  if (isAuthed) {
    return (
      <div className="mt-8 flex flex-col sm:flex-row gap-4 sm:gap-5 justify-center lg:justify-start">
        <Link href={primaryHref} className="btn btn-primary btn-lg">
          Manage plan
        </Link>
        <Link href={secondaryHref} className="btn btn-outline btn-lg">
          Learn more
        </Link>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="mt-8 flex flex-row gap-4 sm:gap-5 justify-center lg:justify-start">
        <button
          className="btn btn-primary btn-lg"
          onClick={() => {
            setMode("signup");
            setOpen(true);
          }}
        >
          Get started free
        </button>
        <button
          className="btn btn-outline btn-lg"
          onClick={() => {
            setMode("login");
            setOpen(true);
          }}
        >
          Log in
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
