import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import styles from "@/components/company/supporting-public.module.css";
import { landingLiveCardSnapshots } from "@/components/landing/landing-live-card-snapshots";
import MarketingPage from "@/components/marketing/MarketingPage";
import SignedOutPageChrome from "@/components/navigation/SignedOutPageChrome";
import { absoluteUrl } from "@/lib/absolute-url";
import { buildLandingShowcasePath } from "@/lib/landing-showcase";

export async function generateMetadata(): Promise<Metadata> {
  const url = await absoluteUrl("/showcase");
  const imageUrl = await absoluteUrl(landingLiveCardSnapshots[0]?.imageUrl || "/og-default.jpg");

  return {
    title: "Envitefy Showcase | Live Card Examples",
    description:
      "Browse public Envitefy live card showcase examples across birthdays, weddings, showers, school events, game days, and more.",
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: "Envitefy Showcase | Live Card Examples",
      description:
        "Browse public Envitefy live card showcase examples across birthdays, weddings, showers, school events, game days, and more.",
      url,
      siteName: "Envitefy",
      images: [{ url: imageUrl, alt: "Envitefy live card showcase examples" }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "Envitefy Showcase | Live Card Examples",
      description:
        "Browse public Envitefy live card showcase examples across birthdays, weddings, showers, school events, game days, and more.",
      images: [imageUrl],
    },
  };
}

export default async function ShowcaseIndexPage() {
  const collectionUrl = await absoluteUrl("/showcase");
  const itemListElement = await Promise.all(
    landingLiveCardSnapshots.map(async (snapshot, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: snapshot.title,
      url: await absoluteUrl(buildLandingShowcasePath(snapshot.slug)),
      image: await absoluteUrl(snapshot.imageUrl),
    })),
  );
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Envitefy Showcase",
    description:
      "A public gallery of Envitefy live card examples across birthdays, weddings, showers, school events, and community invitations.",
    url: collectionUrl,
    mainEntity: {
      "@type": "ItemList",
      itemListElement,
    },
  };

  return (
    <MarketingPage className={styles.content}>
      <SignedOutPageChrome
        activeBottomNavLabel="Examples"
        brandHref="/"
        topNavVariant="transparent-light"
      />
      <Script id="ld-showcase-collection" type="application/ld+json">
        {JSON.stringify(structuredData)}
      </Script>
      <main className={styles.showcase}>
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
          <div className={styles.showcaseHeader}>
            <p className={styles.eyebrow}>Public Live Cards</p>
            <h1 className={styles.title}>A little inspiration for your next occasion.</h1>
            <p className={styles.intro}>
              Crawlable showcase pages for live invitation cards, event pages, and hosted RSVP
              experiences. Each example links to its own public URL with a dedicated preview image.
            </p>
          </div>

          <div className={styles.showcaseGrid}>
            {landingLiveCardSnapshots.map((snapshot) => {
              const href = buildLandingShowcasePath(snapshot.slug);
              const description =
                snapshot.invitationData.description || "View a public Envitefy showcase card.";
              const category =
                typeof snapshot.invitationData.eventDetails?.category === "string"
                  ? snapshot.invitationData.eventDetails.category
                  : "Live card";

              return (
                <Link key={snapshot.id} href={href} className={styles.showcaseCard}>
                  <div className={styles.showcaseImage}>
                    <img
                      src={snapshot.imageUrl}
                      alt={`${snapshot.title} invitation preview`}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                      loading="lazy"
                    />
                  </div>
                  <div className={styles.showcaseCaption}>
                    <p className={styles.eyebrow}>{category}</p>
                    <h2>{snapshot.title}</h2>
                    <p>{description}</p>
                    <span>Explore example ↗</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </main>
    </MarketingPage>
  );
}
