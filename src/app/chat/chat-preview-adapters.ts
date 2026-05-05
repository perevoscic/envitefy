import type { LiveCardInvitationData } from "@/components/studio/StudioLiveCardActionSurface";
import type { ConciergeEventDraft, RequestedOutput } from "@/lib/concierge/types";
import type { StudioShowcasePreview } from "@/lib/studio/showcase-previews";

export type ChatPreviewSummary = {
  headline: string;
  subheadline: string;
  scheduleLine: string;
  locationLine: string;
  outputs: string[];
};

function cleanString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const cleaned = value.replace(/\s+/g, " ").trim();
  return cleaned || null;
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

function categoryLabel(draft: ConciergeEventDraft | null): string {
  if (!draft?.eventType || draft.eventType === "unknown") return "Custom Invite";
  if (draft.eventType === "baby_shower") return "Baby Shower";
  if (draft.eventType === "gym_meet") return "Gym Meet";
  return draft.eventType
    .split("_")
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(" ");
}

function selectedOutputLabel(output: RequestedOutput): string {
  if (output === "digital_flyer") return "Digital flyer";
  if (output === "event_page") return "Event page";
  if (output === "live_card") return "Live card";
  return output.replace(/_/g, " ");
}

export function buildChatShowcasePreview(args: {
  draft: ConciergeEventDraft | null;
  summary: ChatPreviewSummary;
  selectedOutput: RequestedOutput;
  imageUrl: string;
  sharePath: string | null;
  eventId: string | null;
}): StudioShowcasePreview {
  const draft = args.draft;
  const body =
    cleanString(draft?.previewCopy?.body) ||
    cleanString(draft?.eventPurpose) ||
    `A ${selectedOutputLabel(args.selectedOutput)} preview is taking shape.`;
  const category = categoryLabel(draft);
  const title = args.summary.headline || "Event preview";
  const invitationData: LiveCardInvitationData = {
    title,
    subtitle: args.summary.subheadline,
    description: body,
    scheduleLine: args.summary.scheduleLine,
    locationLine: args.summary.locationLine,
    heroTextMode: "image",
    theme: {
      themeStyle: "concierge-preview",
    },
    interactiveMetadata: {
      ctaLabel: "RSVP",
      rsvpMessage: `Reply to let the host know about ${title}.`,
      shareNote: body,
    },
    eventDetails: {
      category,
      occasion: cleanString(draft?.eventPurpose) || category,
      eventTitle: title,
      eventDate: isoDate(draft?.startISO || draft?.dateText),
      startTime: cleanString(draft?.timeText) || timeTextFromIso(draft?.startISO),
      endTime: timeTextFromIso(draft?.endISO),
      venueName: cleanString(draft?.venue) || "",
      location: cleanString(draft?.location) || cleanString(draft?.venue) || "",
      detailsDescription: body,
      message: args.summary.subheadline,
    },
  };

  return {
    id: args.eventId || draft?.creationSessionId || "concierge-preview",
    title,
    imageUrl: args.imageUrl,
    invitationData,
    initialActiveTab: "none",
    sharePath: args.sharePath || undefined,
  };
}
