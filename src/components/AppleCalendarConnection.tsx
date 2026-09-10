"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { CalendarDays, Copy, RefreshCw, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export type AppleCalendarStatus = { ready: boolean; connected: boolean };
type SubscriptionLink = { feedUrl: string; subscribeUrl: string };
const buttonClass = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#d9cdfa] bg-white px-3 py-2 text-xs font-semibold text-[#4f3f7a] transition hover:bg-[#f5eeff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c67be] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-45";

export default function AppleCalendarConnection({ accountKey, status, onStatusChange }: {
  accountKey: string;
  status: AppleCalendarStatus;
  onStatusChange: (status: AppleCalendarStatus) => void;
}) {
  const [link, setLink] = useState<SubscriptionLink | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const generation = useRef(0);

  useEffect(() => {
    if (!accountKey) return;
    generation.current++;
    setLink(null);
    setOpen(false);
    setBusy(false);
    setError("");
    return () => {
      generation.current++;
    };
  }, [accountKey]);

  useEffect(() => {
    // Settings supplies the saved status. Only active, unfinished setup needs polling.
    if (!accountKey || !open || !status.ready || status.connected || busy) return;
    let disposed = false;
    let pending: AbortController | null = null;
    const current = generation.current;
    async function refresh() {
      if (disposed || pending || document.visibilityState === "hidden") return;
      const controller = new AbortController();
      pending = controller;
      try {
        const response = await fetch("/api/calendars/apple", {
          credentials: "include", cache: "no-store", signal: controller.signal,
        });
        if (!response.ok) return;
        const payload = await response.json();
        if (disposed || current !== generation.current) return;
        onStatusChange({ ready: Boolean(payload.ready), connected: Boolean(payload.connected) });
      } catch {
        // Keep the last verified state during temporary network failures.
      } finally {
        pending = null;
      }
    }
    void refresh();
    const timer = window.setInterval(() => void refresh(), 10_000);
    window.addEventListener("focus", refresh);
    return () => {
      disposed = true;
      pending?.abort();
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
    };
  }, [accountKey, open, status.ready, status.connected, busy, onStatusChange]);

  async function prepare() {
    const current = ++generation.current;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/calendars/apple", { method: "POST", credentials: "include" });
      const payload = await response.json();
      if (!response.ok || typeof payload.feedUrl !== "string" || typeof payload.subscribeUrl !== "string") {
        throw new Error(payload.error || "Apple Calendar setup could not be started.");
      }
      if (current !== generation.current) return;
      setLink({ feedUrl: payload.feedUrl, subscribeUrl: payload.subscribeUrl });
      onStatusChange({ ready: true, connected: Boolean(payload.connected) });
      setCopied(false);
    } catch (failure) {
      if (current === generation.current) setError(failure instanceof Error ? failure.message : "Please try again.");
    } finally {
      if (current === generation.current) setBusy(false);
    }
  }

  async function disconnect() {
    const current = ++generation.current;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/calendars/apple", { method: "DELETE", credentials: "include" });
      if (!response.ok) throw new Error("Apple Calendar could not be disconnected. Please try again.");
      if (current !== generation.current) return;
      onStatusChange({ ready: false, connected: false });
      setLink(null);
      setOpen(false);
    } catch (failure) {
      if (current === generation.current) setError(failure instanceof Error ? failure.message : "Please try again.");
    } finally {
      if (current === generation.current) setBusy(false);
    }
  }

  async function copyLink() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link.feedUrl);
      setCopied(true);
    } catch {
      setError("Select and copy the calendar link below.");
    }
  }

  return (
    <div className="min-w-0 space-y-3 rounded-2xl border border-[#e5dcff] bg-[linear-gradient(145deg,#fff,#fbf9ff)] p-4 shadow-[0_8px_24px_rgba(80,61,121,0.05)]">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-[#2f1d47]">Apple</p>
        <span className={`rounded-full px-2 py-0.5 text-xs ${status.connected ? "bg-emerald-100 text-emerald-700" : "bg-[#f1edff] text-[#6f5ba3]"}`}>
          {status.connected ? "Connected" : "Not connected"}
        </span>
      </div>
      <Dialog.Root open={open} onOpenChange={(next) => { if (!busy) { setOpen(next); setError(""); } }}>
        <Dialog.Trigger asChild>
          <button type="button" className={`${buttonClass} w-full`} disabled={!accountKey}>
            {status.connected ? "Manage Apple Calendar" : "Connect Apple Calendar"}
          </button>
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[12990] bg-[#170f24]/55 backdrop-blur-[6px]" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-[13000] max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[2rem] border border-[#ddd2f5] bg-white p-6 text-[#2f1d47] shadow-[0_28px_90px_rgba(36,21,58,0.34)] sm:p-7">
            <Dialog.Close asChild>
              <button type="button" aria-label="Close Apple Calendar setup" disabled={busy} className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full hover:bg-[#f5eeff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c67be]">
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </Dialog.Close>
            <CalendarDays className="mb-4 h-8 w-8 text-[#7c67be]" aria-hidden="true" />
            <Dialog.Title className="pr-5 font-[family-name:var(--font-playfair),Georgia,serif] text-2xl font-semibold">Connect Apple Calendar</Dialog.Title>
            <Dialog.Description className="mt-3 text-sm leading-6 text-[#6f6479]">
              Add your saved Envitefy events as a calendar subscription. Changes you make in Envitefy appear when Apple Calendar refreshes.
            </Dialog.Description>
            {link ? (
              <div className="mt-5 space-y-3">
                <a href={link.subscribeUrl} className={`${buttonClass} w-full`}>Open Apple Calendar</a>
                <p className="text-sm leading-6 text-[#6f6479]">Choose Subscribe on your iPhone, iPad, or Mac. You can also copy the link and add it as a Calendar Subscription.</p>
                <label className="block text-xs font-medium text-[#6f5ba3]" htmlFor="apple-calendar-link">Private calendar link</label>
                <input id="apple-calendar-link" readOnly value={link.feedUrl} onFocus={(event) => event.target.select()} className="w-full rounded-xl border border-[#d9cdfa] bg-[#faf8ff] p-3 text-sm text-[#59466f] focus:outline-none focus:ring-2 focus:ring-[#7c67be]" />
                <button type="button" onClick={() => void copyLink()} className={`${buttonClass} w-full`}><Copy className="h-4 w-4" aria-hidden="true" />{copied ? "Link copied" : "Copy calendar link"}</button>
                <p className="text-xs leading-5 text-[#6f6479]">Keep this link private. Anyone with it can view the events in this subscription.</p>
                {status.connected ? <p role="status" className="text-sm font-medium text-emerald-700">Your calendar subscription is connected.</p> : null}
              </div>
            ) : (
              <button type="button" onClick={() => void prepare()} disabled={busy} className={`${buttonClass} mt-5 w-full`}>
                {busy ? <RefreshCw className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : null}
                {busy ? "Preparing calendar…" : "Continue"}
              </button>
            )}
            {error ? <p role="alert" className="mt-4 text-sm text-rose-700">{error}</p> : null}
            {status.ready ? <button type="button" disabled={busy} onClick={() => void disconnect()} className={`${buttonClass} mt-4 w-full text-rose-700`}>Disconnect Apple Calendar</button> : null}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
