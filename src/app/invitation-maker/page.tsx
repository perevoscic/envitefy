import {
  ArrowRight,
  CalendarDays,
  Check,
  Gift,
  Link2,
  MapPin,
  MessageCircleMore,
  Upload,
  UsersRound,
} from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import SignedOutPageChrome from "@/components/navigation/SignedOutPageChrome";

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

const features = [
  {
    icon: UsersRound,
    title: "RSVP in the same link",
    body: "Let guests read the invitation and respond without hunting for a separate form.",
  },
  {
    icon: CalendarDays,
    title: "Calendar-ready details",
    body: "Keep the date, time, location, and event context together for easy calendar saves.",
  },
  {
    icon: MapPin,
    title: "Maps and arrival notes",
    body: "Put directions, parking, entrance details, and venue notes where guests can find them.",
  },
  {
    icon: Gift,
    title: "Registry and gift links",
    body: "Connect registries, gift notes, hotel blocks, tickets, or other useful event resources.",
  },
  {
    icon: MessageCircleMore,
    title: "One link that stays current",
    body: "Edit the hosted page after sharing so old texts still lead to the latest information.",
  },
  {
    icon: Upload,
    title: "Create or upload",
    body: "Start with a new idea in Studio or turn an existing invite, flyer, screenshot, or PDF into a page.",
  },
] as const;

const steps = [
  {
    number: "01",
    title: "Choose how to start",
    body: "Create from scratch, describe the event to Concierge, or upload the invitation design you already have.",
  },
  {
    number: "02",
    title: "Add the guest essentials",
    body: "Confirm the event title, date, time, place, RSVP details, registry, map, and any arrival notes.",
  },
  {
    number: "03",
    title: "Preview the live invitation",
    body: "Check the invitation and guest actions on mobile before publishing the shareable event link.",
  },
  {
    number: "04",
    title: "Share and update",
    body: "Send the same URL by text, email, or group chat and keep it current when plans change.",
  },
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
      "Start in Envitefy Studio or Concierge, enter the event details, choose the guest actions you need, preview the invitation, and share the published link.",
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
        featureList: features.map((feature) => feature.title),
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
    <>
      <SignedOutPageChrome brandHref="/" topNavVariant="transparent-dark" />
      <JsonLd />
      <main className="min-h-screen bg-[#fbf8f1] text-[#241c2b]">
        <section className="relative isolate overflow-hidden bg-[#201a23] px-5 pb-20 pt-32 text-white sm:px-8 sm:pb-24 lg:px-12 lg:pb-28 lg:pt-40">
          <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_18%_20%,#8c6eb8_0,transparent_34%),radial-gradient(circle_at_82%_72%,#a68149_0,transparent_32%)]" />
          <div className="relative mx-auto grid w-full max-w-7xl items-center gap-14 lg:grid-cols-[minmax(0,1.04fr)_minmax(26rem,0.96fr)]">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#f0d58f]">
                Online invitation maker
              </p>
              <h1 className="mt-5 max-w-4xl text-5xl font-light leading-[0.98] tracking-[-0.04em] text-white sm:text-6xl lg:text-7xl [font-family:var(--font-playfair),Georgia,serif]">
                Create an online invitation with RSVP in minutes.
              </h1>
              <p className="mt-7 max-w-2xl text-lg leading-8 text-white/78 sm:text-xl">
                Design the invite, publish the details, and give guests one live link for RSVP,
                calendar saves, maps, registries, and updates.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/studio"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[#f0d58f] px-6 text-sm font-semibold text-[#201a23] transition hover:-translate-y-0.5 hover:bg-white"
                >
                  Create your invitation
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link
                  href="/showcase"
                  className="inline-flex h-12 items-center justify-center rounded-md border border-white/24 bg-white/[0.08] px-6 text-sm font-semibold text-white transition hover:bg-white/[0.16]"
                >
                  Browse invitation examples
                </Link>
              </div>
              <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-white/72">
                {["No app for guests", "Editable after sharing", "Create or upload"].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-[#f0d58f]" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative mx-auto w-full max-w-[34rem]">
              <div className="relative ml-auto aspect-[4/5] w-[78%] overflow-hidden rounded-[2rem] border border-white/16 bg-[#332b38] shadow-[0_40px_90px_rgba(0,0,0,0.38)]">
                <Image
                  src="/images/landing/live-cards/madeline-s-garden-brunch.webp"
                  alt="Elegant online invitation with RSVP and event details"
                  fill
                  priority
                  sizes="(min-width: 1024px) 34vw, 70vw"
                  className="object-cover"
                />
              </div>
              <div className="absolute -bottom-8 left-0 w-[52%] rounded-2xl border border-white/16 bg-[#fbf8f1] p-4 text-[#241c2b] shadow-[0_28px_60px_rgba(0,0,0,0.28)]">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8b6a32]">
                  Guest actions
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-semibold">
                  {["RSVP", "Calendar", "Map", "Registry"].map((item) => (
                    <span key={item} className="rounded-md bg-[#eee5d5] px-2 py-2 text-center">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-[#ded2bd] px-5 py-20 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-4xl">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#92723f]">
                The short answer
              </p>
              <h2 className="mt-4 text-4xl font-light leading-tight tracking-[-0.03em] sm:text-5xl [font-family:var(--font-playfair),Georgia,serif]">
                How do you create an invite online?
              </h2>
              <p className="mt-5 text-lg leading-8 text-[#655b68]">
                Create the invitation in Envitefy Studio, add the event details and guest actions,
                preview the mobile experience, then publish one shareable link. If you already have
                an invite, flyer, screenshot, or PDF, upload it with Snap instead of retyping it.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/studio" className="font-semibold text-[#493259] underline underline-offset-4">
                  Start in Studio
                </Link>
                <span aria-hidden="true" className="text-[#b9aa92]">•</span>
                <Link href="/snap" className="font-semibold text-[#493259] underline underline-offset-4">
                  Upload an existing invite
                </Link>
                <span aria-hidden="true" className="text-[#b9aa92]">•</span>
                <Link href="/guides/live-card-invitations" className="font-semibold text-[#493259] underline underline-offset-4">
                  Read the live invitation guide
                </Link>
              </div>
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <article key={feature.title} className="rounded-xl border border-[#ded2bd] bg-white p-6 shadow-[0_16px_44px_rgba(52,39,31,0.06)]">
                    <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#eee7f4] text-[#5f4770]">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <h3 className="mt-5 text-xl font-semibold tracking-[-0.02em]">{feature.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-[#655b68]">{feature.body}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bg-white px-5 py-20 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#92723f]">Workflow</p>
              <h2 className="mt-4 text-4xl font-light tracking-[-0.03em] sm:text-5xl [font-family:var(--font-playfair),Georgia,serif]">
                Make a digital invitation in four steps.
              </h2>
            </div>
            <ol className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {steps.map((step) => (
                <li key={step.number} className="border-t border-[#cdbfaa] pt-6">
                  <span className="text-sm font-bold tracking-[0.18em] text-[#92723f]">{step.number}</span>
                  <h3 className="mt-4 text-xl font-semibold">{step.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-[#655b68]">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="border-y border-[#ded2bd] bg-[#f3ede3] px-5 py-20 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div className="max-w-3xl">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#92723f]">Examples</p>
                <h2 className="mt-4 text-4xl font-light tracking-[-0.03em] sm:text-5xl [font-family:var(--font-playfair),Georgia,serif]">
                  Invitations for the events people actually host.
                </h2>
              </div>
              <Link href="/showcase" className="inline-flex items-center gap-2 font-semibold text-[#493259]">
                View every example <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {examples.map((example) => (
                <Link key={example.title} href={example.href} className="group overflow-hidden rounded-2xl border border-[#d8c9b4] bg-white shadow-[0_18px_50px_rgba(52,39,31,0.08)]">
                  <div className="relative aspect-[4/5] overflow-hidden bg-[#ded2bd]">
                    <Image
                      src={example.image}
                      alt={example.alt}
                      fill
                      sizes="(min-width: 768px) 33vw, 100vw"
                      className="object-cover transition duration-500 group-hover:scale-[1.03]"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-2xl font-semibold tracking-[-0.03em]">{example.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-[#655b68]">{example.body}</p>
                    <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#493259]">
                      Open invitation <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            <nav className="mt-12 flex flex-wrap gap-3" aria-label="Invitation types">
              {[
                ["Birthday invitations", "/birthdays"],
                ["Wedding invitations", "/weddings"],
                ["Baby shower invitations", "/baby-showers"],
                ["Bridal shower invitations", "/bridal-showers"],
                ["Gender reveal invitations", "/gender-reveal"],
                ["Sports invitations", "/sport-events"],
              ].map(([label, href]) => (
                <Link key={href} href={href} className="rounded-full border border-[#cabaa3] bg-white px-4 py-2 text-sm font-semibold text-[#493259] hover:border-[#493259]">
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        </section>

        <section className="px-5 py-20 sm:px-8 lg:px-12">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[minmax(18rem,0.72fr)_minmax(0,1.28fr)]">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#92723f]">FAQ</p>
              <h2 className="mt-4 text-4xl font-light tracking-[-0.03em] sm:text-5xl [font-family:var(--font-playfair),Georgia,serif]">
                Online invitation questions, answered.
              </h2>
              <p className="mt-5 leading-8 text-[#655b68]">
                Need more detail? Visit the <Link href="/guides" className="font-semibold text-[#493259] underline underline-offset-4">Envitefy guides</Link> or learn <Link href="/how-it-works" className="font-semibold text-[#493259] underline underline-offset-4">how Envitefy works</Link>.
              </p>
            </div>
            <div className="divide-y divide-[#d8cab6] border-y border-[#d8cab6]">
              {faqs.map((faq) => (
                <details key={faq.question} className="group py-6">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-5 text-lg font-semibold marker:hidden">
                    {faq.question}
                    <span className="text-2xl font-light text-[#92723f] transition group-open:rotate-45" aria-hidden="true">+</span>
                  </summary>
                  <p className="max-w-3xl pt-4 leading-8 text-[#655b68]">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#201a23] px-5 py-20 text-white sm:px-8 lg:px-12">
          <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
            <Link2 className="h-8 w-8 text-[#f0d58f]" aria-hidden="true" />
            <h2 className="mt-5 text-4xl font-light tracking-[-0.03em] sm:text-5xl [font-family:var(--font-playfair),Georgia,serif]">
              Create the invite. Share one link. Keep every detail current.
            </h2>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/72">
              Start from scratch in Studio or upload the invitation you already have.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/studio" className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[#f0d58f] px-6 text-sm font-semibold text-[#201a23] hover:bg-white">
                Create an invitation <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link href="/snap" className="inline-flex h-12 items-center justify-center rounded-md border border-white/24 px-6 text-sm font-semibold text-white hover:bg-white/[0.1]">
                Upload an invite
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
