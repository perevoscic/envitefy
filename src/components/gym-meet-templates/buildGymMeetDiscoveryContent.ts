/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-explicit-any */
// @ts-nocheck
import {
  normalizeVenueFactForCompare,
  sanitizeVenueFactLines,
  stitchVenueContinuationLines,
} from "@/lib/venue-facts";
import { GymMeetDiscoveryContent, GymMeetLinkAction } from "./types";

const safeString = (value: unknown): string =>
  typeof value === "string"
    ? value.trim()
    : value == null
    ? ""
    : String(value).trim();

const countCurrencyAmounts = (value: string) =>
  (safeString(value).match(/\$\s*\d+(?:\.\d{2})?/g) || []).length;

const formatDate = (value: string) => {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return value;
  }
};

const uniqueTextLines = (items: string[], limit = 20) => {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    const line = safeString(item);
    if (!line) continue;
    const key = line.toLowerCase().replace(/\s+/g, " ").trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(line);
    if (out.length >= limit) break;
  }
  return out;
};

const extractInlineUrl = (line: string) => {
  const urlMatch = line.match(/(?:https?:\/\/[^\s)]+|www\.[^\s)]+)/i);
  if (!urlMatch) {
    return { text: line, href: undefined };
  }
  const raw = (urlMatch[0] || "").replace(/[.,;!?]+$/g, "");
  const href = /^www\./i.test(raw) ? `https://${raw}` : raw;
  const matchIndex = urlMatch.index ?? line.indexOf(urlMatch[0]);
  const text = `${line.slice(0, Math.max(0, matchIndex))}${line.slice(
    Math.max(0, matchIndex) + (urlMatch[0] || "").length
  )}`
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([.,;:!?])/g, "$1")
    .trim();
  return { text: text || "Reference link", href };
};

const toStructuredListItems = (text: string, stripPrefixPattern?: RegExp): string[] => {
  let cleaned = safeString(text).replace(/\r/g, "\n");
  if (!cleaned) return [];
  if (stripPrefixPattern) cleaned = cleaned.replace(stripPrefixPattern, "");

  const items = cleaned
    .split(/\n+/)
    .flatMap((line) => line.split(/\s*;\s*/))
    .map((part) =>
      part
        .replace(/^[-*•\u2022]\s+/, "")
        .replace(/^\d+[.)]\s+/, "")
        .trim()
    )
    .filter(Boolean);

  return items.filter(
    (item, idx, arr) =>
      arr.findIndex(
        (candidate) =>
          candidate.toLowerCase().replace(/\s+/g, " ").trim() ===
          item.toLowerCase().replace(/\s+/g, " ").trim()
      ) === idx
  );
};

const toAction = (item: any): GymMeetLinkAction | undefined => {
  const url = safeString(item?.url);
  if (!/^https?:\/\//i.test(url)) return undefined;
  return {
    label: safeString(item?.label || item?.title || "Open Link"),
    url,
  };
};

export function buildGymMeetDiscoveryContent({
  eventData,
  customFields,
  advancedSections,
  date,
  detailsText,
  venue,
  address,
}: {
  eventData: any;
  customFields: any;
  advancedSections: any;
  date?: string;
  detailsText?: string;
  venue?: string;
  address?: string;
}): GymMeetDiscoveryContent {
  const logistics = advancedSections?.logistics || {};
  const meetSection = advancedSections?.meet || {};
  const coachesSection = advancedSections?.coaches || {};
  const parseResult = eventData?.discoverySource?.parseResult || {};
  const parseLogistics = parseResult?.logistics || {};
  const parseMeetDetails = parseResult?.meetDetails || {};
  const parseCommunications = parseResult?.communications || {};
  const parseCoachInfo = parseResult?.coachInfo || {};
  const parseLinks = Array.isArray(parseResult?.links) ? parseResult.links : [];
  const quickLinks =
    Array.isArray(eventData?.links) && eventData.links.length ? eventData.links : parseLinks;
  const normalizedLinks = (Array.isArray(quickLinks) ? quickLinks : [])
    .map((item: any) => ({
      label: safeString(item?.label),
      url: safeString(item?.url),
    }))
    .filter((item) => /^https?:\/\//i.test(item.url));

  const pickLink = (include: RegExp, exclude?: RegExp) =>
    normalizedLinks.find(
      (item) =>
        include.test(`${item.label} ${item.url}`) &&
        (!exclude || !exclude.test(`${item.label} ${item.url}`))
    );
  const pickLinks = (include: RegExp, exclude?: RegExp, limit = 6) =>
    normalizedLinks.filter(
      (item) =>
        include.test(`${item.label} ${item.url}`) &&
        (!exclude || !exclude.test(`${item.label} ${item.url}`))
    ).slice(0, limit);

  const parseAdmissionsFromText = (value: any) =>
    String(value || "")
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const parts = line.split(":").map((part) => part.trim());
        if (!parts[0]) return null;
        return {
          label: parts[0],
          price: parts[1] || "",
          note: parts[2] || "",
        };
      })
      .filter(Boolean);

  const stripRepeatedAdmissionFromPrice = (value: string) =>
    safeString(value)
      .replace(/\bcash\s*only\s*;?\s*per\s*day\s*;?\s*no\s*weekend\s*passes\.?/gi, "")
      .replace(/\bdoor fees?\s+are\s+daily\.?/gi, "")
      .replace(/\bthere\s+are\s+no\s+weekend\s+passes\.?/gi, "")
      .replace(/\bno\s+weekend\s+passes\.?/gi, "")
      .replace(/\s{2,}/g, " ")
      .replace(/\s+([,.;:!?])/g, "$1")
      .replace(/[:;,\-]\s*$/g, "")
      .trim();

  const parseResultAdmission = Array.isArray(eventData?.discoverySource?.parseResult?.admission)
    ? eventData.discoverySource.parseResult.admission
    : [];
  const rawAdmissionCards =
    parseResultAdmission.length > 0
      ? parseResultAdmission.map((item: any) => ({
          label: item?.label || "Admission",
          price: safeString(item?.price || ""),
          note: item?.note || "",
        }))
      : parseAdmissionsFromText(customFields?.admission).map((item) => ({ ...item }));
  const admissionCards = rawAdmissionCards
    .map((item) => ({
      ...item,
      label: safeString(item.label) || "Admission",
      price: stripRepeatedAdmissionFromPrice(item.price),
      note: safeString(item.note),
    }))
    .filter((item) => Boolean(item.label || item.price || item.note))
    .filter((item, idx, arr) => {
      const key = normalizeVenueFactForCompare(`${item.label} ${item.price}`);
      return (
        arr.findIndex((candidate) => {
          const candidateKey = normalizeVenueFactForCompare(
            `${safeString(candidate.label)} ${safeString(candidate.price)}`
          );
          return candidateKey === key;
        }) === idx
      );
    });

  const baseAdmissionNoteCandidates = rawAdmissionCards
    .flatMap((item) => [safeString(item.note), safeString(item.price)])
    .filter(Boolean);

  const rotationLink = pickLink(
    /(rotation|result|score|schedule|meet\s*info|program|packet|official)/i,
    /(arcgis|parking|traffic|parkmobile|garage|rate|wayfinding)/i
  );
  const mapDashboardLink =
    pickLink(/(map|dashboard|parking|traffic|arcgis|parkmobile|garage|arrival|route)/i) ||
    normalizedLinks[0];
  const ratesInfoLink =
    pickLink(/(rate|pricing|fee|parking)/i, /(rotation|result|score)/i) ||
    normalizedLinks.find((item) => item.url !== mapDashboardLink?.url) ||
    normalizedLinks[1];
  const merchandiseLink = pickLink(/(merch|shop|store|vendor|apparel|souvenir|leotard)/i);
  const normalizedParkingLinks = (
    Array.isArray(logistics?.parkingLinks) ? logistics.parkingLinks : parseLogistics?.parkingLinks || []
  )
    .map(toAction)
    .filter(Boolean);
  const normalizedParkingPricingLinks = (
    Array.isArray(logistics?.parkingPricingLinks)
      ? logistics.parkingPricingLinks
      : parseLogistics?.parkingPricingLinks || []
  )
    .map(toAction)
    .filter(Boolean);

  const eventDatesLabel =
    customFields?.meetDateRangeLabel ||
    eventData?.discoverySource?.parseResult?.dates ||
    (date ? formatDate(date) : "");
  const venueLabel = safeString(venue || eventData?.venue);
  const addressLabel = safeString(address || eventData?.address);
  const normalizedDetailsText = safeString(detailsText);
  const facilityMapAddress = addressLabel || venueLabel;
  const gymLayoutImageUrl = safeString(
    advancedSections?.logistics?.gymLayoutImage ||
      eventData?.discoverySource?.extractionMeta?.gymLayoutImageDataUrl
  );
  const assignedGymRaw = safeString(
    advancedSections?.meet?.assignedGym || parseResult?.athlete?.assignedGym || ""
  );
  const gymLayoutLabel = safeString(
    advancedSections?.logistics?.gymLayoutLabel ||
      (assignedGymRaw ? `Assigned gym location: ${assignedGymRaw}` : "")
  );
  const gymLayoutLabelValue = gymLayoutLabel
    ? gymLayoutLabel.replace(/^assigned gym location:\s*/i, "").trim() || gymLayoutLabel
    : "";

  const extractedDiscoveryText = safeString(eventData?.discoverySource?.extractedText);
  const sourceLines = extractedDiscoveryText
    ? extractedDiscoveryText
        .split(/\n+/)
        .map((line) => line.replace(/^[\-\u2022]\s*/, "").trim())
        .filter(Boolean)
    : [];

  const isVenueHeaderNoiseLine = (line: string) =>
    /^(spectator admission\b|updated\s+[a-z]+\s+\d{1,2},\s+\d{4}\b|page\s+\d+\s+of\s+\d+\b)/i.test(
      safeString(line)
    );
  const isHydrationLine = (line: string) =>
    /(water bottles?|bottle filling|filling stations?|hydration|bring water)/i.test(
      safeString(line)
    );
  const isMerchandiseLine = (line: string) =>
    /(event merchandise|merchandise|leotards?|gymnastics apparel|accessories)/i.test(
      safeString(line)
    );
  const isResultsLine = (line: string) =>
    /(official results|live scoring|meetscoresonline|results will be posted)/i.test(
      safeString(line)
    );
  const isDaylightLine = (line: string) => /daylight savings/i.test(safeString(line));
  const isSafetyObjectsLine = (line: string) =>
    /(keep an eye on your children|footballs?|baseballs?|objects?\s+for\s+throwing|safety of all the gymnasts|not competing for their safety)/i.test(
      safeString(line)
    );

  const extractVenueParagraphSentences = (lines: string[]) => {
    const startIdx = lines.findIndex((line) =>
      /competition will take place in the east,\s*central and west halls/i.test(line)
    );
    if (startIdx < 0) return [] as string[];
    const chunk: string[] = [];
    for (let i = startIdx; i < Math.min(lines.length, startIdx + 8); i += 1) {
      const line = safeString(lines[i]);
      if (!line) break;
      if (isVenueHeaderNoiseLine(line)) continue;
      if (/^--\s*\d+\s+of\s+\d+\s*--$/i.test(line)) break;
      if (/^parents\/spectators/i.test(line) && chunk.length > 0) break;
      chunk.push(line);
      if (
        /\bentrance to the competition area\.?$/i.test(line) ||
        /\bcompetition area\.?$/i.test(line)
      ) {
        break;
      }
    }
    const paragraph = chunk.join(" ").replace(/\s+/g, " ").trim();
    if (!paragraph) return [] as string[];
    return paragraph
      .split(/(?<=[.!?])\s+/)
      .map((sentence) => safeString(sentence))
      .filter((sentence) => sentence.length > 18)
      .filter((sentence) => !isVenueHeaderNoiseLine(sentence));
  };

  const stitchSentenceFragments = (items: string[]) =>
    stitchVenueContinuationLines(items.map((line) => safeString(line)).filter(Boolean));

  const venueExcludePatterns = [
    /traffic|disney on ice|benchmark(?:\s+international)?\s+arena/i,
    /official results|live scoring|daylight savings/i,
  ];

  const extractionLayoutFacts = sanitizeVenueFactLines(
    (
      Array.isArray(eventData?.discoverySource?.extractionMeta?.gymLayoutFacts)
        ? eventData.discoverySource.extractionMeta.gymLayoutFacts
        : []
    )
      .map((line: any) => safeString(line))
      .filter(Boolean),
    {
      mode: "strict",
      maxLines: 14,
      requireAnchor: true,
      excludePatterns: venueExcludePatterns,
    }
  );

  const trafficText = safeString(logistics?.trafficAlerts || parseLogistics?.trafficAlerts);
  const normalizeCompareText = (value: string) => normalizeVenueFactForCompare(value);
  const trafficEntriesRaw = trafficText
    ? trafficText
        .split(/\n+/)
        .map((entry) => entry.trim())
        .filter(Boolean)
    : [];
  const trafficEntries = trafficEntriesRaw.filter((entry, idx, arr) => {
    const normalized = normalizeCompareText(entry);
    const fullNormalized = normalizeCompareText(trafficText);
    if (!normalized) return false;
    if (normalized === fullNormalized) return false;
    return (
      arr.findIndex((candidate) => normalizeCompareText(candidate) === normalized) === idx
    );
  });

  const trafficSlotsFromText = (() => {
    const candidateLines = [trafficText, ...sourceLines]
      .map((line) => safeString(line))
      .filter(Boolean)
      .filter((line) =>
        /(traffic|disney on ice|benchmark|march|\bam\b|\bpm\b|parking)/i.test(line)
      );
    const slots: Array<{ date: string; times: string }> = [];
    const seen = new Set<string>();
    let pendingDate = "";
    for (const line of candidateLines) {
      const dateMatch = line.match(
        /\b(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}\b/i
      );
      if (dateMatch?.[0]) pendingDate = dateMatch[0];
      const timeRanges =
        line.match(/\b\d{1,2}:\d{2}\s*[AP]M\s*-\s*\d{1,2}:\d{2}\s*[AP]M\b/gi) || [];
      if (!timeRanges.length) continue;
      const dateLabel = dateMatch?.[0] || pendingDate;
      if (!dateLabel) continue;
      const timesLabel = timeRanges.join(" & ");
      const key = `${dateLabel.toLowerCase()}::${timesLabel.toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      slots.push({ date: dateLabel, times: timesLabel });
    }
    return slots.slice(0, 3);
  })();
  const trafficSlots =
    trafficSlotsFromText.length > 0
      ? trafficSlotsFromText
      : trafficEntries.slice(0, 3).map((entry, idx) => ({
          date: `Traffic Window ${idx + 1}`,
          times: entry,
        }));

  const sourceDaylightLine = sourceLines.find((line) => isDaylightLine(line)) || "";
  const sourceHydrationLine = sourceLines.find((line) => isHydrationLine(line)) || "";
  const sourceMerchandiseLine = sourceLines.find((line) => isMerchandiseLine(line)) || "";
  const sourceDoorsOpenLine =
    sourceLines.find((line) => /^doors\s+open\b/i.test(safeString(line))) || "";
  const sourceArrivalGuidanceLine =
    sourceLines.find((line) =>
      /^(arrival guidance\b|arrive\s+one\s+hour\s+before\b|arrive\s+45\s+minutes\s+before\b|arrive\s+forty[-\s]?five\s+minutes\s+before\b)/i.test(
        safeString(line)
      )
    ) || "";
  const sourceRegistrationLine =
    sourceLines.find((line) =>
      /^(registration\b|the registration area will be\b)/i.test(safeString(line))
    ) || "";
  const sourceSafetyObjectsLine =
    sourceLines.find((line) => isSafetyObjectsLine(line)) || "";
  const sourceResultsLines = uniqueTextLines(
    sourceLines.filter((line) => isResultsLine(line)),
    4
  );
  const sourceResultsText = sourceResultsLines.join(" ");
  const venueParagraphSentences = uniqueTextLines(
    extractVenueParagraphSentences(sourceLines),
    8
  );
  const firstAnnouncement = Array.isArray(parseCommunications?.announcements)
    ? parseCommunications.announcements.find((item: any) => safeString(item?.body))
    : null;
  const admissionNoteCandidates = uniqueTextLines(
    [
      ...baseAdmissionNoteCandidates,
      ...sourceLines.filter((line) => /(door fees?|weekend passes?)/i.test(line)),
    ],
    8
  );
  const admissionPrimaryNote = (() => {
    const hasDoorFees = admissionNoteCandidates.some((line) => /\bdoor fees?\b/i.test(line));
    const hasWeekendPass = admissionNoteCandidates.some((line) =>
      /\bweekend passes?\b/i.test(line)
    );
    if (hasDoorFees || hasWeekendPass) {
      return [hasDoorFees ? "Door fees are daily." : "", hasWeekendPass ? "No weekend passes." : ""]
        .filter(Boolean)
        .join(" ");
    }
    return admissionNoteCandidates[0] || "";
  })();

  const resultsLinks = uniqueTextLines(
    normalizedLinks
      .filter((item) => /(result|score|meetscoresonline|lightningcity)/i.test(`${item.label} ${item.url}`))
      .map((item) => item.url),
    3
  );
  const announcementBody = safeString(firstAnnouncement?.body);
  const merchandiseText = /(merch|shop|store|vendor|apparel|souvenir|leotard)/i.test(
    announcementBody
  )
    ? announcementBody
    : sourceMerchandiseLine;
  const resultsInfoText =
    safeString(meetSection?.resultsInfo || parseMeetDetails?.resultsInfo) ||
    sourceResultsText ||
    (/(official results|live scoring|meetscoresonline)/i.test(announcementBody)
      ? announcementBody
      : "");

  const stripKnownLabelPrefix = (value: string, labelPattern: RegExp) =>
    safeString(value).replace(labelPattern, "").trim();
  const spectatorLogisticsItems = [
    {
      key: "doors-open",
      label: "Doors Open",
      value:
        safeString(parseMeetDetails?.doorsOpen) ||
        stripKnownLabelPrefix(sourceDoorsOpenLine, /^doors\s+open:\s*/i),
    },
    {
      key: "arrival-guidance",
      label: "Arrival Guidance",
      value:
        safeString(parseMeetDetails?.arrivalGuidance) ||
        stripKnownLabelPrefix(sourceArrivalGuidanceLine, /^arrival guidance:\s*/i),
    },
    {
      key: "registration",
      label: "Registration",
      value:
        safeString(parseMeetDetails?.registrationInfo) ||
        stripKnownLabelPrefix(sourceRegistrationLine, /^registration:\s*/i),
    },
  ].filter((item) => Boolean(safeString(item.value)));

  const eventCity = (() => {
    const fromAddress = addressLabel
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
    if (fromAddress.length >= 2) return fromAddress[1].toLowerCase();
    const venueLower = venueLabel.toLowerCase();
    if (venueLower.includes("tampa")) return "tampa";
    if (venueLower.includes("orlando")) return "orlando";
    return "";
  })();
  const additionalInfoStartIdx = sourceLines.findIndex((line) =>
    /additional\s*info/i.test(line)
  );
  const additionalInfoBlock =
    additionalInfoStartIdx >= 0 ? sourceLines.slice(additionalInfoStartIdx + 1, additionalInfoStartIdx + 20) : [];
  const rideSharePattern = /(rideshare|ride share|uber|lyft|taxi|front drive|drop-?off)/i;
  const meetDetailCandidateLines = [
    ...additionalInfoBlock,
    ...sourceLines.filter((line) =>
      /(allow extra time|30-45 minutes|east|central|west halls|registration area|guest services|competition area|coffee bar|admission tickets|official results|live scoring|daylight savings|service dogs)/i.test(
        line
      )
    ),
  ];
  const stitchedMeetDetails = meetDetailCandidateLines.reduce((acc: string[], rawLine: string) => {
    const line = rawLine.trim();
    if (!line) return acc;
    if (!acc.length) {
      acc.push(line);
      return acc;
    }
    const prev = acc[acc.length - 1];
    const prevEndsSentence = /[.!?]$/.test(prev);
    const startsContinuation =
      /^[a-z(]/.test(line) ||
      /^(and|or|but|because|which|that|to|for|with|on|in|at)\b/i.test(line);
    if (!prevEndsSentence && startsContinuation) {
      acc[acc.length - 1] = `${prev} ${line}`.replace(/\s+/g, " ").trim();
    } else {
      acc.push(line);
    }
    return acc;
  }, []);
  const primaryMeetDetailsLines = stitchedMeetDetails
    .map((line) => line.trim())
    .filter((line) => line.length > 20)
    .filter((line) => {
      if (!eventCity) return true;
      const lower = line.toLowerCase();
      if (eventCity === "tampa" && /\borlando\b/.test(lower)) return false;
      if (eventCity === "orlando" && /\btampa\b/.test(lower)) return false;
      return true;
    })
    .filter((line, idx, arr) => {
      const normalized = line.toLowerCase().replace(/\s+/g, " ").trim();
      return (
        arr.findIndex(
          (candidate) =>
            candidate.toLowerCase().replace(/\s+/g, " ").trim() === normalized
        ) === idx
      );
    })
    .slice(0, 12);

  const isVenueDetailLine = (line: string) =>
    /(east hall|west hall|central hall|north hall|south hall|registration|guest services|entrance|coffee bar|competition area|awards area|gym\s*[a-z0-9]{1,2}|2nd floor|second floor|3rd floor|third floor|check-?in|freight door|right door)/i.test(
      line
    );
  const eventDatesLabelNormalized = normalizeCompareText(eventDatesLabel);
  const isAdmissionLine = (line: string) =>
    ((text: string) => {
      const currencyCount = countCurrencyAmounts(text);
      const normalized = safeString(text);
      return (
        /(spectator admission|admission|tickets?|day passes?|all session passes?|weekend passes?|credit card|cash only|adults?\b|child(?:ren)?(?:\s*under)?\b|children\s+\d+\s+and\s+under\b|seniors?\b|military\b|free\b)/i.test(
          normalized
        ) &&
        (currencyCount > 0 ||
          /(door fees?|tickets?|day passes?|all session passes?|weekend passes?|credit card|cash only|under\s+\d+\s*:\s*free|children\s+\d+\s+and\s+under\s*:\s*free|free admission|child under|children?\b.*\bfree\b|adults?\b.*\$|children?\b.*\$)/i.test(
            normalized
          ))
      );
    })(safeString(line));
  const isSpectatorLogisticsLine = (line: string) =>
    /^(doors open|arrival guidance|registration):/i.test(safeString(line));
  const isMeetDateLine = (line: string) => {
    const text = safeString(line);
    if (!text) return false;
    const normalized = normalizeCompareText(text.replace(/^meet dates?:\s*/i, ""));
    if (/^meet dates?:/i.test(text)) return true;
    if (!eventDatesLabelNormalized || !normalized) return false;
    return (
      normalized === eventDatesLabelNormalized ||
      normalized.includes(eventDatesLabelNormalized) ||
      eventDatesLabelNormalized.includes(normalized)
    );
  };
  const isMeetDetailsExcludedLine = (line: string) =>
    isMeetDateLine(line) ||
    isAdmissionLine(line) ||
    isSpectatorLogisticsLine(line) ||
    isHydrationLine(line) ||
    isMerchandiseLine(line) ||
    isResultsLine(line) ||
    isDaylightLine(line) ||
    isSafetyObjectsLine(line);
  const meetsAnyLine = (line: string, candidates: string[]) => {
    const normalized = normalizeCompareText(line);
    if (!normalized) return false;
    return candidates.some((candidate) => {
      const normalizedCandidate = normalizeCompareText(candidate);
      if (!normalizedCandidate) return false;
      if (normalizedCandidate === normalized) return true;
      if (normalizedCandidate.length > 18 && normalized.includes(normalizedCandidate)) return true;
      if (normalized.length > 18 && normalizedCandidate.includes(normalized)) return true;
      return false;
    });
  };

  const meetDetailsFallbackLines = uniqueTextLines(
    [
      safeString(parseMeetDetails?.facilityLayout)
        ? `Facility layout: ${safeString(parseMeetDetails.facilityLayout)}`
        : "",
      safeString(parseMeetDetails?.scoringInfo)
        ? `Scoring: ${safeString(parseMeetDetails.scoringInfo)}`
        : "",
      ...(Array.isArray(parseMeetDetails?.operationalNotes)
        ? parseMeetDetails.operationalNotes
        : []),
    ],
    12
  ).filter((line) => line.length > 10);
  const descriptionLines = uniqueTextLines(
    normalizedDetailsText
      .split(/\n+/)
      .map((line) => line.replace(/^[\-\u2022]\s*/, "").trim())
      .filter(Boolean),
    8
  ).filter((line) => line.length > 10 && !isMeetDetailsExcludedLine(line));

  const meetDetailsRawLines = (() => {
    const out: string[] = [];
    const seen = new Set<string>();
    for (const rawLine of [...descriptionLines, ...meetDetailsFallbackLines, ...primaryMeetDetailsLines]) {
      const line = safeString(rawLine);
      if (!line || line.length <= 10) continue;
      if (isMeetDetailsExcludedLine(line)) continue;
      const key = normalizeCompareText(line);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push(line);
      if (out.length >= 16) break;
    }
    return out;
  })();

  const rideShareNote = sourceLines.find((line) => rideSharePattern.test(line)) || "";
  const facilityLinesFromFacts = sanitizeVenueFactLines(
    [
      ...extractionLayoutFacts,
      ...(Array.isArray(parseMeetDetails?.operationalNotes) ? parseMeetDetails.operationalNotes : []),
      safeString(parseMeetDetails?.facilityLayout),
      safeString(parseMeetDetails?.registrationInfo),
    ].filter(Boolean),
    {
      mode: "strict",
      maxLines: 14,
      requireAnchor: true,
      excludePatterns: venueExcludePatterns,
    }
  );
  const facilityLinesFromSource =
    facilityLinesFromFacts.length > 0
      ? []
      : sanitizeVenueFactLines(primaryMeetDetailsLines.filter((line) => !rideSharePattern.test(line)), {
          mode: "strict",
          maxLines: 10,
          requireAnchor: true,
          excludePatterns: venueExcludePatterns,
        });
  const facilityLinesRaw = uniqueTextLines(
    stitchSentenceFragments([...facilityLinesFromFacts, ...facilityLinesFromSource]),
    14
  ).filter((line) => line.length > 10);
  const meetDetailsLines = uniqueTextLines(
    meetDetailsRawLines.filter((line) => {
      if (!isVenueDetailLine(line)) return true;
      return !meetsAnyLine(line, facilityLinesRaw);
    }),
    16
  ).filter((line) => line.length > 10);
  const facilityLines = uniqueTextLines(
    facilityLinesRaw.filter((line) => !meetsAnyLine(line, meetDetailsLines)),
    14
  ).filter((line) => line.length > 10);

  const isSentenceLikeVenueLine = (line: string) => {
    const text = safeString(line);
    if (!text) return false;
    if (isHydrationLine(text) || isMerchandiseLine(text) || isResultsLine(text)) return false;
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    if (/[.!?]$/.test(text)) return wordCount >= 5;
    return wordCount >= 9;
  };

  const venueListLinesRaw = venueParagraphSentences.length > 0 ? venueParagraphSentences : facilityLines;
  const venueListLines = uniqueTextLines(
    venueListLinesRaw.filter((line) => isSentenceLikeVenueLine(line)),
    12
  );
  const parsedAwardsFallback =
    sanitizeVenueFactLines([safeString(parseResult?.athlete?.awards)], {
      mode: "strict",
      maxLines: 1,
      requireAnchor: true,
      excludePatterns: venueExcludePatterns,
    })[0] || "";
  const registrationDeskNote =
    facilityLines.find((line) => /(registration|guest services|2nd floor|second floor)/i.test(line)) ||
    extractionLayoutFacts.find((line) => /(registration|guest services|2nd floor|second floor)/i.test(line)) ||
    "";
  const awardsAreaNote =
    facilityLines.find((line) => /(awards area|north side)/i.test(line)) ||
    extractionLayoutFacts.find((line) => /(awards area|north side)/i.test(line)) ||
    parsedAwardsFallback;
  const venueDetailContains = (note: string) => {
    const normalizedNote = normalizeCompareText(note);
    if (!normalizedNote) return false;
    return venueListLines.some((line) => {
      const normalizedLine = normalizeCompareText(line);
      return (
        normalizedLine === normalizedNote ||
        normalizedLine.includes(normalizedNote) ||
        normalizedNote.includes(normalizedLine)
      );
    });
  };
  const showRegistrationDeskNote =
    Boolean(registrationDeskNote) &&
    isSentenceLikeVenueLine(registrationDeskNote) &&
    !venueDetailContains(registrationDeskNote);
  const showAwardsAreaNote =
    Boolean(awardsAreaNote) &&
    isSentenceLikeVenueLine(awardsAreaNote) &&
    !venueDetailContains(awardsAreaNote);

  const sourcePolicyLine = (pattern: RegExp) =>
    sourceLines.find((line) => pattern.test(line)) || "";
  const policyNotes = [
    safeString(logistics?.mealPlan || parseLogistics?.meals) ||
      sourcePolicyLine(/(food|beverage|coffee|starbucks|kahwa|outside food)/i),
    sourceHydrationLine ||
      (safeString(parseResult?.athlete?.stretchTime)
        ? `Athlete stretch begins at ${parseResult.athlete.stretchTime}. Bring water and arrive prepared.`
        : ""),
    safeString(logistics?.waivers || parseLogistics?.waivers) ||
      sourcePolicyLine(/(service animal|service dog|certified service)/i),
    safeString(parseMeetDetails?.judgingNotes) ||
      sourceSafetyObjectsLine ||
      sourcePolicyLine(/(safety policy|throwing objects|baseballs|footballs|safety)/i),
  ];
  const extractionCoachPageHints = Array.isArray(
    eventData?.discoverySource?.extractionMeta?.coachPageHints
  )
    ? eventData.discoverySource.extractionMeta.coachPageHints
    : [];
  const normalizeCoachFeeItems = (items: any[], labelFallback: string) =>
    (Array.isArray(items) ? items : [])
      .map((item: any) => ({
        label: safeString(item?.label || labelFallback),
        amount: safeString(item?.amount || item?.price),
        note: safeString(item?.note),
      }))
      .filter((item) => item.label || item.amount || item.note)
      .filter((item, idx, arr) => {
        const key = normalizeCompareText(`${item.label}|${item.amount}|${item.note}`);
        return (
          arr.findIndex((candidate) => {
            const candidateKey = normalizeCompareText(
              `${safeString(candidate.label)}|${safeString(candidate.amount)}|${safeString(candidate.note)}`
            );
            return candidateKey === key;
          }) === idx
        );
      });
  const normalizeCoachLateFeeItems = (items: any[]) =>
    (Array.isArray(items) ? items : [])
      .map((item: any) => ({
        label: safeString(item?.label || "Late fee"),
        amount: safeString(item?.amount || item?.price),
        trigger: safeString(item?.trigger),
        note: safeString(item?.note),
      }))
      .filter((item) => item.label || item.amount || item.trigger || item.note)
      .filter((item, idx, arr) => {
        const key = normalizeCompareText(
          `${item.label}|${item.amount}|${item.trigger}|${item.note}`
        );
        return (
          arr.findIndex((candidate) => {
            const candidateKey = normalizeCompareText(
              `${safeString(candidate.label)}|${safeString(candidate.amount)}|${safeString(
                candidate.trigger
              )}|${safeString(candidate.note)}`
            );
            return candidateKey === key;
          }) === idx
        );
      });
  const normalizeCoachLinks = (items: any[]) =>
    (Array.isArray(items) ? items : [])
      .map((item: any) => ({
        label: safeString(item?.label || "Coach link"),
        url: safeString(item?.url),
      }))
      .filter((item) => /^https?:\/\//i.test(item.url))
      .filter((item, idx, arr) => {
        const key = normalizeCompareText(item.url);
        return arr.findIndex((candidate) => normalizeCompareText(candidate.url) === key) === idx;
      });
  const coachRolePattern =
    /\b(coach|meet director|director of operations|assistant event coordinator|floor manager)\b/i;
  const coachContacts = ([
    ...((Array.isArray(coachesSection?.contacts) ? coachesSection.contacts : []) as any[]),
    ...((Array.isArray(parseCoachInfo?.contacts) ? parseCoachInfo.contacts : []) as any[]),
    ...((Array.isArray(parseResult?.contacts) ? parseResult.contacts : []).filter((item: any) =>
      coachRolePattern.test(`${safeString(item?.role)} ${safeString(item?.name)}`)
    ) as any[]),
  ] as any[])
    .map((item: any) => ({
      role: safeString(item?.role || "Coach contact"),
      name: safeString(item?.name),
      email: safeString(item?.email),
      phone: safeString(item?.phone),
    }))
    .filter((item) => item.name || item.email || item.phone)
    .filter((item, idx, arr) => {
      const key = normalizeCompareText(
        `${item.role}|${item.name}|${item.email}|${item.phone}`
      );
      return (
        arr.findIndex((candidate) => {
          const candidateKey = normalizeCompareText(
            `${safeString(candidate.role)}|${safeString(candidate.name)}|${safeString(
              candidate.email
            )}|${safeString(candidate.phone)}`
          );
          return candidateKey === key;
        }) === idx
      );
    });
  const coachDeadlines = [
    ...((Array.isArray(coachesSection?.deadlines) ? coachesSection.deadlines : []) as any[]),
    ...((Array.isArray(parseCoachInfo?.deadlines) ? parseCoachInfo.deadlines : []) as any[]),
    ...((Array.isArray(parseResult?.deadlines) ? parseResult.deadlines : []).filter((item: any) =>
      /(regional|entry|registration|deadline|meet reservation|meet maker)/i.test(
        `${safeString(item?.label)} ${safeString(item?.note)}`
      )
    ) as any[]),
  ]
    .map((item: any) => ({
      label: safeString(item?.label || "Coach deadline"),
      date: safeString(item?.date),
      note: safeString(item?.note),
    }))
    .filter((item) => item.date || item.note || item.label !== "Coach deadline")
    .filter((item, idx, arr) => {
      const key = normalizeCompareText(`${item.label}|${item.date}|${item.note}`);
      return (
        arr.findIndex((candidate) => {
          const candidateKey = normalizeCompareText(
            `${safeString(candidate.label)}|${safeString(candidate.date)}|${safeString(
              candidate.note
            )}`
          );
          return candidateKey === key;
        }) === idx
      );
    });
  const sourceCoachSignInLine =
    sourceLines.find((line) =>
      /(coaches?\s+sign[- ]?in|sign the official .*sign[- ]?in sheet|main computer scoring table)/i.test(
        line
      )
    ) || "";
  const sourceCoachHospitalityLine =
    sourceLines.find((line) =>
      /(coaches?\s+hospitality|lunch and dinner provided to coaches|grab\s*&\s*go snacks|coffee.*water.*coaches)/i.test(
        line
      )
    ) || "";
  const sourceCoachFloorAccessLine =
    sourceLines.find((line) =>
      /(competition floor|verifiable member status|allowed entry via spectator admission|children of coaches)/i.test(
        line
      )
    ) || "";
  const sourceCoachScratchesLine =
    sourceLines.find((line) => /\bscratches?\b/i.test(line)) || "";
  const sourceCoachRotationLine =
    sourceLines.find((line) =>
      /(rotation sheets?|rotationsheets\.com|master rotation sheet)/i.test(line)
    ) || "";
  const sourceCoachRegionalLine =
    sourceLines.find((line) =>
      /(regional meet coaches information|regional commitment|qualifying athletes|meet maker|meet reservation|must enter by noon)/i.test(
        line
      )
    ) || "";
  const sourceCoachPaymentLine =
    sourceLines.find((line) =>
      /(payment|payable|credit card|convenience fee|cashier'?s check|meet maker|venmo|zelle|checks? payable|refund)/i.test(
        line
      )
    ) || "";
  const sourceCoachQualificationLine =
    sourceLines.find((line) => /(qualif|state meet|qualifying score|must qualify)/i.test(line)) || "";
  const sourceCoachFormatLine =
    sourceLines.find((line) => /(modified capital cup|meet format|capital cup|super team|competition format)/i.test(line)) ||
    "";
  const sourceCoachEquipmentLine =
    sourceLines.find((line) => /(equipment|ub mats|sting mats|vault table|rod floor|apparatus)/i.test(line)) ||
    "";
  const sourceCoachAwardsLine =
    sourceLines.find((line) => /(team awards?|awards ceremony|awards will be|awards presented)/i.test(line)) ||
    "";
  const sourceCoachFloorMusicLine =
    sourceLines.find((line) => /(floor music|music file|music upload|music must be)/i.test(line)) || "";
  const coachAttire = uniqueTextLines(
    [
      ...toStructuredListItems(parseCoachInfo?.attire || ""),
      ...toStructuredListItems(coachesSection?.attire || ""),
      ...sourceLines.filter((line) =>
        /(closed toe athletic shoes|athletic or tailored shorts|collared or business casual|no hats or visors|dress code|coaches attire)/i.test(
          line
        )
      ),
    ],
    8
  );
  const coachNotes = uniqueTextLines(
    [
      ...((Array.isArray(coachesSection?.notes) ? coachesSection.notes : []) as any[]),
      ...(Array.isArray(parseCoachInfo?.notes) ? parseCoachInfo.notes : []),
      ...extractionCoachPageHints
        .map((item: any) => safeString(item?.excerpt))
        .filter(Boolean),
    ],
    8
  ).filter(
    (line) =>
      ![
        safeString(parseCoachInfo?.signIn),
        safeString(parseCoachInfo?.hospitality),
        safeString(parseCoachInfo?.floorAccess),
        safeString(parseCoachInfo?.scratches),
        safeString(parseCoachInfo?.rotationSheets),
        safeString(parseCoachInfo?.regionalCommitment),
      ]
        .filter(Boolean)
        .some((candidate) => normalizeCompareText(candidate) === normalizeCompareText(line))
  );
  const coachSignIn = safeString(coachesSection?.signIn || parseCoachInfo?.signIn || sourceCoachSignInLine);
  const coachHospitality = safeString(
    coachesSection?.hospitality || parseCoachInfo?.hospitality || sourceCoachHospitalityLine
  );
  const coachFloorAccess = safeString(
    coachesSection?.floorAccess || parseCoachInfo?.floorAccess || sourceCoachFloorAccessLine
  );
  const coachScratches = safeString(
    coachesSection?.scratches || parseCoachInfo?.scratches || sourceCoachScratchesLine
  );
  const coachFloorMusic = safeString(
    coachesSection?.floorMusic || parseCoachInfo?.floorMusic || sourceCoachFloorMusicLine
  );
  const coachRotationSheets = safeString(
    coachesSection?.rotationSheets || parseCoachInfo?.rotationSheets || sourceCoachRotationLine
  );
  const coachRegionalCommitment = safeString(
    coachesSection?.regionalCommitment || parseCoachInfo?.regionalCommitment || sourceCoachRegionalLine
  );
  const coachAwards = safeString(
    coachesSection?.awards || parseCoachInfo?.awards || sourceCoachAwardsLine
  );
  const coachQualification = safeString(
    coachesSection?.qualification || parseCoachInfo?.qualification || sourceCoachQualificationLine
  );
  const coachMeetFormat = safeString(
    coachesSection?.meetFormat || parseCoachInfo?.meetFormat || sourceCoachFormatLine
  );
  const coachEquipment = safeString(
    coachesSection?.equipment || parseCoachInfo?.equipment || sourceCoachEquipmentLine
  );
  const coachRefundPolicy = safeString(
    coachesSection?.refundPolicy || parseCoachInfo?.refundPolicy || ""
  );
  const coachPaymentInstructions = safeString(
    coachesSection?.paymentInstructions || parseCoachInfo?.paymentInstructions || sourceCoachPaymentLine
  );
  const coachEntryFees = normalizeCoachFeeItems(
    [
      ...((coachesSection?.entryFees as any[]) || []),
      ...((parseCoachInfo?.entryFees as any[]) || []),
    ],
    "Entry fee"
  );
  const coachTeamFees = normalizeCoachFeeItems(
    [
      ...((coachesSection?.teamFees as any[]) || []),
      ...((parseCoachInfo?.teamFees as any[]) || []),
    ],
    "Team fee"
  );
  const coachLateFees = normalizeCoachLateFeeItems(
    [
      ...((coachesSection?.lateFees as any[]) || []),
      ...((parseCoachInfo?.lateFees as any[]) || []),
    ]
  );
  const coachLinks = normalizeCoachLinks([
    ...((coachesSection?.links as any[]) || []),
    ...((parseCoachInfo?.links as any[]) || []),
    ...pickLinks(
      /(coach|entry|payment|refund|qualification|regional|rotation|meet maker|reservation|score|result)/i,
      /(parking|traffic|parkmobile|garage|rate|wayfinding)/i,
      8
    ),
  ]);
  const coachesHasContent =
    Boolean(coachesSection?.enabled) ||
    coachContacts.length > 0 ||
    coachDeadlines.length > 0 ||
    coachAttire.length > 0 ||
    coachNotes.length > 0 ||
    coachEntryFees.length > 0 ||
    coachTeamFees.length > 0 ||
    coachLateFees.length > 0 ||
    coachLinks.length > 0 ||
    Boolean(coachSignIn) ||
    Boolean(coachHospitality) ||
    Boolean(coachFloorAccess) ||
    Boolean(coachScratches) ||
    Boolean(coachFloorMusic) ||
    Boolean(coachRotationSheets) ||
    Boolean(coachAwards) ||
    Boolean(coachRegionalCommitment) ||
    Boolean(coachQualification) ||
    Boolean(coachMeetFormat) ||
    Boolean(coachEquipment) ||
    Boolean(coachRefundPolicy) ||
    Boolean(coachPaymentInstructions) ||
    extractionCoachPageHints.length > 0;

  const awardsAreaItems = toStructuredListItems(awardsAreaNote, /^awards?\s*area\s*:\s*/i);
  const meetDetailsInline = meetDetailsLines.map(extractInlineUrl);
  const venueDetailsInline = venueListLines.map(extractInlineUrl);
  const tabs = [
    { id: "meet-details", label: "Meet Details" },
    ...(coachesHasContent ? [{ id: "coaches", label: "Coaches" }] : []),
    { id: "venue-details", label: "Venue Details" },
    { id: "admission-sales", label: "Admission & Sales" },
    { id: "traffic-parking", label: "Traffic & Parking" },
    { id: "safety-policy", label: "Safety Policy" },
  ];

  return {
    tabs,
    meetDetails: {
      lines: meetDetailsInline,
      hasContent: meetDetailsInline.length > 0,
    },
    coaches: {
      contacts: coachContacts,
      deadlines: coachDeadlines,
      attire: coachAttire,
      notes: coachNotes,
      entryFees: coachEntryFees,
      teamFees: coachTeamFees,
      lateFees: coachLateFees,
      links: coachLinks,
      signIn: coachSignIn,
      hospitality: coachHospitality,
      floorAccess: coachFloorAccess,
      scratches: coachScratches,
      floorMusic: coachFloorMusic,
      rotationSheets: coachRotationSheets,
      awards: coachAwards,
      regionalCommitment: coachRegionalCommitment,
      qualification: coachQualification,
      meetFormat: coachMeetFormat,
      equipment: coachEquipment,
      refundPolicy: coachRefundPolicy,
      paymentInstructions: coachPaymentInstructions,
      hasContent: coachesHasContent,
    },
    venueDetails: {
      lines: venueDetailsInline,
      registrationDeskNote: showRegistrationDeskNote ? registrationDeskNote : "",
      awardsAreaItems,
      assignedGymLabel: gymLayoutLabelValue,
      gymLayoutImageUrl,
      hasContent:
        venueDetailsInline.length > 0 ||
        showRegistrationDeskNote ||
        showAwardsAreaNote ||
        Boolean(gymLayoutLabelValue) ||
        Boolean(gymLayoutImageUrl),
    },
    admissionSales: {
      admissionCards,
      primaryNote: admissionPrimaryNote,
      logisticsItems: spectatorLogisticsItems,
      merchandiseText,
      merchandiseLink: toAction(merchandiseLink),
      rotationLink: toAction(rotationLink),
      resultsText: resultsInfoText,
      resultsLinks,
      hasContent:
        admissionCards.length > 0 ||
        Boolean(admissionPrimaryNote) ||
        spectatorLogisticsItems.length > 0 ||
        Boolean(merchandiseText) ||
        Boolean(toAction(merchandiseLink)) ||
        Boolean(toAction(rotationLink)) ||
        Boolean(resultsInfoText) ||
        resultsLinks.length > 0,
    },
    trafficParking: {
      alertText: trafficText,
      alertSlots: trafficSlots,
      daylightSavingsNote: sourceDaylightLine,
      parkingText: safeString(logistics?.parking || parseLogistics?.parking),
      parkingLinks: normalizedParkingLinks,
      parkingPricingLinks: normalizedParkingPricingLinks,
      mapDashboardLink: toAction(mapDashboardLink),
      ratesInfoLink: toAction(ratesInfoLink),
      rideShareNote,
      hotelInfo: safeString(logistics?.hotelInfo || parseLogistics?.hotel),
      mapAddress: facilityMapAddress,
      hasContent:
        Boolean(trafficText) ||
        trafficSlots.length > 0 ||
        Boolean(sourceDaylightLine) ||
        Boolean(safeString(logistics?.parking || parseLogistics?.parking)) ||
        normalizedParkingLinks.length > 0 ||
        normalizedParkingPricingLinks.length > 0 ||
        Boolean(rideShareNote) ||
        Boolean(safeString(logistics?.hotelInfo || parseLogistics?.hotel)) ||
        Boolean(facilityMapAddress),
    },
    safetyPolicy: {
      foodBeverage: policyNotes[0],
      hydration: policyNotes[1],
      serviceAnimals: policyNotes[2],
      safetyPolicy: policyNotes[3],
      hasContent: policyNotes.some(Boolean),
    },
  };
}
