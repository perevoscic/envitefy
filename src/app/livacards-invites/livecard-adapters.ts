import { createInitialDetails } from "@/app/studio/studio-workspace-sanitize";
import {
  buildStudioPublishPayload,
  refreshLiveCardInvitationData,
} from "@/app/studio/studio-workspace-builders";
import type {
  EventDetails,
  InvitationData,
  InviteCategory,
} from "@/app/studio/studio-workspace-types";
import {
  LIVE_CARD_BUILDER_SOURCE,
  liveCardDateTime,
  liveCardRegistryUrl,
  readLiveCardForm,
  type LiveCardForm,
} from "@/lib/livecard-builder";

export function restoreLiveCardForm(value: unknown, data: Record<string, unknown>) {
  const form = readLiveCardForm(value);
  if (!form?.rsvpEnabled) return form;
  // The owner workspace can edit these contacts independently of this builder.
  return {
    ...form,
    hostName: typeof data.rsvpName === "string" ? data.rsvpName : form.hostName,
    hostEmail: typeof data.rsvpEmail === "string" ? data.rsvpEmail : form.hostEmail,
    hostPhone: typeof data.rsvpPhone === "string" ? data.rsvpPhone : form.hostPhone,
  };
}

const categories: Record<string, InviteCategory> = {
  Birthday: "Birthday",
  Wedding: "Wedding",
  Anniversary: "Anniversary",
  "Baby shower": "Baby Shower",
  "Gender reveal": "Baby Shower",
  "Bridal shower": "Bridal Shower",
  Housewarming: "Housewarming",
  "Game day": "Game Day",
};

export function liveCardDetails(form: LiveCardForm): EventDetails {
  const primary = form.locations[0];
  return {
    ...createInitialDetails(),
    product: "live_card",
    category: categories[form.eventType] || "Custom Invite",
    eventKind: form.eventType.toLowerCase().replaceAll(" ", "_"),
    eventTitle: form.title.trim(),
    theme: form.design,
    guestImageUrls: form.referenceUrl ? [form.referenceUrl] : [],
    eventDate: form.date,
    startTime: form.startTime,
    endTime: form.endTime,
    calendarStartISO: liveCardDateTime(form.date, form.startTime, form.timezone) || undefined,
    calendarEndISO:
      liveCardDateTime(form.endDate || form.date, form.endTime, form.timezone) || undefined,
    timezone: form.timezone,
    detailsDescription: form.overview,
    guestInstructions: form.instructions.trim() ? [form.instructions.trim()] : [],
    venueName: primary?.venue || "",
    location: primary?.address || "",
    additionalLocations: form.locations.slice(1).map((location) => ({
      label: location.label,
      venue: location.venue,
      address: location.address,
      location: location.address,
      timeText: location.time,
      description: location.note,
    })),
    rsvpEnabled: form.rsvpEnabled,
    actionVisibility: { rsvp: form.rsvpEnabled },
    rsvpName: form.rsvpEnabled ? form.hostName : "",
    rsvpContact: form.rsvpEnabled
      ? [form.hostEmail, form.hostPhone].filter(Boolean).join(" · ")
      : "",
    rsvpDeadline: form.rsvpEnabled ? form.rsvpDeadline : "",
    registryLink: form.registryEnabled ? liveCardRegistryUrl(form.registryUrl) || "" : "",
    giftNote: form.registryEnabled ? form.giftNote : "",
    specialInstructions:
      "Live Card artwork must show only the exact event title. Keep all dates, times, locations, overview, RSVP and registry information in interactive guest buttons. Do not paint buttons, labels, placeholder text, or any other wording on the artwork.",
  };
}

export function liveCardInvitation(
  form: LiveCardForm,
  previous?: Partial<InvitationData>,
): InvitationData {
  const details = liveCardDetails(form);
  const data = refreshLiveCardInvitationData(details, previous);
  // Form fields are authoritative, including deliberately cleared copy. Never restore stale AI text.
  return {
    ...data,
    title: form.title.trim(),
    subtitle: "",
    description: [form.overview, form.instructions].filter(Boolean).join("\n\n"),
    socialCaption: form.overview,
    heroTextMode: "image",
    interactiveMetadata: { ...data.interactiveMetadata, funFacts: [], shareNote: form.overview },
  };
}

export type LiveCardArtwork = {
  imageUrl: string;
  designKey: string;
  invitationData?: Partial<InvitationData>;
};

export function liveCardHistoryPayload(
  form: LiveCardForm,
  artwork: LiveCardArtwork | null,
  status: "draft" | "published",
) {
  const invitationData = liveCardInvitation(form, artwork?.invitationData);
  const base = buildStudioPublishPayload(
    {
      id: "livecard-builder",
      type: "page",
      status: "ready",
      theme: form.design,
      details: invitationData.eventDetails,
      data: invitationData,
      createdAt: new Date().toISOString(),
    },
    artwork?.imageUrl || null,
  );
  const start = invitationData.eventDetails.calendarStartISO || null;
  const end = invitationData.eventDetails.calendarEndISO || null;
  return {
    title: form.title.trim() || "Untitled Live Card",
    data: {
      ...base.data,
      title: form.title.trim() || "Untitled Live Card",
      description: invitationData.description,
      createdVia: LIVE_CARD_BUILDER_SOURCE,
      status,
      ownership: "owned",
      isDraft: status === "draft",
      startAt: start,
      startISO: start,
      start,
      endAt: end,
      endISO: end,
      end,
      location: form.locations[0]?.address || "",
      address: form.locations[0]?.address || "",
      venue: form.locations[0]?.venue || "",
      additionalLocations: invitationData.eventDetails.additionalLocations,
      rsvpEnabled: form.rsvpEnabled,
      rsvpMode: form.rsvpEnabled ? "envitefy" : "none",
      rsvp: form.rsvpEnabled ? base.data.rsvp || "RSVP online" : "",
      rsvpName: form.rsvpEnabled ? form.hostName : "",
      rsvpEmail: form.rsvpEnabled ? form.hostEmail : "",
      rsvpPhone: form.rsvpEnabled ? form.hostPhone : "",
      hostName: form.rsvpEnabled ? form.hostName : "",
      rsvpContact: invitationData.eventDetails.rsvpContact,
      rsvpDeadline: form.rsvpEnabled ? form.rsvpDeadline : "",
      registries: base.data.registries || [],
      registryLink: invitationData.eventDetails.registryLink,
      liveCardBuilder: { version: 1, form, designKey: artwork?.designKey || "" },
    },
  };
}
