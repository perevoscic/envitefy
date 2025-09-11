"use client";

import React, { useEffect, useMemo, useState } from "react";
import EventActions from "@/components/EventActions";

type HistoryItem = {
  id: string;
  title: string;
  data: any;
  created_at?: string;
};

type CalendarEvent = {
  id: string; // unique within page
  historyId: string; // points to history row
  title: string;
  start: string; // ISO
  end?: string | null; // ISO
  allDay?: boolean;
  timezone?: string | null;
  location?: string | null;
  description?: string | null;
  category?: string | null;
};

// Mirror the sidebar color logic so calendar tiles match "Recent Snapped"
function defaultCategoryColor(c: string): string {
  if (c === "Birthdays") return "pink";
  if (c === "Doctor Appointments") return "teal";
  if (c === "Appointments") return "amber";
  if (c === "Sport Events") return "indigo";
  if (c === "Play Days") return "rose";
  return "slate";
}

function colorTintAndDot(color: string): { tint: string; dot: string } {
  switch (color) {
    case "lime":
      return { tint: "bg-lime-500/10", dot: "bg-lime-500" };
    case "zinc":
      return { tint: "bg-zinc-500/10", dot: "bg-zinc-500" };
    case "neutral":
      return { tint: "bg-neutral-500/10", dot: "bg-neutral-500" };
    case "stone":
      return { tint: "bg-stone-500/10", dot: "bg-stone-500" };
    case "gray":
      return { tint: "bg-gray-500/10", dot: "bg-gray-500" };
    case "red":
      return { tint: "bg-red-500/10", dot: "bg-red-500" };
    case "pink":
      return { tint: "bg-pink-500/10", dot: "bg-pink-500" };
    case "rose":
      return { tint: "bg-rose-500/10", dot: "bg-rose-500" };
    case "fuchsia":
      return { tint: "bg-fuchsia-500/10", dot: "bg-fuchsia-500" };
    case "violet":
      return { tint: "bg-violet-500/10", dot: "bg-violet-500" };
    case "purple":
      return { tint: "bg-purple-500/10", dot: "bg-purple-500" };
    case "indigo":
      return { tint: "bg-indigo-500/10", dot: "bg-indigo-500" };
    case "blue":
      return { tint: "bg-blue-500/10", dot: "bg-blue-500" };
    case "sky":
      return { tint: "bg-sky-500/10", dot: "bg-sky-500" };
    case "cyan":
      return { tint: "bg-cyan-500/10", dot: "bg-cyan-500" };
    case "teal":
      return { tint: "bg-teal-500/10", dot: "bg-teal-500" };
    case "emerald":
      return { tint: "bg-emerald-500/10", dot: "bg-emerald-500" };
    case "green":
      return { tint: "bg-green-500/10", dot: "bg-green-500" };
    case "yellow":
      return { tint: "bg-yellow-500/10", dot: "bg-yellow-500" };
    case "amber":
      return { tint: "bg-amber-500/10", dot: "bg-amber-500" };
    case "orange":
      return { tint: "bg-orange-500/10", dot: "bg-orange-500" };
    case "slate":
    default:
      return { tint: "bg-surface/60", dot: "bg-foreground/40" };
  }
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function addMonths(date: Date, delta: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + delta);
  return d;
}

function getMonthMatrix(anchor: Date): {
  weeks: Date[][];
  month: number;
  year: number;
} {
  const year = anchor.getFullYear();
  const month = anchor.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const startWeekday = firstOfMonth.getDay(); // 0=Sun
  // We want a 6x7 grid. Start from the Sunday before (or same day if Sunday)
  const gridStart = new Date(year, month, 1 - startWeekday);
  const weeks: Date[][] = [];
  let day = new Date(gridStart);
  for (let w = 0; w < 6; w++) {
    const week: Date[] = [];
    for (let d = 0; d < 7; d++) {
      week.push(new Date(day));
      day.setDate(day.getDate() + 1);
    }
    weeks.push(week);
  }
  return { weeks, month, year };
}

function slugify(t: string): string {
  return (t || "event")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeHistoryToEvents(items: HistoryItem[]): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  for (const item of items) {
    const d = item.data || {};
    // Priority: explicit events array → single event → fieldsGuess
    const arr: any[] | null = Array.isArray(d.events)
      ? d.events
      : Array.isArray(d.schedule?.games)
      ? d.events // server may already build normalized events from schedule
      : null;

    const baseCategory = (d.category as string | undefined) || null;

    if (arr && arr.length > 0) {
      arr.forEach((ev, idx) => {
        const title: string = (ev.title as string) || item.title || "Event";
        const start: string | null =
          (ev.start as string) || (ev.startISO as string) || null;
        if (!start) return;
        events.push({
          id: `${item.id}-${idx}`,
          historyId: item.id,
          title,
          start,
          end: (ev.end as string) || (ev.endISO as string) || null,
          allDay: Boolean(ev.allDay),
          timezone: (ev.timezone as string) || (d.timezone as string) || null,
          location: (ev.location as string) || (d.location as string) || null,
          description:
            (ev.description as string) || (d.description as string) || null,
          category: (ev.category as string) || baseCategory,
        });
      });
      continue;
    }

    const single = d.event || d; // some writes may store the normalized event directly
    const title: string = (single?.title as string) || item.title || "Event";
    const start: string | null =
      (single?.start as string) || (single?.startISO as string) || null;
    if (start) {
      events.push({
        id: `${item.id}-0`,
        historyId: item.id,
        title,
        start,
        end: (single?.end as string) || (single?.endISO as string) || null,
        allDay: Boolean(single?.allDay),
        timezone: (single?.timezone as string) || null,
        location: (single?.location as string) || null,
        description: (single?.description as string) || null,
        category: (single?.category as string) || baseCategory,
      });
    }
  }
  return events;
}

function groupEventsByDay(
  events: CalendarEvent[]
): Map<string, CalendarEvent[]> {
  const map = new Map<string, CalendarEvent[]>();
  for (const ev of events) {
    try {
      const d = startOfDay(new Date(ev.start));
      const key = d.toISOString();
      const arr = map.get(key) || [];
      arr.push(ev);
      map.set(key, arr);
    } catch {}
  }
  return map;
}

export default function CalendarPage() {
  const today = useMemo(() => startOfDay(new Date()), []);
  const [cursor, setCursor] = useState<Date>(startOfDay(new Date()));
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [categoryColors, setCategoryColors] = useState<Record<string, string>>(
    {}
  );

  const [openEvent, setOpenEvent] = useState<CalendarEvent | null>(null);
  const [openDay, setOpenDay] = useState<{
    date: Date;
    items: CalendarEvent[];
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/history", { cache: "no-store" });
        const json = await res.json();
        if (cancelled) return;
        const items: HistoryItem[] = Array.isArray(json?.items)
          ? json.items
          : [];
        const evs = normalizeHistoryToEvents(items);
        // Sort by start time
        evs.sort(
          (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
        );
        setEvents(evs);
      } catch (e: any) {
        if (!cancelled) setError("Failed to load events");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Load stored category color overrides so tiles match sidebar tints
  useEffect(() => {
    try {
      const raw = localStorage.getItem("categoryColors");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") setCategoryColors(parsed);
      }
    } catch {}
    // Listen for cross-component updates when category colors change
    const onColors = (e: Event) => {
      try {
        const detail = (e as CustomEvent).detail;
        if (detail && typeof detail === "object") {
          setCategoryColors(detail as Record<string, string>);
        }
      } catch {}
    };
    try {
      window.addEventListener(
        "categoryColorsUpdated",
        onColors as EventListener
      );
    } catch {}
    return () => {
      try {
        window.removeEventListener(
          "categoryColorsUpdated",
          onColors as EventListener
        );
      } catch {}
    };
  }, []);

  const { weeks, month, year } = useMemo(
    () => getMonthMatrix(cursor),
    [cursor]
  );
  const byDay = useMemo(() => groupEventsByDay(events), [events]);

  const monthFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }),
    []
  );
  const weekdayFormatter = useMemo(
    () => new Intl.DateTimeFormat(undefined, { weekday: "short" }),
    []
  );

  const goPrev = () => setCursor((d) => addMonths(d, -1));
  const goNext = () => setCursor((d) => addMonths(d, 1));
  const goToday = () => setCursor(startOfDay(new Date()));

  const onDayClick = (date: Date) => {
    const key = startOfDay(date).toISOString();
    const items = byDay.get(key) || [];
    if (items.length === 1) {
      setOpenEvent(items[0]);
      return;
    }
    if (items.length > 1) {
      setOpenDay({ date, items });
    }
  };

  const renderEventPill = (ev: CalendarEvent) => {
    const chosenColorName = ev.category
      ? categoryColors[ev.category] || defaultCategoryColor(ev.category)
      : "";
    const tone = chosenColorName
      ? colorTintAndDot(chosenColorName)
      : { tint: "bg-surface/60", dot: "bg-foreground/40" };
    return (
      <button
        key={ev.id}
        onClick={(e) => {
          e.stopPropagation();
          setOpenEvent(ev);
        }}
        className={`hidden md:flex flex-col rounded-md ${tone.tint} text-black px-2 py-1 text-[11px] leading-tight shadow-sm transition-transform transition-shadow hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20`}
        title={ev.title}
      >
        <span className="truncate max-w-[10rem]">{ev.title}</span>
      </button>
    );
  };

  const renderEventDot = (ev: CalendarEvent) => {
    const chosenColorName = ev.category
      ? categoryColors[ev.category] || defaultCategoryColor(ev.category)
      : "";
    const tone = chosenColorName
      ? colorTintAndDot(chosenColorName)
      : { tint: "bg-surface/60", dot: "bg-foreground/40" };
    return (
      <span
        key={ev.id}
        className={`inline-block h-1.5 w-1.5 rounded-full ${tone.dot}`}
      />
    );
  };

  return (
    <div className="min-h-[60vh] p-4 sm:p-6 pt-16 sm:pt-20">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={goPrev}
              className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm hover:bg-foreground/5"
            >
              ←
            </button>
            <button
              type="button"
              onClick={goToday}
              className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm hover:bg-foreground/5"
            >
              Today
            </button>
            <button
              type="button"
              onClick={goNext}
              className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm hover:bg-foreground/5"
            >
              →
            </button>
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold">
            {monthFormatter.format(new Date(year, month, 1))}
          </h1>
          <div className="hidden sm:block text-sm text-foreground/70">
            {loading
              ? "Loading…"
              : error
              ? "Failed to load"
              : `${events.length} events`}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-7 text-center text-xs sm:text-sm text-foreground/70">
          {Array.from({ length: 7 }).map((_, i) => {
            const d = new Date(2024, 7, 4 + i); // Sun..Sat reference
            return (
              <div key={i} className="py-2">
                {weekdayFormatter.format(d)}
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-7 grid-rows-6 auto-rows-fr gap-px rounded-md border border-border bg-border w-full max-w-full shadow-md sm:shadow-lg transition-shadow">
          {weeks.map((week, wi) => (
            <React.Fragment key={wi}>
              {week.map((date) => {
                const isCurrentMonth = date.getMonth() === month;
                const isToday = isSameDay(date, today);
                const key = startOfDay(date).toISOString();
                const items = byDay.get(key) || [];
                return (
                  <div
                    key={date.toISOString()}
                    onClick={() => onDayClick(date)}
                    className={`h-full cursor-pointer bg-surface p-1.5 sm:p-2 md:min-h-[96px] ${
                      isCurrentMonth ? "" : "bg-foreground/[.02]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div
                        className={`h-6 w-6 flex items-center justify-center rounded-full text-xs ${
                          isToday
                            ? "bg-foreground text-background"
                            : "text-foreground/80"
                        }`}
                      >
                        {date.getDate()}
                      </div>
                      {/* Event dots (match event colors) */}
                      <div className="flex items-center gap-1">
                        {items.slice(0, 8).map((ev) => renderEventDot(ev))}
                        {items.length > 8 && (
                          <span className="text-[10px] text-foreground/60">
                            +{items.length - 8}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Desktop pills (limit to 2 items) */}
                    <div className="mt-2 hidden md:flex flex-col gap-1.5">
                      {items.slice(0, 2).map((ev) => renderEventPill(ev))}
                      {items.length > 2 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenDay({ date, items });
                          }}
                          className="text-[11px] text-left text-foreground/70 hover:text-foreground"
                        >
                          +{items.length - 2} more
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Day list modal */}
      {openDay && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-40 flex items-end sm:items-center justify-center"
          onClick={() => setOpenDay(null)}
        >
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative z-50 w-full sm:max-w-lg sm:rounded-xl bg-surface border border-border p-4 sm:p-5 shadow-xl sm:mx-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-semibold">
                {monthFormatter.format(openDay.date)} {openDay.date.getDate()}
              </h2>
              <button
                type="button"
                onClick={() => setOpenDay(null)}
                className="text-foreground/70 hover:text-foreground"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="mt-3 space-y-2">
              {openDay.items.map((ev) => {
                const chosenColorName = ev.category
                  ? categoryColors[ev.category] ||
                    defaultCategoryColor(ev.category)
                  : "";
                const tone = chosenColorName
                  ? colorTintAndDot(chosenColorName)
                  : { tint: "bg-surface/60", dot: "bg-foreground/40" };
                return (
                  <button
                    key={ev.id}
                    onClick={() => {
                      setOpenDay(null);
                      setOpenEvent(ev);
                    }}
                    className={`w-full text-left rounded-md ${tone.tint} text-black px-3 py-2 text-sm shadow-sm transition-transform transition-shadow hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20`}
                  >
                    <div className="flex flex-col">
                      <span className="truncate">{ev.title}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Event detail modal */}
      {openEvent && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-40 flex items-end sm:items-center justify-center"
          onClick={() => setOpenEvent(null)}
        >
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative z-50 w-full sm:max-w-xl sm:rounded-xl bg-surface border border-border p-4 sm:p-6 shadow-xl sm:mx-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold truncate">
                {openEvent.title}
              </h2>
              <button
                type="button"
                onClick={() => setOpenEvent(null)}
                className="text-foreground/70 hover:text-foreground"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="mt-3 text-sm">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <dt className="text-foreground/70">Start</dt>
                  <dd className="font-medium break-all">
                    {openEvent.start || "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-foreground/70">End</dt>
                  <dd className="font-medium break-all">
                    {openEvent.end || "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-foreground/70">Timezone</dt>
                  <dd className="font-medium">{openEvent.timezone || "—"}</dd>
                </div>
                <div>
                  <dt className="text-foreground/70">Location</dt>
                  <dd className="font-medium">{openEvent.location || "—"}</dd>
                </div>
              </dl>
              {openEvent.description && (
                <div className="mt-3">
                  <dt className="text-foreground/70 text-sm">Description</dt>
                  <p className="whitespace-pre-wrap">{openEvent.description}</p>
                </div>
              )}
            </div>

            <div className="mt-5">
              <EventActions
                shareUrl={`/event/${slugify(openEvent.title)}-${
                  openEvent.historyId
                }`}
                event={{
                  title: openEvent.title,
                  start: openEvent.start,
                  end: openEvent.end || null,
                  location: openEvent.location || "",
                  description: openEvent.description || "",
                  timezone: openEvent.timezone || "",
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
