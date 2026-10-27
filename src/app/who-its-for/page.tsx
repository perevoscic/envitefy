import type { Metadata } from "next";
import Script from "next/script";
import CompanyTopNav from "@/components/company/CompanyTopNav";
import styles from "@/components/company/supporting-public.module.css";
import MarketingHero from "@/components/marketing/MarketingHero";
import MarketingPage from "@/components/marketing/MarketingPage";
import ArrowFillLink from "@/components/ui/ArrowFillLink";
import { buildSiteOgImage, getRandomSiteOgImageUrl } from "@/lib/site-og-images";

const siteOgImageUrl = getRandomSiteOgImageUrl();

export const metadata: Metadata = {
  title: "Who Envitefy is for",
  description:
    "Parents, gymnastics families, coaches, and meet organizers use Envitefy to capture and share event details.",
  openGraph: {
    title: "Who Envitefy is for",
    description: "See how parents, gymnastics families, coaches, and meet organizers use Envitefy.",
    url: "https://envitefy.com/who-its-for",
    siteName: "Envitefy",
    images: [buildSiteOgImage(siteOgImageUrl)],
    type: "website",
  },
  alternates: { canonical: "/who-its-for" },
};

export default function WhoItsForPage() {
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
        name: "Who it’s for",
        item: "https://envitefy.com/who-its-for",
      },
    ],
  };
  return (
    <MarketingPage className={styles.content}>
      <CompanyTopNav />
      <main>
        <MarketingHero
          eyebrow="Who it’s for"
          title={
            <>
              For your people.
              <br />
              <em>And all your plans.</em>
            </>
          }
          description="From a family celebration to a team weekend, give everyone a thoughtful place to find the details and stay connected."
          image="/images/about/hero/envitefy-about-hero-poster.webp"
          imageAlt="Envitefy event pages for celebrations and community gatherings"
          primaryHref="/create"
          primaryRequiresAccount
          primaryLabel="Create your event"
          secondaryHref="/showcase"
          secondaryLabel="See examples"
        />
        <section className={styles.section} id="how-it-works">
          <p className={styles.eyebrow}>Who it’s for</p>
          <h2 className={styles.title}>Find the right page for your next occasion.</h2>
          <div className={styles.grid}>
            <article className={styles.card}>
              <span className={styles.number}>Celebrations</span>
              <h3>Families and hosts</h3>
              <p>
                Create birthdays, weddings, showers and gatherings with a beautiful invitation,
                guest responses and useful links.
              </p>
            </article>
            <article className={styles.card}>
              <span className={styles.number}>School & community</span>
              <h3>Teachers and volunteers</h3>
              <p>
                Keep class parties, supplies, potluck items and helper shifts organized with
                shareable sign-up forms.
              </p>
            </article>
            <article className={styles.card}>
              <span className={styles.number}>Sports & teams</span>
              <h3>Coaches and organizers</h3>
              <p>
                Turn schedules, meet packets and venue information into a page families can check on
                the go.
              </p>
            </article>
          </div>
          <div className={styles.links}>
            <ArrowFillLink href="/birthdays" label="Celebrations" />
            <ArrowFillLink href="/signup-forms" label="Sign-up forms" />
            <ArrowFillLink href="/sport-events" label="Sports and teams" />
            <ArrowFillLink href="/gymnastics" label="Gymnastics meet pages" />
          </div>
        </section>
        <Script id="ld-breadcrumb-who" type="application/ld+json" strategy="afterInteractive">
          {JSON.stringify(breadcrumbLd)}
        </Script>
      </main>
    </MarketingPage>
  );
}
