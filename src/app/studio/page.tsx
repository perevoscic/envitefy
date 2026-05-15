import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Script from "next/script";
import { getServerSession } from "next-auth";
import { absoluteUrl } from "@/lib/absolute-url";
import { authOptions, resolveSessionUserId } from "@/lib/auth";
import { getEventHistoryById } from "@/lib/db";
import { buildLandingShowcasePath, resolveLandingShowcaseSnapshot } from "@/lib/landing-showcase";
import { getRandomSiteOgImageUrl } from "@/lib/site-og-images";
import StudioMarketingPage from "./StudioMarketingPage";
import StudioWorkspace from "./StudioWorkspace";

const DEFAULT_TITLE = "Envitefy Studio | Live Cards, Invitation Design & Event Pages";
const DEFAULT_DESCRIPTION =
  "Explore Envitefy Studio to shape live cards, invitation designs, and hosted event pages with RSVP, registry, schedule, and sharing actions.";
const DEFAULT_IMAGE = getRandomSiteOgImageUrl();

function readSearchParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return typeof value[0] === "string" ? value[0].trim() : "";
  }
  return typeof value === "string" ? value.trim() : "";
}

export async function generateMetadata(props: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const awaitedSearchParams = props.searchParams ? await props.searchParams : undefined;
  const showcaseValue = readSearchParam(awaitedSearchParams?.showcase);
  const showcaseSnapshot = resolveLandingShowcaseSnapshot(showcaseValue);
  const title = showcaseSnapshot ? `${showcaseSnapshot.title} | Envitefy Studio` : DEFAULT_TITLE;
  const description = showcaseSnapshot?.invitationData.description || DEFAULT_DESCRIPTION;
  const url = showcaseSnapshot
    ? await absoluteUrl(buildLandingShowcasePath(showcaseSnapshot.slug))
    : "https://envitefy.com/studio";
  const imageUrl = showcaseSnapshot ? await absoluteUrl(showcaseSnapshot.imageUrl) : DEFAULT_IMAGE;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: "Envitefy",
      images: [
        {
          url: imageUrl,
          alt: showcaseSnapshot ? `${showcaseSnapshot.title} preview` : "Envitefy Studio preview",
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
    alternates: {
      canonical: showcaseSnapshot ? url : "/studio",
    },
  };
}

export default async function StudioPage(props: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const awaitedSearchParams = props.searchParams ? await props.searchParams : undefined;
  const showcaseValue = readSearchParam(awaitedSearchParams?.showcase);
  const showcaseSnapshot = resolveLandingShowcaseSnapshot(showcaseValue);
  const editEventId = readSearchParam(awaitedSearchParams?.editEvent);
  if (showcaseSnapshot) {
    redirect(buildLandingShowcasePath(showcaseSnapshot.slug));
  }

  const session: any = await getServerSession(authOptions as any);
  if (session?.user) {
    let initialEditEventRow: unknown = null;
    let initialEditEventError: string | null = null;

    if (editEventId) {
      const userId = await resolveSessionUserId(session);
      if (!userId) {
        initialEditEventError = "Sign in as the event owner to edit this card.";
      } else {
        const row = await getEventHistoryById(editEventId);
        if (!row) {
          initialEditEventError = "This event could not be found.";
        } else if (row.user_id !== userId) {
          initialEditEventError = "You do not have permission to edit this event.";
        } else {
          initialEditEventRow = JSON.parse(JSON.stringify(row));
        }
      }
    }

    return (
      <StudioWorkspace
        initialEditEventId={editEventId || null}
        initialEditEventRow={initialEditEventRow}
        initialEditEventError={initialEditEventError}
      />
    );
  }
  const studioWebPageLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Envitefy Studio",
    url: "https://envitefy.com/studio",
    description: DEFAULT_DESCRIPTION,
    isPartOf: {
      "@type": "WebSite",
      name: "Envitefy",
      url: "https://envitefy.com",
    },
    about: ["live card invitations", "hosted event pages", "RSVP event pages"],
  };

  return (
    <>
      <StudioMarketingPage />
      <Script id="ld-studio-webpage" type="application/ld+json">
        {JSON.stringify(studioWebPageLd)}
      </Script>
    </>
  );
}
