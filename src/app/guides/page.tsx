import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { guidePages } from "./guide-content";

const SITE_URL = "https://envitefy.com";

export const metadata: Metadata = {
  title: "Envitefy Guides | Live cards, uploads, RSVPs, and meet pages",
  description:
    "Answer-focused Envitefy guides for turning PDFs, flyers, invites, and schedules into hosted live event pages.",
  alternates: { canonical: "/guides" },
  openGraph: {
    title: "Envitefy Guides",
    description:
      "Guides for live cards, Snap uploads, RSVP event pages, guest sharing, and gymnastics meet pages.",
    url: `${SITE_URL}/guides`,
    siteName: "Envitefy",
    images: [
      {
        url: `${SITE_URL}/og-default.jpg`,
        width: 1200,
        height: 630,
        alt: "Envitefy preview",
      },
    ],
    type: "website",
  },
};

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
    <main className="min-h-screen bg-gradient-to-b from-[#f6f2ff] via-white to-[#f7f3ff] px-4 py-12 text-[#2b1b16] sm:px-6">
      <section className="mx-auto max-w-6xl">
        <header className="max-w-4xl">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#6c5fd6]">
            Envitefy resources
          </p>
          <h1 className="mt-3 text-4xl font-extrabold leading-tight tracking-tight text-[#2f2850] sm:text-5xl">
            Guides for live event pages, uploads, RSVPs, and gymnastics meets
          </h1>
          <p className="mt-5 text-xl leading-8 text-[#5a5377]">
            Practical answers for hosts, parents, coaches, meet organizers, and guests using
            Envitefy to turn invites, flyers, PDFs, schedules, and live cards into shareable event
            pages.
          </p>
        </header>

        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {guidePages.map((guide) => (
            <Link
              key={guide.slug}
              href={`/guides/${guide.slug}`}
              className="rounded-3xl border border-[#e5dcff] bg-white/90 p-6 shadow-[0_20px_60px_rgba(127,140,255,0.08)] transition hover:border-[#c6b8ff] hover:shadow-[0_24px_70px_rgba(127,140,255,0.13)]"
            >
              <h2 className="text-xl font-bold text-[#2f2850]">{guide.h1}</h2>
              <p className="mt-3 leading-7 text-[#5a5377]">{guide.intro}</p>
              <span className="mt-5 inline-flex text-sm font-semibold text-[#6c5fd6]">
                Read guide
              </span>
            </Link>
          ))}
        </div>

        <section className="mt-12 rounded-3xl border border-[#e5dcff] bg-[#fbf9ff] p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-[#2f2850]">
            Start from the right Envitefy surface
          </h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <Link
              href="/snap"
              className="rounded-2xl border border-[#e5dcff] bg-white px-5 py-4 text-sm font-semibold text-[#433b66] hover:border-[#c6b8ff]"
            >
              Snap uploads
            </Link>
            <Link
              href="/studio"
              className="rounded-2xl border border-[#e5dcff] bg-white px-5 py-4 text-sm font-semibold text-[#433b66] hover:border-[#c6b8ff]"
            >
              Studio live cards
            </Link>
            <Link
              href="/gymnastics"
              className="rounded-2xl border border-[#e5dcff] bg-white px-5 py-4 text-sm font-semibold text-[#433b66] hover:border-[#c6b8ff]"
            >
              Gymnastics meet pages
            </Link>
          </div>
        </section>
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
