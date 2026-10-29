"use client";

import {
  CalendarDays,
  Check,
  ChevronDown,
  MapPin,
  MessageCircle,
  Paperclip,
  Share2,
  Sparkles,
  Users,
} from "lucide-react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useState } from "react";
import AuthModal from "@/components/auth/AuthModal";
import MarketingPage from "@/components/marketing/MarketingPage";
import styles from "@/components/marketing/ProductSportsLanding.module.css";
import HeroTopNav from "@/components/navigation/HeroTopNav";
import PublicConciergeWidget from "@/components/navigation/PublicConciergeWidget";
import ArrowFillButton from "@/components/ui/ArrowFillButton";
import ArrowFillLink from "@/components/ui/ArrowFillLink";

const navigation = [
  { label: "How it works", href: "#how-it-works" },
  { label: "What you can create", href: "#what-you-can-create" },
  { label: "FAQ", href: "#faq" },
];

const steps = [
  {
    title: "Tell us what’s happening",
    description:
      "Choose the guided Live Card builder, an Event Page template, or a Sign-up Form. Use Snap / Upload when you already have an invitation, flyer, screenshot, or PDF.",
    icon: MessageCircle,
  },
  {
    title: "Fill in the details together",
    description:
      "Enter the title, date, time, location, and guest details in the editor. Live Card Design collects your visual direction and optional reference image.",
    icon: Paperclip,
  },
  {
    title: "Preview and make it yours",
    description:
      "Review your artwork, wording and guest actions. Edit the details or design in the builder before explicitly saving or publishing.",
    icon: Sparkles,
  },
  {
    title: "Publish, then share your link",
    description:
      "Check the required details and publish when you’re ready. Send the link by text, email, or your group chat. Guests can open it in their browser.",
    icon: Share2,
  },
];

const examples = [
  {
    label: "A birthday worth celebrating",
    prompt:
      "Create a Live Card for Maya’s 30th birthday. We’re having a garden dinner on October 17, 2026, at 6 PM at my home in Austin. Think lilac flowers and warm string lights. Add the address and RSVP details in Event details.",
  },
  {
    label: "An event from an upload",
    prompt:
      "Turn this school fundraiser flyer into an event page. Use the date, time, and location from the upload, and help me check the details before I share it.",
  },
  {
    label: "A little help getting started",
    prompt:
      "I’m planning a baby shower and haven’t picked a theme yet. Help me with a few ideas and some invitation wording. Add the details in the Event Page editor.",
  },
];

const faqs = [
  {
    question: "What is Envitefy Create?",
    answer:
      "Envitefy offers a guided Live Card builder, Event Page template editors, and a separate Sign-up Form builder. Choose the format for your event, add your details, and review before publishing.",
  },
  {
    question: "What is a Live Card?",
    answer:
      "A Live Card is a shareable digital invitation with event details and useful guest actions. Depending on what you add, guests can RSVP, get directions, save the date to a calendar, or open a registry link.",
  },
  {
    question: "Do I need to have every detail ready?",
    answer:
      "No. Start with what you know and add details as you go. Save a private draft when you want to return later, and complete the required event information before publishing.",
  },
  {
    question: "Does creating a preview publish my invitation?",
    answer:
      "No. Generating a preview and publishing are separate steps. Review the draft, check the event facts, and edit any changes before you choose to publish and share.",
  },
  {
    question: "Do my guests need an account or an app?",
    answer:
      "Guests can open your published link in a web browser without installing an app or creating an Envitefy account. If you enable RSVP, they provide the requested response details. You sign in to create and manage your own events.",
  },
];

const primaryButton = styles.primary;

function StartButton({ authenticated, onStart }: { authenticated: boolean; onStart: () => void }) {
  return authenticated ? (
    <ArrowFillLink href="/live-cards" className={primaryButton} label="Create with Envitefy" />
  ) : (
    <ArrowFillButton onClick={onStart} className={primaryButton} label="Create with Envitefy" />
  );
}

export default function CreateLandingPage() {
  const { status } = useSession();
  const [authMode, setAuthMode] = useState<"login" | "signup">("signup");
  const [authOpen, setAuthOpen] = useState(false);
  const authenticated = status === "authenticated";
  function openAuth(mode: "login" | "signup") {
    setAuthMode(mode);
    setAuthOpen(true);
  }

  return (
    <MarketingPage tone="product" canvas="editorial" className={`${styles.editorial} ${styles.coordinated}`}>
      <HeroTopNav
        editorialTone="product"
        navLinks={navigation}
        variant="transparent-light"
        mobileNavLinks={[{ label: "Home", href: "/" }, ...navigation]}
        primaryCtaLabel="Create with Envitefy"
        authenticatedPrimaryHref="/live-cards"
        loginSuccessRedirectUrl="/"
        onGuestLoginAction={() => openAuth("login")}
        onGuestPrimaryAction={() => openAuth("signup")}
      />
      <main>
        <section id="hero">
          <div className={styles.hero}>
            <div>
              <p className={styles.eyebrow}>
                <Sparkles size={16} aria-hidden="true" /> Envitefy Create
              </p>
              <h1 className={styles.title}>
                Your idea. <em>A beautiful invitation.</em>
              </h1>
              <p className={styles.description}>
                An idea, a few details, or a flyer you already have. Envitefy Create helps turn it
                into a beautiful invitation and a shareable event your guests can use.
              </p>
              <div className={styles.actions}>
                <StartButton authenticated={authenticated} onStart={() => openAuth("signup")} />
                <ArrowFillLink
                  href="#how-it-works"
                  className="inline-flex min-h-12 items-center gap-2 rounded-full text-sm font-semibold text-[var(--marketing-muted)] [--arrow-fill-color:var(--marketing-accent)] [--arrow-fill-hover-ink:var(--marketing-paper)] [--arrow-fill-arrow-ink:var(--marketing-paper)] hover:text-[var(--marketing-accent)]"
                  label="See how it works"
                />
              </div>
              <p className="mt-5 text-xs leading-6 text-[var(--marketing-muted)]">
                Start with what you know. Preview before you publish.
              </p>
            </div>
            <figure className={`${styles.visual} mx-auto w-full max-w-[420px]`}>
              <div className="relative ml-4 overflow-hidden rounded-t-[47%] rounded-b-2xl shadow-[0_24px_70px_#59423826] sm:ml-8">
                <Image
                  src="/images/marketing/landing-hero-live-card.webp"
                  alt="A garden birthday dinner with lilac balloons, flowers, and string lights"
                  width={1024}
                  height={1536}
                  priority
                  sizes="(max-width: 640px) 80vw, 370px"
                  className="aspect-[4/5] w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#201524]/90 via-transparent to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                  <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/80">
                    You’re invited
                  </p>
                  <p className="mt-2 font-serif text-4xl leading-tight">Maya’s 30th</p>
                  <p className="mt-2 text-xs text-white/85">
                    A little garden magic. A lot to celebrate.
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2" aria-hidden="true">
                    {["RSVP", "Directions", "Calendar"].map((label) => (
                      <span
                        key={label}
                        className="rounded-full border border-white/30 bg-white/15 px-3 py-2 text-[10px] backdrop-blur-sm"
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="relative -mt-5 mr-5 rounded-2xl border border-[var(--marketing-line)] bg-[var(--marketing-surface)] p-5 shadow-[0_12px_35px_#49316412] sm:mr-12">
                <p className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--marketing-accent)]">
                  <MessageCircle size={14} aria-hidden="true" /> It starts with your words
                </p>
                <blockquote className="text-sm leading-6 text-[var(--marketing-muted)]">
                  “A garden dinner for Maya’s 30th. Lilac flowers, warm lights, and our favorite
                  people.”
                </blockquote>
              </div>
              <figcaption className="mt-4 text-center text-xs text-[var(--marketing-muted)]">
                Illustrative invitation · Your event, your details, your style
              </figcaption>
            </figure>
          </div>
        </section>

        <section
          aria-label="Guest actions"
          className="border-y border-[var(--marketing-line)] bg-[var(--marketing-surface)]"
        >
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-6 py-7 sm:px-8 md:grid-cols-4">
            {[
              { icon: Users, label: "Collect RSVPs" },
              { icon: MapPin, label: "Share directions" },
              { icon: CalendarDays, label: "Save the date" },
              { icon: Share2, label: "Share one link" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3 text-sm font-medium">
                <Icon
                  size={19}
                  className="shrink-0 text-[var(--marketing-accent)]"
                  aria-hidden="true"
                />
                {label}
              </div>
            ))}
          </div>
        </section>

        <section
          id="how-it-works"
          className="mx-auto max-w-6xl scroll-mt-24 px-6 py-16 sm:px-8 lg:py-24"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--marketing-accent)]">
            How to use Envitefy Create
          </p>
          <h2 className="mt-4 font-serif text-4xl tracking-tight sm:text-5xl">
            A few words. A clear next step.
          </h2>
          <ol className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map(({ title, description, icon: Icon }, index) => (
              <li key={title} className="border-t border-[var(--marketing-line)] pt-5">
                <div className="mb-6 flex items-center justify-between">
                  <span className="font-serif text-3xl text-[var(--marketing-accent)]">
                    0{index + 1}
                  </span>
                  <Icon size={20} className="text-[var(--marketing-accent)]" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-semibold leading-7">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-[var(--marketing-muted)]">
                  {description}
                </p>
              </li>
            ))}
          </ol>
        </section>

        <section id="what-you-can-create" className="scroll-mt-24 bg-[var(--marketing-soft)]">
          <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 sm:px-8 lg:grid-cols-2 lg:gap-20 lg:py-20">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--marketing-accent)]">
                More than a pretty invitation
              </p>
              <h2 className="mt-4 font-serif text-4xl leading-tight tracking-tight sm:text-5xl">
                Give the occasion
                <br />a place of its own.
              </h2>
              <p className="mt-5 text-base leading-8 text-[var(--marketing-muted)]">
                Birthday dinners, weddings, showers, school events, and everything you’re bringing
                people together for. Choose what you want to make, and Envitefy Create helps you
                shape it.
              </p>
              <ArrowFillLink
                href="/showcase"
                className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-full text-sm font-semibold text-[var(--marketing-accent)] [--arrow-fill-color:var(--marketing-accent)] [--arrow-fill-hover-ink:var(--marketing-paper)] [--arrow-fill-arrow-ink:var(--marketing-paper)]"
                label="Explore real Live Card examples"
              />
            </div>
            <div className="divide-y divide-[#ded3e9]">
              {[
                {
                  title: "Live Card",
                  copy: "A visual invitation with event details and guest actions, including RSVP, directions, calendar saves, and registry links when configured.",
                },
                {
                  title: "Flyer / Invitation",
                  copy: "A designed invitation with wording and artwork tailored to your occasion. Review the look and refine it in the editor.",
                },
                {
                  title: "Event Page",
                  copy: "A hosted page that brings your event information together, with the relevant details and links guests need.",
                },
              ].map((item) => (
                <div key={item.title} className="flex gap-4 py-6 first:pt-0">
                  <Check
                    size={20}
                    className="mt-1 shrink-0 text-[var(--marketing-accent)]"
                    aria-hidden="true"
                  />
                  <div>
                    <h3 className="text-xl font-semibold">{item.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-[var(--marketing-muted)]">
                      {item.copy}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-16 sm:px-8 lg:py-24">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--marketing-accent)]">
            Not sure what to say?
          </p>
          <h2 className="mt-4 font-serif text-4xl tracking-tight sm:text-5xl">
            Start something like this.
          </h2>
          <p className="mt-4 text-base leading-7 text-[var(--marketing-muted)]">
            Use these as inspiration for your design and event details.
          </p>
          <div className="mt-9 grid gap-5 md:grid-cols-3">
            {examples.map((example) => (
              <div
                key={example.label}
                className="rounded-2xl border border-[var(--marketing-line)] bg-[var(--marketing-surface)] p-6"
              >
                <h3 className="text-sm font-semibold text-[var(--marketing-accent)]">
                  {example.label}
                </h3>
                <blockquote className="mt-4 text-sm leading-7 text-[var(--marketing-muted)]">
                  “{example.prompt}”
                </blockquote>
              </div>
            ))}
          </div>
        </section>

        <section id="faq" className="mx-auto max-w-3xl scroll-mt-24 px-6 pb-16 sm:px-8 lg:pb-24">
          <h2 className="mb-8 font-serif text-4xl tracking-tight">A few things to know.</h2>
          <div className="divide-y divide-[var(--marketing-line)] border-y border-[var(--marketing-line)]">
            {faqs.map((faq) => (
              <details key={faq.question} className="group py-5">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-5 text-base font-semibold [&::-webkit-details-marker]:hidden">
                  {faq.question}
                  <ChevronDown
                    size={18}
                    className="shrink-0 text-[var(--marketing-accent)] transition group-open:rotate-180"
                    aria-hidden="true"
                  />
                </summary>
                <p className="pb-2 pt-3 text-sm leading-7 text-[var(--marketing-muted)]">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </section>

        <section className="border-t border-[var(--marketing-line)] bg-[var(--marketing-soft)] px-6 py-16 text-center sm:px-8">
          <Sparkles
            size={26}
            className="mx-auto text-[var(--marketing-accent)]"
            aria-hidden="true"
          />
          <h2 className="mx-auto mt-5 max-w-xl font-serif text-4xl leading-tight tracking-tight sm:text-5xl">
            What are we celebrating?
          </h2>
          <p className="mx-auto mb-7 mt-4 max-w-md text-base leading-7 text-[var(--marketing-muted)]">
            Bring your idea. We’ll help with the invitation.
          </p>
          <StartButton authenticated={authenticated} onStart={() => openAuth("signup")} />
          <p className="mt-4 text-xs text-[var(--marketing-muted)]">
            Sign in or create an account to get started.
          </p>
        </section>
      </main>
      <PublicConciergeWidget onSignupSelect={() => openAuth("signup")} />
      <AuthModal
        open={authOpen}
        mode={authMode}
        onClose={() => setAuthOpen(false)}
        onModeChange={setAuthMode}
        successRedirectUrl="/"
      />
    </MarketingPage>
  );
}
