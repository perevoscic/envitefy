"use client";

import * as Dialog from "@radix-ui/react-dialog";
import {
  ArrowDownToLine,
  ArrowRight,
  Check,
  CheckCheck,
  ChevronDown,
  Clapperboard,
  Copy,
  Eye,
  FileText,
  ImageIcon,
  Layers2,
  Loader2,
  Maximize2,
  MessageSquare,
  PencilLine,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  defaultStudioFormat,
  STUDIO_PLATFORMS,
  STUDIO_STATUS_LABELS,
  studioAssetUrl,
  type StudioOutput,
  type StudioPlatform,
  type StudioSettings,
  type StudioVersion,
} from "@/lib/admin/marketing-studio/types";
import type { ContentStudio } from "./use-content-studio";
import styles from "./studio.module.css";
import { StudioPostPreview } from "./studio-post-preview";

export const platformNames: Record<StudioPlatform, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  youtube: "YouTube",
  reddit: "Reddit",
};
export const outputNames: Record<StudioOutput, string> = {
  image: "Image",
  video: "Video",
  prompt: "Prompt",
};
export const fieldClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100";
export const buttonClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 disabled:cursor-not-allowed disabled:opacity-45";
export const primaryClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-45";

export function StudioDrawer({
  open,
  onOpenChange,
  title,
  description,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[80] bg-slate-950/25 backdrop-blur-sm motion-safe:animate-in motion-safe:fade-in" />
        <Dialog.Content
          className={`${styles.studio} fixed inset-y-0 right-0 z-[81] flex w-full max-w-lg flex-col overflow-y-auto border-l border-slate-200 bg-white p-6 shadow-2xl sm:p-8`}
        >
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="font-sans text-xl font-semibold tracking-tight text-slate-950">
                {title}
              </Dialog.Title>
              <Dialog.Description className="mt-2 text-sm leading-6 text-slate-500">
                {description}
              </Dialog.Description>
            </div>
            <Dialog.Close
              className={`${buttonClass} shrink-0`}
              aria-label={`Close ${title.toLowerCase()}`}
            >
              <X className="h-5 w-5" />
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function SettingsDrawer({
  studio,
  open,
  onOpenChange,
}: {
  studio: ContentStudio;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { settings, changeSettings } = studio;
  return (
    <StudioDrawer
      open={open}
      onOpenChange={onOpenChange}
      title="Creative settings"
      description="A little direction goes a long way. These are optional, and your choices are saved with this creation."
    >
      <div className="space-y-6">
        <label className="block space-y-2 text-sm font-medium text-slate-700">
          Format
          <select
            value={settings.format}
            onChange={(event) =>
              changeSettings({ format: event.target.value as StudioSettings["format"] })
            }
            className={fieldClass}
          >
            {settings.output !== "video" && <option value="square">Square · 1:1</option>}
            <option value="vertical">Vertical · 9:16</option>
            <option value="horizontal">Landscape · 16:9</option>
          </select>
        </label>
        {(
          [
            ["audience", "Audience", "Who are you talking to?"],
            ["tone", "Tone", "For example: playful, warm, confident"],
            ["callToAction", "Call to action", "What should someone do next?"],
          ] as const
        ).map(([key, label, placeholder]) => (
          <label key={key} className="block space-y-2 text-sm font-medium text-slate-700">
            {label}
            <input
              className={fieldClass}
              value={settings[key]}
              maxLength={key === "audience" ? 500 : 240}
              placeholder={placeholder}
              onChange={(event) => changeSettings({ [key]: event.target.value })}
            />
          </label>
        ))}
        <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 p-4">
          <input
            type="checkbox"
            checked={settings.branding}
            onChange={(event) => changeSettings({ branding: event.target.checked })}
            className="mt-0.5 h-5 w-5 accent-violet-600"
          />
          <span>
            <span className="block text-sm font-medium text-slate-800">
              Include Envitefy branding
            </span>
            <span className="mt-1 block text-sm leading-6 text-slate-500">
              Use the official wordmark and app icon in your creative.
            </span>
          </span>
        </label>
        <p className="text-xs leading-5 text-slate-500">
          For specific visual direction or exclusions, add them directly to your idea.
        </p>
        <button
          type="button"
          className={`${primaryClass} w-full`}
          onClick={() => onOpenChange(false)}
        >
          Done
        </button>
      </div>
    </StudioDrawer>
  );
}

export function OutputGlyph({
  output,
  className = "h-4 w-4",
}: {
  output: StudioOutput;
  className?: string;
}) {
  return output === "video" ? (
    <Clapperboard className={className} aria-hidden="true" />
  ) : output === "prompt" ? (
    <FileText className={className} aria-hidden="true" />
  ) : (
    <ImageIcon className={className} aria-hidden="true" />
  );
}

export function EmptyPreview() {
  return (
    <div className="flex min-h-[300px] flex-1 flex-col items-center justify-center px-7 py-12 text-center sm:min-h-[470px]">
      <div className="relative mb-10 flex h-36 w-48 items-center justify-center" aria-hidden="true">
        <div className="absolute left-4 top-4 h-28 w-24 -rotate-12 rounded-2xl border border-violet-100 bg-violet-50 p-4 shadow-sm">
          <div className="mb-3 h-2 w-12 rounded-full bg-violet-200" />
          <div className="h-2 w-14 rounded-full bg-violet-100" />
          <div className="mt-2 h-2 w-9 rounded-full bg-violet-100" />
        </div>
        <div className="absolute right-3 top-0 flex h-32 w-28 rotate-6 items-center justify-center rounded-2xl border border-white bg-gradient-to-br from-orange-100 via-rose-100 to-violet-200 shadow-[0_8px_24px_rgba(124,58,237,0.12)]">
          <ImageIcon className="h-9 w-9 text-white/90" />
        </div>
        <div className="absolute bottom-0 right-0 flex h-12 w-12 items-center justify-center rounded-2xl border border-white bg-white shadow-md">
          <Sparkles className="h-5 w-5 text-violet-500" />
        </div>
      </div>
      <h2 className="font-sans text-xl font-semibold tracking-tight text-slate-800">
        A little idea. A lot of possibilities.
      </h2>
      <p className="mt-3 max-w-xs text-sm leading-6 text-slate-500">
        Your creation will appear here. Then refine it, try another direction, or make it work for
        another platform.
      </p>
    </div>
  );
}

export function StudioPreview({
  studio,
  onRefine,
}: {
  studio: ContentStudio;
  onRefine?: () => void;
}) {
  const [drawer, setDrawer] = useState<"prompt" | "caption" | "details" | "adapt" | null>(null);
  const [prompt, setPrompt] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [adaptPlatform, setAdaptPlatform] = useState<StudioPlatform>("facebook");
  const [expanded, setExpanded] = useState(false);
  const [previewMode, setPreviewMode] = useState<"media" | "post">("media");
  const expandButton = useRef<HTMLButtonElement>(null);
  const { previewVersion: version, selectedVersion, activeVersion } = studio;
  const result = version?.result;
  const sourcePrompt = result?.prompt || "";
  useEffect(() => {
    setPrompt(sourcePrompt);
  }, [version?.id, sourcePrompt]);
  const isBusy = Boolean(activeVersion || studio.sending);
  const assetId = result?.assetId;
  const failed =
    selectedVersion?.status === "failed" || selectedVersion?.status === "submission_unknown";

  async function copy(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      studio.setError("Copy wasn't available. Select the text and copy it manually.");
    }
  }

  async function submitPrompt(output: StudioOutput) {
    if (!prompt.trim()) return;
    const success = await studio.send({
      text:
        output === "prompt"
          ? "Save this edited prompt."
          : `Create ${output === "image" ? "an image" : "a video"} using this exact prompt.`,
      settings: {
        ...studio.settings,
        output,
        format: defaultStudioFormat(studio.settings.platform, output),
      },
      promptOverride: prompt,
    });
    if (success) setDrawer(null);
  }

  function media(large = false) {
    if (!version || !result) return null;
    if (version.output === "prompt")
      return (
        <div className="mx-auto w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <span className="mb-4 inline-flex items-center gap-2 text-xs font-medium text-violet-600">
            <FileText className="h-4 w-4" />
            Your creative prompt
          </span>
          <h3 className="font-sans mb-4 text-lg font-semibold leading-7 text-slate-800">
            {result.direction || "Ready for your next creation"}
          </h3>
          <p className="whitespace-pre-wrap text-sm leading-7 text-slate-600">{result.prompt}</p>
        </div>
      );
    if (!assetId)
      return (
        <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
          The preview is being prepared. Your prompt is saved.
        </div>
      );
    if (version.output === "video")
      return (
        <video
          key={assetId}
          src={studioAssetUrl(assetId)}
          controls
          playsInline
          preload="metadata"
          className={`${large ? "max-h-[80dvh]" : "max-h-[540px]"} max-w-full rounded-xl bg-slate-950 shadow-sm`}
        >
          <track kind="captions" />
        </video>
      );
    return (
      <img
        src={studioAssetUrl(assetId)}
        alt={result.direction || "Generated social creative"}
        className={`${large ? "max-h-[80dvh]" : "max-h-[540px]"} max-w-full rounded-xl object-contain shadow-sm`}
      />
    );
  }

  return (
    <section
      className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-[#f4f5f8]"
      aria-label="Creation preview"
    >
      <div className="flex min-h-16 flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 bg-white px-4 py-2 sm:px-5">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <span
            className={`h-2 w-2 rounded-full ${activeVersion ? "animate-pulse bg-violet-500" : version ? "bg-emerald-500" : "bg-slate-300"}`}
          />
          {version ? `${outputNames[version.output]} preview` : "Your canvas"}
          {version && (
            <span className="ml-1 text-xs font-normal text-slate-400">
              {platformNames[version.input.settings.platform]}
            </span>
          )}
        </div>
        {version && (
          <button
            type="button"
            className={buttonClass}
            onClick={() => setDrawer("details")}
            aria-label="Open generation details"
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="hidden sm:inline">Details</span>
          </button>
        )}
      </div>
      {assetId && version?.status === "ready" && version.output !== "prompt" && (
        <div
          className="flex gap-1 border-b border-slate-200 bg-white px-4 pb-3 sm:px-5"
          role="group"
          aria-label="Preview mode"
        >
          <button
            type="button"
            className={`${buttonClass} ${previewMode === "media" ? "bg-slate-100 text-slate-950" : ""}`}
            aria-pressed={previewMode === "media"}
            onClick={() => setPreviewMode("media")}
          >
            <OutputGlyph output={version.output} />
            Media
          </button>
          <button
            type="button"
            className={`${buttonClass} ${previewMode === "post" ? "bg-violet-50 text-violet-700" : "text-violet-700"}`}
            aria-pressed={previewMode === "post"}
            onClick={() => setPreviewMode("post")}
          >
            <Eye className="h-4 w-4" />
            Preview post
          </button>
        </div>
      )}
      {(activeVersion || studio.sending) && (
        <div
          role="status"
          className="flex items-center gap-3 border-b border-violet-100 bg-violet-50 px-5 py-3 text-sm text-violet-700"
        >
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
          <span>
            {activeVersion ? STUDIO_STATUS_LABELS[activeVersion.status] : "Getting started"}…
            <span className="ml-1 text-violet-500">
              {version ? "Your previous version is below." : "You can leave and come back."}
            </span>
          </span>
        </div>
      )}
      {failed && (
        <div role="alert" className="border-b border-amber-200 bg-amber-50 px-5 py-4">
          <p className="text-sm font-semibold text-amber-900">
            {selectedVersion?.status === "submission_unknown"
              ? "Generation needs a status check"
              : "This version couldn't be completed"}
          </p>
          <p className="mt-1 text-sm leading-6 text-amber-800">
            {selectedVersion?.error || "Your earlier work and idea are safe. You can try again."}
          </p>
          {selectedVersion?.status === "failed" && (
            <button
              type="button"
              className={`${buttonClass} mt-2 text-amber-900`}
              disabled={isBusy}
              onClick={() => {
                if (selectedVersion.result?.rawAssetId || selectedVersion.provider.interactionId) {
                  void studio.retryFinishing(selectedVersion.id);
                } else if (selectedVersion.input.promptOverride) {
                  setPrompt(selectedVersion.input.promptOverride);
                  setDrawer("prompt");
                } else {
                  studio.reviseFailedVersion(selectedVersion);
                  onRefine?.();
                }
              }}
            >
              {selectedVersion.result?.rawAssetId || selectedVersion.provider.interactionId
                ? "Retry finishing"
                : selectedVersion.input.promptOverride
                  ? "Revise prompt"
                  : "Revise and try again"}
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
      {version ? (
        <div className="flex min-h-[320px] flex-1 items-center justify-center overflow-auto p-5 sm:min-h-[480px] sm:p-8">
          {previewMode === "post" && assetId && version.output !== "prompt" ? (
            <StudioPostPreview key={version.id} version={version} />
          ) : media()}
        </div>
      ) : (
        <EmptyPreview />
      )}
      {version && (
        <div className="border-t border-slate-200 bg-white px-3 py-3 sm:px-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1">
              <button type="button" className={buttonClass} onClick={() => setDrawer("prompt")}>
                <PencilLine className="h-4 w-4" />
                Prompt
              </button>
              {result?.caption && (
                <button
                  type="button"
                  className={buttonClass}
                  onClick={() => {
                    void copy(result.caption, "quick-caption");
                  }}
                >
                  {copied === "quick-caption" ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <MessageSquare className="h-4 w-4" />
                  )}
                  {copied === "quick-caption" ? "Copied" : "Copy caption"}
                </button>
              )}
              <button
                type="button"
                className={buttonClass}
                onClick={() => {
                  setAdaptPlatform(
                    studio.settings.platform === "facebook" ? "instagram" : "facebook",
                  );
                  setDrawer("adapt");
                }}
                disabled={isBusy}
              >
                <Layers2 className="h-4 w-4" />
                Adapt
              </button>
              {assetId && (
                <button
                  type="button"
                  className={buttonClass}
                  onClick={() => setExpanded(true)}
                  ref={expandButton}
                  aria-label="Expand preview"
                >
                  <Maximize2 className="h-4 w-4" />
                </button>
              )}
            </div>
            {assetId ? (
              <a className={primaryClass} href={studioAssetUrl(assetId, true)} download>
                <ArrowDownToLine className="h-4 w-4" />
                Download
              </a>
            ) : (
              <button
                type="button"
                className={primaryClass}
                onClick={() => {
                  void copy(sourcePrompt, "main");
                }}
              >
                {copied === "main" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied === "main" ? "Copied" : "Copy prompt"}
              </button>
            )}
          </div>
        </div>
      )}
      {Boolean(studio.conversation?.versions.length) && (
        <div className="border-t border-slate-200 bg-white px-4 py-3">
          <div className="mb-2 text-xs font-medium text-slate-400">Versions</div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {studio.conversation?.versions.map((item, index) => (
              <button
                type="button"
                key={item.id}
                onClick={() => {
                  void studio.selectVersion(item.id);
                }}
                aria-pressed={selectedVersion?.id === item.id}
                className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg border px-3 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${selectedVersion?.id === item.id ? "border-violet-300 bg-violet-50 text-violet-700" : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"}`}
              >
                {item.output === "image" && item.result?.assetId ? (
                  <img
                    src={studioAssetUrl(item.result.assetId)}
                    alt=""
                    className="h-8 w-8 rounded object-cover"
                    loading="lazy"
                  />
                ) : (
                  <OutputGlyph output={item.output} />
                )}
                v{index + 1}
                {item.status === "ready" ? (
                  <Check className="h-3 w-3 text-emerald-500" />
                ) : item.status === "failed" ? (
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                ) : null}
              </button>
            ))}
          </div>
        </div>
      )}
      <StudioDrawer
        open={drawer === "prompt"}
        onOpenChange={(open) => {
          if (!open) setDrawer(null);
        }}
        title="Creative prompt"
        description="Make it your own. Save a new prompt version, or use these exact words to create an image or video."
      >
        <label className="sr-only" htmlFor="studio-prompt">
          Edit creative prompt
        </label>
        <textarea
          id="studio-prompt"
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          rows={16}
          maxLength={16000}
          className={`${fieldClass} min-h-72 resize-y leading-7`}
        />
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className={buttonClass}
            onClick={() => {
              void copy(prompt, "prompt");
            }}
          >
            {copied === "prompt" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}Copy
          </button>
          <button
            type="button"
            className={buttonClass}
            onClick={() => {
              void submitPrompt("prompt");
            }}
            disabled={isBusy || !prompt.trim()}
          >
            <CheckCheck className="h-4 w-4" />
            Save prompt
          </button>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            className={primaryClass}
            disabled={isBusy || !prompt.trim()}
            onClick={() => {
              void submitPrompt("image");
            }}
          >
            <ImageIcon className="h-4 w-4" />
            Create image
          </button>
          <button
            type="button"
            className={primaryClass}
            disabled={isBusy || !prompt.trim()}
            onClick={() => {
              void submitPrompt("video");
            }}
          >
            <Clapperboard className="h-4 w-4" />
            Create video
          </button>
        </div>
      </StudioDrawer>
      <StudioDrawer
        open={drawer === "caption"}
        onOpenChange={(open) => {
          if (!open) setDrawer(null);
        }}
        title="Post caption"
        description="Copy this caption to use alongside your creation. Ask for a different tone in the conversation."
      >
        <p className="whitespace-pre-wrap rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm leading-7 text-slate-700">
          {result?.caption}
        </p>
        <button
          type="button"
          className={`${primaryClass} mt-5`}
          onClick={() => {
            void copy(result?.caption || "", "caption");
          }}
        >
          {copied === "caption" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied === "caption" ? "Copied" : "Copy caption"}
        </button>
      </StudioDrawer>
      <StudioDrawer
        open={drawer === "adapt"}
        onOpenChange={(open) => {
          if (!open) setDrawer(null);
        }}
        title="Make it work elsewhere"
        description="Keep the idea and create a new version for another platform."
      >
        <label className="block space-y-2 text-sm font-medium text-slate-700">
          Platform
          <select
            className={fieldClass}
            value={adaptPlatform}
            onChange={(event) => setAdaptPlatform(event.target.value as StudioPlatform)}
          >
            {STUDIO_PLATFORMS.map((platform) => (
              <option key={platform} value={platform}>
                {platformNames[platform]}
              </option>
            ))}
          </select>
        </label>
        <p className="mt-4 text-sm leading-6 text-slate-500">
          The composition and copy will be adapted for {platformNames[adaptPlatform]}. Your existing
          version stays in your history.
        </p>
        <button
          type="button"
          className={`${primaryClass} mt-6`}
          disabled={isBusy}
          onClick={async () => {
            const output = version?.output || studio.settings.output;
            const success = await studio.send({
              text: `Adapt this creation for ${platformNames[adaptPlatform]}, keeping the central idea.`,
              settings: {
                ...studio.settings,
                output,
                platform: adaptPlatform,
                format: defaultStudioFormat(adaptPlatform, output),
              },
            });
            if (success) setDrawer(null);
          }}
        >
          Create {platformNames[adaptPlatform]} version
          <ArrowRight className="h-4 w-4" />
        </button>
      </StudioDrawer>
      <StudioDrawer
        open={drawer === "details"}
        onOpenChange={(open) => {
          if (!open) setDrawer(null);
        }}
        title="Generation details"
        description="The creative direction and settings behind this version."
      >
        {version && <VersionDetails version={version} />}
      </StudioDrawer>
      <Dialog.Root open={expanded} onOpenChange={setExpanded}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[90] bg-slate-950/90" />
          <Dialog.Content
            className={`${styles.studio} fixed inset-4 z-[91] flex items-center justify-center outline-none sm:inset-10`}
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              expandButton.current?.focus();
            }}
          >
            <Dialog.Title className="sr-only">Expanded creation preview</Dialog.Title>
            <Dialog.Description className="sr-only">
              A larger preview of your generated creation.
            </Dialog.Description>
            {previewMode === "post" && version && assetId && version.output !== "prompt" ? (
              <div className="max-h-full w-full max-w-xl overflow-y-auto rounded-2xl bg-slate-50 p-5 sm:p-8">
                <StudioPostPreview key={version.id} version={version} />
              </div>
            ) : media(true)}
            <Dialog.Close
              className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
              aria-label="Close expanded preview"
            >
              <X className="h-5 w-5" />
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </section>
  );
}

function VersionDetails({ version }: { version: StudioVersion }) {
  return (
    <div className="space-y-6">
      <dl className="space-y-4">
        {[
          ["Status", STUDIO_STATUS_LABELS[version.status]],
          ["Platform", platformNames[version.input.settings.platform]],
          ["Format", version.input.settings.format],
          ["Created", new Date(version.createdAt).toLocaleString()],
        ].map(([label, value]) => (
          <div
            key={label}
            className="flex items-baseline justify-between gap-4 border-b border-slate-100 pb-3 text-sm"
          >
            <dt className="text-slate-500">{label}</dt>
            <dd className="text-right font-medium text-slate-800">{value}</dd>
          </div>
        ))}
      </dl>
      {version.result?.direction && (
        <div>
          <h3 className="font-sans mb-2 text-sm font-semibold text-slate-800">
            Creative direction
          </h3>
          <p className="text-sm leading-7 text-slate-500">{version.result.direction}</p>
        </div>
      )}
      <details className="rounded-xl border border-slate-200 p-4">
        <summary className="flex min-h-7 cursor-pointer items-center justify-between text-sm font-medium text-slate-600">
          Technical details
          <ChevronDown className="h-4 w-4" />
        </summary>
        <pre className="mt-4 overflow-x-auto whitespace-pre-wrap break-all text-xs leading-6 text-slate-500">
          {JSON.stringify(
            {
              versionId: version.id,
              parentVersionId: version.parentVersionId,
              provider: version.provider,
              error: version.error,
            },
            null,
            2,
          )}
        </pre>
      </details>
    </div>
  );
}
