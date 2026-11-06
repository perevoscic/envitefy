import {
  ArrowRight,
  CalendarDays,
  Clock3,
  Gift,
  Link2,
  MapPin,
  MessageCircleMore,
  PenLine,
  ScanLine,
  Smartphone,
  Upload,
  UsersRound,
} from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import MarketingPage from "@/components/marketing/MarketingPage";
import styles from "@/components/marketing/ProductSportsLanding.module.css";
import PublicCreationLink from "@/components/marketing/PublicCreationLink";
import SignedOutPageChrome from "@/components/navigation/SignedOutPageChrome";
import ArrowFillLink from "@/components/ui/ArrowFillLink";

const pageUrl = "https://envitefy.com/invitation-maker";
const pageTitle = "Online Invitation Maker with RSVP | Envitefy";
const pageDescription =
  "Create an online invitation and share one live link with RSVP, calendar, maps, registry links, and updates. Start from scratch or upload an invite.";

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  keywords: [
    "online invitation maker",
    "create an invite",
    "create invitations online",
    "digital invitation maker",
    "invitation maker with RSVP",
    "online RSVP invitation",
    "event invitation maker",
  ],
  alternates: { canonical: "/invitation-maker" },
  openGraph: {
    title: pageTitle,
    description: pageDescription,
    url: pageUrl,
    siteName: "Envitefy",
    images: [
      {
        url: "https://envitefy.com/og/og-1.jpg",
        width: 1200,
        height: 630,
        alt: "Envitefy online invitation maker preview",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: pageTitle,
    description: pageDescription,
    images: ["https://envitefy.com/og/og-1.jpg"],
  },
};

const guestEssentials = [
  {
    icon: UsersRound,
    title: "RSVP without the back-and-forth",
    body: "Guests can respond from the same page where they read the invitation.",
  },
  {
    icon: CalendarDays,
    title: "Save the right date",
    body: "Calendar-ready details keep the time, timezone, and event context together.",
  },
  {
    icon: MapPin,
    title: "Arrive without guessing",
    body: "Maps, parking, entrance details, and venue notes live in one easy-to-find place.",
  },
  {
    icon: Gift,
    title: "Keep the useful links close",
    body: "Add registries, tickets, hotel blocks, gift notes, and the resources guests need.",
  },
] as const;

const steps = [
  {
    number: "01",
    title: "Bring the idea",
    body: "Describe the event to Envitefy Create, choose a category template, or upload the invitation you already have.",
  },
  {
    number: "02",
    title: "Make it guest-ready",
    body: "Confirm the date, place, RSVP, map, registry, and the small details that prevent day-of questions.",
  },
  {
    number: "03",
    title: "Send one lasting link",
    body: "Preview on mobile, publish, and share. If plans change later, update the page without sending a new URL.",
  },
] as const;

const trustItems = [
  { icon: Smartphone, label: "Made for mobile" },
  { icon: UsersRound, label: "RSVP built in" },
  { icon: CalendarDays, label: "Calendar ready" },
  { icon: MessageCircleMore, label: "One link to update" },
] as const;

const examples = [
  {
    title: "Birthday invitation",
    body: "A playful invite with RSVP, timing, location, and parent-friendly details.",
    image: "/images/landing/live-cards/lara-s-7th-dino-quest.webp",
    href: "/showcase/lara-s-7th-dino-quest",
    alt: "Dinosaur birthday invitation made with Envitefy",
  },
  {
    title: "Wedding invitation",
    body: "An elegant invitation connected to the celebration details guests need.",
    image: "/images/landing/live-cards/garden-vows.webp",
    href: "/showcase/garden-vows",
    alt: "Garden wedding invitation made with Envitefy",
  },
  {
    title: "Baby shower invitation",
    body: "A warm shower invite with RSVP, registry access, schedule, and host notes.",
    image: "/images/landing/live-cards/elena-s-beary-sweet-shower.webp",
    href: "/showcase/elena-s-beary-sweet-shower",
    alt: "Baby shower invitation made with Envitefy",
  },
] as const;

const faqs = [
  {
    question: "How do I create an online invitation with Envitefy?",
    answer:
      "Start with Envitefy Create or a category template, enter the event details, choose the guest actions you need, preview the invitation, and share the published link.",
  },
  {
    question: "Can I add RSVP to my invitation?",
    answer:
      "Yes. Envitefy connects the invitation to a hosted event page where guests can find RSVP options and the event details in one place.",
  },
  {
    question: "Do guests need to download an app?",
    answer:
      "No. Guests open the shared invitation link in a mobile or desktop browser without installing an app.",
  },
  {
    question: "Can I upload an invitation I already designed?",
    answer:
      "Yes. Use Envitefy Snap to upload an invite, flyer, screenshot, image, or PDF, review the extracted details, and turn it into an editable hosted event page.",
  },
  {
    question: "Can I change an invitation after I share it?",
    answer:
      "Yes. Because the invitation is connected to a live page, you can update event details while keeping the same guest link.",
  },
  {
    question: "What types of invitations can I create?",
    answer:
      "Envitefy supports birthdays, weddings, baby and bridal showers, gender reveals, sports events, school events, community gatherings, and custom events.",
  },
] as const;

function JsonLd() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${pageUrl}#webpage`,
        url: pageUrl,
        name: pageTitle,
        description: pageDescription,
        isPartOf: { "@id": "https://envitefy.com/#website" },
        about: { "@id": `${pageUrl}#application` },
        breadcrumb: { "@id": `${pageUrl}#breadcrumb` },
      },
      {
        "@type": "WebApplication",
        "@id": `${pageUrl}#application`,
        name: "Envitefy Online Invitation Maker",
        url: pageUrl,
        applicationCategory: "EventManagementApplication",
        operatingSystem: "Web",
        browserRequirements: "Requires a modern web browser",
        description: pageDescription,
        publisher: { "@id": "https://envitefy.com/#organization" },
        featureList: guestEssentials.map((feature) => feature.title),
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${pageUrl}#breadcrumb`,
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
            name: "Invitation Maker",
            item: pageUrl,
          },
        ],
      },
      {
        "@type": "FAQPage",
        "@id": `${pageUrl}#faq`,
        mainEntity: faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer,
          },
        })),
      },
    ],
  };

  return (
    <Script id="ld-invitation-maker" type="application/ld+json">
      {JSON.stringify(structuredData)}
    </Script>
  );
}

export default function InvitationMakerPage() {
  return (
    <MarketingPage tone="celebration" className={`${styles.editorial} ${styles.coordinated}`}>
      <SignedOutPageChrome brandHref="/" topNavVariant="transparent-light" />
      <JsonLd />
      <main>
        <section id="hero" className={styles.hero}>
          <div>
            <p className={styles.eyebrow}>Invitation maker + live guest page</p>
            <h1 className={styles.title}>
              A lovely invite. <em>A clear plan.</em>
            </h1>
            <p className={styles.description}>
              Create an online invitation with RSVP and all the details guests need. A beautiful
              design, a clear plan, one link to share.
            </p>
            <div className={styles.actions}>
              <PublicCreationLink
                href="/live-cards"
                className={styles.primary}
                label="Create your invitation"
              />
              <ArrowFillLink
                href="/showcase"
                className={styles.secondary}
                label="See live examples"
              />
            </div>
            <p className={styles.note}>No app for guests. Your event, ready for their phone.</p>
          </div>
          <figure className={styles.visual}>
            <div className="relative mx-auto aspect-[4/5] w-[86%] overflow-hidden rounded-t-[46%] rounded-b-2xl shadow-xl">
              <Image
                src="/images/landing/live-cards/madeline-s-garden-brunch.webp"
                alt="Garden brunch invitation created with Envitefy"
                fill
                priority
                sizes="(min-width: 768px) 38vw, 80vw"
                className="object-cover"
              />
            </div>
            <div
              data-authored-preview
              data-appearance-scope="authored"
              className="relative mx-auto -mt-10 w-[94%] rounded-2xl border border-[#e2d8c8] bg-[#fffaf2] p-5 text-[#2c2430] shadow-lg"
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#755886]">
                Sample guest page
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {["RSVP", "Calendar", "Directions", "Registry"].map((item) => (
                  <span
                    className="rounded-lg border border-[#e6ddcf] bg-white px-2 py-3 text-center text-xs font-semibold text-[#4e4352]"
                    key={item}
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <figcaption className={styles.caption}>
              Your design up front. The useful details, all together.
            </figcaption>
          </figure>
        </section>

        <section className="px-5 py-5 text-[var(--marketing-ink)] sm:px-8 lg:px-12">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-x-6 gap-y-4 text-sm font-bold md:grid-cols-4">
            {trustItems.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center justify-center gap-2.5 md:border-l md:border-[#8c6d2e]/25 md:first:border-l-0"
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="border-b border-[var(--marketing-line)] px-5 py-20 sm:px-8 sm:py-24 lg:px-12 lg:py-28">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-7 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-end">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--marketing-accent)]">
                  Choose your starting point
                </p>
                <h2 className="mt-4 text-4xl font-light leading-[1.04] !tracking-[-0.035em] sm:text-5xl">
                  How do you create an invite online?
                </h2>
              </div>
              <p className="max-w-2xl text-lg leading-8 text-[var(--marketing-muted)] lg:justify-self-end">
                Start with a blank canvas or bring the invitation you already designed. Either path
                ends with a polished, shareable page that is ready for guests.
              </p>
            </div>

            <div className="mt-12 grid gap-6 lg:grid-cols-2">
              <article className="group relative overflow-hidden rounded-[2rem] bg-[#35263e] p-7 text-white shadow-[0_24px_70px_rgba(58,41,64,0.15)] sm:p-10">
                <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-[#76578a]/35 blur-3xl" />
                <div className="relative">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--marketing-soft)] text-[var(--marketing-ink)]">
                    <PenLine className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <p className="mt-8 text-xs font-bold uppercase tracking-[0.2em] text-[#dbc98f]">
                    Start from scratch
                  </p>
                  <h3 className="mt-3 text-3xl font-light !tracking-[-0.03em] !text-white sm:text-4xl">
                    Shape the invitation around your event.
                  </h3>
                  <p className="mt-4 max-w-xl leading-7 text-[#d7ccd9]">
                    Choose the event type, add the essentials, and build the guest experience in
                    Envitefy Create. You can refine the design before anyone sees it.
                  </p>

                  <div className="mt-8 rounded-2xl border border-white/12 bg-black/15 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/55">
                      Your idea
                    </p>
                    <p className="mt-2 rounded-xl bg-white/[0.08] px-4 py-3 text-sm text-white/85">
                      “A garden brunch for Madeline, Saturday at eleven…”
                    </p>
                  </div>

                  <PublicCreationLink
                    href="/live-cards"
                    label="Create with Envitefy"
                    style={
                      {
                        "--arrow-fill-color": "#f2c6de",
                        "--arrow-fill-hover-ink": "#442c3b",
                        borderRadius: "999px",
                        minHeight: 44,
                        paddingInlineStart: 12,
                      } as import("react").CSSProperties
                    }
                    className="mt-8 inline-flex items-center gap-2 font-bold text-[#f2c6de] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--marketing-soft)]"
                  />
                </div>
              </article>

              <article className="relative overflow-hidden rounded-[2rem] border border-[#d8cbb9] bg-[var(--marketing-surface)] p-7 shadow-[0_24px_70px_rgba(58,41,64,0.08)] sm:p-10">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--marketing-soft)] text-[var(--marketing-accent)]">
                  <ScanLine className="h-5 w-5" aria-hidden="true" />
                </span>
                <p className="mt-8 text-xs font-bold uppercase tracking-[0.2em] text-[var(--marketing-accent)]">
                  Already have an invite?
                </p>
                <h3 className="mt-3 text-3xl font-light !tracking-[-0.03em] sm:text-4xl">
                  Upload it. Skip the retyping.
                </h3>
                <p className="mt-4 max-w-xl leading-7 text-[var(--marketing-muted)]">
                  Use Envitefy Snap to read an image, screenshot, flyer, or PDF. Review the event
                  details, then turn them into an editable guest page.
                </p>

                <div className="mt-8 flex min-h-28 items-center justify-center rounded-2xl border-2 border-dashed border-[var(--marketing-line)] bg-[var(--marketing-surface)] p-5 text-center">
                  <div>
                    <Upload
                      className="mx-auto h-6 w-6 text-[var(--marketing-accent)]"
                      aria-hidden="true"
                    />
                    <p className="mt-2 text-sm font-bold text-[var(--marketing-ink)]">
                      Image, screenshot, or PDF
                    </p>
                    <p className="mt-1 text-xs text-[var(--marketing-muted)]">
                      Review everything before publishing
                    </p>
                  </div>
                </div>

                <ArrowFillLink
                  href="/snap"
                  label="Upload an existing invite"
                  style={
                    {
                      "--arrow-fill-color": "var(--marketing-accent)",
                      "--arrow-fill-hover-ink": "var(--marketing-paper)",
                      borderRadius: "999px",
                      minHeight: 44,
                      paddingInlineStart: 12,
                    } as import("react").CSSProperties
                  }
                  className="mt-8 inline-flex items-center gap-2 font-bold text-[var(--marketing-accent)] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--marketing-accent)]"
                />
              </article>
            </div>
          </div>
        </section>

        <section className="px-5 py-20 sm:px-8 sm:py-24 lg:px-12 lg:py-28">
          <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[minmax(22rem,0.88fr)_minmax(0,1.12fr)] lg:gap-20">
            <div className="relative mx-auto w-full max-w-[31rem] pb-12 pl-5 sm:pl-10">
              <div className="absolute bottom-0 left-0 right-12 top-12 rounded-[2rem] bg-[#eee4d4]" />
              <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] border-8 border-white bg-[#e9dfce] shadow-[0_30px_70px_rgba(65,45,65,0.18)]">
                <Image
                  src="/images/landing/live-cards/the-carter-housewarming.webp"
                  alt="Housewarming invitation on an Envitefy live guest page"
                  fill
                  sizes="(min-width: 1024px) 34vw, 82vw"
                  className="object-cover"
                />
              </div>
              <div className="absolute bottom-0 right-0 max-w-[15rem] rounded-2xl bg-[#35263e] p-4 text-white shadow-[0_22px_55px_rgba(35,24,40,0.3)]">
                <div className="flex items-center gap-2 text-[#f2c6de]">
                  <Clock3 className="h-4 w-4" aria-hidden="true" />
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em]">
                    Example update
                  </p>
                </div>
                <p className="mt-2 text-sm leading-6 text-white/85">
                  Parking note added. The same guest link is already current.
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--marketing-accent)]">
                More than a pretty card
              </p>
              <h2 className="mt-4 max-w-3xl text-4xl font-light leading-[1.04] !tracking-[-0.035em] sm:text-5xl lg:text-6xl">
                A beautiful invitation up front. A useful guest hub behind it.
              </h2>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--marketing-muted)]">
                The design earns attention. The live page answers the questions that usually turn
                into texts, missed dates, and last-minute confusion.
              </p>

              <div className="mt-9 grid gap-x-8 gap-y-6 sm:grid-cols-2">
                {guestEssentials.map((feature) => {
                  const Icon = feature.icon;
                  return (
                    <article
                      key={feature.title}
                      className="border-t border-[var(--marketing-line)] pt-5"
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--marketing-soft)] text-[var(--marketing-accent)]">
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <h3 className="mt-4 text-xl font-semibold !tracking-[-0.02em]">
                        {feature.title}
                      </h3>
                      <p className="mt-2 text-sm leading-7 text-[var(--marketing-muted)]">
                        {feature.body}
                      </p>
                    </article>
                  );
                })}
              </div>

              <ArrowFillLink
                href="/guides/live-card-invitations"
                label="Read the live invitation guide"
                style={
                  {
                    "--arrow-fill-color": "var(--marketing-accent)",
                    "--arrow-fill-hover-ink": "var(--marketing-paper)",
                    borderRadius: "999px",
                    minHeight: 44,
                    paddingInlineStart: 12,
                  } as import("react").CSSProperties
                }
                className="mt-9 inline-flex items-center gap-2 font-bold text-[var(--marketing-accent)] underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--marketing-accent)]"
              />
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden px-5 py-20 text-[var(--marketing-ink)] sm:px-8 sm:py-24 lg:px-12 lg:py-28">
          <div className="relative mx-auto max-w-7xl">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:items-end">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--marketing-accent)]">
                  A simple workflow
                </p>
                <h2 className="mt-4 max-w-2xl text-4xl font-light leading-[1.04] !tracking-[-0.035em] sm:text-5xl">
                  From idea to sent in three clear steps.
                </h2>
              </div>
              <p className="max-w-xl text-lg leading-8 text-[var(--marketing-muted)] lg:justify-self-end">
                No separate RSVP form. No scavenger hunt for the address. No new group text when a
                detail changes.
              </p>
            </div>

            <ol className="mt-12 grid gap-5 md:grid-cols-3">
              {steps.map((step) => (
                <li
                  key={step.number}
                  className="rounded-[1.5rem] border border-white/12 bg-[#3a2a43] p-7 text-white sm:p-8"
                >
                  <span className="text-sm font-bold tracking-[0.18em] text-[#f2c6de]">
                    {step.number}
                  </span>
                  <h3 className="mt-8 text-2xl font-semibold !tracking-[-0.025em] !text-white">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-[#d9ceda]">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="border-b border-[var(--marketing-line)] px-5 py-20 sm:px-8 sm:py-24 lg:px-12 lg:py-28">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div className="max-w-3xl">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--marketing-accent)]">
                  See what is possible
                </p>
                <h2 className="mt-4 text-4xl font-light leading-[1.04] !tracking-[-0.035em] sm:text-5xl">
                  Invitations for the events people actually host.
                </h2>
                <p className="mt-5 max-w-2xl text-lg leading-8 text-[var(--marketing-muted)]">
                  Start with a style that feels right, then make the wording, details, and guest
                  actions your own.
                </p>
              </div>
              <ArrowFillLink
                href="/showcase"
                label="View every example"
                style={
                  {
                    "--arrow-fill-color": "var(--marketing-accent)",
                    "--arrow-fill-hover-ink": "var(--marketing-paper)",
                    borderRadius: "999px",
                    minHeight: 44,
                    paddingInlineStart: 12,
                  } as import("react").CSSProperties
                }
                className="inline-flex items-center gap-2 font-bold text-[var(--marketing-accent)] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--marketing-accent)]"
              />
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {examples.map((example) => (
                <Link
                  key={example.title}
                  href={example.href}
                  className="group overflow-hidden rounded-[1.5rem] border border-[var(--marketing-line)] bg-[var(--marketing-surface)] shadow-[0_18px_50px_rgba(52,39,31,0.08)] transition hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(52,39,31,0.14)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--marketing-accent)]"
                >
                  <div className="relative aspect-[5/6] overflow-hidden bg-[#ded2bd]">
                    <Image
                      src={example.image}
                      alt={example.alt}
                      fill
                      sizes="(min-width: 768px) 33vw, 100vw"
                      className="object-cover transition duration-500 group-hover:scale-[1.035]"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-2xl font-semibold !tracking-[-0.03em]">{example.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-[var(--marketing-muted)]">
                      {example.body}
                    </p>
                    <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[var(--marketing-accent)]">
                      Open invitation <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            <div className="mt-12 border-t border-[var(--marketing-line)] pt-8">
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-[var(--marketing-accent)]">
                Find your event type
              </p>
              <nav className="flex flex-wrap gap-3" aria-label="Invitation types">
                {[
                  ["Birthday invitations", "/birthdays"],
                  ["Wedding invitations", "/weddings"],
                  ["Baby shower invitations", "/baby-showers"],
                  ["Bridal shower invitations", "/bridal-showers"],
                  ["Gender reveal invitations", "/gender-reveal"],
                  ["Sports invitations", "/sport-events"],
                ].map(([label, href]) => (
                  <ArrowFillLink
                    key={href}
                    href={href}
                    label={label}
                    className="min-h-11 rounded-full border border-[var(--marketing-line)] bg-[var(--marketing-surface)] px-4 py-2 text-sm font-bold text-[var(--marketing-accent)] transition hover:border-[var(--marketing-accent)] hover:bg-[var(--marketing-soft)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--marketing-accent)] [--arrow-fill-color:var(--marketing-accent)] [--arrow-fill-hover-ink:var(--marketing-paper)]"
                  />
                ))}
              </nav>
            </div>
          </div>
        </section>

        <section className="px-5 py-20 sm:px-8 sm:py-24 lg:px-12 lg:py-28">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[minmax(18rem,0.72fr)_minmax(0,1.28fr)] lg:gap-20">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--marketing-accent)]">
                Good to know
              </p>
              <h2 className="mt-4 text-4xl font-light leading-[1.04] !tracking-[-0.035em] sm:text-5xl">
                Online invitation questions, answered.
              </h2>
              <p className="mt-5 leading-8 text-[var(--marketing-muted)]">
                Need more detail? Visit the{" "}
                <Link
                  href="/guides"
                  className="font-bold text-[var(--marketing-accent)] underline underline-offset-4"
                >
                  Envitefy guides
                </Link>{" "}
                or learn{" "}
                <Link
                  href="/how-it-works"
                  className="font-bold text-[var(--marketing-accent)] underline underline-offset-4"
                >
                  how Envitefy works
                </Link>
                .
              </p>
            </div>
            <div className="divide-y divide-[var(--marketing-line)] border-y border-[var(--marketing-line)]">
              {faqs.map((faq) => (
                <details key={faq.question} className="group py-6">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-5 text-lg font-bold text-[var(--marketing-ink)] marker:hidden focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--marketing-accent)]">
                    {faq.question}
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--marketing-soft)] text-xl font-light text-[var(--marketing-accent)] transition group-open:rotate-45"
                      aria-hidden="true"
                    >
                      +
                    </span>
                  </summary>
                  <p className="max-w-3xl pt-4 leading-8 text-[var(--marketing-muted)]">
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 py-12 sm:px-8 sm:py-16 lg:px-12 lg:py-20">
          <div className="relative mx-auto flex max-w-7xl flex-col items-start overflow-hidden rounded-[2rem] bg-[#211a25] px-6 py-14 text-white shadow-[0_28px_80px_rgba(44,31,48,0.16)] sm:px-12 sm:py-16 lg:px-16">
            <div className="absolute -right-20 -top-28 h-80 w-80 rounded-full bg-[#76578a]/40 blur-3xl" />
            <div className="relative max-w-4xl">
              <Link2 className="h-7 w-7 text-[#f2c6de]" aria-hidden="true" />
              <h2 className="mt-5 text-4xl font-light leading-[1.04] !tracking-[-0.035em] !text-white sm:text-5xl lg:text-6xl">
                Create the invite. Share one link. Keep every detail current.
              </h2>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-[#d9ceda]">
                Describe your event to Envitefy Create or upload the invitation you already have.
                Guests can open either experience in any modern browser—no app required.
              </p>
              <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                <PublicCreationLink
                  href="/live-cards"
                  label="Create an invitation"
                  style={
                    {
                      "--arrow-fill-color": "#442c3b",
                      "--arrow-fill-hover-ink": "#f2c6de",
                    } as import("react").CSSProperties
                  }
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#f2c6de] px-7 text-sm font-bold text-[#442c3b] hover:bg-[#fff4cb] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--marketing-soft)]"
                />
                <ArrowFillLink
                  href="/snap"
                  label="Upload an invite"
                  style={
                    {
                      "--arrow-fill-color": "#f2c6de",
                      "--arrow-fill-hover-ink": "#442c3b",
                    } as import("react").CSSProperties
                  }
                  className="inline-flex h-12 items-center justify-center rounded-full border border-white/25 px-7 text-sm font-bold text-white hover:bg-[var(--marketing-soft)]/[0.1] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                />
              </div>
            </div>
          </div>
        </section>
      </main>
    </MarketingPage>
  );
}
