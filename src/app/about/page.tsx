import {
  ArrowRight,
  CalendarDays,
  ClipboardList,
  Gift,
  MapPinned,
  Megaphone,
  ScanText,
  Sparkles,
  Upload,
  UsersRound,
  WandSparkles,
} from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import GuestChatWidget from "@/components/guest-chat/GuestChatWidget";
import SnapEventPreview from "@/components/landing/SnapEventPreview";
import AnimatedButtonLabel from "@/components/ui/AnimatedButtonLabel";
import HeroSection from "@/components/ui/glassmorphism-trust-hero";
import { buildSiteOgImage, getRandomSiteOgImageUrl } from "@/lib/site-og-images";
import AboutTopNav from "./AboutTopNav";

const siteOgImageUrl = getRandomSiteOgImageUrl();

export const metadata: Metadata = {
  title: "About Envitefy | Live Event Pages, RSVPs & Smart Signups",
  description:
    "Envitefy helps hosts turn invites, PDFs, flyers, schedules, and from-scratch plans into live event pages with RSVPs, registry links, calendar saves, smart signups, and updates.",
  openGraph: {
    title: "About Envitefy",
    description:
      "Create hosted event pages, live cards, RSVP flows, smart signups, registry links, maps, calendars, and updates from one shareable link.",
    url: "https://envitefy.com/about",
    siteName: "Envitefy",
    images: [buildSiteOgImage(siteOgImageUrl, "Envitefy event pages preview")],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "About Envitefy",
    description:
      "Live event pages, RSVP flows, smart signups, registry links, maps, calendars, and updates from one shareable link.",
    images: [siteOgImageUrl],
  },
  alternates: { canonical: "/about" },
};

const productPillars = [
  {
    icon: Sparkles,
    title: "Live cards and hosted pages",
    description:
      "Design the invitation, publish the details, and keep guests pointed at one current page instead of a static image.",
  },
  {
    icon: ScanText,
    title: "Snap from messy inputs",
    description:
      "Upload an invite, flyer, PDF, screenshot, or schedule and turn it into structured event details you can review.",
  },
  {
    icon: UsersRound,
    title: "Event pages for real plans",
    description:
      "Give hosts and guests one page for timing, venue notes, schedules, maps, updates, and useful links.",
  },
  {
    icon: ClipboardList,
    title: "RSVPs and smart signups",
    description:
      "Collect attendance, helper slots, chaperone needs, potluck items, and participant responses without another scattered thread.",
  },
  {
    icon: Gift,
    title: "Registry and resource links",
    description:
      "Keep gift registries, tickets, hotel blocks, forms, resource links, and supporting pages beside the event details.",
  },
  {
    icon: CalendarDays,
    title: "Calendar-ready coordination",
    description:
      "Dates, times, locations, and time zones stay structured so guests can save the event and return for updates.",
  },
] as const;

const workflowSteps = [
  {
    icon: Upload,
    label: "Start",
    title: "Create from scratch or bring the file you already have.",
    description:
      "Use Snap or the event concierge depending on whether you are creating from scratch or cleaning up an existing invite, flyer, packet, or schedule.",
  },
  {
    icon: WandSparkles,
    label: "Organize",
    title: "Turn details into a usable guest experience.",
    description:
      "Envitefy keeps the title, time, venue, schedule, RSVP, maps, registry, notes, and signup needs connected to the same event record.",
  },
  {
    icon: Megaphone,
    label: "Share",
    title: "Send one link guests can open in a browser.",
    description:
      "Guests can view the latest page, RSVP, save to a calendar, open maps, follow links, and return later without downloading an app.",
  },
] as const;

const audienceCards = [
  {
    title: "Families and hosts",
    description:
      "Birthdays, showers, weddings, school events, team weekends, open houses, and hosted gatherings stay easier to share.",
  },
  {
    title: "Coaches and organizers",
    description:
      "Event packets, session timing, travel details, documents, and updates become one mobile-friendly destination.",
  },
  {
    title: "Guests and participants",
    description:
      "The important actions are easy to find: RSVP, calendar, map, registry, signup, and current event notes.",
  },
] as const;

const pageLinks = [
  { label: "How it works", href: "/how-it-works" },
  { label: "Snap", href: "/snap" },
  { label: "FAQ", href: "/faq" },
] as const;

function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
}: {
  eyebrow: string;
  title: string;
  description: string;
  align?: "left" | "center";
}) {
  return (
    <div className={align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
      <p className="text-xs font-bold uppercase text-[#2f6f64]">
        {eyebrow}
      </p>
      <h2
        className="mt-4 text-3xl font-semibold leading-tight text-[#202124] sm:text-5xl"
        style={{
          fontFamily: "var(--font-montserrat), var(--font-sans), sans-serif",
        }}
      >
        {title}
      </h2>
      <p className="mt-5 text-lg leading-8 text-[#52605c]">{description}</p>
    </div>
  );
}

export default function AboutPage() {
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://envitefy.com/",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "About",
        item: "https://envitefy.com/about",
      },
    ],
  };

  const aboutPageLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: "About Envitefy",
    url: "https://envitefy.com/about",
    description: metadata.description,
    about: [
      "hosted event pages",
      "live card invitations",
      "RSVP event pages",
      "smart signup forms",
      "event page publishing",
    ],
  };

  return (
    <>
      <main className="min-h-screen overflow-hidden bg-[#f7f8f3] text-[#202124]">
        <AboutTopNav />
        <HeroSection />

        <section id="what-we-build" className="scroll-mt-28 px-4 py-16 sm:px-6 lg:py-24">
          <div className="mx-auto max-w-7xl">
            <SectionHeading
              eyebrow="What we build"
              title="A practical event system, not another static invite."
              description="Envitefy connects creation, guest communication, and follow-through. The page can be beautiful, but the real value is that every important action has a dependable home."
              align="center"
            />

            <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {productPillars.map(({ icon: Icon, title, description }) => (
                <article
                  key={title}
                  className="rounded-lg border border-[#d9ded3] bg-white p-6 shadow-[0_20px_55px_rgba(32,49,55,0.08)]"
                >
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-[#edf9f5] text-[#2f6f64] shadow-[0_10px_24px_rgba(47,111,100,0.1)]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3
                    className="mt-5 text-xl font-semibold text-[#202124]"
                    style={{
                      fontFamily: "var(--font-montserrat), var(--font-sans), sans-serif",
                    }}
                  >
                    {title}
                  </h3>
                  <p className="mt-3 text-base leading-7 text-[#52605c]">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          id="how-it-works"
          className="scroll-mt-28 border-y border-[#d9ded3] bg-white/72 px-4 py-16 sm:px-6 lg:py-24"
        >
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start">
              <div className="lg:sticky lg:top-10">
                <SectionHeading
                  eyebrow="How it works now"
                  title="From source file or blank plan to one current guest page."
                  description="The product has grown past OCR. Envitefy now supports the full path from event creation to public sharing, guest actions, and updates."
                />
                <div className="mt-8 flex flex-wrap gap-3">
                  {pageLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="rounded-full border border-[#d9ded3] bg-white px-4 py-2 text-sm font-semibold text-[#203137] transition hover:border-[#aebbac] hover:bg-[#edf9f5]"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                {workflowSteps.map(({ icon: Icon, label, title, description }, index) => (
                  <article
                    key={label}
                    className="grid gap-4 rounded-lg border border-[#d9ded3] bg-white p-5 shadow-[0_18px_48px_rgba(32,49,55,0.08)] sm:grid-cols-[auto_minmax(0,1fr)] sm:p-6"
                  >
                    <div className="flex items-center gap-3 sm:block">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#fff4df] text-[#9a5b18]">
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="rounded-full border border-[#d9ded3] bg-[#f7f8f3] px-3 py-1 text-xs font-bold uppercase text-[#6f7b75] sm:mt-3 sm:inline-flex">
                        {String(index + 1).padStart(2, "0")} {label}
                      </span>
                    </div>
                    <div>
                      <h3
                        className="text-xl font-semibold text-[#202124]"
                        style={{
                          fontFamily: "var(--font-montserrat), var(--font-sans), sans-serif",
                        }}
                      >
                        {title}
                      </h3>
                      <p className="mt-3 text-base leading-7 text-[#52605c]">{description}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="product-proof" className="scroll-mt-28 px-4 py-16 sm:px-6 lg:py-24">
          <div className="mx-auto max-w-7xl space-y-10">
            <SectionHeading
              eyebrow="Product proof"
              title="Built around the event types that create real coordination work."
              description="Snap supports broad event-page patterns for hosts who need cleaner sharing, better guest actions, and details that stay current."
              align="center"
            />

            <div className="grid gap-8 xl:grid-cols-2">
              <article className="overflow-hidden rounded-lg border border-[#d9ded3] bg-white p-4 shadow-[0_28px_70px_rgba(32,49,55,0.1)] sm:p-6">
                <div className="px-2 pb-4">
                  <div className="inline-flex items-center gap-2 rounded-full border border-[#a4dece] bg-[#edf9f5] px-4 py-2 text-sm font-semibold text-[#126250]">
                    <Sparkles className="h-4 w-4" />
                    Hosted event pages
                  </div>
                  <p className="mt-4 text-base leading-7 text-[#52605c]">
                    Hosted pages keep the invitation, schedule, RSVP, directions, registry links,
                    calendar actions, and updates attached to one guest-friendly destination.
                  </p>
                </div>
                <div className="overflow-hidden rounded-lg border border-[#d9ded3] bg-[#f7f8f3] p-3">
                  <Image
                    src="/images/landing/hero/garden-vows-desktop.webp"
                    alt="Hosted event page preview"
                    width={1200}
                    height={900}
                    sizes="(min-width: 1280px) 40vw, 92vw"
                    className="aspect-[4/3] w-full rounded-lg object-cover object-top shadow-[0_18px_46px_rgba(32,49,55,0.12)]"
                  />
                </div>
              </article>

              <article className="overflow-hidden rounded-lg border border-[#d9ded3] bg-white p-4 shadow-[0_24px_64px_rgba(32,49,55,0.08)] sm:p-6">
                <div className="px-2 pb-4">
                  <div className="inline-flex items-center gap-2 rounded-full border border-[#f4cf8d] bg-[#fff7e8] px-4 py-2 text-sm font-semibold text-[#8a450c]">
                    <ScanText className="h-4 w-4" />
                    Snap-to-page workflow
                  </div>
                  <p className="mt-4 text-base leading-7 text-[#52605c]">
                    A flyer, invite, image, schedule, or PDF can become an editable event draft
                    instead of another screenshot buried in a group chat.
                  </p>
                </div>
                <SnapEventPreview />
              </article>
            </div>
          </div>
        </section>

        <section
          id="who-it-serves"
          className="scroll-mt-28 bg-[#171222] px-4 py-16 text-white sm:px-6 lg:py-24"
        >
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase text-[#b8e0d4]">
                Who it serves
              </p>
              <h2
                className="mt-4 text-3xl font-semibold leading-tight text-[#ffffff] sm:text-5xl"
                style={{
                  color: "#ffffff",
                  fontFamily: "var(--font-montserrat), var(--font-sans), sans-serif",
                }}
              >
                A cleaner loop for hosts, organizers, and guests.
              </h2>
              <p className="mt-5 text-lg leading-8 text-white/72">
                The goal is simple: make important event information easier to create, easier to
                share, and easier to trust after the first message is sent.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {audienceCards.map((card, index) => (
                <article
                  key={card.title}
                  className="rounded-lg border border-white/12 bg-white/[0.08] p-5 shadow-[0_20px_48px_rgba(0,0,0,0.16)]"
                >
                  <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg bg-white text-[#203137]">
                    {index === 0 ? (
                      <UsersRound className="h-5 w-5" />
                    ) : index === 1 ? (
                      <ClipboardList className="h-5 w-5" />
                    ) : (
                      <MapPinned className="h-5 w-5" />
                    )}
                  </div>
                  <h3
                    className="text-base font-semibold text-[#ffffff]"
                    style={{ color: "#ffffff" }}
                  >
                    {card.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-white/70">{card.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="start" className="scroll-mt-28 px-4 py-16 sm:px-6 lg:py-24">
          <div className="mx-auto max-w-5xl text-center">
            <p className="text-xs font-bold uppercase text-[#2f6f64]">
              Start where you are
            </p>
            <h2
              className="mt-4 text-3xl font-semibold leading-tight text-[#202124] sm:text-5xl"
              style={{
                fontFamily: "var(--font-montserrat), var(--font-sans), sans-serif",
              }}
            >
              Create a hosted event page or turn an existing file into a cleaner event.
            </h2>
            <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-[#52605c]">
              Envitefy supports both sides of the product definition: events you are creating and
              events you are organizing from a file, flyer, invite, packet, or schedule.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/snap"
                className="cta-shell h-14 rounded-full bg-[#203137] px-7 text-base font-semibold text-white shadow-[0_20px_44px_rgba(32,49,55,0.2)] transition-all hover:-translate-y-0.5 hover:bg-[#2b4148]"
              >
                <AnimatedButtonLabel label="Start with Snap" icon={ArrowRight} />
              </Link>
              <Link
                href="/how-it-works"
                className="cta-shell h-14 rounded-full border border-[#d9ded3] bg-white px-7 text-base font-semibold text-[#203137] transition-all hover:-translate-y-0.5 hover:bg-[#edf9f5]"
              >
                <AnimatedButtonLabel label="How it works" />
              </Link>
              <Link
                href="/contact"
                className="cta-shell h-14 rounded-full border border-transparent px-7 text-base font-semibold text-[#52605c] transition-all hover:text-[#203137]"
              >
                <AnimatedButtonLabel label="Contact us" />
              </Link>
            </div>
          </div>
        </section>

        <Script id="ld-breadcrumb-about" type="application/ld+json" strategy="afterInteractive">
          {JSON.stringify(breadcrumbLd)}
        </Script>
        <Script id="ld-about-page" type="application/ld+json" strategy="afterInteractive">
          {JSON.stringify(aboutPageLd)}
        </Script>
      </main>
      <GuestChatWidget />
    </>
  );
}
