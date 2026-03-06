/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-explicit-any */
// @ts-nocheck
import { resolveGymMeetTemplateId } from "./registry";
import { GymMeetRenderModel } from "./types";
import { buildGymMeetDiscoveryContent } from "./buildGymMeetDiscoveryContent";

const safeString = (value: unknown): string =>
  typeof value === "string"
    ? value.trim()
    : value == null
    ? ""
    : String(value).trim();

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

const formatTime = (value: string) => {
  if (!value) return "";
  try {
    const [h, m] = value.split(":");
    const hour = Number(h);
    const minute = m || "00";
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minute} ${ampm}`;
  } catch {
    return value;
  }
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
  const announcementsRaw =
    advancedSections?.announcements?.items ||
    advancedSections?.announcements?.announcements ||
    [];
  const announcements = (Array.isArray(announcementsRaw) ? announcementsRaw : [])
    .map((item: any, idx: number) => ({
      id: item?.id || `announcement-${idx + 1}`,
      title: safeString(item?.title || item?.label || "Announcement"),
      body: safeString(item?.body || item?.message || item?.text || ""),
      date: safeString(item?.date || item?.updatedAt || ""),
    }))
    .filter((item) => item.title || item.body);

  const linksRaw = Array.isArray(eventData?.links)
    ? eventData.links
    : Array.isArray(eventData?.discoverySource?.parseResult?.links)
    ? eventData.discoverySource.parseResult.links
    : [];
  const quickLinks = linksRaw
    .map((item: any) => ({
      label: safeString(item?.label || item?.title || "Link"),
      url: safeString(item?.url),
    }))
    .filter((item) => /^https?:\/\//i.test(item.url))
    .slice(0, 4);

  const discoverySource = eventData?.discoverySource || {};
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
      ...(Array.isArray(parseCommunications?.announcements)
        ? parseCommunications.announcements.map((item: any) => item?.body)
        : []),
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
      safeString(customFields?.meetDateRangeLabel),
      safeString(meet?.sessionNumber || meet?.session),
      rosterAthletes.length
        ? unique(
            rosterAthletes.map((athlete) => safeString(athlete?.level)).filter(Boolean),
            3
          ).join(" / ")
        : "",
      safeString(meet?.assignedGym || logistics?.gymLayoutLabel),
    ],
    4
  );

  const summaryItems = [
    {
      label: "Warm-up",
      value: formatTime(safeString(meet?.warmUpTime || meet?.warmupTime)),
    },
    {
      label: "March-in",
      value: formatTime(safeString(meet?.marchInTime || meet?.marchinTime)),
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

  const discovery = buildGymMeetDiscoveryContent({
    eventData,
    customFields,
    advancedSections,
    date: safeString(eventData?.date || eventData?.startISO),
    description: safeString(eventData?.description || eventData?.details),
    venue: safeString(eventData?.venue),
    address: safeString(eventData?.address),
  });

  return {
    pageTemplateId: resolveGymMeetTemplateId(eventData),
    title: safeString(eventData?.eventTitle || eventTitle || "Gymnastics Meet"),
    heroImage: safeString(eventData?.heroImage || eventData?.customHeroImage),
    hostGym: safeString(eventData?.hostGym),
    venue: safeString(eventData?.venue),
    address: safeString(eventData?.address),
    headerLocation: safeString(headerLocation),
    dateLabel: formatDate(safeString(eventData?.date || eventData?.startISO)),
    timeLabel: formatTime(safeString(eventData?.time)),
    description: safeString(eventData?.description || eventData?.details),
    team: safeString(customFields?.team || eventData?.extra?.team),
    season: safeString(customFields?.season || eventData?.extra?.season),
    coach: safeString(customFields?.coach || eventData?.extra?.coach),
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
    gear,
    volunteers,
    announcements,
    rsvpEnabled: Boolean(eventData?.rsvpEnabled),
    rsvpDeadline: safeString(eventData?.rsvpDeadline),
    mapAddress: safeString(mapAddress),
    venueFacts,
    spectatorNotes,
    rulesNotes,
    logisticsNotes,
    discovery,
    assignedGym: safeString(meet?.assignedGym),
  };
};
