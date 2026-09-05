import {
  buildTravelAccommodationResult,
  detectTravelAccommodationCandidates,
  mergePdfAndWebHotels,
  selectFallbackTravelLink,
  summarizeHotelsForNarrative,
  type TravelAccommodationAttempt,
  type TravelAccommodationHotel,
  type TravelAccommodationResult,
} from "./travel-accommodation-discovery";
import {
  HOTEL_FIELDS,
  hotelUrl,
  markdownHotelLinks,
  parseHotelEvidence,
  type HotelLink,
  type HotelSource,
} from "./travel-accommodation-evidence";
import { extractHotelsWithFirecrawlScrape } from "./travel-accommodation-providers/firecrawl";
import { extractHotelsWithPlaywright } from "./travel-accommodation-providers/playwright";
import { extractHotelsWithBrowserUse } from "./travel-accommodation-providers/browser-use";
import { extractHotelEvidenceWithAstra } from "./travel-accommodation-providers/astra";
import {
  withinTravelBudget,
  type TravelProviderOptions,
  type TravelProviderResult,
} from "./travel-accommodation-providers/budget";

type ExtractionMeta = {
  resourceLinks?: HotelLink[];
  discoveredLinks?: HotelLink[];
  annotationLinks?: HotelLink[];
  accommodationPageTexts?: Array<{ pageNumber: number; text: string }>;
  sourceUrl?: string;
  extractedText?: string;
};
type EnrichParams = {
  sourceType: "file" | "url";
  sourceUrl?: string | null;
  sourceId?: string;
  extractedText: string;
  extractionMeta: ExtractionMeta | null | undefined;
  budgetMs?: number;
  signal?: AbortSignal;
  eventYear?: string | null;
};

export function extractHotelCardsFromContent(content: string) {
  return parseHotelEvidence(content).map((hotel) => ({
    name: hotel.name,
    bookingUrl: hotel.bookingUrl,
    address: hotel.address || null,
    phone: hotel.phone,
    reservationDeadline: hotel.reservationDeadline,
    rateSummary: hotel.groupRate,
    notes:
      [
        ...(hotel.distanceFromVenue ? [`Distance from Venue: ${hotel.distanceFromVenue}`] : []),
        ...(hotel.breakfast ? [`Breakfast: ${hotel.breakfast}`] : []),
        ...(hotel.parking ? [`Parking: ${hotel.parking}`] : []),
        ...hotel.notes,
      ].join(" | ") || null,
  }));
}
export function extractHotelCandidatesFromMarkdown(content: string) {
  return parseHotelEvidence(`Host Hotels\n${content}`).flatMap((hotel) =>
    hotel.bookingUrl ? [{ name: hotel.name, url: hotel.bookingUrl }] : [],
  );
}

export async function enrichTravelAccommodation(
  params: EnrichParams,
): Promise<TravelAccommodationResult> {
  params.signal?.throwIfAborted();
  const sourceUrl = hotelUrl(params.sourceUrl || params.extractionMeta?.sourceUrl);
  const meta = params.extractionMeta;
  const pages = meta?.accommodationPageTexts?.length
    ? meta.accommodationPageTexts
    : [{ pageNumber: 1, text: params.extractedText }];
  const candidateLinks = [
    ...(meta?.resourceLinks || []),
    ...(meta?.discoveredLinks || []),
    ...(meta?.annotationLinks || []),
    ...markdownHotelLinks(params.extractedText, sourceUrl),
  ].map((link) => ({
    ...link,
    sourceUrl: link.sourceUrl || sourceUrl,
    pageNumber: link.pageNumber || Number(link.sourceUrl?.match(/file-page-(\d+)/)?.[1]) || null,
  }));
  const candidates = detectTravelAccommodationCandidates({
    source: params.sourceType === "file" ? "pdf" : "url",
    extractedText: params.extractedText,
    pages,
    links: candidateLinks,
  });
  const context = {
    sourceUrl,
    sourceId: params.sourceId || sourceUrl || "uploaded-pdf",
    sourceType: params.sourceType === "file" ? ("pdf" as const) : ("web" as const),
    links: candidateLinks,
  };
  const inline =
    params.sourceType === "file"
      ? pages.flatMap((page) =>
          parseHotelEvidence(page.text, { ...context, pageNumber: page.pageNumber }),
        )
      : parseHotelEvidence(params.extractedText, context);
  let pdfHotels = params.sourceType === "file" ? inline : [];
  let webHotels = params.sourceType === "url" ? inline : [];
  const checkedAt = new Date().toISOString();
  const sources: HotelSource[] = pages.map((page) => ({
    id: context.sourceId,
    url: sourceUrl,
    parentUrl: null,
    pageNumber: params.sourceType === "file" ? page.pageNumber : null,
    type: context.sourceType,
    checkedAt,
  }));
  let fallbackLink = selectFallbackTravelLink(candidates) || (inline.length ? sourceUrl : null);
  const attempts: TravelAccommodationAttempt[] = [];
  let resolution: TravelAccommodationResult["resolution"] = {
    provider: "none",
    resolvedUrl: sourceUrl,
    resolutionType: inline.length
      ? params.sourceType === "file"
        ? "pdf_only"
        : "same_page_section"
      : "none",
    confidence: inline.length ? 0.9 : 0.4,
  };
  const queue = [
    ...new Set(
      candidates
        .filter(
          (candidate) =>
            candidate.url && !inline.some((hotel) => hotel.bookingUrl === candidate.url),
        )
        .map((candidate) => candidate.url!),
    ),
  ];
  if (fallbackLink && queue.includes(fallbackLink)) {
    queue.splice(queue.indexOf(fallbackLink), 1);
    queue.unshift(fallbackLink);
  }
  const budgetMs = Math.max(1, Math.min(60000, params.budgetMs ?? 25000));
  const deadline = Date.now() + budgetMs;
  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(new Error(`Hotel discovery timed out after ${budgetMs}ms`)),
    budgetMs,
  );
  const signal = params.signal
    ? AbortSignal.any([params.signal, controller.signal])
    : controller.signal;
  const visited = new Set<string>();
  const rejectedUrls = new Set<string>();
  const providers: Array<
    [
      TravelAccommodationAttempt["provider"],
      (url: string, options: TravelProviderOptions) => Promise<TravelProviderResult>,
    ]
  > = [];
  if (process.env.FIRECRAWL_API_KEY)
    providers.push(["firecrawl_scrape_json", extractHotelsWithFirecrawlScrape]);
  providers.push(["playwright", extractHotelsWithPlaywright]);
  if (process.env.DISCOVERY_TRAVEL_BROWSER_USE_ENABLED === "1")
    providers.push(["browser_use", extractHotelsWithBrowserUse]);
  try {
    if (
      !inline.length &&
      process.env.OPENAI_API_KEY &&
      /\b(hotels?|lodging|accommodation)\b/i.test(params.extractedText)
    ) {
      try {
        const recovered = await withinTravelBudget(
          () =>
            extractHotelEvidenceWithAstra(params.extractedText, context, {
              signal,
              timeoutMs: Math.max(1, deadline - Date.now()),
            }),
          signal,
        );
        if (params.sourceType === "file")
          for (const hotel of recovered)
            for (const facts of Object.values(hotel.evidence || {}))
              for (const fact of facts || []) {
                const matching = pages.filter((page) =>
                  page.text.replace(/\s+/g, " ").includes(fact.quote.replace(/\s+/g, " ")),
                );
                fact.pageNumber = matching.length === 1 ? matching[0].pageNumber : null;
              }
        if (params.sourceType === "file") pdfHotels = recovered;
        else webHotels = recovered;
        attempts.push({ provider: "astra", ok: true, url: sourceUrl, error: null });
      } catch (error) {
        attempts.push({
          provider: "astra",
          ok: false,
          url: sourceUrl,
          error: error instanceof Error ? error.message : "Hotel extraction failed",
        });
      }
    }
    while (queue.length && visited.size < 3 && !signal.aborted) {
      const target = hotelUrl(queue.shift(), sourceUrl);
      if (!target || visited.has(target) || (target === sourceUrl && inline.length)) continue;
      visited.add(target);
      const years: string[] = new URL(target).pathname.match(/\b20\d{2}\b/g) || [];
      if (params.eventYear && years.length && !years.includes(params.eventYear)) {
        rejectedUrls.add(target);
        attempts.push({
          provider: "none",
          ok: false,
          url: target,
          error: "Hotel link refers to a different event year",
        });
        continue;
      }
      sources.push({
        id: target,
        url: target,
        parentId: candidateLinks.find((link) => link.url === target)?.sourceUrl || context.sourceId,
        parentUrl: candidateLinks.find((link) => link.url === target)?.sourceUrl || sourceUrl,
        pageNumber: candidateLinks.find((link) => link.url === target)?.pageNumber || null,
        type: "web",
        checkedAt,
      });
      for (const [provider, extract] of providers) {
        if (signal.aborted) break;
        try {
          const response: TravelProviderResult = await withinTravelBudget(
            () => extract(target, { signal, timeoutMs: Math.max(1, deadline - Date.now()) }),
            signal,
          );
          attempts.push(response.attempt);
          if (!response.attempt.ok) continue;
          const resolved: string = hotelUrl(response.attempt.url) || target;
          const resolvedYears: string[] = new URL(resolved).pathname.match(/\b20\d{2}\b/g) || [];
          if (
            params.eventYear &&
            resolvedYears.length &&
            !resolvedYears.includes(params.eventYear)
          ) {
            rejectedUrls.add(target);
            rejectedUrls.add(resolved);
            attempts.push({
              provider,
              ok: false,
              url: resolved,
              error: "Hotel page redirected to a different event year",
            });
            break;
          }
          if (resolved !== target)
            sources.push({
              id: resolved,
              url: resolved,
              parentUrl: target,
              parentId: target,
              pageNumber: null,
              type: "web",
              checkedAt,
            });
          webHotels = mergePdfAndWebHotels(webHotels, response.hotels);
          const links = [
            ...(response.links || []),
            ...markdownHotelLinks(response.content || "", target),
          ];
          const followups = detectTravelAccommodationCandidates({
            source: "web",
            extractedText: response.content || "",
            links: links.map((link) => ({ ...link, sourceUrl: target })),
          });
          candidates.push(...followups);
          const linked =
            selectFallbackTravelLink(followups) || hotelUrl(response.fallbackLink, target);
          if (
            linked &&
            !response.hotels.some((hotel) => hotel.bookingUrl === linked) &&
            !visited.has(linked)
          ) {
            fallbackLink = linked;
            queue.unshift(linked);
            candidateLinks.push({ url: linked, sourceUrl: target, pageNumber: null });
          }
          if (response.hotels.length) {
            resolution = {
              provider,
              resolvedUrl: target,
              resolutionType: target === sourceUrl ? "same_page_section" : "same_domain_followup",
              confidence: 0.9,
            };
            if (!fallbackLink) fallbackLink = target;
            break;
          }
          if (linked && !visited.has(linked)) break;
        } catch (error) {
          attempts.push({
            provider,
            ok: false,
            url: target,
            error: error instanceof Error ? error.message : "Hotel discovery failed",
          });
        }
      }
    }
    params.signal?.throwIfAborted();
    const acceptedCandidates = candidates.filter(
      (candidate) => !candidate.url || !rejectedUrls.has(candidate.url),
    );
    const result = buildTravelAccommodationResult({
      candidates: acceptedCandidates,
      pdfHotels,
      webHotels,
      fallbackLink:
        fallbackLink && rejectedUrls.has(fallbackLink)
          ? selectFallbackTravelLink(acceptedCandidates)
          : fallbackLink,
      attempts,
      resolution,
    });
    return { ...result, sources };
  } finally {
    clearTimeout(timer);
  }
}

export function buildTravelAccommodationState(
  result: TravelAccommodationResult,
  previous?: {
    hotels?: TravelAccommodationHotel[];
    fallbackLink?: string | null;
    sources?: HotelSource[];
  } | null,
) {
  const incomplete =
    result.attempts.some((attempt) => !attempt.ok) ||
    result.hotels.some((hotel) => Object.keys(hotel.conflicts || {}).length > 0);
  const hotels = [
    ...result.hotels.map((hotel) => {
      const old = previous?.hotels?.find(
        (item) =>
          (hotel.id && item.id === hotel.id) ||
          item.name.toLowerCase() === hotel.name.toLowerCase(),
      );
      if (!incomplete || !old) return hotel;
      const retained = { ...hotel, evidence: { ...hotel.evidence } };
      for (const field of HOTEL_FIELDS) {
        if (
          field === "name" ||
          retained[field] ||
          retained.conflicts?.[field]?.length ||
          !old[field]
        )
          continue;
        retained[field] = old[field];
        retained.evidence[field] = old.evidence?.[field] || [];
      }
      return retained;
    }),
    ...(previous?.hotels || []).filter(
      (old) =>
        !result.hotels.some(
          (hotel) =>
            (hotel.id && hotel.id === old.id) ||
            hotel.name.toLowerCase() === old.name.toLowerCase(),
        ),
    ),
  ];
  const fallbackLink = result.fallbackLink || previous?.fallbackLink || null;
  const checkedAt = new Date().toISOString();
  return {
    version: 3,
    reviewReasons: hotels.flatMap((hotel) =>
      Object.keys(hotel.conflicts || {}).map(
        (field) => `${hotel.name}: conflicting ${field} in accommodation sources`,
      ),
    ),
    status: hotels.length
      ? incomplete || hotels.length > result.hotels.length
        ? "partial"
        : "complete"
      : fallbackLink
        ? "link_only"
        : "unavailable",
    hotels,
    pdfHotels: result.pdfHotels,
    candidates: result.candidates,
    fallbackLink,
    resolution: result.resolution,
    sources: [...(previous?.sources || []), ...(result.sources || [])].slice(-24),
    attempts: result.attempts,
    confidence: result.confidence,
    narrative: summarizeHotelsForNarrative(hotels, fallbackLink),
    lastCheckedAt: checkedAt,
    updatedAt: checkedAt,
    hotelSource: {
      resolvedUrl: result.resolution.resolvedUrl,
      provider: result.resolution.provider,
      resolutionType: result.resolution.resolutionType,
      confidence: result.confidence,
    },
  };
}
