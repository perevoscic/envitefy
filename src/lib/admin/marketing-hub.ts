export type AssetType = "social-image" | "short-video";
export type MarketingChannel = "facebook" | "instagram" | "youtube" | "tiktok";
export type CampaignFilter = "all" | MarketingChannel;
export type BrandAssetId = "wordmark" | "app-icon";
export type MarketingHubView = "library" | "new" | "workspace";
export type BadgeTone = "default" | "success" | "warning" | "info" | "danger";

export type MarketingPromptIdea = {
  campaignName: string;
  campaignAngle: string;
  generatedPrompt: string;
  audience: string;
  tone: string;
  callToAction: string;
  visualStyle: string;
  composition: string;
  mood: string;
  rationale: string;
};

export type Caption = {
  text: string;
  emphasisWord: string;
  voiceover: string;
  durationSec: number | null;
  transition: string;
  kineticStyle: string;
  status: string;
  dirty: boolean;
  updatedAt: string | null;
};

export type CreativeQa = {
  pass: boolean;
  reasons: string[];
  framesToRewrite: number[];
  framesToCut: number[];
  captionIssues: string[];
  blockedCaptionPatterns: string[];
  requiredShotFamilies: string[];
  singleFinalPayoffFrame: number | null;
  maxPhoneDominantFrames: number;
  valueClarityScore: number;
  visualVarietyScore: number;
  productProofScore: number;
  rewriteBrief: string;
};

export type Frame = {
  frameNumber: number;
  title: string;
  actionBeat: string;
  cameraShot: string;
  composition: string;
  mood: string;
  imageUrl: string | null;
  captionedImageUrl: string | null;
  caption: Caption;
  status: string;
  error: string | null;
};

export type FramesManifest = {
  frames: Frame[];
  sceneSpec?: {
    cameraFormat?: string;
  };
};

export type RunStageRecord = {
  status?: string;
  error?: string | null;
  updatedAt?: string | null;
};

export type RunStatus = {
  state?: string;
  message?: string;
  currentStage?: string | null;
  generatedAt?: string;
  error?: string | null;
  warningMessages?: string[];
  stages?: Record<string, RunStageRecord>;
  request?: RunRequestInput;
  frameCounts?: {
    total?: number;
    pending?: number;
    generating?: number;
    done?: number;
    error?: number;
  };
};

export type RunRequestInput = {
  assetType?: string;
  campaignName?: string;
  jobLabel?: string;
  productName?: string;
  idea?: string;
  channels?: string[];
  socialPlacement?: string;
  frameCount?: number;
  looseInput?: {
    overrides?: {
      numberOfFrames?: number;
    };
  };
};

export type RunRequest = {
  generatedAt?: string;
  input?: RunRequestInput;
};

export type RunDetail = {
  runId: string;
  runDir: string;
  request: RunRequest | null;
  status: RunStatus | null;
  brief: object | null;
  persona: object | null;
  critique: object | null;
  sceneSpec: { cameraFormat?: { value?: string } } | null;
  framePlan: object | null;
  socialCopy: object | null;
  copyDesk?: {
    available: boolean;
    source: "adapted" | "platform-packs";
    packs: Array<{
      channel: MarketingChannel;
      label: string;
      shortLabel: string;
      fields: Array<{ key: string; label: string; value: string }>;
      copyAll: string;
    }>;
  };
  creativeQa: CreativeQa | null;
  frames: FramesManifest | null;
  videoUrl: string | null;
  captionsUrl: string | null;
};

export type RunSummary = {
  runId: string;
  runDir: string;
  status: RunStatus | null;
  request: RunRequest | null;
  thumbnailUrl?: string | null;
};

export type MarketingHubForm = {
  assetType: AssetType;
  campaignName: string;
  idea: string;
  audience: string;
  objective: string;
  channels: MarketingChannel[];
  brandAssets: BrandAssetId[];
  socialPlacement: string;
  criteria: string;
  productName: string;
  targetVertical: string;
  tone: string;
  callToAction: string;
  frameCount: string;
  notes: string;
  characterLock: string;
  outfitLock: string;
  phoneLock: string;
  flyerLock: string;
  locationLock: string;
  backgroundAnchors: string;
  screenLock: string;
  cameraFormat: string;
  visualStyle: string;
  composition: string;
  mood: string;
};

export const TARGET_VERTICALS = [
  "Birthday",
  "Wedding",
  "Gymnastics",
  "Football",
  "Dance",
  "General",
];

export const KINETIC_STYLES = ["pop-in", "typewriter", "word-by-word", "static"];

export const SOCIAL_PLACEMENTS = [
  {
    value: "feed-square",
    label: "Feed Post",
    detail: "Instagram + Facebook",
    ratio: "1:1",
    cameraFormat: "square",
  },
  {
    value: "story-vertical",
    label: "Story",
    detail: "Instagram + Facebook",
    ratio: "9:16",
    cameraFormat: "vertical",
  },
  {
    value: "social-landscape",
    label: "Landscape Post",
    detail: "YouTube",
    ratio: "16:9",
    cameraFormat: "horizontal",
  },
] as const;

export const VIDEO_FORMATS = [
  {
    value: "vertical",
    label: "Vertical Video",
    detail: "Reels, TikTok, Shorts",
    ratio: "9:16",
  },
  {
    value: "square",
    label: "Square Video",
    detail: "Social feeds",
    ratio: "1:1",
  },
  {
    value: "horizontal",
    label: "Landscape Video",
    detail: "YouTube + paid social",
    ratio: "16:9",
  },
] as const;

export const STAGE_ORDER = [
  "brief",
  "persona",
  "critique",
  "art-direction",
  "coordinator",
  "social-copy",
  "creative-qa",
  "image-generation",
  "social-export",
  "video",
];

export const MARKETING_CHANNELS = [
  { value: "facebook" as const, label: "Facebook", shortLabel: "FB" },
  { value: "instagram" as const, label: "Instagram", shortLabel: "IG" },
  { value: "youtube" as const, label: "YouTube", shortLabel: "YT" },
  { value: "tiktok" as const, label: "TikTok", shortLabel: "TT" },
];

export const BRAND_ASSETS = [
  {
    value: "wordmark" as const,
    label: "Envitefy wordmark",
    description: "Wide brand-name placement",
    src: "/brand/envitefy-wordmark.png",
  },
  {
    value: "app-icon" as const,
    label: "Envitefy app icon",
    description: "Compact icon or app badge",
    src: "/icons/apple-touch-icon-120.png",
  },
];

export const INITIAL_FORM: MarketingHubForm = {
  assetType: "social-image",
  campaignName: "",
  idea: "",
  audience: "",
  objective: "",
  channels: ["instagram"],
  brandAssets: ["wordmark", "app-icon"],
  socialPlacement: "feed-square",
  criteria: "",
  productName: "Envitefy",
  targetVertical: "",
  tone: "",
  callToAction: "",
  frameCount: "3",
  notes: "",
  characterLock: "",
  outfitLock: "",
  phoneLock: "",
  flyerLock: "",
  locationLock: "",
  backgroundAnchors: "",
  screenLock: "",
  cameraFormat: "square",
  visualStyle: "",
  composition: "",
  mood: "",
};

export const ADVANCED_FORM_FIELDS = [
  { key: "characterLock", label: "Character Lock" },
  { key: "outfitLock", label: "Outfit Lock" },
  { key: "phoneLock", label: "Phone Lock" },
  { key: "flyerLock", label: "Flyer Lock" },
  { key: "locationLock", label: "Location Lock" },
  { key: "backgroundAnchors", label: "Background Anchors" },
  { key: "screenLock", label: "Screen Lock" },
  { key: "visualStyle", label: "Visual Style" },
  { key: "composition", label: "Composition" },
  { key: "mood", label: "Mood" },
] as const;

export const ACTIVE_RUN_STATES = [
  "queued",
  "running",
  "render-queued",
  "rendering_video",
  "rendering_images",
];

export function stageLabel(key: string) {
  if (key === "art-direction") return "Art Direction";
  if (key === "social-copy") return "Social Copy";
  if (key === "creative-qa") return "Creative QA";
  if (key === "image-generation") return "Image Generation";
  if (key === "social-export") return "Social Export";
  return key
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function normalizeAssetType(value: unknown): AssetType {
  return value === "social-image" ? "social-image" : "short-video";
}

export function assetTypeLabel(value: AssetType) {
  return value === "social-image" ? "Social image" : "Short video";
}

export function channelLabel(value: string) {
  return MARKETING_CHANNELS.find((channel) => channel.value === value)?.label || value;
}

export function prettyJson(value: unknown) {
  return JSON.stringify(value, null, 2);
}

export function clampDuration(value: number | null) {
  const numeric = typeof value === "number" && Number.isFinite(value) ? value : 2;
  return Math.min(3.5, Math.max(1.2, numeric));
}

export function formatTimestamp(value: string | null | undefined) {
  if (!value) return "---";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

export function statusTone(status: string | null | undefined): BadgeTone {
  const normalized = (status || "").toLowerCase();
  if (["done", "completed", "complete", "succeeded", "ready"].includes(normalized)) {
    return "success";
  }
  if (ACTIVE_RUN_STATES.includes(normalized) || normalized === "generating") return "info";
  if (["warning", "warnings"].includes(normalized)) return "warning";
  if (["failed", "error"].includes(normalized)) return "danger";
  return "default";
}

export function statusLabel(status: string | null | undefined) {
  if (!status) return "Pending";
  return status.replaceAll("_", " ");
}

export function hubStatusLabel(status: string | null | undefined) {
  const normalized = (status || "").toLowerCase();
  if (ACTIVE_RUN_STATES.includes(normalized)) return "Generating";
  if (normalized === "awaiting_caption_review" || normalized === "awaiting_storyboard_review") {
    return "Ready";
  }
  if (["done", "completed", "complete", "succeeded"].includes(normalized)) return "Done";
  if (["failed", "error"].includes(normalized)) return "Failed";
  return statusLabel(status);
}

export function summarizeStageTime(updatedAt: string | null | undefined) {
  return formatTimestamp(updatedAt);
}

export function formatRunState(value: string | null | undefined) {
  return hubStatusLabel(value);
}

export function formatStageName(value: string | null | undefined) {
  if (!value) return "Idle";
  return stageLabel(value);
}

export function scoreTone(score: number | null | undefined): BadgeTone {
  if (typeof score !== "number" || Number.isFinite(score) === false) return "default";
  if (score >= 4) return "success";
  if (score === 3) return "warning";
  return "danger";
}

export function isActiveRunState(value: string | null | undefined) {
  return ACTIVE_RUN_STATES.includes((value || "").toLowerCase());
}

export function campaignTitle(run: {
  request?: RunRequest | null;
  runId?: string;
} | null) {
  return (
    run?.request?.input?.campaignName ||
    run?.request?.input?.jobLabel ||
    run?.request?.input?.productName ||
    run?.runId ||
    "Untitled campaign"
  );
}

export function campaignChannels(run: { request?: RunRequest | null } | null) {
  const channels = run?.request?.input?.channels;
  return Array.isArray(channels) ? channels : [];
}

export function mediaAspectClass(cameraFormat: string) {
  if (cameraFormat === "horizontal") return "aspect-[16/9]";
  if (cameraFormat === "square") return "aspect-square";
  return "aspect-[9/16]";
}

export function normalizeCreativeQa(qa: CreativeQa | null | undefined): CreativeQa | null {
  if (!qa) return null;
  return {
    pass: Boolean(qa.pass),
    reasons: Array.isArray(qa.reasons) ? qa.reasons : [],
    framesToRewrite: Array.isArray(qa.framesToRewrite) ? qa.framesToRewrite : [],
    framesToCut: Array.isArray(qa.framesToCut) ? qa.framesToCut : [],
    captionIssues: Array.isArray(qa.captionIssues) ? qa.captionIssues : [],
    blockedCaptionPatterns: Array.isArray(qa.blockedCaptionPatterns)
      ? qa.blockedCaptionPatterns
      : [],
    requiredShotFamilies: Array.isArray(qa.requiredShotFamilies) ? qa.requiredShotFamilies : [],
    singleFinalPayoffFrame:
      typeof qa.singleFinalPayoffFrame === "number" && Number.isFinite(qa.singleFinalPayoffFrame)
        ? qa.singleFinalPayoffFrame
        : null,
    maxPhoneDominantFrames:
      typeof qa.maxPhoneDominantFrames === "number" && Number.isFinite(qa.maxPhoneDominantFrames)
        ? qa.maxPhoneDominantFrames
        : 0,
    valueClarityScore:
      typeof qa.valueClarityScore === "number" && Number.isFinite(qa.valueClarityScore)
        ? qa.valueClarityScore
        : 0,
    visualVarietyScore:
      typeof qa.visualVarietyScore === "number" && Number.isFinite(qa.visualVarietyScore)
        ? qa.visualVarietyScore
        : 0,
    productProofScore:
      typeof qa.productProofScore === "number" && Number.isFinite(qa.productProofScore)
        ? qa.productProofScore
        : 0,
    rewriteBrief: typeof qa.rewriteBrief === "string" ? qa.rewriteBrief : "",
  };
}

export function runAssetType(run: {
  request?: RunRequest | null;
  status?: RunStatus | null;
} | null): AssetType {
  return normalizeAssetType(run?.request?.input?.assetType || run?.status?.request?.assetType);
}
