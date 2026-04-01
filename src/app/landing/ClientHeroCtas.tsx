"use client";

import Link from "next/link";
import { useState } from "react";
import AuthModal from "@/components/auth/AuthModal";

export default function ClientHeroCtas({ isAuthed }: { isAuthed: boolean }) {
  const [open, setOpen] = useState(false);
  const primaryHref = "/";
  const secondaryHref = isAuthed ? "/about" : "/";

  if (isAuthed) {
    return (
      <div className="mt-8 flex flex-col sm:flex-row gap-4 sm:gap-5 justify-center lg:justify-start">
        <Link href={primaryHref} className="btn btn-primary btn-lg">
          Open Envitefy
        </Link>
        <Link href={secondaryHref} className="btn btn-outline btn-lg">
          Learn more
        </Link>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="mt-8 flex flex-col sm:flex-row gap-4 sm:gap-5 justify-center lg:justify-start">
        <Link href="/snap" className="btn btn-primary btn-lg w-full sm:w-auto">
          Create a Snap account
        </Link>
        <Link
          href="/gymnastics"
          className="btn btn-outline btn-lg w-full sm:w-auto"
        >
          Gymnastics account
        </Link>
        <button
          className="btn btn-outline btn-lg w-full sm:w-auto !bg-surface/60 hover:!bg-surface/80 shadow-lg hover:shadow-xl transition-all"
          onClick={() => setOpen(true)}
        >
          Log in
        </button>
      </div>
      <AuthModal
        open={open}
        mode="login"
        onClose={() => setOpen(false)}
        allowSignupSwitch={false}
      />
    </div>
  );
}
