"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type ChangeEvent,
} from "react";
import Link from "next/link";
import Image from "next/image";
import {
  CreateEventIllustration,
  ScanIllustration,
  SignUpIllustration,
  UploadIllustration,
} from "@/components/landing/action-illustrations";

type HighlightTone = "primary" | "secondary" | "accent" | "success";

const TONE_STYLES: Record<HighlightTone, { iconBg: string }> = {
  primary: {
    iconBg: "bg-primary/15",
  },
  secondary: {
    iconBg: "bg-secondary/15",
  },
  accent: {
    iconBg: "bg-accent/15",
  },
  success: {
    iconBg: "bg-success/15",
  },
};

declare global {
  interface Window {
    __openCreateEvent?: () => void;
  }
}

export default function Home() {
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [pickedName, setPickedName] = useState<string | null>(null);

  const openCreateEvent = useCallback(() => {
    try {
      window.__openCreateEvent?.();
    } catch {
      // noop
    }
  }, []);

  const onSnap = useCallback(() => {
    try {
      if (cameraInputRef.current) cameraInputRef.current.value = "";
      cameraInputRef.current?.click();
    } catch {
      // noop
    }
  }, []);

  const onUpload = useCallback(() => {
    try {
      if (fileInputRef.current) fileInputRef.current.value = "";
      fileInputRef.current?.click();
    } catch {
      // noop
    }
  }, []);

  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      const params = new URLSearchParams(window.location.search);
      const action = (params.get("action") || "").toLowerCase();
      if (!action) return;
      const cleanup = () => {
        try {
          const url = new URL(window.location.href);
          url.searchParams.delete("action");
          window.history.replaceState({}, "", url.toString());
        } catch {
          // noop
        }
      };
      if (action === "camera") {
        onSnap();
        cleanup();
      } else if (action === "upload") {
        onUpload();
        cleanup();
      }
    } catch {
      // noop
    }
  }, [onSnap, onUpload]);

  const onFilePicked = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setPickedName(f ? f.name : null);
  }, []);

  return (
    <main className="landing-dark-gradient relative flex min-h-[100dvh] w-full flex-col items-center justify-center px-4 py-16 text-foreground md:px-8">
      <div className="mb-12 flex flex-col items-center text-center">
        <div className="mb-6 inline-flex h-24 w-24 items-center justify-center rounded-full border border-border/60 bg-surface/90 shadow-[0_22px_45px_-24px_var(--theme-card-glow)] backdrop-blur-sm">
          <Image
            src="/icons/icon-180.png"
            alt="Snap My Date"
            width={64}
            height={64}
            priority
            className="h-16 w-16 rounded-full shadow-sm"
          />
        </div>
        <h1 className="text-3xl font-semibold text-foreground md:text-4xl">
          Plan Something Great!
        </h1>
        <p className="mt-3 max-w-2xl text-base text-muted-foreground md:text-lg">
          Choose how you want to start - scan it, upload it, create it from
          scratch, or launch a smart sign-up. Every option adapts to your theme,
          from cozy holidays to sleek dark mode.
        </p>
      </div>

      <div className="grid w-full max-w-6xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <OptionCard
          title="Scan"
          description="Scan any flyer or invitation and we'll add it to your calendar."
          artwork={<ScanIllustration />}
          tone="primary"
          onClick={onSnap}
        />
        <OptionCard
          title="Upload"
          description="Upload any saved invitation, and add it to your calendar."
          artwork={<UploadIllustration />}
          tone="secondary"
          onClick={onUpload}
        />
        <OptionCard
          title="Create Event"
          description="Use our advanced creation tools for more control."
          artwork={<CreateEventIllustration />}
          tone="accent"
          onClick={openCreateEvent}
        />
        <OptionCard
          title="Sign-Up Form"
          description="Smart forms for school events, volunteers, or any event."
          artwork={<SignUpIllustration />}
          tone="success"
          href="/smart-signup-form"
        />
      </div>

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*,application/pdf"
        capture="environment"
        onChange={onFilePicked}
        className="hidden"
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        onChange={onFilePicked}
        className="hidden"
      />

      {pickedName ? (
        <p className="mt-6 max-w-6xl truncate text-sm text-muted-foreground">
          Selected file: {pickedName}
        </p>
      ) : null}
    </main>
  );
}

function OptionCard({
  href,
  title,
  artwork,
  description,
  tone = "primary",
  onClick,
}: {
  href?: string;
  title: string;
  artwork: ReactNode;
  description: string;
  tone?: HighlightTone;
  onClick?: () => void;
}) {
  const toneClass = TONE_STYLES[tone] ?? TONE_STYLES.primary;

  const content = (
    <div
      className="group relative overflow-hidden rounded-2xl border border-border/60 bg-surface/90 p-6 shadow-[0_24px_50px_-32px_var(--theme-card-glow)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_32px_65px_-28px_var(--theme-card-glow)] cursor-pointer"
      data-card-tone={tone}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-70"
        style={{
          background:
            "radial-gradient(120% 120% at 50% 0%, var(--theme-overlay) 0%, transparent 60%)",
        }}
        aria-hidden
      />
      <div className="relative flex flex-col items-center space-y-4 text-center">
        <div
          className={[
            "relative flex w-full max-w-[200px] items-center justify-center overflow-hidden rounded-xl bg-surface/70 p-4 transition-all duration-300 group-hover:scale-[1.02]",
            toneClass.iconBg,
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/50 via-transparent to-white/5 opacity-0 transition-opacity duration-300 group-hover:opacity-70" />
          <div className="relative w-full">{artwork}</div>
        </div>
        <h2 className="text-lg font-semibold text-foreground">
          {title}
        </h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} onClick={onClick} className="block">
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className="block w-full text-left">
      {content}
    </button>
  );
}
