import type { Metadata } from "next";
import Script from "next/script";
import HowItWorks from "../landing/sections/HowItWorks";

export const metadata: Metadata = {
  title: "How Envitefy Works",
  description:
    "See how Envitefy turns flyers and invitations into shareable calendar events with smart RSVPs and sign‑up forms.",
  openGraph: {
    title: "How Envitefy Works",
    description:
      "Turn flyers and invites into calendar events with RSVPs and smart sign‑ups.",
    url: "https://envitefy.com/how-it-works",
    siteName: "Envitefy",
    images: [
      {
        url: "https://envitefy.com/og-default-v2.jpg",
        width: 1200,
        height: 630,
        alt: "Envitefy preview",
      },
    ],
    type: "website",
  },
  alternates: { canonical: "/how-it-works" },
};

export default function HowItWorksPage() {
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
        name: "How it works",
        item: "https://envitefy.com/how-it-works",
      },
    ],
  };

  return (
    <main className="min-h-screen w-full bg-background text-foreground">
      <section className="max-w-5xl mx-auto px-6 pt-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-center">
          How Envitefy works
        </h1>
        <p className="mt-3 text-center text-foreground/70">
          From snap to share in seconds — add events to your calendar without
          manual entry.
        </p>
      </section>
      <HowItWorks />
      <Script
        id="ld-breadcrumb-how"
        type="application/ld+json"
        strategy="afterInteractive"
      >
        {JSON.stringify(breadcrumbLd)}
      </Script>
    </main>
  );
}
