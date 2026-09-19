import type { StudioProduct } from "./product-contract.ts";
import type { StudioEventDetails, StudioLiveCardMetadata } from "./types.ts";

/** Guest-facing wording shared by generation and verification. Never include design notes. */
export function flyerTextBlocks(event: StudioEventDetails, copy: StudioLiveCardMetadata | null): string[] {
  const schedule = formatPublicSchedule(event);
  const location = publicLocationText(event.venueName, event.venueAddress);
  return uniquePublicText([
    ...artworkHeadlineBlocks(event),
    event.approvedWording || event.description || copy?.invitation.openingLine || "",
    schedule,
    location,
    ...(event.additionalLocations || []).map((stop) =>
      [stop.label, stop.timeText, stop.venue, stop.location || stop.address, stop.description]
        .filter(Boolean).join(" · "),
    ),
    event.dressCode ? `Dress code: ${event.dressCode}` : "",
    event.rsvpEnabled !== false && event.rsvpContact
      ? ["RSVP", event.rsvpContact, event.rsvpBy ? `by ${event.rsvpBy}` : ""].filter(Boolean).join(" ")
      : "",
    event.registryNote || "",
    ...(event.guestInstructions || []),
    ...(event.requiredArtworkLines || []),
    ...(event.links || []).map((link) => `${link.label}: ${link.url}`),
  ]);
}

export function publicLocationText(venue?: string | null, address?: string | null): string {
  const lines = uniquePublicText([venue, address]);
  if (lines.length === 2 && lines[1].toLocaleLowerCase().startsWith(lines[0].toLocaleLowerCase())) return lines[1];
  return lines.join("\n");
}

export function formatPublicSchedule(event: Pick<StudioEventDetails, "date" | "startTime" | "endTime" | "timezone">): string {
  const dateValue = event.date || "";
  const parsedDate = /^\d{4}-\d{2}-\d{2}$/.test(dateValue) ? new Date(`${dateValue}T12:00:00Z`) : null;
  const date = parsedDate && Number.isFinite(parsedDate.getTime()) ? new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" }).format(parsedDate) : dateValue;
  const time = (value?: string | null): string => {
    const match = value?.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
    if (!match) return value || "";
    const hour = Number(match[1]);
    if (hour > 23 || Number(match[2]) > 59) return value || "";
    return `${hour % 12 || 12}:${match[2]} ${hour >= 12 ? "PM" : "AM"}`;
  };
  let timezoneLabel = event.timezone || "";
  if (timezoneLabel.includes("/")) {
    try {
      timezoneLabel = new Intl.DateTimeFormat("en-US", { timeZone: timezoneLabel, timeZoneName: parsedDate ? "short" : "longGeneric" }).formatToParts(parsedDate || new Date("2000-01-01T12:00:00Z")).find((part) => part.type === "timeZoneName")?.value || timezoneLabel;
    } catch { /* Keep an explicit unknown timezone label; never guess an offset. */ }
  }
  return [date, uniquePublicText([time(event.startTime), time(event.endTime)]).join(" – "), timezoneLabel].filter(Boolean).join(" · ");
}

/** Deduplicate whole public blocks, preserving bilingual line breaks and contact punctuation. */
export function uniquePublicText(lines: Array<string | null | undefined>): string[] {
  const seen = new Set<string>();
  return lines.map((line) => line?.trim() || "").filter((line) => {
    const key = line.normalize("NFKC").toLocaleLowerCase().replace(/\s+/g, " ");
    if (!line || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function artworkHeadlineBlocks(event: StudioEventDetails): string[] {
  const blocks = [event.title];
  if (event.honoreeName && !event.title.toLowerCase().includes(event.honoreeName.toLowerCase())) {
    blocks.push(event.honoreeName);
  }
  const milestone = event.ageOrMilestone?.trim();
  if (milestone && !event.title.toLowerCase().includes(milestone.toLowerCase())) {
    blocks.push(/^\d+$/.test(milestone) && event.category?.toLowerCase() === "birthday" && !/anniversary/i.test(event.semanticKind || "")
      ? `Turning ${milestone}!`
      : milestone);
  }
  return blocks;
}

export function approvedArtworkText(event: StudioEventDetails, product: StudioProduct, copy: StudioLiveCardMetadata | null = null): string[] {
  if (product === "event_page") return [];
  return product === "live_card"
    ? uniquePublicText([...artworkHeadlineBlocks(event), ...(event.requiredArtworkLines || [])])
    : flyerTextBlocks(event, copy);
}

export type ApprovedArtworkContract = {
  version: 1;
  id: string;
  product: StudioProduct;
  approvedText: string[];
  requiredText: string[];
  pageText: string[];
  blocks: Array<{ id: string; text: string; surface: "artwork" | "page" }>;
  prohibited: readonly ["faux_controls", "device_frame", "forbidden_footer"];
  blockedIssues: string[];
};

// These are supported request limits, not guessed pixel capacity. Public copy is never sliced.
export const STUDIO_PUBLIC_COPY_LIMITS = { maxBlockCharacters: 12_000, maxTotalCharacters: 32_000, maxBlocks: 256 } as const;
// Conservative maximum supported by the installed image SDK's prompt contract.
export const STUDIO_ARTWORK_PROMPT_MAX_CHARACTERS = 32_000;

export function artworkContractConflictMessage(issues: string[]): string {
  if (issues.includes("missing_title")) return "Add the event title before generating artwork.";
  if (issues.includes("required_copy_block_too_long")) return "A required wording block exceeds 12,000 characters. Split it into shorter public sections or shorten it explicitly before generating; your full wording is preserved.";
  if (issues.includes("required_copy_total_too_long")) return "The approved public wording exceeds 32,000 characters. Shorten the requested copy or move supporting material to a linked document before generating; nothing has been removed.";
  if (issues.includes("artwork_prompt_too_long")) return "The complete image instructions exceed the supported 32,000-character limit. Shorten the visual brief or split the required wording into page sections before generating. Your full wording is preserved.";
  return "This request exceeds 256 public content blocks. Combine related sections before generating; your full wording is preserved.";
}

/** This deterministic contract is shared by planning, image requests and verification. */
export function compileArtworkContract(event: StudioEventDetails, product: StudioProduct, copy: StudioLiveCardMetadata | null = null): ApprovedArtworkContract {
  const approvedText = approvedArtworkText(event, product, copy);
  const pageText = uniquePublicText([event.approvedWording || event.description, ...(event.guestInstructions || []), ...(event.requiredArtworkLines || [])]);
  const requiredText = product === "event_page" ? [] : uniquePublicText(event.requiredArtworkLines || []);
  const blocks = [...approvedText.map((text, index) => ({ id: `artwork-${index}`, text, surface: "artwork" as const })), ...pageText.map((text, index) => ({ id: `page-${index}`, text, surface: "page" as const }))];
  const publicText = uniquePublicText([...approvedText, ...pageText]);
  const blockedIssues = [
    ...(!event.title.trim() ? ["missing_title"] : []),
    ...(publicText.some((text) => text.length > STUDIO_PUBLIC_COPY_LIMITS.maxBlockCharacters) ? ["required_copy_block_too_long"] : []),
    ...(publicText.reduce((length, text) => length + text.length, 0) > STUDIO_PUBLIC_COPY_LIMITS.maxTotalCharacters ? ["required_copy_total_too_long"] : []),
    ...(publicText.length > STUDIO_PUBLIC_COPY_LIMITS.maxBlocks ? ["required_copy_too_many_blocks"] : []),
  ];
  // Content fingerprint, not a security digest; stable in browser and server builds.
  let fingerprint = 2166136261;
  for (const char of JSON.stringify({ product, blocks })) fingerprint = Math.imul(fingerprint ^ char.charCodeAt(0), 16777619);
  return {
    version: 1, id: `art-v1-${(fingerprint >>> 0).toString(16)}`, product, approvedText, requiredText, pageText, blocks,
    prohibited: ["faux_controls", "device_frame", "forbidden_footer"],
    blockedIssues,
  };
}

/** Existing source wording remains allowed, but newly required lines cannot remain missing. */
export function compareRequiredArtworkText(required: string[], visible: string[]): string[] {
  return compareArtworkText(required, visible).filter((issue) => issue === "missing_copy");
}

function wordCounts(lines: string[]): Map<string, number> {
  const counts = new Map<string, number>();
  // Reading order, line breaks, case, and decorative punctuation may change with typography.
  for (const word of lines.join(" ").normalize("NFKC").toLowerCase().match(/[\p{L}\p{N}]+/gu) || []) {
    counts.set(word, (counts.get(word) || 0) + 1);
  }
  return counts;
}

/** Vision also checks associations and punctuation in names, contacts, and addresses. */
export function compareArtworkText(expected: string[], visible: string[]): string[] {
  const required = wordCounts(expected);
  const observed = wordCounts(visible);
  const issues: string[] = [];
  if ([...required].some(([word, count]) => (observed.get(word) || 0) < count)) issues.push("missing_copy");
  if ([...observed].some(([word, count]) => (required.get(word) || 0) < count)) issues.push("unexpected_text");
  // Contact punctuation carries meaning; it is not decorative typography.
  const identities = expected.join(" ").match(/https?:\/\/[^\s]+|[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi) || [];
  const observedText = visible.join(" ").normalize("NFKC").toLowerCase();
  if (identities.some((identity) => !observedText.includes(identity.replace(/[.,;!?]+$/, "").normalize("NFKC").toLowerCase()))) issues.push("missing_copy");
  return [...new Set(issues)];
}
