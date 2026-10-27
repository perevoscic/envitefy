import type { Metadata } from "next";
import Script from "next/script";
import CompanyTopNav from "@/components/company/CompanyTopNav";
import styles from "@/components/company/supporting-public.module.css";
import MarketingHero from "@/components/marketing/MarketingHero";
import MarketingPage from "@/components/marketing/MarketingPage";
import PublicCreationLink from "@/components/marketing/PublicCreationLink";
import ArrowFillLink from "@/components/ui/ArrowFillLink";
import { buildSiteOgImage, getRandomSiteOgImageUrl } from "@/lib/site-og-images";

const siteOgImageUrl = getRandomSiteOgImageUrl();

export const metadata: Metadata = {
  title: "How Envitefy Works",
  description:
    "See how Envitefy turns flyers into clean event details and powers gymnastics meet pages.",
  openGraph: {
    title: "How Envitefy Works",
    description: "Turn flyers into clean event details and publish gymnastics meet pages.",
    url: "https://envitefy.com/how-it-works",
    siteName: "Envitefy",
    images: [buildSiteOgImage(siteOgImageUrl)],
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
    <MarketingPage className={styles.content}>
      <CompanyTopNav />
      <main>
        <MarketingHero
          eyebrow="How it works"
          title={
            <>
              A few simple steps.
              <br />
              <em>A lovely way to gather.</em>
            </>
          }
          description="Bring the details, make the page your own, and send one link. Envitefy keeps the invitation and the practical things together."
          image="/images/landing/hero/garden-vows-desktop.webp"
          imageAlt="Envitefy event page with original invitation artwork"
          primaryHref="/create"
          primaryRequiresAccount
          primaryLabel="Create your event"
          secondaryHref="/showcase"
          secondaryLabel="See examples"
        />
        <section className={styles.section} id="how-it-works">
          <p className={styles.eyebrow}>How it works</p>
          <h2 className={styles.title}>There is more than one way to begin.</h2>
          <div className={styles.grid}>
            <article className={styles.card}>
              <span className={styles.number}>01 / Start</span>
              <h3>Bring your plans</h3>
              <p>
                Upload a flyer or PDF, paste a public event link, or start from an original design.
              </p>
            </article>
            <article className={styles.card}>
              <span className={styles.number}>02 / Make it yours</span>
              <h3>Add the personal touches</h3>
              <p>
                Review the date, place and wording. Choose your design and add the guest actions
                your event needs.
              </p>
            </article>
            <article className={styles.card}>
              <span className={styles.number}>03 / Share</span>
              <h3>One link for everyone</h3>
              <p>
                Explicitly save or publish, then share your page. Guests can open it in a browser,
                RSVP and find current details.
              </p>
            </article>
          </div>
          <div className={styles.links}>
            <PublicCreationLink href="/create" label="Start from scratch" />
            <ArrowFillLink href="/snap" label="Upload with Snap" />
            <PublicCreationLink href="/live-cards" label="Explore live cards" />
            <ArrowFillLink href="/guides" label="Read a guide" />
          </div>
        </section>
        <Script id="ld-breadcrumb-how" type="application/ld+json" strategy="afterInteractive">
          {JSON.stringify(breadcrumbLd)}
        </Script>
      </main>
    </MarketingPage>
  );
}
