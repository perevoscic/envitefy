import { runJsonTextAgent } from "@/lib/admin/ad-studio/providers";
import { CAMPAIGN_BRIEF_SCHEMA } from "@/lib/admin/ad-studio/schemas";
import type { AdStudioRequest, CampaignBrief } from "@/lib/admin/ad-studio/types";
import {
  compactText,
  ctaText,
  eventTypeLabel,
  inferTargetAudience,
  normalizeVideoLength,
  safeString,
  summarizeInstruction,
} from "./common";

function normalizeCampaignBrief(value: unknown): CampaignBrief | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const campaignTitle = safeString(record.campaignTitle);
  const adSummary = safeString(record.adSummary);
  if (!campaignTitle || !adSummary) return null;
  return {
    campaignTitle: compactText(campaignTitle, 96),
    adSummary: compactText(adSummary, 360),
    targetAudience: compactText(safeString(record.targetAudience), 160),
    painPoint: compactText(safeString(record.painPoint), 180),
    emotionalTrigger: compactText(safeString(record.emotionalTrigger), 180),
    benefit: compactText(safeString(record.benefit), 180),
    cta: compactText(safeString(record.cta), 80),
    suggestedPlatform: compactText(
      safeString(record.suggestedPlatform) || "TikTok, Reels, Shorts",
      80,
    ),
    suggestedVideoLength: normalizeVideoLength(record.suggestedVideoLength, 15),
    adAngle: compactText(safeString(record.adAngle), 180),
    coreProblem: compactText(safeString(record.coreProblem), 180),
    envitefySolution: compactText(safeString(record.envitefySolution), 220),
    videoStructure: compactText(safeString(record.videoStructure), 220),
    visualStyle: compactText(safeString(record.visualStyle), 160),
  };
}

function fallbackCampaignBrief(request: AdStudioRequest): CampaignBrief {
  const eventLabel = eventTypeLabel(request.eventType);
  const cta = ctaText(request.cta, request.customCta);
  return {
    campaignTitle: `${eventLabel} Chaos to One Live Link`,
    adSummary:
      "A relatable host is overwhelmed by repeated guest questions, then Envitefy turns the event invite into one polished mobile event page.",
    targetAudience: inferTargetAudience(request),
    painPoint:
      "event details get scattered across flyers, screenshots, texts, and repeated questions",
    emotionalTrigger: "the relief of replacing planning noise with one beautiful source of truth",
    benefit:
      "hosts can share RSVP, date, time, location, registry, and schedule details from one live page",
    cta,
    suggestedPlatform:
      request.format === "horizontal" ? "YouTube and paid social" : "TikTok, Reels, and Shorts",
    suggestedVideoLength: request.videoLength,
    adAngle: "from messy event planning to a polished shareable event page",
    coreProblem: "guests keep asking for the same details because the invite is static",
    envitefySolution:
      "snap or upload the invite and Envitefy organizes the details into a live mobile page",
    videoStructure: "hook, message chaos, Envitefy reveal, product transformation, CTA",
    visualStyle: request.visualStyle.replace(/-/g, " "),
  };
}

export async function runCreativeDirectorAgent(request: AdStudioRequest) {
  const fallback = fallbackCampaignBrief(request);
  const prompt = `Turn this admin instruction into a sharp Envitefy promo concept.

Instruction:
${summarizeInstruction(request)}

Controls:
- Length: ${request.videoLength} seconds
- Format: ${request.format}
- Event type: ${request.eventType}
- Tone: ${request.tone}
- Visual style: ${request.visualStyle}
- CTA: ${fallback.cta}

Envitefy turns invitations, flyers, schedules, screenshots, and event details into polished live mobile event pages with RSVP, date/time, location, registry, schedule, and action buttons.`;

  return runJsonTextAgent({
    agentName: "creative_director_agent",
    prompt,
    schema: CAMPAIGN_BRIEF_SCHEMA,
    fallback,
    normalize: normalizeCampaignBrief,
  });
}
