"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { CalendarDays, Copy, RefreshCw, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export type AppleCalendarStatus = { ready: boolean; connected: boolean };
type SubscriptionLink = { feedUrl: string; subscribeUrl: string };
const buttonClass = "inline-flex min-h-11 max-w-full items-center justify-center gap-2 rounded-lg border border-[color:var(--settings-line,var(--border))] bg-[color:var(--settings-surface,var(--surface))] px-3 py-2 text-sm font-medium text-[color:var(--settings-ink,var(--foreground))] transition-colors hover:bg-[color:var(--settings-selection,var(--muted))] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--settings-accent,var(--ring))] disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none";

export default function AppleCalendarConnection({ accountKey, status, onStatusChange, presentation = "card" }: {
  accountKey: string;
  status: AppleCalendarStatus;
  onStatusChange: (status: AppleCalendarStatus) => void;
  presentation?: "card" | "settings-row" | "settings-column";
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

  const settingsRow = presentation === "settings-row";
  const settingsColumn = presentation === "settings-column";
  const settingsPresentation = settingsRow || settingsColumn;
  return (
    <div
      data-settings-surface={settingsPresentation ? undefined : ""}
      data-apple-calendar-connection
      className={settingsColumn
        ? "flex h-full min-w-0 flex-col gap-4 text-[color:var(--settings-ink,var(--foreground))]"
        : settingsRow
        ? "flex min-w-0 flex-wrap items-center gap-x-4 gap-y-3 py-3 text-[color:var(--settings-ink,var(--foreground))]"
        : "min-w-0 space-y-3 rounded-xl border border-[color:var(--settings-line,var(--border))] bg-[color:var(--settings-surface,var(--surface))] p-4 text-[color:var(--settings-ink,var(--foreground))]"}
    >
      <div className={settingsColumn ? "min-w-0" : settingsRow ? "flex min-w-0 grow basis-52 items-center justify-between gap-3" : "flex items-center justify-between gap-2"}>
        <div className="min-w-0">
          {settingsColumn ? <h3>Apple Calendar</h3> : <p className="text-sm font-medium">{settingsRow ? "Apple Calendar" : "Apple"}</p>}
          {settingsColumn ? <p className="mt-1 text-[13px] text-[color:var(--settings-muted,var(--muted-foreground))]">{status.connected ? "Connected" : "Not connected"}</p> : null}
          {settingsPresentation ? <p className="mt-1 text-[13px] text-[color:var(--settings-muted,var(--muted-foreground))]">Saved-event subscription</p> : null}
        </div>
        {!settingsColumn ? <span className="shrink-0 text-xs text-[color:var(--settings-muted,var(--muted-foreground))]">
          {status.connected ? "Connected" : "Not connected"}
        </span> : null}
      </div>
      <Dialog.Root open={open} onOpenChange={(next) => { if (!busy) { setOpen(next); setError(""); } }}>
        <Dialog.Trigger asChild>
          <button type="button" aria-label={status.connected ? "Manage Apple Calendar" : "Connect Apple Calendar"} className={`${buttonClass} ${settingsColumn ? "mt-auto w-full" : settingsRow ? "ml-auto" : "w-full"}`} disabled={!accountKey}>
            {settingsColumn ? status.connected ? "Manage" : "Connect" : status.connected ? "Manage Apple Calendar" : "Connect Apple Calendar"}
          </button>
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[12990] bg-[#170f24]/55 backdrop-blur-[6px]" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-[13000] max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-2xl sm:p-7">
            <Dialog.Close asChild>
              <button type="button" aria-label="Close Apple Calendar setup" disabled={busy} className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-lg hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </Dialog.Close>
            <CalendarDays className="mb-4 h-6 w-6 text-muted-foreground" aria-hidden="true" />
            <Dialog.Title className="pr-5 !font-sans text-2xl font-medium !tracking-normal">Connect Apple Calendar</Dialog.Title>
            <Dialog.Description className="mt-3 text-sm leading-6 text-muted-foreground">
              Add your saved Envitefy events as a calendar subscription. Changes you make in Envitefy appear when Apple Calendar refreshes.
            </Dialog.Description>
            {link ? (
              <div className="mt-5 space-y-3">
                <a href={link.subscribeUrl} className={`${buttonClass} w-full`}>Open Apple Calendar</a>
                <p className="text-sm leading-6 text-muted-foreground">Choose Subscribe on your iPhone, iPad, or Mac. You can also copy the link and add it as a Calendar Subscription.</p>
                <label className="block text-sm font-medium" htmlFor="apple-calendar-link">Private calendar link</label>
                <input id="apple-calendar-link" readOnly value={link.feedUrl} onFocus={(event) => event.target.select()} className="min-h-11 w-full rounded-lg border border-input bg-[var(--field-background,var(--card))] p-3 text-base text-card-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring" />
                <button type="button" onClick={() => void copyLink()} className={`${buttonClass} w-full`}><Copy className="h-4 w-4" aria-hidden="true" />{copied ? "Link copied" : "Copy calendar link"}</button>
                <p className="text-xs leading-5 text-muted-foreground">Keep this link private. Anyone with it can view the events in this subscription.</p>
                {status.connected ? <p role="status" className="text-sm font-medium text-[var(--success)]">Your calendar subscription is connected.</p> : null}
              </div>
            ) : (
              <button type="button" onClick={() => void prepare()} disabled={busy} className={`${buttonClass} mt-5 w-full`}>
                {busy ? <RefreshCw className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : null}
                {busy ? "Preparing calendar…" : "Continue"}
              </button>
            )}
            {error ? <p role="alert" className="mt-4 text-sm text-destructive">{error}</p> : null}
            {status.ready ? <button type="button" disabled={busy} onClick={() => void disconnect()} className={`${buttonClass} mt-4 w-full !text-destructive`}>Disconnect Apple Calendar</button> : null}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
