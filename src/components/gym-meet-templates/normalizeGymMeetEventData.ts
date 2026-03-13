/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-explicit-any */
// @ts-nocheck
import { resolveGymMeetTemplateId } from "./registry";
import { GymMeetRenderModel } from "./types";
import { buildGymMeetDiscoveryContent } from "./buildGymMeetDiscoveryContent";
import { normalizeGymMeetTitleSize } from "./titleSizing";
import {
  collapseRepeatedDisplayText,
  formatGymMeetTime,
} from "./displayText";

const safeString = (value: unknown): string =>
  typeof value === "string"
    ? value.trim()
    : value == null
    ? ""
    : String(value).trim();

const DISPLAY_HOST_GYM_PACKET_TEXT_PATTERN =
  /\b(?:please review|following items enclosed|this packet|info packet|competition to follow|recognized at|award ceremony)\b/i;
const DISPLAY_HOST_GYM_EVENT_TITLE_PATTERN =
  /\b(?:state championships?|regional championships?|national championships?|session\s+[A-Z]{2}\d+|schedule|info packet|meet packet)\b/i;

const sanitizeDisplayHostGym = (value: unknown): string => {
  let text = safeString(value).replace(/\s+/g, " ").trim();
  if (!text) return "";

  const hostedByMatch = text.match(/^(?:host(?:ed)?\s+by[:\s-]*)(.+)$/i);
  if (hostedByMatch?.[1]) {
    text = hostedByMatch[1].replace(/\s+/g, " ").trim();
  }

  const proudHostMatch = text.match(/^(.+?)\s+is proud to host\b/i);
  if (proudHostMatch?.[1]) {
    text = proudHostMatch[1].replace(/\s+/g, " ").trim();
  }

  text = text.replace(/^host(?:ed)?\s+by[:\s-]*/i, "").replace(/[,:;.\-]+$/g, "").trim();
  if (!text) return "";
  if (DISPLAY_HOST_GYM_PACKET_TEXT_PATTERN.test(text)) return "";
  if (DISPLAY_HOST_GYM_EVENT_TITLE_PATTERN.test(text)) return "";
  if (/^(?:team award eligible|award category)\b/i.test(text)) return "";
  if (text.length > 96) return "";
  if (/[.!?]/.test(text) && text.split(/\s+/).length > 8) return "";
  return text;
};

const isQuickLinkUrl = (value: unknown): boolean => {
  const text = safeString(value);
  return (
    /^https?:\/\//i.test(text) ||
    /^data:(application\/pdf|image\/(?:png|jpe?g|webp))/i.test(text)
  );
};

const normalizeAnnouncementTitle = (value: unknown): string => {
  const title = safeString(value);
  if (!title) return "";
  return /^announcement$/i.test(title) ? "" : title;
};

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const stripRepeatedTitleFromBody = (body: string, title: string): string => {
  const normalizedBody = safeString(body);
  const normalizedTitle = safeString(title).replace(/[:\-–—]+\s*$/g, "").trim();
  if (!normalizedBody || !normalizedTitle) return normalizedBody;

  const leadingTitlePattern = new RegExp(
    `^${escapeRegExp(normalizedTitle)}(?:[:\\-–—]\\s*|\\s+)+`,
    "i"
  );

  let nextBody = normalizedBody;
  while (leadingTitlePattern.test(nextBody)) {
    nextBody = nextBody.replace(leadingTitlePattern, "").trim();
  }
  return nextBody || normalizedBody;
};

const inferAnnouncementFromBody = (body: string): { title: string; body: string } => {
  const normalizedBody = safeString(body).replace(/\s+/g, " ").trim();
  if (!normalizedBody) return { title: "", body: "" };

  const words = normalizedBody.split(" ");
  const maxTitleWords = Math.min(6, Math.max(words.length - 1, 0));

  for (let count = maxTitleWords; count >= 2; count -= 1) {
    const titleCandidate = words.slice(0, count).join(" ");
    const remainder = words.slice(count).join(" ");
    if (
      remainder &&
      remainder.toLowerCase().startsWith(`${titleCandidate.toLowerCase()} `)
    ) {
      const dedupedBody = stripRepeatedTitleFromBody(normalizedBody, titleCandidate);
      if (dedupedBody && dedupedBody.length >= 16) {
        return { title: titleCandidate, body: dedupedBody };
      }
    }
  }

  const bodyStartWords = new Set([
    "upon",
    "all",
    "if",
    "when",
    "where",
    "please",
    "coaches",
    "parents",
    "spectators",
    "athletes",
    "results",
    "live",
    "doors",
    "registration",
    "arrival",
    "parking",
    "competition",
  ]);
  const bodyStartVerbs = new Set(["will", "are", "is", "must", "may", "can", "should"]);

  for (let index = 2; index < Math.min(words.length, 7); index += 1) {
    const token = words[index]?.replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9]+$/g, "") || "";
    const lower = token.toLowerCase();
    if (!token) continue;
    if (!bodyStartWords.has(lower) && !bodyStartVerbs.has(lower)) continue;

    const titleCandidate = words.slice(0, index).join(" ").trim();
    const bodyCandidate = words.slice(index).join(" ").trim();
    if (!titleCandidate || !bodyCandidate) continue;
    if (titleCandidate.length > 64 || bodyCandidate.length < 16) continue;
    return { title: titleCandidate, body: bodyCandidate };
  }

  return { title: "", body: normalizedBody };
};

const normalizeAnnouncementEntry = (
  item: any,
  fallbackId: string
): { id: string; title: string; body: string; date: string } => {
  const initialTitle = normalizeAnnouncementTitle(item?.title || item?.label);
  const rawBody = safeString(item?.body || item?.message || item?.text || "");
  const date = safeString(item?.date || item?.updatedAt || "");

  if (initialTitle) {
    return {
      id: item?.id || fallbackId,
      title: initialTitle,
      body: stripRepeatedTitleFromBody(rawBody, initialTitle),
      date,
    };
  }

  const inferred = inferAnnouncementFromBody(rawBody);
  return {
    id: item?.id || fallbackId,
    title: inferred.title,
    body: inferred.body,
    date,
  };
};

const unique = (items: string[], limit = 12) => {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    const line = safeString(item);
    if (!line) continue;
    const key = line.toLowerCase().replace(/\s+/g, " ").trim();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(line);
    if (out.length >= limit) break;
  }
  return out;
};

const STRUCTURED_ANNOUNCEMENT_PATTERN =
  /(arrival guidance|registration\b|results|live scoring|rotation sheets?|awards|venue[_\s]?contact|meet director|director of operations|assistant event coordinator|floor manager|credit\/debit|credit card|debit card|cash is not accepted|cash not accepted|sponsor|visit lauderdale|hairstyle to impress|document[_\s-]?version|club[_\s-]?participation)/i;

const shouldRenderAnnouncement = (item: any) => {
  const title = safeString(item?.title || item?.label);
  const body = safeString(item?.body || item?.message || item?.text || item?.title);
  if (!body) return false;
  return !STRUCTURED_ANNOUNCEMENT_PATTERN.test(`${title} ${body}`);
};

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

const DISCOVERY_GENERATED_DETAILS_PREFIX =
  /^(meet dates?:|doors open:|arrival guidance:|registration:|facility layout:|scoring:|results:|rotation sheets?:|awards:|hall layout:|food policy:|hydration:|safety:|animals:)/i;
const DISCOVERY_GENERATED_DETAILS_INLINE =
  /(spectator admission|on-site adult|on-site senior|on-site child|weekend pass|pre[-\s]?sale|ticket(?:s)?|credit\/debit|debit\/credit|credit card|debit card|cash is not accepted|cash not accepted|no cash)/i;
const DISCOVERY_GENERATED_DATE_LINE =
  /^(?:(?:january|jan|february|feb|march|mar|april|apr|may|june|jun|july|jul|august|aug|september|sep|sept|october|oct|november|nov|december|dec)\s+\d{1,2}(?:\s*[-–]\s*\d{1,2})?,?\s+\d{4}|\d{1,2}\/\d{1,2}\/\d{2,4}(?:\s*[-–]\s*\d{1,2}\/\d{1,2}\/\d{2,4})?)$/i;

const stripDiscoveryGeneratedDetails = (value: unknown): string => {
  const text = safeString(value);
  if (!text) return "";
  return unique(
    text
      .split(/\n+/)
      .map((line) => line.replace(/^[\-\u2022]\s*/, "").trim())
      .filter(Boolean)
      .filter(
        (line) =>
          !DISCOVERY_GENERATED_DETAILS_PREFIX.test(line) &&
          !DISCOVERY_GENERATED_DETAILS_INLINE.test(line) &&
          !DISCOVERY_GENERATED_DATE_LINE.test(line)
      ),
    8
  ).join("\n");
};

export const normalizeGymMeetEventData = ({
  eventData,
  eventTitle,
  navItems,
  rosterAthletes,
  mapAddress,
  headerLocation,
}: {
  eventData: any;
  eventTitle: string;
  navItems: Array<{ id: string; label: string }>;
  rosterAthletes: any[];
  mapAddress?: string;
  headerLocation?: string;
}): GymMeetRenderModel => {
  const customFields = eventData?.customFields || {};
  const advancedSections = eventData?.advancedSections || customFields?.advancedSections || {};
  const meet = advancedSections?.meet || {};
  const practiceBlocks = Array.isArray(advancedSections?.practice?.blocks)
    ? advancedSections.practice.blocks
    : [];
  const logistics = advancedSections?.logistics || {};
  const gear = advancedSections?.gear || {};
  const volunteers = advancedSections?.volunteers || {};
  const gearEnabled = gear?.enabled !== false;
  const volunteersEnabled = volunteers?.enabled !== false;
  const announcementsRaw =
    advancedSections?.announcements?.items ||
    advancedSections?.announcements?.announcements ||
    [];
  const announcements = (Array.isArray(announcementsRaw) ? announcementsRaw : [])
    .filter((item: any) => shouldRenderAnnouncement(item))
    .map((item: any, idx: number) =>
      normalizeAnnouncementEntry(item, `announcement-${idx + 1}`)
    )
    .filter((item) => item.title || item.body);

  const linksRaw = Array.isArray(eventData?.links)
    ? eventData.links
    : Array.isArray(eventData?.discoverySource?.parseResult?.links)
    ? eventData.discoverySource.parseResult.links
    : [];
  const discoverySource = eventData?.discoverySource || {};
  const discoveryInput = discoverySource?.input || {};
  const originalSourceLink = (() => {
    if (safeString(discoveryInput?.type) === "url") {
      const url = safeString(discoveryInput?.url);
      return isQuickLinkUrl(url)
        ? {
            label: safeString(discoveryInput?.label || "Original Source"),
            url,
          }
        : null;
    }
    if (safeString(discoveryInput?.type) === "file") {
      const dataUrl = safeString(discoveryInput?.dataUrl);
      return isQuickLinkUrl(dataUrl)
        ? {
            label: "Download Source File",
            url: dataUrl,
          }
        : null;
    }
    return null;
  })();
  const quickLinks = (() => {
    const out: Array<{ label: string; url: string }> = [];
    const seen = new Set<string>();
    const candidates = [
      ...linksRaw.map((item: any) => ({
        label: safeString(item?.label || item?.title || "Link"),
        url: safeString(item?.url),
      })),
      ...(originalSourceLink ? [originalSourceLink] : []),
    ];
    for (const item of candidates) {
      if (!isQuickLinkUrl(item.url)) continue;
      const key = /^data:/i.test(item.url) ? item.label.toLowerCase() : item.url.toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push(item);
      if (out.length >= 5) break;
    }
    return out;
  })();

  const extractionMeta = discoverySource?.extractionMeta || {};
  const parseResult = discoverySource?.parseResult || {};
  const parseLogistics = parseResult?.logistics || {};
  const parseMeetDetails = parseResult?.meetDetails || {};
  const parseCommunications = parseResult?.communications || {};

  const venueFacts = unique(
    [
      ...(Array.isArray(extractionMeta?.gymLayoutFacts)
        ? extractionMeta.gymLayoutFacts
        : []),
      parseMeetDetails?.facilityLayout,
      logistics?.gymLayoutLabel,
    ],
    8
  );
  const spectatorNotes = unique(
    [
      parseMeetDetails?.doorsOpen ? `Doors open: ${parseMeetDetails.doorsOpen}` : "",
      parseMeetDetails?.arrivalGuidance
        ? `Arrival guidance: ${parseMeetDetails.arrivalGuidance}`
        : "",
      parseMeetDetails?.registrationInfo
        ? `Registration: ${parseMeetDetails.registrationInfo}`
        : "",
    ],
    8
  );
  const rulesNotes = unique(
    [
      parseLogistics?.waivers,
      parseLogistics?.trafficAlerts,
      parseMeetDetails?.scoringInfo,
    ],
    6
  );
  const logisticsNotes = unique(
    [
      logistics?.transport,
      logistics?.hotel,
      logistics?.hotelName,
      logistics?.mealPlan,
      logistics?.meals,
      parseLogistics?.hotel,
      parseLogistics?.parking,
      parseLogistics?.trafficAlerts,
    ],
    8
  );

  const heroBadges = unique(
    [
      collapseRepeatedDisplayText(customFields?.meetDateRangeLabel),
      collapseRepeatedDisplayText(meet?.sessionNumber || meet?.session),
      rosterAthletes.length
        ? unique(
            rosterAthletes.map((athlete) => safeString(athlete?.level)).filter(Boolean),
            3
          ).join(" / ")
        : "",
      collapseRepeatedDisplayText(meet?.assignedGym || logistics?.gymLayoutLabel),
    ],
    4
  );

  const summaryItems = [
    {
      label: "Warm-up",
      value: formatGymMeetTime(meet?.warmUpTime || meet?.warmupTime),
    },
    {
      label: "March-in",
      value: formatGymMeetTime(meet?.marchInTime || meet?.marchinTime),
    },
    {
      label: "Start Event",
      value: safeString(meet?.startApparatus),
    },
    {
      label: "Roster",
      value: rosterAthletes.length ? `${rosterAthletes.length} athletes` : "",
    },
  ].filter((item) => safeString(item.value));

  const isDiscoveryEvent =
    safeString(eventData?.createdVia) === "meet-discovery" ||
    Boolean(eventData?.discoverySource?.input || eventData?.discoverySource?.parseResult);
  const detailsText = isDiscoveryEvent
    ? stripDiscoveryGeneratedDetails(eventData?.details || eventData?.description)
    : safeString(eventData?.details || eventData?.description);

  const discovery = buildGymMeetDiscoveryContent({
    eventData,
    customFields,
    advancedSections,
    date: safeString(eventData?.date || eventData?.startISO),
    detailsText,
    venue: safeString(eventData?.venue),
    address: safeString(eventData?.address),
  });

  return {
    pageTemplateId: resolveGymMeetTemplateId(eventData),
    title: safeString(eventData?.eventTitle || eventTitle || "Gymnastics Meet"),
    titleSize: normalizeGymMeetTitleSize(eventData?.fontSize),
    heroImage: safeString(eventData?.heroImage || eventData?.customHeroImage),
    hostGym: collapseRepeatedDisplayText(sanitizeDisplayHostGym(eventData?.hostGym)),
    venue: collapseRepeatedDisplayText(eventData?.venue),
    address: collapseRepeatedDisplayText(eventData?.address),
    headerLocation: collapseRepeatedDisplayText(headerLocation),
    dateLabel: formatDate(safeString(eventData?.date || eventData?.startISO)),
    timeLabel: formatGymMeetTime(eventData?.time),
    detailsText,
    heroSummary: undefined,
    team: collapseRepeatedDisplayText(
      sanitizeDisplayHostGym(customFields?.team || eventData?.extra?.team)
    ),
    season: collapseRepeatedDisplayText(customFields?.season || eventData?.extra?.season),
    coach: collapseRepeatedDisplayText(customFields?.coach || eventData?.extra?.coach),
    assistantCoach: safeString(
      customFields?.assistantCoach || eventData?.extra?.assistantCoach
    ),
    coachPhone: safeString(customFields?.coachPhone || eventData?.extra?.coachPhone),
    heroBadges,
    navItems,
    summaryItems,
    quickLinks,
    rosterAthletes,
    meet,
    practiceBlocks,
    logistics,
    gear: gearEnabled ? gear : { items: [] },
    volunteers: volunteersEnabled ? volunteers : { volunteerSlots: [], carpoolOffers: [] },
    announcements,
    rsvpEnabled: Boolean(eventData?.rsvpEnabled),
    rsvpDeadline: safeString(eventData?.rsvpDeadline),
    mapAddress: safeString(mapAddress),
    venueFacts,
    spectatorNotes,
    rulesNotes,
    logisticsNotes,
    discovery,
    assignedGym: collapseRepeatedDisplayText(meet?.assignedGym),
  };
};
