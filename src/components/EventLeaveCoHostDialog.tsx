"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { LogOut } from "lucide-react";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSidebar } from "@/app/sidebar-context";
import { emitEventCacheInvalidation, emitEventCacheReset } from "@/app/event-cache-context";

export default function EventLeaveCoHostDialog({ eventId, eventTitle, className }: {
  eventId: string;
  eventTitle: string;
  className?: string;
}) {
  const router = useRouter();
  const { clearEventContext } = useSidebar();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const [error, setError] = useState("");
  const button = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold transition hover:bg-current/10 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50";

  async function leave() {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/events/${encodeURIComponent(eventId)}/collaborators?action=leave`, { method: "DELETE" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload.ok !== true)
        throw new Error(payload.error || "Could not leave this event. Please try again.");
      // Leaving is reversible by invitation, so do not record a deleted-event tombstone.
      emitEventCacheReset();
      emitEventCacheInvalidation({ force: true, includeDashboard: true, source: "cohost-left" });
      clearEventContext();
      router.replace("/");
      router.refresh();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not leave this event. Please try again.");
      pending.current = false;
      setBusy(false);
    }
  }

  return <Dialog.Root open={open} onOpenChange={next => {
    if (pending.current) return;
    setError("");
    setOpen(next);
  }}>
    <Dialog.Trigger asChild>
      <button ref={trigger} type="button" className={className || button} aria-label="Leave event as co-host">
        <LogOut size={18} aria-hidden="true" /><span>Leave event</span>
      </button>
    </Dialog.Trigger>
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-[90] bg-slate-950/45 backdrop-blur-[3px]" />
      <Dialog.Content className="fixed left-1/2 top-1/2 z-[91] max-h-[88dvh] w-[calc(100%_-_2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl border border-border bg-surface p-6 font-sans text-foreground shadow-xl"
        onCloseAutoFocus={event => {
          event.preventDefault();
          const button = trigger.current;
          const target = button?.getClientRects().length ? button : button?.closest("[data-event-preview-actions]")?.querySelector<HTMLButtonElement>('button[aria-label="More event actions"]');
          target?.focus();
        }}
        onEscapeKeyDown={event => { if (busy) event.preventDefault(); }}
        onPointerDownOutside={event => { if (busy) event.preventDefault(); }}>
        <Dialog.Title className="text-xl font-semibold">Leave event as co-host?</Dialog.Title>
        <Dialog.Description className="mt-3 break-words text-sm text-muted-foreground">
          You’ll lose co-host access to {eventTitle}. The event and its owner’s access will stay unchanged. You’ll need a new invitation to rejoin.
        </Dialog.Description>
        {error && <p role="alert" className="mt-3 text-sm text-error">{error}</p>}
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Dialog.Close asChild><button type="button" disabled={busy} className={button}>Cancel</button></Dialog.Close>
          <button type="button" disabled={busy} onClick={() => void leave()} className={`${button} bg-primary text-primary-foreground`}>{busy ? "Leaving…" : "Leave event"}</button>
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
