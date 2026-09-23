"use client";
import { Sparkles } from "lucide-react";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import { useState } from "react";

const AuthModal = dynamic(() => import("@/components/auth/AuthModal"), { ssr: false });

/** Shared entry used by full category galleries; featured landing collections stay compact. */
export default function CreateWithEnvitefyCallout({
  onClick,
  signup = false,
}: {
  onClick: () => void;
  signup?: boolean;
}) {
  const { status, update } = useSession();
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const canCreate = status === "authenticated";
  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-[#d7c6dc] bg-white/90 p-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-4">
        <Sparkles className="mt-1 shrink-0 text-[#72527e]" size={24} aria-hidden="true" />
        <div>
          <h2 className="font-serif text-2xl text-[#342d38]">Have something unique in mind?</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[#746775]">
            Share your idea, event details, and inspiration. Preview a custom{" "}
            {signup ? "signup" : "event page"} before making it yours.
          </p>
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-center">
        <button
          type="button"
          onClick={onClick}
          disabled={!canCreate}
          className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#684675] px-6 py-3 text-sm font-semibold text-white transition-colors enabled:hover:bg-[#52375d] disabled:cursor-not-allowed disabled:bg-[#e5e7eb] disabled:text-[#6b7280] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#684675]"
        >
          Create with Envitefy{" "}
          <span aria-hidden="true" className="ml-2">
            →
          </span>
        </button>
        {status === "unauthenticated" && (
          <button
            type="button"
            onClick={() => {
              setAuthMode("login");
              setAuthOpen(true);
            }}
            className="mt-1 inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-[#684675] underline underline-offset-4 hover:text-[#52375d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#684675]"
          >
            Sign in to generate
          </button>
        )}
      </div>
      {authOpen && (
        <AuthModal
          open
          mode={authMode}
          onModeChange={setAuthMode}
          onClose={() => setAuthOpen(false)}
          allowGoogleAuth={false}
          description={`Sign in to generate your custom ${signup ? "signup form" : "event page"}.`}
          onAuthenticated={async () => {
            await update();
            setAuthOpen(false);
            onClick();
          }}
        />
      )}
    </div>
  );
}
