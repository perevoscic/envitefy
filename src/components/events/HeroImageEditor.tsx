"use client";

import { ImagePlus, RotateCcw } from "lucide-react";
import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { HeroImageSettings } from "@/lib/hero-image-settings";
import { useEventEditorImageControls } from "./EventEditorImageControlsContext";
import { useEventPageReadOnly } from "./EventPageReadOnlyContext";
import HeroImageAdjustments from "./HeroImageAdjustments";
import ImageUploadDropzone from "./ImageUploadDropzone";

type Props = {
  value?: string | null;
  className?: string;
  label?: string;
  onChange: (value: string) => void;
  prepareImage?: (value: string) => Promise<string>;
  onBusyChange?: (busy: boolean) => void;
  settings?: HeroImageSettings;
  onSettingsChange?: (settings: HeroImageSettings) => void;
};

export function useHeroImagePicker(
  onChange: Props["onChange"],
  options: Pick<Props, "prepareImage" | "onBusyChange"> = {},
) {
  const input = useRef<HTMLInputElement>(null);
  const selecting = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const choose = async (file: File) => {
    if (selecting.current) return;
    selecting.current = true;
    setBusy(true);
    options.onBusyChange?.(true);
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
        img.onerror = () => reject(new Error("This image could not be decoded. Choose another file."));
        img.src = dataUrl;
      });
      const prepared = options.prepareImage ? await options.prepareImage(dataUrl) : dataUrl;
      onChange(prepared);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to open this image.");
    } finally {
      selecting.current = false;
      setBusy(false);
      options.onBusyChange?.(false);
    }
  };

  return {
    busy,
    error,
    clearError: () => setError(""),
    choose,
    open: () => {
      if (!selecting.current) input.current?.click();
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
          await choose(file);
        }}
      />
    ),
  };
}

/** Stores a local image in editor memory. The existing explicit save persists it. */
export default function HeroImageEditor({
  value,
  onChange,
  prepareImage,
  onBusyChange,
  className = "",
  label = "Change image",
  settings,
  onSettingsChange,
}: Props) {
  const picker = useHeroImagePicker(onChange, { prepareImage, onBusyChange });
  const readOnly = useEventPageReadOnly();
  const mobileControls = useEventEditorImageControls();
  const mobileTarget = label === "Change" || label === "Change image" ? mobileControls : null;
  const dropzone = label === "Upload image" || Boolean(mobileTarget);
  if (readOnly) return null;
  const controls = (
    <div className={`${mobileTarget ? "" : className} ${dropzone ? "w-full min-w-0" : ""}`} data-hero-image-control>
      {dropzone && <h3 className="mb-3 font-sans text-sm font-semibold">Change main image</h3>}
      <div className="flex flex-wrap items-center gap-2">
        {dropzone ? <ImageUploadDropzone label={label === "Change" || label === "Change image" ? "Change hero image" : label}
          busy={picker.busy} value={value} onBrowse={picker.open} onFile={picker.choose} /> : <button
          type="button"
          disabled={picker.busy}
          onClick={picker.open}
          aria-label={label === "Change" || label === "Change image" ? "Change hero image" : label}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-violet-200 bg-white px-4 py-2 font-sans text-sm font-semibold text-violet-800 shadow-md hover:bg-violet-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700 disabled:opacity-60"
        >
          <ImagePlus size={18} aria-hidden="true" />
          {picker.busy ? "Preparing image…" : label}
        </button>}
        {settings && onSettingsChange ? (
          <HeroImageAdjustments settings={settings} onChange={onSettingsChange} />
        ) : null}
        {value ? (
          <div className={dropzone ? "flex w-full justify-center" : "contents"}>
          <button
            type="button"
            disabled={picker.busy}
            onClick={() => {
              picker.clearError();
              onChange("");
            }}
            aria-label="Reset image"
            title="Use template image"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-violet-200 bg-white px-4 py-2 font-sans text-sm font-semibold text-violet-800 shadow-md hover:bg-violet-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700"
          >
            <RotateCcw size={16} aria-hidden="true" />
            Reset image
          </button>
          </div>
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
  return mobileTarget ? createPortal(controls, mobileTarget) : controls;
}
