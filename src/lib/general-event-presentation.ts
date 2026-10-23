import type { BodyPresentation } from "@/components/templates/TemplateBodyLayout";
import type {
  ThemedEventBodyPresentation,
  ThemedEventEditorLayout,
} from "@/data/event-page-art-direction-types";
import { type GeneralEventDesign, getGeneralEventDesign } from "./general-event-designs";
import { HOLIDAY_COLLECTIONS } from "./holiday-collections";

type PageDirection = {
  editorLayout: ThemedEventEditorLayout;
  body: BodyPresentation;
  alignment: "left" | "center";
};

// These preserve the first ten authored covers in each occasion collection. The
// final letterpress design has its own reading rail, rather than repeating editorial.
const occasionDirections: PageDirection[] = [
  {
    editorLayout: "banner",
    alignment: "left",
    body: {
      layout: "rail",
      surface: "ruled",
      heading: "underline",
      flow: "practical",
      spacing: "airy",
    },
  },
  {
    editorLayout: "spotlight",
    alignment: "center",
    body: {
      layout: "islands",
      surface: "arch",
      heading: "masthead",
      flow: "invitation",
      spacing: "airy",
    },
  },
  {
    editorLayout: "editorial",
    alignment: "left",
    body: {
      layout: "editorial",
      surface: "offset",
      heading: "side",
      flow: "practical",
      spacing: "balanced",
    },
  },
  {
    editorLayout: "minimal",
    alignment: "left",
    body: {
      layout: "ledger",
      surface: "double",
      heading: "caption",
      flow: "people",
      spacing: "compact",
    },
  },
  {
    editorLayout: "poster",
    alignment: "center",
    body: {
      layout: "poster",
      surface: "cut",
      heading: "ribbon",
      flow: "invitation",
      spacing: "airy",
    },
  },
  {
    editorLayout: "split",
    alignment: "center",
    body: {
      layout: "book",
      surface: "frame",
      heading: "masthead",
      flow: "memories",
      spacing: "balanced",
    },
  },
  {
    editorLayout: "cards",
    alignment: "left",
    body: {
      layout: "stagger",
      surface: "offset",
      heading: "number",
      flow: "people",
      spacing: "airy",
    },
  },
  {
    editorLayout: "spotlight",
    alignment: "center",
    body: {
      layout: "gallery",
      surface: "oval",
      heading: "caption",
      flow: "invitation",
      spacing: "balanced",
    },
  },
  {
    editorLayout: "split",
    alignment: "left",
    body: {
      layout: "terraces",
      surface: "wave",
      heading: "side",
      flow: "invitation",
      spacing: "balanced",
    },
  },
  {
    editorLayout: "minimal",
    alignment: "left",
    body: {
      layout: "path",
      surface: "bracket",
      heading: "number",
      flow: "practical",
      spacing: "compact",
    },
  },
];

// Each additional edition has an intentional surface, heading and reading flow.
// Its ten underlying structures retain different header/body arrangements, giving
// all sixty choices a distinct full-page recipe independently of their artwork.
const occasionEditions = [
  { surface: "ticket", heading: "masthead", flow: "invitation", spacing: "airy", borderRadius: "0rem" },
  { surface: "petal", heading: "underline", flow: "memories", spacing: "balanced", borderRadius: "1.25rem" },
  { surface: "capsule", heading: "number", flow: "people", spacing: "airy", borderRadius: "1.5rem" },
  { surface: "bound", heading: "caption", flow: "practical", spacing: "compact", borderRadius: "0rem" },
  { surface: "notch", heading: "ribbon", flow: "invitation", spacing: "balanced", borderRadius: "0rem" },
] as const satisfies readonly Pick<BodyPresentation, "surface" | "heading" | "flow" | "spacing" | "borderRadius">[];

function occasionDirection(index: number): PageDirection {
  if (index < occasionDirections.length) return occasionDirections[index];
  const expandedIndex = index - occasionDirections.length;
  const slot = expandedIndex % occasionDirections.length;
  const edition = Math.floor(expandedIndex / occasionDirections.length) % occasionEditions.length;
  const base = occasionDirections[slot];
  const header = occasionDirections[(slot + edition + 1) % occasionDirections.length];
  return {
    editorLayout: header.editorLayout,
    alignment: header.alignment,
    body: { ...base.body, ...occasionEditions[edition] },
  };
}

// Stable IDs keep saved designs independent of seasonal sorting and filtering.
const generalDirections: Record<string, PageDirection> = {
  "coffee-conversation": occasionDirections[2],
  "garden-social": occasionDirections[1],
  "after-hours": {
    ...occasionDirections[5],
    body: {
      layout: "columns",
      surface: "double",
      heading: "underline",
      flow: "invitation",
      spacing: "airy",
    },
  },
  "picnic-in-the-park": occasionDirections[6],
  "around-the-table": occasionDirections[3],
  "creative-workshop": occasionDirections[4],
  "book-club": occasionDirections[7],
  "game-night": {
    ...occasionDirections[4],
    body: {
      layout: "mosaic",
      surface: "ticket",
      heading: "number",
      flow: "people",
      spacing: "compact",
    },
  },
  "open-house": occasionDirections[0],
  "community-circle": occasionDirections[8],
  "holiday-gathering": occasionDirections[5],
  "fresh-perspectives": occasionDirections[9],
};

function directionFor(design: GeneralEventDesign): PageDirection {
  if (!design.occasion) return generalDirections[design.id];
  // The collection's source order is authored, and never the sorted gallery order.
  const slug = design.id.split("--")[2];
  const index = HOLIDAY_DESIGN_SLOTS.get(`${design.occasion}--${slug}`);
  return occasionDirection(index ?? 0);
}

const HOLIDAY_DESIGN_SLOTS = new Map<string, number>(
  HOLIDAY_COLLECTIONS.flatMap((collection) =>
    // biome-ignore lint/style/useTemplate: Concatenation avoids expanding a union across 2,640 literal design slugs.
    collection.designs.map((design, index): [string, number] => [collection.id + "--" + design.slug, index]),
  ),
);

export type GeneralEventPageDesign = GeneralEventDesign & {
  editorLayout: ThemedEventEditorLayout;
  bodyPresentation: ThemedEventBodyPresentation;
};

/** Resolve the same complete design in the editor, read-only preview and guest page. */
export function getGeneralEventPageDesign(id?: string | null): GeneralEventPageDesign | undefined {
  const design = getGeneralEventDesign(id);
  if (!design) return undefined;
  const direction = directionFor(design);
  return {
    ...design,
    coverTitle: design.coverTitle || design.name,
    editorLayout: direction.editorLayout,
    bodyPresentation: {
      alignment: direction.alignment,
      surface: "paper",
      sectionStyle: "open",
      spacing: direction.body.spacing || "balanced",
      borderRadius: direction.body.borderRadius || "0rem",
    },
  };
}

export function getGeneralEventBodyPresentation(id?: string | null): BodyPresentation | undefined {
  const design = getGeneralEventDesign(id);
  return design ? { ...directionFor(design).body, preserveSurfaceShape: true } : undefined;
}
