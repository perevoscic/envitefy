"use client";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import { useState } from "react";
import ArrowFillButton from "@/components/ui/ArrowFillButton";
import {
  type CustomDesignCategory,
  getCategoryCustomDesignProfile,
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
  onImport,
  busy = false,
  compact = false,
  presentation,
}: {
  onClick: () => void;
  category: CustomDesignCategory;
  onImport?: () => void;
  busy?: boolean;
  /** A single toolbar button for galleries whose header already carries the primary actions. */
  compact?: boolean;
  presentation?: "hero";
}) {
  const { status, update } = useSession();
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const canCreate = status === "authenticated" && !busy;
  const profile = getCategoryCustomDesignProfile(category);
  const authModal = authOpen && (
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
  );
  if (presentation === "hero") {
    const create = () => {
      if (status === "authenticated") {
        onClick();
      } else {
        setAuthMode("login");
        setAuthOpen(true);
      }
    };
    return (
      <div data-custom-design-category={category} data-custom-design-presentation="hero">
        <ArrowFillButton
          type="button"
          label="Generate with Envitefy"
          animatedBorder
          data-wedding-create
          data-custom-design-create
          onClick={create}
          disabled={busy || status === "loading"}
        />
        {authModal}
      </div>
    );
  }
  if (compact) {
    return (
      <div
        data-custom-design-category={category}
        style={categoryCustomDesignStyle(category)}
        className="flex flex-wrap items-center gap-2"
      >
        <button
          type="button"
          onClick={onClick}
          disabled={!canCreate}
          title={profile.description}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[var(--create-border)] bg-white px-5 text-sm font-semibold text-[var(--create-accent)] transition-colors enabled:hover:bg-[var(--create-background)] disabled:cursor-not-allowed disabled:text-[#9ca3af] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--create-accent)]"
        >
          <CategoryCustomDesignIcon category={category} className="h-4 w-4 shrink-0" />
          Create with Envitefy
        </button>
        {status === "unauthenticated" && (
          <button
            type="button"
            onClick={() => {
              setAuthMode("login");
              setAuthOpen(true);
            }}
            className="inline-flex min-h-11 items-center rounded-lg px-2 text-sm font-semibold text-[var(--create-accent)] underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--create-accent)]"
          >
            Sign in to generate
          </button>
        )}
        {authModal}
      </div>
    );
  }
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
          className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[var(--create-accent)] px-6 py-3 text-sm font-semibold text-[var(--create-on-accent)] transition-colors enabled:hover:bg-[var(--create-hover)] disabled:cursor-not-allowed disabled:bg-[#e5e7eb] disabled:text-[#6b7280] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--create-accent)]"
        >
          Create with Envitefy{" "}
          <span aria-hidden="true" className="ml-2">
            →
          </span>
        </button>
        {onImport && (
          <button
            type="button"
            onClick={onImport}
            disabled={!canCreate}
            className="mt-2 inline-flex min-h-11 items-center justify-center rounded-full border border-[#d7c6dc] px-5 py-2 text-sm font-semibold text-[#684675] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#684675]"
          >
            Upload event information
          </button>
        )}
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
      {authModal}
    </div>
  );
}
