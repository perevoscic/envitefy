"use client";

import { Download, Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import { downloadArtwork } from "@/lib/download-artwork";
import type { CardTextSource } from "@/lib/shared-card-design";
import { composeSharedCard } from "@/lib/shared-card-canvas";
import chromeStyles from "./studio/LiveCardChromeButton.module.css";

export default function ArtworkDownloadButton({
  imageUrl,
  title,
  invitationData,
  beforeDownload,
  variant = "button",
  className = "",
}: {
  imageUrl: string;
  title: string;
  invitationData?: CardTextSource | null;
  beforeDownload?: () => Promise<boolean>;
  variant?: "button" | "icon";
  className?: string;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const latestData = useRef(invitationData);
  latestData.current = invitationData;
  const label = invitationData?.sharedDesign ? "Download invitation" : "Download artwork";
  return (
    <div className={className}>
      <button
        type="button"
        disabled={pending || !imageUrl}
        aria-label={label}
        aria-busy={pending}
        title={variant === "icon" ? label : undefined}
        className={variant === "icon"
          ? `${chromeStyles.glass} inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full border focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-60`
          : "inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-900 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700 disabled:opacity-60"}
        onClick={async () => {
          setPending(true);
          setError("");
          try {
            if (beforeDownload && !(await beforeDownload())) return;
            const current = latestData.current;
            await downloadArtwork(
              current?.sharedDesign ? await composeSharedCard(current, "digital_flyer", "image/jpeg") : imageUrl,
              current?.title || title,
            );
          } catch (cause) {
            setError(
              cause instanceof Error ? cause.message : "The artwork could not be downloaded.",
            );
          } finally {
            setPending(false);
          }
        }}
      >
        {pending ? (
          <Loader2 className={variant === "icon" ? "size-5 animate-spin" : "size-4 animate-spin"} aria-hidden="true" />
        ) : (
          <Download className={variant === "icon" ? "size-5" : "size-4"} aria-hidden="true" />
        )}
        <span className={variant === "icon" ? "sr-only" : undefined}>{pending ? "Downloading…" : label}</span>
      </button>
      {error ? (
        <p role="alert" className={variant === "icon" ? "absolute right-0 top-full mt-2 w-48 max-w-[calc(100vw-3rem)] rounded-xl bg-white p-3 text-sm text-rose-700 shadow-lg" : "mt-2 text-sm text-rose-700"}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
