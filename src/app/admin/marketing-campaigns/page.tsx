"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useSession } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Clock3,
  FileJson,
  LayoutGrid,
  Loader2,
  MoreHorizontal,
  Play,
  RotateCcw,
  Save,
  Sparkles,
  Video,
} from "lucide-react";

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
  frames: { frames: Frame[] } | null;
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

const STAGE_ORDER = [
  "brief",
  "persona",
  "critique",
  "art-direction",
  "coordinator",
  "social-copy",
  "creative-qa",
  "image-generation",
  "video",
];

const INITIAL_FORM = {
  criteria: "",
  productName: "",
  targetVertical: "",
  tone: "",
  callToAction: "",
  frameCount: "",
  notes: "",
  characterLock: "",
  outfitLock: "",
  phoneLock: "",
  flyerLock: "",
  locationLock: "",
  backgroundAnchors: "",
  screenLock: "",
  cameraFormat: "vertical",
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
  return key
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
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
  if (["running", "queued", "rendering_video", "render-queued"].includes(normalized)) return "info";
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

function Label({ children }: { children: ReactNode }) {
  return (
    <label className="px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7f7897]">
      {children}
    </label>
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
  const hasValue = `${value}`.length > 0;
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <input
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
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <textarea
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
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="relative">
        <select
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
      className="inline-flex items-center justify-center gap-2 rounded-[18px] border border-[#ddd8e9] bg-white px-4 py-2.5 text-sm font-semibold text-[#5f5678] transition hover:bg-[#faf8fd] disabled:cursor-not-allowed disabled:opacity-60"
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
        "inline-flex items-center justify-center gap-2 rounded-[18px] bg-[#7c67c5] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_16px_28px_rgba(124,103,197,0.25)] transition hover:bg-[#715abf] disabled:cursor-not-allowed disabled:opacity-60",
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
  const [renderingVideo, setRenderingVideo] = useState(false);
  const [previewFrameNumber, setPreviewFrameNumber] = useState<number | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);

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
    const shouldPoll = ["queued", "running", "render-queued", "rendering_video"].includes(detail.status.state);
    if (!shouldPoll) return;
    const intervalId = window.setInterval(() => {
      loadDetail(detail.runId, true);
      loadRuns(true);
    }, 2000);
    return () => window.clearInterval(intervalId);
  }, [detail?.runId, detail?.status?.state]);

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
  const runIsActive = ["queued", "running", "render-queued", "rendering_video"].includes(detail?.status?.state || "");
  const selectedFrame =
    frameRows.find((frame) => frame.frameNumber === previewFrameNumber) || frameRows[0] || null;
  const cameraFormat = detail?.sceneSpec?.cameraFormat?.value || detail?.frames?.sceneSpec?.cameraFormat || "vertical";
  const mediaAspectClass =
    cameraFormat === "horizontal"
      ? "aspect-[16/9]"
      : cameraFormat === "square"
        ? "aspect-square"
        : "aspect-[9/16]";

  async function handleGenerate(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const parsedFrameCount = Number.parseInt(`${form.frameCount}`.trim(), 10);
      const frameCount =
        Number.isFinite(parsedFrameCount) && parsedFrameCount >= 1
          ? Math.min(24, parsedFrameCount)
          : 10;
      const payload = {
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
      const response = await fetch("/api/admin/marketing-campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
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

  async function handlePreviewFrame(frameNumber: number) {
    if (!detail?.runId) return;
    setPreviewFrameNumber(frameNumber);
    setPreviewUrl(
      `/api/admin/marketing-campaigns/${encodeURIComponent(detail.runId)}/preview-frame?frame=${frameNumber}&ts=${Date.now()}`,
    );
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

  async function handleResetPage() {
    setError(null);
    setShowAdvanced(false);
    setPreviewFrameNumber(null);
    setPreviewUrl("");
    setDetail(null);
    setSelectedRunId("");
    setForm(INITIAL_FORM);
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
              Marketing Campaigns
            </h1>
            <p className="max-w-3xl text-sm font-medium text-[#6f6786] sm:text-base">
              Generate storyboard campaigns, refine captions, and render short-form videos.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <SecondaryButton onClick={handleResetPage} icon={<RotateCcw className="h-4 w-4" />}>
              Reset Page
            </SecondaryButton>
            {detail?.videoUrl ? (
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
              title={<h2 className="text-xl font-semibold text-[#271a45]">New Run</h2>}
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
                <TextAreaField
                  label="Campaign Criteria"
                  value={form.criteria}
                  onChange={(event) => setForm((current) => ({ ...current, criteria: event.target.value }))}
                  placeholder="a mom creates a live card using envitefy studio for her son Caleb's 7th birthday pool party..."
                  rows={4}
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
                    label="Frames"
                    type="number"
                    min={1}
                    max={24}
                    value={form.frameCount}
                    onChange={(event) => setForm((current) => ({ ...current, frameCount: event.target.value }))}
                    placeholder="10"
                  />
                </div>

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
                  placeholder="Only add this if the agents must preserve or avoid something specific."
                  helper="Use this for hard constraints, not for the main campaign brief."
                />

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
                  icon={submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 fill-current" />}
                >
                  {submitting ? "Generating Campaign…" : "Generate Campaign"}
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
                          <div className="mt-1 text-xs font-medium text-[#7b7394]">
                            {statusLabel(runState)} · {runLabel}
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
              headerClassName="bg-[#fcfbfd]"
              title={
                <div>
                  <h2 className="text-[28px] font-semibold tracking-[-0.03em] text-[#24193f]">Run Detail</h2>
                  <p className="mt-1 text-sm font-medium text-[#7a7391]">
                    {detail?.status?.message || "Select a run to inspect its progress."}
                  </p>
                </div>
              }
              action={
                <div className="flex flex-wrap items-center gap-3">
                  <SecondaryButton
                    onClick={handleRegenerateStoryboard}
                    disabled={!detail?.runId || !qaSummary || regeneratingStoryboard || runIsActive}
                    icon={regeneratingStoryboard ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  >
                    {regeneratingStoryboard ? "Rewriting…" : "Regenerate Storyboard"}
                  </SecondaryButton>
                  <SecondaryButton
                    onClick={handleRegenerateCaptions}
                    disabled={!detail?.runId || regeneratingCaptions || runIsActive}
                    icon={regeneratingCaptions ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  >
                    {regeneratingCaptions ? "Regenerating…" : "Regenerate Captions"}
                  </SecondaryButton>
                  <SecondaryButton
                    onClick={handleSaveCaptions}
                    disabled={!detail?.runId || savingCaptions || runIsActive}
                    icon={savingCaptions ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  >
                    {savingCaptions ? "Saving…" : "Save Captions"}
                  </SecondaryButton>
                  <PrimaryButton
                    onClick={handleRenderVideo}
                    disabled={!detail?.runId || renderingVideo || runIsActive}
                    icon={renderingVideo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Video className="h-4 w-4" />}
                  >
                    {renderingVideo ? "Rendering…" : "Render Video"}
                  </PrimaryButton>
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
                  <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
                    {[
                      { label: "State", value: detail.status.state, icon: Clock3 },
                      { label: "Current Stage", value: detail.status.currentStage || "Idle", icon: LayoutGrid },
                      {
                        label: "Requested Frames",
                        value: String(
                          detail.status.request?.frameCount ||
                            detail.request?.input?.looseInput?.overrides?.numberOfFrames ||
                            "---",
                        ),
                        icon: FileJson,
                      },
                      {
                        label: "Frames Done",
                        value: `${detail.status.frameCounts?.done || 0}/${detail.status.frameCounts?.total || 0}`,
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
                        className="rounded-[24px] border border-[#efebf6] bg-[#fbfaff] p-6"
                      >
                        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-[#938ba9]">
                          <item.icon className="h-4 w-4 text-[#8a7bc4]" />
                          {item.label}
                        </div>
                        <div className="mt-4 text-[30px] font-bold tracking-[-0.04em] text-[#251b3f]">
                          {item.value}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {stages.map((stage) => {
                      const tone = statusTone(stage.status);
                      const isRunning = tone === "info";
                      return (
                        <div
                          key={stage.key}
                          className="relative overflow-hidden rounded-[24px] border border-[#efebf6] bg-white p-5 transition hover:border-[#ddd6ee]"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-bold text-[#281d44]">{stage.label}</div>
                              <div className="mt-2 text-xs font-medium text-[#8a84a1]">
                                {summarizeStageTime(stage.updatedAt)}
                              </div>
                            </div>
                            <StatusBadge tone={tone}>{statusLabel(stage.status)}</StatusBadge>
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
                      Frame Review
                    </h3>
                    <AnimatePresence initial={false}>
                      {frameRows.length ? (
                        frameRows.map((frame, index) => (
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
                                    {frame.imageUrl ? (
                                      <img
                                        src={frame.imageUrl}
                                        alt={`Frame ${frame.frameNumber}`}
                                        className={cn(mediaAspectClass, "w-full object-cover")}
                                      />
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
                                      <StatusBadge tone="info">Frame {frame.frameNumber}</StatusBadge>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handlePreviewFrame(frame.frameNumber)}
                                    className="mt-4 w-full rounded-[18px] border border-[#ddd8e9] px-4 py-3 text-sm font-semibold text-[#5f5678] transition hover:bg-[#faf8fd]"
                                  >
                                    Preview Captioned Frame
                                  </button>
                                </div>

                                <div className="min-w-0 flex-1 space-y-6">
                                  <div className="flex flex-wrap items-start justify-between gap-4">
                                    <div>
                                      <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#9a92b3]">
                                        Frame {frame.frameNumber}
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
                                      label="Caption Text"
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
                                </div>
                              </div>
                            </PageCard>
                          </motion.div>
                        ))
                      ) : (
                        <PageCard>
                          <div className="rounded-[24px] border border-dashed border-[#ddd8e9] px-5 py-12 text-center text-sm text-[#8a84a1]">
                            Frames will appear here once the run reaches image generation.
                          </div>
                        </PageCard>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <aside className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="font-[var(--font-playfair)] text-3xl font-semibold tracking-[-0.04em] text-[#23183d]">
                      Preview
                    </h3>
                    <PageCard bodyClassName="space-y-4 px-4 py-4">
                      <div className="overflow-hidden rounded-[24px] bg-[#17141f]">
                        <AnimatePresence mode="wait">
                          {previewUrl ? (
                            <motion.img
                              key={previewUrl}
                              initial={{ opacity: 0, scale: 0.985 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.985 }}
                              transition={{ duration: 0.22 }}
                              src={previewUrl}
                              alt={
                                previewFrameNumber
                                  ? `Caption preview frame ${previewFrameNumber}`
                                  : "Caption preview"
                              }
                              className={cn(mediaAspectClass, "w-full object-cover")}
                            />
                          ) : (
                            <motion.div
                              key="preview-empty"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className={cn(
                                mediaAspectClass,
                                "flex items-center justify-center px-6 text-center text-sm text-[#c1bdd0]",
                              )}
                            >
                              Click “Preview Captioned Frame” on a frame to render it here.
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {selectedFrame ? (
                        <div className="rounded-[22px] border border-[#efebf6] bg-[#fbfafc] p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#8a7bc4]">
                                Active Frame
                              </div>
                              <div className="mt-1 text-lg font-bold text-[#24193f]">
                                Frame {selectedFrame.frameNumber} · {selectedFrame.title}
                              </div>
                            </div>
                            <StatusBadge tone={statusTone(selectedFrame.status)}>
                              {statusLabel(selectedFrame.status)}
                            </StatusBadge>
                          </div>
                          <div className="mt-4 rounded-[18px] bg-[#18141e] px-5 py-4 text-center text-2xl font-bold tracking-[-0.03em] text-white">
                            {selectedFrame.caption.text || "No caption yet"}
                          </div>
                        </div>
                      ) : null}
                    </PageCard>
                  </div>

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
                                {qaSummary.pass ? "Approved for images" : "Needs rewrite"}
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
                            {[
                              ["Reasons", qaSummary.reasons],
                              ["Caption Issues", qaSummary.captionIssues],
                              ["Blocked Caption Patterns", qaSummary.blockedCaptionPatterns],
                              ["Required Shot Families", qaSummary.requiredShotFamilies],
                            ].map(([label, items]) =>
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
                                Frames To Rewrite
                              </div>
                              <div className="mt-3 text-sm font-semibold text-[#51476b]">
                                {qaSummary.framesToRewrite.length ? qaSummary.framesToRewrite.join(", ") : "None"}
                              </div>
                            </div>
                            <div className="rounded-[20px] border border-[#efebf6] bg-[#fbfafc] p-4">
                              <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#8a7bc4]">
                                Frames To Cut
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

                  {detail.videoUrl ? (
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
      </div>
    </div>
  );
}
