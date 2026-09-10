import { parseCalendarDateTimeToIso } from "./calendar-date-time.ts";
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
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as CalendarData)
    : {};
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

function timingLines(data: CalendarData): string[] {
  const raw = first(data.startIso, data.start, data.startAt, data.startISO);
  if (!raw) return [];
  const allDay = data.allDay === true || data.timeFound === false;
  const timezone = first(data.timezone, data.tz);
  // Never guess the viewer's timezone when a calendar action has not supplied one.
  if (!allDay && !timezone) return [];
  const iso = allDay
    ? parseCalendarDateTimeToIso(`${raw.slice(0, 10)}T12:00:00Z`, "UTC")
    : parseCalendarDateTimeToIso(raw, timezone);
  if (!iso) return [];
  try {
    const date = new Date(iso);
    const dateText = new Intl.DateTimeFormat("en-US", {
      weekday: "long", month: "long", day: "numeric", year: "numeric",
      timeZone: allDay ? "UTC" : timezone,
    }).format(date);
    const time = allDay ? "All day" : new Intl.DateTimeFormat("en-US", {
      hour: "numeric", minute: "2-digit", timeZoneName: "short", timeZone: timezone,
    }).format(date);
    return [`Date: ${dateText}`, `${allDay ? "Time" : "Starts"}: ${time}`];
  } catch {
    return [];
  }
}

/** One provider-neutral description for sync, compose links, and ICS exports. */
export function buildCalendarDescription(data: CalendarData, options: DescriptionOptions = {}): string {
  const rawDescription = text(data.description);
  // Export paths can pass through more than one adapter. Do not nest our own sections.
  if (rawDescription.startsWith("Event details\n") &&
    /\n\n(?:Saved from Envitefy|View on Envitefy:\nhttps?:\/\/\S+)$/.test(rawDescription)) {
    return rawDescription;
  }
  const description = plainText(rawDescription);

  const medical = isMedicalAppointmentCategory(text(data.category)) || record(data.scanPersonalization).medical === true;
  const sourceText = first(data.ocrText, record(data.scan).ocrText, description);
  const facts = withMissingContactNumbers(factsFrom(data.ocrFacts), medical ? sourceText : "");
  const sections: string[] = [];
  const addSection = (heading: string, lines: string[]) => {
    const content = unique(lines);
    if (content.length) sections.push(`${heading}\n${content.join("\n")}`);
  };
  const details: string[] = [`Event: ${line(data.title) || "Event"}`, ...timingLines(data)];
  const addDetail = (label: string, value: unknown) => {
    const content = line(value);
    if (content) details.push(`${label}: ${content}`);
  };
  addDetail("Category", data.category);
  addDetail("Venue", first(data.venue, data.placeName));
  const location = first(data.location, data.address, data.locationText);
  if (line(location).toLowerCase() !== line(first(data.venue, data.placeName)).toLowerCase()) {
    addDetail("Location", location);
  }
  addDetail(medical ? "Appointment provider" : "Host", data.hostName);

  const contacts: string[] = [];
  const extra: string[] = [];
  for (const fact of facts) {
    const key = fact.label.toLowerCase().replace(/[._-]+/g, " ").trim();
    if (medical && /^(?:dob|date of birth|birth ?date|birthday)$/.test(key)) continue;
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
  addSection("Event details", details);
  for (const [label, value] of [["Phone", data.phone], ["Fax", data.fax], ["Email", data.email]]) {
    if (text(value)) contacts.push(`${label}: ${line(value)}`);
  }
  contacts.sort((a, b) => {
    const rank = (value: string) => value.startsWith("Phone:") ? 0 : value.startsWith("Fax:") ? 1 : 2;
    return rank(a) - rank(b);
  });
  addSection("Contacts", contacts);

  // Legacy appointment descriptions sometimes contain the entire flattened medical slip.
  // Use its labelled facts instead; identity metadata and the transcript stay in the source.
  const identityLabels = description.match(/\b(?:DOB|date\s+of\s+birth|patient\s*(?:ID|number))\s*[:#]/gi) || [];
  const medicalTranscript = medical && (
    identityLabels.length >= 2 ||
    /\bDate\s+Time\s+Appointment\b/i.test(description) ||
    (facts.length > 0 && Boolean(text(data.ocrText)) && line(description) === line(data.ocrText))
  );
  if (description && !medicalTranscript) addSection("About this event", [description]);

  const rsvp = record(data.rsvp);
  const rsvpValue = first(data.rsvp, data.rsvpUrl, rsvp.url, rsvp.link, rsvp.contact, rsvp.email, rsvp.phone);
  addSection("RSVP", [
    ...(rsvpValue ? [`RSVP${text(data.rsvpName) ? ` (${line(data.rsvpName)})` : ""}: ${line(rsvpValue)}`] : []),
    ...(text(data.rsvpDeadline) ? [`RSVP by: ${line(data.rsvpDeadline)}`] : []),
  ]);
  const notes = unique([text(data.goodToKnow), text(data.thingsToDo), text(data.notes)])
    .filter((note) => !medical || !/^Bring your appointment details with you\.?$/i.test(note));
  if (text(data.attire)) notes.push(`Attire: ${line(data.attire)}`);
  if (Array.isArray(data.activities)) {
    const activities = unique(data.activities.map(line));
    if (activities.length) notes.push(`Activities: ${activities.join(", ")}`);
  }
  addSection("Notes", [...notes.map(plainText), ...extra]);

  if (Array.isArray(data.additionalLocations)) {
    addSection("Additional locations", data.additionalLocations.flatMap((item) => {
      const place = record(item);
      const value = [first(place.address, place.location), first(place.timeText, place.time)].filter(Boolean).join(" — ");
      return value ? [`${first(place.label, place.venue, "Location")}: ${value}`] : [];
    }));
  }
  const links = Array.isArray(data.registries) ? data.registries.flatMap((item) => {
    const registry = record(item);
    const url = first(registry.url, registry.link);
    return /^https?:\/\//i.test(url) ? [`${first(registry.label, registry.name, "Registry")}: ${url}`] : [];
  }) : [];
  const registryUrl = first(data.registryUrl, data.registryLink);
  if (/^https?:\/\//i.test(registryUrl) && !links.some((link) => link.endsWith(`: ${registryUrl}`))) {
    links.push(`Registry: ${registryUrl}`);
  }
  if (options.flyerUrl && !medical) links.push(`Flyer / invite: ${options.flyerUrl}`);
  addSection("Links", links);

  const eventUrl = first(options.envitefyUrl, data.envitefyUrl);
  const footer = /^https?:\/\/\S+$/i.test(eventUrl) ? `View on Envitefy:\n${eventUrl}` : "Saved from Envitefy";
  const body = sections.join("\n\n");
  const limit = Math.max(0, 12_000 - footer.length - 2);
  const trimmed = body.length > limit ? `${body.slice(0, Math.max(0, limit - 1)).trimEnd()}…` : body;
  return `${trimmed}\n\n${footer}`;
}
