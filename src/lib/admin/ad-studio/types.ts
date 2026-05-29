export const AD_STUDIO_VIDEO_LENGTHS = [10, 15, 20] as const;
export const AD_STUDIO_FORMATS = ["vertical", "horizontal", "square", "all"] as const;
export const AD_STUDIO_EVENT_TYPES = [
  "baby-shower",
  "wedding",
  "birthday",
  "graduation",
  "gymnastics-meet",
  "sports-event",
  "school-event",
  "open-house",
  "local-business-event",
  "general-event",
] as const;
export const AD_STUDIO_TONES = [
  "premium",
  "emotional",
  "funny",
  "family-friendly",
  "direct-response",
  "modern-saas",
] as const;
export const AD_STUDIO_VISUAL_STYLES = [
  "cinematic-realistic",
  "ugc-style",
  "premium-saas",
  "social-media-ad",
  "app-demo-hybrid",
] as const;
export const AD_STUDIO_CTAS = [
  "create-your-event-page",
  "snap-share-celebrate",
  "turn-your-invite-into-a-live-page",
  "try-envitefy",
  "custom",
] as const;

export type AdStudioVideoLength = (typeof AD_STUDIO_VIDEO_LENGTHS)[number];
export type AdStudioFormat = (typeof AD_STUDIO_FORMATS)[number];
export type AdStudioRenderableFormat = Exclude<AdStudioFormat, "all">;
export type AdStudioEventType = (typeof AD_STUDIO_EVENT_TYPES)[number];
export type AdStudioTone = (typeof AD_STUDIO_TONES)[number];
export type AdStudioVisualStyle = (typeof AD_STUDIO_VISUAL_STYLES)[number];
export type AdStudioCta = (typeof AD_STUDIO_CTAS)[number];

export type PipelineStepId =
  | "creative-concept"
  | "script"
  | "invitation-design"
  | "product-ui"
  | "frame-plan"
  | "base-image-generation"
  | "compositing"
  | "qa"
  | "veo-prompt-package"
  | "export";

export type PipelineStepState = "pending" | "running" | "passed" | "failed";

export type PipelineStepStatus = {
  id: PipelineStepId;
  label: string;
  status: PipelineStepState;
  summary: string;
  error?: string | null;
  updatedAt?: string | null;
};

export type AdStudioRequest = {
  instruction: string;
  videoLength: AdStudioVideoLength;
  format: AdStudioFormat;
  eventType: AdStudioEventType;
  tone: AdStudioTone;
  visualStyle: AdStudioVisualStyle;
  cta: AdStudioCta;
  customCta?: string | null;
};

export type CampaignBrief = {
  campaignTitle: string;
  adSummary: string;
  targetAudience: string;
  painPoint: string;
  emotionalTrigger: string;
  benefit: string;
  cta: string;
  suggestedPlatform: string;
  suggestedVideoLength: AdStudioVideoLength;
  adAngle: string;
  coreProblem: string;
  envitefySolution: string;
  videoStructure: string;
  visualStyle: string;
};

export type VideoScene = {
  sceneNumber: number;
  timestamp: string;
  durationSeconds: number;
  purpose: "hook" | "problem" | "reveal" | "product-demo" | "cta";
  visual: string;
  voiceover: string;
  onScreenText: string;
  captionOverlay: string;
  chatBubbles: string[];
};

export type VideoScript = {
  totalSeconds: AdStudioVideoLength;
  logline: string;
  voiceoverScript: string;
  scenes: VideoScene[];
};

export type InvitationDesign = {
  theme: string;
  colorPalette: {
    background: string;
    accent: string;
    accentSoft: string;
    text: string;
    muted: string;
  };
  layoutStyle: string;
  fields: {
    title: string;
    subtitle: string;
    date: string;
    time: string;
    location: string;
    rsvp: string;
    registry?: string | null;
    host?: string | null;
  };
  metadata: {
    eventType: AdStudioEventType;
    qrPlaceholder: boolean;
    rsvpEnabled: boolean;
    registryEnabled: boolean;
    locationEnabled: boolean;
  };
};

export type PhoneUIDesign = {
  themeTokens: {
    background: string;
    surface: string;
    primary: string;
    primaryText: string;
    text: string;
    muted: string;
  };
  eventPageCard: {
    title: string;
    subtitle: string;
    date: string;
    time: string;
    location: string;
  };
  ctaButtonText: string;
  rsvpModule: {
    label: string;
    yesCount: number;
    maybeCount: number;
  };
  locationCard: {
    label: string;
    address: string;
  };
  registryCard?: {
    label: string;
    urlLabel: string;
  } | null;
  shareModule: {
    label: string;
    shareText: string;
  };
};

export type CompositeTargetType = "invitation" | "phone-ui";

export type FrameCompositeTarget = {
  type: CompositeTargetType;
  surface: "fridge" | "table" | "hand" | "phone-screen" | "hero-phone";
  placementHint: string;
};

export type FramePlanItem = {
  frameNumber: number;
  scenePurpose: string;
  visualDescription: string;
  cameraAngle: string;
  characterAction: string;
  blankSurfaceRequirements: string[];
  compositeTargets: FrameCompositeTarget[];
  lighting: string;
  mood: string;
  negativePrompt: string;
  requiredReferences: string[];
};

export type FramePlan = {
  format: AdStudioRenderableFormat;
  aspectRatio: "9:16" | "16:9" | "1:1";
  frames: FramePlanItem[];
};

export type RenderedAsset = {
  kind: "invitation" | "phone-ui";
  file: string;
  url: string;
  width: number;
  height: number;
  svg: string;
};

export type BaseFrame = {
  frameNumber: number;
  file: string;
  url: string;
  prompt: string;
  provider: string;
  model: string;
  generatedAt: string;
  references: string[];
  hostReferenceFile?: string | null;
  width?: number | null;
  height?: number | null;
};

export type CompositeFrame = {
  frameNumber: number;
  baseFrameFile: string;
  finalFile: string;
  finalUrl: string;
  invitationAssetFile?: string | null;
  phoneUiAssetFile?: string | null;
  placements: Array<{
    type: CompositeTargetType;
    left: number;
    top: number;
    width: number;
    height: number;
  }>;
  generatedAt: string;
};

export type QAResult = {
  frameNumber: number;
  status: "passed" | "failed" | "image_qa_failed";
  passed: boolean;
  failureReason?: string | null;
  retryInstruction?: string | null;
  checks: Array<{
    name: string;
    passed: boolean;
    detail: string;
  }>;
};

export type VeoPromptPackage = {
  masterPrompt: string;
  perScenePrompts: Array<{
    sceneNumber: number;
    sourceFrameFile: string;
    prompt: string;
  }>;
  timingMap: Array<{
    sceneNumber: number;
    startSecond: number;
    endSecond: number;
    overlayText: string;
  }>;
  transitionInstructions: string;
  cameraMotionInstructions: string;
  overlayCaptionInstructions: string;
  finalCtaInstructions: string;
  formatSpecificPrompts: {
    vertical: string;
    horizontal: string;
    square: string;
  };
};

export type ExportPackage = {
  campaignJson: string;
  markdownBrief: string;
  veoPromptText: string;
  voiceoverScript: string;
  captionsSrt: string;
  captionFile: string;
  campaignJsonFile: string;
  markdownFile: string;
  veoPromptFile: string;
  voiceoverFile: string;
  ctaCopy: string;
};

export type AdStudioProviderStatus = {
  id: "openaiText" | "openaiImage" | "videoProvider";
  label: string;
  configured: boolean;
  provider: string;
  model: string;
  envVars: string[];
};

export type AdStudioCampaign = {
  version: 2;
  runId: string;
  createdAt: string;
  updatedAt: string;
  request: AdStudioRequest;
  providerModels: {
    textProvider: string;
    textModel: string;
    imageProvider: string;
    imageModel: string;
    videoProvider: string;
    videoModel: string;
  };
  steps: PipelineStepStatus[];
  campaignBrief: CampaignBrief;
  script: VideoScript;
  invitationDesign: InvitationDesign;
  phoneUiDesign: PhoneUIDesign;
  framePlan: FramePlan;
  deterministicAssets: {
    invitation: RenderedAsset;
    phoneUi: RenderedAsset;
  } | null;
  baseFrames: BaseFrame[];
  compositeFrames: CompositeFrame[];
  qaResults: QAResult[];
  veoPromptPackage: VeoPromptPackage | null;
  exportPackage: ExportPackage | null;
  warnings: string[];
};

export type AdStudioFailure = {
  ok: false;
  error: {
    code: string;
    message: string;
    retryable: boolean;
  };
};

export type AdStudioGenerateSuccess = {
  ok: true;
  provider: string;
  model: string;
  runId: string;
  campaign: AdStudioCampaign;
  warnings: string[];
};

export type AdStudioImagesSuccess = {
  ok: true;
  runId: string;
  provider: string;
  model: string;
  campaign: AdStudioCampaign;
  warnings: string[];
};

export type AdStudioVideoSuccess = {
  ok: true;
  runId: string;
  video: {
    provider: string;
    model: string;
    status: "ready" | "queued";
    promptPackage: VeoPromptPackage;
  };
  warnings: string[];
};

export type AdStudioGenerateResponse = AdStudioGenerateSuccess | AdStudioFailure;
export type AdStudioImagesResponse = AdStudioImagesSuccess | AdStudioFailure;
export type AdStudioVideoResponse = AdStudioVideoSuccess | AdStudioFailure;

export type AdStudioImagesRequest = {
  runId?: string | null;
  campaign: AdStudioCampaign;
  frameNumber?: number | null;
};

export type AdStudioVideoRequest = {
  runId?: string | null;
  campaign: AdStudioCampaign;
};

export type AdminAdStudioProviderStatus = AdStudioProviderStatus;
export type AdminAdStudioGenerateResponse = AdStudioGenerateResponse;
export type AdminAdStudioImagesResponse = AdStudioImagesResponse;
export type AdminAdStudioVideoResponse = AdStudioVideoResponse;
export type AdminAdStudioGenerateRequest = AdStudioRequest;
export type AdminAdStudioImagesRequest = AdStudioImagesRequest;
export type AdminAdStudioVideoRequest = AdStudioVideoRequest;
