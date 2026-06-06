import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { absoluteUrl } from "@/lib/absolute-url";
import UseCaseLandingView from "./CategoryLandingView";
import { getUseCasePageByPath } from "./category-page-data";

export async function buildUseCaseCategoryMetadata(path: string): Promise<Metadata> {
  const page = getUseCasePageByPath(path);

  if (!page) {
    return {
      title: "Event Page | Envitefy",
      description: "Create beautiful Envitefy event pages, invitations, RSVPs, and signups.",
    };
  }

  const canonical = await absoluteUrl(page.path);
  const imageUrl = await absoluteUrl(page.heroImage);

  return {
    title: page.metadataTitle,
    description: page.description,
    keywords: page.keywords,
    alternates: {
      canonical,
    },
    openGraph: {
      title: page.metadataTitle,
      description: page.description,
      url: canonical,
      siteName: "Envitefy",
      images: [{ url: imageUrl, alt: page.heroImageAlt }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: page.metadataTitle,
      description: page.description,
      images: [imageUrl],
    },
  };
}

export function UseCaseCategoryPage({ path }: { path: string }) {
  const page = getUseCasePageByPath(path);
  if (!page) notFound();

  return <UseCaseLandingView page={page} />;
}
