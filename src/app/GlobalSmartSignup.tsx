"use client";

import { useEffect, useState } from "react";
import SmartSignupModal from "@/components/SmartSignupModal";

export default function GlobalSmartSignup() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const openFn = () => {
      try {
        // Ensure Event Create modal is closed before opening this one
        (window as any).__closeCreateEvent?.();
        window.dispatchEvent?.(new Event("closeCreateEvent"));
      } catch {}
      setOpen(true);
    };
    (window as any).__openSmartSignup = openFn;
    (window as any).__closeSmartSignup = () => {
      try {
        setOpen(false);
      } catch {}
    };
    try {
      window.addEventListener("openSmartSignup", openFn as EventListener);
      window.addEventListener("closeSmartSignup", (() =>
        (window as any).__closeSmartSignup?.()) as EventListener);
    } catch {}
    return () => {
      try {
        delete (window as any).__openSmartSignup;
        delete (window as any).__closeSmartSignup;
        window.removeEventListener("openSmartSignup", openFn as EventListener);
        window.removeEventListener("closeSmartSignup", (() =>
          (window as any).__closeSmartSignup?.()) as EventListener);
      } catch {}
    };
  }, []);

  return <SmartSignupModal open={open} onClose={() => setOpen(false)} />;
}
