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
import styles from "@/components/company/supporting-public.module.css";
import MarketingHero from "@/components/marketing/MarketingHero";
import MarketingPage from "@/components/marketing/MarketingPage";
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
    route: "Envitefy Create",
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
  "smart-signup-forms": {
    accent: "bg-[#eefbfc] text-[#236c73]",
    bestFor: "Volunteer slots, supplies, shifts, class parties",
    icon: ClipboardList,
    route: "Smart sign-up",
  },
  "wedding-event-page": {
    accent: "bg-[#fff2f8] text-[#9b4d76]",
    bestFor: "Weddings, weekend details, RSVP, registry links",
    icon: CheckCircle2,
    route: "Wedding page",
  },
  "birthday-rsvp-invitation": {
    accent: "bg-[#fff4ec] text-[#843b19]",
    bestFor: "Birthday invites, parent notes, guest responses",
    icon: Sparkles,
    route: "Birthday RSVP",
  },
  "registry-invitation-page": {
    accent: "bg-[#f6fbef] text-[#466c2c]",
    bestFor: "Wedding, baby shower, birthday, and gift links",
    icon: ArrowRight,
    route: "Registry links",
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
    body: "Use Envitefy Create when you want a polished live card connected to event details and actions.",
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
    <MarketingPage className={styles.content}>
      <GuidesTopNav />
      <main>
        <MarketingHero
          eyebrow="Envitefy guides"
          title={
            <>
              A little guidance.
              <br />
              <em>A great place to start.</em>
            </>
          }
          description="Practical guides for invitations, uploads, RSVPs and sign-ups. Find a clear next step for the event you have in mind."
          primaryHref="#all-guides"
          primaryLabel="Find your guide"
          secondaryHref="/showcase"
          secondaryLabel="See examples"
        >
          <div className={styles.highlights}>
            <p className={styles.eyebrow}>Start with what you have</p>
            <div className={styles.links}>
              {startingPoints.slice(0, 3).map((item) => (
                <Link href={item.href} key={item.title}>
                  {item.title}
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
              ))}
            </div>
          </div>
        </MarketingHero>
        <section id="all-guides" className={styles.section}>
          <p className={styles.eyebrow}>
            Guides for live event pages, uploads, RSVPs, and gymnastics meets
          </p>
          <h2 className={styles.title}>
            Find the guide that
            <br />
            fits your starting point.
          </h2>
          <div className={styles.grid}>
            {guidePages.map((guide) => {
              const visual = guideVisuals[guide.slug];
              const Icon = visual.icon;
              return (
                <Link href={`/guides/${guide.slug}`} key={guide.slug} className={styles.card}>
                  <Icon size={24} aria-hidden="true" />
                  <h3>{guide.h1}</h3>
                  <p>{guide.intro}</p>
                  <span className={styles.number}>
                    Read guide <ArrowRight size={16} aria-hidden="true" />
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
        <section className={styles.section}>
          <div className={styles.closing}>
            <p className={styles.eyebrow}>Ready when you are</p>
            <h2 className={styles.title}>
              Turn a good idea
              <br />
              into a page to share.
            </h2>
            <div className={styles.links}>
              <Link href="/snap">
                Start with a file
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <Link href="/live-cards">
                Design a live card
                <ArrowRight size={16} aria-hidden="true" />
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
    </MarketingPage>
  );
}
