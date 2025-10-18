"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import EventActions from "@/components/EventActions";
import EventCreateModal from "@/components/EventCreateModal";
import { getEventTheme } from "@/lib/event-theme";

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
  venue?: string | null;
  description?: string | null;
  rsvp?: string | null;
  category?: string | null;
  recurrence?: string | null;
  shared?: boolean;
  sharedOut?: boolean;
};

// Mirror the sidebar color logic so calendar tiles match "Recent Snapped"
function defaultCategoryColor(c: string): string {
  if (c === "Birthdays") return "green"; // default palette expectation
  if (c === "Doctor Appointments") return "red";
  if (c === "Appointments") return "amber";
  if (c === "Weddings") return "blue";
  if (c === "Baby Showers") return "pink";
  if (c === "Sport Events") return "indigo";
  if (c === "Play Days") return "rose";
  return "slate";
}

function colorTintAndDot(color: string): { tint: string; dot: string } {
  switch (color) {
    case "lime":
      return { tint: "bg-lime-500/20", dot: "bg-lime-500" };
    case "zinc":
      return { tint: "bg-zinc-500/20", dot: "bg-zinc-500" };
    case "neutral":
      return { tint: "bg-neutral-500/20", dot: "bg-neutral-500" };
    case "stone":
      return { tint: "bg-stone-500/20", dot: "bg-stone-500" };
    case "gray":
      return { tint: "bg-gray-500/20", dot: "bg-gray-500" };
    case "red":
      return { tint: "bg-red-500/20", dot: "bg-red-500" };
    case "pink":
      return { tint: "bg-pink-500/20", dot: "bg-pink-500" };
    case "rose":
      return { tint: "bg-rose-500/20", dot: "bg-rose-500" };
    case "fuchsia":
      return { tint: "bg-fuchsia-500/20", dot: "bg-fuchsia-500" };
    case "violet":
      return { tint: "bg-violet-500/20", dot: "bg-violet-500" };
    case "purple":
      return { tint: "bg-purple-500/20", dot: "bg-purple-500" };
    case "indigo":
      return { tint: "bg-indigo-500/20", dot: "bg-indigo-500" };
    case "blue":
      return { tint: "bg-blue-500/20", dot: "bg-blue-500" };
    case "sky":
      return { tint: "bg-sky-500/20", dot: "bg-sky-500" };
    case "cyan":
      return { tint: "bg-cyan-500/20", dot: "bg-cyan-500" };
    case "teal":
      return { tint: "bg-teal-500/20", dot: "bg-teal-500" };
    case "emerald":
      return { tint: "bg-emerald-500/20", dot: "bg-emerald-500" };
    case "green":
      return { tint: "bg-green-500/20", dot: "bg-green-500" };
    case "yellow":
      return { tint: "bg-yellow-500/20", dot: "bg-yellow-500" };
    case "amber":
      return { tint: "bg-amber-500/20", dot: "bg-amber-500" };
    case "orange":
      return { tint: "bg-orange-500/20", dot: "bg-orange-500" };
    case "slate":
      return { tint: "bg-slate-500/20", dot: "bg-slate-500" };
    default:
      return { tint: "bg-surface/75", dot: "bg-foreground/50" };
  }
}

// Shared Events gradient options (mirrors sidebar)
const SHARED_GRADIENTS: {
  id: string;
  lightRow: string;
  darkRow: string;
}[] = [
  {
    id: "shared-g1",
    lightRow: "bg-gradient-to-br from-cyan-200 via-sky-200 to-fuchsia-200",
    darkRow: "bg-gradient-to-br from-cyan-950 via-slate-900 to-fuchsia-900",
  },
  {
    id: "shared-g2",
    lightRow: "bg-gradient-to-br from-rose-200 via-fuchsia-200 to-indigo-200",
    darkRow: "bg-gradient-to-br from-rose-950 via-fuchsia-900 to-indigo-900",
  },
  {
    id: "shared-g3",
    lightRow: "bg-gradient-to-br from-emerald-200 via-teal-200 to-sky-200",
    darkRow: "bg-gradient-to-br from-emerald-950 via-teal-900 to-sky-900",
  },
  {
    id: "shared-g4",
    lightRow: "bg-gradient-to-br from-amber-200 via-orange-200 to-pink-200",
    darkRow: "bg-gradient-to-br from-amber-950 via-rose-900 to-pink-900",
  },
  {
    id: "shared-g5",
    lightRow: "bg-gradient-to-r from-indigo-200 via-blue-200 to-cyan-200",
    darkRow: "bg-gradient-to-r from-indigo-950 via-blue-900 to-cyan-900",
  },
  {
    id: "shared-g6",
    lightRow: "bg-gradient-to-br from-lime-200 via-green-200 to-emerald-200",
    darkRow: "bg-gradient-to-br from-emerald-950 via-green-900 to-emerald-800",
  },
  {
    id: "shared-g7",
    lightRow: "bg-gradient-to-br from-purple-200 via-fuchsia-200 to-pink-200",
    darkRow: "bg-gradient-to-br from-purple-950 via-fuchsia-900 to-pink-900",
  },
  {
    id: "shared-g8",
    lightRow: "bg-gradient-to-br from-slate-200 via-zinc-200 to-sky-200",
    darkRow: "bg-gradient-to-br from-slate-950 via-zinc-900 to-sky-900",
  },
];

function sharedGradientRowClass(
  categoryColors: Record<string, string>
): string {
  const id = categoryColors["Shared events"];
  const found = SHARED_GRADIENTS.find((g) => g.id === id);
  const palette = found ?? SHARED_GRADIENTS[0];
  return `${palette.lightRow} ${prefixDark(palette.darkRow)}`;
}

function prefixDark(classList: string): string {
  return classList
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => `dark:${token}`)
    .join(" ");
}

const SHARED_TEXT_CLASS = "text-neutral-900 dark:text-foreground";
const SHARED_MUTED_TEXT_CLASS = "text-neutral-600 dark:text-foreground/70";

function isSharedEvent(
  ev:
    | CalendarEvent
    | {
        shared?: boolean | null;
        sharedOut?: boolean | null;
        category?: string | null;
      }
): boolean {
  if (!ev) return false;
  return Boolean(
    (ev as CalendarEvent).shared ||
      (ev as CalendarEvent).sharedOut ||
      ((ev as CalendarEvent).category || null) === "Shared events"
  );
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function dayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseEventStartToLocalDate(startIso: string): Date | null {
  try {
    // If the string is date-only (YYYY-MM-DD), interpret it as a local date
    // instead of UTC midnight, which would shift the day for many timezones.
    const dateOnly = /^\d{4}-\d{2}-\d{2}$/;
    if (dateOnly.test(startIso)) {
      const [y, m, d] = startIso.split("-").map((n) => Number(n));
      return new Date(y, m - 1, d, 0, 0, 0, 0);
    }
    return new Date(startIso);
  } catch {
    return null;
  }
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

function startOfISOWeek(date: Date): Date {
  const d = startOfDay(new Date(date));
  const day = d.getDay(); // 0=Sun..6=Sat
  const diff = (day + 6) % 7; // days since Monday
  d.setDate(d.getDate() - diff);
  return d;
}

function endOfISOWeek(date: Date): Date {
  const start = startOfISOWeek(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return end;
}

function formatEventDateTime(iso: string): string {
  try {
    const d = new Date(iso);
    const dateStr = new Intl.DateTimeFormat(undefined, {
      month: "long",
      day: "numeric",
    }).format(d);
    const hours24 = d.getHours();
    const minutes = d.getMinutes();
    const ampm = hours24 >= 12 ? "PM" : "AM";
    let hours12 = hours24 % 12;
    if (hours12 === 0) hours12 = 12;
    const timeStr =
      minutes === 0
        ? `${hours12}${ampm}`
        : `${hours12}:${String(minutes).padStart(2, "0")}${ampm}`;
    return `${dateStr}, ${timeStr}`;
  } catch {
    return iso;
  }
}

function formatEventRangeLabel(
  startIso: string,
  endIso?: string | null,
  options?: { timeZone?: string | null; allDay?: boolean }
): string {
  const { timeZone, allDay } = options || {};
  try {
    const start = new Date(startIso);
    if (Number.isNaN(start.getTime())) return startIso;
    const end = endIso ? new Date(endIso) : null;
    const sameDay =
      !!end &&
      start.getFullYear() === end.getFullYear() &&
      start.getMonth() === end.getMonth() &&
      start.getDate() === end.getDate();
    const tz = timeZone || undefined;
    if (allDay) {
      const dateFmt = new Intl.DateTimeFormat(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: tz,
      });
      const label = end && !sameDay
        ? `${dateFmt.format(start)} – ${dateFmt.format(end)}`
        : dateFmt.format(start);
      return `${label} (all day)`;
    }
    const dateFmt = new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: tz,
    });
    const timeFmt = new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: tz,
    });
    if (end) {
      if (sameDay) {
        return `${dateFmt.format(start)}, ${timeFmt.format(start)} – ${timeFmt.format(
          end
        )}`;
      }
      const dateTimeFmt = new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZone: tz,
      });
      return `${dateTimeFmt.format(start)} – ${dateTimeFmt.format(end)}`;
    }
    const dateTimeFmt = new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: tz,
    });
    return dateTimeFmt.format(start);
  } catch {
    return startIso;
  }
}

function pickLocationLabel(
  venue?: string | null,
  location?: string | null
): string {
  const venueTrimmed = String(venue || "").trim();
  if (venueTrimmed) {
    const first = venueTrimmed.split(/[,\n]/)[0].trim();
    return first || venueTrimmed;
  }
  const s = String(location || "").trim();
  if (!s) return s;
  const first = s.split(/[,\n\-]/)[0].trim();
  const hasDigit = /\d/.test(first);
  const addressToken =
    /\b(Street|St|Ave|Avenue|Blvd|Boulevard|Road|Rd|Drive|Dr|Court|Ct|Lane|Ln|Way|Place|Pl|Terrace|Ter|Pkwy|Parkway|Hwy|Highway|Suite|Ste|Apt|Unit|#)\b/i;
  if (!hasDigit && !addressToken.test(first) && first.length >= 2) {
    return first;
  }
  return s;
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
    const sharedFlag = Boolean(d?.shared || baseCategory === "Shared events");
    const sharedOutFlag = Boolean(d?.sharedOut);

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
          venue: (ev.venue as string) || (d.venue as string) || null,
          location: (ev.location as string) || (d.location as string) || null,
          description:
            (ev.description as string) || (d.description as string) || null,
          rsvp: (ev.rsvp as string) || (d.rsvp as string) || null,
          category: (ev.category as string) || baseCategory,
          recurrence:
            (ev.recurrence as string) || (d.recurrence as string) || null,
          shared: sharedFlag,
          sharedOut: sharedOutFlag,
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
        venue: (single?.venue as string) || (d.venue as string) || null,
        location: (single?.location as string) || null,
        description: (single?.description as string) || null,
        rsvp: (single?.rsvp as string) || (d.rsvp as string) || null,
        category: (single?.category as string) || baseCategory,
        recurrence: (single?.recurrence as string) || null,
        shared: sharedFlag,
        sharedOut: sharedOutFlag,
      });
    }
  }
  return events;
}

// Expand weekly recurring events (BYDAY) across the visible grid (6 weeks)
function expandRecurringEvents(
  events: CalendarEvent[],
  cursor: Date
): CalendarEvent[] {
  const { weeks } = getMonthMatrix(cursor);
  const gridStart = startOfDay(weeks[0][0]);
  const gridEnd = startOfDay(weeks[5][6]);
  gridEnd.setHours(23, 59, 59, 999);
  const dayCodeToIndex: Record<string, number> = {
    SU: 0,
    MO: 1,
    TU: 2,
    WE: 3,
    TH: 4,
    FR: 5,
    SA: 6,
  };
  const out: CalendarEvent[] = [];
  const seen = new Set<string>();
  const keyFor = (e: CalendarEvent) =>
    `${e.historyId}|${e.title}|${e.start}|${e.end || ""}`;

  const pushUnique = (e: CalendarEvent) => {
    const k = keyFor(e);
    if (!seen.has(k)) {
      seen.add(k);
      out.push(e);
    }
  };

  for (const ev of events) {
    pushUnique(ev);
    const r = ev.recurrence || "";
    if (!/FREQ=WEEKLY/i.test(r)) continue;
    const m = r.match(/BYDAY=([^;]+)/i);
    const by = m ? m[1].split(",").map((s) => s.trim().toUpperCase()) : [];
    if (!by.length) continue;
    try {
      const start = new Date(ev.start);
      const end = ev.end
        ? new Date(ev.end)
        : new Date(start.getTime() + 90 * 60 * 1000);
      const duration = end.getTime() - start.getTime();
      const baseStart = start > gridStart ? start : gridStart;
      for (const code of by) {
        const dow = dayCodeToIndex[code];
        if (typeof dow !== "number") continue;
        // find first occurrence >= baseStart on this weekday and not before original start
        const first = new Date(baseStart);
        const delta = (dow - first.getDay() + 7) % 7;
        first.setDate(first.getDate() + delta);
        // Align to event time
        first.setHours(
          start.getHours(),
          start.getMinutes(),
          start.getSeconds(),
          0
        );
        if (first < start) first.setDate(first.getDate() + 7);
        // Generate weekly occurrences until gridEnd
        for (
          let d = new Date(first);
          d <= gridEnd;
          d.setDate(d.getDate() + 7)
        ) {
          const sISO = d.toISOString();
          const eISO = new Date(d.getTime() + duration).toISOString();
          // Give expanded occurrences unique IDs to avoid React key collisions
          pushUnique({
            ...ev,
            id: `${ev.id}@${sISO}`,
            start: sISO,
            end: eISO,
          });
        }
      }
    } catch {}
  }
  return out;
}

function groupEventsByDay(
  events: CalendarEvent[]
): Map<string, CalendarEvent[]> {
  const map = new Map<string, CalendarEvent[]>();
  for (const ev of events) {
    try {
      const parsed = parseEventStartToLocalDate(ev.start);
      if (!parsed || isNaN(parsed.getTime())) continue;
      const d = startOfDay(parsed);
      const key = dayKey(d);
      const arr = map.get(key) || [];
      arr.push(ev);
      map.set(key, arr);
    } catch {}
  }
  return map;
}

export default function CalendarPage() {
  const { status } = useSession();
  const today = useMemo(() => startOfDay(new Date()), []);
  const [cursor, setCursor] = useState<Date>(startOfDay(new Date()));
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Seed from localStorage immediately to avoid first-render mismatch with sidebar
  const [categoryColors, setCategoryColors] = useState<Record<string, string>>(
    () => {
      try {
        const raw =
          typeof window !== "undefined"
            ? localStorage.getItem("categoryColors")
            : null;
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === "object")
            return parsed as Record<string, string>;
        }
      } catch {}
      return {} as Record<string, string>;
    }
  );
  const sharedGradientTint = useMemo(
    () => sharedGradientRowClass(categoryColors),
    [categoryColors]
  );

  const [openEvent, setOpenEvent] = useState<CalendarEvent | null>(null);
  const openEventTheme = useMemo(() => {
    if (!openEvent) return null;
    return getEventTheme(openEvent.category);
  }, [openEvent?.category]);
  const openEventStyleVars = useMemo(() => {
    if (!openEventTheme) return undefined;
    return {
      "--event-header-gradient-light": openEventTheme.headerLight,
      "--event-header-gradient-dark": openEventTheme.headerDark,
      "--event-card-bg-light": openEventTheme.cardLight,
      "--event-card-bg-dark": openEventTheme.cardDark,
      "--event-border-light": openEventTheme.borderLight,
      "--event-border-dark": openEventTheme.borderDark,
      "--event-chip-light": openEventTheme.chipLight,
      "--event-chip-dark": openEventTheme.chipDark,
      "--event-text-light": openEventTheme.textLight,
      "--event-text-dark": openEventTheme.textDark,
    } as React.CSSProperties;
  }, [openEventTheme]);
  const openEventIcon = openEventTheme?.icon ?? "📌";
  const openEventCategoryLabel = openEventTheme?.categoryLabel ?? openEvent?.category ?? "General Events";
  const [openDay, setOpenDay] = useState<{
    date: Date;
    items: CalendarEvent[];
  } | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createDefaultDate, setCreateDefaultDate] = useState<Date | undefined>(
    undefined
  );
  const [upcomingView, setUpcomingView] = useState<"week" | "month" | "shared">(
    "week"
  );

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
        const evsRaw = normalizeHistoryToEvents(items);
        const evs = expandRecurringEvents(evsRaw, cursor);
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
  }, [cursor]);

  // Listen for history create/delete events to keep calendar in sync without full refresh
  useEffect(() => {
    const onCreated = (e: Event) => {
      try {
        const detail = (e as CustomEvent).detail as any;
        if (!detail || !detail.id) return;
        // Re-fetch minimal list and rebuild events to ensure recurrence mapping etc.
        // Keep this lightweight: only refetch when user is on calendar page.
        (async () => {
          try {
            const res = await fetch("/api/history", { cache: "no-store" });
            const json = await res.json().catch(() => ({ items: [] }));
            const items: HistoryItem[] = Array.isArray(json?.items)
              ? json.items
              : [];
            const evsRaw = normalizeHistoryToEvents(items);
            const evs = expandRecurringEvents(evsRaw, cursor);
            evs.sort(
              (a, b) =>
                new Date(a.start).getTime() - new Date(b.start).getTime()
            );
            setEvents(evs);
          } catch {}
        })();
      } catch {}
    };
    const onDeleted = (e: Event) => {
      try {
        const detail = (e as CustomEvent).detail as any;
        const deletedId: string | undefined = detail?.id;
        if (!deletedId) return;
        // Remove any events that came from this history row
        setEvents((prev) => prev.filter((ev) => ev.historyId !== deletedId));
      } catch {}
    };
    try {
      window.addEventListener("history:created", onCreated as EventListener);
      window.addEventListener("history:deleted", onDeleted as EventListener);
    } catch {}
    return () => {
      try {
        window.removeEventListener(
          "history:created",
          onCreated as EventListener
        );
        window.removeEventListener(
          "history:deleted",
          onDeleted as EventListener
        );
      } catch {}
    };
  }, [cursor]);

  // Load stored category color overrides so tiles match sidebar tints
  useEffect(() => {
    try {
      const raw = localStorage.getItem("categoryColors");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") setCategoryColors(parsed);
      }
    } catch {}
  }, []);

  // Also fetch from server when authenticated to ensure cross-device sync
  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/user/profile", { cache: "no-store" });
        const json = await res.json().catch(() => ({}));
        if (!cancelled && json && typeof json.categoryColors === "object") {
          setCategoryColors((prev) => {
            const next = {
              ...prev,
              ...(json.categoryColors as Record<string, string>),
            };
            try {
              localStorage.setItem("categoryColors", JSON.stringify(next));
            } catch {}
            return next;
          });
        }
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, [status]);

  // Listen for cross-component updates when category colors change
  useEffect(() => {
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
  const upcoming = useMemo(() => {
    // "Upcoming" should include events happening today or later.
    // Past-day events remain on the calendar grid but are hidden from this list.
    const todayStart = startOfDay(new Date());
    return events.filter((e) => {
      try {
        return new Date(e.start) >= todayStart;
      } catch {
        return false;
      }
    });
  }, [events]);

  const upcomingWeek = useMemo(() => {
    // For Week view, only show events in the next 7 days
    const todayStart = startOfDay(new Date());
    const weekEnd = new Date(todayStart);
    weekEnd.setDate(todayStart.getDate() + 7);

    return events.filter((e) => {
      try {
        const eventDate = new Date(e.start);
        return eventDate >= todayStart && eventDate < weekEnd;
      } catch {
        return false;
      }
    });
  }, [events]);

  const groupedByWeek = useMemo(() => {
    const map = new Map<
      string,
      { rangeLabel: string; items: CalendarEvent[] }
    >();
    const dateFmt = new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
    });
    for (const ev of upcoming) {
      try {
        const d = new Date(ev.start);
        const weekStart = startOfISOWeek(d);
        const weekEnd = endOfISOWeek(d);
        const key = weekStart.toISOString();
        if (!map.has(key)) {
          map.set(key, {
            rangeLabel: `${dateFmt.format(weekStart)} – ${dateFmt.format(
              weekEnd
            )}`,
            items: [],
          });
        }
        map.get(key)!.items.push(ev);
      } catch {}
    }
    // sort by week start
    return Array.from(map.entries())
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
      .map(([, v]) => v);
  }, [upcoming]);

  const groupedByMonth = useMemo(() => {
    const map = new Map<string, { label: string; items: CalendarEvent[] }>();
    const labelFmt = new Intl.DateTimeFormat(undefined, {
      month: "long",
      year: "numeric",
    });
    for (const ev of upcoming) {
      try {
        const d = new Date(ev.start);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        if (!map.has(key)) {
          map.set(key, {
            label: labelFmt.format(new Date(d.getFullYear(), d.getMonth(), 1)),
            items: [],
          });
        }
        map.get(key)!.items.push(ev);
      } catch {}
    }
    return Array.from(map.entries())
      .sort((a, b) => {
        const [ay, am] = a[0].split("-").map(Number);
        const [by, bm] = b[0].split("-").map(Number);
        return new Date(ay, am, 1).getTime() - new Date(by, bm, 1).getTime();
      })
      .map(([, v]) => v);
  }, [upcoming]);

  const upcomingShared = useMemo(() => {
    try {
      const now = new Date();
      return upcoming.filter((e) => {
        const isShared = isSharedEvent(e);
        return isShared && new Date(e.start) >= now;
      });
    } catch {
      return [] as CalendarEvent[];
    }
  }, [upcoming]);

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

  // Expose a global hook so the sidebar plus button can open the modal
  useEffect(() => {
    (window as any).__openCreateEvent = () => {
      try {
        setCreateDefaultDate(startOfDay(new Date()));
        setCreateOpen(true);
      } catch {}
    };
    return () => {
      try {
        delete (window as any).__openCreateEvent;
      } catch {}
    };
  }, []);

  const onDayClick = (date: Date) => {
    const key = dayKey(startOfDay(date));
    const items = byDay.get(key) || [];
    // Allow viewing past events but block creating new ones on past dates
    const isPast = startOfDay(date) < today;
    if (items.length === 1) {
      setOpenEvent(items[0]);
      return;
    }
    if (items.length > 1) {
      setOpenDay({ date, items });
      return;
    }
    if (isPast) return; // do not allow creating events in the past from the calendar grid
    // No items on this day (today or future) → open create modal with default date prefilled
    setCreateDefaultDate(date);
    setCreateOpen(true);
  };

  const renderEventPill = (ev: CalendarEvent) => {
    const isShared = isSharedEvent(ev);
    const chosenColorName = ev.category
      ? categoryColors[ev.category] || defaultCategoryColor(ev.category)
      : "";
    const tone = isShared
      ? { tint: sharedGradientTint, dot: "" }
      : chosenColorName
      ? colorTintAndDot(chosenColorName)
      : { tint: "bg-surface/60", dot: "bg-foreground/40" };
    return (
      <button
        key={`${ev.id}@${ev.start}`}
        onClick={(e) => {
          e.stopPropagation();
          setOpenEvent(ev);
        }}
        className={`hidden md:flex flex-col rounded-md ${tone.tint} ${
          isShared ? SHARED_TEXT_CLASS : "text-foreground"
        } px-2 py-1 text-[11px] leading-tight shadow-sm transition-transform transition-shadow hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20`}
        title={ev.title}
      >
        <span className="truncate max-w-[10rem] inline-flex items-center gap-1">
          {isShared && (
            <svg
              viewBox="0 0 25.274 25.274"
              fill="currentColor"
              className="h-3 w-3 opacity-70"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M24.989,15.893c-0.731-0.943-3.229-3.73-4.34-4.96c0.603-0.77,0.967-1.733,0.967-2.787c0-2.503-2.03-4.534-4.533-4.534 c-2.507,0-4.534,2.031-4.534,4.534c0,1.175,0.455,2.24,1.183,3.045l-1.384,1.748c-0.687-0.772-1.354-1.513-1.792-2.006 c0.601-0.77,0.966-1.733,0.966-2.787c-0.001-2.504-2.03-4.535-4.536-4.535c-2.507,0-4.536,2.031-4.536,4.534 c0,1.175,0.454,2.24,1.188,3.045L0.18,15.553c0,0-0.406,1.084,0,1.424c0.36,0.3,0.887,0.81,1.878,0.258 c-0.107,0.974-0.054,2.214,0.693,2.924c0,0,0.749,1.213,2.65,1.456c0,0,2.1,0.244,4.543-0.367c0,0,1.691-0.312,2.431-1.794 c0.113,0.263,0.266,0.505,0.474,0.705c0,0,0.751,1.213,2.649,1.456c0,0,2.103,0.244,4.54-0.367c0,0,2.102-0.38,2.65-2.339 c0.297-0.004,0.663-0.097,1.149-0.374C24.244,18.198,25.937,17.111,24.989,15.893z M13.671,8.145c0-1.883,1.527-3.409,3.409-3.409 c1.884,0,3.414,1.526,3.414,3.409c0,1.884-1.53,3.411-3.414,3.411C15.198,11.556,13.671,10.029,13.671,8.145z M13.376,12.348 l0.216,0.516c0,0-0.155,0.466-0.363,1.069c-0.194-0.217-0.388-0.437-0.585-0.661L13.376,12.348z M3.576,8.145 c0-1.883,1.525-3.409,3.41-3.409c1.881,0,3.408,1.526,3.408,3.409c0,1.884-1.527,3.411-3.408,3.411 C5.102,11.556,3.576,10.029,3.576,8.145z M2.186,16.398c-0.033,0.07-0.065,0.133-0.091,0.177c-0.801,0.605-1.188,0.216-1.449,0 c-0.259-0.216,0-0.906,0-0.906l2.636-3.321l0.212,0.516c0,0-0.227,0.682-0.503,1.47l-0.665,1.49 C2.325,15.824,2.257,16.049,2.186,16.398z M9.299,20.361c-2.022,0.507-3.758,0.304-3.758,0.304 c-1.574-0.201-2.196-1.204-2.196-1.204c-1.121-1.066-0.348-3.585-0.348-3.585l1.699-3.823c0.671,0.396,1.451,0.627,2.29,0.627 c0.584,0,1.141-0.114,1.656-0.316l2.954,5.417C11.482,19.968,9.299,20.361,9.299,20.361z M9.792,12.758l0.885-0.66 c0,0,2.562,2.827,3.181,3.623c0.617,0.794-0.49,1.501-0.75,1.723c-0.259,0.147-0.464,0.206-0.635,0.226L9.792,12.758z M19.394,20.361c-2.018,0.507-3.758,0.304-3.758,0.304c-1.569-0.201-2.191-1.204-2.191-1.204c-0.182-0.175-0.311-0.389-0.403-0.624 c0.201-0.055,0.433-0.15,0.698-0.301c0.405-0.337,2.102-1.424,1.154-2.643c-0.24-0.308-0.678-0.821-1.184-1.405l1.08-2.435 c0.674,0.396,1.457,0.627,2.293,0.627c0.585,0,1.144-0.114,1.654-0.316l2.955,5.417C21.582,19.968,19.394,20.361,19.394,20.361z M23.201,17.444c-0.255,0.147-0.461,0.206-0.63,0.226l-2.68-4.912l0.879-0.66c0,0,2.562,2.827,3.181,3.623 C24.57,16.516,23.466,17.223,23.201,17.444z"></path>
            </svg>
          )}
          {ev.title}
        </span>
      </button>
    );
  };

  const renderEventDot = (ev: CalendarEvent) => {
    const isShared = isSharedEvent(ev);
    const chosenColorName = ev.category
      ? categoryColors[ev.category] || defaultCategoryColor(ev.category)
      : "";
    const tone = isShared
      ? {
          tint: sharedGradientTint,
          dot: "bg-foreground/40",
        }
      : chosenColorName
      ? colorTintAndDot(chosenColorName)
      : { tint: "bg-surface/60", dot: "bg-foreground/40" };
    // Always render a circle for all events, shared or not
    return (
      <span
        key={`${ev.id}@${ev.start}`}
        className={`inline-block h-1.5 w-1.5 rounded-full ${tone.dot}`}
      />
    );
  };

  return (
    <div className="min-h-[60vh] p-4 sm:p-6 pt-8 sm:pt-10">
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
            <button
              type="button"
              onClick={() => {
                setCreateDefaultDate(startOfDay(new Date()));
                setCreateOpen(true);
              }}
              title="New event"
              className="ml-1 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 px-3 py-1.5 text-sm font-medium text-white shadow transition hover:opacity-90 focus:outline-none"
            >
              <svg
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="miter"
                className="h-4 w-4 text-white"
                aria-hidden="true"
              >
                <rect x="2" y="4" width="20" height="18" rx="0"></rect>
                <line x1="7" y1="2" x2="7" y2="6"></line>
                <line x1="17" y1="2" x2="17" y2="6"></line>
                <line x1="8" y1="13" x2="16" y2="13"></line>
                <line x1="12" y1="9" x2="12" y2="17"></line>
              </svg>
              <span>Add event</span>
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

        <div
          className="mt-4 grid grid-cols-7 text-center text-xs sm:text-sm text-foreground/70"
          style={{ gridTemplateColumns: "repeat(7, minmax(0, 1fr))" }}
        >
          {Array.from({ length: 7 }).map((_, i) => {
            const d = new Date(2024, 7, 4 + i); // Sun..Sat reference
            return (
              <div key={i} className="py-2">
                {weekdayFormatter.format(d)}
              </div>
            );
          })}
        </div>

        <div
          className="grid grid-cols-7 grid-rows-6 gap-px rounded-md border border-border bg-border w-full max-w-full shadow-md sm:shadow-lg transition-shadow"
          style={{
            gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
            gridTemplateRows: "repeat(6, minmax(0, 1fr))",
          }}
        >
          {weeks.map((week, wi) => (
            <React.Fragment key={wi}>
              {week.map((date) => {
                const isCurrentMonth = date.getMonth() === month;
                const isToday = isSameDay(date, today);
                const key = dayKey(startOfDay(date));
                const items = byDay.get(key) || [];
                return (
                  <div
                    key={date.toISOString()}
                    onClick={() => onDayClick(date)}
                    className={`h-full cursor-pointer bg-surface p-2 sm:p-3 min-h-[32px] sm:min-h-[40px] md:min-h-[48px] ${
                      isCurrentMonth ? "" : "bg-foreground/[.02]"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-5 w-5 -mt-0.5 -ml-0.5 flex items-center justify-center rounded-full text-[10px] ${
                          isToday
                            ? "bg-foreground text-background"
                            : isCurrentMonth
                            ? "text-foreground/80"
                            : "text-foreground/40"
                        }`}
                      >
                        {date.getDate()}
                      </div>
                      {items.length > 0 && (
                        <div className="ml-1 flex items-center gap-1">
                          {items.slice(0, 8).map((ev) => renderEventDot(ev))}
                          {items.length > 8 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenDay({ date, items });
                              }}
                              className="text-[10px] text-foreground/60 hover:text-foreground/80"
                            >
                              +{items.length - 8}
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Desktop pills (reserve space for two items) */}
                    <div className="mt-2 hidden md:flex flex-col gap-1.5 md:min-h-[56px]">
                      {items.slice(0, 2).map((ev) => renderEventPill(ev))}
                    </div>
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Upcoming (toggle) */}
      <div className="mx-auto max-w-6xl mt-8">
        <h2 className="text-lg font-semibold">Upcoming events</h2>

        <div className="mt-3 flex justify-start">
          {/* Elastic Tabs Toggle */}
          <nav
            className="relative flex bg-white dark:bg-surface shadow-md rounded-full px-1 py-1 w-[330px] tabs-elastic"
            suppressHydrationWarning
          >
            <div
              className="absolute top-0 left-0 h-full rounded-full transition-all duration-500 ease-elastic bg-gradient-to-r from-sky-400 to-purple-700 z-0"
              style={{
                width: "33.3333%",
                transform:
                  upcomingView === "week"
                    ? "translateX(0%)"
                    : upcomingView === "month"
                    ? "translateX(100%)"
                    : "translateX(200%)",
              }}
            />
            <button
              type="button"
              className={`relative z-10 flex-1 px-4 py-1.5 text-sm font-semibold rounded-full transition-colors duration-300 ${
                upcomingView === "week" ? "text-white" : "text-gray-500"
              }`}
              onClick={() => setUpcomingView("week")}
            >
              <div className="flex items-center justify-center gap-2">
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M1.25 8C1.25 5.37665 3.37665 3.25 6 3.25H18C20.6234 3.25 22.75 5.37665 22.75 8V18C22.75 20.6234 20.6234 22.75 18 22.75H6C3.37665 22.75 1.25 20.6234 1.25 18V8ZM6 4.75C4.20507 4.75 2.75 6.20507 2.75 8V18C2.75 19.7949 4.20507 21.25 6 21.25H18C19.7949 21.25 21.25 19.7949 21.25 18V8C21.25 6.20507 19.7949 4.75 18 4.75H6Z"
                    fill="currentColor"
                  />
                  <text
                    x="50%"
                    y="65%"
                    dominantBaseline="middle"
                    textAnchor="middle"
                    fill="currentColor"
                    fontSize="10"
                    fontWeight="bold"
                  >
                    7
                  </text>
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M8 1.25C8.41421 1.25 8.75 1.58579 8.75 2V5.5C8.75 5.91421 8.41421 6.25 8 6.25C7.58579 6.25 7.25 5.91421 7.25 5.5V2C7.25 1.58579 7.58579 1.25 8 1.25Z"
                    fill="currentColor"
                  />
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M16 1.25C16.4142 1.25 16.75 1.58579 16.75 2V5.5C16.75 5.91421 16.4142 6.25 16 6.25C15.5858 6.25 15.25 5.91421 15.25 5.5V2C15.25 1.58579 15.5858 1.25 16 1.25Z"
                    fill="currentColor"
                  />
                </svg>
                <span>Week</span>
              </div>
            </button>
            <button
              type="button"
              className={`relative z-10 flex-1 px-4 py-1.5 text-sm font-semibold rounded-full transition-colors duration-300 ${
                upcomingView === "month" ? "text-white" : "text-gray-500"
              }`}
              onClick={() => setUpcomingView("month")}
            >
              <div className="flex items-center justify-center gap-2">
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M1.25 8C1.25 5.37665 3.37665 3.25 6 3.25H18C20.6234 3.25 22.75 5.37665 22.75 8V18C22.75 20.6234 20.6234 22.75 18 22.75H6C3.37665 22.75 1.25 20.6234 1.25 18V8ZM6 4.75C4.20507 4.75 2.75 6.20507 2.75 8V18C2.75 19.7949 4.20507 21.25 6 21.25H18C19.7949 21.25 21.25 19.7949 21.25 18V8C21.25 6.20507 19.7949 4.75 18 4.75H6Z"
                    fill="currentColor"
                  />
                  <text
                    x="50%"
                    y="65%"
                    dominantBaseline="middle"
                    textAnchor="middle"
                    fill="currentColor"
                    fontSize="10"
                    fontWeight="bold"
                  >
                    31
                  </text>
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M8 1.25C8.41421 1.25 8.75 1.58579 8.75 2V5.5C8.75 5.91421 8.41421 6.25 8 6.25C7.58579 6.25 7.25 5.91421 7.25 5.5V2C7.25 1.58579 7.58579 1.25 8 1.25Z"
                    fill="currentColor"
                  />
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M16 1.25C16.4142 1.25 16.75 1.58579 16.75 2V5.5C16.75 5.91421 16.4142 6.25 16 6.25C15.5858 6.25 15.25 5.91421 15.25 5.5V2C15.25 1.58579 15.5858 1.25 16 1.25Z"
                    fill="currentColor"
                  />
                </svg>
                <span>Month</span>
              </div>
            </button>
            <button
              type="button"
              className={`relative z-10 flex-1 px-4 py-1.5 text-sm font-semibold rounded-full transition-colors duration-300 ${
                upcomingView === "shared" ? "text-white" : "text-gray-500"
              }`}
              onClick={() => setUpcomingView("shared")}
            >
              <div className="flex items-center justify-center gap-2">
                <svg
                  viewBox="0 0 25.274 25.274"
                  fill="currentColor"
                  className="w-4 h-4"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M24.989,15.893c-0.731-0.943-3.229-3.73-4.34-4.96c0.603-0.77,0.967-1.733,0.967-2.787c0-2.503-2.03-4.534-4.533-4.534 c-2.507,0-4.534,2.031-4.534,4.534c0,1.175,0.455,2.24,1.183,3.045l-1.384,1.748c-0.687-0.772-1.354-1.513-1.792-2.006 c0.601-0.77,0.966-1.733,0.966-2.787c-0.001-2.504-2.03-4.535-4.536-4.535c-2.507,0-4.536,2.031-4.536,4.534 c0,1.175,0.454,2.24,1.188,3.045L0.18,15.553c0,0-0.406,1.084,0,1.424c0.36,0.3,0.887,0.81,1.878,0.258 c-0.107,0.974-0.054,2.214,0.693,2.924c0,0,0.749,1.213,2.65,1.456c0,0,2.1,0.244,4.543-0.367c0,0,1.691-0.312,2.431-1.794 c0.113,0.263,0.266,0.505,0.474,0.705c0,0,0.751,1.213,2.649,1.456c0,0,2.103,0.244,4.54-0.367c0,0,2.102-0.38,2.65-2.339 c0.297-0.004,0.663-0.097,1.149-0.374C24.244,18.198,25.937,17.111,24.989,15.893z M13.671,8.145c0-1.883,1.527-3.409,3.409-3.409 c1.884,0,3.414,1.526,3.414,3.409c0,1.884-1.53,3.411-3.414,3.411C15.198,11.556,13.671,10.029,13.671,8.145z M13.376,12.348 l0.216,0.516c0,0-0.155,0.466-0.363,1.069c-0.194-0.217-0.388-0.437-0.585-0.661L13.376,12.348z M3.576,8.145 c0-1.883,1.525-3.409,3.41-3.409c1.881,0,3.408,1.526,3.408,3.409c0,1.884-1.527,3.411-3.408,3.411 C5.102,11.556,3.576,10.029,3.576,8.145z M2.186,16.398c-0.033,0.07-0.065,0.133-0.091,0.177c-0.801,0.605-1.188,0.216-1.449,0 c-0.259-0.216,0-0.906,0-0.906l2.636-3.321l0.212,0.516c0,0-0.227,0.682-0.503,1.47l-0.665,1.49 C2.325,15.824,2.257,16.049,2.186,16.398z M9.299,20.361c-2.022,0.507-3.758,0.304-3.758,0.304 c-1.574-0.201-2.196-1.204-2.196-1.204c-1.121-1.066-0.348-3.585-0.348-3.585l1.699-3.823c0.671,0.396,1.451,0.627,2.29,0.627 c0.584,0,1.141-0.114,1.656-0.316l2.954,5.417C11.482,19.968,9.299,20.361,9.299,20.361z M9.792,12.758l0.885-0.66 c0,0,2.562,2.827,3.181,3.623c0.617,0.794-0.49,1.501-0.75,1.723c-0.259,0.147-0.464,0.206-0.635,0.226L9.792,12.758z M19.394,20.361c-2.018,0.507-3.758,0.304-3.758,0.304c-1.569-0.201-2.191-1.204-2.191-1.204c-0.182-0.175-0.311-0.389-0.403-0.624 c0.201-0.055,0.433-0.15,0.698-0.301c0.405-0.337,2.102-1.424,1.154-2.643c-0.24-0.308-0.678-0.821-1.184-1.405l1.08-2.435 c0.674,0.396,1.457,0.627,2.293,0.627c0.585,0,1.144-0.114,1.654-0.316l2.955,5.417C21.582,19.968,19.394,20.361,19.394,20.361z M23.201,17.444c-0.255,0.147-0.461,0.206-0.63,0.226l-2.68-4.912l0.879-0.66c0,0,2.562,2.827,3.181,3.623 C24.57,16.516,23.466,17.223,23.201,17.444z"></path>
                </svg>
                <span>Shared</span>
              </div>
            </button>
          </nav>
        </div>

        {upcomingView === "week" ? (
          <div className="mt-4 space-y-2">
            {upcomingWeek.length === 0 && (
              <div className="text-sm text-foreground/70">
                No upcoming events this week.
              </div>
            )}
            {upcomingWeek
              .slice()
              .sort(
                (a, b) =>
                  new Date(a.start).getTime() - new Date(b.start).getTime()
              )
              .map((ev) => {
                const isShared = isSharedEvent(ev);
                const chosenColorName = ev.category
                  ? categoryColors[ev.category] ||
                    defaultCategoryColor(ev.category)
                  : "";
                const tone = isShared
                  ? { tint: sharedGradientTint, dot: "" }
                  : chosenColorName
                  ? colorTintAndDot(chosenColorName)
                  : { tint: "bg-surface/60", dot: "bg-foreground/40" };
                return (
                  <button
                    key={ev.id}
                    type="button"
                    onClick={() => setOpenEvent(ev)}
                    className={`w-full text-left rounded-md ${tone.tint} ${
                      isShared ? SHARED_TEXT_CLASS : "text-foreground"
                    } px-3 py-2 text-sm shadow-sm transition-transform transition-shadow hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20`}
                    title={ev.title}
                  >
                    <div className="flex items-center gap-3">
                      <span className="truncate font-medium inline-flex items-center gap-2">
                        {isShared && (
                          <svg
                            viewBox="0 0 25.274 25.274"
                            fill="currentColor"
                            className="h-3.5 w-3.5 opacity-70"
                            aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path d="M24.989,15.893c-0.731-0.943-3.229-3.73-4.34-4.96c0.603-0.77,0.967-1.733,0.967-2.787c0-2.503-2.03-4.534-4.533-4.534 c-2.507,0-4.534,2.031-4.534,4.534c0,1.175,0.455,2.24,1.183,3.045l-1.384,1.748c-0.687-0.772-1.354-1.513-1.792-2.006 c0.601-0.77,0.966-1.733,0.966-2.787c-0.001-2.504-2.03-4.535-4.536-4.535c-2.507,0-4.536,2.031-4.536,4.534 c0,1.175,0.454,2.24,1.188,3.045L0.18,15.553c0,0-0.406,1.084,0,1.424c0.36,0.3,0.887,0.81,1.878,0.258 c-0.107,0.974-0.054,2.214,0.693,2.924c0,0,0.749,1.213,2.65,1.456c0,0,2.1,0.244,4.543-0.367c0,0,1.691-0.312,2.431-1.794 c0.113,0.263,0.266,0.505,0.474,0.705c0,0,0.751,1.213,2.649,1.456c0,0,2.103,0.244,4.54-0.367c0,0,2.102-0.38,2.65-2.339 c0.297-0.004,0.663-0.097,1.149-0.374C24.244,18.198,25.937,17.111,24.989,15.893z M13.671,8.145c0-1.883,1.527-3.409,3.409-3.409 c1.884,0,3.414,1.526,3.414,3.409c0,1.884-1.53,3.411-3.414,3.411C15.198,11.556,13.671,10.029,13.671,8.145z M13.376,12.348 l0.216,0.516c0,0-0.155,0.466-0.363,1.069c-0.194-0.217-0.388-0.437-0.585-0.661L13.376,12.348z M3.576,8.145 c0-1.883,1.525-3.409,3.41-3.409c1.881,0,3.408,1.526,3.408,3.409c0,1.884-1.527,3.411-3.408,3.411 C5.102,11.556,3.576,10.029,3.576,8.145z M2.186,16.398c-0.033,0.07-0.065,0.133-0.091,0.177c-0.801,0.605-1.188,0.216-1.449,0 c-0.259-0.216,0-0.906,0-0.906l2.636-3.321l0.212,0.516c0,0-0.227,0.682-0.503,1.47l-0.665,1.49 C2.325,15.824,2.257,16.049,2.186,16.398z M9.299,20.361c-2.022,0.507-3.758,0.304-3.758,0.304 c-1.574-0.201-2.196-1.204-2.196-1.204c-1.121-1.066-0.348-3.585-0.348-3.585l1.699-3.823c0.671,0.396,1.451,0.627,2.29,0.627 c0.584,0,1.141-0.114,1.656-0.316l2.954,5.417C11.482,19.968,9.299,20.361,9.299,20.361z M9.792,12.758l0.885-0.66 c0,0,2.562,2.827,3.181,3.623c0.617,0.794-0.49,1.501-0.75,1.723c-0.259,0.147-0.464,0.206-0.635,0.226L9.792,12.758z M19.394,20.361c-2.018,0.507-3.758,0.304-3.758,0.304c-1.569-0.201-2.191-1.204-2.191-1.204c-0.182-0.175-0.311-0.389-0.403-0.624 c0.201-0.055,0.433-0.15,0.698-0.301c0.405-0.337,2.102-1.424,1.154-2.643c-0.24-0.308-0.678-0.821-1.184-1.405l1.08-2.435 c0.674,0.396,1.457,0.627,2.293,0.627c0.585,0,1.144-0.114,1.654-0.316l2.955,5.417C21.582,19.968,19.394,20.361,19.394,20.361z M23.201,17.444c-0.255,0.147-0.461,0.206-0.63,0.226l-2.68-4.912l0.879-0.66c0,0,2.562,2.827,3.181,3.623 C24.57,16.516,23.466,17.223,23.201,17.444z"></path>
                          </svg>
                        )}
                        {ev.title}
                      </span>
                    </div>
                    <div
                      className={`mt-0.5 text-xs ${
                        isShared
                          ? SHARED_MUTED_TEXT_CLASS
                          : "text-foreground/70"
                      } truncate`}
                    >
                      {ev.venue || ev.location
                        ? `${formatEventDateTime(
                            ev.start
                          )} at ${pickLocationLabel(ev.venue, ev.location)}`
                        : formatEventDateTime(ev.start)}
                    </div>
                  </button>
                );
              })}
          </div>
        ) : upcomingView === "month" ? (
          <div className="mt-4 space-y-4">
            {groupedByMonth.length === 0 && (
              <div className="text-sm text-foreground/70">
                No upcoming events.
              </div>
            )}
            {groupedByMonth.map((group, idx) => (
              <div
                key={idx}
                className="border border-border rounded-md overflow-hidden"
              >
                <div className="px-3 py-2 bg-surface/60 text-sm text-foreground/80 border-b border-border">
                  {group.label}
                </div>
                <ul className="mt-1.5 flex flex-col gap-2 md:grid md:grid-cols-2 md:gap-3 md:p-3 md:pt-3 md:pb-4">
                  {group.items
                    .slice()
                    .sort(
                      (a, b) =>
                        new Date(a.start).getTime() -
                        new Date(b.start).getTime()
                    )
                    .map((ev) => {
                      const isShared = isSharedEvent(ev);
                      const chosenColorName = ev.category
                        ? categoryColors[ev.category] ||
                          defaultCategoryColor(ev.category)
                        : "";
                      const tone = isShared
                        ? {
                            tint: sharedGradientTint,
                            dot: "",
                          }
                        : chosenColorName
                        ? colorTintAndDot(chosenColorName)
                        : { tint: "bg-surface/60", dot: "bg-foreground/40" };
                      return (
                        <li key={ev.id} className="md:h-full">
                          <button
                            type="button"
                            onClick={() => setOpenEvent(ev)}
                            className={`w-full text-left rounded-md ${
                              tone.tint
                            } ${
                              isShared ? SHARED_TEXT_CLASS : "text-foreground"
                            } px-3 py-2 text-sm shadow-sm transition-transform transition-shadow hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20 md:h-full`}
                            title={ev.title}
                          >
                            <div className="flex items-center gap-3">
                              <span className="truncate font-medium">
                                {ev.title}
                              </span>
                            </div>
                            <div
                              className={`mt-0.5 text-xs ${
                                isShared
                                  ? SHARED_MUTED_TEXT_CLASS
                                  : "text-foreground/70"
                              } truncate`}
                            >
                              {ev.venue || ev.location
                                ? `${formatEventDateTime(
                                    ev.start
                                  )} at ${pickLocationLabel(ev.venue, ev.location)}`
                                : formatEventDateTime(ev.start)}
                            </div>
                          </button>
                        </li>
                      );
                    })}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4 space-y-2">
            {upcomingShared.length === 0 && (
              <div className="text-sm text-foreground/70">
                No upcoming shared events.
              </div>
            )}
            {upcomingShared
              .slice()
              .sort(
                (a, b) =>
                  new Date(a.start).getTime() - new Date(b.start).getTime()
              )
              .map((ev) => {
                const isShared = isSharedEvent(ev);
                const chosenColorName = ev.category
                  ? categoryColors[ev.category] ||
                    defaultCategoryColor(ev.category)
                  : "";
                const tone = isShared
                  ? { tint: sharedGradientTint, dot: "" }
                  : chosenColorName
                  ? colorTintAndDot(chosenColorName)
                  : { tint: "bg-surface/60", dot: "bg-foreground/40" };
                return (
                  <button
                    key={ev.id}
                    type="button"
                    onClick={() => setOpenEvent(ev)}
                    className={`w-full text-left rounded-md ${tone.tint} ${
                      isShared ? SHARED_TEXT_CLASS : "text-foreground"
                    } px-3 py-2 text-sm shadow-sm transition-transform transition-shadow hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20`}
                    title={ev.title}
                  >
                    <div className="flex items-center gap-3">
                      <span className="truncate font-medium inline-flex items-center gap-2">
                        {isShared && (
                          <svg
                            viewBox="0 0 25.274 25.274"
                            fill="currentColor"
                            className="h-3.5 w-3.5 opacity-70"
                            aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path d="M24.989,15.893c-0.731-0.943-3.229-3.73-4.34-4.96c0.603-0.77,0.967-1.733,0.967-2.787c0-2.503-2.03-4.534-4.533-4.534 c-2.507,0-4.534,2.031-4.534,4.534c0,1.175,0.455,2.24,1.183,3.045l-1.384,1.748c-0.687-0.772-1.354-1.513-1.792-2.006 c0.601-0.77,0.966-1.733,0.966-2.787c-0.001-2.504-2.03-4.535-4.536-4.535c-2.507,0-4.536,2.031-4.536,4.534 c0,1.175,0.454,2.24,1.188,3.045L0.18,15.553c0,0-0.406,1.084,0,1.424c0.36,0.3,0.887,0.81,1.878,0.258 c-0.107,0.974-0.054,2.214,0.693,2.924c0,0,0.749,1.213,2.65,1.456c0,0,2.1,0.244,4.543-0.367c0,0,1.691-0.312,2.431-1.794 c0.113,0.263,0.266,0.505,0.474,0.705c0,0,0.751,1.213,2.649,1.456c0,0,2.103,0.244,4.54-0.367c0,0,2.102-0.38,2.65-2.339 c0.297-0.004,0.663-0.097,1.149-0.374C24.244,18.198,25.937,17.111,24.989,15.893z M13.671,8.145c0-1.883,1.527-3.409,3.409-3.409 c1.884,0,3.414,1.526,3.414,3.409c0,1.884-1.53,3.411-3.414,3.411C15.198,11.556,13.671,10.029,13.671,8.145z M13.376,12.348 l0.216,0.516c0,0-0.155,0.466-0.363,1.069c-0.194-0.217-0.388-0.437-0.585-0.661L13.376,12.348z M3.576,8.145 c0-1.883,1.525-3.409,3.41-3.409c1.881,0,3.408,1.526,3.408,3.409c0,1.884-1.527,3.411-3.408,3.411 C5.102,11.556,3.576,10.029,3.576,8.145z M2.186,16.398c-0.033,0.07-0.065,0.133-0.091,0.177c-0.801,0.605-1.188,0.216-1.449,0 c-0.259-0.216,0-0.906,0-0.906l2.636-3.321l0.212,0.516c0,0-0.227,0.682-0.503,1.47l-0.665,1.49 C2.325,15.824,2.257,16.049,2.186,16.398z M9.299,20.361c-2.022,0.507-3.758,0.304-3.758,0.304 c-1.574-0.201-2.196-1.204-2.196-1.204c-1.121-1.066-0.348-3.585-0.348-3.585l1.699-3.823c0.671,0.396,1.451,0.627,2.29,0.627 c0.584,0,1.141-0.114,1.656-0.316l2.954,5.417C11.482,19.968,9.299,20.361,9.299,20.361z M9.792,12.758l0.885-0.66 c0,0,2.562,2.827,3.181,3.623c0.617,0.794-0.49,1.501-0.75,1.723c-0.259,0.147-0.464,0.206-0.635,0.226L9.792,12.758z M19.394,20.361c-2.018,0.507-3.758,0.304-3.758,0.304c-1.569-0.201-2.191-1.204-2.191-1.204c-0.182-0.175-0.311-0.389-0.403-0.624 c0.201-0.055,0.433-0.15,0.698-0.301c0.405-0.337,2.102-1.424,1.154-2.643c-0.24-0.308-0.678-0.821-1.184-1.405l1.08-2.435 c0.674,0.396,1.457,0.627,2.293,0.627c0.585,0,1.144-0.114,1.654-0.316l2.955,5.417C21.582,19.968,19.394,20.361,19.394,20.361z M23.201,17.444c-0.255,0.147-0.461,0.206-0.63,0.226l-2.68-4.912l0.879-0.66c0,0,2.562,2.827,3.181,3.623 C24.57,16.516,23.466,17.223,23.201,17.444z"></path>
                          </svg>
                        )}
                        {ev.title}
                      </span>
                    </div>
                    <div
                      className={`mt-0.5 text-xs ${
                        isShared
                          ? SHARED_MUTED_TEXT_CLASS
                          : "text-foreground/70"
                      } truncate`}
                    >
                      {ev.venue || ev.location
                        ? `${formatEventDateTime(
                            ev.start
                          )} at ${pickLocationLabel(ev.venue, ev.location)}`
                        : formatEventDateTime(ev.start)}
                    </div>
                  </button>
                );
              })}
          </div>
        )}
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
              <div className="flex items-center gap-2">
                {startOfDay(openDay.date) >= today && (
                  <button
                    type="button"
                    onClick={() => {
                      setOpenDay(null);
                      setCreateDefaultDate(startOfDay(openDay.date));
                      setCreateOpen(true);
                    }}
                    className="rounded-md border border-border bg-surface px-2.5 py-1.5 text-sm hover:bg-foreground/5 inline-flex items-center gap-2"
                    title="Add event"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="miter"
                      className="h-4 w-4"
                      aria-hidden="true"
                    >
                      <rect x="2" y="4" width="20" height="18" rx="0"></rect>
                      <line x1="7" y1="2" x2="7" y2="6"></line>
                      <line x1="17" y1="2" x2="17" y2="6"></line>
                      <line x1="8" y1="13" x2="16" y2="13"></line>
                      <line x1="12" y1="9" x2="12" y2="17"></line>
                    </svg>
                    <span>Add event</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setOpenDay(null)}
                  className="text-foreground/70 hover:text-foreground"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="mt-3 space-y-2">
              {openDay.items.map((ev) => {
                const isShared = isSharedEvent(ev);
                const chosenColorName = ev.category
                  ? categoryColors[ev.category] ||
                    defaultCategoryColor(ev.category)
                  : "";
                const tone = isShared
                  ? { tint: sharedGradientTint, dot: "" }
                  : chosenColorName
                  ? colorTintAndDot(chosenColorName)
                  : { tint: "bg-surface/60", dot: "bg-foreground/40" };
                return (
                  <button
                    key={ev.id}
                    onClick={() => {
                      setOpenDay(null);
                      setOpenEvent(ev);
                    }}
                    className={`w-full text-left rounded-md ${tone.tint} ${
                      isShared ? SHARED_TEXT_CLASS : "text-foreground"
                    } px-3 py-2 text-sm shadow-sm transition-transform transition-shadow hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20`}
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
            className="relative z-50 w-full sm:max-w-xl sm:rounded-xl border border-border bg-surface p-4 sm:p-6 shadow-xl sm:mx-auto space-y-4 event-theme-scope"
            style={openEventStyleVars}
            onClick={(e) => e.stopPropagation()}
          >
            <section className="event-theme-header rounded-xl border px-4 py-4 sm:px-5 sm:py-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="event-theme-chip flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-2xl shadow-sm ring-1 ring-black/5 dark:ring-white/10">
                    <span aria-hidden="true">{openEventIcon}</span>
                    <span className="sr-only">{openEventCategoryLabel} icon</span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wide opacity-80">
                      {openEventCategoryLabel}
                    </p>
                    <h2 className="text-lg font-semibold leading-tight sm:text-xl">
                      {openEvent.title}
                    </h2>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOpenEvent(null)}
                  className="text-foreground/70 hover:text-foreground"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
            </section>

            <section className="event-theme-card rounded-xl border px-4 py-4 text-sm shadow-sm">
              <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {openEvent.start && (
                  <div className="sm:col-span-2">
                    <dt className="text-xs font-semibold uppercase tracking-wide opacity-70">
                      When
                    </dt>
                    <dd className="mt-1 break-all font-semibold">
                      {formatEventRangeLabel(openEvent.start, openEvent.end, {
                        timeZone: openEvent.timezone,
                        allDay: openEvent.allDay,
                      })}
                    </dd>
                  </div>
                )}
                {openEvent.venue && (
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide opacity-70">
                      Venue
                    </dt>
                    <dd className="mt-1 font-semibold">{openEvent.venue}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide opacity-70">
                    {openEvent.venue ? "Address" : "Location"}
                  </dt>
                  <dd className="mt-1 font-semibold">{openEvent.location || "—"}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs font-semibold uppercase tracking-wide opacity-70">
                    Repeats
                  </dt>
                  <dd className="mt-1 font-semibold">
                    {(() => {
                      try {
                        const r = (openEvent as any).recurrence as
                          | string
                          | undefined;
                        if (!r || !/FREQ=WEEKLY/i.test(r)) return "—";
                        const m = r.match(/BYDAY=([^;]+)/i);
                        const map: Record<string, string> = {
                          SU: "Sun",
                          MO: "Mon",
                          TU: "Tue",
                          WE: "Wed",
                          TH: "Thu",
                          FR: "Fri",
                          SA: "Sat",
                        };
                        const list = m
                          ? m[1]
                              .split(",")
                              .map(
                                (s) => map[s.trim().toUpperCase()] || s.trim()
                              )
                          : [];
                        if (!list.length) return "Weekly";
                        if (list.length === 1) return `Weekly on ${list[0]}`;
                        if (list.length === 2)
                          return `Weekly on ${list[0]} & ${list[1]}`;
                        return `Weekly on ${list.slice(0, -1).join(", ")} & ${
                          list[list.length - 1]
                        }`;
                      } catch {
                        return "—";
                      }
                    })()}
                  </dd>
                </div>
              </dl>
            </section>

            {openEvent.description && (
              <section className="event-theme-card rounded-xl border px-4 py-4 text-sm shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide opacity-70">
                  Description
                </p>
                <p className="mt-2 whitespace-pre-wrap leading-relaxed">
                  {openEvent.description}
                </p>
              </section>
            )}

            <div className="pt-4 border-t border-border">
              <EventActions
                shareUrl={`/event/${slugify(openEvent.title)}-${
                  openEvent.historyId
                }`}
                historyId={openEvent.historyId}
                event={{
                  title: openEvent.title,
                  start: openEvent.start,
                  end: openEvent.end || null,
                  location: openEvent.location || "",
                  venue: openEvent.venue || null,
                  description: openEvent.description || "",
                  timezone: openEvent.timezone || "",
                  rsvp: (openEvent as any)?.rsvp || null,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Create new event modal */}
      <EventCreateModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        defaultDate={createDefaultDate}
      />
    </div>
  );
}
