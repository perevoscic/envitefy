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
import styles from "@/components/company/supporting-public.module.css";
import GuestChatWidget from "@/components/guest-chat/GuestChatWidget";
import SnapEventPreview from "@/components/landing/SnapEventPreview";
import MarketingHero from "@/components/marketing/MarketingHero";
import MarketingPage from "@/components/marketing/MarketingPage";
import PublicCreationLink from "@/components/marketing/PublicCreationLink";
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
      "Use Snap or Envitefy Create depending on whether you are creating from scratch or cleaning up an existing invite, flyer, packet, or schedule.",
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
    <MarketingPage className={styles.content}>
      <AboutTopNav />
      <main>
        <MarketingHero
          eyebrow="A little more together"
          title={
            <>
              For the moments
              <br />
              <em>worth gathering for.</em>
            </>
          }
          description="Envitefy brings the invitation, event details and guest actions together. Create a page that feels like your occasion, then share one link everyone can use."
          primaryHref="/create"
          primaryRequiresAccount
          primaryLabel="Create your event"
          secondaryHref="#what-we-build"
          secondaryLabel="Get to know Envitefy"
          image="/images/landing/hero/garden-vows-desktop.webp"
          imageAlt="An original Envitefy wedding invitation and event page"
        />
        <section id="what-we-build" className={styles.section}>
          <p className={styles.eyebrow}>What we build</p>
          <h2 className={styles.title}>
            A beautiful invitation.
            <br />A practical place for every detail.
          </h2>
          <p className={styles.intro}>
            From the first invite to the final headcount, keep the details guests need in one place
            they can return to.
          </p>
          <div className={styles.grid}>
            {productPillars.map(({ icon: Icon, title, description }) => (
              <article key={title} className={styles.card}>
                <Icon size={25} aria-hidden="true" />
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </section>
        <section id="how-it-works" className={styles.section}>
          <p className={styles.eyebrow}>Made for real plans</p>
          <h2 className={styles.title}>
            Start with what you have.
            <br />
            Make it your own.
          </h2>
          <div className={styles.grid}>
            {workflowSteps.map(({ label, title, description }, index) => (
              <article key={label} className={styles.card}>
                <span className={styles.number}>
                  {String(index + 1).padStart(2, "0")} / {label}
                </span>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
          <div className={styles.links}>
            {pageLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                {link.label}
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            ))}
          </div>
        </section>
        <section id="product-proof" className={styles.section}>
          <p className={styles.eyebrow}>See the difference</p>
          <h2 className={styles.title}>
            From something on your phone
            <br />
            to something ready to share.
          </h2>
          <div className={styles.proofGrid}>
            <article className={styles.proof}>
              <div className={styles.proofCopy}>
                <h3>Thoughtfully designed event pages</h3>
                <p>
                  The invitation, schedule, RSVP, directions and useful links stay together in one
                  guest destination.
                </p>
              </div>
              <div data-appearance-scope="authored">
                <Image
                  src="/images/landing/hero/garden-vows-desktop.webp"
                  alt="Hosted wedding event page preview"
                  width={1200}
                  height={900}
                  sizes="(min-width: 900px) 45vw, 90vw"
                  className="aspect-[4/3] w-full object-cover object-top"
                />
              </div>
            </article>
            <article className={styles.proof}>
              <div className={styles.proofCopy}>
                <h3>A fresh start for an existing file</h3>
                <p>
                  Bring a flyer, invitation, schedule or PDF. Review the extracted information and
                  make the resulting page yours.
                </p>
              </div>
              <div data-appearance-scope="authored">
                <SnapEventPreview />
              </div>
            </article>
          </div>
        </section>
        <section id="who-it-serves" className={styles.section}>
          <p className={styles.eyebrow}>Room for everyone</p>
          <h2 className={styles.title}>
            For hosts, organizers,
            <br />
            and everyone on the guest list.
          </h2>
          <div className={styles.grid}>
            {audienceCards.map((card, index) => (
              <article key={card.title} className={styles.card}>
                {index === 0 ? (
                  <UsersRound size={25} aria-hidden="true" />
                ) : index === 1 ? (
                  <ClipboardList size={25} aria-hidden="true" />
                ) : (
                  <MapPinned size={25} aria-hidden="true" />
                )}
                <h3>{card.title}</h3>
                <p>{card.description}</p>
              </article>
            ))}
          </div>
        </section>
        <section id="start" className={styles.section}>
          <div className={styles.closing}>
            <p className={styles.eyebrow}>Your next gathering</p>
            <h2 className={styles.title}>
              Make a little room
              <br />
              for something wonderful.
            </h2>
            <p className={styles.intro}>
              Start with an original design or bring the information you already have.
            </p>
            <div className={styles.links}>
              <PublicCreationLink href="/create">
                Create your event
                <ArrowRight size={16} aria-hidden="true" />
              </PublicCreationLink>
              <Link href="/snap">
                Start with Snap
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <Link href="/contact">
                Contact us
                <ArrowRight size={16} aria-hidden="true" />
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
      <GuestChatWidget conciergeLauncher />
    </MarketingPage>
  );
}
