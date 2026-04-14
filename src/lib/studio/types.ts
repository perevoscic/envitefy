export type StudioGenerateMode = "text" | "image" | "both";

export type StudioEventDetails = {
  title: string;
  category?: string | null;
  occasion?: string | null;
  hostName?: string | null;
  honoreeName?: string | null;
  ageOrMilestone?: string | null;
  userIdea?: string | null;
  description?: string | null;
  date?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  timezone?: string | null;
  venueName?: string | null;
  venueAddress?: string | null;
  dressCode?: string | null;
  rsvpBy?: string | null;
  rsvpContact?: string | null;
  registryNote?: string | null;
  links?: Array<{ label: string; url: string }>;
  /** HTTPS URLs of user-uploaded honoree/event photos; fed into invitation image generation. */
  referenceImageUrls?: string[];
};

export type StudioGenerationGuidance = {
  tone?: string | null;
  style?: string | null;
  audience?: string | null;
  colorPalette?: string | null;
  includeEmoji?: boolean | null;
};

export type StudioLiveCardPalette = {
  primary: string;
  secondary: string;
  accent: string;
};

export type StudioLiveCardInteractiveMetadata = {
  rsvpMessage: string;
  funFacts: string[];
  ctaLabel: string;
  shareNote: string;
};

export type StudioGenerateRequest = {
  mode?: StudioGenerateMode;
  event: StudioEventDetails;
  guidance?: StudioGenerationGuidance;
  imageEdit?: {
    sourceImageDataUrl: string;
  };
};

export type StudioInvitationText = {
  title: string;
  subtitle: string;
  openingLine: string;
  scheduleLine: string;
  locationLine: string;
  detailsLine: string;
  callToAction: string;
  socialCaption: string;
  hashtags: string[];
};

export type StudioLiveCardMetadata = {
  title: string;
  description: string;
  palette: StudioLiveCardPalette;
  themeStyle: string;
  interactiveMetadata: StudioLiveCardInteractiveMetadata;
  invitation: StudioInvitationText;
};

export type StudioGenerationError = {
  code: string;
  message: string;
  retryable: boolean;
  provider: "gemini";
  status?: number;
};

export type StudioGenerateResponse = {
  ok: boolean;
  mode: StudioGenerateMode;
  liveCard: StudioLiveCardMetadata | null;
  invitation: StudioInvitationText | null;
  imageDataUrl: string | null;
  warnings: string[];
  errors?: {
    text?: StudioGenerationError;
    image?: StudioGenerationError;
  };
};

export type StudioGenerateFailureResponse = {
  ok: false;
  mode: StudioGenerateMode;
  liveCard: null;
  invitation: null;
  imageDataUrl: null;
  warnings: string[];
  errors: {
    text?: StudioGenerationError;
    image?: StudioGenerationError;
  };
};

export type StudioGenerateApiResponse = StudioGenerateResponse | StudioGenerateFailureResponse;

type ParseSuccess = { ok: true; value: StudioGenerateRequest };
type ParseFailure = { ok: false; error: string };

function safeString(input: unknown): string {
  return typeof input === "string" ? input.trim() : "";
}

function safeNullableString(input: unknown): string | null | undefined {
  if (input == null) return null;
  const value = safeString(input);
  return value || null;
}

function isValidMode(value: unknown): value is StudioGenerateMode {
  return value === "text" || value === "image" || value === "both";
}

function normalizeLinks(value: unknown): Array<{ label: string; url: string }> {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      const label = safeString((item as any)?.label);
      const url = safeString((item as any)?.url);
      if (!label || !url) return null;
      return { label, url };
    })
    .filter((item): item is { label: string; url: string } => Boolean(item));
}

const STUDIO_REFERENCE_IMAGES_MAX = 6;

function normalizeReferenceImageUrls(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const seen = new Set<string>();
  const out: string[] = [];
  for (const entry of value) {
    const url = safeString(entry);
    if (!url || seen.has(url)) continue;
    seen.add(url);
    out.push(url);
    if (out.length >= STUDIO_REFERENCE_IMAGES_MAX) break;
  }
  return out.length > 0 ? out : undefined;
}

function normalizeEvent(value: unknown): StudioEventDetails | null {
  if (!value || typeof value !== "object") return null;
  const title = safeString((value as any).title);
  if (!title) return null;
  return {
    title,
    category: safeNullableString((value as any).category),
    occasion: safeNullableString((value as any).occasion),
    hostName: safeNullableString((value as any).hostName),
    honoreeName: safeNullableString((value as any).honoreeName),
    ageOrMilestone: safeNullableString((value as any).ageOrMilestone),
    userIdea: safeNullableString((value as any).userIdea),
    description: safeNullableString((value as any).description),
    date: safeNullableString((value as any).date),
    startTime: safeNullableString((value as any).startTime),
    endTime: safeNullableString((value as any).endTime),
    timezone: safeNullableString((value as any).timezone),
    venueName: safeNullableString((value as any).venueName),
    venueAddress: safeNullableString((value as any).venueAddress),
    dressCode: safeNullableString((value as any).dressCode),
    rsvpBy: safeNullableString((value as any).rsvpBy),
    rsvpContact: safeNullableString((value as any).rsvpContact),
    registryNote: safeNullableString((value as any).registryNote),
    links: normalizeLinks((value as any).links),
    referenceImageUrls: normalizeReferenceImageUrls((value as any).referenceImageUrls),
  };
}

function normalizeGuidance(value: unknown): StudioGenerationGuidance | undefined {
  if (!value || typeof value !== "object") return undefined;
  return {
    tone: safeNullableString((value as any).tone),
    style: safeNullableString((value as any).style),
    audience: safeNullableString((value as any).audience),
    colorPalette: safeNullableString((value as any).colorPalette),
    includeEmoji:
      typeof (value as any).includeEmoji === "boolean" ? (value as any).includeEmoji : null,
  };
}

function normalizeImageEdit(value: unknown): { sourceImageDataUrl: string } | undefined {
  if (!value || typeof value !== "object") return undefined;
  const sourceImageDataUrl = safeString((value as any).sourceImageDataUrl);
  if (!sourceImageDataUrl) return undefined;
  return { sourceImageDataUrl };
}

export function parseStudioGenerateRequest(input: unknown): ParseSuccess | ParseFailure {
  if (!input || typeof input !== "object") {
    return { ok: false, error: "Request body must be a JSON object." };
  }
  const modeRaw = (input as any).mode;
  const mode: StudioGenerateMode = isValidMode(modeRaw) ? modeRaw : "both";
  const event = normalizeEvent((input as any).event);
  if (!event) {
    return { ok: false, error: "Invalid event details. `event.title` is required." };
  }
  return {
    ok: true,
    value: {
      mode,
      event,
      guidance: normalizeGuidance((input as any).guidance),
      imageEdit: normalizeImageEdit((input as any).imageEdit),
    },
  };
}

function maybeStringField(value: unknown): string {
  return safeString(value);
}

function normalizeInvitationTextObject(value: unknown): StudioInvitationText | null {
  if (!value || typeof value !== "object") return null;
  const title = maybeStringField((value as any).title);
  const subtitle = maybeStringField((value as any).subtitle);
  const openingLine = maybeStringField((value as any).openingLine);
  const scheduleLine = maybeStringField((value as any).scheduleLine);
  const locationLine = maybeStringField((value as any).locationLine);
  const detailsLine = maybeStringField((value as any).detailsLine);
  const callToAction = maybeStringField((value as any).callToAction);
  const socialCaption = maybeStringField((value as any).socialCaption);
  const hashtagsRaw = Array.isArray((value as any).hashtags)
    ? ((value as any).hashtags as unknown[])
    : [];
  const hashtags = hashtagsRaw
    .map((tag) => safeString(tag))
    .filter((tag) => tag.length > 0)
    .slice(0, 8);

  if (
    !title ||
    !subtitle ||
    !openingLine ||
    !scheduleLine ||
    !locationLine ||
    !detailsLine ||
    !callToAction ||
    !socialCaption
  ) {
    return null;
  }

  return {
    title,
    subtitle,
    openingLine,
    scheduleLine,
    locationLine,
    detailsLine,
    callToAction,
    socialCaption,
    hashtags,
  };
}

function normalizeHexColor(value: unknown): string | null {
  const color = safeString(value).toUpperCase();
  if (!/^#[0-9A-F]{6}$/.test(color)) return null;
  return color;
}

function normalizeStringList(value: unknown, limit: number): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => safeString(item))
    .filter((item) => item.length > 0)
    .slice(0, limit);
}

export function normalizeInvitationText(value: unknown): StudioInvitationText | null {
  if (!value || typeof value !== "object") return null;
  const nestedInvitation = (value as any).invitation;
  if (nestedInvitation && typeof nestedInvitation === "object") {
    const parsedNested = normalizeInvitationTextObject(nestedInvitation);
    if (parsedNested) return parsedNested;
  }
  return normalizeInvitationTextObject(value);
}

export function normalizeLiveCardMetadata(value: unknown): StudioLiveCardMetadata | null {
  if (!value || typeof value !== "object") return null;
  const title = maybeStringField((value as any).title);
  const description = maybeStringField((value as any).description);
  const themeStyle = maybeStringField((value as any).themeStyle);
  const paletteValue = (value as any).palette;
  const interactiveValue = (value as any).interactiveMetadata;
  const invitation = normalizeInvitationText((value as any).invitation);
  const palette =
    paletteValue && typeof paletteValue === "object"
      ? {
          primary: normalizeHexColor((paletteValue as any).primary) || "#1F2937",
          secondary: normalizeHexColor((paletteValue as any).secondary) || "#4F46E5",
          accent: normalizeHexColor((paletteValue as any).accent) || "#F59E0B",
        }
      : null;
  const interactiveMetadata =
    interactiveValue && typeof interactiveValue === "object"
      ? {
          rsvpMessage: maybeStringField((interactiveValue as any).rsvpMessage),
          funFacts: normalizeStringList((interactiveValue as any).funFacts, 5),
          ctaLabel: maybeStringField((interactiveValue as any).ctaLabel),
          shareNote: maybeStringField((interactiveValue as any).shareNote),
        }
      : null;

  if (!title || !description || !themeStyle || !palette || !interactiveMetadata || !invitation) {
    return null;
  }

  if (
    !interactiveMetadata.rsvpMessage ||
    !interactiveMetadata.ctaLabel ||
    !interactiveMetadata.shareNote
  ) {
    return null;
  }

  return {
    title,
    description,
    palette,
    themeStyle,
    interactiveMetadata: {
      rsvpMessage: interactiveMetadata.rsvpMessage,
      funFacts: interactiveMetadata.funFacts,
      ctaLabel: interactiveMetadata.ctaLabel,
      shareNote: interactiveMetadata.shareNote,
    },
    invitation,
  };
}
