"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Calendar,
  Check,
  CheckCircle2,
  Copy,
  Download,
  Film,
  ImageIcon,
  Loader2,
  Mail,
  MapPin,
  MessageSquare,
  MoreHorizontal,
  PartyPopper,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  WandSparkles,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  ADMIN_AD_STUDIO_ACCENTS,
  ADMIN_AD_STUDIO_CAPTION_STYLES,
  ADMIN_AD_STUDIO_FORMATS,
  type AdminAdStudioAccent,
  type AdminAdStudioBeat,
  type AdminAdStudioCaptionStyle,
  type AdminAdStudioConfig,
  type AdminAdStudioFormat,
  type AdminAdStudioFrameAsset,
  type AdminAdStudioGenerateResponse,
  type AdminAdStudioImagesResponse,
  type AdminAdStudioProviderStatus,
  type AdminAdStudioVideoAsset,
  type AdminAdStudioVideoResponse,
  DEFAULT_ADMIN_AD_STUDIO_CONFIG,
} from "@/lib/admin/ad-studio-types";

type AdStudioClientProps = {
  providerStatuses: AdminAdStudioProviderStatus[];
};

type DraftInput = {
  brief: string;
  eventTitle: string;
  eventDate: string;
  location: string;
  audience: string;
  goal: string;
};

type ThemeUi = {
  label: string;
  hex: string;
  soft: string;
  text: string;
  ring: string;
  button: string;
  gradient: string;
};

type FormatUi = {
  label: string;
  ratio: string;
  className: string;
  shellClassName: string;
};

const THEME_UI: Record<AdminAdStudioAccent, ThemeUi> = {
  lilac: {
    label: "Lilac",
    hex: "#7C3AED",
    soft: "bg-violet-50 text-violet-700 border-violet-200",
    text: "text-violet-200",
    ring: "ring-violet-300",
    button: "bg-violet-600 text-white hover:bg-violet-700",
    gradient: "from-violet-500 to-indigo-600",
  },
  mint: {
    label: "Mint",
    hex: "#059669",
    soft: "bg-emerald-50 text-emerald-700 border-emerald-200",
    text: "text-emerald-200",
    ring: "ring-emerald-300",
    button: "bg-emerald-600 text-white hover:bg-emerald-700",
    gradient: "from-teal-500 to-emerald-600",
  },
  coral: {
    label: "Coral",
    hex: "#E11D48",
    soft: "bg-rose-50 text-rose-700 border-rose-200",
    text: "text-rose-200",
    ring: "ring-rose-300",
    button: "bg-rose-600 text-white hover:bg-rose-700",
    gradient: "from-rose-500 to-orange-500",
  },
  ocean: {
    label: "Ocean",
    hex: "#0284C7",
    soft: "bg-sky-50 text-sky-700 border-sky-200",
    text: "text-sky-200",
    ring: "ring-sky-300",
    button: "bg-sky-600 text-white hover:bg-sky-700",
    gradient: "from-sky-500 to-blue-600",
  },
  midnight: {
    label: "Midnight",
    hex: "#334155",
    soft: "bg-slate-100 text-slate-700 border-slate-300",
    text: "text-slate-200",
    ring: "ring-slate-300",
    button: "bg-slate-900 text-white hover:bg-slate-800",
    gradient: "from-slate-700 to-indigo-950",
  },
};

const FORMAT_UI: Record<AdminAdStudioFormat, FormatUi> = {
  vertical: {
    label: "Vertical",
    ratio: "9:16",
    className: "max-w-[340px] aspect-[9/16] rounded-[42px] border-[10px]",
    shellClassName: "pt-10",
  },
  horizontal: {
    label: "Horizontal",
    ratio: "16:9",
    className: "max-w-[640px] aspect-video rounded-[28px] border-[8px]",
    shellClassName: "pt-0",
  },
  square: {
    label: "Square",
    ratio: "1:1",
    className: "max-w-[460px] aspect-square rounded-[32px] border-[8px]",
    shellClassName: "pt-0",
  },
};

const PRESET_ADS: Array<{ label: string; ad: AdminAdStudioConfig }> = [
  { label: "Birthday", ad: DEFAULT_ADMIN_AD_STUDIO_CONFIG },
  {
    label: "Wedding",
    ad: {
      ...DEFAULT_ADMIN_AD_STUDIO_CONFIG,
      eventTitle: "Maya & Lucas Wedding Weekend",
      eventDate: "Saturday, September 19, 5:30 PM",
      location: "The Garden House",
      audience: "Couples coordinating wedding guests",
      goal: "Show how Envitefy keeps wedding details and RSVPs in one link",
      outputFormat: "vertical",
      accentColor: "mint",
      captionStyle: "editorial",
      socialCaption:
        "Wedding details change fast. Envitefy gives guests one beautiful place for the invite, schedule, RSVP, and registry links.",
      hashtags: ["#Envitefy", "#WeddingPlanning", "#DigitalInvites"],
      beats: [
        {
          tag: "Problem",
          headline: "Wedding details everywhere?",
          subheadline: "Texts, registry links, hotel notes, and RSVP reminders stack up.",
          body: "Guests need the same answers, and the couple needs one source of truth.",
        },
        {
          tag: "Questions",
          headline: "Every chat becomes a help desk.",
          subheadline: "What time? Which address? Where is the registry?",
          body: "The moving pieces stay together before the big day.",
        },
        {
          tag: "Reveal",
          headline: "Build the live wedding card.",
          subheadline: "Invite, schedule, RSVP, and registry details in one polished page.",
          body: "Make it feel like the event while keeping the logistics easy.",
        },
        {
          tag: "Share",
          headline: "Send one guest-ready link.",
          subheadline: "Elegant for guests. Organized for hosts.",
          body: "Copy the invite link and keep everyone aligned.",
        },
      ],
    },
  },
  {
    label: "Open House",
    ad: {
      ...DEFAULT_ADMIN_AD_STUDIO_CONFIG,
      eventTitle: "Sunday Open House",
      eventDate: "Sunday, June 8, 1:00 PM",
      location: "214 Willow Bend Drive",
      audience: "Realtors and open-house visitors",
      goal: "Promote a clean open-house event page with property details",
      outputFormat: "vertical",
      accentColor: "ocean",
      captionStyle: "cinematic",
      socialCaption:
        "Turn an open house into a clean guest link with date, address, listing details, and contact information ready to share.",
      hashtags: ["#Envitefy", "#OpenHouse", "#RealEstateMarketing"],
      beats: [
        {
          tag: "Problem",
          headline: "Open house info gets scattered.",
          subheadline: "Flyers, texts, listing links, and showing notes all compete.",
          body: "Buyers need the details fast, and agents need a shareable destination.",
        },
        {
          tag: "Questions",
          headline: "Address? Time? Listing details?",
          subheadline: "Repeated questions slow down the follow-up.",
          body: "The key information lives on one polished event page.",
        },
        {
          tag: "Reveal",
          headline: "Create the open-house card.",
          subheadline: "Date, address, property highlights, and contact details together.",
          body: "A public page makes the showing easier to promote and easier to attend.",
        },
        {
          tag: "Share",
          headline: "Post the link anywhere.",
          subheadline: "Social, email, text, and listing follow-up stay consistent.",
          body: "One link keeps prospects on the same page.",
        },
      ],
    },
  },
];

function buildInitialDraft(): DraftInput {
  return {
    brief:
      "Create a short social ad for hosts who are overwhelmed by party planning and need one polished invite link.",
    eventTitle: DEFAULT_ADMIN_AD_STUDIO_CONFIG.eventTitle,
    eventDate: DEFAULT_ADMIN_AD_STUDIO_CONFIG.eventDate,
    location: DEFAULT_ADMIN_AD_STUDIO_CONFIG.location,
    audience: DEFAULT_ADMIN_AD_STUDIO_CONFIG.audience,
    goal: DEFAULT_ADMIN_AD_STUDIO_CONFIG.goal,
  };
}

function getActiveBeatIndex(currentTime: number): 0 | 1 | 2 | 3 {
  if (currentTime >= 7.5) return 3;
  if (currentTime >= 5) return 2;
  if (currentTime >= 2.5) return 1;
  return 0;
}

function captionClass(style: AdminAdStudioCaptionStyle) {
  if (style === "playful") return "font-sans font-black";
  if (style === "editorial") return "font-serif font-semibold italic";
  return "font-sans font-extrabold uppercase";
}

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/['"]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 34) || "event"
  );
}

function videoText(value: string) {
  return value.replace(/\bEnvitefy\b/gi, "the live invite");
}

function slideCaptionColor(index: number, theme: ThemeUi) {
  if (index === 0) return "text-amber-300";
  if (index === 1) return "text-rose-400";
  if (index === 2) return "text-yellow-300";
  return theme.text;
}

function replaceBeat(
  ad: AdminAdStudioConfig,
  index: number,
  patch: Partial<AdminAdStudioBeat>,
): AdminAdStudioConfig {
  const beats = ad.beats.map((beat, beatIndex) =>
    beatIndex === index ? { ...beat, ...patch } : beat,
  ) as AdminAdStudioConfig["beats"];
  return { ...ad, beats };
}

function parseErrorMessage(data: AdminAdStudioGenerateResponse | null, status: number) {
  if (data && !data.ok) return data.error.message;
  return `Ad generation failed with status ${status}.`;
}

function parseImagesErrorMessage(data: AdminAdStudioImagesResponse | null, status: number) {
  if (data && !data.ok) return data.error.message;
  return `Image generation failed with status ${status}.`;
}

function parseVideoErrorMessage(data: AdminAdStudioVideoResponse | null, status: number) {
  if (data && !data.ok) return data.error.message;
  return `Video render failed with status ${status}.`;
}

function hasCompleteFrameSet(frames: AdminAdStudioFrameAsset[]) {
  return (
    frames.length === 4 &&
    [0, 1, 2, 3].every((index) => frames.some((frame) => frame.beatIndex === index))
  );
}

export default function AdStudioClient({ providerStatuses }: AdStudioClientProps) {
  const [draft, setDraft] = useState<DraftInput>(() => buildInitialDraft());
  const [ad, setAd] = useState<AdminAdStudioConfig>(DEFAULT_ADMIN_AD_STUDIO_CONFIG);
  const [runId, setRunId] = useState<string | null>(null);
  const [frames, setFrames] = useState<AdminAdStudioFrameAsset[]>([]);
  const [video, setVideo] = useState<AdminAdStudioVideoAsset | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [regeneratingFrame, setRegeneratingFrame] = useState<number | null>(null);
  const [isRenderingVideo, setIsRenderingVideo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assetError, setAssetError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [videoMessage, setVideoMessage] = useState<string | null>(null);

  const activeBeatIndex = getActiveBeatIndex(currentTime);
  const activeTheme = THEME_UI[ad.accentColor];
  const geminiStatus = providerStatuses.find((provider) => provider.id === "geminiText");
  const nanoStatus = providerStatuses.find((provider) => provider.id === "nanoBananaImage");
  const veoStatus = providerStatuses.find((provider) => provider.id === "veoVideo");
  const geminiConfigured = Boolean(geminiStatus?.configured);
  const canGenerateImages =
    Boolean(nanoStatus?.configured) && !isGeneratingImages && regeneratingFrame === null;
  const hasAllFrames = hasCompleteFrameSet(frames);
  const canGenerate = useMemo(
    () =>
      Boolean(
        draft.brief.trim() ||
          draft.eventTitle.trim() ||
          draft.eventDate.trim() ||
          draft.location.trim() ||
          draft.audience.trim() ||
          draft.goal.trim(),
      ),
    [draft],
  );

  useEffect(() => {
    if (!isPlaying) return;
    let frame = 0;
    let previous = performance.now();
    const tick = (now: number) => {
      const delta = (now - previous) / 1000;
      previous = now;
      setCurrentTime((value) => {
        const next = value + delta;
        if (next >= 10) {
          setIsPlaying(false);
          return 10;
        }
        return next;
      });
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [isPlaying]);

  async function generateAd() {
    if (!canGenerate || isGenerating) return;
    setIsGenerating(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/ad-studio/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...draft, outputFormat: ad.outputFormat }),
      });
      const data = (await response
        .json()
        .catch(() => null)) as AdminAdStudioGenerateResponse | null;
      if (!response.ok || !data?.ok) {
        throw new Error(parseErrorMessage(data, response.status));
      }
      setAd(data.ad);
      setRunId(data.runId);
      setFrames([]);
      setVideo(null);
      setCurrentTime(0);
      setIsPlaying(true);
    } catch (generationError) {
      setError(
        generationError instanceof Error ? generationError.message : "Ad generation failed.",
      );
    } finally {
      setIsGenerating(false);
    }
  }

  function replay() {
    setCurrentTime(0);
    setIsPlaying(true);
  }

  function updateDraft(field: keyof DraftInput, value: string) {
    setDraft((previous) => ({ ...previous, [field]: value }));
  }

  function updateAd<K extends keyof AdminAdStudioConfig>(field: K, value: AdminAdStudioConfig[K]) {
    setAd((previous) => ({ ...previous, [field]: value }));
  }

  async function copyCaption() {
    const text = [ad.socialCaption, ad.hashtags.join(" ")].filter(Boolean).join("\n");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  function downloadJson() {
    const payload = {
      runId,
      ad,
      frames,
      video,
      providerStatuses,
    };
    const blob = new Blob([`${JSON.stringify(payload, null, 2)}\n`], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${slugify(ad.eventTitle)}-envitefy-ad.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function requestGeneratedImages(frameIndex?: number) {
    if (!nanoStatus?.configured || isGeneratingImages) return null;
    setAssetError(null);
    setVideoMessage(null);
    setVideo(null);
    if (frameIndex === undefined) {
      setIsGeneratingImages(true);
    } else {
      setRegeneratingFrame(frameIndex);
    }
    try {
      const response = await fetch("/api/admin/ad-studio/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId, ad, frameIndex }),
      });
      const data = (await response.json().catch(() => null)) as AdminAdStudioImagesResponse | null;
      if (!response.ok || !data?.ok) {
        throw new Error(parseImagesErrorMessage(data, response.status));
      }
      setRunId(data.runId);
      setFrames(data.frames);
      setCurrentTime(frameIndex === undefined ? 0 : frameIndex * 2.5);
      setIsPlaying(frameIndex === undefined);
      return { runId: data.runId, frames: data.frames };
    } catch (imageError) {
      setAssetError(imageError instanceof Error ? imageError.message : "Image generation failed.");
      return null;
    } finally {
      setIsGeneratingImages(false);
      setRegeneratingFrame(null);
    }
  }

  async function generateImages(frameIndex?: number) {
    await requestGeneratedImages(frameIndex);
  }

  async function downloadVideo() {
    if (isRenderingVideo || isGeneratingImages) return;
    if (!hasAllFrames && !nanoStatus?.configured) {
      setAssetError("Nano Banana image generation needs a Gemini API key before video export.");
      return;
    }
    setAssetError(null);
    setVideoMessage(
      hasAllFrames
        ? "Rendering MP4 from generated frames."
        : "Generating Nano Banana frames before MP4 render.",
    );
    setIsRenderingVideo(true);
    try {
      let videoFrames = frames;
      let videoRunId = runId;
      if (!hasCompleteFrameSet(videoFrames)) {
        const generated = await requestGeneratedImages();
        if (!generated || !hasCompleteFrameSet(generated.frames)) {
          throw new Error("Generate all four Nano Banana frames before rendering video.");
        }
        videoFrames = generated.frames;
        videoRunId = generated.runId;
        setVideoMessage("Rendering MP4 from generated frames.");
      }
      const response = await fetch("/api/admin/ad-studio/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId: videoRunId, ad, frames: videoFrames, provider: "ffmpeg" }),
      });
      const data = (await response.json().catch(() => null)) as AdminAdStudioVideoResponse | null;
      if (!response.ok || !data?.ok) {
        throw new Error(parseVideoErrorMessage(data, response.status));
      }
      setRunId(data.runId);
      setVideo(data.video);
      if (data.video.url) {
        const anchor = document.createElement("a");
        anchor.href = data.video.url;
        anchor.download = `${slugify(ad.eventTitle)}-envitefy-ad.mp4`;
        anchor.click();
      }
      setVideoMessage(data.video.status === "done" ? "MP4 video ready." : "Veo video started.");
    } catch (videoError) {
      setAssetError(videoError instanceof Error ? videoError.message : "Video render failed.");
      setVideoMessage(null);
    } finally {
      setIsRenderingVideo(false);
    }
  }

  return (
    <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,460px)_minmax(0,1fr)]">
      <section className="min-w-0 space-y-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-950">Campaign Input</h2>
              <p className="mt-1 text-sm text-slate-600">
                {geminiConfigured
                  ? `Using ${geminiStatus?.model || "Gemini"}`
                  : "Set a Gemini key to generate copy."}
              </p>
            </div>
            <span
              className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                geminiConfigured
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-amber-200 bg-amber-50 text-amber-800"
              }`}
            >
              {geminiConfigured ? "Ready" : "Needs key"}
            </span>
          </div>

          <div className="mt-4 grid gap-2">
            {providerStatuses.map((provider) => (
              <ProviderStatusRow key={provider.id} provider={provider} />
            ))}
          </div>

          <div className="mt-4 space-y-3">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Brief
              </span>
              <textarea
                value={draft.brief}
                onChange={(event) => updateDraft("brief", event.target.value)}
                rows={5}
                className="mt-1 min-h-32 w-full resize-y rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                placeholder="Audience, offer, event type, tone, and what the ad should make people do."
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <TextInput
                label="Event title"
                value={draft.eventTitle}
                onChange={(value) => updateDraft("eventTitle", value)}
              />
              <TextInput
                label="Date and time"
                value={draft.eventDate}
                onChange={(value) => updateDraft("eventDate", value)}
              />
              <TextInput
                label="Location"
                value={draft.location}
                onChange={(value) => updateDraft("location", value)}
              />
              <TextInput
                label="Audience"
                value={draft.audience}
                onChange={(value) => updateDraft("audience", value)}
              />
            </div>

            <TextInput
              label="Goal"
              value={draft.goal}
              onChange={(value) => updateDraft("goal", value)}
            />

            {error ? (
              <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {error}
              </div>
            ) : null}
            {assetError ? (
              <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {assetError}
              </div>
            ) : null}

            <button
              type="button"
              onClick={generateAd}
              disabled={!canGenerate || isGenerating}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isGenerating ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <WandSparkles size={16} />
              )}
              <span>{isGenerating ? "Generating" : "Generate Ad"}</span>
            </button>
            <button
              type="button"
              onClick={() => void generateImages()}
              disabled={!canGenerateImages}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
            >
              {isGeneratingImages ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <ImageIcon size={16} />
              )}
              <span>{isGeneratingImages ? "Generating frames" : "Generate Nano Frames"}</span>
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-base font-semibold text-slate-950">Presets</h2>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {PRESET_ADS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  setAd(preset.ad);
                  setRunId(null);
                  setFrames([]);
                  setVideo(null);
                  setAssetError(null);
                  setCurrentTime(0);
                  setIsPlaying(true);
                }}
                className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-left text-sm font-semibold text-slate-800 transition hover:border-violet-200 hover:bg-violet-50"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="min-w-0 space-y-4">
        <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,390px)]">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm lg:order-2">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-slate-950">Phone Preview</h2>
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700">
                  {FORMAT_UI[ad.outputFormat].ratio}
                </span>
                <span
                  className={`rounded-full border px-2.5 py-1 text-xs font-medium ${activeTheme.soft}`}
                >
                  {videoText(ad.beats[activeBeatIndex].tag)}
                </span>
              </div>
            </div>

            <div className="mt-4 flex justify-center">
              <PhoneAdPreview
                ad={ad}
                frames={frames}
                currentTime={currentTime}
                isPlaying={isPlaying}
                onTogglePlay={() => setIsPlaying((value) => !value)}
              />
            </div>

            <div className="mt-4 space-y-3">
              <input
                type="range"
                min="0"
                max="10"
                step="0.05"
                value={currentTime}
                onChange={(event) => {
                  setCurrentTime(Number(event.target.value));
                  setIsPlaying(false);
                }}
                className="w-full accent-violet-600"
                aria-label="Ad timeline"
              />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <IconButton
                    label={isPlaying ? "Pause" : "Play"}
                    onClick={() => setIsPlaying((value) => !value)}
                  >
                    {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                  </IconButton>
                  <IconButton label="Replay" onClick={replay}>
                    <RotateCcw size={16} />
                  </IconButton>
                  <button
                    type="button"
                    onClick={() => void generateImages()}
                    disabled={!canGenerateImages || isRenderingVideo}
                    className="inline-flex min-h-9 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isGeneratingImages ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : hasAllFrames ? (
                      <RefreshCw size={15} />
                    ) : (
                      <ImageIcon size={15} />
                    )}
                    <span>
                      {isGeneratingImages
                        ? "Generating"
                        : hasAllFrames
                          ? "Regenerate Images"
                          : "Generate Images"}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => void downloadVideo()}
                    disabled={
                      isGeneratingImages ||
                      isRenderingVideo ||
                      (!hasAllFrames && !nanoStatus?.configured)
                    }
                    className="inline-flex min-h-9 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isRenderingVideo ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <Film size={15} />
                    )}
                    <span>
                      {isRenderingVideo
                        ? "Rendering"
                        : hasAllFrames
                          ? "Download Video"
                          : "Generate + Download Video"}
                    </span>
                  </button>
                  {video?.url ? (
                    <a
                      href={video.url}
                      download={`${slugify(ad.eventTitle)}-envitefy-ad.mp4`}
                      className="inline-flex min-h-9 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
                    >
                      <Download size={15} />
                      <span>MP4</span>
                    </a>
                  ) : null}
                </div>
                <span className="font-mono text-xs text-slate-500">
                  {currentTime.toFixed(1)}s / 10.0s
                </span>
              </div>
              {videoMessage ? <p className="text-xs text-slate-500">{videoMessage}</p> : null}
              {assetError ? (
                <p className="text-xs font-medium text-rose-600">{assetError}</p>
              ) : null}
              <p className="text-[11px] text-slate-500">
                Nano Banana: {nanoStatus?.configured ? nanoStatus.model : "needs key"} | Veo:{" "}
                {veoStatus?.configured ? veoStatus.model : "needs key"}
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm lg:order-1">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-slate-950">Live Copy</h2>
              <div className="flex items-center gap-2">
                <IconButton
                  label={copied ? "Copied" : "Copy caption"}
                  onClick={() => void copyCaption()}
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </IconButton>
                <IconButton label="Download JSON" onClick={downloadJson}>
                  <Download size={16} />
                </IconButton>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <TextInput
                label="Preview title"
                value={ad.eventTitle}
                onChange={(value) => updateAd("eventTitle", value)}
              />
              <TextInput
                label="Preview date"
                value={ad.eventDate}
                onChange={(value) => updateAd("eventDate", value)}
              />
              <TextInput
                label="Preview location"
                value={ad.location}
                onChange={(value) => updateAd("location", value)}
              />
              <TextInput
                label="Audience"
                value={ad.audience}
                onChange={(value) => updateAd("audience", value)}
              />
            </div>

            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Output format
              </p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {ADMIN_AD_STUDIO_FORMATS.map((format) => (
                  <button
                    key={format}
                    type="button"
                    onClick={() => updateAd("outputFormat", format)}
                    className={`rounded-md border px-2 py-2 text-left transition ${
                      ad.outputFormat === format
                        ? `${activeTheme.button} border-transparent`
                        : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <span className="block text-xs font-semibold">{FORMAT_UI[format].label}</span>
                    <span className="mt-0.5 block font-mono text-[11px] opacity-80">
                      {FORMAT_UI[format].ratio}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Accent
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {ADMIN_AD_STUDIO_ACCENTS.map((accent) => (
                    <button
                      key={accent}
                      type="button"
                      onClick={() => updateAd("accentColor", accent)}
                      className={`flex h-9 w-9 items-center justify-center rounded-full border-2 bg-white transition ${
                        ad.accentColor === accent
                          ? `border-white ring-2 ${THEME_UI[accent].ring}`
                          : "border-slate-200"
                      }`}
                      title={THEME_UI[accent].label}
                      aria-label={THEME_UI[accent].label}
                    >
                      <span
                        className="h-6 w-6 rounded-full"
                        style={{ backgroundColor: THEME_UI[accent].hex }}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Caption style
                </p>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {ADMIN_AD_STUDIO_CAPTION_STYLES.map((style) => (
                    <button
                      key={style}
                      type="button"
                      onClick={() => updateAd("captionStyle", style)}
                      className={`rounded-md border px-2 py-2 text-xs font-semibold capitalize transition ${
                        ad.captionStyle === style
                          ? `${activeTheme.button} border-transparent`
                          : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <label className="mt-4 block">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Social caption
              </span>
              <textarea
                value={ad.socialCaption}
                onChange={(event) => updateAd("socialCaption", event.target.value)}
                rows={3}
                className="mt-1 w-full resize-y rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
              />
            </label>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-base font-semibold text-slate-950">Story Beats</h2>
            <span className="text-sm text-slate-500">
              {frames.length}/4 Nano frames, 2.5 seconds each
            </span>
          </div>

          <div className="mt-4 grid gap-3 xl:grid-cols-4">
            {ad.beats.map((beat, index) => (
              <BeatEditor
                key={`${beat.tag}-${index}`}
                beat={beat}
                index={index}
                active={index === activeBeatIndex}
                theme={activeTheme}
                onChange={(patch) => setAd((previous) => replaceBeat(previous, index, patch))}
                hasFrame={frames.some((frame) => frame.beatIndex === index)}
                isRegenerating={regeneratingFrame === index}
                onRegenerate={() => void generateImages(index)}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function ProviderStatusRow({ provider }: { provider: AdminAdStudioProviderStatus }) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
      <div className="min-w-0">
        <p className="truncate text-xs font-semibold text-slate-800">{provider.label}</p>
        <p className="truncate font-mono text-[11px] text-slate-500">{provider.model}</p>
      </div>
      <span
        className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
          provider.configured
            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
            : "border-amber-200 bg-amber-50 text-amber-800"
        }`}
        title={provider.envVars.join(", ")}
      >
        {provider.configured ? "Ready" : "Needs key"}
      </span>
    </div>
  );
}

function TextInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </span>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 min-h-10 w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
      />
    </label>
  );
}

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
      title={label}
      aria-label={label}
    >
      {children}
    </button>
  );
}

function BeatEditor({
  beat,
  index,
  active,
  theme,
  onChange,
  hasFrame,
  isRegenerating,
  onRegenerate,
}: {
  beat: AdminAdStudioBeat;
  index: number;
  active: boolean;
  theme: ThemeUi;
  onChange: (patch: Partial<AdminAdStudioBeat>) => void;
  hasFrame: boolean;
  isRegenerating: boolean;
  onRegenerate: () => void;
}) {
  return (
    <article
      className={`rounded-lg border p-3 transition ${
        active ? `border-transparent ${theme.soft}` : "border-slate-200 bg-slate-50"
      }`}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="font-mono text-xs font-semibold text-slate-500">
          {(index * 2.5).toFixed(1)}s
        </span>
        <button
          type="button"
          onClick={onRegenerate}
          disabled={isRegenerating}
          className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-white/70 bg-white/80 text-slate-600 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
          title={hasFrame ? "Regenerate frame" : "Generate frame"}
          aria-label={hasFrame ? "Regenerate frame" : "Generate frame"}
        >
          {isRegenerating ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <RefreshCw size={13} />
          )}
        </button>
        <input
          value={beat.tag}
          onChange={(event) => onChange({ tag: event.target.value })}
          className="min-w-0 rounded-md border border-white/70 bg-white/80 px-2 py-1 text-right text-xs font-semibold text-slate-800 outline-none"
          aria-label={`Beat ${index + 1} tag`}
        />
      </div>
      <label className="block">
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
          Headline
        </span>
        <textarea
          value={beat.headline}
          onChange={(event) => onChange({ headline: event.target.value })}
          rows={2}
          className="mt-1 w-full resize-y rounded-md border border-white/70 bg-white/85 px-2 py-2 text-sm font-semibold text-slate-950 outline-none"
        />
      </label>
      <label className="mt-2 block">
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
          Support
        </span>
        <textarea
          value={beat.subheadline}
          onChange={(event) => onChange({ subheadline: event.target.value })}
          rows={3}
          className="mt-1 w-full resize-y rounded-md border border-white/70 bg-white/85 px-2 py-2 text-sm text-slate-800 outline-none"
        />
      </label>
    </article>
  );
}

function PhoneAdPreview({
  ad,
  frames,
  currentTime,
  isPlaying,
  onTogglePlay,
}: {
  ad: AdminAdStudioConfig;
  frames: AdminAdStudioFrameAsset[];
  currentTime: number;
  isPlaying: boolean;
  onTogglePlay: () => void;
}) {
  const activeIndex = getActiveBeatIndex(currentTime);
  const beat = ad.beats[activeIndex];
  const theme = THEME_UI[ad.accentColor];
  const format = FORMAT_UI[ad.outputFormat];
  const isVertical = ad.outputFormat === "vertical";
  const generatedFrame = frames.find((frame) => frame.beatIndex === activeIndex);

  return (
    <div
      className={`relative w-full select-none overflow-hidden border-slate-900 bg-slate-950 shadow-2xl ${format.className}`}
    >
      {isVertical ? (
        <div className="absolute left-1/2 top-2 z-40 flex h-5 w-28 -translate-x-1/2 items-center justify-between rounded-full bg-slate-900 px-3">
          <span className="h-1.5 w-1.5 rounded-full bg-slate-800" />
          <span className="h-1 w-12 rounded-full bg-slate-950" />
          <span className="h-2 w-2 rounded-full border border-sky-500/20 bg-sky-900/40" />
        </div>
      ) : null}

      {isVertical ? (
        <div className="absolute inset-x-0 top-0 z-30 flex h-10 items-center justify-between px-6 pt-2 text-[11px] font-medium text-slate-300">
          <span>9:41 AM</span>
          <span className="h-2.5 w-5 rounded-sm border border-slate-300/70 p-0.5">
            <span className="block h-full w-full rounded-[2px] bg-slate-300" />
          </span>
        </div>
      ) : null}

      <div className={`relative h-full overflow-hidden bg-slate-950 ${format.shellClassName}`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeIndex}
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.99 }}
            transition={{ duration: 0.24 }}
            className={
              isVertical
                ? "absolute inset-x-0 bottom-0 top-10 overflow-hidden"
                : "absolute inset-0 overflow-hidden"
            }
          >
            {generatedFrame ? (
              <img
                src={generatedFrame.url}
                alt=""
                className="absolute inset-0 h-full w-full object-cover opacity-80"
                draggable={false}
              />
            ) : (
              <div className={`absolute inset-0 bg-gradient-to-br ${theme.gradient} opacity-80`} />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/25 to-slate-950/45" />

            <div className={`relative z-10 h-full ${isVertical ? "p-4" : "p-5 sm:p-6"}`}>
              <AdPlayerSlideContent
                ad={ad}
                beat={beat}
                activeIndex={activeIndex}
                currentTime={currentTime}
                theme={theme}
                compact={isVertical}
                formatRatio={format.ratio}
              />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <button
        type="button"
        onClick={onTogglePlay}
        className="absolute bottom-4 left-4 z-40 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-slate-950/70 text-white shadow-lg backdrop-blur-md"
        aria-label={isPlaying ? "Pause preview" : "Play preview"}
        title={isPlaying ? "Pause preview" : "Play preview"}
      >
        {isPlaying ? <Pause size={15} /> : <Play size={15} />}
      </button>

      <div className="absolute bottom-0 inset-x-0 z-50 h-1 bg-slate-900">
        <div
          className={`h-full bg-gradient-to-r ${theme.gradient}`}
          style={{ width: `${Math.min(100, Math.max(0, (currentTime / 10) * 100))}%` }}
        />
      </div>
      <div
        className={`absolute right-3 z-40 rounded-full border border-slate-700 bg-slate-950/70 px-2 py-0.5 font-mono text-[9px] text-slate-300 backdrop-blur-md ${
          isVertical ? "top-11" : "top-3"
        }`}
      >
        {currentTime.toFixed(1)}s
      </div>
    </div>
  );
}

function AdPlayerSlideContent({
  ad,
  beat,
  activeIndex,
  currentTime,
  theme,
  compact,
  formatRatio,
}: {
  ad: AdminAdStudioConfig;
  beat: AdminAdStudioBeat;
  activeIndex: number;
  currentTime: number;
  theme: ThemeUi;
  compact: boolean;
  formatRatio: string;
}) {
  if (activeIndex === 3) {
    return (
      <ProductShowcaseSlide
        ad={ad}
        theme={theme}
        currentTime={currentTime}
        compact={compact}
        formatRatio={formatRatio}
      />
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {!compact ? (
        <div className="mb-3 flex items-center justify-between gap-3">
          <BrandLockup />
          <span className="rounded-full border border-white/10 bg-slate-950/70 px-2 py-1 font-mono text-[10px] text-slate-200 backdrop-blur-md">
            {formatRatio}
          </span>
        </div>
      ) : null}
      <SafeZoneCaption
        beat={beat}
        activeIndex={activeIndex}
        theme={theme}
        captionStyle={ad.captionStyle}
        compact={compact}
      />
      <div className="relative mt-3 min-h-0 flex-1">
        {activeIndex === 0 ? (
          <PlanningStressObjects compact={compact} />
        ) : activeIndex === 1 ? (
          <IncomingQuestionObjects compact={compact} />
        ) : (
          <EnvitefyReveal beat={beat} theme={theme} compact={compact} />
        )}
      </div>
      <div className={compact ? "h-20 shrink-0" : "h-8 shrink-0"} />
    </div>
  );
}

function SafeZoneCaption({
  beat,
  activeIndex,
  theme,
  captionStyle,
  compact,
}: {
  beat: AdminAdStudioBeat;
  activeIndex: number;
  theme: ThemeUi;
  captionStyle: AdminAdStudioCaptionStyle;
  compact: boolean;
}) {
  return (
    <div
      className={`w-full rounded-2xl border border-white/10 bg-slate-950/85 shadow-lg backdrop-blur-md ${
        compact ? "mt-1 p-3.5" : "max-w-[72%] p-3"
      }`}
    >
      <p
        className={`text-center leading-tight ${captionClass(captionStyle)} ${slideCaptionColor(
          activeIndex,
          theme,
        )} ${compact ? "text-[13px]" : "text-[15px]"}`}
      >
        {videoText(beat.headline)}
      </p>
      <p
        className={`mt-1 text-center leading-tight text-slate-200 ${
          compact ? "text-[9.5px]" : "text-[11px]"
        }`}
      >
        {videoText(beat.subheadline)}
      </p>
    </div>
  );
}

function PlanningStressObjects({ compact }: { compact: boolean }) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <motion.div
        initial={{ scale: 0.82, rotate: -12, y: -10, opacity: 0 }}
        animate={{ scale: 1, rotate: -6, y: 0, opacity: 1 }}
        transition={{ delay: 0.08 }}
        className={`absolute left-[3%] top-[6%] rounded-xl border border-amber-200/50 bg-amber-50 p-2 text-left text-amber-950 shadow-lg backdrop-blur-sm ${
          compact ? "w-28" : "w-32"
        }`}
      >
        <span className="mb-1 block border-b border-amber-900/10 pb-0.5 text-[9px] font-bold">
          Party Date?
        </span>
        <span className="block font-mono text-[8px] text-amber-800/60 line-through">
          May 24th... wait
        </span>
        <span className="font-mono text-[8px]">No, June 1st?</span>
      </motion.div>

      <motion.div
        initial={{ scale: 0.82, rotate: 12, y: -16, opacity: 0 }}
        animate={{ scale: 0.96, rotate: 8, y: 0, opacity: 1 }}
        transition={{ delay: 0.22 }}
        className={`absolute right-[4%] top-[12%] rounded-xl border border-rose-200/50 bg-rose-50 p-2 text-left text-rose-950 shadow-lg backdrop-blur-sm ${
          compact ? "w-24" : "w-28"
        }`}
      >
        <span className="mb-1 block border-b border-rose-900/10 pb-0.5 text-[9px] font-bold">
          Guest List
        </span>
        <span className="font-mono text-[8px]">Who replied??</span>
        <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-rose-900/10">
          <span className="block h-full w-1/3 animate-pulse bg-rose-500" />
        </span>
      </motion.div>
    </div>
  );
}

function IncomingQuestionObjects({ compact }: { compact: boolean }) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute inset-x-0 top-[4%] flex justify-center">
        <span className="rounded-full border border-rose-500/20 bg-slate-950/95 px-2.5 py-0.5 font-mono text-[8px] font-semibold uppercase tracking-widest text-rose-300 shadow-sm backdrop-blur-md">
          Incoming Questions
        </span>
      </div>
      <motion.div
        initial={{ x: -60, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className={`absolute left-0 top-[17%] rounded-2xl rounded-tl-none border border-white/10 bg-slate-900/95 p-2.5 text-left shadow-lg backdrop-blur-md ${
          compact ? "max-w-[82%]" : "max-w-[68%]"
        }`}
      >
        <p className="text-[8px] font-semibold leading-none text-indigo-300">Mark</p>
        <p className="mt-0.5 text-[9.5px] leading-tight text-slate-200">
          What is the RSVP cutoff date?
        </p>
      </motion.div>
      <motion.div
        initial={{ x: 60, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.45 }}
        className={`absolute right-0 top-[48%] rounded-2xl rounded-tr-none border border-white/10 bg-purple-950/95 p-2.5 text-right shadow-lg backdrop-blur-md ${
          compact ? "max-w-[78%]" : "max-w-[64%]"
        }`}
      >
        <p className="text-[8px] font-semibold leading-none text-purple-300">You</p>
        <p className="mt-0.5 text-[9.5px] leading-tight text-slate-100">
          Still gathering the addresses...
        </p>
      </motion.div>
      <motion.div
        initial={{ x: -60, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.8 }}
        className={`absolute left-0 top-[69%] rounded-2xl rounded-tl-none border border-white/10 bg-slate-900/95 p-2.5 text-left shadow-lg backdrop-blur-md ${
          compact ? "max-w-[78%]" : "max-w-[64%]"
        }`}
      >
        <p className="text-[8px] font-semibold leading-none text-emerald-300">Sarah</p>
        <p className="mt-0.5 text-[9.5px] leading-tight text-slate-200">Wait is parking free?</p>
      </motion.div>
    </div>
  );
}

function BrandLockup({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/70 px-2.5 py-1.5 shadow-lg backdrop-blur-md">
      <img
        src="/favicon.png"
        alt=""
        className={compact ? "h-5 w-5 rounded-md" : "h-6 w-6 rounded-md"}
        draggable={false}
      />
      <img
        src="/email/envitefy-wordmark-email.png"
        alt="Envitefy"
        className={compact ? "h-3.5 w-auto" : "h-4 w-auto"}
        draggable={false}
      />
      <span className="hidden font-mono text-[10px] text-slate-300 sm:inline">envitefy.com</span>
    </div>
  );
}

function EnvitefyReveal({
  beat,
  theme,
  compact,
}: {
  beat: AdminAdStudioBeat;
  theme: ThemeUi;
  compact: boolean;
}) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <motion.div
        initial={{ scale: 0.78, rotate: -12, opacity: 0, y: 20 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 170, damping: 13 }}
        className={`absolute bottom-[30%] left-4 flex items-center justify-center rounded-2xl bg-gradient-to-br ${theme.gradient} p-2.5 text-white shadow-2xl ring-4 ring-white/10 ${
          compact ? "h-16 w-16" : "h-20 w-20"
        }`}
      >
        <img src="/favicon.png" alt="" className="h-full w-full object-contain" draggable={false} />
      </motion.div>
      <motion.div
        initial={{ y: 14, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className={`absolute bottom-[8%] left-1/2 flex -translate-x-1/2 flex-col items-center rounded-2xl border border-white/10 bg-slate-950/85 px-4 py-3 text-center shadow-xl backdrop-blur-md ${
          compact ? "w-[86%]" : "w-[58%]"
        }`}
      >
        <img
          src="/email/envitefy-wordmark-email.png"
          alt="Envitefy"
          className={compact ? "h-6 w-auto" : "h-7 w-auto"}
          draggable={false}
        />
        <p className="mt-2 font-mono text-[10px] text-slate-300">envitefy.com</p>
        <p className="mt-2 max-w-[210px] text-[10px] leading-snug text-slate-200">
          {videoText(beat.body)}
        </p>
      </motion.div>
    </div>
  );
}

function ProductShowcaseSlide({
  ad,
  theme,
  currentTime,
  compact,
  formatRatio,
}: {
  ad: AdminAdStudioConfig;
  theme: ThemeUi;
  currentTime: number;
  compact: boolean;
  formatRatio: string;
}) {
  const showToast = currentTime >= 8.8;
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between rounded-lg border border-white/10 bg-slate-950/45 p-1.5 shadow-lg backdrop-blur-md">
        <div className="flex items-center gap-1.5">
          <img src="/favicon.png" alt="" className="h-5 w-5 rounded-md" draggable={false} />
          <span className="text-[11px] font-bold text-white">envitefy</span>
        </div>
        <div className="flex items-center gap-2">
          {!compact ? (
            <span className="rounded-full border border-white/10 bg-slate-950/70 px-2 py-1 font-mono text-[10px] text-slate-200">
              {formatRatio}
            </span>
          ) : null}
          <CheckCircle2 size={14} className="text-emerald-400" />
        </div>
      </div>
      <motion.div
        initial={{ y: 15, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 120 }}
        className={`mx-auto mt-2 origin-top overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-900 shadow-2xl ${
          compact ? "w-full max-w-[260px] scale-[0.9]" : "w-full max-w-[340px]"
        }`}
      >
        <div
          className={`relative flex flex-col items-center justify-center bg-gradient-to-r ${theme.gradient} px-4 py-4 text-center text-white`}
        >
          <p className="text-[8px] font-bold uppercase tracking-[0.16em] text-white/80">
            You're invited!
          </p>
          <h3 className="mt-1 text-[13px] font-black leading-tight">{ad.eventTitle}</h3>
        </div>
        <div className="space-y-2 bg-white p-3 text-left">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-700">
              <Calendar size={12} />
            </span>
            <span className="text-[10px] font-semibold">{ad.eventDate}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-700">
              <MapPin size={12} />
            </span>
            <span className="text-[10px] font-semibold">{ad.location}</span>
          </div>
          <div className="flex items-center justify-between border-t border-dashed border-slate-200 pt-2">
            <span className="max-w-[170px] truncate font-mono text-[8px] text-slate-500">
              envitefy.com/{slugify(ad.eventTitle)}
            </span>
            <span className="grid h-5 w-5 grid-cols-2 gap-0.5 rounded border border-slate-200 bg-slate-50 p-1">
              <span className="bg-slate-800" />
              <span className="bg-slate-800" />
              <span className="bg-slate-800" />
              <span className="bg-slate-800" />
            </span>
          </div>
        </div>
      </motion.div>

      <div className="mt-1 grid grid-cols-4 gap-1 rounded-xl border border-white/5 bg-slate-950/45 p-1.5 text-center backdrop-blur-md">
        <ShareAction icon={<Copy size={12} />} label="Copy link" />
        <ShareAction icon={<MessageSquare size={12} />} label="Message" tone="text-emerald-300" />
        <ShareAction icon={<Mail size={12} />} label="Email" tone="text-purple-300" />
        <ShareAction icon={<MoreHorizontal size={12} />} label="More" />
      </div>

      <motion.button
        type="button"
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.18 }}
        className={`relative mx-auto mt-2.5 flex w-full max-w-[250px] items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r ${theme.gradient} px-3 py-2 text-xs font-bold text-white shadow-lg`}
      >
        <PartyPopper size={14} />
        Share Invite
        {currentTime >= 8.8 && currentTime <= 9.3 ? (
          <motion.span
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 2.2, opacity: 0 }}
            className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-purple-500"
          />
        ) : null}
      </motion.button>

      <AnimatePresence>
        {showToast ? (
          <motion.div
            initial={{ y: 18, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 18, opacity: 0 }}
            className="absolute bottom-[4.5rem] inset-x-2 z-30 mx-auto flex max-w-[270px] items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/90 p-2.5 text-left text-white shadow-xl backdrop-blur-md"
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500">
              <Check size={13} />
            </span>
            <span className="text-[9px] font-semibold">Copy invitation ready to share.</span>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function ShareAction({
  icon,
  label,
  tone = "text-white",
}: {
  icon: ReactNode;
  label: string;
  tone?: string;
}) {
  return (
    <div className="flex flex-col items-center">
      <span className={`flex h-6 w-6 items-center justify-center rounded-full bg-white/10 ${tone}`}>
        {icon}
      </span>
      <span className="mt-0.5 font-mono text-[7px] text-slate-300">{label}</span>
    </div>
  );
}
