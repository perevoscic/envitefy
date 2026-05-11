import type { ConciergeEventDraft, ConciergeEventType, ConciergePreviewCopy } from "./types.ts";

function cleanString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const cleaned = value.replace(/\s+/g, " ").trim();
  return cleaned || null;
}

function stripPromptPrefix(value: string): string {
  return value
    .replace(
      /^(?:please\s+)?(?:make|create|build|turn|convert|draft|design|generate|write)\s+(?:me\s+)?(?:a|an|the)?\s*/i,
      "",
    )
    .replace(
      /^(?:as\s+)?(?:a|an|the)?\s*(?:live\s*card|event\s*page|digital\s+flyer|flyer\s*(?:\/|&|\+|and)?\s*(?:invite|invitation)?|invite|invitation|rsvp\s+page|smart\s+sign[-\s]?up|signup\s+form|product)\s*(?:of|for|about|from|with)?\s*(?:a|an|the)?\s*/i,
      "",
    )
    .replace(/^(?:of|for|about)\s+(?:a|an|the)?\s*/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function looksLikeInternalCreativeDirection(value: unknown): boolean {
  const cleaned = cleanString(value);
  if (!cleaned) return true;
  const lower = cleaned.toLowerCase();
  return (
    /\b([a-z0-9]{3,})\s+\1\b/i.test(cleaned) ||
    /\b(?:vibe|tone|style|theme|visual\s+direction|design\s+idea|prompt|instruction|private\s+visual)\b/i.test(
      cleaned,
    ) ||
    /\b(?:make|create|build|generate|draft|design)\s+(?:this|it|me|a|an|the)\b/i.test(cleaned) ||
    /\b(?:live\s*card|event\s*page|digital\s+flyer|flyer\s+invitation|envitefy\s+product|guest-facing|call\s+to\s+action)\b/i.test(
      cleaned,
    ) ||
    /\b(?:do\s+not|don't|dont|without|no)\b[\s\S]{0,60}\b(?:kids?|children|vibe|tone|style|theme|rsvp|copy|text)\b/i.test(
      lower,
    )
  );
}

export function sanitizeGuestCopy(value: unknown): string | null {
  const cleaned = cleanString(value);
  if (!cleaned) return null;
  if (looksLikeInternalCreativeDirection(cleaned)) return null;
  return cleaned;
}

export function sanitizeGuestTitle(value: unknown): string | null {
  const cleaned = cleanString(value);
  if (!cleaned) return null;
  const stripped = stripPromptPrefix(cleaned);
  if (!stripped || looksLikeInternalCreativeDirection(stripped)) return null;
  return stripped;
}

export function guestSubheadlineForEvent(args: {
  eventType: ConciergeEventType;
  title?: string | null;
  honoreeName?: string | null;
  ageOrMilestone?: string | null;
}): string {
  if (args.eventType === "birthday") {
    if (args.honoreeName && args.ageOrMilestone) {
      return `${args.honoreeName} is turning ${args.ageOrMilestone}`;
    }
    if (args.honoreeName) return `Celebrate ${args.honoreeName}`;
    return "Birthday celebration";
  }
  if (args.eventType === "wedding") return "Celebrate with us";
  if (args.eventType === "baby_shower") return "Baby shower celebration";
  if (args.eventType === "gender_reveal") return "Gender reveal celebration";
  if (args.eventType === "bridal_shower") return "Bridal shower celebration";
  if (args.eventType === "graduation") return "Graduation celebration";
  if (
    args.eventType === "game_day" ||
    args.eventType === "football" ||
    args.eventType === "sport_event"
  ) {
    return "Game day details";
  }
  if (args.eventType === "field_trip") return "Trip details";
  if (args.eventType === "open_house") return "Open house details";
  if (args.eventType === "housewarming") return "Housewarming celebration";
  if (args.eventType === "smart_signup") return "Sign-up details";
  return "Event details";
}

export function sanitizeConciergePreviewCopy(
  value: Partial<ConciergePreviewCopy> | null | undefined,
  context: Pick<
    ConciergeEventDraft,
    "eventType" | "title" | "eventPurpose" | "honoreeName" | "ageOrMilestone"
  >,
): ConciergePreviewCopy {
  const title =
    sanitizeGuestTitle(value?.headline) ||
    sanitizeGuestTitle(context.title) ||
    sanitizeGuestTitle(context.eventPurpose) ||
    "Event";
  return {
    headline: title,
    subheadline:
      sanitizeGuestCopy(value?.subheadline) ||
      guestSubheadlineForEvent({
        eventType: context.eventType,
        title,
        honoreeName: context.honoreeName,
        ageOrMilestone: context.ageOrMilestone,
      }),
    body:
      sanitizeGuestCopy(value?.body) ||
      (context.eventType === "birthday" && context.honoreeName
        ? `Join us to celebrate ${context.honoreeName}.`
        : `Join us for ${title}.`),
    scheduleLine: cleanString(value?.scheduleLine) || "Date TBD",
    locationLine: cleanString(value?.locationLine) || "Location TBD",
    cta: sanitizeGuestCopy(value?.cta) || "View details",
  };
}

export function sanitizeConciergePublicEventData(data: Record<string, unknown>) {
  const publicEvent = {
    ...(data.publicEvent && typeof data.publicEvent === "object" ? data.publicEvent : {}),
  } as Record<string, unknown>;
  const liveCard = {
    ...(data.liveCard && typeof data.liveCard === "object" ? data.liveCard : {}),
  } as Record<string, unknown>;
  const previewCopy = sanitizeConciergePreviewCopy(
    data.previewCopy && typeof data.previewCopy === "object"
      ? (data.previewCopy as Partial<ConciergePreviewCopy>)
      : {
          headline: liveCard.headline ?? publicEvent.headline ?? data.headlineTitle ?? data.title,
          subheadline: liveCard.subheadline ?? publicEvent.subheadline,
          body: liveCard.body ?? publicEvent.body ?? data.description,
          scheduleLine: liveCard.scheduleLine ?? publicEvent.scheduleLine ?? data.scheduleLine,
          locationLine: liveCard.locationLine ?? publicEvent.locationLine ?? data.locationLabel,
          cta: liveCard.cta,
        },
    {
      eventType: (data.eventType as ConciergeEventType) || "general",
      title: sanitizeGuestTitle(data.title),
      eventPurpose: sanitizeGuestTitle(data.eventPurpose),
      honoreeName: sanitizeGuestTitle(data.honoreeName),
      ageOrMilestone: sanitizeGuestCopy(data.ageOrMilestone),
    },
  );

  data.headlineTitle = sanitizeGuestTitle(data.headlineTitle) || previewCopy.headline;
  data.title = sanitizeGuestTitle(data.title) || previewCopy.headline;
  data.description = sanitizeGuestCopy(data.description) || previewCopy.body;
  data.previewCopy = previewCopy;
  data.liveCard = {
    ...liveCard,
    headline: sanitizeGuestTitle(liveCard.headline) || previewCopy.headline,
    subheadline: sanitizeGuestCopy(liveCard.subheadline) || previewCopy.subheadline,
    body: sanitizeGuestCopy(liveCard.body) || previewCopy.body,
    scheduleLine: cleanString(liveCard.scheduleLine) || previewCopy.scheduleLine,
    locationLine: cleanString(liveCard.locationLine) || previewCopy.locationLine,
    cta: sanitizeGuestCopy(liveCard.cta) || previewCopy.cta,
  };
  data.publicEvent = {
    ...publicEvent,
    headline: sanitizeGuestTitle(publicEvent.headline) || previewCopy.headline,
    subheadline: sanitizeGuestCopy(publicEvent.subheadline) || previewCopy.subheadline,
    body: sanitizeGuestCopy(publicEvent.body) || previewCopy.body,
    scheduleLine: cleanString(publicEvent.scheduleLine) || previewCopy.scheduleLine,
    locationLine: cleanString(publicEvent.locationLine) || previewCopy.locationLine,
  };

  const studioCard =
    data.studioCard && typeof data.studioCard === "object"
      ? { ...(data.studioCard as Record<string, unknown>) }
      : null;
  const invitationData =
    studioCard?.invitationData && typeof studioCard.invitationData === "object"
      ? { ...(studioCard.invitationData as Record<string, unknown>) }
      : null;
  if (studioCard && invitationData) {
    const eventDetails =
      invitationData.eventDetails && typeof invitationData.eventDetails === "object"
        ? { ...(invitationData.eventDetails as Record<string, unknown>) }
        : {};
    invitationData.title = sanitizeGuestTitle(invitationData.title) || previewCopy.headline;
    invitationData.subtitle = sanitizeGuestCopy(invitationData.subtitle) || previewCopy.subheadline;
    invitationData.description = sanitizeGuestCopy(invitationData.description) || previewCopy.body;
    invitationData.eventDetails = {
      ...eventDetails,
      eventTitle: sanitizeGuestTitle(eventDetails.eventTitle) || previewCopy.headline,
      detailsDescription: sanitizeGuestCopy(eventDetails.detailsDescription) || previewCopy.body,
      message: sanitizeGuestCopy(eventDetails.message) || previewCopy.subheadline,
    };
    studioCard.invitationData = invitationData;
    data.studioCard = studioCard;
  }
}
