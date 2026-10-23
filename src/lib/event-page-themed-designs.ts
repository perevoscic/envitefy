import type { BodyPresentation } from "@/components/templates/TemplateBodyLayout";
import availability from "@/data/event-page-themed-artwork-availability.json";
import {
  EVENT_PAGE_THEMED_COLLECTIONS,
  EVENT_PAGE_THEMED_DESIGNS,
  type ThemedEventCollectionId,
  type ThemedEventDesign,
} from "@/data/event-page-themed-designs";
import legacySnapshot from "@/data/event-page-themed-legacy.json";

const legacyDesigns = legacySnapshot.designs as unknown as ThemedEventDesign[];
// A published v1 ID always resolves its frozen authored metadata, even after a source rewrite.
const byId = new Map(
  [...EVENT_PAGE_THEMED_DESIGNS, ...legacyDesigns].map((design) => [design.id, design]),
);
const ready = new Set<string>([...legacySnapshot.readyDesignIds, ...availability.readyDesignIds]);
const modernDesigns = (collectionId: string) =>
  EVENT_PAGE_THEMED_DESIGNS.filter(
    (design) => design.collection === collectionId && design.id.startsWith(`${collectionId}--v2-`),
  );

/** Saved design IDs remain resolvable even when a collection is retired from new selections. */
export function getThemedEventDesign(id?: string | null): ThemedEventDesign | undefined {
  return id ? byId.get(id) : undefined;
}

export function isThemedEventArtworkAvailable(id?: string | null): boolean {
  return Boolean(id && byId.has(id) && ready.has(id));
}

/** Direct routes and compatibility lookups may only expose delivered artwork. */
export function getDeliveredThemedEventDesign(id?: string | null): ThemedEventDesign | undefined {
  return isThemedEventArtworkAvailable(id) ? getThemedEventDesign(id) : undefined;
}

export function getCompleteThemedEventCollection(collectionId?: string | null) {
  const collection = EVENT_PAGE_THEMED_COLLECTIONS.find((item) => item.id === collectionId);
  if (!collection) return undefined;
  const designs = modernDesigns(collection.id);
  return designs.length === collection.expectedDesigns &&
    designs.every((design) => ready.has(design.id))
    ? collection
    : undefined;
}

/** Replace a legacy collection only after all 60 reviewed artwork assets have been delivered. */
export function getActiveThemedEventDesigns(collectionId?: string | null): ThemedEventDesign[] {
  const collection = getCompleteThemedEventCollection(collectionId);
  if (collection) return modernDesigns(collection.id);
  // Keep the already-delivered Bridal collection usable until its reviewed v2 replacement is complete.
  const fallback = legacyDesigns.filter(
    (design) => design.collection === collectionId && ready.has(design.id),
  );
  return fallback.length === 60 ? fallback : [];
}

export function getThemedEventBodyPresentation(id?: string | null): BodyPresentation | undefined {
  const design = getThemedEventDesign(id);
  if (!design) return undefined;
  const layouts: Record<ThemedEventDesign["editorLayout"], BodyPresentation["layout"]> = {
    split: "columns",
    banner: "rail",
    poster: "poster",
    editorial: "editorial",
    spotlight: "islands",
    minimal: "ledger",
    cards: "mosaic",
  };
  const surfaces: Record<
    ThemedEventDesign["bodyPresentation"]["sectionStyle"],
    BodyPresentation["surface"]
  > = {
    cards: "frame",
    ruled: "ruled",
    open: "outline",
    panels: "offset",
    timeline: "bracket",
  };
  return {
    layout: design.bodyPresentation.bodyLayout || layouts[design.editorLayout],
    surface: design.bodyPresentation.bodySurface || surfaces[design.bodyPresentation.sectionStyle],
    heading:
      design.bodyPresentation.bodyHeading ||
      (design.bodyPresentation.alignment === "center" ? "masthead" : "side"),
    flow:
      design.bodyPresentation.bodyFlow ||
      (design.collection === "bridal-showers" ? "invitation" : "practical"),
    borderRadius: design.bodyPresentation.borderRadius,
    spacing: design.bodyPresentation.spacing,
    surfaceTone: design.bodyPresentation.surface,
    preserveSurfaceShape: Boolean(design.bodyPresentation.bodySurface),
  };
}

/** Persist literal authored colors as well as font choices; dynamic Tailwind values need no build scan. */
export function getThemedEventTheme(design: ThemedEventDesign) {
  return {
    ...design.theme,
    id: design.id,
    name: design.name,
    bgStyle: { backgroundColor: design.background, color: design.ink },
    backgroundColor: design.background,
    ink: design.ink,
    accentColor: design.accent,
    fontFamily: design.font,
  };
}

export function isThemedEventDesignDark(design: ThemedEventDesign): boolean {
  const hex = design.background.replace("#", "");
  return (
    [0, 2, 4].reduce(
      (sum, start, index) =>
        sum + Number.parseInt(hex.slice(start, start + 2), 16) * [0.299, 0.587, 0.114][index],
      0,
    ) < 140
  );
}

export type { ThemedEventCollectionId, ThemedEventDesign };
