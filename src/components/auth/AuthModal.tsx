"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { useSidebar } from "@/app/sidebar-context";
import LoginForm from "./LoginForm";
import SignupForm from "./SignupForm";

export type AuthModalProps = {
  open: boolean;
  mode: "login" | "signup";
  onClose: () => void;
  onModeChange?: (m: "login" | "signup") => void;
};

export default function AuthModal({
  open,
  mode,
  onClose,
  onModeChange,
}: AuthModalProps) {
  const isLogin = mode === "login";
  const heroKicker = isLogin ? "Welcome back" : "You're invited";
  const heroBlurb = isLogin
    ? "Pick up right where you left off—your saved invitations, RSVP dashboards, and calendars are waiting."
    : "Create a planning home that feels as bespoke as the new wedding templates, from invites to guest logistics.";
  const { setIsCollapsed } = useSidebar();
  // Broadcast global open/close so other components (e.g., background slider)
  // can react when any auth modal is shown anywhere on the page.
  const openRef = useRef(open);
  const didMountRef = useRef(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!didMountRef.current) {
      // Initial mount: only dispatch if starting open
      didMountRef.current = true;
      if (open) {
        try {
          window.dispatchEvent(new Event("smd-auth-modal-open"));
        } catch {}
      }
      openRef.current = open;
      return;
    }
    // Subsequent updates: dispatch only on actual transitions
    if (open !== openRef.current) {
      try {
        window.dispatchEvent(
          new Event(open ? "smd-auth-modal-open" : "smd-auth-modal-close")
        );
      } catch {}
      openRef.current = open;
    }
  }, [open]);

  useEffect(() => {
    return () => {
      if (typeof window === "undefined") return;
      if (openRef.current) {
        try {
          window.dispatchEvent(new Event("smd-auth-modal-close"));
        } catch {}
      }
    };
  }, []);

  useEffect(() => {
    if (open) {
      // Collapse the left sidebar when the auth modal opens
      try {
        setIsCollapsed(true);
      } catch {}
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [open, setIsCollapsed]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[rgba(24,14,10,0.45)] backdrop-blur-[6px] backdrop-saturate-150"
        onClick={onClose}
      />
      {/* Wrapper creates a stacking context for a top-most close button */}
      <div className="relative w-full sm:w-[480px] max-w-[92vw]">
        {/* Card */}
        <div className="relative bg-surface/95 text-foreground rounded-3xl p-6 sm:p-8 wedding-glow-card auth-card-gradient">
          <div className="flex flex-col items-center gap-3 pb-7 text-center">
            <p className="wedding-kicker">{heroKicker}</p>
            <div className="wedding-brand-lockup">
              <Image
                src="/E.png"
                alt="Envitefy emblem"
                width={48}
                height={48}
                quality={100}
                unoptimized
              />
              <span className="wedding-brand-mark">nvitefy</span>
            </div>
            <p className="text-sm text-foreground/70 max-w-sm">{heroBlurb}</p>
          </div>
          {isLogin ? (
            <LoginForm
              onSuccess={onClose}
              onSwitchMode={() => onModeChange?.("signup")}
            />
          ) : (
            <SignupForm
              onSuccess={onClose}
              onSwitchMode={() => onModeChange?.("login")}
            />
          )}
        </div>
        {/* Close button sits above the card and avoids gradient/pseudo overlays */}
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute top-2 right-2 sm:top-3 sm:right-3 z-20 flex h-11 w-11 items-center justify-center wedding-icon-button text-foreground/70 hover:text-foreground"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
            aria-hidden="true"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  );
}
