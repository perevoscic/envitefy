"use client";
import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Logo from "@/assets/logo.png";
import BackgroundSlider from "@/components/BackgroundSlider";
import AuthModal from "@/components/auth/AuthModal";

export default function LoginHero() {
  const { status } = useSession();
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [showReadMore, setShowReadMore] = useState(false);
  const [cancelPeek, setCancelPeek] = useState(false);
  const hideRmTimeoutRef = useRef<number | null>(null);
  const searchParams = useSearchParams();
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);

  // Single source of truth for slide titles/subtitles; only the media src differs by orientation
  const slidesMeta = [
    {
      type: "image" as const,
      h: "/sliders/horizontal/horizontal-slide-1.jpg",
      v: "/sliders/vertical/vertical-slide-1.jpg",
      title: "No more manual entry.",
      subtitle: "Forget the old fashioned way of manually entering events.",
    },
    {
      type: "video" as const,
      h: "/sliders/horizontal/horizontal-slide-2.mp4",
      v: "/sliders/vertical/vertical-slide-2.mp4",
      title: "Just Snap It",
      subtitle:
        "Automatically extracts dates, times and locations from flyers.",
    },
    {
      type: "image" as const,
      h: "/sliders/horizontal/horizontal-slide-3.jpg",
      v: "/sliders/vertical/vertical-slide-3.jpg",
      title: "Save to any calendar",
      subtitle: "Google, Apple, Outlook — with reminders included.",
    },
  ];
  const desktopSlides = slidesMeta.map((m) => ({
    type: m.type,
    src: m.h,
    title: m.title,
    subtitle: m.subtitle,
  }));
  const mobileSlides = slidesMeta.map((m) => ({
    type: m.type,
    src: m.v,
    title: m.title,
    subtitle: m.subtitle,
  }));

  // Single instance: choose slides by breakpoint (min-width: 768px)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia("(min-width: 768px)");
    const apply = () => setIsDesktop(mql.matches);
    apply();
    mql.addEventListener("change", apply);
    return () => mql.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (status === "authenticated") router.replace("/");
  }, [status, router]);

  // Open modal automatically when `?auth=login` or `?auth=signup` is present and respond to query changes
  useEffect(() => {
    if (!searchParams) return;
    const auth = searchParams.get("auth");
    if (auth === "login" || auth === "signup") {
      setMode(auth);
      setModalOpen(true);
      const params = new URLSearchParams(Array.from(searchParams.entries()));
      params.delete("auth");
      const newQuery = params.toString();
      const newUrl = `${window.location.pathname}${
        newQuery ? `?${newQuery}` : ""
      }${window.location.hash}`;
      router.replace(newUrl, { scroll: false });
    }
  }, [searchParams, router]);

  useEffect(() => {
    return () => {
      if (hideRmTimeoutRef.current)
        window.clearTimeout(hideRmTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    const markInteracted = () => {
      setCancelPeek(true);
      setShowReadMore(false);
    };
    const onScroll = () => {
      if (window.scrollY > 10) markInteracted();
    };
    // If the page is already scrolled on mount (e.g., bfcache restore or anchor),
    // cancel the peek immediately so it only runs at the very top.
    if (typeof window !== "undefined" && window.scrollY > 10) {
      markInteracted();
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("touchstart", markInteracted, { passive: true });
    window.addEventListener("wheel", markInteracted, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("touchstart", markInteracted as any);
      window.removeEventListener("wheel", markInteracted as any);
    };
  }, []);

  const handlePeekChange = (
    isPeeking: boolean,
    iteration: number,
    total: number
  ) => {
    if (cancelPeek) return;
    if (isPeeking) {
      if (hideRmTimeoutRef.current)
        window.clearTimeout(hideRmTimeoutRef.current);
      setShowReadMore(true);
    } else {
      // Hide after the final peek finishes; keep visible between peeks
      if (iteration + 1 >= total) {
        hideRmTimeoutRef.current = window.setTimeout(
          () => setShowReadMore(false),
          500
        );
      }
    }
  };

  const readMorePill = (
    <a
      href="#how-it-works"
      className={`inline-flex items-center gap-2 text-white text-sm px-3 py-1 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 shadow`}
      aria-label="Read more about how it works"
    >
      Read more...
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4 animate-bounce"
        aria-hidden="true"
      >
        <path d="M6 9l6 6 6-6" />
      </svg>
    </a>
  );

  return (
    <section className="relative min-h-[100dvh]">
      {/* Single background slider instance */}
      <div className="absolute inset-0">
        {isDesktop !== null && (
          <BackgroundSlider
            key={isDesktop ? "desktop" : "mobile"}
            orientation="horizontal"
            slides={isDesktop ? desktopSlides : mobileSlides}
            paused={modalOpen}
            peekOnMount={false}
            peekRepeatCount={0}
            onPeekChange={handlePeekChange}
            cancelPeek={cancelPeek}
            bottomCenterSlot={readMorePill}
            slotBottomClass="bottom-1"
          />
        )}
      </div>
      {/* Welcome stack above buttons */}
      <div
        className={`absolute inset-x-0 z-10 flex flex-col items-center text-center ${
          modalOpen ? "pointer-events-none opacity-0" : ""
        }`}
        style={{ bottom: "calc(8.5rem + env(safe-area-inset-bottom))" }}
      >
        <Image
          src={Logo}
          alt="Logo"
          height={84}
          className="rounded mx-auto mt-1"
        />
        <p className="text-2xl md:text-3xl text-white/90 font-montserrat">
          Welcome to
        </p>
        <p className="mt-2 text-5xl md:text-3xl font-extrabold tracking-tight text-white text-shadow-soft pb-3">
          <span className="font-pacifico">Snap</span>
          <span> </span>
          <span className="font-montserrat font-semibold">My Date</span>
        </p>
        <p className="mt-1 text-white/80 text-sm font-montserrat">
          Turn any flyer into a calendar event in seconds.
        </p>
      </div>

      {/* Bottom buttons */}
      <div
        className={`absolute inset-x-0 z-10 flex items-center justify-center gap-3 ${
          modalOpen ? "pointer-events-none opacity-0" : ""
        }`}
        style={{ bottom: "calc(3.5rem + env(safe-area-inset-bottom))" }}
      >
        <button
          className="px-6 py-2 rounded-2xl bg-[#A259FF] text-white shadow"
          onClick={() => {
            setMode("login");
            setModalOpen(true);
          }}
        >
          Log in
        </button>
        <button
          className="px-6 py-2 rounded-2xl border border-white/60 bg-white/10 text-white backdrop-blur"
          onClick={() => {
            setMode("signup");
            setModalOpen(true);
          }}
        >
          Sign up
        </button>
      </div>

      {/* Modal */}
      <AuthModal
        open={modalOpen}
        mode={mode}
        onClose={() => setModalOpen(false)}
        onModeChange={setMode}
      />
    </section>
  );
}
