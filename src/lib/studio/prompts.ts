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

export function isWeddingOccasion(event: StudioEventDetails): boolean {
  const blob = [event.occasion, event.title, event.description, event.honoreeName]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return /\b(wedding|weddings|bridal|nuptials|ceremony|reception|save the date|engagement(\s+party)?)\b/.test(
    blob,
  );
}

function buildOccasionThemeGuardrails(event: StudioEventDetails): string[] {
  const blob = [event.occasion, event.title, event.description, event.honoreeName]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const common = [
    "- Theme words must be interpreted through the selected event type, not as generic standalone scenery.",
    "- If the user names a franchise, place, motif, era, or mood, translate it into a celebration-themed invitation concept for this occasion.",
  ];

  if (/\bbirthday\b/.test(blob)) {
    return [
      ...common,
      "- For birthdays, make the theme read as a birthday party with birthday decor and celebration cues. Example: Jurassic Park should become a Jurassic Park birthday party, not just jungle foliage and dinosaurs.",
      "- When appropriate, themeStyle should name the celebration version of the concept, such as Jurassic birthday adventure instead of only jungle dinosaurs.",
    ];
  }

  if (/\bwedding|weddings|bridal|nuptials|ceremony|reception|save the date|engagement(\s+party)?\b/.test(blob)) {
    return [
      ...common,
      "- For weddings, make the theme read as a wedding or save-the-date concept with ceremony, reception, floral, stationery, or romantic celebration cues.",
      "- themeStyle should describe the wedding-themed concept, not only the raw setting or scenery.",
    ];
  }

  if (/\bbaby shower|baby\b/.test(blob)) {
    return [
      ...common,
      "- For baby showers, make the theme read as a baby shower with baby-shower decor, favors, dessert-table styling, and welcoming celebration cues.",
      "- themeStyle should describe the baby-shower version of the theme, not only the raw setting.",
    ];
  }

  if (/\banniversary\b/.test(blob)) {
    return [
      ...common,
      "- For anniversaries, make the theme read as an anniversary celebration with elegant party styling and couple-centered celebration cues.",
      "- themeStyle should describe the anniversary-themed concept, not only the raw setting.",
    ];
  }

  if (/\bhousewarming|new home|house party|open house\b/.test(blob)) {
    return [
      ...common,
      "- For housewarmings, make the theme read as a welcoming hosted gathering with home-party decor and hosting cues.",
      "- themeStyle should describe the housewarming version of the theme, not only the raw setting.",
    ];
  }

  if (/\bfield trip|school day|school event|class trip|teacher|students?\b/.test(blob)) {
    return [
      ...common,
      "- For field trips or school-day invites, make the theme read as an organized school event with group-activity and school-planning cues.",
      "- themeStyle should describe the school-event version of the theme, not only the raw setting.",
    ];
  }

  return [
    ...common,
    "- Keep the final concept invitation-ready and celebration-oriented rather than drifting into generic scenery.",
    "- themeStyle should describe the invitation-ready version of the concept, not only the raw setting.",
  ];
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
    "- Keep copy compact enough to fit in the upper and middle card area without pushing essential text into the lower action-button zone.",
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
  const occasionThemeGuardrails = buildOccasionThemeGuardrails(event);
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
    "- Keep invitation copy compact so essential wording stays out of the lower action-button zone.",
    "- Important wording should stay in the upper and middle portions of the card, not the lower action-button zone.",
    "- Prefer fewer words over crowded copy.",
    "- Treat explicit user visual instructions as the highest-priority requirement.",
    "- Do not replace a literal user request with a cuter or more whimsical version of the theme.",
    "- Avoid novelty puns, mascot language, and jokey rewrites unless the user explicitly asked for them.",
    ...occasionThemeGuardrails,
    ...(isWeddingOccasion(event)
      ? [
          "- Wedding-related event: keep JSON tone like premium printed stationery or a boutique save-the-date—refined, romantic, and credible. Prefer palettes that print well (ivory, champagne, blush, sage, navy, gold accents) unless the user specified different colors.",
          "- If wedding details are sparse, expand minimal user input into a refined, credible invitation tone and premium stationery-style concept.",
          "- Infer an appropriate romantic, modern, classic, floral, or formal direction from a few words when needed.",
          "- Use tasteful placeholder wording only if necessary to complete the invitation structure.",
        ]
      : []),
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
  options?: { editingExistingImage?: boolean; referenceImageCount?: number },
): string {
  const isEditingExistingImage = options?.editingExistingImage === true;
  const refCount = Math.max(0, Math.min(6, options?.referenceImageCount ?? 0));
  const wedding = isWeddingOccasion(event);
  const realismRequested = hasRealismIntent(event, guidance);
  const occasionThemeGuardrails = buildOccasionThemeGuardrails(event);
  return [
    isEditingExistingImage
      ? "Edit the provided invitation artwork image."
      : "Create one invitation artwork image.",
    ...(refCount > 0
      ? [
          isEditingExistingImage
            ? `USER PHOTOS IN THE FLYER (NOT A SIDEBAR): After the first image (the current invitation card), ${refCount} user-uploaded photo(s) follow in order. Rebuild the artwork so those photos are the dominant visual—typically the upper ~45–60% hero, soft feathered blend into cream or tonal negative space, professional wedding-flyer or save-the-date layout. Preserve recognizable likeness of people. Do not leave user photos only as a tiny strip or thumbnail; they must read as the printed invitation's main photograph.`
            : `USER PHOTOS IN THE FLYER (NOT A SIDEBAR): Before this text prompt, ${refCount} user-uploaded photo(s) appear in order. The final invitation MUST weave these into the card background and hero art: large focal photo (upper ~45–60% of the canvas), cinematic blend/vignette into the rest of the design, elegant typography layered below or beside—like professional printed wedding or event stationery. Preserve recognizable likeness. Forbidden: tucking user photos into a small gallery row while generating unrelated stock people or generic art as the main visual.`,
        ]
      : []),
    "Style requirements:",
    "- High-quality vertical invitation card composition (9:16 mobile card).",
    "- Legible typography with editorial hierarchy (headline, subhead, detail lines).",
    "- No QR codes, no watermarks, no logos.",
    ...(refCount > 0
      ? [
          "- The supplied reference photo(s) may show people: show them prominently in the hero artwork with natural, respectful rendering. This overrides any generic 'avoid faces' guidance.",
        ]
      : ["- Do not include explicit faces unless needed by theme."]),
    ...(wedding
      ? [
          "- Wedding / formal celebration: aim for serious, print-ready stationery—cream, ivory, champagne, soft blush, sage, or navy with restrained gold accents unless the user's palette overrides.",
          "- Typography: elegant high-contrast serif for names or main title; clean sans-serif for date/venue lines. Avoid clip-art hearts, cartoon rings, or childish icons.",
          "- Layout: photo-forward hero acceptable (couple portrait, soft florals, foil-line accents, circular or arch masks). Overall look should match boutique invitation suites, not a meme or social sticker pack.",
        ]
      : []),
    isEditingExistingImage
      ? "- Edit the supplied image instead of creating a new unrelated composition."
      : "- Create a fresh invitation artwork composition.",
    isEditingExistingImage
      ? "- Preserve the current composition, framing, and overall layout unless the prompt explicitly asks to change them."
      : "- Build a coherent composition for a mobile invitation card.",
    isEditingExistingImage
      ? "- Make only the requested visual changes and keep the rest of the image consistent."
      : "- Keep the composition visually focused and cohesive.",
    "- The user's visual direction is the highest-priority art direction, but it must still be expressed as the selected event type or invitation concept.",
    ...occasionThemeGuardrails,
    ...(wedding
      ? [
          "- Sparse input handling for weddings: even if the user provides only names, a few descriptive words, or partial event details, generate a complete, polished, premium wedding invitation concept.",
          "- Infer the most appropriate layout, palette, typography pairing, decorative treatment, and overall mood from minimal input.",
          "- Expand short phrases such as 'romantic garden', 'modern black and white', or 'formal beach wedding' into a believable luxury invitation design direction.",
          "- If event details are incomplete, use tasteful placeholder text only when needed to complete the visual composition.",
          "- Do not ask for missing information inside the image output. Make smart, elegant assumptions based on the supplied words.",
          "- Prioritize a custom-designed boutique wedding stationery feel over a literal or flat generic template.",
        ]
      : []),
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
    "- Keep essential text out of the bottom action-button zone.",
    "- Do not place paragraphs, captions, labels, taglines, decorative badges, or key event details in the bottom button area.",
    "- Avoid crowded text blocks near the bottom edge of the invitation.",
    "- Let the background and artwork continue naturally behind the bottom buttons as full-bleed art.",
    "- Do not create a visible footer band, dark strip, boxed zone, or artificial empty shelf at the bottom.",
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
