import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { absoluteUrl } from "@/lib/absolute-url";
import {
  buildLandingShowcasePath,
  resolveLandingShowcaseSnapshot,
} from "@/lib/landing-showcase";
import StudioMarketingPage from "./StudioMarketingPage";
import StudioWorkspace from "./StudioWorkspace";

const DEFAULT_TITLE = "Envitefy Studio | Live Cards, Invitation Design & Event Pages";
const DEFAULT_DESCRIPTION =
  "Explore Envitefy Studio to shape live cards, invitation designs, and hosted event pages with RSVP, registry, schedule, and sharing actions.";
const DEFAULT_IMAGE = "https://envitefy.com/og-default.jpg";

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
  if (showcaseSnapshot) {
    redirect(buildLandingShowcasePath(showcaseSnapshot.slug));
  }

  const session: any = await getServerSession(authOptions as any);
  if (session?.user) {
    return <StudioWorkspace />;
  }
  return <StudioMarketingPage />;
}
