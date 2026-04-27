export type LiveCardRsvpContactKind = "email" | "sms" | "none";
export type LiveCardRsvpResponseKey = "yes" | "no" | "maybe";

export type LiveCardRsvpChoice = {
  readonly key: LiveCardRsvpResponseKey;
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

function normalizeRsvpResponseKey(value: unknown): LiveCardRsvpResponseKey | null {
  const normalized = readTrimmed(value).toLowerCase();
  if (!normalized) return null;
  if (/^(yes|y|attend|attending|going|in)$/.test(normalized)) return "yes";
  if (/^(no|n|decline|declined|not attending|out)$/.test(normalized)) return "no";
  if (/^(maybe|m|tentative|not sure)$/.test(normalized)) return "maybe";
  return null;
}

function inferRsvpResponseKey(label: unknown): LiveCardRsvpResponseKey | null {
  const normalized = readTrimmed(label).toLowerCase();
  if (!normalized) return null;
  if (/\byes\b|\battend|\bgoing\b|\bin\b/.test(normalized)) return "yes";
  if (/\bno\b|\bdeclin|\bnot attending\b|\bcan't\b|\bcannot\b/.test(normalized)) return "no";
  if (/\bmaybe\b|\btentative\b|\bnot sure\b/.test(normalized)) return "maybe";
  return null;
}

function normalizeCategory(value: unknown): string {
  const normalized = readTrimmed(value).toLowerCase().replace(/[^a-z0-9]+/g, " ");
  if (/\bbirthday\b|\bbirthdays\b/.test(normalized)) return "birthday";
  if (/\bwedding\b|\bweddings\b/.test(normalized)) return "wedding";
  if (/\bbridal\b/.test(normalized)) return "bridal-shower";
  if (/\bbaby\b/.test(normalized) && /\bshower\b/.test(normalized)) return "baby-shower";
  if (/\bgender\b/.test(normalized) && /\breveal\b/.test(normalized)) return "gender-reveal";
  if (/\bhouse\s*warming\b|\bhousewarming\b/.test(normalized)) return "housewarming";
  if (/\banniversary\b/.test(normalized)) return "anniversary";
  if (/\bgraduation\b|\bgraduate\b/.test(normalized)) return "graduation";
  if (/\bfield\b/.test(normalized) && /\btrip\b|\bday\b/.test(normalized)) return "field-trip";
  return "general";
}

function buildContextualRsvpSentence(params: {
  category: string;
  eventTitle: string;
  responseKey: LiveCardRsvpResponseKey | null;
}): string {
  const title = params.eventTitle;
  const responseKey = params.responseKey || "reply";

  if (params.category === "birthday") {
    if (responseKey === "yes") return `Yes, we can celebrate ${title}.`;
    if (responseKey === "no")
      return `Sorry, we cannot make it to ${title}. Wishing you a wonderful birthday celebration.`;
    if (responseKey === "maybe") return `Maybe for ${title}. We will confirm as soon as we can.`;
    return `I would like to RSVP for ${title}.`;
  }

  if (params.category === "wedding") {
    if (responseKey === "yes") return `Yes, we would be honored to celebrate ${title} with you.`;
    if (responseKey === "no")
      return `Sorry, we cannot attend ${title}. Sending our warmest wishes.`;
    if (responseKey === "maybe") return `Maybe for ${title}. We will confirm as soon as we can.`;
    return `I would like to RSVP for ${title}.`;
  }

  if (params.category === "bridal-shower") {
    if (responseKey === "yes") return `Yes, we can celebrate the bridal shower at ${title}.`;
    if (responseKey === "no")
      return `Sorry, we cannot attend the bridal shower at ${title}. Sending our best wishes.`;
    if (responseKey === "maybe") return `Maybe for the bridal shower at ${title}. We will confirm soon.`;
    return `I would like to RSVP for the bridal shower at ${title}.`;
  }

  if (params.category === "baby-shower") {
    if (responseKey === "yes") return `Yes, we can celebrate the baby shower at ${title}.`;
    if (responseKey === "no")
      return `Sorry, we cannot attend the baby shower at ${title}. Sending our best wishes.`;
    if (responseKey === "maybe") return `Maybe for the baby shower at ${title}. We will confirm soon.`;
    return `I would like to RSVP for the baby shower at ${title}.`;
  }

  if (params.category === "gender-reveal") {
    if (responseKey === "yes") return `Yes, we can join the gender reveal for ${title}.`;
    if (responseKey === "no")
      return `Sorry, we cannot make it to the gender reveal for ${title}. Have a wonderful time.`;
    if (responseKey === "maybe") return `Maybe for the gender reveal for ${title}. We will confirm soon.`;
    return `I would like to RSVP for the gender reveal for ${title}.`;
  }

  if (params.category === "housewarming") {
    if (responseKey === "yes") return `Yes, we can come celebrate the new home at ${title}.`;
    if (responseKey === "no")
      return `Sorry, we cannot make it to the housewarming at ${title}. Wishing you a great celebration.`;
    if (responseKey === "maybe") return `Maybe for the housewarming at ${title}. We will confirm soon.`;
    return `I would like to RSVP for the housewarming at ${title}.`;
  }

  if (params.category === "anniversary") {
    if (responseKey === "yes") return `Yes, we can celebrate the anniversary at ${title}.`;
    if (responseKey === "no")
      return `Sorry, we cannot attend the anniversary celebration at ${title}. Sending our best.`;
    if (responseKey === "maybe") return `Maybe for the anniversary celebration at ${title}. We will confirm soon.`;
    return `I would like to RSVP for the anniversary celebration at ${title}.`;
  }

  if (params.category === "graduation") {
    if (responseKey === "yes") return `Yes, we can celebrate the graduation at ${title}.`;
    if (responseKey === "no")
      return `Sorry, we cannot make it to the graduation celebration at ${title}. Sending congratulations.`;
    if (responseKey === "maybe") return `Maybe for the graduation celebration at ${title}. We will confirm soon.`;
    return `I would like to RSVP for the graduation celebration at ${title}.`;
  }

  if (params.category === "field-trip") {
    if (responseKey === "yes") return `Yes, we can join ${title}.`;
    if (responseKey === "no") return `Sorry, we cannot join ${title}.`;
    if (responseKey === "maybe") return `Maybe for ${title}. We will confirm soon.`;
    return `I would like to RSVP for ${title}.`;
  }

  if (responseKey === "yes") return `Yes, we can attend ${title}.`;
  if (responseKey === "no") return `Sorry, we cannot attend ${title}.`;
  if (responseKey === "maybe") return `Maybe for ${title}. We will confirm soon.`;
  return `I would like to RSVP for ${title}.`;
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
  responseKey?: LiveCardRsvpResponseKey | string | null;
  category?: string | null;
  hostName?: string | null;
  senderName?: string | null;
  guestName?: string | null;
  senderPhone?: string | null;
}): string {
  const title = readTrimmed(params.eventTitle) || "the event";
  const hostName = readTrimmed(params.hostName) || "there";
  const senderName = readTrimmed(params.senderName);
  const guestName = readTrimmed(params.guestName);
  const responseKey =
    normalizeRsvpResponseKey(params.responseKey) || inferRsvpResponseKey(params.responseLabel);
  const sentence = buildContextualRsvpSentence({
    category: normalizeCategory(params.category),
    eventTitle: title,
    responseKey,
  });
  const intro =
    senderName && guestName && senderName.toLowerCase() !== guestName.toLowerCase()
      ? `This is ${senderName}, replying for ${guestName}. `
      : senderName
        ? `This is ${senderName}. `
        : guestName
          ? `This RSVP is for ${guestName}. `
          : "";
  const lines = [`Hi ${hostName},`, "", `${intro}${sentence}`];
  const phone = readTrimmed(params.senderPhone);
  if (phone) lines.push("", `You can reach me at ${phone}.`);
  const url = readTrimmed(params.shareUrl);
  if (url) lines.push("", `Event link: ${url}`);
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
  responseKey?: LiveCardRsvpResponseKey | string | null;
  category?: string | null;
  hostName?: string | null;
  senderName?: string | null;
  guestName?: string | null;
  senderPhone?: string | null;
}): string {
  const parsed = parseLiveCardRsvpContact(params.rsvpContact);
  const body = formatLiveCardRsvpDraftBody({
    eventTitle: params.eventTitle,
    responseLabel: params.responseLabel,
    shareUrl: params.shareUrl,
    responseKey: params.responseKey,
    category: params.category,
    hostName: params.hostName,
    senderName: params.senderName,
    guestName: params.guestName,
    senderPhone: params.senderPhone,
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

/** Show the invitation "Description" block only when the host entered a personal message in studio/event details. */
export function shouldShowLiveCardDescriptionSection(hostPersonalMessage: string): boolean {
  return Boolean(readTrimmed(hostPersonalMessage));
}
