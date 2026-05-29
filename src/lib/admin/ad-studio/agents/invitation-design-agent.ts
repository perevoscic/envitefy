import { runJsonTextAgent } from "@/lib/admin/ad-studio/providers";
import { INVITATION_DESIGN_SCHEMA } from "@/lib/admin/ad-studio/schemas";
import type {
  AdStudioEventType,
  AdStudioRequest,
  CampaignBrief,
  InvitationDesign,
  VideoScript,
} from "@/lib/admin/ad-studio/types";
import { compactText, eventTypeLabel, fallbackEventTitle, safeString } from "./common";

const PALETTES: Record<AdStudioEventType, InvitationDesign["colorPalette"]> = {
  "baby-shower": {
    background: "#F7F0FF",
    accent: "#8B5CF6",
    accentSoft: "#FCE7F3",
    text: "#1E1B4B",
    muted: "#6D5F85",
  },
  wedding: {
    background: "#F8FAFC",
    accent: "#7C3AED",
    accentSoft: "#EDE9FE",
    text: "#111827",
    muted: "#64748B",
  },
  birthday: {
    background: "#FFF7ED",
    accent: "#E11D48",
    accentSoft: "#FCE7F3",
    text: "#1F2937",
    muted: "#7C2D12",
  },
  graduation: {
    background: "#F8FAFC",
    accent: "#4F46E5",
    accentSoft: "#DBEAFE",
    text: "#111827",
    muted: "#475569",
  },
  "gymnastics-meet": {
    background: "#F0FDFA",
    accent: "#0F766E",
    accentSoft: "#CCFBF1",
    text: "#134E4A",
    muted: "#64748B",
  },
  "sports-event": {
    background: "#F8FAFC",
    accent: "#2563EB",
    accentSoft: "#DBEAFE",
    text: "#0F172A",
    muted: "#475569",
  },
  "school-event": {
    background: "#FFFBEB",
    accent: "#D97706",
    accentSoft: "#FEF3C7",
    text: "#1F2937",
    muted: "#6B7280",
  },
  "open-house": {
    background: "#EFF6FF",
    accent: "#0284C7",
    accentSoft: "#E0F2FE",
    text: "#0F172A",
    muted: "#475569",
  },
  "local-business-event": {
    background: "#F5F3FF",
    accent: "#7C3AED",
    accentSoft: "#EDE9FE",
    text: "#18181B",
    muted: "#52525B",
  },
  "general-event": {
    background: "#F8FAFC",
    accent: "#7C3AED",
    accentSoft: "#EDE9FE",
    text: "#111827",
    muted: "#64748B",
  },
};

function fallbackInvitation(request: AdStudioRequest, brief: CampaignBrief): InvitationDesign {
  const hasRegistry = request.eventType === "baby-shower" || request.eventType === "wedding";
  return {
    theme: eventTypeLabel(request.eventType),
    colorPalette: PALETTES[request.eventType],
    layoutStyle: "clean 5x7 portrait card with high-contrast typography",
    fields: {
      title: fallbackEventTitle(request),
      subtitle: request.eventType === "open-house" ? "Tour the home" : "You're invited",
      date: "Saturday, June 14",
      time: "2:00 PM",
      location: request.eventType === "open-house" ? "214 Willow Bend Drive" : "The Garden Room",
      rsvp: "RSVP on Envitefy",
      registry: hasRegistry ? "Registry details inside" : null,
      host: brief.targetAudience,
    },
    metadata: {
      eventType: request.eventType,
      qrPlaceholder: true,
      rsvpEnabled: true,
      registryEnabled: hasRegistry,
      locationEnabled: true,
    },
  };
}

function normalizeInvitation(value: unknown, fallback: InvitationDesign): InvitationDesign | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const fields =
    record.fields && typeof record.fields === "object"
      ? (record.fields as Record<string, unknown>)
      : {};
  return {
    theme: compactText(safeString(record.theme) || fallback.theme, 48),
    colorPalette: fallback.colorPalette,
    layoutStyle: compactText(safeString(record.layoutStyle) || fallback.layoutStyle, 120),
    fields: {
      title: compactText(safeString(fields.title) || fallback.fields.title, 36),
      subtitle: compactText(safeString(fields.subtitle) || fallback.fields.subtitle, 44),
      date: compactText(safeString(fields.date) || fallback.fields.date, 28),
      time: compactText(safeString(fields.time) || fallback.fields.time, 24),
      location: compactText(safeString(fields.location) || fallback.fields.location, 44),
      rsvp: compactText(safeString(fields.rsvp) || fallback.fields.rsvp, 32),
      registry:
        compactText(safeString(fields.registry || fallback.fields.registry || ""), 34) || null,
      host: compactText(safeString(fields.host || fallback.fields.host || ""), 44) || null,
    },
    metadata: fallback.metadata,
  };
}

export async function runInvitationDesignAgent(
  request: AdStudioRequest,
  brief: CampaignBrief,
  script: VideoScript,
) {
  const fallback = fallbackInvitation(request, brief);
  const prompt = `Create deterministic 5x7 invitation/flyer content for this Envitefy ad.

Campaign brief:
${JSON.stringify(brief, null, 2)}

Script:
${JSON.stringify(script.scenes, null, 2)}

Rules:
- Output short, readable fields only.
- This is data for a code renderer. The image model must never render this text.
- Include RSVP, location, and registry metadata only when relevant.`;

  return runJsonTextAgent({
    agentName: "invitation_design_agent",
    prompt,
    schema: INVITATION_DESIGN_SCHEMA,
    fallback,
    normalize: (value) => normalizeInvitation(value, fallback),
  });
}
