import type { StudioProduct } from "./product-contract.ts";
import type { StudioEventDetails, StudioLiveCardMetadata } from "./types.ts";

/** Guest-facing wording shared by generation and verification. Never include design notes. */
export function flyerTextBlocks(event: StudioEventDetails, copy: StudioLiveCardMetadata | null): string[] {
  const schedule = [event.date, [event.startTime, event.endTime].filter(Boolean).join(" – "), event.timezone]
    .filter(Boolean).join(" · ");
  const location = [...new Set([event.venueName, event.venueAddress].filter(Boolean))].join("\n");
  return [
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
    ...(event.links || []).map((link) => `${link.label}: ${link.url}`),
  ].filter((text): text is string => Boolean(text?.trim()));
}

export function artworkHeadlineBlocks(event: StudioEventDetails): string[] {
  const blocks = [event.title];
  if (event.honoreeName && !event.title.toLowerCase().includes(event.honoreeName.toLowerCase())) {
    blocks.push(event.honoreeName);
  }
  const milestone = event.ageOrMilestone?.trim();
  if (milestone && !event.title.toLowerCase().includes(milestone.toLowerCase())) {
    blocks.push(/^\d+$/.test(milestone) && event.category?.toLowerCase() === "birthday"
      ? `Turning ${milestone}!`
      : milestone);
  }
  return blocks;
}

export function approvedArtworkText(event: StudioEventDetails, product: StudioProduct, copy: StudioLiveCardMetadata | null = null): string[] {
  if (product === "event_page") return [];
  return product === "live_card" ? artworkHeadlineBlocks(event) : flyerTextBlocks(event, copy);
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
  return issues;
}
