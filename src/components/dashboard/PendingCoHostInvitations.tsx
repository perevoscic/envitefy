"use client";

import { Bell, Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { EVENT_CACHE_INVALIDATE_EVENT } from "@/app/event-cache-context";
import { useCoHostInvitations } from "@/components/CoHostInvitationProvider";

export const COHOST_INVITATIONS_ANCHOR = "dashboard-cohost-invitations";
/** Opens the dashboard bell from links that already point at the invitations anchor. */
export const OPEN_COHOST_INVITATIONS_EVENT = "envitefy:open-cohost-invitations";

type Pending = { id: string; action: "accept" | "decline" };

/** Dashboard bell listing pending co-host invitations with inline Accept and Decline. */
export default function PendingCoHostInvitations() {
  const { invitations, loading, error, refresh, remove } = useCoHostInvitations();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<Pending | null>(null);
  const pendingRef = useRef(false);
  const [failure, setFailure] = useState<{ id: string; message: string } | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const count = invitations.length;

  const close = useCallback((restoreFocus = true) => {
    setOpen(false);
    if (window.location.hash === `#${COHOST_INVITATIONS_ANCHOR}`)
      window.history.replaceState(
        window.history.state,
        "",
        `${window.location.pathname}${window.location.search}`,
      );
    if (restoreFocus) triggerRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    const show = () => setOpen(true);
    if (window.location.hash === `#${COHOST_INVITATIONS_ANCHOR}`) show();
    const onHash = () => {
      if (window.location.hash === `#${COHOST_INVITATIONS_ANCHOR}`) show();
    };
    window.addEventListener(OPEN_COHOST_INVITATIONS_EVENT, show);
    window.addEventListener("hashchange", onHash);
    return () => {
      window.removeEventListener(OPEN_COHOST_INVITATIONS_EVENT, show);
      window.removeEventListener("hashchange", onHash);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    panelRef.current?.focus({ preventScroll: true });
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    const onPointer = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) close(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open, close]);

  async function respond(id: string, action: Pending["action"]) {
    if (pendingRef.current) return;
    pendingRef.current = true;
    setPending({ id, action });
    setFailure(null);
    const fallback =
      action === "accept"
        ? "The invitation could not be accepted. Try again."
        : "The invitation could not be declined. Try again.";
    try {
      const response = await fetch("/api/cohost-invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invitationId: id, action }),
      });
      const result = await response.json();
      if (!response.ok) {
        // Refresh expiry/revocation without treating a temporary server failure as rejection.
        if ([401, 403, 404, 410].includes(response.status)) void refresh();
        throw new Error(result.error || fallback);
      }
      remove(id);
      if (action === "decline") return;
      window.dispatchEvent(
        new CustomEvent(EVENT_CACHE_INVALIDATE_EVENT, {
          detail: { force: true, includeDashboard: true, source: "cohost-accepted" },
        }),
      );
      setOpen(false);
      router.push(`/event/${encodeURIComponent(result.eventId)}?tab=event`);
    } catch (cause) {
      setFailure({ id, message: cause instanceof Error ? cause.message : fallback });
    } finally {
      pendingRef.current = false;
      setPending(null);
    }
  }

  const busy = (id: string, action: Pending["action"]) =>
    pending?.id === id && pending.action === action;

  return (
    <div ref={wrapperRef} id={COHOST_INVITATIONS_ANCHOR} className="relative scroll-mt-24">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={
          count ? `Co-host invitations, ${count} pending` : "Co-host invitations, none pending"
        }
        onClick={() => (open ? close() : setOpen(true))}
        className={`relative grid size-11 place-items-center rounded-2xl border bg-white transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${
          open || count
            ? "border-indigo-200 text-indigo-600 hover:border-indigo-300"
            : "border-slate-200 text-slate-500 hover:border-indigo-200 hover:text-indigo-700"
        }`}
      >
        <Bell size={19} aria-hidden="true" />
        {count ? (
          <span
            aria-hidden="true"
            className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-rose-600 px-1 text-[11px] font-bold tabular-nums leading-none text-white ring-2 ring-white"
          >
            {count > 9 ? "9+" : count}
          </span>
        ) : error ? (
          <span
            aria-hidden="true"
            className="absolute right-2 top-2 size-2 rounded-full bg-amber-500 ring-2 ring-white"
          />
        ) : null}
      </button>

      {open ? (
        <>
          <div
            aria-hidden="true"
            onClick={() => close(false)}
            className="fixed inset-0 z-[94] bg-slate-950/40 backdrop-blur-[2px] sm:hidden"
          />
          <div
            ref={panelRef}
            id={panelId}
            role="dialog"
            aria-labelledby={`${panelId}-title`}
            tabIndex={-1}
            className="fixed inset-x-0 bottom-0 z-[95] flex max-h-[80dvh] flex-col overflow-hidden rounded-t-2xl bg-white pb-[env(safe-area-inset-bottom)] text-left text-slate-950 shadow-[0_24px_70px_-16px_rgba(15,23,42,0.45)] ring-1 ring-slate-900/[0.08] focus:outline-none sm:absolute sm:inset-x-auto sm:bottom-auto sm:right-0 sm:top-[calc(100%+0.5rem)] sm:max-h-[70vh] sm:w-[22rem] sm:rounded-2xl sm:pb-0"
          >
            <div
              className="mx-auto mt-2 h-1 w-10 rounded-full bg-slate-200 sm:hidden"
              aria-hidden="true"
            />
            <div className="relative px-5 pb-3 pt-4">
              <h2
                id={`${panelId}-title`}
                className="pr-10 text-[15px] font-semibold tracking-tight"
              >
                Co-host invitations
              </h2>
              <p className="mt-0.5 pr-10 text-[13px] leading-5 text-slate-500">
                Accept to help edit the event and manage RSVPs and guest messages.
              </p>
              <button
                type="button"
                aria-label="Close co-host invitations"
                onClick={() => close()}
                className="absolute right-2 top-2.5 grid size-11 place-items-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-violet-600"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain border-t border-slate-100">
              {error ? (
                <div className="mx-5 mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[13px] text-amber-900">
                  <p role="status">{error}</p>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => void refresh()}
                    className="inline-flex min-h-11 items-center font-semibold underline focus-visible:outline-2 focus-visible:outline-amber-700 disabled:opacity-60"
                  >
                    {loading ? "Refreshing…" : "Retry"}
                  </button>
                </div>
              ) : null}

              {count ? (
                <ul className="divide-y divide-slate-100 px-5">
                  {invitations.map((invite) => (
                    <li key={invite.id} className="py-3.5">
                      <h3 className="break-words text-sm font-semibold text-slate-900">
                        {invite.eventTitle}
                      </h3>
                      <p className="mt-0.5 break-words text-xs text-slate-500">
                        {invite.ownerName} invited you · Expires{" "}
                        {new Date(invite.expiresAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                      <div className="mt-2.5 flex gap-2">
                        <button
                          type="button"
                          disabled={pending !== null}
                          aria-busy={busy(invite.id, "decline")}
                          aria-label={`Decline co-host invitation for ${invite.eventTitle}`}
                          onClick={() => void respond(invite.id, "decline")}
                          className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 disabled:opacity-50 sm:min-h-10 sm:flex-none"
                        >
                          {busy(invite.id, "decline") ? (
                            <Loader2
                              size={15}
                              aria-hidden="true"
                              className="animate-spin motion-reduce:animate-none"
                            />
                          ) : null}
                          Decline
                        </button>
                        <button
                          type="button"
                          disabled={pending !== null}
                          aria-busy={busy(invite.id, "accept")}
                          aria-label={`Accept co-host invitation for ${invite.eventTitle}`}
                          onClick={() => void respond(invite.id, "accept")}
                          className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 disabled:opacity-50 sm:min-h-10 sm:flex-none"
                        >
                          {busy(invite.id, "accept") ? (
                            <Loader2
                              size={15}
                              aria-hidden="true"
                              className="animate-spin motion-reduce:animate-none"
                            />
                          ) : null}
                          Accept
                        </button>
                      </div>
                      {failure?.id === invite.id ? (
                        <p role="alert" className="mt-2 text-[13px] text-rose-700">
                          {failure.message}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex flex-col items-center px-5 py-8 text-center">
                  <span className="grid size-10 place-items-center rounded-xl border border-slate-200 text-slate-400">
                    <Bell size={18} aria-hidden="true" />
                  </span>
                  <p className="mt-3 text-sm font-medium text-slate-900">No pending invitations</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Co-host invitations sent to you will appear here.
                  </p>
                </div>
              )}

              {failure && !invitations.some((invite) => invite.id === failure.id) ? (
                <p role="alert" className="px-5 pb-3 text-[13px] text-rose-700">
                  {failure.message}
                </p>
              ) : null}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
