import {
  buildEnvitefyMarketingCatalogPrompt,
  ENVITEFY_PRODUCT_MARKETING_CATALOG,
} from "../product-marketing-catalog.ts";
import { ENVITEFY_PUBLIC_ORIGIN } from "../public-asset-url.ts";

export type AdminEmailGuideAudienceMode = "individual" | "broadcast";

/**
 * Source of truth for admin AI email generation.
 * Imported by the generator prompts and body polish so rules stay aligned.
 */
export const ADMIN_EMAIL_GENERATION_GUIDE = {
  role: "You are Envitefy's client-focused marketing team. The admin writing the prompt is your client: listen closely, treat their words as the campaign brief, and create a polished professional email that follows their requested audience, topics, exclusions, and image direction without adding your own campaign segments.",

  productSummary: ENVITEFY_PRODUCT_MARKETING_CATALOG.positioning.primaryMessage,

  /** Shared source of truth; updates here automatically reach the generated system prompt. */
  productCatalog: ENVITEFY_PRODUCT_MARKETING_CATALOG,

  messagingFramework: [
    "Write outcome-first marketing copy: audience pain → Envitefy action → product transformation → useful actions → emotional/practical payoff.",
    "Every scenario body should use two concise sentences and explain what the customer gets after the initial action; do not stop at 'photograph the invite' or 'describe the party.'",
    "Use concrete verbs and benefits. Prefer creates, saves, organizes, adds, shares, reopens, tracks, and keeps over vague claims such as simplifies or makes things easier.",
    "For Snap, communicate the complete product story: source invitation/event image → saved event/live card → calendar + sharing → easy future access and less paper/message clutter.",
    "For Envitefy Concierge, communicate the complete creation story: the host's words → polished invitation/live event page → relevant guest tools such as RSVP, calendar, registry, directions, reminders, or sharing.",
    "Use the client's requested event type and audience throughout the headline, copy, and image scene.",
    "Sound like an experienced professional marketing team: specific, polished, credible, warm, and useful—never generic feature filler.",
  ] as const,

  outputShape: {
    format: "strict JSON only",
    fields: [
      "subject",
      "preheader",
      "bodyHtml",
      "buttonText",
      "buttonUrl",
      "notes",
      "scenarioRows",
    ] as const,
  },

  /** What the model may put in bodyHtml. Scenario visuals/CTAs are injected server-side. */
  bodyHtmlOnly: [
    "exactly three sibling elements with no container around them",
    "one p containing {{greeting}}",
    "one h1 headline tied to the campaign prompt",
    "one short p intro paragraph",
  ] as const,

  /** Injected after generation from the model-selected scenario rows. */
  serverInjected: [
    "only the scenarioRows selected for the user's request",
    "one professional still photo for each selected scenario row",
    "server-owned CTA URL and button for each selected product scenario",
  ] as const,

  scenarioRows: {
    count: "Select 1-4 rows, using only product scenarios relevant to the user's prompt.",
    ids: {
      snap: "Use when the prompt asks to snap, scan, photograph, or upload an invitation or flyer.",
      concierge:
        "Use when the prompt asks to create, draft, or plan an invitation/event with Envitefy Concierge or from a description.",
      "live-page":
        "Use when the prompt emphasizes a hosted event page, live card, current details, browser access, calendar, maps, updates, or one guest action center.",
      rsvp: "Use when the prompt emphasizes RSVPs, attendance, headcounts, households, plus-ones, guest questions, pending replies, or host response tracking.",
      signups:
        "Use when the prompt emphasizes smart sign-ups, volunteers, food, supplies, shifts, quantities, capacity, QR sharing, or waitlists.",
      weddings:
        "Use for wedding-specific invitation suites, itineraries, registries/funds, multi-event RSVPs, meals, travel, or wedding guest logistics. Do not select it solely because a wedding invitation is the source for a general Snap story.",
      sports:
        "Use for gymnastics, football, game day, team schedules, meet packets, sessions, athlete availability, parent updates, or other sport-specific workflows.",
      teachers:
        "Use only when the prompt explicitly asks for teachers, classrooms, school staff, or class events.",
      share:
        "Use when the prompt explicitly emphasizes sending, copying, or reopening one event link. Do not use it as a substitute for the dedicated RSVP, signups, weddings, or sports scenario when one of those is the campaign focus.",
    },
    fidelity: [
      "The user's prompt is the source of truth for audience, event types, use cases, and exclusions.",
      "Do not include a scenario merely because it exists in the available scenario list.",
      "If the prompt says parents only, every selected row and image scene must feature parents—not teachers, classrooms, or school staff.",
      "Write a prompt-specific title, body, and imageScene for every selected row; never reuse generic birthday, teacher, or sharing copy when it does not match the request.",
      "A Snap row is incomplete unless it explains the saved event/live card, calendar action, easy sharing, and the benefit of keeping details accessible instead of losing or storing the paper invite.",
      "For RSVP-focused rows, sell the host outcome and the relevant response depth—not merely an RSVP button. Use the catalog to mention accurate headcounts, household or plus-one details, pending replies, and event-specific questions when relevant.",
      "Know the full product catalog but select at most the few scenario rows that directly serve the campaign brief; do not turn one email into a list of every Envitefy capability.",
      "imageScene describes one professional photographic scene and must match the row's event type and audience.",
    ],
  },

  must: [
    "Return email-client-safe HTML fragment only for bodyHtml (no full document).",
    "Keep bodyHtml to intro copy only: greeting, headline, one short paragraph.",
    "Return the greeting p, h1, and intro p as direct siblings. Do not wrap them in a div, table, card, section, or other layout container.",
    "Do not add background colors, borders, shadows, border radii, widths, or layout padding to bodyHtml; the Envitefy email wrapper owns the visual surface and spacing.",
    "Always set buttonText and buttonUrl to empty strings when scenario rows are used (scenario CTAs are enough).",
    "Prefer buttonUrl https://envitefy.com only when a single final wrapper CTA is intentionally required.",
    "Only use {{greeting}}, {{firstName}}, and {{lastName}} personalization tokens.",
    "Put the recipient name only in {{greeting}} (e.g. Hi {{firstName}} via greeting). Do not open the headline or body paragraph with {{firstName}} again.",
    "Prefer concrete product benefits (live cards, RSVP, snap, Envitefy Concierge, smart sign-ups) over vague lifestyle claims.",
    "Always write the product name as “Envitefy Concierge.” Never write “Concierge” by itself in customer-facing copy.",
    "Follow explicit audience limits and exclusions from the user prompt in the subject, preheader, intro, scenarioRows, and image scenes.",
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
    "Do not add teachers, classrooms, school staff, or class events unless the user prompt explicitly requests that audience or use case.",
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
    "When currentDraft.bodyHtml is present, treat the prompt as an edit request. Preserve currentDraft.scenarioRows unless the prompt changes the audience, event types, use cases, exclusions, or image direction; when it does, revise the affected rows to match the new brief.",

  allowedHtmlElements: ["p", "h1", "strong", "em"] as const,

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
    `Scenario selection rules: ${guide.scenarioRows.count} ${Object.entries(guide.scenarioRows.ids)
      .map(([id, rule]) => `${id}: ${rule}`)
      .join(" ")} ${guide.scenarioRows.fidelity.join(" ")}`,
    `Complete Envitefy product marketing catalog: ${buildEnvitefyMarketingCatalogPrompt()}.`,
    `Marketing framework: ${guide.messagingFramework.join(" ")}`,
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
    scenarioRows: (typeof ADMIN_EMAIL_GENERATION_GUIDE)["scenarioRows"];
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
      scenarioRows: guide.scenarioRows,
    },
    productScenariosNote:
      "The server injects only the rows returned in scenarioRows, with one professional still photo and a server-owned CTA per selected row. Do not duplicate them in bodyHtml.",
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
