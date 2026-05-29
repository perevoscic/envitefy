import type {
  AdStudioCta,
  AdStudioEventType,
  AdStudioFormat,
  AdStudioRenderableFormat,
  AdStudioRequest,
  AdStudioVideoLength,
} from "@/lib/admin/ad-studio/types";

export function safeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function compactText(value: string, maxLength: number): string {
  return value.trim().replace(/\s+/g, " ").slice(0, maxLength).trim();
}

export function titleCaseFromSlug(value: string): string {
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function ctaText(cta: AdStudioCta, customCta?: string | null): string {
  if (cta === "custom" && customCta) return compactText(customCta, 64);
  if (cta === "snap-share-celebrate") return "Snap. Share. Celebrate.";
  if (cta === "turn-your-invite-into-a-live-page") return "Turn your invite into a live page";
  if (cta === "try-envitefy") return "Try Envitefy";
  return "Create your event page";
}

export function eventTypeLabel(eventType: AdStudioEventType): string {
  return titleCaseFromSlug(eventType);
}

export function renderableFormat(format: AdStudioFormat): AdStudioRenderableFormat {
  return format === "all" ? "vertical" : format;
}

export function aspectRatioForFormat(format: AdStudioRenderableFormat): "9:16" | "16:9" | "1:1" {
  if (format === "horizontal") return "16:9";
  if (format === "square") return "1:1";
  return "9:16";
}

export function normalizeVideoLength(
  value: unknown,
  fallback: AdStudioVideoLength,
): AdStudioVideoLength {
  const numeric = Number(value);
  return numeric === 10 || numeric === 15 || numeric === 20 ? numeric : fallback;
}

export function fallbackEventTitle(request: AdStudioRequest): string {
  if (request.eventType === "baby-shower") return "Baby Shower Brunch";
  if (request.eventType === "wedding") return "Maya & Lucas";
  if (request.eventType === "birthday") return "Sophia's Birthday";
  if (request.eventType === "graduation") return "Graduation Celebration";
  if (request.eventType === "gymnastics-meet") return "Spring Invitational";
  if (request.eventType === "open-house") return "Sunday Open House";
  if (request.eventType === "local-business-event") return "Community Pop-Up";
  if (request.eventType === "sports-event") return "Season Kickoff";
  if (request.eventType === "school-event") return "School Family Night";
  return "Weekend Celebration";
}

export function inferTargetAudience(request: AdStudioRequest): string {
  if (request.eventType === "open-house") return "real estate agents and event hosts";
  if (request.eventType === "gymnastics-meet") return "gym parents and meet organizers";
  if (request.eventType === "sports-event") return "team parents, coaches, and fans";
  if (request.eventType === "local-business-event") return "local business owners and customers";
  if (request.eventType === "wedding") return "couples and families coordinating guests";
  return "busy hosts who need one clean event link";
}

export function summarizeInstruction(request: AdStudioRequest): string {
  return (
    request.instruction || `Create a short ${eventTypeLabel(request.eventType)} promo for Envitefy.`
  );
}
