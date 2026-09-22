"use client";

import { Download, Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import { downloadArtwork } from "@/lib/download-artwork";
import type { CardTextSource } from "@/lib/shared-card-design";
import { composeSharedCard } from "@/lib/shared-card-canvas";

export default function ArtworkDownloadButton({
  imageUrl,
  title,
  invitationData,
  beforeDownload,
  className = "",
}: {
  imageUrl: string;
  title: string;
  invitationData?: CardTextSource | null;
  beforeDownload?: () => Promise<boolean>;
  className?: string;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const latestData = useRef(invitationData);
  latestData.current = invitationData;
  return (
    <div className={className}>
      <button
        type="button"
        disabled={pending || !imageUrl}
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-900 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700 disabled:opacity-60"
        onClick={async () => {
          setPending(true);
          setError("");
          try {
            if (beforeDownload && !(await beforeDownload())) return;
            const current = latestData.current;
            await downloadArtwork(
              current?.sharedDesign ? await composeSharedCard(current, "digital_flyer") : imageUrl,
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
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <Download className="size-4" aria-hidden="true" />
        )}
        {pending
          ? "Downloading…"
          : invitationData?.sharedDesign
            ? "Download invitation"
            : "Download artwork"}
      </button>
      {error ? (
        <p role="alert" className="mt-2 text-sm text-rose-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
