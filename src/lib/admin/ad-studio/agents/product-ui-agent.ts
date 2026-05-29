import { runJsonTextAgent } from "@/lib/admin/ad-studio/providers";
import { PHONE_UI_DESIGN_SCHEMA } from "@/lib/admin/ad-studio/schemas";
import type {
  AdStudioRequest,
  CampaignBrief,
  InvitationDesign,
  PhoneUIDesign,
  VideoScript,
} from "@/lib/admin/ad-studio/types";
import { compactText, ctaText, safeString } from "./common";

function fallbackPhoneUi(request: AdStudioRequest, invitation: InvitationDesign): PhoneUIDesign {
  return {
    themeTokens: {
      background: "#F5F3FF",
      surface: "#FFFFFF",
      primary: "#7C3AED",
      primaryText: "#FFFFFF",
      text: "#0F172A",
      muted: "#64748B",
    },
    eventPageCard: {
      title: invitation.fields.title,
      subtitle: "Live event page",
      date: invitation.fields.date,
      time: invitation.fields.time,
      location: invitation.fields.location,
    },
    ctaButtonText: ctaText(request.cta, request.customCta),
    rsvpModule: {
      label: "RSVPs",
      yesCount: 24,
      maybeCount: 3,
    },
    locationCard: {
      label: "Location",
      address: invitation.fields.location,
    },
    registryCard: invitation.metadata.registryEnabled
      ? {
          label: "Registry",
          urlLabel: "View registry",
        }
      : null,
    shareModule: {
      label: "Share",
      shareText: "Copy link",
    },
  };
}

function normalizePhoneUi(value: unknown, fallback: PhoneUIDesign): PhoneUIDesign | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const card =
    record.eventPageCard && typeof record.eventPageCard === "object"
      ? (record.eventPageCard as Record<string, unknown>)
      : {};
  const rsvp =
    record.rsvpModule && typeof record.rsvpModule === "object"
      ? (record.rsvpModule as Record<string, unknown>)
      : {};
  const location =
    record.locationCard && typeof record.locationCard === "object"
      ? (record.locationCard as Record<string, unknown>)
      : {};
  const registry =
    record.registryCard && typeof record.registryCard === "object"
      ? (record.registryCard as Record<string, unknown>)
      : null;
  const share =
    record.shareModule && typeof record.shareModule === "object"
      ? (record.shareModule as Record<string, unknown>)
      : {};
  return {
    ...fallback,
    eventPageCard: {
      title: compactText(safeString(card.title) || fallback.eventPageCard.title, 34),
      subtitle: compactText(safeString(card.subtitle) || fallback.eventPageCard.subtitle, 28),
      date: compactText(safeString(card.date) || fallback.eventPageCard.date, 28),
      time: compactText(safeString(card.time) || fallback.eventPageCard.time, 20),
      location: compactText(safeString(card.location) || fallback.eventPageCard.location, 42),
    },
    ctaButtonText: compactText(safeString(record.ctaButtonText) || fallback.ctaButtonText, 34),
    rsvpModule: {
      label: compactText(safeString(rsvp.label) || fallback.rsvpModule.label, 18),
      yesCount: Number(rsvp.yesCount) || fallback.rsvpModule.yesCount,
      maybeCount: Number(rsvp.maybeCount) || fallback.rsvpModule.maybeCount,
    },
    locationCard: {
      label: compactText(safeString(location.label) || fallback.locationCard.label, 24),
      address: compactText(safeString(location.address) || fallback.locationCard.address, 42),
    },
    registryCard: registry
      ? {
          label: compactText(safeString(registry.label) || "Registry", 24),
          urlLabel: compactText(safeString(registry.urlLabel) || "View registry", 28),
        }
      : fallback.registryCard,
    shareModule: {
      label: compactText(safeString(share.label) || fallback.shareModule.label, 24),
      shareText: compactText(safeString(share.shareText) || fallback.shareModule.shareText, 28),
    },
  };
}

export async function runProductUiAgent(
  request: AdStudioRequest,
  brief: CampaignBrief,
  script: VideoScript,
  invitation: InvitationDesign,
) {
  const fallback = fallbackPhoneUi(request, invitation);
  const prompt = `Create structured Envitefy phone UI data for a deterministic SVG renderer.

Campaign:
${JSON.stringify(brief, null, 2)}

Invitation:
${JSON.stringify(invitation, null, 2)}

Script:
${JSON.stringify(script.scenes, null, 2)}

Rules:
- Phone UI must include event title, date, time, RSVP, location, share, and registry if relevant.
- Keep all labels short and readable.
- Do not ask the image model to generate exact UI; this output is rendered in code.`;

  return runJsonTextAgent({
    agentName: "product_ui_agent",
    prompt,
    schema: PHONE_UI_DESIGN_SCHEMA,
    fallback,
    normalize: (value) => normalizePhoneUi(value, fallback),
  });
}
