/** Guest-facing copy for live card "Event Details" tab. */

export type LiveCardDetailsLike = {
  category?: string;
  name?: string;
  age?: string;
  venueName?: string;
  location?: string;
  eventTitle?: string;
  eventDate?: string;
  startTime?: string;
};

function readTrim(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function ordinalSuffix(n: number): string {
  const v = n % 100;
  if (v >= 11 && v <= 13) return "th";
  switch (n % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

function ageToOrdinalWord(ageRaw: string): string {
  const m = readTrim(ageRaw).match(/\d{1,3}/);
  if (!m) return "";
  const n = Number.parseInt(m[0], 10);
  if (!Number.isFinite(n) || n < 1 || n > 130) return "";
  return `${n}${ordinalSuffix(n)}`;
}

function honoreeFromDetails(
  details: LiveCardDetailsLike | null | undefined,
  cardTitle?: string,
): string {
  const fromForm = readTrim(details?.name);
  if (fromForm) return fromForm;
  const title = readTrim(cardTitle);
  if (title) {
    const possessive = title.match(/^(.+?)'s\s+Birthday\b/i);
    if (possessive) return possessive[1].trim();
  }
  return "";
}

/**
 * Opening line for Event Details: keep this as invitation copy only. Venue and time are
 * rendered as structured rows in the live-card Overview panel.
 */
export function buildLiveCardDetailsWelcomeMessage(
  details: LiveCardDetailsLike | null | undefined,
  cardTitle?: string,
): string | null {
  const category = readTrim(details?.category);
  if (category === "Birthday") {
    const honoree = honoreeFromDetails(details, cardTitle);
    if (!honoree) return null;
    const ord = ageToOrdinalWord(readTrim(details?.age));
    const ageBit = ord ? `${ord} ` : "";
    return `Join us to celebrate ${honoree}'s ${ageBit}birthday.`.replace(
      "'s  birthday",
      "'s birthday",
    );
  }

  const headline =
    readTrim(details?.eventTitle) || readTrim(cardTitle) || readTrim(category) || "";
  if (headline) {
    return `We'd love for you to join us for ${headline}.`;
  }
  return null;
}

function copyKey(value: string): string {
  return value.toLowerCase()
    .replace(/[’']/g, "")
    .replace(/\b(\d+)(?:st|nd|rd|th)\b/g, "$1")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

/** Remove repeated invitation introductions, retaining actual plans and instructions. */
export function buildLiveCardOverviewNotes(input: {
  title: string;
  welcome?: string | null;
  descriptions: string[];
  instructions: string[];
}): string[] {
  const introductionKey = (value: string) => copyKey(value)
    .replace(/^(?:join us (?:to celebrate|for)|wed love for you to join us for)\s+/, "")
    .replace(/\b(?:is|turning|birthday)\b/g, "")
    .replace(/\s+/g, " ").trim();
  const introductions = new Set([input.title, input.welcome || ""]
    .filter(Boolean).map(introductionKey));
  const seen = new Set<string>();
  const notes: string[] = [];
  for (const text of [...input.descriptions, ...input.instructions]) {
    for (const paragraph of text.split(/\n+/)) {
      const sentences = paragraph.trim().split(/(?<=[.!?])\s+(?=[A-Z])/);
      const kept = sentences.filter((sentence) => {
        const key = copyKey(sentence);
        if (!key || introductions.has(introductionKey(sentence)) || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      if (kept.length) notes.push(kept.join(" "));
    }
  }
  return notes;
}
