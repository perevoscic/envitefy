import Script from "next/script";
import type { CSSProperties } from "react";
import MarketingPage from "@/components/marketing/MarketingPage";
import SignedOutPageChrome from "@/components/navigation/SignedOutPageChrome";
import PublicTemplateGallery from "@/components/templates/PublicTemplateGallery";
import publicStyles from "@/styles/public-appearance.module.css";
import editorialStyles from "../category-pages/CelebrationLanding.module.css";
import type { UseCasePage } from "../category-pages/category-page-data";
import BirthdayEditorialSections from "./_components/BirthdayEditorialSections";
import BirthdayHero from "./_components/BirthdayHero";
import { birthdayCreateHref } from "./birthday-landing-data";

export default function BirthdaysLandingView({ page }: { page: UseCasePage }) {
  const pageUrl = `https://envitefy.com${page.path}`;
  const cssVars = {
    "--birthday-accent": "#8f3f23",
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
    <MarketingPage className={`${publicStyles.page} ${editorialStyles.editorial}`}>
      <SignedOutPageChrome activeBottomNavLabel="Menu" brandHref="/" />

      <main style={cssVars}>
        <BirthdayHero page={page} primaryHref={birthdayCreateHref} />
        <PublicTemplateGallery category="birthdays" featured />
        <BirthdayEditorialSections page={page} primaryHref={birthdayCreateHref} />
      </main>

      <Script id={`ld-use-case-webpage-${page.slug}`} type="application/ld+json">
        {JSON.stringify(webPageLd)}
      </Script>
      <Script id={`ld-use-case-faq-${page.slug}`} type="application/ld+json">
        {JSON.stringify(faqLd)}
      </Script>
    </MarketingPage>
  );
}
