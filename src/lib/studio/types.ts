export type StudioGenerateMode = "text" | "image" | "both";

export type StudioEventDetails = {
  title: string;
  occasion?: string | null;
  hostName?: string | null;
  honoreeName?: string | null;
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
};

export type StudioGenerationGuidance = {
  tone?: string | null;
  style?: string | null;
  audience?: string | null;
  colorPalette?: string | null;
  includeEmoji?: boolean | null;
};

export type StudioGenerateRequest = {
  mode?: StudioGenerateMode;
  event: StudioEventDetails;
  guidance?: StudioGenerationGuidance;
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

function normalizeEvent(value: unknown): StudioEventDetails | null {
  if (!value || typeof value !== "object") return null;
  const title = safeString((value as any).title);
  if (!title) return null;
  return {
    title,
    occasion: safeNullableString((value as any).occasion),
    hostName: safeNullableString((value as any).hostName),
    honoreeName: safeNullableString((value as any).honoreeName),
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
    },
  };
}

function maybeStringField(value: unknown): string {
  return safeString(value);
}

export function normalizeInvitationText(value: unknown): StudioInvitationText | null {
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
