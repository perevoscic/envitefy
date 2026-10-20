"use client";
import { useEffect, useRef, useState } from "react";
import { readImportedEventTheme, redesignImportedEventTheme, type ImportedEventTheme } from "@/lib/imported-event-theme";
type Artwork = {
  themeId: string;
  status: "generating" | "ready" | "failed";
  imageUrl?: string;
  error?: string;
};

export default function ImportedThemeArtwork({
  eventId,
  value,
  onChange,
  syncOnly = false,
}: {
  eventId?: string | null;
  value: unknown;
  onChange: (theme: ImportedEventTheme) => void;
  syncOnly?: boolean;
}) {
  const theme = readImportedEventTheme(value);
  const current = useRef({ theme, onChange });
  current.current = { theme, onChange };
  const [artwork, setArtwork] = useState<Artwork | null>(null);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    if (!eventId || !theme?.enabled) return;
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    const themeId = theme.id;
    setArtwork((previous) => (previous?.themeId === themeId ? previous : null));
    let missingChecks = 0;
    async function check() {
      try {
        const response = await fetch(`/api/events/${encodeURIComponent(eventId!)}/theme-artwork`, {
          credentials: "include",
          cache: "no-store",
        });
        if (!response.ok) throw Error("Image status could not be loaded.");
        const { artwork: next } = await response.json();
        if (!active || current.current.theme?.id !== themeId) return;
        if (next?.status === "ready" && next.themeId !== themeId && next.imageUrl) {
          setArtwork(next);
          return;
        }
        if (next?.themeId === themeId) {
          setArtwork(next);
          if (
            next.status === "ready" &&
            next.imageUrl &&
            current.current.theme.artworkUrl !== next.imageUrl
          )
            current.current.onChange({ ...current.current.theme, artworkUrl: next.imageUrl });
          if (next.status !== "generating") return;
        }
        if (next?.themeId === themeId || ++missingChecks < 4) timer = setTimeout(check, 3000);
      } catch {
        if (active) setError("Image status could not be loaded. Reload to check again.");
      }
    }
    void check();
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [eventId, theme?.id, theme?.enabled, refresh]);
  async function generate(requestTheme = theme) {
    if (!eventId || !requestTheme) return;
    setError("");
    setArtwork({ themeId: requestTheme.id, status: "generating" });
    try {
      const response = await fetch(`/api/events/${encodeURIComponent(eventId)}/theme-artwork`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: requestTheme, retry: artwork?.status === "failed" }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result)
        throw Error(result?.error || `The image request could not be started (${response.status}). Your current image is kept.`);
      setRefresh((value) => value + 1);
    } catch (reason) {
      setArtwork(null);
      setError(reason instanceof Error ? reason.message : "Image generation could not be started.");
    }
  }
  if (syncOnly || !theme?.enabled) return null;
  return (
    <div className="mt-3 border-t border-slate-200 pt-3">
      {artwork?.status === "ready" && artwork.themeId !== theme.id && artwork.imageUrl !== theme.artworkUrl ? (
        <div className="mb-3">
          <p className="text-sm text-slate-600">A previously generated event image is available.</p>
          <button
            type="button"
            className="mt-2 min-h-11 rounded-xl border border-slate-300 px-3 text-sm font-semibold hover:bg-slate-50"
            onClick={() => onChange({ ...theme, artworkUrl: artwork.imageUrl })}
          >
            Use generated image
          </button>
        </div>
      ) : null}
      {artwork?.status === "generating" ? (
        <p role="status" className="text-sm text-slate-700">
          Creating and checking your event image… You can keep editing.
        </p>
      ) : theme.artworkUrl && artwork?.status !== "failed" ? (
        <>
          <p className="text-sm text-slate-600">Original event image ready.</p>
          <button
            type="button"
            disabled={!eventId}
            className="mt-2 min-h-11 rounded-xl border border-slate-300 px-3 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"
            onClick={() => {
              const next = redesignImportedEventTheme(theme);
              const replacement = { ...theme, id: next.id, revision: next.revision };
              onChange(replacement);
              void generate(replacement);
            }}
          >
            Replace event image
          </button>
          <p className="mt-1 text-xs text-slate-600">
            Generates and checks one new image. Your current image stays visible until it passes.
          </p>
        </>
      ) : (
        <>
          <button
            type="button"
            disabled={!eventId}
            className="min-h-11 rounded-xl border border-slate-300 px-3 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"
            onClick={() => void generate()}
          >
            {artwork?.status === "failed" ? "Retry event image" : "Generate event image"}
          </button>
          <p className="mt-1 text-xs text-slate-600">
            {eventId
              ? "Uses OpenAI image generation once for this design. Your current image stays visible."
              : "Save a draft first so generation can be recovered after a reload."}
          </p>
        </>
      )}
      {artwork?.error || error ? (
        <p role="alert" className="mt-2 text-sm text-red-700">
          {artwork?.error || error}
        </p>
      ) : null}
    </div>
  );
}
