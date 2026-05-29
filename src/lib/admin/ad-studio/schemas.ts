export const CAMPAIGN_BRIEF_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    campaignTitle: { type: "string" },
    adSummary: { type: "string" },
    targetAudience: { type: "string" },
    painPoint: { type: "string" },
    emotionalTrigger: { type: "string" },
    benefit: { type: "string" },
    cta: { type: "string" },
    suggestedPlatform: { type: "string" },
    suggestedVideoLength: { type: "number", enum: [10, 15, 20] },
    adAngle: { type: "string" },
    coreProblem: { type: "string" },
    envitefySolution: { type: "string" },
    videoStructure: { type: "string" },
    visualStyle: { type: "string" },
  },
  required: [
    "campaignTitle",
    "adSummary",
    "targetAudience",
    "painPoint",
    "emotionalTrigger",
    "benefit",
    "cta",
    "suggestedPlatform",
    "suggestedVideoLength",
    "adAngle",
    "coreProblem",
    "envitefySolution",
    "videoStructure",
    "visualStyle",
  ],
} as const;

const VIDEO_SCENE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    sceneNumber: { type: "number" },
    timestamp: { type: "string" },
    durationSeconds: { type: "number" },
    purpose: {
      type: "string",
      enum: ["hook", "problem", "reveal", "product-demo", "cta"],
    },
    visual: { type: "string" },
    voiceover: { type: "string" },
    onScreenText: { type: "string" },
    captionOverlay: { type: "string" },
    chatBubbles: {
      type: "array",
      items: { type: "string" },
    },
  },
  required: [
    "sceneNumber",
    "timestamp",
    "durationSeconds",
    "purpose",
    "visual",
    "voiceover",
    "onScreenText",
    "captionOverlay",
    "chatBubbles",
  ],
} as const;

export const VIDEO_SCRIPT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    totalSeconds: { type: "number", enum: [10, 15, 20] },
    logline: { type: "string" },
    voiceoverScript: { type: "string" },
    scenes: {
      type: "array",
      minItems: 5,
      maxItems: 5,
      items: VIDEO_SCENE_SCHEMA,
    },
  },
  required: ["totalSeconds", "logline", "voiceoverScript", "scenes"],
} as const;

export const INVITATION_DESIGN_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    theme: { type: "string" },
    colorPalette: {
      type: "object",
      additionalProperties: false,
      properties: {
        background: { type: "string" },
        accent: { type: "string" },
        accentSoft: { type: "string" },
        text: { type: "string" },
        muted: { type: "string" },
      },
      required: ["background", "accent", "accentSoft", "text", "muted"],
    },
    layoutStyle: { type: "string" },
    fields: {
      type: "object",
      additionalProperties: false,
      properties: {
        title: { type: "string" },
        subtitle: { type: "string" },
        date: { type: "string" },
        time: { type: "string" },
        location: { type: "string" },
        rsvp: { type: "string" },
        registry: { type: ["string", "null"] },
        host: { type: ["string", "null"] },
      },
      required: ["title", "subtitle", "date", "time", "location", "rsvp", "registry", "host"],
    },
    metadata: {
      type: "object",
      additionalProperties: false,
      properties: {
        eventType: { type: "string" },
        qrPlaceholder: { type: "boolean" },
        rsvpEnabled: { type: "boolean" },
        registryEnabled: { type: "boolean" },
        locationEnabled: { type: "boolean" },
      },
      required: ["eventType", "qrPlaceholder", "rsvpEnabled", "registryEnabled", "locationEnabled"],
    },
  },
  required: ["theme", "colorPalette", "layoutStyle", "fields", "metadata"],
} as const;

export const PHONE_UI_DESIGN_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    themeTokens: {
      type: "object",
      additionalProperties: false,
      properties: {
        background: { type: "string" },
        surface: { type: "string" },
        primary: { type: "string" },
        primaryText: { type: "string" },
        text: { type: "string" },
        muted: { type: "string" },
      },
      required: ["background", "surface", "primary", "primaryText", "text", "muted"],
    },
    eventPageCard: {
      type: "object",
      additionalProperties: false,
      properties: {
        title: { type: "string" },
        subtitle: { type: "string" },
        date: { type: "string" },
        time: { type: "string" },
        location: { type: "string" },
      },
      required: ["title", "subtitle", "date", "time", "location"],
    },
    ctaButtonText: { type: "string" },
    rsvpModule: {
      type: "object",
      additionalProperties: false,
      properties: {
        label: { type: "string" },
        yesCount: { type: "number" },
        maybeCount: { type: "number" },
      },
      required: ["label", "yesCount", "maybeCount"],
    },
    locationCard: {
      type: "object",
      additionalProperties: false,
      properties: {
        label: { type: "string" },
        address: { type: "string" },
      },
      required: ["label", "address"],
    },
    registryCard: {
      anyOf: [
        { type: "null" },
        {
          type: "object",
          additionalProperties: false,
          properties: {
            label: { type: "string" },
            urlLabel: { type: "string" },
          },
          required: ["label", "urlLabel"],
        },
      ],
    },
    shareModule: {
      type: "object",
      additionalProperties: false,
      properties: {
        label: { type: "string" },
        shareText: { type: "string" },
      },
      required: ["label", "shareText"],
    },
  },
  required: [
    "themeTokens",
    "eventPageCard",
    "ctaButtonText",
    "rsvpModule",
    "locationCard",
    "registryCard",
    "shareModule",
  ],
} as const;

export const FRAME_PLAN_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    format: { type: "string", enum: ["vertical", "horizontal", "square"] },
    aspectRatio: { type: "string", enum: ["9:16", "16:9", "1:1"] },
    frames: {
      type: "array",
      minItems: 5,
      maxItems: 5,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          frameNumber: { type: "number" },
          scenePurpose: { type: "string" },
          visualDescription: { type: "string" },
          cameraAngle: { type: "string" },
          characterAction: { type: "string" },
          blankSurfaceRequirements: { type: "array", items: { type: "string" } },
          compositeTargets: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                type: { type: "string", enum: ["invitation", "phone-ui"] },
                surface: {
                  type: "string",
                  enum: ["fridge", "table", "hand", "phone-screen", "hero-phone"],
                },
                placementHint: { type: "string" },
              },
              required: ["type", "surface", "placementHint"],
            },
          },
          lighting: { type: "string" },
          mood: { type: "string" },
          negativePrompt: { type: "string" },
          requiredReferences: { type: "array", items: { type: "string" } },
        },
        required: [
          "frameNumber",
          "scenePurpose",
          "visualDescription",
          "cameraAngle",
          "characterAction",
          "blankSurfaceRequirements",
          "compositeTargets",
          "lighting",
          "mood",
          "negativePrompt",
          "requiredReferences",
        ],
      },
    },
  },
  required: ["format", "aspectRatio", "frames"],
} as const;
