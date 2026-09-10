"use client";

import { CONNECTED_CALENDAR_SYNC_ENABLED } from "@/config/calendar-sync";

import * as Dialog from "@radix-ui/react-dialog";
import { AlertTriangle, CalendarClock, CheckCircle2, LoaderCircle, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { openAppleCalendarIcs } from "@/utils/calendar-open";
import { readCalendarSyncState } from "@/lib/calendar-sync-state";

type AutomaticCalendarProvider = "google" | "microsoft";
type CalendarSyncStatus = "needs_connection" | "needs_reconnect" | "failed";
type OAuthConnectionStatus = "stored" | "not-stored" | null;
type FeedbackState = {
  kind: "success" | "error" | "apple";
  message: string;
};

const PROMPT_STORAGE_KEY = "envitefy:first-scan-calendar-prompt:v1";
const SYNC_NOTICE_STORAGE_KEY = "envitefy:calendar-sync-notice:v1";
const CALENDAR_TOAST_CLASS =
  "fixed inset-x-4 z-[13010] flex items-center gap-2 rounded-2xl border border-stone-200/90 bg-white/95 py-2 pl-3 pr-1 text-sm text-stone-800 shadow-[0_8px_30px_rgba(44,28,18,0.14)] backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 motion-reduce:animate-none sm:left-auto sm:right-6 sm:w-96";
const TOAST_ACTION_CLASS =
  "inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg px-2 text-xs font-semibold text-violet-700 underline underline-offset-4 transition hover:bg-violet-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500";

function addSearchParams(path: string, values: Record<string, string>): string {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}${new URLSearchParams(values).toString()}`;
}

function providerLabel(provider: AutomaticCalendarProvider | null): string {
  return provider === "microsoft" ? "Outlook" : "Google Calendar";
}

function NoticeCloseButton({ onDismiss }: { onDismiss: () => void }) {
  return (
    <button
      type="button"
      onClick={onDismiss}
      aria-label="Dismiss calendar notice"
      className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-current opacity-60 transition hover:bg-black/5 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-2"
    >
      <X className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}

export default function FirstScanCalendarPrompt({
  userId,
  eventId,
  returnPath,
  syncStatus: initialSyncStatus,
  syncProvider: initialSyncProvider,
  backgroundSync = false,
  announceSyncCompletion = false,
  calendarSetupProvider,
  calendarSetupStatus,
  calendarSetupFailureReason,
  appleCalendarHref,
}: {
  userId: string;
  eventId: string;
  returnPath: string;
  syncStatus?: CalendarSyncStatus;
  syncProvider?: AutomaticCalendarProvider | null;
  backgroundSync?: boolean;
  announceSyncCompletion?: boolean;
  calendarSetupProvider?: AutomaticCalendarProvider | null;
  calendarSetupStatus?: OAuthConnectionStatus;
  calendarSetupFailureReason?: string | null;
  appleCalendarHref?: string | null;
}) {
  const [decisionLoaded, setDecisionLoaded] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [syncing, setSyncing] = useState(
    Boolean(calendarSetupProvider && calendarSetupStatus !== "not-stored"),
  );
  const [syncStatus, setSyncStatus] = useState(initialSyncStatus);
  const [syncProvider, setSyncProvider] = useState(initialSyncProvider);
  const [monitorSync, setMonitorSync] = useState(backgroundSync);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [noticeDismissed, setNoticeDismissed] = useState(false);
  const [toastHovered, setToastHovered] = useState(false);
  const [toastFocused, setToastFocused] = useState(false);
  const syncStartedRef = useRef(false);
  const promptKey = useMemo(() => `${PROMPT_STORAGE_KEY}:${userId}`, [userId]);
  const syncNoticeKey = useMemo(() => `${SYNC_NOTICE_STORAGE_KEY}:${userId}:${eventId}`, [userId, eventId]);
  const announcedCompletionRef = useRef<string | null>(null);

  const dismissNotice = useCallback(() => {
    setNoticeDismissed(true);
    setToastHovered(false);
    setToastFocused(false);
  }, []);

  const showFeedback = useCallback((nextFeedback: FeedbackState) => {
    setNoticeDismissed(false);
    setFeedback(nextFeedback);
  }, []);

  const markPromptHandled = useCallback(() => {
    try {
      window.localStorage.setItem(promptKey, "handled");
    } catch {
      // A storage failure should not block calendar setup or event access.
    }
  }, [promptKey]);

  useEffect(() => {
    if (!CONNECTED_CALENDAR_SYNC_ENABLED || !backgroundSync || !announceSyncCompletion) return;
    // Creation is a one-time transition. Preserve the event URL, other options and hash.
    const url = new URL(window.location.href);
    if (!url.searchParams.has("created")) return;
    url.searchParams.delete("created");
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
  }, [announceSyncCompletion, backgroundSync]);

  useEffect(() => {
    if (!CONNECTED_CALENDAR_SYNC_ENABLED || !monitorSync) return;
    const controller = new AbortController();
    const deadline = Date.now() + 8 * 60_000;
    const navigation = window.performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    const revisitedDocument = navigation &&
      (navigation.type === "reload" || navigation.type === "back_forward") &&
      new URL(navigation.name).pathname === window.location.pathname;
    const announceCreation = announceSyncCompletion && !revisitedDocument;
    let observedPending = false;
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      try {
        const response = await fetch(`/api/events/calendar/auto?eventId=${encodeURIComponent(eventId)}`, {
          credentials: "include",
          cache: "no-store",
          signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15_000)]),
        });
        if (controller.signal.aborted) return;
        if (response.status === 401 || response.status === 403 || response.status === 404) {
          setSyncing(false);
          return;
        }
        if (response.ok) {
          const payload: unknown = await response.json();
          if (controller.signal.aborted) return;
          const state = readCalendarSyncState(payload);
          const provider = state.provider;
          setSyncProvider(provider);
          if (state.status !== "pending" && state.status !== "syncing") {
            setSyncing(false);
            setMonitorSync(false);
            if (state.status === "synced") {
              setSyncStatus(undefined);
              setDialogOpen(false);
              const completion = `${provider || "calendar"}:${state.updatedAt || "synced"}`;
              const noticeId = `${syncNoticeKey}:${completion}`;
              let alreadyAnnounced = announcedCompletionRef.current === noticeId;
              try {
                alreadyAnnounced ||= window.localStorage.getItem(syncNoticeKey) === completion;
              } catch {
                // URL cleanup and the mounted ref still prevent ordinary reload/effect replays.
              }
              if (!alreadyAnnounced) {
                announcedCompletionRef.current = noticeId;
                try {
                  window.localStorage.setItem(syncNoticeKey, completion);
                } catch {
                  // Notification storage must never interfere with calendar syncing.
                }
                if (announceCreation || observedPending) {
                  showFeedback({ kind: "success", message: `Added to ${provider ? providerLabel(provider) : "your calendar"}.` });
                }
              }
            } else if (state.status === "needs_connection" || state.status === "needs_reconnect" || state.status === "failed") {
              setSyncStatus(state.status);
            } else if (state.status === "skipped") {
              showFeedback({ kind: "error", message: "Event saved. Add a date and time to sync." });
            }
            return;
          }
          observedPending = true;
          setSyncing(true);
        }
      } catch {
        if (controller.signal.aborted) return;
      }
      if (Date.now() >= deadline) {
        setSyncing(false);
        showFeedback({ kind: "error", message: "Event saved. Calendar sync could not be confirmed." });
        return;
      }
      timer = setTimeout(poll, 3000);
    };
    void poll();
    return () => { controller.abort(); clearTimeout(timer); };
  }, [announceSyncCompletion, eventId, monitorSync, showFeedback, syncNoticeKey]);

  useEffect(() => {
    if (!CONNECTED_CALENDAR_SYNC_ENABLED) return;
    if (calendarSetupProvider || syncStatus !== "needs_connection" || !appleCalendarHref) {
      setDecisionLoaded(true);
      return;
    }

    let promptHandled = false;
    try {
      promptHandled = window.localStorage.getItem(promptKey) === "handled";
    } catch {
      promptHandled = false;
    }
    setDialogOpen(!promptHandled);
    setDecisionLoaded(true);
  }, [appleCalendarHref, calendarSetupProvider, promptKey, syncStatus]);

  useEffect(() => {
    if (!CONNECTED_CALENDAR_SYNC_ENABLED) return;
    if (!calendarSetupProvider || syncStartedRef.current) return;
    syncStartedRef.current = true;
    markPromptHandled();

    if (calendarSetupStatus === "not-stored") {
      const permissionDenied = calendarSetupFailureReason === "missing-calendar-scope";
      setSyncing(false);
      showFeedback({
        kind: "error",
        message: permissionDenied
          ? `${providerLabel(calendarSetupProvider)} needs calendar access. Reconnect in Settings.`
          : `${providerLabel(calendarSetupProvider)} was not connected. Try again in Settings.`,
      });
      window.history.replaceState(window.history.state, "", returnPath);
      return;
    }

    let cancelled = false;

    const syncCurrentEvent = async () => {
      setSyncing(true);
      try {
        const response = await fetch("/api/events/calendar/auto", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          cache: "no-store",
          body: JSON.stringify({ eventId }),
        });
        const payload: { status?: string; reason?: string } = await response
          .json()
          .catch(() => ({}));
        if (cancelled) return;

        if (
          response.ok &&
          (payload.status === "synced" || payload.status === "already_synced")
        ) {
          showFeedback({
            kind: "success",
            message: `Connected. Added to ${providerLabel(calendarSetupProvider)}.`,
          });
        } else if (payload.status === "syncing" || payload.status === "pending") {
          setMonitorSync(true);
        } else if (payload.status === "needs_connection") {
          showFeedback({
            kind: "error",
            message: `${providerLabel(calendarSetupProvider)} was not connected. Try again in Settings.`,
          });
        } else if (payload.status === "needs_reconnect") {
          showFeedback({
            kind: "error",
            message: `Reconnect ${providerLabel(calendarSetupProvider)} to sync this event.`,
          });
        } else if (payload.status === "skipped") {
          showFeedback({
            kind: "error",
            message: "Calendar connected. Add a date and time to sync.",
          });
        } else {
          showFeedback({
            kind: "error",
            message: "Calendar connected. This event could not sync.",
          });
        }
      } catch {
        if (!cancelled) {
          showFeedback({
            kind: "error",
            message: `Event saved. Could not sync to ${providerLabel(calendarSetupProvider)}.`,
          });
        }
      } finally {
        if (!cancelled) {
          setSyncing(false);
          window.history.replaceState(window.history.state, "", returnPath);
        }
      }
    };

    void syncCurrentEvent();
    return () => {
      cancelled = true;
    };
  }, [
    calendarSetupFailureReason,
    calendarSetupProvider,
    calendarSetupStatus,
    eventId,
    markPromptHandled,
    returnPath,
    showFeedback,
  ]);

  const toast = syncing
    ? { kind: "syncing" as const, message: "Event saved. Syncing calendar…" }
    : feedback || (decisionLoaded && syncStatus === "needs_connection"
      ? { kind: "setup" as const, message: "Event saved. Connect a calendar to sync." }
      : syncStatus === "needs_reconnect" || syncStatus === "failed"
        ? { kind: "error" as const, message: syncStatus === "needs_reconnect"
          ? `Event saved. Reconnect ${providerLabel(syncProvider || null)} to sync.`
          : "Event saved. Calendar sync failed." }
        : null);
  const toastKey = toast ? `${eventId}:${toast.kind}:${toast.message}` : null;
  const toastDuration = toast?.kind === "error" || toast?.kind === "setup" ? 8_000 : 5_000;

  useEffect(() => {
    // A final result gets its own toast even if the progress toast was dismissed.
    setNoticeDismissed(false);
  }, [toastKey]);

  useEffect(() => {
    if (!toastKey || noticeDismissed || toastHovered || toastFocused || dialogOpen) return;
    const timeoutId = window.setTimeout(dismissNotice, toastDuration);
    return () => window.clearTimeout(timeoutId);
  }, [toastKey, toastDuration, noticeDismissed, toastHovered, toastFocused, dialogOpen, dismissNotice]);

  const connectHref = (provider: AutomaticCalendarProvider) => {
    const nextPath = addSearchParams(returnPath, {
      created: "true",
      calendarSetup: provider,
    });
    const authPath = provider === "google" ? "/api/google/auth" : "/api/outlook/auth";
    return `${authPath}?${new URLSearchParams({ next: nextPath }).toString()}`;
  };

  const handleDialogChange = (open: boolean) => {
    if (!open) {
      markPromptHandled();
      setNoticeDismissed(true);
    }
    setDialogOpen(open);
  };

  const handleAppleCalendar = () => {
    if (!appleCalendarHref) return;
    markPromptHandled();
    setDialogOpen(false);
    showFeedback({
      kind: "apple",
      message:
        "Opening Apple Calendar. Add this event to finish.",
    });
    openAppleCalendarIcs(appleCalendarHref);
  };

  if (!CONNECTED_CALENDAR_SYNC_ENABLED) return null;

  return (
    <>
      {!noticeDismissed && toast && !dialogOpen ? (
        <aside
          role="status"
          aria-live="polite"
          aria-atomic="true"
          data-calendar-toast={toast.kind}
          style={{ bottom: "max(1rem, calc(env(safe-area-inset-bottom) + 1rem))" }}
          className={CALENDAR_TOAST_CLASS}
          onMouseEnter={() => setToastHovered(true)}
          onMouseLeave={() => setToastHovered(false)}
          onFocusCapture={() => setToastFocused(true)}
          onBlurCapture={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) setToastFocused(false);
          }}
        >
          {toast.kind === "syncing" ? (
            <LoaderCircle className="h-4 w-4 shrink-0 animate-spin text-violet-600 motion-reduce:animate-none" aria-hidden="true" />
          ) : toast.kind === "error" ? (
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
          ) : toast.kind === "setup" ? (
            <CalendarClock className="h-4 w-4 shrink-0 text-violet-600" aria-hidden="true" />
          ) : (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
          )}
          <p className="min-w-0 flex-1 text-[13px] leading-5">{toast.message}</p>
          {toast.kind === "error" ? (
            <Link href="/settings#calendars" aria-label="Open calendar settings" className={TOAST_ACTION_CLASS}>
              Settings
            </Link>
          ) : toast.kind === "setup" ? (
            <button type="button" onClick={() => setDialogOpen(true)} className={TOAST_ACTION_CLASS}>
              Connect
            </button>
          ) : null}
          <NoticeCloseButton onDismiss={dismissNotice} />
        </aside>
      ) : null}

      <Dialog.Root open={dialogOpen} onOpenChange={handleDialogChange}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[12990] bg-[#160d09]/60 backdrop-blur-[5px] data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out data-[state=open]:fade-in motion-reduce:animate-none" />
          <Dialog.Content className="fixed inset-x-4 bottom-4 z-[13000] max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-[2.75rem] border border-[#eadbce] bg-[#fffdf9] px-6 pb-7 pt-8 text-[#2d211b] shadow-[0_30px_90px_rgba(38,23,15,0.32)] focus:outline-none sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-[calc(100%-2rem)] sm:max-w-[24rem] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:px-10 sm:pb-9 sm:pt-10">
            <div className="flex flex-col items-center text-center">
              <span className="flex h-20 w-20 items-center justify-center rounded-[1.6rem] bg-[#e3f0ff] text-[#4b9cf5] shadow-[inset_0_0_0_1px_rgba(75,156,245,0.05)]">
                <CalendarClock className="h-9 w-9" strokeWidth={2.1} aria-hidden="true" />
              </span>
              <Dialog.Title className="mt-7 max-w-[18rem] font-[family-name:var(--font-playfair),Georgia,serif] text-[1.65rem] font-semibold leading-tight tracking-tight text-[#241914]">
                Keep scanned events in your calendar
              </Dialog.Title>
              <Dialog.Description className="sr-only">
                Choose Google, Outlook, Apple Calendar, or dismiss calendar setup for now.
              </Dialog.Description>
            </div>

            <Dialog.Close asChild>
              <button
                type="button"
                className="absolute right-4 top-4 inline-flex h-11 w-11 items-center justify-center rounded-full text-[#75665e] transition hover:bg-[#f4ebe4] hover:text-[#2d211b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4b9cf5] focus-visible:ring-offset-2"
                aria-label="Close calendar setup"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </Dialog.Close>

            <div className="mt-8 space-y-4">
              <a
                href={connectHref("google")}
                onClick={markPromptHandled}
                aria-label="Connect Google Calendar"
                className="inline-flex min-h-14 w-full items-center justify-center rounded-full bg-[#4b9cf5] px-6 text-sm font-black uppercase tracking-[0.16em] text-[#10243b] shadow-[0_9px_22px_rgba(75,156,245,0.24)] transition hover:bg-[#3f91ec] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#246eb9] focus-visible:ring-offset-2"
              >
                Google
              </a>

              <a
                href={connectHref("microsoft")}
                onClick={markPromptHandled}
                aria-label="Connect Outlook"
                className="inline-flex min-h-14 w-full items-center justify-center rounded-full bg-[#ff8741] px-6 text-sm font-black uppercase tracking-[0.16em] text-[#29170e] shadow-[0_9px_22px_rgba(255,135,65,0.22)] transition hover:bg-[#f97931] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c95718] focus-visible:ring-offset-2"
              >
                Outlook
              </a>

              <button
                type="button"
                onClick={handleAppleCalendar}
                aria-label="Add this event to Apple Calendar"
                className="inline-flex min-h-14 w-full items-center justify-center rounded-full bg-[#4b9cf5] px-6 text-sm font-black uppercase tracking-[0.16em] text-[#10243b] shadow-[0_9px_22px_rgba(75,156,245,0.24)] transition hover:bg-[#3f91ec] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#246eb9] focus-visible:ring-offset-2"
              >
                Apple
              </button>
            </div>

            <Dialog.Close asChild>
              <button
                type="button"
                className="mt-7 inline-flex min-h-11 w-full items-center justify-center rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-[#756b66] transition hover:bg-[#f5ede7] hover:text-[#2d211b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4b9cf5] focus-visible:ring-offset-2"
              >
                Not now
              </button>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
