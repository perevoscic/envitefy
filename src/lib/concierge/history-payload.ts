import { canPersistCreationDraft, rsvpTrackingEnabled } from "./creation-intent.ts";
import {
  sanitizeConciergePreviewCopy,
  sanitizeConciergePublicEventData,
  sanitizeGuestTitle,
} from "./public-copy.ts";
import type {
  ConciergeAdditionalLocation,
  ConciergeEventDraft,
  ConciergeStudioInvite,
} from "./types.ts";

const CATEGORY_LABELS: Record<ConciergeEventDraft["eventType"], string> = {
  unknown: "General Event",
  birthday: "Birthday",
  wedding: "Wedding",
  baby_shower: "Baby Shower",
  gender_reveal: "Gender Reveal",
  bridal_shower: "Bridal Shower",
  graduation: "Graduation",
  gym_meet: "Gym Meet",
  game_day: "Game Day",
  football: "Game Day",
  sport_event: "Game Day",
  field_trip: "Field Trip/Day",
  open_house: "Open House",
  housewarming: "Housewarming",
  appointment: "Custom Invite",
  workshop: "Custom Invite",
  special_event: "Custom Invite",
  smart_signup: "Smart Sign-up",
  general: "General Event",
};

const LIVE_CARD_IMAGE_BY_EVENT_TYPE: Partial<Record<ConciergeEventDraft["eventType"], string>> = {
  birthday: "/studio/birthday.webp",
  wedding: "/studio/wedding.webp",
  baby_shower: "/studio/baby-shower.webp",
  gender_reveal: "/studio/baby-shower.webp",
  bridal_shower: "/studio/bridal-shower.webp",
  game_day: "/studio/game-day.webp",
  football: "/studio/game-day.webp",
  sport_event: "/studio/game-day.webp",
  field_trip: "/studio/field-trip-day.webp",
  open_house: "/studio/open-house.webp",
  housewarming: "/studio/housewarming.webp",
  general: "/studio/custom-invite.webp",
  unknown: "/studio/custom-invite.webp",
};

function cleanString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.replace(/\s+/g, " ").trim();
  return trimmed || null;
}

function cleanSourceLine(value: unknown): string | null {
  const cleaned = cleanString(value);
  if (!cleaned) return null;
  if (cleaned.length < 3) return null;
  if (/^(https?:\/\/\S+|www\.\S+)$/i.test(cleaned)) return cleaned;
  return cleaned.slice(0, 220);
}

function sourceLinesFromText(value: unknown) {
  if (typeof value !== "string") return [];
  const seen = new Set<string>();
  const lines: string[] = [];
  for (const rawLine of value.split(/\r?\n+/)) {
    const line = cleanSourceLine(rawLine);
    if (!line) continue;
    const key = line.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    lines.push(line);
    if (lines.length >= 80) break;
  }
  return lines;
}

function lineMatches(line: string, pattern: RegExp) {
  return pattern.test(line);
}

function pickSourceFacts(lines: string[], pattern: RegExp, limit = 8) {
  const facts: string[] = [];
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!lineMatches(line, pattern)) continue;
    facts.push(line);
    const next = lines[index + 1];
    if (
      next &&
      facts.length < limit &&
      !/^(dashboard|arrival|venue guide|inside the venue|overview)$/i.test(next)
    ) {
      facts.push(next);
    }
    if (facts.length >= limit) break;
  }
  return Array.from(new Set(facts)).slice(0, limit);
}

function buildSourceFactSections(draft: ConciergeEventDraft) {
  const lines = sourceLinesFromText(draft.sourceMaterial?.ocrText);
  if (!lines.length) return [];

  const sections = [
    {
      title: "Meet Basics",
      items: pickSourceFacts(
        lines,
        /\b(date|dates|location|venue|convention|center|doors?\s+open|session|daily)\b/i,
      ),
    },
    {
      title: "Admission",
      items: pickSourceFacts(lines, /\b(admission|cash|adult|children|\$\s*\d|fee|pass)\b/i),
    },
    {
      title: "Arrival And Parking",
      items: pickSourceFacts(
        lines,
        /\b(arriv|parking|traffic|drop[-\s]?off|rideshare|garage|buffer|disney|daylight)\b/i,
      ),
    },
    {
      title: "Scoring And Schedules",
      items: pickSourceFacts(
        lines,
        /\b(rotation|sheet|schedule|scoring|score|result|pdf|download|refresh)\b/i,
      ),
    },
    {
      title: "Inside The Venue",
      items: pickSourceFacts(
        lines,
        /\b(registration|entrance|gym|hall|map|food|drink|water|prohibited|pets|service dogs?|amenit)\b/i,
      ),
    },
  ]
    .map((section) => ({
      title: section.title,
      items: section.items.filter(Boolean).slice(0, 8),
    }))
    .filter((section) => section.items.length);

  const usedLines = new Set(
    sections.flatMap((section) => section.items).map((line) => line.toLowerCase()),
  );
  const titleKey = (draft.title || "").toLowerCase();
  const remainingLines = lines
    .filter((line) => !usedLines.has(line.toLowerCase()))
    .filter((line) => !titleKey || !line.toLowerCase().includes(titleKey))
    .slice(0, 8);
  if (remainingLines.length) {
    sections.push({ title: "More From Upload", items: remainingLines });
  }

  if (sections.length) return sections.slice(0, 6);
  return [
    {
      title: "Source Details",
      items: lines.slice(0, 14),
    },
  ];
}

function splitCombinedVenueLocation(value: string | null) {
  const cleaned = cleanString(value);
  if (!cleaned) return { venue: null as string | null, location: null as string | null };

  const parts = cleaned
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  const addressLikeRest = parts.slice(1).join(", ");
  if (
    parts.length >= 2 &&
    !/^\d/.test(parts[0]) &&
    /\b(\d|st|street|ave|avenue|road|rd|drive|dr|lane|ln|blvd|boulevard|way|tx|ca|fl|ny)\b/i.test(
      addressLikeRest,
    )
  ) {
    return { venue: parts[0], location: addressLikeRest };
  }

  if (/^\d/.test(cleaned)) return { venue: null, location: cleaned };
  return { venue: cleaned, location: null };
}

function normalizeVenueLocation(venueValue: unknown, locationValue: unknown) {
  const venue = cleanString(venueValue);
  const location = cleanString(locationValue);
  if (venue && location && venue !== location) return { venue, location };

  const combined = venue || location;
  if (!combined) return { venue: null as string | null, location: null as string | null };

  return splitCombinedVenueLocation(combined);
}

function normalizeLocationKey(value: string) {
  return value
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function additionalLocationLine(location: ConciergeAdditionalLocation) {
  return [location.venue, location.location || location.address]
    .filter((value, index, values) => value && values.indexOf(value) === index)
    .join(", ");
}

function normalizeAdditionalLocations(
  values: ConciergeAdditionalLocation[] | null | undefined,
  primary: { venue: string | null; location: string | null },
) {
  if (!Array.isArray(values)) return [];
  const primaryKeys = [
    primary.venue,
    primary.location,
    [primary.venue, primary.location].filter(Boolean).join(", "),
  ]
    .map((value) => (value ? normalizeLocationKey(value) : ""))
    .filter(Boolean);
  const seen = new Set<string>();
  const locations: ConciergeAdditionalLocation[] = [];

  for (const item of values) {
    if (!isRecord(item)) continue;
    const normalized: ConciergeAdditionalLocation = {
      label: cleanString(item.label) || null,
      venue: cleanString(item.venue) || null,
      location: cleanString(item.location) || null,
      address: cleanString(item.address) || null,
      timeText: cleanString(item.timeText) || null,
      description: cleanString(item.description) || null,
      mapQuery: cleanString(item.mapQuery) || null,
    };
    const line = additionalLocationLine(normalized);
    const key = normalizeLocationKey(line || normalized.label || "");
    if (!key || primaryKeys.includes(key) || seen.has(key)) continue;
    seen.add(key);
    locations.push(normalized);
  }

  return locations.slice(0, 8);
}

function isoDate(value: unknown): string {
  const raw = cleanString(value);
  if (!raw) return "";
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

function timeTextFromIso(value: unknown): string {
  const raw = cleanString(value);
  if (!raw) return "";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function liveCardImageUrlForDraft(draft: ConciergeEventDraft) {
  return LIVE_CARD_IMAGE_BY_EVENT_TYPE[draft.eventType] || "/studio/custom-invite.webp";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function canonicalProductOutput(output: ConciergeEventDraft["requestedOutputs"][number]) {
  return output === "invitation" ? "digital_flyer" : output;
}

export function canPersistConciergeHistoryDraft(draft: ConciergeEventDraft): boolean {
  return draft.canPersist !== false && canPersistCreationDraft(draft);
}

export function buildConciergeHistoryPayload(
  draft: ConciergeEventDraft,
  options: { studioInvite?: ConciergeStudioInvite | null } = {},
) {
  if (!canPersistConciergeHistoryDraft(draft)) {
    throw new Error("Creation draft does not have enough source or event context to persist.");
  }
  const title = draft.title || draft.eventPurpose || "Event draft";
  const ownership = draft.ownership === "invited" ? "invited" : "owned";
  const invitedFromScan = draft.sourceContext.detectedSourceIntent === "received_invite";
  const category = CATEGORY_LABELS[draft.eventType] || "General Event";
  const rsvpEnabled = rsvpTrackingEnabled(draft);
  const eventPlace = normalizeVenueLocation(draft.venue, draft.location);
  const additionalLocations = normalizeAdditionalLocations(draft.additionalLocations, eventPlace);
  const safePreviewCopy = sanitizeConciergePreviewCopy(draft.previewCopy, {
    eventType: draft.eventType,
    title,
    eventPurpose: draft.eventPurpose,
    honoreeName: draft.honoreeName,
    ageOrMilestone: draft.ageOrMilestone,
  });
  const scheduleLine =
    cleanString(safePreviewCopy.scheduleLine) ||
    [cleanString(draft.dateText), cleanString(draft.timeText)].filter(Boolean).join(" at ") ||
    null;
  const locationLine =
    cleanString(safePreviewCopy.locationLine) ||
    [eventPlace.venue, eventPlace.location]
      .filter((value, index, values) => value && values.indexOf(value) === index)
      .join(", ") ||
    null;
  const description =
    cleanString(safePreviewCopy.body) ||
    (draft.eventType === "birthday" && draft.honoreeName
      ? `Join us to celebrate ${draft.honoreeName}.`
      : `Join us for ${title}.`);
  const liveCardHeadline = cleanString(safePreviewCopy.headline) || title;
  const liveCardSubheadline = cleanString(safePreviewCopy.subheadline) || category;
  const rawLiveCardCta = cleanString(safePreviewCopy.cta);
  const liveCardCta = rsvpEnabled
    ? rawLiveCardCta || "RSVP"
    : rawLiveCardCta && !/^rsvp$/i.test(rawLiveCardCta)
      ? rawLiveCardCta
      : "View details";
  const registryLink =
    cleanString(draft.registryLink) || cleanString(draft.giftRegistryLink) || null;
  const giftNote = cleanString(draft.giftPreferenceNote) || cleanString(draft.giftNote) || null;
  const sourceFactSections = buildSourceFactSections(draft);
  const rsvpName = cleanString(draft.rsvpName) || (rsvpEnabled ? "Host" : "");
  const rsvpContact = cleanString(draft.rsvpContact) || "";
  const rsvpDeadline = cleanString(draft.rsvpDeadline) || "";
  const registryLinks = registryLink ? [{ label: "Registry", url: registryLink }] : [];
  const studioInviteData = options.studioInvite?.invitationData;
  const studioInvitePositions = options.studioInvite?.positions;
  const generatedInviteImageUrl = cleanString(options.studioInvite?.imageUrl);
  const liveCardImageUrl = generatedInviteImageUrl || liveCardImageUrlForDraft(draft);
  const fallbackLiveCardInvitationData = {
    title: liveCardHeadline,
    subtitle: liveCardSubheadline,
    description,
    scheduleLine: scheduleLine || "",
    locationLine: locationLine || "",
    heroTextMode: "image",
    theme: {
      themeStyle: "concierge-preview",
    },
    interactiveMetadata: {
      ctaLabel: liveCardCta,
      rsvpMessage: `Reply to let the host know about ${liveCardHeadline}.`,
      shareNote: description,
    },
    eventDetails: {
      category,
      occasion: cleanString(draft.eventPurpose) || category,
      eventTitle: liveCardHeadline,
      eventDate: isoDate(draft.startISO || draft.dateText),
      startTime: cleanString(draft.timeText) || timeTextFromIso(draft.startISO),
      endTime: timeTextFromIso(draft.endISO),
      venueName: eventPlace.venue || "",
      location: locationLine || eventPlace.location || eventPlace.venue || "",
      detailsDescription: description,
      message: liveCardSubheadline,
      rsvpEnabled,
      rsvpMode: rsvpEnabled ? "envitefy" : "",
      rsvpName,
      rsvpContact,
      rsvpDeadline,
      registryLink: registryLink || "",
      giftNote: giftNote || "",
    },
  };
  const liveCardInvitationData = isRecord(studioInviteData)
    ? { ...studioInviteData }
    : fallbackLiveCardInvitationData;
  liveCardInvitationData.eventDetails = {
    ...(isRecord(liveCardInvitationData.eventDetails) ? liveCardInvitationData.eventDetails : {}),
    additionalLocations,
  };
  const liveCardPositions = isRecord(studioInvitePositions) ? studioInvitePositions : null;
  const requestedOutputs = Array.from(new Set(draft.requestedOutputs.map(canonicalProductOutput)));
  const rawPrimaryOutput =
    draft.requestedOutputs.find(
      (output) =>
        output !== "rsvp_page" &&
        output !== "whatsapp" &&
        output !== "text_message" &&
        output !== "reminder",
    ) ||
    draft.requestedOutputs[0] ||
    "event_page";
  const primaryOutput = canonicalProductOutput(rawPrimaryOutput);
  const publicRenderer = primaryOutput === "live_card" ? "live_card" : primaryOutput;
  const ownerDefaultSurface =
    primaryOutput === "signup_form"
      ? "signup"
      : primaryOutput === "event_page" || primaryOutput === "rsvp_page"
        ? "event"
        : "card";
  const signupForm =
    primaryOutput === "signup_form" || draft.eventType === "smart_signup"
      ? {
          enabled: true,
          title,
          description,
          start: draft.startISO,
          end: draft.endISO,
          timezone: draft.timezone,
          venue: eventPlace.venue || "",
          location: eventPlace.location || eventPlace.venue || "",
          fields: [],
          slots: [],
          responses: [],
          header: {
            title,
            subtitle: liveCardSubheadline,
            backgroundImage: liveCardImageUrl ? { dataUrl: liveCardImageUrl } : null,
          },
        }
      : null;

  const payload = {
    title,
    data: {
      creationIntent: draft.intent,
      requestedOutputs,
      sourceContext: draft.sourceContext,
      eventPurpose: draft.eventPurpose,
      draftStatus: "published",
      ownership,
      invitedFromScan,
      createdVia: "concierge",
      status: "published",
      primaryOutput,
      productType: primaryOutput,
      publicRenderer,
      ownerDefaultSurface,
      category,
      eventType: draft.eventType,
      title,
      coverImageUrl: liveCardImageUrl,
      thumbnail: liveCardImageUrl,
      heroImage: liveCardImageUrl,
      customHeroImage: liveCardImageUrl,
      heroTextMode: "image",
      headlineTitle: liveCardHeadline,
      description,
      dateText: draft.dateText,
      date: draft.dateText,
      timeText: draft.timeText,
      time: draft.timeText,
      whenLabel: scheduleLine,
      scheduleLine,
      startAt: draft.startISO,
      startISO: draft.startISO,
      start: draft.startISO,
      endAt: draft.endISO,
      endISO: draft.endISO,
      end: draft.endISO,
      timezone: draft.timezone,
      location: eventPlace.location,
      venue: eventPlace.venue,
      additionalLocations,
      locationLabel: locationLine,
      locationText: locationLine || eventPlace.location || eventPlace.venue,
      placeName: eventPlace.venue || eventPlace.location,
      theme: draft.theme,
      tone: draft.tone,
      age: draft.ageOrMilestone,
      honoreeName: draft.honoreeName,
      numberOfGuests: rsvpEnabled ? draft.numberOfGuests || 0 : 0,
      rsvpName,
      rsvpContact,
      rsvpDeadline,
      registryLink,
      giftPreferenceNote: giftNote,
      registries: registryLinks,
      sourceFactSections,
      outputs: requestedOutputs,
      previewCopy: safePreviewCopy,
      rsvpEnabled,
      rsvpMode: "envitefy",
      rsvp: {
        isEnabled: rsvpEnabled,
        enabled: rsvpEnabled,
        mode: "envitefy",
        direct: rsvpEnabled,
        cta: liveCardCta,
        name: rsvpName,
        contact: rsvpContact,
        deadline: rsvpDeadline,
      },
      conciergeDraft: {
        ...draft,
        additionalLocations,
        previewCopy: safePreviewCopy,
        requestedOutputs,
        outputs: requestedOutputs,
      },
      publicEvent: {
        renderer: publicRenderer,
        primaryOutput,
        ownerDefaultSurface,
        headline: liveCardHeadline,
        subheadline: liveCardSubheadline,
        body: description,
        scheduleLine,
        locationLine,
        additionalLocations,
        rsvpEnabled,
        navigation: [
          { label: "Details", target: "#details" },
          { label: "Schedule", target: "#schedule" },
          ...(rsvpEnabled ? [{ label: "RSVP", target: "#event-rsvp" }] : []),
          ...(registryLinks.length ? [{ label: "Registry", target: "#registry" }] : []),
        ],
        sections: [
          { label: "Overview", value: description },
          { label: "When", value: scheduleLine || "" },
          { label: "Where", value: locationLine || "" },
          ...additionalLocations.map((location) => ({
            label: location.label || "Additional location",
            value: additionalLocationLine(location),
          })),
          ...(registryLink ? [{ label: "Registry", value: registryLink }] : []),
          ...(giftNote ? [{ label: "Gift Note", value: giftNote }] : []),
        ],
        sourceSections: sourceFactSections,
        forms: rsvpEnabled
          ? [
              {
                type: "rsvp",
                choices: ["yes", "no", "maybe"],
                fields: ["name", "phone", "message"],
              },
            ]
          : [],
      },
      liveCard: {
        headline: liveCardHeadline,
        subheadline: liveCardSubheadline,
        body: description,
        scheduleLine,
        locationLine,
        additionalLocations,
        cta: liveCardCta,
        registryLink,
        giftNote,
      },
      studioCard: {
        imageUrl: liveCardImageUrl,
        invitationData: liveCardInvitationData,
        positions: liveCardPositions,
      },
      ...(signupForm ? { signupForm } : {}),
    },
  };
  sanitizeConciergePublicEventData(payload.data);
  payload.title = sanitizeGuestTitle(payload.data.title) || title;
  return payload;
}
