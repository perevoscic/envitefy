import { isRecord, matchesSchema, strictObject, stringList } from "../creation/source-evidence.ts";
import type { StudioEventDetails, StudioGenerateSurface } from "./types.ts";
import { compileArtworkContract } from "./artwork-copy.ts";

export type StudioProduct = "live_card" | "digital_flyer" | "printable_flyer" | "event_page";
export const EVENT_PAGE_SECTIONS = ["details", "schedule", "location", "rsvp", "registry"] as const;
export type StudioCreativePlan = {
  /** Assigned by the compiler; model prose cannot change approved copy coverage. */
  approvedTextBlockIds?: string[];
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

export function normalizeCreativePlan(value: unknown): StudioCreativePlan | undefined {
  if (!isRecord(value)) return undefined;
  const { approvedTextBlockIds, ...modelPlan } = value;
  if (!matchesSchema(modelPlan, CREATIVE_PLAN_SCHEMA)) return undefined;
  return {
    ...(modelPlan as StudioCreativePlan),
    ...(Array.isArray(approvedTextBlockIds) ? { approvedTextBlockIds: approvedTextBlockIds.filter((id): id is string => typeof id === "string") } : {}),
  };
}

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
      imageText: "complete_invitation" as const,
      description:
        "5 × 7 inch printable invitation. Design the complete artwork and all approved wording together, keeping essential lettering inside a 0.3 inch print-safe margin. Use the full canvas; interactive actions sit outside the artwork.",
    };
  if (product === "digital_flyer")
    return {
      product,
      width: 1200,
      height: 1800,
      dpi: 144,
      safeMargin: 84,
      imageText: "complete_invitation" as const,
      description:
        "Self-contained downloadable invitation. Compose the complete artwork, approved wording, and supplied logistics together across the full canvas. Keep lettering comfortably inset for legibility. Interactive actions sit outside the artwork.",
    };
  if (product === "event_page")
    return {
      product,
      width: 1536,
      height: 1024,
      dpi: 144,
      safeMargin: 72,
      imageText: "none" as const,
      description:
        "Text-free website hero. Copy and supported sections are rendered by the event website. Never generate UI, navigation, HTML or unimplemented features.",
    };
  return {
    product,
    width: 1024,
    height: 1536,
    dpi: 144,
    safeMargin: 72,
    imageText: "headline" as const,
    description:
      "Live card: paint only the approved celebration title (for example \"Livia is turning 10\") plus any explicitly required artwork lines. Use correct English word spacing; never glue words together. When, where, movie, dinner, RSVP and calendar facts belong in the guest-action buttons (RSVP, Overview, Location, Calendar, Registry), not in the raster. Do not paint those button labels. Interactive actions overlay the bottom edge of the artwork; continue the scene behind them, keeping essential lettering and faces above the controls. Do not add a blank band or black footer.",
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
  const sports = /\b(?:basketball|soccer|football|baseball|softball|volleyball|lacrosse|hockey|tennis|swimming|wrestling|gymnastics|cheerleading)\b/gi;
  const supplied = new Set(([event.title, event.sportType, event.semanticKind, event.userIdea, event.description, ...(event.guestInstructions || [])].filter(Boolean).join(" ").toLowerCase().match(sports) || []));
  const proposed = `${plan?.concept || ""} ${plan?.focalSubject || ""}`.toLowerCase().match(sports) || [];
  const unsupportedSubject = supplied.size > 0 && proposed.some((subject) => !supplied.has(subject));
  return {
    ...(plan || defaults),
    ...(unsupportedSubject ? { concept: defaults.concept, focalSubject: defaults.focalSubject } : {}),
    approvedTextBlockIds: compileArtworkContract(event, product).blocks.filter((block) => block.surface === "artwork").map((block) => block.id),
    layout:
      plan?.layout === "property_collage" && (event.propertyImageUrls?.length || 0) > 1
        ? "property_collage"
        : plan
          ? "single_scene"
          : defaults.layout,
    // Model-authored prose cannot promise copy that the image contract excludes.
    // The user's lettering direction remains in guidance, separate from required content.
    textPlacement: defaults.textPlacement,
    sections: defaults.sections,
  };
}
