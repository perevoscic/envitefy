import type { Metadata } from "next";
import Script from "next/script";
import UseCases from "../landing/sections/UseCases";

export const metadata: Metadata = {
  title: "Who Envitefy is for",
  description:
    "Parents, coaches, teachers, and couples use Envitefy to share events, collect RSVPs, and keep calendars in sync.",
  openGraph: {
    title: "Who Envitefy is for",
    description:
      "See how parents, coaches, teachers, and couples use Envitefy.",
    url: "https://envitefy.com/who-its-for",
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
  alternates: { canonical: "/who-its-for" },
};

export default function WhoItsForPage() {
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://envitefy.com/" },
      { "@type": "ListItem", position: 2, name: "Who it’s for", item: "https://envitefy.com/who-its-for" },
    ],
  };
  return (
    <main className="min-h-screen w-full bg-background text-foreground">
      <section className="max-w-5xl mx-auto px-6 pt-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-center">Who it’s for</h1>
        <p className="mt-3 text-center text-foreground/70">
          Envitefy helps busy families, teams, and classrooms stay coordinated.
        </p>
      </section>
      <UseCases />
      <Script id="ld-breadcrumb-who" type="application/ld+json" strategy="afterInteractive">
        {JSON.stringify(breadcrumbLd)}
      </Script>
    </main>
  );
}


