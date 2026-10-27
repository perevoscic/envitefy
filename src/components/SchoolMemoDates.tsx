"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useContext, useEffect, useId, useRef, useState } from "react";
import { SessionContext } from "next-auth/react";
import { useCalendarPreference } from "@/hooks/useCalendarPreference";
import {
  scanScheduleCalendarEvent,
  scanScheduleWhen,
  normalizeScanSchedule,
  type ScanScheduleItem,
  type ScanSchedule,
} from "@/lib/scan-schedule";

import { schoolMemoDateNotes } from "@/lib/school-memo-content";

const actionClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#ded5e0] bg-white px-4 py-2 text-sm font-medium text-[#513951] hover:bg-[#f7f3f7] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#704568] disabled:cursor-not-allowed disabled:opacity-45";

// The chooser is portalled outside the memo's authored color boundary.
const dialogActionClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[var(--app-border,#ded5e0)] bg-[var(--app-surface-alt,#f7f3f7)] px-4 py-2 text-sm font-medium text-[var(--app-foreground,#513951)] hover:bg-[var(--app-surface-raised,#efe8ef)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--app-focus-ring,#704568)] disabled:cursor-not-allowed disabled:opacity-45";

function MemoDateFields({ item, schedule, onChange }: {
  item: ScanScheduleItem;
  schedule: ScanSchedule;
  onChange: (item: ScanScheduleItem) => void;
}) {
  const id = useId();
  const update = (patch: Partial<ScanScheduleItem>) => {
    // Rebuild timestamps from the edited local date/time while retaining the stable ID.
    const next = normalizeScanSchedule({ ...schedule, items: [{ ...item, ...patch, startAt: null, endAt: null }] });
    if (next?.items[0]) onChange({ ...item, ...patch, startAt: next.items[0].startAt, endAt: next.items[0].endAt });
  };
  const fieldClass = "mt-1 min-h-11 w-full min-w-0 rounded-lg border border-[#ded5e0] bg-white px-3 py-2 text-sm text-[#302633]";
  return <div id={id} className="space-y-3 border-t border-[#e9e3e8] p-4 text-sm text-[#302633] sm:p-5" data-memo-date-editor>
    <label className="block" htmlFor={`${id}-title`}>Title
      <input id={`${id}-title`} className={fieldClass} value={item.title} onChange={event => { if (event.target.value.trim()) update({ title: event.target.value }); }} />
    </label>
    <div className="grid min-w-0 grid-cols-1 gap-3 @sm:grid-cols-2">
      <label className="block min-w-0" htmlFor={`${id}-date`}>Date
        <input id={`${id}-date`} type="date" className={fieldClass} value={item.date || ""} onChange={event => {
          const date = event.target.value || null;
          update({ date, yearInferred: false, endDate: date && item.endDate && item.endDate < date ? null : item.endDate });
        }} />
      </label>
      <label className="block min-w-0" htmlFor={`${id}-end-date`}>Last day (optional)
        <input id={`${id}-end-date`} type="date" min={item.date || undefined} className={fieldClass} value={item.endDate || ""} onChange={event => {
          const endDate = event.target.value || null;
          if (!endDate || !item.date || endDate >= item.date) update({ endDate });
        }} />
      </label>
      <label className="block min-w-0" htmlFor={`${id}-start`}>Start time (optional)
        <input id={`${id}-start`} className={fieldClass} value={item.startTime || ""} placeholder="e.g. 14:00 or during lunch" onChange={event => update({ startTime: event.target.value || null })} />
      </label>
      <label className="block min-w-0" htmlFor={`${id}-end`}>End time (optional)
        <input id={`${id}-end`} className={fieldClass} value={item.endTime || ""} placeholder="e.g. 15:00" onChange={event => update({ endTime: event.target.value || null })} />
      </label>
    </div>
    <label className="block" htmlFor={`${id}-location`}>Location (optional)
      <input id={`${id}-location`} className={fieldClass} value={item.locationText || ""} onChange={event => update({ locationText: event.target.value || null })} />
    </label>
    <div>
      <label className="block" htmlFor={`${id}-notes`}>Notes</label>
      <textarea id={`${id}-notes`} className={fieldClass} rows={3} value={item.notes || ""} onChange={event => update({ notes: event.target.value || null })} />
    </div>
    <p className="text-xs leading-5 text-[#756b79]">Use Save draft or Publish to save your changes.</p>
  </div>;
}

export default function SchoolMemoDates({
  schedule,
  interactive = true,
  eventId,
  canManage = false,
  onSaveDraft,
  onSelectionChange,
  onScheduleChange,
  calendarNeedsSave = false,
}: {
  schedule: ScanSchedule;
  interactive?: boolean;
  eventId?: string;
  canManage?: boolean;
  onSaveDraft?: () => Promise<void>;
  onSelectionChange?: (itemIds: string[]) => void;
  onScheduleChange?: (schedule: ScanSchedule) => void;
  calendarNeedsSave?: boolean;
}) {
  const calendarEnabled = interactive;
  const [editingId, setEditingId] = useState<string | null>(null);
  const eligible = schedule.items.filter((item) =>
    scanScheduleCalendarEvent(item, schedule, eventId),
  );
  const [selected, setSelected] = useState(
    () =>
      new Set(eligible.filter((item) => item.calendarSelected !== false).map((item) => item.id)),
  );
  const [additions, setAdditions] = useState<Record<string, string>>({});
  const [chooser, setChooser] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const request = useRef<AbortController | null>(null);
  const locked = useRef(false);
  const chooserTrigger = useRef<HTMLElement | null>(null);
  const preference = useCalendarPreference();
  const accountKey = useContext(SessionContext)?.data?.user?.email || "";
  const selectionKey = `${accountKey}:${schedule.items.map(item => `${item.id}:${item.calendarSelected !== false}:${Boolean(scanScheduleCalendarEvent(item, schedule, eventId))}`).join("|")}`;
  const previousSelectionKey = useRef(selectionKey);
  const previousEventId = useRef(eventId);
  useEffect(() => {
    request.current = null;
    locked.current = false;
    setBusy(false);
    setSettingDefault(false);
    if (previousSelectionKey.current !== selectionKey || (previousEventId.current && previousEventId.current !== eventId)) {
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
    }
    previousSelectionKey.current = selectionKey;
    previousEventId.current = eventId;
    setMessage("");
    setError("");
    if (!calendarEnabled) setChooser(false);
    return () => {
      request.current?.abort();
      locked.current = false;
    };
  }, [schedule, eventId, accountKey, selectionKey, calendarEnabled]);
  useEffect(() => {
    setAdditions({});
    if (!calendarEnabled || !eventId || !canManage || !preference.signedIn) return;
    const controller = new AbortController();
    void fetch(`/api/events/${encodeURIComponent(eventId)}/calendar-items`, {
      credentials: "include",
      cache: "no-store",
      signal: controller.signal,
    }).then(async (response) => {
      if (!response.ok) return;
      const body = await response.json();
      if (controller.signal.aborted || !Array.isArray(body.additions)) return;
      const saved: Record<string, string> = {};
      for (const item of body.additions) {
        if (typeof item.id === "string" && typeof item.addedAt === "string" && Number.isFinite(Date.parse(item.addedAt)))
          saved[item.id] = item.addedAt;
      }
      setAdditions((current) => {
        const next = { ...saved };
        for (const [id, time] of Object.entries(current)) {
          if (!next[id] || Date.parse(time) < Date.parse(next[id])) next[id] = time;
        }
        return next;
      });
    }).catch(() => {});
    return () => controller.abort();
  }, [eventId, canManage, accountKey, preference.signedIn, calendarEnabled]);
  const choose = (next: Set<string>) => {
    setSelected(next);
    onSelectionChange?.([...next]);
  };
  const selectedItems = eligible.filter((item) => selected.has(item.id));
  const [settingDefault, setSettingDefault] = useState(false);
  const needsConnectedCalendar = Boolean(canManage && eventId && preference.signedIn);
  const connected =
    canManage && eventId && preference.signedIn
      ? (["google", "microsoft"] as const).filter((provider) => preference.canRemember(provider))
      : [];
  const add = async (provider: "google" | "microsoft" | "file") => {
    if (!calendarEnabled || locked.current || !selectedItems.length) return;
    if (provider !== "file" && calendarNeedsSave) {
      setError("Save your changes before adding dates to a connected calendar.");
      return;
    }
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
        const results: { id: string; status: string; message?: string; addedAt?: string }[] = body.results || [];
        if (!Array.isArray(results) || results.length !== selectedItems.length)
          throw new Error(
            "The calendar response was incomplete. Retry your selection; already added dates will be retained.",
          );
        const added = results.filter((item) => item.status === "added").length;
        const updated = results.filter((item) => item.status === "updated").length;
        const unchanged = results.filter((item) => item.status === "unchanged").length;
        const failed = results.length - added - updated - unchanged;
        if (!controller.signal.aborted) {
          setAdditions((current) => {
            const next = { ...current };
            for (const item of results) {
              if (["added", "updated", "unchanged"].includes(item.status) &&
                  selectedItems.some((selected) => selected.id === item.id) &&
                  item.addedAt && Number.isFinite(Date.parse(item.addedAt)) &&
                  (!next[item.id] || Date.parse(item.addedAt) < Date.parse(next[item.id])))
                next[item.id] = item.addedAt;
            }
            return next;
          });
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
    if (preferred) void add(preferred);
    else showChooser();
  };
  const setDefaultAndAdd = async (provider: "google" | "microsoft") => {
    if (locked.current) return;
    locked.current = true;
    setSettingDefault(true);
    setError("");
    const controller = new AbortController();
    request.current = controller;
    const saved = await preference.remember(provider);
    if (controller.signal.aborted || request.current !== controller) return;
    request.current = null;
    locked.current = false;
    setSettingDefault(false);
    if (!saved) {
      setError("Could not save your default calendar. Please retry.");
      return;
    }
    await add(provider);
  };
  return (
    <section
      id="schedule"
      aria-label="School memo dates"
      data-school-memo-dates
      className="@container col-span-full min-w-0 rounded-3xl border border-[#e8e0e5] bg-[#fffefd] p-5 font-sans text-[#302633] shadow-[0_8px_36px_-20px_rgba(61,36,58,0.18)] sm:p-8"
    >
      <header className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="flex min-w-0 items-start gap-3 sm:gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#f3edf3] text-[#704568]" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="size-5">
              <rect x="3" y="5" width="18" height="16" rx="2" />
              <path d="M16 3v4M8 3v4M3 11h18M8 15h.01M12 15h.01M16 15h.01M8 18h.01M12 18h.01" />
            </svg>
          </span>
          <div className="min-w-0">
            <h2 className="!m-0 !font-serif !text-2xl !font-medium !normal-case !leading-tight !tracking-tight !text-[#302633] sm:!text-3xl">{onScheduleChange ? "Dates from this memo" : "Dates from this memo"}</h2>
            <p className="mt-1 text-sm leading-6 text-[#756b79]">
              {schedule.items.length
                ? onScheduleChange ? "Review and edit these dates before publishing. Publishing won’t add them to your calendar." : published ? "Choose the dates you’d like to add to your calendar." : "Calendar actions will be available after publishing."
                : "No dated items were found in this memo."}
            </p>
          </div>
        </div>
        {schedule.issueDate && (
          <p className="pl-14 text-xs leading-6 text-[#756b79] @[680px]:pl-0">
            Memo issued <span className="font-medium text-[#514555]">{new Date(`${schedule.issueDate}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })}</span>
          </p>
        )}
      </header>
      {calendarEnabled && eligible.length > 0 && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-x-2 gap-y-0 border-t border-[#eee8ed] pt-2">
          <p className="text-xs font-medium tabular-nums text-[#756b79]" aria-live="polite" aria-atomic="true">
            {selectedItems.length} of {eligible.length} dates selected
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="min-h-11 rounded-lg px-2.5 text-xs font-medium text-[#704568] hover:bg-[#f7f3f7] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#704568] disabled:cursor-not-allowed disabled:opacity-40"
              disabled={busy || settingDefault || selectedItems.length === eligible.length}
              onClick={() => choose(new Set(eligible.map((item) => item.id)))}
            >
              Select all
            </button>
            <button
              type="button"
              className="min-h-11 rounded-lg px-2.5 text-xs font-medium text-[#704568] hover:bg-[#f7f3f7] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#704568] disabled:cursor-not-allowed disabled:opacity-40"
              disabled={busy || settingDefault || !selectedItems.length}
              onClick={() => choose(new Set())}
            >
              Clear all
            </button>
          </div>
        </div>
      )}
      <ul className="mt-2 grid list-none grid-cols-1 gap-2.5 !p-0 @[680px]:grid-cols-2 @[1024px]:grid-cols-3">
        {schedule.items.map((item) => {
          const notes = schoolMemoDateNotes(item.notes, item.sourceText);
          const valid = eligible.some((candidate) => candidate.id === item.id);
          const calendarDate = item.date ? new Date(`${item.date}T12:00:00Z`) : null;
          const displayDate = calendarDate && Number.isFinite(calendarDate.getTime()) ? calendarDate : null;
          const isSelected = calendarEnabled && selected.has(item.id) && valid;
          return (
            <li
              key={item.id}
              className={`relative min-w-0 overflow-hidden rounded-2xl border focus-within:ring-2 focus-within:ring-[#704568] focus-within:ring-offset-2 motion-safe:transition-colors ${isSelected ? "border-[#dfd1dd] bg-[#faf7fa]" : "border-[#e9e3e8] bg-white"} ${calendarEnabled && valid && !busy && !settingDefault ? "hover:border-[#bba2b6]" : ""}`}
            >
              <label className={`flex min-h-24 items-start gap-3 p-4 sm:gap-4 sm:p-5 ${onScheduleChange ? "!pr-16" : ""} ${calendarEnabled && valid && !busy && !settingDefault ? "cursor-pointer" : "cursor-default"}`}>
                {displayDate && (
                  <span aria-hidden="true" className={`flex w-12 shrink-0 flex-col items-center justify-center rounded-xl border py-2 ${isSelected ? "border-[#e7dce5] bg-white text-[#64405e]" : "border-[#eee8ed] bg-[#faf8fa] text-[#756b79]"}`}>
                    <span className="text-[10px] font-semibold uppercase leading-4 tracking-[0.12em]">{displayDate.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" })}</span>
                    <span className="text-2xl font-medium leading-7 tabular-nums">{displayDate.getUTCDate()}</span>
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block break-words text-[15px] font-semibold leading-6 text-[#302633]">{item.title}</span>
                  <span className="mt-0.5 block text-sm leading-6 text-[#6c6071]">{scanScheduleWhen(item, schedule)}</span>
                  {notes && <span className="mt-1.5 block whitespace-pre-line text-xs leading-5 text-[#756b79]">{notes}</span>}
                  {calendarEnabled && canManage && additions[item.id] && (
                    <span className="mt-2 block text-xs font-medium leading-5 text-emerald-800">
                      Added on <time dateTime={additions[item.id]}>{new Date(additions[item.id]).toLocaleString(undefined, {
                        month: "short", day: "numeric", year: "numeric",
                        hour: "numeric", minute: "2-digit", timeZoneName: "short",
                      })}</time>
                    </span>
                  )}
                  {!valid && onScheduleChange && <span className="mt-2 block text-xs leading-5 text-[#756b79]">Edit this item to confirm its date before adding it.</span>}
                </span>
                {calendarEnabled && (
                  <input
                    type="checkbox"
                    aria-label={`Add ${item.title} to calendar`}
                    checked={selected.has(item.id)}
                    disabled={busy || settingDefault || !valid}
                    className={`mt-1 size-5 shrink-0 accent-[#704568] ${onScheduleChange ? "absolute right-4 top-4 sm:right-5 sm:top-5" : ""}`}
                    onChange={(event) => {
                      const next = new Set(selected);
                      if (event.target.checked) next.add(item.id);
                      else next.delete(item.id);
                      choose(next);
                    }}
                  />
                )}
              </label>
              {onScheduleChange && (
                <button type="button" className={`absolute right-1 flex size-11 items-center justify-center rounded-full text-[#704568] hover:bg-[#eee5ed] focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-[#704568] disabled:cursor-not-allowed disabled:opacity-45 sm:right-2 ${calendarEnabled ? "top-11" : "top-2"}`} aria-label={`${editingId === item.id ? "Done editing" : "Edit"} ${item.title}`} title={editingId === item.id ? "Done editing" : "Edit date"} aria-expanded={editingId === item.id} disabled={busy || settingDefault} onClick={() => setEditingId(editingId === item.id ? null : item.id)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="size-4" aria-hidden="true">
                    {editingId === item.id ? <path d="m5 12 4 4L19 6" /> : <><path d="m16 3 5 5M4 20l4-1L20 7a2.1 2.1 0 0 0-3-3L5 16l-1 4Z" /></>}
                  </svg>
                </button>
              )}
              {onScheduleChange && editingId === item.id && <>
                <MemoDateFields item={item} schedule={schedule} onChange={next => onScheduleChange({ ...schedule, items: schedule.items.map(current => current.id === item.id ? { ...current, ...next } : current) })} />
                <button type="button" className={`${actionClass} mb-4 ml-4`} onClick={() => {
                  onScheduleChange({ ...schedule, items: schedule.items.filter(current => current.id !== item.id) });
                  setEditingId(null);
                }}>Remove date</button>
              </>}
            </li>
          );
        })}
      </ul>
      {onScheduleChange && <button type="button" className={`${actionClass} mt-4`} disabled={schedule.items.length >= 50} onClick={() => {
        const id = crypto.randomUUID();
        const next = normalizeScanSchedule({ ...schedule, items: [...schedule.items, { id, title: "New date", type: "event", date: null, calendarSelected: true }] });
        if (next) { onScheduleChange(next); setEditingId(id); }
      }}>Add date</button>}
      {calendarEnabled && eligible.length > 0 && (
        <div className="mt-6 border-t border-[#eee8ed] pt-5">
          {onSaveDraft && !eventId && (
            <div className="mb-3">
              <p className="mb-2 text-sm text-slate-600">Save a draft to add dates directly to your connected Google or Outlook calendar. You can download a calendar file now.</p>
              <button type="button" className={actionClass} onClick={() => void onSaveDraft()} disabled={busy}>Save draft for connected calendars</button>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={busy || settingDefault || preference.loading || !selectedItems.length || (needsConnectedCalendar && calendarNeedsSave)}
              onClick={open}
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#64405e] bg-[#64405e] px-5 py-3 text-sm font-semibold leading-5 text-white shadow-sm hover:bg-[#50324b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#704568] disabled:cursor-not-allowed disabled:opacity-45 @[680px]:w-auto"
            >
              {busy ? "Adding dates…" : `Add selected dates to your calendar (${selectedItems.length})`}
            </button>
            {needsConnectedCalendar && (
              <button
                type="button"
                disabled={busy || settingDefault || !selectedItems.length}
                className={`${actionClass} w-full @[680px]:w-auto`}
                onClick={() => void add("file")}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="size-4 shrink-0" aria-hidden="true">
                  <path d="M12 3v12m-5-5 5 5 5-5M4 15v5a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-5" />
                </svg>
                Download calendar file (.ics)
              </button>
            )}
          </div>
          {needsConnectedCalendar && calendarNeedsSave && <p className="mt-3 text-sm leading-6 text-[#756b79]">Save your changes before adding dates to a connected calendar. You can download a calendar file now.</p>}
          <p className="mt-3 text-xs leading-5 text-[#756b79]">Unchecked dates stay in your memo.</p>
          {message && (
            <p role="status" className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-900">
              {message}
            </p>
          )}
          {error && (
            <p role="alert" className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm leading-6 text-red-800">
              {error}
            </p>
          )}
        </div>
      )}
      <Dialog.Root open={chooser} onOpenChange={(open) => { if (!settingDefault) setChooser(open); }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[13000] bg-black/50" />
          <Dialog.Content
            data-app-dialog="school-memo-calendar"
            className="fixed left-1/2 top-1/2 z-[13001] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-[var(--app-border,#e8e0e5)] bg-[var(--app-surface,#fffefd)] p-6 text-[var(--app-foreground,#302633)] shadow-xl"
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              if (!locked.current) chooserTrigger.current?.focus();
            }}
          >
            <Dialog.Title className="text-lg font-semibold">
              {needsConnectedCalendar ? "Set your default calendar" : `Add ${selectedItems.length} selected dates`}
            </Dialog.Title>
            <Dialog.Description className="mt-2 text-sm text-[var(--app-muted-foreground,#756b79)]">
              {needsConnectedCalendar
                ? `Choose a default calendar to add these ${selectedItems.length} selected dates. Future additions will use it automatically.`
                : "Download a file to import into Apple, Google or Outlook Calendar."}
            </Dialog.Description>
            <div className="mt-4 flex flex-col gap-2">
              {connected.map((provider) => (
                <button
                  key={provider}
                  type="button"
                  className={dialogActionClass}
                  disabled={settingDefault}
                  onClick={() => void setDefaultAndAdd(provider)}
                >
                  {provider === "google" ? "Use Google Calendar as default" : "Use Outlook Calendar as default"}
                </button>
              ))}
              {needsConnectedCalendar ? (
                connected.length === 0 && <a href="/settings#calendars" className={dialogActionClass}>Connect a default calendar</a>
              ) : (
                <button type="button" className={dialogActionClass} onClick={() => void add("file")}>
                  Download calendar file (.ics)
                </button>
              )}
              {error && <p role="alert" className="text-sm text-[var(--app-error,#b91c1c)]">{error}</p>}
              <Dialog.Close className={dialogActionClass} disabled={settingDefault}>Cancel</Dialog.Close>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </section>
  );
}
