type TravelAccommodationLink = {
  label: string;
  url: string;
};

export type TravelAccommodationHotel = {
  name: string;
  bookingUrl?: string;
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

function pickArray(value: unknown): any[] {
  return Array.isArray(value) ? value : [];
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

function normalizeCompareText(value: string): string {
  return normalizeWhitespace(
    decodeHtmlEntities(safeString(value))
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, " ")
  );
}

function normalizeDigits(value: string): string {
  return safeString(value).replace(/\D+/g, "");
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
  const normalized = safeString(value).replace(/[-_]+/g, " ");
  return /\b(host hotels?|host hotel information|hotel information|hotel accommodations?|travel accommodations?)\b/i.test(
    normalized
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
  return /^(host hotels?|host hotel information|hotel information|hotel online|hotel online booking|book(?: now| here)?|reserve(?: now)?|reserve hotel online|reservations?|lodging|travel|hotel booking|booking|click here|learn more)$/i.test(
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

function isSectionBoundary(line: string): boolean {
  const cleaned = stripMarkdownDecorators(line);
  if (!cleaned) return false;
  if (isLikelyHotelHubLabel(cleaned)) return false;
  if (/^\s{0,3}#{1,6}\s+/.test(line)) {
    return /\b(venue|parking|admission|results?|rotation|schedule|documents?|tickets?|spectator|registration|contact|map|directions|photo|video|apparel|faq|awards?|coach|session|travel|attractions?|things to do|restaurants?|dining|shopping|visitor information)\b/i.test(
      cleaned
    );
  }
  return /^(venue|parking|admission|results?|rotation|schedule|documents?|tickets?|spectator information|registration information|contact|map|directions|photo\/video|apparel|faq|awards?|coach information|session information|travel information|local attractions|area attractions|things to do|restaurants|dining|shopping|visitor information)$/i.test(
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

  for (const line of lines) {
    const cleaned = stripMarkdownDecorators(line);
    if (!cleaned) {
      flush();
      continue;
    }
    if (/^(?:---+|\*\*\*+|___+)$/i.test(cleaned)) {
      flush();
      continue;
    }
    const genericBookingLabel = isGenericBookingLabel(cleaned);
    const headingLike =
      !genericBookingLabel && (/^\s{0,3}#{2,6}\s+/.test(line) || /^hotel[:\s]/i.test(cleaned));
    const hotelNameLike = looksLikeHotelName(cleaned) && !genericBookingLabel;
    if (current.length > 0 && (headingLike || hotelNameLike)) {
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
  const name = chooseHotelName(lines);

  let address = "";
  let phone = "";
  let reservationDeadline = "";
  let rateSummary = "";
  const noteLines: string[] = [];

  for (const line of lines) {
    const normalizedLine = stripMarkdownDecorators(line);
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
      isGenericBookingLabel(cleaned) ||
      isLikelyHotelHubLabel(cleaned)
    ) {
      continue;
    }
    if (extractHttpUrls(line, baseUrl).some((url) => url === bookingUrl)) continue;
    noteLines.push(cleaned);
  }

  const fallbackName = cleanHotelName(noteLines[0] || "");
  if (!name && !fallbackName && bookingUrl && !address && !phone && !reservationDeadline && !rateSummary) {
    return null;
  }
  if (!name && !bookingUrl) return null;
  return {
    name: name || fallbackName,
    ...(bookingUrl ? { bookingUrl } : {}),
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

function countHotelFields(item: TravelAccommodationHotel): number {
  return [
    safeString(item.name),
    safeString(item.bookingUrl),
    safeString(item.address),
    safeString(item.phone),
    safeString(item.reservationDeadline),
    safeString(item.rateSummary),
    safeString(item.notes),
  ].filter(Boolean).length;
}

function isSuspiciousHotelName(value: string): boolean {
  const cleaned = cleanHotelName(value);
  return (
    !cleaned ||
    isGenericBookingLabel(cleaned) ||
    /^(hotel online|online booking|booking|reservation|reserve here|book here)$/i.test(cleaned)
  );
}

function notesFromGroundedSegments(value: unknown, normalizedText: string): string {
  const segments = safeString(value)
    .split(/\s*\|\s*|\n+/)
    .map((item) => normalizeWhitespace(item))
    .filter(Boolean);
  const seen = new Set<string>();
  const grounded: string[] = [];
  for (const segment of segments) {
    const key = normalizeCompareText(segment);
    if (!key || seen.has(key)) continue;
    if (!normalizedText.includes(key)) continue;
    seen.add(key);
    grounded.push(segment);
  }
  return grounded.join(" | ");
}

function hotelKey(item: TravelAccommodationHotel): string {
  const bookingUrl = normalizeUrl(item.bookingUrl);
  if (bookingUrl) return bookingUrl;
  return normalizeCompareText(item.name);
}

function hotelsLikelyMatch(left: TravelAccommodationHotel, right: TravelAccommodationHotel): boolean {
  const leftUrl = normalizeUrl(left.bookingUrl);
  const rightUrl = normalizeUrl(right.bookingUrl);
  if (leftUrl && rightUrl) return leftUrl === rightUrl;
  const leftName = normalizeCompareText(left.name);
  const rightName = normalizeCompareText(right.name);
  return Boolean(leftName && rightName && leftName === rightName);
}

function mergeHotelSets(
  primary: TravelAccommodationHotel[],
  secondary: TravelAccommodationHotel[],
  limit: number
): TravelAccommodationHotel[] {
  const used = new Set<number>();
  const merged = primary.map((item) => {
    const matchIndex = secondary.findIndex((candidate, index) => {
      if (used.has(index)) return false;
      return hotelsLikelyMatch(item, candidate);
    });
    if (matchIndex === -1) return item;
    used.add(matchIndex);
    const match = secondary[matchIndex];
    return {
      name: safeString(item.name) || safeString(match.name),
      bookingUrl: normalizeUrl(item.bookingUrl) || normalizeUrl(match.bookingUrl) || undefined,
      address: normalizeWhitespace(item.address || match.address || ""),
      phone: normalizeWhitespace(item.phone || match.phone || ""),
      reservationDeadline: normalizeWhitespace(
        item.reservationDeadline || match.reservationDeadline || ""
      ),
      rateSummary: normalizeWhitespace(item.rateSummary || match.rateSummary || ""),
      notes: normalizeWhitespace(item.notes || match.notes || ""),
    };
  });
  secondary.forEach((item, index) => {
    if (used.has(index)) return;
    merged.push(item);
  });
  return uniqueHotels(merged, limit);
}

function scoreHotelSet(hotels: TravelAccommodationHotel[], content: string, baseUrl: string): number {
  const normalizedText = normalizeCompareText(content);
  const normalizedDigits = normalizeDigits(content);
  const contentUrls = new Set(extractHttpUrls(content, baseUrl));
  let score = 0;
  for (const hotel of hotels) {
    const name = cleanHotelName(hotel.name);
    const bookingUrl = normalizeUrl(hotel.bookingUrl, baseUrl);
    const fieldCount = countHotelFields(hotel);
    if (name) score += 4;
    if (bookingUrl) score += contentUrls.has(bookingUrl) ? 2 : 1;
    if (safeString(hotel.address)) score += 1;
    if (safeString(hotel.phone)) score += normalizedDigits.includes(normalizeDigits(hotel.phone)) ? 1 : 0;
    if (safeString(hotel.reservationDeadline)) score += 1;
    if (safeString(hotel.rateSummary)) score += 1;
    if (safeString(hotel.notes)) score += 1;
    if (isSuspiciousHotelName(name)) score -= 8;
    if (name && normalizedText.includes(normalizeCompareText(name))) score += 2;
    if (fieldCount <= 2) score -= 3;
  }
  if (hotels.length > 8) score -= (hotels.length - 8) * 2;
  return score;
}

function shouldAttemptAiHotelFallback(
  hotels: TravelAccommodationHotel[],
  content: string,
  baseUrl: string
): { shouldFallback: boolean; reasons: string[] } {
  const reasons: string[] = [];
  const suspiciousCount = hotels.filter((item) => isSuspiciousHotelName(item.name)).length;
  const sparseCount = hotels.filter((item) => countHotelFields(item) <= 2).length;
  const hotelCandidatesFromLinks = extractHotelCandidatesFromMarkdown(content);
  const normalizedHotelNames = new Set(
    hotels.map((item) => normalizeCompareText(item.name)).filter(Boolean)
  );
  const candidateGapCount = hotelCandidatesFromLinks.filter(
    (item) => !normalizedHotelNames.has(normalizeCompareText(item.name))
  ).length;
  if (hotels.length === 0) reasons.push("no_rule_hotels");
  if (hotels.length > 8) reasons.push("hotel_count_above_display_limit");
  if (suspiciousCount > 0) reasons.push("suspicious_hotel_names");
  if (sparseCount >= Math.max(2, Math.ceil(hotels.length / 2))) reasons.push("too_many_sparse_hotels");
  if (candidateGapCount > 0) reasons.push("link_candidate_gap");
  if (scoreHotelSet(hotels, content, baseUrl) < Math.max(4, hotels.length * 3)) reasons.push("low_rule_score");
  return {
    shouldFallback: reasons.length > 0,
    reasons,
  };
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

const JSON_STRING = { type: "string" } as const;

function jsonNullable(schema: Record<string, unknown>) {
  return { anyOf: [schema, { type: "null" }] };
}

function jsonArray(items: Record<string, unknown>) {
  return { type: "array", items };
}

function jsonObject(properties: Record<string, unknown>) {
  return {
    type: "object",
    additionalProperties: false,
    properties,
    required: Object.keys(properties),
  };
}

const TRAVEL_ACCOMMODATION_JSON_SCHEMA = {
  name: "travel_accommodation_extract",
  strict: true,
  schema: jsonObject({
    sectionLabel: jsonNullable(JSON_STRING),
    hotels: jsonArray(
      jsonObject({
        name: JSON_STRING,
        bookingUrl: jsonNullable(JSON_STRING),
        address: jsonNullable(JSON_STRING),
        phone: jsonNullable(JSON_STRING),
        reservationDeadline: jsonNullable(JSON_STRING),
        rateSummary: jsonNullable(JSON_STRING),
        notes: jsonNullable(JSON_STRING),
      })
    ),
    warnings: jsonArray(JSON_STRING),
  }),
} as const;

function resolveTravelAccommodationModel(): string {
  return (
    safeString(process.env.OPENAI_TRAVEL_ACCOMMODATION_MODEL) ||
    safeString(process.env.OPENAI_DISCOVERY_PARSE_MODEL) ||
    "gpt-5.4-nano"
  );
}

function extractJsonObject(text: string): any | null {
  const parseWithRepairs = (input: string) => {
    try {
      return JSON.parse(input);
    } catch {
      const repaired = input
        .replace(/\\(?!["\\/bfnrtu])/g, "\\\\")
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

function buildAiHotelSourceText(content: string): string {
  const sanitized = sanitizeRichTextContent(content)
    .replace(/\u0000/g, " ")
    .replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F]/g, " ");
  const lines = sanitized
    .split(/\n+/)
    .map((line) => safeString(line))
    .filter(Boolean);
  if (lines.length === 0) return "";

  const sectionLines = collectSectionLines(content);
  const windows: Array<{ start: number; end: number }> = [];
  lines.forEach((line, index) => {
    if (
      /\b(host hotels?|hotel information|travel accommodations?|reservation deadline|distance from venue|breakfast|parking|book hotel|reserve hotel|room block|group rate)\b/i.test(
        line
      )
    ) {
      windows.push({ start: Math.max(0, index - 6), end: Math.min(lines.length, index + 10) });
    }
  });

  const selectedLines: string[] = [];
  const seen = new Set<string>();
  const pushLine = (line: string) => {
    const cleaned = safeString(line);
    if (!cleaned) return;
    const key = `${selectedLines.length}|${cleaned}`;
    if (seen.has(key)) return;
    seen.add(key);
    selectedLines.push(cleaned);
  };

  sectionLines.forEach((line) => pushLine(line));
  windows.forEach((window) => {
    for (let index = window.start; index < window.end; index += 1) {
      pushLine(lines[index]);
    }
  });

  const combined = selectedLines.join("\n");
  if (combined.length >= 800) return combined.slice(0, 40_000);
  return sanitized.slice(0, 60_000);
}

function buildTravelAccommodationPrompt(content: string, existingHotels: TravelAccommodationHotel[]): string {
  const boundedText = buildAiHotelSourceText(content);
  const ruleSummary =
    existingHotels.length > 0
      ? [
          "Current rule-based candidates (may contain false positives from CTA labels or layout drift):",
          ...existingHotels.map((item, index) => {
            const fields = [
              `name=${safeString(item.name) || "(missing)"}`,
              safeString(item.bookingUrl) ? `bookingUrl=${safeString(item.bookingUrl)}` : "",
              safeString(item.phone) ? `phone=${safeString(item.phone)}` : "",
              safeString(item.reservationDeadline)
                ? `reservationDeadline=${safeString(item.reservationDeadline)}`
                : "",
              safeString(item.rateSummary) ? `rateSummary=${safeString(item.rateSummary)}` : "",
            ]
              .filter(Boolean)
              .join(", ");
            return `${index + 1}. ${fields}`;
          }),
          "",
        ].join("\n")
      : "";
  return [
    "Return JSON only. Do not wrap in markdown.",
    "",
    "Extract attendee-facing host hotel listings from the source text.",
    "Rules:",
    "- Only return actual hotel properties. Ignore generic CTA text like Book Hotel, Reserve Hotel Online, Host Hotels, Click Here, Learn More, Hotel Online.",
    "- Ignore nearby non-hotel sections such as attractions, parking, tickets, results, maps, dining, shopping, venue, or documents.",
    "- Keep hotel names and facts grounded in the source text. Do not infer or paraphrase missing data.",
    "- `notes` should only contain leftover hotel facts such as distance from venue, breakfast, shuttle, parking, or amenity details.",
    "- If the source only provides a hub link and not per-hotel records, return an empty hotels array.",
    "",
    ruleSummary,
    "Source text:",
    boundedText,
  ]
    .filter(Boolean)
    .join("\n");
}

function normalizeAiTravelAccommodationResult(
  value: any,
  options: { sourceText: string; baseUrl: string }
): TravelAccommodationHotel[] {
  if (!value || typeof value !== "object") return [];
  const normalizedText = normalizeCompareText(options.sourceText);
  const normalizedDigits = normalizeDigits(options.sourceText);
  const contentUrls = new Set(extractHttpUrls(options.sourceText, options.baseUrl));
  return uniqueHotels(
    pickArray(value.hotels)
      .map((item: any): TravelAccommodationHotel | null => {
        const name = cleanHotelName(item?.name);
        if (!name || isSuspiciousHotelName(name)) return null;
        if (!normalizedText.includes(normalizeCompareText(name))) return null;
        const bookingUrl = normalizeUrl(item?.bookingUrl, options.baseUrl);
        const address = normalizeWhitespace(item?.address);
        const phone = normalizeWhitespace(item?.phone);
        const reservationDeadline = normalizeWhitespace(item?.reservationDeadline);
        const rateSummary = normalizeWhitespace(item?.rateSummary);
        const notes = notesFromGroundedSegments(item?.notes, normalizedText);
        const groundedBookingUrl = bookingUrl && contentUrls.has(bookingUrl) ? bookingUrl : "";
        const groundedAddress =
          address && normalizedText.includes(normalizeCompareText(address)) ? address : "";
        const groundedPhone =
          phone && normalizeDigits(phone) && normalizedDigits.includes(normalizeDigits(phone))
            ? phone
            : "";
        const groundedDeadline =
          reservationDeadline && normalizedText.includes(normalizeCompareText(reservationDeadline))
            ? reservationDeadline
            : "";
        const groundedRate =
          rateSummary && normalizedText.includes(normalizeCompareText(rateSummary))
            ? rateSummary
            : "";
        if (
          !groundedBookingUrl &&
          !groundedAddress &&
          !groundedPhone &&
          !groundedDeadline &&
          !groundedRate &&
          !notes
        ) {
          return null;
        }
        return {
          name,
          ...(groundedBookingUrl ? { bookingUrl: groundedBookingUrl } : {}),
          ...(groundedAddress ? { address: groundedAddress } : {}),
          ...(groundedPhone ? { phone: groundedPhone } : {}),
          ...(groundedDeadline ? { reservationDeadline: groundedDeadline } : {}),
          ...(groundedRate ? { rateSummary: groundedRate } : {}),
          ...(notes ? { notes } : {}),
        };
      })
      .filter((item): item is TravelAccommodationHotel => Boolean(item?.name)),
    12
  );
}

async function callOpenAiTravelAccommodationParse(params: {
  traceId?: string | null;
  content: string;
  baseUrl: string;
  existingHotels: TravelAccommodationHotel[];
  timeoutMs: number;
}): Promise<{ hotels: TravelAccommodationHotel[]; raw: string; warnings: string[] }> {
  const apiKey = safeString(process.env.OPENAI_API_KEY);
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), params.timeoutMs);
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: resolveTravelAccommodationModel(),
        temperature: 0,
        response_format: {
          type: "json_schema",
          json_schema: TRAVEL_ACCOMMODATION_JSON_SCHEMA,
        },
        messages: [
          {
            role: "system",
            content:
              "You extract attendee-facing hotel listings from event travel content. Return only strict JSON.",
          },
          {
            role: "user",
            content: buildTravelAccommodationPrompt(params.content, params.existingHotels),
          },
        ],
      }),
    });
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`OpenAI hotel extraction failed (${response.status}): ${text.slice(0, 300)}`);
    }
    const json: any = await response.json();
    const raw = safeString(json?.choices?.[0]?.message?.content) || "";
    const parsed = extractJsonObject(raw);
    return {
      raw,
      hotels: normalizeAiTravelAccommodationResult(parsed, {
        sourceText: params.content,
        baseUrl: params.baseUrl,
      }),
      warnings: pickArray(parsed?.warnings).map((item) => safeString(item)).filter(Boolean),
    };
  } catch (error: any) {
    if (error?.name === "AbortError") {
      throw new Error(`OpenAI hotel extraction timed out after ${params.timeoutMs}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
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
  const startedAtMs = Date.now();
  const { sourceLink, fallbackLink } = pickHotelHubLinks(params.extractionMeta?.resourceLinks);
  const sourceUrl = sourceLink?.url || null;
  const totalBudgetMs = Math.max(2_500, Math.min(Number(params.budgetMs) || 12_000, 30_000));
  const timeoutMs = Math.max(1500, Math.min(totalBudgetMs, 25_000));

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
    const ruleHotels = uniqueHotels(
      extractHotelCardsFromContent(scraped.content || "", {
        baseUrl: effectiveSourceUrl,
      }),
      12
    );
    let hotels = ruleHotels;
    const fallbackDecision = shouldAttemptAiHotelFallback(
      ruleHotels,
      scraped.content || "",
      effectiveSourceUrl
    );
    const remainingBudgetMs = Math.max(0, totalBudgetMs - (Date.now() - startedAtMs));

    if (
      fallbackDecision.shouldFallback &&
      safeString(process.env.OPENAI_API_KEY) &&
      remainingBudgetMs >= 1_500
    ) {
      const aiTimeoutMs = Math.max(1_500, Math.min(8_000, remainingBudgetMs));
      console.log("[travel-accommodation] ai hotel fallback started", {
        traceId: params.traceId || null,
        url: effectiveSourceUrl,
        timeoutMs: aiTimeoutMs,
        reasons: fallbackDecision.reasons,
        ruleHotelCount: ruleHotels.length,
      });
      try {
        const aiResult = await callOpenAiTravelAccommodationParse({
          traceId: params.traceId || null,
          content: scraped.content || "",
          baseUrl: effectiveSourceUrl,
          existingHotels: ruleHotels,
          timeoutMs: aiTimeoutMs,
        });
        const aiPreferredHotels = mergeHotelSets(aiResult.hotels, ruleHotels, 12);
        const rulePreferredHotels = mergeHotelSets(ruleHotels, aiResult.hotels, 12);
        const aiScore = scoreHotelSet(aiPreferredHotels, scraped.content || "", effectiveSourceUrl);
        const ruleScore = scoreHotelSet(rulePreferredHotels, scraped.content || "", effectiveSourceUrl);
        hotels = aiScore > ruleScore ? aiPreferredHotels : rulePreferredHotels;
        console.log("[travel-accommodation] ai hotel fallback finished", {
          traceId: params.traceId || null,
          url: effectiveSourceUrl,
          aiHotelCount: aiResult.hotels.length,
          selectedHotelCount: hotels.length,
          aiScore,
          ruleScore,
          warnings: aiResult.warnings,
        });
      } catch (error: any) {
        console.error("[travel-accommodation] ai hotel fallback failed", {
          traceId: params.traceId || null,
          url: effectiveSourceUrl,
          message: error?.message || String(error),
          reasons: fallbackDecision.reasons,
        });
      }
    }

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
