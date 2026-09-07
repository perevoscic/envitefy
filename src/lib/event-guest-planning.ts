export type EventGuestPlanning = {
  arrival?: string;
  parking?: string;
  accessibility?: string;
  dietary?: string;
  guestPolicy?: string;
  dressCode?: string;
  transport?: string;
  accommodation?: string;
  preparation?: string;
};

const fields = [
  {
    key: "arrival",
    label: "Arrival & check-in",
    placeholder: "When to arrive, where to check in, and who to meet.",
  },
  {
    key: "parking",
    label: "Parking & entrance",
    placeholder: "Where to park, any fees, and the entrance guests should use.",
  },
  {
    key: "accessibility",
    label: "Accessibility",
    placeholder: "Step-free access, accessible seating, and how guests can request assistance.",
  },
  {
    key: "dietary",
    label: "Food & dietary needs",
    placeholder: "Food plans and how guests should tell the host about allergies or dietary needs.",
  },
  {
    key: "guestPolicy",
    label: "Children & additional guests",
    placeholder:
      "Whether children or additional guests are welcome and how to include them in the RSVP.",
  },
  {
    key: "dressCode",
    label: "What to wear",
    placeholder: "Dress code, footwear, or clothing suited to the activity.",
  },
  {
    key: "transport",
    label: "Transport & shuttles",
    placeholder: "Pickup points, shuttle times, public transport, or drop-off instructions.",
  },
  {
    key: "accommodation",
    label: "Where to stay",
    placeholder: "Hotel suggestions, booking details, or room-block deadlines.",
  },
  {
    key: "preparation",
    label: "What to bring & prepare",
    placeholder: "Equipment, documents, supplies, or anything guests should do before arriving.",
  },
] as const;

export function getEventGuestPlanningFields(category = "") {
  const key = category.toLowerCase().replace(/[^a-z]/g, "");
  const wedding = key.includes("wedding");
  const appointment = key.includes("appointment");
  const sports = /sport|soccer|football|gymnastic|cheer|dance/.test(key);
  return fields
    .filter(({ key: field }) => {
      if (field === "accommodation") return wedding || sports;
      if (field === "transport") return !appointment;
      if (field === "guestPolicy") return !appointment;
      if (field === "dietary") return !appointment;
      return true;
    })
    .map((field) => {
      if (field.key === "guestPolicy" && sports)
        return { ...field, label: "Spectators & accompanying guests" };
      if (field.key === "preparation" && appointment)
        return { ...field, label: "Before your appointment" };
      return field;
    });
}

export function normalizeEventGuestPlanning(value: unknown): EventGuestPlanning {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const record = value as Record<string, unknown>;
  const result: EventGuestPlanning = {};
  for (const { key } of fields) {
    if (typeof record[key] === "string" && record[key].trim()) result[key] = record[key].trim();
  }
  return result;
}

export function getEventGuestPlanningNotes(value?: EventGuestPlanning) {
  const normalized = normalizeEventGuestPlanning(value);
  return fields.flatMap(({ key, label }) =>
    normalized[key] ? [{ key, label, value: normalized[key] }] : [],
  );
}

export function getEventEndLocal(date: string, time: string, endTime: string, endDate = "") {
  if (!endTime) return undefined;
  const start = `${date}T${time}`;
  const end = `${endDate || date}T${endTime}`;
  return Number.isFinite(Date.parse(start)) && Date.parse(end) > Date.parse(start)
    ? end
    : undefined;
}

export function eventLocalDateParts(iso?: string | null) {
  if (!iso) return { date: "", time: "" };
  const value = new Date(iso);
  if (Number.isNaN(value.getTime())) return { date: "", time: "" };
  const pad = (part: number) => String(part).padStart(2, "0");
  return {
    date: `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`,
    time: `${pad(value.getHours())}:${pad(value.getMinutes())}`,
  };
}

const RESERVED_EVENT_SEGMENTS = new Set([
  "preview",
  "new",
  "birthdays",
  "anniversaries",
  "weddings",
  "baby-showers",
  "gender-reveal",
  "general",
  "appointments",
  "workshops",
  "special-events",
  "sport-events",
  "soccer",
  "football",
  "football-season",
  "gymnastics",
  "dance-ballet",
  "cheerleading",
]);

export function resolvePublicEventShareUrl({
  shareUrl,
  eventId,
  origin,
  preview = false,
}: {
  shareUrl?: string | null;
  eventId?: string;
  origin: string;
  preview?: boolean;
}) {
  if (preview) return "";
  if (shareUrl) {
    try {
      const url = new URL(shareUrl, origin);
      const match = url.pathname.match(/^\/(event|card|smart-signup-form)\/([^/]+)\/?$/);
      if (
        (url.protocol === "https:" || url.protocol === "http:") &&
        match &&
        !RESERVED_EVENT_SEGMENTS.has(match[2])
      )
        return url.href;
    } catch {
      // Fall back only to an actual saved event ID.
    }
  }
  return eventId && !RESERVED_EVENT_SEGMENTS.has(eventId)
    ? `${origin}/event/${encodeURIComponent(eventId)}`
    : "";
}

/** Date-only fields describe a calendar day, not UTC midnight in the viewer's timezone. */
export function parseEventGuestDate(value: string): Date {
  return new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value);
}

export function formatEventGuestDate(
  value?: string | null,
  options: Intl.DateTimeFormatOptions = { month: "long", day: "numeric", year: "numeric" },
): string {
  if (!value) return "";
  const parsed = parseEventGuestDate(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString("en-US", options);
}
