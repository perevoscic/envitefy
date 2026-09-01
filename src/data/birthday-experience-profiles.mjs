const COMPOSITION_LABELS = {
  "editorial-split": "Editorial split",
  "poster-stage": "Celebration poster",
  "arch-invitation": "Arched invitation",
  "scrapbook-collage": "Scrapbook collage",
  "ticket-marquee": "Ticket marquee",
  "storybook-window": "Storybook window",
  "scoreboard-rush": "Scoreboard rush",
  "gallery-minimal": "Gallery minimal",
  "postcard-panorama": "Postcard panorama",
  "bento-party": "Party bento",
  "portal-glow": "Immersive portal",
  "menu-board": "Menu-board story",
  "keepsake-letter": "Keepsake letter",
  "magazine-cover": "Magazine cover",
};

export const BIRTHDAY_EXPERIENCE_COMPOSITIONS = Object.freeze(
  Object.keys(COMPOSITION_LABELS),
);

export const BIRTHDAY_EXPERIENCE_MEDIA_FRAMES = Object.freeze([
  "full-bleed",
  "arched",
  "circle",
  "polaroid",
  "diagonal",
  "postage-stamp",
  "filmstrip",
  "picture-window",
  "diamond",
  "soft-square",
  "ticket-cut",
  "panorama",
  "portrait-card",
]);

export const BIRTHDAY_EXPERIENCE_TITLE_TREATMENTS = Object.freeze([
  "stacked-display",
  "outlined-poster",
  "script-signoff",
  "number-led",
  "vertical-label",
  "editorial-rule",
  "badge-lockup",
  "floating-caption",
]);

const DETAIL_PATTERNS = Object.freeze([
  "bento",
  "timeline",
  "ribbon",
  "chapters",
  "ledger",
  "stacked-cards",
  "split-notes",
  "gallery-labels",
]);

const BODY_COMPOSITION_LABELS = {
  "celebration-bento": "Celebration bento",
  "editorial-ledger": "Editorial ledger",
  "party-timeline": "Party timeline",
  "storybook-chapters": "Storybook chapters",
  "scrapbook-wall": "Scrapbook wall",
  "ticket-program": "Ticket program",
  "scoreboard-grid": "Scoreboard grid",
  "gallery-exhibition": "Gallery exhibition",
  "postcard-route": "Postcard route",
  "magazine-columns": "Magazine columns",
  "menu-table": "Celebration menu",
  "constellation-map": "Constellation map",
  "minimal-rail": "Minimal rail",
  "arched-suite": "Arched suite",
  "ribbon-run": "Ribbon run",
  "festival-lineup": "Festival lineup",
  "passport-stamps": "Party passport",
  "newspaper-front": "Birthday newspaper",
  "neon-club": "Neon club",
  "garden-path": "Garden path",
  "memory-book": "Memory book",
  "comic-panels": "Comic panels",
  "polaroid-desk": "Polaroid desk",
  "stage-program": "Stage program",
  "cake-layers": "Cake layers",
  "orbit-dashboard": "Orbit dashboard",
};

export const BIRTHDAY_BODY_COMPOSITIONS = Object.freeze(
  Object.keys(BODY_COMPOSITION_LABELS),
);

export const BIRTHDAY_BODY_FACT_TREATMENTS = Object.freeze([
  "index-cards",
  "ticker-tape",
  "numbered-rail",
  "party-seals",
  "ticket-stubs",
  "score-cells",
  "taped-notes",
  "editorial-columns",
  "menu-lines",
  "postage-marks",
  "chapter-tabs",
  "orbit-nodes",
  "ribbon-labels",
]);

export const BIRTHDAY_BODY_GALLERY_TREATMENTS = Object.freeze([
  "polaroid-scatter",
  "cinema-strip",
  "editorial-mosaic",
  "arched-triptych",
  "comic-grid",
  "postcard-stack",
  "orbit-circles",
  "full-bleed-wall",
]);

const BODY_SECTION_ORDERS = Object.freeze([
  "story-notes-gallery-hosts",
  "gallery-story-hosts-notes",
  "notes-gallery-story-hosts",
  "hosts-story-gallery-notes",
]);

const HOST_TREATMENTS = Object.freeze([
  "signature-line",
  "host-badges",
  "calling-card",
  "credit-roll",
  "ticket-holders",
  "editorial-byline",
  "portrait-labels",
  "ribbon-names",
]);

const SCHEDULE_TREATMENTS = Object.freeze([
  "run-of-show",
  "stepped-times",
  "calendar-cards",
  "route-stops",
  "scoreboard-periods",
  "chapter-list",
]);

const LEGACY_BODY_COMPOSITIONS = Object.freeze({
  "party-pop": "celebration-bento",
  "candy-dreams": "cake-layers",
  "rainbow-bash": "festival-lineup",
  "playful-pals": "comic-panels",
  "birthday-burst": "party-timeline",
  "sweet-celebration": "menu-table",
  "super-star": "stage-program",
  "happy-dance": "neon-club",
  "magic-sparkle": "constellation-map",
  "celebration-time": "ticket-program",
  "fun-fiesta": "ribbon-run",
  "joyful-jamboree": "scrapbook-wall",
  "whimsical-wonder": "storybook-chapters",
  "cheerful-chaos": "polaroid-desk",
  "party-parade": "postcard-route",
  "birthday-bliss": "garden-path",
  "sparkle-splash": "orbit-dashboard",
  "celebration-craze": "magazine-columns",
  "happy-hooray": "scoreboard-grid",
  "party-palooza": "newspaper-front",
  "birthday-bonanza": "passport-stamps",
  "sweet-surprise": "arched-suite",
  "party-perfect": "gallery-exhibition",
  "birthday-bash": "editorial-ledger",
  "undersea-mermaid-cove": "orbit-dashboard",
});

const SEMANTIC_BODY_POOLS = {
  anniversary: [
    "memory-book",
    "editorial-ledger",
    "gallery-exhibition",
    "arched-suite",
    "magazine-columns",
  ],
  action: [
    "scoreboard-grid",
    "party-timeline",
    "ticket-program",
    "festival-lineup",
    "orbit-dashboard",
  ],
  adventure: [
    "passport-stamps",
    "postcard-route",
    "storybook-chapters",
    "garden-path",
    "scrapbook-wall",
  ],
  nightlife: [
    "neon-club",
    "stage-program",
    "festival-lineup",
    "magazine-columns",
    "ticket-program",
  ],
  culinary: [
    "menu-table",
    "cake-layers",
    "newspaper-front",
    "celebration-bento",
    "polaroid-desk",
  ],
  refined: [
    "editorial-ledger",
    "gallery-exhibition",
    "arched-suite",
    "memory-book",
    "minimal-rail",
  ],
  whimsical: [
    "storybook-chapters",
    "constellation-map",
    "garden-path",
    "orbit-dashboard",
    "scrapbook-wall",
  ],
  creative: [
    "comic-panels",
    "polaroid-desk",
    "celebration-bento",
    "ribbon-run",
    "newspaper-front",
  ],
};

const SURFACES = Object.freeze([
  "paper",
  "glass",
  "ink",
  "canvas",
  "outlined",
  "soft",
  "metallic",
  "neon",
]);

const CTA_TREATMENTS = Object.freeze([
  "pill",
  "ticket",
  "stamp",
  "block",
  "underline",
  "outline",
]);

const MOTIONS = Object.freeze(["float", "reveal", "tilt", "zoom", "pan", "glow", "still"]);
const IMAGE_POSITIONS = Object.freeze([
  "center",
  "center top",
  "center bottom",
  "left center",
  "right center",
]);

const SEMANTIC_COMPOSITION_POOLS = {
  anniversary: [
    "keepsake-letter",
    "gallery-minimal",
    "editorial-split",
    "storybook-window",
    "postcard-panorama",
    "arch-invitation",
  ],
  action: ["scoreboard-rush", "ticket-marquee", "poster-stage", "bento-party"],
  adventure: [
    "storybook-window",
    "postcard-panorama",
    "scoreboard-rush",
    "scrapbook-collage",
  ],
  nightlife: ["ticket-marquee", "portal-glow", "magazine-cover", "poster-stage"],
  culinary: ["menu-board", "scrapbook-collage", "bento-party", "postcard-panorama"],
  refined: [
    "editorial-split",
    "arch-invitation",
    "gallery-minimal",
    "magazine-cover",
    "keepsake-letter",
  ],
  whimsical: ["portal-glow", "storybook-window", "arch-invitation", "scrapbook-collage"],
  creative: ["poster-stage", "bento-party", "scrapbook-collage", "magazine-cover"],
};

function stableHash(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function normalizeThemeWords(design) {
  return [
    design.id,
    design.name,
    design.style,
    design.category,
    design.family,
    design.heroMood,
    design.decorations?.graphicType,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function getSemanticCluster(design) {
  if (design.occasion === "Anniversary") return "anniversary";

  const words = normalizeThemeWords(design);
  if (/sport|soccer|basketball|football|racing|raceway|gymnast|firehouse|action/.test(words)) {
    return "action";
  }
  if (/adventure|dino|safari|explor|construction|camp|farm|woodland|bug|pirate/.test(words)) {
    return "adventure";
  }
  if (/night|neon|disco|retro|arcade|eighties|dance|cinema|rooftop/.test(words)) {
    return "nightlife";
  }
  if (/baker|baking|candy|sweet|brunch|tea|patisserie|market|pizza|coffee|wine|food/.test(words)) {
    return "culinary";
  }
  if (/elegant|classic|luxury|formal|glam|garden|floral|coastal|champagne|gala|linen/.test(words)) {
    return "refined";
  }
  if (/whims|fantasy|magic|fairy|space|celestial|undersea|mermaid|rainbow|seasonal/.test(words)) {
    return "whimsical";
  }
  return "creative";
}

function parseHexColor(value) {
  if (typeof value !== "string") return null;
  const normalized = value.trim().replace(/^#/, "");
  if (!/^[0-9a-f]{6}$/i.test(normalized)) return null;
  return {
    red: Number.parseInt(normalized.slice(0, 2), 16),
    green: Number.parseInt(normalized.slice(2, 4), 16),
    blue: Number.parseInt(normalized.slice(4, 6), 16),
  };
}

function getTone(primaryColor) {
  const color = parseHexColor(primaryColor);
  if (!color) return "light";
  const luminance =
    (0.2126 * color.red + 0.7152 * color.green + 0.0722 * color.blue) / 255;
  return luminance < 0.46 ? "dark" : "light";
}

function getBodyComposition(design, semanticCluster, hash) {
  const legacyComposition = LEGACY_BODY_COMPOSITIONS[design.id];
  if (legacyComposition) return legacyComposition;
  const pool = SEMANTIC_BODY_POOLS[semanticCluster];
  return pool[hash % pool.length];
}

function buildProfile(design, catalogIndex, occurrence, bodyComposition, bodyOccurrence) {
  const semanticCluster = getSemanticCluster(design);
  const pool = SEMANTIC_COMPOSITION_POOLS[semanticCluster];
  const hash = stableHash(`${design.id}:${design.decorations?.graphicType || "celebration"}`);
  const composition = pool[hash % pool.length];
  const mediaFrame = BIRTHDAY_EXPERIENCE_MEDIA_FRAMES[
    occurrence % BIRTHDAY_EXPERIENCE_MEDIA_FRAMES.length
  ];
  const titleTreatment = BIRTHDAY_EXPERIENCE_TITLE_TREATMENTS[
    Math.floor(occurrence / BIRTHDAY_EXPERIENCE_MEDIA_FRAMES.length) %
      BIRTHDAY_EXPERIENCE_TITLE_TREATMENTS.length
  ];
  const detailPattern = DETAIL_PATTERNS[(hash + catalogIndex) % DETAIL_PATTERNS.length];
  const surface = SURFACES[(hash + occurrence * 3) % SURFACES.length];
  const ctaTreatment = CTA_TREATMENTS[(hash + catalogIndex * 5) % CTA_TREATMENTS.length];
  const motion = MOTIONS[(hash + catalogIndex * 7) % MOTIONS.length];
  const imagePosition = IMAGE_POSITIONS[(hash + occurrence) % IMAGE_POSITIONS.length];
  const ornament = design.decorations?.graphicType || "celebration";
  const tone = getTone(design.primaryColor);
  const factTreatment = BIRTHDAY_BODY_FACT_TREATMENTS[
    bodyOccurrence % BIRTHDAY_BODY_FACT_TREATMENTS.length
  ];
  const galleryTreatment = BIRTHDAY_BODY_GALLERY_TREATMENTS[
    Math.floor(bodyOccurrence / BIRTHDAY_BODY_FACT_TREATMENTS.length) %
      BIRTHDAY_BODY_GALLERY_TREATMENTS.length
  ];
  const sectionOrder = BODY_SECTION_ORDERS[(hash + catalogIndex) % BODY_SECTION_ORDERS.length];
  const hostTreatment = HOST_TREATMENTS[(hash + catalogIndex * 3) % HOST_TREATMENTS.length];
  const scheduleTreatment = SCHEDULE_TREATMENTS[
    (hash + catalogIndex * 5) % SCHEDULE_TREATMENTS.length
  ];

  return {
    composition,
    compositionLabel: COMPOSITION_LABELS[composition],
    mediaFrame,
    titleTreatment,
    detailPattern,
    bodyComposition,
    bodyCompositionLabel: BODY_COMPOSITION_LABELS[bodyComposition],
    factTreatment,
    galleryTreatment,
    sectionOrder,
    hostTreatment,
    scheduleTreatment,
    surface,
    ctaTreatment,
    motion,
    imagePosition,
    ornament,
    tone,
    accentMix: 22 + ((hash + catalogIndex * 11) % 55),
    eyebrow:
      design.occasion === "Anniversary"
        ? "Anniversary edition"
        : design.audience === "Adults"
          ? "Birthday edition"
          : "Party edition",
    signature: `${composition}:${mediaFrame}:${titleTreatment}`,
    bodySignature: `${bodyComposition}:${factTreatment}:${galleryTreatment}`,
  };
}

/**
 * Adds a theme-matched, structurally unique experience profile to every birthday design.
 * Within a composition family, the media-frame/title pair is a base-13 sequence, which
 * guarantees 104 non-repeating signatures even if every design chose the same family.
 */
export function buildBirthdayExperienceProfiles(designs) {
  const occurrenceByComposition = new Map();
  const occurrenceByBodyComposition = new Map();

  return designs.map((design, catalogIndex) => {
    const semanticCluster = getSemanticCluster(design);
    const pool = SEMANTIC_COMPOSITION_POOLS[semanticCluster];
    const hash = stableHash(`${design.id}:${design.decorations?.graphicType || "celebration"}`);
    const composition = pool[hash % pool.length];
    const occurrence = occurrenceByComposition.get(composition) || 0;
    occurrenceByComposition.set(composition, occurrence + 1);
    const bodyComposition = getBodyComposition(design, semanticCluster, hash);
    const bodyOccurrence = occurrenceByBodyComposition.get(bodyComposition) || 0;
    occurrenceByBodyComposition.set(bodyComposition, bodyOccurrence + 1);

    return {
      ...design,
      experience: buildProfile(
        design,
        catalogIndex,
        occurrence,
        bodyComposition,
        bodyOccurrence,
      ),
    };
  });
}
