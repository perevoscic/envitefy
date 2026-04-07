import type {
  StudioEventDetails,
  StudioGenerationGuidance,
  StudioLiveCardMetadata,
} from "@/lib/studio/types";

function line(label: string, value: string | null | undefined): string {
  return `${label}: ${value?.trim().length ? value.trim() : "Not provided"}`;
}

function renderLinks(links: StudioEventDetails["links"]): string {
  if (!Array.isArray(links) || links.length === 0) return "Links: None";
  return ["Links:", ...links.slice(0, 8).map((item) => `- ${item.label}: ${item.url}`)].join("\n");
}

export function buildInvitationTextPrompt(
  event: StudioEventDetails,
  guidance?: StudioGenerationGuidance,
): string {
  const includeEmoji = guidance?.includeEmoji === true ? "Allowed" : "Avoid";
  return [
    "You are a professional invitation copywriter.",
    "Return strict JSON only. Do not include markdown fences.",
    "Use this exact JSON shape and key names:",
    "{",
    '  "title": string,',
    '  "subtitle": string,',
    '  "openingLine": string,',
    '  "scheduleLine": string,',
    '  "locationLine": string,',
    '  "detailsLine": string,',
    '  "callToAction": string,',
    '  "socialCaption": string,',
    '  "hashtags": string[]',
    "}",
    "Constraints:",
    "- Keep language clear and warm, not overly formal.",
    "- Keep each line concise and ready for a card layout.",
    "- `hashtags` should be 1-6 short tags.",
    `- Emoji usage: ${includeEmoji}.`,
    "",
    "Event details:",
    line("Title", event.title),
    line("Occasion", event.occasion),
    line("Host Name", event.hostName),
    line("Honoree Name", event.honoreeName),
    line("Description", event.description),
    line("Date", event.date),
    line("Start Time", event.startTime),
    line("End Time", event.endTime),
    line("Timezone", event.timezone),
    line("Venue Name", event.venueName),
    line("Venue Address", event.venueAddress),
    line("Dress Code", event.dressCode),
    line("RSVP By", event.rsvpBy),
    line("RSVP Contact", event.rsvpContact),
    line("Registry Note", event.registryNote),
    renderLinks(event.links),
    "",
    "Style guidance:",
    line("Tone", guidance?.tone),
    line("Style", guidance?.style),
    line("Audience", guidance?.audience),
  ].join("\n");
}

export function buildLiveCardPrompt(
  event: StudioEventDetails,
  guidance?: StudioGenerationGuidance,
): string {
  const includeEmoji = guidance?.includeEmoji === true ? "Allowed" : "Avoid";
  return [
    "You are designing a live event card for Envitefy.",
    "Return strict JSON only. Do not include markdown fences.",
    "Use this exact JSON shape and key names:",
    "{",
    '  "title": string,',
    '  "description": string,',
    '  "palette": { "primary": string, "secondary": string, "accent": string },',
    '  "themeStyle": string,',
    '  "interactiveMetadata": {',
    '    "rsvpMessage": string,',
    '    "funFacts": string[],',
    '    "ctaLabel": string,',
    '    "shareNote": string',
    "  },",
    '  "invitation": {',
    '    "title": string,',
    '    "subtitle": string,',
    '    "openingLine": string,',
    '    "scheduleLine": string,',
    '    "locationLine": string,',
    '    "detailsLine": string,',
    '    "callToAction": string,',
    '    "socialCaption": string,',
    '    "hashtags": string[]',
    "  }",
    "}",
    "Constraints:",
    "- Make the title catchy and concise.",
    "- Make the description feel like a polished live card summary.",
    "- Use a palette with three valid hex colors.",
    "- Keep themeStyle short, vivid, and layout-friendly.",
    "- `funFacts` should contain 2-5 short, useful guest-facing notes.",
    "- `hashtags` should be 1-6 short tags.",
    `- Emoji usage: ${includeEmoji}.`,
    "",
    "Event details:",
    line("Title", event.title),
    line("Occasion", event.occasion),
    line("Host Name", event.hostName),
    line("Honoree Name", event.honoreeName),
    line("Description", event.description),
    line("Date", event.date),
    line("Start Time", event.startTime),
    line("End Time", event.endTime),
    line("Timezone", event.timezone),
    line("Venue Name", event.venueName),
    line("Venue Address", event.venueAddress),
    line("Dress Code", event.dressCode),
    line("RSVP By", event.rsvpBy),
    line("RSVP Contact", event.rsvpContact),
    line("Registry Note", event.registryNote),
    renderLinks(event.links),
    "",
    "Style guidance:",
    line("Tone", guidance?.tone),
    line("Style", guidance?.style),
    line("Audience", guidance?.audience),
    line("Color Palette", guidance?.colorPalette),
    line("Emoji Usage", guidance?.includeEmoji === true ? "Allowed" : "Avoid"),
  ].join("\n");
}

export const buildInvitationMetadataPrompt = buildLiveCardPrompt;

export function buildInvitationImagePrompt(
  event: StudioEventDetails,
  guidance?: StudioGenerationGuidance,
  liveCard?: StudioLiveCardMetadata | null,
): string {
  return [
    "Create one invitation artwork image.",
    "Style requirements:",
    "- High-quality vertical invitation card composition.",
    "- Legible typography area with decorative visuals.",
    "- No QR codes, no watermarks, no logos.",
    "- Do not include explicit faces unless needed by theme.",
    "- Keep text minimal and tasteful.",
    "",
    "Event details to influence visual style:",
    line("Title", event.title),
    line("Occasion", event.occasion),
    line("Host Name", event.hostName),
    line("Honoree Name", event.honoreeName),
    line("Description", event.description),
    line("Date", event.date),
    line("Venue", event.venueName),
    line("Dress Code", event.dressCode),
    renderLinks(event.links),
    liveCard
      ? [
          "",
          "Live card metadata:",
          line("Live Card Title", liveCard.title),
          line("Live Card Description", liveCard.description),
          line("Theme Style", liveCard.themeStyle),
          line(
            "Palette",
            `${liveCard.palette.primary}, ${liveCard.palette.secondary}, ${liveCard.palette.accent}`,
          ),
          line("RSVP Message", liveCard.interactiveMetadata.rsvpMessage),
          line("CTA Label", liveCard.interactiveMetadata.ctaLabel),
          line("Share Note", liveCard.interactiveMetadata.shareNote),
          line("Fun Facts", liveCard.interactiveMetadata.funFacts.join(" | ")),
        ].join("\n")
      : "",
    "",
    "Design direction:",
    line("Tone", guidance?.tone),
    line("Visual Style", guidance?.style),
    line("Audience", guidance?.audience),
    line("Color Palette", guidance?.colorPalette),
    line("Emoji Usage", guidance?.includeEmoji === true ? "Allowed" : "Avoid"),
  ].join("\n");
}
