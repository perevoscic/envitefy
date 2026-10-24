"use client";

import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronDown,
  Eye,
  Gift,
  LayoutTemplate,
  MapPin,
  Menu,
  MessageCircle,
  PlusCircle,
  Users,
} from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import EnvitefyBrandImage from "@/components/branding/EnvitefyBrandImage";
import ScrollAwareBottomNav from "@/components/navigation/ScrollAwareBottomNav";
import type { SignedOutBottomNavItem } from "@/config/navigation";
import { ENVITEFY_BRAND_ASSETS } from "@/lib/brand-assets";
import { landingHeroGalleries } from "@/lib/landing-hero-galleries";
import styles from "./LandingExperience.module.css";
import { landingCategoryCards } from "./landing-data";
import ProductLandingHero, {
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
  { label: "Templates", href: "#examples" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Examples", href: "#showcase" },
] as const;

const bottomNavigation: SignedOutBottomNavItem[] = [
  {
    label: "Templates",
    href: "#examples",
    icon: LayoutTemplate,
    purpose: "Explore event templates",
  },
  { label: "Examples", href: "#showcase", icon: Eye, purpose: "Explore sample invitations" },
  {
    label: "Create",
    href: "#creation-paths",
    icon: PlusCircle,
    purpose: "Create your event",
    action: "create",
    featured: true,
  },
  {
    label: "Help",
    href: "#concierge",
    icon: MessageCircle,
    purpose: "Ask Envitefy Concierge",
    action: "concierge",
  },
  { label: "Menu", href: "#menu", icon: Menu, purpose: "Open navigation", action: "menu" },
];

const guestBenefits = [
  {
    icon: Users,
    title: "Know who’s coming.",
    description: "Keep RSVPs with your event, instead of scattered across messages.",
  },
  {
    icon: MapPin,
    title: "Make arriving easy.",
    description: "Give guests the time, directions and arrival notes in one place.",
  },
  {
    icon: CalendarDays,
    title: "Keep everyone in the loop.",
    description: "Share the schedule and update the details behind the same link.",
  },
  {
    icon: Gift,
    title: "Bring the extras together.",
    description: "Add registry links or organize supplies and volunteers with sign-ups.",
  },
] as const;

const questions = [
  {
    question: "Do my guests need an app?",
    answer:
      "No. Your shared invitation or event page opens in a browser on phones, tablets and computers. Guests can find the details and use the actions you’ve enabled from that link.",
  },
  {
    question: "Can I change the details after sharing?",
    answer:
      "Yes. Edit your event and save your changes. Guests opening the same link will see the updated details, so you can keep the plan current without sending a replacement invitation.",
  },
  {
    question: "Can I start with a flyer, PDF or event link?",
    answer:
      "Yes. The event creation workspace offers Upload, Paste URL and Start from scratch. Review the imported information, choose your design and make any changes before explicitly saving or publishing.",
  },
  {
    question: "Can I explore designs before creating an account?",
    answer:
      "Yes. Browse the public template galleries and try a design first. Sign in or create an account when you’re ready to save your work and keep editing.",
  },
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

function TemplateCollection() {
  return (
    <section id="examples" className={styles.templates} aria-labelledby="template-heading">
      <span id="categories" className={styles.anchor} aria-hidden="true" />
      <div className={styles.sectionHeading}>
        <div>
          <p className={styles.eyebrow}>Made for your kind of gathering</p>
          <h2 id="template-heading">Find a design that feels like you.</h2>
        </div>
        <p className={styles.sectionDescription}>
          Big milestones, little get-togethers and everything worth bringing people together for.
        </p>
      </div>
      <div className={styles.categoryGrid}>
        {landingCategoryCards.map((card) => {
          const artwork = landingHeroGalleries[card.id][0];
          return (
            <Link
              key={card.id}
              href={card.href}
              className={styles.categoryCard}
              data-category={card.id}
              aria-label={card.cta}
            >
              <div className={styles.categoryImage}>
                <Image
                  src={artwork.src}
                  alt={artwork.alt}
                  fill
                  sizes="(max-width: 600px) 50vw, (max-width: 960px) 50vw, 25vw"
                />
              </div>
              <div className={styles.categoryCopy}>
                <h3>{card.label}</h3>
                <ArrowRight size={17} aria-hidden="true" />
              </div>
              <p className={styles.categoryDescription}>{card.promise}</p>
            </Link>
          );
        })}
      </div>
      <p className={styles.browseNote}>
        Take a look around. You can explore designs before signing up.
      </p>
    </section>
  );
}

function GuestBenefits() {
  return (
    <section id="guest-flow" className={styles.benefits} aria-labelledby="benefits-heading">
      <div className={styles.benefitIntro}>
        <p className={styles.eyebrow}>Thoughtful for guests. Easier for you.</p>
        <h2 id="benefits-heading">
          Less chasing.
          <br />
          <em>More celebrating.</em>
        </h2>
        <p>
          A lovely invitation is just the beginning. Give everyone a place to return to for the
          plan, the little details and the latest updates.
        </p>
        <Link href="#showcase" className={styles.textLink}>
          Explore the guest experience <ArrowRight size={17} aria-hidden="true" />
        </Link>
      </div>
      <div className={styles.benefitList}>
        {guestBenefits.map(({ icon: Icon, title, description }) => (
          <article key={title} className={styles.benefit}>
            <span className={styles.benefitIcon}>
              <Icon size={21} aria-hidden="true" />
            </span>
            <div>
              <h3>{title}</h3>
              <p>{description}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default function LandingExperience() {
  const router = useRouter();
  const { status } = useSession();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [authRedirect, setAuthRedirect] = useState("/");
  const [bottomNavVisible, setBottomNavVisible] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
    <div className={`${styles.root} ${bottomNavVisible ? styles.withBottomNav : ""}`}>
      <a href="#landing-content" className={styles.skipLink}>
        Skip to content
      </a>
      <header className={styles.header}>
        <Link href="/" className={styles.brand} aria-label="Envitefy home">
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
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className={styles.headerActions}>
          <button type="button" onClick={() => openAuth("login")} className={styles.login}>
            Log in
          </button>
          <button type="button" onClick={onCreateEvent} className={styles.headerCreate}>
            Create your event <ArrowRight size={15} aria-hidden="true" />
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
        <LandingHowItWorks />
        <TemplateCollection />
        <GuestBenefits />
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
        <section className={styles.faq} aria-labelledby="faq-heading">
          <div className={styles.faqIntro}>
            <p className={styles.eyebrow}>Good to know</p>
            <h2 id="faq-heading">
              A few things
              <br />
              you might be wondering.
            </h2>
            <button type="button" onClick={openHelpChat} className={styles.textLink}>
              <MessageCircle size={17} aria-hidden="true" /> Ask Concierge
            </button>
          </div>
          <div className={styles.questions}>
            {questions.map(({ question, answer }) => (
              <details key={question} className={styles.question}>
                <summary>
                  {question}
                  <ChevronDown size={17} aria-hidden="true" />
                </summary>
                <p>{answer}</p>
              </details>
            ))}
            <Link href="/faq" className={styles.faqLink}>
              More questions? Visit our FAQ <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>
        </section>
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
      <ScrollAwareBottomNav
        items={bottomNavigation}
        initialActiveLabel="Templates"
        onCreateSelect={onCreateEvent}
        onConciergeSelect={openHelpChat}
        onMenuSelect={() => setMobileMenuOpen(true)}
        onVisibilityChange={setBottomNavVisible}
      />
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
    </div>
  );
}
