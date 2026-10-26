import type { GeneralEventDesign } from "./general-event-designs";
import { schoolTemplateId, type SchoolTemplateKind } from "./school-events";

const serif = '"Playfair Display", Georgia, serif';
type SchoolDesignSource = Pick<GeneralEventDesign, "name" | "description" | "artwork" | "composition" | "ink" | "accent" | "style"> & { kind: SchoolTemplateKind; paper: string };
const schoolDesignSources: SchoolDesignSource[] = [
  { kind: "weekly-memo", name: "Weekly memo", description: "Classroom news, learning notes, reminders and individual school dates.", artwork: "/templates/signup/school-and-education/classroom-supply-drive.webp", composition: "editorial", paper: "#fffaf0", ink: "#343d36", accent: "#607e68", style: "Classroom notebook" },
  { kind: "field-trip", name: "Field trip", description: "A school outing with destination, transportation, packing and permission details.", artwork: "/templates/signup/school-and-education/field-trip.webp", composition: "postcard", paper: "#edf3ec", ink: "#293d35", accent: "#4c745e", style: "Out & exploring" },
  { kind: "school-celebration", name: "School celebration", description: "Class parties, spirit days, school performances and family celebrations.", artwork: "/templates/signup/school-and-education/class-party.webp", composition: "panorama", paper: "#fff2dd", ink: "#51384b", accent: "#a54e64", style: "Colorful classroom" },
  { kind: "parent-meeting", name: "Parent meeting", description: "Parent conferences, school orientations and PTA meetings with a clear agenda.", artwork: "/templates/signup/school-and-education/parent-teacher-conferences.webp", composition: "framed", paper: "#edf1f8", ink: "#303e59", accent: "#5b6e99", style: "Family conversation" },
];
export const SCHOOL_EVENT_DESIGNS: Array<GeneralEventDesign & { schoolTemplate: SchoolTemplateKind }> = schoolDesignSources.map(design => ({
  id: schoolTemplateId(design.kind), schoolTemplate: design.kind,
  name: design.name, label: "School & classroom", description: design.description, style: design.style,
  artwork: design.artwork, composition: design.composition,
  background: design.paper, ink: design.ink, accent: design.accent, font: serif,
  theme: { bg: `bg-[${design.paper}]`, text: `text-[${design.ink}]`, accent: `text-[${design.accent}]`, preview: `bg-[${design.paper}]`, fontFamily: serif },
}));
export const getSchoolEventDesign = (id?: string | null) => SCHOOL_EVENT_DESIGNS.find(design => design.id === id);
