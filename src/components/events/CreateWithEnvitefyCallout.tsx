"use client";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import { useState } from "react";
import {
  getCategoryCustomDesignProfile,
  type CustomDesignCategory,
} from "@/lib/category-custom-design-profiles";
import {
  CategoryCustomDesignIcon,
  categoryCustomDesignStyle,
} from "./CategoryCustomDesignIdentity";

const AuthModal = dynamic(() => import("@/components/auth/AuthModal"), { ssr: false });

/** Shared entry used by full category galleries; featured landing collections stay compact. */
export default function CreateWithEnvitefyCallout({
  onClick,
  category,
}: {
  onClick: () => void;
  category: CustomDesignCategory;
}) {
  const { status, update } = useSession();
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const canCreate = status === "authenticated";
  const profile = getCategoryCustomDesignProfile(category);
  return (
    <div
      data-custom-design-category={category}
      style={categoryCustomDesignStyle(category)}
      className="flex flex-col gap-5 rounded-2xl border border-[var(--create-border)] bg-[var(--create-background)] p-6 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex min-w-0 items-start gap-4">
        <CategoryCustomDesignIcon
          category={category}
          className="mt-1 shrink-0 text-[var(--create-accent)]"
        />
        <div className="min-w-0">
          <h2 className="font-serif text-2xl text-[var(--create-ink)]">{profile.headline}</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--create-muted)]">
            {profile.description}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-center">
        <button
          type="button"
          onClick={onClick}
          disabled={!canCreate}
          className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[var(--create-accent)] px-6 py-3 text-sm font-semibold text-white transition-colors enabled:hover:bg-[var(--create-hover)] disabled:cursor-not-allowed disabled:bg-[#e5e7eb] disabled:text-[#6b7280] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--create-accent)]"
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
            className="mt-1 inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-[var(--create-accent)] underline underline-offset-4 hover:text-[var(--create-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--create-accent)]"
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
          description={`Sign in to generate your custom ${category === "signup-forms" ? "signup form" : "event page"}.`}
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
