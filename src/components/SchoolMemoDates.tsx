"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useContext, useEffect, useRef, useState } from "react";
import { SessionContext } from "next-auth/react";
import { useCalendarPreference } from "@/hooks/useCalendarPreference";
import {
  scanScheduleCalendarEvent,
  scanScheduleWhen,
  type ScanSchedule,
} from "@/lib/scan-schedule";

const actionClass =
  "inline-flex min-h-11 items-center justify-center rounded-xl border border-current/25 px-4 py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 disabled:opacity-50";

export default function SchoolMemoDates({
  schedule,
  interactive = true,
  eventId,
  canManage = false,
}: {
  schedule: ScanSchedule;
  interactive?: boolean;
  eventId?: string;
  canManage?: boolean;
}) {
  const eligible = schedule.items.filter((item) =>
    scanScheduleCalendarEvent(item, schedule, eventId),
  );
  const [selected, setSelected] = useState(
    () =>
      new Set(eligible.filter((item) => item.calendarSelected !== false).map((item) => item.id)),
  );
  const [chooser, setChooser] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const request = useRef<AbortController | null>(null);
  const locked = useRef(false);
  const chooserTrigger = useRef<HTMLElement | null>(null);
  const preference = useCalendarPreference();
  const accountKey = useContext(SessionContext)?.data?.user?.email || "";
  useEffect(() => {
    request.current = null;
    locked.current = false;
    setBusy(false);
    setSelected(
      new Set(
        schedule.items
          .filter(
            (item) =>
              item.calendarSelected !== false && scanScheduleCalendarEvent(item, schedule, eventId),
          )
          .map((item) => item.id),
      ),
    );
    setMessage("");
    setError("");
    return () => {
      request.current?.abort();
      locked.current = false;
    };
  }, [schedule, eventId, accountKey]);
  const selectedItems = eligible.filter((item) => selected.has(item.id));
  const connected =
    canManage && eventId && preference.signedIn
      ? (["google", "microsoft"] as const).filter((provider) => preference.canRemember(provider))
      : [];
  const add = async (provider: "google" | "microsoft" | "file") => {
    if (locked.current || !selectedItems.length) return;
    locked.current = true;
    setBusy(true);
    setMessage("");
    setError("");
    setChooser(false);
    const controller = new AbortController();
    request.current = controller;
    const signal = AbortSignal.any([
      controller.signal,
      AbortSignal.timeout(provider === "file" ? 30_000 : 160_000),
    ]);
    try {
      if (provider === "file") {
        const events = selectedItems.map((item) => ({
          ...scanScheduleCalendarEvent(item, schedule, eventId),
          ...(eventId
            ? {
                envitefyUrl: new URL(
                  `/event/${encodeURIComponent(eventId)}`,
                  window.location.origin,
                ).toString(),
              }
            : {}),
        }));
        const response = await fetch("/api/events/ics/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ events, filename: "school-memo-dates" }),
          signal,
        });
        if (!response.ok) throw new Error("Could not prepare your calendar file. Please retry.");
        const url = URL.createObjectURL(await response.blob());
        const link = document.createElement("a");
        link.href = url;
        link.download = "school-memo-dates.ics";
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
        if (!controller.signal.aborted)
          setMessage(
            `Calendar file downloaded with ${selectedItems.length} selected ${selectedItems.length === 1 ? "date" : "dates"}. Open it in your calendar to import.`,
          );
      } else {
        const response = await fetch(
          `/api/events/${encodeURIComponent(eventId || "")}/calendar-items`,
          {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ provider, itemIds: selectedItems.map((item) => item.id) }),
            signal,
          },
        );
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || "Could not add these dates. Please retry.");
        const results: { status: string; message?: string }[] = body.results || [];
        if (!Array.isArray(results) || results.length !== selectedItems.length)
          throw new Error(
            "The calendar response was incomplete. Retry your selection; already added dates will be retained.",
          );
        const added = results.filter((item) => item.status === "added").length;
        const updated = results.filter((item) => item.status === "updated").length;
        const unchanged = results.filter((item) => item.status === "unchanged").length;
        const failed = results.length - added - updated - unchanged;
        if (!controller.signal.aborted) {
          setMessage(
            [
              added ? `${added} added` : "",
              updated ? `${updated} updated` : "",
              unchanged ? `${unchanged} already added` : "",
              failed ? `${failed} need retry` : "",
            ]
              .filter(Boolean)
              .join(" · "),
          );
          if (failed)
            setError(
              results.find((item) => item.message)?.message ||
                "Some dates could not be added. Retry your selection; completed dates will not be duplicated.",
            );
        }
      }
    } catch (cause) {
      if (!controller.signal.aborted)
        setError(
          signal.aborted
            ? "The calendar took too long to respond. Retry your selection; already added dates will be retained."
            : cause instanceof Error
              ? cause.message
              : "Could not add these dates. Please retry.",
        );
    } finally {
      if (request.current === controller) {
        request.current = null;
        locked.current = false;
        if (!controller.signal.aborted) setBusy(false);
      }
    }
  };
  const showChooser = () => {
    chooserTrigger.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setChooser(true);
  };
  const open = () => {
    const preferred = connected.find((provider) => provider === preference.provider);
    if (preferred || connected.length === 1) void add(preferred || connected[0]);
    else showChooser();
  };
  return (
    <section
      id="schedule"
      aria-label="School memo dates"
      data-school-memo-dates
      className="col-span-full min-w-0 rounded-[2rem] border border-white/60 bg-white p-5 text-slate-950 shadow-sm sm:p-7"
    >
      <h2 className="text-2xl font-semibold">Dates from this memo</h2>
      <p className="mt-2 text-sm text-slate-600">
        {schedule.items.length
          ? `${schedule.items.length} dates · Choose which dates to add to your calendar.`
          : "No dated items were found in this memo."}
      </p>
      {interactive && eligible.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className={actionClass}
            disabled={busy || selectedItems.length === eligible.length}
            onClick={() => setSelected(new Set(eligible.map((item) => item.id)))}
          >
            Select all
          </button>
          <button
            type="button"
            className={actionClass}
            disabled={busy || !selectedItems.length}
            onClick={() => setSelected(new Set())}
          >
            Clear all
          </button>
        </div>
      )}
      <ul className="mt-4 space-y-3">
        {schedule.items.map((item) => {
          const valid = eligible.some((candidate) => candidate.id === item.id);
          return (
            <li key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <label className="flex min-h-11 cursor-pointer items-start gap-3">
                {interactive && (
                  <input
                    type="checkbox"
                    aria-label={`Add ${item.title} to calendar`}
                    checked={selected.has(item.id)}
                    disabled={busy || !valid}
                    className="mt-1 size-5 shrink-0 accent-violet-700"
                    onChange={(event) =>
                      setSelected((current) => {
                        const next = new Set(current);
                        if (event.target.checked) next.add(item.id);
                        else next.delete(item.id);
                        return next;
                      })
                    }
                  />
                )}
                <span className="min-w-0">
                  <span className="block font-semibold">{item.title}</span>
                  <span className="mt-1 block text-base">{scanScheduleWhen(item, schedule)}</span>
                </span>
              </label>
              {item.yearInferred && (
                <p className="mt-1 text-sm text-slate-600">
                  Year inferred from the memo context. Review before adding.
                </p>
              )}
              {item.notes && (
                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">
                  {item.notes}
                </p>
              )}
              {item.sourceText && (
                <details className="mt-2 text-sm text-slate-600">
                  <summary className="min-h-11 cursor-pointer py-3">Source text</summary>
                  <p className="whitespace-pre-line pb-2">{item.sourceText}</p>
                </details>
              )}
              {!valid && (
                <p className="mt-2 text-sm text-slate-600">
                  Edit this item to confirm its date before adding it.
                </p>
              )}
            </li>
          );
        })}
      </ul>
      {interactive && eligible.length > 0 && (
        <div className="mt-5">
          <button
            type="button"
            disabled={busy || !selectedItems.length}
            onClick={open}
            className={`${actionClass} w-full border-violet-700 bg-violet-700 text-white sm:w-auto`}
          >
            {busy ? "Adding dates…" : `Add selected dates to calendar (${selectedItems.length})`}
          </button>
          {connected.length > 0 && (
            <button
              type="button"
              disabled={busy || !selectedItems.length}
              className={`${actionClass} mt-2 w-full sm:ml-2 sm:mt-0 sm:w-auto`}
              onClick={showChooser}
              aria-haspopup="dialog"
              aria-expanded={chooser}
            >
              Calendar options
            </button>
          )}
          <p className="mt-2 text-sm text-slate-600">Unchecked dates stay in your memo.</p>
          {message && (
            <p role="status" className="mt-3 text-sm">
              {message}
            </p>
          )}
          {error && (
            <p role="alert" className="mt-3 text-sm text-red-700">
              {error}
            </p>
          )}
        </div>
      )}
      <Dialog.Root open={chooser} onOpenChange={setChooser}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[13000] bg-black/50" />
          <Dialog.Content
            className="fixed left-1/2 top-1/2 z-[13001] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-violet-100 bg-white p-5 text-slate-950 shadow-xl"
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              if (!locked.current) chooserTrigger.current?.focus();
            }}
          >
            <Dialog.Title className="text-lg font-semibold">
              Add {selectedItems.length} selected dates
            </Dialog.Title>
            <Dialog.Description className="mt-2 text-sm text-slate-600">
              Use a connected calendar or download a file to import into Apple, Google or Outlook
              Calendar.
            </Dialog.Description>
            <div className="mt-4 flex flex-col gap-2">
              {connected.map((provider) => (
                <button
                  key={provider}
                  type="button"
                  className={actionClass}
                  onClick={() => void add(provider)}
                >
                  {provider === "google" ? "Google Calendar" : "Outlook Calendar"}
                </button>
              ))}
              <button type="button" className={actionClass} onClick={() => void add("file")}>
                Download calendar file (.ics)
              </button>
              <Dialog.Close className={actionClass}>Cancel</Dialog.Close>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </section>
  );
}
