import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";

const SITE_URL = "https://envitefy.com";
const DEFAULT_IMAGE = `${SITE_URL}/og-default.jpg`;

export type GuideSlug =
  | "pdf-to-event-page"
  | "flyer-to-event-page"
  | "live-card-invitations"
  | "rsvp-event-page"
  | "gymnastics-meet-page"
  | "share-event-page-without-app";

type FaqPair = {
  question: string;
  answer: string;
};

type GuidePage = {
  slug: GuideSlug;
  title: string;
  description: string;
  h1: string;
  intro: string;
  directAnswer: string;
  sections: Array<{
    heading: string;
    body: string;
  }>;
  cta: {
    label: string;
    href: string;
  };
  relatedLinks: Array<{
    label: string;
    href: string;
  }>;
  faq: FaqPair[];
};

export const guidePages: GuidePage[] = [
  {
    slug: "pdf-to-event-page",
    title: "How to turn a PDF into an event page | Envitefy Guides",
    description:
      "Turn a PDF invite, schedule, or event packet into a hosted Envitefy event page with RSVP links, calendar saves, maps, and shareable details.",
    h1: "How do I turn a PDF into an event page?",
    intro:
      "Upload the PDF to Envitefy Snap, review the extracted date, time, place, and notes, then publish a hosted event page guests can open from one link.",
    directAnswer:
      "Envitefy is built for PDFs that contain event details, including invitations, school flyers, sports schedules, and meet packets. Snap reads the file, organizes the details, and gives the host a cleaner live page to share.",
    sections: [
      {
        heading: "What Envitefy extracts from a PDF",
        body: "Envitefy looks for title, date, start time, end time, venue, address, host notes, registration links, registry links, and schedule details. Hosts can edit the result before sharing.",
      },
      {
        heading: "Why use a live page instead of sending the PDF",
        body: "A hosted page is easier to open on a phone, easier to update, and easier for guests to save to a calendar. Guests do not need to keep hunting through a download or text thread.",
      },
      {
        heading: "Best PDF use cases",
        body: "Common fits include birthday invitations, school events, community flyers, gymnastics meet schedules, recital packets, clinic schedules, and team event handouts.",
      },
    ],
    cta: { label: "Upload with Snap", href: "/snap" },
    relatedLinks: [
      { label: "Flyer to event page", href: "/guides/flyer-to-event-page" },
      { label: "RSVP event pages", href: "/guides/rsvp-event-page" },
      { label: "Gymnastics meet pages", href: "/gymnastics" },
    ],
    faq: [
      {
        question: "Can Envitefy turn a PDF into a shareable event page?",
        answer:
          "Yes. Envitefy Snap can process PDFs with event details and help create a hosted event page with RSVP, links, maps, and calendar actions.",
      },
      {
        question: "Do guests need the original PDF?",
        answer:
          "No. Once the event page is published, guests can use the live link instead of downloading or forwarding the original PDF.",
      },
    ],
  },
  {
    slug: "flyer-to-event-page",
    title: "How to turn a flyer into an event page | Envitefy Guides",
    description:
      "Use Envitefy Snap to turn a flyer, screenshot, or image invitation into a mobile-friendly hosted event page.",
    h1: "How do I turn a flyer into an event page?",
    intro:
      "Snap or upload the flyer, confirm the details Envitefy finds, and share a live event page instead of another screenshot.",
    directAnswer:
      "Envitefy helps hosts and parents convert flyer-style event information into structured pages with RSVP, calendar, map, and sharing actions.",
    sections: [
      {
        heading: "From image to structured details",
        body: "Envitefy reads flyer text and turns it into editable event fields such as title, time, venue, address, notes, links, and category.",
      },
      {
        heading: "Useful for busy family logistics",
        body: "Flyers often arrive through texts, school apps, emails, and screenshots. Envitefy gives families a stable page to revisit and share.",
      },
      {
        heading: "What to check before sharing",
        body: "Hosts should review dates, times, addresses, and links before publishing. Envitefy keeps the result editable so corrected details can replace the original flyer confusion.",
      },
    ],
    cta: { label: "Try Snap", href: "/snap" },
    relatedLinks: [
      { label: "PDF to event page", href: "/guides/pdf-to-event-page" },
      { label: "Share without an app", href: "/guides/share-event-page-without-app" },
      { label: "See live card examples", href: "/showcase" },
    ],
    faq: [
      {
        question: "Can Envitefy create an event page from a flyer image?",
        answer:
          "Yes. Envitefy Snap can use a flyer image or screenshot as the starting point for a hosted event page.",
      },
      {
        question: "Can I edit the event details after upload?",
        answer:
          "Yes. Hosts can review and adjust the extracted information before sharing the page.",
      },
    ],
  },
  {
    slug: "live-card-invitations",
    title: "What are live card invitations? | Envitefy Guides",
    description:
      "Learn how Envitefy live card invitations combine designed cards, hosted pages, RSVP actions, registry links, maps, and calendar saves.",
    h1: "What are live card invitations?",
    intro:
      "Live card invitations are shareable event cards connected to a hosted page, so the design, details, RSVP, links, and updates live together.",
    directAnswer:
      "Envitefy live cards are not just static invitation images. They are mobile-friendly event pages with card design, guest actions, and details that can stay current after sharing.",
    sections: [
      {
        heading: "What a live card can include",
        body: "A live card can include event art, title, schedule, venue, RSVP action, registry link, calendar save, map link, and notes for guests.",
      },
      {
        heading: "Created from Studio or uploads",
        body: "Hosts can design from scratch in Studio or start from an existing invite, flyer, screenshot, or PDF through Snap.",
      },
      {
        heading: "Why it helps guests",
        body: "Guests get one page they can open from a text or email. If the host updates details, the shared page reflects the latest information.",
      },
    ],
    cta: { label: "Open Studio", href: "/studio" },
    relatedLinks: [
      { label: "Live card showcase", href: "/showcase" },
      { label: "RSVP event pages", href: "/guides/rsvp-event-page" },
      { label: "Snap uploads", href: "/snap" },
    ],
    faq: [
      {
        question: "Is a live card the same as a static invitation image?",
        answer:
          "No. A live card can include an invitation design, but it also supports hosted event details and guest actions.",
      },
      {
        question: "Can live cards include registry links?",
        answer:
          "Yes. Hosts can include helpful links such as registries, signups, ticket pages, or outside event resources.",
      },
    ],
  },
  {
    slug: "rsvp-event-page",
    title: "How to make an RSVP event page | Envitefy Guides",
    description:
      "Create a hosted event page with RSVP actions, calendar saves, map links, registry links, and guest-friendly sharing.",
    h1: "How do I make an RSVP event page?",
    intro:
      "Create or upload an event in Envitefy, add the RSVP and guest details, then share the live page link by text or email.",
    directAnswer:
      "Envitefy RSVP event pages give hosts a mobile-friendly place for event details and guest actions, including RSVP links, calendar saves, map links, and related resources.",
    sections: [
      {
        heading: "What guests can do",
        body: "Guests can open the page, review event details, respond through RSVP options when enabled, save the event to a calendar, and use links for maps, registries, or other resources.",
      },
      {
        heading: "How hosts create one",
        body: "Hosts can start with Studio, Snap/upload, or a structured event flow, then publish a hosted page once the details are ready.",
      },
      {
        heading: "Where it fits",
        body: "RSVP pages work well for birthday parties, showers, school events, community events, team gatherings, and any event where guests need one reliable source of truth.",
      },
    ],
    cta: { label: "Start with Studio", href: "/studio" },
    relatedLinks: [
      { label: "Live card invitations", href: "/guides/live-card-invitations" },
      { label: "Share without an app", href: "/guides/share-event-page-without-app" },
      { label: "Browse examples", href: "/showcase" },
    ],
    faq: [
      {
        question: "Can Envitefy event pages include RSVP links?",
        answer:
          "Yes. Envitefy event pages can support RSVP-oriented sharing and guest actions alongside the event details.",
      },
      {
        question: "Can guests save the event to a calendar?",
        answer:
          "Yes. Envitefy is designed around structured event details so guests can save events to calendars when calendar actions are available.",
      },
    ],
  },
  {
    slug: "gymnastics-meet-page",
    title: "How to create a gymnastics meet page | Envitefy Guides",
    description:
      "Create mobile-friendly gymnastics meet pages with schedules, venue details, hotel blocks, maps, session notes, and live sharing.",
    h1: "How do I create a gymnastics meet page?",
    intro:
      "Use Envitefy Gymnastics to publish a meet page with schedule details, venue information, hotel blocks, maps, and parent-friendly sharing.",
    directAnswer:
      "Envitefy Gymnastics is built for meet organizers, coaches, parents, athletes, and spectators who need a clean live page instead of scattered PDFs and text updates.",
    sections: [
      {
        heading: "What a meet page can hold",
        body: "Meet pages can include session schedules, venue details, hotel information, travel notes, map links, scores or resource links, and updates for families.",
      },
      {
        heading: "Why gymnastics gets a dedicated surface",
        body: "Meet logistics are more complex than a basic party invite. Families need session timing, location context, hotel details, and updates in one mobile-friendly place.",
      },
      {
        heading: "Who uses it",
        body: "Gymnastics families, coaches, meet directors, clubs, and spectators can use Envitefy pages to reduce repeat questions and keep details easy to find.",
      },
    ],
    cta: { label: "Explore Gymnastics", href: "/gymnastics" },
    relatedLinks: [
      { label: "PDF to event page", href: "/guides/pdf-to-event-page" },
      { label: "Flyer to event page", href: "/guides/flyer-to-event-page" },
      { label: "How Envitefy works", href: "/how-it-works" },
    ],
    faq: [
      {
        question: "Can Envitefy make gymnastics meet pages?",
        answer:
          "Yes. Envitefy Gymnastics is designed for meet pages with schedules, venue details, hotels, maps, and updates.",
      },
      {
        question: "Can a gymnastics meet page start from a PDF or schedule?",
        answer:
          "Yes. Snap/upload workflows can help turn meet PDFs and schedules into structured event information for a page.",
      },
    ],
  },
  {
    slug: "share-event-page-without-app",
    title: "Share an event page without an app | Envitefy Guides",
    description:
      "Envitefy lets hosts share event pages guests can open from a browser link without installing an app.",
    h1: "Can I share an event page without guests installing an app?",
    intro:
      "Yes. Envitefy event pages are hosted on the web, so guests can open the shared link from text, email, or a browser without installing an app.",
    directAnswer:
      "Envitefy is designed for low-friction guest access. Hosts can share one live link, and guests can view details, use links, RSVP options, maps, and calendar actions from the web.",
    sections: [
      {
        heading: "How guests access the page",
        body: "Guests open the event link in their mobile or desktop browser. The page can be shared through text, email, group chats, or other messaging tools.",
      },
      {
        heading: "What guests can do from the link",
        body: "Depending on the event setup, guests can read details, RSVP, save to calendar, open maps, follow registry links, and return later for updates.",
      },
      {
        heading: "Why hosts use a live link",
        body: "A live page avoids asking every guest to install software and keeps updates in one place after the invitation has already been sent.",
      },
    ],
    cta: { label: "See examples", href: "/showcase" },
    relatedLinks: [
      { label: "RSVP event pages", href: "/guides/rsvp-event-page" },
      { label: "Live card invitations", href: "/guides/live-card-invitations" },
      { label: "Start with Snap", href: "/snap" },
    ],
    faq: [
      {
        question: "Do guests need an app to view an Envitefy event page?",
        answer:
          "No. Guests can open shared Envitefy event pages in a browser from a text, email, or copied link.",
      },
      {
        question: "Can guests use RSVP and calendar links from the browser?",
        answer:
          "Yes. Guest actions are designed to work from the hosted event page when those options are available for the event.",
      },
    ],
  },
];

export const guideBySlug = Object.fromEntries(
  guidePages.map((guide) => [guide.slug, guide]),
) as Record<GuideSlug, GuidePage>;

export function buildGuideMetadata(slug: GuideSlug): Metadata {
  const guide = guideBySlug[slug];
  const path = `/guides/${guide.slug}`;

  return {
    title: guide.title,
    description: guide.description,
    alternates: { canonical: path },
    openGraph: {
      title: guide.title,
      description: guide.description,
      url: `${SITE_URL}${path}`,
      siteName: "Envitefy",
      images: [
        {
          url: DEFAULT_IMAGE,
          width: 1200,
          height: 630,
          alt: "Envitefy preview",
        },
      ],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: guide.title,
      description: guide.description,
      images: [DEFAULT_IMAGE],
    },
  };
}

export function GuidePageView({ slug }: { slug: GuideSlug }) {
  const guide = guideBySlug[slug];
  const url = `${SITE_URL}/guides/${guide.slug}`;
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
      {
        "@type": "ListItem",
        position: 3,
        name: guide.h1,
        item: url,
      },
    ],
  };
  const webPageLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: guide.h1,
    url,
    description: guide.description,
    isPartOf: {
      "@type": "WebSite",
      name: "Envitefy",
      url: SITE_URL,
    },
    about: ["event pages", "live cards", "RSVPs", "calendar saves", "Envitefy"],
  };
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: guide.faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#f6f2ff] via-white to-[#f7f3ff] px-4 py-12 text-[#2b1b16] sm:px-6">
      <article className="mx-auto max-w-5xl">
        <nav className="mb-8 text-sm font-semibold text-[#6c5fd6]" aria-label="Breadcrumb">
          <Link href="/guides" className="hover:text-[#2f2850]">
            Guides
          </Link>
        </nav>

        <header className="max-w-4xl">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#6c5fd6]">
            Envitefy guide
          </p>
          <h1 className="mt-3 text-4xl font-extrabold leading-tight tracking-tight text-[#2f2850] sm:text-5xl">
            {guide.h1}
          </h1>
          <p className="mt-5 text-xl leading-8 text-[#5a5377]">{guide.intro}</p>
        </header>

        <section className="mt-10 rounded-3xl border border-[#e5dcff] bg-white/92 p-6 shadow-[0_20px_60px_rgba(127,140,255,0.10)] sm:p-8">
          <h2 className="text-2xl font-bold text-[#2f2850]">Direct answer</h2>
          <p className="mt-3 text-lg leading-8 text-[#4f496c]">{guide.directAnswer}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={guide.cta.href}
              className="inline-flex items-center justify-center rounded-full bg-[#6c5fd6] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#6c5fd6]/25 hover:bg-[#5b50c2]"
            >
              {guide.cta.label}
            </Link>
            <Link
              href="/showcase"
              className="inline-flex items-center justify-center rounded-full border border-[#d9ceff] bg-white px-6 py-3 text-sm font-semibold text-[#433b66] hover:border-[#c6b8ff]"
            >
              View showcase
            </Link>
          </div>
        </section>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {guide.sections.map((section) => (
            <section
              key={section.heading}
              className="rounded-2xl border border-[#e5dcff] bg-white/88 p-6"
            >
              <h2 className="text-xl font-bold text-[#2f2850]">{section.heading}</h2>
              <p className="mt-3 leading-7 text-[#5a5377]">{section.body}</p>
            </section>
          ))}
        </div>

        <section className="mt-10 rounded-3xl border border-[#e5dcff] bg-[#fbf9ff] p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-[#2f2850]">Related Envitefy resources</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {guide.relatedLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-2xl border border-[#e5dcff] bg-white px-5 py-4 text-sm font-semibold text-[#433b66] hover:border-[#c6b8ff] hover:text-[#2f2850]"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-10 max-w-4xl">
          <h2 className="text-2xl font-bold text-[#2f2850]">FAQ</h2>
          <div className="mt-5 space-y-4">
            {guide.faq.map((item) => (
              <details
                key={item.question}
                className="rounded-2xl border border-[#e5dcff] bg-white p-5"
              >
                <summary className="cursor-pointer text-base font-semibold text-[#2f2850]">
                  {item.question}
                </summary>
                <p className="mt-3 leading-7 text-[#5a5377]">{item.answer}</p>
              </details>
            ))}
          </div>
        </section>
      </article>

      <Script id={`ld-guide-webpage-${guide.slug}`} type="application/ld+json">
        {JSON.stringify(webPageLd)}
      </Script>
      <Script id={`ld-guide-breadcrumb-${guide.slug}`} type="application/ld+json">
        {JSON.stringify(breadcrumbLd)}
      </Script>
      <Script id={`ld-guide-faq-${guide.slug}`} type="application/ld+json">
        {JSON.stringify(faqLd)}
      </Script>
    </main>
  );
}
