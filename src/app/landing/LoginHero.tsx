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
  const [authModalOpenCount, setAuthModalOpenCount] = useState(0);
  const [mounted, setMounted] = useState(false);

  // Single source of truth for slide titles/subtitles; only the media src differs by orientation
  const slidesMeta = [
    {
      type: "image" as const,
      h: "/sliders/horizontal/horizontal-slide-1.jpg",
      v: "/sliders/vertical/vertical-slide-1.jpg",
      title: "No more manual entry.",
      subtitle: "Envitefy keeps your family calendar up to date for you.",
    },
    {
      type: "video" as const,
      h: "/sliders/horizontal/horizontal-slide-2.jpg",
      v: "/sliders/vertical/vertical-slide-2.`",
      title: "Just Snap It",
      subtitle: "Add events to your calendar in seconds.",
    },
    {
      type: "image" as const,
      h: "/sliders/horizontal/horizontal-slide-3.jpg",
      v: "/sliders/vertical/vertical-slide-3.jpg",
      title: "Save to any calendar",
      subtitle: "Receive RSVPs by text or email.",
    },
    {
      type: "image" as const,
      h: "/sliders/horizontal/horizontal-slide-4.jpg",
      v: "/sliders/vertical/vertical-slide-4.jpg",
      title: "Any Birthday Invites",
      subtitle: "Share one cute link with RSVP-by-text for the whole crew.",
    },
    {
      type: "image" as const,
      h: "/sliders/horizontal/horizontal-slide-5.jpg",
      v: "/sliders/vertical/vertical-slide-5.jpg",
      title: "Wedding Invites",
      subtitle:
        "Envitefy keeps RSVPs, registries, and directions together for you.",
    },
    {
      type: "image" as const,
      h: "/sliders/horizontal/horizontal-slide-6.jpg",
      v: "/sliders/vertical/vertical-slide-6.jpg",
      title: "Doctor Appointments",
      subtitle: "Never miss another one again with automatic reminders.",
    },
    {
      type: "image" as const,
      h: "/sliders/horizontal/horizontal-slide-7.jpg",
      v: "/sliders/vertical/vertical-slide-7.jpg",
      title: "Reclaim your space",
      subtitle:
        "Clear the fridge and keep every flyer, invite, and schedule in one place.",
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
    setMounted(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia("(min-width: 768px)");
    const apply = () => setIsDesktop(mql.matches);
    apply();
    mql.addEventListener("change", apply);
    return () => mql.removeEventListener("change", apply);
  }, []);

  // Listen for global auth modal open/close to pause background slider
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onOpen = () =>
      setAuthModalOpenCount((c) => (Number.isFinite(c) ? c + 1 : 1));
    const onClose = () =>
      setAuthModalOpenCount((c) => {
        const next = (Number.isFinite(c) ? c : 1) - 1;
        return next > 0 ? next : 0;
      });
    window.addEventListener("smd-auth-modal-open", onOpen as any);
    window.addEventListener("smd-auth-modal-close", onClose as any);
    return () => {
      window.removeEventListener("smd-auth-modal-open", onOpen as any);
      window.removeEventListener("smd-auth-modal-close", onClose as any);
    };
  }, []);

  useEffect(() => {
    if (status !== "authenticated") return;
    try {
      if (typeof window !== "undefined") {
        const welcomeFlag = window.localStorage.getItem("welcomeAfterSignup");
        if (welcomeFlag === "1") return;
      }
    } catch {}
    router.replace("/");
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
      className={`inline-flex items-center gap-2 text-white text-sm px-3 py-1 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 shadow transition-all duration-500 transform ${
        showReadMore
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 translate-y-2 pointer-events-none"
      }`}
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
    <section id="landing-hero" className="relative min-h-[100dvh]">
      {/* Single background slider instance */}
      <div className="absolute inset-0">
        {mounted && isDesktop !== null && (
          <BackgroundSlider
            key={isDesktop ? "desktop" : "mobile"}
            orientation="horizontal"
            slides={isDesktop ? desktopSlides : mobileSlides}
            overlay={false}
            paused={modalOpen || authModalOpenCount > 0}
            peekOnMount={!cancelPeek}
            peekRepeatCount={1}
            onPeekChange={handlePeekChange}
            cancelPeek={cancelPeek}
            bottomCenterSlot={readMorePill}
            slotBottomClass="bottom-1"
          />
        )}
      </div>
      {/* Gradient layers between slider and foreground text: illustration + top/bottom fade */}
      <div
        className="absolute inset-0 z-[3] pointer-events-none landing-dark-gradient"
        data-illustration-floating="true"
        aria-hidden={true}
      />
      <div
        className="absolute inset-0 z-[3] pointer-events-none hero-slider-fade"
        aria-hidden={true}
      />
      {/* Welcome stack above buttons */}
      <div
        className={`absolute inset-x-0 z-10 flex flex-col items-center text-center ${
          modalOpen ? "pointer-events-none opacity-0" : ""
        }`}
        style={{ bottom: "calc(8.5rem + env(safe-area-inset-bottom))" }}
      >
        <Image
          src={Logo}
          alt="Envitefy logo"
          height={84}
          className="rounded mx-auto mt-1"
        />
        <p className="text-3xl md:text-4xl text-white/90 font-montserrat">
          Welcome to
        </p>
        <p
          className="mt-2 text-5xl md:text-7xl tracking-tight text-white pb-3"
          role="heading"
          aria-level={1}
        >
          <span className="font-pacifico">
            <span className="text-[#ffffff]">env</span>
            <span className="text-[#ee3c2b]">i</span>
            <span className="text-[#ffffff]">tefy</span>
          </span>
        </p>
        <p className="mt-1 text-white/80 text-base md:text-lg font-montserrat px-4 md:px-0">
          Turn flyers, invites, and schedules into shareable plans in seconds —
          or craft your own event and smart sign-up form just as fast.
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
          className="px-6 py-2 rounded-2xl bg-[#56b2e1] text-white shadow-lg hover:shadow-xl active:shadow-md transition-shadow"
          onClick={() => {
            setMode("login");
            setModalOpen(true);
          }}
        >
          Log in
        </button>
        <button
          className="px-6 py-2 rounded-2xl bg-[#A259FF] text-white shadow-lg hover:shadow-xl active:shadow-md transition-shadow"
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
