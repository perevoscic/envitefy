import { strictObject, stringList } from "../creation/source-evidence.ts";
import type { StudioEventDetails, StudioGenerateSurface } from "./types.ts";

export type StudioProduct = "live_card" | "digital_flyer" | "printable_flyer" | "event_page";
export const EVENT_PAGE_SECTIONS = ["details", "schedule", "location", "rsvp", "registry"] as const;
export type StudioCreativePlan = {
  concept: string;
  focalSubject: string;
  layout: "single_scene" | "property_collage";
  textPlacement: string;
  sections: Array<(typeof EVENT_PAGE_SECTIONS)[number]>;
  exclusions: string[];
};
export const CREATIVE_PLAN_SCHEMA = strictObject({
  concept: { type: "string" },
  focalSubject: { type: "string" },
  layout: { type: "string", enum: ["single_scene", "property_collage"] },
  textPlacement: { type: "string" },
  sections: { type: "array", items: { type: "string", enum: EVENT_PAGE_SECTIONS } },
  exclusions: stringList,
});

export function resolveStudioProduct(
  product: unknown,
  surface?: StudioGenerateSurface,
): StudioProduct {
  if (
    product === "live_card" ||
    product === "digital_flyer" ||
    product === "printable_flyer" ||
    product === "event_page"
  )
    return product;
  if (product === "invitation" || product === "printable")
    return product === "printable" ? "printable_flyer" : "digital_flyer";
  return surface === "image" ? "digital_flyer" : "live_card";
}
export function productContract(product: StudioProduct) {
  if (product === "printable_flyer")
    return {
      product,
      width: 1500,
      height: 2100,
      dpi: 300,
      safeMargin: 90,
      imageText: "none",
      description:
        "5 × 7 inch printable flyer. The server typesets all event wording inside a 0.3 inch safe margin. Artwork is text-free, with no app-button zone.",
    };
  if (product === "digital_flyer")
    return {
      product,
      width: 1200,
      height: 1800,
      dpi: 144,
      safeMargin: 84,
      imageText: "none",
      description:
        "Self-contained downloadable invitation. The server typesets event wording and logistics; generate text-free artwork with no app-button zone.",
    };
  if (product === "event_page")
    return {
      product,
      width: 1536,
      height: 1024,
      dpi: 144,
      safeMargin: 72,
      imageText: "none",
      description:
        "Text-free website hero. Copy and supported sections are rendered by the event website. Never generate UI, navigation, HTML or unimplemented features.",
    };
  return {
    product,
    width: 1024,
    height: 1536,
    dpi: 144,
    safeMargin: 72,
    imageText: "title",
    description:
      "Live card: only the approved subject/title in artwork. Keep the bottom 30% free of essential text and subjects for app actions; logistics live in the detail panels.",
  };
}

export function defaultCreativePlan(
  event: StudioEventDetails,
  product: StudioProduct,
): StudioCreativePlan {
  return {
    concept: event.userIdea || "A polished hosted celebration with a clear focal subject",
    focalSubject: event.honoreeName || event.title,
    layout: (event.propertyImageUrls?.length || 0) > 1 ? "property_collage" : "single_scene",
    textPlacement: productContract(product).description,
    sections:
      product === "event_page"
        ? [
            "details",
            "schedule",
            "location",
            ...(event.rsvpEnabled ? ["rsvp" as const] : []),
            ...(event.links?.length ? ["registry" as const] : []),
          ]
        : [],
    exclusions: [],
  };
}

export function validateCreativePlan(
  event: StudioEventDetails,
  product: StudioProduct,
  plan?: StudioCreativePlan,
): StudioCreativePlan {
  const defaults = defaultCreativePlan(event, product);
  return {
    ...(plan || defaults),
    layout:
      plan?.layout === "property_collage" && (event.propertyImageUrls?.length || 0) > 1
        ? "property_collage"
        : plan
          ? "single_scene"
          : defaults.layout,
    textPlacement: defaults.textPlacement,
    sections: defaults.sections,
  };
}
