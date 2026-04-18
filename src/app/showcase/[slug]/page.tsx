import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import SharedStudioCardPage from "@/components/studio/SharedStudioCardPage";
import { absoluteUrl } from "@/lib/absolute-url";
import {
  buildLandingShowcasePath,
  normalizeLandingShowcaseValue,
  resolveLandingShowcaseSnapshot,
} from "@/lib/landing-showcase";

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const awaitedParams = await props.params;
  const snapshot = resolveLandingShowcaseSnapshot(awaitedParams.slug);
  if (!snapshot) {
    return {
      title: "Showcase Card — Envitefy",
      description: "View a showcase live card from Envitefy.",
    };
  }

  const path = buildLandingShowcasePath(snapshot.slug);
  const url = await absoluteUrl(path);
  const imageUrl = await absoluteUrl(snapshot.imageUrl);
  const description = snapshot.invitationData.description || "View a showcase live card from Envitefy.";

  return {
    title: `${snapshot.title} — Envitefy`,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: `${snapshot.title} — Envitefy`,
      description,
      url,
      images: [{ url: imageUrl, alt: `${snapshot.title} preview` }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${snapshot.title} — Envitefy`,
      description,
      images: [imageUrl],
    },
  };
}

export default async function LandingShowcasePage(props: {
  params: Promise<{ slug: string }>;
}) {
  const awaitedParams = await props.params;
  const snapshot = resolveLandingShowcaseSnapshot(awaitedParams.slug);
  if (!snapshot) notFound();

  if (normalizeLandingShowcaseValue(awaitedParams.slug) !== normalizeLandingShowcaseValue(snapshot.slug)) {
    redirect(buildLandingShowcasePath(snapshot.slug));
  }

  const shareUrl = await absoluteUrl(buildLandingShowcasePath(snapshot.slug));

  return (
    <SharedStudioCardPage
      title={snapshot.title}
      imageUrl={snapshot.imageUrl}
      invitationData={snapshot.invitationData as any}
      positions={snapshot.positions as any}
      shareUrl={shareUrl}
    />
  );
}
