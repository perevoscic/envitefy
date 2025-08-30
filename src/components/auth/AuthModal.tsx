"use client";

import { useEffect } from "react";
import LoginForm from "./LoginForm";
import SignupForm from "./SignupForm";
import Image from "next/image";
import Logo from "@/assets/logo.png";

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
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-transparent backdrop-blur-[3px] backdrop-saturate-125"
        onClick={onClose}
      />
      <div className="relative w-full sm:w-[480px] max-w-[92vw] bg-surface text-foreground border border-border rounded-3xl p-5 sm:p-6 shadow-2xl auth-card-gradient">
        <button
          aria-label="Close"
          onClick={onClose}
          className="!absolute top-2 right-2 sm:top-3 sm:right-3 inline-flex items-center justify-center h-8 w-8 rounded-2xl border border-border text-foreground/80 hover:text-foreground hover:bg-surface/70 z-10"
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
        <div className="pt-2 pb-4 text-center">
          <Image
            src={Logo}
            alt="Snap My Date"
            height={60}
            className="mx-auto rounded"
          />
          {mode === "login" ? (
            <>
              <p className="mt-3 text-base text-foreground/80">
                Welcome back to
              </p>
              <p className="mt-1 text-2xl font-extrabold tracking-tight text-foreground text-shadow-soft">
                <span className="font-pacifico">Snap</span>
                <span> </span>
                <span className="font-montserrat font-semibold">My Date</span>
              </p>
            </>
          ) : (
            <>
              <p className="mt-3 text-base text-foreground/80">Join</p>
              <p className="mt-1 text-2xl font-extrabold tracking-tight text-foreground text-shadow-soft">
                <span className="font-pacifico">Snap</span>
                <span> </span>
                <span className="font-montserrat font-semibold">My Date</span>
              </p>
            </>
          )}
        </div>
        {mode === "login" ? (
          <LoginForm onSuccess={onClose} />
        ) : (
          <SignupForm onSuccess={onClose} />
        )}
      </div>
    </div>
  );
}
