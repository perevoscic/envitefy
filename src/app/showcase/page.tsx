import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { landingLiveCardSnapshots } from "@/components/landing/landing-live-card-snapshots";
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
    <main className="min-h-screen bg-[#f7f1e8] px-6 py-12 text-[#261713] sm:px-8 lg:px-12">
      <Script
        id="ld-showcase-collection"
        type="application/ld+json"
      >
        {JSON.stringify(structuredData)}
      </Script>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <div className="max-w-3xl space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#8b5e3c]">
            Public Live Cards
          </p>
          <h1 className="text-4xl font-semibold tracking-[-0.04em] text-[#1d120e] sm:text-5xl">
            Envitefy showcase examples
          </h1>
          <p className="text-base leading-7 text-[#5b4337] sm:text-lg">
            Crawlable showcase pages for live invitation cards, event pages, and hosted RSVP
            experiences. Each example links to its own public URL with a dedicated preview image.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {landingLiveCardSnapshots.map((snapshot) => {
            const href = buildLandingShowcasePath(snapshot.slug);
            const description =
              snapshot.invitationData.description || "View a public Envitefy showcase card.";
            const category =
              typeof snapshot.invitationData.eventDetails?.category === "string"
                ? snapshot.invitationData.eventDetails.category
                : "Live card";

            return (
              <Link
                key={snapshot.id}
                href={href}
                className="group overflow-hidden rounded-[2rem] border border-[#d8c6b8] bg-white shadow-[0_18px_45px_rgba(73,38,20,0.08)] transition hover:-translate-y-1 hover:shadow-[0_22px_55px_rgba(73,38,20,0.14)]"
              >
                <div className="aspect-[9/16] overflow-hidden bg-[#eaded3]">
                  <img
                    src={snapshot.imageUrl}
                    alt={`${snapshot.title} invitation preview`}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                    loading="lazy"
                  />
                </div>
                <div className="space-y-3 px-5 py-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#a66f46]">
                    {category}
                  </p>
                  <h2 className="text-2xl font-semibold tracking-[-0.03em] text-[#231612]">
                    {snapshot.title}
                  </h2>
                  <p className="text-sm leading-6 text-[#654c40]">{description}</p>
                  <p className="text-sm font-medium text-[#1d120e]">Open showcase</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
