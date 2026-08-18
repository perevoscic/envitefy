import Script from "next/script";
import type { CSSProperties } from "react";
import SignedOutPageChrome from "@/components/navigation/SignedOutPageChrome";
import type { UseCasePage } from "../category-pages/category-page-data";
import BirthdayEditorialSections from "./_components/BirthdayEditorialSections";
import BirthdayHero from "./_components/BirthdayHero";
import { birthdayCreateHref } from "./birthday-landing-data";

export default function BirthdaysLandingView({ page }: { page: UseCasePage }) {
  const pageUrl = `https://envitefy.com${page.path}`;
  const cssVars = {
    "--birthday-accent": "#b85d39",
    "--birthday-ink": "#2d211c",
    "--birthday-muted": "#75645b",
    "--birthday-green": "#21372c",
    "--birthday-yellow": "#ffd66b",
  } as CSSProperties;

  const webPageLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: page.metadataTitle,
    url: pageUrl,
    description: page.description,
    about: page.keywords,
    isPartOf: { "@type": "WebSite", name: "Envitefy", url: "https://envitefy.com" },
  };

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: page.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };

  return (
    <div
      style={cssVars}
      className="min-h-screen bg-[#fffaf6] text-[var(--birthday-ink)] selection:bg-[#ffd5bd]"
    >
      <SignedOutPageChrome
        activeBottomNavLabel="Menu"
        brandHref="/"
        topNavVariant="transparent-dark"
      />

      <main>
        <BirthdayHero page={page} primaryHref={birthdayCreateHref} />
        <BirthdayEditorialSections page={page} primaryHref={birthdayCreateHref} />
      </main>

      <Script id={`ld-use-case-webpage-${page.slug}`} type="application/ld+json">
        {JSON.stringify(webPageLd)}
      </Script>
      <Script id={`ld-use-case-faq-${page.slug}`} type="application/ld+json">
        {JSON.stringify(faqLd)}
      </Script>
    </div>
  );
}
