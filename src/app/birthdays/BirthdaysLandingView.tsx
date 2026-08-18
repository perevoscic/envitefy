import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  MapPin,
  MessageCircle,
  Sparkles,
  Users,
  Utensils,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import type { CSSProperties, ReactNode } from "react";
import LandingHeroMedia from "@/components/landing/LandingHeroMedia";
import SignedOutPageChrome from "@/components/navigation/SignedOutPageChrome";
import { landingHeroGalleries } from "@/lib/landing-hero-galleries";
import type { UseCasePage } from "../category-pages/category-page-data";

const themeCards = [
  {
    title: "Dino explorer",
    note: "Roars, fossils & big adventures",
    image: "/themes/dino-explorer-main.jpg",
    className: "md:col-span-2 md:row-span-2",
  },
  {
    title: "Fairy garden",
    note: "Flowers, sparkle & wonder",
    image: "/themes/flower-fairy-main.jpg",
    className: "",
  },
  {
    title: "Blast off",
    note: "A party among the stars",
    image: "/themes/space-rocket-main.jpg",
    className: "",
  },
  {
    title: "Glow party",
    note: "Neon fun for bigger kids",
    image: "/themes/glow-disco-main.jpg",
    className: "md:col-span-2",
  },
] as const;

const setupSteps = [
  {
    number: "01",
    label: "Choose the feeling",
    body: "Start with a theme, a photo, or the invitation you already made.",
    image: "/images/marketing/birthday-step-theme.png",
  },
  {
    number: "02",
    label: "Add the useful details",
    body: "RSVP, headcount, food notes, schedule, directions, and gifts.",
    image: "/images/marketing/birthday-step-details.png",
  },
  {
    number: "03",
    label: "Share one living link",
    body: "Text it once, then update the same page whenever plans change.",
    image: "/images/marketing/birthday-step-share.png",
  },
] as const;

function SectionIntro({
  eyebrow,
  title,
  body,
  centered = false,
}: {
  eyebrow: string;
  title: string;
  body?: string;
  centered?: boolean;
}) {
  return (
    <div className={centered ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#b65f36]">{eyebrow}</p>
      <h2 className="mt-4 text-3xl font-semibold leading-[1.06] tracking-[-0.04em] text-[#2d211c] sm:text-5xl">
        {title}
      </h2>
      {body ? <p className="mt-5 text-base leading-8 text-[#75645b] sm:text-lg">{body}</p> : null}
    </div>
  );
}

function HeroPreview({ page }: { page: UseCasePage }) {
  return (
    <div className="relative w-full max-w-[28rem] justify-self-end overflow-hidden rounded-lg border border-white/22 bg-white/90 p-4 text-[#18131f] shadow-[0_30px_90px_rgba(9,4,19,0.34)] backdrop-blur-xl sm:p-5">
      <div className="flex items-start justify-between gap-4 border-b border-[#e5ded6] pb-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase text-[#6e6276]">{page.eyebrow}</p>
          <h2 className="mt-2 text-xl font-semibold leading-tight text-[#17111e]">
            {page.preview.eventTitle}
          </h2>
          <p className="mt-1 text-sm leading-6 text-[#6b6070]">{page.preview.eventMeta}</p>
        </div>
        <div
          className="grid h-12 w-12 shrink-0 place-items-center rounded-lg text-white shadow-[0_14px_30px_rgba(18,13,28,0.22)]"
          style={{ backgroundColor: page.theme.accent }}
        >
          <Sparkles className="h-5 w-5" aria-hidden="true" />
        </div>
      </div>

      <div className="mt-4 grid gap-2">
        {page.preview.statusRows.map((row) => (
          <div
            key={`${page.slug}-${row.label}`}
            className="flex items-center justify-between gap-3 rounded-lg border border-[#ece5dc] bg-[#fffaf5] px-3 py-2"
          >
            <span className="text-sm font-medium text-[#665d68]">{row.label}</span>
            <span className="text-sm font-bold text-[#1e1725]">{row.value}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {page.preview.chips.map((chip) => (
          <span
            key={`${page.slug}-${chip}`}
            className="inline-flex items-center gap-1 rounded-full border border-[#e8ded2] bg-white px-3 py-1 text-xs font-semibold text-[#312438]"
          >
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
            {chip}
          </span>
        ))}
      </div>
    </div>
  );
}

function ThemeCard({
  title,
  note,
  image,
  className,
  href,
}: {
  title: string;
  note: string;
  image: string;
  className: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className={`group relative min-h-72 overflow-hidden rounded-[2rem] bg-[#2d211c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b65f36] focus-visible:ring-offset-4 ${className}`}
    >
      <Image
        src={image}
        alt=""
        fill
        sizes="(max-width: 768px) 100vw, 50vw"
        className="object-cover transition duration-700 motion-safe:group-hover:scale-[1.04]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/5 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-7">
        <p className="text-2xl font-semibold tracking-[-0.03em]">{title}</p>
        <div className="mt-2 flex items-center justify-between gap-4">
          <p className="text-sm text-white/70">{note}</p>
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-[#2d211c] transition group-hover:translate-x-1">
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function EventPageCard({ primaryHref }: { primaryHref: string }) {
  return (
    <div className="relative z-[2] overflow-hidden rounded-[2rem] border border-white/60 bg-white/95 shadow-[0_30px_90px_rgba(44,27,18,0.25)] backdrop-blur-xl">
      <div className="border-b border-[#eee4dc] p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b65f36]">
              Maya is turning 8
            </p>
            <h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[#2d211c]">
              Rainbow Park Party
            </h3>
          </div>
          <Image
            src="/phone-placeholders/birthday-maya.jpeg"
            alt="Maya"
            width={52}
            height={52}
            className="h-13 w-13 rounded-full object-cover ring-4 ring-[#fff2e9]"
          />
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2 text-sm text-[#65544b]">
          <p className="flex items-center gap-2 rounded-xl bg-[#fff6ef] px-3 py-2.5">
            <CalendarDays className="h-4 w-4 text-[#b65f36]" aria-hidden="true" />
            May 16
          </p>
          <p className="flex items-center gap-2 rounded-xl bg-[#fff6ef] px-3 py-2.5">
            <Clock3 className="h-4 w-4 text-[#b65f36]" aria-hidden="true" />
            2–4 PM
          </p>
          <p className="col-span-2 flex items-center gap-2 rounded-xl bg-[#fff6ef] px-3 py-2.5">
            <MapPin className="h-4 w-4 text-[#b65f36]" aria-hidden="true" />
            Oak Pavilion · East entrance
          </p>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-[#2d211c]">Household RSVP</p>
          <span className="rounded-full bg-[#e4f5e9] px-2.5 py-1 text-[10px] font-bold text-[#337052]">
            OPEN
          </span>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {[
            ["Yes", true],
            ["Maybe", false],
            ["No", false],
          ].map(([label, selected]) => (
            <span
              key={String(label)}
              className={`rounded-xl px-2 py-2 text-center text-xs font-bold ${
                selected ? "bg-[#337052] text-white" : "border border-[#e8ddd5] text-[#806d62]"
              }`}
            >
              {String(label)}
            </span>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <span className="rounded-xl border border-[#e8ddd5] p-3 text-xs text-[#806d62]">
            Kids <strong className="float-right text-[#2d211c]">2</strong>
          </span>
          <span className="rounded-xl border border-[#e8ddd5] p-3 text-xs text-[#806d62]">
            Adults <strong className="float-right text-[#2d211c]">2</strong>
          </span>
        </div>
        <Link
          href={primaryHref}
          className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[#2d2540] px-5 text-sm font-bold text-white transition hover:bg-[#453861]"
        >
          Send our RSVP
        </Link>
      </div>
    </div>
  );
}

function PhotoFeature({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <div className="flex gap-4">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white text-[#b65f36] shadow-sm">
        {icon}
      </span>
      <div>
        <h3 className="font-semibold text-[#2d211c]">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-[#75645b]">{body}</p>
      </div>
    </div>
  );
}

export default function BirthdaysLandingView({ page }: { page: UseCasePage }) {
  const pageUrl = `https://envitefy.com${page.path}`;
  const primaryHref = `${page.path}?auth=signup`;
  const cssVars = {
    "--use-case-accent": page.theme.accent,
    "--use-case-accent-dark": page.theme.accentDark,
    "--use-case-accent-soft": page.theme.accentSoft,
    "--use-case-ink": page.theme.ink,
    "--use-case-surface": page.theme.surface,
  } as CSSProperties;

  const webPageLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: page.metadataTitle,
    url: pageUrl,
    description: page.description,
    about: page.keywords,
    isPartOf: { "@type": "WebSite", name: "Envitefy", url: "https://envitefy.com" },
  };

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: page.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };

  return (
    <div
      style={cssVars}
      className="min-h-screen bg-[#fffaf6] text-[var(--use-case-ink)] selection:bg-[#ffd5bd]"
    >
      <SignedOutPageChrome
        activeBottomNavLabel="Menu"
        brandHref="/"
        topNavVariant="transparent-dark"
      />

      <main>
        <section className="relative isolate flex min-h-[100svh] items-end overflow-hidden">
          <LandingHeroMedia images={landingHeroGalleries.birthdays} />
          <div className="relative z-[1] mx-auto grid w-full max-w-7xl items-end gap-10 px-5 pb-[calc(7.5rem+env(safe-area-inset-bottom))] pt-32 sm:px-8 md:pb-14 lg:grid-cols-[minmax(0,1fr)_minmax(21rem,0.48fr)] lg:px-10">
            <div className="max-w-4xl text-white">
              <p className="text-sm font-bold uppercase text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)]">
                {page.eyebrow}
              </p>
              <h1 className="mt-5 max-w-4xl text-[2.65rem] font-semibold leading-[1.03] !text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.55)] sm:text-6xl lg:text-7xl">
                {page.title}
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)] sm:text-xl sm:leading-8">
                {page.description}
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href={primaryHref}
                  className="inline-flex min-h-12 items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-[#17111e] shadow-[0_22px_54px_rgba(0,0,0,0.22)] transition hover:-translate-y-0.5"
                >
                  {page.primaryCta}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link
                  href={page.secondaryHref}
                  className="inline-flex min-h-12 items-center gap-2 rounded-full border border-white/28 bg-white/12 px-6 py-3 text-sm font-bold text-white backdrop-blur-md transition hover:bg-white/18"
                >
                  {page.secondaryCta}
                </Link>
              </div>
              <div className="mt-8 hidden max-w-2xl grid-cols-3 gap-2 sm:grid sm:gap-3">
                {page.stats.map((stat) => (
                  <div
                    key={`${page.slug}-hero-stat-${stat.label}`}
                    className="rounded-lg border border-white/20 bg-white/12 px-3 py-3 backdrop-blur-md"
                  >
                    <p className="text-2xl font-semibold leading-none text-white">{stat.value}</p>
                    <p className="mt-1 text-xs font-semibold uppercase text-white/68">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div className="hidden md:block">
              <HeroPreview page={page} />
            </div>
          </div>
        </section>

        <section className="px-5 py-20 sm:px-8 sm:py-28 lg:px-10">
          <div className="mx-auto max-w-7xl">
            <div className="grid items-end gap-8 lg:grid-cols-[1fr_auto]">
              <SectionIntro
                eyebrow="Made for their imagination"
                title="Start with the world they cannot stop talking about."
                body="Dinosaurs today. Disco next year. Choose a look that feels unmistakably theirs, then make every practical detail easy for the grown-ups."
              />
              <Link
                href={primaryHref}
                className="inline-flex min-h-12 items-center gap-2 text-sm font-bold text-[#9f4f2e] underline decoration-[#d9a48a] underline-offset-8 transition hover:text-[#71331d]"
              >
                Explore birthday themes
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
            <div className="mt-12 grid auto-rows-[17rem] gap-4 md:grid-cols-4">
              {themeCards.map((theme) => (
                <ThemeCard key={theme.title} {...theme} href={primaryHref} />
              ))}
            </div>
          </div>
        </section>

        <section
          id="birthday-live-page"
          className="scroll-mt-20 overflow-hidden bg-[#f2e9e2] px-5 py-20 sm:px-8 sm:py-28 lg:px-10"
        >
          <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.12fr_0.88fr]">
            <div className="relative min-h-[38rem] overflow-hidden rounded-[2.5rem]">
              <Image
                src="/phone-placeholders/birthday-pavilion.jpeg"
                alt="Colorful birthday party at a park pavilion"
                fill
                sizes="(max-width: 1024px) 100vw, 55vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
              <div className="absolute inset-x-5 bottom-5 sm:inset-x-auto sm:bottom-8 sm:right-8 sm:w-[24rem]">
                <EventPageCard primaryHref={primaryHref} />
              </div>
            </div>

            <div>
              <SectionIntro
                eyebrow="More than an invitation"
                title="One joyful page. No party-detail scavenger hunt."
                body="The design gets guests excited. The live page gives every parent the date, map, pickup time, gift note, and RSVP action in one calm place."
              />
              <div className="mt-9 space-y-6">
                <PhotoFeature
                  icon={<Users className="h-5 w-5" aria-hidden="true" />}
                  title="Household RSVP"
                  body="Count kids and adults separately, with allergy notes attached to the right family."
                />
                <PhotoFeature
                  icon={<MapPin className="h-5 w-5" aria-hidden="true" />}
                  title="Arrival without confusion"
                  body="Share the venue, correct entrance, parking, and pickup instructions."
                />
                <PhotoFeature
                  icon={<CalendarDays className="h-5 w-5" aria-hidden="true" />}
                  title="The details stay current"
                  body="Change the time or rain plan after sharing. The same link always shows the latest."
                />
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#21372c] px-5 py-20 text-white sm:px-8 sm:py-24 lg:px-10">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#d6d195]">
                The parent view
              </p>
              <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-[-0.04em] sm:text-5xl">
                Know the count before you order the pizza.
              </h2>
              <p className="mt-5 max-w-xl leading-8 text-white/65">
                A clean Host bar replaces the spreadsheet, the notes app, and the “who still
                hasn&apos;t answered?” text.
              </p>
              <Link
                href={primaryHref}
                className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-full bg-[#ffd66b] px-6 py-3 text-sm font-bold text-[#21372c]"
              >
                See your guest list
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>

            <div className="relative overflow-hidden rounded-[2.5rem] bg-white/[0.07] p-5 ring-1 ring-white/10 sm:p-8">
              <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-5">
                <div>
                  <p className="text-sm font-bold">Host bar</p>
                  <p className="mt-1 text-sm text-white/50">Maya&apos;s Rainbow Park Party</p>
                </div>
                <span className="rounded-full bg-[#dff5e7] px-3 py-1 text-xs font-bold text-[#267247]">
                  LIVE
                </span>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  ["16", "families"],
                  ["18", "kids"],
                  ["22", "adults"],
                  ["7", "pending"],
                ].map(([value, label]) => (
                  <div key={label} className="rounded-2xl bg-white/[0.08] p-4">
                    <p className="text-3xl font-semibold">{value}</p>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-white/45">
                      {label}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-3 rounded-2xl bg-white p-4 text-[#2d211c]">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#ffe8e7] text-[#b24f4a]">
                    <Utensils className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-sm font-bold">4 allergy notes</p>
                    <p className="text-xs text-[#806d62]">Ready to review</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-2xl bg-[#ffd66b] p-4 text-[#21372c]">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/45">
                    <MessageCircle className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-sm font-bold">7 reminders ready</p>
                    <p className="text-xs text-[#21372c]/65">For pending families</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-5 py-20 sm:px-8 sm:py-28 lg:px-10">
          <div className="mx-auto max-w-7xl">
            <SectionIntro
              eyebrow="Birthdays grow up too"
              title="From dinosaurs to dinner parties."
              body="Envitefy is playful when the birthday kid is eight, polished when the guest of honor is forty, and warm when the whole family gathers for eighty."
            />
            <div className="relative mt-12 min-h-[35rem] overflow-hidden rounded-[2.5rem]">
              <Image
                src="/images/marketing/use-case-birthday.webp"
                alt="An elegant multigenerational birthday celebration"
                fill
                sizes="100vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/20 to-transparent" />
              <div className="absolute inset-y-0 left-0 flex max-w-xl flex-col justify-end p-7 text-white sm:p-12">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#ffd9bf]">
                  Any age · any kind of party
                </p>
                <h3 className="mt-4 text-3xl font-semibold leading-tight tracking-[-0.04em] sm:text-5xl">
                  Milestones deserve more than a group text.
                </h3>
                <p className="mt-4 max-w-md leading-7 text-white/70">
                  Cocktail nights, backyard dinners, surprise parties, sweet sixteens, and landmark
                  birthdays—all with the right tone and the same useful guest tools.
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {["Sweet 16", "21st", "30th", "50th", "80th"].map((age) => (
                    <span
                      key={age}
                      className="rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-bold backdrop-blur"
                    >
                      {age}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-[#eadfd8] bg-white px-5 py-20 sm:px-8 sm:py-28 lg:px-10">
          <div className="mx-auto max-w-7xl">
            <SectionIntro
              eyebrow="From idea to invited"
              title="Three simple steps. Then cake."
              centered
            />
            <div className="mt-14 grid gap-5 md:grid-cols-3">
              {setupSteps.map((step) => (
                <article
                  key={step.number}
                  className="group overflow-hidden rounded-[2rem] border border-[#eadfd8] bg-[#fffaf6]"
                >
                  <div className="relative h-64 overflow-hidden">
                    <Image
                      src={step.image}
                      alt=""
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover transition duration-700 motion-safe:group-hover:scale-[1.04]"
                    />
                    <span className="absolute left-5 top-5 grid h-11 w-11 place-items-center rounded-full bg-white text-sm font-bold text-[#b65f36] shadow">
                      {step.number}
                    </span>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold tracking-[-0.02em] text-[#2d211c]">
                      {step.label}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-[#75645b]">{step.body}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 py-20 sm:px-8 sm:py-28 lg:px-10">
          <div className="mx-auto grid max-w-7xl gap-10 rounded-[2.5rem] bg-[#2d2540] p-6 text-white sm:p-10 lg:grid-cols-[0.72fr_1.28fr] lg:p-14">
            <div className="self-start lg:sticky lg:top-28">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#c9bbec]">
                Common questions
              </p>
              <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-[-0.04em] sm:text-4xl">
                Before you send the invite.
              </h2>
            </div>
            <div className="divide-y divide-white/10">
              {page.faqs.map((faq, index) => (
                <details key={faq.question} className="group py-2" open={index === 0}>
                  <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 rounded-xl py-3 font-semibold marker:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9bbec]">
                    {faq.question}
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/[0.08] text-white/70 transition group-open:rotate-90">
                      <ChevronRight className="h-4 w-4" aria-hidden="true" />
                    </span>
                  </summary>
                  <p className="max-w-2xl pb-3 pt-1 text-sm leading-7 text-white/60">
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 pb-24 sm:px-8 lg:px-10">
          <div className="relative mx-auto min-h-[30rem] max-w-7xl overflow-hidden rounded-[2.5rem]">
            <Image
              src="/themes/jungle-safari-main.jpg"
              alt=""
              fill
              sizes="100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/55" />
            <div className="relative flex min-h-[30rem] flex-col items-center justify-center px-6 py-14 text-center text-white">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#ffe099]">
                Make this birthday theirs
              </p>
              <h2 className="mt-5 max-w-3xl text-3xl font-semibold leading-tight tracking-[-0.04em] sm:text-6xl">
                The magic for them. The details handled for you.
              </h2>
              <Link
                href={page.primaryHref}
                className="mt-8 inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-[#ffd66b] px-7 py-4 text-sm font-bold text-[#21372c] shadow-lg transition hover:-translate-y-0.5"
              >
                {page.primaryCta}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Script id={`ld-use-case-webpage-${page.slug}`} type="application/ld+json">
        {JSON.stringify(webPageLd)}
      </Script>
      <Script id={`ld-use-case-faq-${page.slug}`} type="application/ld+json">
        {JSON.stringify(faqLd)}
      </Script>
    </div>
  );
}
