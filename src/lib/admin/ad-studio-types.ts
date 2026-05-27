export const ADMIN_AD_STUDIO_ACCENTS = ["lilac", "mint", "coral", "ocean", "midnight"] as const;
export const ADMIN_AD_STUDIO_CAPTION_STYLES = ["cinematic", "playful", "editorial"] as const;
export const ADMIN_AD_STUDIO_FORMATS = ["vertical", "horizontal", "square"] as const;
export const ADMIN_AD_STUDIO_VIDEO_PROVIDERS = ["ffmpeg", "veo"] as const;

export type AdminAdStudioAccent = (typeof ADMIN_AD_STUDIO_ACCENTS)[number];
export type AdminAdStudioCaptionStyle = (typeof ADMIN_AD_STUDIO_CAPTION_STYLES)[number];
export type AdminAdStudioFormat = (typeof ADMIN_AD_STUDIO_FORMATS)[number];
export type AdminAdStudioVideoProvider = (typeof ADMIN_AD_STUDIO_VIDEO_PROVIDERS)[number];
export type AdminAdStudioProviderId = "geminiText" | "nanoBananaImage" | "veoVideo";

export type AdminAdStudioBeat = {
  tag: string;
  headline: string;
  subheadline: string;
  body: string;
};

export type AdminAdStudioConfig = {
  eventTitle: string;
  eventDate: string;
  location: string;
  audience: string;
  goal: string;
  outputFormat: AdminAdStudioFormat;
  accentColor: AdminAdStudioAccent;
  captionStyle: AdminAdStudioCaptionStyle;
  socialCaption: string;
  hashtags: string[];
  beats: [AdminAdStudioBeat, AdminAdStudioBeat, AdminAdStudioBeat, AdminAdStudioBeat];
};

export type AdminAdStudioGenerateRequest = {
  brief: string;
  eventTitle?: string | null;
  eventDate?: string | null;
  location?: string | null;
  audience?: string | null;
  goal?: string | null;
  outputFormat?: AdminAdStudioFormat | null;
};

export type AdminAdStudioProviderStatus = {
  id: AdminAdStudioProviderId;
  label: string;
  configured: boolean;
  model: string;
  envVars: string[];
};

export type AdminAdStudioFrameAsset = {
  beatIndex: 0 | 1 | 2 | 3;
  url: string;
  file: string;
  prompt: string;
  provider: "nano-banana";
  model: string;
  generatedAt: string;
};

export type AdminAdStudioVideoAsset = {
  url: string | null;
  file: string | null;
  provider: AdminAdStudioVideoProvider;
  model: string;
  status: "done" | "running";
  operationName?: string | null;
  generatedAt?: string | null;
};

export type AdminAdStudioGenerateSuccess = {
  ok: true;
  provider: "gemini";
  model: string;
  runId: string;
  ad: AdminAdStudioConfig;
  warnings: string[];
};

export type AdminAdStudioFailure = {
  ok: false;
  error: {
    code: string;
    message: string;
    retryable: boolean;
  };
};

export type AdminAdStudioGenerateResponse = AdminAdStudioGenerateSuccess | AdminAdStudioFailure;

export type AdminAdStudioImagesRequest = {
  runId?: string | null;
  ad: AdminAdStudioConfig;
  frameIndex?: number | null;
};

export type AdminAdStudioImagesSuccess = {
  ok: true;
  runId: string;
  provider: "nano-banana";
  model: string;
  frames: AdminAdStudioFrameAsset[];
  warnings: string[];
};

export type AdminAdStudioImagesResponse = AdminAdStudioImagesSuccess | AdminAdStudioFailure;

export type AdminAdStudioVideoRequest = {
  runId?: string | null;
  ad: AdminAdStudioConfig;
  frames: AdminAdStudioFrameAsset[];
  provider?: AdminAdStudioVideoProvider | null;
};

export type AdminAdStudioVideoSuccess = {
  ok: true;
  runId: string;
  video: AdminAdStudioVideoAsset;
  warnings: string[];
};

export type AdminAdStudioVideoResponse = AdminAdStudioVideoSuccess | AdminAdStudioFailure;

export const DEFAULT_ADMIN_AD_STUDIO_CONFIG: AdminAdStudioConfig = {
  eventTitle: "Sophia's Birthday Party",
  eventDate: "Saturday, May 24, 2:00 PM",
  location: "Our Home",
  audience: "Busy parents planning a social event",
  goal: "Drive hosts to create and share an Envitefy invite",
  outputFormat: "vertical",
  accentColor: "lilac",
  captionStyle: "cinematic",
  socialCaption:
    "Party planning should not live in five group chats. Build the invite, collect RSVPs, and share one beautiful Envitefy link.",
  hashtags: ["#Envitefy", "#PartyPlanning", "#DigitalInvites"],
  beats: [
    {
      tag: "Problem",
      headline: "Stressed about party planning?",
      subheadline: "Details spread across notes, texts, and half-finished drafts.",
      body: "The host is juggling dates, addresses, RSVP reminders, and guest questions.",
    },
    {
      tag: "Chaos",
      headline: "Group chats bury the important stuff.",
      subheadline: "Every guest asks for the same details again.",
      body: "One live invite link replaces the scroll with details, RSVPs, and responses.",
    },
    {
      tag: "Reveal",
      headline: "Meet the live invite.",
      subheadline: "A live invitation page in minutes.",
      body: "Turn event details into a polished, shareable guest experience.",
    },
    {
      tag: "Share",
      headline: "Send one link. Stay organized.",
      subheadline: "RSVPs, schedule details, and sharing live together.",
      body: "Copy the invite link and send guests to the same beautiful source of truth.",
    },
  ],
};

export function isAdminAdStudioAccent(value: string): value is AdminAdStudioAccent {
  return ADMIN_AD_STUDIO_ACCENTS.includes(value as AdminAdStudioAccent);
}

export function isAdminAdStudioCaptionStyle(value: string): value is AdminAdStudioCaptionStyle {
  return ADMIN_AD_STUDIO_CAPTION_STYLES.includes(value as AdminAdStudioCaptionStyle);
}

export function isAdminAdStudioFormat(value: string): value is AdminAdStudioFormat {
  return ADMIN_AD_STUDIO_FORMATS.includes(value as AdminAdStudioFormat);
}

export function isAdminAdStudioVideoProvider(value: string): value is AdminAdStudioVideoProvider {
  return ADMIN_AD_STUDIO_VIDEO_PROVIDERS.includes(value as AdminAdStudioVideoProvider);
}
