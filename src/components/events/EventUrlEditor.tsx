"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Link2, X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useEventHistoryClient, type createEventHistoryClient } from "@/lib/event-history-client";
import { readEventResponse } from "@/lib/event-response";
import { buildEventProductPath } from "@/utils/event-product-route";
import { validateCustomEventPublicSlug } from "@/utils/event-public-slug";
import CustomEventUrlField, { checkCustomEventUrl } from "./CustomEventUrlField";

export type EventUrlUpdate = {
  id: string;
  publicSlug: string;
  publicPath: string;
  revision: string;
};

type Props = {
  eventId?: string | null;
  historyClient?: ReturnType<typeof createEventHistoryClient>;
  disabled?: boolean;
  onUpdated?: (update: EventUrlUpdate) => void;
  onBusyChange?: (busy: boolean) => void;
};

/** URL changes have their own explicit save and never submit pending event edits. */
export function EventUrlEditor({ eventId, historyClient: suppliedClient, disabled, onUpdated, onBusyChange }: Props) {
  const ownClient = useEventHistoryClient();
  const client = suppliedClient || ownClient;
  const [value, setValue] = useState("");
  const [savedSlug, setSavedSlug] = useState("");
  const [pathPrefix, setPathPrefix] = useState<"event" | "card" | "smart-signup-form">("event");
  const [loading, setLoading] = useState(Boolean(eventId));
  const [owner, setOwner] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [retry, setRetry] = useState(0);
  const saving = useRef(false);

  useEffect(() => {
    if (!eventId) return;
    const controller = new AbortController();
    setLoading(true);
    setOwner(false);
    setError("");
    setMessage("");
    void client.fetch(`/api/history/${encodeURIComponent(eventId)}`, {
      credentials: "include", cache: "no-store", signal: controller.signal,
    }).then(async response => {
      const row = await readEventResponse(response);
      if (controller.signal.aborted) return;
      if (!response.ok) throw new Error(row.error || "Your current URL could not be loaded. Try again.");
      const isOwner = row.permissions?.role === "owner";
      setOwner(isOwner);
      if (!isOwner) return;
      const slug = row.public_slug || row.data?.publicSlug || "";
      setValue(slug);
      setSavedSlug(slug);
      const path = buildEventProductPath({ eventId, title: row.title, data: row.data, publicSlug: slug });
      setPathPrefix(path.startsWith("/card/") ? "card" : path.startsWith("/smart-signup-form/") ? "smart-signup-form" : "event");
    }).catch(failure => {
      if (!controller.signal.aborted) setError(failure instanceof Error ? failure.message : "Your current URL could not be loaded. Try again.");
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [eventId, client, retry]);

  const save = async () => {
    if (!eventId || !owner || disabled || saving.current) return;
    const validation = validateCustomEventPublicSlug(value);
    setError("");
    setMessage("");
    if (validation.error) { setError(validation.error); return; }
    saving.current = true;
    setBusy(true);
    onBusyChange?.(true);
    try {
      await checkCustomEventUrl(validation.slug, eventId);
      const response = await client.fetch(`/api/events/${encodeURIComponent(eventId)}/public-slug`, {
        method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicSlug: validation.slug }),
      });
      const result = await readEventResponse(response);
      if (!response.ok) throw new Error(result.error || "Your URL could not be saved. Try again.");
      setValue(result.publicSlug);
      setSavedSlug(result.publicSlug);
      setMessage("Link updated. Previous links still work.");
      onUpdated?.(result as EventUrlUpdate);
      window.dispatchEvent(new CustomEvent("history:updated", { detail: { id: eventId } }));
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Your URL could not be saved. Try again.");
    } finally {
      saving.current = false;
      setBusy(false);
      onBusyChange?.(false);
    }
  };

  if (!eventId) return <p className="text-sm leading-relaxed text-slate-600">Save a draft to create your URL, then customize it here before sharing.</p>;
  if (loading) return <p role="status" className="text-sm text-slate-600">Loading your URL…</p>;
  if (!owner) return <div className="space-y-3">
    <p role={error ? "alert" : undefined} className="text-sm text-slate-600">{error || "Only the owner can change this URL."}</p>
    {error && <button type="button" className="min-h-11 rounded-xl border px-3 text-sm font-semibold" onClick={() => setRetry(current => current + 1)}>Try again</button>}
  </div>;
  const validation = value.trim() ? validateCustomEventPublicSlug(value) : null;
  return <div className="space-y-4" data-custom-event-url>
    <CustomEventUrlField value={value} onChange={next => { setValue(next); setError(""); setMessage(""); }} eventId={eventId} pathPrefix={pathPrefix} currentSlug={savedSlug} saveMode="link" disabled={disabled || busy} />
    <button type="button" onClick={() => void save()} disabled={disabled || busy || !validation?.slug || Boolean(validation.error) || validation.slug === savedSlug}
      className="min-h-11 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 disabled:opacity-50">
      {busy ? "Saving link…" : "Save link"}
    </button>
    <p className="text-xs leading-relaxed text-slate-500">Save link updates the URL immediately. Save your event details and design separately. Drafts stay private until you publish.</p>
    {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
    {message && <p role="status" className="text-sm text-emerald-700">{message}</p>}
  </div>;
}

export default function EventUrlDialog({ children, className, ...props }: Props & { children?: ReactNode; className?: string }) {
  const [busy, setBusy] = useState(false);
  return <Dialog.Root>
    <Dialog.Trigger asChild>
      <button type="button" aria-label="Custom URL" title="Custom URL" className={className || "inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800"} disabled={props.disabled}>
        {children || <><Link2 size={18} aria-hidden="true" /><span>Custom URL</span></>}
      </button>
    </Dialog.Trigger>
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-[1500] bg-slate-950/45" />
      <Dialog.Content onEscapeKeyDown={event => { if (busy) event.preventDefault(); }} onPointerDownOutside={event => { if (busy) event.preventDefault(); }}
        className="fixed left-1/2 top-1/2 z-[1501] max-h-[85dvh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-white p-5 text-slate-900 shadow-xl sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <Dialog.Title className="text-lg font-semibold">Custom URL</Dialog.Title>
          <Dialog.Close asChild><button type="button" disabled={busy} aria-label="Close custom URL" className="flex size-11 shrink-0 items-center justify-center rounded-xl hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2"><X size={20} aria-hidden="true" /></button></Dialog.Close>
        </div>
        <Dialog.Description className="sr-only">Customize the shareable address for this event.</Dialog.Description>
        <EventUrlEditor {...props} onBusyChange={next => { setBusy(next); props.onBusyChange?.(next); }} />
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
