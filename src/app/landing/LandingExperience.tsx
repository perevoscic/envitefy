"use client";

import { ArrowRight, Check, Menu } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import EnvitefyBrandImage from "@/components/branding/EnvitefyBrandImage";
import MarketingPage from "@/components/marketing/MarketingPage";
import ConciergeLauncher from "@/components/navigation/ConciergeLauncher";
import scrollStyles from "@/components/navigation/scroll-aware-header.module.css";
import useScrollAwareHeader from "@/components/navigation/useScrollAwareHeader";
import ArrowFillButton from "@/components/ui/ArrowFillButton";
import { ENVITEFY_BRAND_ASSETS } from "@/lib/brand-assets";
import styles from "./LandingExperience.module.css";
import LandingArtCollage from "./sections/LandingArtCollage";
import LandingCategoryCollection from "./sections/LandingCategoryCollection";
import LandingGuestBenefits from "./sections/LandingGuestBenefits";
import LandingQuestions from "./sections/LandingQuestions";
import LandingTestimonials from "./sections/LandingTestimonials";
import ProductLandingHero, {
  LandingGuestPreview,
  LandingHowItWorks,
  LandingOccasionLinks,
} from "./sections/ProductLandingHero";

const AuthModal = dynamic(() => import("@/components/auth/AuthModal"), { ssr: false });
const ConciergeSheet = dynamic(() => import("@/components/navigation/ConciergeSheet"), {
  ssr: false,
});
const MenuBottomSheet = dynamic(() => import("@/components/navigation/MenuBottomSheet"), {
  ssr: false,
});
const LandingLiveCardShowcase = dynamic(
  () => import("@/components/landing/LandingLiveCardShowcase"),
  { ssr: false },
);

const navigationLinks = [
  { label: "Categories", href: "#categories" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Examples", href: "#showcase" },
] as const;

function DeferredShowcase({ children }: { children: ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    if (!("IntersectionObserver" in window)) {
      setReady(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setReady(true);
        observer.disconnect();
      },
      { rootMargin: "360px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={containerRef} className={styles.showcasePlaceholder} aria-busy={!ready}>
      {ready ? (
        children
      ) : (
        <p className={styles.loadingExample}>Your invitation, brought to life.</p>
      )}
    </div>
  );
}

export default function LandingExperience() {
  const router = useRouter();
  const { status } = useSession();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [authRedirect, setAuthRedirect] = useState("/");
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const {
    headerRef,
    hidden: headerHidden,
    targetVisible: largeWordmarkVisible,
  } = useScrollAwareHeader(
    mobileMenuOpen || authModalOpen || assistantOpen,
    "[data-landing-wordmark]",
  );
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const closeOnDesktop = () => {
      if (desktop.matches) setMobileMenuOpen(false);
    };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);
  const openAuth = (mode: "login" | "signup", redirect = "/") => {
    setAuthMode(mode);
    setAuthRedirect(redirect);
    setAuthModalOpen(true);
  };
  const onCreateEvent = () => {
    if (status === "authenticated") {
      router.push("/create");
      return;
    }
    openAuth("signup", "/create");
  };
  const openHelpChat = () => setAssistantOpen(true);

  return (
    <MarketingPage className={styles.root}>
      <a href="#landing-content" className={styles.skipLink}>
        Skip to content
      </a>
      <header
        ref={headerRef}
        data-scroll-hidden={headerHidden ? "true" : "false"}
        className={`${styles.header} ${scrollStyles.header}`}
      >
        <Link
          href="/"
          className={styles.brand}
          aria-label="Envitefy home"
          data-logo-hidden={largeWordmarkVisible ? "true" : "false"}
        >
          <EnvitefyBrandImage
            src={ENVITEFY_BRAND_ASSETS.wordmark.color}
            whiteSrc={ENVITEFY_BRAND_ASSETS.wordmark.white}
            alt="Envitefy"
            width={150}
            height={55}
            priority
          />
        </Link>
        <nav className={styles.desktopNav} aria-label="Main navigation">
          {navigationLinks.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>
        <div className={styles.headerActions}>
          <ArrowFillButton
            label="Login"
            onClick={() => openAuth("login")}
            className={`${styles.login} ${styles.publicSignIn}`}
          />
          <button type="button" onClick={onCreateEvent} className={styles.headerCreate}>
            Let&apos;s create <ArrowRight size={15} aria-hidden="true" />
          </button>
          <button
            type="button"
            className={styles.menuButton}
            aria-label="Open navigation"
            aria-haspopup="dialog"
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu size={22} aria-hidden="true" />
          </button>
        </div>
      </header>
      <main id="landing-content">
        <ProductLandingHero onCreate={onCreateEvent} />
        <LandingOccasionLinks />
        <LandingGuestPreview />
        <LandingHowItWorks />
        <LandingCategoryCollection />
        <LandingGuestBenefits />
        <LandingArtCollage />
        <div id="showcase" className={styles.showcaseShell}>
          <DeferredShowcase>
            <LandingLiveCardShowcase
              sectionId="showcase-cards"
              eyebrow="A little look at what’s possible"
              title="Beautiful to open. Easy to use."
              description="Explore a sample invitation. Open the RSVP, directions or calendar actions to see how the details come together."
              tone="luxury"
            />
          </DeferredShowcase>
        </div>
        <LandingQuestions onHelp={openHelpChat} />
        <LandingTestimonials />
        <section id="creation-paths" className={styles.finalCta} aria-labelledby="create-heading">
          <p className={styles.eyebrow}>For the moments that bring us together</p>
          <h2 id="create-heading">
            Make it an <em>occasion.</em>
          </h2>
          <p>Your people. Your plans. One beautiful place for it all.</p>
          <button
            id="upload"
            type="button"
            onClick={onCreateEvent}
            className={styles.primaryButton}
          >
            Create your event <ArrowRight size={18} aria-hidden="true" />
          </button>
          <span className={styles.finalNote}>
            <Check size={14} aria-hidden="true" />
            No app needed for your guests
          </span>
        </section>
      </main>
      <ConciergeLauncher open={assistantOpen} onOpen={() => setAssistantOpen((open) => !open)} />
      <MenuBottomSheet
        allowDesktop
        open={mobileMenuOpen}
        onOpenChange={setMobileMenuOpen}
        successRedirectUrl="/"
        signupSuccessRedirectUrl="/"
      />
      <ConciergeSheet
        open={assistantOpen}
        onOpenChange={setAssistantOpen}
        onSignupSelect={() => openAuth("signup")}
      />
      <AuthModal
        open={authModalOpen}
        mode={authMode}
        onClose={() => setAuthModalOpen(false)}
        onModeChange={setAuthMode}
        successRedirectUrl={authRedirect}
      />
    </MarketingPage>
  );
}
