export const STUDIO_PLATFORMS = ["instagram", "facebook", "youtube", "reddit"] as const;
export type StudioPlatform = (typeof STUDIO_PLATFORMS)[number];
export type StudioOutput = "prompt" | "image" | "video";
export type StudioFormat = "square" | "vertical" | "horizontal";
export type StudioStatus = "queued" | "developing" | "submitting" | "running" | "finalizing" | "ready" | "failed" | "submission_unknown";

export type StudioSettings = {
  output: StudioOutput;
  platform: StudioPlatform;
  format: StudioFormat;
  audience: string;
  tone: string;
  callToAction: string;
  branding: boolean;
};

export const DEFAULT_STUDIO_SETTINGS: StudioSettings = {
  output: "image", platform: "instagram", format: "square",
  audience: "", tone: "", callToAction: "", branding: false,
};

export function defaultStudioFormat(platform: StudioPlatform, output: StudioOutput): StudioFormat {
  if (output === "video") return platform === "reddit" ? "horizontal" : "vertical";
  return platform === "youtube" ? "horizontal" : "square";
}

export function isActiveStudioStatus(status: StudioStatus): boolean {
  return !["ready", "failed", "submission_unknown"].includes(status);
}

export type StudioAsset = {
  id: string;
  conversationId: string;
  versionId: string | null;
  name: string;
  mimeType: string;
  size: number;
  url: string;
};

export type StudioTurnInput = {
  clientRequestId: string;
  text: string;
  settings: StudioSettings;
  parentVersionId: string | null;
  referenceAssetIds: string[];
  promptOverride?: string;
};

export type StudioResult = {
  prompt: string;
  direction: string;
  caption: string;
  headline?: string;
  assetId?: string;
  rawAssetId?: string;
  mimeType?: string;
  width?: number;
  height?: number;
  durationSec?: number;
};

export type StudioProviderState = {
  model?: string;
  interactionId?: string;
  videoUri?: string;
  attempts?: number;
  usedRestoredContext?: boolean;
};

export type StudioVersion = {
  id: string;
  conversationId: string;
  parentVersionId: string | null;
  output: StudioOutput;
  status: StudioStatus;
  input: StudioTurnInput;
  result: StudioResult | null;
  provider: StudioProviderState;
  error: string | null;
  createdAt: string;
  updatedAt: string;
};

export type StudioMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  versionId: string | null;
  createdAt: string;
};

export type StudioConversationSummary = {
  id: string;
  title: string;
  settings: StudioSettings;
  draft: string;
  referenceAssetIds: string[];
  selectedVersionId: string | null;
  updatedAt: string;
  latestVersion: StudioVersion | null;
};

export type StudioConversation = StudioConversationSummary & {
  messages: StudioMessage[];
  versions: StudioVersion[];
  attachments: StudioAsset[];
};

export type StudioConversationPatch = {
  title?: string;
  draft?: string;
  settings?: StudioSettings;
  referenceAssetIds?: string[];
  selectedVersionId?: string | null;
};

export type StudioVersionPatch = {
  status?: StudioStatus;
  result?: StudioResult | null;
  provider?: StudioProviderState;
  error?: string | null;
  nextPollAt?: string | null;
};

export function studioAssetUrl(id: string, download = false): string {
  return `/api/admin/marketing-studio/assets/${encodeURIComponent(id)}${download ? "?download=1" : ""}`;
}

export const STUDIO_STATUS_LABELS: Record<StudioStatus, string> = {
  queued: "Getting started", developing: "Developing your idea", submitting: "Starting generation",
  running: "Creating your video", finalizing: "Finishing your creation", ready: "Ready",
  failed: "Needs attention", submission_unknown: "Check generation status",
};
