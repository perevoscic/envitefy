export type LiveCardRsvpContactKind = "email" | "sms" | "none";

export type LiveCardRsvpChoice = {
  readonly key: "yes" | "no" | "maybe";
  readonly label: string;
};

/** Chooser labels (UI accent styling lives in components for Tailwind). */
export const LIVE_CARD_RSVP_CHOICES: readonly LiveCardRsvpChoice[] = [
  { key: "yes", label: "Yes" },
  { key: "no", label: "No" },
  { key: "maybe", label: "Maybe" },
] as const;

function readTrimmed(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function extractLiveCardRsvpEmail(value: string): string {
  return value.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || "";
}

export function extractLiveCardRsvpPhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) return "";
  const plus = value.trim().startsWith("+") ? "+" : "";
  return `${plus}${digits}`;
}

export function parseLiveCardRsvpContact(rsvpContact: string): {
  kind: LiveCardRsvpContactKind;
  address: string;
} {
  const raw = readTrimmed(rsvpContact);
  if (!raw) return { kind: "none", address: "" };

  const email = extractLiveCardRsvpEmail(raw);
  if (email) return { kind: "email", address: email };

  const phone = extractLiveCardRsvpPhone(raw);
  if (phone) return { kind: "sms", address: phone };

  return { kind: "none", address: raw };
}

/**
 * Plain-text body for SMS and email drafts (encode when building URIs).
 */
export function formatLiveCardRsvpDraftBody(params: {
  eventTitle: string;
  responseLabel: string;
  shareUrl: string;
}): string {
  const title = readTrimmed(params.eventTitle) || "the event";
  const response = readTrimmed(params.responseLabel) || "Reply";
  const lines = [`Hi! My RSVP for ${title}: ${response}.`];
  const url = readTrimmed(params.shareUrl);
  if (url) lines.push(`Live card: ${url}`);
  return lines.join("\n");
}

/**
 * Returns sms:/mailto: href, or "" when the contact is not a usable email or phone.
 */
export function buildLiveCardRsvpOutboundHref(params: {
  rsvpContact: string;
  eventTitle: string;
  responseLabel: string;
  shareUrl: string;
}): string {
  const parsed = parseLiveCardRsvpContact(params.rsvpContact);
  const body = formatLiveCardRsvpDraftBody({
    eventTitle: params.eventTitle,
    responseLabel: params.responseLabel,
    shareUrl: params.shareUrl,
  });
  const title = readTrimmed(params.eventTitle) || "Event";
  const subject = `RSVP for ${title}`;

  if (parsed.kind === "email") {
    return `mailto:${parsed.address}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }
  if (parsed.kind === "sms") {
    return `sms:${parsed.address}?body=${encodeURIComponent(body)}`;
  }
  return "";
}

/** Guest-facing fun-fact lines we hide (e.g. generic filler models often emit). */
const OMIT_FUN_FACT_NORMALIZED = "your presence is the best gift";

export function filterLiveCardFunFactsForDisplay(facts: readonly string[]): string[] {
  return facts
    .map(readTrimmed)
    .filter(Boolean)
    .filter((fact) => {
      const n = fact.toLowerCase().replace(/\.+$/u, "").trim();
      return n !== OMIT_FUN_FACT_NORMALIZED;
    });
}

/** Show the invitation "Description" block only when the host entered a personal message in studio/event details. */
export function shouldShowLiveCardDescriptionSection(hostPersonalMessage: string): boolean {
  return Boolean(readTrimmed(hostPersonalMessage));
}
