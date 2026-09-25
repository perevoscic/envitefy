import { HOLIDAY_COLLECTIONS, type HolidayCollectionId } from "@/lib/holiday-collections";
import { HOLIDAY_SIGNUP_DESIGNS, SIGNUP_DESIGN_PALETTES } from "@/lib/signup-designs";
import { isHolidayTemplateAvailable } from "@/lib/holiday-template-availability";
import type { TemplateArtwork } from "@/components/events/TemplateArtworkThumbnail";

export type GeneralEventDesign = TemplateArtwork & {
  description: string;
  style: string;
  occasion?: HolidayCollectionId;
  theme: { bg: string; text: string; accent: string; preview: string; fontFamily: string };
};

const serif = '"Playfair Display", Georgia, serif';
const sans = '"Space Grotesk", Arial, sans-serif';
const photo = "/templates/signup/photographic";

const ORIGINAL_GENERAL_EVENT_DESIGNS: GeneralEventDesign[] = [
  {
    id: "coffee-conversation", name: "Coffee & Conversation", label: "Gather together",
    description: "A warm café setting for meetups, catch-ups, and small gatherings.", style: "Warm & relaxed",
    artwork: `${photo}/general/monthly-meetup.webp`, composition: "editorial",
    background: "#f4ede3", ink: "#49392c", accent: "#806047", font: serif,
    theme: { bg: "bg-[#f4ede3]", text: "text-[#49392c]", accent: "text-[#806047]", preview: "bg-[#f4ede3]", fontFamily: serif },
  },
  {
    id: "garden-social", name: "Garden Social", label: "A little fresh air",
    description: "Soft botanical greens for garden parties and outdoor get-togethers.", style: "Garden & outdoors",
    artwork: `${photo}/clubs-and-groups/gardening-group.webp`, composition: "arch",
    background: "#e9eedf", ink: "#293d31", accent: "#4b6548", font: serif,
    theme: { bg: "bg-[#e9eedf]", text: "text-[#293d31]", accent: "text-[#4b6548]", preview: "bg-[#e9eedf]", fontFamily: serif },
  },
  {
    id: "after-hours", name: "After Hours", label: "Good company",
    description: "A deep navy evening design for networking, mixers, and receptions.", style: "Evening & elegant",
    artwork: `${photo}/business-and-professional/networking-night.webp`, composition: "framed",
    background: "#182332", ink: "#ffffff", accent: "#d8bd89", font: serif,
    theme: { bg: "bg-[#182332]", text: "text-white", accent: "text-[#d8bd89]", preview: "bg-[#182332]", fontFamily: serif },
  },
  {
    id: "picnic-in-the-park", name: "Picnic in the Park", label: "Meet outside",
    description: "A sunny picnic design for neighborhood gatherings and relaxed afternoons.", style: "Garden & outdoors",
    artwork: `${photo}/church-and-community/community-picnic.webp`, composition: "postcard",
    background: "#fff3d9", ink: "#435139", accent: "#6a713d", font: serif,
    theme: { bg: "bg-[#fff3d9]", text: "text-[#435139]", accent: "text-[#6a713d]", preview: "bg-[#fff3d9]", fontFamily: serif },
  },
  {
    id: "around-the-table", name: "Around the Table", label: "Come hungry",
    description: "Warm terracotta and a shared table for dinners and potlucks.", style: "Warm & relaxed",
    artwork: `${photo}/fundraising-and-food/potluck-dinner.webp`, composition: "journal",
    background: "#f4e4d8", ink: "#683e30", accent: "#975b41", font: serif,
    theme: { bg: "bg-[#f4e4d8]", text: "text-[#683e30]", accent: "text-[#975b41]", preview: "bg-[#f4e4d8]", fontFamily: serif },
  },
  {
    id: "creative-workshop", name: "Creative Workshop", label: "Make something together",
    description: "A bright, clean design for workshops, classes, and creative sessions.", style: "Modern & minimal",
    artwork: `${photo}/business-and-professional/workshop.webp`, composition: "poster",
    background: "#eef2f7", ink: "#25394b", accent: "#405f7a", font: sans,
    theme: { bg: "bg-[#eef2f7]", text: "text-[#25394b]", accent: "text-[#405f7a]", preview: "bg-[#eef2f7]", fontFamily: sans },
  },
  {
    id: "book-club", name: "The Reading Room", label: "One more chapter",
    description: "An intimate bookish design for reading groups and thoughtful conversations.", style: "Warm & relaxed",
    artwork: `${photo}/clubs-and-groups/book-club.webp`, composition: "oval",
    background: "#eae2d6", ink: "#453f38", accent: "#71624c", font: serif,
    theme: { bg: "bg-[#eae2d6]", text: "text-[#453f38]", accent: "text-[#71624c]", preview: "bg-[#eae2d6]", fontFamily: serif },
  },
  {
    id: "game-night", name: "Game Night", label: "Let’s play",
    description: "Rich plum colors for game nights and friendly competition.", style: "Evening & elegant",
    artwork: `${photo}/family-and-personal/game-night.webp`, composition: "poster",
    background: "#362744", ink: "#ffffff", accent: "#e5cee9", font: sans,
    theme: { bg: "bg-[#362744]", text: "text-white", accent: "text-[#e5cee9]", preview: "bg-[#362744]", fontFamily: sans },
  },
  {
    id: "open-house", name: "Open House", label: "You’re welcome here",
    description: "An airy, welcoming page for open houses and drop-in gatherings.", style: "Modern & minimal",
    artwork: `${photo}/other-special-interest/real-estate-open-house.webp`, composition: "panorama",
    background: "#faf7f1", ink: "#4d493f", accent: "#786b52", font: sans,
    theme: { bg: "bg-[#faf7f1]", text: "text-[#4d493f]", accent: "text-[#786b52]", preview: "bg-[#faf7f1]", fontFamily: sans },
  },
  {
    id: "community-circle", name: "Community Circle", label: "Better together",
    description: "A calm blue gathering space for community conversations and group meetings.", style: "Modern & minimal",
    artwork: `${photo}/general/community-discussion.webp`, composition: "organic",
    background: "#e5eef0", ink: "#2d4850", accent: "#486c72", font: sans,
    theme: { bg: "bg-[#e5eef0]", text: "text-[#2d4850]", accent: "text-[#486c72]", preview: "bg-[#e5eef0]", fontFamily: sans },
  },
  {
    id: "holiday-gathering", name: "Holiday Gathering", label: "Make time for each other",
    description: "A festive, deep green design for seasonal celebrations with family and friends.", style: "Evening & elegant",
    artwork: `${photo}/family-and-personal/family-holiday.webp`, composition: "framed",
    background: "#233d33", ink: "#ffffff", accent: "#e8d6ad", font: serif,
    theme: { bg: "bg-[#233d33]", text: "text-white", accent: "text-[#e8d6ad]", preview: "bg-[#233d33]", fontFamily: serif },
  },
  {
    id: "fresh-perspectives", name: "Fresh Perspectives", label: "Bring your ideas",
    description: "A warm professional setting for planning days, group discussions, and meetups.", style: "Modern & minimal",
    artwork: `${photo}/business-and-professional/professional-gathering.webp`, composition: "editorial",
    background: "#ede9e4", ink: "#343a3c", accent: "#5a6967", font: sans,
    theme: { bg: "bg-[#ede9e4]", text: "text-[#343a3c]", accent: "text-[#5a6967]", preview: "bg-[#ede9e4]", fontFamily: sans },
  },
];


const holidayCompositions = ["panorama", "arch", "editorial", "journal", "poster", "framed", "postcard", "oval", "organic", "editorial"] as const;
const holidayFonts = [serif, serif, '"Libre Baskerville", Georgia, serif', sans, '"Bebas Neue", Arial, sans-serif', serif, sans, serif, sans, sans];
export const GENERAL_EVENT_DESIGNS: GeneralEventDesign[] = [
  ...ORIGINAL_GENERAL_EVENT_DESIGNS,
  ...HOLIDAY_COLLECTIONS.flatMap((collection) => collection.designs.flatMap((design, index): GeneralEventDesign[] => {
    const id = `holidays--${collection.id}--${design.slug}`;
    if (!isHolidayTemplateAvailable(id)) return [];
    const recipe = HOLIDAY_SIGNUP_DESIGNS.find((item) => item.id === id)!;
    const palette = SIGNUP_DESIGN_PALETTES[recipe.palette];
    const font = holidayFonts[index];
    return [{
      id, name: `${collection.name} · ${design.name}`, label: collection.name, occasion: collection.id,
      coverTitle: design.name,
      description: `${collection.name}: ${design.scene}. ${collection.aliases}`,
      style: ["Scenic", "Botanical", "Editorial", "Journal", "Bold", "Classic", "Scrapbook", "Supper club", "Modern", "Letterpress"][index],
      artwork: recipe.artwork, composition: holidayCompositions[index],
      background: palette.page, ink: palette.ink, accent: palette.accent, font,
      theme: { bg: `holiday-bg-${recipe.palette}`, text: `holiday-ink-${recipe.palette}`, accent: `holiday-accent-${recipe.palette}`, preview: `holiday-bg-${recipe.palette}`, fontFamily: font },
    }];
  })),
];

export function getGeneralEventDesign(id: string | null | undefined): GeneralEventDesign | undefined {
  return GENERAL_EVENT_DESIGNS.find((design) => design.id === id);
}
