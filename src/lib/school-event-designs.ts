import type { GeneralEventDesign } from "./general-event-designs";
import { schoolTemplateId, type SchoolTemplateKind } from "./school-events";

const serif = '"Playfair Display", Georgia, serif';
type SchoolDesignSource = Pick<GeneralEventDesign, "name" | "description" | "artwork" | "composition" | "ink" | "accent" | "style"> & { kind: SchoolTemplateKind; paper: string };
// Compatibility only: saved pages and old links still resolve, but these are not offered.
const legacySchoolDesignSources: SchoolDesignSource[] = [
  { kind: "weekly-memo", name: "Weekly memo", description: "Classroom news, learning notes, reminders and individual school dates.", artwork: "/templates/signup/school-and-education/classroom-supply-drive.webp", composition: "editorial", paper: "#fffaf0", ink: "#343d36", accent: "#607e68", style: "Classroom notebook" },
  { kind: "field-trip", name: "Field trip", description: "A school outing with destination, transportation, packing and permission details.", artwork: "/templates/signup/school-and-education/field-trip.webp", composition: "postcard", paper: "#edf3ec", ink: "#293d35", accent: "#4c745e", style: "Out & exploring" },
  { kind: "school-celebration", name: "School celebration", description: "Class parties, spirit days, school performances and family celebrations.", artwork: "/templates/signup/school-and-education/class-party.webp", composition: "panorama", paper: "#fff2dd", ink: "#51384b", accent: "#a54e64", style: "Colorful classroom" },
  { kind: "parent-meeting", name: "Parent meeting", description: "Parent conferences, school orientations and PTA meetings with a clear agenda.", artwork: "/templates/signup/school-and-education/parent-teacher-conferences.webp", composition: "framed", paper: "#edf1f8", ink: "#303e59", accent: "#5b6e99", style: "Family conversation" },
];
const legacySchoolDesigns = legacySchoolDesignSources.map(design => ({
  id: schoolTemplateId(design.kind), schoolTemplate: design.kind,
  name: design.name, label: "School & classroom", description: design.description, style: design.style,
  artwork: design.artwork, composition: design.composition,
  background: design.paper, ink: design.ink, accent: design.accent, font: serif,
  theme: { bg: `bg-[${design.paper}]`, text: `text-[${design.ink}]`, accent: `text-[${design.accent}]`, preview: `bg-[${design.paper}]`, fontFamily: serif },
}));


const openHouse = "/templates/event-pages/v2/open-house/school-open-house";
const milestone = "/templates/event-pages/v2/graduations/school-graduation";
type SchoolEventDesign = GeneralEventDesign & { schoolTemplate: SchoolTemplateKind; direction?: number; backgroundId?: string };
type SchoolDesignRecipe = SchoolDesignSource & { slug: string; direction: number; backgroundId: string };

// New school covers use the delivered Event Page artwork, not the old sign-up catalog.
const schoolDesignSources: SchoolDesignRecipe[] = [
  { kind: "weekly-memo", slug: "learning-garden", name: "Learning garden", description: "A paper schoolhouse and branching tree frame classroom news and weekly reminders.", artwork: `${openHouse}-paper-learning-garden.webp`, composition: "arch", paper: "#f6f2e5", ink: "#293f35", accent: "#4d7259", style: "Paper miniature · Weekly memo", direction: 0, backgroundId: "garden-notebook" },
  { kind: "weekly-memo", slug: "reading-islands", name: "Reading islands", description: "An overhead library scene for reading notes, subjects and family reminders.", artwork: `${openHouse}-library-reading-islands.webp`, composition: "oval", paper: "#fff7df", ink: "#483b2e", accent: "#806238", style: "Library journal · Weekly memo", direction: 7, backgroundId: "library-linen" },
  { kind: "weekly-memo", slug: "brush-and-paper", name: "Brush & paper", description: "A close-up of young artists gives learning updates a colorful, practical home.", artwork: `${openHouse}-brushes-in-young-hands.webp`, composition: "journal", paper: "#f1f5fa", ink: "#293e58", accent: "#476c9a", style: "Art-room journal · Weekly memo", direction: 8, backgroundId: "blue-grid" },
  { kind: "field-trip", slug: "courtyard-discovery", name: "Courtyard discovery", description: "Open classroom doors and a green courtyard introduce your next school outing.", artwork: `${openHouse}-doors-to-the-courtyard.webp`, composition: "panorama", paper: "#eff4e9", ink: "#2e4336", accent: "#587343", style: "Architectural panorama · Field trip", direction: 1, backgroundId: "courtyard-gingham" },
  { kind: "field-trip", slug: "open-doors", name: "Open doors", description: "A bright doorway for destinations, permission details and a day of exploring.", artwork: `${milestone}-new-doorway.webp`, composition: "framed", paper: "#edf3f9", ink: "#2d4056", accent: "#496d93", style: "Framed photography · Field trip", direction: 5, backgroundId: "blue-grid" },
  { kind: "field-trip", slug: "rainbow-path", name: "Rainbow path", description: "A winding chalk rainbow leads into school adventures and outdoor discoveries.", artwork: `${milestone}-chalk-rainbow-path.webp`, composition: "organic", paper: "#fff1e7", ink: "#543b36", accent: "#9c5548", style: "Chalk & color · Field trip", direction: 6, backgroundId: "peach-watercolor" },
  { kind: "school-celebration", slug: "schoolyard-streamers", name: "Schoolyard streamers", description: "An airy schoolyard photograph for celebrations, spirit days and family gatherings.", artwork: `${milestone}-schoolyard-streamers.webp`, composition: "panorama", paper: "#fff3e4", ink: "#513b3e", accent: "#a34e66", style: "Schoolyard photography · Celebration", direction: 2, backgroundId: "celebration-confetti" },
  { kind: "school-celebration", slug: "star-parade", name: "Star parade", description: "Playful clay stars and tiny backpacks celebrate a big school milestone.", artwork: `${milestone}-clay-star-parade.webp`, composition: "postcard", paper: "#edf6ef", ink: "#31463d", accent: "#527761", style: "Clay miniature · Celebration", direction: 4, backgroundId: "mint-speckle" },
  { kind: "school-celebration", slug: "big-steps", name: "Big steps", description: "Painted book-shaped steps for achievements, moving-up days and class celebrations.", artwork: `${milestone}-painted-big-step.webp`, composition: "poster", paper: "#f4eefa", ink: "#493854", accent: "#806099", style: "Painted storybook · Celebration", direction: 9, backgroundId: "lilac-stars" },
  { kind: "school-celebration", slug: "paper-crowns", name: "Paper crowns", description: "A handmade crown and felt star for classroom achievements and special days.", artwork: `${milestone}-paper-crown-detail.webp`, composition: "editorial", paper: "#fff7df", ink: "#483b2e", accent: "#806238", style: "Tactile craft · Celebration", direction: 3, backgroundId: "library-linen" },
  { kind: "parent-meeting", slug: "learning-together", name: "Learning together", description: "A teacher, child and parent bring a warm human focus to family conversations.", artwork: `${openHouse}-learning-together.webp`, composition: "postcard", paper: "#fff3e9", ink: "#513c34", accent: "#93664c", style: "Classroom photography · Parent meeting", direction: 3, backgroundId: "peach-watercolor" },
  { kind: "parent-meeting", slug: "school-of-possibilities", name: "School of possibilities", description: "A teal and coral school cutaway for open houses, conferences and family meetings.", artwork: `${openHouse}-school-of-possibilities.webp`, composition: "framed", paper: "#eaf3f2", ink: "#29464a", accent: "#3f7779", style: "Screenprint · Parent meeting", direction: 5, backgroundId: "courtyard-gingham" },
];
export const SCHOOL_EVENT_DESIGNS: SchoolEventDesign[] = schoolDesignSources.map(design => ({
  id: `${schoolTemplateId(design.kind)}--${design.slug}`, schoolTemplate: design.kind,
  name: design.name, label: "School & classroom", description: design.description, style: design.style,
  artwork: design.artwork, composition: design.composition, direction: design.direction,
  backgroundId: `school--${design.backgroundId}`,
  background: design.paper, ink: design.ink, accent: design.accent, font: serif,
  theme: { bg: `bg-[${design.paper}]`, text: `text-[${design.ink}]`, accent: `text-[${design.accent}]`, preview: `bg-[${design.paper}]`, fontFamily: serif },
}));
export const getSchoolEventDesign = (id?: string | null): SchoolEventDesign | undefined =>
  SCHOOL_EVENT_DESIGNS.find(design => design.id === id) || legacySchoolDesigns.find(design => design.id === id);
