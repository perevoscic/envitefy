"use client";

import { useEffect, useRef } from "react";
import { useSidebar } from "@/app/sidebar-context";
import EnvitefyWordmark from "@/components/branding/EnvitefyWordmark";
import type { SignupIntent } from "@/lib/signup-intent";
import LoginForm from "./LoginForm";
import SignupForm from "./SignupForm";

export type AuthModalProps = {
  open: boolean;
  description?: string;
  allowGoogleAuth?: boolean;
  onAuthenticated?: () => Promise<void>;
  mode: "login" | "signup";
  onClose: () => void;
  onModeChange?: (m: "login" | "signup") => void;
  successRedirectUrl?: string;
  signupSource?: "snap" | "gymnastics";
  signupIntent?: SignupIntent;
  allowSignupSwitch?: boolean;
};

export default function AuthModal({
  open,
  description,
  allowGoogleAuth = true,
  onAuthenticated,
  mode,
  onClose,
  onModeChange,
  successRedirectUrl = "/",
  signupSource,
  signupIntent,
  allowSignupSwitch = true,
}: AuthModalProps) {
  const isLogin = mode === "login";
  const heroKicker = isLogin ? "Welcome back" : "You're invited";
  const { setIsCollapsed } = useSidebar();
  // Broadcast global open/close so other components (e.g., background slider)
  // can react when any auth modal is shown anywhere on the page.
  const openRef = useRef(open);
  const didMountRef = useRef(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const controls = () => Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), a[href], select, textarea, [tabindex="0"]') || []).filter((element) => !element.hidden && element.getClientRects().length > 0);
    controls()[0]?.focus();
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); closeRef.current(); }
      if (event.key !== "Tab") return;
      const items = controls();
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener("keydown", keyboard);
    return () => { document.removeEventListener("keydown", keyboard); previous?.focus(); };
  }, [open]);
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
        window.dispatchEvent(new Event(open ? "smd-auth-modal-open" : "smd-auth-modal-close"));
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
      // Only force-collapse compact layouts; on desktop the sidebar should
      // remain expanded by default after auth succeeds.
      try {
        const shouldCollapseForAuth =
          typeof window !== "undefined" &&
          typeof window.matchMedia === "function" &&
          window.matchMedia("(max-width: 1023px), (hover: none), (pointer: coarse)").matches;
        if (shouldCollapseForAuth) {
          setIsCollapsed(true);
        }
      } catch {}
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [open, setIsCollapsed]);

  if (!open) return null;

  return (
    <div ref={dialogRef} role="dialog" aria-modal="true" aria-label={isLogin ? "Log in" : "Create an account"} className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto py-6 auth-modal">
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
            <div>
              <EnvitefyWordmark
                scaled={false}
                className="text-[3.25rem] leading-none sm:text-[3.75rem]"
              />
            </div>
          </div>
          {description && <p className="mb-5 text-center text-sm text-muted-foreground">{description}</p>}
          {isLogin ? (
            <LoginForm
              onSuccess={onClose}
              onAuthenticated={onAuthenticated}
              allowGoogleAuth={allowGoogleAuth}
              successRedirectUrl={successRedirectUrl}
              onSwitchMode={allowSignupSwitch && onModeChange ? () => onModeChange("signup") : undefined}
            />
          ) : (
            <SignupForm
              onSuccess={onClose}
              onAuthenticated={onAuthenticated}
              allowGoogleAuth={allowGoogleAuth}
              onSwitchMode={onModeChange ? () => onModeChange("login") : undefined}
              successRedirectUrl={successRedirectUrl}
              signupSource={signupSource}
              signupIntent={signupIntent}
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
