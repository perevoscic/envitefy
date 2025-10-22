"use client";

import Link from "next/link";
import { useState } from "react";
import AuthModal from "@/components/auth/AuthModal";

export default function ReadOnlyBanner() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");

  const handleSignIn = () => {
    setAuthMode("login");
    setAuthModalOpen(true);
  };

  const handleSignUp = () => {
    setAuthMode("signup");
    setAuthModalOpen(true);
  };

  return (
    <>
      <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20 px-4 py-3">
        <div className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <p className="text-sm text-blue-800 dark:text-blue-200">
            You are viewing this event in read-only mode.{" "}
            <button
              onClick={handleSignIn}
              className="underline hover:no-underline font-medium"
            >
              Sign in
            </button>{" "}
            or{" "}
            <button
              onClick={handleSignUp}
              className="underline hover:no-underline font-medium"
            >
              Sign up
            </button>{" "}
            to access full features, or{" "}
            <Link
              href="/"
              className="underline hover:no-underline font-medium"
            >
              go home
            </Link>
            .
          </p>
        </div>
      </div>

      <AuthModal
        open={authModalOpen}
        mode={authMode}
        onClose={() => setAuthModalOpen(false)}
        onModeChange={(mode) => setAuthMode(mode)}
      />
    </>
  );
}
