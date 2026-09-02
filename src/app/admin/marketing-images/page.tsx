"use client";

import Link from "next/link";
import { useEffect, useId, useMemo, useState, type ReactNode } from "react";
import { useSession } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Clapperboard,
  Clock3,
  Download,
  FileJson,
  GalleryHorizontal,
  ImagePlus,
  Images,
  LayoutGrid,
  Loader2,
  MonitorUp,
  MoreHorizontal,
  Play,
  RotateCcw,
  Save,
  Smartphone,
  Sparkles,
  Video,
  X,
} from "lucide-react";

type AssetType = "social-image" | "short-video";

type Caption = {
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

type CreativeQa = {
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

type Frame = {
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

type FramesManifest = {
  frames: Frame[];
  sceneSpec?: {
    cameraFormat?: string;
  };
};

type RunDetail = {
  runId: string;
  runDir: string;
  request: any;
  status: any;
  brief: any;
  persona: any;
  critique: any;
  sceneSpec: any;
  framePlan: any;
  socialCopy: any;
  creativeQa: CreativeQa | null;
  frames: FramesManifest | null;
  videoUrl: string | null;
  captionsUrl: string | null;
};

type RunSummary = {
  runId: string;
  runDir: string;
  status: any;
  request: any;
};

type BadgeTone = "default" | "success" | "warning" | "info" | "danger";

const TARGET_VERTICALS = [
  "Birthday",
  "Wedding",
  "Gymnastics",
  "Football",
  "Dance",
  "General",
];

const KINETIC_STYLES = ["pop-in", "typewriter", "word-by-word", "static"];

const SOCIAL_PLACEMENTS = [
  {
    value: "feed-square",
    label: "Feed Post",
    detail: "Instagram + Facebook",
    ratio: "1:1",
    cameraFormat: "square",
    icon: GalleryHorizontal,
  },
  {
    value: "story-vertical",
    label: "Story",
    detail: "Instagram + Facebook",
    ratio: "9:16",
    cameraFormat: "vertical",
    icon: Smartphone,
  },
  {
    value: "social-landscape",
    label: "Landscape Post",
    detail: "LinkedIn + X",
    ratio: "16:9",
    cameraFormat: "horizontal",
    icon: MonitorUp,
  },
] as const;

const VIDEO_FORMATS = [
  {
    value: "vertical",
    label: "Vertical Video",
    detail: "Reels, TikTok, Shorts",
    ratio: "9:16",
    icon: Smartphone,
  },
  {
    value: "square",
    label: "Square Video",
    detail: "Social feeds",
    ratio: "1:1",
    icon: GalleryHorizontal,
  },
  {
    value: "horizontal",
    label: "Landscape Video",
    detail: "YouTube + paid social",
    ratio: "16:9",
    icon: MonitorUp,
  },
] as const;

const STAGE_ORDER = [
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

const INITIAL_FORM = {
  assetType: "social-image" as AssetType,
  socialPlacement: "feed-square",
  criteria: "",
  productName: "",
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

function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function stageLabel(key: string) {
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

function normalizeAssetType(value: unknown): AssetType {
  return value === "social-image" ? "social-image" : "short-video";
}

function assetTypeLabel(value: AssetType) {
  return value === "social-image" ? "Social image" : "Short-form video";
}

function prettyJson(value: unknown) {
  return JSON.stringify(value, null, 2);
}

function clampDuration(value: number | null) {
  const numeric = typeof value === "number" && Number.isFinite(value) ? value : 2;
  return Math.min(3.5, Math.max(1.2, numeric));
}

function formatTimestamp(value: string | null | undefined) {
  if (!value) return "---";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function statusTone(status: string | null | undefined): BadgeTone {
  const normalized = (status || "").toLowerCase();
  if (["done", "completed", "complete", "succeeded"].includes(normalized)) return "success";
  if (["running", "queued", "rendering_video", "rendering_images", "render-queued"].includes(normalized)) {
    return "info";
  }
  if (["warning", "warnings"].includes(normalized)) return "warning";
  if (["failed", "error"].includes(normalized)) return "danger";
  return "default";
}

function statusLabel(status: string | null | undefined) {
  if (!status) return "Pending";
  return status.replaceAll("_", " ");
}

function summarizeStageTime(updatedAt: string | null | undefined) {
  return formatTimestamp(updatedAt);
}

function formatRunState(value: string | null | undefined) {
  return statusLabel(value);
}

function formatStageName(value: string | null | undefined) {
  if (!value) return "Idle";
  return stageLabel(value);
}

function scoreTone(score: number | null | undefined): BadgeTone {
  if (typeof score !== "number" || !Number.isFinite(score)) return "default";
  if (score >= 4) return "success";
  if (score === 3) return "warning";
  return "danger";
}

function PageCard({
  children,
  title,
  action,
  className,
  headerClassName,
  bodyClassName,
}: {
  children: ReactNode;
  title?: ReactNode;
  action?: ReactNode;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-[28px] border border-[#e4e0ef] bg-white shadow-[0_22px_60px_rgba(84,49,170,0.08)]",
        className,
      )}
    >
      {title || action ? (
        <div
          className={cn(
            "flex items-center justify-between gap-3 border-b border-[#f0ecf7] px-6 py-4",
            headerClassName,
          )}
        >
          {title ? <div>{title}</div> : <div />}
          {action}
        </div>
      ) : null}
      <div className={cn("px-6 py-5", bodyClassName)}>{children}</div>
    </section>
  );
}

function StatusBadge({ children, tone = "default" }: { children: ReactNode; tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em]",
        tone === "success" && "bg-[#ebfbf0] text-[#3f9a67]",
        tone === "info" && "bg-[#f4ecff] text-[#7c67c5]",
        tone === "warning" && "bg-[#fff4df] text-[#bb7a15]",
        tone === "danger" && "bg-[#fff0f0] text-[#b64c4c]",
        tone === "default" && "bg-[#f4f2f8] text-[#7d7790]",
      )}
    >
      {children}
    </span>
  );
}

function Label({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  const className = "px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7f7897]";
  return htmlFor ? (
    <label htmlFor={htmlFor} className={className}>
      {children}
    </label>
  ) : (
    <div className={className}>{children}</div>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  min,
  max,
  step,
}: {
  label: string;
  value: string | number;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
  min?: number;
  max?: number;
  step?: number;
}) {
  const inputId = useId();
  const hasValue = `${value}`.length > 0;
  return (
    <div className="space-y-1.5">
      <Label htmlFor={inputId}>{label}</Label>
      <input
        id={inputId}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        style={{ WebkitTextFillColor: hasValue ? "#271a45" : "#8a84a1" }}
        className={cn(
          "w-full rounded-[18px] border border-[#ddd8e9] bg-[#fbfafc] px-4 py-3 text-sm outline-none transition placeholder:text-[#8a84a1] focus:border-[#8f78df] focus:bg-white",
          hasValue ? "text-[#271a45]" : "text-[#8a84a1]",
        )}
      />
    </div>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
  helper,
}: {
  label: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  rows?: number;
  helper?: string;
}) {
  const inputId = useId();
  return (
    <div className="space-y-1.5">
      <Label htmlFor={inputId}>{label}</Label>
      <textarea
        id={inputId}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        className="w-full resize-none rounded-[18px] border border-[#ddd8e9] bg-[#fbfafc] px-4 py-3 text-sm text-[#271a45] outline-none transition placeholder:text-[#8a84a1] focus:border-[#8f78df] focus:bg-white"
      />
      {helper ? <p className="px-1 text-xs text-[#8a84a1]">{helper}</p> : null}
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  emptyLabel,
}: {
  label: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  options: string[];
  emptyLabel?: string;
}) {
  const inputId = useId();
  return (
    <div className="space-y-1.5">
      <Label htmlFor={inputId}>{label}</Label>
      <div className="relative">
        <select
          id={inputId}
          value={value}
          onChange={onChange}
          className={cn(
            "w-full appearance-none rounded-[18px] border border-[#ddd8e9] bg-[#fbfafc] px-4 py-3 pr-10 text-sm outline-none transition focus:border-[#8f78df] focus:bg-white",
            value ? "text-[#271a45]" : "text-[#8a84a1]",
          )}
        >
          {emptyLabel ? (
            <option value="" className="text-[#271a45]">
              {emptyLabel}
            </option>
          ) : null}
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9088a6]" />
      </div>
    </div>
  );
}

function SecondaryButton({
  children,
  onClick,
  disabled,
  icon,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  icon?: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[18px] border border-[#ddd8e9] bg-white px-4 py-2.5 text-sm font-semibold text-[#5f5678] transition hover:bg-[#faf8fd] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c67c5] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {icon}
      {children}
    </button>
  );
}

function PrimaryButton({
  children,
  type = "button",
  onClick,
  disabled,
  icon,
  className,
}: {
  children: ReactNode;
  type?: "button" | "submit";
  onClick?: () => void;
  disabled?: boolean;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-[18px] bg-[#7c67c5] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_16px_28px_rgba(124,103,197,0.25)] transition hover:bg-[#715abf] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c67c5] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
    >
      {icon}
      {children}
    </button>
  );
}

export default function MarketingCampaignsPage() {
  const { data: session, status } = useSession();
  const isAdmin = Boolean((session?.user as any)?.isAdmin);
  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [selectedRunId, setSelectedRunId] = useState("");
  const [detail, setDetail] = useState<RunDetail | null>(null);
  const [loadingRuns, setLoadingRuns] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [savingCaptions, setSavingCaptions] = useState(false);
  const [regeneratingCaptions, setRegeneratingCaptions] = useState(false);
  const [regeneratingStoryboard, setRegeneratingStoryboard] = useState(false);
  const [renderingSocialImages, setRenderingSocialImages] = useState(false);
  const [renderingVideo, setRenderingVideo] = useState(false);
  const [lightboxFrame, setLightboxFrame] = useState<Frame | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [referenceImageFiles, setReferenceImageFiles] = useState<File[]>([]);

  async function loadRuns(preserveSelection = true, autoSelect = true) {
    setLoadingRuns(true);
    try {
      const response = await fetch("/api/admin/marketing-campaigns", { cache: "no-store" });
      const json = await response.json();
      if (!response.ok) throw new Error(json?.error || "Failed to load runs");
      const nextRuns = Array.isArray(json.runs) ? json.runs : [];
      setRuns(nextRuns);
      if (autoSelect && (!preserveSelection || !selectedRunId)) {
        setSelectedRunId(nextRuns[0]?.runId || "");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load runs");
    } finally {
      setLoadingRuns(false);
    }
  }

  async function loadDetail(runId: string, preserveFrames = false) {
    if (!runId) return;
    setLoadingDetail(true);
    try {
      const response = await fetch(`/api/admin/marketing-campaigns/${encodeURIComponent(runId)}`, {
        cache: "no-store",
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json?.error || "Failed to load run detail");
      setDetail((current) => {
        if (!preserveFrames || !current?.frames?.frames?.length || !json?.frames?.frames?.length) {
          return json;
        }
        const currentFrames = new Map(current.frames.frames.map((frame) => [frame.frameNumber, frame]));
        json.frames.frames = json.frames.frames.map((frame: Frame) => {
          const existing = currentFrames.get(frame.frameNumber);
          if (!existing?.caption?.dirty) return frame;
          return {
            ...frame,
            caption: existing.caption,
          };
        });
        return json;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load run detail");
    } finally {
      setLoadingDetail(false);
    }
  }

  useEffect(() => {
    if (status !== "authenticated" || !isAdmin) {
      setLoadingRuns(false);
      return;
    }
    loadRuns(false);
  }, [status, isAdmin]);

  useEffect(() => {
    if (!selectedRunId || status !== "authenticated" || !isAdmin) return;
    loadDetail(selectedRunId);
  }, [selectedRunId, status, isAdmin]);

  useEffect(() => {
    if (!detail?.status?.state) return;
    const shouldPoll = ["queued", "running", "render-queued", "rendering_video", "rendering_images"].includes(
      detail.status.state,
    );
    if (!shouldPoll) return;
    const intervalId = window.setInterval(() => {
      loadDetail(detail.runId, true);
      loadRuns(true);
    }, 2000);
    return () => window.clearInterval(intervalId);
  }, [detail?.runId, detail?.status?.state]);

  const detailAssetType = normalizeAssetType(
    detail?.request?.input?.assetType || detail?.status?.request?.assetType,
  );
  const formIsSocialImage = form.assetType === "social-image";

  const stages = useMemo(() => {
    const stageMap = detail?.status?.stages || {};
    return STAGE_ORDER.map((key) => ({
      key,
      label: stageLabel(key),
      status: stageMap[key]?.status || "pending",
      error: stageMap[key]?.error || null,
      updatedAt: stageMap[key]?.updatedAt || null,
    }));
  }, [detail]);
  const visibleStages = stages.filter((stage) =>
    detailAssetType === "social-image" ? stage.key !== "video" : stage.key !== "social-export",
  );

  const frameRows = detail?.frames?.frames || [];
  const qaSummary = useMemo<CreativeQa | null>(() => {
    if (!detail?.creativeQa) return null;
    const qa = detail.creativeQa;
    return {
      pass: Boolean(qa.pass),
      reasons: Array.isArray(qa.reasons) ? qa.reasons : [],
      framesToRewrite: Array.isArray(qa.framesToRewrite) ? qa.framesToRewrite : [],
      framesToCut: Array.isArray(qa.framesToCut) ? qa.framesToCut : [],
      captionIssues: Array.isArray(qa.captionIssues) ? qa.captionIssues : [],
      blockedCaptionPatterns: Array.isArray(qa.blockedCaptionPatterns) ? qa.blockedCaptionPatterns : [],
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
  }, [detail?.creativeQa]);
  const runIsActive = ["queued", "running", "render-queued", "rendering_video", "rendering_images"].includes(
    detail?.status?.state || "",
  );
  const storyboardCanRegenerate =
    Boolean(qaSummary) ||
    Boolean(
      detail?.status?.state === "awaiting_storyboard_review" &&
        detail?.status?.stages?.coordinator?.error,
    );
  const cameraFormat = detail?.sceneSpec?.cameraFormat?.value || detail?.frames?.sceneSpec?.cameraFormat || "vertical";
  const mediaAspectClass =
    cameraFormat === "horizontal"
      ? "aspect-[16/9]"
      : cameraFormat === "square"
        ? "aspect-square"
        : "aspect-[9/16]";
  const preparedPostCount = frameRows.filter((frame) => Boolean(frame.captionedImageUrl)).length;
  const detailSocialPlacement = SOCIAL_PLACEMENTS.find(
    (placement) => placement.value === detail?.request?.input?.socialPlacement,
  );

  function handleAssetTypeChange(assetType: AssetType) {
    setForm((current) => ({
      ...current,
      assetType,
      socialPlacement: assetType === "social-image" ? "feed-square" : current.socialPlacement,
      cameraFormat: assetType === "social-image" ? "square" : "vertical",
      frameCount: assetType === "social-image" ? "3" : "5",
    }));
  }

  function handleSocialPlacementChange(value: string) {
    const placement = SOCIAL_PLACEMENTS.find((item) => item.value === value);
    if (!placement) return;
    setForm((current) => ({
      ...current,
      socialPlacement: placement.value,
      cameraFormat: placement.cameraFormat,
    }));
  }

  async function handleGenerate(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const parsedFrameCount = Number.parseInt(`${form.frameCount}`.trim(), 10);
      const frameCount =
        Number.isFinite(parsedFrameCount) && parsedFrameCount >= 1
          ? Math.min(24, parsedFrameCount)
          : 5;
      const payload = {
        assetType: form.assetType,
        socialPlacement: form.assetType === "social-image" ? form.socialPlacement : "",
        criteria: form.criteria,
        productName: form.productName,
        targetVertical: form.targetVertical || "General",
        tone: form.tone,
        callToAction: form.callToAction,
        frameCount,
        notes: form.notes,
        overrides: {
          characterLock: form.characterLock,
          outfitLock: form.outfitLock,
          phoneLock: form.phoneLock,
          flyerLock: form.flyerLock,
          locationLock: form.locationLock,
          backgroundAnchors: form.backgroundAnchors,
          screenLock: form.screenLock,
          cameraFormat: form.cameraFormat,
          visualStyle: form.visualStyle,
          composition: form.composition,
          mood: form.mood,
        },
      };
      const requestInit: RequestInit =
        referenceImageFiles.length > 0
          ? (() => {
              const formData = new FormData();
              formData.append("payload", JSON.stringify(payload));
              for (const file of referenceImageFiles) {
                formData.append("referenceImages", file);
              }
              return {
                method: "POST",
                body: formData,
              };
            })()
          : {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            };
      const response = await fetch("/api/admin/marketing-campaigns", requestInit);
      const json = await response.json();
      if (!response.ok) throw new Error(json?.error || "Failed to start run");
      await loadRuns(false);
      setSelectedRunId(json.runId);
      await loadDetail(json.runId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start run");
    } finally {
      setSubmitting(false);
    }
  }

  function updateFrameCaption(frameNumber: number, field: keyof Caption, value: string | number) {
    setDetail((current) => {
      if (!current?.frames) return current;
      return {
        ...current,
        frames: {
          ...current.frames,
          frames: current.frames.frames.map((frame) => {
            if (frame.frameNumber !== frameNumber) return frame;
            return {
              ...frame,
              caption: {
                ...frame.caption,
                [field]: field === "durationSec" ? clampDuration(Number(value)) : value,
                dirty: true,
              },
            };
          }),
        },
      };
    });
  }

  async function persistCaptions() {
    if (!detail?.runId || !detail?.frames?.frames?.length) return;
    const payload = {
      captions: detail.frames.frames.map((frame) => ({
        frameNumber: frame.frameNumber,
        text: frame.caption.text,
        emphasisWord: frame.caption.emphasisWord,
        voiceover: frame.caption.voiceover,
        durationSec: clampDuration(frame.caption.durationSec),
        transition: frame.caption.transition || "cut",
        kineticStyle: frame.caption.kineticStyle || "static",
      })),
    };
    const response = await fetch(
      `/api/admin/marketing-campaigns/${encodeURIComponent(detail.runId)}/captions`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    const json = await response.json();
    if (!response.ok) throw new Error(json?.error || "Failed to save captions");
    await loadDetail(detail.runId);
  }

  async function handleSaveCaptions() {
    if (!detail?.runId || !detail?.frames?.frames?.length) return;
    setSavingCaptions(true);
    setError(null);
    try {
      await persistCaptions();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save captions");
    } finally {
      setSavingCaptions(false);
    }
  }

  async function handleRegenerateCaptions() {
    if (!detail?.runId) return;
    setRegeneratingCaptions(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/admin/marketing-campaigns/${encodeURIComponent(detail.runId)}/captions/regenerate`,
        { method: "POST" },
      );
      const json = await response.json();
      if (!response.ok) throw new Error(json?.error || "Failed to regenerate captions");
      await loadDetail(detail.runId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to regenerate captions");
    } finally {
      setRegeneratingCaptions(false);
    }
  }

  async function handleRegenerateStoryboard() {
    if (!detail?.runId) return;
    setRegeneratingStoryboard(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/admin/marketing-campaigns/${encodeURIComponent(detail.runId)}/storyboard/regenerate`,
        { method: "POST" },
      );
      const json = await response.json();
      if (!response.ok) throw new Error(json?.error || "Failed to regenerate storyboard");
      await loadRuns(true);
      await loadDetail(detail.runId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to regenerate storyboard");
    } finally {
      setRegeneratingStoryboard(false);
    }
  }

  async function handleRenderVideo() {
    if (!detail?.runId) return;
    setRenderingVideo(true);
    setError(null);
    try {
      await persistCaptions();
      const response = await fetch(
        `/api/admin/marketing-campaigns/${encodeURIComponent(detail.runId)}/video`,
        { method: "POST" },
      );
      const json = await response.json();
      if (!response.ok) throw new Error(json?.error || "Failed to start video render");
      await loadDetail(detail.runId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start video render");
    } finally {
      setRenderingVideo(false);
    }
  }

  async function handlePrepareSocialImages() {
    if (!detail?.runId) return;
    setRenderingSocialImages(true);
    setError(null);
    try {
      await persistCaptions();
      const response = await fetch(
        `/api/admin/marketing-campaigns/${encodeURIComponent(detail.runId)}/social-images`,
        { method: "POST" },
      );
      const json = await response.json();
      if (!response.ok) throw new Error(json?.error || "Failed to prepare social posts");
      await loadRuns(true);
      await loadDetail(detail.runId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to prepare social posts");
    } finally {
      setRenderingSocialImages(false);
    }
  }

  async function handleResetPage() {
    setError(null);
    setShowAdvanced(false);
    setLightboxFrame(null);
    setDetail(null);
    setSelectedRunId("");
    setForm(INITIAL_FORM);
    setReferenceImageFiles([]);
    await loadRuns(true, false);
  }

  if (status === "loading") {
    return <div className="p-6">Loading…</div>;
  }

  if (status !== "authenticated") {
    return (
      <div className="p-6">
        <p className="mb-3">You must sign in to view this page.</p>
        <Link href="/">Go home</Link>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="p-6">
        <p className="mb-3">Forbidden: Admins only.</p>
        <Link href="/">Go home</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f5fb] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-8">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <Link href="/admin" className="text-sm font-medium text-[#6f67a2] transition hover:text-[#4f4582]">
              ← Admin
            </Link>
            <h1 className="font-[var(--font-playfair)] text-4xl leading-none font-semibold tracking-[-0.04em] text-[#22163b] sm:text-5xl">
              Marketing Creative Studio
            </h1>
            <p className="max-w-3xl text-sm font-medium text-[#6f6786] sm:text-base">
              Create finished social image posts or build captioned short-form videos in dedicated workflows.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <SecondaryButton onClick={handleResetPage} icon={<RotateCcw className="h-4 w-4" />}>
              Reset Page
            </SecondaryButton>
            {detailAssetType === "social-image" && frameRows[0]?.captionedImageUrl ? (
              <a
                href={frameRows[0].captionedImageUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[18px] border border-[#ddd8e9] bg-white px-4 py-2.5 text-sm font-semibold text-[#5f5678] transition hover:bg-[#faf8fd] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c67c5] focus-visible:ring-offset-2"
              >
                <Images className="h-4 w-4" aria-hidden="true" />
                Open Latest Post
              </a>
            ) : detail?.videoUrl ? (
              <a
                href={detail.videoUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-[18px] border border-[#ddd8e9] bg-white px-4 py-2.5 text-sm font-semibold text-[#5f5678] transition hover:bg-[#faf8fd]"
              >
                Open Latest Video
              </a>
            ) : null}
          </div>
        </header>

        {error ? (
          <div className="rounded-[22px] border border-[#efbbbb] bg-[#fff4f4] px-4 py-3 text-sm text-[#a73e3e]">
            {error}
          </div>
        ) : null}

        <div className="grid items-start gap-8 xl:grid-cols-[380px_minmax(0,1fr)]">
          <aside className="space-y-8 xl:sticky xl:top-6">
            <PageCard
              title={<h2 className="text-xl font-semibold text-[#271a45]">New Campaign</h2>}
              action={
                <button
                  type="button"
                  onClick={() => setShowAdvanced((value) => !value)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.22em] text-[#8b7fc0] transition hover:text-[#6e5db8]"
                >
                  Advanced
                  <ChevronDown
                    className={cn("h-4 w-4 transition", showAdvanced && "rotate-180")}
                  />
                </button>
              }
            >
              <form onSubmit={handleGenerate} className="space-y-5">
                <fieldset className="space-y-3">
                  <legend className="px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7f7897]">
                    What are you creating?
                  </legend>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                    {([
                      {
                        value: "social-image" as const,
                        label: "Social image",
                        description: "Finished, downloadable posts",
                        icon: Images,
                      },
                      {
                        value: "short-video" as const,
                        label: "Short-form video",
                        description: "Storyboard, captions, MP4",
                        icon: Clapperboard,
                      },
                    ]).map((option) => {
                      const selected = form.assetType === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => handleAssetTypeChange(option.value)}
                          aria-pressed={selected}
                          className={cn(
                            "min-h-[112px] rounded-[22px] border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c67c5] focus-visible:ring-offset-2",
                            selected
                              ? "border-[#8f78df] bg-[#f3edff] shadow-[0_12px_30px_rgba(93,63,174,0.12)]"
                              : "border-[#e5e0ee] bg-[#fbfafc] hover:border-[#cfc6e5] hover:bg-white",
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <span
                              className={cn(
                                "flex h-10 w-10 items-center justify-center rounded-[14px]",
                                selected ? "bg-[#7c67c5] text-white" : "bg-white text-[#7c67c5]",
                              )}
                            >
                              <option.icon className="h-5 w-5" aria-hidden="true" />
                            </span>
                            <span
                              aria-hidden="true"
                              className={cn(
                                "mt-1 h-3 w-3 rounded-full border-2",
                                selected ? "border-[#7c67c5] bg-[#7c67c5]" : "border-[#c9c1da] bg-white",
                              )}
                            />
                          </div>
                          <div className="mt-4 text-sm font-bold text-[#271a45]">{option.label}</div>
                          <div className="mt-1 text-xs leading-5 text-[#7d7593]">{option.description}</div>
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                <TextAreaField
                  label="Campaign Brief"
                  value={form.criteria}
                  onChange={(event) => setForm((current) => ({ ...current, criteria: event.target.value }))}
                  placeholder={
                    formIsSocialImage
                      ? "Promote Envitefy to busy parents with a polished, scroll-stopping post that makes event planning feel effortless..."
                      : "A mom creates a live card using Envitefy Studio for her son's birthday, moving from planning stress to send-ready relief..."
                  }
                  rows={4}
                  helper={
                    formIsSocialImage
                      ? "Describe the audience, offer, proof, and visual idea. Each concept should work as a standalone post."
                      : "Describe the audience, hook, transformation, proof moment, and final payoff for the sequence."
                  }
                />
                <TextField
                  label="Product Name"
                  value={form.productName}
                  onChange={(event) => setForm((current) => ({ ...current, productName: event.target.value }))}
                  placeholder="Envitefy"
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <SelectField
                    label="Category"
                    value={form.targetVertical}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, targetVertical: event.target.value }))
                    }
                    emptyLabel="General"
                    options={TARGET_VERTICALS.filter((vertical) => vertical !== "General")}
                  />
                  <TextField
                    label={formIsSocialImage ? "Post Concepts" : "Frames"}
                    type="number"
                    min={1}
                    max={24}
                    value={form.frameCount}
                    onChange={(event) => setForm((current) => ({ ...current, frameCount: event.target.value }))}
                    placeholder={formIsSocialImage ? "3" : "5"}
                  />
                </div>

                <fieldset className="space-y-3">
                  <legend className="px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7f7897]">
                    {formIsSocialImage ? "Social Placement" : "Video Format"}
                  </legend>
                  <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
                    {(formIsSocialImage ? SOCIAL_PLACEMENTS : VIDEO_FORMATS).map((option) => {
                      const selected = formIsSocialImage
                        ? form.socialPlacement === option.value
                        : form.cameraFormat === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() =>
                            formIsSocialImage
                              ? handleSocialPlacementChange(option.value)
                              : setForm((current) => ({ ...current, cameraFormat: option.value }))
                          }
                          aria-pressed={selected}
                          className={cn(
                            "min-h-[104px] rounded-[18px] border px-3 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c67c5] focus-visible:ring-offset-2",
                            selected
                              ? "border-[#8f78df] bg-[#f3edff]"
                              : "border-[#e5e0ee] bg-[#fbfafc] hover:border-[#cfc6e5] hover:bg-white",
                          )}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <option.icon className="h-4 w-4 text-[#7c67c5]" aria-hidden="true" />
                            <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-[#71668b]">
                              {option.ratio}
                            </span>
                          </div>
                          <div className="mt-3 text-xs font-bold text-[#2b2045]">{option.label}</div>
                          <div className="mt-1 text-[10px] leading-4 text-[#837b99]">{option.detail}</div>
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                <TextField
                  label="Tone"
                  value={form.tone}
                  onChange={(event) => setForm((current) => ({ ...current, tone: event.target.value }))}
                  placeholder="premium, modern, social-native"
                />
                <TextField
                  label="Call To Action"
                  value={form.callToAction}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, callToAction: event.target.value }))
                  }
                  placeholder="Start your event page"
                />
                <TextAreaField
                  label="Optional Guardrails"
                  value={form.notes}
                  onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                  placeholder="Same woman, clean counters, phone screen visible, no party setup."
                  helper="Use this for hard constraints, not for the main campaign brief. Add exclusions for props, locations, staging, or physical continuity."
                />

                <div className="space-y-3">
                  <Label>Reference Images</Label>
                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-[18px] border border-dashed border-[#ccc4df] bg-[#fbfafc] px-4 py-4 text-sm font-semibold text-[#62577d] transition hover:border-[#8f78df] hover:bg-white">
                    <ImagePlus className="h-4 w-4 text-[#7c67c5]" />
                    Add images for visual reference
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      multiple
                      className="sr-only"
                      onChange={(event) => {
                        const selected = Array.from(event.target.files || []);
                        setReferenceImageFiles((current) =>
                          [...current, ...selected].slice(0, 8),
                        );
                        event.target.value = "";
                      }}
                    />
                  </label>
                  {referenceImageFiles.length > 0 ? (
                    <div className="space-y-2">
                      {referenceImageFiles.map((file, index) => (
                        <div
                          key={`${file.name}-${file.size}-${index}`}
                          className="flex items-center justify-between gap-3 rounded-[16px] border border-[#eee9f6] bg-white px-3 py-2 text-xs font-medium text-[#5f5678]"
                        >
                          <span className="min-w-0 truncate">{file.name}</span>
                          <button
                            type="button"
                            onClick={() =>
                              setReferenceImageFiles((current) =>
                                current.filter((_file, fileIndex) => fileIndex !== index),
                              )
                            }
                            className="shrink-0 rounded-full p-1 text-[#9188a6] transition hover:bg-[#f4f1fa] hover:text-[#4f4582]"
                            aria-label={`Remove ${file.name}`}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="px-1 text-xs text-[#8a84a1]">
                      Optional. Upload up to 8 JPG, PNG, or WebP images for style, character, location, or product reference.
                    </p>
                  )}
                </div>

                <AnimatePresence initial={false}>
                  {showAdvanced ? (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="grid gap-4 border-t border-[#f0ecf7] pt-5">
                        {[
                          ["characterLock", "Character Lock"],
                          ["outfitLock", "Outfit Lock"],
                          ["phoneLock", "Phone Lock"],
                          ["flyerLock", "Flyer Lock"],
                          ["locationLock", "Location Lock"],
                          ["backgroundAnchors", "Background Anchors"],
                          ["screenLock", "Screen Lock"],
                          ["visualStyle", "Visual Style"],
                          ["composition", "Composition"],
                          ["mood", "Mood"],
                        ].map(([key, label]) => (
                          <TextField
                            key={key}
                            label={label}
                            value={(form as Record<string, string>)[key]}
                            onChange={(event) =>
                              setForm((current) => ({ ...current, [key]: event.target.value }))
                            }
                          />
                        ))}
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>

                <PrimaryButton
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5"
                  icon={
                    submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : formIsSocialImage ? (
                      <Sparkles className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4 fill-current" />
                    )
                  }
                >
                  {submitting
                    ? formIsSocialImage
                      ? "Creating Post Concepts…"
                      : "Building Storyboard…"
                    : formIsSocialImage
                      ? "Generate Social Posts"
                      : "Generate Video Storyboard"}
                </PrimaryButton>
              </form>
            </PageCard>

            <PageCard
              title={<h2 className="text-xl font-semibold text-[#271a45]">Recent Runs</h2>}
              action={loadingRuns ? <span className="text-xs font-medium text-[#8a84a1]">Loading…</span> : null}
              bodyClassName="px-2 py-2"
            >
              <div className="space-y-2">
                {runs.map((run) => {
                  const selected = selectedRunId === run.runId;
                  const runState = run.status?.state || "unknown";
                  const runLabel = run.request?.input?.productName || "Untitled";
                  const runAssetType = normalizeAssetType(
                    run.request?.input?.assetType || run.status?.request?.assetType,
                  );
                  return (
                    <button
                      type="button"
                      key={run.runId}
                      onClick={() => setSelectedRunId(run.runId)}
                      className={cn(
                        "relative w-full rounded-[22px] px-4 py-4 text-left transition",
                        selected ? "bg-[#f3edff]" : "hover:bg-[#faf8fd]",
                      )}
                    >
                      {selected ? (
                        <div className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-[#7c67c5]" />
                      ) : null}
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-bold text-[#24193f]">{run.runId}</div>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-medium text-[#7b7394]">
                            <span>{statusLabel(runState)} · {runLabel}</span>
                            <StatusBadge tone={runAssetType === "social-image" ? "info" : "default"}>
                              {assetTypeLabel(runAssetType)}
                            </StatusBadge>
                          </div>
                        </div>
                        {runState === "running" ? (
                          <Loader2 className="mt-0.5 h-3.5 w-3.5 animate-spin text-[#7c67c5]" />
                        ) : null}
                      </div>
                    </button>
                  );
                })}
                {!runs.length && !loadingRuns ? (
                  <div className="rounded-[22px] border border-dashed border-[#ddd8e9] px-4 py-10 text-center text-sm text-[#8a84a1]">
                    No runs yet.
                  </div>
                ) : null}
              </div>
            </PageCard>
          </aside>

          <section className="space-y-8">
            <PageCard
              className="relative"
              headerClassName="flex-col items-start gap-4 bg-[#fcfbfd] lg:flex-row lg:items-center"
              title={
                <div>
                  <h2 className="text-[28px] font-semibold tracking-[-0.03em] text-[#24193f]">Run Detail</h2>
                  <p className="mt-1 text-sm font-medium text-[#7a7391]">
                    {detail?.status?.message || "Select a run to inspect its progress."}
                  </p>
                </div>
              }
              action={
                <div className="flex w-full flex-wrap items-stretch gap-3 lg:w-auto lg:justify-end">
                  <SecondaryButton
                    onClick={handleRegenerateStoryboard}
                    disabled={!detail?.runId || !storyboardCanRegenerate || regeneratingStoryboard || runIsActive}
                    icon={regeneratingStoryboard ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  >
                    {regeneratingStoryboard
                      ? "Rewriting…"
                      : detailAssetType === "social-image"
                        ? "Regenerate Concepts"
                        : "Regenerate Storyboard"}
                  </SecondaryButton>
                  <SecondaryButton
                    onClick={handleRegenerateCaptions}
                    disabled={!detail?.runId || regeneratingCaptions || runIsActive}
                    icon={regeneratingCaptions ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  >
                    {regeneratingCaptions
                      ? "Regenerating…"
                      : detailAssetType === "social-image"
                        ? "Regenerate Copy"
                        : "Regenerate Captions"}
                  </SecondaryButton>
                  <SecondaryButton
                    onClick={handleSaveCaptions}
                    disabled={!detail?.runId || savingCaptions || runIsActive}
                    icon={savingCaptions ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  >
                    {savingCaptions
                      ? "Saving…"
                      : detailAssetType === "social-image"
                        ? "Save Copy"
                        : "Save Captions"}
                  </SecondaryButton>
                  {detailAssetType === "social-image" ? (
                    <PrimaryButton
                      onClick={handlePrepareSocialImages}
                      disabled={!detail?.runId || !frameRows.length || renderingSocialImages || runIsActive}
                      icon={
                        renderingSocialImages ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Images className="h-4 w-4" />
                        )
                      }
                    >
                      {renderingSocialImages
                        ? "Preparing…"
                        : preparedPostCount
                          ? "Update Social Posts"
                          : "Prepare Social Posts"}
                    </PrimaryButton>
                  ) : (
                    <PrimaryButton
                      onClick={handleRenderVideo}
                      disabled={!detail?.runId || renderingVideo || runIsActive}
                      icon={renderingVideo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Video className="h-4 w-4" />}
                    >
                      {renderingVideo ? "Rendering…" : "Render Video"}
                    </PrimaryButton>
                  )}
                </div>
              }
            >
              {loadingDetail ? (
                <div className="pointer-events-none absolute right-6 top-6 rounded-full border border-[#ded7ec] bg-white/95 px-3 py-1 text-xs font-medium text-[#6e5ca3] shadow-sm">
                  Loading run detail…
                </div>
              ) : null}

              {detail?.status ? (
                <>
                  <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
                    {[
                      { label: "State", value: formatRunState(detail.status.state), icon: Clock3 },
                      { label: "Current Stage", value: formatStageName(detail.status.currentStage), icon: LayoutGrid },
                      {
                        label: detailAssetType === "social-image" ? "Requested Posts" : "Requested Frames",
                        value: String(
                          detail.status.request?.frameCount ||
                            detail.request?.input?.looseInput?.overrides?.numberOfFrames ||
                            "---",
                        ),
                        icon: FileJson,
                      },
                      {
                        label: detailAssetType === "social-image" ? "Posts Ready" : "Frames Done",
                        value:
                          detailAssetType === "social-image"
                            ? `${preparedPostCount}/${frameRows.length || detail.status.frameCounts?.total || 0}`
                            : `${detail.status.frameCounts?.done || 0}/${detail.status.frameCounts?.total || 0}`,
                        icon: CheckCircle2,
                      },
                      {
                        label: "Warnings",
                        value: String(detail.status.warningMessages?.length || 0),
                        icon: AlertTriangle,
                      },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="rounded-[24px] border border-[#efebf6] bg-[#fbfaff] p-5 sm:p-6"
                      >
                        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-[#938ba9]">
                          <item.icon className="h-4 w-4 text-[#8a7bc4]" />
                          {item.label}
                        </div>
                        <div className="mt-4 break-words text-[clamp(1.8rem,3vw,2.4rem)] font-bold leading-[1.05] tracking-[-0.04em] text-[#251b3f]">
                          {item.value}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                    {visibleStages.map((stage) => {
                      const tone = statusTone(stage.status);
                      const isRunning = tone === "info";
                      return (
                        <div
                          key={stage.key}
                          className="relative overflow-hidden rounded-[24px] border border-[#efebf6] bg-white p-5 transition hover:border-[#ddd6ee]"
                        >
                          <div className="flex min-h-[88px] items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-sm font-bold leading-6 text-[#281d44]">{stage.label}</div>
                              <div className="mt-2 text-xs font-medium text-[#8a84a1]">
                                {summarizeStageTime(stage.updatedAt)}
                              </div>
                            </div>
                            <div className="shrink-0">
                              <StatusBadge tone={tone}>{statusLabel(stage.status)}</StatusBadge>
                            </div>
                          </div>
                          {stage.error ? (
                            <div className="mt-3 text-xs text-[#b64c4c]">{stage.error}</div>
                          ) : null}
                          {isRunning ? (
                            <motion.div
                              className="absolute bottom-0 left-0 h-0.5 bg-[#7c67c5]"
                              animate={{ width: ["0%", "72%"] }}
                              transition={{ duration: 4.5, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                            />
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="rounded-[24px] border border-dashed border-[#ddd8e9] px-5 py-12 text-center text-sm text-[#8a84a1]">
                  Select a run to inspect its progress.
                </div>
              )}
            </PageCard>

            {detail ? (
              <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="font-[var(--font-playfair)] text-3xl font-semibold tracking-[-0.04em] text-[#23183d]">
                      {detailAssetType === "social-image" ? "Social Post Review" : "Frame Review"}
                    </h3>
                    <AnimatePresence initial={false}>
                      {frameRows.length ? (
                        frameRows.map((frame, index) => {
                          const previewImageUrl =
                            detailAssetType === "social-image" && frame.captionedImageUrl
                              ? frame.captionedImageUrl
                              : frame.imageUrl;
                          return (
                            <motion.div
                              key={frame.frameNumber}
                              initial={{ opacity: 0, y: 16 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              transition={{ duration: 0.28, delay: index * 0.04 }}
                            >
                            <PageCard className="hover:shadow-[0_24px_70px_rgba(84,49,170,0.1)]">
                              <div className="flex flex-col gap-6 xl:flex-row xl:gap-8">
                                <div className="w-full shrink-0 xl:w-52">
                                  <div className="relative overflow-hidden rounded-[24px] bg-[#f1ecfb]">
                                    {previewImageUrl ? (
                                      <button
                                        type="button"
                                        onClick={() => setLightboxFrame({ ...frame, imageUrl: previewImageUrl })}
                                        className="group block w-full text-left"
                                        aria-label={`Open ${
                                          detailAssetType === "social-image" ? "social post" : "frame"
                                        } ${frame.frameNumber} image`}
                                      >
                                        <img
                                          src={previewImageUrl}
                                          alt={`${
                                            detailAssetType === "social-image" ? "Social post" : "Frame"
                                          } ${frame.frameNumber}: ${frame.title}`}
                                          className={cn(
                                            mediaAspectClass,
                                            "w-full object-cover transition duration-300 group-hover:scale-[1.02]",
                                          )}
                                        />
                                        <div className="pointer-events-none absolute inset-0 bg-black/0 transition group-hover:bg-black/10" />
                                      </button>
                                    ) : (
                                      <div
                                        className={cn(
                                          mediaAspectClass,
                                          "flex items-center justify-center text-center text-sm font-medium text-[#8a84a1]",
                                        )}
                                      >
                                        <div className="space-y-2">
                                          {frame.status === "pending" ? null : (
                                            <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#7c67c5]" />
                                          )}
                                          <div>{frame.status === "pending" ? "Frame pending" : "Rendering…"}</div>
                                        </div>
                                      </div>
                                    )}
                                    <div className="absolute left-3 top-3">
                                      <StatusBadge tone="info">
                                        {detailAssetType === "social-image" ? "Post" : "Frame"} {frame.frameNumber}
                                      </StatusBadge>
                                    </div>
                                  </div>
                                  {detailAssetType === "social-image" && frame.imageUrl ? (
                                    <div className="mt-3 grid gap-2">
                                      {frame.captionedImageUrl ? (
                                        <a
                                          href={frame.captionedImageUrl}
                                          download
                                          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[16px] bg-[#24193f] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#352656] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c67c5] focus-visible:ring-offset-2"
                                        >
                                          <Download className="h-4 w-4" aria-hidden="true" />
                                          Download finished post
                                        </a>
                                      ) : (
                                        <div className="rounded-[16px] border border-dashed border-[#ddd8e9] px-3 py-3 text-center text-[11px] font-medium leading-5 text-[#837b99]">
                                          Prepare posts to add the approved headline and unlock PNG downloads.
                                        </div>
                                      )}
                                      <a
                                        href={frame.imageUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex min-h-10 items-center justify-center rounded-[14px] border border-[#e3ddec] px-3 py-2 text-xs font-semibold text-[#675d7f] transition hover:bg-[#faf8fd] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c67c5] focus-visible:ring-offset-2"
                                      >
                                        Open original artwork
                                      </a>
                                    </div>
                                  ) : null}
                                </div>

                                <div className="min-w-0 flex-1 space-y-6">
                                  <div className="flex flex-wrap items-start justify-between gap-4">
                                    <div>
                                      <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#9a92b3]">
                                        {detailAssetType === "social-image" ? "Post Concept" : "Frame"} {frame.frameNumber}
                                      </div>
                                      <h4 className="mt-1 text-[34px] font-bold leading-none tracking-[-0.05em] text-[#23183d]">
                                        {frame.title}
                                      </h4>
                                    </div>
                                    <StatusBadge tone={statusTone(frame.status)}>{statusLabel(frame.status)}</StatusBadge>
                                  </div>

                                  <div className="grid gap-4 lg:grid-cols-2">
                                    <div className="rounded-[22px] border border-[#efebf6] bg-[#fbfafc] p-4">
                                      <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#8a7bc4]">
                                        Action Beat
                                      </div>
                                      <p className="mt-3 text-sm font-medium leading-7 text-[#51476b]">
                                        {frame.actionBeat}
                                      </p>
                                    </div>
                                    <div className="rounded-[22px] border border-[#efebf6] bg-[#fbfafc] p-4">
                                      <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#8a7bc4]">
                                        Camera
                                      </div>
                                      <p className="mt-3 text-sm font-medium leading-7 text-[#51476b]">
                                        {frame.cameraShot}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_190px]">
                                    <TextField
                                      label={detailAssetType === "social-image" ? "Post Headline" : "Caption Text"}
                                      value={frame.caption.text || ""}
                                      onChange={(event) =>
                                        updateFrameCaption(frame.frameNumber, "text", event.target.value)
                                      }
                                    />
                                    <TextField
                                      label="Emphasis Word"
                                      value={frame.caption.emphasisWord || ""}
                                      onChange={(event) =>
                                        updateFrameCaption(frame.frameNumber, "emphasisWord", event.target.value)
                                      }
                                    />
                                    <div className="rounded-[22px] border border-[#efebf6] bg-[#fbfafc] px-4 py-4">
                                      <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#8a7bc4]">
                                        Status
                                      </div>
                                      <div className="mt-3 text-sm font-semibold text-[#5a4f75]">
                                        {frame.caption.status}
                                        {frame.caption.dirty ? " · unsaved" : ""}
                                      </div>
                                    </div>
                                  </div>

                                  {detailAssetType === "social-image" ? (
                                    <TextAreaField
                                      label="Post Caption"
                                      value={frame.caption.voiceover || ""}
                                      onChange={(event) =>
                                        updateFrameCaption(frame.frameNumber, "voiceover", event.target.value)
                                      }
                                      rows={3}
                                      helper="Use this as the ready-to-publish caption that accompanies the finished image."
                                    />
                                  ) : (
                                    <div className="grid gap-4 xl:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
                                      <div className="grid gap-4 sm:grid-cols-2">
                                        <TextField
                                          label="Duration"
                                          type="number"
                                          min={1.2}
                                          max={3.5}
                                          step={0.1}
                                          value={frame.caption.durationSec ?? 2}
                                          onChange={(event) =>
                                            updateFrameCaption(
                                              frame.frameNumber,
                                              "durationSec",
                                              Number(event.target.value),
                                            )
                                          }
                                        />
                                        <SelectField
                                          label="Kinetic Style"
                                          value={frame.caption.kineticStyle || "static"}
                                          onChange={(event) =>
                                            updateFrameCaption(
                                              frame.frameNumber,
                                              "kineticStyle",
                                              event.target.value,
                                            )
                                          }
                                          options={KINETIC_STYLES}
                                        />
                                      </div>
                                      <TextAreaField
                                        label="Voiceover"
                                        value={frame.caption.voiceover || ""}
                                        onChange={(event) =>
                                          updateFrameCaption(frame.frameNumber, "voiceover", event.target.value)
                                        }
                                        rows={3}
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>
                            </PageCard>
                            </motion.div>
                          );
                        })
                      ) : (
                        <PageCard>
                          <div className="rounded-[24px] border border-dashed border-[#ddd8e9] px-5 py-12 text-center text-sm text-[#8a84a1]">
                            {detailAssetType === "social-image"
                              ? "Post concepts will appear here once image generation begins."
                              : "Frames will appear here once the run reaches image generation."}
                          </div>
                        </PageCard>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <aside className="space-y-6">
                  <div className="space-y-4">
                    <h4 className="font-[var(--font-playfair)] text-2xl font-semibold tracking-[-0.04em] text-[#23183d]">
                      Creative QA
                    </h4>
                    <PageCard bodyClassName="space-y-4 px-4 py-4">
                      {qaSummary ? (
                        <>
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#8a7bc4]">
                                QA Verdict
                              </div>
                              <div className="mt-1 text-lg font-bold text-[#24193f]">
                                {qaSummary.pass
                                  ? detailAssetType === "social-image"
                                    ? "Approved for social"
                                    : "Approved for images"
                                  : "Needs rewrite"}
                              </div>
                            </div>
                            <StatusBadge tone={qaSummary.pass ? "success" : "danger"}>
                              {qaSummary.pass ? "Pass" : "Fail"}
                            </StatusBadge>
                          </div>

                          <div className="grid gap-3 sm:grid-cols-3">
                            {[
                              ["Value Clarity", qaSummary.valueClarityScore],
                              ["Visual Variety", qaSummary.visualVarietyScore],
                              ["Product Proof", qaSummary.productProofScore],
                            ].map(([label, score]) => (
                              <div key={label} className="rounded-[20px] border border-[#efebf6] bg-[#fbfafc] p-4">
                                <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#8a7bc4]">
                                  {label}
                                </div>
                                <div className="mt-3 flex items-center justify-between">
                                  <div className="text-2xl font-bold tracking-[-0.04em] text-[#24193f]">{score}/5</div>
                                  <StatusBadge tone={scoreTone(Number(score))}>{score}</StatusBadge>
                                </div>
                              </div>
                            ))}
                          </div>

                          {qaSummary.rewriteBrief ? (
                            <div className="rounded-[20px] border border-[#efebf6] bg-[#fbfafc] p-4">
                              <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#8a7bc4]">
                                Rewrite Brief
                              </div>
                              <p className="mt-3 text-sm leading-7 text-[#51476b]">{qaSummary.rewriteBrief}</p>
                            </div>
                          ) : null}

                          <div className="grid gap-3">
                            {([
                              ["Reasons", qaSummary.reasons],
                              ["Caption Issues", qaSummary.captionIssues],
                              ["Blocked Caption Patterns", qaSummary.blockedCaptionPatterns],
                              ["Required Shot Families", qaSummary.requiredShotFamilies],
                            ] as Array<[string, string[]]>).map(([label, items]) =>
                              Array.isArray(items) && items.length > 0 ? (
                                <div key={label} className="rounded-[20px] border border-[#efebf6] bg-[#fbfafc] p-4">
                                  <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#8a7bc4]">
                                    {label}
                                  </div>
                                  <div className="mt-3 flex flex-wrap gap-2">
                                    {items.map((item) => (
                                      <span
                                        key={`${label}-${item}`}
                                        className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#5f5678]"
                                      >
                                        {item}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              ) : null,
                            )}
                          </div>

                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className="rounded-[20px] border border-[#efebf6] bg-[#fbfafc] p-4">
                              <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#8a7bc4]">
                                {detailAssetType === "social-image" ? "Concepts To Rewrite" : "Frames To Rewrite"}
                              </div>
                              <div className="mt-3 text-sm font-semibold text-[#51476b]">
                                {qaSummary.framesToRewrite.length ? qaSummary.framesToRewrite.join(", ") : "None"}
                              </div>
                            </div>
                            <div className="rounded-[20px] border border-[#efebf6] bg-[#fbfafc] p-4">
                              <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#8a7bc4]">
                                {detailAssetType === "social-image" ? "Concepts To Cut" : "Frames To Cut"}
                              </div>
                              <div className="mt-3 text-sm font-semibold text-[#51476b]">
                                {qaSummary.framesToCut.length ? qaSummary.framesToCut.join(", ") : "None"}
                              </div>
                            </div>
                          </div>

                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className="rounded-[20px] border border-[#efebf6] bg-[#fbfafc] p-4">
                              <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#8a7bc4]">
                                Final Payoff Frame
                              </div>
                              <div className="mt-3 text-sm font-semibold text-[#51476b]">
                                {qaSummary.singleFinalPayoffFrame ?? "Not set"}
                              </div>
                            </div>
                            <div className="rounded-[20px] border border-[#efebf6] bg-[#fbfafc] p-4">
                              <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#8a7bc4]">
                                Max Phone-Dominant Frames
                              </div>
                              <div className="mt-3 text-sm font-semibold text-[#51476b]">
                                {qaSummary.maxPhoneDominantFrames}
                              </div>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="rounded-[22px] border border-dashed border-[#ddd8e9] px-5 py-10 text-center text-sm text-[#8a84a1]">
                          Creative QA appears here after storyboard planning.
                        </div>
                      )}
                    </PageCard>
                  </div>

                  {detailAssetType === "social-image" ? (
                    <PageCard
                      title={<h3 className="text-lg font-semibold text-[#271a45]">Social Export Desk</h3>}
                      bodyClassName="space-y-4"
                    >
                      <div className="rounded-[22px] bg-[linear-gradient(135deg,#261943_0%,#5537a5_62%,#337fd5_100%)] p-5 text-white">
                        <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/70">
                          Campaign package
                        </div>
                        <div className="mt-3 text-3xl font-bold tracking-[-0.05em]">
                          {preparedPostCount}/{frameRows.length || 0} ready
                        </div>
                        <p className="mt-2 text-sm leading-6 text-white/80">
                          {detailSocialPlacement
                            ? `${detailSocialPlacement.label} · ${detailSocialPlacement.ratio} · ${detailSocialPlacement.detail}`
                            : `${cameraFormat} social creative`}
                        </p>
                      </div>
                      {preparedPostCount ? (
                        <div className="grid gap-2">
                          {frameRows.map((frame) =>
                            frame.captionedImageUrl ? (
                              <a
                                key={`export-${frame.frameNumber}`}
                                href={frame.captionedImageUrl}
                                download
                                className="flex min-h-11 items-center justify-between gap-3 rounded-[16px] border border-[#e6e0ef] px-3 py-2.5 text-xs font-bold text-[#51476b] transition hover:border-[#cfc4e4] hover:bg-[#faf8fd] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c67c5] focus-visible:ring-offset-2"
                              >
                                <span>Post {frame.frameNumber}</span>
                                <Download className="h-4 w-4 text-[#7c67c5]" aria-hidden="true" />
                              </a>
                            ) : null,
                          )}
                        </div>
                      ) : (
                        <p className="text-sm leading-6 text-[#7d7593]">
                          Approve the headlines, then choose Prepare Social Posts to create the finished PNG set.
                        </p>
                      )}
                    </PageCard>
                  ) : null}

                  <div className="space-y-4">
                    <h4 className="font-[var(--font-playfair)] text-2xl font-semibold tracking-[-0.04em] text-[#23183d]">
                      Stage JSON
                    </h4>
                    <div className="space-y-3">
                      {[
                        ["Brief", detail.brief],
                        ["Persona", detail.persona],
                        ["Critique", detail.critique],
                        ["Scene Spec", detail.sceneSpec],
                        ["Frame Plan", detail.framePlan],
                        ["Social Copy", detail.socialCopy],
                        ["Creative QA", detail.creativeQa],
                      ].map(([label, value]) => (
                        <details
                          key={label}
                          className="group overflow-hidden rounded-[22px] border border-[#e8e1f3] bg-white"
                        >
                          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4 text-left">
                            <div className="flex items-center gap-3">
                              <FileJson className="h-4 w-4 text-[#8a7bc4]" />
                              <span className="text-sm font-bold text-[#2a1f43]">{label}</span>
                            </div>
                            <div className="flex items-center gap-2 text-[#aba5bc]">
                              <MoreHorizontal className="h-4 w-4" />
                              <ChevronDown className="h-4 w-4 transition group-open:rotate-180" />
                            </div>
                          </summary>
                          <div className="border-t border-[#f0ecf7] px-4 pb-4 pt-0">
                            <pre className="mt-4 overflow-x-auto rounded-[18px] bg-[#171325] p-4 text-xs text-[#e8e3ff]">
                              {prettyJson(value)}
                            </pre>
                          </div>
                        </details>
                      ))}
                    </div>
                  </div>

                  {detailAssetType === "short-video" && detail.videoUrl ? (
                    <PageCard title={<h3 className="text-lg font-semibold text-[#271a45]">Rendered Video</h3>}>
                      <video
                        src={detail.videoUrl}
                        controls
                        className={cn(mediaAspectClass, "w-full rounded-[24px] bg-black")}
                      >
                        <track
                          kind="captions"
                          src={detail.captionsUrl || ""}
                          srcLang="en"
                          label="Generated captions"
                          default
                        />
                      </video>
                      <div className="mt-4 flex flex-wrap gap-3">
                        <a
                          href={detail.videoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-[18px] bg-[#7c67c5] px-4 py-2.5 text-sm font-semibold text-white"
                        >
                          Open MP4
                        </a>
                        {detail.captionsUrl ? (
                          <a
                            href={detail.captionsUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-[18px] border border-[#ddd8e9] px-4 py-2.5 text-sm font-semibold text-[#5f5678]"
                          >
                            Open SRT
                          </a>
                        ) : null}
                      </div>
                    </PageCard>
                  ) : null}
                </aside>
              </div>
            ) : (
              <PageCard>
                <div className="rounded-[24px] border border-dashed border-[#ddd8e9] px-5 py-16 text-center text-sm text-[#8a84a1]">
                  Select a run to inspect it, or create a new campaign from the form.
                </div>
              </PageCard>
            )}
          </section>
        </div>

        <AnimatePresence>
          {lightboxFrame?.imageUrl ? (
            <motion.div
              key="frame-lightbox"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-[#110d1c]/90 p-4 sm:p-6"
              onClick={() => setLightboxFrame(null)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.18 }}
                className="relative flex max-h-[92dvh] w-full max-w-6xl flex-col gap-4"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="flex items-center justify-between gap-4 text-white">
                  <div className="min-w-0">
                    <div className="text-xs font-bold uppercase tracking-[0.22em] text-white/60">
                      Frame {lightboxFrame.frameNumber}
                    </div>
                    <div className="mt-1 truncate text-xl font-bold">{lightboxFrame.title}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setLightboxFrame(null)}
                    className="shrink-0 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20"
                    aria-label="Close image lightbox"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex min-h-0 justify-center overflow-hidden rounded-[18px] bg-black">
                  <img
                    src={lightboxFrame.imageUrl}
                    alt={`Frame ${lightboxFrame.frameNumber}`}
                    className="max-h-[78dvh] w-auto max-w-full object-contain"
                  />
                </div>

                {lightboxFrame.caption.text ? (
                  <div className="rounded-[16px] bg-white/10 px-4 py-3 text-center text-sm font-semibold text-white">
                    {lightboxFrame.caption.text}
                  </div>
                ) : null}
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
