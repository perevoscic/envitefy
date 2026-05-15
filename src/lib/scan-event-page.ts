import * as chrono from "chrono-node";
import type { ConciergeEventType, DetectedSourceIntent } from "./concierge/types.ts";
import { sanitizeConciergePublicEventData } from "./concierge/public-copy.ts";
import {
  cleanAddressLabel,
  detectCategory,
  extractCommonOcrFactsFromFlyerText,
  extractRsvpDetails,
  inferTimezoneFromAddress,
  pickTitle,
} from "./ocr/text.ts";
import {
  normalizeOcrLocationFields,
  normalizeOcrRsvpFields,
} from "./ocr/field-normalization.ts";
import { mergeOcrFacts, normalizeOcrFacts } from "./ocr/facts.ts";
import {
  isBasketballOcrSkinCandidate,
  isFootballOcrSkinCandidate,
  isPickleballOcrSkinCandidate,
  normalizeOcrSkinCategory,
} from "./ocr/skin-background.ts";
import type { UploadResponse } from "./upload-config.ts";

export type ScanEventPageSource = "camera" | "upload";

export type ScanEventPageOcrResult = {
  ocrText?: string | null;
  fieldsGuess?: Record<string, unknown> | null;
  category?: string | null;
  birthdayTemplateHint?: unknown;
  ocrSkin?: Record<string, unknown> | null;
  ocrSource?: string | null;
  scanAttemptId?: string | null;
  events?: unknown[] | null;
  schedule?: Record<string, unknown> | null;
  practiceSchedule?: Record<string, unknown> | null;
  openHouse?: Record<string, unknown> | null;
  thumbnailFocus?: unknown;
};

export type ScanEventPageHistoryPayload = {
  title: string;
  data: Record<string, unknown>;
  ownership: "owned" | "invited";
};

function cleanString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.replace(/\s+/g, " ").trim();
  return trimmed || null;
}

function firstString(...values: unknown[]): string | null {
  for (const value of values) {
    const text = cleanString(value);
    if (text) return text;
  }
  return null;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function normalizeIso(value: unknown): string | null {
  const raw = cleanString(value);
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function normalizeMaybeDateText(value: unknown, timezone: string): string | null {
  const direct = normalizeIso(value);
  if (direct) return direct;
  const raw = cleanString(value);
  if (!raw) return null;
  return parseScanDateTimeText(raw, timezone).startISO;
}

function addMinutesIso(startIso: string | null, minutes: number): string | null {
  if (!startIso) return null;
  const date = new Date(startIso);
  if (Number.isNaN(date.getTime())) return null;
  date.setUTCMinutes(date.getUTCMinutes() + minutes);
  return date.toISOString();
}

function formatScheduleLine(startIso: string | null, timeFound: unknown, timezone: string) {
  if (!startIso) return "Date TBD";
  const date = new Date(startIso);
  if (Number.isNaN(date.getTime())) return "Date TBD";
  const dateText = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: timezone || undefined,
  }).format(date);
  if (timeFound === false) return dateText;
  const timeText = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: timezone || undefined,
  }).format(date);
  return `${dateText} at ${timeText}`;
}

function eventTypeFromText(category: string | null, title: string | null, ocrText: string | null) {
  const haystack = [category, title, ocrText].filter(Boolean).join("\n").toLowerCase();
  if (/\bbirthday|bday|turns?\s+\d+|turning\s+\d+/.test(haystack)) return "birthday";
  if (/\bwedding|reception|ceremony\b/.test(haystack)) return "wedding";
  if (/\bgender\s+reveal\b/.test(haystack)) return "gender_reveal";
  if (/\bbaby\s+shower\b/.test(haystack)) return "baby_shower";
  if (/\bbridal\s+shower\b/.test(haystack)) return "bridal_shower";
  if (/\bgraduat|class\s+of\s+\d{4}\b/.test(haystack)) return "graduation";
  if (/\bgymnastics|gym\s+meet|meet\s+schedule\b/.test(haystack)) return "gym_meet";
  if (/\bfootball|game\s*day|kickoff|tailgate\b/.test(haystack)) return "football";
  if (/\bsoccer|basketball|baseball|softball|volleyball|pickleball|tournament\b/.test(haystack)) {
    return "sport_event";
  }
  if (/\bopen\s+house|mls|realtor|brokerage\b/.test(haystack)) return "open_house";
  if (/\bhousewarming\b/.test(haystack)) return "housewarming";
  if (/\bappointment|doctor|dentist|clinic|consultation\b/.test(haystack)) return "appointment";
  if (/\bworkshop|seminar|class|training\b/.test(haystack)) return "workshop";
  return "general";
}

function categoryLabelForEventType(eventType: ConciergeEventType, fallback: string | null) {
  const normalizedFallback = cleanString(fallback);
  const labels: Record<ConciergeEventType, string> = {
    unknown: "General Events",
    birthday: "Birthdays",
    wedding: "Weddings",
    baby_shower: "Baby Showers",
    gender_reveal: "Gender Reveal",
    bridal_shower: "Bridal Showers",
    graduation: "Graduations",
    gym_meet: "Sport Events",
    game_day: "Game Day",
    football: "Game Day",
    sport_event: "Sport Events",
    field_trip: "Field Trip/Day",
    open_house: "Open House",
    housewarming: "Housewarming",
    appointment: "Appointments",
    workshop: "Workshops",
    special_event: "Special Events",
    smart_signup: "Smart Sign-up",
    general: "General Events",
  };
  if (eventType !== "unknown" && eventType !== "general") return labels[eventType] || "General Events";
  return normalizedFallback || labels[eventType] || "General Events";
}

function inferScanSourceIntent(args: {
  category: string | null;
  title: string | null;
  description: string | null;
  ocrText: string | null;
  eventType: ConciergeEventType;
}): { intent: DetectedSourceIntent; confidence: "high" | "medium" | "low"; signals: string[] } {
  const haystack = [args.category, args.title, args.description, args.ocrText]
    .filter(Boolean)
    .join("\n")
    .toLowerCase();
  const isInviteCardType = [
    "birthday",
    "wedding",
    "gender_reveal",
    "baby_shower",
    "bridal_shower",
  ].includes(args.eventType);
  const inviteLanguage =
    /\b(invite|invitation|you're invited|you are invited|join us|save the date|please join)\b/.test(
      haystack,
    );
  if (isInviteCardType && inviteLanguage) {
    return {
      intent: "received_invite",
      confidence: "high",
      signals: ["classic_invite_category", "invite_language"],
    };
  }
  if (
    /\b(schedule|practice|flyer|open house|appointment|packet|public notice|school|clinic)\b/.test(
      haystack,
    )
  ) {
    return {
      intent: "authoring_source",
      confidence: "medium",
      signals: ["authoring_or_schedule_language"],
    };
  }
  return { intent: "unknown", confidence: "low", signals: [] };
}

function isOcrInviteCategory(value: unknown): boolean {
  return Boolean(normalizeOcrSkinCategory(value));
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.map((item) => cleanString(item)).filter((item): item is string => Boolean(item))
    : [];
}

function splitOcrLines(...values: unknown[]): string[] {
  const seen = new Set<string>();
  const lines: string[] = [];
  for (const value of values) {
    const text = typeof value === "string" ? value : "";
    for (const part of text.split(/\r?\n+/)) {
      const cleaned = part
        .replace(/\s+/g, " ")
        .replace(/^[•·\-–—\s]+|[•·\-–—\s]+$/g, "")
        .trim();
      if (!cleaned) continue;
      const key = cleaned.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      lines.push(cleaned);
    }
  }
  return lines;
}

function isGenericTitle(value: unknown): boolean {
  const text = cleanString(value);
  if (!text) return true;
  return /^(?:event(?:\s+from\s+(?:flyer|invite|upload|scan|image))?|scanned\s+event|general\s+event|untitled\s+event|flyer|invite|uploaded\s+event)$/i.test(
    text,
  );
}

function isTbdValue(value: unknown): boolean {
  const text = cleanString(value);
  if (!text) return true;
  return /^(?:date|time|location|venue|where|when|event\s+location)\s+tbd$/i.test(text);
}

function firstSpecificString(...values: unknown[]): string | null {
  for (const value of values) {
    const text = cleanString(value);
    if (text && !isTbdValue(text)) return text;
  }
  return null;
}

function firstSpecificTitle(...values: unknown[]): string | null {
  for (const value of values) {
    const text = cleanString(value);
    if (text && !isGenericTitle(text)) return text;
  }
  return null;
}

function lineLooksLikeDateOrTime(value: string): boolean {
  const text = value.trim();
  if (!text) return false;
  const hasEventKeyword =
    /\b(?:birthday|party|wedding|graduation|commencement|shower|ceremony|reception|celebration|open\s+house|tournament|game|meet|class\s+of)\b/i.test(
      text,
    );
  if (hasEventKeyword && !/\b(?:at|from|until|to)\s+\d{1,2}/i.test(text)) return false;
  return (
    /\b(?:mon|tue|wed|thu|fri|sat|sun)(?:day)?\b/i.test(text) ||
    /\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{1,2}(?:st|nd|rd|th)?\b/i.test(
      text,
    ) ||
    /\b\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?\b/.test(text) ||
    /\b(?:from\s+)?\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?)?\s*(?:-|–|—|to|until)\s*\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?)\b/i.test(
      text,
    ) ||
    /\b\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?)\b/i.test(text)
  );
}

function lineLooksLikeAddress(value: string): boolean {
  return /\b\d{1,6}\s+[A-Za-z0-9 .'-]+?\b(?:Street|St\.?|Avenue|Ave\.?|Road|Rd\.?|Drive|Dr\.?|Highway|Hwy\.?|Boulevard|Blvd\.?|Lane|Ln\.?|Way|Court|Ct\.?|Circle|Cir\.?|Trail|Trl\.?|Parkway|Pkwy\.?|Place|Pl\.?|Terrace|Ter\.?)\b/i.test(
    value,
  );
}

function lineLooksLikeContact(value: string): boolean {
  return /\b(?:rsvp|respond|reply|text|call|contact)\b/i.test(value) ||
    /\b(?:\+?1[-.\s]?)?(?:\(\s*\d{3}\s*\)|\d{3})[-.\s]?\d{3}[-.\s]?\d{4}\b/.test(value) ||
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(value);
}

function normalizeDetectedTitle(value: string): string {
  return value
    .replace(/\b(?:mon|tue|wed|thu|fri|sat|sun)(?:day)?\.?\s*$/i, "")
    .replace(/\s{2,}/g, " ")
    .replace(/[,\s-]+$/g, "")
    .trim();
}

function deriveTitleFromOcr(lines: string[], rawText: string | null): string | null {
  for (const line of lines) {
    const cleaned = normalizeDetectedTitle(line);
    if (!cleaned || isGenericTitle(cleaned)) continue;
    if (lineLooksLikeAddress(cleaned) || lineLooksLikeContact(cleaned)) continue;
    if (lineLooksLikeDateOrTime(cleaned)) continue;
    if (
      /\b(?:birthday|party|wedding|graduation|commencement|shower|ceremony|reception|celebration|open\s+house|tournament|game|meet|class\s+of|save\s+the\s+date)\b/i.test(
        cleaned,
      )
    ) {
      return cleaned;
    }
  }

  const picked = normalizeDetectedTitle(pickTitle(lines, rawText || ""));
  return isGenericTitle(picked) ? null : picked;
}

function polishAddressLine(value: string): string {
  return cleanAddressLabel(value)
    .replace(
      /\b((?:Highway|Hwy\.?|Route|Road|Rd\.?)\s+\d+)\s+([A-Z][A-Za-z .'-]+,\s*[A-Z]{2}\b)/,
      "$1, $2",
    )
    .replace(/\s{2,}/g, " ")
    .trim();
}

function extractAddressFromOcr(lines: string[]): string | null {
  const index = lines.findIndex((line) => lineLooksLikeAddress(line));
  if (index < 0) return null;
  const parts = [lines[index]];
  const next = lines[index + 1] || "";
  if (/^\(?\s*(?:near|by|across|behind|inside)\b/i.test(next)) {
    parts.push(next);
  }
  return polishAddressLine(parts.join(" "));
}

function inferTimezoneFromState(value: string | null): string | null {
  if (!value) return null;
  const statePattern =
    "(A[KLRZ]|C[AOT]|D[CE]|F[LM]|G[AU]|HI|I[ADLN]|K[SY]|LA|M[ADEINOST]|N[CDEHJMVY]|O[HKR]|P[AE]|RI|S[CD]|T[NX]|UT|V[AIT]|W[AIVY])";
  const state =
    value.match(new RegExp(`,\\s*${statePattern}\\b`, "i"))?.[1]?.toUpperCase() ||
    value.match(new RegExp(`\\b${statePattern}\\s+\\d{5}(?:-\\d{4})?\\b`, "i"))?.[1]?.toUpperCase() ||
    null;
  if (!state) return null;
  if (state === "FL") {
    return /\b(?:destin|pensacola|fort\s+walton\s+beach|niceville|crestview|miramar\s+beach|santa\s+rosa\s+beach|seaside|rosemary\s+beach|panama\s+city(?:\s+beach)?|lynn\s+haven|freeport|defuniak\s+springs|navarre|gulf\s+breeze|mary\s+esther|shalimar|valparaiso|milton|pace|cantonment|chipley|bonifay|marianna|okaloosa|walton|escambia|santa\s+rosa\s+county|bay\s+county|washington\s+county|holmes\s+county|jackson\s+county)\b/i.test(
      value,
    )
      ? "America/Chicago"
      : "America/New_York";
  }
  if (["CA", "NV", "OR", "WA"].includes(state)) return "America/Los_Angeles";
  if (state === "AZ") return "America/Phoenix";
  if (["CO", "ID", "MT", "NM", "UT", "WY"].includes(state)) return "America/Denver";
  if (["AL", "AR", "IA", "IL", "KS", "LA", "MN", "MO", "MS", "NE", "OK", "TX", "WI"].includes(state)) {
    return "America/Chicago";
  }
  if (
    ["CT", "DC", "DE", "GA", "IN", "MA", "MD", "ME", "MI", "NC", "NH", "NJ", "NY", "OH", "PA", "RI", "SC", "VA", "VT", "WV"].includes(
      state,
    )
  ) {
    return "America/New_York";
  }
  if (state === "AK") return "America/Anchorage";
  if (state === "HI") return "Pacific/Honolulu";
  return null;
}

function hasExplicitTimeText(value: string | null): boolean {
  if (!value) return false;
  return /\b(?:from\s+)?\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?)?\s*(?:-|–|—|to|until)\s*\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?)\b/i.test(
    value,
  ) || /\b\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?)\b/i.test(value);
}

type ChronoKnownValues = {
  year?: number;
  month?: number;
  day?: number;
  hour?: number;
  minute?: number;
  second?: number;
};

type ChronoComponentWithKnownValues = {
  knownValues?: ChronoKnownValues;
  date: () => Date;
};

function getTimeZoneOffsetMs(date: Date, timezone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);
  const values: Record<string, number> = {};
  for (const part of parts) {
    if (part.type !== "literal") values[part.type] = Number(part.value);
  }
  const hour = values.hour === 24 ? 0 : values.hour || 0;
  const asUtc = Date.UTC(
    values.year || 1970,
    (values.month || 1) - 1,
    values.day || 1,
    hour,
    values.minute || 0,
    values.second || 0,
  );
  return asUtc - date.getTime();
}

function zonedKnownValuesToIso(values: ChronoKnownValues | null | undefined, timezone: string) {
  if (!values?.year || !values.month || !values.day) return null;
  const hour = values.hour || 0;
  const minute = values.minute || 0;
  const second = values.second || 0;
  const utcGuess = Date.UTC(values.year, values.month - 1, values.day, hour, minute, second);
  let offset = getTimeZoneOffsetMs(new Date(utcGuess), timezone);
  let adjusted = utcGuess - offset;
  const secondOffset = getTimeZoneOffsetMs(new Date(adjusted), timezone);
  if (secondOffset !== offset) {
    offset = secondOffset;
    adjusted = utcGuess - offset;
  }
  return new Date(adjusted).toISOString();
}

function parseScanDateTimeText(
  text: string | null,
  timezone: string,
): { startISO: string | null; endISO: string | null; timeFound: boolean | null } {
  if (!text) return { startISO: null, endISO: null, timeFound: null };
  const lines = splitOcrLines(text);
  const dateLine = lines.find(
    (line) =>
      !lineLooksLikeAddress(line) &&
      !lineLooksLikeContact(line) &&
      (/\b(?:mon|tue|wed|thu|fri|sat|sun)(?:day)?\b/i.test(line) ||
        /\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{1,2}(?:st|nd|rd|th)?\b/i.test(
          line,
        ) ||
        /\b\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?\b/.test(line)),
  );
  const timeLine = lines.find(
    (line) =>
      !lineLooksLikeAddress(line) &&
      !lineLooksLikeContact(line) &&
      /\b(?:from\s+)?\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?)?\s*(?:-|–|—|to|until)\s*\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?)\b/i.test(
        line,
      ),
  );
  const year = text.match(/\b(20\d{2}|19\d{2})\b/)?.[1] || null;
  const candidateTexts: string[] = [];
  if (dateLine && timeLine) {
    const dateWithYear = year && !/\b(?:20\d{2}|19\d{2})\b/.test(dateLine) ? `${dateLine} ${year}` : dateLine;
    candidateTexts.push(`${dateWithYear} ${timeLine}`);
  }
  if (dateLine) {
    candidateTexts.push(year && !/\b(?:20\d{2}|19\d{2})\b/.test(dateLine) ? `${dateLine} ${year}` : dateLine);
  }
  candidateTexts.push(text);

  for (const candidateText of candidateTexts) {
    const parsed = chrono.parse(candidateText, new Date(), { forwardDate: true })[0];
    if (!parsed?.start) continue;
    const startComponent = parsed.start as ChronoComponentWithKnownValues;
    const endComponent = parsed.end as ChronoComponentWithKnownValues | undefined;
    const startISO = zonedKnownValuesToIso(startComponent.knownValues, timezone) || startComponent.date().toISOString();
    const endISO = endComponent
      ? zonedKnownValuesToIso(endComponent.knownValues, timezone) || endComponent.date().toISOString()
      : null;
    return {
      startISO,
      endISO,
      timeFound: hasExplicitTimeText(candidateText),
    };
  }
  return { startISO: null, endISO: null, timeFound: null };
}

function buildScanDescription(args: {
  title: string;
  scheduleLine: string | null;
  locationLine: string;
  rsvpText: string | null;
}) {
  const schedule = args.scheduleLine && args.scheduleLine !== "Date TBD" ? args.scheduleLine : null;
  const location = args.locationLine !== "Location TBD" ? args.locationLine : null;
  const parts: string[] = [];
  if (schedule && location) {
    parts.push(`${args.title} is scheduled for ${schedule} at ${location}.`);
  } else if (schedule) {
    parts.push(`${args.title} is scheduled for ${schedule}.`);
  } else if (location) {
    parts.push(`${args.title} is at ${location}.`);
  } else {
    parts.push(`Details for ${args.title}.`);
  }
  if (args.rsvpText) {
    parts.push(args.rsvpText.replace(/[.!?]+$/g, "."));
  }
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

function isGenericDescription(value: unknown, title: string): boolean {
  const text = cleanString(value);
  if (!text) return true;
  if (/^details\s+from\s+the\s+uploaded\s+invite\.?$/i.test(text)) return true;
  if (/^join\s+us\s+for\s+(?:event\s+from\s+flyer|scanned\s+event|general\s+event)\.?$/i.test(text)) {
    return true;
  }
  return isGenericTitle(title) && /^join\s+us\s+for\b/i.test(text);
}

function extractPhone(value: string | null): string | null {
  return (
    value?.match(/\b(?:\+?1[-.\s]?)?(?:\(\s*\d{3}\s*\)|\d{3})[-.\s]?\d{3}[-.\s]?\d{4}\b/)?.[0] ||
    null
  );
}

function extractRsvpName(value: string | null): string | null {
  const text = cleanString(value);
  if (!text) return null;
  const match = text.match(/\bRSVP:\s*([^0-9,;:.]+?)(?=\s+(?:\+?1[-.\s]?)?(?:\(\s*\d{3}\s*\)|\d{3})|$)/i);
  return cleanString(match?.[1]) || null;
}

function resolveOcrCreatedVia(args: {
  category: string;
  eventType: ConciergeEventType;
  title: string;
  description: string;
  activities: string[];
  ocrSkin: Record<string, unknown>;
  openHouse: Record<string, unknown>;
}) {
  const isBirthdayOcrEvent = args.eventType === "birthday";
  const isWeddingOcrEvent = args.eventType === "wedding";
  const isOpenHouseOcrEvent =
    args.eventType === "open_house" ||
    Object.keys(args.openHouse).length > 0 ||
    String(args.ocrSkin.category || "").toLowerCase() === "open-house";
  const isPickleballOcrEvent =
    args.ocrSkin.sportKind === "pickleball" ||
    isPickleballOcrSkinCandidate({
      category: args.category,
      title: args.title,
      description: args.description,
      activities: args.activities,
    });
  const isFootballOcrEvent =
    args.ocrSkin.category === "football" ||
    isFootballOcrSkinCandidate({
      category: args.category,
      title: args.title,
      description: args.description,
      activities: args.activities,
    });
  const isBasketballOcrEvent =
    args.ocrSkin.category === "basketball" ||
    isBasketballOcrSkinCandidate({
      category: args.category,
      title: args.title,
      description: args.description,
      activities: args.activities,
    });
  const isInviteOcrEvent =
    isOcrInviteCategory(args.category) ||
    isPickleballOcrEvent ||
    isFootballOcrEvent ||
    isBasketballOcrEvent ||
    isOpenHouseOcrEvent;
  const normalizedCategory =
    isPickleballOcrEvent || isFootballOcrEvent || isBasketballOcrEvent
      ? "Sport Events"
      : isOpenHouseOcrEvent
        ? "Open House"
        : args.category;
  const createdVia = isBirthdayOcrEvent
    ? "ocr-birthday-skin"
    : isWeddingOcrEvent
      ? "ocr-wedding-renderer"
      : isOpenHouseOcrEvent
        ? "ocr-open-house-skin"
        : isPickleballOcrEvent
          ? "ocr-pickleball-skin"
          : isFootballOcrEvent
            ? "ocr-football-skin"
            : isBasketballOcrEvent
              ? "ocr-basketball-skin"
              : isInviteOcrEvent
                ? "ocr-invite-skin"
                : "ocr";

  return {
    createdVia,
    category: normalizedCategory,
    isInviteOcrEvent,
    isWeddingOcrEvent,
    isOpenHouseOcrEvent,
  };
}

export function buildScanEventPageHistoryPayload(params: {
  ocr: ScanEventPageOcrResult;
  media?: UploadResponse | null;
  scanAttemptId?: string | null;
  source: ScanEventPageSource;
}): ScanEventPageHistoryPayload {
  const fieldsGuess = asRecord(params.ocr.fieldsGuess);
  const rawOcrText =
    typeof params.ocr.ocrText === "string" ? params.ocr.ocrText.trim() : "";
  const ocrText = cleanString(rawOcrText);
  const rescueText = [
    rawOcrText,
    ...[
      fieldsGuess.title,
      fieldsGuess.description,
      fieldsGuess.start,
      fieldsGuess.dateText,
      fieldsGuess.timeText,
      fieldsGuess.location,
      fieldsGuess.address,
      fieldsGuess.rsvp,
      fieldsGuess.rsvpText,
    ].map((value) => cleanString(value)),
  ]
    .filter(Boolean)
    .join("\n");
  const ocrLines = splitOcrLines(rescueText);
  const originalCategoryRaw = firstString(params.ocr.category, fieldsGuess.category);
  const rescuedCategory = detectCategory(
    [rescueText, fieldsGuess.title, originalCategoryRaw].filter(Boolean).join("\n"),
  );
  const categoryRaw = firstString(rescuedCategory, originalCategoryRaw);
  const rescuedTitle = deriveTitleFromOcr(ocrLines, rescueText);
  const title =
    firstSpecificTitle(fieldsGuess.title, rescuedTitle, categoryRaw, "Scanned Event") ||
    "Scanned Event";
  const rescuedLocation = extractAddressFromOcr(ocrLines);
  const normalizedLocation = normalizeOcrLocationFields({
    venue: firstSpecificString(fieldsGuess.venue, fieldsGuess.venueName),
    location: firstSpecificString(fieldsGuess.location, fieldsGuess.address),
    fallbackLocation: rescuedLocation,
  });
  const venue = normalizedLocation.venue;
  const location = normalizedLocation.location;
  const locationLine = normalizedLocation.locationLine || "Location TBD";
  const rsvpDetails = extractRsvpDetails(rescueText);
  const normalizedRsvp = normalizeOcrRsvpFields({
    rsvp: firstSpecificString(fieldsGuess.rsvp, fieldsGuess.rsvpText),
    rsvpUrl: firstSpecificString(fieldsGuess.rsvpUrl, fieldsGuess.rsvpLink),
    rsvpDeadline: firstSpecificString(fieldsGuess.rsvpDeadline),
    extractedContact: rsvpDetails.contact,
    extractedUrl: rsvpDetails.url,
    extractedDeadline: rsvpDetails.deadline,
  });
  const rsvpText = normalizedRsvp.rsvp;
  const rsvpUrl = normalizedRsvp.rsvpUrl;
  const rsvpDeadline = normalizedRsvp.rsvpDeadline;
  const eventType = eventTypeFromText(categoryRaw, title, ocrText);
  const initialCategory = categoryLabelForEventType(eventType, categoryRaw);
  const ocrSkin = asRecord(params.ocr.ocrSkin);
  const openHouse = asRecord(params.ocr.openHouse);
  const activities = stringArray(fieldsGuess.activities).slice(0, 8);
  const timezone =
    firstString(fieldsGuess.timezone, params.ocr.schedule?.timezone, params.ocr.practiceSchedule?.timezone) ||
    inferTimezoneFromState([venue, location, ocrText].filter(Boolean).join(" ")) ||
    inferTimezoneFromAddress([venue, location, ocrText].filter(Boolean).join(" ")) ||
    Intl.DateTimeFormat().resolvedOptions().timeZone ||
    "UTC";
  const rescuedDate = parseScanDateTimeText(rescueText, timezone);
  const fieldStartText = firstString(fieldsGuess.start, fieldsGuess.startISO, fieldsGuess.startAt);
  const fieldEndText = firstString(fieldsGuess.end, fieldsGuess.endISO, fieldsGuess.endAt);
  const fieldDateTimeText = [fieldStartText, fieldsGuess.timeText].filter(Boolean).join(" ");
  const fieldStartISO = normalizeMaybeDateText(fieldStartText, timezone);
  const fieldEndISO = normalizeMaybeDateText(fieldEndText, timezone);
  const fieldHasExplicitTime = Boolean(normalizeIso(fieldStartText)) || hasExplicitTimeText(fieldDateTimeText);
  const preferRescuedDate = Boolean(rescuedDate.startISO && rescuedDate.timeFound && !fieldHasExplicitTime);
  const startISO = preferRescuedDate ? rescuedDate.startISO : fieldStartISO || rescuedDate.startISO;
  const endISO =
    (preferRescuedDate ? rescuedDate.endISO : fieldEndISO) ||
    rescuedDate.endISO ||
    (startISO && fieldsGuess.timeFound !== false ? addMinutesIso(startISO, 90) : null);
  const timeFound =
    typeof fieldsGuess.timeFound === "boolean" ? fieldsGuess.timeFound : rescuedDate.timeFound;
  const scheduleLine = firstString(
    firstSpecificString(fieldsGuess.whenLabel),
    firstSpecificString(fieldsGuess.scheduleLine),
    fieldsGuess.dateText && fieldsGuess.timeText
      ? `${fieldsGuess.dateText} at ${fieldsGuess.timeText}`
      : fieldsGuess.dateText,
    formatScheduleLine(startISO, timeFound, timezone),
  );
  const description =
    !isGenericDescription(fieldsGuess.description, title)
      ? firstString(fieldsGuess.description) ||
        buildScanDescription({ title, scheduleLine, locationLine, rsvpText })
      : buildScanDescription({ title, scheduleLine, locationLine, rsvpText });
  const skinRouting = resolveOcrCreatedVia({
    category: initialCategory,
    eventType,
    title,
    description,
    activities,
    ocrSkin,
    openHouse,
  });
  const category = skinRouting.category;
  const sourceIntent = inferScanSourceIntent({
    category,
    title,
    description,
    ocrText,
    eventType,
  });
  const ownership = sourceIntent.intent === "received_invite" ? "invited" : "owned";
  const eventCount = Array.isArray(params.ocr.events) ? params.ocr.events.length : 0;
  const thumbnail =
    params.media?.eventMedia.thumbnail || params.media?.stored.display?.url || undefined;
  const attachment = params.media?.eventMedia.attachment;
  const registryUrl = firstString(fieldsGuess.registryUrl, fieldsGuess.registryLink);
  const hostName = firstString(fieldsGuess.hostName, fieldsGuess.host);
  const rsvpName = extractRsvpName(rsvpText);
  const rsvpPhone = extractPhone(rsvpText);
  const goodToKnow = firstString(fieldsGuess.goodToKnow);
  const ocrFacts = mergeOcrFacts(
    normalizeOcrFacts(fieldsGuess.ocrFacts || fieldsGuess.facts),
    extractCommonOcrFactsFromFlyerText(rescueText),
    goodToKnow ? [{ label: "Good to Know", value: goodToKnow }] : [],
  );
  const publicSections = [
    { label: "Overview", value: description },
    { label: "When", value: scheduleLine || "Date TBD" },
    { label: "Where", value: locationLine },
    ...(hostName ? [{ label: "Host", value: hostName }] : []),
    ...(rsvpText || rsvpUrl ? [{ label: "RSVP", value: rsvpText || rsvpUrl }] : []),
    ...(registryUrl ? [{ label: "Registry", value: registryUrl }] : []),
  ];

  const data: Record<string, unknown> = {
    ownership,
    invitedFromScan: sourceIntent.intent === "received_invite",
    sourceContext: {
      type: params.source === "camera" ? "snap" : "upload",
      detectedSourceIntent: sourceIntent.intent,
      confidence: sourceIntent.confidence,
      signals: sourceIntent.signals.map((code) => ({ code, label: code.replace(/_/g, " ") })),
      requiresUserConfirmation: false,
      originalCategory: originalCategoryRaw || null,
      hasUsableContext: true,
      ambiguity: eventCount > 1 ? "multiple" : "none",
      eventCount,
    },
    creationIntent: "create_event",
    requestedOutputs: ["event_page", "live_card"],
    outputs: ["event_page", "live_card"],
    createdVia: skinRouting.createdVia,
    status: "published",
    draftStatus: "published",
    category,
    eventType,
    title,
    headlineTitle: title,
    eventPurpose: title,
    description,
    dateText: startISO ? null : "Date TBD",
    date: startISO ? null : "Date TBD",
    timeText: startISO && timeFound === false ? null : firstString(fieldsGuess.timeText),
    time: startISO && timeFound === false ? null : firstString(fieldsGuess.timeText),
    whenLabel: scheduleLine || "Date TBD",
    scheduleLine: scheduleLine || "Date TBD",
    startAt: startISO,
    startISO,
    start: startISO,
    endAt: endISO,
    endISO,
    end: endISO,
    timeFound,
    timezone,
    location: location || undefined,
    venue: venue || undefined,
    locationLabel: locationLine,
    locationText: locationLine,
    placeName: venue || location || undefined,
    coverImageUrl: thumbnail,
    thumbnail,
    heroImage: thumbnail,
    customHeroImage: thumbnail,
    heroTextMode: thumbnail ? "image" : "text",
    attachment,
    thumbnailFocus: params.ocr.thumbnailFocus ?? undefined,
    birthdayTemplateHint: params.ocr.birthdayTemplateHint ?? undefined,
    ocrSkin: skinRouting.isInviteOcrEvent ? params.ocr.ocrSkin ?? undefined : undefined,
    openHouse: skinRouting.isOpenHouseOcrEvent ? params.ocr.openHouse ?? undefined : undefined,
    flyerColors:
      skinRouting.isWeddingOcrEvent && ocrSkin.palette && typeof ocrSkin.palette === "object"
        ? ocrSkin.palette
        : undefined,
    fieldsGuess,
    ocrFacts: ocrFacts.length ? ocrFacts : undefined,
    rsvp: rsvpText || undefined,
    rsvpUrl: rsvpUrl || undefined,
    rsvpDeadline: rsvpDeadline || undefined,
    rsvpName: rsvpName || undefined,
    rsvpPhone: rsvpPhone || undefined,
    rsvpContact: rsvpText || undefined,
    rsvpEnabled: false,
    hostName: hostName || undefined,
    activities: activities.length ? activities : undefined,
    attire: firstString(fieldsGuess.attire) || undefined,
    registryUrl: registryUrl || undefined,
    registryProvider: firstString(fieldsGuess.registryProvider) || undefined,
    goodToKnow: goodToKnow || undefined,
    thingsToDo: goodToKnow || undefined,
    previewCopy: {
      headline: title,
      subheadline: category,
      body: description,
      scheduleLine: scheduleLine || "Date TBD",
      locationLine,
      cta: "View details",
    },
    skinSections: publicSections,
    scan: {
      source: params.source,
      scanAttemptId: params.scanAttemptId || params.ocr.scanAttemptId || null,
      ocrSource: params.ocr.ocrSource || null,
      calendarAvailable: Boolean(startISO),
      eventCount,
    },
  };

  sanitizeConciergePublicEventData(data);
  return { title: cleanString(data.title) || title, data, ownership };
}
