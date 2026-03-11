import OpenAI from "openai";
import sharp from "sharp";
import { inflateRawSync, inflateSync } from "zlib";
import { execFile } from "child_process";
import { promisify } from "util";
import { mkdtemp, rm, writeFile } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { getVisionClient } from "@/lib/gcp";
import { normalizeAccessControlPayload } from "@/lib/event-access";
import {
  normalizeVenueFactForCompare,
  sanitizeVenueFactLines,
} from "@/lib/venue-facts";
import {
  DEFAULT_GYM_MEET_TEMPLATE_ID,
  resolveGymMeetTemplateId,
} from "@/components/gym-meet-templates/registry";

export type DiscoverySourceInput =
  | {
      type: "file";
      fileName: string;
      mimeType: string;
      sizeBytes: number;
      dataUrl: string;
    }
  | {
      type: "url";
      url: string;
    };

export type ParseResult = {
  eventType: "gymnastics_meet" | "unknown";
  documentProfile:
    | "athlete_session"
    | "parent_packet"
    | "registration_packet"
    | "meet_overview"
    | "unknown";
  title: string;
  dates: string;
  startAt: string | null;
  endAt: string | null;
  timezone: string | null;
  venue: string | null;
  address: string | null;
  hostGym: string | null;
  admission: Array<{ label: string; price: string; note: string | null }>;
  athlete: {
    name: string | null;
    level: string | null;
    team: string | null;
    session: string | null;
    competitionDate: string | null;
    stretchTime: string | null;
    marchIn: string | null;
    assignedGym: string | null;
    awards: string | null;
  };
  meetDetails: {
    warmup: string | null;
    marchIn: string | null;
    rotationOrder: string | null;
    judgingNotes: string | null;
    doorsOpen: string | null;
    arrivalGuidance: string | null;
    registrationInfo: string | null;
    facilityLayout: string | null;
    scoringInfo: string | null;
    resultsInfo: string | null;
    rotationSheetsInfo: string | null;
    awardsInfo: string | null;
    sessionWindows: Array<{
      date: string | null;
      start: string | null;
      end: string | null;
      note: string | null;
    }>;
    operationalNotes: string[];
  };
  logistics: {
    parking: string | null;
    trafficAlerts: string | null;
    hotel: string | null;
    meals: string | null;
    fees: string | null;
    waivers: string | null;
    rideShare: string | null;
    accessibility: string | null;
    parkingLinks: Array<{ label: string; url: string }>;
    parkingPricingLinks: Array<{ label: string; url: string }>;
  };
  policies: {
    food: string | null;
    hydration: string | null;
    safety: string | null;
    animals: string | null;
    misc: string[];
  };
  coachInfo: {
    signIn: string | null;
    attire: string | null;
    hospitality: string | null;
    floorAccess: string | null;
    scratches: string | null;
    floorMusic: string | null;
    rotationSheets: string | null;
    awards: string | null;
    regionalCommitment: string | null;
    qualification: string | null;
    meetFormat: string | null;
    equipment: string | null;
    refundPolicy: string | null;
    paymentInstructions: string | null;
    entryFees: Array<{ label: string; amount: string; note: string | null }>;
    teamFees: Array<{ label: string; amount: string; note: string | null }>;
    lateFees: Array<{
      label: string;
      amount: string;
      trigger: string | null;
      note: string | null;
    }>;
    contacts: Array<{
      role: string;
      name: string | null;
      email: string | null;
      phone: string | null;
    }>;
    deadlines: Array<{
      label: string;
      date: string | null;
      note: string | null;
    }>;
    links: Array<{ label: string; url: string }>;
    notes: string[];
  };
  contacts: Array<{
    role: string;
    name: string | null;
    email: string | null;
    phone: string | null;
  }>;
  deadlines: Array<{
    label: string;
    date: string | null;
    note: string | null;
  }>;
  gear: {
    uniform: string | null;
    checklist: string[];
  };
  volunteers: {
    signupLink: string | null;
    notes: string | null;
  };
  communications: {
    announcements: Array<{ title: string; body: string }>;
    passcode: string | null;
  };
  links: Array<{ label: string; url: string }>;
  unmappedFacts: Array<{
    category: string;
    detail: string;
    confidence: "high" | "medium" | "low";
  }>;
};

type TextQuality = "good" | "suspect" | "poor";
type TextQualitySignals = {
  controlRatio: number;
  englishLikeRatio: number;
  longTokenRatio: number;
  nonTextRatio: number;
  readableLines: number;
  tokenCount: number;
  nonAsciiRatio: number;
  looksLikePdfInternals: boolean;
};

type GymLayoutZone = {
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  confidence: number;
};

type GymLayoutSelectionCandidate = {
  page: number;
  preScore: number;
  finalScore: number;
  textScore: number;
  visualScore: number;
  gymLabelCount: number;
  hallLabelCount: number;
  mapHeading: boolean;
  paragraphPenalty: boolean;
  aiIsLayout: boolean | null;
  aiConfidence: number | null;
  accepted: boolean;
};

type GymLayoutSelectionDiagnostics = {
  selectedPage: number | null;
  reason: string;
  confidence: number | null;
  candidates: GymLayoutSelectionCandidate[];
};

type CoachPageHint = {
  page: number;
  heading: string | null;
  excerpt: string;
};

type DiscoveryLinkKind = "asset" | "html" | "external";

type DiscoveredLink = {
  url: string;
  label: string;
  sourceUrl: string;
  depth: 0 | 1;
  kind: DiscoveryLinkKind;
  sameHost: boolean;
  followed: boolean;
  contentType?: string | null;
};

type CrawledPage = {
  url: string;
  title: string | null;
  depth: 0 | 1;
};

type ExtractionResult = {
  extractedText: string;
  extractionMeta: {
    sourceType: "file" | "url";
    usedOcr: boolean;
    linkedAssets: Array<{ url: string; contentType: string }>;
    discoveredLinks?: DiscoveredLink[];
    crawledPages?: CrawledPage[];
    pageTitle?: string | null;
    gymLayoutImageDataUrl?: string | null;
    gymLayoutFacts?: string[];
    gymLayoutZones?: GymLayoutZone[];
    gymLayoutPage?: number | null;
    gymLayoutSelection?: GymLayoutSelectionDiagnostics;
    coachPageHints?: CoachPageHint[];
    textQuality?: TextQuality | null;
    qualitySignals?: TextQualitySignals | null;
  };
};

export type DiscoveryEvidence = {
  source: {
    sourceType: "file" | "url";
    usedOcr: boolean;
    pageTitle: string | null;
    linkedAssetCount: number;
    extractedChars: number;
    textQuality: TextQuality | null;
    qualitySignals: TextQualitySignals | null;
  };
  candidates: {
    titleHints: string[];
    dateHints: string[];
    timeHints: string[];
    timezoneHints: string[];
    venueHints: string[];
    addressHints: string[];
    hostGymHints: string[];
    admissionHints: string[];
    athleteHints: string[];
    sessionHints: string[];
    logisticsHints: string[];
    policyHints: string[];
    coachHints: string[];
    linkHints: Array<{ label: string; url: string }>;
  };
  sections: {
    spectator: string[];
    venue: string[];
    traffic: string[];
    policy: string[];
    coachOps: string[];
    registration: string[];
  };
  dateAnalysis: {
    primaryCandidate: {
      label: string;
      startDate: string | null;
      endDate: string | null;
      line: string;
      score: number;
    } | null;
    ignoredCandidates: Array<{
      label: string;
      line: string;
      score: number;
      reason: string;
    }>;
  };
  snippets: {
    firstLines: string[];
    additionalInfoLines: string[];
    trafficLines: string[];
    hallLayoutLines: string[];
    coachLines: string[];
  };
};

type CrawlCandidate = DiscoveredLink & {
  score: number;
};

type UrlDiscoveryTestHooks = {
  fetchWithLimit?: (
    url: string
  ) => Promise<{ contentType: string; buffer: Buffer; text: string }>;
  extractTextFromPdf?: (buffer: Buffer) => Promise<{
    text: string;
    usedOcr: boolean;
    coachPageHints: CoachPageHint[];
    textQuality: TextQuality;
    qualitySignals: TextQualitySignals;
  }>;
  extractTextFromImage?: (buffer: Buffer) => Promise<string>;
  extractGymLayoutImageFromPdf?: (buffer: Buffer) => Promise<GymLayoutExtraction>;
  openAiExtractGymLayoutZones?: (
    buffer: Buffer,
    mimeType?: string
  ) => Promise<GymLayoutZone[]>;
  toOptimizedImageDataUrl?: (buffer: Buffer) => Promise<string | null>;
};

const MAX_FETCHED_LINKED_ASSETS = 8;
const MAX_FOLLOWED_CHILD_PAGES = 3;
const MAX_DISCOVERED_LINKS = 24;
const MAX_FETCH_BYTES = 7 * 1024 * 1024;
const LOW_TEXT_THRESHOLD = 200;
const execFileAsync = promisify(execFile);
let pdfRenderDepsPromise: Promise<
  | {
      pdfjs: any;
      createCanvas: (width: number, height: number) => any;
    }
  | null
> | null = null;
let urlDiscoveryTestHooks: UrlDiscoveryTestHooks | null = null;

type DateRangeInfo = {
  label: string | null;
  startDate: string | null;
  endDate: string | null; // Inclusive end date.
};

type GymLayoutExtraction = {
  dataUrl: string | null;
  facts: string[];
  zones: GymLayoutZone[];
  page: number | null;
  selection?: GymLayoutSelectionDiagnostics;
};

type PdfTextExtraction = {
  text: string;
  pages: Array<{ num: number; text: string }>;
};

function safeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function toIsoOrNull(value: unknown): string | null {
  const asText = safeString(value);
  if (!asText) return null;
  const d = new Date(asText);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function pickArray(value: unknown): any[] {
  return Array.isArray(value) ? value : [];
}

function normalizeUrl(value: unknown): string {
  const raw = safeString(value).replace(/[)\],.;!?]+$/, "");
  if (!raw) return "";
  const withProtocol = /^www\./i.test(raw) ? `https://${raw}` : raw;
  if (!/^https?:\/\//i.test(withProtocol)) return "";
  try {
    const parsed = new URL(withProtocol);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return "";
    return parsed.toString();
  } catch {
    return "";
  }
}

function uniqueBy<T>(items: T[], getKey: (item: T) => string): T[] {
  const out: T[] = [];
  const seen = new Set<string>();
  for (const item of items) {
    const key = safeString(getKey(item)).toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

const USABLE_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;
const PUBLIC_MEET_CONTACT_ROLE_PATTERN =
  /\b(meet director|director of operations|assistant event coordinator|event coordinator|floor manager|meet contact|event contact)\b/i;
const VENUE_CONTACT_ROLE_PATTERN =
  /\b(venue contact|facility contact|gym contact|gymnasium contact)\b|\b(venue|facility|gym(?:nasium)?)\b/i;
const COACH_CONTACT_ROLE_PATTERN =
  /\b(coach|registration|meet reservations?|meetmaker|entry|regional|club admin|team admin|pro member)\b/i;
const SUPPRESSED_UNMAPPED_FACT_CATEGORIES = new Set([
  "marketing",
  "club_participation",
  "document_version",
]);
const MARKETING_TEXT_PATTERN =
  /(visit lauderdale|hairstyle ?to ?impress|hairstyling appointment|sponsor(?:ing)? this event|many thanks to our sponsors|book your hairstyling appointment)/i;
const SCHEDULE_GRID_TEXT_PATTERN =
  /(session\s+(?:fr|sa|su)\d+\b|stretch\/warmup:|levels?\s+\d|clubs in pink|individual & team awards|your designated number of athlete spots per session|questions\?\s*email us asap)/i;
const CLUB_PARTICIPATION_TEXT_PATTERN =
  /\b(360 gymnastics fl|alpha gymnastics|christi'?s gymnastics|browns? gym(?:nastics)?|team twisters|twisters canada|top gymnastics fl|whitby-galaxy|gymnastics usa|gymnastics du sol|miracle gymnastics|southern starz|fgtc|ega|zga|world class miami|intensity gymnastics|harbor city|sunny gymnastics)\b/i;
const TRUE_GEAR_TEXT_PATTERN =
  /\b(leotard|uniform|warm-?ups?|warmup jacket|grips|beam shoes|shoes|scrunchie|hair|bun|bobby pins?|bag|equipment bag|water bottle|wristbands?|athletic tape|music file)\b/i;
const GEAR_EXCLUDED_TEXT_PATTERN =
  /(admission|ticket|pre[-\s]?sale|cash|credit\/debit|credit card|debit card|registration|check[- ]?in|results?|live scoring|website|visit us on the web|rotation sheets?|awards ceremonies?|temperature inside the venue|beyond our control|come prepared|athlete cards? will be distributed|record scores)/i;
const VENUE_DETAIL_TEXT_PATTERN =
  /(meet site:|coral springs gymnasium|temperature inside the venue|beyond our control|please come prepared|parking is complimentary|\bph:\b|\bphone numbers?\b|venue is chilly|inside the venue is chilly)/i;
const MEET_DETAIL_REROUTE_TEXT_PATTERN =
  /(athlete cards? will be distributed|athlete cards?\b.*record(?:ing)? scores?|record scores on (?:their|the) cards?|memento of their meet|coaches choose competitive order|submit cards to judges)/i;

function isUsableEmail(value: unknown): boolean {
  return USABLE_EMAIL_PATTERN.test(safeString(value));
}

function isUsablePhone(value: unknown): boolean {
  return safeString(value).replace(/\D/g, "").length >= 7;
}

function sanitizeDiscoveryContact(item: any, fallbackRole = "Contact") {
  const role = safeString(item?.role || fallbackRole) || fallbackRole;
  const name = safeString(item?.name);
  const email = isUsableEmail(item?.email) ? safeString(item?.email) : "";
  const phone = isUsablePhone(item?.phone) ? safeString(item?.phone) : "";
  if (!name && !email && !phone) return null;
  return {
    role,
    name: name || null,
    email: email || null,
    phone: phone || null,
  };
}

function classifyDiscoveryContact(item: any): "public" | "venue" | "coach" | "other" {
  const haystack = `${safeString(item?.role)} ${safeString(item?.name)}`;
  if (VENUE_CONTACT_ROLE_PATTERN.test(haystack)) return "venue";
  if (PUBLIC_MEET_CONTACT_ROLE_PATTERN.test(haystack)) return "public";
  if (COACH_CONTACT_ROLE_PATTERN.test(haystack)) return "coach";
  return "other";
}

function shouldSuppressUnmappedFact(item: any): boolean {
  const category = safeString(item?.category).toLowerCase();
  const detail = safeString(item?.detail);
  if (!detail) return true;
  if (SUPPRESSED_UNMAPPED_FACT_CATEGORIES.has(category)) return true;
  return false;
}

function isAdmissionAnnouncementText(value: string): boolean {
  return /(spectator|admission|ticket|pre[-\s]?sale|credit\/debit|credit card|debit card|cashless|cash is not accepted|cash not accepted|no cash)/i.test(
    safeString(value)
  );
}

function isStructuredAnnouncementText(value: string): boolean {
  return /(doors open|arrival guidance|registration\b|results|live scoring|rotation sheets?|awards|venue contact|facility contact|meet director|director of operations|event coordinator|floor manager)/i.test(
    safeString(value)
  );
}

function shouldPersistParsedAnnouncement(item: any): boolean {
  const title = safeString(item?.title || item?.label);
  const body = safeString(item?.body || item?.text || item?.message);
  const combined = `${title} ${body}`;
  if (!body) return false;
  if (isAdmissionAnnouncementText(combined) || isStructuredAnnouncementText(combined)) return false;
  if (
    /(marketing|sponsor|visit lauderdale|hairstyle to impress|final posting|club[_\s-]?participation|venue[_\s-]?contact|document[_\s-]?version)/i.test(
      combined
    )
  ) {
    return false;
  }
  return body.split(/\s+/).filter(Boolean).length >= 4;
}

function isMarketingLikeText(value: unknown): boolean {
  return MARKETING_TEXT_PATTERN.test(safeString(value));
}

function isScheduleGridLikeText(value: unknown): boolean {
  return SCHEDULE_GRID_TEXT_PATTERN.test(safeString(value));
}

function isClubParticipationLikeText(value: unknown): boolean {
  const text = safeString(value);
  if (!text) return false;
  if (CLUB_PARTICIPATION_TEXT_PATTERN.test(text)) return true;
  return (text.match(/\b(?:gymnastics|gym|academy|twisters|ymca|starz|miami|wellington|boca|canada)\b/gi) || [])
    .length >= 3;
}

function isTrueGearLikeText(value: unknown): boolean {
  const text = safeString(value);
  if (!text) return false;
  if (GEAR_EXCLUDED_TEXT_PATTERN.test(text)) return false;
  return TRUE_GEAR_TEXT_PATTERN.test(text);
}

function appendUnmappedFact(
  items: Array<{ category: string; detail: string; confidence: "high" | "medium" | "low" }>,
  category: string,
  detail: string,
  confidence: "high" | "medium" | "low" = "high"
) {
  const cleanDetail = safeString(detail);
  if (!cleanDetail) return items;
  const key = `${safeString(category)}|${cleanDetail}`.toLowerCase().replace(/\s+/g, " ").trim();
  if (!key) return items;
  if (
    items.some(
      (item) =>
        `${safeString(item?.category)}|${safeString(item?.detail)}`
          .toLowerCase()
          .replace(/\s+/g, " ")
          .trim() === key
    )
  ) {
    return items;
  }
  items.push({ category, detail: cleanDetail, confidence });
  return items;
}

function uniqueLines(lines: string[], limit = 12): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const line of lines.map((item) => safeString(item)).filter(Boolean)) {
    const key = line.toLowerCase().replace(/\s+/g, " ").trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(line);
    if (out.length >= limit) break;
  }
  return out;
}

function isLikelySectionHeading(line: string): boolean {
  const text = safeString(line);
  if (!text) return false;
  if (text.length > 72) return false;
  if (/^[A-Z0-9][A-Z0-9/&(),.' -]{2,}$/.test(text)) return true;
  return /^(entry fees|how to enter|awards|coaches information|parking|doors open|additional info|spectator admission|traffic|payment|refund|qualification|regional meet coaches information)\b/i.test(
    text
  );
}

function normalizeDiscoveryDateArtifacts(value: string): string {
  return safeString(value)
    .replace(/\u2013|\u2014/g, "-")
    .replace(
      /\b(january|jan|february|feb|march|mar|april|apr|may|june|jun|july|jul|august|aug|september|sep|sept|october|oct|november|nov|december|dec)\s+(\d{1,2})\s*-\s*(\d{1,2})(\s*,\s*\d{4})/gi,
      "$1 $2-$3$4"
    )
    .replace(
      /\b(january|jan|february|feb|march|mar|april|apr|may|june|jun|july|jul|august|aug|september|sep|sept|october|oct|november|nov|december|dec)\s+(\d{1,2})\s*-\s*(\d{1,2})\b/gi,
      "$1 $2-$3"
    )
    .replace(/\$\s+(\d)/g, "$$$1")
    .replace(/(\d)\s*-\s+(\d{1,2},\s*\d{4})/g, "$1-$2")
    .replace(/([A-Za-z])\s*-\s*\n\s*([A-Za-z])/g, "$1$2")
    .replace(/\b([A-Za-z]{3,})\s*\n\s*(\d{1,2}\b)/g, "$1 $2")
    .replace(/\b(\d{1,2})\s*\n\s*-\s*\n\s*(\d{1,2}\b)/g, "$1-$2")
    .replace(/\b(\d{1,2})\s*-\s*\n\s*(\d{1,2}\b)/g, "$1-$2")
    .replace(/[ \t]{2,}/g, " ");
}

function stitchDiscoveryLines(lines: string[]): string[] {
  const out: string[] = [];
  for (const rawLine of lines) {
    const line = normalizeDiscoveryDateArtifacts(rawLine);
    if (!line) continue;
    if (!out.length) {
      out.push(line);
      continue;
    }
    const prev = out[out.length - 1];
    const prevText = safeString(prev);
    const nextText = safeString(line);
    const prevIsHeading = isLikelySectionHeading(prevText);
    const nextIsHeading = isLikelySectionHeading(nextText);
    const prevEndsSentence = /[.!?:]$/.test(prevText);
    const startsContinuation =
      /^[a-z(]/.test(nextText) ||
      /^[\d$]/.test(nextText) ||
      /^(and|or|but|with|for|to|from|by|at|in|on|of|if|when|then)\b/i.test(nextText);
    const joinsBrokenWord = /[A-Za-z]-$/.test(prevText) && /^[A-Za-z]/.test(nextText);
    const joinsCurrency = /(?:\$|usd)\s*$/i.test(prevText) && /^[\d.]/.test(nextText);
    const joinsDateRange =
      /\b(january|jan|february|feb|march|mar|april|apr|may|june|jun|july|jul|august|aug|september|sep|sept|october|oct|november|nov|december|dec)\s+\d{1,2}\s*-\s*$/i.test(
        prevText
      ) && /^\d{1,2}(?:,\s*\d{4})?\b/.test(nextText);

    if (!prevIsHeading && !nextIsHeading && (joinsBrokenWord || joinsCurrency || joinsDateRange)) {
      out[out.length - 1] = `${prevText.replace(/-\s*$/, "")}${nextText}`.replace(/\s+/g, " ").trim();
      continue;
    }
    if (!prevIsHeading && !nextIsHeading && !prevEndsSentence && startsContinuation) {
      out[out.length - 1] = `${prevText} ${nextText}`.replace(/\s+/g, " ").trim();
      continue;
    }
    out.push(nextText);
  }
  return out;
}

function isCoachHeadingLine(line: string): boolean {
  return /^(attention coaches!?|coaches information(?:[—-].*)?|regional meet coaches information|coaches attire|coaches sign in|attending coaches.*|coach(?:es)?\b.*important|entry fees|how to enter|payment|refund policy|qualification|coaches? meeting|scratches?|rotation sheets?)/i.test(
    safeString(line)
  );
}

function looksLikeCoachLine(line: string): boolean {
  return /(coach(?:es)?|entry fees?|team fees?|team entry|athlete fees?|late fees?|payment|refund|qualification|hospitality|sign[- ]?in|scratches|rotation sheets?|regional commitment|floor manager|meet director|director of operations|assistant event coordinator|dress code|attire|floor music|meet maker|reservation)/i.test(
    safeString(line)
  );
}

function sanitizeCoachExcerpt(lines: string[]): string {
  return safeString(lines.join(" ").replace(/\s+/g, " ")).slice(0, 320);
}

type ScoredDateCandidate = {
  label: string;
  line: string;
  startDate: string | null;
  endDate: string | null;
  score: number;
  reason: string;
};

function parseDateRangeCandidate(value: string): DateRangeInfo {
  return deriveDateRangeFromText(normalizeDiscoveryDateArtifacts(value));
}

function scoreMeetDateLine(line: string, index: number): ScoredDateCandidate | null {
  const text = normalizeDiscoveryDateArtifacts(line);
  if (!text) return null;
  const parsed = parseDateRangeCandidate(text);
  if (!parsed.startDate) return null;

  let score = parsed.endDate && parsed.endDate !== parsed.startDate ? 7 : 4;
  const lowered = text.toLowerCase();
  const reasons: string[] = [];

  if (/^(when|meet dates?|competition dates?|event dates?)\b/i.test(text)) {
    score += 7;
    reasons.push("labelled-date");
  }
  if (index < 12) {
    score += 4;
    reasons.push("title-area");
  } else if (index < 24) {
    score += 2;
    reasons.push("early-document");
  }
  if (
    /\b(updated|posted|deadline|late fee|refund|entry fee|entry deadline|how to enter|must enter|by noon|page\s+\d+\s+of\s+\d+)\b/i.test(
      lowered
    )
  ) {
    score -= 10;
    reasons.push("admin-date");
  }
  if (/\b(noon|11:59|11:00|12:00)\b/i.test(lowered)) {
    score -= 3;
    reasons.push("deadline-time");
  }
  if (/\b(entry|refund|late fee|qualification|payment|regional commitment)\b/i.test(lowered)) {
    score -= 4;
    reasons.push("coach-admin-context");
  }

  return {
    label: parsed.label || text,
    line: text,
    startDate: parsed.startDate,
    endDate: parsed.endDate,
    score,
    reason: reasons.join(","),
  };
}

function classifyMeetDateCandidates(text: string): {
  primary: ScoredDateCandidate | null;
  ignored: ScoredDateCandidate[];
} {
  const baseLines = stitchDiscoveryLines(
    cleanExtractedText(text)
      .split(/\n+/)
      .map((line) => safeString(line))
      .filter(Boolean)
  );
  const lines = baseLines.flatMap((line) =>
    line
      .split(/(?=\b(?:when|meet dates?|competition dates?|event dates?)\b[:]?)/i)
      .map((item) => safeString(item))
      .filter(Boolean)
  );
  const candidates = lines
    .map((line, index) => scoreMeetDateLine(line, index))
    .filter((item): item is ScoredDateCandidate => Boolean(item));
  const ranked = [...candidates].sort((a, b) => {
    const scoreDelta = b.score - a.score;
    if (scoreDelta !== 0) return scoreDelta;
    const aSpan = a.startDate && a.endDate && a.startDate !== a.endDate ? 1 : 0;
    const bSpan = b.startDate && b.endDate && b.startDate !== b.endDate ? 1 : 0;
    return bSpan - aSpan;
  });
  const primary = ranked.find((item) => item.score > 0) || null;
  return {
    primary,
    ignored: ranked.filter((item) => !primary || item.line !== primary.line).slice(0, 8),
  };
}

function isSpectatorAdmissionLabel(value: string): boolean {
  const text = safeString(value);
  return /(spectator|admission|ticket|adult|child|children|seniors?|military|cash|door|weekend pass|per day|parking)/i.test(
    text
  );
}

function inferCoachFeeBucket(item: {
  label: string;
  amount?: string;
  price?: string;
  note: string | null;
}):
  | "entry"
  | "team"
  | "late"
  | null {
  const haystack = `${safeString(item.label)} ${safeString(item.note)} ${safeString(
    item.amount || item.price
  )}`.toLowerCase();
  if (/(late fee|late entry|after .*deadline)/i.test(haystack)) return "late";
  if (/\b(team fee|team entry|team)\b/i.test(haystack)) return "team";
  if (/\b(entry fee|athlete fee|registration fee|per gymnast|entry)\b/i.test(haystack)) return "entry";
  return null;
}

function hasCoachInfoContent(value: any): boolean {
  const coachInfo = value || {};
  return Boolean(
    safeString(coachInfo.signIn) ||
      safeString(coachInfo.attire) ||
      safeString(coachInfo.hospitality) ||
      safeString(coachInfo.floorAccess) ||
      safeString(coachInfo.scratches) ||
      safeString(coachInfo.floorMusic) ||
      safeString(coachInfo.rotationSheets) ||
      safeString(coachInfo.awards) ||
      safeString(coachInfo.regionalCommitment) ||
      safeString(coachInfo.qualification) ||
      safeString(coachInfo.meetFormat) ||
      safeString(coachInfo.equipment) ||
      safeString(coachInfo.refundPolicy) ||
      safeString(coachInfo.paymentInstructions) ||
      pickArray(coachInfo.entryFees).length ||
      pickArray(coachInfo.teamFees).length ||
      pickArray(coachInfo.lateFees).length ||
      pickArray(coachInfo.deadlines).length ||
      pickArray(coachInfo.contacts).length ||
      pickArray(coachInfo.links).length ||
      pickArray(coachInfo.notes).length
  );
}

function extractCoachPageHintsFromPages(
  pages: Array<{ num: number; text: string }>
): CoachPageHint[] {
  const hints: CoachPageHint[] = [];
  for (const page of pages) {
    const pageText = cleanExtractedText(safeString(page?.text));
    if (!pageText) continue;
    const lines = stitchDiscoveryLines(
      pageText
        .split(/\n+/)
        .map((line) => safeString(line))
        .filter(Boolean)
    );
    const heading =
      lines.find((line) => isCoachHeadingLine(line)) ||
      lines.find((line) =>
        /(coach(?:es)?|entry fees?|how to enter|payment|refund|qualification|regional commitment)/i.test(
          line
        )
      ) ||
      null;
    const coachLines = lines.filter((line) => looksLikeCoachLine(line));
    const strongSignalCount = [
      /coach(?:es)?/gi,
      /\bentry fees?\b/gi,
      /\bteam fees?\b/gi,
      /\blate fees?\b/gi,
      /\bpayment\b/gi,
      /\brefund\b/gi,
      /\bqualification\b/gi,
      /\bhospitality\b/gi,
      /\bsign[- ]?in\b/gi,
      /\bscratches?\b/gi,
      /\brotation sheets?\b/gi,
      /\bregional\b/gi,
    ].reduce((count, pattern) => count + countPatternMatches(pageText, pattern), 0);
    if (!heading && strongSignalCount < 3) continue;
    const excerpt = sanitizeCoachExcerpt(
      coachLines.length > 0 ? coachLines.slice(0, 6) : lines.slice(0, 6)
    );
    if (!excerpt) continue;
    hints.push({
      page: Number.isFinite(page?.num) ? Number(page.num) : hints.length + 1,
      heading,
      excerpt,
    });
  }
  return uniqueBy(hints, (item) => `${item.page}|${item.heading}|${item.excerpt}`).slice(0, 6);
}

function toIsoDate(year: number, monthIndex: number, day: number): string | null {
  if (!Number.isFinite(year) || !Number.isFinite(monthIndex) || !Number.isFinite(day)) return null;
  const y = Math.trunc(year);
  const m = Math.trunc(monthIndex);
  const d = Math.trunc(day);
  if (y < 1900 || y > 2200) return null;
  if (m < 0 || m > 11) return null;
  if (d < 1 || d > 31) return null;
  const dt = new Date(Date.UTC(y, m, d));
  if (Number.isNaN(dt.getTime())) return null;
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m || dt.getUTCDate() !== d) return null;
  return dt.toISOString().slice(0, 10);
}

function normalizeParsedYear(value: number): number {
  if (!Number.isFinite(value)) return value;
  if (value >= 100) return value;
  return value >= 70 ? 1900 + value : 2000 + value;
}

function monthNameToIndex(value: string): number {
  const normalized = safeString(value).toLowerCase();
  const map: Record<string, number> = {
    january: 0,
    jan: 0,
    february: 1,
    feb: 1,
    march: 2,
    mar: 2,
    april: 3,
    apr: 3,
    may: 4,
    june: 5,
    jun: 5,
    july: 6,
    jul: 6,
    august: 7,
    aug: 7,
    september: 8,
    sep: 8,
    sept: 8,
    october: 9,
    oct: 9,
    november: 10,
    nov: 10,
    december: 11,
    dec: 11,
  };
  return typeof map[normalized] === "number" ? map[normalized] : -1;
}

function deriveDateRangeFromText(value: string): DateRangeInfo {
  const text = safeString(value);
  if (!text) return { label: null, startDate: null, endDate: null };

  const monthRange =
    text.match(
      /\b(january|jan|february|feb|march|mar|april|apr|may|june|jun|july|jul|august|aug|september|sep|sept|october|oct|november|nov|december|dec)\s+(\d{1,2})\s*[–-]\s*(\d{1,2}),?\s*(\d{4})\b/i
    ) || null;
  if (monthRange) {
    const monthIdx = monthNameToIndex(monthRange[1]);
    const dayStart = Number.parseInt(monthRange[2], 10);
    const dayEnd = Number.parseInt(monthRange[3], 10);
    const year = Number.parseInt(monthRange[4], 10);
    const startDate = toIsoDate(year, monthIdx, dayStart);
    const endDate = toIsoDate(year, monthIdx, dayEnd);
    return {
      label: text,
      startDate,
      endDate,
    };
  }

  const monthSingle =
    text.match(
      /\b(january|jan|february|feb|march|mar|april|apr|may|june|jun|july|jul|august|aug|september|sep|sept|october|oct|november|nov|december|dec)\s+(\d{1,2}),?\s*(\d{4})\b/i
    ) || null;
  if (monthSingle) {
    const monthIdx = monthNameToIndex(monthSingle[1]);
    const day = Number.parseInt(monthSingle[2], 10);
    const year = Number.parseInt(monthSingle[3], 10);
    const date = toIsoDate(year, monthIdx, day);
    return {
      label: text,
      startDate: date,
      endDate: date,
    };
  }

  const slashRange =
    text.match(
      /\b(\d{1,2})\/(\d{1,2})\/(\d{2,4})\s*[–-]\s*(\d{1,2})\/(\d{1,2})\/(\d{2,4})\b/
    ) || null;
  if (slashRange) {
    const m1 = Number.parseInt(slashRange[1], 10) - 1;
    const d1 = Number.parseInt(slashRange[2], 10);
    const y1 = normalizeParsedYear(Number.parseInt(slashRange[3], 10));
    const m2 = Number.parseInt(slashRange[4], 10) - 1;
    const d2 = Number.parseInt(slashRange[5], 10);
    const y2 = normalizeParsedYear(Number.parseInt(slashRange[6], 10));
    return {
      label: text,
      startDate: toIsoDate(y1, m1, d1),
      endDate: toIsoDate(y2, m2, d2),
    };
  }

  const slashSingle = text.match(/\b(\d{1,2})\/(\d{1,2})\/(\d{2,4})\b/) || null;
  if (slashSingle) {
    const m = Number.parseInt(slashSingle[1], 10) - 1;
    const d = Number.parseInt(slashSingle[2], 10);
    const y = normalizeParsedYear(Number.parseInt(slashSingle[3], 10));
    const date = toIsoDate(y, m, d);
    return {
      label: text,
      startDate: date,
      endDate: date,
    };
  }

  return { label: text || null, startDate: null, endDate: null };
}

function extractHallFactsFromText(text: string): string[] {
  const normalizedLines = safeString(text)
    .split(/\n+/)
    .map((line) => line.replace(/^[\-\u2022]\s*/, "").trim())
    .filter(Boolean);
  return sanitizeVenueFactLines(normalizedLines, {
    mode: "strict",
    maxLines: 14,
    requireAnchor: true,
    excludePatterns: [
      /traffic|disney on ice|benchmark(?:\s+international)?\s+arena/i,
      /official results|live scoring|daylight savings/i,
    ],
  });
}

export function buildDiscoveryEvidence(
  extractedText: string,
  extractionMeta: ExtractionResult["extractionMeta"]
): DiscoveryEvidence {
  const text = cleanExtractedText(extractedText);
  const lines = stitchDiscoveryLines(
    text
      .split(/\n+/)
      .map((line) => line.replace(/^[\-\u2022]\s*/, "").trim())
      .filter(Boolean)
  );
  const firstLines = uniqueLines(lines.slice(0, 24), 12);
  const additionalInfoStartIdx = lines.findIndex((line) => /additional\s*info/i.test(line));
  const additionalInfoLines =
    additionalInfoStartIdx >= 0
      ? uniqueLines(lines.slice(additionalInfoStartIdx + 1, additionalInfoStartIdx + 26), 12)
      : [];

  const matchLines = (pattern: RegExp, limit = 12) =>
    uniqueLines(lines.filter((line) => pattern.test(line)), limit);
  const sectionMatchLines = (patterns: RegExp[], limit = 12) =>
    uniqueLines(
      lines.filter((line) => patterns.some((pattern) => pattern.test(line))),
      limit
    );
  const dateAnalysis = classifyMeetDateCandidates(text);

  const dateHints = uniqueLines(
    [
      ...(dateAnalysis.primary ? [dateAnalysis.primary.label] : []),
      ...(text.match(
        /\b(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}(?:\s*[–-]\s*\d{1,2})?(?:,\s*\d{4})?/gi
      ) || []),
      ...(text.match(/\b\d{1,2}\/\d{1,2}(?:\/\d{2,4})?\b/g) || []),
    ],
    10
  );
  const timeHints = uniqueLines(
    text.match(/\b\d{1,2}(?::\d{2})?\s*[AP]M(?:\s*-\s*\d{1,2}(?::\d{2})?\s*[AP]M)?\b/gi) || [],
    14
  );
  const timezoneHints = uniqueLines(
    text.match(
      /\b(?:America\/[A-Za-z_]+|EST|EDT|CST|CDT|MST|MDT|PST|PDT|Eastern|Central|Mountain|Pacific)\b/gi
    ) || [],
    8
  );
  const addressHints = matchLines(
    /\b\d{2,6}\s+[A-Za-z0-9.\-'\s]+,\s*[A-Za-z.\-'\s]+,\s*[A-Z]{2}\s+\d{5}(?:-\d{4})?\b/,
    8
  );
  const venueHints = matchLines(
    /(convention center|arena|center|hall|gymnasium|gym|sports complex|fieldhouse|venue)/i,
    12
  );
  const hostGymHints = matchLines(/(host(ed)? by|gymnastics|gym club|academy|host gym|host)/i, 12);
  const admissionHints = matchLines(/(admission|ticket|adult|children|cash|weekend pass|door)/i, 12);
  const athleteHints = matchLines(/(athlete|gymnast|level|team|march in|stretch|assigned gym|awards)/i, 14);
  const sessionHints = matchLines(/(session|stretch|march in|warm ?up|rotation|awards)/i, 14);
  const logisticsHints = matchLines(
    /(parking|traffic|hotel|meal|food|waiver|rideshare|uber|lyft|map|directions|drop[- ]?off)/i,
    14
  );
  const policyHints = matchLines(
    /(hydration|service animal|service dog|safety|food|beverage|outside food|throwing object|flash)/i,
    12
  );
  const coachHints = uniqueLines(
    [
      ...matchLines(
        /(coach(?:es)?|entry fees?|team fees?|late fees?|payment|refund|qualification|hospitality|sign[- ]?in|scratches|rotation sheets?|regional commitment|meet director|floor manager|attire|dress code)/i,
        16
      ),
      ...pickArray(extractionMeta.coachPageHints)
        .flatMap((item) => [safeString(item?.heading), safeString(item?.excerpt)])
        .filter(Boolean),
    ],
    16
  );
  const trafficLines = matchLines(/(traffic|disney on ice|benchmark|parking rate|30-45)/i, 8);
  const hallLayoutLines = matchLines(
    /(east hall|west hall|central hall|registration|guest services|competition area|coffee bar|awards)/i,
    10
  );
  const coachLines = matchLines(
    /(coach(?:es)?|entry fees?|team fees?|late fees?|payment|refund|qualification|hospitality|sign[- ]?in|scratches|rotation sheets?|regional commitment|meet director|floor manager|attire|dress code)/i,
    10
  );
  const spectatorSection = sectionMatchLines(
    [/(spectator admission|admission|ticket|door fees?|weekend passes?|adult|child|cash only)/i],
    12
  );
  const venueSection = sectionMatchLines(
    [
      /(east hall|west hall|central hall|guest services|registration|competition area|venue|facility layout|awards area|entrance)/i,
    ],
    12
  );
  const trafficSection = sectionMatchLines(
    [/(parking|traffic|ride ?share|uber|lyft|drop-?off|garage|parkmobile|complimentary parking)/i],
    12
  );
  const policySection = sectionMatchLines(
    [/(food|water|hydration|service animals?|service dogs?|safety|outside food|throwing objects?)/i],
    12
  );
  const coachOpsSection = sectionMatchLines(
    [
      /(coach(?:es)?|sign[- ]?in|floor access|attire|hospitality|scratches|rotation sheets?|floor music|regional commitment|qualification)/i,
    ],
    12
  );
  const registrationSection = sectionMatchLines(
    [/(entry fees?|team fees?|late fees?|how to enter|payment|refund|deadline|meet maker|reservation)/i],
    12
  );
  const titleHints = uniqueLines(
    [
      safeString(extractionMeta.pageTitle || ""),
      ...firstLines.filter((line) => line.length >= 6 && line.length <= 90),
    ],
    8
  );
  const linkHints = uniqueBy(
    [
      ...pickArray(extractionMeta.discoveredLinks)
        .map((item) => ({
          label: safeString(item?.label) || "Source link",
          url: normalizeUrl(item?.url),
        }))
        .filter((item) => item.url),
      ...uniqueLines(
        (text.match(/https?:\/\/[^\s)]+/gi) || []).map((url) => url.replace(/[.,;!?]+$/, "")),
        14
      ).map((url) => ({ label: "Source link", url })),
    ],
    (item) => item.url
  ).slice(0, 14);

  return {
    source: {
      sourceType: extractionMeta.sourceType,
      usedOcr: extractionMeta.usedOcr,
      pageTitle: safeString(extractionMeta.pageTitle) || null,
      linkedAssetCount: Array.isArray(extractionMeta.linkedAssets)
        ? extractionMeta.linkedAssets.length
        : 0,
      extractedChars: text.length,
      textQuality: extractionMeta.textQuality || null,
      qualitySignals: extractionMeta.qualitySignals || null,
    },
    candidates: {
      titleHints,
      dateHints,
      timeHints,
      timezoneHints,
      venueHints,
      addressHints,
      hostGymHints,
      admissionHints,
      athleteHints,
      sessionHints,
      logisticsHints,
      policyHints,
      coachHints,
      linkHints,
    },
    sections: {
      spectator: spectatorSection,
      venue: venueSection,
      traffic: trafficSection,
      policy: policySection,
      coachOps: coachOpsSection,
      registration: registrationSection,
    },
    dateAnalysis: {
      primaryCandidate: dateAnalysis.primary
        ? {
            label: dateAnalysis.primary.label,
            startDate: dateAnalysis.primary.startDate,
            endDate: dateAnalysis.primary.endDate,
            line: dateAnalysis.primary.line,
            score: dateAnalysis.primary.score,
          }
        : null,
      ignoredCandidates: dateAnalysis.ignored.map((item) => ({
        label: item.label,
        line: item.line,
        score: item.score,
        reason: item.reason,
      })),
    },
    snippets: {
      firstLines,
      additionalInfoLines,
      trafficLines,
      hallLayoutLines,
      coachLines,
    },
  };
}

function extractPdfTextHeuristic(buffer: Buffer): string {
  const decodePdfFragment = (value: string) =>
    value
      .replace(/\\([0-7]{1,3})/g, (_m, oct) =>
        String.fromCharCode(parseInt(oct, 8))
      )
      .replace(/\\n/g, "\n")
      .replace(/\\r/g, "\n")
      .replace(/\\t/g, " ")
      .replace(/\\\(/g, "(")
      .replace(/\\\)/g, ")")
      .replace(/\\\\/g, "\\")
      .trim();
  const collectParenthesizedText = (input: string) =>
    (input.match(/\(([^()]{3,600})\)/g) || [])
      .map((item) => decodePdfFragment(item.slice(1, -1)))
      .filter(Boolean);

  // Collect text snippets from direct and flate-compressed streams.
  const raw = buffer.toString("latin1");
  const snippets: string[] = [...collectParenthesizedText(raw)];
  let cursor = 0;
  let scanned = 0;
  while (scanned < 300) {
    const streamIdx = raw.indexOf("stream", cursor);
    if (streamIdx < 0) break;
    const lineEnd = raw.indexOf("\n", streamIdx);
    if (lineEnd < 0) break;
    const endIdx = raw.indexOf("endstream", lineEnd);
    if (endIdx < 0) break;
    cursor = endIdx + 9;
    scanned += 1;

    const streamText = raw.slice(lineEnd + 1, endIdx).replace(/\r/g, "");
    const streamBuf = Buffer.from(streamText, "latin1");
    const maybeDecoded: Buffer[] = [];
    try {
      maybeDecoded.push(inflateSync(streamBuf));
    } catch {
      // no-op
    }
    try {
      maybeDecoded.push(inflateRawSync(streamBuf));
    } catch {
      // no-op
    }
    for (const decoded of maybeDecoded) {
      const decodedRaw = decoded.toString("latin1");
      snippets.push(...collectParenthesizedText(decodedRaw));
    }
  }
  return snippets.join("\n");
}

function cleanExtractedText(text: string): string {
  const normalized = normalizeDiscoveryDateArtifacts(
    (text || "")
      .replace(/\r\n?/g, "\n")
      .replace(/\u0000/g, " ")
      .replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F]/g, " ")
  );
  const stitched = stitchDiscoveryLines(
    normalized
      .split(/\n+/)
      .map((line) => line.replace(/[ \t]{2,}/g, " ").trim())
      .filter(Boolean)
  );
  return stitched
    .join("\n")
    .replace(/\u0000/g, " ")
    .replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F]/g, " ")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function getPdfRenderDeps() {
  if (!pdfRenderDepsPromise) {
    pdfRenderDepsPromise = Promise.all([
      import("pdfjs-dist/legacy/build/pdf.mjs"),
      import("@napi-rs/canvas"),
    ])
      .then(([pdfjs, canvasMod]) => ({
        pdfjs,
        createCanvas: (canvasMod as any).createCanvas,
      }))
      .catch(() => null);
  }
  return pdfRenderDepsPromise;
}

async function renderPdfPageToPng(
  pdfBuffer: Buffer,
  pageIndex: number,
  scale = 1.75
): Promise<Buffer | null> {
  const deps = await getPdfRenderDeps();
  if (!deps) return null;
  try {
    const loadingTask = deps.pdfjs.getDocument({
      data: new Uint8Array(pdfBuffer),
      useSystemFonts: true,
      isEvalSupported: false,
      disableFontFace: true,
    });
    const doc = await loadingTask.promise;
    const page = await doc.getPage(pageIndex + 1);
    const viewport = page.getViewport({ scale });
    const width = Math.max(1, Math.ceil(viewport.width));
    const height = Math.max(1, Math.ceil(viewport.height));
    const canvas = deps.createCanvas(width, height);
    const context = canvas.getContext("2d");
    await page.render({ canvasContext: context, viewport }).promise;
    const png = canvas.toBuffer("image/png");
    if (typeof page.cleanup === "function") page.cleanup();
    if (typeof doc.cleanup === "function") doc.cleanup();
    if (typeof doc.destroy === "function") await doc.destroy();
    return Buffer.isBuffer(png) ? png : Buffer.from(png);
  } catch {
    return null;
  }
}

function looksLikePdfInternals(text: string): boolean {
  const sample = cleanExtractedText(text).slice(0, 24000);
  if (!sample) return false;
  if (/%PDF-\d\.\d/i.test(sample)) return true;
  const pdfKeywords =
    sample.match(
      /\b(?:obj|endobj|stream|endstream|xref|trailer|startxref|catalog|mediabox|fontdescriptor|flatedecode)\b/gi
    ) || [];
  const slashDirectives = sample.match(/\/[A-Za-z][A-Za-z0-9]+/g) || [];
  return pdfKeywords.length >= 8 || slashDirectives.length >= 60;
}

function analyzeTextQuality(text: string): {
  cleanedText: string;
  quality: TextQuality;
  signals: TextQualitySignals;
} {
  const cleanedText = cleanExtractedText(text);
  if (!cleanedText) {
    return {
      cleanedText,
      quality: "poor",
      signals: {
        controlRatio: 0,
        englishLikeRatio: 0,
        longTokenRatio: 0,
        nonTextRatio: 1,
        readableLines: 0,
        tokenCount: 0,
        nonAsciiRatio: 0,
        looksLikePdfInternals: false,
      },
    };
  }

  const sample = cleanedText.slice(0, 5000);
  const tokens = cleanedText.split(/\s+/).filter(Boolean);
  const controlChars = (sample.match(/[\u0000-\u001F\u007F-\u009F]/g) || []).length;
  const englishLikeTokens = tokens.filter((token) => /^[A-Za-z][A-Za-z'’-]{1,24}$/.test(token)).length;
  const longTokens = tokens.filter((token) => token.length > 35).length;
  const nonTextChars = (sample.match(/[^A-Za-z0-9\s.,:;!?()'"&@#%/\-]/g) || []).length;
  const readableLines = cleanedText
    .split(/\n+/)
    .filter((line) => (line.match(/[A-Za-z]{3,}/g) || []).length >= 3).length;
  const nonAsciiChars = (sample.match(/[^\x00-\x7F]/g) || []).length;
  const internals = looksLikePdfInternals(cleanedText);

  const signals: TextQualitySignals = {
    controlRatio: controlChars / Math.max(sample.length, 1),
    englishLikeRatio: englishLikeTokens / Math.max(tokens.length, 1),
    longTokenRatio: longTokens / Math.max(tokens.length, 1),
    nonTextRatio: nonTextChars / Math.max(sample.length, 1),
    readableLines,
    tokenCount: tokens.length,
    nonAsciiRatio: nonAsciiChars / Math.max(sample.length, 1),
    looksLikePdfInternals: internals,
  };

  const isPoor =
    internals ||
    signals.tokenCount < 25 ||
    signals.controlRatio >= 0.08 ||
    signals.nonTextRatio >= 0.35 ||
    signals.nonAsciiRatio >= 0.25 ||
    signals.englishLikeRatio < 0.08 ||
    signals.readableLines < 2;
  if (isPoor) {
    return { cleanedText, quality: "poor", signals };
  }

  const isGood =
    cleanedText.length >= LOW_TEXT_THRESHOLD &&
    signals.controlRatio < 0.02 &&
    signals.englishLikeRatio > 0.25 &&
    signals.longTokenRatio < 0.08 &&
    signals.nonTextRatio < 0.12 &&
    signals.readableLines >= 4 &&
    signals.tokenCount > 30 &&
    signals.nonAsciiRatio < 0.08;
  if (isGood) {
    return { cleanedText, quality: "good", signals };
  }

  return { cleanedText, quality: "suspect", signals };
}

async function extractPdfTextWithNodeWorker(buffer: Buffer): Promise<PdfTextExtraction> {
  let tempDir = "";
  try {
    tempDir = await mkdtemp(join(tmpdir(), "envitefy-pdf-"));
    const filePath = join(tempDir, "input.pdf");
    await writeFile(filePath, buffer);
    const workerScript = `
const { readFileSync } = require("fs");
const { PDFParse } = require("pdf-parse");
(async () => {
  const data = readFileSync(process.argv[1]);
  const parser = new PDFParse({ data });
  const result = await parser.getText();
  if (typeof parser.destroy === "function") await parser.destroy();
  process.stdout.write(JSON.stringify({
    text: result?.text || "",
    pages: Array.isArray(result?.pages)
      ? result.pages.map((page) => ({
          num: Number(page?.num) || 0,
          text: page?.text || "",
        }))
      : [],
  }));
})().catch((error) => {
  process.stderr.write(String(error?.message || error));
  process.exit(1);
});
`;
    const { stdout } = await execFileAsync(process.execPath, ["-e", workerScript, filePath], {
      maxBuffer: 10 * 1024 * 1024,
    });
    const payload = JSON.parse(stdout || "{}");
    return {
      text: cleanExtractedText(String(payload?.text || "")),
      pages: pickArray(payload?.pages)
        .map((page) => ({
          num: Number(page?.num) || 0,
          text: cleanExtractedText(safeString(page?.text || "")),
        }))
        .filter((page) => page.text),
    };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : typeof err === "string" ? err : String(err || "");
    console.warn("[meet-discovery] pdf-parse worker failed", {
      message,
    });
    try {
      const mod = await import("pdf-parse");
      const PDFParseCtor =
        typeof mod?.PDFParse === "function" ? mod.PDFParse : null;
      if (PDFParseCtor) {
        const parser = new PDFParseCtor({ data: buffer });
        const result = await parser.getText();
        if (typeof parser.destroy === "function") await parser.destroy();
        return {
          text: cleanExtractedText(String(result?.text || "")),
          pages: Array.isArray(result?.pages)
            ? result.pages
                .map((page: any) => ({
                  num: Number(page?.num) || 0,
                  text: cleanExtractedText(safeString(page?.text || "")),
                }))
                .filter((page: any) => page.text)
            : [],
        };
      }
    } catch (fallbackErr: unknown) {
      const fallbackMessage =
        fallbackErr instanceof Error
          ? fallbackErr.message
          : typeof fallbackErr === "string"
          ? fallbackErr
          : String(fallbackErr || "");
      console.warn("[meet-discovery] pdf-parse fallback failed", {
        message: fallbackMessage,
      });
    }
    return { text: "", pages: [] };
  } finally {
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true });
    }
  }
}

async function ocrBuffer(buffer: Buffer): Promise<string> {
  const vision = getVisionClient();
  const [result] = await vision.textDetection({
    image: { content: buffer },
    imageContext: { languageHints: ["en"] },
  });
  return (
    result.fullTextAnnotation?.text ||
    result.textAnnotations?.[0]?.description ||
    ""
  ).trim();
}

async function openAiOcrTextFromImage(
  buffer: Buffer,
  mimeType = "image/png"
): Promise<string> {
  const apiKey = safeString(process.env.OPENAI_API_KEY || "");
  if (!apiKey) return "";
  const model =
    safeString(process.env.OPENAI_OCR_FAST_MODEL) ||
    safeString(process.env.OPENAI_OCR_MODEL) ||
    safeString(process.env.LLM_MODEL) ||
    "gpt-5.1-mini";
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You are an OCR engine. Return strict JSON {\"text\": string}. Extract only visible text and labels from the image.",
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Extract all visible text." },
              { type: "input_image", image_url: { url: `data:${mimeType};base64,${buffer.toString("base64")}` } },
            ],
          },
        ],
      }),
    });
    if (!response.ok) return "";
    const payload = await response.json();
    const raw = safeString(payload?.choices?.[0]?.message?.content || "");
    const parsed = extractJsonObject(raw);
    return cleanExtractedText(safeString(parsed?.text || raw));
  } catch {
    return "";
  }
}

async function openAiAnalyzeGymLayoutPage(
  buffer: Buffer,
  mimeType = "image/png"
): Promise<{ isLayout: boolean; confidence: number; facts: string[]; text: string } | null> {
  const apiKey = safeString(process.env.OPENAI_API_KEY || "");
  if (!apiKey) return null;
  const model =
    safeString(process.env.OPENAI_OCR_FAST_MODEL) ||
    safeString(process.env.OPENAI_OCR_MODEL) ||
    safeString(process.env.LLM_MODEL) ||
    "gpt-5.1-mini";
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "Classify gymnastics venue map pages and extract hall-layout facts. Return strict JSON only.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text:
                  'Return JSON with keys: isLayout (boolean), confidence (number 0-1), text (string), facts (string[]). Facts must be verbatim visible map labels/text only (no paraphrase, no inference, no reconstruction). Each fact must be a complete, readable sentence or complete standalone label. Never return broken fragments or mid-sentence splits. If uncertain, return an empty facts array.',
              },
              { type: "input_image", image_url: { url: `data:${mimeType};base64,${buffer.toString("base64")}` } },
            ],
          },
        ],
      }),
    });
    if (!response.ok) return null;
    const payload = await response.json();
    const raw = safeString(payload?.choices?.[0]?.message?.content || "");
    const parsed = extractJsonObject(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const confidenceRaw = Number(parsed?.confidence);
    const confidence = Number.isFinite(confidenceRaw)
      ? Math.max(0, Math.min(1, confidenceRaw))
      : 0;
    return {
      isLayout: Boolean(parsed?.isLayout),
      confidence,
      text: cleanExtractedText(safeString(parsed?.text || "")),
      facts: sanitizeVenueFactLines(
        pickArray(parsed?.facts)
          .map((item) => safeString(item))
          .filter(Boolean),
        {
          mode: "strict",
          maxLines: 14,
          requireAnchor: true,
          excludePatterns: [
            /traffic|disney on ice|benchmark(?:\s+international)?\s+arena/i,
            /official results|live scoring|daylight savings/i,
          ],
        }
      ),
    };
  } catch {
    return null;
  }
}

async function extractTextFromPdf(buffer: Buffer): Promise<{
  text: string;
  usedOcr: boolean;
  coachPageHints: CoachPageHint[];
  textQuality: TextQuality;
  qualitySignals: TextQualitySignals;
}> {
  const rank: Record<TextQuality, number> = { good: 2, suspect: 1, poor: 0 };
  const toCandidate = (raw: string, usedOcr: boolean) => {
    const analyzed = analyzeTextQuality(raw);
    return {
      text: analyzed.cleanedText,
      usedOcr,
      textQuality: analyzed.quality,
      qualitySignals: analyzed.signals,
    };
  };

  const workerExtraction = await extractPdfTextWithNodeWorker(buffer);
  const workerCoachPageHints = extractCoachPageHintsFromPages(workerExtraction.pages);
  const workerCandidate = toCandidate(workerExtraction.text, false);
  if (workerCandidate.text.length >= LOW_TEXT_THRESHOLD && workerCandidate.textQuality === "good") {
    return {
      ...workerCandidate,
      coachPageHints: workerCoachPageHints,
    };
  }

  const heuristicCandidate = toCandidate(extractPdfTextHeuristic(buffer), false);
  if (
    heuristicCandidate.text.length >= LOW_TEXT_THRESHOLD &&
    heuristicCandidate.textQuality === "good"
  ) {
    return {
      ...heuristicCandidate,
      coachPageHints: workerCoachPageHints,
    };
  }

  let ocrCandidate: ReturnType<typeof toCandidate> | null = null;
  try {
    const ocrPages: string[] = [];
    for (let page = 0; page < 5; page += 1) {
      const sharpPageImage = await sharp(buffer, { density: 220, page })
        .png()
        .toBuffer()
        .catch(() => null);
      const pageImage = sharpPageImage || (await renderPdfPageToPng(buffer, page));
      if (!pageImage) break;
      const text = cleanExtractedText(await extractTextFromImage(pageImage));
      if (text) ocrPages.push(text);
    }
    if (ocrPages.length > 0) {
      ocrCandidate = toCandidate(ocrPages.join("\n\n"), true);
      if (ocrCandidate.textQuality === "good" && ocrCandidate.text.length > 0) {
        return {
          ...ocrCandidate,
          coachPageHints: workerCoachPageHints,
        };
      }
    }
  } catch {
    // Continue to final fallbacks.
  }
  if (!ocrCandidate) {
    try {
      ocrCandidate = toCandidate(await extractTextFromImage(buffer), true);
      if (ocrCandidate.textQuality === "good" && ocrCandidate.text.length > 0) {
        return {
          ...ocrCandidate,
          coachPageHints: workerCoachPageHints,
        };
      }
    } catch {
      // Continue to best-candidate selection.
    }
  }

  const candidates = [workerCandidate, heuristicCandidate, ocrCandidate]
    .filter((item): item is ReturnType<typeof toCandidate> => Boolean(item))
    .filter((item) => item.text.length > 0)
    .sort((a, b) => {
      const qualityDelta = rank[b.textQuality] - rank[a.textQuality];
      if (qualityDelta !== 0) return qualityDelta;
      return b.text.length - a.text.length;
    });

  const best = candidates[0];
  if (best && best.textQuality !== "poor") {
    return {
      ...best,
      coachPageHints: workerCoachPageHints,
    };
  }

  const emptyQuality = analyzeTextQuality("");
  return {
    text: "",
    usedOcr: false,
    coachPageHints: workerCoachPageHints,
    textQuality: "poor",
    qualitySignals: emptyQuality.signals,
  };
}

async function extractTextFromImage(buffer: Buffer): Promise<string> {
  const prepared = await sharp(buffer).resize(2200).grayscale().normalize().toBuffer();
  try {
    const text = await ocrBuffer(prepared);
    if (safeString(text)) return cleanExtractedText(text);
  } catch {
    // Fall through to OpenAI OCR.
  }
  const fallbackText = await openAiOcrTextFromImage(prepared, "image/png");
  return cleanExtractedText(fallbackText);
}

function countPatternMatches(text: string, pattern: RegExp): number {
  return Array.from(text.matchAll(pattern)).length;
}

function summarizeGymLayoutText(text: string): {
  mapHeading: boolean;
  gymLabelCount: number;
  hallLabelCount: number;
  strongSignalCount: number;
  paragraphPenalty: boolean;
} {
  const normalized = safeString(text).toLowerCase();
  if (!normalized) {
    return {
      mapHeading: false,
      gymLabelCount: 0,
      hallLabelCount: 0,
      strongSignalCount: 0,
      paragraphPenalty: false,
    };
  }

  const mapHeading = /(gym\s*layout|facility\s*map|floor\s*plan|venue\s*map|convention\s*center\s*map)/i.test(
    normalized
  );
  const gymLabelCount = countPatternMatches(normalized, /\bgym\s*[a-f]\b/gi);
  const hallLabelCount = countPatternMatches(
    normalized,
    /\b(?:east|west|central|north|south)\s*hall\b/gi
  );
  const textScore = scoreGymLayoutSignals(normalized);
  const lines = normalized
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
  const longLineCount = lines.filter((line) => line.length >= 85).length;
  const weakAnchorCount =
    gymLabelCount +
    hallLabelCount +
    countPatternMatches(
      normalized,
      /\b(registration|awards area|competition area|guest services|entrance|coffee bar)\b/gi
    );
  const paragraphPenalty =
    normalized.length >= 800 &&
    longLineCount >= 4 &&
    textScore <= 2 &&
    weakAnchorCount <= 2;

  return {
    mapHeading,
    gymLabelCount,
    hallLabelCount,
    strongSignalCount: textScore,
    paragraphPenalty,
  };
}

function looksLikeGymLayoutText(text: string): boolean {
  const summary = summarizeGymLayoutText(text);
  const hasAnchor = summary.gymLabelCount >= 1 || summary.hallLabelCount >= 1;
  if (summary.mapHeading && hasAnchor) return true;
  return (
    summary.strongSignalCount >= 3 &&
    (summary.gymLabelCount >= 1 || summary.hallLabelCount >= 2)
  );
}

function scoreGymLayoutSignals(text: string): number {
  const normalized = safeString(text).toLowerCase();
  if (!normalized) return 0;
  const signals = [
    /hall\s*layout|facility\s*map|floor\s*plan|venue\s*map|convention\s*center\s*map/,
    /east hall/,
    /west hall/,
    /central hall/,
    /gym\s*[a-f]/,
    /awards area/,
    /registration/,
    /guest services/,
    /competition area/,
    /entrance/,
    /coffee bar/,
  ];
  return signals.reduce((count, re) => (re.test(normalized) ? count + 1 : count), 0);
}

function extractGymTokens(value: string): string[] {
  const text = safeString(value);
  if (!text) return [];
  const matches = Array.from(text.matchAll(/\bgym\s*([a-z0-9]{1,2})\b/gi));
  if (!matches.length) return [];
  const tokens = matches
    .map((match) => safeString(match?.[1] || "").toUpperCase())
    .filter(Boolean)
    .map((suffix) => `Gym ${suffix}`);
  return uniqueLines(tokens, 8);
}

function normalizeZoneNumber(value: unknown): number | null {
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  if (num >= 0 && num <= 1) return num;
  if (num > 1 && num <= 100) return num / 100;
  return null;
}

function normalizeGymLayoutZones(raw: unknown): GymLayoutZone[] {
  return uniqueBy(
    pickArray(raw)
      .map((item) => {
        const label = safeString(item?.label || item?.name || item?.zone);
        const x = normalizeZoneNumber(item?.x ?? item?.left);
        const y = normalizeZoneNumber(item?.y ?? item?.top);
        const w = normalizeZoneNumber(item?.w ?? item?.width);
        const h = normalizeZoneNumber(item?.h ?? item?.height);
        const confidenceRaw = Number(item?.confidence);
        const confidence = Number.isFinite(confidenceRaw)
          ? Math.max(0, Math.min(1, confidenceRaw))
          : 0;
        if (!label || x === null || y === null || w === null || h === null) return null;
        if (w <= 0 || h <= 0) return null;
        if (x + w > 1.02 || y + h > 1.02) return null;
        return {
          label,
          x: Math.max(0, Math.min(1, x)),
          y: Math.max(0, Math.min(1, y)),
          w: Math.max(0.01, Math.min(1, w)),
          h: Math.max(0.01, Math.min(1, h)),
          confidence,
        } as GymLayoutZone;
      })
      .filter((item): item is GymLayoutZone => Boolean(item)),
    (item) =>
      `${item.label.toLowerCase()}|${item.x.toFixed(3)}|${item.y.toFixed(3)}|${item.w.toFixed(
        3
      )}|${item.h.toFixed(3)}`
  ).slice(0, 24);
}

async function openAiExtractGymLayoutZones(
  buffer: Buffer,
  mimeType = "image/png"
): Promise<GymLayoutZone[]> {
  const apiKey = safeString(process.env.OPENAI_API_KEY || "");
  if (!apiKey) return [];
  const model =
    safeString(process.env.OPENAI_OCR_FAST_MODEL) ||
    safeString(process.env.OPENAI_OCR_MODEL) ||
    safeString(process.env.LLM_MODEL) ||
    "gpt-5.1-mini";
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "Extract gymnastics venue map regions from the image. Return strict JSON only.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text:
                  'Return JSON with key "zones" where zones is an array of objects: {label:string, x:number, y:number, w:number, h:number, confidence:number}. Coordinates must be normalized 0..1 relative to the full image. Include only visible map regions such as gym labels, hall names, registration, guest services, entrances, competition area, and awards area. If unsure, return an empty array.',
              },
              {
                type: "input_image",
                image_url: { url: `data:${mimeType};base64,${buffer.toString("base64")}` },
              },
            ],
          },
        ],
      }),
    });
    if (!response.ok) return [];
    const payload = await response.json();
    const raw = safeString(payload?.choices?.[0]?.message?.content || "");
    const parsed = extractJsonObject(raw);
    if (!parsed || typeof parsed !== "object") return [];
    return normalizeGymLayoutZones(parsed?.zones);
  } catch {
    return [];
  }
}

async function cropGymLayoutImageToAssignedGym(
  imageDataUrl: string,
  zones: GymLayoutZone[],
  assignedGym: string
): Promise<string | null> {
  const parsed = parseDataUrl(imageDataUrl);
  if (!parsed || !zones.length) return null;
  const target = safeString(assignedGym);
  if (!target) return null;
  const targetTokens = extractGymTokens(target);
  if (!targetTokens.length) return null;
  const targetSet = new Set(targetTokens.map((item) => item.toLowerCase()));
  const matchingZones = zones.filter((zone) => {
    const zoneTokens = extractGymTokens(zone.label);
    return zoneTokens.some((token) => targetSet.has(token.toLowerCase()));
  });
  if (!matchingZones.length) return null;
  const chosen = [...matchingZones].sort((a, b) => {
    const confidenceDelta = b.confidence - a.confidence;
    if (confidenceDelta !== 0) return confidenceDelta;
    return a.w * a.h - b.w * b.h;
  })[0];
  try {
    const metadata = await sharp(parsed.buffer).metadata();
    const width = Number(metadata.width || 0);
    const height = Number(metadata.height || 0);
    if (!Number.isFinite(width) || !Number.isFinite(height) || width < 20 || height < 20) {
      return null;
    }
    const padX = Math.max(12, Math.round(width * 0.035));
    const padY = Math.max(12, Math.round(height * 0.035));
    const left = Math.max(0, Math.floor(chosen.x * width) - padX);
    const top = Math.max(0, Math.floor(chosen.y * height) - padY);
    const cropWidth = Math.min(
      width - left,
      Math.max(32, Math.ceil(chosen.w * width) + padX * 2)
    );
    const cropHeight = Math.min(
      height - top,
      Math.max(32, Math.ceil(chosen.h * height) + padY * 2)
    );
    if (cropWidth < 24 || cropHeight < 24) return null;
    const cropped = await sharp(parsed.buffer)
      .extract({ left, top, width: cropWidth, height: cropHeight })
      .toBuffer();
    return await toOptimizedImageDataUrl(cropped);
  } catch {
    return null;
  }
}

async function toOptimizedImageDataUrl(
  buffer: Buffer
): Promise<string | null> {
  try {
    const variants: Array<{ width: number; quality: number }> = [
      { width: 1800, quality: 82 },
      { width: 1600, quality: 76 },
      { width: 1400, quality: 72 },
      { width: 1200, quality: 68 },
      { width: 1000, quality: 64 },
    ];
    for (const variant of variants) {
      const optimized = await sharp(buffer)
        .resize({ width: variant.width, withoutEnlargement: true })
        .jpeg({ quality: variant.quality })
        .toBuffer();
      if (optimized.length <= 1_800_000) {
        return `data:image/jpeg;base64,${optimized.toString("base64")}`;
      }
    }
    // Last-resort tiny output to avoid dropping the screenshot entirely.
    const fallback = await sharp(buffer)
      .resize({ width: 900, withoutEnlargement: true })
      .jpeg({ quality: 58 })
      .toBuffer();
    return fallback.length <= 2_000_000
      ? `data:image/jpeg;base64,${fallback.toString("base64")}`
      : null;
  } catch {
    return null;
  }
}

async function scoreGymLayoutVisualSignal(buffer: Buffer): Promise<number> {
  try {
    const stats = await sharp(buffer).stats();
    const channels = pickArray(stats?.channels);
    if (!channels.length) return 0;
    const mean =
      channels.reduce((sum, channel) => sum + Number(channel?.mean || 0), 0) /
      channels.length;
    const stdev =
      channels.reduce((sum, channel) => sum + Number(channel?.stdev || 0), 0) /
      channels.length;
    const darknessScore = Math.max(0, (245 - mean) / 120);
    const textureScore = Math.max(0, stdev / 70);
    return Math.max(0, Math.min(1.5, darknessScore * 0.8 + textureScore * 0.7));
  } catch {
    return 0;
  }
}

async function extractGymLayoutImageFromPdf(buffer: Buffer): Promise<GymLayoutExtraction> {
  const candidatePages: Array<{
    page: number;
    image: Buffer;
    text: string;
    textScore: number;
    visualScore: number;
    gymLabelCount: number;
    hallLabelCount: number;
    mapHeading: boolean;
    paragraphPenalty: boolean;
    preScore: number;
    aiIsLayout: boolean | null;
    aiConfidence: number | null;
    aiFacts: string[];
    aiText: string;
    accepted: boolean;
    acceptReason: "ai" | "deterministic" | null;
    finalScore: number;
  }> = [];
  for (let page = 0; page < 20; page += 1) {
    try {
      const sharpPageImage = await sharp(buffer, { density: 220, page })
        .png()
        .toBuffer()
        .catch(() => null);
      const pageImage = sharpPageImage || (await renderPdfPageToPng(buffer, page));
      if (!pageImage) continue;
      const pageText = await extractTextFromImage(pageImage);
      const summary = summarizeGymLayoutText(pageText);
      const textScore = scoreGymLayoutSignals(pageText);
      const visualScore = await scoreGymLayoutVisualSignal(pageImage);
      const preScore =
        textScore +
        Math.min(visualScore, 1) * 0.5 +
        summary.gymLabelCount * 2 +
        summary.hallLabelCount * 0.75 +
        (summary.mapHeading ? 1 : 0) -
        (summary.paragraphPenalty ? 1 : 0);
      candidatePages.push({
        page,
        image: pageImage,
        text: pageText,
        textScore,
        visualScore,
        gymLabelCount: summary.gymLabelCount,
        hallLabelCount: summary.hallLabelCount,
        mapHeading: summary.mapHeading,
        paragraphPenalty: summary.paragraphPenalty,
        preScore,
        aiIsLayout: null,
        aiConfidence: null,
        aiFacts: [],
        aiText: "",
        accepted: false,
        acceptReason: null,
        finalScore: preScore,
      });
    } catch {
      // Continue scanning remaining pages; some PDFs can fail intermittently by page.
      continue;
    }
  }

  if (!candidatePages.length) {
    return {
      dataUrl: null,
      facts: [],
      zones: [],
      page: null,
      selection: {
        selectedPage: null,
        reason: "no_pdf_pages_scanned",
        confidence: null,
        candidates: [],
      },
    };
  }

  const rankedCandidates = [...candidatePages].sort((a, b) => {
    const preScoreDelta = b.preScore - a.preScore;
    if (preScoreDelta !== 0) return preScoreDelta;
    return a.page - b.page;
  });
  const topForAi = rankedCandidates.slice(0, 6);
  for (const candidate of topForAi) {
    const ai = await openAiAnalyzeGymLayoutPage(candidate.image, "image/png");
    if (!ai) continue;
    candidate.aiIsLayout = ai.isLayout;
    candidate.aiConfidence = ai.confidence;
    candidate.aiFacts = ai.facts;
    candidate.aiText = ai.text;
  }

  for (const candidate of candidatePages) {
    const aiScore =
      (candidate.aiIsLayout === true ? 1.5 : candidate.aiIsLayout === false ? -1 : 0) +
      (candidate.aiConfidence || 0) * 2;
    candidate.finalScore = candidate.preScore + aiScore;

    const aiAccepted =
      candidate.aiIsLayout === true &&
      (candidate.aiConfidence || 0) >= 0.62 &&
      (candidate.gymLabelCount >= 1 || candidate.hallLabelCount >= 2);
    const deterministicAccepted =
      candidate.gymLabelCount >= 2 && candidate.hallLabelCount >= 1;
    candidate.accepted = aiAccepted || deterministicAccepted;
    candidate.acceptReason = aiAccepted ? "ai" : deterministicAccepted ? "deterministic" : null;
  }

  const acceptedCandidates = [...candidatePages]
    .filter((candidate) => candidate.accepted)
    .sort((a, b) => {
      const finalScoreDelta = b.finalScore - a.finalScore;
      if (finalScoreDelta !== 0) return finalScoreDelta;
      const preScoreDelta = b.preScore - a.preScore;
      if (preScoreDelta !== 0) return preScoreDelta;
      return a.page - b.page;
    });

  const diagnosticsCandidates: GymLayoutSelectionCandidate[] = [...candidatePages]
    .sort((a, b) => {
      const preScoreDelta = b.preScore - a.preScore;
      if (preScoreDelta !== 0) return preScoreDelta;
      return a.page - b.page;
    })
    .map((candidate) => ({
      page: candidate.page,
      preScore: candidate.preScore,
      finalScore: candidate.finalScore,
      textScore: candidate.textScore,
      visualScore: candidate.visualScore,
      gymLabelCount: candidate.gymLabelCount,
      hallLabelCount: candidate.hallLabelCount,
      mapHeading: candidate.mapHeading,
      paragraphPenalty: candidate.paragraphPenalty,
      aiIsLayout: candidate.aiIsLayout,
      aiConfidence: candidate.aiConfidence,
      accepted: candidate.accepted,
    }));

  if (!acceptedCandidates.length) {
    return {
      dataUrl: null,
      facts: [],
      zones: [],
      page: null,
      selection: {
        selectedPage: null,
        reason: "no_candidate_passed_strict_gate",
        confidence: null,
        candidates: diagnosticsCandidates,
      },
    };
  }

  const selected = acceptedCandidates[0];
  const dataUrl = await toOptimizedImageDataUrl(selected.image);
  if (!dataUrl) {
    return {
      dataUrl: null,
      facts: [],
      zones: [],
      page: null,
      selection: {
        selectedPage: null,
        reason: "selected_page_image_encode_failed",
        confidence: null,
        candidates: diagnosticsCandidates,
      },
    };
  }

  const zones = await openAiExtractGymLayoutZones(selected.image, "image/png");
  const facts = sanitizeVenueFactLines(
    [...selected.aiFacts, ...extractHallFactsFromText(selected.text)],
    {
      mode: "strict",
      maxLines: 14,
      requireAnchor: true,
      excludePatterns: [
        /traffic|disney on ice|benchmark(?:\s+international)?\s+arena/i,
        /official results|live scoring|daylight savings/i,
      ],
    }
  );
  return {
    dataUrl,
    facts,
    zones,
    page: selected.page,
    selection: {
      selectedPage: selected.page,
      reason:
        selected.acceptReason === "ai"
          ? "accepted_ai_layout"
          : "accepted_deterministic_strong_map",
      confidence: selected.aiConfidence,
      candidates: diagnosticsCandidates,
    },
  };
}

function stripHtml(input: string): string {
  const noScript = input
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ");
  const withBreaks = noScript
    .replace(/<\/(p|div|h1|h2|h3|h4|h5|h6|li|tr|section|article)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n");
  return withBreaks
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function extractMetadataText(html: string): string {
  const snippets: string[] = [];
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (titleMatch?.[1]) snippets.push(stripHtml(titleMatch[1]));
  const metaRegex =
    /<meta[^>]+(?:name|property)=["'](?:description|og:title|og:description|twitter:title|twitter:description)["'][^>]*content=["']([^"']+)["'][^>]*>/gi;
  let match: RegExpExecArray | null = null;
  while ((match = metaRegex.exec(html))) {
    if (match[1]) snippets.push(stripHtml(match[1]));
  }
  const jsonLdRegex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  while ((match = jsonLdRegex.exec(html))) {
    const content = safeString(match[1]);
    if (content) snippets.push(content);
  }
  return snippets.filter(Boolean).join("\n\n");
}

function decodeHtmlEntities(input: string): string {
  return safeString(input)
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}

function linkUrlFromHref(base: URL, href: string): URL | null {
  try {
    const decodedHref = decodeHtmlEntities(href);
    if (!decodedHref || decodedHref.startsWith("#")) return null;
    if (/^(mailto:|tel:|javascript:)/i.test(decodedHref)) return null;
    const next = new URL(decodedHref, base);
    if (next.protocol !== "http:" && next.protocol !== "https:") return null;
    return next;
  } catch {
    return null;
  }
}

function isAssetUrl(url: URL | string): boolean {
  const href = typeof url === "string" ? url : url.href;
  return /\.(pdf|png|jpg|jpeg|webp)(\?|#|$)/i.test(href);
}

function extractLinkAttribute(rawAttrs: string, name: string): string {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = rawAttrs.match(new RegExp(`${escaped}=["']([^"']+)["']`, "i"));
  return decodeHtmlEntities(match?.[1] || "");
}

function fallbackLinkLabel(url: URL): string {
  const tail = safeString(url.pathname.split("/").filter(Boolean).pop() || "");
  if (!tail) return url.hostname.replace(/^www\./i, "");
  const decoded = decodeURIComponent(tail)
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[-_]+/g, " ")
    .trim();
  return decoded || url.hostname.replace(/^www\./i, "");
}

function normalizeLinkLabel(innerHtml: string, rawAttrs: string, url: URL): string {
  const textLabel = decodeHtmlEntities(stripHtml(innerHtml));
  const ariaLabel = extractLinkAttribute(rawAttrs, "aria-label");
  const titleLabel = extractLinkAttribute(rawAttrs, "title");
  const label = safeString(textLabel || ariaLabel || titleLabel || fallbackLinkLabel(url))
    .replace(/\s{2,}/g, " ")
    .trim();
  return label || fallbackLinkLabel(url);
}

function classifyDiscoveryLink(url: URL, baseUrl: URL): DiscoveryLinkKind {
  if (url.host !== baseUrl.host) return "external";
  return isAssetUrl(url) ? "asset" : "html";
}

function scoreDiscoveryCandidate(candidate: Omit<CrawlCandidate, "score" | "followed">): number {
  const haystack = `${candidate.label} ${candidate.url}`.toLowerCase();
  let score = 0;

  const boosts: Array<[RegExp, number]> = [
    [/\bschedule\b/, 7],
    [/\binfo\b/, 5],
    [/\bpacket\b/, 7],
    [/\broster\b/, 6],
    [/\brotation\b/, 6],
    [/\bfaq\b/, 5],
    [/\bresults?\b/, 5],
    [/\bhotel\b/, 5],
    [/\bparking\b/, 4],
    [/\bmap\b/, 3],
    [/\badmission\b/, 6],
    [/\btickets?\b/, 5],
    [/\bregistration\b/, 4],
  ];
  for (const [pattern, value] of boosts) {
    if (pattern.test(haystack)) score += value;
  }

  const penalties: Array<[RegExp, number]> = [
    [/\bhome\b/, 6],
    [/\babout\b/, 5],
    [/\bcontact\b/, 5],
    [/\bblog\b/, 6],
    [/\bsponsorship\b/, 5],
    [/\bauthor\b/, 5],
    [/\bfeed\b/, 5],
    [/\bcomments?\b/, 4],
    [/\bfacebook\b|\binstagram\b|\byoutube\b/, 8],
  ];
  for (const [pattern, value] of penalties) {
    if (pattern.test(haystack)) score -= value;
  }

  if (candidate.kind === "asset") score += 5;
  if (/\.pdf(\?|#|$)/i.test(candidate.url)) score += 4;
  if (candidate.kind === "external" && /(square|groupbook|ticket|hotel|results)/i.test(haystack)) {
    score += 3;
  }
  if (candidate.sameHost && candidate.depth === 0) score += 1;
  if (candidate.label.length <= 2) score -= 2;
  if (candidate.kind === "html" && /\/(?:about-us|contact|gymnastics-blog)\/?$/i.test(candidate.url)) {
    score -= 5;
  }

  return score;
}

function compareDiscoveryCandidates(a: CrawlCandidate, b: CrawlCandidate): number {
  const scoreDelta = b.score - a.score;
  if (scoreDelta !== 0) return scoreDelta;
  const kindRank = { asset: 0, html: 1, external: 2 } as const;
  const kindDelta = kindRank[a.kind] - kindRank[b.kind];
  if (kindDelta !== 0) return kindDelta;
  const depthDelta = a.depth - b.depth;
  if (depthDelta !== 0) return depthDelta;
  return a.url.localeCompare(b.url);
}

function shouldReplaceDiscoveryLink(existing: CrawlCandidate, next: CrawlCandidate): boolean {
  if (next.score !== existing.score) return next.score > existing.score;
  if (next.label.length !== existing.label.length) return next.label.length > existing.label.length;
  return next.depth < existing.depth;
}

function upsertDiscoveredLink(map: Map<string, CrawlCandidate>, candidate: CrawlCandidate) {
  const existing = map.get(candidate.url);
  if (!existing) {
    map.set(candidate.url, candidate);
    return;
  }
  const merged: CrawlCandidate = shouldReplaceDiscoveryLink(existing, candidate)
    ? { ...existing, ...candidate }
    : { ...candidate, ...existing };
  merged.followed = existing.followed || candidate.followed;
  merged.contentType = candidate.contentType || existing.contentType || null;
  merged.depth = existing.depth <= candidate.depth ? existing.depth : candidate.depth;
  merged.sourceUrl = shouldReplaceDiscoveryLink(existing, candidate)
    ? candidate.sourceUrl
    : existing.sourceUrl;
  merged.score = Math.max(existing.score, candidate.score);
  map.set(candidate.url, merged);
}

function collectDiscoveryCandidates(html: string, baseUrl: URL, depth: 0 | 1): CrawlCandidate[] {
  const links: CrawlCandidate[] = [];
  const anchorRegex = /<a\b([^>]*?)href=["']([^"']+)["']([^>]*)>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null = null;
  while ((match = anchorRegex.exec(html))) {
    const rawAttrs = `${match[1] || ""} ${match[3] || ""}`;
    const url = linkUrlFromHref(baseUrl, match[2] || "");
    if (!url) continue;
    if (url.href === baseUrl.href) continue;
    const kind = classifyDiscoveryLink(url, baseUrl);
    const sameHost = url.host === baseUrl.host;
    const candidateBase = {
      url: url.toString(),
      label: normalizeLinkLabel(match[4] || "", rawAttrs, url),
      sourceUrl: baseUrl.toString(),
      depth,
      kind,
      sameHost,
    };
    links.push({
      ...candidateBase,
      followed: false,
      contentType: null,
      score: scoreDiscoveryCandidate(candidateBase),
    });
  }
  return uniqueBy(links, (item) => item.url).sort(compareDiscoveryCandidates);
}

function buildHtmlTextChunk(
  pageUrl: string,
  metadataText: string,
  readableText: string
): string {
  const pieces = [
    `Source URL: ${pageUrl}`,
    safeString(metadataText),
    safeString(readableText),
  ].filter(Boolean);
  return pieces.join("\n\n").trim();
}

function getPageTitle(html: string): string | null {
  return safeString(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "") || null;
}

async function fetchWithLimit(url: string): Promise<{ contentType: string; buffer: Buffer; text: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  const response = await fetch(url, {
    redirect: "follow",
    signal: controller.signal,
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; EnvitefyBot/1.0; +https://envitefy.com)",
    },
    cache: "no-store",
  });
  clearTimeout(timeout);
  if (!response.ok) {
    throw new Error(`Fetch failed (${response.status})`);
  }
  const contentType = response.headers.get("content-type") || "";
  const arr = new Uint8Array(await response.arrayBuffer());
  const sliced = arr.slice(0, Math.min(arr.length, MAX_FETCH_BYTES));
  const buffer = Buffer.from(sliced);
  let text = "";
  if (/text\/html|text\/plain|application\/json|application\/ld\+json/i.test(contentType)) {
    text = buffer.toString("utf8");
  }
  return { contentType, buffer, text };
}

function getUrlDiscoveryHooks(): Required<UrlDiscoveryTestHooks> {
  return {
    fetchWithLimit: urlDiscoveryTestHooks?.fetchWithLimit || fetchWithLimit,
    extractTextFromPdf: urlDiscoveryTestHooks?.extractTextFromPdf || extractTextFromPdf,
    extractTextFromImage: urlDiscoveryTestHooks?.extractTextFromImage || extractTextFromImage,
    extractGymLayoutImageFromPdf:
      urlDiscoveryTestHooks?.extractGymLayoutImageFromPdf || extractGymLayoutImageFromPdf,
    openAiExtractGymLayoutZones:
      urlDiscoveryTestHooks?.openAiExtractGymLayoutZones || openAiExtractGymLayoutZones,
    toOptimizedImageDataUrl:
      urlDiscoveryTestHooks?.toOptimizedImageDataUrl || toOptimizedImageDataUrl,
  };
}

async function appendFetchedAssetText(
  assetUrl: URL,
  fetched: { contentType: string; buffer: Buffer; text: string },
  accumulators: {
    linkedChunks: string[];
    linkedMeta: Array<{ url: string; contentType: string }>;
    usedOcr: boolean;
    gymLayoutImageDataUrl: string | null;
    gymLayoutPage: number | null;
    gymLayoutFacts: string[];
    gymLayoutZones: GymLayoutZone[];
    gymLayoutSelection?: GymLayoutSelectionDiagnostics;
    coachPageHints: CoachPageHint[];
  },
  hooks: Required<UrlDiscoveryTestHooks>
) {
  accumulators.linkedMeta.push({ url: assetUrl.toString(), contentType: fetched.contentType });
  if (/pdf/i.test(fetched.contentType) || /\.pdf(\?|#|$)/i.test(assetUrl.pathname)) {
    const parsed = await hooks.extractTextFromPdf(fetched.buffer);
    accumulators.linkedChunks.push(parsed.text);
    accumulators.usedOcr = accumulators.usedOcr || parsed.usedOcr;
    accumulators.coachPageHints = uniqueBy(
      [...accumulators.coachPageHints, ...parsed.coachPageHints],
      (item) => `${item.page}|${item.heading}|${item.excerpt}`
    );
    if (!accumulators.gymLayoutImageDataUrl) {
      const layout = await hooks.extractGymLayoutImageFromPdf(fetched.buffer);
      accumulators.gymLayoutImageDataUrl = layout.dataUrl;
      accumulators.gymLayoutPage = layout.page;
      accumulators.gymLayoutFacts = uniqueLines(
        [...accumulators.gymLayoutFacts, ...layout.facts],
        14
      );
      accumulators.gymLayoutZones = normalizeGymLayoutZones(layout.zones);
      if (layout.selection) {
        accumulators.gymLayoutSelection = layout.selection;
      }
    }
    return;
  }

  if (
    /image\/(png|jpe?g|webp)/i.test(fetched.contentType) ||
    /\.(png|jpe?g|webp)(\?|#|$)/i.test(assetUrl.pathname)
  ) {
    const imageText = await hooks.extractTextFromImage(fetched.buffer);
    accumulators.linkedChunks.push(imageText);
    accumulators.usedOcr = true;
    if (!accumulators.gymLayoutImageDataUrl && looksLikeGymLayoutText(imageText)) {
      accumulators.gymLayoutImageDataUrl = await hooks.toOptimizedImageDataUrl(fetched.buffer);
      accumulators.gymLayoutZones = await hooks.openAiExtractGymLayoutZones(
        fetched.buffer,
        fetched.contentType || "image/png"
      );
    }
    accumulators.gymLayoutFacts = uniqueLines(
      [...accumulators.gymLayoutFacts, ...extractHallFactsFromText(imageText)],
      14
    );
  }
}

function parseDataUrl(dataUrl: string): { mimeType: string; buffer: Buffer } | null {
  const match = dataUrl.match(/^data:([^;,]+);base64,([\s\S]*)$/);
  if (!match) return null;
  try {
    return {
      mimeType: match[1],
      buffer: Buffer.from(match[2], "base64"),
    };
  } catch {
    return null;
  }
}

export function buildDefaultGymMeetData() {
  return {
    category: "sport_gymnastics_schedule",
    createdVia: "meet-discovery",
    createdManually: false,
    templateId: "gymnastics-schedule",
    templateKey: "gymnastics",
    pageTemplateId: DEFAULT_GYM_MEET_TEMPLATE_ID,
    date: "",
    time: "",
    timezone: "America/Chicago",
    hostGym: "",
    venue: "",
    address: "",
    details: "",
    rsvpEnabled: false,
    accessControl: {
      mode: "public",
      requirePasscode: false,
      passcodeHint: "",
    },
    customFields: {
      team: "",
      season: "",
      coach: "",
      assistantCoach: "",
      coachPhone: "",
      advancedSections: {},
    },
    advancedSections: {
      roster: { enabled: true, showAttendance: true, athletes: [], showMedical: false },
      meet: {
        sessionNumber: "",
        warmUpTime: "",
        marchInTime: "",
        assignedGym: "",
        startApparatus: "",
        rotationOrder: [],
        judgingNotes: "",
        scoresLink: "",
        doorsOpen: "",
        arrivalGuidance: "",
        registrationInfo: "",
        facilityLayout: "",
        scoringInfo: "",
        resultsInfo: "",
        rotationSheetsInfo: "",
        awardsInfo: "",
        sessionWindows: [],
        operationalNotes: [],
        staffContacts: [],
      },
      practice: { enabled: true, blocks: [], excusedAthletes: [], modifiedTraining: [] },
      logistics: {
        enabled: false,
        showTransportation: true,
        showAccommodations: true,
        showFees: true,
        showMeals: true,
        showAdditionalDocuments: true,
        gymLayoutImage: "",
        gymLayoutLabel: "",
        travelMode: "",
        callTime: "",
        pickupWindow: "",
        hotelName: "",
        hotelAddress: "",
        hotelCheckIn: "",
        mealPlan: "",
        feeDueDate: "",
        feeAmount: "",
        rideShare: "",
        accessibility: "",
        parkingLinks: [],
        parkingPricingLinks: [],
        policyFood: "",
        policyHydration: "",
        policySafety: "",
        policyAnimals: "",
        additionalDocuments: [],
        venueContacts: [],
        venueContactNotes: [],
      },
      coaches: {
        enabled: false,
        signIn: "",
        attire: "",
        hospitality: "",
        floorAccess: "",
        scratches: "",
        floorMusic: "",
        rotationSheets: "",
        awards: "",
        regionalCommitment: "",
        qualification: "",
        meetFormat: "",
        equipment: "",
        refundPolicy: "",
        paymentInstructions: "",
        entryFees: [],
        teamFees: [],
        lateFees: [],
        deadlines: [],
        contacts: [],
        links: [],
        notes: [],
      },
      gear: {
        enabled: false,
        leotardOfDay: "",
        hairMakeupNotes: "",
        musicFileLink: "",
        items: [],
      },
      volunteers: {
        enabled: false,
        showVolunteerSlots: true,
        showCarpool: true,
        volunteerSlots: [],
        carpoolOffers: [],
        signupLink: "",
        notes: "",
      },
      announcements: { announcements: [] },
    },
    discoverySource: {},
  } as Record<string, any>;
}

export async function extractDiscoveryText(input: DiscoverySourceInput): Promise<ExtractionResult> {
  if (input.type === "file") {
    const parsed = parseDataUrl(input.dataUrl);
    if (!parsed) throw new Error("Invalid file payload");
    const mime = (parsed.mimeType || input.mimeType || "").toLowerCase();
    if (/pdf/.test(mime)) {
      const { text, usedOcr, coachPageHints, textQuality, qualitySignals } =
        await extractTextFromPdf(parsed.buffer);
      const gymLayout = await extractGymLayoutImageFromPdf(parsed.buffer);
      const combinedLayoutFacts = sanitizeVenueFactLines(
        [...gymLayout.facts, ...extractHallFactsFromText(text)],
        {
          mode: "strict",
          maxLines: 14,
          requireAnchor: true,
          excludePatterns: [
            /traffic|disney on ice|benchmark(?:\s+international)?\s+arena/i,
            /official results|live scoring|daylight savings/i,
          ],
        }
      );
      return {
        extractedText: text,
        extractionMeta: {
          sourceType: "file",
          usedOcr,
          linkedAssets: [],
          discoveredLinks: [],
          crawledPages: [],
          gymLayoutImageDataUrl: gymLayout.dataUrl || null,
          gymLayoutFacts: combinedLayoutFacts,
          gymLayoutZones: gymLayout.zones,
          gymLayoutPage: gymLayout.page,
          gymLayoutSelection: gymLayout.selection,
          coachPageHints,
          textQuality,
          qualitySignals,
        },
      };
    }
    if (/image\/(png|jpe?g|webp)/.test(mime)) {
      const text = await extractTextFromImage(parsed.buffer);
      const quality = analyzeTextQuality(text);
      const gymLayoutImageDataUrl = looksLikeGymLayoutText(text)
        ? await toOptimizedImageDataUrl(parsed.buffer)
        : null;
      const gymLayoutZones = gymLayoutImageDataUrl
        ? await openAiExtractGymLayoutZones(parsed.buffer, parsed.mimeType || "image/png")
        : [];
      const gymLayoutFacts = extractHallFactsFromText(text);
      return {
        extractedText: quality.cleanedText,
        extractionMeta: {
          sourceType: "file",
          usedOcr: true,
          linkedAssets: [],
          discoveredLinks: [],
          crawledPages: [],
          gymLayoutImageDataUrl: gymLayoutImageDataUrl || null,
          gymLayoutFacts,
          gymLayoutZones,
          gymLayoutPage: null,
          textQuality: quality.quality,
          qualitySignals: quality.signals,
        },
      };
    }
    throw new Error("Unsupported file type for discovery");
  }

  const url = new URL(input.url);
  const hooks = getUrlDiscoveryHooks();
  const page = await hooks.fetchWithLimit(url.toString());
  const html = page.text || page.buffer.toString("utf8");
  const readable = stripHtml(html);
  const metadata = extractMetadataText(html);
  const pageTitle = getPageTitle(html);
  const rootCandidates = collectDiscoveryCandidates(html, url, 0);
  const linkedChunks: string[] = [];
  const htmlChunks: string[] = [buildHtmlTextChunk(url.toString(), metadata, readable)];
  const linkedMeta: Array<{ url: string; contentType: string }> = [];
  const discoveredLinkMap = new Map<string, CrawlCandidate>();
  const crawledPages: CrawledPage[] = [{ url: url.toString(), title: pageTitle, depth: 0 }];
  const fetchedAssetUrls = new Set<string>();
  let usedOcr = false;
  let gymLayoutImageDataUrl: string | null = null;
  let gymLayoutPage: number | null = null;
  let gymLayoutFacts: string[] = [];
  let gymLayoutZones: GymLayoutZone[] = [];
  let gymLayoutSelection: GymLayoutSelectionDiagnostics | undefined = undefined;
  let coachPageHints: CoachPageHint[] = [];

  for (const candidate of rootCandidates) {
    upsertDiscoveredLink(discoveredLinkMap, candidate);
  }

  const accumulators = {
    linkedChunks,
    linkedMeta,
    usedOcr,
    gymLayoutImageDataUrl,
    gymLayoutPage,
    gymLayoutFacts,
    gymLayoutZones,
    gymLayoutSelection,
    coachPageHints,
  };

  const fetchAssetCandidate = async (candidate: CrawlCandidate) => {
    if (fetchedAssetUrls.has(candidate.url)) return;
    if (linkedMeta.length >= MAX_FETCHED_LINKED_ASSETS) return;
    try {
      const fetched = await hooks.fetchWithLimit(candidate.url);
      fetchedAssetUrls.add(candidate.url);
      upsertDiscoveredLink(discoveredLinkMap, {
        ...candidate,
        followed: true,
        contentType: fetched.contentType || null,
      });
      await appendFetchedAssetText(new URL(candidate.url), fetched, accumulators, hooks);
    } catch {
      // Best-effort linked assets.
    }
  };

  for (const asset of rootCandidates.filter((candidate) => candidate.kind === "asset")) {
    if (linkedMeta.length >= MAX_FETCHED_LINKED_ASSETS) break;
    await fetchAssetCandidate(asset);
  }

  for (const childPage of rootCandidates.filter((candidate) => candidate.kind === "html")) {
    if (crawledPages.length - 1 >= MAX_FOLLOWED_CHILD_PAGES) break;
    try {
      const fetched = await hooks.fetchWithLimit(childPage.url);
      upsertDiscoveredLink(discoveredLinkMap, {
        ...childPage,
        followed: true,
        contentType: fetched.contentType || null,
      });
      if (!/text\/html|text\/plain|application\/json|application\/ld\+json/i.test(fetched.contentType)) {
        if (isAssetUrl(childPage.url) || /pdf|image\//i.test(fetched.contentType)) {
          await appendFetchedAssetText(new URL(childPage.url), fetched, accumulators, hooks);
          fetchedAssetUrls.add(childPage.url);
        }
        continue;
      }

      const childHtml = fetched.text || fetched.buffer.toString("utf8");
      const childUrl = new URL(childPage.url);
      const childMetadata = extractMetadataText(childHtml);
      const childReadable = stripHtml(childHtml);
      const childTitle = getPageTitle(childHtml);
      crawledPages.push({ url: childPage.url, title: childTitle, depth: 1 });
      htmlChunks.push(buildHtmlTextChunk(childPage.url, childMetadata, childReadable));

      const childCandidates = collectDiscoveryCandidates(childHtml, childUrl, 1);
      for (const candidate of childCandidates) {
        upsertDiscoveredLink(discoveredLinkMap, candidate);
      }
      for (const asset of childCandidates.filter((candidate) => candidate.kind === "asset")) {
        if (linkedMeta.length >= MAX_FETCHED_LINKED_ASSETS) break;
        await fetchAssetCandidate(asset);
      }
    } catch {
      // Best-effort child pages.
    }
  }

  usedOcr = accumulators.usedOcr;
  gymLayoutImageDataUrl = accumulators.gymLayoutImageDataUrl;
  gymLayoutPage = accumulators.gymLayoutPage;
  gymLayoutFacts = accumulators.gymLayoutFacts;
  gymLayoutZones = accumulators.gymLayoutZones;
  gymLayoutSelection = accumulators.gymLayoutSelection;
  coachPageHints = accumulators.coachPageHints;

  const discoveredLinks = [...discoveredLinkMap.values()]
    .sort(compareDiscoveryCandidates)
    .slice(0, MAX_DISCOVERED_LINKS)
    .map(({ score: _score, ...item }) => item);

  const fullText = [...htmlChunks, ...linkedChunks]
    .filter(Boolean)
    .join("\n\n---\n\n")
    .trim();
  const quality = analyzeTextQuality(fullText);
  const mergedLayoutFacts = sanitizeVenueFactLines(
    [...gymLayoutFacts, ...extractHallFactsFromText(fullText)],
    {
      mode: "strict",
      maxLines: 14,
      requireAnchor: true,
      excludePatterns: [
        /traffic|disney on ice|benchmark(?:\s+international)?\s+arena/i,
        /official results|live scoring|daylight savings/i,
      ],
    }
  );

  return {
    extractedText: quality.cleanedText,
    extractionMeta: {
      sourceType: "url",
      usedOcr,
      linkedAssets: linkedMeta,
      discoveredLinks,
      crawledPages,
      pageTitle: pageTitle || "",
      gymLayoutImageDataUrl: gymLayoutImageDataUrl || null,
      gymLayoutFacts: mergedLayoutFacts,
      gymLayoutZones,
      gymLayoutPage,
      gymLayoutSelection,
      coachPageHints,
      textQuality: quality.quality,
      qualitySignals: quality.signals,
    },
  };
}

const OPENAI_SCHEMA_INSTRUCTIONS = `Return JSON only. Do not wrap in markdown. Follow this exact shape and key names:
{
  "eventType": "gymnastics_meet" | "unknown",
  "documentProfile": "athlete_session" | "parent_packet" | "registration_packet" | "meet_overview" | "unknown",
  "title": string,
  "dates": string,
  "startAt": string|null,
  "endAt": string|null,
  "timezone": string|null,
  "venue": string|null,
  "address": string|null,
  "hostGym": string|null,
  "admission": [{ "label": string, "price": string, "note": string|null }],
  "athlete": {
    "name": string|null, "level": string|null, "team": string|null, "session": string|null,
    "competitionDate": string|null, "stretchTime": string|null, "marchIn": string|null,
    "assignedGym": string|null, "awards": string|null
  },
  "meetDetails": {
    "warmup": string|null, "marchIn": string|null, "rotationOrder": string|null, "judgingNotes": string|null,
    "doorsOpen": string|null, "arrivalGuidance": string|null, "registrationInfo": string|null,
    "facilityLayout": string|null, "scoringInfo": string|null,
    "resultsInfo": string|null, "rotationSheetsInfo": string|null, "awardsInfo": string|null,
    "sessionWindows": [{ "date": string|null, "start": string|null, "end": string|null, "note": string|null }],
    "operationalNotes": [string]
  },
  "logistics": {
    "parking": string|null, "trafficAlerts": string|null, "hotel": string|null,
    "meals": string|null, "fees": string|null, "waivers": string|null,
    "rideShare": string|null, "accessibility": string|null,
    "parkingLinks": [{ "label": string, "url": string }],
    "parkingPricingLinks": [{ "label": string, "url": string }]
  },
  "policies": {
    "food": string|null, "hydration": string|null, "safety": string|null, "animals": string|null, "misc": [string]
  },
  "coachInfo": {
    "signIn": string|null,
    "attire": string|null,
    "hospitality": string|null,
    "floorAccess": string|null,
    "scratches": string|null,
    "floorMusic": string|null,
    "rotationSheets": string|null,
    "awards": string|null,
    "regionalCommitment": string|null,
    "qualification": string|null,
    "meetFormat": string|null,
    "equipment": string|null,
    "refundPolicy": string|null,
    "paymentInstructions": string|null,
    "entryFees": [{ "label": string, "amount": string, "note": string|null }],
    "teamFees": [{ "label": string, "amount": string, "note": string|null }],
    "lateFees": [{ "label": string, "amount": string, "trigger": string|null, "note": string|null }],
    "contacts": [{ "role": string, "name": string|null, "email": string|null, "phone": string|null }],
    "deadlines": [{ "label": string, "date": string|null, "note": string|null }],
    "links": [{ "label": string, "url": string }],
    "notes": [string]
  },
  "contacts": [{ "role": string, "name": string|null, "email": string|null, "phone": string|null }],
  "deadlines": [{ "label": string, "date": string|null, "note": string|null }],
  "gear": { "uniform": string|null, "checklist": [string] },
  "volunteers": { "signupLink": string|null, "notes": string|null },
  "communications": {
    "announcements": [{ "title": string, "body": string }],
    "passcode": string|null
  },
  "links": [{ "label": string, "url": string }],
  "unmappedFacts": [{ "category": string, "detail": string, "confidence": "high"|"medium"|"low" }]
}`;

function buildProfessionalParsePrompt(
  evidence: DiscoveryEvidence,
  sourceText: string,
  followup?: string
): string {
  const boundedText = cleanExtractedText(sourceText).slice(0, 120000);
  const evidenceJson = JSON.stringify(evidence, null, 2);
  return [
    OPENAI_SCHEMA_INSTRUCTIONS,
    "",
    "You are a senior event-data extraction specialist for gymnastics meet documents.",
    "",
    "## Task",
    "Extract all relevant data into one JSON object that matches the required schema.",
    "Use two internal steps before producing output:",
    "- Step A: classify `documentProfile`.",
    "- Step B: populate all other fields with maximum factual recall.",
    "",
    "## Source Priority (resolve conflicts in this order)",
    "1) Evidence JSON candidates/snippets (primary grounding source).",
    "2) Source text (resolve ambiguity and fill gaps not covered by candidates).",
    "3) If absent from both, use null for scalars or [] for arrays. Never invent.",
    "",
    "## Conflict Resolution",
    "When candidates conflict, prefer the most specific and internally consistent value. Source text is the tiebreaker.",
    "",
    "## Document-Type Extraction Focus",
    "- `parent_packet`: doors/arrival, facility layout, parking/traffic, visitor policies.",
    "- `registration_packet`: entry fees, qualification criteria, deadlines, refund/late-fee rules, organizer contacts.",
    "- `athlete_session`: warmup schedule, march-in, session windows, rotation order/apparatus, awards, assigned gym.",
    "- Documents may be mixed packets. Use `documentProfile` only as the coarse primary label; still extract both public and coach-only sections when present.",
    "- `coachInfo`: sign-in, attire, hospitality, scratches, floor-access rules, rotation-sheet instructions, regional commitment steps, payment/refund/qualification rules, and coach/admin contacts.",
    "",
    "## Field-Level Rules",
    "- `rotationOrder`: populate ONLY when the source explicitly lists an apparatus/rotation sequence.",
    "- Narrative references to rotation sheets are NOT a sequence; set `rotationOrder` to null and keep narrative in operational notes.",
    "- For `dates`, preserve meet ranges exactly when present (example: `March 6-8, 2026`).",
    "- Never use update/revision stamps (e.g., `Updated February 23, 2026`) as meet date values.",
    "- Never use posted timestamps (for example `Posted 3/4/26`) as meet date values.",
    "- Never use traffic windows or unrelated schedule snippets as primary meet dates.",
    "- Never place late-fee dates, refund deadlines, or entry deadlines in `dates`, `startAt`, or `endAt`.",
    "- URLs must be absolute (https://...) whenever possible.",
    "- Strings must be short and factual. No meta commentary.",
    "- Use only explicitly visible/source-grounded facts. No paraphrase or inferred venue details.",
    "- For `meetDetails.operationalNotes`, each item must be a complete sentence or complete standalone label.",
    "- `meetDetails.operationalNotes`: maximum 6 items, deduplicated, concise, readable, and non-overlapping with dedicated fields.",
    "- `athlete.awards`: only explicit awards location/time when shown; otherwise null.",
    "- Keep traffic/parking/general travel guidance in logistics fields, not awards/facility-specific fields.",
    "- Do not output fragmented line-wrap artifacts (for example avoid splitting one sentence into multiple array items).",
    "- If evidence includes coach-page hints, treat them as a strong signal to populate `coachInfo`.",
    "- Put coach-only operational instructions in `coachInfo` before using generic `contacts`, `deadlines`, or `unmappedFacts`.",
    "- Route public spectator pricing ONLY into `admission`.",
    "- Do not repeat public meet dates inside `meetDetails.operationalNotes`; dates belong in `dates` only.",
    "- Do not repeat public admission pricing inside `meetDetails.operationalNotes`; pricing belongs in `admission` only.",
    "- Do not place public admission pass labels or ticket notes in `meetDetails.operationalNotes` (examples: `Day Pass`, `All Session Pass`, `Adult`, `Child`, `Children 5 and under`, `Cash only`, `Credit card`).",
    "- If a line is about spectator tickets, pass types, admission prices, or who gets in free, route it ONLY to `admission` and keep it out of `meetDetails.operationalNotes`.",
    "- Route club/coach registration fees, team fees, late fees, payment rules, refunds, qualification, meet format, equipment notes, and coach operations into `coachInfo`.",
    "- Never place coach entry fees or team fees into public `admission`.",
    "- Keep parking maps/rates in `logistics.parkingLinks` or `logistics.parkingPricingLinks`.",
    "- Put public results/live scoring text in `meetDetails.resultsInfo`; put coach-only rotation-sheet procedures in `coachInfo.rotationSheets` or `meetDetails.rotationSheetsInfo` only when they are public-facing.",
    "- `coachInfo.attire` should be one concise string. Use `coachInfo.notes` for extra bullet-like coach notes.",
    "- `gear.uniform` and `gear.checklist` are ONLY for true athlete gear, uniform, hair, or equipment-prep items.",
    "- Never place venue temperature notes, admission reminders, ticket policy, athlete cards, score-recording notes, results websites, sponsor copy, or general operational reminders in `gear`.",
    "- Pages dominated by session labels, stretch/warmup times, and repeated club names are schedule grids, not public prose.",
    "- Do not convert session grids, club participation tables, or repeated club-name lists into `meetDetails.operationalNotes`, `gear`, `communications.announcements`, or `unmappedFacts`.",
    "- Venue comfort notes (for example temperature/chilly reminders) belong with venue details, not `gear`.",
    "- Athlete card or scorecard-memento notes belong in `meetDetails.operationalNotes`, not `gear`.",
    "- For `communications.announcements`, include ONLY true transient updates or cross-cutting alerts that a user would reasonably expect in an announcements module.",
    "- Do NOT place venue phone numbers, facility contacts, meet staff contacts, admission pricing/policies, arrival guidance, registration instructions, results, rotation sheets, awards, sponsor blurbs, club-participation lists, or document-version notes in `communications.announcements`.",
    "- Do not prefix leftover facts with category labels inside announcement text (examples to avoid: `venue_contact ...`, `marketing ...`, `document_version ...`).",
    "- For `communications.announcements`, use a short `title` when obvious and keep the `body` as the explanatory sentence only.",
    "- Never repeat the title words at the beginning of `communications.announcements[].body`.",
    "",
    "## No Fact Left Behind",
    "Any fact that does not map to a primary field must be placed in one of:",
    "`meetDetails.operationalNotes` | `policies.misc` | `deadlines` | `contacts` | `unmappedFacts`.",
    "",
    "## Output Format",
    "Return JSON only. No preamble, explanation, or markdown wrapping.",
    "",
    "Evidence JSON:",
    evidenceJson,
    "",
    "Source text:",
    boundedText,
    "",
    followup || "",
  ]
    .filter(Boolean)
    .join("\n");
}

function normalizeParseResult(value: any): ParseResult | null {
  if (!value || typeof value !== "object") return null;
  const eventType = value.eventType === "gymnastics_meet" ? "gymnastics_meet" : "unknown";
  const documentProfile =
    value.documentProfile === "athlete_session" ||
    value.documentProfile === "parent_packet" ||
    value.documentProfile === "registration_packet" ||
    value.documentProfile === "meet_overview"
      ? value.documentProfile
      : "unknown";
  const title = safeString(value.title);
  const dates = safeString(value.dates);
  return {
    eventType,
    documentProfile,
    title,
    dates,
    startAt: toIsoOrNull(value.startAt),
    endAt: toIsoOrNull(value.endAt),
    timezone: safeString(value.timezone) || null,
    venue: safeString(value.venue) || null,
    address: safeString(value.address) || null,
    hostGym: safeString(value.hostGym) || null,
    admission: pickArray(value.admission).map((item) => ({
      label: safeString(item?.label),
      price: safeString(item?.price),
      note: safeString(item?.note) || null,
    })),
    athlete: {
      name: safeString(value.athlete?.name) || null,
      level: safeString(value.athlete?.level) || null,
      team: safeString(value.athlete?.team) || null,
      session: safeString(value.athlete?.session) || null,
      competitionDate: safeString(value.athlete?.competitionDate) || null,
      stretchTime: safeString(value.athlete?.stretchTime) || null,
      marchIn: safeString(value.athlete?.marchIn) || null,
      assignedGym: safeString(value.athlete?.assignedGym) || null,
      awards: safeString(value.athlete?.awards) || null,
    },
    meetDetails: {
      warmup: safeString(value.meetDetails?.warmup) || null,
      marchIn: safeString(value.meetDetails?.marchIn) || null,
      rotationOrder: safeString(value.meetDetails?.rotationOrder) || null,
      judgingNotes: safeString(value.meetDetails?.judgingNotes) || null,
      doorsOpen: safeString(value.meetDetails?.doorsOpen) || null,
      arrivalGuidance: safeString(value.meetDetails?.arrivalGuidance) || null,
      registrationInfo: safeString(value.meetDetails?.registrationInfo) || null,
      facilityLayout: safeString(value.meetDetails?.facilityLayout) || null,
      scoringInfo: safeString(value.meetDetails?.scoringInfo) || null,
      resultsInfo: safeString(value.meetDetails?.resultsInfo) || null,
      rotationSheetsInfo: safeString(value.meetDetails?.rotationSheetsInfo) || null,
      awardsInfo: safeString(value.meetDetails?.awardsInfo) || null,
      sessionWindows: pickArray(value.meetDetails?.sessionWindows)
        .map((item) => ({
          date: safeString(item?.date) || null,
          start: safeString(item?.start) || null,
          end: safeString(item?.end) || null,
          note: safeString(item?.note) || null,
        }))
        .filter((item) => item.date || item.start || item.end || item.note),
      operationalNotes: pickArray(value.meetDetails?.operationalNotes)
        .map((item) => safeString(item))
        .filter(Boolean),
    },
    logistics: {
      parking: safeString(value.logistics?.parking) || null,
      trafficAlerts: safeString(value.logistics?.trafficAlerts) || null,
      hotel: safeString(value.logistics?.hotel) || null,
      meals: safeString(value.logistics?.meals) || null,
      fees: safeString(value.logistics?.fees) || null,
      waivers: safeString(value.logistics?.waivers) || null,
      rideShare: safeString(value.logistics?.rideShare) || null,
      accessibility: safeString(value.logistics?.accessibility) || null,
      parkingLinks: uniqueBy(
        pickArray(value.logistics?.parkingLinks)
          .map((item) => ({
            label: safeString(item?.label) || "Parking link",
            url: normalizeUrl(item?.url),
          }))
          .filter((item) => item.url),
        (item) => item.url
      ),
      parkingPricingLinks: uniqueBy(
        pickArray(value.logistics?.parkingPricingLinks)
          .map((item) => ({
            label: safeString(item?.label) || "Parking pricing",
            url: normalizeUrl(item?.url),
          }))
          .filter((item) => item.url),
        (item) => item.url
      ),
    },
    policies: {
      food: safeString(value.policies?.food) || null,
      hydration: safeString(value.policies?.hydration) || null,
      safety: safeString(value.policies?.safety) || null,
      animals: safeString(value.policies?.animals) || null,
      misc: pickArray(value.policies?.misc).map((item) => safeString(item)).filter(Boolean),
    },
    coachInfo: {
      signIn: safeString(value.coachInfo?.signIn) || null,
      attire:
        safeString(value.coachInfo?.attire) ||
        uniqueBy(
          pickArray(value.coachInfo?.attire).map((item) => safeString(item)).filter(Boolean),
          (item) => item
        ).join("\n") ||
        null,
      hospitality: safeString(value.coachInfo?.hospitality) || null,
      floorAccess: safeString(value.coachInfo?.floorAccess) || null,
      scratches: safeString(value.coachInfo?.scratches) || null,
      floorMusic: safeString(value.coachInfo?.floorMusic) || null,
      rotationSheets: safeString(value.coachInfo?.rotationSheets) || null,
      awards: safeString(value.coachInfo?.awards) || null,
      regionalCommitment: safeString(value.coachInfo?.regionalCommitment) || null,
      qualification: safeString(value.coachInfo?.qualification) || null,
      meetFormat: safeString(value.coachInfo?.meetFormat) || null,
      equipment: safeString(value.coachInfo?.equipment) || null,
      refundPolicy: safeString(value.coachInfo?.refundPolicy) || null,
      paymentInstructions: safeString(value.coachInfo?.paymentInstructions) || null,
      entryFees: uniqueBy(
        pickArray(value.coachInfo?.entryFees)
          .map((item) => ({
            label: safeString(item?.label) || "Entry fee",
            amount: safeString(item?.amount || item?.price),
            note: safeString(item?.note) || null,
          }))
          .filter((item) => item.label || item.amount || item.note),
        (item) => [item.label, item.amount, item.note || ""].join("|")
      ),
      teamFees: uniqueBy(
        pickArray(value.coachInfo?.teamFees)
          .map((item) => ({
            label: safeString(item?.label) || "Team fee",
            amount: safeString(item?.amount || item?.price),
            note: safeString(item?.note) || null,
          }))
          .filter((item) => item.label || item.amount || item.note),
        (item) => [item.label, item.amount, item.note || ""].join("|")
      ),
      lateFees: uniqueBy(
        pickArray(value.coachInfo?.lateFees)
          .map((item) => ({
            label: safeString(item?.label) || "Late fee",
            amount: safeString(item?.amount || item?.price),
            trigger: safeString(item?.trigger) || null,
            note: safeString(item?.note) || null,
          }))
          .filter((item) => item.label || item.amount || item.trigger || item.note),
        (item) => [item.label, item.amount, item.trigger || "", item.note || ""].join("|")
      ),
      contacts: uniqueBy(
        pickArray(value.coachInfo?.contacts)
          .map((item) => ({
            role: safeString(item?.role) || "Coach contact",
            name: safeString(item?.name) || null,
            email: safeString(item?.email) || null,
            phone: safeString(item?.phone) || null,
          }))
          .filter((item) => item.name || item.email || item.phone),
        (item) => [item.role, item.name || "", item.email || "", item.phone || ""].join("|")
      ),
      deadlines: uniqueBy(
        pickArray(value.coachInfo?.deadlines)
          .map((item) => ({
            label: safeString(item?.label) || "Coach deadline",
            date: safeString(item?.date) || null,
            note: safeString(item?.note) || null,
          }))
          .filter((item) => item.date || item.note || item.label !== "Coach deadline"),
        (item) => [item.label, item.date || "", item.note || ""].join("|")
      ),
      links: uniqueBy(
        pickArray(value.coachInfo?.links)
          .map((item) => ({
            label: safeString(item?.label) || "Coach link",
            url: normalizeUrl(item?.url),
          }))
          .filter((item) => item.url),
        (item) => item.url
      ),
      notes: uniqueBy(
        pickArray(value.coachInfo?.notes).map((item) => safeString(item)).filter(Boolean),
        (item) => item
      ),
    },
    contacts: uniqueBy(
      pickArray(value.contacts)
        .map((item) => ({
          role: safeString(item?.role) || "Contact",
          name: safeString(item?.name) || null,
          email: safeString(item?.email) || null,
          phone: safeString(item?.phone) || null,
        }))
        .filter((item) => item.name || item.email || item.phone),
      (item) => [item.role, item.name || "", item.email || "", item.phone || ""].join("|")
    ),
    deadlines: uniqueBy(
      pickArray(value.deadlines)
        .map((item) => ({
          label: safeString(item?.label) || "Deadline",
          date: safeString(item?.date) || null,
          note: safeString(item?.note) || null,
        }))
        .filter((item) => item.label || item.date || item.note),
      (item) => [item.label, item.date || "", item.note || ""].join("|")
    ),
    unmappedFacts: pickArray(value.unmappedFacts)
      .map((item) => ({
        category: safeString(item?.category) || "general",
        detail: safeString(item?.detail),
        confidence:
          item?.confidence === "high" || item?.confidence === "medium" || item?.confidence === "low"
            ? item.confidence
            : ("medium" as const),
      }))
      .filter((item) => item.detail),
    links: uniqueBy(
      pickArray(value.links)
        .map((item) => ({
          label: safeString(item?.label) || "Reference link",
          url: normalizeUrl(item?.url),
        }))
        .filter((item) => item.url),
      (item) => item.url
    ),
    gear: {
      uniform: safeString(value.gear?.uniform) || null,
      checklist: uniqueBy(
        pickArray(value.gear?.checklist).map((item) => safeString(item)).filter(Boolean),
        (item) => item
      ),
    },
    volunteers: {
      signupLink: safeString(value.volunteers?.signupLink) || null,
      notes: safeString(value.volunteers?.notes) || null,
    },
    communications: {
      announcements: pickArray(value.communications?.announcements)
        .map((item) => ({ title: safeString(item?.title), body: safeString(item?.body) }))
        .filter((item) => item.title || item.body),
      passcode: safeString(value.communications?.passcode) || null,
    },
  };
}

function sanitizeDiscoveryParseResult(value: ParseResult): ParseResult {
  const next: ParseResult = {
    ...value,
    meetDetails: {
      ...value.meetDetails,
      operationalNotes: [...pickArray(value.meetDetails?.operationalNotes)],
    },
    gear: {
      ...value.gear,
      checklist: [...pickArray(value.gear?.checklist)],
    },
    unmappedFacts: pickArray(value.unmappedFacts).map((item) => ({
      category: safeString(item?.category) || "general",
      detail: safeString(item?.detail),
      confidence:
        item?.confidence === "high" || item?.confidence === "low" ? item.confidence : "medium",
    })),
  };

  const nextFacts = [...next.unmappedFacts];
  const routeRejectedFact = (line: string) => {
    const text = safeString(line);
    if (!text) return;
    if (isMarketingLikeText(text) || isScheduleGridLikeText(text) || isClubParticipationLikeText(text)) {
      return;
    }
    if (VENUE_DETAIL_TEXT_PATTERN.test(text)) {
      appendUnmappedFact(nextFacts, "venue_detail", text);
      return;
    }
    if (isAdmissionAnnouncementText(text)) {
      appendUnmappedFact(nextFacts, "admission_policy", text);
      return;
    }
    if (MEET_DETAIL_REROUTE_TEXT_PATTERN.test(text)) {
      appendUnmappedFact(nextFacts, "meet_detail", text);
    }
  };

  next.meetDetails.operationalNotes = uniqueBy(
    next.meetDetails.operationalNotes
      .map((item) => safeString(item))
      .filter(Boolean)
      .filter((item) => {
        if (isMarketingLikeText(item) || isScheduleGridLikeText(item) || isClubParticipationLikeText(item)) {
          return false;
        }
        if (VENUE_DETAIL_TEXT_PATTERN.test(item) || isAdmissionAnnouncementText(item)) {
          routeRejectedFact(item);
          return false;
        }
        return true;
      }),
    (item) => item
  );

  const gearUniform = safeString(next.gear.uniform);
  next.gear.uniform = gearUniform && isTrueGearLikeText(gearUniform) ? gearUniform : null;
  if (gearUniform && !next.gear.uniform) {
    routeRejectedFact(gearUniform);
  }

  next.gear.checklist = uniqueBy(
    next.gear.checklist
      .map((item) => safeString(item))
      .filter(Boolean)
      .filter((item) => {
        if (isTrueGearLikeText(item)) return true;
        routeRejectedFact(item);
        return false;
      }),
    (item) => item
  );

  next.unmappedFacts = uniqueBy(
    nextFacts.filter((item) => {
      const category = safeString(item?.category).toLowerCase();
      const detail = safeString(item?.detail);
      if (!detail) return false;
      if (SUPPRESSED_UNMAPPED_FACT_CATEGORIES.has(category)) return false;
      if (isMarketingLikeText(detail)) return false;
      if (isScheduleGridLikeText(detail) || isClubParticipationLikeText(detail)) return false;
      return true;
    }),
    (item) => `${safeString(item?.category)}|${safeString(item?.detail)}`
  );

  return next;
}

function mergeCoachFeesFromAdmission(parseResult: ParseResult): ParseResult {
  const spectatorAdmission: ParseResult["admission"] = [];
  const entryFees = [...parseResult.coachInfo.entryFees];
  const teamFees = [...parseResult.coachInfo.teamFees];
  const lateFees = [...parseResult.coachInfo.lateFees];

  for (const item of parseResult.admission) {
    const bucket = inferCoachFeeBucket(item);
    if (!isSpectatorAdmissionLabel(item.label) && bucket) {
      if (bucket === "entry") {
        entryFees.push({
          label: item.label || "Entry fee",
          amount: item.price,
          note: item.note || null,
        });
      } else if (bucket === "team") {
        teamFees.push({
          label: item.label || "Team fee",
          amount: item.price,
          note: item.note || null,
        });
      } else if (bucket === "late") {
        lateFees.push({
          label: item.label || "Late fee",
          amount: item.price,
          trigger: item.note || null,
          note: item.note || null,
        });
      }
      continue;
    }
    spectatorAdmission.push(item);
  }

  return {
    ...parseResult,
    admission: uniqueBy(spectatorAdmission, (item) =>
      [item.label, item.price, item.note || ""].join("|")
    ),
    coachInfo: {
      ...parseResult.coachInfo,
      entryFees: uniqueBy(entryFees, (item) => [item.label, item.amount, item.note || ""].join("|")),
      teamFees: uniqueBy(teamFees, (item) => [item.label, item.amount, item.note || ""].join("|")),
      lateFees: uniqueBy(lateFees, (item) =>
        [item.label, item.amount, item.trigger || "", item.note || ""].join("|")
      ),
    },
  };
}

function routeCoachDeadlines(parseResult: ParseResult): ParseResult {
  const publicDeadlines: ParseResult["deadlines"] = [];
  const coachDeadlines = [...parseResult.coachInfo.deadlines];
  for (const item of parseResult.deadlines) {
    const haystack = `${item.label} ${item.note || ""}`;
    if (/(entry|registration|deadline|late fee|refund|regional|qualification|payment|meet maker|reservation)/i.test(haystack)) {
      coachDeadlines.push(item);
      continue;
    }
    publicDeadlines.push(item);
  }
  return {
    ...parseResult,
    deadlines: uniqueBy(publicDeadlines, (item) => [item.label, item.date || "", item.note || ""].join("|")),
    coachInfo: {
      ...parseResult.coachInfo,
      deadlines: uniqueBy(coachDeadlines, (item) => [item.label, item.date || "", item.note || ""].join("|")),
    },
  };
}

function reconcileParsedDates(parseResult: ParseResult, extractedText: string): ParseResult {
  const dateAnalysis = classifyMeetDateCandidates(extractedText);
  const primary = dateAnalysis.primary;
  const currentRange = deriveDateRangeFromText(parseResult.dates);
  const currentLabel = safeString(parseResult.dates);
  const currentLooksAdministrative =
    /\b(updated|posted|deadline|late fee|refund|entry|page\s+\d+\s+of\s+\d+)\b/i.test(currentLabel);
  const shouldReplaceDates =
    Boolean(primary) &&
    (currentLooksAdministrative ||
      !currentRange.startDate ||
      !currentLabel ||
      (primary &&
        currentRange.startDate &&
        primary.startDate &&
        currentRange.startDate !== primary.startDate &&
        primary.score >= 4));

  if (!primary || !shouldReplaceDates) {
    return parseResult;
  }

  const preserveIsoTime = (iso: string | null, nextDate: string | null) => {
    if (!iso || !nextDate) return iso;
    const match = iso.match(/T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/);
    if (!match) return `${nextDate}T00:00:00.000Z`;
    return `${nextDate}${match[0]}`;
  };

  const nextStartAt =
    !parseResult.startAt ||
    !isDateWithinRange(parseResult.startAt.slice(0, 10), primary.startDate, primary.endDate)
      ? preserveIsoTime(parseResult.startAt, primary.startDate)
      : parseResult.startAt;
  const nextEndAt =
    !parseResult.endAt ||
    !isDateWithinRange(parseResult.endAt.slice(0, 10), primary.startDate, primary.endDate)
      ? preserveIsoTime(parseResult.endAt, primary.endDate || primary.startDate)
      : parseResult.endAt;

  return {
    ...parseResult,
    dates: primary.label,
    startAt: nextStartAt,
    endAt: nextEndAt,
  };
}

function extractJsonObject(text: string): any | null {
  const parseWithRepairs = (input: string): any | null => {
    try {
      return JSON.parse(input);
    } catch {
      // Repair invalid escape sequences that occasionally appear in model output.
      const repaired = input
        // Keep valid JSON escapes; double-escape unknown ones.
        .replace(/\\(?!["\\/bfnrtu])/g, "\\\\")
        // Convert malformed unicode escapes like \u{1F600} or \u12 into literal \u...
        .replace(/\\u(?![0-9a-fA-F]{4})/g, "\\\\u");
      try {
        return JSON.parse(repaired);
      } catch {
        return null;
      }
    }
  };

  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return parseWithRepairs(text.slice(start, end + 1));
    }
    return parseWithRepairs(text);
  }
}

function buildEmptyParseResult(): ParseResult {
  return {
    eventType: "unknown",
    documentProfile: "unknown",
    title: "",
    dates: "",
    startAt: null,
    endAt: null,
    timezone: null,
    venue: null,
    address: null,
    hostGym: null,
    admission: [],
    athlete: {
      name: null,
      level: null,
      team: null,
      session: null,
      competitionDate: null,
      stretchTime: null,
      marchIn: null,
      assignedGym: null,
      awards: null,
    },
    meetDetails: {
      warmup: null,
      marchIn: null,
      rotationOrder: null,
      judgingNotes: null,
      doorsOpen: null,
      arrivalGuidance: null,
      registrationInfo: null,
      facilityLayout: null,
      scoringInfo: null,
      resultsInfo: null,
      rotationSheetsInfo: null,
      awardsInfo: null,
      sessionWindows: [],
      operationalNotes: [],
    },
    logistics: {
      parking: null,
      trafficAlerts: null,
      hotel: null,
      meals: null,
      fees: null,
      waivers: null,
      rideShare: null,
      accessibility: null,
      parkingLinks: [],
      parkingPricingLinks: [],
    },
    policies: {
      food: null,
      hydration: null,
      safety: null,
      animals: null,
      misc: [],
    },
    coachInfo: {
      signIn: null,
      attire: null,
      hospitality: null,
      floorAccess: null,
      scratches: null,
      floorMusic: null,
      rotationSheets: null,
      awards: null,
      regionalCommitment: null,
      qualification: null,
      meetFormat: null,
      equipment: null,
      refundPolicy: null,
      paymentInstructions: null,
      entryFees: [],
      teamFees: [],
      lateFees: [],
      contacts: [],
      deadlines: [],
      links: [],
      notes: [],
    },
    contacts: [],
    deadlines: [],
    gear: {
      uniform: null,
      checklist: [],
    },
    volunteers: {
      signupLink: null,
      notes: null,
    },
    communications: {
      announcements: [],
      passcode: null,
    },
    links: [],
    unmappedFacts: [],
  };
}

async function callOpenAiParse(
  text: string,
  evidence: DiscoveryEvidence,
  followup?: string
): Promise<{ result: ParseResult | null; raw: string }> {
  const apiKey = process.env.OPENAI_API_KEY || "";
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");
  const client = new OpenAI({ apiKey });
  const sanitizedText = text.replace(/\u0000/g, " ").replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F]/g, " ");
  const prompt = buildProfessionalParsePrompt(evidence, sanitizedText, followup);
  const completion = await client.chat.completions.create({
    model: process.env.OPENAI_OCR_MODEL || process.env.LLM_MODEL || "gpt-5.1",
    temperature: 0,
    messages: [
      {
        role: "system",
        content:
          "You extract structured gymnastics meet data from source text. Return only strict JSON.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  });
  const raw = completion.choices?.[0]?.message?.content || "";
  const parsed = normalizeParseResult(extractJsonObject(raw));
  return { result: parsed, raw };
}

async function callGeminiParse(
  text: string,
  evidence: DiscoveryEvidence
): Promise<{ result: ParseResult | null; raw: string }> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || "";
  if (!apiKey) throw new Error("Gemini API key is not configured");
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    process.env.GEMINI_MODEL || "gemini-1.5-flash"
  )}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      generationConfig: {
        temperature: 0,
        responseMimeType: "application/json",
      },
      contents: [
        {
          role: "user",
          parts: [{ text: buildProfessionalParsePrompt(evidence, text) }],
        },
      ],
    }),
  });
  if (!response.ok) {
    throw new Error(`Gemini request failed (${response.status})`);
  }
  const json = await response.json();
  const raw = safeString(json?.candidates?.[0]?.content?.parts?.[0]?.text);
  const parsed = normalizeParseResult(extractJsonObject(raw));
  return { result: parsed, raw };
}

export async function parseMeetFromExtractedText(
  extractedText: string,
  extractionMeta: ExtractionResult["extractionMeta"]
): Promise<{
  parseResult: ParseResult;
  modelUsed: "openai" | "gemini" | "quality-gate";
  rawModelOutput: string;
  evidence: DiscoveryEvidence;
}> {
  const evidence = buildDiscoveryEvidence(extractedText, extractionMeta);
  const finalizeParseResult = (value: ParseResult): ParseResult => {
    const sanitized = sanitizeDiscoveryParseResult(value);
    const withCoachRouting = routeCoachDeadlines(mergeCoachFeesFromAdmission(sanitized));
    return reconcileParsedDates(withCoachRouting, extractedText);
  };
  if (extractionMeta.textQuality === "poor") {
    return {
      parseResult: buildEmptyParseResult(),
      modelUsed: "quality-gate",
      rawModelOutput: JSON.stringify({
        skipped: true,
        reason: "poor_extraction_quality",
        qualitySignals: extractionMeta.qualitySignals || null,
      }),
      evidence,
    };
  }
  let openAiRaw = "";
  let openAiErrorMessage = "";
  try {
    const first = await callOpenAiParse(extractedText, evidence);
    openAiRaw = first.raw;
    if (first.result) {
      return {
        parseResult: finalizeParseResult(first.result),
        modelUsed: "openai",
        rawModelOutput: first.raw,
        evidence,
      };
    }
    const second = await callOpenAiParse(
      extractedText,
      evidence,
      `Your previous output was invalid. Fix and return valid strict JSON only. Previous output:\n${first.raw}`
    );
    openAiRaw = second.raw;
    if (second.result) {
      return {
        parseResult: finalizeParseResult(second.result),
        modelUsed: "openai",
        rawModelOutput: second.raw,
        evidence,
      };
    }
    openAiErrorMessage = "OpenAI returned invalid JSON twice.";
  } catch (err: any) {
    openAiErrorMessage = String(err?.message || "OpenAI parse failed.");
  }
  const hasGeminiKey = Boolean(
    safeString(process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY)
  );
  if (!hasGeminiKey) {
    throw new Error(
      openAiErrorMessage ||
        "OpenAI parsing failed and Gemini fallback is not configured. Set GEMINI_API_KEY to enable fallback."
    );
  }
  const gemini = await callGeminiParse(extractedText, evidence);
  if (!gemini.result) {
    throw new Error("Gemini returned invalid JSON");
  }
  return {
    parseResult: finalizeParseResult(gemini.result),
    modelUsed: "gemini",
    rawModelOutput: gemini.raw || openAiRaw,
    evidence,
  };
}

function splitDateTime(iso: string | null): { date: string; time: string } {
  if (!iso) return { date: "", time: "" };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { date: "", time: "" };
  return {
    date: d.toISOString().slice(0, 10),
    time: d.toISOString().slice(11, 16),
  };
}

function isDateWithinRange(
  value: string,
  start: string | null,
  end: string | null
): boolean {
  const target = safeString(value);
  const lower = safeString(start);
  const upper = safeString(end || start);
  if (!target || !lower || !upper) return false;
  return target >= lower && target <= upper;
}

export async function mapParseResultToGymData(
  parseResult: ParseResult,
  baseData: any = {},
  extractionMeta?: ExtractionResult["extractionMeta"]
) {
  parseResult = sanitizeDiscoveryParseResult(parseResult);
  const resolvedPageTemplateId =
    resolveGymMeetTemplateId(baseData) || DEFAULT_GYM_MEET_TEMPLATE_ID;
  const { date, time } = splitDateTime(parseResult.startAt);
  const derivedRange = deriveDateRangeFromText(parseResult.dates);
  const hasDateConflictWithRange =
    Boolean(date) &&
    Boolean(derivedRange.startDate) &&
    !isDateWithinRange(date, derivedRange.startDate, derivedRange.endDate);
  const authoritativeDate = hasDateConflictWithRange
    ? derivedRange.startDate || ""
    : date;
  const existingAdvanced = (baseData?.advancedSections as Record<string, any>) || {};
  const layoutFacts = uniqueLines(
    sanitizeVenueFactLines(
      pickArray(extractionMeta?.gymLayoutFacts)
        .map((item) => safeString(item))
        .filter(Boolean),
      {
        mode: "strict",
        maxLines: 14,
        requireAnchor: true,
        excludePatterns: [
          /traffic|disney on ice|benchmark(?:\s+international)?\s+arena/i,
          /official results|live scoring|daylight savings/i,
        ],
      }
    ),
    14
  );
  const assignedGym = safeString(
    parseResult.athlete.assignedGym || existingAdvanced.meet?.assignedGym || ""
  );
  const extractionLayoutImage = safeString(extractionMeta?.gymLayoutImageDataUrl);
  const extractionLayoutZones = normalizeGymLayoutZones(extractionMeta?.gymLayoutZones);
  const assignedGymLayoutImage =
    assignedGym && extractionLayoutImage
      ? await cropGymLayoutImageToAssignedGym(
          extractionLayoutImage,
          extractionLayoutZones,
          assignedGym
        )
      : null;
  const resolvedGymLayoutImage =
    safeString(assignedGymLayoutImage) ||
    extractionLayoutImage ||
    safeString(existingAdvanced.logistics?.gymLayoutImage) ||
    "";
  const resolvedGymLayoutLabel = assignedGym
    ? `Assigned gym location: ${assignedGym}`
    : "";
  const rotationSource = safeString(parseResult.meetDetails.rotationOrder);
  const hasRotationNarrative = /(rotation sheets?|hard cop(y|ies)|download|website|refresh)/i.test(
    rotationSource
  );
  const hasApparatusSignal =
    /(vault|bars|beam|floor|pommel|rings|parallel|high bar|p[-\s]?bars|fx)/i.test(rotationSource);
  const parsedRotationOrder = hasRotationNarrative
    ? []
    : rotationSource
        .split(/[>,|/]+/)
        .map((item) => item.trim())
        .filter(Boolean);
  const rotationOrder = hasApparatusSignal ? parsedRotationOrder : [];
  const rotationNarrative = rotationOrder.length === 0 ? rotationSource : "";
  const dedicatedFieldValues = [
    safeString(parseResult.meetDetails.doorsOpen),
    safeString(parseResult.meetDetails.arrivalGuidance),
    safeString(parseResult.meetDetails.registrationInfo),
    safeString(parseResult.meetDetails.facilityLayout),
    safeString(parseResult.meetDetails.scoringInfo),
    safeString(parseResult.meetDetails.resultsInfo),
    safeString(parseResult.meetDetails.rotationSheetsInfo),
    safeString(parseResult.meetDetails.awardsInfo),
  ].filter(Boolean);
  const dedicatedFieldKeys = new Set(
    dedicatedFieldValues
      .map((item) => normalizeVenueFactForCompare(item))
      .filter(Boolean)
  );
  const operationalNotesRaw = uniqueBy(
    [
      ...parseResult.meetDetails.operationalNotes,
      rotationNarrative,
      ...layoutFacts,
    ].filter(Boolean),
    (item) => normalizeVenueFactForCompare(item)
  );
  const operationalNotes = operationalNotesRaw
    .filter((item) => {
      const key = normalizeVenueFactForCompare(item);
      if (!key) return false;
      if (dedicatedFieldKeys.has(key)) return false;
      return true;
    })
    .slice(0, 16);
  const admissionText = parseResult.admission
    .map((item) =>
      [item.label, item.price, item.note].filter(Boolean).join(": ").trim()
    )
    .filter(Boolean)
    .join("\n");
  const athlete = parseResult.athlete;
  const existingDocuments = pickArray(existingAdvanced.logistics?.additionalDocuments)
    .map((item) => ({
      id: safeString(item?.id),
      name: safeString(item?.name),
      url: normalizeUrl(item?.url),
    }))
    .filter((item) => item.url);
  const incomingDocuments = [
    parseResult.logistics.waivers
      ? { id: "waiver-1", name: "Waiver", url: normalizeUrl(parseResult.logistics.waivers) }
      : null,
    ...parseResult.logistics.parkingLinks.map((item, idx) => ({
      id: `parking-link-${idx + 1}`,
      name: item.label || `Parking Link ${idx + 1}`,
      url: item.url,
    })),
    ...parseResult.logistics.parkingPricingLinks.map((item, idx) => ({
      id: `parking-pricing-link-${idx + 1}`,
      name: item.label || `Parking Pricing ${idx + 1}`,
      url: item.url,
    })),
  ]
    .filter((item): item is { id: string; name: string; url: string } => Boolean(item?.url));
  const additionalDocuments = uniqueBy([...incomingDocuments, ...existingDocuments], (item) => item.url).map(
    (item, idx) => ({
      id: item.id || `doc-${idx + 1}`,
      name: item.name || `Document ${idx + 1}`,
      url: item.url,
    })
  );
  const assistantCoachRolePattern = /\bassistant coach\b/i;
  const publicMeetContacts = uniqueBy(
    [
      ...pickArray(existingAdvanced.meet?.staffContacts),
      ...parseResult.contacts.filter((item) => classifyDiscoveryContact(item) === "public"),
    ]
      .map((item) => sanitizeDiscoveryContact(item, "Meet staff"))
      .filter(
        (
          item
        ): item is { role: string; name: string | null; email: string | null; phone: string | null } =>
          Boolean(item)
      ),
    (item) => [item.role, item.name || "", item.email || "", item.phone || ""].join("|")
  );
  const venueContacts = uniqueBy(
    [
      ...pickArray(existingAdvanced.logistics?.venueContacts),
      ...parseResult.contacts.filter((item) => classifyDiscoveryContact(item) === "venue"),
    ]
      .map((item) => sanitizeDiscoveryContact(item, "Venue contact"))
      .filter(
        (
          item
        ): item is { role: string; name: string | null; email: string | null; phone: string | null } =>
          Boolean(item)
      ),
    (item) => [item.role, item.name || "", item.email || "", item.phone || ""].join("|")
  );
  const venueContactNotes = uniqueLines(
    [
      ...pickArray(existingAdvanced.logistics?.venueContactNotes),
      ...parseResult.unmappedFacts
        .filter((fact) => !shouldSuppressUnmappedFact(fact))
        .filter((fact) => /\bvenue_contact\b/i.test(safeString(fact.category)))
        .map((fact) => safeString(fact.detail)),
    ],
    6
  );
  const coachContacts = uniqueBy(
    [
      ...pickArray(parseResult.coachInfo?.contacts),
      ...parseResult.contacts.filter((item) => classifyDiscoveryContact(item) === "coach"),
    ]
      .map((item) => sanitizeDiscoveryContact(item, "Coach contact"))
      .filter(
        (
          item
        ): item is { role: string; name: string | null; email: string | null; phone: string | null } =>
          Boolean(item)
      ),
    (item) => [item.role, item.name || "", item.email || "", item.phone || ""].join("|")
  );
  const primaryCoachContact =
    coachContacts.find((item) => /\bhead coach\b/i.test(item.role)) ||
    coachContacts.find((item) => /\bcoach\b/i.test(item.role) && !assistantCoachRolePattern.test(item.role)) ||
    coachContacts[0] ||
    null;
  const assistantCoachContact =
    coachContacts.find((item) => assistantCoachRolePattern.test(item.role)) || null;
  const derivedCoachName = safeString(primaryCoachContact?.name);
  const derivedAssistantCoachName = safeString(assistantCoachContact?.name);
  const derivedCoachPhone = safeString(primaryCoachContact?.phone);
  const coachSectionEnabled = hasCoachInfoContent(parseResult.coachInfo);
  const coachLinks = uniqueBy(
    [...parseResult.coachInfo.links, ...parseResult.links]
      .map((item) => ({
        label: safeString(item?.label) || "Coach link",
        url: normalizeUrl(item?.url),
      }))
      .filter(
        (item) =>
          item.url &&
          /(coach|entry|payment|refund|qualification|regional|rotation|meet maker|reservation|score|result)/i.test(
            `${item.label} ${item.url}`
          )
      ),
    (item) => item.url
  );
  const coachNotes = uniqueBy(
    parseResult.coachInfo.notes.map((item) => safeString(item)).filter(Boolean),
    (item) => item
  );
  const coachDeadlines = uniqueBy(
    parseResult.coachInfo.deadlines.map((item) => ({
      label: safeString(item.label) || "Coach deadline",
      date: safeString(item.date) || "",
      note: safeString(item.note) || "",
    })),
    (item) => `${item.label}|${item.date}|${item.note}`
  );

  const existingAnnouncementEntries: Array<{ title: string; body: string }> = pickArray(
    existingAdvanced.announcements?.announcements
  )
    .map((item) => ({
      title: "",
      body: safeString(item?.text || item?.body || item?.title),
    }))
    .filter((item) => item.body);
  const parsedAnnouncementEntries = pickArray(parseResult.communications?.announcements)
    .filter((item) => shouldPersistParsedAnnouncement(item))
    .map((item) => ({
      title: safeString(item?.title || item?.label),
      body: safeString(item?.body || item?.text || item?.message),
    }))
    .filter((item) => item.body);
  const mergedAnnouncements = uniqueBy(
    [
      ...parsedAnnouncementEntries,
      ...existingAnnouncementEntries,
    ].filter(
      (item) => safeString(item.title) || safeString(item.body)
    ),
    (item) => `${safeString(item.title)}|${safeString(item.body)}`
  );

  const nextAdvanced = {
    ...existingAdvanced,
    roster: {
      ...(existingAdvanced.roster || {}),
      enabled: true,
      showAttendance: true,
      athletes: athlete.name
        ? [
            {
              id: "athlete-1",
              name: athlete.name,
              level: athlete.level || "",
              primaryEvents: [],
              parentName: "",
              parentPhone: "",
              parentEmail: "",
              medicalNotes: "",
              status: "pending",
              team: athlete.team || "",
              session: athlete.session || "",
            },
          ]
        : existingAdvanced.roster?.athletes || [],
    },
    meet: {
      ...(existingAdvanced.meet || {}),
      sessionNumber: athlete.session || "",
      warmUpTime: parseResult.meetDetails.warmup || athlete.stretchTime || "",
      marchInTime: parseResult.meetDetails.marchIn || athlete.marchIn || "",
      assignedGym: assignedGym || safeString(existingAdvanced.meet?.assignedGym) || "",
      rotationOrder,
      judgingNotes: [parseResult.meetDetails.judgingNotes, rotationNarrative]
        .filter(Boolean)
        .join("\n\n"),
      startApparatus: rotationOrder[0] || "",
      doorsOpen: parseResult.meetDetails.doorsOpen || "",
      arrivalGuidance: parseResult.meetDetails.arrivalGuidance || "",
      registrationInfo: parseResult.meetDetails.registrationInfo || "",
      facilityLayout: parseResult.meetDetails.facilityLayout || "",
      scoringInfo: parseResult.meetDetails.scoringInfo || "",
      resultsInfo: parseResult.meetDetails.resultsInfo || "",
      rotationSheetsInfo: parseResult.meetDetails.rotationSheetsInfo || "",
      awardsInfo: parseResult.meetDetails.awardsInfo || "",
      sessionWindows: parseResult.meetDetails.sessionWindows || [],
      operationalNotes,
      staffContacts: publicMeetContacts.map((item, idx) => ({
        id: `meet-staff-${idx + 1}`,
        role: item.role,
        name: item.name || "",
        email: item.email || "",
        phone: item.phone || "",
      })),
    },
    logistics: {
      ...(existingAdvanced.logistics || {}),
      enabled: existingAdvanced.logistics?.enabled ?? false,
      hotelName: parseResult.logistics.hotel || "",
      mealPlan: parseResult.logistics.meals || "",
      feeAmount: parseResult.logistics.fees || "",
      additionalDocuments,
      parking: parseResult.logistics.parking || "",
      trafficAlerts: parseResult.logistics.trafficAlerts || "",
      rideShare: parseResult.logistics.rideShare || "",
      accessibility: parseResult.logistics.accessibility || "",
      parkingLinks: parseResult.logistics.parkingLinks || [],
      parkingPricingLinks: parseResult.logistics.parkingPricingLinks || [],
      policyFood: parseResult.policies.food || "",
      policyHydration: parseResult.policies.hydration || "",
      policySafety: parseResult.policies.safety || "",
      policyAnimals: parseResult.policies.animals || "",
      gymLayoutImage: resolvedGymLayoutImage,
      gymLayoutLabel: resolvedGymLayoutLabel,
      venueContacts: venueContacts.map((item, idx) => ({
        id: `venue-contact-${idx + 1}`,
        role: item.role,
        name: item.name || "",
        email: item.email || "",
        phone: item.phone || "",
      })),
      venueContactNotes,
    },
    coaches: {
      ...(existingAdvanced.coaches || {}),
      enabled: coachSectionEnabled,
      signIn: parseResult.coachInfo.signIn || "",
      attire: parseResult.coachInfo.attire || "",
      hospitality: parseResult.coachInfo.hospitality || "",
      floorAccess: parseResult.coachInfo.floorAccess || "",
      scratches: parseResult.coachInfo.scratches || "",
      floorMusic: parseResult.coachInfo.floorMusic || "",
      rotationSheets: parseResult.coachInfo.rotationSheets || "",
      awards: parseResult.coachInfo.awards || "",
      regionalCommitment: parseResult.coachInfo.regionalCommitment || "",
      qualification: parseResult.coachInfo.qualification || "",
      meetFormat: parseResult.coachInfo.meetFormat || "",
      equipment: parseResult.coachInfo.equipment || "",
      refundPolicy: parseResult.coachInfo.refundPolicy || "",
      paymentInstructions: parseResult.coachInfo.paymentInstructions || "",
      entryFees: parseResult.coachInfo.entryFees.map((item, idx) => ({
        id: `entry-fee-${idx + 1}`,
        label: item.label,
        amount: item.amount,
        note: item.note || "",
      })),
      teamFees: parseResult.coachInfo.teamFees.map((item, idx) => ({
        id: `team-fee-${idx + 1}`,
        label: item.label,
        amount: item.amount,
        note: item.note || "",
      })),
      lateFees: parseResult.coachInfo.lateFees.map((item, idx) => ({
        id: `late-fee-${idx + 1}`,
        label: item.label,
        amount: item.amount,
        trigger: item.trigger || "",
        note: item.note || "",
      })),
      deadlines: coachDeadlines.map((item, idx) => ({
        id: `coach-deadline-${idx + 1}`,
        label: item.label,
        date: item.date,
        note: item.note,
      })),
      contacts: coachContacts.map((item, idx) => ({
        id: `coach-contact-${idx + 1}`,
        role: item.role,
        name: item.name || "",
        email: item.email || "",
        phone: item.phone || "",
      })),
      links: coachLinks.map((item, idx) => ({
        id: `coach-link-${idx + 1}`,
        label: item.label,
        url: item.url,
      })),
      notes: coachNotes,
    },
    gear: {
      ...(existingAdvanced.gear || {}),
      enabled: existingAdvanced.gear?.enabled ?? false,
      leotardOfDay: parseResult.gear.uniform || "",
      items: (parseResult.gear.checklist || []).map((item, idx) => ({
        id: `gear-${idx + 1}`,
        name: item,
        required: true,
        acknowledged: false,
      })),
    },
    volunteers: {
      ...(existingAdvanced.volunteers || {}),
      enabled: existingAdvanced.volunteers?.enabled ?? false,
      signupLink: parseResult.volunteers.signupLink || "",
      notes: parseResult.volunteers.notes || "",
    },
    announcements: {
      ...(existingAdvanced.announcements || {}),
      announcements: mergedAnnouncements.map((item, idx) => ({
        id: `announcement-${idx + 1}`,
        text: [item.title, item.body].filter(Boolean).join("\n\n").trim(),
        priority: "normal",
        createdAt: new Date().toISOString(),
      })),
    },
  };

  const nextAccessControl = parseResult.communications.passcode
    ? await normalizeAccessControlPayload({
        mode: "access-code",
        requirePasscode: true,
        passcodePlain: parseResult.communications.passcode,
      })
    : await normalizeAccessControlPayload({
        mode: "public",
        requirePasscode: false,
      });

  const mappedDate =
    authoritativeDate ||
    derivedRange.startDate ||
    safeString(baseData?.date) ||
    "";
  const mappedTime = (() => {
    if (authoritativeDate) return time || safeString(baseData?.time) || "";
    if (parseResult.startAt) return time || "";
    if (safeString(baseData?.date) === mappedDate) return safeString(baseData?.time) || "";
    return "";
  })();
  const mappedStartISO = (() => {
    if (parseResult.startAt && !hasDateConflictWithRange) return parseResult.startAt;
    const existingStart = safeString(baseData?.startISO);
    if (existingStart && mappedDate && existingStart.startsWith(mappedDate)) {
      return existingStart;
    }
    return null;
  })();
  const mappedEndISO = (() => {
    if (parseResult.endAt && !hasDateConflictWithRange) return parseResult.endAt;
    const existingEnd = safeString(baseData?.endISO);
    if (existingEnd && mappedDate && existingEnd.startsWith(mappedDate)) {
      return existingEnd;
    }
    return null;
  })();

  return {
    ...baseData,
    title: parseResult.title || baseData?.title || "",
    details: safeString(baseData?.details),
    date: mappedDate,
    time: mappedTime,
    startISO: mappedStartISO,
    endISO: mappedEndISO,
    timezone: parseResult.timezone || baseData?.timezone || "America/Chicago",
    venue: parseResult.venue || baseData?.venue || "",
    address: parseResult.address || baseData?.address || "",
    hostGym: parseResult.hostGym || athlete.team || baseData?.hostGym || "",
    location: parseResult.venue || baseData?.location || "",
    customFields: {
      ...(baseData?.customFields || {}),
      team: parseResult.hostGym || athlete.team || "",
      season: baseData?.customFields?.season || "",
      coach: baseData?.customFields?.coach || derivedCoachName || "",
      assistantCoach:
        baseData?.customFields?.assistantCoach || derivedAssistantCoachName || "",
      coachPhone: baseData?.customFields?.coachPhone || derivedCoachPhone || "",
      admission: admissionText,
      discoveryDocumentProfile: parseResult.documentProfile,
      meetDateRangeLabel: derivedRange.label || "",
      meetDateRangeStart: derivedRange.startDate,
      meetDateRangeEnd: derivedRange.endDate,
      advancedSections: nextAdvanced,
    },
    links: uniqueBy(
      [
        ...parseResult.links,
        ...parseResult.coachInfo.links,
        ...parseResult.logistics.parkingLinks,
        ...parseResult.logistics.parkingPricingLinks,
      ].filter((item) => item.url),
      (item) => item.url
    ),
    advancedSections: nextAdvanced,
    accessControl: nextAccessControl || baseData?.accessControl || null,
    templateKey: "gymnastics",
    templateId: "gymnastics-schedule",
    pageTemplateId: resolvedPageTemplateId,
    category: "sport_gymnastics_schedule",
  };
}

type Status = "ready" | "in-progress" | "not-started";
function getStatusFromFlags(required: boolean[]): Status {
  const filled = required.filter(Boolean).length;
  if (filled === 0) return "not-started";
  if (filled === required.length) return "ready";
  return "in-progress";
}

export function computeGymBuilderStatuses(data: any) {
  const adv = data?.advancedSections || {};
  const roster = adv?.roster || {};
  const meet = adv?.meet || {};
  const practice = adv?.practice || {};
  const logistics = adv?.logistics || {};
  const coaches = adv?.coaches || {};
  const gear = adv?.gear || {};
  const volunteers = adv?.volunteers || {};
  const announcements = adv?.announcements || {};
  const startExists = Boolean(data?.date || data?.startISO);

  const statuses = {
    essentials: {
      eventBasics: getStatusFromFlags([
        Boolean(safeString(data?.title)),
        startExists,
        Boolean(safeString(data?.timezone)),
        Boolean(safeString(data?.venue)),
        Boolean(safeString(data?.address)),
      ]),
      details: getStatusFromFlags([
        Boolean(safeString(data?.details)),
        Boolean(
          safeString(
            meet?.warmUpTime ||
              meet?.judgingNotes ||
              meet?.sessionNumber ||
              meet?.doorsOpen ||
              meet?.arrivalGuidance ||
              meet?.registrationInfo ||
              meet?.facilityLayout ||
              meet?.scoringInfo ||
              meet?.resultsInfo ||
              meet?.rotationSheetsInfo ||
              meet?.awardsInfo
          )
        ),
      ]),
      design: "ready" as Status,
      images: data?.heroImage ? ("ready" as Status) : ("not-started" as Status),
    },
    operations: {
      rosterAttendance:
        Array.isArray(roster?.athletes) && roster.athletes.length > 0
          ? ("ready" as Status)
          : ("not-started" as Status),
      meetDetails: getStatusFromFlags([
        Boolean(
          safeString(
            meet?.warmUpTime ||
              meet?.marchInTime ||
              meet?.doorsOpen ||
              meet?.arrivalGuidance ||
              meet?.registrationInfo ||
              meet?.resultsInfo
          )
        ),
        Boolean(
          safeString(
            meet?.facilityLayout ||
              meet?.scoringInfo ||
              meet?.judgingNotes ||
              meet?.rotationSheetsInfo ||
              meet?.awardsInfo
          )
        ),
        (Array.isArray(meet?.rotationOrder) && meet.rotationOrder.length > 0) ||
          (Array.isArray(meet?.sessionWindows) && meet.sessionWindows.length > 0) ||
          (Array.isArray(meet?.operationalNotes) && meet.operationalNotes.length > 0),
      ]),
      coaches: getStatusFromFlags([
        Boolean(
          safeString(
            coaches?.signIn ||
              coaches?.hospitality ||
              coaches?.floorAccess ||
              coaches?.rotationSheets ||
              coaches?.paymentInstructions
          )
        ),
        Boolean(
          safeString(
            coaches?.attire ||
              coaches?.scratches ||
              coaches?.regionalCommitment ||
              coaches?.refundPolicy ||
              coaches?.qualification
          )
        ),
        (Array.isArray(coaches?.entryFees) && coaches.entryFees.length > 0) ||
          (Array.isArray(coaches?.teamFees) && coaches.teamFees.length > 0) ||
          (Array.isArray(coaches?.lateFees) && coaches.lateFees.length > 0) ||
          (Array.isArray(coaches?.deadlines) && coaches.deadlines.length > 0) ||
          (Array.isArray(coaches?.contacts) && coaches.contacts.length > 0),
      ]),
      practicePlanner:
        Array.isArray(practice?.blocks) && practice.blocks.length > 0
          ? ("ready" as Status)
          : ("not-started" as Status),
      logisticsTravel: getStatusFromFlags([
        Boolean(safeString(logistics?.hotelName || logistics?.hotelAddress)),
        Boolean(safeString(logistics?.mealPlan || logistics?.policyFood)),
        Boolean(
          safeString(
            logistics?.feeAmount ||
              logistics?.parking ||
              logistics?.trafficAlerts ||
              logistics?.rideShare ||
              logistics?.accessibility
          )
        ),
      ]),
      gearUniform: getStatusFromFlags([
        Boolean(safeString(gear?.leotardOfDay)),
        Array.isArray(gear?.items) && gear.items.length > 0,
      ]),
      volunteersCarpool: getStatusFromFlags([
        Boolean(safeString(volunteers?.signupLink)),
        Boolean(safeString(volunteers?.notes)),
      ]),
    },
    communication: {
      attendance: data?.rsvpEnabled ? ("ready" as Status) : ("not-started" as Status),
      passcode:
        data?.accessControl?.requirePasscode === true
          ? data?.accessControl?.passcodeHash
            ? ("ready" as Status)
            : ("in-progress" as Status)
          : ("not-started" as Status),
      announcements:
        Array.isArray(announcements?.announcements) &&
        announcements.announcements.length > 0
          ? ("ready" as Status)
          : ("not-started" as Status),
    },
  };

  const essentialsReady =
    statuses.essentials.eventBasics === "ready" &&
    statuses.essentials.details !== "not-started";

  const missingEssentials: string[] = [];
  if (statuses.essentials.eventBasics !== "ready") missingEssentials.push("Event Basics");
  if (statuses.essentials.details === "not-started") missingEssentials.push("Details");

  return {
    ...statuses,
    beforePublish: {
      previewPublish: essentialsReady ? ("ready" as Status) : ("in-progress" as Status),
      missingEssentials,
    },
  };
}

export const __testUtils = {
  deriveDateRangeFromText,
  classifyMeetDateCandidates,
  normalizeParseResult,
  sanitizeDiscoveryParseResult,
  mergeCoachFeesFromAdmission,
  routeCoachDeadlines,
  hasCoachInfoContent,
  collectDiscoveryCandidates,
  compareDiscoveryCandidates,
  setUrlDiscoveryTestHooks(hooks: UrlDiscoveryTestHooks | null) {
    urlDiscoveryTestHooks = hooks;
  },
  resetUrlDiscoveryTestHooks() {
    urlDiscoveryTestHooks = null;
  },
};
