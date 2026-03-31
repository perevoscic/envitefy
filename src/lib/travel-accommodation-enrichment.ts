type TravelAccommodationLink = {
  label: string;
  url: string;
};

export type TravelAccommodationHotel = {
  name: string;
  bookingUrl?: string;
  imageUrl?: string;
  address?: string;
  phone?: string;
  reservationDeadline?: string;
  rateSummary?: string;
  notes?: string;
};

export type TravelAccommodationSource = {
  provider: "firecrawl" | "legacy";
  sourceUrl: string | null;
  scrapedAt: string;
  lastError: string | null;
};

export type TravelAccommodation = {
  hotels: TravelAccommodationHotel[];
  fallbackLink: TravelAccommodationLink | null;
  hotelSource: TravelAccommodationSource;
};

type NormalizedHotelHubLink = TravelAccommodationLink & {
  kind: string;
  sourceUrl: string;
  sameHostAsSource: boolean;
  hostHotelHubLike: boolean;
};

function safeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeUrl(value: unknown, baseUrl?: string): string {
  const raw = safeString(value);
  if (!raw) return "";
  try {
    return new URL(raw, safeString(baseUrl) || undefined).toString();
  } catch {
    return "";
  }
}

function normalizeWhitespace(value: string): string {
  return safeString(value).replace(/\s+/g, " ").trim();
}

function decodeHtmlEntities(value: string): string {
  return safeString(value)
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function stripMarkdownDecorators(value: string): string {
  return normalizeWhitespace(
    decodeHtmlEntities(value)
      .replace(/^\s{0,3}#{1,6}\s*/g, "")
      .replace(/^\s*[-*+]\s+/g, "")
      .replace(/^\s*\d+\.\s+/g, "")
      .replace(/!\[[^\]]*]\((https?:\/\/[^)\s]+)\)/gi, " ")
      .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/gi, "$1")
      .replace(/https?:\/\/[^\s)|]+/gi, " ")
      .replace(/[|*_`>]+/g, " ")
      .trim()
  );
}

function sanitizeRichTextContent(value: string): string {
  return decodeHtmlEntities(value)
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\/(?:p|div|section|article|li|ul|ol|h[1-6]|tr|table)>/gi, "\n")
    .replace(/<li[^>]*>/gi, "- ")
    .replace(/<img\b[^>]*>/gi, (match) => {
      const src = safeString(match.match(/\bsrc=['"]([^'"]+)['"]/i)?.[1]);
      if (!src) return " ";
      const alt = safeString(match.match(/\balt=['"]([^'"]*)['"]/i)?.[1]);
      return `![${alt}](${src})`;
    })
    .replace(/<a[^>]+href=['"]([^'"]+)['"][^>]*>([\s\S]*?)<\/a>/gi, (_match, href, text) => {
      const label = stripMarkdownDecorators(
        decodeHtmlEntities(
          String(text)
            .replace(/<img[^>]*alt=['"]([^'"]*)['"][^>]*>/gi, "$1 ")
            .replace(/<[^>]+>/g, " ")
        )
      );
      return label ? `[${label}](${href})` : href;
    })
    .replace(/<[^>]+>/g, " ")
    .replace(/\r/g, "");
}

function sameHost(left: string, right: string): boolean {
  const a = normalizeUrl(left);
  const b = normalizeUrl(right);
  if (!a || !b) return false;
  try {
    return new URL(a).host === new URL(b).host;
  } catch {
    return false;
  }
}

function isLikelyHotelHubLabel(value: string): boolean {
  return /\b(host hotels?|host hotel information|hotel information|hotel accommodations?|travel accommodations?)\b/i.test(
    safeString(value)
  );
}

function uniqueLinks(items: Array<TravelAccommodationLink | null>, limit: number): TravelAccommodationLink[] {
  const seen = new Set<string>();
  const out: TravelAccommodationLink[] = [];
  for (const item of items) {
    if (!item) continue;
    const url = normalizeUrl(item.url);
    if (!url || seen.has(url)) continue;
    seen.add(url);
    out.push({
      label: safeString(item.label) || "Host Hotels",
      url,
    });
    if (out.length >= limit) break;
  }
  return out;
}

function cleanHotelName(value: string): string {
  return normalizeWhitespace(
    stripMarkdownDecorators(value)
      .replace(
        /\b(click here|click to book|book now|book here|book|reserve(?: now)?|reservations?|room block|group code|book hotel)\b/gi,
        ""
      )
      .replace(/[-–—:]+$/g, "")
  );
}

function looksLikeHotelName(value: string): boolean {
  return /\b(hotel|inn|resort|suites?|marriott|hilton|hyatt|hampton|holiday|courtyard|westin|sheraton|wyndham|drury|embassy|doubletree|springhill|fairfield|comfort|quality inn|best western|aloft|homewood|residence inn|staybridge|tru by hilton)\b/i.test(
    value
  );
}

function isGenericBookingLabel(value: string): boolean {
  return /^(host hotels?|host hotel information|hotel information|book(?: now| here)?|reserve(?: now)?|reservations?|lodging|travel|hotel booking|booking|click here|learn more)$/i.test(
    safeString(value)
  );
}

function looksLikeAddress(value: string): boolean {
  const line = safeString(value);
  if (!line) return false;
  if (/\b(?:street|st\.|avenue|ave\.|road|rd\.|boulevard|blvd|drive|dr\.|lane|ln\.|court|ct\.|circle|cir\.|way|parkway|pkwy|plaza|trail|trl|suite|ste\.|floor|fl\.)\b/i.test(line)) {
    return true;
  }
  return /,\s*[A-Z]{2}\s+\d{5}(?:-\d{4})?\b/.test(line);
}

function extractPhone(value: string): string {
  const match = safeString(value).match(
    /(?:\+?1[\s.-]*)?(?:\(\d{3}\)|\d{3})[\s.-]*\d{3}[\s.-]*\d{4}/
  );
  return match?.[0] || "";
}

function extractReservationDeadline(value: string): string {
  const normalized = safeString(value);
  if (!/\b(deadline|book by|reserve by|cut[\s-]?off|last day to book)\b/i.test(normalized)) {
    return "";
  }
  return normalizeWhitespace(
    normalized.replace(
      /^(?:reservation\s+deadline|deadline(?: to book)?|book by|reserve by|cut[\s-]?off(?: date)?|last day to book)\s*[:-]?\s*/i,
      ""
    )
  );
}

function extractRateSummary(value: string): string {
  const normalized = safeString(value);
  if (
    !/\b(rate|rates|nightly|night|queen|double|king|suite|room block|group rate|tax)\b/i.test(
      normalized
    ) &&
    !/\$\s*\d/.test(normalized)
  ) {
    return "";
  }
  return normalizeWhitespace(
    normalized.replace(/^(?:rates?|rate(?: summary)?|group rate)\s*[:-]?\s*/i, "")
  );
}

function extractHttpUrls(value: string, baseUrl?: string): string[] {
  const out = safeString(value)
    .match(/https?:\/\/[^\s)"'<>]+/gi)
    ?.map((item) => normalizeUrl(item, baseUrl))
    .filter(Boolean);
  return Array.from(new Set(out || []));
}

function isImageUrl(value: string): boolean {
  return /\.(?:png|jpe?g|gif|webp|svg)(?:\?|#|$)/i.test(safeString(value));
}

function extractImageUrls(value: string, baseUrl?: string): string[] {
  const out = new Set<string>();
  for (const match of safeString(value).matchAll(/!\[[^\]]*]\(([^)\s]+)\)/gi)) {
    const normalized = normalizeUrl(match[1] || "", baseUrl);
    if (normalized && isImageUrl(normalized)) out.add(normalized);
  }
  for (const match of safeString(value).matchAll(/<img\b[^>]*src=['"]([^'"]+)['"][^>]*>/gi)) {
    const normalized = normalizeUrl(match[1] || "", baseUrl);
    if (normalized && isImageUrl(normalized)) out.add(normalized);
  }
  return Array.from(out);
}

function isSectionBoundary(line: string): boolean {
  const cleaned = stripMarkdownDecorators(line);
  if (!cleaned) return false;
  if (isLikelyHotelHubLabel(cleaned)) return false;
  if (/^\s{0,3}#{1,6}\s+/.test(line)) {
    return /\b(venue|parking|admission|results?|rotation|schedule|documents?|tickets?|spectator|registration|contact|map|directions|photo|video|apparel|faq|awards?|coach|session|travel)\b/i.test(
      cleaned
    );
  }
  return /^(venue|parking|admission|results?|rotation|schedule|documents?|tickets?|spectator information|registration information|contact|map|directions|photo\/video|apparel|faq|awards?|coach information|session information|travel information)$/i.test(
    cleaned
  );
}

function collectSectionLines(content: string): string[] {
  const lines = sanitizeRichTextContent(content)
    .split(/\n+/)
    .map((line) => safeString(line))
    .filter(Boolean);
  if (lines.length === 0) return [];

  const startIndex = lines.findIndex((line) => isLikelyHotelHubLabel(stripMarkdownDecorators(line)));
  if (startIndex === -1) return lines;

  const section: string[] = [];
  for (let index = startIndex + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (section.length > 0 && isSectionBoundary(line)) break;
    section.push(line);
  }
  return section.length > 0 ? section : lines.slice(startIndex + 1);
}

function splitHotelCards(lines: string[]): string[][] {
  const cards: string[][] = [];
  let current: string[] = [];

  const flush = () => {
    const compact = current.map((line) => safeString(line)).filter(Boolean);
    if (compact.length > 0) cards.push(compact);
    current = [];
  };

  const hasNonImageContent = (items: string[]) =>
    items.some((item) => {
      const cleaned = stripMarkdownDecorators(item);
      return Boolean(cleaned);
    });

  for (const line of lines) {
    const cleaned = stripMarkdownDecorators(line);
    const imageUrls = extractImageUrls(line);
    if (!cleaned && imageUrls.length === 0) {
      flush();
      continue;
    }
    if (/^(?:---+|\*\*\*+|___+)$/i.test(cleaned)) {
      flush();
      continue;
    }
    const headingLike = /^\s{0,3}#{2,6}\s+/.test(line) || /^hotel[:\s]/i.test(cleaned);
    const hotelNameLike = looksLikeHotelName(cleaned) && !isGenericBookingLabel(cleaned);
    if (current.length > 0 && (headingLike || hotelNameLike) && hasNonImageContent(current)) {
      flush();
    }
    current.push(line);
  }
  flush();
  return cards;
}

function chooseBookingUrl(lines: string[], baseUrl: string): string {
  const candidates = lines.flatMap((line) => {
    const urls = extractHttpUrls(line, baseUrl).filter((url) => !isImageUrl(url));
    if (urls.length === 0) return [];
    return urls.map((url) => ({
      url,
      score:
        (/\b(book|reserve|reservation|host hotel|hotel information|hotel booking|lodging)\b/i.test(
          line
        )
          ? 5
          : 0) +
        (/groupbook|eventpipe|book|reserve|hotel/i.test(url) ? 2 : 0),
    }));
  });

  return candidates.sort((left, right) => right.score - left.score)[0]?.url || "";
}

function chooseImageUrl(lines: string[], baseUrl: string): string {
  for (const line of lines) {
    const match = extractImageUrls(line, baseUrl)[0];
    if (match) return match;
  }
  return "";
}

function chooseHotelName(lines: string[]): string {
  for (const line of lines) {
    const candidate = cleanHotelName(line);
    if (!candidate || isGenericBookingLabel(candidate)) continue;
    if (
      looksLikeHotelName(candidate) &&
      !looksLikeAddress(candidate) &&
      !extractPhone(candidate) &&
      !extractReservationDeadline(candidate) &&
      !extractRateSummary(candidate)
    ) {
      return candidate;
    }
  }
  return "";
}

function normalizeNoteLine(value: string): string {
  return normalizeWhitespace(
    stripMarkdownDecorators(value).replace(
      /^(?:phone|reservation deadline|deadline(?: to book)?|book by|reserve by|rate(?: summary)?|rates?)\s*[:-]\s*/i,
      ""
    )
  );
}

function extractHotelFromCard(lines: string[], baseUrl: string): TravelAccommodationHotel | null {
  const bookingUrl = chooseBookingUrl(lines, baseUrl);
  const imageUrl = chooseImageUrl(lines, baseUrl);
  const name = chooseHotelName(lines);

  let address = "";
  let phone = "";
  let reservationDeadline = "";
  let rateSummary = "";
  const noteLines: string[] = [];

  for (const line of lines) {
    const normalizedLine = stripMarkdownDecorators(line);
    if (extractImageUrls(line, baseUrl).length > 0) continue;
    const cleaned = normalizeNoteLine(line);
    if (!normalizedLine) continue;
    if (!address && looksLikeAddress(normalizedLine)) {
      address = normalizeWhitespace(normalizedLine);
      continue;
    }
    if (!phone) {
      const extractedPhone = extractPhone(normalizedLine);
      if (extractedPhone) {
        phone = extractedPhone;
        continue;
      }
    }
    if (!reservationDeadline) {
      const extractedDeadline = extractReservationDeadline(normalizedLine);
      if (extractedDeadline) {
        reservationDeadline = extractedDeadline;
        continue;
      }
    }
    if (!rateSummary) {
      const extractedRate = extractRateSummary(normalizedLine);
      if (extractedRate) {
        rateSummary = extractedRate;
        continue;
      }
    }
    if (!cleaned) continue;
    if (
      cleaned === name ||
      cleaned === address ||
      cleaned === phone ||
      cleaned === reservationDeadline ||
      cleaned === rateSummary ||
      cleaned.startsWith("![") ||
      isGenericBookingLabel(cleaned) ||
      isLikelyHotelHubLabel(cleaned)
    ) {
      continue;
    }
    if (extractHttpUrls(line, baseUrl).some((url) => url === bookingUrl)) continue;
    noteLines.push(cleaned);
  }

  if (!name && !bookingUrl) return null;
  return {
    name: name || cleanHotelName(noteLines[0] || ""),
    ...(bookingUrl ? { bookingUrl } : {}),
    ...(imageUrl ? { imageUrl } : {}),
    ...(address ? { address } : {}),
    ...(phone ? { phone } : {}),
    ...(reservationDeadline ? { reservationDeadline } : {}),
    ...(rateSummary ? { rateSummary } : {}),
    ...(noteLines.length > 0 ? { notes: Array.from(new Set(noteLines)).join(" | ") } : {}),
  };
}

function uniqueHotels(items: TravelAccommodationHotel[], limit: number): TravelAccommodationHotel[] {
  const seen = new Set<string>();
  const out: TravelAccommodationHotel[] = [];
  for (const item of items) {
    const normalized: TravelAccommodationHotel = {
      name: cleanHotelName(item.name),
      ...(item.bookingUrl ? { bookingUrl: normalizeUrl(item.bookingUrl) } : {}),
      ...(item.imageUrl ? { imageUrl: normalizeUrl(item.imageUrl) } : {}),
      ...(item.address ? { address: normalizeWhitespace(item.address) } : {}),
      ...(item.phone ? { phone: normalizeWhitespace(item.phone) } : {}),
      ...(item.reservationDeadline
        ? { reservationDeadline: normalizeWhitespace(item.reservationDeadline) }
        : {}),
      ...(item.rateSummary ? { rateSummary: normalizeWhitespace(item.rateSummary) } : {}),
      ...(item.notes ? { notes: normalizeWhitespace(item.notes) } : {}),
    };
    if (!normalized.name && !normalized.bookingUrl) continue;
    const key =
      normalized.bookingUrl ||
      [
        normalized.name.toLowerCase(),
        safeString(normalized.address).toLowerCase(),
        safeString(normalized.phone).toLowerCase(),
      ].join("|");
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(normalized);
    if (out.length >= limit) break;
  }
  return out;
}

function normalizeHotelHubLinks(resourceLinks: unknown): NormalizedHotelHubLink[] {
  return (Array.isArray(resourceLinks) ? resourceLinks : [])
    .map((item: any) => {
      const url = normalizeUrl(item?.url);
      return {
        kind: safeString(item?.kind),
        label: safeString(item?.label) || "Host Hotels",
        url,
        sourceUrl: normalizeUrl(item?.sourceUrl),
        sameHostAsSource: sameHost(item?.url, item?.sourceUrl),
        hostHotelHubLike: isLikelyHotelHubLabel(item?.label),
      };
    })
    .filter((item) => item.url && item.kind === "hotel_booking");
}

function pickHotelHubLinks(resourceLinks: unknown): {
  sourceLink: TravelAccommodationLink | null;
  fallbackLink: TravelAccommodationLink | null;
} {
  const normalized = normalizeHotelHubLinks(resourceLinks);
  if (normalized.length === 0) {
    return { sourceLink: null, fallbackLink: null };
  }

  const sourceCandidate =
    normalized.find((item) => item.sameHostAsSource && item.hostHotelHubLike) ||
    normalized.find((item) => item.sameHostAsSource) ||
    normalized.find((item) => item.hostHotelHubLike) ||
    normalized[0];

  const backupLinks = uniqueLinks(
    [
      ...normalized
        .filter((item) => item.url !== sourceCandidate.url && item.hostHotelHubLike)
        .map((item) => ({ label: item.label, url: item.url })),
      ...normalized
        .filter((item) => item.url !== sourceCandidate.url)
        .map((item) => ({ label: item.label, url: item.url })),
      { label: sourceCandidate.label, url: sourceCandidate.url },
    ],
    1
  );

  return {
    sourceLink: { label: sourceCandidate.label, url: sourceCandidate.url },
    fallbackLink: backupLinks[0] || null,
  };
}

export function extractHotelCardsFromContent(
  content: string,
  options?: { baseUrl?: string | null }
): TravelAccommodationHotel[] {
  const baseUrl = safeString(options?.baseUrl);
  const sectionLines = collectSectionLines(content);
  const cards = splitHotelCards(sectionLines);
  return uniqueHotels(
    cards
      .map((card) => extractHotelFromCard(card, baseUrl))
      .filter((item): item is TravelAccommodationHotel => Boolean(item?.name || item?.bookingUrl)),
    12
  );
}

export function extractHotelCandidatesFromMarkdown(
  markdown: string
): Array<{ name: string; url: string }> {
  const out: Array<{ name: string; url: string }> = [];
  const seen = new Set<string>();
  const lines = sanitizeRichTextContent(markdown)
    .split(/\n+/)
    .map((line) => safeString(line))
    .filter(Boolean);
  const addCandidate = (name: string, url: string) => {
    const normalizedUrl = normalizeUrl(url);
    const cleanedName = cleanHotelName(name);
    if (!normalizedUrl || !cleanedName || isGenericBookingLabel(cleanedName)) return;
    const key = `${cleanedName.toLowerCase()}|${normalizedUrl.toLowerCase()}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ name: cleanedName, url: normalizedUrl });
  };
  const deriveHotelNameFromLine = (line: string) => {
    const stripped = cleanHotelName(stripMarkdownDecorators(line));
    if (!stripped || isGenericBookingLabel(stripped)) return "";
    return looksLikeHotelName(stripped) ? stripped : "";
  };
  const deriveHotelNameFromContext = (lineIndex: number, label: string) => {
    const cleanedLabel = cleanHotelName(label);
    if (cleanedLabel && looksLikeHotelName(cleanedLabel) && !isGenericBookingLabel(cleanedLabel)) {
      return cleanedLabel;
    }
    return (
      deriveHotelNameFromLine(lines[lineIndex] || "") ||
      deriveHotelNameFromLine(lines[lineIndex - 1] || "") ||
      deriveHotelNameFromLine(lines[lineIndex + 1] || "") ||
      (cleanedLabel && !isGenericBookingLabel(cleanedLabel) ? cleanedLabel : "")
    );
  };

  const markdownLinkRe = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g;
  lines.forEach((line, lineIndex) => {
    for (let match = markdownLinkRe.exec(line); match; match = markdownLinkRe.exec(line)) {
      const name = deriveHotelNameFromContext(lineIndex, match[1] || "");
      if (!name && !/\b(book|reserve|reservation)\b/i.test(match[1] || "")) continue;
      addCandidate(name, match[2] || "");
    }
  });

  const bareUrlRe = /https?:\/\/[^\s)|]+/g;
  lines.forEach((line, lineIndex) => {
    for (let match = bareUrlRe.exec(line); match; match = bareUrlRe.exec(line)) {
      const name = deriveHotelNameFromContext(lineIndex, line);
      if (!name) continue;
      addCandidate(name, match[0] || "");
    }
  });

  return out;
}

async function firecrawlScrapeContent(params: {
  url: string;
  apiKey: string;
  timeoutMs: number;
}): Promise<{ content: string; finalUrl?: string | null }> {
  const { url, apiKey, timeoutMs } = params;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const payload = {
    url,
    formats: ["markdown", "html"],
  };
  const tryOnce = async (endpoint: string) => {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Firecrawl scrape failed (${res.status}): ${text.slice(0, 300)}`);
    }
    const json: any = await res.json();
    const markdown =
      safeString(json?.data?.markdown) ||
      safeString(json?.data?.content?.markdown) ||
      safeString(json?.data?.content) ||
      safeString(json?.markdown) ||
      "";
    const html =
      safeString(json?.data?.html) ||
      safeString(json?.data?.content?.html) ||
      safeString(json?.html) ||
      "";
    const finalUrl = safeString(json?.data?.metadata?.sourceURL || json?.data?.metadata?.sourceUrl || "");
    return {
      content: [markdown, html].filter(Boolean).join("\n\n"),
      finalUrl: finalUrl || null,
    };
  };
  try {
    return await tryOnce("https://api.firecrawl.dev/v1/scrape");
  } catch (error: any) {
    if (error?.name === "AbortError") {
      throw new Error(`Firecrawl scrape timed out after ${timeoutMs}ms`);
    }
    return await tryOnce("https://api.firecrawl.dev/v0/scrape");
  } finally {
    clearTimeout(timeout);
  }
}

export async function enrichTravelAccommodation(params: {
  traceId?: string | null;
  extractionMeta: any;
  existing?: TravelAccommodation | null;
  budgetMs?: number;
}): Promise<TravelAccommodation | null> {
  const firecrawlKey = safeString(process.env.FIRECRAWL_API_KEY);
  if (!firecrawlKey) return null;

  const startedAt = new Date().toISOString();
  const { sourceLink, fallbackLink } = pickHotelHubLinks(params.extractionMeta?.resourceLinks);
  const sourceUrl = sourceLink?.url || null;
  const timeoutMs = Math.max(1500, Math.min(Number(params.budgetMs) || 12_000, 25_000));

  if (!sourceUrl) {
    return {
      hotels: [],
      fallbackLink: null,
      hotelSource: {
        provider: "firecrawl",
        sourceUrl: null,
        scrapedAt: startedAt,
        lastError: "No hotel hub link found.",
      },
    };
  }

  console.log("[travel-accommodation] firecrawl scrape started", {
    traceId: params.traceId || null,
    url: sourceUrl,
    timeoutMs,
  });

  try {
    const scraped = await firecrawlScrapeContent({
      url: sourceUrl,
      apiKey: firecrawlKey,
      timeoutMs,
    });
    const effectiveSourceUrl = scraped.finalUrl || sourceUrl;
    const hotels = uniqueHotels(
      extractHotelCardsFromContent(scraped.content || "", {
        baseUrl: effectiveSourceUrl,
      }),
      12
    );

    console.log("[travel-accommodation] firecrawl scrape finished", {
      traceId: params.traceId || null,
      url: sourceUrl,
      scrapedChars: (scraped.content || "").length,
      hotelCount: hotels.length,
    });

    return {
      hotels,
      fallbackLink,
      hotelSource: {
        provider: "firecrawl",
        sourceUrl: effectiveSourceUrl,
        scrapedAt: startedAt,
        lastError: null,
      },
    };
  } catch (error: any) {
    console.error("[travel-accommodation] firecrawl scrape failed", {
      traceId: params.traceId || null,
      url: sourceUrl,
      message: error?.message || String(error),
    });
    return {
      hotels: [],
      fallbackLink,
      hotelSource: {
        provider: "firecrawl",
        sourceUrl,
        scrapedAt: startedAt,
        lastError: error?.message || String(error),
      },
    };
  }
}
