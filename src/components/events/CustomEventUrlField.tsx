"use client";

import { useEffect, useId, useState } from "react";
import { readEventResponse } from "@/lib/event-response";
import { MAX_PUBLIC_SLUG_LENGTH, validateCustomEventPublicSlug } from "@/utils/event-public-slug";

export async function checkCustomEventUrl(slug: string, eventId?: string, signal?: AbortSignal) {
  const params = new URLSearchParams({ slug });
  if (eventId) params.set("eventId", eventId);
  const response = await fetch(`/api/events/public-slug?${params}`, { credentials: "include", cache: "no-store", signal });
  const result: { slug?: string; available?: boolean; error?: string } = await readEventResponse(response);
  if (!response.ok) throw new Error(result.error || "We couldn't check this URL. Please try again.");
  if (!result.available) throw new Error("That URL is already taken. Try another name or add a year.");
  return result;
}

export default function CustomEventUrlField({ value, onChange, suggestion, eventId, disabled = false, pathPrefix = "event", saveMode = "publish", currentSlug }: {
  value: string; onChange: (value: string) => void; suggestion?: string; eventId?: string; disabled?: boolean;
  pathPrefix?: "event" | "card" | "smart-signup-form";
  saveMode?: "publish" | "link";
  currentSlug?: string;
}) {
  const id = useId();
  const [origin, setOrigin] = useState("https://envitefy.com");
  const [check, setCheck] = useState<{ key: string; error?: string; available?: boolean } | null>(null);
  const validation = value.trim() ? validateCustomEventPublicSlug(value) : { slug: "", error: null };
  const key = `${eventId || ""}:${validation.slug}`;
  const currentCheck = check?.key === key && validation.slug !== currentSlug ? check : null;

  useEffect(() => setOrigin(window.location.origin), []);
  useEffect(() => {
    if (disabled || !validation.slug || validation.error || validation.slug === currentSlug) return;
    const request = new AbortController();
    const timer = setTimeout(() => {
      checkCustomEventUrl(validation.slug, eventId, request.signal).then(() => {
        if (!request.signal.aborted) setCheck({ key, available: true });
      }).catch((error: Error) => {
        if (!request.signal.aborted) setCheck({ key, error: error.message });
      });
    }, 350);
    return () => { clearTimeout(timer); request.abort(); };
  }, [validation.slug, validation.error, eventId, key, disabled, currentSlug]);

  const error = validation.error || currentCheck?.error;
  const status = error || (validation.slug && validation.slug === currentSlug ? "This is your current URL." : validation.slug ? currentCheck?.available ? saveMode === "link" ? "This URL is available. Choose Save link to use it." : "This URL is available. It is reserved when you publish." : "Checking availability…" : eventId ? "Leave blank to keep the current page URL." : "Leave blank to create a URL automatically when you publish.");
  return <div className="space-y-4">
    <p className="text-sm leading-relaxed text-slate-600">Choose a memorable link to share with your guests.</p>
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-semibold text-slate-700">Custom URL</label>
      <p className="mb-2 break-all text-xs text-slate-500">{origin}/{pathPrefix}/</p>
      <input id={id} type="text" value={value} onChange={(event) => { setCheck(null); onChange(event.target.value); }} disabled={disabled}
        maxLength={MAX_PUBLIC_SLUG_LENGTH} autoCapitalize="none" autoCorrect="off" spellCheck={false}
        placeholder={suggestion || "your-custom-link"} aria-invalid={Boolean(error)} aria-describedby={`${id}-status`}
        className="min-h-11 w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus-visible:ring-2 focus-visible:ring-violet-500 disabled:opacity-50" />
      <p id={`${id}-status`} role="status" className={`mt-2 text-sm leading-relaxed ${error ? "text-rose-700" : currentCheck?.available ? "text-emerald-700" : "text-slate-500"}`}>{status}</p>
    </div>
    {validation.slug ? <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Your page link</p>
      <p className="mt-1 break-all text-sm font-medium text-slate-800">{origin}/{pathPrefix}/{validation.slug}</p>
    </div> : null}
    {suggestion && suggestion !== validation.slug ? <button type="button" disabled={disabled} onClick={() => { setCheck(null); onChange(suggestion); }} className="min-h-11 w-full rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-left text-sm text-violet-900 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50">
      <span className="block font-semibold">Use suggested URL</span><span className="block break-all">{suggestion}</span>
    </button> : null}
    <p className="text-xs leading-relaxed text-slate-500">Use letters, numbers, and hyphens. Spaces become hyphens. Changing a published URL keeps the previous link working.</p>
  </div>;
}
