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
        onClick={() => {
          setMode("signup");
          setOpen(true);
        }}
        className="btn btn-primary btn-lg"
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
