import type { SignupForm, SignupFormSection } from "@/types/signup";

export type SignupThemeDetails = Partial<
  Pick<
    SignupForm,
    | "title"
    | "description"
    | "venue"
    | "location"
    | "start"
    | "end"
    | "timezone"
    | "safetyNotes"
    | "requirements"
  >
> & {
  groupName?: string;
  organizerName?: string;
  sections?: Array<{
    title: string;
    description: string | null;
    purpose: NonNullable<SignupFormSection["purpose"]>;
    slots: Array<{ label: string; capacity: number | null; notes: string | null }>;
  }>;
};

const textLimits = {
  title: 180,
  description: 6000,
  venue: 300,
  location: 1000,
  start: 19,
  end: 19,
  timezone: 100,
  safetyNotes: 2000,
  requirements: 2000,
  groupName: 180,
  organizerName: 180,
} as const;
export const SIGNUP_BRIEF_TEXT_FIELDS = Object.keys(textLimits) as Array<keyof typeof textLimits>;

function object(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}
function localDateTime(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2}))?)?$/.exec(value);
  if (!match) return false;
  const [, year, month, day, hour, minute, second] = match.map((part) => Number(part || 0));
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day &&
    hour < 24 &&
    minute < 60 &&
    Number(second) < 60
  );
}

/** Only user-supplied event fields can enter a proposed form; never responses or settings. */
export function normalizeSignupThemeDetails(value: unknown): SignupThemeDetails | null {
  const raw = object(value);
  if (!raw) return null;
  const details: SignupThemeDetails = {};
  for (const key of SIGNUP_BRIEF_TEXT_FIELDS) {
    const entry = raw[key];
    if (entry == null || entry === "") continue;
    if (typeof entry !== "string" || entry.length > textLimits[key]) return null;
    const text = entry.trim();
    if (!text) continue;
    if ((key === "start" || key === "end") && !localDateTime(text)) return null;
    if (key === "timezone") {
      try {
        new Intl.DateTimeFormat("en-US", { timeZone: text }).format();
      } catch {
        return null;
      }
    }
    details[key] = text;
  }
  if (raw.sections != null) {
    if (!Array.isArray(raw.sections) || raw.sections.length > 20) return null;
    const sections: NonNullable<SignupThemeDetails["sections"]> = [];
    for (const entry of raw.sections) {
      const section = object(entry);
      if (
        !section ||
        typeof section.title !== "string" ||
        !section.title.trim() ||
        section.title.length > 180 ||
        !["registration", "volunteers", "items", "times", "custom"].includes(
          String(section.purpose),
        ) ||
        (section.description != null &&
          (typeof section.description !== "string" || section.description.length > 2000)) ||
        !Array.isArray(section.slots) ||
        section.slots.length > 60
      )
        return null;
      const slots: NonNullable<SignupThemeDetails["sections"]>[number]["slots"] = [];
      for (const entry of section.slots) {
        const slot = object(entry);
        if (
          !slot ||
          typeof slot.label !== "string" ||
          !slot.label.trim() ||
          slot.label.length > 180 ||
          (slot.capacity != null &&
            (typeof slot.capacity !== "number" ||
              !Number.isInteger(slot.capacity) ||
              slot.capacity < 1 ||
              slot.capacity > 999)) ||
          (slot.notes != null && (typeof slot.notes !== "string" || slot.notes.length > 2000))
        )
          return null;
        slots.push({
          label: slot.label.trim(),
          capacity: (slot.capacity as number | null) ?? null,
          notes: (slot.notes as string | null) ?? null,
        });
      }
      if (slots.length)
        sections.push({
          title: section.title.trim(),
          description: (section.description as string | null) ?? null,
          purpose: section.purpose as NonNullable<SignupFormSection["purpose"]>,
          slots,
        });
    }
    if (sections.length) details.sections = sections;
  }
  return details;
}

/** Used only for a new form's accepted brief. Redesigning an existing form keeps its content. */
export function applySignupThemeDetails(
  form: SignupForm,
  details?: SignupThemeDetails,
): SignupForm {
  if (!details) return form;
  const { organizerName, groupName, sections, ...fields } = details;
  return {
    ...form,
    ...fields,
    locationMode: fields.location
      ? /^https?:\/\//i.test(fields.location)
        ? "online"
        : "in-person"
      : form.locationMode,
    header: {
      ...form.header,
      ...(organizerName ? { creatorName: organizerName } : {}),
      ...(groupName ? { groupName } : {}),
    },
    sections: sections
      ? sections.map((section) => {
          const existing = form.sections.find((item) => item.title === section.title);
          return {
            ...section,
            id: existing?.id || crypto.randomUUID(),
            kind: "slots",
            slots: section.slots.map((slot) => ({
              ...slot,
              startTime: null,
              endTime: null,
              id:
                existing?.slots.find((item) => item.label === slot.label)?.id ||
                crypto.randomUUID(),
            })),
          };
        })
      : form.sections,
  };
}
