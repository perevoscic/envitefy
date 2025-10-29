"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type ChangeEvent,
  type MouseEvent,
  type KeyboardEvent,
} from "react";
import Link from "next/link";
import Image from "next/image";
import Logo from "@/assets/logo.png";
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
    <main className="landing-dark-gradient relative flex min-h-[100dvh] w-full flex-col items-center justify-center px-3 pb-16 text-foreground md:px-8 md:pt-16">
      <div className="mb-8 md:mb-12 flex flex-col items-center text-center">
        <Image src={Logo} alt="Envitefy logo" width={100} height={100} />
        <p
          className="mt-2 text-3xl md:text-7xl tracking-tight text-white pb-3 pt-2"
          role="heading"
          aria-level={1}
        >
          <span className="font-pacifico">
            <span className="text-[#0e7bc4]">Env</span>
            <span className="text-[#ee3c2b]">i</span>
            <span className="text-[#0e7bc4]">tefy</span>
          </span>
        </p>
      </div>
      <div className="grid w-full max-w-6xl grid-cols-2 gap-3 md:gap-6 lg:grid-cols-4">
        <OptionCard
          title="Snap Event"
          description="and it to your calendar."
          details={[
            "Use your camera to snap invites to calendar.",
            "Extracts dates, locations, and RSVP details automatically.",
          ]}
          artwork={<ScanIllustration />}
          tone="primary"
          onClick={onSnap}
        />
        <OptionCard
          title="Upload Event"
          description="any saved invitation or flyer."
          details={[
            "Drop PDFs, screenshots, or photos from your library.",
            "Smart cleanup handles decorative fonts and tricky layouts.",
          ]}
          artwork={<UploadIllustration />}
          tone="secondary"
          onClick={onUpload}
        />
        <OptionCard
          title="Create Event"
          description="advanced creation tools."
          details={[
            "Start from scratch with precise times, reminders, and notes.",
            "Add recurrence rules, categories, and custom reminders.",
          ]}
          artwork={<CreateEventIllustration />}
          tone="accent"
          onClick={openCreateEvent}
        />
        <OptionCard
          title="Sign-Up Form"
          description="for school events, volunteers."
          details={[
            "Build RSVP and volunteer sheets with slot limits and questions.",
            "Share a single link that syncs responses in real time.",
          ]}
          artwork={<SignUpIllustration />}
          tone="success"
          href="/smart-signup-form"
        />
      </div>

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
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

function FlipHintIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M7 5h9.5a.5.5 0 01.5.5V11" />
      <path d="M16 9l2 2 2-2" />
      <path d="M17 19H7.5a.5.5 0 01-.5-.5V13" />
      <path d="M8 15l-2-2-2 2" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M6 6L18 18" />
      <path d="M18 6L6 18" />
    </svg>
  );
}

function OptionCard({
  href,
  title,
  artwork,
  description,
  details,
  tone = "primary",
  onClick,
}: {
  href?: string;
  title: string;
  artwork: ReactNode;
  description: string;
  details?: string[];
  tone?: HighlightTone;
  onClick?: () => void;
}) {
  const toneClass = TONE_STYLES[tone] ?? TONE_STYLES.primary;
  const [showDetails, setShowDetails] = useState(false);

  const handlePrimaryAction = (
    event: MouseEvent<HTMLAnchorElement | HTMLButtonElement>
  ) => {
    if (showDetails) {
      event.preventDefault();
      setShowDetails(false);
      return;
    }
    onClick?.();
  };

  const openDetails = () => setShowDetails(true);

  const handleInfoPointer = (
    event: MouseEvent<HTMLSpanElement> | KeyboardEvent<HTMLSpanElement>
  ) => {
    event.preventDefault();
    event.stopPropagation();
    if (!showDetails) {
      openDetails();
    }
  };

  const handleInfoKeyDown = (event: KeyboardEvent<HTMLSpanElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      handleInfoPointer(event);
    }
  };

  const closeDetails = (
    event?:
      | MouseEvent<HTMLButtonElement | HTMLDivElement>
      | KeyboardEvent<HTMLDivElement>
  ) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    setShowDetails(false);
  };

  const primaryWrapperClass = [
    "group block h-full w-full text-left focus:outline-none",
    showDetails ? "pointer-events-none select-none" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const primaryTabIndex = showDetails ? -1 : undefined;

  const frontCard = (
    <div
      className="relative overflow-hidden rounded-2xl border border-border/60 bg-surface/90 px-3 py-4 md:px-5 md:py-6 shadow-[0_24px_50px_-32px_var(--theme-card-glow)] backdrop-blur-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_32px_65px_-28px_var(--theme-card-glow)]"
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
      <span
        role="button"
        tabIndex={showDetails ? -1 : 0}
        aria-label="Show details"
        className="absolute right-3 top-3 z-10 inline-flex items-center justify-center bg-transparent p-1 text-[#0e7bc4] transition hover:text-[#0e7bc4] focus:outline-none focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-[#0e7bc4]/50 focus-visible:ring-offset-1 focus-visible:ring-offset-white dark:text-[#0e7bc4] dark:hover:text-[#0e7bc4] dark:focus-visible:ring-[#0e7bc4]/60 dark:focus-visible:ring-offset-0"
        onClick={handleInfoPointer}
        onKeyDown={handleInfoKeyDown}
      >
        <FlipHintIcon className="h-6 w-6" />
      </span>
      <div className="relative flex flex-col items-center space-y-3 md:space-y-4 text-center">
        <div
          className={[
            "relative flex w-full max-w-[180px] md:max-w-[200px] items-center justify-center overflow-hidden rounded-xl bg-surface/70 p-3 md:p-4 transition-all duration-300 group-hover:scale-[1.02]",
            toneClass.iconBg,
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/50 via-transparent to-white/5 opacity-0 transition-opacity duration-300 group-hover:opacity-70" />
          <div className="relative w-full">{artwork}</div>
        </div>
        <h2 className="text-base md:text-lg font-semibold text-foreground">
          {title}
        </h2>
      </div>
    </div>
  );

  const backCard = (
    <div
      role="button"
      tabIndex={0}
      onClick={closeDetails}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          closeDetails(event);
        }
      }}
      className="absolute inset-0 flex h-full w-full cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border border-border/60 bg-surface/95 px-3 py-4 md:px-5 md:py-6 text-left shadow-[0_24px_50px_-32px_var(--theme-card-glow)] backdrop-blur-sm transition-transform duration-300 hover:shadow-[0_32px_65px_-28px_var(--theme-card-glow)]"
      data-card-tone={tone}
      style={{ transform: "rotateY(180deg)", backfaceVisibility: "hidden" }}
    >
      <button
        type="button"
        aria-label="Hide details"
        className="absolute right-3 top-3 inline-flex items-center justify-center bg-transparent p-1 text-[#0e7bc4] transition hover:text-[#0e7bc4] focus:outline-none focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-[#0e7bc4]/50 focus-visible:ring-offset-1 focus-visible:ring-offset-white dark:text-[#0e7bc4] dark:hover:text-[#0e7bc4] dark:focus-visible:ring-[#0e7bc4]/60 dark:focus-visible:ring-offset-0"
        onClick={closeDetails}
      >
        <CloseIcon className="h-5 w-5" />
      </button>
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(140% 140% at 50% 15%, var(--theme-overlay) 0%, transparent 65%)",
        }}
        aria-hidden
      />
      <div className="relative mx-auto flex max-w-xs flex-1 flex-col justify-center gap-3 md:gap-4 text-center">
        <div className="space-y-1.5 md:space-y-2">
          <h2 className="text-base md:text-lg font-semibxold text-foreground">
            {title}
          </h2>
          <p className="text-xs md:text-sm text-muted-foreground">
            {description}
          </p>
        </div>
        {details?.length ? (
          <ul className="space-y-1.5 md:space-y-2 text-left text-xs md:text-sm text-muted-foreground">
            {details.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-[0.35rem] md:mt-[0.45rem] h-1.5 w-1.5 flex-shrink-0 rounded-full bg-current opacity-60" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );

  const frontWrapper = href ? (
    <Link
      href={href}
      onClick={handlePrimaryAction}
      className={primaryWrapperClass}
      tabIndex={primaryTabIndex}
    >
      {frontCard}
    </Link>
  ) : (
    <button
      type="button"
      onClick={handlePrimaryAction}
      className={primaryWrapperClass}
      tabIndex={showDetails ? -1 : 0}
    >
      {frontCard}
    </button>
  );

  return (
    <div className="relative h-full w-full [perspective:2000px]">
      <div
        className="relative h-full w-full transition-transform duration-500 [transform-style:preserve-3d]"
        style={{ transform: showDetails ? "rotateY(180deg)" : "rotateY(0deg)" }}
      >
        <div
          className="relative h-full w-full"
          style={{ backfaceVisibility: "hidden" }}
        >
          {frontWrapper}
        </div>
        {backCard}
      </div>
    </div>
  );
}
