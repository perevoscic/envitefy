"use client";

import {
  ArrowUp,
  Check,
  ChevronDown,
  Loader2,
  Paperclip,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useRef, type RefObject } from "react";
import {
  STUDIO_PLATFORMS,
  studioAssetUrl,
  type StudioOutput,
  type StudioPlatform,
} from "@/lib/admin/marketing-studio/types";
import {
  buttonClass,
  OutputGlyph,
  outputNames,
  platformNames,
  primaryClass,
} from "./studio-components";
import type { ContentStudio } from "./use-content-studio";

export function StudioComposer({
  studio,
  composerRef,
  onSubmit,
  onSettingsOpen,
}: {
  studio: ContentStudio;
  composerRef: RefObject<HTMLTextAreaElement | null>;
  onSubmit: () => Promise<void>;
  onSettingsOpen: () => void;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const busy = Boolean(studio.sending || studio.activeVersion || studio.uploading);
  const hasHistory = Boolean(studio.conversation?.messages.length);
  const references =
    studio.conversation?.attachments.filter((asset) =>
      studio.referenceAssetIds.includes(asset.id),
    ) || [];
  const outputLabel =
    studio.settings.output === "prompt" ? "Draft prompt" : `Create ${studio.settings.output}`;
  async function attach(files: File[]) {
    if (studio.referenceAssetIds.length + files.length > 8) {
      studio.setError("You can attach up to 8 reference images to a creation.");
      return;
    }
    if (files.some((file) => !["image/png", "image/jpeg", "image/webp"].includes(file.type))) {
      studio.setError("Choose PNG, JPG, or WebP reference images.");
      return;
    }
    if (files.some((file) => file.size > 25 * 1024 * 1024)) {
      studio.setError("Each reference image can be up to 25 MB.");
      return;
    }
    await studio.upload(files);
  }

  return (
    <>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void onSubmit();
        }}
        className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_5px_20px_rgba(15,23,42,0.035)] focus-within:border-violet-300 focus-within:shadow-[0_0_0_3px_rgba(139,92,246,0.06)]"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-3 py-3">
          <div className="flex gap-1" role="group" aria-label="Content output">
            {(["image", "video", "prompt"] as StudioOutput[]).map((output) => (
              <button
                type="button"
                key={output}
                onClick={() => studio.changeSettings({ output })}
                aria-pressed={studio.settings.output === output}
                className={`inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${studio.settings.output === output ? "bg-violet-50 text-violet-700" : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"}`}
              >
                <OutputGlyph output={output} />
                {outputNames[output]}
              </button>
            ))}
          </div>
          <label className="relative min-w-0">
            <span className="sr-only">Social platform</span>
            <select
              aria-label="Social platform"
              value={studio.settings.platform}
              onChange={(event) =>
                studio.changeSettings({ platform: event.target.value as StudioPlatform })
              }
              className="min-h-10 max-w-full cursor-pointer appearance-none rounded-lg border-0 bg-slate-50 py-2 pl-3 pr-7 text-xs font-medium text-slate-600 outline-none focus:ring-2 focus:ring-violet-400"
            >
              {STUDIO_PLATFORMS.map((platform) => (
                <option key={platform} value={platform}>
                  {platformNames[platform]}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-3.5 h-3 w-3 text-slate-400" />
          </label>
        </div>
        <label htmlFor="studio-idea" className="sr-only">
          {hasHistory
            ? "How would you like to refine your creation?"
            : "What would you like to create?"}
        </label>
        <textarea
          ref={composerRef}
          id="studio-idea"
          value={studio.draft}
          onChange={(event) => studio.setDraft(event.target.value)}
          placeholder={
            hasHistory
              ? "What would you change? Try a new direction, adjust the mood, or tell me what's missing…"
              : "An Instagram post showing how one event link can replace all those group chat messages…"
          }
          rows={hasHistory ? 4 : 6}
          maxLength={4_000}
          className="block min-h-36 w-full resize-y border-0 bg-transparent px-5 py-4 text-[15px] leading-7 text-slate-800 outline-none placeholder:text-slate-400"
          onKeyDown={(event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
              event.preventDefault();
              if (!busy) void onSubmit();
            }
          }}
        />
        {references.length > 0 && (
          <div
            className="flex flex-wrap gap-2 px-4 pb-3"
            aria-label="Reference images"
            role="group"
          >
            {references.map((asset) => (
              <div
                key={asset.id}
                className="relative flex h-16 w-16 items-center justify-center rounded-lg border border-slate-200 bg-slate-50"
              >
                <img
                  src={asset.url || studioAssetUrl(asset.id)}
                  alt={asset.name}
                  className="h-full w-full rounded-lg object-cover"
                />
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    studio.setReferenceAssetIds((current) =>
                      current.filter((id) => id !== asset.id),
                    )
                  }
                  className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                  aria-label={`Remove reference ${asset.name}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 pb-3">
          <div className="flex items-center gap-0.5">
            <input
              ref={fileInput}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              className="hidden"
              aria-label="Choose reference images"
              onChange={(event) => {
                const files = Array.from(event.target.files || []);
                event.target.value = "";
                void attach(files);
              }}
            />
            <button
              type="button"
              className={buttonClass}
              onClick={() => fileInput.current?.click()}
              disabled={busy || studio.referenceAssetIds.length >= 8}
              aria-label="Attach reference images"
              title="Attach up to 8 PNG, JPG, or WebP images"
            >
              {studio.uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Paperclip className="h-4 w-4" />
              )}
            </button>
            <button
              type="button"
              className={buttonClass}
              onClick={() => onSettingsOpen()}
              aria-label="Open creative settings"
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span className="hidden sm:inline lg:hidden xl:inline text-xs">Settings</span>
            </button>
          </div>
          <button type="submit" disabled={!studio.draft.trim() || busy} className={primaryClass}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
            {studio.sending ? "Starting…" : studio.activeVersion ? "Creating…" : outputLabel}
          </button>
        </div>
      </form>
      <div className="mt-3 flex items-center justify-between gap-2 px-1 text-[11px] text-slate-400">
        <span className="flex items-center gap-1.5" role="status">
          {studio.saveState === "local" ? (
            "Saved on this device · reconnect to sync"
          ) : studio.saveState === "saving" && studio.draft.trim() ? (
            "Saving idea…"
          ) : (
            <>
              <Check className="h-3 w-3" />
              {studio.conversation ? "Saved to your library" : "Your ideas save as you go"}
            </>
          )}
        </span>
        <span>
          {studio.settings.format === "square"
            ? "1:1"
            : studio.settings.format === "vertical"
              ? "9:16"
              : "16:9"}{" "}
          · {platformNames[studio.settings.platform]}
        </span>
      </div>
      {studio.error && (
        <div role="alert" className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm leading-6 text-amber-900">{studio.error}</p>
            <button
              type="button"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-amber-700 hover:bg-amber-100"
              onClick={() => studio.setError(null)}
              aria-label="Dismiss message"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
