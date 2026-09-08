"use client";

import {
  ArrowDown,
  ArrowRight,
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
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useState } from "react";
import AuthModal from "@/components/auth/AuthModal";
import HeroTopNav from "@/components/navigation/HeroTopNav";

const navigation = [
  { label: "How it works", href: "#how-it-works" },
  { label: "What you can create", href: "#what-you-can-create" },
  { label: "FAQ", href: "#faq" },
];

const steps = [
  {
    title: "Tell us what’s happening",
    description:
      "Sign in and choose a Live Card, Flyer/Invitation, or Event Page. Describe your event, or use the + menu to upload a photo, screenshot, flyer, or PDF.",
    icon: MessageCircle,
  },
  {
    title: "Fill in the details together",
    description:
      "Share the date, time, location, and the look you have in mind. Concierge picks up the details you provide and asks for what’s missing. You can correct anything in the conversation.",
    icon: Paperclip,
  },
  {
    title: "Preview and make it yours",
    description:
      "Choose Generate preview when it appears. Open Preview to review the design and guest actions, then keep chatting to refine the wording, artwork, or event details.",
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
      "Create a Live Card for Maya’s 30th birthday. We’re having a garden dinner on October 17, 2026, at 6 PM at my home in Austin. Think lilac flowers and warm string lights. Ask me for the address and RSVP details.",
  },
  {
    label: "An event from an upload",
    prompt:
      "Turn this school fundraiser flyer into an event page. Use the date, time, and location from the upload, and help me check the details before I share it.",
  },
  {
    label: "A little help getting started",
    prompt:
      "I’m planning a baby shower and haven’t picked a theme yet. Help me with a few ideas and some invitation wording. We can work out the details together.",
  },
];

const faqs = [
  {
    question: "What is Envitefy Concierge?",
    answer:
      "It’s Envitefy’s conversational event creator. Start with your own words or an upload, and it helps collect the event details, draft invitation wording, and create a design you can review before publishing.",
  },
  {
    question: "What is a Live Card?",
    answer:
      "A Live Card is a shareable digital invitation with event details and useful guest actions. Depending on what you add, guests can RSVP, get directions, save the date to a calendar, or open a registry link.",
  },
  {
    question: "Do I need to have every detail ready?",
    answer:
      "No. Start with what you know. You can ask for ideas and wording, add details as you go, and preview a draft while optional details are unfinished. Review and complete the required event information before publishing.",
  },
  {
    question: "Does creating a preview publish my invitation?",
    answer:
      "No. Generating a preview and publishing are separate steps. Review the draft, check the event facts, and ask for changes before you choose to publish and share.",
  },
  {
    question: "Do my guests need an account or an app?",
    answer:
      "Guests can open your published link in a web browser without installing an app or creating an Envitefy account. If you enable RSVP, they provide the requested response details. You sign in to create and manage your own events.",
  },
];

const primaryButton =
  "inline-flex min-h-14 items-center justify-center gap-3 rounded-full bg-[#7041d9] px-7 py-4 text-sm font-semibold text-white shadow-[0_10px_30px_#7041d924] transition hover:bg-[#5d30c0] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#7041d9]";

function StartButton({ authenticated, onStart }: { authenticated: boolean; onStart: () => void }) {
  const content = (
    <>
      Start with Concierge <ArrowRight size={17} aria-hidden="true" />
    </>
  );
  return authenticated ? (
    <Link href="/chat" className={primaryButton}>
      {content}
    </Link>
  ) : (
    <button type="button" onClick={onStart} className={primaryButton}>
      {content}
    </button>
  );
}

export default function ConciergeLandingPage() {
  const { status } = useSession();
  const [authMode, setAuthMode] = useState<"login" | "signup">("signup");
  const [authOpen, setAuthOpen] = useState(false);
  const authenticated = status === "authenticated";
  function openAuth(mode: "login" | "signup") {
    setAuthMode(mode);
    setAuthOpen(true);
  }

  return (
    <div className="bg-[#fcfbf7] text-[#282330]">
      <HeroTopNav
        navLinks={navigation}
        mobileNavLinks={[{ label: "Home", href: "/" }, ...navigation]}
        primaryCtaLabel="Start with Concierge"
        authenticatedPrimaryHref="/chat"
        loginSuccessRedirectUrl="/chat"
        onGuestLoginAction={() => openAuth("login")}
        onGuestPrimaryAction={() => openAuth("signup")}
      />
      <main>
        <section className="relative overflow-hidden bg-[radial-gradient(ellipse_at_top_right,#eee7fb,transparent_65%)]">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 pb-16 pt-28 sm:px-8 sm:pt-32 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:pb-20">
            <div>
              <p className="mb-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#7041d9]">
                <Sparkles size={16} aria-hidden="true" /> Envitefy Concierge
              </p>
              <h1 className="max-w-xl font-serif text-[2.8rem] leading-[1.06] tracking-[-0.035em] sm:text-6xl lg:text-[4.2rem]">
                Your next celebration starts with{" "}
                <span className="text-[#7041d9]">a conversation.</span>
              </h1>
              <p className="mt-6 max-w-lg text-base leading-8 text-[#655b70] sm:text-lg">
                An idea, a few details, or a flyer you already have. Concierge helps turn it into a
                beautiful invitation and a shareable event your guests can use.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-5">
                <StartButton authenticated={authenticated} onStart={() => openAuth("signup")} />
                <a
                  href="#how-it-works"
                  className="inline-flex min-h-12 items-center gap-2 text-sm font-semibold text-[#655b70] hover:text-[#7041d9]"
                >
                  See how it works <ArrowDown size={15} aria-hidden="true" />
                </a>
              </div>
              <p className="mt-5 text-xs leading-6 text-[#756b7c]">
                Start with what you know. Preview before you publish.
              </p>
            </div>
            <figure className="mx-auto w-full max-w-[420px]">
              <div className="relative ml-8 overflow-hidden rounded-[2rem] shadow-[0_24px_70px_#59423826] sm:ml-12">
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
              <div className="relative -mt-5 mr-5 rounded-2xl border border-[#e6ddef] bg-white p-5 shadow-[0_12px_35px_#49316412] sm:mr-12">
                <p className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#7041d9]">
                  <MessageCircle size={14} aria-hidden="true" /> It starts with your words
                </p>
                <blockquote className="text-sm leading-6 text-[#655b70]">
                  “A garden dinner for Maya’s 30th. Lilac flowers, warm lights, and our favorite
                  people.”
                </blockquote>
              </div>
              <figcaption className="mt-4 text-center text-xs text-[#756b7c]">
                Illustrative invitation · Your event, your details, your style
              </figcaption>
            </figure>
          </div>
        </section>

        <section aria-label="Guest actions" className="border-y border-[#e8e2ec] bg-white/60">
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-6 py-7 sm:px-8 md:grid-cols-4">
            {[
              { icon: Users, label: "Collect RSVPs" },
              { icon: MapPin, label: "Share directions" },
              { icon: CalendarDays, label: "Save the date" },
              { icon: Share2, label: "Share one link" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3 text-sm font-medium">
                <Icon size={19} className="shrink-0 text-[#8965b7]" aria-hidden="true" />
                {label}
              </div>
            ))}
          </div>
        </section>

        <section
          id="how-it-works"
          className="mx-auto max-w-6xl scroll-mt-24 px-6 py-16 sm:px-8 lg:py-24"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7041d9]">
            How to use Concierge
          </p>
          <h2 className="mt-4 font-serif text-4xl tracking-tight sm:text-5xl">
            A few words. A clear next step.
          </h2>
          <ol className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map(({ title, description, icon: Icon }, index) => (
              <li key={title} className="border-t border-[#dbd1e5] pt-5">
                <div className="mb-6 flex items-center justify-between">
                  <span className="font-serif text-3xl text-[#b4a0c9]">0{index + 1}</span>
                  <Icon size={20} className="text-[#8965b7]" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-semibold leading-7">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-[#655b70]">{description}</p>
              </li>
            ))}
          </ol>
        </section>

        <section id="what-you-can-create" className="scroll-mt-24 bg-[#f1ecf7]">
          <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 sm:px-8 lg:grid-cols-2 lg:gap-20 lg:py-20">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7041d9]">
                More than a pretty invitation
              </p>
              <h2 className="mt-4 font-serif text-4xl leading-tight tracking-tight sm:text-5xl">
                Give the occasion
                <br />a place of its own.
              </h2>
              <p className="mt-5 text-base leading-8 text-[#655b70]">
                Birthday dinners, weddings, showers, school events, and everything you’re bringing
                people together for. Choose what you want to make, and Concierge helps you shape it.
              </p>
              <Link
                href="/showcase"
                className="mt-6 inline-flex min-h-12 items-center gap-2 text-sm font-semibold text-[#7041d9]"
              >
                Explore real Live Card examples <ArrowRight size={17} aria-hidden="true" />
              </Link>
            </div>
            <div className="divide-y divide-[#ded3e9]">
              {[
                {
                  title: "Live Card",
                  copy: "A visual invitation with event details and guest actions, including RSVP, directions, calendar saves, and registry links when configured.",
                },
                {
                  title: "Flyer / Invitation",
                  copy: "A designed invitation with wording and artwork tailored to your occasion. Review the look and refine it in the conversation.",
                },
                {
                  title: "Event Page",
                  copy: "A hosted page that brings your event information together, with the relevant details and links guests need.",
                },
              ].map((item) => (
                <div key={item.title} className="flex gap-4 py-6 first:pt-0">
                  <Check size={20} className="mt-1 shrink-0 text-[#7041d9]" aria-hidden="true" />
                  <div>
                    <h3 className="text-xl font-semibold">{item.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-[#655b70]">{item.copy}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-16 sm:px-8 lg:py-24">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7041d9]">
            Not sure what to say?
          </p>
          <h2 className="mt-4 font-serif text-4xl tracking-tight sm:text-5xl">
            Start something like this.
          </h2>
          <p className="mt-4 text-base leading-7 text-[#655b70]">
            Use these as inspiration. Your first message doesn’t have to be perfect.
          </p>
          <div className="mt-9 grid gap-5 md:grid-cols-3">
            {examples.map((example) => (
              <div key={example.label} className="rounded-2xl border border-[#e5deeb] bg-white p-6">
                <h3 className="text-sm font-semibold text-[#7041d9]">{example.label}</h3>
                <blockquote className="mt-4 text-sm leading-7 text-[#655b70]">
                  “{example.prompt}”
                </blockquote>
              </div>
            ))}
          </div>
        </section>

        <section id="faq" className="mx-auto max-w-3xl scroll-mt-24 px-6 pb-16 sm:px-8 lg:pb-24">
          <h2 className="mb-8 font-serif text-4xl tracking-tight">A few things to know.</h2>
          <div className="divide-y divide-[#e5deeb] border-y border-[#e5deeb]">
            {faqs.map((faq) => (
              <details key={faq.question} className="group py-5">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-5 text-base font-semibold [&::-webkit-details-marker]:hidden">
                  {faq.question}
                  <ChevronDown
                    size={18}
                    className="shrink-0 text-[#8965b7] transition group-open:rotate-180"
                    aria-hidden="true"
                  />
                </summary>
                <p className="pb-2 pt-3 text-sm leading-7 text-[#655b70]">{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="border-t border-[#e5deeb] bg-[#f1ecf7] px-6 py-16 text-center sm:px-8">
          <Sparkles size={26} className="mx-auto text-[#7041d9]" aria-hidden="true" />
          <h2 className="mx-auto mt-5 max-w-xl font-serif text-4xl leading-tight tracking-tight sm:text-5xl">
            What are we celebrating?
          </h2>
          <p className="mx-auto mb-7 mt-4 max-w-md text-base leading-7 text-[#655b70]">
            Bring your idea. We’ll help with the invitation.
          </p>
          <StartButton authenticated={authenticated} onStart={() => openAuth("signup")} />
          <p className="mt-4 text-xs text-[#756b7c]">
            Sign in or create an account to get started.
          </p>
        </section>
      </main>
      <AuthModal
        open={authOpen}
        mode={authMode}
        onClose={() => setAuthOpen(false)}
        onModeChange={setAuthMode}
        successRedirectUrl="/chat"
      />
    </div>
  );
}
