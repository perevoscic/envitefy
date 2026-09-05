"use client";

import { useState } from "react";
import { studioAssetUrl, type StudioVersion } from "@/lib/admin/marketing-studio/types";

const platformLabels = {
  instagram: "Instagram",
  facebook: "Facebook",
  youtube: "YouTube",
  reddit: "Reddit",
};

/** A review of saved output and copy; changing the preview never creates a new version. */
export function StudioPostPreview({ version }: { version: StudioVersion }) {
  const [fullCaption, setFullCaption] = useState(false);
  const { result } = version;
  if (!result?.assetId || version.output === "prompt") return null;
  const platform = version.input.settings.platform;
  const captionFirst = platform === "facebook" || platform === "reddit";
  const showHeadline = platform === "youtube" || platform === "reddit";
  const caption = result.caption || "";
  const longCaption = caption.length > 240;
  const captionContent = caption ? (
    <div className="px-4 py-3 text-sm leading-6 text-slate-800">
      <p className="whitespace-pre-wrap break-words">
        {fullCaption || !longCaption ? caption : `${caption.slice(0, 240).trimEnd()}…`}
      </p>
      {longCaption && (
        <button
          type="button"
          onClick={() => setFullCaption((value) => !value)}
          aria-expanded={fullCaption}
          className="mt-1 min-h-11 text-sm font-medium text-violet-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
        >
          {fullCaption ? "Show less" : "Read full caption"}
        </button>
      )}
    </div>
  ) : (
    <p className="px-4 py-3 text-sm text-slate-500">This version has no caption yet.</p>
  );

  return (
    <section
      className="mx-auto w-full max-w-[460px]"
      aria-label={`${platformLabels[platform]} post preview`}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="font-medium text-slate-700">{platformLabels[platform]} post preview</span>
        <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-600">
          Draft preview
        </span>
      </div>
      <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <header className="flex items-center gap-3 px-4 py-3">
          <img
            src="/icons/icon-96.png"
            alt=""
            className="h-10 w-10 rounded-full border border-slate-100"
          />
          <div>
            <p className="text-sm font-semibold text-slate-900">Envitefy</p>
            <p className="text-xs text-slate-500">{platformLabels[platform]}</p>
          </div>
        </header>
        {showHeadline && result.headline && (
          <h3 className="px-4 pb-2 text-base font-semibold leading-6 text-slate-900">
            {result.headline}
          </h3>
        )}
        {captionFirst && captionContent}
        <div className="flex justify-center bg-slate-950">
          {version.output === "video" ? (
            <video
              key={result.assetId}
              src={studioAssetUrl(result.assetId)}
              aria-label="Generated video post preview"
              controls
              playsInline
              preload="metadata"
              className="max-h-[460px] w-full object-contain"
            >
              <track kind="captions" />
            </video>
          ) : (
            <img
              src={studioAssetUrl(result.assetId)}
              alt={result.direction || "Generated social post"}
              className="max-h-[460px] w-full object-contain"
            />
          )}
        </div>
        {!captionFirst && captionContent}
      </article>
      <p className="mt-3 text-sm leading-5 text-slate-500">
        Review your media and caption before publishing. Layout may vary in the app.
      </p>
    </section>
  );
}
