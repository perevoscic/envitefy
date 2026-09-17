"use client";

import { ArrowRight, CalendarDays, Camera, MapPinned, Share2, Upload, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useState } from "react";
import AuthModal from "@/components/auth/AuthModal";
import {
  TemplateMasonryCard,
  TemplateMasonryGrid,
} from "@/components/events/TemplateMasonryGallery";
import { FOOTBALL_GALLERY_DESIGNS } from "@/components/football-season-templates/footballGallery";
import FootballThumbnail from "@/components/football-season-templates/FootballThumbnail";
import LandingHeroMedia from "@/components/landing/LandingHeroMedia";
import SignedOutPageChrome from "@/components/navigation/SignedOutPageChrome";
import AnimatedButtonLabel from "@/components/ui/AnimatedButtonLabel";

const heroImages = [
  {
    src: "/images/landing/football/friday-night-team.webp",
    alt: "A football coach and team on the sideline under Friday night stadium lights",
    objectPosition: "65% center",
    headline: "One team. One season.",
    accent: "One place for every game.",
    description:
      "Keep your team on the same page. Bring schedules, travel details and updates together in one link for players and families.",
  },
  {
    src: "/images/landing/football/overhead-field.webp",
    alt: "An overhead view of a green football field with geometric yard lines in morning light",
    objectPosition: "60% center",
    headline: "See the whole season.",
    accent: "Plan every game.",
    description:
      "From the opener to the final whistle, keep every matchup, kickoff time and stadium together in one easy-to-follow schedule.",
  },
  {
    src: "/images/landing/football/daylight-game-action.webp",
    alt: "A running back in crimson carrying the football through a sunlit autumn game",
    objectPosition: "70% center",
    headline: "It’s game day.",
    accent: "Make every moment count.",
    description:
      "Give your crowd the kickoff time, ticket links and away-game directions before they leave. Let the action take it from there.",
  },
  {
    src: "/images/landing/football/locker-room-gear.webp",
    alt: "A leather football and cream helmet on a wooden locker-room bench in warm window light",
    objectPosition: "70% center",
    headline: "Ready before kickoff.",
    accent: "Every detail in place.",
    description:
      "Keep practice plans, team details and the latest updates together. Help everyone arrive prepared for the game ahead.",
  },
  {
    src: "/images/landing/football/sideline-families.webp",
    alt: "Families cheering for their local football team from the stands",
    objectPosition: "70% center",
    headline: "Bring your people.",
    accent: "We’ll help with the plan.",
    description:
      "Make it easier for families to show up and cheer. Share the schedule, parking notes and game-day updates in one familiar place.",
  },
];
const features = [
  {
    icon: CalendarDays,
    title: "Every game, one schedule",
    copy: "Keep upcoming matchups, kickoff times and stadiums together. Past games have their own place, with scores when available.",
  },
  {
    icon: MapPinned,
    title: "Ready for the road",
    copy: "Share away-game directions, parking notes, hotel details and ticket links so families can plan before leaving home.",
  },
  {
    icon: Users,
    title: "Your whole team, in sync",
    copy: "Bring team details, rosters, practices, attendance and updates into the same shareable season page.",
  },
];
const steps = [
  {
    title: "Choose your team’s look",
    copy: "Start with a football design, then make the colors, wording and hero image your own.",
  },
  {
    title: "Bring in the schedule",
    copy: "Upload a schedule, paste a public website link, or add your games yourself. Review the details before saving.",
  },
  {
    title: "Share the season",
    copy: "Publish when you’re ready and give players and families one link for the latest plan.",
  },
];
const faqs = [
  {
    question: "Can I create a single game or a full season?",
    answer:
      "Yes. Start with the same football designs for a game-day page or a season schedule. Add only the sections your team needs.",
  },
  {
    question: "Can I upload a schedule I already have?",
    answer:
      "Yes. In the football editor, use Upload / URL & Prefill to import a file or public website into the selected design. Review the imported details and explicitly save when you’re ready.",
  },
  {
    question: "Will my account start with football tools?",
    answer:
      "Yes. Sign up from the football page or gallery and Football becomes your default creation option. Your workspace starts with football, while Snap, Upload and sign-up forms stay available. You can add other categories in Settings.",
  },
  {
    question: "Can I still snap or upload an invitation?",
    answer:
      "Yes. Snap and Upload remain available for every account, whether you organize football, gymnastics or another kind of event.",
  },
];
const primaryCta =
  "cta-shell min-h-12 rounded-full bg-white px-6 py-3 text-sm font-semibold !text-[#183b2d] shadow-lg transition hover:bg-[#e8f3e5] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white";

export default function FootballLanding() {
  const { status } = useSession();
  const [destination, setDestination] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "signup">("signup");
  return (
    <main className="min-h-screen overflow-x-clip bg-[#f5f8f1] text-[#203b30]">
      <SignedOutPageChrome topNavVariant="transparent-dark" />
      <section id="hero" className="relative isolate flex min-h-[100svh] items-end overflow-hidden">
        <LandingHeroMedia images={heroImages} carousel>
          {(activeIndex) => (
            <div className="relative z-[1] mx-auto w-full max-w-7xl px-5 pb-[calc(7.5rem+env(safe-area-inset-bottom))] pt-44 sm:px-8 sm:pt-36 md:pb-20 lg:px-10">
              <div className="max-w-3xl text-white drop-shadow-[0_3px_18px_rgba(0,0,0,0.75)]">
                <p className="mb-7 inline-flex rounded-full border border-white/30 bg-black/25 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] backdrop-blur-md">
                  Football pages for teams & families
                </p>
                <h1 className="grid text-balance text-5xl font-light leading-[0.98] tracking-tight !text-white sm:text-6xl lg:text-[5.5rem]">
                  {heroImages.map((slide, index) => (
                    <span
                      key={slide.src}
                      data-hero-headline={index + 1}
                      aria-hidden={index !== activeIndex}
                      className={`col-start-1 row-start-1 transition-opacity duration-1000 motion-reduce:transition-none ${index === activeIndex ? "opacity-100" : "pointer-events-none select-none opacity-0"}`}
                    >
                      {slide.headline}
                      <span className="mt-3 block font-serif text-[0.8em] italic">
                        {slide.accent}
                      </span>
                    </span>
                  ))}
                </h1>
                <p className="mt-7 grid max-w-2xl text-lg leading-relaxed text-white sm:text-xl">
                  {heroImages.map((slide, index) => (
                    <span
                      key={slide.src}
                      data-hero-description={index + 1}
                      aria-hidden={index !== activeIndex}
                      className={`col-start-1 row-start-1 transition-opacity duration-1000 motion-reduce:transition-none ${index === activeIndex ? "opacity-100" : "pointer-events-none select-none opacity-0"}`}
                    >
                      {slide.description}
                    </span>
                  ))}
                </p>
                <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                  <Link href="#templates" className={primaryCta}>
                    <AnimatedButtonLabel label="Start your football page" icon={ArrowRight} />
                  </Link>
                  <Link
                    href="#how-it-works"
                    className="cta-shell min-h-12 rounded-full border border-white/40 bg-black/30 px-6 py-3 text-sm font-semibold !text-white backdrop-blur-md hover:bg-black/50"
                  >
                    See how it works
                  </Link>
                </div>
                <p className="mt-5 text-sm text-white">
                  Football first. Snap and Upload always included.
                </p>
              </div>
            </div>
          )}
        </LandingHeroMedia>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#53734e]">
          Built around your team
        </p>
        <h2 className="mt-4 max-w-3xl font-serif text-4xl leading-tight sm:text-5xl">
          From the first kickoff to the final whistle.
        </h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {features.map(({ icon: Icon, title, copy }) => (
            <article
              key={title}
              className="rounded-3xl border border-[#dce5d6] bg-white p-7 shadow-sm"
            >
              <Icon className="h-7 w-7 text-[#466740]" aria-hidden="true" />
              <h3 className="mt-6 text-xl font-semibold">{title}</h3>
              <p className="mt-3 leading-7 text-[#506256]">{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section
        id="templates"
        aria-label="Featured football templates"
        className="scroll-mt-24 bg-[#fbf8f5] px-5 py-16 sm:px-8 lg:px-10"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mb-9 flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#53734e]">
                Football designs
              </p>
              <h2 className="mt-3 font-serif text-4xl sm:text-5xl">Make it your team’s.</h2>
              <p className="mt-4 text-sm text-[#506256]">
                Choose a design, then add your schedule and team details.
              </p>
            </div>
            <Link
              href="/football/templates"
              className="inline-flex min-h-12 items-center gap-2 rounded-full border border-[#dce5d6] bg-white px-6 py-3 text-sm font-semibold hover:bg-[#edf4e8]"
            >
              Browse all {FOOTBALL_GALLERY_DESIGNS.length} designs{" "}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          <TemplateMasonryGrid>
            {FOOTBALL_GALLERY_DESIGNS.slice(0, 4).map((design) => (
              <TemplateMasonryCard
                key={design.id}
                designId={design.id}
                name={design.name}
                href={`/event/football/customize?templateId=${encodeURIComponent(design.id)}`}
                onClick={(event) => {
                  if (status === "authenticated") return;
                  event.preventDefault();
                  setAuthMode("signup");
                  setDestination(event.currentTarget.href);
                }}
              >
                <FootballThumbnail design={design} />
              </TemplateMasonryCard>
            ))}
          </TemplateMasonryGrid>
        </div>
      </section>

      <section
        id="how-it-works"
        className="scroll-mt-24 bg-[#183b2d] px-5 py-20 text-white sm:px-8 lg:px-10"
      >
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
          <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem]">
            <Image
              src="/images/landing/sports/sports-editorial-football.webp"
              alt="Football players on the field under stadium lights"
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#c7dec0]">
              How it works
            </p>
            <h2 className="mt-4 font-serif text-4xl leading-tight !text-white sm:text-5xl">
              Your next season starts here.
            </h2>
            <ol className="mt-9 space-y-7">
              {steps.map((step, index) => (
                <li key={step.title} className="flex gap-5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/30 font-semibold">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold !text-white">{step.title}</h3>
                    <p className="mt-2 leading-7 text-[#dfebda]">{step.copy}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <div className="flex gap-4 text-[#53734e]">
              <Camera aria-hidden="true" />
              <Upload aria-hidden="true" />
              <Share2 aria-hidden="true" />
            </div>
            <h2 className="mt-6 font-serif text-4xl">
              Football first.
              <br />
              Room for the rest of life.
            </h2>
            <p className="mt-5 max-w-md leading-7 text-[#506256]">
              Start with the tools your team needs. Snap invitations, upload schedules and create
              sign-up forms from the same account. Add other event categories in Settings whenever
              you need them.
            </p>
            <Link
              href="/snap"
              className="mt-6 inline-flex min-h-12 items-center gap-2 font-semibold underline underline-offset-4"
            >
              Explore Snap <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          <div>
            <h2 className="mb-5 text-2xl font-semibold">A few things to know</h2>
            {faqs.map((faq) => (
              <details key={faq.question} className="border-b border-[#d3dfcf] py-1">
                <summary className="cursor-pointer py-5 font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#466740]">
                  {faq.question}
                </summary>
                <p className="pb-5 leading-7 text-[#506256]">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
      <section className="bg-[#e4eddc] px-5 py-16 pb-[calc(7rem+env(safe-area-inset-bottom))] text-center md:pb-16">
        <h2 className="mx-auto max-w-3xl font-serif text-4xl sm:text-5xl">
          Give your team a home for the season.
        </h2>
        <Link href="/football/templates" className={`${primaryCta} mt-8 inline-flex`}>
          <AnimatedButtonLabel label="Choose your football design" icon={ArrowRight} />
        </Link>
      </section>
      <AuthModal
        open={Boolean(destination)}
        mode={authMode}
        onModeChange={setAuthMode}
        onClose={() => setDestination(null)}
        successRedirectUrl={destination || "/event/football"}
        signupIntent="football"
        description={
          authMode === "signup" ? "Create your account to customize your Football page." : undefined
        }
      />
    </main>
  );
}
