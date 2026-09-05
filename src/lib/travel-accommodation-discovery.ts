import {
  HOTEL_FIELDS,
  hotelDeadlineIso,
  hotelId,
  parseHotelEvidence,
  type HotelEvidence,
  type HotelField,
  type HotelSource,
} from "./travel-accommodation-evidence";
type TravelAccommodationSource = "pdf" | "url" | "web";

export type TravelAccommodationCandidateSubtype =
  | "hotel_section_link"
  | "hotel_card_with_booking_link"
  | "travel_section"
  | "lodging_candidate";

export type TravelAccommodationProvider =
  | "astra"
  | "pdf"
  | "firecrawl_scrape_json"
  | "firecrawl_agent"
  | "playwright"
  | "browser_use"
  | "none";

export type TravelAccommodationCandidate = {
  candidateId: string;
  kind: "travel_accommodation_link";
  subtype: TravelAccommodationCandidateSubtype;
  label: string;
  contextLabel: string | null;
  entityLabel: string | null;
  url: string | null;
  source: TravelAccommodationSource;
  confidence: number;
  score: number;
  pageNumber: number | null;
  rawText: string;
  signals: string[];
  contextText: string | null;
  sectionHeading: string | null;
  sourceUrl: string | null;
  sourceBlockType: "pdf_window" | "pdf_link" | "resource_link" | "web_page";
  linkLabel: string | null;
};

export type TravelAccommodationHotel = {
  reservationDeadlineISO?: string | null;
  id?: string;
  address?: string | null;
  bookingInstructions?: string | null;
  evidence?: Partial<Record<HotelField, HotelEvidence[]>>;
  conflicts?: Partial<Record<HotelField, HotelEvidence[]>>;
  name: string;
  imageUrl: string | null;
  distanceFromVenue: string | null;
  groupRate: string | null;
  parking: string | null;
  breakfast: string | null;
  reservationDeadline: string | null;
  phone: string | null;
  bookingUrl: string | null;
  notes: string[];
  sourceType: "pdf" | "web" | "mixed";
  contentOrigin: string;
  confidence: number;
};

export type TravelAccommodationResolution = {
  resolvedUrl: string | null;
  provider: TravelAccommodationProvider;
  resolutionType:
    | "pdf_only"
    | "same_page_section"
    | "single_hotel_page"
    | "same_domain_followup"
    | "fallback_link"
    | "none";
  confidence: number;
};

export type TravelAccommodationAttempt = {
  provider: TravelAccommodationProvider;
  ok: boolean;
  url: string | null;
  error: string | null;
};

export type TravelAccommodationResult = {
  sources?: HotelSource[];
  candidates: TravelAccommodationCandidate[];
  pdfHotels: TravelAccommodationHotel[];
  hotels: TravelAccommodationHotel[];
  fallbackLink: string | null;
  resolution: TravelAccommodationResolution;
  confidence: number;
  attempts: TravelAccommodationAttempt[];
};

type TextPage = {
  pageNumber?: number | null;
  text: string;
};

type ContextLink = {
  pageNumber?: number | null;
  label?: string | null;
  url?: string | null;
  sourceUrl?: string | null;
  contextText?: string | null;
  sectionHeading?: string | null;
};

type DetectionInput = {
  source: TravelAccommodationSource;
  extractedText: string;
  pages?: TextPage[];
  links?: ContextLink[];
};

type TravelAccommodationTarget = {
  url: string;
  role: "official_travel_page" | "official_event_page" | "hotel_booking_page";
  sourceCandidateId: string;
  subtype: TravelAccommodationCandidateSubtype;
  rank: number;
  confidence: number;
};

export const ACCOMMODATION_TERMS = [
  "hotel",
  "hotels",
  "host hotel",
  "host hotels",
  "group hotel",
  "group hotels",
  "lodging",
  "accommodation",
  "accommodations",
  "housing",
  "travel",
  "travel links",
  "hotel & travel",
  "stay",
  "book your stay",
  "reservation",
  "reservations",
  "reservation link",
  "booking link",
  "book here",
  "official hotel",
  "official hotels",
  "host housing",
];

export const HOTEL_FIELD_TERMS = [
  "group hotel",
  "group rate",
  "distance from venue",
  "parking",
  "breakfast",
  "reservation deadline",
  "reservations link",
  "book now",
  "reserve hotel online",
  "phone reservations",
  "complimentary",
];

export const BOOKING_LINK_TERMS = [
  "click here",
  "reserve",
  "book",
  "reservation link",
  "reserve hotel online",
  "book now",
];

const HOTEL_NAME_HINT_PATTERN =
  /\b(?:hotel|marriott|hilton|hampton inn|hyatt|westin|sheraton|resort|inn|suites|lodge|courtyard|doubletree|embassy suites|holiday inn|fairfield|riverside|renaissance)\b/i;
const URL_PATTERN =
  /(?:https?:\/\/[^\s)]+|www\.[^\s)]+|(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/[^\s),;!?]*)?)/gi;
const NOISE_ONLY_PATTERN =
  /\b(results?|photo|video|parking|admission|ticket|rotation|roster|packet)\b/i;

function safeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : value == null ? "" : String(value).trim();
}

function normalizeWhitespace(value: unknown): string {
  return safeString(value).replace(/\s+/g, " ").trim();
}

function normalizeUrl(value: unknown): string {
  const raw = safeString(value);
  if (!raw) return "";
  const withProtocol = /^https?:\/\//i.test(raw)
    ? raw
    : /^www\./i.test(raw) ||
        (/^[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:\/[^\s]*)?$/i.test(raw) && !/@/.test(raw))
      ? `https://${raw}`
      : "";
  if (!withProtocol) return "";
  try {
    const parsed = new URL(withProtocol);
    return parsed.toString();
  } catch {
    return "";
  }
}

function toIsoDateOnly(value: string | null): string | null {
  return hotelDeadlineIso(value);
}

function normalizePhone(value: string | null): string | null {
  const raw = safeString(value);
  if (!raw) return null;
  const digits = raw.replace(/[^\d]/g, "");
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+1${digits.slice(1)}`;
  }
  if (digits.length === 10) return `+1${digits}`;
  return raw;
}

function uniqueBy<T>(items: T[], getKey: (item: T) => string): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of Array.isArray(items) ? items : []) {
    const key = safeString(getKey(item)).toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

function stableHash(value: string): string {
  // Deterministic, small hash for IDs.
  let hash = 5381;
  for (let idx = 0; idx < value.length; idx++) {
    hash = (hash * 33) ^ value.charCodeAt(idx);
  }
  return (hash >>> 0).toString(36);
}

function countTermHits(haystack: string, terms: string[]): number {
  const text = haystack.toLowerCase();
  let hits = 0;
  for (const term of terms) {
    const normalized = term.toLowerCase();
    if (!normalized) continue;
    if (text.includes(normalized)) hits++;
  }
  return hits;
}

function sentenceCaseLabel(value: string): string {
  return normalizeWhitespace(value);
}
function extractField(text: string, pattern: RegExp): string | null {
  const line = text.split(/\n/).find((line) => pattern.test(line));
  return line
    ? line
        .replace(pattern, "")
        .replace(/^[:\s-]+/, "")
        .trim() || null
    : null;
}

function looksLikeBookingUrl(url: string): boolean {
  return /\b(book|reserve|reservation|passkey|rooms?|lodging|hotel)\b/i.test(url);
}

function isNoiseOnlyBlock(text: string): boolean {
  const normalized = normalizeWhitespace(text);
  if (!normalized) return true;
  const hasAccommodation = countTermHits(normalized, ACCOMMODATION_TERMS) > 0;
  const hasNoise = NOISE_ONLY_PATTERN.test(normalized);
  return hasNoise && !hasAccommodation;
}

function detectSubtypeFromText(
  text: string,
  url: string | null,
): TravelAccommodationCandidateSubtype {
  const normalized = normalizeWhitespace(text);
  const hasAccommodation = countTermHits(normalized, ACCOMMODATION_TERMS) > 0;
  const hasFieldTerms = countTermHits(normalized, HOTEL_FIELD_TERMS) > 0;
  const hasBookingTerms = countTermHits(normalized, BOOKING_LINK_TERMS) > 0;
  const hasHotelNameHint = HOTEL_NAME_HINT_PATTERN.test(normalized);
  const hasUrl = Boolean(url);
  const urlLooksBooking = url ? looksLikeBookingUrl(url) : false;

  if (hasUrl && hasAccommodation && !hasHotelNameHint) return "hotel_section_link";
  if (hasUrl && (urlLooksBooking || hasBookingTerms) && (hasHotelNameHint || hasFieldTerms))
    return "hotel_card_with_booking_link";
  if (hasAccommodation && !hasUrl) return "travel_section";
  return hasAccommodation ? "lodging_candidate" : "travel_section";
}

function computeCandidateConfidence(params: {
  subtype: TravelAccommodationCandidateSubtype;
  text: string;
  url: string | null;
}): number {
  const termHits = countTermHits(params.text, ACCOMMODATION_TERMS);
  const fieldHits = countTermHits(params.text, HOTEL_FIELD_TERMS);
  const bookingHits = countTermHits(params.text, BOOKING_LINK_TERMS);
  const base =
    params.subtype === "hotel_section_link"
      ? 0.86
      : params.subtype === "hotel_card_with_booking_link"
        ? 0.82
        : params.subtype === "travel_section"
          ? 0.72
          : 0.68;
  const urlBoost = params.url ? 0.04 : 0;
  const scoreBoost = Math.min(0.08, termHits * 0.015 + fieldHits * 0.01 + bookingHits * 0.01);
  return Math.max(0.4, Math.min(0.97, Number((base + urlBoost + scoreBoost).toFixed(2))));
}

function buildSignals(text: string): string[] {
  const normalized = normalizeWhitespace(text).toLowerCase();
  const signals = [
    ...ACCOMMODATION_TERMS.filter((term) => normalized.includes(term.toLowerCase())),
    ...HOTEL_FIELD_TERMS.filter((term) => normalized.includes(term.toLowerCase())),
  ];
  return uniqueBy(signals, (item) => item.toLowerCase()).slice(0, 18);
}

function buildCandidate(params: {
  subtype: TravelAccommodationCandidateSubtype;
  label: string;
  url: string | null;
  source: TravelAccommodationSource;
  pageNumber: number | null;
  rawText: string;
  contextText: string | null;
  sectionHeading: string | null;
  sourceUrl: string | null;
  sourceBlockType: TravelAccommodationCandidate["sourceBlockType"];
  linkLabel: string | null;
}): TravelAccommodationCandidate {
  const normalizedLabel = sentenceCaseLabel(params.label || "Hotels & Travel");
  const contextLabel = sentenceCaseLabel(
    safeString(params.sectionHeading) || safeString(params.contextText) || normalizedLabel,
  );
  const entityLabel =
    params.subtype === "hotel_card_with_booking_link"
      ? sentenceCaseLabel(
          safeString(extractField(params.rawText, /^(?:group|host)\s+hotel\b/i)) ||
            safeString(extractField(params.rawText, /^hotel\b/i)) ||
            safeString(extractField(params.rawText, /^name\b/i)),
        ) || null
      : null;
  const textForSignals =
    `${params.rawText} ${params.contextText || ""} ${params.sectionHeading || ""} ${params.label}`.trim();
  const confidence = computeCandidateConfidence({
    subtype: params.subtype,
    text: textForSignals,
    url: params.url,
  });
  const idBasis = [
    params.source,
    params.sourceBlockType,
    params.pageNumber == null ? "" : String(params.pageNumber),
    normalizedLabel,
    params.url || "",
    contextLabel,
  ]
    .filter(Boolean)
    .join("|");
  const candidateId = `ta_${stableHash(idBasis)}`;
  return {
    candidateId,
    kind: "travel_accommodation_link",
    subtype: params.subtype,
    label: normalizedLabel,
    contextLabel: contextLabel || null,
    entityLabel,
    url: params.url,
    source: params.source,
    confidence,
    score: Math.round(confidence * 100),
    pageNumber: params.pageNumber,
    rawText: safeString(params.rawText),
    signals: buildSignals(textForSignals),
    contextText: safeString(params.contextText) || null,
    sectionHeading: safeString(params.sectionHeading) || null,
    sourceUrl: normalizeUrl(params.sourceUrl) || safeString(params.sourceUrl) || null,
    sourceBlockType: params.sourceBlockType,
    linkLabel: safeString(params.linkLabel) || null,
  };
}

function extractUrls(text: string): string[] {
  const out: string[] = [];
  for (const match of text.matchAll(URL_PATTERN)) {
    const raw = safeString(match[0]);
    const normalized = normalizeUrl(raw);
    if (!normalized) continue;
    out.push(normalized);
  }
  return uniqueBy(out, (item) => item.toLowerCase());
}

export function detectTravelAccommodationCandidates(
  input: DetectionInput,
): TravelAccommodationCandidate[] {
  const extractedText = safeString(input.extractedText);
  const candidates: TravelAccommodationCandidate[] = [];

  const links = Array.isArray(input.links) ? input.links : [];
  for (const link of links) {
    const url = normalizeUrl(link?.url) || null;
    if (!url) continue;
    const label = safeString(link?.label);
    const contextText = safeString(link?.contextText) || null;
    const sectionHeading = safeString(link?.sectionHeading) || null;
    const combined = normalizeWhitespace(
      [sectionHeading, contextText, label, url].filter(Boolean).join(" "),
    );
    if (!combined) continue;
    if (isNoiseOnlyBlock(combined)) continue;
    const accommodationHits =
      countTermHits(combined, ACCOMMODATION_TERMS) + (/\bhost\s+hotel\b/i.test(combined) ? 2 : 0);
    if (accommodationHits === 0 && !looksLikeBookingUrl(url)) continue;
    const subtype = detectSubtypeFromText(combined, url);
    candidates.push(
      buildCandidate({
        subtype,
        label,
        url,
        source: input.source === "pdf" ? "pdf" : "url",
        pageNumber: link.pageNumber ?? null,
        rawText: combined,
        contextText,
        sectionHeading,
        sourceUrl: safeString(link?.sourceUrl) || null,
        sourceBlockType: "resource_link",
        linkLabel: safeString(link?.label) || null,
      }),
    );
  }

  const pages = Array.isArray(input.pages) ? input.pages : [];
  if (input.source === "pdf" && pages.length > 0) {
    for (const page of pages) {
      const pageNumber =
        typeof page?.pageNumber === "number" && Number.isFinite(page.pageNumber)
          ? page.pageNumber
          : null;
      const text = safeString(page?.text);
      if (!text) continue;
      const lines = text
        .replace(/\r/g, "\n")
        .split(/\n+/)
        .map((line) => line.trim());
      for (let idx = 0; idx < lines.length; idx++) {
        const slice = lines.slice(idx, idx + 5).join("\n");
        if (!slice) continue;
        if (isNoiseOnlyBlock(slice)) continue;
        const urls = extractUrls(slice);
        const hasAccommodation = countTermHits(slice, ACCOMMODATION_TERMS) > 0;
        if (!hasAccommodation && urls.length === 0) continue;
        if (urls.length === 0) continue;
        const primaryUrl = urls[0] || null;
        const subtype = detectSubtypeFromText(slice, primaryUrl);
        if (
          countTermHits(slice, ACCOMMODATION_TERMS) === 0 &&
          subtype !== "hotel_card_with_booking_link"
        ) {
          continue;
        }
        candidates.push(
          buildCandidate({
            subtype,
            label: "Hotels & Travel",
            url: primaryUrl,
            source: "pdf",
            pageNumber,
            rawText: slice,
            contextText: null,
            sectionHeading: null,
            sourceUrl: null,
            sourceBlockType: slice.includes(primaryUrl || "") ? "pdf_link" : "pdf_window",
            linkLabel: null,
          }),
        );
      }
    }
  } else if (extractedText) {
    // URL source fallback: look for inline urls near hotel/travel terms.
    const urls = extractUrls(extractedText);
    for (const url of urls.slice(0, 12)) {
      const snippet = extractedText.split(/\n+/).find((line) => line.includes(url)) || `${url}`;
      const combined = normalizeWhitespace(`${snippet} ${url}`);
      if (!combined) continue;
      if (countTermHits(combined, ACCOMMODATION_TERMS) === 0 && !looksLikeBookingUrl(url)) continue;
      const subtype = detectSubtypeFromText(combined, url);
      candidates.push(
        buildCandidate({
          subtype,
          label: "Hotels & Travel",
          url,
          source: input.source,
          pageNumber: null,
          rawText: combined,
          contextText: null,
          sectionHeading: null,
          sourceUrl: null,
          sourceBlockType: "web_page",
          linkLabel: null,
        }),
      );
    }
  }

  const deduped = uniqueBy(candidates, (candidate) => {
    const url = safeString(candidate.url).toLowerCase();
    return `${candidate.source}|${candidate.subtype}|${candidate.pageNumber ?? ""}|${url}|${candidate.label.toLowerCase()}`;
  });
  return deduped.sort((a, b) => b.confidence - a.confidence || b.score - a.score);
}

function normalizeHotelName(value: string): string {
  return safeString(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hotelNameTokens(value: string): string[] {
  const tokens = normalizeHotelName(value)
    .split(/\s+/)
    .filter(Boolean)
    .filter((token) => token.length >= 2 && !["the", "and", "at", "of"].includes(token));
  return uniqueBy(tokens, (token) => token);
}

function tokenOverlap(aTokens: string[], bTokens: string[]): number {
  if (aTokens.length === 0 || bTokens.length === 0) return 0;
  const aSet = new Set(aTokens);
  const bSet = new Set(bTokens);
  let intersection = 0;
  for (const token of aSet) {
    if (bSet.has(token)) intersection++;
  }
  const union = new Set([...aSet, ...bSet]).size || 1;
  return intersection / union;
}

function isPlaceholderValue(value: string | null): boolean {
  const text = safeString(value).toLowerCase();
  if (!text) return false;
  return /\b(see packet|see website|see link|tbd|to be announced|check online)\b/i.test(text);
}

function normalizeHotel(input: TravelAccommodationHotel): TravelAccommodationHotel {
  return {
    ...input,
    id: input.id || hotelId(input.name),
    reservationDeadlineISO: hotelDeadlineIso(input.reservationDeadline),
    name: safeString(input.name),
    imageUrl: normalizeUrl(input.imageUrl) || null,
    distanceFromVenue: safeString(input.distanceFromVenue) || null,
    groupRate: safeString(input.groupRate) || null,
    parking: safeString(input.parking) || null,
    breakfast: safeString(input.breakfast) || null,
    reservationDeadline: safeString(input.reservationDeadline) || null,
    phone: safeString(input.phone) || null,
    bookingUrl: normalizeUrl(input.bookingUrl) || null,
    notes: Array.isArray(input.notes)
      ? input.notes.map((item) => normalizeWhitespace(item)).filter(Boolean)
      : [],
    sourceType: input.sourceType,
    contentOrigin: safeString(input.contentOrigin) || "unknown",
    confidence:
      typeof input.confidence === "number" && Number.isFinite(input.confidence)
        ? Math.max(0.4, Math.min(0.97, input.confidence))
        : 0.75,
  };
}

export function extractHotelObjectsFromPdf(
  document:
    | {
        extractedText?: string;
        sourceUrl?: string | null;
        pages?: Array<{ pageNumber: number; text: string }>;
      }
    | null
    | undefined,
  candidates: TravelAccommodationCandidate[],
): TravelAccommodationHotel[] {
  if (document?.extractedText || document?.pages?.length) {
    const pages = document.pages?.length
      ? document.pages
      : [{ pageNumber: 1, text: document.extractedText || "" }];
    return mergePdfAndWebHotels(
      pages.flatMap((page) =>
        parseHotelEvidence(page.text, {
          sourceType: "pdf",
          sourceUrl: document.sourceUrl,
          pageNumber: page.pageNumber,
          links: candidates.flatMap((item) => (item.url ? [{ ...item, url: item.url }] : [])),
        }),
      ),
      [],
    );
  }
  return uniqueBy(
    (Array.isArray(candidates) ? candidates : [])
      .filter((candidate) => candidate.source === "pdf")
      .flatMap((candidate) =>
        parseHotelEvidence(candidate.contextText || candidate.rawText, {
          sourceType: "pdf",
          sourceUrl: candidate.sourceUrl,
          pageNumber: candidate.pageNumber,
        }),
      )
      .filter((hotel): hotel is TravelAccommodationHotel => Boolean(hotel)),
    (hotel) => `${hotel.name.toLowerCase()}|${hotel.bookingUrl || ""}`,
  );
}

function mergeHotelPair(
  existing: TravelAccommodationHotel,
  incoming: TravelAccommodationHotel,
): TravelAccommodationHotel {
  const a = normalizeHotel(existing);
  const b = normalizeHotel(incoming);
  const merged: TravelAccommodationHotel = {
    ...a,
    evidence: { ...a.evidence },
    conflicts: { ...a.conflicts, ...b.conflicts },
    notes: uniqueBy([...(a.notes || []), ...(b.notes || [])], (item) => item.toLowerCase()).slice(
      0,
      10,
    ),
    sourceType: a.sourceType === b.sourceType ? a.sourceType : "mixed",
    contentOrigin: a.contentOrigin === b.contentOrigin ? a.contentOrigin : "merged_sources",
    confidence: Math.max(a.confidence, b.confidence),
  };
  for (const field of HOTEL_FIELDS) {
    const first = safeString(a[field]);
    const second = safeString(b[field]);
    const evidence = [...(a.evidence?.[field] || []), ...(b.evidence?.[field] || [])];
    merged.evidence![field] = evidence;
    const comparable = (value: string) =>
      field === "phone"
        ? normalizePhone(value)
        : field === "reservationDeadline"
          ? toIsoDateOnly(value) || value.toLowerCase()
          : field.endsWith("Url")
            ? value
            : value.toLowerCase();
    if (
      field !== "name" &&
      first &&
      second &&
      comparable(first) !== comparable(second) &&
      !isPlaceholderValue(first) &&
      !isPlaceholderValue(second)
    ) {
      merged.conflicts![field] = evidence.length
        ? evidence
        : [
            {
              value: first,
              quote: first,
              sourceId: a.contentOrigin,
              sourceUrl: null,
              pageNumber: null,
              method: "text",
            },
            {
              value: second,
              quote: second,
              sourceId: b.contentOrigin,
              sourceUrl: null,
              pageNumber: null,
              method: "text",
            },
          ];
      merged[field] = null;
    } else if (field !== "name")
      merged[field] = merged.conflicts?.[field]?.length
        ? null
        : (!isPlaceholderValue(first) && first) || second || null;
  }
  return normalizeHotel(merged);
}

export function mergePdfAndWebHotels(
  pdfHotels: TravelAccommodationHotel[],
  webHotels: TravelAccommodationHotel[],
): TravelAccommodationHotel[] {
  const normalizedPdf = (Array.isArray(pdfHotels) ? pdfHotels : []).map((hotel) =>
    normalizeHotel({ ...hotel, sourceType: hotel.sourceType || "pdf" }),
  );
  const normalizedWeb = (Array.isArray(webHotels) ? webHotels : []).map((hotel) =>
    normalizeHotel({ ...hotel, sourceType: hotel.sourceType || "web" }),
  );

  const merged: TravelAccommodationHotel[] = [];
  const used = new Set<number>();

  const findMatchIndex = (hotel: TravelAccommodationHotel): number => {
    const urlKey = safeString(hotel.bookingUrl).toLowerCase();
    const nameKey = normalizeHotelName(hotel.name);
    const tokens = hotelNameTokens(hotel.name);
    for (let idx = 0; idx < merged.length; idx++) {
      if (used.has(idx)) continue;
      const existing = merged[idx]!;
      const differentAddress =
        hotel.address &&
        existing.address &&
        normalizeHotelName(hotel.address) !== normalizeHotelName(existing.address);
      if (differentAddress) continue;
      if (nameKey && normalizeHotelName(existing.name) === nameKey) return idx;
      if (
        urlKey &&
        existing.bookingUrl === hotel.bookingUrl &&
        tokenOverlap(tokens, hotelNameTokens(existing.name)) >= 0.8
      )
        return idx;
      const overlap = tokenOverlap(tokens, hotelNameTokens(existing.name));
      if (overlap >= 0.8) {
        const samePhone = Boolean(hotel.phone && existing.phone && hotel.phone === existing.phone);
        if (samePhone) return idx;
      }
    }
    return -1;
  };

  for (const hotel of [...normalizedPdf, ...normalizedWeb]) {
    if (!safeString(hotel.name)) continue;
    const matchIdx = findMatchIndex(hotel);
    if (matchIdx < 0) {
      merged.push(hotel);
      continue;
    }
    merged[matchIdx] = mergeHotelPair(merged[matchIdx]!, hotel);
  }

  return merged.sort((a, b) => b.confidence - a.confidence || a.name.localeCompare(b.name));
}

function candidateSubtypeRank(subtype: TravelAccommodationCandidateSubtype): number {
  switch (subtype) {
    case "hotel_section_link":
      return 100;
    case "travel_section":
      return 90;
    case "lodging_candidate":
      return 80;
    case "hotel_card_with_booking_link":
      return 60;
    default:
      return 0;
  }
}

function sameHostBoost(candidate: TravelAccommodationCandidate): number {
  const url = safeString(candidate.url);
  const sourceUrl = safeString(candidate.sourceUrl);
  if (!url || !sourceUrl) return 0;
  try {
    const a = new URL(url);
    const b = new URL(sourceUrl);
    return a.host === b.host &&
      /\b(hotels?|lodging|accommodations?|travel)\b/i.test(candidate.label)
      ? 40
      : 0;
  } catch {
    return 0;
  }
}

function resolveTargets(candidates: TravelAccommodationCandidate[]): TravelAccommodationTarget[] {
  const targets: TravelAccommodationTarget[] = [];
  for (const candidate of Array.isArray(candidates) ? candidates : []) {
    const url = normalizeUrl(candidate.url);
    if (!url) continue;
    const rank = candidateSubtypeRank(candidate.subtype) + sameHostBoost(candidate);
    const role =
      candidate.subtype === "hotel_card_with_booking_link"
        ? "hotel_booking_page"
        : "official_travel_page";
    targets.push({
      url,
      role,
      sourceCandidateId: candidate.candidateId,
      subtype: candidate.subtype,
      rank,
      confidence: candidate.confidence,
    });
  }
  return targets.sort(
    (a, b) => b.rank - a.rank || b.confidence - a.confidence || a.url.localeCompare(b.url),
  );
}

export function selectFallbackTravelLink(
  candidates: TravelAccommodationCandidate[],
): string | null {
  const targets = resolveTargets(candidates);
  return targets[0]?.url || null;
}

export function summarizeHotelsForNarrative(
  hotels: TravelAccommodationHotel[],
  fallbackLink: string | null,
): string {
  const top = (Array.isArray(hotels) ? hotels : []).slice(0, 2);
  if (top.length === 0) {
    return fallbackLink
      ? "Hotel and travel details are available on the official booking page."
      : "";
  }
  return top
    .map((hotel) => {
      const parts = [
        hotel.name,
        hotel.groupRate ? `Group rate ${hotel.groupRate}` : "",
        hotel.distanceFromVenue ? `${hotel.distanceFromVenue} from the venue` : "",
        hotel.reservationDeadline ? `Book by ${hotel.reservationDeadline}` : "",
      ].filter(Boolean);
      return parts.join(". ");
    })
    .join(" ");
}

export function buildTravelAccommodationResult(params: {
  candidates: TravelAccommodationCandidate[];
  pdfHotels: TravelAccommodationHotel[];
  webHotels?: TravelAccommodationHotel[];
  fallbackLink?: string | null;
  resolution?: Partial<TravelAccommodationResolution>;
  attempts?: TravelAccommodationAttempt[];
}): TravelAccommodationResult {
  const hotels = mergePdfAndWebHotels(params.pdfHotels || [], params.webHotels || []);
  const fallbackLink =
    normalizeUrl(params.fallbackLink) || selectFallbackTravelLink(params.candidates || []);
  const confidence =
    hotels.length > 0
      ? Math.max(...hotels.map((hotel) => hotel.confidence))
      : Math.max(0.4, ...(params.candidates || []).map((candidate) => candidate.confidence));
  return {
    candidates: params.candidates || [],
    pdfHotels: params.pdfHotels || [],
    hotels,
    fallbackLink,
    resolution: {
      resolvedUrl: params.resolution?.resolvedUrl || fallbackLink,
      provider: params.resolution?.provider || (params.pdfHotels?.length ? "pdf" : "none"),
      resolutionType:
        params.resolution?.resolutionType ||
        (hotels.length > 0 && params.pdfHotels?.length
          ? "pdf_only"
          : fallbackLink
            ? "fallback_link"
            : "none"),
      confidence: params.resolution?.confidence ?? confidence,
    },
    confidence,
    attempts: params.attempts || [],
  };
}
