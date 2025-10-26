"use client";

import { useEffect, useRef } from "react";
import { useSidebar } from "@/app/sidebar-context";
import LoginForm from "./LoginForm";
import SignupForm from "./SignupForm";
import Image from "next/image";
import Logo from "@/assets/Logo.png";

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
        className="absolute inset-0 bg-transparent backdrop-blur-[3px] backdrop-saturate-125"
        onClick={onClose}
      />
      {/* Wrapper creates a stacking context for a top-most close button */}
      <div className="relative w-full sm:w-[480px] max-w-[92vw]">
        {/* Card */}
        <div className="relative bg-surface text-foreground border border-border rounded-3xl p-5 sm:p-6 shadow-2xl auth-card-gradient">
          <div className="pt-2 pb-4 text-center">
            <Image
              src={Logo}
              alt="envitefy.com"
              height={60}
              className="mx-auto rounded"
            />
            {mode === "login" ? (
              <>
                <p className="mt-3 text-base text-foreground/80">
                  Welcome back to
                </p>
                <p className="mt-1 text-2xl tracking-tight text-foreground">
                  <span className="font-pacifico">
                    <span className="text-[#0e7bc4]">env</span>
                    <span className="text-[#ee3c2b]">i</span>
                    <span className="text-[#0e7bc4]">tefy.com</span>
                  </span>
                </p>
              </>
            ) : (
              <>
                <p className="mt-3 text-base text-foreground/80">Join</p>
                <p className="mt-1 text-2xl tracking-tight text-foreground">
                  <span className="font-pacifico">
                    <span className="text-[#0e7bc4]">env</span>
                    <span className="text-[#ee3c2b]">i</span>
                    <span className="text-[#0e7bc4]">tefy.com</span>
                  </span>
                </p>
              </>
            )}
          </div>
          {mode === "login" ? (
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
          className="absolute top-2 right-2 sm:top-3 sm:right-3 inline-flex items-center justify-center h-10 w-10 rounded-2xl border border-border bg-surface/70 text-foreground/80 hover:text-foreground hover:bg-surface/90 shadow-sm z-20 pointer-events-auto touch-manipulation"
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
