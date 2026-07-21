import { ENVITEFY_PUBLIC_ORIGIN } from "../public-asset-url.ts";

export type AdminEmailGuideAudienceMode = "individual" | "broadcast";

/**
 * Source of truth for admin AI email generation.
 * Imported by the generator prompts and body polish so rules stay aligned.
 */
export const ADMIN_EMAIL_GENERATION_GUIDE = {
  role: "You generate polished, professional Envitefy admin marketing emails.",

  productSummary:
    "Envitefy helps people create and share public event pages, live cards, invitations, RSVP flows, smart sign-up forms, registry links, and multi-vertical events.",

  outputShape: {
    format: "strict JSON only",
    fields: ["subject", "preheader", "bodyHtml", "buttonText", "buttonUrl", "notes"] as const,
  },

  /** What the model may put in bodyHtml. Scenario visuals/CTAs are injected server-side. */
  bodyHtmlOnly: [
    "{{greeting}} paragraph",
    "one h1 headline tied to the campaign prompt",
    "one short intro paragraph",
  ] as const,

  /** Injected after generation — do not ask the model to recreate these. */
  serverInjected: [
    "Snap still-photo scenario row with Try Snap CTA",
    "Concierge birthday scenario row with Open Concierge CTA",
    "Teachers / class party scenario row",
    "Share-an-event scenario row",
  ] as const,

  must: [
    "Return email-client-safe HTML fragment only for bodyHtml (no full document).",
    "Keep bodyHtml to intro copy only: greeting, headline, one short paragraph.",
    "Always set buttonText and buttonUrl to empty strings when scenario rows are used (scenario CTAs are enough).",
    "Prefer buttonUrl https://envitefy.com only when a single final wrapper CTA is intentionally required.",
    "Only use {{greeting}}, {{firstName}}, and {{lastName}} personalization tokens.",
    "Put the recipient name only in {{greeting}} (e.g. Hi {{firstName}} via greeting). Do not open the headline or body paragraph with {{firstName}} again.",
    "Prefer concrete product benefits (live cards, RSVP, snap, Concierge, smart sign-ups) over vague lifestyle claims.",
  ] as const,

  mustNot: [
    "Do not return <html>, <head>, <body>, <script>, forms, iframes, external CSS, or markdown.",
    "Do not put scenario rows, images, GIF tags, or purple buttons in bodyHtml.",
    "Do not request or invent animated GIFs.",
    "Do not add a closing CTA in bodyHtml — the wrapper adds one from buttonText/buttonUrl.",
    "Do not add text links under buttons (especially filler like “Turn a flyer into a live event card”).",
    "Do not invent image URLs, local files, base64, or data URLs.",
    "Do not invent pricing, launch dates, offers, guarantees, legal claims, or user data the prompt did not supply.",
    "Do not duplicate the final Create an event / Open Envitefy button in bodyHtml.",
    "Do not repeat the recipient name after {{greeting}} (avoid “{{firstName}}, …” right after Hi).",
  ] as const,

  bannedTextLinkLabels: [
    "Turn a flyer into a live event card",
    "Explore Envitefy",
    "Learn more",
  ] as const,

  voice: {
    tone: "Professional, warm, clear, and conversion-focused. Not spammy.",
    subject: "80 characters or fewer when possible.",
    preheader: "Under 140 characters; complements the subject.",
    notes: "Short private admin note explaining assumptions.",
  },

  ctaDefaults: {
    buttonText: "Create an event",
    buttonUrl: ENVITEFY_PUBLIC_ORIGIN,
  },

  audience: {
    individual: [
      "Audience mode is individual (1:1 / small test send).",
      "Write warmer, more personal copy that can address one recipient.",
      "Use {{greeting}} once at the top. Do not also lead the next paragraph with {{firstName}}.",
      "Keep paragraphs short and conversational.",
      "Stay brand-safe and conversion-focused.",
    ],
    broadcast: [
      "Audience mode is broadcast (newsletter / all-users campaign).",
      "Write inclusive second-person plural copy that works for a mixed list.",
      "Keep personalization light: {{greeting}} is fine, but avoid assuming one specific event or child.",
      "Do not open body copy with {{firstName}} after {{greeting}}.",
      "Lead with a shared seasonal or product benefit.",
    ],
  },

  revision:
    "When currentDraft.bodyHtml is present, treat the prompt as an edit request and revise intro copy only unless the prompt asks otherwise.",

  allowedHtmlElements: ["p", "h1", "h2", "div", "table", "tr", "td", "ul", "li", "strong", "em", "a"] as const,

  /** Visual rules for generated scenario stills (no GIFs). */
  imageVisuals: {
    format: "still photographs only — never animated GIFs",
    style:
      "Professional documentary / stock photography. Natural light, realistic skin and fabric texture, believable anatomy, calm composition.",
    requireTraits: [
      "Looks like a real photograph suitable for a brand marketing email",
      "Natural lighting and realistic materials",
      "Simple single-scene composition",
    ],
    rejectTraits: [
      "AI collage or multi-vignette composites connected by glowing lines",
      "Floating icons, holograms, neon trails, magical light paths",
      "Robot / AI assistant avatars or cartoon overlays",
      "Plastic oversmoothed skin or uncanny hands",
      "Surreal product-ad fantasy with multiple floating phones",
      "Any brand logo, wordmark, watermark, badge, or Envitefy mark overlaid on or baked into the photo",
    ],
    acceptTraits: [
      "Phones, printed invitations, greeting cards, and paper flyers in-frame are expected product context",
      "Soft-focus or slightly abstract paper/screen detail is fine — do not fail for that alone",
      "Generic party/invite artwork on a printed card is fine when the overall scene is photographic",
    ],
    generationPromptSuffix: [
      "Shoot as professional stock photography, not AI concept art.",
      "Single realistic scene only.",
      "Phones and printed invites/flyers are welcome product props.",
      "Prefer soft-focus on paper and screens so tiny text is not crisp, but do not invent glowing UI overlays.",
      "CRITICAL: no logos, wordmarks, watermarks, brand badges, or Envitefy branding anywhere in the image — not corner overlays, not on clothing, not on the phone screen.",
      "No glowing overlays, floating icons, holograms, robot avatars, collage panels, or neon connection lines.",
      "Natural skin texture and believable hands. Avoid plastic oversmoothing.",
    ],
  },
} as const;

export type AdminEmailGenerationGuide = typeof ADMIN_EMAIL_GENERATION_GUIDE;
export type AdminEmailImageVisualRules = (typeof ADMIN_EMAIL_GENERATION_GUIDE)["imageVisuals"];

export function buildAdminEmailAudienceGuidance(audienceMode: AdminEmailGuideAudienceMode): string {
  const lines =
    audienceMode === "broadcast"
      ? ADMIN_EMAIL_GENERATION_GUIDE.audience.broadcast
      : ADMIN_EMAIL_GENERATION_GUIDE.audience.individual;
  return lines.join(" ");
}

/** Flatten guide rules into the system prompt sent to the LLM. */
export function buildAdminEmailSystemPromptFromGuide(
  audienceMode: AdminEmailGuideAudienceMode,
): string {
  const guide = ADMIN_EMAIL_GENERATION_GUIDE;
  return [
    guide.role,
    `Return ${guide.outputShape.format} with ${guide.outputShape.fields.join(", ")}.`,
    "bodyHtml must be an email-client-safe HTML fragment that will be placed inside Envitefy's branded wrapper.",
    `Use inline styles on ordinary email-safe elements such as ${guide.allowedHtmlElements.join(", ")}.`,
    `bodyHtml should contain ONLY: ${guide.bodyHtmlOnly.join("; ")}.`,
    `Server injects (do not duplicate): ${guide.serverInjected.join("; ")}.`,
    ...guide.must,
    ...guide.mustNot,
    buildAdminEmailAudienceGuidance(audienceMode),
    guide.revision,
    guide.productSummary,
  ].join(" ");
}

/** Structured user-prompt payload fields derived from the guide. */
export function buildAdminEmailGuidePromptPayload(params: {
  audienceMode: AdminEmailGuideAudienceMode;
  generatedImageAssetsCount: number;
}): {
  audienceGuidance: string;
  brandCtaUrl: string;
  generationGuide: {
    bodyHtmlOnly: readonly string[];
    serverInjected: readonly string[];
    mustNot: readonly string[];
    bannedTextLinkLabels: readonly string[];
    voice: (typeof ADMIN_EMAIL_GENERATION_GUIDE)["voice"];
    ctaDefaults: (typeof ADMIN_EMAIL_GENERATION_GUIDE)["ctaDefaults"];
  };
  productScenariosNote: string;
  generatedImageAssetsCount: number;
  layoutRecipe: {
    bodyHtmlOnly: readonly string[];
    serverInjected: readonly string[];
  };
  outputRules: {
    subject: string;
    preheader: string;
    bodyHtml: string;
    buttonText: string;
    buttonUrl: string;
    notes: string;
    revision: string;
  };
} {
  const guide = ADMIN_EMAIL_GENERATION_GUIDE;
  return {
    audienceGuidance: buildAdminEmailAudienceGuidance(params.audienceMode),
    brandCtaUrl: guide.ctaDefaults.buttonUrl,
    generationGuide: {
      bodyHtmlOnly: guide.bodyHtmlOnly,
      serverInjected: guide.serverInjected,
      mustNot: guide.mustNot,
      bannedTextLinkLabels: guide.bannedTextLinkLabels,
      voice: guide.voice,
      ctaDefaults: guide.ctaDefaults,
    },
    productScenariosNote:
      "Scenario rows (snap, concierge, teachers, share) are injected server-side with professional still photos and CTAs. No GIFs. Do not duplicate them in bodyHtml.",
    generatedImageAssetsCount: params.generatedImageAssetsCount,
    layoutRecipe: {
      bodyHtmlOnly: guide.bodyHtmlOnly,
      serverInjected: guide.serverInjected,
    },
    outputRules: {
      subject: guide.voice.subject,
      preheader: guide.voice.preheader,
      bodyHtml:
        "Intro only. No images, no scenario sections, no buttons, no text links under CTAs.",
      buttonText: "Leave empty when scenario rows supply CTAs (preferred).",
      buttonUrl: "Leave empty when scenario rows supply CTAs (preferred).",
      notes: guide.voice.notes,
      revision: guide.revision,
    },
  };
}

/** Escape labels for use inside a RegExp alternation. */
export function bannedAdminEmailTextLinkPattern(): string {
  return ADMIN_EMAIL_GENERATION_GUIDE.bannedTextLinkLabels
    .map((label) => label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");
}
