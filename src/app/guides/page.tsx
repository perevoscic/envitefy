import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  FileText,
  ImageIcon,
  MapPinned,
  ScanText,
  Sparkles,
  Trophy,
  UsersRound,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";

import { buildSiteOgImage, getRandomSiteOgImageUrl } from "@/lib/site-og-images";

import GuidesTopNav from "./GuidesTopNav";
import { guidePages } from "./guide-content";

const SITE_URL = "https://envitefy.com";
const siteOgImageUrl = getRandomSiteOgImageUrl(SITE_URL);

export const metadata: Metadata = {
  title: "Envitefy Guides | Turn flyers, PDFs, and live cards into event pages",
  description:
    "Answer-focused Envitefy guides for turning PDFs, flyers, invites, schedules, and live cards into hosted event pages with RSVPs, maps, calendars, and guest sharing.",
  alternates: { canonical: "/guides" },
  openGraph: {
    title: "Envitefy Guides",
    description:
      "Guides for live cards, Snap uploads, RSVP event pages, guest sharing, and gymnastics meet pages.",
    url: `${SITE_URL}/guides`,
    siteName: "Envitefy",
    images: [buildSiteOgImage(siteOgImageUrl)],
    type: "website",
  },
};

const guideVisuals = {
  "pdf-to-event-page": {
    accent: "bg-[#fff4df] text-[#9a5b18]",
    bestFor: "PDF invites, school packets, meet schedules",
    icon: FileText,
    route: "Snap upload",
  },
  "flyer-to-event-page": {
    accent: "bg-[#f7edff] text-[#7650a2]",
    bestFor: "Flyers, screenshots, posters, image invites",
    icon: ImageIcon,
    route: "Snap upload",
  },
  "live-card-invitations": {
    accent: "bg-[#efeaff] text-[#6047b8]",
    bestFor: "Designed invites with RSVP and live details",
    icon: Sparkles,
    route: "Studio",
  },
  "rsvp-event-page": {
    accent: "bg-[#eaf7f0] text-[#317652]",
    bestFor: "Guest responses, calendar saves, maps",
    icon: UsersRound,
    route: "Event page",
  },
  "gymnastics-meet-page": {
    accent: "bg-[#eef3ff] text-[#395fba]",
    bestFor: "Schedules, venues, hotels, parent updates",
    icon: Trophy,
    route: "Gymnastics",
  },
  "share-event-page-without-app": {
    accent: "bg-[#fff0f2] text-[#a04f62]",
    bestFor: "Textable links guests can open in a browser",
    icon: MapPinned,
    route: "Guest sharing",
  },
} as const;

const startingPoints = [
  {
    title: "I have a file already",
    body: "Use Snap when the source is a flyer, PDF, screenshot, packet, poster, or schedule.",
    href: "/guides/flyer-to-event-page",
    icon: ScanText,
  },
  {
    title: "I need a better invite",
    body: "Use Studio when you want a polished live card connected to event details and actions.",
    href: "/guides/live-card-invitations",
    icon: Sparkles,
  },
  {
    title: "I need guest responses",
    body: "Use an RSVP event page when the important part is collecting answers and reducing repeat questions.",
    href: "/guides/rsvp-event-page",
    icon: ClipboardList,
  },
  {
    title: "I am organizing families",
    body: "Use gymnastics and signup flows when schedules, helpers, supply lists, and updates matter.",
    href: "/guides/gymnastics-meet-page",
    icon: Trophy,
  },
];

const guideStats = [
  { value: "6", label: "Focused guides" },
  { value: "3", label: "Creation surfaces" },
  { value: "1", label: "Guest-ready link" },
];

const pageFont = "var(--font-montserrat), var(--font-sans), system-ui, sans-serif";

export default function GuidesPage() {
  const collectionLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Envitefy Guides",
    url: `${SITE_URL}/guides`,
    description:
      "Answer-focused guides for live event pages, Snap uploads, RSVPs, guest sharing, and gymnastics meet pages.",
    mainEntity: {
      "@type": "ItemList",
      itemListElement: guidePages.map((guide, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: guide.h1,
        url: `${SITE_URL}/guides/${guide.slug}`,
      })),
    },
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: `${SITE_URL}/`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Guides",
        item: `${SITE_URL}/guides`,
      },
    ],
  };

  return (
    <main
      className="min-h-screen overflow-hidden bg-[#f7f8f3] text-[#202124]"
      style={{ fontFamily: pageFont }}
    >
      <GuidesTopNav />
      <section className="relative">
        <img
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover opacity-[0.28]"
          src="/images/about/hero/envitefy-about-hero-poster.webp"
          style={{ objectPosition: "64% center" }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(247,248,243,0.98)_0%,rgba(247,248,243,0.88)_55%,rgba(247,248,243,0.62)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(247,248,243,0.18),rgba(247,248,243,0.96))]" />

        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 pb-12 pt-32 sm:px-6 lg:grid-cols-12 lg:px-8 lg:pb-16 lg:pt-36">
          <div className="lg:col-span-7">
            <p className="inline-flex rounded-full border border-white/70 bg-white/58 px-4 py-2 text-xs font-bold uppercase text-[#705b7c] shadow-[0_14px_40px_rgba(88,69,92,0.08)] backdrop-blur-md">
              Guides for live event pages, uploads, RSVPs, and gymnastics meets
            </p>
            <h1
              className="mt-8 max-w-5xl text-5xl font-semibold leading-[0.98] text-[#202124] sm:text-6xl lg:text-7xl"
              style={{ fontFamily: pageFont }}
            >
              Resources for turning files, cards, RSVPs, and meet packets into live event pages.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#4f5c5a]">
              Practical Envitefy guides for parents, teachers, coaches, hosts, and guests turning
              flyers, PDFs, live cards, schedules, and signups into one shareable page.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                className="inline-flex min-h-14 items-center justify-center gap-3 rounded-full bg-[#203137] px-7 py-4 text-sm font-semibold text-white shadow-[0_18px_45px_rgba(32,49,55,0.18)] transition hover:bg-[#2b4148]"
                href="/snap"
              >
                Start with a file
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                className="inline-flex min-h-14 items-center justify-center gap-3 rounded-full border border-white/80 bg-white/58 px-7 py-4 text-sm font-semibold text-[#202124] shadow-[0_14px_40px_rgba(32,49,55,0.08)] backdrop-blur-md transition hover:bg-white/80"
                href="/studio"
              >
                Design a live card
              </Link>
            </div>

            <div className="mt-9 grid max-w-2xl grid-cols-3 gap-5">
              {guideStats.map((stat) => (
                <div key={stat.label}>
                  <div className="text-3xl font-bold leading-none text-[#2f6f64]">{stat.value}</div>
                  <div className="mt-2 text-xs font-semibold text-[#5d6863]">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="rounded-lg border border-white/68 bg-white/52 p-6 shadow-[0_28px_80px_rgba(32,49,55,0.12)] backdrop-blur-md">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/72 ring-1 ring-[#50605e]/16">
                  <CheckCircle2 className="h-6 w-6 text-[#2f6f64]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#62706b]">Guide match</p>
                  <h2
                    className="text-3xl font-bold text-[#202124]"
                    style={{ fontFamily: pageFont }}
                  >
                    Start with what you have.
                  </h2>
                </div>
              </div>

              <div className="mt-7 space-y-3">
                {startingPoints.slice(0, 3).map((item, index) => {
                  const Icon = item.icon;

                  return (
                    <Link
                      className="flex items-start gap-4 rounded-lg border border-white/68 bg-white/58 p-4 transition hover:bg-white/78"
                      href={item.href}
                      key={item.title}
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#edf9f5] text-[#16705d]">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase text-[#6f7b75]">
                          Step {index + 1}
                        </p>
                        <h3
                          className="mt-1 font-bold text-[#202124]"
                          style={{ fontFamily: pageFont }}
                        >
                          {item.title}
                        </h3>
                        <p className="mt-1 text-sm leading-6 text-[#52605c]">{item.body}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase text-[#2f6f64]">Choose by content</p>
            <h2
              className="mt-3 text-3xl font-semibold leading-tight text-[#202124] sm:text-5xl"
              style={{ fontFamily: pageFont }}
            >
              Find the guide that matches your starting point.
            </h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-[#52605c]">
            Each guide answers one concrete question, then points you to the Envitefy surface that
            fits the job.
          </p>
        </div>

        <div className="mt-9 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {guidePages.map((guide) => {
            const visual = guideVisuals[guide.slug];
            const Icon = visual.icon;

            return (
              <Link
                key={guide.slug}
                href={`/guides/${guide.slug}`}
                className="group rounded-lg border border-[#d9ded3] bg-white/82 p-6 shadow-[0_18px_55px_rgba(32,49,55,0.08)] transition hover:-translate-y-1 hover:border-[#aebbac] hover:bg-white"
              >
                <div className="flex items-center justify-between gap-3">
                  <div
                    className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-bold ${visual.accent}`}
                  >
                    <Icon className="h-4 w-4" />
                    {visual.route}
                  </div>
                  <ArrowRight className="h-4 w-4 text-[#7b847d] transition group-hover:translate-x-1 group-hover:text-[#2f6f64]" />
                </div>
                <h3
                  className="mt-5 text-xl font-bold leading-7 text-[#202124]"
                  style={{ fontFamily: pageFont }}
                >
                  {guide.h1}
                </h3>
                <p className="mt-3 text-sm leading-6 text-[#52605c]">{guide.intro}</p>
                <div className="mt-5 border-t border-[#d9ded3] pt-4">
                  <p className="text-xs font-bold uppercase text-[#6f7b75]">Best for</p>
                  <p className="mt-1 text-sm font-semibold text-[#303735]">{visual.bestFor}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="bg-white/64 px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {startingPoints.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  className="rounded-lg border border-[#d9ded3] bg-[#f7f8f3]/86 p-5 transition hover:border-[#aebbac] hover:bg-white"
                  href={item.href}
                  key={item.title}
                >
                  <Icon className="h-6 w-6 text-[#2f6f64]" />
                  <h3
                    className="mt-4 text-lg font-bold text-[#202124]"
                    style={{ fontFamily: pageFont }}
                  >
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[#52605c]">{item.body}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-6 rounded-lg bg-[#203137] p-6 text-white shadow-[0_28px_90px_rgba(32,49,55,0.18)] sm:p-8 lg:grid-cols-[1.4fr_1fr] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase text-[#b8e0d4]">Next step</p>
            <h2
              className="mt-3 text-3xl font-semibold leading-tight"
              style={{ fontFamily: pageFont }}
            >
              Turn the guide into a live page guests can actually use.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/72">
              Upload a file with Snap, design a live card in Studio, or open a dedicated workflow
              for gymnastics meets and family logistics.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
            <Link
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#202124] transition hover:bg-[#edf9f5]"
              href="/snap"
            >
              Try Snap
            </Link>
            <Link
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/22 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              href="/showcase"
            >
              Browse examples
            </Link>
          </div>
        </div>
      </section>

      <Script id="ld-guides-collection" type="application/ld+json">
        {JSON.stringify(collectionLd)}
      </Script>
      <Script id="ld-guides-breadcrumb" type="application/ld+json">
        {JSON.stringify(breadcrumbLd)}
      </Script>
    </main>
  );
}
