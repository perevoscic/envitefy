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
  const candidates = detectTravelAccommodationCandidates({
    source: params.sourceType === "file" ? "pdf" : "url",
    extractedText: params.extractedText,
    pages,
    links: buildCandidateLinks(params.extractionMeta),
  });
  const pdfHotels = params.sourceType === "file" ? extractHotelObjectsFromPdf(null, candidates) : [];
  const base = buildTravelAccommodationResult({
    candidates,
    pdfHotels,
    webHotels: [],
  });
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
