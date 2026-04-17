export const STUDIO_LIVE_CARD_RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["title", "description", "palette", "themeStyle", "interactiveMetadata", "invitation"],
  properties: {
    title: { type: "string" },
    description: { type: "string" },
    palette: {
      type: "object",
      additionalProperties: false,
      required: ["primary", "secondary", "accent"],
      properties: {
        primary: { type: "string" },
        secondary: { type: "string" },
        accent: { type: "string" },
      },
    },
    themeStyle: { type: "string" },
    interactiveMetadata: {
      type: "object",
      additionalProperties: false,
      required: ["rsvpMessage", "funFacts", "ctaLabel", "shareNote"],
      properties: {
        rsvpMessage: { type: "string" },
        funFacts: {
          type: "array",
          items: { type: "string" },
        },
        ctaLabel: { type: "string" },
        shareNote: { type: "string" },
      },
    },
    invitation: {
      type: "object",
      additionalProperties: false,
      required: [
        "title",
        "subtitle",
        "openingLine",
        "scheduleLine",
        "locationLine",
        "detailsLine",
        "callToAction",
        "socialCaption",
        "hashtags",
      ],
      properties: {
        title: { type: "string" },
        subtitle: { type: "string" },
        openingLine: { type: "string" },
        scheduleLine: { type: "string" },
        locationLine: { type: "string" },
        detailsLine: { type: "string" },
        callToAction: { type: "string" },
        socialCaption: { type: "string" },
        hashtags: {
          type: "array",
          items: { type: "string" },
        },
      },
    },
  },
} as const;
