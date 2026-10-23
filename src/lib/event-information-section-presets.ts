import type { EventSectionExtras } from "./event-section-extras";

/** Section starters share editable headings and optional typed photo/link content. */
export const EVENT_INFORMATION_SECTION_PRESETS = [
  { title: "Schedule", description: "Times and the order of events", matches: ["schedule", "wedding-schedule", "atelier-schedule"] },
  { title: "Venue & directions", description: "Where to go and how to get there", matches: ["venue", "venue-details", "directions", "location"] },
  { title: "Parking & arrival", description: "Parking, entrances and drop-off", matches: ["parking", "traffic-parking", "travel & parking", "arrival"] },
  { title: "Dress code", description: "What guests should wear", matches: [] },
  { title: "What to bring", description: "Supplies and things to remember", matches: ["equipment", "equipment checklist"] },
  { title: "Food & drinks", description: "Meals and dietary information", matches: ["food", "menu"] },
  { title: "Accessibility", description: "Access and accommodations", matches: [] },
  { title: "Travel & hotels", description: "Transport and places to stay", matches: ["hotels", "travel", "accommodation", "accommodations", "atelier-travel", "getting here"] },
  { title: "Things to do", description: "Local activities and places to explore", matches: ["things-to-do", "attractions", "around town"] },
  { title: "FAQs", description: "Answers to common guest questions", matches: ["faq", "frequently asked questions"] },
  { title: "Contact host", description: "Who to contact with questions", matches: ["contact", "contacts", "host contact"] },
  { title: "Photo gallery", description: "Share photos from your event", matches: ["photos", "gallery", "photo-gallery"], kind: "photos" },
  { title: "Links", description: "Useful websites and resources", matches: ["useful links", "resources"], kind: "links" },
] as const;

export type EventInformationSectionPreset = (typeof EVENT_INFORMATION_SECTION_PRESETS)[number];
export type EventInformationSectionContent = { title: string; body: string } & EventSectionExtras;

const sectionKey = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/** Prefer an existing section's native editor and retained contents over a duplicate starter. */
export function availableEventInformationPresets(sections: readonly { id: string; label: string }[]) {
  const existing = new Set(sections.flatMap(({ id, label }) => [sectionKey(id), sectionKey(label)]));
  return EVENT_INFORMATION_SECTION_PRESETS.filter((preset) =>
    ![preset.title, ...preset.matches].some((value) => existing.has(sectionKey(value))),
  );
}
