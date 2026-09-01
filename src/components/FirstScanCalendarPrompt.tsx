"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { AlertTriangle, CalendarClock, CheckCircle2, LoaderCircle, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { openAppleCalendarIcs } from "@/utils/calendar-open";

type AutomaticCalendarProvider = "google" | "microsoft";
type CalendarSyncStatus = "needs_connection" | "needs_reconnect" | "failed";
type OAuthConnectionStatus = "stored" | "not-stored" | null;
type FeedbackState = {
  kind: "success" | "error" | "apple";
  message: string;
};

const PROMPT_STORAGE_KEY = "envitefy:first-scan-calendar-prompt:v1";
const FLOATING_NOTICE_CLASS =
  "fixed left-1/2 z-[13010] w-[calc(100%-2rem)] max-w-3xl -translate-x-1/2 rounded-2xl border px-4 py-3 pr-14 text-sm shadow-[0_18px_55px_rgba(44,28,18,0.2)] backdrop-blur-md animate-in fade-in slide-in-from-top-2 motion-reduce:animate-none";

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
      className="absolute right-1.5 top-1.5 inline-flex h-11 w-11 items-center justify-center rounded-full text-current opacity-60 transition hover:bg-black/5 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-2"
    >
      <X className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}

export default function FirstScanCalendarPrompt({
  userId,
  eventId,
  returnPath,
  syncStatus,
  syncProvider,
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
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [noticeDismissed, setNoticeDismissed] = useState(false);
  const syncStartedRef = useRef(false);
  const promptKey = useMemo(() => `${PROMPT_STORAGE_KEY}:${userId}`, [userId]);

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
    if (!calendarSetupProvider || syncStartedRef.current) return;
    syncStartedRef.current = true;
    markPromptHandled();

    if (calendarSetupStatus === "not-stored") {
      const permissionDenied = calendarSetupFailureReason === "missing-calendar-scope";
      setSyncing(false);
      showFeedback({
        kind: "error",
        message: permissionDenied
          ? `${providerLabel(calendarSetupProvider)} access was not granted. Connect again and allow calendar event access.`
          : `${providerLabel(calendarSetupProvider)} was not connected to your Envitefy account. Try connecting again from Calendar settings.`,
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
            message: `Connected and added to ${providerLabel(calendarSetupProvider)}. Future scanned events will sync automatically.`,
          });
        } else if (payload.status === "needs_connection") {
          showFeedback({
            kind: "error",
            message: `${providerLabel(calendarSetupProvider)} was not connected to your Envitefy account. Try connecting again from Calendar settings.`,
          });
        } else if (payload.status === "needs_reconnect") {
          showFeedback({
            kind: "error",
            message: `${providerLabel(calendarSetupProvider)} needs to be reconnected before this event can be added.`,
          });
        } else if (payload.status === "skipped") {
          showFeedback({
            kind: "error",
            message: `${providerLabel(calendarSetupProvider)} connected, but this event needs a valid date and time before it can be added.`,
          });
        } else {
          showFeedback({
            kind: "error",
            message: `${providerLabel(calendarSetupProvider)} connected, but this event could not be added. Try again from Calendar settings.`,
          });
        }
      } catch {
        if (!cancelled) {
          showFeedback({
            kind: "error",
            message: `We could not finish syncing this event to ${providerLabel(calendarSetupProvider)}. Try again from Calendar settings.`,
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

  useEffect(() => {
    if (!feedback || feedback.kind === "error" || noticeDismissed) return;
    const timeoutId = window.setTimeout(() => setNoticeDismissed(true), 5_000);
    return () => window.clearTimeout(timeoutId);
  }, [feedback, noticeDismissed]);

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
        "This event is ready for Apple Calendar. Apple events are added one at a time rather than synced in the background.",
    });
    openAppleCalendarIcs(appleCalendarHref);
  };

  const reconnectCopy =
    syncStatus === "needs_reconnect"
      ? `${providerLabel(syncProvider || null)} needs to be reconnected before events can sync.`
      : "Your calendar was not updated. You can retry from Calendar settings.";

  return (
    <>
      {!noticeDismissed ? (
        syncing ? (
          <aside
            role="status"
            aria-live="polite"
            aria-atomic="true"
            style={{ top: "max(1rem, env(safe-area-inset-top))" }}
            className={`${FLOATING_NOTICE_CLASS} flex items-center gap-3 border-violet-200 bg-violet-50/95 text-violet-950`}
          >
            <LoaderCircle className="h-5 w-5 shrink-0 animate-spin" aria-hidden="true" />
            <p>
              Adding this event to your calendar in the background…
            </p>
            <NoticeCloseButton onDismiss={() => setNoticeDismissed(true)} />
          </aside>
        ) : feedback ? (
          <aside
            role={feedback.kind === "error" ? "alert" : "status"}
            aria-live={feedback.kind === "error" ? "assertive" : "polite"}
            aria-atomic="true"
            style={{ top: "max(1rem, env(safe-area-inset-top))" }}
            className={`${FLOATING_NOTICE_CLASS} flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${
              feedback.kind === "error"
                ? "border-amber-200 bg-amber-50/95 text-amber-950"
                : "border-emerald-200 bg-emerald-50/95 text-emerald-950"
            }`}
          >
            <div className="flex min-w-0 items-start gap-3">
              {feedback.kind === "error" ? (
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              ) : (
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              )}
              <p>{feedback.message}</p>
            </div>
            {feedback.kind === "error" ? (
              <Link
                href="/settings#calendars"
                className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-amber-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-950 focus-visible:ring-offset-2"
              >
                Calendar settings
              </Link>
            ) : null}
            <NoticeCloseButton onDismiss={() => setNoticeDismissed(true)} />
          </aside>
        ) : decisionLoaded && syncStatus === "needs_connection" && !dialogOpen ? (
          <aside
            role="status"
            aria-live="polite"
            aria-atomic="true"
            style={{ top: "max(1rem, env(safe-area-inset-top))" }}
            className={`${FLOATING_NOTICE_CLASS} flex flex-col gap-3 border-amber-200 bg-amber-50/95 text-amber-950 sm:flex-row sm:items-center sm:justify-between`}
          >
            <p>
              <span className="font-semibold">Your Envitefy event was saved.</span>{" "}
              Calendar syncing is not set up yet.
            </p>
            <button
              type="button"
              onClick={() => {
                setNoticeDismissed(true);
                setDialogOpen(true);
              }}
              className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-amber-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-950 focus-visible:ring-offset-2"
            >
              Set up calendar
            </button>
            <NoticeCloseButton onDismiss={() => setNoticeDismissed(true)} />
          </aside>
        ) : syncStatus === "needs_reconnect" || syncStatus === "failed" ? (
          <aside
            role="alert"
            aria-live="assertive"
            aria-atomic="true"
            style={{ top: "max(1rem, env(safe-area-inset-top))" }}
            className={`${FLOATING_NOTICE_CLASS} flex flex-col gap-3 border-amber-200 bg-amber-50/95 text-amber-950 sm:flex-row sm:items-center sm:justify-between`}
          >
            <p>
              <span className="font-semibold">Your Envitefy event was saved.</span>{" "}
              {reconnectCopy}
            </p>
            <Link
              href="/settings#calendars"
              className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-amber-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-950 focus-visible:ring-offset-2"
            >
              Calendar settings
            </Link>
            <NoticeCloseButton onDismiss={() => setNoticeDismissed(true)} />
          </aside>
        ) : null
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
