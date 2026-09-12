"use client";

import { ImagePlus, RotateCcw } from "lucide-react";
import { useRef, useState } from "react";
import type { HeroImageSettings } from "@/lib/hero-image-settings";
import HeroImageAdjustments from "./HeroImageAdjustments";

type Props = {
  value?: string | null;
  className?: string;
  label?: string;
  onChange: (value: string) => void;
  settings?: HeroImageSettings;
  onSettingsChange?: (settings: HeroImageSettings) => void;
  filterEnabled?: boolean;
  onFilterChange?: (enabled: boolean) => void;
};

export function useHeroImagePicker(onChange: Props["onChange"]) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  return {
    busy,
    error,
    clearError: () => setError(""),
    open: () => {
      if (!busy) input.current?.click();
    },
    input: (
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        hidden
        tabIndex={-1}
        disabled={busy}
        aria-label="Choose hero image"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (!file) return;
          setBusy(true);
          setError("");
          try {
            if (!/^image\/(jpeg|png|webp|avif)$/.test(file.type) || file.size > 20 * 1024 * 1024) {
              throw new Error("Choose a JPG, PNG, WebP, or AVIF image under 20 MB.");
            }
            const reader = new FileReader();
            const dataUrl = await new Promise<string>((resolve, reject) => {
              reader.onload = () =>
                typeof reader.result === "string"
                  ? resolve(reader.result)
                  : reject(new Error("Unable to read image."));
              reader.onerror = () => reject(new Error("Unable to read image."));
              reader.readAsDataURL(file);
            });
            await new Promise<void>((resolve, reject) => {
              const img = new window.Image();
              img.onload = () => resolve();
              img.onerror = () =>
                reject(new Error("This image could not be decoded. Choose another file."));
              img.src = dataUrl;
            });
            onChange(dataUrl);
          } catch (reason) {
            setError(reason instanceof Error ? reason.message : "Unable to open this image.");
          } finally {
            setBusy(false);
          }
        }}
      />
    ),
  };
}

/** Stores a local image in editor memory. The existing explicit save persists it. */
export default function HeroImageEditor({
  value,
  onChange,
  className = "",
  label = "Change",
  settings,
  onSettingsChange,
  filterEnabled = true,
  onFilterChange,
}: Props) {
  const picker = useHeroImagePicker(onChange);
  return (
    <div className={className} data-hero-image-control>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={picker.busy}
          onClick={picker.open}
          aria-label={label === "Change" || label === "Change image" ? "Change hero image" : label}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-violet-200 bg-white px-4 py-2 font-sans text-sm font-semibold text-violet-800 shadow-md hover:bg-violet-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700 disabled:opacity-60"
        >
          <ImagePlus size={18} aria-hidden="true" />
          {picker.busy ? "Preparing image…" : label}
        </button>
        {onFilterChange ? (
          <button
            type="button"
            role="switch"
            aria-label="Template image filter"
            aria-checked={filterEnabled}
            title={filterEnabled ? "Turn template filter off" : "Turn template filter on"}
            onClick={() => onFilterChange(!filterEnabled)}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-violet-200 bg-white px-3 py-2 font-sans text-sm font-semibold text-violet-800 shadow-md hover:bg-violet-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700"
          >
            <span aria-hidden="true" className={`size-3 rounded-full border border-current ${filterEnabled ? "bg-current" : ""}`} />
            {filterEnabled ? "Filter on" : "Filter off"}
          </button>
        ) : null}
        {settings && onSettingsChange ? (
          <HeroImageAdjustments settings={settings} onChange={onSettingsChange} />
        ) : null}
        {value ? (
          <button
            type="button"
            disabled={picker.busy}
            onClick={() => {
              picker.clearError();
              onChange("");
            }}
            aria-label="Use template image"
            title="Use template image"
            className="inline-flex size-11 items-center justify-center rounded-full border border-violet-200 bg-white text-violet-800 shadow-md hover:bg-violet-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700"
          >
            <RotateCcw size={16} aria-hidden="true" />
          </button>
        ) : null}
      </div>
      {picker.input}
      {picker.busy ? (
        <p role="status" className="sr-only">
          Preparing image
        </p>
      ) : null}
      {picker.error ? (
        <p
          role="alert"
          className="mt-2 max-w-sm rounded-lg bg-white px-3 py-2 font-sans text-sm text-red-700 shadow-md"
        >
          {picker.error}
        </p>
      ) : null}
    </div>
  );
}
