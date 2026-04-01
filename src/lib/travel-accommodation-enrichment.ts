import {
  buildTravelAccommodationResult,
  detectTravelAccommodationCandidates,
  extractHotelObjectsFromPdf,
  mergePdfAndWebHotels,
  selectFallbackTravelLink,
  summarizeHotelsForNarrative,
  type TravelAccommodationAttempt,
  type TravelAccommodationHotel,
  type TravelAccommodationResult,
} from "@/lib/travel-accommodation-discovery";
import {
  extractHotelsWithBrowserUse,
} from "@/lib/travel-accommodation-providers/browser-use";
import {
  extractHotelsWithFirecrawlAgent,
  extractHotelsWithFirecrawlScrape,
} from "@/lib/travel-accommodation-providers/firecrawl";
import { extractHotelsWithPlaywright } from "@/lib/travel-accommodation-providers/playwright";

type EnrichParams = {
  sourceType: "file" | "url";
  extractedText: string;
  extractionMeta: Record<string, any> | null | undefined;
};

type ParsedHotelCard = {
  name: string;
  bookingUrl?: string | null;
  address?: string | null;
  phone?: string | null;
  reservationDeadline?: string | null;
  rateSummary?: string | null;
  notes?: string | null;
};

function safeString(value: unknown): string {
  return typeof value === "string"
    ? value.trim()
    : value == null
    ? ""
    : String(value).trim();
}

function normalizeUrl(value: unknown): string {
  const raw = safeString(value);
  if (!raw) return "";
  try {
    return new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`).toString();
  } catch {
    return "";
  }
}

function normalizeLine(value: unknown): string {
  return safeString(value)
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .trim();
}

function isSectionBoundary(line: string): boolean {
  return /^(?:local attractions|parking(?: information)?|traffic(?: & arrival)?|quick access|documents|results|admission(?: & sales)?|spectator(?: information)?|venue details|event info|photo\/video|vendors?|sponsors?)$/i.test(
    normalizeLine(line)
  );
}

function isBookingLabel(line: string): boolean {
  return /^(?:reserve|book)(?: hotel)?(?: online| now| here)?$/i.test(line);
}

function looksLikeAddress(line: string): boolean {
  return /\b\d{2,6}\s+[a-z0-9.'-]+(?:\s+[a-z0-9.'-]+){1,6}\b/i.test(line);
}

function looksLikeHotelName(line: string): boolean {
  const normalized = normalizeLine(line);
  if (!normalized || normalized.length < 3 || normalized.length > 90) return false;
  if (/:/.test(normalized)) return false;
  if (isBookingLabel(normalized) || isSectionBoundary(normalized)) return false;
  if (/^(?:host hotel(?: information| info)?|hotels?(?: & travel)?)$/i.test(normalized)) return false;
  return /\b(?:hotel|hilton|hampton|hyatt|indigo|aloft|homewood|springhill|fairfield|courtyard|doubletree|embassy|holiday inn|marriott|suites|inn|resort|lodge)\b/i.test(
    normalized
  );
}

function extractHotelSectionLines(content: string): string[] {
  const lines = safeString(content)
    .replace(/\r/g, "\n")
    .split(/\n+/)
    .map((line) => normalizeLine(line))
    .filter(Boolean);
  const start = lines.findIndex((line) =>
    /\b(?:host hotel(?: information| info)?|historic district hotels|hotels?(?: & travel)?)\b/i.test(
      line
    )
  );
  if (start < 0) return [];
  const section: string[] = [];
  for (let index = start + 1; index < lines.length; index += 1) {
    const line = lines[index]!;
    if (isSectionBoundary(line)) break;
    section.push(line);
  }
  return section;
}

function findMatchingBookingUrl(name: string, links: Array<{ url: string; contextText?: string | null }>): string | null {
  const normalizedName = normalizeLine(name).toLowerCase();
  if (!normalizedName) return null;
  const matches = links.filter((link) =>
    normalizeLine(link.contextText).toLowerCase().includes(normalizedName)
  );
  if (matches.length !== 1) return null;
  return matches[0]?.url || null;
}

export function extractHotelCardsFromContent(content: string): ParsedHotelCard[] {
  const lines = extractHotelSectionLines(content);
  if (lines.length === 0) return [];
  const cards: string[][] = [];
  let current: string[] = [];

  for (const line of lines) {
    if (looksLikeHotelName(line)) {
      if (current.length > 0) cards.push(current);
      current = [line];
      continue;
    }
    if (current.length === 0) continue;
    if (
      current.length === 1 &&
      !/:/.test(line) &&
      !isBookingLabel(line) &&
      !looksLikeHotelName(line) &&
      /^[A-Za-z][A-Za-z\s.'&-]{1,40}$/.test(line)
    ) {
      current[0] = `${current[0]} ${line}`.trim();
      continue;
    }
    if (isBookingLabel(line) && current.some((value) => isBookingLabel(value))) continue;
    current.push(line);
  }
  if (current.length > 0) cards.push(current);

  return cards
    .map((card) => {
      const [nameLine, ...detailLines] = card;
      const bookingUrl = null;
      const address = detailLines.find((line) => looksLikeAddress(line)) || null;
      const phone =
        detailLines.find((line) => /^(?:phone|phone reservations?)\s*:/i.test(line))?.replace(/^phone(?: reservations?)?\s*:\s*/i, "") ||
        detailLines.find((line) => /\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/.test(line)) ||
        null;
      const reservationDeadline =
        detailLines.find((line) => /^(?:reservation deadline|deadline to book)\s*:/i.test(line))?.replace(/^(?:reservation deadline|deadline to book)\s*:\s*/i, "") ||
        null;
      const rateSummary =
        detailLines.find((line) => /^(?:rate|rates)\s*:/i.test(line))?.replace(/^(?:rate|rates)\s*:\s*/i, "") ||
        null;
      const notes = detailLines
        .filter((line) => line !== address)
        .filter((line) => line !== phone)
        .filter((line) => line !== reservationDeadline)
        .filter((line) => line !== rateSummary)
        .filter((line) => !isBookingLabel(line))
        .join(" | ");
      return {
        name: nameLine,
        bookingUrl,
        address,
        phone,
        reservationDeadline,
        rateSummary,
        notes: notes || null,
      };
    })
    .filter((card) => safeString(card.name))
    .filter((card) => Boolean(card.phone || card.rateSummary || card.notes || card.address));
}

export function extractHotelCandidatesFromMarkdown(markdown: string): Array<{ name: string; url: string }> {
  const lines = safeString(markdown)
    .replace(/\r/g, "\n")
    .split(/\n+/)
    .map((line) => normalizeLine(line))
    .filter(Boolean);
  const out: Array<{ name: string; url: string }> = [];
  for (let index = 1; index < lines.length; index += 1) {
    const line = lines[index]!;
    const match = line.match(/\((https?:\/\/[^)]+)\)/i);
    if (!match) continue;
    const previous = lines[index - 1]!;
    if (!looksLikeHotelName(previous) || /\bhost hotels?\b/i.test(previous)) continue;
    out.push({ name: previous, url: normalizeUrl(match[1]) });
  }
  return out;
}

function buildCandidateLinks(extractionMeta: Record<string, any> | null | undefined) {
  const discovered = Array.isArray(extractionMeta?.discoveredLinks) ? extractionMeta!.discoveredLinks : [];
  const resources = Array.isArray(extractionMeta?.resourceLinks) ? extractionMeta!.resourceLinks : [];
  return [
    ...resources.map((item: any) => ({
      label: safeString(item?.label),
      url: safeString(item?.url),
      sourceUrl: safeString(item?.sourceUrl),
      contextText: safeString(item?.contextText) || null,
      sectionHeading: safeString(item?.sectionHeading) || null,
    })),
    ...discovered.map((item: any) => ({
      label: safeString(item?.label),
      url: safeString(item?.url),
      sourceUrl: safeString(item?.sourceUrl),
      contextText: safeString(item?.contextText) || null,
      sectionHeading: safeString(item?.sectionHeading) || null,
    })),
  ].filter((item) => item.url);
}

function buildPages(extractionMeta: Record<string, any> | null | undefined, extractedText: string) {
  const scheduleTexts = Array.isArray(extractionMeta?.schedulePageTexts)
    ? extractionMeta!.schedulePageTexts.map((item: any) => ({
        pageNumber:
          typeof item?.pageNumber === "number" && Number.isFinite(item.pageNumber)
            ? item.pageNumber
            : null,
        text: safeString(item?.text),
      }))
    : [];
  if (scheduleTexts.length > 0) return scheduleTexts;
  return [{ pageNumber: null, text: extractedText }];
}

function buildInlineHotelsFromExtractedText(
  extractedText: string,
  candidateLinks: Array<{ url: string; contextText?: string | null }>
): TravelAccommodationHotel[] {
  return extractHotelCardsFromContent(extractedText).map((card) => ({
    name: card.name,
    imageUrl: null,
    distanceFromVenue:
      card.notes?.match(/Distance from Venue\s*:\s*([^|]+)/i)?.[1]?.trim() || null,
    groupRate: card.rateSummary || null,
    parking: card.notes?.match(/Parking\s*:\s*([^|]+)/i)?.[1]?.trim() || null,
    breakfast: card.notes?.match(/Breakfast\s*:\s*([^|]+)/i)?.[1]?.trim() || null,
    reservationDeadline: card.reservationDeadline || null,
    phone: card.phone || null,
    bookingUrl: card.bookingUrl || findMatchingBookingUrl(card.name, candidateLinks),
    notes: card.notes ? [card.notes] : [],
    sourceType: "web",
    contentOrigin: "public_travel_section",
    confidence: 0.88,
  }));
}

function hasFirecrawl() {
  return Boolean(safeString(process.env.FIRECRAWL_API_KEY));
}

function subtypeRank(subtype: string) {
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

function sameHostBoost(url: string, sourceUrl: string | null): number {
  if (!url || !sourceUrl) return 0;
  try {
    const a = new URL(url);
    const b = new URL(sourceUrl);
    return a.host === b.host ? 8 : 0;
  } catch {
    return 0;
  }
}

function pickPrimaryTravelTarget(params: {
  result: TravelAccommodationResult;
  preferNonBookingWhenPdfHotelsExist: boolean;
}) {
  const candidates = Array.isArray(params.result.candidates) ? params.result.candidates : [];
  const ranked = candidates
    .filter((item) => item && item.url)
    .map((item) => {
      const url = normalizeUrl(item.url) || "";
      const sourceUrl = safeString((item as any).sourceUrl) || null;
      const baseRank =
        subtypeRank(safeString((item as any).subtype)) +
        sameHostBoost(url, sourceUrl);
      const bookingPenalty =
        params.preferNonBookingWhenPdfHotelsExist &&
        safeString((item as any).subtype) === "hotel_card_with_booking_link"
          ? 1000
          : 0;
      return {
        url,
        rank: baseRank - bookingPenalty,
        subtype: safeString((item as any).subtype),
        confidence: typeof (item as any).confidence === "number" ? (item as any).confidence : 0.5,
      };
    })
    .filter((item) => item.url)
    .sort((a, b) => b.rank - a.rank || b.confidence - a.confidence || a.url.localeCompare(b.url));

  const primary = ranked[0] || null;
  if (primary) {
    return {
      url: primary.url,
      subtype: primary.subtype,
      confidence: primary.confidence,
    };
  }
  const fallback = selectFallbackTravelLink(params.result.candidates);
  return fallback ? { url: normalizeUrl(fallback) || null, subtype: "fallback", confidence: 0.5 } : null;
}

export async function enrichTravelAccommodation(params: EnrichParams): Promise<TravelAccommodationResult> {
  const pages = buildPages(params.extractionMeta, params.extractedText);
  const candidateLinks = buildCandidateLinks(params.extractionMeta);
  const candidates = detectTravelAccommodationCandidates({
    source: params.sourceType === "file" ? "pdf" : "url",
    extractedText: params.extractedText,
    pages,
    links: candidateLinks,
  });
  const pdfHotels = params.sourceType === "file" ? extractHotelObjectsFromPdf(null, candidates) : [];
  const inlineHotels =
    params.sourceType === "url" ? buildInlineHotelsFromExtractedText(params.extractedText, candidateLinks) : [];
  const base = buildTravelAccommodationResult({
    candidates,
    pdfHotels,
    webHotels: inlineHotels,
  });
  if (inlineHotels.length > 0) {
    return buildTravelAccommodationResult({
      candidates,
      pdfHotels,
      webHotels: inlineHotels,
      fallbackLink: selectFallbackTravelLink(candidates),
      resolution: {
        resolvedUrl: null,
        provider: "none",
        resolutionType: "same_page_section",
        confidence: Math.max(...inlineHotels.map((hotel) => hotel.confidence)),
      },
      attempts: [],
    });
  }
  const primaryTarget = pickPrimaryTravelTarget({
    result: base,
    preferNonBookingWhenPdfHotelsExist: pdfHotels.length > 0,
  });
  const targetUrl = primaryTarget?.url || null;
  if (!targetUrl) return base;

  const attempts: TravelAccommodationAttempt[] = [];
  let webHotels: TravelAccommodationHotel[] = [];
  let resolvedFallback = targetUrl;
  let resolvedProvider = base.resolution.provider;
  let resolutionType: TravelAccommodationResult["resolution"]["resolutionType"] =
    pdfHotels.length > 0 ? "pdf_only" : "fallback_link";

  if (hasFirecrawl()) {
    const scrape = await extractHotelsWithFirecrawlScrape(targetUrl);
    attempts.push(scrape.attempt);
    if (scrape.hotels.length > 0) {
      webHotels = mergePdfAndWebHotels([], scrape.hotels);
      resolvedFallback = scrape.fallbackLink || resolvedFallback;
      resolvedProvider = "firecrawl_scrape_json";
      resolutionType = "same_page_section";
    } else {
      const agent = await extractHotelsWithFirecrawlAgent(targetUrl);
      attempts.push(agent.attempt);
      if (agent.hotels.length > 0) {
        webHotels = mergePdfAndWebHotels([], agent.hotels);
        resolvedFallback = agent.fallbackLink || resolvedFallback;
        resolvedProvider = "firecrawl_agent";
        resolutionType = "same_domain_followup";
      }
    }
  }

  if (webHotels.length === 0) {
    const playwright = await extractHotelsWithPlaywright(targetUrl);
    attempts.push(playwright.attempt);
    if (playwright.hotels.length > 0) {
      webHotels = mergePdfAndWebHotels([], playwright.hotels);
      resolvedFallback = playwright.fallbackLink || resolvedFallback;
      resolvedProvider = "playwright";
      resolutionType = "same_domain_followup";
    }
  }

  if (webHotels.length === 0) {
    const browserUse = await extractHotelsWithBrowserUse(targetUrl);
    attempts.push(browserUse.attempt);
    if (browserUse.hotels.length > 0) {
      webHotels = mergePdfAndWebHotels([], browserUse.hotels);
      resolvedFallback = browserUse.fallbackLink || resolvedFallback;
      resolvedProvider = "browser_use";
      resolutionType = "same_domain_followup";
    }
  }

  return buildTravelAccommodationResult({
    candidates,
    pdfHotels,
    webHotels,
    fallbackLink: resolvedFallback,
    attempts,
    resolution: {
      resolvedUrl: resolvedFallback,
      provider: resolvedProvider,
      resolutionType,
      confidence:
        webHotels.length > 0
          ? Math.max(...webHotels.map((hotel) => hotel.confidence))
          : base.confidence,
    },
  });
}

export function buildTravelAccommodationState(result: TravelAccommodationResult) {
  return {
    version: 2,
    status: result.hotels.length > 0 ? "enriched" : result.fallbackLink ? "fallback" : "empty",
    candidates: result.candidates,
    pdfHotels: result.pdfHotels,
    hotels: result.hotels,
    fallbackLink: result.fallbackLink,
    resolution: result.resolution,
    hotelSource: {
      discoveredFrom: result.pdfHotels.length > 0 ? "pdf_travel_accommodation_discovery" : "url_travel_accommodation_discovery",
      resolvedUrl: result.resolution?.resolvedUrl || result.fallbackLink || null,
      provider: result.resolution?.provider || "none",
      resolutionType: result.resolution?.resolutionType || "none",
      confidence: result.resolution?.confidence ?? result.confidence,
    },
    attempts: result.attempts,
    confidence: result.confidence,
    narrative: summarizeHotelsForNarrative(result.hotels, result.fallbackLink),
    updatedAt: new Date().toISOString(),
  };
}
