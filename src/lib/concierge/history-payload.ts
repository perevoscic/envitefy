import { canPersistCreationDraft, rsvpTrackingEnabled } from "./creation-intent.ts";
import {
  sanitizeConciergePreviewCopy,
  sanitizeConciergePublicEventData,
  sanitizeGuestTitle,
} from "./public-copy.ts";
import type { ConciergeEventDraft, ConciergeStudioInvite } from "./types.ts";

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
    ? studioInviteData
    : fallbackLiveCardInvitationData;
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
          ...(registryLink ? [{ label: "Registry", value: registryLink }] : []),
          ...(giftNote ? [{ label: "Gift Note", value: giftNote }] : []),
        ],
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
