"use client";

import { useRouter } from "next/navigation";
import { createContext, type ReactNode, useContext, useEffect, useState } from "react";
import { normalizeScanArtwork, type ScanArtworkState } from "@/lib/ocr/scan-artwork-state";
import type { ScanHeroMode, ScanMediaPolicy, ScanOriginalDocument } from "@/lib/ocr/scan-media";
import OriginalDocumentCard from "./OriginalDocumentCard";

const ScanArtworkContext = createContext<ScanArtworkState | null>(null);
export const useScanArtwork = () => useContext(ScanArtworkContext);
const ScanMediaContext = createContext<{
  policy: ScanMediaPolicy | null;
  canManage: boolean;
  footerOriginal: ScanOriginalDocument | null;
} | null>(null);
export const useScanMedia = () => useContext(ScanMediaContext);

export function ScanOriginalDocumentSection({
  className = "relative z-10 mx-auto mt-8 w-full max-w-md",
}: { className?: string }) {
  const original = useScanMedia()?.footerOriginal;
  return original ? (
    <OriginalDocumentCard key={original.viewUrl} original={original} className={className} />
  ) : null;
}

export default function ScanArtworkProvider({
  eventId,
  initialArtwork,
  canManage,
  available = false,
  policy = null,
  original = null,
  originalPlacement = "after-content",
  children,
}: {
  eventId: string;
  initialArtwork: ScanArtworkState | null;
  canManage: boolean;
  available?: boolean;
  policy?: ScanMediaPolicy | null;
  original?: ScanOriginalDocument | null;
  originalPlacement?: "after-content" | "before-footer";
  children: ReactNode;
}) {
  const router = useRouter();
  const [artwork, setArtwork] = useState(initialArtwork);
  const [retrying, setRetrying] = useState(false);
  const [pollRound, setPollRound] = useState(0);
  const [stalled, setStalled] = useState(false);
  const active = artwork?.status === "pending" || artwork?.status === "generating";
  const failed = artwork?.status === "failed";
  useEffect(() => {
    setArtwork(initialArtwork);
  }, [initialArtwork]);
  useEffect(() => {
    if (!canManage || !failed) return;
    const controller = new AbortController();
    let refreshing = false;
    const refreshRecoveredArtwork = async () => {
      if (refreshing || document.visibilityState === "hidden") return;
      refreshing = true;
      try {
        const response = await fetch(`/api/events/${encodeURIComponent(eventId)}/scan-artwork`, {
          cache: "no-store",
          signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15_000)]),
        });
        if (!response.ok || controller.signal.aborted) return;
        const payload: { artwork?: unknown } = await response.json();
        const next = normalizeScanArtwork(payload.artwork);
        if (!next || next.status === "failed" || controller.signal.aborted) return;
        setArtwork(next);
        setStalled(false);
        if (next.status === "ready") router.refresh();
      } catch {
        // Keep the retry action available if a read-only status refresh fails.
      } finally {
        refreshing = false;
      }
    };
    void refreshRecoveredArtwork();
    window.addEventListener("focus", refreshRecoveredArtwork);
    document.addEventListener("visibilitychange", refreshRecoveredArtwork);
    return () => {
      controller.abort();
      window.removeEventListener("focus", refreshRecoveredArtwork);
      document.removeEventListener("visibilitychange", refreshRecoveredArtwork);
    };
  }, [eventId, canManage, failed, router]);
  useEffect(() => {
    if (!canManage || !active) return;
    const controller = new AbortController();
    const deadline = Date.now() + 335_000;
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      try {
        const response = await fetch(`/api/events/${encodeURIComponent(eventId)}/scan-artwork`, {
          cache: "no-store",
          signal: controller.signal,
        });
        if (response.status === 401 || response.status === 404) return;
        if (response.ok) {
          const payload: { artwork?: unknown } = await response.json();
          const next = normalizeScanArtwork(payload.artwork);
          if (next) setArtwork(next);
          if (next?.status === "ready" || next?.status === "failed") {
            router.refresh();
            return;
          }
        }
      } catch {
        if (controller.signal.aborted) return;
      }
      if (Date.now() >= deadline) {
        setStalled(true);
        return;
      }
      timer = setTimeout(poll, 4000);
    };
    timer = setTimeout(poll, 1500);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [eventId, canManage, active, pollRound, router]);

  async function retry() {
    setRetrying(true);
    try {
      const response = await fetch(`/api/events/${encodeURIComponent(eventId)}/scan-artwork`, {
        method: "POST",
        body: JSON.stringify({ heroMode: "generated" }),
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("Retry failed");
      const payload = await response.json();
      setArtwork(normalizeScanArtwork(payload.artwork) || { version: 1, status: "pending" });
      setStalled(false);
      setPollRound((round) => round + 1);
      router.refresh();
    } catch {
      setStalled(true);
    } finally {
      setRetrying(false);
    }
  }

  async function chooseHero(mode: ScanHeroMode) {
    setRetrying(true);
    try {
      const response = await fetch(`/api/events/${encodeURIComponent(eventId)}/scan-artwork`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ heroMode: mode }),
      });
      if (!response.ok) throw new Error("Could not change artwork");
      router.refresh();
    } catch {
      setStalled(true);
    } finally {
      setRetrying(false);
    }
  }

  return (
    <ScanArtworkContext.Provider value={artwork}>
      <ScanMediaContext.Provider value={{ policy, canManage, footerOriginal: originalPlacement === "before-footer" ? original : null }}>
        {canManage && available && !artwork && (
          <div className="relative z-20 flex justify-center bg-white px-4 py-2">
            <button
              type="button"
              onClick={retry}
              disabled={retrying}
              className="min-h-11 rounded-lg px-4 text-sm font-semibold text-teal-800 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:opacity-50"
            >
              {retrying ? "Creating artwork…" : "Generate event artwork"}
            </button>
            {stalled && (
              <span role="status" className="p-3 text-sm text-slate-700">
                Could not start the artwork. Please try again.
              </span>
            )}
          </div>
        )}
        {canManage && artwork && artwork.status !== "ready" && (
          <div className="relative z-20 flex flex-wrap items-center justify-center gap-3 bg-white px-4 py-2 text-sm text-slate-700">
            <span role="status">
              {artwork.status === "failed" || stalled
                ? "Your event is saved. Its artwork is not ready yet."
                : "Your event is saved. Creating its artwork…"}
            </span>
            {(artwork.status === "failed" || stalled) && (
              <button
                type="button"
                onClick={retry}
                disabled={retrying}
                className="min-h-11 rounded-lg px-4 font-semibold text-teal-800 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:opacity-50"
              >
                {retrying ? "Retrying…" : "Retry artwork"}
              </button>
            )}
          </div>
        )}
        {canManage && policy && !policy.medical && artwork?.status === "ready" && (
          <div className="relative z-20 flex flex-wrap justify-center gap-2 bg-white p-2">
            {!policy.medical && (
              <button
                type="button"
                disabled={retrying || policy.heroMode === "original"}
                onClick={() => chooseHero("original")}
                className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 disabled:opacity-50"
              >
                Use original artwork
              </button>
            )}
            <button
              type="button"
              disabled={
                retrying || (policy.heroMode === "generated" && Boolean(artwork.heroImageUrl))
              }
              onClick={() => (artwork.heroImageUrl ? chooseHero("generated") : retry())}
              className="min-h-11 rounded-xl border border-teal-200 px-4 text-sm font-semibold text-teal-800 disabled:opacity-50"
            >
              Use generated artwork
            </button>
            {stalled && (
              <span role="status" className="p-3 text-sm text-slate-700">
                Could not change the artwork. Please try again.
              </span>
            )}
          </div>
        )}
        {children}
        {original && originalPlacement === "after-content" && (
          <OriginalDocumentCard key={original.viewUrl} original={original} />
        )}
      </ScanMediaContext.Provider>
    </ScanArtworkContext.Provider>
  );
}
