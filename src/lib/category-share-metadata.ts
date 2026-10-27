import type { Metadata } from "next";
import categoryShareCards from "@/data/category-share-cards.json";

/** Keep messaging and social previews tied to the category of the shared page. */
export function buildCategoryShareMetadata(
  category: string,
  input: { title: string; description: string; url: string },
): Pick<Metadata, "openGraph" | "twitter"> {
  const key = category === "sport-events" ? "sports" : category;
  if (!Object.hasOwn(categoryShareCards, key)) {
    throw new Error(`Missing category share card: ${category}`);
  }
  const card = categoryShareCards[key as keyof typeof categoryShareCards];
  const image = {
    url: `/og/categories/${key}-v1.jpg`,
    width: 1200,
    height: 630,
    alt: `Envitefy ${card.name} preview`,
  };

  return {
    openGraph: {
      title: input.title,
      description: input.description,
      url: input.url,
      siteName: "Envitefy",
      images: [image],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description: input.description,
      images: [image],
    },
  };
}
