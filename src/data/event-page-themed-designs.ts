import type { GeneralEventDesign } from "@/lib/general-event-designs";
import { CELEBRATIONS_V2 } from "./event-page-themed-celebrations-v2";
import { HOME_V2 } from "./event-page-themed-home-v2";
import { TEAM_SPORTS_V2 } from "./event-page-themed-team-sports-v2";
import { OTHER_SPORTS_V2 } from "./event-page-themed-other-sports-v2";
import type { AuthoredTheme, ThemedEventCollectionId, ThemedEventEditorLayout, ThemedEventBodyPresentation } from "./event-page-art-direction-types";
export type { ThemedEventCollectionId, ThemedEventEditorLayout, ThemedEventBodyPresentation } from "./event-page-art-direction-types";
export type ThemedEventCollection = { id: ThemedEventCollectionId; name: string; category: "general" | "sports" | "bridal-showers"; sport?: string; description: string; expectedDesigns: 60 };
export type ThemedEventDesign = GeneralEventDesign & { collection: ThemedEventCollectionId; slug: string; subtype: string; tags: string[]; scene: string; bodyPresentation: ThemedEventBodyPresentation; editorLayout: ThemedEventEditorLayout; artDirectionVersion?: 2 };

/** Version-two art directions deliberately pair a scene, viewpoint, light and medium.
 * Delivered version-one links are frozen separately in event-page-themed-legacy.json.
 */
export const EVENT_PAGE_THEMED_COLLECTIONS: ThemedEventCollection[] = [
  { id: "bridal-showers", name: "Bridal shower", category: "bridal-showers", description: "Garden teas, seaside brunches, recipe showers and modern bridal celebrations.", expectedDesigns: 60 },
  { id: "graduations", name: "Graduation", category: "general", description: "Commencements, milestone degrees, trades and graduation celebrations.", expectedDesigns: 60 },
  { id: "housewarming", name: "Housewarming", category: "general", description: "New keys, first apartments and welcoming friends into a new home.", expectedDesigns: 60 },
  { id: "open-house", name: "Open house", category: "general", description: "Property viewings, studios, schools, workplaces and community open days.", expectedDesigns: 60 },
  { id: "religious-events", name: "Religious celebration", category: "general", description: "Clearly labeled traditions and occasions with respectful, specific visual references.", expectedDesigns: 60 },
  ...([
    ["dance", "Dance", "Recitals, showcases, social dances and studio celebrations."],
    ["cheerleading", "Cheerleading", "Competition squads, camps, sideline spirit and team celebrations."],
    ["basketball", "Basketball", "Court nights, youth leagues, tournaments and team celebrations."],
    ["baseball", "Baseball", "Ballparks, youth leagues, tournaments and diamond celebrations."],
    ["softball", "Softball", "Fastpitch, slowpitch, tournaments and softball team celebrations."],
    ["soccer", "Soccer", "Pitch days, futsal, youth leagues and soccer team celebrations."],
    ["volleyball", "Volleyball", "Indoor courts, beach doubles, clinics and volleyball tournaments."],
    ["hockey", "Hockey", "Ice hockey, pond games, field hockey and team gatherings."],
    ["lacrosse", "Lacrosse", "Field and box lacrosse, clinics, tournaments and team gatherings."],
    ["tennis", "Tennis", "Clay, grass and hardcourt tennis, doubles and club gatherings."],
    ["track-field", "Track & Field", "Sprints, distance, relays, jumps, throws and meet celebrations."],
    ["swimming", "Swimming", "Pool meets, swim clinics, open water and team celebrations."],
    ["wrestling", "Wrestling", "Folkstyle, freestyle, Greco-Roman, clinics and wrestling tournaments."],
  ] as const).map(([id, name, description]): ThemedEventCollection => ({ id, name, category: "sports", sport: id, description, expectedDesigns: 60 })),
];

export const EVENT_PAGE_THEMED_BRIEFS = { ...CELEBRATIONS_V2, ...HOME_V2, ...TEAM_SPORTS_V2, ...OTHER_SPORTS_V2 } as Record<ThemedEventCollectionId, AuthoredTheme[]>;
const slugify = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
export const EVENT_PAGE_THEMED_DESIGNS: ThemedEventDesign[] = EVENT_PAGE_THEMED_COLLECTIONS.flatMap((collection) =>
  (EVENT_PAGE_THEMED_BRIEFS[collection.id] ?? []).flatMap((direction) => direction.scenes.map((scene): ThemedEventDesign => {
    const page = scene.page;
    const slug = `v2-${direction.subtype}-${slugify(scene.name)}`;
    return { id: `${collection.id}--${slug}`, collection: collection.id, slug,
      name: `${direction.name} · ${scene.name}`, coverTitle: scene.name,
      label: collection.id === "religious-events" ? direction.style : direction.name,
      description: `${direction.name}: ${scene.brief}.`, style: direction.style,
      artwork: `/templates/event-pages/v2/${collection.id}/${slug.slice(3)}.webp`,
      composition: page.composition, background: page.background, ink: page.ink, accent: page.accent, font: page.font,
      theme: { bg: `bg-[${page.background}]`, text: `text-[${page.ink}]`, accent: `text-[${page.accent}]`, preview: `bg-[${page.background}]`, fontFamily: page.font },
      subtype: direction.subtype, tags: [collection.id, direction.subtype, direction.style, scene.name, scene.artDirection.medium],
      scene: scene.brief, editorLayout: page.editorLayout, bodyPresentation: page.bodyPresentation, artDirectionVersion: 2,
    };
  })),
);
