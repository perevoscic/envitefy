"use client";

import { RefreshCw, WandSparkles } from "lucide-react";

export default function StudioError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8f5ef] px-6 py-16 text-[#1f1a17]">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-[2.5rem] border border-[#e9dfd4] bg-white p-8 shadow-[0_30px_80px_rgba(60,38,20,0.12)] sm:p-10">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#7c3aed] via-[#f59e0b] to-[#ef4444]" />
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#f3e8ff] text-[#7c3aed]">
            <WandSparkles className="h-7 w-7" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#7c3aed]">
              Studio crashed
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
              The workspace hit an unexpected error.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-[#6a5b51]">
              Reload the studio to clear the current render state and try again. If this keeps
              happening, the current session data may need a clean start.
            </p>
            <p className="mt-4 break-words rounded-2xl bg-[#faf7f3] px-4 py-3 text-xs leading-5 text-[#7a695d]">
              {error.message || "Unknown studio error."}
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              reset();
              window.location.reload();
            }}
            className="inline-flex items-center gap-2 rounded-full bg-[#7c3aed] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_40px_rgba(124,58,237,0.25)] transition hover:bg-[#6d28d9]"
          >
            <RefreshCw className="h-4 w-4" />
            Reload
          </button>
        </div>
      </div>
    </div>
  );
}
