"use client";

import { useState } from "react";
import AuthModal from "@/components/auth/AuthModal";

export default function CreateShareCta() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("signup");

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center rounded-2xl px-6 py-3 text-base font-semibold bg-primary text-on-primary hover:opacity-95"
      >
        Create your first event
      </button>
      <AuthModal
        open={open}
        mode={mode}
        onClose={() => setOpen(false)}
        onModeChange={setMode}
      />
    </>
  );
}
