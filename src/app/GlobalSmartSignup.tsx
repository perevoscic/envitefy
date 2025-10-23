"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function GlobalSmartSignup() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const openFn = () => {
      try {
        (window as any).__closeCreateEvent?.();
        window.dispatchEvent?.(new Event("closeCreateEvent"));
      } catch {}
      router.push("/smart-signup-form");
    };
    (window as any).__openSmartSignup = openFn;
    (window as any).__closeSmartSignup = () => {};
    try {
      window.addEventListener("openSmartSignup", openFn as EventListener);
    } catch {}
    return () => {
      try {
        delete (window as any).__openSmartSignup;
        delete (window as any).__closeSmartSignup;
        window.removeEventListener("openSmartSignup", openFn as EventListener);
      } catch {}
    };
  }, [router]);

  return null;
}
