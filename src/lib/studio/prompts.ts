import type {
  StudioEventDetails,
  StudioGenerationGuidance,
  StudioGenerateSurface,
  StudioLiveCardMetadata,
} from "@/lib/studio/types";

const CARD_SCHEDULE_EXAMPLE = "Saturday May 23rd at 12:00 PM";
const CARD_SCHEDULE_DATE_ONLY_EXAMPLE = "Saturday May 23rd";

function line(label: string, value: string | null | undefined): string {
  return `${label}: ${value?.trim().length ? value.trim() : "Not provided"}`;
}

function renderLinks(links: StudioEventDetails["links"]): string {
  if (!Array.isArray(links) || links.length === 0) return "Links: None";
  return ["Links:", ...links.slice(0, 8).map((item) => `- ${item.label}: ${item.url}`)].join("\n");
}

function renderCoreCreativeInputs(event: StudioEventDetails): string {
  return [
    "Core creative inputs:",
    line("Selected Event Type", event.category || event.occasion),
    line("User Idea", event.userIdea),
    line("Honoree / Couple / Main Person", event.honoreeName),
    line("Sport", event.sportType),
    line("Team / Host", event.teamName),
    line("Opponent", event.opponentName),
    line("Age or Milestone", event.ageOrMilestone),
    line("Event Year", event.eventYear),
  ].join("\n");
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

function getSubjectTransformMode(guidance?: StudioGenerationGuidance): "default" | "premium_makeover" {
  return guidance?.subjectTransformMode === "premium_makeover" ? "premium_makeover" : "default";
}

function getLikenessStrength(guidance?: StudioGenerationGuidance): "strict" | "balanced" | "creative" {
  if (guidance?.likenessStrength === "strict" || guidance?.likenessStrength === "creative") {
    return guidance.likenessStrength;
  }
  return "balanced";
}

function getVisualStyleMode(
  guidance?: StudioGenerationGuidance,
): "photoreal" | "editorial_cinematic" | "playful_stylized" {
  if (guidance?.visualStyleMode === "photoreal" || guidance?.visualStyleMode === "playful_stylized") {
    return guidance.visualStyleMode;
  }
  return "editorial_cinematic";
}

function humanizeSubjectTransformMode(guidance?: StudioGenerationGuidance): string {
  return getSubjectTransformMode(guidance) === "premium_makeover"
    ? "Premium themed makeover"
    : "Natural photo integration";
}

function humanizeLikenessStrength(guidance?: StudioGenerationGuidance): string {
  const strength = getLikenessStrength(guidance);
  if (strength === "strict") return "Strict";
  if (strength === "creative") return "Creative";
  return "Balanced";
}

function humanizeVisualStyleMode(guidance?: StudioGenerationGuidance): string {
  const mode = getVisualStyleMode(guidance);
  if (mode === "photoreal") return "Photoreal";
  if (mode === "playful_stylized") return "Playful stylized";
  return "Editorial cinematic";
}

function buildReferencePhotoPromptRules(
  guidance: StudioGenerationGuidance | undefined,
  refCount: number,
): string[] {
  if (refCount <= 0) return [];
  const transformMode = getSubjectTransformMode(guidance);
  const likenessStrength = getLikenessStrength(guidance);
  const visualStyleMode = getVisualStyleMode(guidance);

  return [
    "- Treat uploaded reference photo(s) like real invitation-hero source material. Preserve recognizable facial identity, age, and overall personhood.",
    "- Do not use the uploaded person as a pasted cutout, sticker, tiny inset, or throwaway reference while unrelated stock people or scenery dominate the card.",
    "- Integrate the person into the invitation world with matched lighting, perspective, color treatment, and premium composition so the result feels custom-designed.",
    transformMode === "premium_makeover"
      ? "- Premium themed makeover is enabled. Preserve identity while restyling wardrobe, hair, props, pose energy, and environmental styling to match the event concept."
      : "- Keep the uploaded person naturally integrated. Preserve their real clothing and everyday likeness unless subtle theme styling is needed to make the invitation feel cohesive.",
    likenessStrength === "strict"
      ? "- Likeness strength is Strict. Keep the face, age, proportions, and overall styling very close to the uploaded photo; minimize makeover changes."
      : likenessStrength === "creative"
        ? "- Likeness strength is Creative. Keep the person recognizable, but allow bolder styling, wardrobe, and scene transformation when it improves the invitation concept."
        : "- Likeness strength is Balanced. Keep the person clearly recognizable while allowing polished editorial styling and tasteful theme integration.",
    visualStyleMode === "photoreal"
      ? "- Visual style mode is Photoreal. Keep anatomy, textures, lighting, fabrics, and materials grounded in believable real-life photography."
      : visualStyleMode === "playful_stylized"
        ? "- Visual style mode is Playful stylized. Allow tasteful stylization and heightened art direction, but keep the result premium and invitation-ready rather than childish or gimmicky."
        : "- Visual style mode is Editorial cinematic. Favor polished premium lighting, elevated styling, and bespoke invitation art direction over plain snapshots.",
    "- The finished result must still read first as a hosted invitation or greeting-card design, not a fan poster, character sheet, collage, or movie still.",
  ];
}

function hasRealismIntent(event: StudioEventDetails, guidance?: StudioGenerationGuidance): boolean {
  const combined = [
    event.category,
    event.title,
    event.userIdea,
    event.description,
    event.occasion,
    guidance?.style,
    guidance?.tone,
    guidance?.audience,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return (
    getVisualStyleMode(guidance) === "photoreal" ||
    /\b(realistic|photorealistic|photo-realistic|lifelike|true to life|naturalistic|real cats?)\b/.test(
      combined,
    )
  );
}

export function isWeddingOccasion(event: StudioEventDetails): boolean {
  const blob = [
    event.category,
    event.occasion,
    event.title,
    event.userIdea,
    event.description,
    event.honoreeName,
    event.sportType,
    event.teamName,
    event.opponentName,
    event.leagueDivision,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return /\b(wedding|weddings|bridal|nuptials|ceremony|reception|save the date|engagement(\s+party)?)\b/.test(
    blob,
  );
}

function isGameDayOccasion(event: StudioEventDetails): boolean {
  const blob = [
    event.category,
    event.occasion,
    event.title,
    event.userIdea,
    event.description,
    event.sportType,
    event.teamName,
    event.opponentName,
    event.leagueDivision,
    event.broadcastInfo,
    event.parkingInfo,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return /\b(game day|matchup|opponent|kickoff|tipoff|first pitch|stadium|arena|rink|ballpark|football|basketball|baseball|soccer|volleyball|hockey|softball|lacrosse)\b/.test(
    blob,
  );
}

function isPosterFirstBirthdayOrWedding(event: StudioEventDetails): boolean {
  const blob = [event.category, event.occasion].filter(Boolean).join(" ").toLowerCase();
  return /\bbirthday\b/.test(blob) || isWeddingOccasion(event);
}

function buildOccasionThemeGuardrails(event: StudioEventDetails): string[] {
  const blob = [
    event.category,
    event.occasion,
    event.title,
    event.userIdea,
    event.description,
    event.honoreeName,
  ]
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

  if (
    /\bwedding|weddings|bridal|nuptials|ceremony|reception|save the date|engagement(\s+party)?\b/.test(
      blob,
    )
  ) {
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

  if (isGameDayOccasion(event)) {
    return [
      ...common,
      "- For Game Day, make the theme read as a real sports-event invitation with matchup energy, crowd atmosphere, sport-specific setting cues, and game-night presentation rather than a generic athlete poster or random action shot.",
      "- themeStyle should describe the game-day version of the theme, not only the raw sport or venue.",
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
  const posterFirstBirthdayOrWedding = isPosterFirstBirthdayOrWedding(event);
  const gameDay = isGameDayOccasion(event);
  return [
    "You are a premium invitation designer and invitation copywriter for Envitefy.",
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
    `- \`scheduleLine\` is for visible date/time only. Prefer ${CARD_SCHEDULE_EXAMPLE}; if time is missing, use ${CARD_SCHEDULE_DATE_ONLY_EXAMPLE}. Keep venue/location on the next line or separate field, not inside \`scheduleLine\`.`,
    "- Visible card schedule/date lines should omit the year unless the user explicitly typed year wording that must be preserved.",
    "- Build the invitation around the selected event type first.",
    "- Treat the user's idea as the primary creative concept when one is provided.",
    "- If an age or milestone is provided, incorporate it naturally into the invitation concept or copy when helpful.",
    "- Preserve the exact spelling of names, titles, venues, and event words from the provided details.",
    "- Double-check every visible word for spelling before returning JSON.",
    "- Do not stylize by misspelling or swapping letters unless the user explicitly supplied that wording.",
    "- Keep copy compact enough to fit in the upper and middle card area without pushing essential text into the lower action-button zone.",
    ...(posterFirstBirthdayOrWedding
      ? [
          "- For birthday and wedding invitation copy, keep the hierarchy short, cinematic, and poster-ready rather than reading like flat form fields.",
          "- For birthdays, when Honoree Name and Age or Milestone are available, make the main title anchor that person's name and birthday milestone first. Treat the user idea as a short subtitle, theme line, or mood cue rather than the primary birthday headline.",
          "- Treat the user prompt/theme as the dominant art direction for the wording and mood.",
          "- Make the wording read unmistakably as a hosted celebration invitation, not just a description of a place, backdrop, or scene.",
          "- Bring celebration energy into the copy with event-oriented language, invitation intent, and occasion cues.",
          "- For birthday and wedding visible card copy, never add the year to schedule/date wording unless the user's custom wording explicitly includes that year.",
        ]
      : []),
    ...(gameDay
      ? [
          "- For Game Day, make the copy read as a real game-day invitation or attendance page, not a generic sports poster, recap, or highlight reel.",
          "- Use the supplied sport, team, opponent, league, broadcast, and parking details when present, but do not invent unsupported scores, records, player names, uniforms, logos, mascots, sponsors, or venue claims.",
        ]
      : []),
    `- Emoji usage: ${includeEmoji}.`,
    "",
    renderCoreCreativeInputs(event),
    "",
    "Event details:",
    line("Category", event.category),
    line("Title", event.title),
    line("Occasion", event.occasion),
    line("Event Year", event.eventYear),
    line("Host Name", event.hostName),
    line("Honoree Name", event.honoreeName),
    line("Sport", event.sportType),
    line("Team / Host", event.teamName),
    line("Opponent", event.opponentName),
    line("League / Division", event.leagueDivision),
    line("Age or Milestone", event.ageOrMilestone),
    line("User Idea", event.userIdea),
    line("Description", event.description),
    line("Date", event.date),
    line("Start Time", event.startTime),
    line("End Time", event.endTime),
    line("Timezone", event.timezone),
    line("Venue Name", event.venueName),
    line("Venue Address", event.venueAddress),
    line("Broadcast / Stream", event.broadcastInfo),
    line("Parking / Arrival", event.parkingInfo),
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
  const posterFirstBirthdayOrWedding = isPosterFirstBirthdayOrWedding(event);
  const gameDay = isGameDayOccasion(event);
  const referenceImageCount = Math.max(0, event.referenceImageUrls?.length ?? 0);
  return [
    "You are a premium invitation designer, greeting-card art director, and live-event card writer for Envitefy.",
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
    "- Resolve the final visible text line well above the bottom action buttons. If space is tight, shorten copy instead of pushing it lower.",
    "- Prefer fewer words over crowded copy.",
    `- \`invitation.scheduleLine\` is for visible date/time only. Prefer ${CARD_SCHEDULE_EXAMPLE}; if time is missing, use ${CARD_SCHEDULE_DATE_ONLY_EXAMPLE}. Keep venue/location on \`invitation.locationLine\`, not inside \`invitation.scheduleLine\`.`,
    "- Visible card schedule/date lines should omit the year unless the user explicitly typed year wording that must be preserved.",
    "- Build the live card around the selected event type first, then express the user's idea through that celebration type.",
    "- Treat the user's idea as the main creative concept when one is provided.",
    "- If an age or milestone is provided, work it into the copy or concept naturally when it adds clarity.",
    "- Treat explicit user visual instructions as the highest-priority requirement.",
    "- Do not replace a literal user request with a cuter or more whimsical version of the theme.",
    "- Avoid novelty puns, mascot language, and jokey rewrites unless the user explicitly asked for them.",
    ...(posterFirstBirthdayOrWedding
      ? [
          "- For birthday and wedding live cards, write short cinematic invitation copy with a poster-like hierarchy instead of flat form-field phrasing.",
          "- For birthdays, when Honoree Name and Age or Milestone are available, make the main invitation title center on that person's name and milestone first. Use the user idea as a short subtitle, theme line, or mood line instead of the dominant birthday headline.",
          "- Treat the user's prompt/theme as the dominant art direction for the copy and invitation mood.",
          "- Make the result read first as a real celebration invite for this event type, not simply a stylish scene description.",
          "- Bring clear party / celebration / hosted-event energy into the concept and invitation copy.",
          "- Do not invent venue brands, marquee names, signage wording, or unsupported event facts in the copy.",
          "- For birthday and wedding visible card copy, never add the year to schedule/date wording unless the user's custom wording explicitly includes that year.",
        ]
      : []),
    ...(gameDay
      ? [
          "- For Game Day, make the result read first as a real sports-event invite with matchup energy and guest-useful information, not a generic sports poster or season recap.",
          "- Use the provided sport context to keep the mood and wording specific to the event, but never invent scores, records, players, logos, mascots, sponsors, branded uniforms, or scoreboard claims.",
        ]
      : []),
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
    ...buildReferencePhotoPromptRules(guidance, referenceImageCount),
    `- Emoji usage: ${includeEmoji}.`,
    "",
    renderCoreCreativeInputs(event),
    "",
    "Event details:",
    line("Category", event.category),
    line("Title", event.title),
    line("Occasion", event.occasion),
    line("Event Year", event.eventYear),
    line("Host Name", event.hostName),
    line("Honoree Name", event.honoreeName),
    line("Sport", event.sportType),
    line("Team / Host", event.teamName),
    line("Opponent", event.opponentName),
    line("League / Division", event.leagueDivision),
    line("Age or Milestone", event.ageOrMilestone),
    line("User Idea", event.userIdea),
    line("Description", event.description),
    line("Date", event.date),
    line("Start Time", event.startTime),
    line("End Time", event.endTime),
    line("Timezone", event.timezone),
    line("Venue Name", event.venueName),
    line("Venue Address", event.venueAddress),
    line("Broadcast / Stream", event.broadcastInfo),
    line("Parking / Arrival", event.parkingInfo),
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
    line(
      "Subject Treatment",
      referenceImageCount > 0 ? humanizeSubjectTransformMode(guidance) : "Not requested",
    ),
    line(
      "Likeness Strength",
      referenceImageCount > 0 ? humanizeLikenessStrength(guidance) : "Default",
    ),
    line(
      "Render Style Mode",
      referenceImageCount > 0 ? humanizeVisualStyleMode(guidance) : "Default",
    ),
    line("Color Palette", guidance?.colorPalette),
    line("Emoji Usage", guidance?.includeEmoji === true ? "Allowed" : "Avoid"),
  ].join("\n");
}

export const buildInvitationMetadataPrompt = buildLiveCardPrompt;

export function buildInvitationImagePrompt(
  event: StudioEventDetails,
  guidance?: StudioGenerationGuidance,
  liveCard?: StudioLiveCardMetadata | null,
  options?: {
    surface?: StudioGenerateSurface;
    editingExistingImage?: boolean;
    referenceImageCount?: number;
    posterTextInImage?: boolean;
  },
): string {
  const surface = options?.surface === "page" ? "page" : "image";
  const isEditingExistingImage = options?.editingExistingImage === true;
  const refCount = Math.max(0, Math.min(6, options?.referenceImageCount ?? 0));
  const posterTextInImage = options?.posterTextInImage === true;
  const wedding = isWeddingOccasion(event);
  const realismRequested = hasRealismIntent(event, guidance);
  const occasionThemeGuardrails = buildOccasionThemeGuardrails(event);
  const pageSurface = surface === "page";
  const gameDay = isGameDayOccasion(event);
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
    ...(refCount > 0 ? buildReferencePhotoPromptRules(guidance, refCount) : []),
    ...(posterTextInImage
      ? [
          "- This is the first render of a live invitation card for Birthday or Wedding. Bake the invitation copy into the raster like cinematic poster art instead of leaving the text for an HTML overlay.",
          "- When uploaded reference photo(s) are present, build the poster around those exact photo(s). Do not swap in unrelated stock people or generic scenery as the main subject.",
          "- For birthdays, when Honoree Name and Age or Milestone are available, make that birthday identity the main visible title hierarchy. Use the user idea as a secondary subtitle, theme line, or mood cue.",
          "- Preserve the exact supplied spelling of names, venue words, and key event terms.",
          `- Visible poster schedule/date lines should omit the year and prefer ${CARD_SCHEDULE_EXAMPLE}; if time is missing, use ${CARD_SCHEDULE_DATE_ONLY_EXAMPLE}.`,
          "- Only show a year in visible poster copy when the user's custom wording explicitly includes that year and it must be preserved.",
          "- Keep venue/location on its own line or separate field rather than merging it into the visible schedule/date line.",
          "- Treat the user's prompt/theme as the dominant art direction.",
          "- Keep the visible copy short and cinematic with a clear invitation/poster hierarchy rather than a plain list of form fields.",
          "- The finished image must read first as a professional hosted event invitation, not merely a cinematic still, venue ad, mascot portrait, or mood board.",
          "- Make the design unmistakably event-oriented and celebratory for the selected occasion, not just a pretty location or character portrait.",
          "- Add strong celebration cues appropriate to the event type so the card reads as a hosted invite: for birthdays, favor party decor, birthday energy, and celebration details; for weddings, favor ceremony, reception, romance, and stationery cues.",
          "- If the concept uses a theater, cinema, screening, or movie-party setting, keep the staging physically correct: seats and audience face the screen, sightlines make sense, and screen-to-seat geometry is believable.",
          "- Never show theater chairs or audience rows facing away from the screen or arranged in impossible directions relative to the screen.",
          "- Do not invent marquee text, venue branding, logos, signage, or event facts that are not explicitly supported by the supplied details, approved invitation copy, or source image.",
          "- The floating action buttons sit low on the card. Keep the lower portion behind them free of visible copy.",
          "- End all visible text comfortably above the button icons. No words, dates, venue lines, captions, or taglines may appear behind the bottom buttons.",
          "- Treat the lowest part of the poster as art-first support for the floating buttons. The final text line must sit clearly above that lower area.",
          "- Do not place marquee wording, signage, decorative captions, or secondary copy in the lowest part of the card.",
        ]
      : []),
    ...(pageSurface
      ? isEditingExistingImage
        ? [
            "- This is an edit of the existing live-card raster. The source may already show headlines, body copy, dates, venue names, logos (for example theater or brand signage), RSVP lines, and decorative lettering.",
            "- Preserve every character of existing visible text, numbers, punctuation, and logos as in the source (same spelling, wording, and approximate placement) unless the user's edit request explicitly names specific text or logos to add, remove, or replace.",
            "- Apply the edit mainly to illustrated or photographic elements: scene, characters, props, lighting, color, atmosphere, and decor (for example balloons or confetti). Do not erase unrelated text or signage to clean the layout.",
            "- Do not introduce new headlines, dates, RSVP lines, or decorative type in the raster unless the edit request explicitly asks for new wording in the image.",
          ]
        : [
            "- This image is the live-card background only. Do not add visible event wording, letters, numbers, captions, logos, monograms, or decorative type anywhere in the raster.",
            "- Preserve clean negative space and readable contrast through the upper and middle zones so deterministic overlay text can sit on top later.",
            "- Keep the background art full-bleed and compositionally strong without relying on text baked into the image.",
          ]
      : ["- Legible typography with editorial hierarchy (headline, subhead, detail lines)."]),
    ...(pageSurface && isEditingExistingImage
      ? [
          "- No QR codes. Do not add new watermarks. Keep logos and brand signage that already appear in the source unless the edit explicitly asks to remove or replace them.",
        ]
      : ["- No QR codes, no watermarks, no logos."]),
    ...(refCount > 0
      ? [
          "- The supplied reference photo(s) may show people: show them prominently in the hero artwork with natural, respectful rendering. This overrides any generic 'avoid faces' guidance.",
        ]
      : ["- Do not include explicit faces unless needed by theme."]),
    ...(wedding
      ? [
          "- Wedding / formal celebration: aim for serious, print-ready stationery—cream, ivory, champagne, soft blush, sage, or navy with restrained gold accents unless the user's palette overrides.",
          ...(pageSurface && !isEditingExistingImage
            ? [
                "- Keep the wedding background refined and premium, but text-free. Avoid faux printed names, dates, letterpress headlines, or stationery wording inside the raster.",
              ]
            : pageSurface && isEditingExistingImage
              ? [
                  "- For wedding edits, keep existing printed-looking copy and embellishments from the source; only refine non-text visuals unless the edit names text changes.",
                ]
              : [
                  "- Typography: elegant high-contrast serif for names or main title; clean sans-serif for date/venue lines. Avoid clip-art hearts, cartoon rings, or childish icons.",
                ]),
          "- Layout: photo-forward hero acceptable (couple portrait, soft florals, foil-line accents, circular or arch masks). Overall look should match boutique invitation suites, not a meme or social sticker pack.",
        ]
      : []),
    ...(gameDay
      ? [
          "- Game Day / sports invitation: make the artwork read as a live game-day invite with sport-specific atmosphere, field, court, arena, rink, or ballpark cues, crowd energy, and arrival-night styling rather than generic athlete action photography.",
          "- Use the provided sport context to steer the scene. If the sport is football, bias to stadium, turf, and Friday-night-light cues; if basketball, arena and court lighting; if baseball or softball, ballpark and diamond cues; if soccer, pitch and stadium cues; if volleyball, court and gym cues; if hockey, rink and arena cues.",
          "- Do not invent team logos, branded uniforms, scoreboard text, mascots, jersey numbers, sponsor marks, or venue signage.",
          "- Do not invent final scores, standings, named players, or branded arena features.",
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
    ...(pageSurface && isEditingExistingImage
      ? [
          "- Preserve the composition, subject placement, lighting, and background art as much as possible while applying the edit.",
        ]
      : []),
    "- Build the artwork around the selected event type first, then express the user's idea through that celebration type.",
    "- Treat the user's idea as the main visual concept when one is provided.",
    ...(pageSurface && isEditingExistingImage
      ? []
      : [
          "- If an age or milestone is provided, let it influence the invitation concept and any short visible copy where appropriate.",
        ]),
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
    ...(pageSurface
      ? isEditingExistingImage
        ? [
            "- Treat existing raster typography and signage as locked: when repainting nearby pixels, keep text sharp, legible, and faithful to the source unless the edit explicitly targets that text.",
          ]
        : [
            "- Visible text is forbidden in the final raster for page/live-card backgrounds.",
            "- Do not embed names, dates, locations, headings, captions, decorative lettering, faux signatures, or microtype anywhere in the image.",
            "- Favor imagery over text density and leave the upper and middle composition readable for overlay copy.",
          ]
      : [
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
          "- Keep all important text in the upper and middle portions of the card.",
          "- Keep essential text out of the bottom action-button zone.",
          "- Leave the lower portion behind the floating buttons free of visible copy.",
          "- End the final text block well above the button icons. If space is tight, shorten the copy instead of moving text lower.",
          "- No words, dates, venue lines, captions, or taglines may appear behind the bottom buttons.",
          "- Treat the lower edge as artwork continuation for the controls. If needed, delete copy instead of lowering it toward the buttons.",
          "- Do not place paragraphs, captions, labels, taglines, decorative badges, or key event details in the bottom button area.",
          "- Avoid crowded text blocks near the bottom edge of the invitation.",
        ]),
    "- Let the background and artwork continue naturally behind the bottom buttons as full-bleed art.",
    "- Do not create a visible footer band, dark strip, boxed zone, or artificial empty shelf at the bottom.",
    "- Do not place important words directly above, behind, or between the bottom buttons.",
    "- These layout instructions are not visible copy. Never print phrases such as action buttons, button row, safe area, safe band, or any other instruction text in the artwork.",
    ...(pageSurface ? [] : ["- No tiny footer copy."]),
    ...(pageSurface
      ? []
      : [
          "- Keep the total amount of visible text low enough that the composition still feels spacious on a mobile card.",
        ]),
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
    renderCoreCreativeInputs(event),
    "",
    "Event details to influence visual style:",
    line("Category", event.category),
    line("Title", event.title),
    line("Occasion", event.occasion),
    line("Event Year", event.eventYear),
    line("Host Name", event.hostName),
    line("Honoree Name", event.honoreeName),
    line("Sport", event.sportType),
    line("Team / Host", event.teamName),
    line("Opponent", event.opponentName),
    line("League / Division", event.leagueDivision),
    line("Age or Milestone", event.ageOrMilestone),
    line("User Idea", event.userIdea),
    line("Description", event.description),
    line("Date", event.date),
    line("Venue", event.venueName),
    line("Broadcast / Stream", event.broadcastInfo),
    line("Parking / Arrival", event.parkingInfo),
    line("Dress Code", event.dressCode),
    renderLinks(event.links),
    "",
    ...(pageSurface ? [] : [renderApprovedInvitationCopy(liveCard)]),
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
    line("Subject Treatment", refCount > 0 ? humanizeSubjectTransformMode(guidance) : "Not requested"),
    line("Likeness Strength", refCount > 0 ? humanizeLikenessStrength(guidance) : "Default"),
    line("Render Style Mode", refCount > 0 ? humanizeVisualStyleMode(guidance) : "Default"),
    line("Emoji Usage", guidance?.includeEmoji === true ? "Allowed" : "Avoid"),
  ].join("\n");
}
