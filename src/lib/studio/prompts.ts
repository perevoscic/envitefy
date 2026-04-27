import type {
  StudioEventDetails,
  StudioGenerationGuidance,
  StudioGenerateSurface,
  StudioInvitationText,
  StudioLiveCardMetadata,
} from "@/lib/studio/types";
import { resolveStudioImageFinishPreset } from "@/lib/studio/image-finish-presets";

const CARD_SCHEDULE_EXAMPLE = "Saturday May 23rd at 12:00 PM";
const CARD_SCHEDULE_DATE_ONLY_EXAMPLE = "Saturday May 23rd";

function line(label: string, value: string | null | undefined): string {
  return `${label}: ${value?.trim().length ? value.trim() : "Not provided"}`;
}

const DESIGN_IDEA_HELPER_TEXT_PATTERN =
  /\bDescribe the visual\/theme direction for the invite(?:\. Flyer uploads can leave this blank if the flyer already sets the look)?\.?/gi;

function sanitizeImagePromptBriefText(value: string | null | undefined): string | undefined {
  if (!value?.trim()) return undefined;
  return value
    .replace(DESIGN_IDEA_HELPER_TEXT_PATTERN, "")
    .replace(/^\s*Design\s+Idea\b:?\s*/i, "")
    .replace(/\bDesign\s+Idea\b/gi, "private visual direction")
    .replace(/\bEvent\s+Details\b/gi, "supporting event details")
    .replace(/\s+/g, " ")
    .trim();
}

function renderLinks(links: StudioEventDetails["links"]): string {
  if (!Array.isArray(links) || links.length === 0) return "Links: None";
  return ["Links:", ...links.slice(0, 8).map((item) => `- ${item.label}: ${item.url}`)].join("\n");
}

function renderCoreCreativeInputs(event: StudioEventDetails): string {
  return [
    "Core creative inputs:",
    line("Selected Event Type", event.category || event.occasion),
    line("Design Idea", sanitizeImagePromptBriefText(event.userIdea)),
    line("Event Details", sanitizeImagePromptBriefText(event.description)),
    line("Honoree / Couple / Main Person", event.honoreeName),
    line("Sport", event.sportType),
    line("Team / Host", event.teamName),
    line("Opponent", event.opponentName),
    line("Age or Milestone", event.ageOrMilestone),
    line("Event Year", event.eventYear),
  ].join("\n");
}

function renderImageCreativeInputs(event: StudioEventDetails): string {
  return [
    "Core creative inputs (internal, not visible copy):",
    line("Selected Event Type", event.category || event.occasion),
    line("Private Visual Direction", sanitizeImagePromptBriefText(event.userIdea)),
    line("Supporting Context", sanitizeImagePromptBriefText(event.description)),
    line("Honoree / Couple / Main Person", event.honoreeName),
    line("Sport", event.sportType),
    line("Team / Host", event.teamName),
    line("Opponent", event.opponentName),
    line("Age or Milestone", event.ageOrMilestone),
    line("Event Year", event.eventYear),
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

function buildOccasionBlob(event: StudioEventDetails): string {
  return [
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
    event.broadcastInfo,
    event.parkingInfo,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function getOccasionType(event: StudioEventDetails):
  | "birthday"
  | "wedding"
  | "baby_shower"
  | "bridal_shower"
  | "anniversary"
  | "housewarming"
  | "field_trip"
  | "game_day"
  | "custom_invite"
  | "general" {
  const blob = buildOccasionBlob(event);

  if (/\bbridal shower\b/.test(blob)) return "bridal_shower";
  if (/\bbaby shower\b/.test(blob)) return "baby_shower";
  if (/\bfield trip\/day\b|\bfield trip\b|\bfield day\b|\bschool day\b|\bschool event\b|\bclass trip\b/.test(blob)) {
    return "field_trip";
  }
  if (
    /\bgame day|matchup|opponent|kickoff|tipoff|first pitch|stadium|arena|rink|ballpark|football|basketball|baseball|soccer|volleyball|hockey|softball|lacrosse\b/.test(
      blob,
    )
  ) {
    return "game_day";
  }
  if (/\bhousewarming|new home|house party|open house\b/.test(blob)) return "housewarming";
  if (/\banniversary\b/.test(blob)) return "anniversary";
  if (/\bbirthday\b/.test(blob)) return "birthday";
  if (/\bwedding|weddings|nuptials|ceremony|reception|save the date|engagement(\s+party)?\b/.test(blob)) {
    return "wedding";
  }
  if (/\bcustom invite\b/.test(blob)) return "custom_invite";
  return "general";
}

export function isWeddingOccasion(event: StudioEventDetails): boolean {
  return getOccasionType(event) === "wedding";
}

function isGameDayOccasion(event: StudioEventDetails): boolean {
  return getOccasionType(event) === "game_day";
}

function isFieldTripOccasion(event: StudioEventDetails): boolean {
  return getOccasionType(event) === "field_trip";
}

function isPosterFirstLiveCardOccasion(event: StudioEventDetails): boolean {
  return getOccasionType(event) !== "general";
}

function buildOccasionThemeGuardrails(event: StudioEventDetails): string[] {
  const occasionType = getOccasionType(event);

  const common = [
    "- Theme words must be interpreted through the selected event type, not as generic standalone scenery.",
    "- If the user names a franchise, place, motif, era, or mood, translate it into a celebration-themed invitation concept for this occasion.",
  ];

  if (occasionType === "birthday") {
    return [
      ...common,
      "- For birthdays, make the theme read as a birthday party with birthday decor and celebration cues. Example: Jurassic Park should become a Jurassic Park birthday party, not just jungle foliage and dinosaurs.",
      "- When appropriate, themeStyle should name the celebration version of the concept, such as Jurassic birthday adventure instead of only jungle dinosaurs.",
      "- When Honoree Name or Age or Milestone is provided, let those details shape the concept so the result feels like that person's party rather than a generic themed scene.",
      "- If the venue wording implies a venue type such as a theater, arcade, park, restaurant, or backyard, reflect that venue context in the celebration scene without inventing branded signage or unsupported venue features.",
    ];
  }

  if (occasionType === "wedding") {
    return [
      ...common,
      "- For weddings, make the theme read as a wedding or save-the-date concept with ceremony, reception, floral, stationery, or romantic celebration cues.",
      "- themeStyle should describe the wedding-themed concept, not only the raw setting or scenery.",
      "- Let venue type, floral palette, and formality cues steer the setting so the result reads like a credible wedding invitation rather than generic romantic scenery.",
      "- If the supplied details describe a single ceremony or evening, keep the concept focused on that event instead of inflating it into an unsupported wedding-weekend concept.",
    ];
  }

  if (occasionType === "baby_shower") {
    return [
      ...common,
      "- For baby showers, make the theme read as a baby shower with baby-shower decor, favors, dessert-table styling, and welcoming celebration cues.",
      "- themeStyle should describe the baby-shower version of the theme, not only the raw setting.",
      "- If the theme suggests a mascot or motif such as teddy bears, moons, clouds, or animals, use one or two hero motifs with restrained prop density instead of cluttering the scene with repeated plush props.",
      "- Let shower palette, gift-table cues, balloon styling, and softness or luxury level shape the setup so the result feels designed rather than crowded.",
    ];
  }

  if (occasionType === "bridal_shower") {
    return [
      ...common,
      "- For bridal showers, make the theme read as a bridal shower with brunch, tea-party, gift-table, floral, and bride-focused celebration cues.",
      "- themeStyle should describe the bridal-shower version of the theme, not only the raw setting.",
      "- Favor one polished hosting moment, such as a brunch table, tea service, or gift-table setup, instead of a collage of repeated tables or duplicated garden vignettes.",
      "- Let the bride's name, shower style, floral palette, and venue type guide the mood so the result feels premium and intentionally hosted.",
    ];
  }

  if (occasionType === "game_day") {
    return [
      ...common,
      "- For Game Day, make the theme read as a real sports-event invitation with matchup energy, crowd atmosphere, sport-specific setting cues, and game-night presentation rather than a generic athlete poster or random action shot.",
      "- themeStyle should describe the game-day version of the theme, not only the raw sport or venue.",
      "- When team, opponent, or school colors are provided, use them to make the atmosphere feel specific and guest-useful without inventing logos, mascots, or branded signage.",
      "- Favor one coherent hero sports moment and clear stadium or arena context over generic poster clutter, redundant action scenes, or unsupported scoreboard text.",
    ];
  }

  if (occasionType === "anniversary") {
    return [
      ...common,
      "- For anniversaries, make the theme read as an anniversary celebration with elegant party styling and couple-centered celebration cues.",
      "- themeStyle should describe the anniversary-themed concept, not only the raw setting.",
      "- If a milestone year implies a traditional material or palette such as silver or gold, let that influence the decor and color story so the milestone reads visually.",
      "- If dinner, toasts, dancing, or live music are mentioned, reflect them subtly in the celebration scene instead of reducing the invite to flowers and candles alone.",
    ];
  }

  if (occasionType === "housewarming") {
    return [
      ...common,
      "- For housewarmings, make the theme read as a welcoming hosted gathering with home-party decor and hosting cues.",
      "- themeStyle should describe the housewarming version of the theme, not only the raw setting.",
      "- Let the home style and hosting style shape the scene so it feels like a warm lived-in gathering rather than an empty real-estate rendering.",
      "- Use hospitality cues such as food, drinks, music, open doors, patio seating, or neighborhood welcome energy when supported by the event details.",
    ];
  }

  if (occasionType === "field_trip") {
    return [
      ...common,
      "- For field trips or school-day invites, make the theme read as an organized school event with group-activity and school-planning cues.",
      "- themeStyle should describe the school-event version of the theme, not only the raw setting.",
      "- Prioritize landmark or venue realism, believable camera angles, and documentary credibility over impossible architecture or theme-park stylization.",
      "- Let student age group, destination type, teacher or docent presence, and organized outing cues shape the scene so it reads like a real school trip.",
      "- Frame the concept as an upcoming educational visit or discovery day, not as a souvenir, tourism ad, or retrospective memory piece.",
      "- When no user photos are supplied, avoid making one specific posed student group feel like the authors of the invitation; keep the artwork destination-led and broadly representative of the future outing.",
    ];
  }

  return [
    ...common,
    "- Keep the final concept invitation-ready and celebration-oriented rather than drifting into generic scenery.",
    "- themeStyle should describe the invitation-ready version of the concept, not only the raw setting.",
    "- Let the event purpose, host or honoree identity, venue type, and hosting mood shape the result so the image feels custom to the occasion.",
  ];
}

function buildPosterFirstInvitationCopyRules(event: StudioEventDetails): string[] {
  switch (getOccasionType(event)) {
    case "birthday":
      return [
        "- For birthdays, when Honoree Name and Age or Milestone are available, make the main invitation title center on that person's name and milestone first. If helpful, distill the Design Idea into a polished guest-facing mood line instead of turning raw Design Idea wording into the dominant birthday headline.",
        "- Make the wording feel like a real birthday invitation with party decor, hosted-event energy, and celebration cues instead of a themed scene description alone.",
        "- When venue type or party format is clear, let it influence the supporting line so the copy sounds like an actual hosted birthday plan rather than generic theme words.",
      ];
    case "wedding":
      return [
        "- For weddings, make the couple names, wedding title, or save-the-date identity the main invitation hierarchy first. Treat the Design Idea as romantic mood or stationery direction, not raw subtitle copy to repeat verbatim.",
        "- Make the wording feel like a real wedding invitation with ceremony, reception, romance, and premium stationery cues instead of a venue mood board alone.",
        "- If the event wording points to a ceremony, reception, dinner, or wedding weekend, make the scope explicit and credible instead of mixing several unsupported wedding formats together.",
      ];
    case "baby_shower":
      return [
        "- For baby showers, make the honoree name, baby name, or baby shower title the main invitation hierarchy first. If needed, distill the Design Idea into a guest-facing mood cue rather than repeating raw Design Idea wording.",
        "- Make the wording feel like a real baby shower invitation with shower decor, balloons, favors, dessert-table styling, and welcoming hosted-celebration cues instead of generic pastel scenery.",
        "- Keep the supporting line focused on one or two motifs or palette cues instead of listing every prop or mascot in the room.",
      ];
    case "bridal_shower":
      return [
        "- For bridal showers, make the bride's name or bridal shower title the main invitation hierarchy first. If needed, distill the Design Idea into a guest-facing brunch, floral, tea-party, or shower mood line rather than quoting it.",
        "- Make the wording feel like a real bridal shower invitation with bride-focused celebration, brunch or tea cues, florals, and gift-table energy instead of generic garden scenery.",
        "- Favor polished shower language that sounds hosted and premium rather than collage-like or overdescriptive.",
      ];
    case "anniversary":
      return [
        "- For anniversaries, make the couple names, anniversary title, or milestone year the main invitation hierarchy first. If needed, distill the Design Idea into a guest-facing mood line or dinner-party direction rather than repeating raw prompt fragments.",
        "- Make the wording feel like a real anniversary celebration with candles, dinner, roses, toasts, dancing, and couple-centered event cues instead of only a romantic scene.",
        "- When a milestone year implies silver, gold, or another traditional anniversary cue, let that appear in the wording only if supported by the event details.",
      ];
    case "housewarming":
      return [
        "- For housewarmings, make the host names, housewarming title, or new-home identity the main invitation hierarchy first. If needed, distill the Design Idea into a guest-facing home-party mood line rather than quoting it.",
        "- Make the wording feel like a real housewarming with welcoming hosted-gathering cues, home-tour energy, table styling, drinks, and lived-in hospitality instead of an empty real-estate interior.",
        "- Let the supporting line suggest gathering warmth, food, drinks, music, or neighborhood welcome when the details support it.",
      ];
    case "field_trip":
      return [
        "- For field trips or school days, make the event title, school outing name, or destination title the main invitation hierarchy first. If needed, distill the Design Idea into a guest-facing activity or discovery line rather than repeating raw prompt fragments.",
        "- Make the wording feel like a real organized school outing with field-trip planning, museum or exhibit cues, student group activity, and teacher or chaperone context instead of a generic brochure headline.",
        "- Keep the copy documentary and destination-led rather than promotional, cinematic, or tourist-brochure-like.",
        "- Phrase the invite like an upcoming visit, not like the pictured students already hosted, designed, or commemorated the event.",
      ];
    case "game_day":
      return [
        "- For Game Day, make the matchup, team, or game-day title the main invitation hierarchy first. If needed, distill the Design Idea into a guest-facing energy or atmosphere line rather than repeating raw prompt fragments.",
        "- Make the wording feel like a real game-day invite or attendance card with stadium energy, crowd cues, arrival-night information, and sport-specific framing instead of a generic sports poster or season recap.",
        "- When team, opponent, league, or school-color cues are available, use them to make the copy feel specific without inventing slogans, mascots, or branded phrasing.",
      ];
    case "custom_invite":
      return [
        "- For custom invites, make the event title, honoree, or host identity the main invitation hierarchy first. If needed, distill the Design Idea into a guest-facing mood line rather than letting raw prompt wording replace the event identity.",
        "- Make the wording feel like a real hosted invitation with celebration decor, event styling, and invitation intent instead of a bare loft, venue, or mood-board scene.",
        "- Let the event purpose do more work than the venue aesthetic so appreciation nights, launches, dinners, and socials do not collapse into generic networking copy.",
      ];
    default:
      return [];
  }
}

export function buildInvitationTextPrompt(
  event: StudioEventDetails,
  guidance?: StudioGenerationGuidance,
): string {
  const includeEmoji = guidance?.includeEmoji === true ? "Allowed" : "Avoid";
  const posterFirstLiveCard = isPosterFirstLiveCardOccasion(event);
  const gameDay = isGameDayOccasion(event);
  const occasionThemeGuardrails = buildOccasionThemeGuardrails(event);
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
    "- Treat the Design Idea as private art direction for themeStyle, palette, and artwork concept when one is provided.",
    "- Treat Event Details, names, date/time, venue, and RSVP fields as the source of guest-facing copy.",
    "- Design Idea is private art direction, not default visible invitation copy.",
    "- Guest-facing invitation copy fields must not introduce Design Idea-only nouns, motifs, props, animals, places, or prompt fragments.",
    "- Do not quote, restate, or lightly paraphrase raw Design Idea wording as a title, subtitle, theme line, opening line, schedule line, or other visible invitation copy unless the user explicitly asked for that exact wording to appear.",
    "- If the Design Idea contains prompt-like visual fragments such as 'realistic festive cats at the movie', translate that into imagery and mood instead of printing it as guest-facing copy.",
    "- If an age or milestone is provided, incorporate it naturally into the invitation concept or copy when helpful.",
    "- Preserve the exact spelling of names, titles, venues, and event words from the provided details.",
    "- Double-check every visible word for spelling before returning JSON.",
    "- Do not stylize by misspelling or swapping letters unless the user explicitly supplied that wording.",
    "- Do not repeat or duplicate the same visible word, title, or phrase across multiple invitation lines unless the user explicitly asked for repetition.",
    "- Keep copy compact enough to fit in the upper and middle card area without pushing essential text into the lower action-button zone.",
    ...(posterFirstLiveCard
      ? [
          "- Keep the invitation hierarchy short, cinematic, and poster-ready rather than reading like flat form fields.",
          "- Treat the Design Idea as dominant art direction for themeStyle, palette, and artwork mood; derive visible wording from event details.",
          "- Make the wording read unmistakably as a hosted celebration invitation, not just a description of a place, backdrop, or scene.",
          "- Bring celebration energy into the copy with event-oriented language, invitation intent, and occasion cues.",
          "- Never add the year to schedule/date wording unless the user's custom wording explicitly includes that year.",
          ...buildPosterFirstInvitationCopyRules(event),
        ]
      : []),
    ...(gameDay
      ? [
          "- For Game Day, make the copy read as a real game-day invitation or attendance page, not a generic sports poster, recap, or highlight reel.",
          "- Use the supplied sport, team, opponent, league, broadcast, and parking details when present, but do not invent unsupported scores, records, player names, uniforms, logos, mascots, sponsors, or venue claims.",
        ]
      : []),
    ...occasionThemeGuardrails,
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
    line("Design Idea", sanitizeImagePromptBriefText(event.userIdea)),
    line("Event Details", sanitizeImagePromptBriefText(event.description)),
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
  const posterFirstLiveCard = isPosterFirstLiveCardOccasion(event);
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
    "- Do not repeat or duplicate the same visible word, title, or phrase across multiple invitation fields unless the user explicitly asked for repetition.",
    "- Copy must be layout-safe: keep every text field short enough for a mobile invitation card.",
    "- Keep invitation copy compact so essential wording stays out of the lower action-button zone.",
    "- Important wording should stay in the upper and middle portions of the card, not the lower action-button zone.",
    "- Resolve the final visible text line well above the bottom action buttons. If space is tight, shorten copy instead of pushing it lower.",
    "- Prefer fewer words over crowded copy.",
    `- \`invitation.scheduleLine\` is for visible date/time only. Prefer ${CARD_SCHEDULE_EXAMPLE}; if time is missing, use ${CARD_SCHEDULE_DATE_ONLY_EXAMPLE}. Keep venue/location on \`invitation.locationLine\`, not inside \`invitation.scheduleLine\`.`,
    "- Visible card schedule/date lines should omit the year unless the user explicitly typed year wording that must be preserved.",
    "- Build the live card around the selected event type first, then express the Design Idea through that celebration type.",
    "- Treat the Design Idea as private art direction for themeStyle, palette, and artwork concept when one is provided.",
    "- Treat Event Details, names, date/time, venue, and RSVP fields as the source of guest-facing copy.",
    "- Design Idea is private art direction, not default visible invitation copy.",
    "- Guest-facing invitation copy fields must not introduce Design Idea-only nouns, motifs, props, animals, places, or prompt fragments.",
    "- Do not quote, restate, or lightly paraphrase raw Design Idea wording as a title, subtitle, theme line, opening line, schedule line, or other visible invitation copy unless the user explicitly asked for that exact wording to appear.",
    "- If the Design Idea contains prompt-like visual fragments such as 'realistic festive cats at the movie', translate that into imagery and mood instead of printing it as guest-facing copy.",
    "- If an age or milestone is provided, work it into the copy or concept naturally when it adds clarity.",
    "- Treat explicit user visual instructions as the highest-priority requirement.",
    "- Do not replace a literal user request with a cuter or more whimsical version of the theme.",
    "- Avoid novelty puns, mascot language, and jokey rewrites unless the user explicitly asked for them.",
    ...(posterFirstLiveCard
      ? [
          "- For live cards, write short cinematic invitation copy with a poster-like hierarchy instead of flat form-field phrasing.",
          "- Treat the Design Idea as dominant art direction for themeStyle, palette, and artwork mood; derive visible wording from event details.",
          "- Make the result read first as a real celebration invite for this event type, not simply a stylish scene description.",
          "- Bring clear party / celebration / hosted-event energy into the concept and invitation copy.",
          "- Do not invent venue brands, marquee names, signage wording, or unsupported event facts in the copy.",
          "- Never add the year to schedule/date wording unless the user's custom wording explicitly includes that year.",
          ...buildPosterFirstInvitationCopyRules(event),
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
    line("Design Idea", sanitizeImagePromptBriefText(event.userIdea)),
    line("Event Details", sanitizeImagePromptBriefText(event.description)),
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

function trimOrEmpty(value: string | null | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

const PRIVATE_VISUAL_DIRECTION_COPY_STOP_WORDS = new Set([
  "about",
  "above",
  "after",
  "again",
  "against",
  "all",
  "also",
  "and",
  "any",
  "are",
  "around",
  "art",
  "at",
  "back",
  "background",
  "bash",
  "beautiful",
  "bold",
  "bright",
  "card",
  "celebrate",
  "celebration",
  "classic",
  "clean",
  "color",
  "colors",
  "concept",
  "copy",
  "dark",
  "day",
  "design",
  "direction",
  "elegant",
  "event",
  "festive",
  "for",
  "fun",
  "gold",
  "golden",
  "guest",
  "guests",
  "high",
  "idea",
  "image",
  "in",
  "invite",
  "invitation",
  "join",
  "layout",
  "light",
  "lighting",
  "like",
  "look",
  "make",
  "modern",
  "mood",
  "night",
  "one",
  "party",
  "photo",
  "photorealistic",
  "playful",
  "premium",
  "real",
  "realistic",
  "romantic",
  "scene",
  "soft",
  "style",
  "stylized",
  "theme",
  "the",
  "to",
  "tone",
  "under",
  "vibe",
  "visual",
  "warm",
  "with",
  "you",
  "your",
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
]);

function normalizeVisibleCopyToken(value: string): string {
  let token = value
    .toLowerCase()
    .replace(/^['-]+|['-]+$/g, "")
    .replace(/'s$/g, "");
  if (token.length > 4 && token.endsWith("ies")) {
    token = `${token.slice(0, -3)}y`;
  } else if (token.length > 3 && token.endsWith("s")) {
    token = token.slice(0, -1);
  }
  return token;
}

function collectVisibleCopyTokens(value: string | null | undefined): Set<string> {
  const tokens = new Set<string>();
  const matches = trimOrEmpty(value).match(/[a-z0-9]+(?:['-][a-z0-9]+)?/gi) || [];
  for (const raw of matches) {
    const token = normalizeVisibleCopyToken(raw);
    if (token.length < 3 || PRIVATE_VISUAL_DIRECTION_COPY_STOP_WORDS.has(token)) continue;
    tokens.add(token);
  }
  return tokens;
}

function buildEventVisibleCopySource(event: StudioEventDetails): string {
  return [
    event.title,
    event.category,
    event.occasion,
    event.eventYear,
    event.hostName,
    event.honoreeName,
    event.sportType,
    event.teamName,
    event.opponentName,
    event.leagueDivision,
    event.broadcastInfo,
    event.parkingInfo,
    event.ageOrMilestone,
    event.description,
    event.date,
    event.startTime,
    event.endTime,
    event.timezone,
    event.venueName,
    event.venueAddress,
    event.dressCode,
    event.rsvpBy,
    event.rsvpContact,
    event.registryNote,
    ...(event.links || []).flatMap((item) => [item.label, item.url]),
  ]
    .filter(Boolean)
    .join(" ");
}

function getPrivateVisualDirectionOnlyTokens(event: StudioEventDetails): Set<string> {
  const privateTokens = collectVisibleCopyTokens(event.userIdea);
  if (privateTokens.size === 0) return privateTokens;
  const allowedTokens = collectVisibleCopyTokens(buildEventVisibleCopySource(event));
  return new Set([...privateTokens].filter((token) => !allowedTokens.has(token)));
}

function containsPrivateVisualDirectionOnlyToken(
  event: StudioEventDetails,
  value: string | null | undefined,
): boolean {
  const privateOnlyTokens = getPrivateVisualDirectionOnlyTokens(event);
  if (privateOnlyTokens.size === 0) return false;
  const valueTokens = collectVisibleCopyTokens(value);
  if ([...valueTokens].some((token) => privateOnlyTokens.has(token))) return true;
  const rawValue = trimOrEmpty(value);
  if (!rawValue.includes("#")) return false;
  const compactValue = rawValue
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  return [...privateOnlyTokens].some(
    (token) =>
      compactValue === token ||
      compactValue.endsWith(token) ||
      compactValue.endsWith(`${token}s`) ||
      compactValue.startsWith(`${token}s`),
  );
}

function removePrivateVisualDirectionOnlyTokens(
  event: StudioEventDetails,
  value: string,
): string {
  const privateOnlyTokens = getPrivateVisualDirectionOnlyTokens(event);
  if (privateOnlyTokens.size === 0) return value;
  const withoutPrivateTerms = value.replace(
    /[a-z0-9]+(?:['-][a-z0-9]+)?/gi,
    (raw) => (privateOnlyTokens.has(normalizeVisibleCopyToken(raw)) ? "" : raw),
  );
  return withoutPrivateTerms
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/,\s*,+/g, ",")
    .replace(/,\s*(and|or)\s*([,.;:!?])/gi, "$2")
    .replace(/(^|[.!?]\s+)(and|or)\s+/gi, "$1")
    .replace(/\b(for|with|featuring|including)\s+(and|or)\s+/gi, "$1 ")
    .replace(/\b(the|a|an)\s*([,.;:!?])/gi, "$2")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/\b(with|for|at|in|on|to|of|from|by|featuring|including)\s*([.!?])?$/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\(\s*\)/g, "")
    .replace(/\[\s*\]/g, "")
    .replace(/\s+$/g, "")
    .replace(/^\s*[,.;:!?]\s*/g, "")
    .trim();
}

function sanitizeVisibleCopyLineForPrivateVisualDirection(
  event: StudioEventDetails,
  value: string | null | undefined,
): string {
  const trimmed = trimOrEmpty(value);
  if (!trimmed) return "";
  if (!containsPrivateVisualDirectionOnlyToken(event, trimmed)) return trimmed;
  const cleaned = removePrivateVisualDirectionOnlyTokens(event, trimmed);
  return collectVisibleCopyTokens(cleaned).size > 0 ? cleaned : "";
}

function sanitizeStudioInvitationVisibleCopy(
  event: StudioEventDetails,
  invitation: StudioInvitationText,
): StudioInvitationText {
  return {
    title: sanitizeVisibleCopyLineForPrivateVisualDirection(event, invitation.title) || trimOrEmpty(event.title),
    subtitle: sanitizeVisibleCopyLineForPrivateVisualDirection(event, invitation.subtitle),
    openingLine: sanitizeVisibleCopyLineForPrivateVisualDirection(event, invitation.openingLine),
    scheduleLine: sanitizeVisibleCopyLineForPrivateVisualDirection(event, invitation.scheduleLine),
    locationLine: sanitizeVisibleCopyLineForPrivateVisualDirection(event, invitation.locationLine),
    detailsLine: sanitizeVisibleCopyLineForPrivateVisualDirection(event, invitation.detailsLine),
    callToAction: sanitizeVisibleCopyLineForPrivateVisualDirection(event, invitation.callToAction),
    socialCaption: sanitizeVisibleCopyLineForPrivateVisualDirection(event, invitation.socialCaption),
    hashtags: invitation.hashtags.filter(
      (tag) => !containsPrivateVisualDirectionOnlyToken(event, tag),
    ),
  };
}

export function sanitizeStudioLiveCardVisibleCopy(
  event: StudioEventDetails,
  liveCard: StudioLiveCardMetadata,
): StudioLiveCardMetadata {
  const invitation = sanitizeStudioInvitationVisibleCopy(event, liveCard.invitation);
  const title =
    sanitizeVisibleCopyLineForPrivateVisualDirection(event, liveCard.title) ||
    invitation.title ||
    trimOrEmpty(event.title) ||
    liveCard.title;
  const description =
    sanitizeVisibleCopyLineForPrivateVisualDirection(event, liveCard.description) ||
    sanitizeVisibleCopyLineForPrivateVisualDirection(event, event.description) ||
    invitation.openingLine ||
    title;
  const ctaLabel =
    sanitizeVisibleCopyLineForPrivateVisualDirection(event, liveCard.interactiveMetadata.ctaLabel) ||
    invitation.callToAction ||
    "RSVP";
  const shareNote =
    sanitizeVisibleCopyLineForPrivateVisualDirection(event, liveCard.interactiveMetadata.shareNote) ||
    invitation.socialCaption ||
    description;

  return {
    ...liveCard,
    title,
    description,
    interactiveMetadata: {
      ...liveCard.interactiveMetadata,
      rsvpMessage:
        sanitizeVisibleCopyLineForPrivateVisualDirection(
          event,
          liveCard.interactiveMetadata.rsvpMessage,
        ) || "Let us know if you can make it.",
      funFacts: liveCard.interactiveMetadata.funFacts.filter(
        (item) => !containsPrivateVisualDirectionOnlyToken(event, item),
      ),
      ctaLabel,
      shareNote,
    },
    invitation,
  };
}

function buildApprovedVisibleCopySection(
  event: StudioEventDetails,
  liveCard?: StudioLiveCardMetadata | null,
): string {
  const visibleLiveCard = liveCard ? sanitizeStudioLiveCardVisibleCopy(event, liveCard) : null;
  const invitationOpeningLine = trimOrEmpty(visibleLiveCard?.invitation?.openingLine);
  const shortOpeningLine =
    invitationOpeningLine &&
    invitationOpeningLine.split(/\s+/).length <= 8 &&
    invitationOpeningLine.length <= 64
      ? invitationOpeningLine
      : "";
  const lines = [
    line(
      "Main Title",
      trimOrEmpty(visibleLiveCard?.title) ||
        trimOrEmpty(visibleLiveCard?.invitation?.title) ||
        trimOrEmpty(event.title),
    ),
    line("Subtitle / Theme Line", trimOrEmpty(visibleLiveCard?.invitation?.subtitle)),
    line("Opening Line", shortOpeningLine),
    line("Schedule Line", trimOrEmpty(visibleLiveCard?.invitation?.scheduleLine)),
    line("Location Line", trimOrEmpty(visibleLiveCard?.invitation?.locationLine)),
  ].filter((item) => !item.endsWith("Not provided"));

  if (lines.length === 0) return "";

  return [
    "Approved invitation copy to use verbatim if visible text appears in the artwork:",
    ...lines,
  ].join("\n");
}

export function buildInvitationImagePrompt(
  event: StudioEventDetails,
  guidance?: StudioGenerationGuidance,
  liveCard?: StudioLiveCardMetadata | null,
  options?: {
    surface?: StudioGenerateSurface;
    editingExistingImage?: boolean;
    referenceImageCount?: number;
  },
): string {
  const surface = options?.surface === "page" ? "page" : "image";
  const isEditingExistingImage = options?.editingExistingImage === true;
  const refCount = Math.max(0, Math.min(6, options?.referenceImageCount ?? 0));
  const wedding = isWeddingOccasion(event);
  const fieldTrip = isFieldTripOccasion(event);
  const realismRequested = hasRealismIntent(event, guidance);
  const occasionThemeGuardrails = buildOccasionThemeGuardrails(event);
  const pageSurface = surface === "page";
  const gameDay = isGameDayOccasion(event);
  const approvedVisibleCopy = buildApprovedVisibleCopySection(event, liveCard);
  const imageFinishPreset = resolveStudioImageFinishPreset(
    event.category || event.occasion,
    guidance?.imageFinishPreset,
  );
  return [
    isEditingExistingImage
      ? "Edit the provided invitation artwork image."
      : "Create one invitation artwork image.",
    ...(refCount > 0
      ? [
          isEditingExistingImage
            ? `USER PHOTOS IN THE FLYER (NOT A SIDEBAR): After the first image (the current invitation card), ${refCount} user-uploaded photo(s) follow in order. Rebuild the artwork so those photos are the dominant visual, typically as the upper ~45–60% hero with a soft feathered blend into cream or tonal negative space. Preserve recognizable likeness of people. Do not leave user photos only as a tiny strip or thumbnail; they must read as the invitation background's main photograph.`
            : `USER PHOTOS IN THE FLYER (NOT A SIDEBAR): Before this text prompt, ${refCount} user-uploaded photo(s) appear in order. The final invitation MUST weave these into the card background and hero art: large focal photo (upper ~45–60% of the canvas), cinematic blend or vignette into the rest of the design, and clean negative space for later overlays. Preserve recognizable likeness. Forbidden: tucking user photos into a small gallery row while generating unrelated stock people or generic art as the main visual.`,
        ]
      : []),
    "Style requirements:",
    ...(imageFinishPreset
      ? [
          `- Selected image finish preset: ${imageFinishPreset.label} - ${imageFinishPreset.description}.`,
          "- Treat the selected image finish preset as a high-priority finishing direction for mood, polish, lighting, palette handling, and contrast while still obeying the selected event type, approved event details, and the user's private visual direction.",
        ]
      : []),
    "- High-quality vertical invitation card composition (9:16 mobile card).",
    "- Create one single seamless full-bleed invitation image with one unified continuous scene from top to bottom.",
    "- This is a finished invitation poster image, not a screenshot and not an app UI mockup.",
    "- Bake the invitation text directly into the image itself so it feels like part of the printed or designed artwork, not a separate overlay.",
    "- Treat all visible text as integrated invitation typography inside the scene, not as interface chrome or floating app labels.",
    "- Form labels, section headings, prompt labels, and instruction text are internal only. Never print them anywhere in the image.",
    "- Keep lighting, perspective, depth, and environment continuous across the full card.",
    "- Do not split the composition into separate top and bottom scenes.",
    "- Do not create a collage, stacked sections, framed panels, segmented card design, or a horizontal text band dividing two scenes.",
    "- Never compose the image as top scene plus text band plus bottom scene.",
    "- Use a restrained premium invitation hierarchy: one clear headline, optional short subtitle or opening line, and short event-detail lines only when supported by the event details.",
    "- Use at most one short supporting line beyond the title and event details. Do not create body-paragraph blocks, prose descriptions, or multi-sentence copy sections.",
    "- Do not repeat or duplicate any visible words or phrases in the image.",
    "- Do not generate extra paragraphs, filler copy, repeated titles, duplicated names, duplicated schedule lines, or decorative nonsense typography.",
    "- Do not duplicate or mirror scene elements. Avoid repeated tables, repeated floral arrangements, repeated gazebos, repeated desserts, repeated arches, repeated portraits, or second copies of the main scene stacked elsewhere in the card.",
    "- Do not create an unrelated solid bar, footer slab, color block, green strip, dark strip, or banner panel near the bottom of the card.",
    "- Treat all visible text as post-production-grade invitation copy, not generic placeholder wording.",
    "- Do not generate any UI elements, interface overlays, app controls, buttons, icons, badges, arrows, floating controls, share symbols, chat symbols, phone symbols, plus buttons, camera buttons, circular controls, watermarks, or screenshot-style overlays.",
    "- Keep the top edge free of faux phone UI: no carrier names, clock text, battery icons, signal icons, status icons, notches, camera cutouts, or device chrome.",
    "- Keep the bottom action-button zone art-only and text-free. End the final visible text line well above the bottom controls area.",
    "- Do not place any visible text, captions, labels, taglines, icons, buttons, or decorative badges in the bottom button area.",
    "- Let the artwork continue naturally behind the bottom buttons as full-bleed art; do not create a footer strip, boxed shelf, or empty tray.",
    "- The output must read as one clean continuous invitation image, not a screenshot, poster mockup, or app capture.",
    ...(approvedVisibleCopy
      ? [
          "- Use only the approved invitation copy below for visible wording in the artwork. Preserve spelling exactly and do not duplicate lines.",
          "- The approved invitation copy is the complete visible-text whitelist. Do not add extra visible words from Private Visual Direction, Theme Style, Style guidance, or other internal art-direction fields.",
        ]
      : [
          "- If visible copy is needed, use only directly supported event details from this prompt. Do not invent unsupported slogans, RSVP lines, footer labels, or extra wording.",
          "- Private Visual Direction may influence imagery, props, styling, and mood, but it is not a source for visible invitation words.",
        ]),
    ...(refCount > 0 ? buildReferencePhotoPromptRules(guidance, refCount) : []),
    ...(pageSurface
      ? isEditingExistingImage
        ? [
            "- This is an edit of the existing live-card raster. The source may already show headlines, body copy, dates, venue names, logos (for example theater or brand signage), RSVP lines, and decorative lettering.",
            "- Preserve every character of existing visible text, numbers, punctuation, and logos as in the source (same spelling, wording, and approximate placement) unless the user's edit request explicitly names specific text or logos to add, remove, or replace.",
            "- Apply the edit mainly to illustrated or photographic elements: scene, characters, props, lighting, color, atmosphere, and decor (for example balloons or confetti). Do not erase unrelated text or signage to clean the layout.",
            "- Do not introduce new headlines, dates, RSVP lines, or decorative type in the raster unless the edit request explicitly asks for new wording in the image.",
          ]
        : [
            "- This image is a finished live-card invitation raster, not a blank background.",
            "- Visible event wording belongs in the raster for this live card, but it must feel like part of one designed invitation composition rather than detached overlay text.",
            "- Keep the text concentrated in the upper and middle portions of the card and resolve the final visible text line well above the bottom action buttons.",
            "- Do not draw interface elements in the raster: no buttons, icons, circular controls, pill-shaped bars, chat inputs, nav bars, status bars, carrier labels, clock readouts, battery indicators, notches, home indicators, camera cutouts, or device chrome.",
            "- Keep the typography elegant, readable, and invitation-first, not like a flyer app screenshot or a dense poster wall of text.",
          ]
      : [
          "- This image is a finished invitation raster rather than empty background art.",
          "- Visible event wording should feel integrated into the invitation design instead of floating like app overlay text.",
          "- Keep the typography elegant, readable, and invitation-first, not like a screenshot, flyer editor, or generic poster template.",
        ]),
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
                "- Keep the wedding invitation refined and premium. Use restrained elegant typography and avoid duplicated vows copy, repeated names, or repeated wedding-weekend wording.",
              ]
            : pageSurface && isEditingExistingImage
              ? [
                  "- For wedding edits, keep existing printed-looking copy and embellishments from the source; only refine non-text visuals unless the edit names text changes.",
                ]
              : []),
          "- Layout: photo-forward hero acceptable (couple portrait, soft florals, foil-line accents, circular or arch masks). Overall look should match boutique invitation suites, not a meme or social sticker pack.",
        ]
      : []),
    ...(fieldTrip
      ? [
          "- Field trip / school outing invitation: make the artwork read as a future organized visit, discovery day, or school excursion rather than a souvenir poster from a completed trip.",
          "- If no user photos are supplied, avoid making one tightly posed identifiable student group the dominant hero. Prefer destination-led composition, guide-led discovery moments, or broader documentary school-trip staging.",
          "- Do not imply that the depicted students designed, printed, or are personally presenting the invitation. Any people shown should read as general participants in the outing, not as the authors of the card.",
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
    "- Build the artwork around the selected event type first, then express the private visual direction through that celebration type.",
    "- Treat the private visual direction as the main visual concept when one is provided.",
    "- Let supporting event details sharpen specificity and approved wording, but do not let them replace the private visual direction.",
    "- The private visual direction is art direction only, not default visible invitation copy in the artwork.",
    "- Never print raw private visual direction wording or prompt fragments in the artwork unless the user explicitly requested that exact phrase as visible copy.",
    "- If the private visual direction includes a noun or motif that is absent from the approved invitation copy and event details, show it visually only; do not print that noun or motif as text.",
    "- If the private visual direction contains prompt-like visual fragments such as 'realistic festive cats at the movie', translate that into imagery and mood instead of treating it as approved subtitle or headline text.",
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
          "- If event details are incomplete, use tasteful visual motifs and composition instead of placeholder wording.",
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
            "- Visible invitation text is required in the final raster for page/live-card images, but keep it sparse, readable, and intentionally designed.",
            "- Do not scatter text across the entire card. Use a clear hierarchy in the upper and middle zones and keep the lower action-button zone free of visible wording.",
            "- Do not embed faux footer microtype, button labels, RSVP instructions, or UI-like labels anywhere in the image.",
          ]
      : [
          "- Visible invitation text is allowed in the final raster, but it must be intentional, sparse, and supported by the supplied event details.",
          "- Do not embed random filler microtype, extra footer labels, screenshot captions, or unsupported wording anywhere in the image.",
          "- Favor strong imagery with readable integrated typography instead of overcrowding the card with copy.",
          "- Keep the top edge free of faux phone UI: no carrier names, clock text, battery icons, signal icons, status icons, notches, camera cutouts, or device chrome.",
          "- Keep the lower portion reserved visually for the app action buttons without turning it into a blank tray or fake footer.",
          "- Treat the lower edge as artwork continuation behind the app action buttons.",
          "- The lower zone must stay decorative rather than UI-like: do not invent buttons, icons, icon clusters, circular controls, pills, chips, chat bars, nav bars, progress dots, home indicators, or device chrome.",
          "- Do not place captions, labels, taglines, schedule lines, location lines, decorative badges, or faux footer details in the bottom button area.",
          "- Avoid crowded faux-layout structures near the bottom edge of the invitation.",
        ]),
    "- Let the background and artwork continue naturally behind the bottom buttons as full-bleed art.",
    "- Keep the top edge art-led and decorative, not blank, but never let it read like a mobile status bar or phone frame.",
    "- Do not create a visible footer band, dark strip, boxed zone, or artificial empty shelf at the bottom.",
    "- Do not create a colored footer slab, tinted rectangle, or unrelated graphic block at the bottom edge.",
    "- Keep the bottom area art-led and decorative, not blank, but never let it read like a mobile app UI or control tray.",
    "- Do not place important words directly above, behind, or between the bottom buttons.",
    "- These layout instructions are not visible copy. Never print phrases such as action buttons, button row, safe area, safe band, or any other instruction text in the artwork.",
    ...(pageSurface ? [] : ["- No footer copy, microtype, or faux labels."]),
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
    renderImageCreativeInputs(event),
    ...(approvedVisibleCopy ? ["", approvedVisibleCopy] : []),
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
    line("Private Visual Direction", sanitizeImagePromptBriefText(event.userIdea)),
    line("Supporting Context", sanitizeImagePromptBriefText(event.description)),
    line("Date", event.date),
    line("Venue", event.venueName),
    line("Broadcast / Stream", event.broadcastInfo),
    line("Parking / Arrival", event.parkingInfo),
    line("Dress Code", event.dressCode),
    renderLinks(event.links),
    "",
    liveCard
      ? [
          "",
          "Secondary live card styling metadata only:",
          line("Theme Style", liveCard.themeStyle),
          line(
            "Palette",
            `${liveCard.palette.primary}, ${liveCard.palette.secondary}, ${liveCard.palette.accent}`,
          ),
        ].join("\n")
      : "",
    "",
    "Design direction:",
    line("Tone", sanitizeImagePromptBriefText(guidance?.tone)),
    line("Visual Style", sanitizeImagePromptBriefText(guidance?.style)),
    line("Audience", sanitizeImagePromptBriefText(guidance?.audience)),
    line("Color Palette", sanitizeImagePromptBriefText(guidance?.colorPalette)),
    line("Image Finish Preset", imageFinishPreset?.label),
    line("Subject Treatment", refCount > 0 ? humanizeSubjectTransformMode(guidance) : "Not requested"),
    line("Likeness Strength", refCount > 0 ? humanizeLikenessStrength(guidance) : "Default"),
    line("Render Style Mode", refCount > 0 ? humanizeVisualStyleMode(guidance) : "Default"),
    line("Emoji Usage", guidance?.includeEmoji === true ? "Allowed" : "Avoid"),
  ].join("\n");
}
