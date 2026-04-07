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

function renderApprovedInvitationCopy(liveCard?: StudioLiveCardMetadata | null): string {
  if (!liveCard?.invitation) return "Approved invitation copy: None";
  const { invitation } = liveCard;
  return [
    "Approved invitation copy to use verbatim if text appears in the artwork:",
    `- Title: ${invitation.title}`,
    `- Subtitle: ${invitation.subtitle}`,
    `- Opening Line: ${invitation.openingLine}`,
    `- Schedule Line: ${invitation.scheduleLine}`,
    `- Location Line: ${invitation.locationLine}`,
    `- Details Line: ${invitation.detailsLine}`,
    `- Call To Action: ${invitation.callToAction}`,
  ].join("\n");
}

function hasRealismIntent(event: StudioEventDetails, guidance?: StudioGenerationGuidance): boolean {
  const combined = [
    event.title,
    event.description,
    event.occasion,
    guidance?.style,
    guidance?.tone,
    guidance?.audience,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return /\b(realistic|photorealistic|photo-realistic|lifelike|true to life|naturalistic|real cats?)\b/.test(
    combined,
  );
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
    "- Preserve the exact spelling of names, titles, venues, and event words from the provided details.",
    "- Double-check every visible word for spelling before returning JSON.",
    "- Do not stylize by misspelling or swapping letters unless the user explicitly supplied that wording.",
    "- Keep copy compact enough to fit in the upper and middle card area without crowding the lower button area.",
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
  const realismRequested = hasRealismIntent(event, guidance);
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
    "- `funFacts` should contain 2-4 short, useful guest-facing notes.",
    "- `hashtags` should be 1-6 short tags.",
    "- The user's visual direction is the highest-priority creative instruction.",
    "- Do not replace a realistic or photorealistic request with cute, cartoon, mascot, illustrated, or anthropomorphic styling unless the user explicitly asks for that.",
    "- Spelling is mandatory. Preserve the exact spelling of names, titles, venues, and event words from the provided details.",
    "- Double-check every visible word and proper noun letter-by-letter before returning JSON.",
    "- Do not intentionally misspell words for style. Never invent pun spellings unless they are explicitly provided in the event details.",
    "- If a word risks being misspelled, shorten the copy or omit that word instead of guessing.",
    "- If the user gives a concrete visual direction, keep the copy aligned with it and avoid novelty puns unless they are explicitly requested.",
    "- Copy must be layout-safe: keep every text field short enough for a mobile invitation card.",
    "- Keep invitation copy compact so the bottom button area stays visually clear.",
    "- Important wording should stay in the upper and middle portions of the card, not the lower action-button zone.",
    "- Keep the bottom quarter of the card clear of essential copy.",
    "- Prefer fewer words over crowded copy.",
    "- Treat explicit user visual instructions as the highest-priority requirement.",
    "- Do not replace a literal user request with a cuter or more whimsical version of the theme.",
    "- Avoid novelty puns, mascot language, and jokey rewrites unless the user explicitly asked for them.",
    ...(realismRequested
      ? [
          "- The requested visual direction is realistic. Keep the copy literal and grounded.",
          "- Do not turn realistic cats into cartoon cats, mascots, plush characters, or animals wearing human costumes unless the user explicitly asked for that.",
          "- Do not invent cat puns or cute rewritten titles when the style request is realistic.",
        ]
      : []),
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
  options?: { editingExistingImage?: boolean },
): string {
  const isEditingExistingImage = options?.editingExistingImage === true;
  const realismRequested = hasRealismIntent(event, guidance);
  return [
    isEditingExistingImage
      ? "Edit the provided invitation artwork image."
      : "Create one invitation artwork image.",
    "Style requirements:",
    "- High-quality vertical invitation card composition.",
    "- Legible typography area with decorative visuals.",
    "- No QR codes, no watermarks, no logos.",
    "- Do not include explicit faces unless needed by theme.",
    isEditingExistingImage
      ? "- Edit the supplied image instead of creating a new unrelated composition."
      : "- Create a fresh invitation artwork composition.",
    isEditingExistingImage
      ? "- Preserve the current composition, framing, and overall layout unless the prompt explicitly asks to change them."
      : "- Build a coherent composition for a mobile invitation card.",
    isEditingExistingImage
      ? "- Make only the requested visual changes and keep the rest of the image consistent."
      : "- Keep the composition visually focused and cohesive.",
    "- The user's visual direction is the highest-priority art direction and overrides generic birthday, preset, category, or live-card styling.",
    "- If the user requests realistic or photorealistic subjects, render them as believable real-life subjects with natural anatomy, textures, and lighting.",
    "- Do not convert realistic animals or people into cartoons, mascots, plush toys, chibi characters, or anthropomorphic figures unless the user explicitly asks for that.",
    "- Keep text minimal and tasteful.",
    "- Visible text is a hard requirement: spell every visible word correctly.",
    "- Double-check all visible text before finalizing the image.",
    "- Preserve the exact spelling of names, titles, venues, and event words from the supplied details.",
    "- Use only exact wording from the supplied event details or the approved invitation copy below when text appears in the artwork.",
    "- Never guess at spelling. If you are not certain about a word, omit it.",
    "- Do not create stylized misspellings or visual puns unless they are explicitly provided by the user.",
    "- If the venue or category implies a standard real word such as cinema, theater, party, birthday, or celebration, spell it normally unless the user gave a different exact spelling.",
    "- For movie themes, if you use the word Cinema, spell it exactly as Cinema.",
    "- Prefer one short headline, one short supporting line, and one short call to action at most.",
    "- Favor imagery over text density.",
    "- Keep all important text in the upper and middle portions of the card.",
    "- Reserve roughly the bottom 28-30% of the card for app action buttons and overlays.",
    "- Do not place paragraphs, captions, labels, taglines, decorative badges, or key event details in the bottom button area.",
    "- Avoid crowded text blocks near the bottom edge of the invitation.",
    "- The lower button area should be visually quiet: use mostly background art or empty space there, not copy-heavy content.",
    "- Do not place important words directly above, behind, or between the bottom buttons.",
    "- No tiny footer copy.",
    "- Keep the total amount of visible text low enough that the composition still feels spacious on a mobile card.",
    "- Treat explicit user visual instructions as mandatory, not optional inspiration.",
    ...(realismRequested
      ? [
          "- The requested visual direction is realistic or photorealistic.",
          "- Render cats as believable real cats with natural anatomy, fur, proportions, and lighting.",
          "- Do not make the cats cartoonish, kawaii, mascot-like, plush, chibi, or anthropomorphic unless the user explicitly asked for that.",
          "- Do not dress the cats in human clothes or stage them like human actors unless the user explicitly asked for that.",
          "- Keep the scene grounded and cinematic rather than illustrated or storybook-like.",
        ]
      : []),
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
    "",
    renderApprovedInvitationCopy(liveCard),
    liveCard
      ? [
          "",
          "Secondary live card metadata for copy and palette only:",
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
