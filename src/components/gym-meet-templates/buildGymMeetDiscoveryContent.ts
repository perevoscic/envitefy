/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-explicit-any */
// @ts-nocheck
import { inflateGymDiscoveryV2EventData, isGymDiscoveryV2EventData } from "@/lib/discovery/event-data";
import { isGymDiscoveryScheduleGridEnabled } from "@/lib/meet-discovery/constants";
import {
  normalizeVenueFactForCompare,
  sanitizeVenueFactLines,
  stitchVenueContinuationLines,
} from "@/lib/venue-facts";
import {
  GymMeetDiscoveryContent,
  GymMeetDiscoverySection,
  GymMeetLinkAction,
  GymMeetScheduleInfo,
} from "./types";
import {
  collapseRepeatedDisplayText,
  formatGymMeetDate,
  sanitizeGymMeetDisplayDateLabel,
  stripLinkedDomainMentions,
} from "./displayText";

const safeString = (value: unknown): string =>
  typeof value === "string"
    ? value.trim()
    : value == null
    ? ""
    : String(value).trim();

const countCurrencyAmounts = (value: string) =>
  (safeString(value).match(/\$\s*\d+(?:\.\d{2})?/g) || []).length;

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

const normalizeLinkDedupLabel = (value: unknown) =>
  safeString(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const uniqueBy = <T,>(items: T[], getKey: (item: T) => string): T[] => {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of Array.isArray(items) ? items : []) {
    const key = safeString(getKey(item)).toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
};

const normalizeScheduleInfo = (
  value: unknown,
  fallback: Partial<GymMeetScheduleInfo> = {}
): GymMeetScheduleInfo => {
  const schedule = (value && typeof value === "object" ? value : {}) as Record<string, any>;
  const days = (Array.isArray(schedule.days) ? schedule.days : [])
    .map((day: any, dayIndex: number) => {
      const sessions = (Array.isArray(day?.sessions) ? day.sessions : [])
        .map((session: any, sessionIndex: number) => ({
          id:
            safeString(session?.id) ||
            `${safeString(day?.id) || `day-${dayIndex + 1}`}-session-${sessionIndex + 1}`,
          code: safeString(session?.code),
          label:
            safeString(session?.label) ||
            (safeString(session?.code) ? `Session ${safeString(session?.code)}` : `Session ${sessionIndex + 1}`),
          group: safeString(session?.group),
          startTime: safeString(session?.startTime),
          warmupTime: safeString(session?.warmupTime),
          note: safeString(session?.note),
          clubs: uniqueBy(
            (Array.isArray(session?.clubs) ? session.clubs : [])
              .map((club: any, clubIndex: number) => ({
                id:
                  safeString(club?.id) ||
                  `${safeString(session?.id) || `session-${sessionIndex + 1}`}-club-${clubIndex + 1}`,
                name: safeString(club?.name),
                teamAwardEligible:
                  typeof club?.teamAwardEligible === "boolean"
                    ? club.teamAwardEligible
                    : null,
                athleteCount:
                  typeof club?.athleteCount === "number" && Number.isFinite(club.athleteCount)
                    ? club.athleteCount
                    : null,
                divisionLabel: safeString(club?.divisionLabel),
              }))
              .filter((club) => club.name),
            (club) => [club.name, club.divisionLabel, `${club.athleteCount ?? ""}`].join("|")
          ),
        }))
        .filter((session) => session.code || session.group || session.startTime || session.clubs.length > 0);
      if (!safeString(day?.date) && !safeString(day?.shortDate) && sessions.length === 0) return null;
      return {
        id: safeString(day?.id) || `schedule-day-${dayIndex + 1}`,
        date: safeString(day?.date),
        shortDate: safeString(day?.shortDate) || safeString(day?.date),
        isoDate: safeString(day?.isoDate) || undefined,
        sessions,
      };
    })
    .filter((day): day is NonNullable<typeof day> => Boolean(day));

  return {
    enabled: schedule.enabled !== false,
    venueLabel: safeString(schedule.venueLabel || fallback.venueLabel),
    supportEmail: safeString(schedule.supportEmail || fallback.supportEmail),
    notes: uniqueBy(
      [
        ...(Array.isArray(schedule.notes) ? schedule.notes : []),
        ...(Array.isArray(fallback.notes) ? fallback.notes : []),
      ]
        .map((item) => safeString(item))
        .filter(Boolean),
      (item) => item
    ),
    annotations: uniqueBy(
      [
        ...(Array.isArray(schedule.annotations) ? schedule.annotations : []),
        ...(Array.isArray(fallback.annotations) ? fallback.annotations : []),
      ]
        .map((item: any) => ({
          id: safeString(item?.id) || undefined,
          kind: safeString(item?.kind) || undefined,
          level: safeString(item?.level) || undefined,
          sessionCode: safeString(item?.sessionCode) || undefined,
          date: safeString(item?.date) || undefined,
          time: safeString(item?.time) || undefined,
          text: safeString(item?.text),
        }))
        .filter((item) => item.text),
      (item) =>
        `${item.kind || ""}|${item.level || ""}|${item.sessionCode || ""}|${item.date || ""}|${item.time || ""}|${item.text}`
    ),
    assignments: uniqueBy(
      [
        ...(Array.isArray(schedule.assignments) ? schedule.assignments : []),
        ...(Array.isArray(fallback.assignments) ? fallback.assignments : []),
      ]
        .map((item: any) => ({
          id: safeString(item?.id) || undefined,
          level: safeString(item?.level) || undefined,
          groupLabel: safeString(item?.groupLabel) || undefined,
          sessionCode: safeString(item?.sessionCode) || undefined,
          birthDateRange: safeString(item?.birthDateRange) || undefined,
          divisionLabel: safeString(item?.divisionLabel) || undefined,
          note: safeString(item?.note) || undefined,
        }))
        .filter(
          (item) =>
            item.sessionCode ||
            item.groupLabel ||
            item.birthDateRange ||
            item.divisionLabel ||
            item.note
        ),
      (item) =>
        `${item.level || ""}|${item.groupLabel || ""}|${item.sessionCode || ""}|${item.birthDateRange || ""}|${item.divisionLabel || ""}|${item.note || ""}`
    ),
    days,
  };
};

const hasScheduleInfoContent = (value: unknown) => {
  const schedule = normalizeScheduleInfo(value);
  return schedule.days.some((day) =>
    day.sessions.some((session) => session.clubs.length > 0 || session.group || session.startTime || session.code)
  );
};

const normalizePossibleUrl = (value: unknown) => {
  const raw = safeString(value).replace(/[)\],.;!?]+$/, "");
  if (!raw) return "";
  const withProtocol =
    /^https?:\/\//i.test(raw)
      ? raw
      : /^www\./i.test(raw) || (/^[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:\/[^\s]*)?$/i.test(raw) && !/@/.test(raw))
      ? `https://${raw}`
      : "";
  if (!withProtocol) return "";
  try {
    return new URL(withProtocol).toString();
  } catch {
    return "";
  }
};

const extractInlineUrl = (line: string) => {
  const urlMatch = line.match(
    /(?:https?:\/\/[^\s)]+|www\.[^\s)]+|(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/[^\s),;!?]*)?)/i
  );
  if (!urlMatch) {
    return { text: line, href: undefined };
  }
  const raw = (urlMatch[0] || "").replace(/[.,;!?]+$/g, "");
  const href = normalizePossibleUrl(raw);
  if (!href) {
    return { text: line, href: undefined };
  }
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

const normalizeRotationSheetsLink = (item: any) => item;

const toAction = (item: any): GymMeetLinkAction | undefined => {
  const normalizedItem = normalizeRotationSheetsLink(item);
  const url = safeString(normalizedItem?.url);
  if (!/^https?:\/\//i.test(url)) return undefined;
  return {
    label: safeString(normalizedItem?.label || normalizedItem?.title || "Open Link"),
    url,
  };
};

const uniqueLinks = (items: any[], limit = 8) => {
  const seenUrls = new Set<string>();
  const seenLabels = new Set<string>();
  const out: Array<{ label: string; url: string }> = [];
  for (const item of Array.isArray(items) ? items : []) {
    const normalizedItem = normalizeRotationSheetsLink(item);
    const url = safeString(normalizedItem?.url);
    if (!/^https?:\/\//i.test(url)) continue;
    const urlKey = url.toLowerCase();
    const label = safeString(normalizedItem?.label || normalizedItem?.title || "Open Link");
    const labelKey = normalizeLinkDedupLabel(label);
    if (seenUrls.has(urlKey)) continue;
    if (labelKey && seenLabels.has(labelKey)) continue;
    seenUrls.add(urlKey);
    if (labelKey) seenLabels.add(labelKey);
    out.push({
      label,
      url,
    });
    if (out.length >= limit) break;
  }
  return out;
};

const normalizeDiscoveryResourceLinks = (items: any[]) =>
  uniqueBy(
    (Array.isArray(items) ? items : [])
      .map((item: any) => ({
        kind: safeString(item?.kind || "other"),
        status: safeString(item?.status || "unknown"),
        label: safeString(item?.label || item?.title || "Resource link"),
        url: safeString(item?.url),
        sourceUrl: safeString(item?.sourceUrl),
        origin: safeString(item?.origin || "root"),
        contentType: safeString(item?.contentType),
        followed: Boolean(item?.followed),
        matchScore:
          typeof item?.matchScore === "number" && Number.isFinite(item.matchScore)
            ? item.matchScore
            : null,
        matchReason: safeString(item?.matchReason),
        audience: safeString(item?.audience),
        renderTarget: safeString(item?.renderTarget),
      }))
      .filter((item) => /^https?:\/\//i.test(item.url)),
    (item) => `${item.kind}|${item.url}`
  );

const normalizeTravelHotels = (items: any[]) =>
  uniqueBy(
    (Array.isArray(items) ? items : [])
      .map((item: any) => ({
        name: safeString(item?.name),
        imageUrl: safeString(item?.imageUrl) || null,
        distanceFromVenue: safeString(item?.distanceFromVenue) || null,
        groupRate: safeString(item?.groupRate) || null,
        parking: safeString(item?.parking) || null,
        breakfast: safeString(item?.breakfast) || null,
        reservationDeadline: safeString(item?.reservationDeadline) || null,
        phone: safeString(item?.phone) || null,
        bookingUrl: safeString(item?.bookingUrl) || null,
      }))
      .filter((item) => item.name),
    (item) => `${item.name.toLowerCase()}|${(item.bookingUrl || "").toLowerCase()}`
  );

const buildStructuredHotelCards = (items: any[]) =>
  normalizeTravelHotels(items).map((item, index) => {
    const meta = [item.distanceFromVenue, item.groupRate].filter(Boolean).join(" • ");
    const details = [
      item.parking ? `Parking: ${item.parking}` : "",
      item.breakfast ? `Breakfast: ${item.breakfast}` : "",
      item.reservationDeadline ? `Book by: ${item.reservationDeadline}` : "",
      item.phone ? `Phone: ${item.phone}` : "",
    ].filter(Boolean);
    return {
      key: `hotel-structured-${index + 1}`,
      label: item.name,
      meta,
      body: details.join("\n"),
      action:
        /^https?:\/\//i.test(item.bookingUrl || "")
          ? {
              label: "Book Hotel",
              url: item.bookingUrl,
            }
          : undefined,
    };
  });

const PUBLIC_DISCOVERY_ATTENDEE_PATTERN =
  /\b(admission|ticket|spectator|adults?|children|child|under\s*\d|free|venue|address|parking|garage|drop[-\s]?off|ride[-\s]?share|accessible|accessibility|guest services|awards?|hotel|lodging|travel|results?|live scoring|map|doors open|arrival|welcome|hosted by|meet site|food|hydration|animals?|photo|video|order form|apparel|sizing)\b/i;
const PUBLIC_DISCOVERY_OVERVIEW_PATTERN =
  /\b(championships?|classic|invitational|state meet|regional meet|national meet|takes place|host(?:ed)? by|awards ceremon|team awards?|all around awards?)\b/i;
const PUBLIC_DISCOVERY_COACH_OPS_PATTERN =
  /\b(coach(?:es)?(?:\s+only)?|meet reservations?|membership verification|pro member|sign[-\s]?in|attire|competition floor access|scratches?|master rotation sheet|floor music|regional(?:s)?|qualification|entry fees?|late fee|meetmaker|payment instructions?|check payable|coach hospitality)\b/i;
const PUBLIC_DISCOVERY_SESSION_OPS_PATTERN =
  /\b(session assignments?|verify athlete session assignment|club rosters?|roster corrections?|athlete birth[-\s]?date|birth[-\s]?date correction|age[-\s]?group|group\/session|session code|division table|team divisions?|session eligibility|rotation ops?)\b/i;
const PUBLIC_DISCOVERY_DOCUMENT_PATTERN =
  /\b(faq|program|spectator guide|visitor guide|event guide|public document|order form|sizing form|apparel form|photo\s*\/?\s*video)\b/i;
const PUBLIC_DISCOVERY_MIXED_DOCUMENT_PATTERN =
  /\b(packet|info packet|meet packet|schedule(?:\s*&|\s+and)?\s*info|schedule packet)\b/i;
const PUBLIC_DISCOVERY_NOT_MEET_DETAILS_PATTERN =
  /\b(admission|ticket|parking|hotel|lodging|results?|live scoring|faq|program|packet|document|venue map|parking map)\b/i;

const classifyPublicAudience = (text: unknown) => {
  const normalized = safeString(text).replace(/\s+/g, " ").trim();
  if (!normalized) return "unknown";
  const hasCoachOps = PUBLIC_DISCOVERY_COACH_OPS_PATTERN.test(normalized);
  const hasSessionOps = PUBLIC_DISCOVERY_SESSION_OPS_PATTERN.test(normalized);
  const hasPublicAttendee =
    PUBLIC_DISCOVERY_ATTENDEE_PATTERN.test(normalized) ||
    PUBLIC_DISCOVERY_OVERVIEW_PATTERN.test(normalized) ||
    /\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec|\d{1,2}\/\d{1,2}\/\d{2,4})\b/i.test(
      normalized
    ) ||
    /\b\d{3,5}\s+[a-z0-9].*,\s*[a-z]{2}\s+\d{5}\b/i.test(normalized);
  if ((hasCoachOps || hasSessionOps) && hasPublicAttendee) return "mixed";
  if (hasSessionOps) return "session_ops";
  if (hasCoachOps) return "coach_ops";
  if (hasPublicAttendee) return "public_attendee";
  if (PUBLIC_DISCOVERY_MIXED_DOCUMENT_PATTERN.test(normalized)) return "mixed";
  return "unknown";
};

const classifyResourceRenderTarget = (item: any) => {
  const audience = safeString(item?.audience) || classifyPublicAudience(`${item?.label || ""} ${item?.url || ""}`);
  const kind = safeString(item?.kind);
  const haystack = `${safeString(item?.label)} ${safeString(item?.url)}`.toLowerCase();
  if (audience === "coach_ops" || audience === "session_ops") {
    return "hidden";
  }
  if (["roster", "team_divisions", "rotation_hub", "rotation_sheet"].includes(kind)) {
    return "hidden";
  }
  if (kind === "hotel_booking" || kind === "travel_accommodation") return "hotels";
  if (["results_hub", "results_live", "results_pdf"].includes(kind)) return "results";
  if (kind === "admission") return "admission";
  if (kind === "parking") return "traffic_parking";
  if (["photo_video", "apparel_form"].includes(kind)) return "documents";
  if (audience === "unknown") return "hidden";
  if (PUBLIC_DISCOVERY_DOCUMENT_PATTERN.test(haystack)) return "documents";
  if (kind === "packet") {
    return audience === "public_attendee" && PUBLIC_DISCOVERY_DOCUMENT_PATTERN.test(haystack)
      ? "documents"
      : "hidden";
  }
  if (/venue|facility|guest services|entrance|map/i.test(haystack)) return "venue";
  return audience === "public_attendee" ? "meet_details" : "hidden";
};

const normalizePublicSection = (section: any, title: string, fallback?: { body?: unknown; bullets?: unknown[]; hideReason?: string }) => {
  const existing = section && typeof section === "object" ? section : null;
  const body = collapseRepeatedDisplayText(existing ? existing?.body : fallback?.body || "");
  const bulletSource = existing
    ? Array.isArray(existing?.bullets)
      ? existing.bullets
      : []
    : Array.isArray(fallback?.bullets)
    ? fallback.bullets
    : [];
  const bullets = uniqueTextLines(
    bulletSource.map((item) => safeString(item)),
    8
  );
  const items = normalizeTravelHotels(existing?.items);
  const explicitVisibility = safeString(existing?.visibility);
  const visibility =
    explicitVisibility === "visible" || explicitVisibility === "hidden"
      ? explicitVisibility
      : body || bullets.length > 0 || items.length > 0
      ? "visible"
      : "hidden";
  return {
    title: safeString(existing?.title || title) || title,
    body,
    bullets,
    items,
    fallbackLink: safeString(existing?.fallbackLink) || null,
    visibility,
    hideReason:
      visibility === "hidden"
        ? safeString(existing ? existing?.hideReason : fallback?.hideReason) ||
          "No attendee-safe content survived filtering."
        : null,
  };
};

const normalizePublicDocumentSection = (section: any) => {
  const links = uniqueLinks(
    (Array.isArray(section?.links) ? section.links : []).filter((item: any) =>
      PUBLIC_DISCOVERY_DOCUMENT_PATTERN.test(`${safeString(item?.label)} ${safeString(item?.url)}`)
    ),
    12
  );
  const explicitVisibility = safeString(section?.visibility);
  const visibility =
    explicitVisibility === "visible" || explicitVisibility === "hidden"
      ? explicitVisibility
      : links.length > 0
      ? "visible"
      : "hidden";
  return {
    title: safeString(section?.title || "Documents") || "Documents",
    links,
    visibility,
    hideReason:
      visibility === "hidden"
        ? safeString(section?.hideReason) || "No public-safe documents survived filtering."
        : null,
  };
};

const selectSectionResourceLinks = (resourceLinks: any[], target: string, limit = 8) =>
  uniqueLinks(
    resourceLinks
      .filter((item) => safeString(item?.renderTarget) === target)
      .filter((item) => safeString(item?.audience || "public_attendee") === "public_attendee")
      .map((item) => ({ label: item.label, url: item.url })),
    limit
  );

const collectPublicBodyLines = (value: unknown, options?: { excludeMeetDetailKeywords?: boolean; limit?: number }) =>
  uniqueTextLines(
    safeString(value)
      .split(/\n+/)
      .map((line) => line.replace(/^[-\u2022]\s*/, "").trim())
      .filter(Boolean)
      .filter((line) => classifyPublicAudience(line) === "public_attendee")
      .filter((line) =>
        options?.excludeMeetDetailKeywords ? !PUBLIC_DISCOVERY_NOT_MEET_DETAILS_PATTERN.test(line) : true
      ),
    options?.limit || 6
  );

const buildFallbackPublicMeetDetailsBody = (params: {
  detailsText: unknown;
  title?: unknown;
  dateLabel?: unknown;
  venueLabel?: unknown;
  hostGym?: unknown;
  doorsOpen?: unknown;
  arrivalGuidance?: unknown;
  awardsInfo?: unknown;
}) => {
  const overviewLine = (() => {
    const title = safeString(params.title);
    const dateLabel = safeString(params.dateLabel);
    const venueLabel = safeString(params.venueLabel);
    const hostGym = safeString(params.hostGym);
    if (title && dateLabel && venueLabel) {
      return `${title} takes place ${dateLabel} at ${venueLabel}${hostGym ? ` and is hosted by ${hostGym}` : ""}.`;
    }
    return "";
  })();
  return uniqueTextLines(
    [
      overviewLine,
      ...collectPublicBodyLines(params.detailsText, {
        excludeMeetDetailKeywords: true,
        limit: 4,
      }),
      safeString(params.doorsOpen),
      safeString(params.arrivalGuidance),
      safeString(params.awardsInfo),
    ],
    5
  ).join(" ");
};

const normalizeAdmissionAudience = (label: unknown) => {
  const normalized = safeString(label).toLowerCase();
  if (!normalized) return "Admission";
  if (/\b(adults?|13\+|13\s*(?:and|&)\s*up)\b/i.test(normalized)) return "Adults (13+)";
  if (/\b(children|child|kids?|5[-–]\s*12|5\s*(?:to|-)\s*12)\b/i.test(normalized)) {
    return "Children (5-12)";
  }
  if (/\b(under\s*5|5\s*(?:and|&)\s*under|4\s*(?:and|&)\s*under)\b/i.test(normalized)) {
    return "Under 5";
  }
  return safeString(label) || "Admission";
};

const normalizeCurrencyDisplay = (value: unknown) => {
  const raw = safeString(value).replace(/\s+/g, "");
  if (!raw) return "";
  const numeric = Number.parseFloat(raw.replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(numeric)) return raw;
  return Number.isInteger(numeric) ? `$${numeric}` : `$${numeric.toFixed(2)}`;
};

const parseCurrencyAmount = (value: unknown) => {
  const numeric = Number.parseFloat(safeString(value).replace(/[^0-9.]/g, ""));
  return Number.isFinite(numeric) ? numeric : null;
};

const extractMarkedAdmissionAmount = (value: unknown, markerPattern: RegExp) => {
  const text = safeString(value);
  if (!text) return "";
  const marker = new RegExp(markerPattern.source, "i");
  if (
    /\b(?:less|off|discount)\b/i.test(text) &&
    marker.test(text) &&
    /\$\s*\d+(?:\.\d{2})?/.test(text)
  ) {
    return "";
  }
  const markerSource = markerPattern.source;
  const beforeMatch = text.match(
    new RegExp(`\\b(?:${markerSource})\\b(?:\\s+price)?\\b[^$]{0,24}(\\$\\s*\\d+(?:\\.\\d{2})?)`, "i")
  );
  if (beforeMatch?.[1]) return normalizeCurrencyDisplay(beforeMatch[1]);
  const afterMatch = text.match(
    new RegExp(`(\\$\\s*\\d+(?:\\.\\d{2})?)(?:(?!\\$).){0,12}\\b(?:${markerSource})\\b`, "i")
  );
  return normalizeCurrencyDisplay(afterMatch?.[1]);
};

const extractAdmissionVariantAmounts = (item: any) => {
  const label = safeString(item?.label);
  const price = safeString(item?.price);
  const note = safeString(item?.note);
  const normalizedAudience = normalizeAdmissionAudience(label);
  const text = [label, price, note]
    .filter(Boolean)
    .join(" ");
  const amounts = Array.from(text.matchAll(/\$\s*\d+(?:\.\d{2})?/g)).map((match) =>
    normalizeCurrencyDisplay(match[0])
  );
  const priceAmount = normalizeCurrencyDisplay(price);
  const relativeCashDiscount = parseCurrencyAmount(
    (text.match(/\bcash(?:\s+price)?(?:\s+is)?\s+\$?\s*(\d+(?:\.\d{2})?)\s+less\b/i) || [])[1]
  );
  const cashMarker =
    /\bcash\b/i.test(`${label} ${note}`) && !/\b(?:less|off|discount)\b/i.test(note);
  const cardMarker = /\b(card|credit|debit)\b/i.test(`${label} ${note}`);
  const cashAmount =
    extractMarkedAdmissionAmount(price, /cash/) ||
    extractMarkedAdmissionAmount(note, /cash/) ||
    (cashMarker ? priceAmount : "") ||
    (/\bcash\b/i.test(price) ? priceAmount : "");
  const cardAmount =
    extractMarkedAdmissionAmount(price, /card|credit|debit/) ||
    extractMarkedAdmissionAmount(note, /card|credit|debit/) ||
    (cardMarker ? priceAmount : "") ||
    (/\b(card|credit|debit)\b/i.test(price) ? priceAmount : "");
  const hasNumericPrice = Boolean(priceAmount || amounts[0]);
  const isFree =
    normalizedAudience === "Under 5"
      ? /\bfree\b/i.test(text) || !hasNumericPrice
      : /\bfree\b/i.test(`${label} ${price}`) && !hasNumericPrice;
  return {
    cardAmount,
    cashAmount,
    defaultAmount: priceAmount || amounts[0] || "",
    relativeCashDiscount,
    isFree,
  };
};

const ADMISSION_NOTE_MEET_PATTERN =
  /\b(wrong session|based on birthday|session assignment|official session assignment|birth dates? are correct|ineligible for awards|team total)\b/i;

const parseAdmissionMatrixFromSourceLines = (lines: string[]) => {
  const items: Array<{ label: string; price: string; note: string | null }> = [];
  let activeVariant: "card" | "cash" | null = null;

  const pushVariantItem = (label: string, amount: string) => {
    const normalizedAmount = normalizeCurrencyDisplay(amount);
    if (!normalizedAmount || !activeVariant) return;
    items.push({
      label,
      price: normalizedAmount,
      note: activeVariant === "card" ? "Credit Card Price" : "Cash Price",
    });
  };

  for (const rawLine of Array.isArray(lines) ? lines : []) {
    const line = safeString(rawLine).replace(/[–—]/g, "-");
    if (!line) continue;
    if (/\bcredit\s*card\s*price\b|\bcard\s*price\b/i.test(line)) {
      activeVariant = "card";
      continue;
    }
    if (/\bcash\s*price\b/i.test(line)) {
      activeVariant = "cash";
      continue;
    }
    if (!activeVariant) continue;

    const adultAmount =
      (line.match(/(\$\s*\d+(?:\.\d{2})?)(?:(?!\$).){0,24}\badult/i) || [])[1] ||
      (line.match(/\badult(?:s)?(?:\s*\(?(?:13\+|13\s*\+\s*up|13\s*and\s*up|13\s*up)?\)?)?(?:(?!\$).){0,24}(\$\s*\d+(?:\.\d{2})?)/i) || [])[1];
    const childAmount =
      (line.match(/(\$\s*\d+(?:\.\d{2})?)(?:(?!\$).){0,24}\bchild/i) || [])[1] ||
      (line.match(/\bchild(?:ren)?(?:\s*\(?(?:5\s*-\s*12|5-12)\)?)?(?:(?!\$).){0,24}(\$\s*\d+(?:\.\d{2})?)/i) || [])[1];

    if (adultAmount) pushVariantItem("Adults (13+)", adultAmount);
    if (childAmount) pushVariantItem("Children (5-12)", childAmount);
    if (/\bunder\s*5\b.*\bfree\b/i.test(line)) {
      items.push({ label: "Under 5", price: "Free", note: null });
    }
  }

  return uniqueBy(items, (item) => `${item.label}|${item.price}|${item.note || ""}`);
};

const mergeAdmissionVariants = (items: any[]) => {
  const merged = new Map<
    string,
    {
      label: string;
      card?: string;
      cash?: string;
      standard?: string;
      note?: string;
      free?: boolean;
      relativeCashDiscount?: number | null;
    }
  >();
  for (const item of Array.isArray(items) ? items : []) {
    const combined = [safeString(item?.label), safeString(item?.price), safeString(item?.note)]
      .filter(Boolean)
      .join(" ");
    if (classifyPublicAudience(combined) !== "public_attendee") continue;
    const label = normalizeAdmissionAudience(item?.label);
    const current = merged.get(label) || { label };
    const variants = extractAdmissionVariantAmounts(item);
    if (variants.isFree) current.free = true;
    if (variants.cardAmount) current.card = variants.cardAmount;
    if (variants.cashAmount) current.cash = variants.cashAmount;
    if (!variants.cardAmount && !variants.cashAmount && variants.defaultAmount) {
      current.standard = current.standard || variants.defaultAmount;
    }
    if (variants.relativeCashDiscount != null) {
      current.relativeCashDiscount = variants.relativeCashDiscount;
    }
    if (
      !current.note &&
      safeString(item?.note) &&
      !/\$/.test(safeString(item?.note)) &&
      !ADMISSION_NOTE_MEET_PATTERN.test(safeString(item?.note))
    ) {
      current.note = safeString(item?.note);
    }
    const relativeBase = parseCurrencyAmount(current.card || current.standard);
    if (!current.cash && relativeBase != null && current.relativeCashDiscount != null) {
      current.cash = normalizeCurrencyDisplay(relativeBase - current.relativeCashDiscount);
      if (!current.card && current.standard) current.card = current.standard;
    }
    merged.set(label, current);
  }
  return Array.from(merged.values()).map((item, index) => {
    const value = item.free
      ? "Free"
      : item.card && item.cash
      ? `Card ${item.card}`
      : item.card
      ? item.card
      : item.cash
      ? `Cash ${item.cash}`
      : item.standard || "";
    const body = item.free
      ? item.note || ""
      : item.card && item.cash
      ? `Cash ${item.cash}`
      : item.note || "";
    return {
      key: `admission-${index + 1}`,
      label: item.label,
      value,
      body,
    };
  });
};

const sanitizeVenueSectionForMap = (section: any, venueLabel: string, addressLabel: string) => {
  const bodyLines = uniqueTextLines(
    safeString(section?.body)
      .split(/\n+|(?<=[.!?])\s+/)
      .map((line) => line.trim())
      .filter(Boolean),
    6
  );
  const removableVenueTokens = uniqueTextLines(
    [
      venueLabel,
      addressLabel,
      [venueLabel, addressLabel].filter(Boolean).join(", "),
      [venueLabel, addressLabel].filter(Boolean).join(" "),
    ].filter(Boolean),
    8
  ).map((item) => item.toLowerCase().replace(/\s+/g, " ").trim());

  const filteredBody = bodyLines.filter((line) => {
    const key = line.toLowerCase().replace(/\s+/g, " ").trim();
    return key && !removableVenueTokens.includes(key);
  });
  const filteredBullets = uniqueTextLines(
    (Array.isArray(section?.bullets) ? section.bullets : [])
      .map((item: any) => safeString(item))
      .filter(Boolean)
      .filter((line) => {
        const key = line.toLowerCase().replace(/\s+/g, " ").trim();
        return key && !removableVenueTokens.includes(key);
      }),
    6
  );

  return {
    ...section,
    body: filteredBody.join(" "),
    bullets: filteredBullets,
  };
};

const sanitizeSpectatorBody = (body: unknown, hasStructuredAdmissionCards: boolean) => {
  const normalized = collapseRepeatedDisplayText(body);
  if (!normalized) return "";
  const lines = uniqueTextLines(normalized.split(/(?<=[.!?])\s+|\n+/), 6).filter(
    (line) => !hasStructuredAdmissionCards || !/\b(adults?|children|under\s*5|cash|card|credit|debit|\$\d)/i.test(line)
  );
  return lines.join(" ");
};

const shouldRenderPublicAnnouncementCard = (item: any) => {
  const title = safeString(item?.title || item?.label);
  const body = safeString(item?.body || item?.message || item?.text || item?.title);
  const text = `${title} ${body}`.trim();
  if (!text) return false;
  if (classifyPublicAudience(text) !== "public_attendee") return false;
  if (STRUCTURED_ANNOUNCEMENT_PATTERN.test(text)) return false;
  if (/\b(schedule|coach|session|results?|admission|venue|hotel|packet|document)\b/i.test(text)) {
    return false;
  }
  return TRANSIENT_ANNOUNCEMENT_HINT_PATTERN.test(text);
};

const ensureUniqueDiscoveryCardKeys = <T extends { key?: string }>(
  items: T[],
  fallbackPrefix: string
): T[] => {
  const seen = new Map<string, number>();
  return items.map((item, index) => {
    const baseKey =
      safeString(item?.key || `${fallbackPrefix}-${index + 1}`) || `${fallbackPrefix}-${index + 1}`;
    const occurrence = (seen.get(baseKey) || 0) + 1;
    seen.set(baseKey, occurrence);
    return {
      ...item,
      key: occurrence === 1 ? baseKey : `${baseKey}-${occurrence}`,
    };
  });
};

const buildPublicSectionBlocks = (section: any) => {
  const titleKey = safeString(section?.title || "section")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "section";
  const blocks: any[] = [];
  const body = safeString(section?.body);
  const bullets = uniqueTextLines(Array.isArray(section?.bullets) ? section.bullets : [], 8);
  if (body) {
    blocks.push({
      id: `${titleKey}-body`,
      type: "text" as const,
      text: body,
    });
  }
  if (bullets.length > 0) {
    blocks.push({
      id: `${titleKey}-bullets`,
      type: "line-list" as const,
      lines: bullets.map((text) => ({ text })),
    });
  }
  return blocks;
};

const normalizeRedundantLinkSummaryText = (value: unknown) =>
  safeString(value)
    .toLowerCase()
    .replace(/[\r\n]+/g, " ")
    .replace(/\b(?:click|tap|visit|view|check|see|open|use|find|book|reserve)\b/g, " ")
    .replace(/\b(?:the|our|this|these|here|online|official)\b/g, " ")
    .replace(/\b(?:link|links|page|portal|website|site)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const LOW_SIGNAL_TRAVEL_SUMMARY_TEXT = new Set([
  "host hotel",
  "host hotels",
  "hotel",
  "hotels",
  "hotel info",
  "hotel information",
  "group hotel",
  "group hotels",
  "travel",
  "travel links",
  "hotel travel",
  "hotels travel",
  "hotel travel links",
  "hotels travel links",
  "lodging",
  "accommodation",
  "accommodations",
  "housing",
  "book your stay",
  "reservations",
  "reservation link",
  "booking link",
]);

const isLowSignalTravelSummaryText = (value: unknown) => {
  const normalizedValue = normalizeRedundantLinkSummaryText(value);
  if (!normalizedValue) return false;
  if (LOW_SIGNAL_TRAVEL_SUMMARY_TEXT.has(normalizedValue)) return true;
  return (
    normalizedValue.split(" ").length <= 3 &&
    /\b(host|group|hotel|hotels|travel|lodging|accommodation|accommodations|housing|reservation|reservations|booking|stay)\b/i.test(
      normalizedValue
    )
  );
};

const isRedundantLinkSummaryText = (value: unknown, links: Array<{ label?: unknown }>) => {
  const normalizedValue = normalizeRedundantLinkSummaryText(value);
  if (!normalizedValue) return false;

  return (Array.isArray(links) ? links : []).some((link) => {
    const normalizedLabel = normalizeRedundantLinkSummaryText(link?.label);
    return normalizedLabel === normalizedValue;
  });
};

const normalizeAnnouncementCards = (items: any[], source: "builder" | "parsed") => {
  const seen = new Set<string>();
  return ensureUniqueDiscoveryCardKeys(
    (Array.isArray(items) ? items : [])
      .map((item: any, index: number) => {
        const explicitLabel = safeString(item?.title || item?.label);
        const label =
          explicitLabel && !/^announcement$/i.test(explicitLabel)
            ? explicitLabel
            : safeString(item?.priority).toLowerCase() === "urgent"
            ? "Urgent Update"
            : "";
        const body = collapseRepeatedDisplayText(item?.body || item?.text || item?.message);
        return {
          key: safeString(item?.id || `announcement-${index + 1}`),
          label,
          body,
          source,
        };
      })
      .filter((item) => item.body)
      .filter((item) => {
        const dedupeKey = `${item.label}\n${item.body}`.toLowerCase().replace(/\s+/g, " ").trim();
        if (!dedupeKey || seen.has(dedupeKey)) return false;
        seen.add(dedupeKey);
        return true;
      }),
    "announcement"
  );
};

const sanitizeLinkedCopy = (value: unknown, links: Array<string | { url?: unknown }>) =>
  stripLinkedDomainMentions(collapseRepeatedDisplayText(value), links);

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
const STRUCTURED_ANNOUNCEMENT_PATTERN =
  /(arrival guidance|registration\b|results|live scoring|rotation sheets?|awards|venue[_\s]?contact|meet director|director of operations|assistant event coordinator|floor manager|credit\/debit|credit card|debit card|cash is not accepted|cash not accepted|sponsor|visit lauderdale|hairstyle to impress|document[_\s-]?version|club[_\s-]?participation)/i;
const TRANSIENT_ANNOUNCEMENT_HINT_PATTERN =
  /(urgent|reminder|delay|changed|change|closed|closing|today|tomorrow|tonight|this morning|this afternoon|this evening|earlier|later|weather|alert|update)/i;
const MARKETING_SOURCE_PATTERN =
  /(visit lauderdale|hairstyle\s*to\s*impress|many thanks to our sponsors|sponsor(?:ed|ship)?|book your hairstyling appointment|travel photos|#visitlauderdale)/i;
const SCHEDULE_GRID_SOURCE_PATTERN =
  /(session\s+(?:fr|sa|su|\d)|stretch\/warmup|march in|open stretch|capital cup|xcel|session time|level\s+\d|bronze|silver|gold|platinum|diamond|team award|session award)/i;
const CLUB_PARTICIPATION_SOURCE_PATTERN =
  /\b(360 gymnastics fl|alpha gymnastics|christi'?s gymnastics|browns gym|team twisters|canada|fgtc)\b/i;
const GENERAL_INFO_SOURCE_PATTERN =
  /(rosters?|athlete\s*&\s*coach registration|rotation sheets?|awards ceremon|spectator admission|meet director|director of operations|assistant event coordinator|floor manager|results|live scoring|arrival guidance|registration)/i;
const VENUE_ADMISSION_SOURCE_PATTERN =
  /(meet site|ph:\s*\d|phone numbers? are|on-site admission prices|weekend pass|group hotel|driving directions|coral springs gymnasium|debit\/credit card only|cash not accepted)/i;
const TRUE_GEAR_TEXT_PATTERN =
  /\b(leotard|uniform|warm[-\s]?up|warmups?|grips?|wristbands?|beam shoes?|scrunchie|hair\b|bun\b|ponytail|bag\b|duffel|backpack|water bottle|music file|music upload|athletic shoes?)\b/i;
const GEAR_EXCLUDED_TEXT_PATTERN =
  /\b(admission|ticket|spectator|cash(?:less)?|credit\/debit|credit card|debit card|cash is not accepted|cash not accepted|check[-\s]?in|registration|arrival guidance|results?|website|sponsor|visit lauderdale|hairstyl|temperature inside the venue|chilly|athlete card|score card|awards ceremon|rotation sheets?)\b/i;
const VENUE_COMFORT_TEXT_PATTERN =
  /\b(temperature inside the venue|inside the venue is chilly|venue is chilly|please come prepared|beyond our control)\b/i;
const VENUE_DETAIL_TEXT_PATTERN =
  /\b(meet site|venue contact|facility contact|gym contact|gymnasium|phone numbers? are|ph:\s*\d|temperature inside the venue|inside the venue is chilly|guest services|awards area|competition area|east hall|west hall|central hall|north hall|south hall)\b/i;
const VENUE_ONLY_INCLUDE_PATTERN =
  /\b(meet site|venue contact|facility contact|gym contact|gymnasium|phone numbers? are|ph:\s*\d|guest services|awards area|competition area|east hall|west hall|central hall|north hall|south hall|entrance|map|layout|assigned gym|gym\s*[a-z0-9]{1,2}|2nd floor|second floor|3rd floor|third floor|freight door|right door)\b/i;
const VENUE_ONLY_EXCLUDE_PATTERN =
  /\b(athlete|athletes|coach|coaches|gift\b|sign[-\s]?in|check[-\s]?in|receive a gift|warm clothing|layers\b|please come prepared|come prepared|beyond our control|temperature inside the venue|inside the venue is chilly|venue is chilly|admission|ticket|spectator|cash(?:less)?|credit\/debit|credit card|debit card|rotation sheets?|results?|registration opens|arrive|arrival guidance)\b/i;
const ADMISSION_POLICY_TEXT_PATTERN =
  /\b(admission|ticket|spectator|pre[-\s]?sale|credit\/debit|credit card|debit card|cashless|cash is not accepted|cash not accepted|no cash)\b/i;
const MEET_DETAIL_TEXT_PATTERN =
  /\b(arrival guidance|registration|rotation sheets?|results?|live scoring|awards|athlete card|score card|gift\b|check in prior|check-in prior)\b/i;

type ExtractedPageKind =
  | "general_info"
  | "schedule_grid"
  | "venue_admission"
  | "marketing"
  | "empty"
  | "unknown";

const _normalizeLineKey = (value: string) => safeString(value).toLowerCase().replace(/\s+/g, " ").trim();

const isUsableEmail = (value: unknown) => USABLE_EMAIL_PATTERN.test(safeString(value));
const isUsablePhone = (value: unknown) => safeString(value).replace(/\D/g, "").length >= 7;
const isMarketingLikeSourceLine = (value: string) => MARKETING_SOURCE_PATTERN.test(safeString(value));
/** Sync string heuristic only: keeps obvious session/schedule *table rows* out of Meet Details prose. Unrelated to gym-layout vision in meet-discovery. Structured schedule derivation is gated by `GYM_DISCOVERY_SCHEDULE_GRID_ENABLED`. */
const isScheduleGridLikeSourceLine = (value: string) => {
  const text = safeString(value);
  if (!text) return false;
  if (SCHEDULE_GRID_SOURCE_PATTERN.test(text)) return true;
  if (CLUB_PARTICIPATION_SOURCE_PATTERN.test(text)) return true;
  const allCapsWords = text.match(/\b[A-Z][A-Za-z'.&-]+\b/g) || [];
  if (allCapsWords.length >= 4 && /\b(gym|gymnastics|fl)\b/i.test(text)) return true;
  return false;
};

/** Long sentence-like packet prose; avoids classifying "Xcel Bronze/Silver…" cover copy as schedule grid noise. */
const isNarrativeMeetPacketLine = (value: string) => {
  const text = safeString(value).trim();
  if (text.length < 45) return false;
  if (CLUB_PARTICIPATION_SOURCE_PATTERN.test(text)) return false;
  const words = text.split(/\s+/).filter(Boolean).length;
  if (words < 10) return false;
  const timeTokens = (text.match(/\b\d{1,2}:\d{2}\s*[AP]M\b/gi) || []).length;
  if (timeTokens >= 1 && words < 22) return false;
  if (/^session\s+[a-z]?\d+/i.test(text) && words < 16) return false;
  if (!/[.!?]/.test(text) && words < 15) return false;
  return /\b(coaches?|athletes?|awards?\s+ceremon|awards?\b|membership|rosters?|sanction|hospitality|regionals?|qualif|ineligible|attire|dress\s+code|sign[-\s]?in\b|usa\s+gymnastics|rotation\s+sheet|scratches?|professional\s+membership|competition\s+floor|team\s+twisters|twisters\b|packet|enclosed|birth\s+dates?|meet\s+reservations?|session\s+assignments?|xcel\b|championship|proud\s+to\s+host|director\s+of\s+operations|meet\s+director)\b/i.test(
    text
  );
};
const isClubParticipationLikeSourceLine = (value: string) =>
  CLUB_PARTICIPATION_SOURCE_PATTERN.test(safeString(value));
const isParticipantListingLine = (value: string) => {
  const text = safeString(value);
  if (!text) return false;
  if (isClubParticipationLikeSourceLine(text)) return true;
  if (/[.!?:;]/.test(text)) return false;
  const orgHits = (text.match(/\b(gymnastics|gym|academy|ymca|twisters|zga|fl)\b/gi) || []).length;
  const titleWordHits = (text.match(/\b[A-Z][A-Za-z'&.-]+\b/g) || []).length;
  return orgHits >= 3 || (orgHits >= 2 && titleWordHits >= 5);
};
const isTrueGearLine = (value: string) => {
  const text = safeString(value);
  return Boolean(text) && TRUE_GEAR_TEXT_PATTERN.test(text) && !GEAR_EXCLUDED_TEXT_PATTERN.test(text);
};
const classifyOperationalLine = (value: string): "venue" | "admission" | "meet" | "suppress" | "other" => {
  const text = safeString(value);
  if (!text) return "suppress";
  if (isMarketingLikeSourceLine(text) || isScheduleGridLikeSourceLine(text)) return "suppress";
  if (VENUE_COMFORT_TEXT_PATTERN.test(text)) return "venue";
  if (ADMISSION_POLICY_TEXT_PATTERN.test(text)) return "admission";
  if (MEET_DETAIL_TEXT_PATTERN.test(text)) return "meet";
  if (VENUE_DETAIL_TEXT_PATTERN.test(text)) return "venue";
  return "other";
};

const splitExtractedDiscoveryPages = (text: string) => {
  const normalized = safeString(text);
  if (!normalized) return [] as Array<{ pageNumber: number; text: string; lines: string[] }>;
  const markerPattern = /(?:^|\n)\s*--\s*(\d+)\s+of\s+(\d+)\s*--\s*(?=\n|$)/gi;
  const matches = [...normalized.matchAll(markerPattern)];
  if (!matches.length) {
    return [
      {
        pageNumber: 1,
        text: normalized,
        lines: normalized.split(/\n+/).map((line) => safeString(line)).filter(Boolean),
      },
    ];
  }

  const pages: Array<{ pageNumber: number; text: string; lines: string[] }> = [];
  const firstMarkerIndex = matches[0]?.index ?? 0;
  if (firstMarkerIndex > 0) {
    const preamble = normalized.slice(0, firstMarkerIndex).trim();
    if (preamble) {
      const lines = preamble.split(/\n+/).map((line) => safeString(line)).filter(Boolean);
      pages.push({ pageNumber: 0, text: preamble, lines });
    }
  }
  for (let index = 0; index < matches.length; index += 1) {
    const match = matches[index];
    const pageNumber = Number.parseInt(match[1] || `${index + 1}`, 10) || index + 1;
    const start = (match.index || 0) + match[0].length;
    const end = index + 1 < matches.length ? matches[index + 1].index || normalized.length : normalized.length;
    const pageText = normalized.slice(start, end).trim();
    const lines = pageText.split(/\n+/).map((line) => safeString(line)).filter(Boolean);
    pages.push({ pageNumber, text: pageText, lines });
  }
  return pages;
};

const classifyExtractedPageKind = (page: { text: string; lines: string[] }): ExtractedPageKind => {
  const text = safeString(page?.text);
  const lines = Array.isArray(page?.lines) ? page.lines.map((line) => safeString(line)).filter(Boolean) : [];
  if (!text || !lines.length) return "empty";
  const combined = lines.join(" ");
  if (isMarketingLikeSourceLine(combined)) return "marketing";
  const scheduleSignals = lines.filter((line) => isScheduleGridLikeSourceLine(line)).length;
  if (scheduleSignals >= 2 || /session\s+(?:fr|sa|su|\d)/i.test(combined)) return "schedule_grid";
  if (VENUE_ADMISSION_SOURCE_PATTERN.test(combined)) return "venue_admission";
  if (GENERAL_INFO_SOURCE_PATTERN.test(combined)) return "general_info";
  return "unknown";
};

const collectRoutableSourceLines = (text: string) =>
  uniqueTextLines(
    splitExtractedDiscoveryPages(text)
      .map((page) => ({ ...page, kind: classifyExtractedPageKind(page) }))
      .filter((page) => page.kind !== "marketing" && page.kind !== "schedule_grid" && page.kind !== "empty")
      .flatMap((page) => page.lines)
      .filter(Boolean),
    220
  );

const sanitizeContactRecord = (item: any, fallbackRole = "Contact") => {
  const role = collapseRepeatedDisplayText(item?.role || fallbackRole) || fallbackRole;
  const name = collapseRepeatedDisplayText(item?.name);
  const email = isUsableEmail(item?.email) ? safeString(item?.email) : "";
  const phone = isUsablePhone(item?.phone) ? safeString(item?.phone) : "";
  if (!name && !email && !phone) return null;
  return {
    role,
    name,
    email,
    phone,
  };
};

const classifyParsedContactRole = (item: any): "public" | "venue" | "coach" | "other" => {
  const haystack = `${safeString(item?.role)} ${safeString(item?.name)}`;
  if (VENUE_CONTACT_ROLE_PATTERN.test(haystack)) return "venue";
  if (PUBLIC_MEET_CONTACT_ROLE_PATTERN.test(haystack)) return "public";
  if (COACH_CONTACT_ROLE_PATTERN.test(haystack)) return "coach";
  return "other";
};

const shouldSuppressUnmappedFact = (fact: any) => {
  const category = safeString(fact?.category).toLowerCase();
  const detail = safeString(fact?.detail);
  if (!detail) return true;
  if (isMarketingLikeSourceLine(detail)) return true;
  if (isScheduleGridLikeSourceLine(detail)) return true;
  if (isClubParticipationLikeSourceLine(detail)) return true;
  if (/^[^\s@]+@$/i.test(detail)) return true;
  return SUPPRESSED_UNMAPPED_FACT_CATEGORIES.has(category);
};

const shouldKeepAnnouncementCard = (item: any) => {
  const label = safeString(item?.label || item?.title);
  const body = safeString(item?.body || item?.text || item?.message);
  const combined = `${label} ${body}`;
  if (!body) return false;
  if (!STRUCTURED_ANNOUNCEMENT_PATTERN.test(combined)) return true;
  return TRANSIENT_ANNOUNCEMENT_HINT_PATTERN.test(combined);
};

const getBlockContentScore = (block: any) => {
  if (!block) return 0;
  switch (block.type) {
    case "line-list":
      return 2;
    case "text":
      return 1;
    case "card-grid":
      return Math.min(Array.isArray(block.cards) ? block.cards.length : 0, 4);
    case "link-list":
      return Math.max(Array.isArray(block.links) ? block.links.length : 0, 2);
    case "cta":
      return 2;
    case "image":
    case "map":
      return 3;
    default:
      return 0;
  }
};

const getSectionMetrics = (section: any) => {
  const blocks = Array.isArray(section?.blocks) ? section.blocks : [];
  return {
    blockCount: blocks.length,
    cardCount: blocks.reduce(
      (sum: number, block: any) =>
        sum + (block?.type === "card-grid" && Array.isArray(block.cards) ? block.cards.length : 0),
      0
    ),
    linkCount: blocks.reduce(
      (sum: number, block: any) =>
        sum + (block?.type === "link-list" && Array.isArray(block.links) ? block.links.length : 0),
      0
    ),
    hasVisualBlock: blocks.some((block: any) => block?.type === "image" || block?.type === "map"),
    hasPrimaryAction: blocks.some((block: any) => block?.type === "cta"),
    contentScore: blocks.reduce((sum: number, block: any) => sum + getBlockContentScore(block), 0),
  };
};

const isSparseSection = (section: any) => {
  const metrics = getSectionMetrics(section);
  return metrics.contentScore <= 3 && !metrics.hasVisualBlock && !metrics.hasPrimaryAction;
};

const _isLightAdmissionSection = (section: any) => {
  const metrics = getSectionMetrics(section);
  return (
    metrics.contentScore <= 4 &&
    !metrics.hasVisualBlock &&
    !metrics.hasPrimaryAction &&
    metrics.cardCount <= 2 &&
    metrics.linkCount <= 1
  );
};

const mergeSections = ({
  primary,
  secondary,
  id,
  label,
  kind,
}: {
  primary: any;
  secondary: any;
  id?: string;
  label?: string;
  kind?: string;
}) => ({
  ...primary,
  id: id || primary.id,
  label: label || primary.label,
  kind: kind || primary.kind,
  navLabel: label || primary.navLabel || primary.label,
  priority: Math.min(primary.priority ?? 999, secondary.priority ?? 999),
  hasContent: true,
  blocks: [...(Array.isArray(primary.blocks) ? primary.blocks : []), ...(Array.isArray(secondary.blocks) ? secondary.blocks : [])],
});

const compactNavLabel = (label: string) => {
  const normalized = safeString(label);
  if (/^results\s*&\s*live\s*scoring$/i.test(normalized)) return "Results";
  return normalized;
};

const createSyntheticSection = ({
  id,
  label,
  kind,
  priority,
}: {
  id: string;
  label: string;
  kind: string;
  priority: number;
}) => ({
  id,
  label,
  kind,
  priority,
  hasContent: true,
  blocks: [],
});

const mergeSparseDiscoverySections = (sections: GymMeetDiscoverySection[]) => {
  const working = [...sections];
  const takeSection = (id: string) => {
    const index = working.findIndex((section) => section.id === id);
    if (index < 0) return null;
    return { section: working[index], index };
  };
  const removeAt = (index: number) => {
    working.splice(index, 1);
  };
  const replaceAt = (index: number, section: GymMeetDiscoverySection) => {
    working[index] = section;
  };

  const meetDetailsMatch = takeSection("meet-details");
  const resultsMatch = takeSection("results");
  if (
    resultsMatch &&
    !resultsMatch.section?.preserveStandalone &&
    isSparseSection(resultsMatch.section) &&
    getSectionMetrics(resultsMatch.section).linkCount <= 2
  ) {
    const meetTarget =
      meetDetailsMatch ||
      (() => {
        const synthetic = createSyntheticSection({
          id: "meet-details",
          label: "Meet Details",
          kind: "meet_overview",
          priority: 10,
        });
        working.push(synthetic);
        return { section: synthetic, index: working.length - 1 };
      })();
    const merged = mergeSections({
      primary: meetTarget.section,
      secondary: resultsMatch.section,
    });
    replaceAt(meetTarget.index, merged);
    removeAt(resultsMatch.index > meetTarget.index ? resultsMatch.index : resultsMatch.index);
  }

  const trafficMatch = takeSection("traffic-parking");
  const hotelMatch = takeSection("hotels");
  if (
    trafficMatch &&
    hotelMatch &&
    !hotelMatch.section?.preserveStandalone &&
    isSparseSection(hotelMatch.section) &&
    getSectionMetrics(hotelMatch.section).linkCount <= 2
  ) {
    const merged = mergeSections({
      primary: trafficMatch.section,
      secondary: hotelMatch.section,
    });
    replaceAt(trafficMatch.index, merged);
    removeAt(hotelMatch.index > trafficMatch.index ? hotelMatch.index : hotelMatch.index);
  }

  const documentsMatch = takeSection("documents");
  if (
    documentsMatch &&
    !documentsMatch.section?.preserveStandalone &&
    isSparseSection(documentsMatch.section)
  ) {
    const documentText = [
      documentsMatch.section.label,
      ...(documentsMatch.section.blocks || []).flatMap((block: any) =>
        block?.type === "link-list" && Array.isArray(block.links)
          ? block.links.map((link: any) => `${safeString(link?.label)} ${safeString(link?.url)}`)
          : []
      ),
    ]
      .join(" ")
      .toLowerCase();
    const targetId =
      /(parking|garage|parkmobile|pay\s+by\s+phone|lots\s+and\s+garages|parking\s+rates?|hourly\s+and\s+daily\s+rates)/i.test(
        documentText
      )
        ? "traffic-parking"
        : /(coach|meetmaker|entry|registration|regional)/i.test(documentText)
        ? "coaches"
        : /(venue|floor|hall|map|facility)/i.test(documentText)
        ? "venue-details"
        : "meet-details";
    const targetMatch =
      takeSection(targetId) ||
      (targetId === "meet-details"
        ? (() => {
            const synthetic = createSyntheticSection({
              id: "meet-details",
              label: "Meet Details",
              kind: "meet_overview",
              priority: 10,
            });
            working.push(synthetic);
            return { section: synthetic, index: working.length - 1 };
          })()
        : targetId === "traffic-parking"
        ? (() => {
            const synthetic = createSyntheticSection({
              id: "traffic-parking",
              label: "Traffic & Parking",
              kind: "traffic_parking",
              priority: 60,
            });
            working.push(synthetic);
            return { section: synthetic, index: working.length - 1 };
          })()
        : null);
    if (targetMatch) {
      const merged = mergeSections({
        primary: targetMatch.section,
        secondary: documentsMatch.section,
      });
      replaceAt(targetMatch.index, merged);
      removeAt(documentsMatch.index > targetMatch.index ? documentsMatch.index : documentsMatch.index);
    }
  }

  const sorted = working.sort((a, b) => a.priority - b.priority);
  const shouldCompactLabels = sorted.length >= 7;
  return sorted.map((section) => ({
    ...section,
    navLabel: shouldCompactLabels ? compactNavLabel(section.navLabel || section.label) : undefined,
  }));
};

export function buildGymMeetDiscoveryContent({
  eventData,
  customFields,
  advancedSections,
  date,
  detailsText,
  /** Unstripped packet prose for Meet Details routing; hero still uses stripped `detailsText` from normalize. */
  detailsTextForDiscovery,
  venue,
  address,
}: {
  eventData: any;
  customFields: any;
  advancedSections: any;
  date?: string;
  detailsText?: string;
  detailsTextForDiscovery?: string;
  venue?: string;
  address?: string;
}): GymMeetDiscoveryContent {
  eventData = inflateGymDiscoveryV2EventData(eventData);
  const scheduleGridsEnabled = isGymDiscoveryScheduleGridEnabled();
  const logistics = advancedSections?.logistics || {};
  const meetSection = advancedSections?.meet || {};
  const gearSection = advancedSections?.gear || {};
  const coachesSection = advancedSections?.coaches || {};
  const parseResult = eventData?.discoverySource?.parseResult || {};
  const discoveryV2 = isGymDiscoveryV2EventData(eventData);
  const isGymDiscoveryEvent =
    discoveryV2 ||
    safeString(eventData?.createdVia) === "meet-discovery" ||
    safeString(eventData?.discoverySource?.workflow) === "gymnastics" ||
    Boolean(eventData?.discoverySource?.input || eventData?.discoverySource?.parseResult);
  const isPublicPageV2 =
    isGymDiscoveryEvent || eventData?.discoverySource?.pipelineVersion === "gym-public-v2";
  const publicPageSections = eventData?.discoverySource?.publicPageSections || {};
  const parseGear = parseResult?.gear || {};
  const parseLogistics = parseResult?.logistics || {};
  const parseMeetDetails = parseResult?.meetDetails || {};
  const parseCommunications = parseResult?.communications || {};
  const parseCoachInfo = parseResult?.coachInfo || {};
  const parseLinks = Array.isArray(parseResult?.links) ? parseResult.links : [];
  const discoveredLinks = Array.isArray(eventData?.discoverySource?.extractionMeta?.discoveredLinks)
    ? eventData.discoverySource.extractionMeta.discoveredLinks
    : [];
  const resourceLinks = normalizeDiscoveryResourceLinks(
    eventData?.discoverySource?.extractionMeta?.resourceLinks
  ).map((item: any) => {
    const audience =
      safeString(item?.audience) ||
      classifyPublicAudience(`${safeString(item?.label)} ${safeString(item?.url)} ${safeString(item?.sourceUrl)}`);
    return {
      ...item,
      audience,
      renderTarget: safeString(item?.renderTarget) || classifyResourceRenderTarget({ ...item, audience }),
    };
  });
  const hasStructuredResources = resourceLinks.length > 0;
  const pickStructuredResourceLinks = (...kinds: string[]) =>
    resourceLinks.filter((item) => kinds.includes(item.kind));
  const toResourceActions = (...kinds: string[]) =>
    uniqueLinks(
      pickStructuredResourceLinks(...kinds).map((item) => ({
        label: item.label,
        url: item.url,
      })),
      8
    );
  const quickLinks = uniqueLinks(
    [
      ...resourceLinks.map((item) => ({ label: item.label, url: item.url })),
      ...(Array.isArray(eventData?.links) ? eventData.links : []),
      ...parseLinks,
      ...discoveredLinks,
    ],
    24
  );
  const normalizedLinks = quickLinks;

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
      .replace(/[:;,-]\s*$/g, "")
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
  const structuredRotationHub = pickStructuredResourceLinks("rotation_hub")[0];
  const structuredRotationSheet = pickStructuredResourceLinks("rotation_sheet")[0];
  const mapDashboardLink = pickLink(
    /(map|dashboard|parking|traffic|arcgis|parkmobile|garage|arrival|route)/i
  );
  const ratesInfoLink = pickLink(/(rate|pricing|fee|parking)/i, /(rotation|result|score)/i);
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
    sanitizeGymMeetDisplayDateLabel(customFields?.meetDateRangeLabel) ||
    sanitizeGymMeetDisplayDateLabel(eventData?.discoverySource?.parseResult?.dates) ||
    (date ? formatGymMeetDate(date, { withWeekday: true }) : "");
  const venueLabel = collapseRepeatedDisplayText(venue || eventData?.venue);
  const addressLabel = collapseRepeatedDisplayText(address || eventData?.address);
  const normalizedDetailsText = safeString(detailsTextForDiscovery ?? detailsText);
  const extractedDiscoveryText = safeString(eventData?.discoverySource?.extractedText);
  const isHtmlNoiseLine = (line: string) =>
    /("@context"|schema\.org|@graph|breadcrumb|myftpupload|wp-content|wordpress|site name|home\s*>\s*|json-ld|application\/ld\+json)/i.test(
      safeString(line)
    );
  const sourceLines = collectRoutableSourceLines(extractedDiscoveryText)
    .map((line) => line.replace(/^[-\u2022]\s*/, "").trim())
    .filter(Boolean)
    .filter((line) => !isHtmlNoiseLine(line))
    .filter((line) => !isMarketingLikeSourceLine(line))
    .filter((line) => !isScheduleGridLikeSourceLine(line))
    .filter((line) => !isClubParticipationLikeSourceLine(line));
  const recoveredAdmissionMatrixCards = parseAdmissionMatrixFromSourceLines(sourceLines);
  const reroutedAdmissionMeetLines = uniqueTextLines(
    baseAdmissionNoteCandidates.filter((line) => ADMISSION_NOTE_MEET_PATTERN.test(line)),
    6
  );
  const facilityMapAddress = addressLabel || venueLabel;
  const gymLayoutImageUrl = safeString(
    advancedSections?.logistics?.gymLayoutImage ||
      eventData?.discoverySource?.extractionMeta?.gymLayoutImageDataUrl
  );
  const assignedGymRaw = collapseRepeatedDisplayText(
    advancedSections?.meet?.assignedGym || parseResult?.athlete?.assignedGym || ""
  );
  const gymLayoutLabel = safeString(
    advancedSections?.logistics?.gymLayoutLabel ||
      (assignedGymRaw ? `Assigned gym location: ${assignedGymRaw}` : "")
  );
  const gymLayoutLabelValue = gymLayoutLabel
    ? gymLayoutLabel.replace(/^assigned gym location:\s*/i, "").trim() || gymLayoutLabel
    : "";

  if (isPublicPageV2) {
    const fallbackMeetDetailsBody = [
      buildFallbackPublicMeetDetailsBody({
        detailsText: normalizedDetailsText,
        title: eventData?.eventTitle || eventData?.title,
        dateLabel: eventDatesLabel,
        venueLabel,
        hostGym: eventData?.hostGym,
        doorsOpen: meetSection?.doorsOpen || parseMeetDetails?.doorsOpen,
        arrivalGuidance: meetSection?.arrivalGuidance || parseMeetDetails?.arrivalGuidance,
        awardsInfo: meetSection?.awardsInfo || parseMeetDetails?.awardsInfo,
      }),
      ...reroutedAdmissionMeetLines,
    ]
      .filter(Boolean)
      .join(" ");
    const fallbackParkingBody =
      collectPublicBodyLines(
        [
          safeString(logistics?.parking || parseLogistics?.parking),
          safeString(logistics?.rideShare || parseLogistics?.rideShare),
          safeString(logistics?.accessibility || parseLogistics?.accessibility),
        ].join("\n"),
        { limit: 3 }
      ).join(" ") ||
      (facilityMapAddress
        ? `Parking details were not listed in the packet. Plan to arrive early at ${facilityMapAddress} and follow on-site signage for spectator parking and drop-off.`
        : "");
    const fallbackTrafficBody =
      collectPublicBodyLines(
        safeString(logistics?.trafficAlerts || parseLogistics?.trafficAlerts),
        { limit: 2 }
      ).join(" ") ||
      (facilityMapAddress
        ? "Allow extra arrival time near the venue and follow posted event traffic direction on arrival."
        : "");
    const fallbackVenueBody = uniqueTextLines(
      [
        venueLabel,
        addressLabel,
        ...collectPublicBodyLines(safeString(meetSection?.facilityLayout || parseMeetDetails?.facilityLayout), {
          limit: 2,
        }),
      ],
      3
    ).join(" ");
    const fallbackSpectatorBody = uniqueTextLines(
      [
        ...parseResultAdmission.map((item: any) =>
          [safeString(item?.label), safeString(item?.price), safeString(item?.note)]
            .filter(Boolean)
            .join(": ")
        ),
        ...collectPublicBodyLines(
          [
            safeString(logistics?.policyFood),
            safeString(logistics?.policyHydration),
            safeString(logistics?.policySafety),
            safeString(logistics?.policyAnimals),
          ].join("\n"),
          { limit: 4 }
        ),
      ],
      5
    ).join(" ");
    const fallbackTravelBody =
      collectPublicBodyLines(safeString(logistics?.hotelInfo || parseLogistics?.hotel), {
        limit: 2,
      }).join(" ");
    const effectivePublicSections = {
      meetDetails: normalizePublicSection(publicPageSections?.meetDetails, "Meet Details", {
        body: fallbackMeetDetailsBody,
        hideReason: "No attendee-safe meet overview survived filtering.",
      }),
      parking: normalizePublicSection(publicPageSections?.parking, "Parking", {
        body: fallbackParkingBody,
        hideReason: "No attendee-safe parking guidance survived filtering.",
      }),
      traffic: normalizePublicSection(publicPageSections?.traffic, "Traffic", {
        body: fallbackTrafficBody,
        hideReason: "No attendee-safe traffic guidance survived filtering.",
      }),
      venue: normalizePublicSection(publicPageSections?.venue, "Venue Details", {
        body: fallbackVenueBody,
        hideReason: "Venue details are incomplete.",
      }),
      spectatorInfo: normalizePublicSection(publicPageSections?.spectatorInfo, "Spectator Info", {
        body: fallbackSpectatorBody,
        hideReason: "No attendee-safe admission or spectator policies survived filtering.",
      }),
      travel: normalizePublicSection(publicPageSections?.travel, "Hotels & Travel", {
        body: fallbackTravelBody,
        hideReason: "No attendee-safe hotel or travel guidance survived filtering.",
      }),
      documents: publicPageSections?.documents
        ? normalizePublicDocumentSection(publicPageSections.documents)
        : normalizePublicDocumentSection({
            title: "Documents",
            links: selectSectionResourceLinks(resourceLinks, "documents", 12),
          }),
    };
    const sanitizedVenueSection = sanitizeVenueSectionForMap(
      effectivePublicSections?.venue,
      venueLabel,
      addressLabel
    );
    const admissionCardsNormalized = mergeAdmissionVariants(
      Array.isArray(parseResult?.admission) && parseResult.admission.length > 0
        ? [...parseResult.admission, ...recoveredAdmissionMatrixCards]
        : rawAdmissionCards
    );
    const spectatorBody = sanitizeSpectatorBody(
      effectivePublicSections?.spectatorInfo?.body,
      admissionCardsNormalized.length > 0
    );
    const resultLinks = selectSectionResourceLinks(resourceLinks, "results", 8);
    const hotelLinks = selectSectionResourceLinks(resourceLinks, "hotels", 8);
    const publicTravelHotelCards = buildStructuredHotelCards(effectivePublicSections?.travel?.items);
    const publicTravelFallbackLinks = uniqueLinks(
      [
        ...hotelLinks,
        safeString(effectivePublicSections?.travel?.fallbackLink)
          ? { label: "Hotels & Travel", url: safeString(effectivePublicSections?.travel?.fallbackLink) }
          : null,
      ].filter(Boolean),
      8
    );
    const publicTravelBody = sanitizeLinkedCopy(
      effectivePublicSections?.travel?.body,
      publicTravelFallbackLinks
    );
    const publicTravelBlocks = buildPublicSectionBlocks({
      ...effectivePublicSections?.travel,
      body:
        isLowSignalTravelSummaryText(publicTravelBody) ||
        isRedundantLinkSummaryText(publicTravelBody, publicTravelFallbackLinks)
        ? ""
        : publicTravelBody,
    });
    const parkingLinks = selectSectionResourceLinks(resourceLinks, "traffic_parking", 8);
    const documentLinks = effectivePublicSections?.documents?.visibility === "visible"
      ? uniqueLinks(effectivePublicSections.documents.links, 12)
      : [];
    const resultsBody =
      classifyPublicAudience(safeString(parseMeetDetails?.resultsInfo)) === "public_attendee"
        ? safeString(parseMeetDetails?.resultsInfo)
        : "";
    const announcementCards = uniqueBy(
      [
        ...(Array.isArray(parseCommunications?.announcements) ? parseCommunications.announcements : []),
        ...(Array.isArray(advancedSections?.announcements?.announcements)
          ? advancedSections.announcements.announcements
          : []),
      ]
        .filter((item: any) => shouldRenderPublicAnnouncementCard(item))
        .map((item: any, index: number) => ({
          key: `announcement-${index + 1}`,
          label: safeString(item?.title),
          body: safeString(item?.body || item?.text || item?.message || item?.title),
        }))
        .filter((item) => item.body),
      (item) => `${item.label}|${item.body}`
    );

    const sections: GymMeetDiscoverySection[] = [
      {
        id: "meet-details",
        label: "Meet Details",
        kind: "meet_overview",
        priority: 10,
        hasContent:
          safeString(effectivePublicSections?.meetDetails?.visibility) === "visible" &&
          Boolean(safeString(effectivePublicSections?.meetDetails?.body)),
        blocks: buildPublicSectionBlocks(effectivePublicSections?.meetDetails),
      },
      {
        id: "admission",
        label: "Admission",
        kind: "admission",
        priority: 20,
        hasContent:
          admissionCardsNormalized.length > 0 ||
          (safeString(effectivePublicSections?.spectatorInfo?.visibility) === "visible" &&
            Boolean(spectatorBody)),
        blocks: [
          ...(admissionCardsNormalized.length > 0
            ? [
                {
                  id: "admission-cards",
                  type: "card-grid" as const,
                  columns: 3 as const,
                  cards: admissionCardsNormalized,
                },
              ]
            : []),
          ...buildPublicSectionBlocks({
            ...effectivePublicSections?.spectatorInfo,
            body: spectatorBody,
          }),
        ],
      },
      {
        id: "venue-details",
        label: "Venue Details",
        kind: "venue",
        priority: 30,
        hasContent:
          (safeString(sanitizedVenueSection?.visibility) === "visible" &&
            Boolean(safeString(sanitizedVenueSection?.body))) ||
          Boolean(facilityMapAddress),
        blocks: [
          ...buildPublicSectionBlocks(sanitizedVenueSection),
          ...(facilityMapAddress
            ? [
                {
                  id: "venue-map",
                  type: "map" as const,
                  title: "Arrival Map",
                  address: facilityMapAddress,
                },
              ]
            : []),
        ],
      },
      {
        id: "traffic-parking",
        label: "Traffic & Parking",
        kind: "traffic_parking",
        priority: 40,
        hasContent:
          (safeString(effectivePublicSections?.parking?.visibility) === "visible" &&
            Boolean(safeString(effectivePublicSections?.parking?.body))) ||
          (safeString(effectivePublicSections?.traffic?.visibility) === "visible" &&
            Boolean(safeString(effectivePublicSections?.traffic?.body))) ||
          parkingLinks.length > 0,
        blocks: [
          ...buildPublicSectionBlocks(effectivePublicSections?.parking),
          ...buildPublicSectionBlocks(effectivePublicSections?.traffic),
          ...(parkingLinks.length > 0
            ? [
                {
                  id: "parking-links",
                  type: "link-list" as const,
                  title: "Parking Links",
                  links: parkingLinks,
                },
              ]
            : []),
        ],
      },
      {
        id: "hotels",
        label: "Hotels & Travel",
        kind: "hotels",
        priority: 50,
        hasContent:
          (safeString(effectivePublicSections?.travel?.visibility) === "visible" &&
            (Boolean(safeString(effectivePublicSections?.travel?.body)) ||
              publicTravelHotelCards.length > 0)) ||
          publicTravelFallbackLinks.length > 0,
        blocks: [
          ...(publicTravelHotelCards.length > 0
            ? [
                {
                  id: "hotel-cards",
                  type: "card-grid" as const,
                  columns: 2 as const,
                  cards: publicTravelHotelCards,
                },
              ]
            : []),
          ...publicTravelBlocks,
          ...(publicTravelFallbackLinks.length > 0
            ? [
                {
                  id: "hotel-links",
                  type: "link-list" as const,
                  title: "Hotel & Travel Links",
                  links: publicTravelFallbackLinks,
                },
              ]
            : []),
        ],
      },
      {
        id: "results",
        label: "Results",
        kind: "results",
        priority: 60,
        hasContent: resultLinks.length > 0 || Boolean(resultsBody),
        blocks: [
          ...(resultsBody
            ? [
                {
                  id: "results-info",
                  type: "text" as const,
                  text: resultsBody,
                },
              ]
            : []),
          ...(resultLinks.length > 0
            ? [
                {
                  id: "results-links",
                  type: "link-list" as const,
                  title: "Results & Links",
                  links: resultLinks,
                },
              ]
            : []),
        ],
      },
      {
        id: "documents",
        label: "Documents",
        kind: "documents",
        priority: 70,
        hasContent:
          safeString(effectivePublicSections?.documents?.visibility) === "visible" &&
          documentLinks.length > 0,
        blocks:
          documentLinks.length > 0
            ? [
                {
                  id: "document-links",
                  type: "link-list" as const,
                  title: "Official Resources",
                  links: documentLinks,
                },
              ]
            : [],
      },
      {
        id: "announcements",
        label: "Announcements",
        kind: "announcements",
        priority: 80,
        hasContent: announcementCards.length > 0,
        blocks:
          announcementCards.length > 0
            ? [
                {
                  id: "announcement-cards",
                  type: "card-grid" as const,
                  columns: 2 as const,
                  cards: announcementCards,
                },
              ]
            : [],
      },
    ].filter((section) => section.hasContent);

    return { sections };
  }

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
  ).filter((line) => /(door fees?|weekend passes?)/i.test(line) || classifyOperationalLine(line) === "admission");
  const sourceAdmissionFactLines = uniqueTextLines(
    sourceLines.filter((line) => {
      const text = safeString(line);
      return (
        ADMISSION_POLICY_TEXT_PATTERN.test(text) &&
        !/(arrival guidance|registration|rotation sheets?|results?)/i.test(text)
      );
    }),
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
  const structuredAdmissionLinks = toResourceActions("admission");
  const structuredResultsLinks = toResourceActions("results_live", "results_hub", "results_pdf");
  const structuredDocumentLinks = toResourceActions(
    "packet",
    "roster",
    "team_divisions",
    "rotation_sheet",
    "photo_video",
    "apparel_form"
  );
  const structuredHotelLinks = toResourceActions("travel_accommodation", "hotel_booking");

  const resultsLinks = uniqueTextLines(
    (
      structuredResultsLinks.length > 0
        ? pickStructuredResourceLinks("results_live", "results_hub", "results_pdf").map(
            (item) => item.url
          )
        : normalizedLinks
            .filter((item) =>
              /(result|score|meetscoresonline|lightningcity|usacompetitions)/i.test(
                `${item.label} ${item.url}`
              )
            )
            .map((item) => item.url)
    ),
    3
  );
  const announcementBody = safeString(firstAnnouncement?.body);
  const merchandiseText = /(merch|shop|store|vendor|apparel|souvenir|leotard)/i.test(
    announcementBody
  )
    ? announcementBody
    : sourceMerchandiseLine;
  const parsedUnmappedFacts = Array.isArray(parseResult?.unmappedFacts) ? parseResult.unmappedFacts : [];
  const parsedVenueDetailLines = uniqueTextLines(
    parsedUnmappedFacts
      .filter((fact: any) => !shouldSuppressUnmappedFact(fact))
      .filter((fact: any) => /\bvenue(?:[_\s-]?detail|[_\s-]?contact)?\b/i.test(safeString(fact?.category)))
      .map((fact: any) => safeString(fact?.detail)),
    8
  );
  const parsedMeetDetailLines = uniqueTextLines(
    parsedUnmappedFacts
      .filter((fact: any) => !shouldSuppressUnmappedFact(fact))
      .filter((fact: any) => /\bmeet[_\s-]?detail\b/i.test(safeString(fact?.category)))
      .map((fact: any) => safeString(fact?.detail)),
    8
  );
  const normalizedOperationalNotes = uniqueTextLines(
    [
      ...(Array.isArray(meetSection?.operationalNotes) ? meetSection.operationalNotes : []),
      ...(Array.isArray(parseMeetDetails?.operationalNotes) ? parseMeetDetails.operationalNotes : []),
    ],
    12
  );
  const resultsInfoTextRaw =
    safeString(meetSection?.resultsInfo || parseMeetDetails?.resultsInfo) ||
    sourceResultsText ||
    (/(official results|live scoring|meetscoresonline|usacompetitions)/i.test(announcementBody)
      ? announcementBody
      : "");

  const stripKnownLabelPrefix = (value: string, labelPattern: RegExp) =>
    safeString(value).replace(labelPattern, "").trim();
  const extractLabeledDetailLine = (text: string, pattern: RegExp) => {
    const lines = safeString(text)
      .split(/\n+/)
      .map((line) => line.replace(/^[-\u2022]\s*/, "").trim())
      .filter(Boolean);
    for (const line of lines) {
      const match = line.match(pattern);
      if (match?.[1]) return safeString(match[1]);
    }
    return "";
  };
  const spectatorLogisticsItems = [
    {
      key: "doors-open",
      label: "Doors Open",
      value:
        safeString(parseMeetDetails?.doorsOpen) ||
        stripKnownLabelPrefix(sourceDoorsOpenLine, /^doors\s+open:\s*/i) ||
        extractLabeledDetailLine(normalizedDetailsText, /^doors\s*open:\s*(.+)$/i),
    },
    {
      key: "arrival-guidance",
      label: "Arrival Guidance",
      value:
        safeString(parseMeetDetails?.arrivalGuidance) ||
        stripKnownLabelPrefix(sourceArrivalGuidanceLine, /^arrival guidance:\s*/i) ||
        extractLabeledDetailLine(normalizedDetailsText, /^arrival\s*guidance:\s*(.+)$/i),
    },
    {
      key: "registration",
      label: "Registration",
      value:
        safeString(parseMeetDetails?.registrationInfo) ||
        stripKnownLabelPrefix(sourceRegistrationLine, /^registration:\s*/i) ||
        extractLabeledDetailLine(normalizedDetailsText, /^registration:\s*(.+)$/i),
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
    ...sourceLines.filter((line) => isNarrativeMeetPacketLine(line)),
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
    /(east hall|west hall|central hall|north hall|south hall|registration|guest services|entrance|coffee bar|competition area|awards area|gym\s*[a-z0-9]{1,2}|2nd floor|second floor|3rd floor|third floor|check-?in|freight door|right door|meet site|phone numbers?|ph:\s*\d|temperature inside the venue|inside the venue is chilly|please come prepared|beyond our control|coral springs gymnasium)/i.test(
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
  const isPaymentLine = (line: string) =>
    /^(payment|payment instructions?:|checks?\s+payable|check:\s*make payable|make payable to|payable to)/i.test(
      safeString(line)
    );
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
  const isTabularScheduleNoiseLine = (line: string) => {
    const text = safeString(line);
    if (!text) return false;
    if (!/\t/.test(text) && !/\s{2,}/.test(text)) return false;
    if (/^(?:gym\s+[a-z0-9]+|session\s+[a-z0-9]+|levels?\b)/i.test(text)) return true;
    return (
      (text.match(/\b\d{1,2}:\d{2}\s*[AP]M\b/gi) || []).length >= 2 ||
      /\b[a-z]{1,3}\d{1,2}\b/i.test(text)
    );
  };
  const isMeetDetailsExcludedLine = (line: string) =>
    isMeetDateLine(line) ||
    isAdmissionLine(line) ||
    isPaymentLine(line) ||
    isSpectatorLogisticsLine(line) ||
    isHydrationLine(line) ||
    isMerchandiseLine(line) ||
    isResultsLine(line) ||
    isDaylightLine(line) ||
    isSafetyObjectsLine(line) ||
    isMarketingLikeSourceLine(line) ||
    isTabularScheduleNoiseLine(line) ||
    (!isNarrativeMeetPacketLine(line) && isScheduleGridLikeSourceLine(line)) ||
    isClubParticipationLikeSourceLine(line);
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
      ...reroutedAdmissionMeetLines,
      ...parsedMeetDetailLines,
      ...normalizedOperationalNotes,
    ],
    12
  ).filter((line) => line.length > 10);
  const descriptionLines = uniqueTextLines(
    normalizedDetailsText
      .split(/\n+/)
      .map((line) => line.replace(/^[-\u2022]\s*/, "").trim())
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
      ...parsedVenueDetailLines,
      ...normalizedOperationalNotes,
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
  const facilityLinesFromSource = sanitizeVenueFactLines(
    sourceLines.filter((line) => !rideSharePattern.test(line)),
    {
      mode: "strict",
      maxLines: 10,
      requireAnchor: true,
      excludePatterns: venueExcludePatterns,
    }
  );
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
  const isVenueOnlyDisplayLine = (line: string) => {
    const text = safeString(line);
    if (!text) return false;
    if (
      isMarketingLikeSourceLine(text) ||
      isScheduleGridLikeSourceLine(text) ||
      isClubParticipationLikeSourceLine(text) ||
      isParticipantListingLine(text) ||
      VENUE_ONLY_EXCLUDE_PATTERN.test(text)
    ) {
      return false;
    }
    return VENUE_ONLY_INCLUDE_PATTERN.test(text);
  };

  const venueListLinesRaw = uniqueTextLines(
    [
      ...(venueParagraphSentences.length > 0 ? venueParagraphSentences : []),
      ...facilityLines,
      ...parsedVenueDetailLines,
    ],
    14
  );
  const venueListLines = uniqueTextLines(
    venueListLinesRaw.filter((line) => isSentenceLikeVenueLine(line) && isVenueOnlyDisplayLine(line)),
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
    isVenueOnlyDisplayLine(registrationDeskNote) &&
    !venueDetailContains(registrationDeskNote);
  const showAwardsAreaNote =
    Boolean(awardsAreaNote) &&
    isSentenceLikeVenueLine(awardsAreaNote) &&
    isVenueOnlyDisplayLine(awardsAreaNote) &&
    !venueDetailContains(awardsAreaNote);

  const sourcePolicyLine = (pattern: RegExp) =>
    sourceLines.find((line) => pattern.test(line)) || "";
  const policyNotes = [
    safeString(logistics?.policyFood || parseResult?.policies?.food) ||
      safeString(logistics?.mealPlan || parseLogistics?.meals) ||
      sourcePolicyLine(/(food|beverage|coffee|starbucks|kahwa|outside food)/i),
    safeString(logistics?.policyHydration || parseResult?.policies?.hydration) ||
      sourceHydrationLine ||
      (safeString(parseResult?.athlete?.stretchTime)
        ? `Athlete stretch begins at ${parseResult.athlete.stretchTime}. Bring water and arrive prepared.`
        : ""),
    safeString(logistics?.policyAnimals || parseResult?.policies?.animals) ||
      safeString(logistics?.waivers || parseLogistics?.waivers) ||
      sourcePolicyLine(/(service animal|service dog|certified service)/i),
    safeString(logistics?.policySafety || parseResult?.policies?.safety) ||
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
      .map((item: any) => normalizeRotationSheetsLink(item))
      .map((item: any) => ({
        label: safeString(item?.label || "Coach link"),
        url: safeString(item?.url),
      }))
      .filter((item) => /^https?:\/\//i.test(item.url))
      .filter((item, idx, arr) => {
        const key = normalizeCompareText(item.url);
        return arr.findIndex((candidate) => normalizeCompareText(candidate.url) === key) === idx;
      });
  const publicMeetContacts = ([
    ...((Array.isArray(meetSection?.staffContacts) ? meetSection.staffContacts : []) as any[]),
    ...((Array.isArray(parseResult?.contacts) ? parseResult.contacts : []).filter((item: any) =>
      classifyParsedContactRole(item) === "public"
    ) as any[]),
  ] as any[])
    .map((item: any) => sanitizeContactRecord(item, "Meet staff"))
    .filter(Boolean)
    .filter((item, idx, arr) => {
      const key = normalizeCompareText(
        `${safeString(item?.role)}|${safeString(item?.name)}|${safeString(item?.email)}|${safeString(item?.phone)}`
      );
      return (
        arr.findIndex((candidate) => {
          const candidateKey = normalizeCompareText(
            `${safeString(candidate?.role)}|${safeString(candidate?.name)}|${safeString(
              candidate?.email
            )}|${safeString(candidate?.phone)}`
          );
          return candidateKey === key;
        }) === idx
      );
    });
  const venueContacts = ([
    ...((Array.isArray(logistics?.venueContacts) ? logistics.venueContacts : []) as any[]),
    ...((Array.isArray(parseResult?.contacts) ? parseResult.contacts : []).filter((item: any) =>
      classifyParsedContactRole(item) === "venue"
    ) as any[]),
  ] as any[])
    .map((item: any) => sanitizeContactRecord(item, "Venue contact"))
    .filter(Boolean)
    .filter((item, idx, arr) => {
      const key = normalizeCompareText(
        `${safeString(item?.role)}|${safeString(item?.name)}|${safeString(item?.email)}|${safeString(item?.phone)}`
      );
      return (
        arr.findIndex((candidate) => {
          const candidateKey = normalizeCompareText(
            `${safeString(candidate?.role)}|${safeString(candidate?.name)}|${safeString(
              candidate?.email
            )}|${safeString(candidate?.phone)}`
          );
          return candidateKey === key;
        }) === idx
      );
    });
  const coachContacts = ([
    ...((Array.isArray(coachesSection?.contacts) ? coachesSection.contacts : []) as any[]),
    ...((Array.isArray(parseCoachInfo?.contacts) ? parseCoachInfo.contacts : []) as any[]),
    ...((Array.isArray(parseResult?.contacts) ? parseResult.contacts : []).filter((item: any) =>
      classifyParsedContactRole(item) === "coach"
    ) as any[]),
  ] as any[])
    .map((item: any) => sanitizeContactRecord(item, "Coach contact"))
    .filter(Boolean)
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
  const structuredCoachLinkUrls = new Set(
    toResourceActions("rotation_sheet", "rotation_hub", "results_live", "results_hub", "results_pdf").map(
      (item) => item.url
    )
  );
  const coachLinks = normalizeCoachLinks([
    ...((coachesSection?.links as any[]) || []),
    ...((parseCoachInfo?.links as any[]) || []),
    ...pickLinks(
      /(coach|entry|payment|refund|qualification|regional|rotation|meet maker|reservation)/i,
      /(parking|traffic|parkmobile|garage|rate|wayfinding)/i,
      8
    ),
  ]).filter(
    (item) =>
      !hasStructuredResources ||
      !/(rotation|score|result)/i.test(`${item.label} ${item.url}`) ||
      structuredCoachLinkUrls.has(item.url)
  );
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
  const meetDetailsInlineBase = meetDetailsLines.map(extractInlineUrl);
  const venueDetailsInlineBase = venueListLines.map(extractInlineUrl);
  const venueContactNotes = uniqueTextLines(
    [
      ...((Array.isArray(logistics?.venueContactNotes) ? logistics.venueContactNotes : []) as string[]),
      ...(parsedUnmappedFacts as any[])
        .filter((fact: any) => !shouldSuppressUnmappedFact(fact))
        .filter((fact: any) => /\bvenue_contact\b/i.test(safeString(fact?.category)))
        .map((fact: any) => safeString(fact?.detail)),
    ],
    6
  );
  const authoredAnnouncementsRaw = Array.isArray(advancedSections?.announcements?.items)
    ? advancedSections.announcements.items
    : Array.isArray(advancedSections?.announcements?.announcements)
    ? advancedSections.announcements.announcements
    : [];
  const rawAnnouncements = [
    ...normalizeAnnouncementCards(authoredAnnouncementsRaw, "builder"),
    ...normalizeAnnouncementCards(
      Array.isArray(parseCommunications?.announcements) ? parseCommunications.announcements : [],
      "parsed"
    ),
  ];

  const registrationLinks = uniqueLinks(
    [
      ...pickLinks(
        /(registration|register|meetmaker|entry|deadline|reservation|regional|coach)/i,
        /(parking|traffic|hotel|result|score|admission|ticket)/i,
        8
      ),
      ...coachLinks.filter((item) =>
        /(registration|register|meetmaker|entry|deadline|reservation|regional|coach)/i.test(
          `${safeString(item?.label)} ${safeString(item?.url)}`
        )
      ),
    ],
    8
  );
  const admissionLinks = uniqueLinks(
    structuredAdmissionLinks.length > 0
      ? [
          ...structuredAdmissionLinks,
          toAction(merchandiseLink),
        ].filter(Boolean)
      : [
          ...pickLinks(
            /(admission|ticket|purchase|buy|spectator|sales?)/i,
            /(parking|traffic|hotel|result|score|rotation|packet|faq)/i,
            8
          ),
          toAction(merchandiseLink),
        ].filter(Boolean),
    8
  );
  const inferredResultsLink = (() => {
    const inline = extractInlineUrl(resultsInfoTextRaw);
    return inline.href ? { label: "Official Results", url: inline.href } : null;
  })();
  const resultsLinkItems = uniqueLinks(
    structuredResultsLinks.length > 0
      ? structuredResultsLinks
      : [
          ...normalizedLinks.filter((item) =>
            /(result|score|live scoring|meetscoresonline|lightningcity|usacompetitions)/i.test(
              `${item.label} ${item.url}`
            )
          ),
          inferredResultsLink,
        ],
    8
  );
  const resultsLinkTargets =
    resultsLinkItems.length > 0 ? resultsLinkItems : resultsLinks.map((url) => ({ url }));
  const reroutedGearVenueLines: string[] = [];
  const reroutedGearAdmissionLines: string[] = [];
  const reroutedGearMeetLines: string[] = [];
  const pushReroutedGearLine = (bucket: string[], line: string) => {
    const text = safeString(line);
    if (!text) return;
    const key = normalizeCompareText(text);
    if (!key || bucket.some((item) => normalizeCompareText(item) === key)) return;
    bucket.push(text);
  };
  const routeRejectedGearLine = (line: string) => {
    switch (classifyOperationalLine(line)) {
      case "venue":
        pushReroutedGearLine(reroutedGearVenueLines, line);
        break;
      case "admission":
        pushReroutedGearLine(reroutedGearAdmissionLines, line);
        break;
      case "meet":
        pushReroutedGearLine(reroutedGearMeetLines, line);
        break;
      default:
        break;
    }
  };
  const gearNarrativeItems = uniqueTextLines(
    [
      safeString(gearSection?.leotardOfDay || parseGear?.uniform),
      safeString(gearSection?.hairMakeupNotes),
    ],
    4
  ).filter((line) => {
    if (isTrueGearLine(line)) return true;
    routeRejectedGearLine(line);
    return false;
  });
  const parsedAdmissionFactCards = ensureUniqueDiscoveryCardKeys(
    uniqueTextLines(
      [...(parsedUnmappedFacts as any[])]
        .filter((fact: any) => !shouldSuppressUnmappedFact(fact))
        .filter((fact: any) =>
          /(admission|ticket|pre[-\s]?sale|spectator|credit\/debit|credit card|debit card|cashless|cash is not accepted|cash not accepted|no cash)/i.test(
            `${safeString(fact?.category)} ${safeString(fact?.detail)}`
          )
        )
        .map((fact: any) => safeString(fact?.detail))
        .concat(sourceAdmissionFactLines)
        .concat(reroutedGearAdmissionLines),
      6
    ).map((detail, index) => ({
      key: `admission-detail-${index + 1}`,
      label: /(pre[-\s]?sale|ticket)/i.test(detail) ? "Spectator Pre-Sale" : "Admission Policy",
      body: sanitizeLinkedCopy(detail, admissionLinks),
    })),
    "admission-detail"
  );
  const generalAnnouncements = rawAnnouncements
    .filter((item) => shouldKeepAnnouncementCard(item))
    .filter(
      (item) =>
        item.source === "builder" ||
        !/(admission|ticket|pre[-\s]?sale|spectator|credit\/debit|credit card|debit card|cashless|cash is not accepted|cash not accepted|no cash|results|live scoring|rotation sheets?|awards|arrival guidance|registration\b|sponsor|visit lauderdale|hairstyle to impress|final posting)/i.test(
          `${item.label} ${item.body}`
        )
    )
    .map((item) => ({
      ...item,
      body: sanitizeLinkedCopy(item.body, normalizedLinks),
    }))
    .filter((item) => item.body);
  const admissionAnnouncements = rawAnnouncements
    .filter((item) => shouldKeepAnnouncementCard(item))
    .filter(
      (item) =>
        item.source !== "builder" &&
        /(admission|ticket|pre[-\s]?sale|spectator|credit\/debit|credit card|debit card|cashless|cash is not accepted|cash not accepted|no cash)/i.test(
          `${item.label} ${item.body}`
        )
    )
    .map((item) => ({
      ...item,
      body: sanitizeLinkedCopy(item.body, admissionLinks),
    }))
    .filter((item) => item.body);
  const gearChecklistItems = uniqueTextLines(
    [
      ...(Array.isArray(gearSection?.items)
        ? gearSection.items.map((item: any) => safeString(item?.name || item))
        : []),
      ...(Array.isArray(parseGear?.checklist) ? parseGear.checklist : []),
    ],
    10
  ).filter((line) => {
    if (isTrueGearLine(line)) return true;
    routeRejectedGearLine(line);
    return false;
  });
  const gearCards = [
    gearNarrativeItems.length > 0
      ? {
          key: "gear-uniform",
          label: "Gear & Uniform",
          body: gearNarrativeItems.join("\n"),
        }
      : null,
    gearChecklistItems.length > 0
      ? {
          key: "gear-checklist",
          label: "Checklist",
          items: gearChecklistItems,
        }
      : null,
  ].filter(Boolean);
  const gearLinks = uniqueLinks(
    [
      toAction(
        safeString(gearSection?.musicFileLink)
          ? { label: "Floor Music", url: gearSection.musicFileLink }
          : null
      ),
    ].filter(Boolean),
    4
  );
  const documentLinks = uniqueLinks(
    structuredDocumentLinks.length > 0 || Boolean(structuredRotationHub)
      ? [
          ...structuredDocumentLinks,
          ...(structuredRotationSheet
            ? []
            : structuredRotationHub
            ? [{ label: structuredRotationHub.label || "Rotation Sheets", url: structuredRotationHub.url }]
            : [toAction(rotationLink)]),
        ].filter(Boolean)
      : [
          ...normalizedLinks.filter((item) =>
            /(packet|schedule|info packet|faq|document|program|rotation|roster|waiver)/i.test(
              `${item.label} ${item.url}`
            )
          ),
          toAction(rotationLink),
        ].filter(Boolean),
    8
  ).filter(
    (item) =>
      !/(result|score|live scoring|admission|ticket|parking|hotel)/i.test(
        `${item.label} ${item.url}`
      )
  );
  const hotelLinks = uniqueLinks(
    structuredHotelLinks.length > 0
      ? structuredHotelLinks
      : [
          ...normalizedLinks.filter((item) =>
            /(hotel|travel|visitor|stay|lodging|book)/i.test(`${item.label} ${item.url}`)
          ),
          safeString(advancedSections?.logistics?.fallbackTravelLink)
            ? {
                label: "Hotels & Travel",
                url: safeString(advancedSections.logistics.fallbackTravelLink),
              }
            : null,
          (() => {
            const inline = extractInlineUrl(safeString(logistics?.hotelInfo || parseLogistics?.hotel));
            return inline.href ? { label: "Hotel Booking", url: inline.href } : null;
          })(),
        ],
    8
  );
  const structuredHotelCards = buildStructuredHotelCards(advancedSections?.logistics?.hotels);
  const venueLinks = uniqueLinks(
    normalizedLinks.filter((item) =>
      /(venue|facility|floor|map|hall|arena|location)/i.test(`${item.label} ${item.url}`)
    ),
    8
  ).filter(
    (item) => !/(parking|traffic|hotel|result|score|admission|ticket)/i.test(`${item.label} ${item.url}`)
  );
  const parkingLinks = uniqueLinks(
    [
      ...toResourceActions("parking"),
      ...normalizedParkingLinks,
      ...normalizedParkingPricingLinks,
      toAction(mapDashboardLink),
      toAction(ratesInfoLink),
    ].filter(Boolean),
    8
  );
  const meetOverviewCards = [
    ...spectatorLogisticsItems.map((item) => ({
      key: item.key,
      label: item.label,
      body: sanitizeLinkedCopy(item.value, normalizedLinks),
    })),
    safeString(meetSection?.scoringInfo || parseMeetDetails?.scoringInfo)
      ? {
          key: "scoring-info",
          label: "Scoring",
          body: sanitizeLinkedCopy(
            safeString(meetSection?.scoringInfo || parseMeetDetails?.scoringInfo),
            normalizedLinks
          ),
        }
      : null,
    safeString(meetSection?.rotationSheetsInfo || parseMeetDetails?.rotationSheetsInfo)
      ? {
          key: "rotation-sheets-info",
          label: "Rotation Sheets",
          body: sanitizeLinkedCopy(
            safeString(meetSection?.rotationSheetsInfo || parseMeetDetails?.rotationSheetsInfo),
            normalizedLinks
          ),
        }
      : null,
    structuredRotationHub?.status === "not_posted" && !structuredRotationSheet
      ? {
          key: "rotation-sheets-status",
          label: "Rotation Sheets",
          body: "Not yet posted.",
          action: structuredRotationHub?.url
            ? {
                label: structuredRotationHub.label || "Rotation Sheets Hub",
                url: structuredRotationHub.url,
              }
            : undefined,
        }
      : null,
    safeString(meetSection?.awardsInfo || parseMeetDetails?.awardsInfo)
      ? {
          key: "awards-info",
          label: "Awards",
          body: sanitizeLinkedCopy(
            safeString(meetSection?.awardsInfo || parseMeetDetails?.awardsInfo),
            normalizedLinks
          ),
        }
      : null,
  ].filter(Boolean);
  const meetStaffCards = publicMeetContacts.map((item, index) => ({
    key: `meet-staff-${index}`,
    label: item.role || "Meet staff",
    value: item.name,
    body: [item.email, item.phone].filter(Boolean).join(" • "),
  }));
  const registrationCards = [
    ...coachEntryFees.map((item, index) => ({
      key: `entry-fee-${index}`,
      label: item.label || "Entry fee",
      value: item.amount,
      body: item.note,
    })),
    ...coachTeamFees.map((item, index) => ({
      key: `team-fee-${index}`,
      label: item.label || "Team fee",
      value: item.amount,
      body: item.note,
    })),
    ...coachLateFees.map((item, index) => ({
      key: `late-fee-${index}`,
      label: item.label || "Late fee",
      value: item.amount,
      body: item.note,
      meta: item.trigger,
    })),
    ...coachDeadlines.map((item, index) => ({
      key: `deadline-${index}`,
      label: item.label || "Deadline",
      value: formatGymMeetDate(item.date) || item.date,
      body: item.note,
    })),
  ];
  const coachOpsCards = [
    { key: "coach-sign-in", label: "Sign-In", body: coachSignIn },
    { key: "coach-hospitality", label: "Hospitality", body: coachHospitality },
    { key: "coach-floor-access", label: "Floor Access", body: coachFloorAccess },
    { key: "coach-scratches", label: "Scratches", body: coachScratches },
    { key: "coach-floor-music", label: "Floor Music", body: coachFloorMusic },
    { key: "coach-rotation-sheets", label: "Rotation Sheets", body: coachRotationSheets },
    { key: "coach-awards", label: "Awards", body: coachAwards },
    { key: "coach-regional", label: "Regional Commitment", body: coachRegionalCommitment },
    { key: "coach-qualification", label: "Qualification", body: coachQualification },
    { key: "coach-format", label: "Meet Format", body: coachMeetFormat },
    { key: "coach-equipment", label: "Equipment", body: coachEquipment },
    { key: "coach-refund", label: "Refund Policy", body: coachRefundPolicy },
    { key: "coach-payment", label: "Payment", body: coachPaymentInstructions },
  ].filter((item) => item.body);
  const coachContactCards = coachContacts.map((item, index) => ({
    key: `contact-${index}`,
    label: item.role || "Coach contact",
    value: item.name,
    body: [item.email, item.phone].filter(Boolean).join(" • "),
  }));
  const venueContactCards = uniqueBy(
    [
      ...venueContacts.map((item, index) => ({
        key: `venue-contact-${index}`,
        label: item.role || "Venue contact",
        value: item.name,
        body: [item.email, item.phone].filter(Boolean).join(" • "),
      })),
      ...venueContactNotes.map((detail, index) => ({
        key: `venue-contact-note-${index}`,
        label: "Venue Contact",
        body: sanitizeLinkedCopy(detail, normalizedLinks),
      })),
    ].filter((item) => item.value || item.body),
    (item) => normalizeCompareText(`${safeString(item.label)}|${safeString(item.value)}|${safeString(item.body)}`)
  );
  const venueCards = [
    showRegistrationDeskNote
      ? {
          key: "registration-desk",
          label: "Registration Desk",
          body: registrationDeskNote,
        }
      : null,
    showAwardsAreaNote
      ? {
          key: "awards-area",
          label: "Awards Area",
          body: awardsAreaNote,
          items: awardsAreaItems,
        }
      : null,
    gymLayoutLabelValue
      ? {
          key: "assigned-gym",
          label: "Assigned Gym",
          value: gymLayoutLabelValue,
        }
      : null,
  ].filter(Boolean);
  const admissionCardsNormalized = mergeAdmissionVariants([
    ...admissionCards,
    ...recoveredAdmissionMatrixCards,
  ]).map((item, index) => ({
    key: item.key || `admission-${index}`,
    label: item.label,
    value: item.value,
    body: sanitizeLinkedCopy(item.body, admissionLinks),
  }));
  const reroutedGearAdmissionCards = reroutedGearAdmissionLines.map((detail, index) => ({
    key: `gear-admission-${index + 1}`,
    label: /(pre[-\s]?sale|ticket)/i.test(detail) ? "Spectator Pre-Sale" : "Admission Policy",
    body: sanitizeLinkedCopy(detail, admissionLinks),
  }));
  const admissionInfoCards = uniqueBy(
    [...admissionAnnouncements, ...parsedAdmissionFactCards, ...reroutedGearAdmissionCards].filter(
      (item) => item.body
    ),
    (item) => normalizeCompareText(`${safeString(item.label)}|${safeString(item.body)}`)
  );
  const admissionPrimaryNoteText = sanitizeLinkedCopy(admissionPrimaryNote, admissionLinks);
  const merchandiseNoteText = sanitizeLinkedCopy(merchandiseText, admissionLinks);
  const resultsInfoText = sanitizeLinkedCopy(resultsInfoTextRaw, resultsLinkTargets);
  const meetDetailsInline = uniqueBy(
    [...meetDetailsInlineBase, ...reroutedGearMeetLines.map(extractInlineUrl)],
    (item) => normalizeCompareText(`${safeString(item?.text)}|${safeString(item?.href)}`)
  );
  const venueDetailsInline = uniqueBy(
    [...venueDetailsInlineBase, ...reroutedGearVenueLines.filter(isVenueOnlyDisplayLine).map(extractInlineUrl)],
    (item) => normalizeCompareText(`${safeString(item?.text)}|${safeString(item?.href)}`)
  );
  const resultsCards = resultsInfoText
    ? [{ key: "results-info", label: "Results & Live Scoring", body: resultsInfoText }]
    : [];
  const announcementCards = generalAnnouncements;
  const communicationCards = [
    ...resultsCards,
    ...resultsLinkItems.map((item, index) => ({
      key: `results-link-${index}`,
      label: item.label || "Official Link",
      action: {
        label: item.label || "Open Link",
        url: item.url,
      },
    })),
  ];
  const parkingCard = safeString(logistics?.parking || parseLogistics?.parking)
    ? {
        key: "parking",
        label: "Parking",
        body: safeString(logistics?.parking || parseLogistics?.parking),
      }
    : null;
  const hotelInfoText = sanitizeLinkedCopy(safeString(logistics?.hotelInfo || parseLogistics?.hotel), hotelLinks);
  const hotelCards =
    hotelInfoText &&
    !isLowSignalTravelSummaryText(hotelInfoText) &&
    !isRedundantLinkSummaryText(hotelInfoText, hotelLinks)
    ? [
        {
          key: "hotel-info",
          label: "Stay / Travel Note",
          body: hotelInfoText,
        },
      ]
    : [];
  const trafficPrimaryCards = [parkingCard, ...hotelCards].filter(Boolean);
  const trafficSecondaryCards = [
    trafficText ? { key: "traffic-alert", label: "Traffic Alert", body: trafficText } : null,
    sourceDaylightLine
      ? { key: "daylight", label: "Timing Note", body: sourceDaylightLine }
      : null,
    rideShareNote ? { key: "ride-share", label: "Ride Share", body: rideShareNote } : null,
  ].filter(Boolean);
  const safetyCards = [
    policyNotes[0] ? { key: "food-beverage", label: "Food & Beverage", body: policyNotes[0] } : null,
    policyNotes[1] ? { key: "hydration", label: "Hydration", body: policyNotes[1] } : null,
    policyNotes[2] ? { key: "service-animals", label: "Service Animals", body: policyNotes[2] } : null,
    policyNotes[3] ? { key: "safety-policy", label: "Safety Policy", body: policyNotes[3] } : null,
  ].filter(Boolean);
  const scheduleSupportEmail = safeString(
    advancedSections?.schedule?.supportEmail ||
      (Array.isArray(advancedSections?.meet?.staffContacts)
        ? advancedSections.meet.staffContacts.find((item: any) => safeString(item?.email))?.email
        : "") ||
      (Array.isArray(advancedSections?.coaches?.contacts)
        ? advancedSections.coaches.contacts.find((item: any) => safeString(item?.email))?.email
        : "") ||
      (Array.isArray(advancedSections?.logistics?.venueContacts)
        ? advancedSections.logistics.venueContacts.find((item: any) => safeString(item?.email))?.email
        : "") ||
      (Array.isArray(parseResult?.contacts)
        ? parseResult.contacts.find((item: any) => safeString(item?.email))?.email
        : "")
  );
  const scheduleInfo = normalizeScheduleInfo(
    advancedSections?.schedule || parseResult?.schedule || {},
    {
      venueLabel:
        safeString(advancedSections?.schedule?.venueLabel) ||
        safeString(addressLabel || venueLabel),
      supportEmail: scheduleSupportEmail,
    }
  );
  const scheduleHasContent =
    scheduleGridsEnabled && scheduleInfo.enabled !== false && hasScheduleInfoContent(scheduleInfo);
  const sessionAssignmentCards = ensureUniqueDiscoveryCardKeys(
    scheduleInfo.assignments.map((item, index) => {
      const label = [safeString(item.level), safeString(item.groupLabel || item.divisionLabel)]
        .filter(Boolean)
        .join(" • ");
      const sessionCode = safeString(item.sessionCode);
      const body = [safeString(item.birthDateRange), safeString(item.note)]
        .filter(Boolean)
        .join("\n");
      return {
        key: safeString(item.id || `session-assignment-${index + 1}`),
        label: label || (sessionCode ? `Session ${sessionCode}` : `Assignment ${index + 1}`),
        value: sessionCode ? `Session ${sessionCode}` : "",
        body,
      };
    }),
    "session-assignment"
  );
  const sessionAssignmentNotes = uniqueTextLines(
    [
      ...sourceLines.filter((line) =>
        /(session assignments? are listed|incorrect session assignment|verify athlete|check your team rosters|official session assignment document|club roster will always be considered the official session assignment document|make sure athlete birth dates are correct|designated by her birthday|designated by their birthday)/i.test(
          line
        )
      ),
      ...(Array.isArray(scheduleInfo.notes) ? scheduleInfo.notes : []).filter((line) =>
        /(session assignments?|rosters?|birth date|official session assignment)/i.test(
          safeString(line)
        )
      ),
    ],
    8
  );
  const sessionAssignmentLinks = uniqueLinks(
    [
      ...toResourceActions("roster", "team_divisions"),
      ...documentLinks.filter((item) =>
        /(roster|session assignment|team divisions?|age groups?)/i.test(
          `${item.label} ${item.url}`
        )
      ),
    ],
    8
  );
  const visitorGuideLinks = uniqueLinks(
    normalizedLinks.filter((item) =>
      /(visitor|guide|travel|sports and events center)/i.test(`${item.label} ${item.url}`)
    ),
    6
  );
  const resourceLinksForSection = uniqueLinks(
    [
      ...documentLinks,
      ...resultsLinkItems.map((item) => ({
        label: item.label || "Results",
        url: item.url,
      })),
      ...admissionLinks,
      ...hotelLinks,
      ...visitorGuideLinks,
    ],
    16
  );
  const hasOperationalResourceLinks = resourceLinksForSection.some((item) =>
    /(result|score|rotation|roster|hotel|travel|visitor|ticket|admission)/i.test(
      `${item.label} ${item.url}`
    )
  );
  const documentSectionLabel =
    hasOperationalResourceLinks
      ? "Resources"
      : /faq/i.test(documentLinks.map((item) => item.label).join(" "))
      ? "FAQ"
      : "Documents";

  const sections: GymMeetDiscoverySection[] = [
    {
      id: "meet-details",
      label: "Meet Details",
      kind: "meet_overview",
      priority: 10,
      hasContent:
        meetOverviewCards.length > 0 ||
        meetDetailsInline.length > 0 ||
        meetStaffCards.length > 0 ||
        announcementCards.length > 0 ||
        gearCards.length > 0 ||
        gearLinks.length > 0,
      blocks: [
        ...(meetOverviewCards.length > 0
          ? [
              {
                id: "meet-overview-cards",
                type: "card-grid" as const,
                columns: 2 as const,
                cards: meetOverviewCards,
              },
            ]
          : []),
        ...(meetDetailsInline.length > 0
          ? [
              {
                id: "meet-lines",
                type: "line-list" as const,
                lines: meetDetailsInline,
              },
            ]
          : []),
        ...(meetStaffCards.length > 0
          ? [
              {
                id: "meet-staff",
                type: "card-grid" as const,
                title: "Meet Staff",
                columns: 3 as const,
                cards: meetStaffCards,
              },
            ]
          : []),
        ...(announcementCards.length > 0
          ? [
              {
                id: "announcements",
                type: "card-grid" as const,
                title: "Announcements",
                columns: 2 as const,
                cards: announcementCards,
              },
            ]
          : []),
        ...(gearCards.length > 0
          ? [
              {
                id: "gear",
                type: "card-grid" as const,
                title: "Gear & Uniform",
                columns: 2 as const,
                cards: gearCards,
              },
            ]
          : []),
        ...(gearLinks.length > 0
          ? [
              {
                id: "gear-links",
                type: "link-list" as const,
                title: "Meet Files",
                links: gearLinks,
              },
            ]
          : []),
      ],
    },
    {
      id: "schedule",
      label: "Schedule",
      kind: "schedule",
      priority: 20,
      hasContent: scheduleHasContent,
      hideSectionHeading: true,
      blocks: scheduleHasContent
        ? [
            {
              id: "schedule-board",
              type: "schedule-board" as const,
              data: scheduleInfo,
            },
          ]
        : [],
    },
    {
      id: "session-assignments",
      label: "Session Assignments",
      kind: "session_assignments",
      priority: 25,
      preserveStandalone:
        scheduleGridsEnabled &&
        (sessionAssignmentCards.length > 0 || sessionAssignmentLinks.length > 0),
      hasContent:
        scheduleGridsEnabled &&
        (sessionAssignmentCards.length > 0 ||
          sessionAssignmentNotes.length > 0 ||
          sessionAssignmentLinks.length > 0),
      blocks: [
        ...(sessionAssignmentCards.length > 0
          ? [
              {
                id: "session-assignment-cards",
                type: "card-grid" as const,
                columns: 3 as const,
                cards: sessionAssignmentCards,
              },
            ]
          : []),
        ...(sessionAssignmentNotes.length > 0
          ? [
              {
                id: "session-assignment-notes",
                type: "line-list" as const,
                title: "Roster & Verification Notes",
                lines: sessionAssignmentNotes.map((line) => ({ text: line })),
              },
            ]
          : []),
        ...(sessionAssignmentLinks.length > 0
          ? [
              {
                id: "session-assignment-links",
                type: "link-list" as const,
                title: "Session Resources",
                links: sessionAssignmentLinks,
              },
            ]
          : []),
      ],
    },
    {
      id: "admission",
      label: "Admission",
      kind: "admission",
      priority: 30,
      hasContent:
        admissionCardsNormalized.length > 0 ||
        admissionInfoCards.length > 0 ||
        Boolean(admissionPrimaryNoteText) ||
        admissionLinks.length > 0 ||
        Boolean(merchandiseNoteText),
      blocks: [
        ...(admissionCardsNormalized.length > 0
          ? [
              {
                id: "admission-cards",
                type: "card-grid" as const,
                columns: 4 as const,
                cards: admissionCardsNormalized,
              },
            ]
          : []),
        ...(admissionInfoCards.length > 0
          ? [
              {
                id: "admission-announcements",
                type: "card-grid" as const,
                title: "Admission & Fees",
                columns: 2 as const,
                cards: admissionInfoCards,
              },
            ]
          : []),
        ...(admissionPrimaryNoteText
          ? [
              {
                id: "admission-note",
                type: "text" as const,
                title: "Admission Note",
                text: admissionPrimaryNoteText,
              },
            ]
          : []),
        ...(merchandiseNoteText
          ? [
              {
                id: "merchandise",
                type: "text" as const,
                title: "Merchandise",
                text: merchandiseNoteText,
              },
            ]
          : []),
        ...(admissionLinks.length > 0
          ? [
              {
                id: "admission-links",
                type: "link-list" as const,
                title: "Tickets & Sales",
                links: admissionLinks,
              },
            ]
          : []),
      ],
    },
    {
      id: "coaches",
      label: "Coaches",
      kind: "coaches",
      priority: 40,
      hasContent: coachesHasContent,
      blocks: [
        ...(coachOpsCards.length > 0
          ? [
              {
                id: "coach-ops",
                type: "card-grid" as const,
                columns: 2 as const,
                cards: coachOpsCards,
              },
            ]
          : []),
        ...(registrationCards.length > 0
          ? [
              {
                id: "registration-cards",
                type: "card-grid" as const,
                title: "Entries & Deadlines",
                columns: 3 as const,
                cards: registrationCards,
              },
            ]
          : []),
        ...(registrationLinks.length > 0
          ? [
              {
                id: "registration-links",
                type: "link-list" as const,
                title: "Coach Registration Links",
                links: registrationLinks,
              },
            ]
          : []),
        ...(coachContactCards.length > 0
          ? [
              {
                id: "coach-contacts",
                type: "card-grid" as const,
                title: "Contacts",
                columns: 3 as const,
                cards: coachContactCards,
              },
            ]
          : []),
        ...(coachAttire.length > 0
          ? [
              {
                id: "coach-attire",
                type: "card-grid" as const,
                title: "Coach Attire",
                columns: 2 as const,
                cards: coachAttire.map((item, index) => ({
                  key: `attire-${index}`,
                  body: item,
                })),
              },
            ]
          : []),
        ...(coachNotes.length > 0
          ? [
              {
                id: "coach-notes",
                type: "card-grid" as const,
                title: "Additional Coach Notes",
                columns: 2 as const,
                cards: coachNotes.map((item, index) => ({
                  key: `note-${index}`,
                  body: item,
                })),
              },
            ]
          : []),
        ...(coachLinks.length > 0
          ? [
              {
                id: "coach-links",
                type: "link-list" as const,
                title: "Coach Links",
                links: coachLinks,
              },
            ]
          : []),
      ],
    },
    {
      id: "venue-details",
      label: "Venue Details",
      kind: "venue",
      priority: 50,
      hasContent:
        venueDetailsInline.length > 0 ||
        venueCards.length > 0 ||
        venueContactCards.length > 0 ||
        venueLinks.length > 0 ||
        Boolean(gymLayoutImageUrl) ||
        Boolean(facilityMapAddress && (gymLayoutImageUrl || gymLayoutLabelValue)),
      blocks: [
        ...(venueDetailsInline.length > 0
          ? [
              {
                id: "venue-lines",
                type: "line-list" as const,
                lines: venueDetailsInline,
              },
            ]
          : []),
        ...(venueCards.length > 0
          ? [
              {
                id: "venue-cards",
                type: "card-grid" as const,
                columns: 2 as const,
                cards: venueCards,
              },
            ]
          : []),
        ...(venueContactCards.length > 0
          ? [
              {
                id: "venue-contacts",
                type: "card-grid" as const,
                title: "Venue Contact",
                columns: 2 as const,
                cards: venueContactCards,
              },
            ]
          : []),
        ...(venueLinks.length > 0
          ? [
              {
                id: "venue-links",
                type: "link-list" as const,
                title: "Venue Links",
                links: venueLinks,
              },
            ]
          : []),
        ...(gymLayoutImageUrl
          ? [
              {
                id: "gym-layout-image",
                type: "image" as const,
                title: "Venue Map",
                imageUrl: gymLayoutImageUrl,
                alt: "Gym layout",
              },
            ]
          : []),
      ],
    },
    {
      id: "traffic-parking",
      label: "Traffic & Parking",
      kind: "traffic_parking",
      priority: 60,
      hasContent:
        trafficPrimaryCards.length > 0 ||
        trafficSecondaryCards.length > 0 ||
        parkingLinks.length > 0 ||
        trafficSlots.length > 0 ||
        Boolean(facilityMapAddress),
      blocks: [
        ...(trafficPrimaryCards.length > 0
          ? [
              {
                id: "traffic-primary-cards",
                type: "card-grid" as const,
                columns: 2 as const,
                cards: trafficPrimaryCards,
              },
            ]
          : []),
        ...(trafficSecondaryCards.length > 0 || trafficSlots.length > 0
          ? [
              {
                id: "traffic-cards",
                type: "card-grid" as const,
                columns: 2 as const,
                cards: [
                  ...trafficSecondaryCards,
                  ...trafficSlots.map((slot, index) => ({
                    key: `traffic-slot-${index}`,
                    label: slot.date,
                    body: slot.times,
                  })),
                ],
              },
            ]
          : []),
        ...(parkingLinks.length > 0
          ? [
              {
                id: "parking-links",
                type: "link-list" as const,
                title: "Parking Links",
                links: parkingLinks,
              },
            ]
          : []),
        ...(facilityMapAddress
          ? [
              {
                id: "parking-map",
                type: "map" as const,
                title: "Arrival Map",
                address: facilityMapAddress,
              },
            ]
          : []),
      ],
    },
    {
      id: "hotels",
      label: "Hotels & Travel",
      kind: "hotels",
      priority: 70,
      preserveStandalone:
        structuredHotelCards.length > 0 ||
        hotelCards.length > 0 ||
        structuredHotelLinks.length > 0 ||
        Boolean(safeString(logistics?.hotelInfo)),
      hasContent: hotelLinks.length > 0 || hotelCards.length > 0 || structuredHotelCards.length > 0,
      blocks: [
        ...(structuredHotelCards.length > 0
          ? [
              {
                id: "hotel-cards",
                type: "card-grid" as const,
                columns: 2 as const,
                cards: structuredHotelCards,
              },
            ]
          : []),
        ...(hotelCards.length > 0
          ? [
              {
                id: "hotel-note-cards",
                type: "card-grid" as const,
                columns: 1 as const,
                cards: hotelCards,
              },
            ]
          : []),
        ...(hotelLinks.length > 0
          ? [
              {
                id: "hotel-links",
                type: "link-list" as const,
                title: "Hotel & Travel Links",
                links: hotelLinks,
              },
            ]
          : []),
      ],
    },
    {
      id: "results",
      label: "Results",
      kind: "results",
      priority: 80,
      preserveStandalone: communicationCards.length > 0,
      hasContent: communicationCards.length > 0,
      blocks:
        communicationCards.length > 0
          ? [
              {
                id: "results-cards",
                type: "card-grid" as const,
                title: "Results & Links",
                columns: 2 as const,
                cards: communicationCards,
              },
            ]
          : [],
    },
    {
      id: "safety-policy",
      label: "Safety Policy",
      kind: "safety",
      priority: 90,
      hasContent: safetyCards.length > 0,
      blocks: [
        ...(safetyCards.length > 0
          ? [
              {
                id: "safety-cards",
                type: "card-grid" as const,
                columns: 2 as const,
                cards: safetyCards,
              },
            ]
          : []),
      ],
    },
    {
      id: "documents",
      label: documentSectionLabel,
      kind: "documents",
      priority: 100,
      preserveStandalone: hasOperationalResourceLinks,
      hasContent: resourceLinksForSection.length > 0,
      blocks: [
        ...(resourceLinksForSection.length > 0
          ? [
              {
                id: "document-links",
                type: "link-list" as const,
                title:
                  documentSectionLabel === "Resources"
                    ? "Official Resources"
                    : "Supporting Documents",
                links: resourceLinksForSection,
              },
            ]
          : []),
      ],
    },
  ]
    .filter((section) => !["schedule", "session-assignments", "coaches"].includes(section.id))
    .filter((section) => section.hasContent);

  return {
    sections: mergeSparseDiscoverySections(sections),
  };
}
