"use client";

import { Expand, Shrink } from "lucide-react";
import type { HeroImageSettings } from "@/lib/hero-image-settings";

export default function HeroImageAdjustments({
  settings,
  onChange,
}: {
  settings: HeroImageSettings;
  onChange: (settings: HeroImageSettings) => void;
}) {
  const fitLabel = settings.fit === "contain" ? "Fill image frame" : "Show full image";
  const FitIcon = settings.fit === "contain" ? Shrink : Expand;
  const buttonClass =
    "inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-violet-200 bg-white text-violet-800 shadow-md hover:bg-violet-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700 aria-pressed:border-violet-600 aria-pressed:bg-violet-100";
  return (
    <button
      type="button"
      aria-label={fitLabel}
      title={fitLabel}
      aria-pressed={settings.fit === "contain"}
      onClick={() =>
        onChange({ ...settings, fit: settings.fit === "contain" ? "cover" : "contain" })
      }
      className={buttonClass}
    >
      <FitIcon size={18} aria-hidden="true" />
    </button>
  );
}
