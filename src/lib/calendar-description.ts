import { isMedicalAppointmentCategory } from "./medical-appointments.ts";
import { contactNumberLabel, withMissingContactNumbers } from "./ocr/contact-numbers.ts";

type CalendarData = Record<string, unknown>;
type Fact = { label: string; value: string };
type DescriptionOptions = { envitefyUrl?: string; flyerUrl?: string };

const MEDICAL_FACT_LABELS: Record<string, string> = {
  patient: "Patient",
  "patient name": "Patient",
  "patient id": "Patient ID",
  "appointment provider": "Clinician",
  clinician: "Clinician",
  host: "Appointment provider",
};

function record(value: unknown): CalendarData {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as CalendarData) : {};
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function first(...values: unknown[]): string {
  return values.map(text).find(Boolean) || "";
}

function line(value: unknown): string {
  return text(value).replace(/\s+/g, " ");
}

/** Keep paragraphs and lists readable in providers that accept only plain text. */
function plainText(value: string): string {
  return value
    .replace(/\r\n?/g, "\n")
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/<\/p\s*>/gi, "\n\n")
    .replace(/<\/(?:div|li|h[1-6]|ul|ol)\s*>/gi, "\n")
    .replace(/<li\b[^>]*>/gi, "• ")
    .replace(/<a\b[^>]*href=["'](https?:\/\/[^"']+)["'][^>]*>(.*?)<\/a>/gi, "$2 ($1)")
    .replace(/<\/?(?:a|b|strong|i|em|u|s|span|p|div|li|ul|ol|h[1-6])\b[^>]*>/gi, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&amp;/gi, "&")
    .split("\n")
    .map((part) => part.replace(/[\t ]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function unique(lines: string[]): string[] {
  const seen = new Set<string>();
  return lines.filter((value) => {
    const key = line(value).toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function factsFrom(value: unknown): Fact[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const fact = record(item);
    const value = first(fact.value, fact.text, fact.description);
    return value ? [{ label: first(fact.label, fact.name, "Details"), value: line(value) }] : [];
  });
}

/** Recognize legacy medical scans even when an older export dropped their category. */
export function isMedicalCalendarEvent(data: CalendarData): boolean {
  const source = [text(data.ocrText), text(record(data.scan).ocrText), text(data.description)].join(
    "\n",
  );
  return (
    isMedicalAppointmentCategory(text(data.category)) ||
    record(data.scanPersonalization).medical === true ||
    (/\b(?:DOB|date\s+of\s+birth)\s*:/i.test(source) &&
      /\bpatient\s*(?:ID|number)\s*[:#]/i.test(source))
  );
}

function isMedicalTranscript(description: string, data: CalendarData, facts: Fact[]): boolean {
  const identityLabels =
    description.match(/\b(?:DOB|date\s+of\s+birth|patient\s*(?:ID|number))\s*[:#]/gi) || [];
  const repeatedFacts =
    !description.includes("\n") &&
    facts.filter(
      (fact) =>
        /^(?:patient(?: name| id)?|appointment provider|clinician|host|phone|fax)$/i.test(
          fact.label,
        ) &&
        fact.value.length > 3 &&
        description.toLowerCase().includes(fact.value.toLowerCase()),
    ).length >= 3;
  return (
    identityLabels.length >= 2 ||
    repeatedFacts ||
    /\bDate\s+Time\s+Appointment\b/i.test(description) ||
    (facts.length > 0 && Boolean(text(data.ocrText)) && line(description) === line(data.ocrText))
  );
}

/** One provider-neutral description for sync, compose links, and ICS exports. */
export function buildCalendarDescription(
  data: CalendarData,
  options: DescriptionOptions = {},
): string {
  const description = plainText(text(data.description));
  const event = {
    title: first(data.title, data.name),
    start: first(data.start, data.startIso, data.startAt, data.startISO),
    end: first(data.end, data.endIso, data.endAt, data.endISO),
    timezone: first(data.timezone, data.tz),
    allDay: data.allDay === true || data.timeFound === false,
    venue: first(data.venue, data.placeName),
    location: first(data.location, data.address, data.locationText),
  };
  const compact = (value: string) => compactCalendarDescription({ ...event, description: value });
  const medical = isMedicalCalendarEvent(data);
  const sourceText = [text(data.ocrText), text(record(data.scan).ocrText), description].join("\n");
  const facts = withMissingContactNumbers(factsFrom(data.ocrFacts), medical ? sourceText : "");
  const medicalTranscript = medical && isMedicalTranscript(description, data, facts);
  const footerPattern = /(?:^|\n\n)(?:Saved from Envitefy|View on Envitefy:\n(https?:\/\/\S+))$/;
  const existingFooter = description.match(footerPattern);
  const eventUrl = first(options.envitefyUrl, data.envitefyUrl, existingFooter?.[1]);
  const footer = /^https?:\/\/\S+$/i.test(eventUrl)
    ? `View on Envitefy:\n${eventUrl}`
    : "Saved from Envitefy";
  const cleanMedicalCopy = (value: string) =>
    value
      .split(/\n\s*\n/)
      .filter(
        (paragraph) =>
          !isMedicalTranscript(paragraph, data, facts) &&
          !/\b(?:DOB|date\s+of\s+birth|birth\s*date)\s*:/i.test(paragraph) &&
          !/^Bring your appointment details with you\.?$/i.test(paragraph.trim()),
      )
      .join("\n\n");
  // Every provider/export can pass through several adapters. Preserve already grouped
  // copy, but never let the footer on a legacy raw transcript bypass medical cleanup.
  if (existingFooter && !medicalTranscript) {
    const body = description.replace(footerPattern, "");
    return compact(`${medical ? cleanMedicalCopy(body) : body}\n\n${footer}`);
  }
  const sections: string[] = [];
  const addSection = (heading: string, lines: string[]) => {
    const content = unique(lines);
    if (content.length) sections.push(`${heading}\n${content.join("\n")}`);
  };
  // Title, date, time and location already have dedicated calendar fields.
  const details: string[] = [];
  if (text(data.hostName))
    details.push(`${medical ? "Appointment provider" : "Host"}: ${line(data.hostName)}`);

  const contacts: string[] = [];
  const extra: string[] = [];
  for (const fact of facts) {
    const key = fact.label
      .toLowerCase()
      .replace(/[._-]+/g, " ")
      .trim();
    if (medical && /^(?:dob|date of birth|birth ?date|birthday|age)$/.test(key)) continue;
    if (
      medical &&
      (isMedicalTranscript(fact.value, data, facts) ||
        /\b(?:DOB|date\s+of\s+birth|birth\s*date)\s*:/i.test(fact.value))
    )
      continue;
    const contact = contactNumberLabel(fact.label);
    if (contact) {
      contacts.push(`${contact}: ${fact.value}`);
      continue;
    }
    const label = medical ? MEDICAL_FACT_LABELS[key] || fact.label : fact.label;
    const formatted = `${label}: ${fact.value}`;
    if (medical && /^(?:Patient|Patient ID|Clinician|Appointment provider)$/.test(label)) {
      details.push(formatted);
    } else if (!details.some((detail) => detail.toLowerCase() === formatted.toLowerCase())) {
      extra.push(formatted);
    }
  }
  if (medical) {
    const labels = ["Patient", "Patient ID", "Clinician", "Appointment provider"];
    const rank = (value: string) => labels.indexOf(value.split(":", 1)[0]);
    details.sort((a, b) => rank(a) - rank(b));
  }
  if (details.length) sections.push(unique(details).join("\n"));
  for (const [label, value] of [
    ["Phone", data.phone],
    ["Fax", data.fax],
    ["Email", data.email],
  ]) {
    if (text(value)) contacts.push(`${label}: ${line(value)}`);
  }
  contacts.sort((a, b) => {
    const rank = (value: string) =>
      value.startsWith("Phone:") ? 0 : value.startsWith("Fax:") ? 1 : 2;
    return rank(a) - rank(b);
  });
  addSection("Contacts", contacts);

  const renderedFacts = new Set([...details, ...contacts, ...extra].map(comparisonKey));
  const remainingDescription = compact(description.replace(footerPattern, ""))
    .split("\n")
    .filter((value) => !renderedFacts.has(comparisonKey(value)))
    .join("\n");
  const about = compact(medical ? cleanMedicalCopy(remainingDescription) : remainingDescription);
  if (about) sections.push(about);

  const rsvp = record(data.rsvp);
  const rsvpValue = first(
    data.rsvp,
    data.rsvpUrl,
    rsvp.url,
    rsvp.link,
    rsvp.contact,
    rsvp.email,
    rsvp.phone,
  );
  addSection("RSVP", [
    ...(rsvpValue
      ? [`RSVP${text(data.rsvpName) ? ` (${line(data.rsvpName)})` : ""}: ${line(rsvpValue)}`]
      : []),
    ...(text(data.rsvpDeadline) ? [`RSVP by: ${line(data.rsvpDeadline)}`] : []),
  ]);
  const notes = unique([text(data.goodToKnow), text(data.thingsToDo), text(data.notes)]).filter(
    (note) => !medical || !/^Bring your appointment details with you\.?$/i.test(note),
  );
  if (text(data.attire)) notes.push(`Attire: ${line(data.attire)}`);
  if (Array.isArray(data.activities)) {
    const activities = unique(data.activities.map(line));
    if (activities.length) notes.push(`Activities: ${activities.join(", ")}`);
  }
  addSection("Notes", [
    ...notes.map((note) => (medical ? cleanMedicalCopy(plainText(note)) : plainText(note))),
    ...extra,
  ]);

  if (Array.isArray(data.additionalLocations)) {
    addSection(
      "Additional locations",
      data.additionalLocations.flatMap((item) => {
        const place = record(item);
        const value = [first(place.address, place.location), first(place.timeText, place.time)]
          .filter(Boolean)
          .join(" — ");
        return value ? [`${first(place.label, place.venue, "Location")}: ${value}`] : [];
      }),
    );
  }
  const links = Array.isArray(data.registries)
    ? data.registries.flatMap((item) => {
        const registry = record(item);
        const url = first(registry.url, registry.link);
        return /^https?:\/\//i.test(url)
          ? [`${first(registry.label, registry.name, "Registry")}: ${url}`]
          : [];
      })
    : [];
  const registryUrl = first(data.registryUrl, data.registryLink);
  if (
    /^https?:\/\//i.test(registryUrl) &&
    !links.some((link) => link.endsWith(`: ${registryUrl}`))
  ) {
    links.push(`Registry: ${registryUrl}`);
  }
  if (options.flyerUrl && !medical) links.push(`Flyer / invite: ${options.flyerUrl}`);
  addSection("Links", links);

  const body = compact(sections.join("\n\n"));
  const limit = Math.max(0, 12_000 - footer.length - 2);
  const trimmed =
    body.length > limit ? `${body.slice(0, Math.max(0, limit - 1)).trimEnd()}…` : body;
  // Plain descriptions with no added structured fields need no generated attribution.
  if (!eventUrl && !sections.length) return "";
  if (
    !eventUrl &&
    !facts.length &&
    !text(data.hostName) &&
    sections.length === 1 &&
    sections[0] === about
  )
    return trimmed;
  return [trimmed, footer].filter(Boolean).join("\n\n");
}

type CalendarDescriptionEvent = {
  title: string;
  start: string;
  end?: string;
  timezone?: string;
  allDay?: boolean;
  venue?: string;
  location?: string;
  description?: string;
};

function comparisonKey(value: string): string {
  return value.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
}

function dateTimeValues(value: string | undefined, timezone?: string, allDay?: boolean) {
  const dates = new Set<string>();
  const times = new Set<string>();
  if (!value) return { dates, times };
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const date = new Date(dateOnly ? `${value}T12:00:00Z` : value);
  if (Number.isNaN(date.getTime())) return { dates, times };

  try {
    const timeZone = dateOnly ? "UTC" : timezone || "UTC";
    for (const dateStyle of ["full", "long", "medium", "short"] as const) {
      dates.add(
        comparisonKey(new Intl.DateTimeFormat("en-US", { timeZone, dateStyle }).format(date)),
      );
    }
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(date);
    const part = (type: Intl.DateTimeFormatPartTypes) =>
      parts.find((item) => item.type === type)?.value;
    dates.add(comparisonKey(`${part("year")}-${part("month")}-${part("day")}`));
    dates.add(
      comparisonKey(
        new Intl.DateTimeFormat("en-US", {
          timeZone,
          year: "numeric",
          month: "numeric",
          day: "numeric",
        }).format(date),
      ),
    );

    if (!allDay && !dateOnly) {
      for (const hour12 of [true, false]) {
        for (const timeZoneName of [undefined, "short", "long"] as const) {
          times.add(
            comparisonKey(
              new Intl.DateTimeFormat("en-US", {
                timeZone,
                hour: "numeric",
                minute: "2-digit",
                hour12,
                timeZoneName,
              }).format(date),
            ),
          );
        }
      }
    }
  } catch {
    // Invalid time zones must not make an export fail or remove unverified details.
  }
  return { dates, times };
}

/** Remove standalone copies of calendar fields; keep prose and secondary itinerary details. */
export function compactCalendarDescription(event: CalendarDescriptionEvent): string {
  const description = event.description?.trim() || "";
  if (!description) return "";
  const title = comparisonKey(event.title);
  const locations = new Set(
    [event.venue, event.location, [event.venue, event.location].filter(Boolean).join(", ")]
      .filter((value): value is string => Boolean(value))
      .map(comparisonKey),
  );
  const start = dateTimeValues(event.start, event.timezone, event.allDay);
  const end = dateTimeValues(event.end, event.timezone, event.allDay);
  const lines = description.split(/\r?\n/).filter((line) => {
    const plain = line
      .trim()
      .replace(/^(?:[-*•]\s+|#{1,6}\s+)/, "")
      .replace(/\*\*/g, "");
    if (/^event details\s*:?$/i.test(plain)) return false;
    const field = plain.match(/^([^:]+):\s*(.+)$/);
    if (!field) return !title || comparisonKey(plain) !== title;
    const label = comparisonKey(field[1]);
    const value = comparisonKey(field[2]);
    switch (label) {
      case "category":
      case "eventcategory":
        return false;
      case "event":
      case "title":
      case "eventtitle":
      case "eventname":
        return !title || value !== title;
      case "location":
      case "venue":
      case "address":
        return !locations.has(value);
      case "date":
      case "eventdate":
      case "startdate":
        return !start.dates.has(value);
      case "enddate":
        return !end.dates.has(value);
      case "time":
      case "start":
      case "starts":
      case "starttime":
        return !start.times.has(value);
      case "end":
      case "ends":
      case "endtime":
        return !end.times.has(value);
      default:
        return true;
    }
  });
  return lines
    .filter((line, index) => {
      if (!/^(?:Contacts|Notes)\s*:?$/i.test(line.trim())) return true;
      const next = lines
        .slice(index + 1)
        .find((item) => item.trim())
        ?.trim();
      return Boolean(next && !/^(?:Contacts|Notes|View on Envitefy)\s*:?$/i.test(next));
    })
    .join("\n")
    .replace(/\n[\t ]*\n(?:[\t ]*\n)+/g, "\n\n")
    .trim();
}
