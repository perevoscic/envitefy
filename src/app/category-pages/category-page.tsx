import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { absoluteUrl } from "@/lib/absolute-url";
import { buildCategoryShareMetadata } from "@/lib/category-share-metadata";
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

  return {
    title: page.metadataTitle,
    description: page.description,
    keywords: page.keywords,
    alternates: {
      canonical,
    },
    ...buildCategoryShareMetadata(page.path.slice(1), {
      title: page.metadataTitle,
      description: page.description,
      url: canonical,
    }),
  };
}

export function UseCaseCategoryPage({ path }: { path: string }) {
  const page = getUseCasePageByPath(path);
  if (!page) notFound();

  return <UseCaseLandingView page={page} />;
}
