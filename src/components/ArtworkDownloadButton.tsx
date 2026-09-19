"use client";

import { Download, Loader2 } from "lucide-react";
import { useState } from "react";
import { downloadArtwork } from "@/lib/download-artwork";

export default function ArtworkDownloadButton({ imageUrl, title, className = "" }: { imageUrl: string; title: string; className?: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  return <div className={className}>
    <button type="button" disabled={pending || !imageUrl} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-900 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700 disabled:opacity-60" onClick={async () => {
      setPending(true); setError("");
      try { await downloadArtwork(imageUrl, title); }
      catch (cause) { setError(cause instanceof Error ? cause.message : "The artwork could not be downloaded."); }
      finally { setPending(false); }
    }}>
      {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Download className="size-4" aria-hidden="true" />}
      {pending ? "Downloading…" : "Download artwork"}
    </button>
    {error ? <p role="alert" className="mt-2 text-sm text-rose-700">{error}</p> : null}
  </div>;
}
