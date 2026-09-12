"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useUnsavedProgress } from "@/components/UnsavedProgressProvider";
import {
  normalizeScanSchedule,
  type ScanSchedule,
  type ScanScheduleItem,
  WEEKDAY_LABELS,
} from "@/lib/scan-schedule";

const inputClass =
  "mt-1 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-base text-slate-950 focus-visible:outline-2 focus-visible:outline-violet-600";

export default function ScheduleReviewDialog({
  initialSchedule,
  onSave,
  onDiscard,
  saved = false,
  savedStatus = "draft",
}: {
  initialSchedule: ScanSchedule;
  saved?: boolean;
  savedStatus?: "draft" | "published";
  onSave: (schedule: ScanSchedule, status: "draft" | "published") => Promise<string>;
  onDiscard: () => void;
}) {
  const router = useRouter();
  const [schedule, setSchedule] = useState(initialSchedule);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const clean = useRef(saved ? JSON.stringify(initialSchedule) : "");
  const locked = useRef(false);
  async function save(status: "draft" | "published") {
    if (locked.current) throw new Error("The schedule is still saving.");
    const normalized = normalizeScanSchedule(schedule);
    if (!normalized || normalized.items.length !== schedule.items.length || !schedule.title.trim())
      throw new Error("Add a title and at least one schedule row.");
    try {
      new Intl.DateTimeFormat("en", { timeZone: schedule.timezone });
    } catch {
      throw new Error("Enter a valid time zone, such as America/Chicago.");
    }
    locked.current = true;
    setBusy(true);
    try {
      const href = await onSave(normalized, status);
      clean.current = JSON.stringify(schedule);
      return href;
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }
  const navigation = useUnsavedProgress({
    dirty: JSON.stringify(schedule) !== clean.current,
    busy,
    save: async () => {
      await save(savedStatus);
    },
    discard: onDiscard,
  });
  const leave = () => navigation.requestLeave(onDiscard);
  const update = (index: number, patch: Partial<ScanScheduleItem>) =>
    setSchedule((current) => ({
      ...current,
      items: current.items.map((item, row) =>
        row === index ? { ...item, ...patch, startAt: null, endAt: null } : item,
      ),
    }));
  const submit = async (status: "draft" | "published") => {
    setError("");
    try {
      const href = await save(status);
      navigation.allowNavigation(() => router.push(href));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save the schedule.");
    }
  };
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open && !busy) leave();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[900] bg-slate-950/45 backdrop-blur-sm" />
        <Dialog.Content
          className="fixed inset-x-2 top-[max(0.5rem,env(safe-area-inset-top))] z-[901] mx-auto flex max-h-[calc(100dvh-2rem)] max-w-4xl flex-col rounded-3xl bg-[#faf9ff] text-slate-950 shadow-2xl sm:inset-x-6 sm:top-6"
          onInteractOutside={(event) => event.preventDefault()}
        >
          <header className="shrink-0 border-b border-violet-100 px-5 py-4 sm:px-7">
            <Dialog.Title className="text-2xl font-semibold">Review your schedule</Dialog.Title>
            <Dialog.Description className="mt-1 text-sm leading-6 text-slate-600">
              Check every group, date, time and location. Save progress privately or publish your
              page when it is ready.
            </Dialog.Description>
            <p className="mt-2 text-sm font-semibold" aria-live="polite">
              {schedule.items.length} rows ·{" "}
              {schedule.items.filter((item) => item.type === "practice").length} practices ·{" "}
              {schedule.items.filter((item) => item.type === "game").length} games
            </p>
          </header>
          <div className="min-h-0 overflow-y-auto px-5 py-5 sm:px-7">
            <fieldset disabled={busy} className="min-w-0">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-medium sm:col-span-2">
                  Page title
                  <input
                    className={inputClass}
                    value={schedule.title}
                    onChange={(event) => setSchedule({ ...schedule, title: event.target.value })}
                  />
                </label>
                <label className="text-sm font-medium">
                  Season or date range
                  <input
                    className={inputClass}
                    value={schedule.timeframe || ""}
                    onChange={(event) =>
                      setSchedule({ ...schedule, timeframe: event.target.value })
                    }
                  />
                </label>
                <label className="text-sm font-medium">
                  Time zone
                  <input
                    className={inputClass}
                    value={schedule.timezone}
                    onChange={(event) =>
                      setSchedule({
                        ...schedule,
                        timezone: event.target.value,
                        items: schedule.items.map((item) => ({
                          ...item,
                          timezone: event.target.value,
                        })),
                      })
                    }
                  />
                </label>
              </div>
              <div className="mt-5 space-y-4">
                {schedule.items.map((item, index) => (
                  <fieldset
                    key={item.id}
                    className="min-w-0 rounded-2xl border border-violet-100 bg-white p-4"
                  >
                    <legend className="px-2 text-sm font-semibold">
                      {index + 1}. {item.title}
                    </legend>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="text-sm">
                        Title
                        <input
                          className={inputClass}
                          value={item.title}
                          onChange={(event) => update(index, { title: event.target.value })}
                        />
                      </label>
                      <label className="text-sm">
                        Type
                        <select
                          className={inputClass}
                          value={item.type}
                          onChange={(event) =>
                            update(index, {
                              type: event.target.value === "practice" ? "practice" : "game",
                            })
                          }
                        >
                          <option value="practice">Practice</option>
                          <option value="game">Game</option>
                        </select>
                      </label>
                      {item.type === "practice" ? (
                        <>
                          <label className="text-sm">
                            Group or team
                            <input
                              className={inputClass}
                              value={item.group || ""}
                              onChange={(event) => update(index, { group: event.target.value })}
                            />
                          </label>
                          <label className="text-sm">
                            Repeats weekly
                            <select
                              className={inputClass}
                              value={item.day || ""}
                              onChange={(event) =>
                                update(index, { day: event.target.value || null })
                              }
                            >
                              <option value="">Does not repeat</option>
                              {Object.entries(WEEKDAY_LABELS).map(([code, label]) => (
                                <option key={code} value={code}>
                                  {label}
                                </option>
                              ))}
                            </select>
                          </label>
                        </>
                      ) : (
                        <>
                          <label className="text-sm">
                            Opponent
                            <input
                              className={inputClass}
                              value={item.opponent || ""}
                              onChange={(event) => update(index, { opponent: event.target.value })}
                            />
                          </label>
                          <label className="text-sm">
                            Home or away
                            <select
                              className={inputClass}
                              value={item.homeAway || ""}
                              onChange={(event) =>
                                update(index, {
                                  homeAway:
                                    event.target.value === "home"
                                      ? "home"
                                      : event.target.value === "away"
                                        ? "away"
                                        : null,
                                })
                              }
                            >
                              <option value="">Not specified</option>
                              <option value="home">Home</option>
                              <option value="away">Away</option>
                            </select>
                          </label>
                        </>
                      )}
                      <label className="text-sm">
                        Date{item.day ? " (leave blank for weekly practice)" : ""}
                        <input
                          type="date"
                          className={inputClass}
                          value={item.date || ""}
                          onChange={(event) => update(index, { date: event.target.value || null })}
                        />
                      </label>
                      <label className="text-sm">
                        Location
                        <input
                          className={inputClass}
                          value={item.locationText || ""}
                          onChange={(event) => update(index, { locationText: event.target.value })}
                        />
                      </label>
                      <label className="text-sm">
                        Start time
                        <input
                          className={inputClass}
                          placeholder="Time TBD"
                          value={item.startTime || ""}
                          onChange={(event) => update(index, { startTime: event.target.value })}
                        />
                      </label>
                      <label className="text-sm">
                        End time
                        <input
                          className={inputClass}
                          placeholder="Time TBD"
                          value={item.endTime || ""}
                          onChange={(event) => update(index, { endTime: event.target.value })}
                        />
                      </label>
                      <label className="text-sm sm:col-span-2">
                        Notes
                        <textarea
                          className={inputClass}
                          value={item.notes || ""}
                          onChange={(event) => update(index, { notes: event.target.value })}
                        />
                      </label>
                    </div>
                    <button
                      type="button"
                      className="mt-2 min-h-11 px-3 text-sm font-medium text-red-700"
                      onClick={() =>
                        setSchedule({
                          ...schedule,
                          items: schedule.items.filter((_, row) => row !== index),
                        })
                      }
                    >
                      Remove row {index + 1}
                    </button>
                  </fieldset>
                ))}
                <button
                  type="button"
                  className="min-h-11 rounded-xl border border-violet-300 px-4 font-medium"
                  onClick={() =>
                    setSchedule({
                      ...schedule,
                      items: [
                        ...schedule.items,
                        {
                          id: crypto.randomUUID(),
                          type: "game",
                          title: "New game",
                          timezone: schedule.timezone,
                          group: null,
                          day: null,
                          date: null,
                          startTime: null,
                          endTime: null,
                          startAt: null,
                          endAt: null,
                          locationText: null,
                          opponent: null,
                          homeAway: null,
                          notes: null,
                          status: "scheduled",
                        },
                      ],
                    })
                  }
                >
                  Add a row
                </button>
              </div>
            </fieldset>
          </div>
          <footer className="shrink-0 border-t border-violet-100 px-5 py-4 sm:px-7">
            {error ? (
              <p role="alert" className="mb-3 text-sm text-red-700">
                {error}
              </p>
            ) : null}
            <div className="flex flex-wrap justify-end gap-3">
              <button
                type="button"
                disabled={busy}
                onClick={leave}
                className="min-h-11 rounded-xl px-4 font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void submit(savedStatus)}
                className="min-h-11 rounded-xl border border-violet-300 px-4 font-medium disabled:opacity-50"
              >
                {savedStatus === "published" ? "Save changes" : "Save progress"}
              </button>
              {savedStatus !== "published" && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void submit("published")}
                  className="min-h-11 rounded-xl bg-violet-700 px-5 font-semibold text-white disabled:opacity-50"
                >
                  {busy ? "Saving…" : "Publish page"}
                </button>
              )}
            </div>
          </footer>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
