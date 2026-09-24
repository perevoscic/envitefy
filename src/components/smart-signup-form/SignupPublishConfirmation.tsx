"use client";

import { Check, X } from "lucide-react";
import { useEffect, useState } from "react";

export default function SignupPublishConfirmation() {
  const [visible, setVisible] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    // Consume the confirmation so refreshing or sharing this URL does not repeat it.
    const url = new URL(window.location.href);
    url.searchParams.delete("published");
    window.history.replaceState(window.history.state, "", url);
  }, []);

  useEffect(() => {
    if (!visible || hovered || focused) return;
    const timeout = window.setTimeout(() => setVisible(false), 5000);
    return () => window.clearTimeout(timeout);
  }, [visible, hovered, focused]);

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="fixed bottom-24 left-1/2 z-[100] flex w-max max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-3 rounded-2xl border border-emerald-200 bg-white py-2 pl-4 pr-1 text-emerald-950 shadow-lg sm:bottom-6"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
      }}
    >
      <Check className="size-5 shrink-0 text-emerald-600" aria-hidden="true" />
      <p className="text-sm font-medium">Sign-up form published successfully.</p>
      <button
        type="button"
        aria-label="Dismiss publish confirmation"
        className="flex size-11 shrink-0 items-center justify-center rounded-full hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-emerald-700"
        onClick={() => setVisible(false)}
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}
