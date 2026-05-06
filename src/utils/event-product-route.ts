import type { RequestedOutput } from "@/lib/concierge/types";
import { buildEventPath, buildEventSlugSegment, buildStudioCardPath } from "./event-url";

type EventProductOutput = RequestedOutput;

const PRODUCT_OUTPUTS = new Set<EventProductOutput>([
  "event_page",
  "live_card",
  "digital_flyer",
  "signup_form",
  "invitation",
  "rsvp_page",
  "printable_flyer",
  "instagram_story",
  "thank_you_card",
  "menu",
  "welcome_sign",
]);

const CARD_FIRST_OUTPUTS = new Set<EventProductOutput>([
  "live_card",
  "digital_flyer",
  "printable_flyer",
  "invitation",
  "instagram_story",
  "thank_you_card",
  "menu",
  "welcome_sign",
]);

const SECONDARY_OUTPUTS = new Set<EventProductOutput>([
  "rsvp_page",
  "whatsapp",
  "text_message",
  "reminder",
]);

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function normalizeOutput(value: unknown): EventProductOutput | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (normalized === "flyer") return "digital_flyer";
  if (normalized === "printable") return "printable_flyer";
  if (normalized === "story") return "instagram_story";
  if (normalized === "signup" || normalized === "smart_signup") return "signup_form";
  return PRODUCT_OUTPUTS.has(normalized as EventProductOutput)
    ? (normalized as EventProductOutput)
    : null;
}

function inferOutputFromText(value: unknown): EventProductOutput | null {
  if (typeof value !== "string") return null;
  const text = value.trim().toLowerCase();
  if (!text) return null;
  if (/\blive[\s_-]*card\b/.test(text)) return "live_card";
  if (/\bsmart[\s_-]*sign[\s_-]*up\b|\bsign[\s_-]*up\b|\bsignup\b/.test(text)) {
    return "signup_form";
  }
  if (/\bevent[\s_-]*page\b/.test(text)) return "event_page";
  if (/\brsvp[\s_-]*page\b/.test(text)) return "rsvp_page";
  if (/\bprintable[\s_-]*flyer\b/.test(text)) return "printable_flyer";
  if (/\bdigital[\s_-]*flyer\b|\bflyer[\s_-]*invite\b|\bflyer\b/.test(text)) {
    return "digital_flyer";
  }
  if (/\binstagram[\s_-]*story\b/.test(text)) return "instagram_story";
  if (/\bthank[\s_-]*you[\s_-]*card\b/.test(text)) return "thank_you_card";
  if (/\bwelcome[\s_-]*sign\b/.test(text)) return "welcome_sign";
  if (/\bmenu\b/.test(text)) return "menu";
  if (/\binvitation\b|\binvite\b/.test(text)) return "invitation";
  return null;
}

function looksLikeProductCreationText(value: unknown): boolean {
  if (typeof value !== "string") return false;
  return /^\s*create\s+(?:a|an|the)?\s*(?:live[\s_-]*card|digital[\s_-]*flyer|flyer|invitation|invite|event[\s_-]*page|rsvp[\s_-]*page|smart[\s_-]*sign[\s_-]*up|sign[\s_-]*up|signup)\b/i.test(
    value,
  );
}

function firstOutputFromArray(value: unknown): EventProductOutput | null {
  if (!Array.isArray(value)) return null;
  const normalized = value.map(normalizeOutput).filter(Boolean) as EventProductOutput[];
  return normalized.find((output) => !SECONDARY_OUTPUTS.has(output)) || normalized[0] || null;
}

export function getPrimaryEventProductOutput(
  data: unknown,
  fallbackText?: string | null,
): EventProductOutput | null {
  const record = asRecord(data);
  if (!record) return inferOutputFromText(fallbackText);
  const publicEvent = asRecord(record.publicEvent);
  const conciergeDraft = asRecord(record.conciergeDraft);
  const inferredText = [
    record.title,
    record.eventPurpose,
    record.prompt,
    record.userPrompt,
    conciergeDraft?.title,
    conciergeDraft?.eventPurpose,
    fallbackText,
  ]
    .filter((value): value is string => typeof value === "string")
    .join(" ");

  return (
    normalizeOutput(record.primaryOutput) ||
    normalizeOutput(record.productType) ||
    normalizeOutput(record.publicRenderer) ||
    normalizeOutput(publicEvent?.primaryOutput) ||
    normalizeOutput(publicEvent?.renderer) ||
    normalizeOutput(conciergeDraft?.primaryOutput) ||
    normalizeOutput(conciergeDraft?.productType) ||
    firstOutputFromArray(record.requestedOutputs) ||
    firstOutputFromArray(record.outputs) ||
    firstOutputFromArray(conciergeDraft?.requestedOutputs) ||
    firstOutputFromArray(conciergeDraft?.outputs) ||
    inferOutputFromText(inferredText)
  );
}

export function isCardFirstEventProduct(output: unknown): boolean {
  const normalized = normalizeOutput(output);
  return Boolean(normalized && CARD_FIRST_OUTPUTS.has(normalized));
}

export function isProductPreviewFirstEvent(data: unknown, fallbackText?: string | null): boolean {
  const record = asRecord(data);
  if (!record) return false;
  const createdVia = String(record.createdVia || "").trim().toLowerCase();
  const output = getPrimaryEventProductOutput(record, fallbackText);
  return Boolean(output) && (/concierge|chat/.test(createdVia) || looksLikeProductCreationText(fallbackText));
}

export function buildEventProductPath(args: {
  eventId: string;
  title?: string | null;
  data?: unknown;
  output?: RequestedOutput | null;
}): string {
  const output =
    normalizeOutput(args.output) || getPrimaryEventProductOutput(args.data, args.title);

  if (output === "signup_form") {
    return `/smart-signup-form/${buildEventSlugSegment(args.eventId, args.title)}`;
  }

  if (output && CARD_FIRST_OUTPUTS.has(output)) {
    return buildStudioCardPath(args.eventId, args.title);
  }

  return buildEventPath(args.eventId, args.title);
}
