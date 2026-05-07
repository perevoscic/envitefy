import type { EventAssetType } from "./types.ts";

type AssetBuildResult = {
  title: string;
  content: Record<string, unknown>;
  design: Record<string, unknown>;
  metadata: Record<string, unknown>;
};

function cleanString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.replace(/\s+/g, " ").trim();
  return trimmed || null;
}

function eventTitle(eventData: Record<string, unknown>, fallbackTitle: string): string {
  return (
    cleanString(eventData.title) ||
    cleanString(eventData.headlineTitle) ||
    cleanString(eventData.name) ||
    fallbackTitle ||
    "Your event"
  );
}

function eventDateLine(eventData: Record<string, unknown>): string {
  return (
    cleanString(eventData.dateText) ||
    cleanString(eventData.date) ||
    cleanString(eventData.startAt) ||
    cleanString(eventData.startISO) ||
    cleanString(eventData.start) ||
    "Date to be announced"
  );
}

function eventTimeLine(eventData: Record<string, unknown>): string {
  return cleanString(eventData.timeText) || cleanString(eventData.time) || "";
}

function eventLocationLine(eventData: Record<string, unknown>): string {
  const venue = cleanString(eventData.venue);
  const location = cleanString(eventData.location) || cleanString(eventData.address);
  if (venue && location && venue !== location) return `${venue}, ${location}`;
  return venue || location || "Location to be announced";
}

function eventTone(eventData: Record<string, unknown>, brief: string): string {
  return (
    cleanString(eventData.tone) ||
    cleanString(eventData.theme) ||
    (/\belegant|luxury|formal\b/i.test(brief) ? "elegant" : "warm")
  );
}

function eventRegistryLink(eventData: Record<string, unknown>): string | null {
  return (
    cleanString(eventData.registryLink) ||
    cleanString(eventData.registryUrl) ||
    cleanString(eventData.giftRegistryLink) ||
    null
  );
}

function eventGiftNote(eventData: Record<string, unknown>): string | null {
  return cleanString(eventData.giftPreferenceNote) || cleanString(eventData.giftNote) || null;
}

function eventLinkPlaceholder(eventId: string): string {
  return `/event/${eventId}`;
}

function baseContent(eventData: Record<string, unknown>, eventId: string, fallbackTitle: string) {
  const title = eventTitle(eventData, fallbackTitle);
  const dateLine = eventDateLine(eventData);
  const timeLine = eventTimeLine(eventData);
  const locationLine = eventLocationLine(eventData);
  return {
    title,
    headline: title,
    dateLine,
    timeLine,
    locationLine,
    eventLink: eventLinkPlaceholder(eventId),
  };
}

function labelForAssetType(assetType: EventAssetType): string {
  return assetType
    .split("_")
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(" ");
}

export function buildEventAssetContent(params: {
  eventId: string;
  eventTitle: string;
  eventData: Record<string, unknown>;
  assetType: EventAssetType;
  brief?: string;
}): AssetBuildResult {
  const brief = params.brief || "";
  const base = baseContent(params.eventData, params.eventId, params.eventTitle);
  const tone = eventTone(params.eventData, brief);
  const rsvpDeadline = cleanString(params.eventData.rsvpDeadline);
  const registryLink = eventRegistryLink(params.eventData);
  const giftNote = eventGiftNote(params.eventData);
  const title = `${base.title} ${labelForAssetType(params.assetType)}`;
  const schedule = [base.dateLine, base.timeLine].filter(Boolean).join(" at ");

  if (params.assetType === "whatsapp") {
    const rsvp = rsvpDeadline ? ` Please RSVP by ${rsvpDeadline}.` : "";
    return {
      title,
      content: {
        ...base,
        message: `You're invited to ${base.title}! ${schedule}. ${base.locationLine}.${rsvp} Details: ${base.eventLink}`,
      },
      design: { format: "message", tone },
      metadata: { generatedBy: "event_assistant", brief },
    };
  }

  if (params.assetType === "instagram_story") {
    return {
      title,
      content: {
        ...base,
        body: `Join us for ${base.title}.`,
        cta: "Tap for details",
        slides: [
          {
            headline: base.title,
            body: `${schedule}\n${base.locationLine}`,
            cta: "Details in link",
          },
        ],
      },
      design: { format: "story_9_16", tone },
      metadata: { generatedBy: "event_assistant", brief },
    };
  }

  if (params.assetType === "printable_flyer" || params.assetType === "welcome_sign") {
    return {
      title,
      content: {
        ...base,
        orientation: "5x7",
        sections: [
          { label: "When", value: schedule || base.dateLine },
          { label: "Where", value: base.locationLine },
          ...(rsvpDeadline ? [{ label: "RSVP", value: `By ${rsvpDeadline}` }] : []),
          ...(registryLink ? [{ label: "Gift Link", value: registryLink }] : []),
          ...(giftNote ? [{ label: "Gift Note", value: giftNote }] : []),
        ],
      },
      design: { format: params.assetType === "welcome_sign" ? "sign" : "print_5x7", tone },
      metadata: { generatedBy: "event_assistant", brief, requiresGeneratedArtwork: true },
    };
  }

  if (params.assetType === "reminder_message") {
    return {
      title,
      content: {
        ...base,
        message: `Reminder: ${base.title} is coming up ${schedule}. We'll see you at ${base.locationLine}.`,
      },
      design: { format: "message", tone },
      metadata: { generatedBy: "event_assistant", brief },
    };
  }

  if (params.assetType === "thank_you_card") {
    return {
      title,
      content: {
        ...base,
        headline: "Thank you",
        message: `Thank you for being part of ${base.title}. Your presence made the celebration feel complete.`,
      },
      design: { format: "card", tone },
      metadata: { generatedBy: "event_assistant", brief },
    };
  }

  if (params.assetType === "menu") {
    return {
      title,
      content: {
        ...base,
        headline: `${base.title} Menu`,
        items: [],
        note: "Add menu items here.",
      },
      design: { format: "menu", tone },
      metadata: { generatedBy: "event_assistant", brief },
    };
  }

  if (params.assetType === "rsvp_page") {
    return {
      title,
      content: {
        ...base,
        headline: `RSVP for ${base.title}`,
        cta: "Send RSVP",
        deadline: rsvpDeadline,
        fields: ["name", "email", "attendance"],
        attendanceChoices: ["yes", "no", "maybe"],
      },
      design: { format: "page", tone },
      metadata: { generatedBy: "event_assistant", brief },
    };
  }

  if (params.assetType === "event_page") {
    return {
      title,
      content: {
        ...base,
        headline: base.title,
        body: `Details for ${base.title}.`,
        navigation: [
          { label: "Details", target: "#details" },
          { label: "Schedule", target: "#schedule" },
          { label: "RSVP", target: "#event-rsvp", visibleWhen: "rsvpEnabled" },
          { label: "Registry", target: "#registry", visibleWhen: "registryLink" },
        ],
        sections: [
          { label: "When", value: schedule || base.dateLine },
          { label: "Where", value: base.locationLine },
          ...(registryLink ? [{ label: "Registry", value: registryLink }] : []),
          ...(giftNote ? [{ label: "Gift Note", value: giftNote }] : []),
        ],
        forms: [
          {
            type: "rsvp",
            enabled: Boolean(params.eventData.rsvpEnabled),
            choices: ["yes", "no", "maybe"],
            fields: ["name", "phone", "message"],
          },
        ],
        actions: ["RSVP", "Add to calendar", "Get directions", "Open registry"],
      },
      design: { format: "website_page", tone },
      metadata: { generatedBy: "event_assistant", brief, requiresGeneratedArtwork: true },
    };
  }

  if (params.assetType === "signup_form") {
    return {
      title,
      content: {
        ...base,
        headline: `Sign up for ${base.title}`,
        fields: [],
        slots: [],
      },
      design: { format: "signup_form", tone },
      metadata: { generatedBy: "event_assistant", brief },
    };
  }

  return {
    title,
    content: {
      ...base,
      subheadline: schedule || "Details coming soon",
      body: `Please join us for ${base.title} at ${base.locationLine}.`,
      cta: rsvpDeadline ? `RSVP by ${rsvpDeadline}` : "View details",
      registryLink,
      giftNote,
    },
    design: { format: "card", tone },
    metadata: { generatedBy: "event_assistant", brief, requiresGeneratedArtwork: true },
  };
}
