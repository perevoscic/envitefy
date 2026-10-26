import { isSchoolMemoText } from "./school-memo";

export const SCHOOL_TEMPLATE_KINDS = ["weekly-memo", "field-trip", "school-celebration", "parent-meeting"] as const;
export type SchoolTemplateKind = (typeof SCHOOL_TEMPLATE_KINDS)[number];
export const SCHOOL_TEMPLATE_LABELS: Record<SchoolTemplateKind, string> = {
  "weekly-memo": "Weekly memo", "field-trip": "Field trip",
  "school-celebration": "School celebration", "parent-meeting": "Parent meeting",
};
export const schoolTemplateId = (kind: SchoolTemplateKind) => `school--${kind}`;
export function normalizeSchoolTemplate(value: unknown): SchoolTemplateKind | undefined {
  return SCHOOL_TEMPLATE_KINDS.includes(value as SchoolTemplateKind) ? value as SchoolTemplateKind : undefined;
}

/** Classify the whole school document before incidental holidays or school sports. */
export function recognizeSchoolSource(value: string): { kind?: SchoolTemplateKind } | null {
  if (isSchoolMemoText(value)) return { kind: "weekly-memo" };
  const text = String(value || "").replace(/[-_]/g, " ").replace(/\s+/g, " ");
  const school = /\b(?:school|classroom|class|students?|teachers?|PTA|PTO|kindergarten|grade|elementary|academy)\b/i.test(text);
  if (!school) return null;
  const kinds: SchoolTemplateKind[] = [];
  if (/\b(?:field trip|school trip|class trip|school excursion)\b/i.test(text)) kinds.push("field-trip");
  if (/\b(?:parent teacher conferences?|parent(?:s)? (?:meetings?|conferences?|night)|PTA meetings?|PTO meetings?|school orientation|school open house|meet the teacher|back to school night)\b/i.test(text)) kinds.push("parent-meeting");
  if (/\b(?:celebration|class(?:room)? party|school party|field day|spirit day|school carnival|school fair|school fundraiser|school concert|school performance|class performance|pumpkin day)\b/i.test(text)) kinds.push("school-celebration");
  // An explicitly named holiday celebration can still use its holiday collection;
  // classroom parties and spirit days remain school activities.
  if (kinds.length === 1 && kinds[0] === "school-celebration" && /\b(?:new year['’]?s? eve|christmas|halloween|thanksgiving|easter|hanukkah|diwali)\b/i.test(text) && !/\b(?:class(?:room)? party|spirit day|school party)\b/i.test(text)) return null;
  if (kinds.length === 1) return { kind: kinds[0] };
  if (kinds.length > 1 || /\b(?:school|classroom)\s+(?:event|activity|activities)\b/i.test(text)) return {};
  return null;
}

export function schoolStarterSections(kind: SchoolTemplateKind) {
  const titles: Record<SchoolTemplateKind, string[]> = {
    "weekly-memo": ["Classroom news", "Learning this week", "Reminders for families"],
    "field-trip": ["Trip details", "Transportation & arrival", "What to bring", "Permission & deadlines"],
    "school-celebration": ["Activities & schedule", "What to bring", "Family participation"],
    "parent-meeting": ["Meeting agenda", "Arrival & check-in", "Questions & preparation"],
  };
  return titles[kind].map(title => ({ title, body: "" }));
}
