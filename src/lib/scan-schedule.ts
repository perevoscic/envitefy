import {
  parseCalendarDateTimeToIso,
  formatCalendarDateTimeInTimeZone,
  addCalendarDays,
} from "./calendar-date-time.ts";
import { parseDayCode } from "./ocr/practice-schedule.ts";
import type { NormalizedEvent } from "./mappers.ts";

export type ScanScheduleItemType = "practice" | "game" | "test" | "deadline" | "event" | "closure";

export type ScanScheduleItem = {
  id: string;
  type: ScanScheduleItemType;
  title: string;
  group: string | null;
  day: string | null;
  date: string | null;
  /** Last printed calendar day, inclusive. Calendar adapters make it exclusive. */
  endDate?: string | null;
  yearInferred?: boolean;
  sourceText?: string | null;
  calendarSelected?: boolean;
  startTime: string | null;
  endTime: string | null;
  startAt: string | null;
  endAt: string | null;
  timezone: string;
  locationText: string | null;
  opponent: string | null;
  homeAway: "home" | "away" | null;
  notes: string | null;
  status: string;
};
export type ScanSchedule = {
  kind?: "school-memo";
  issueDate?: string | null;
  title: string;
  timeframe: string | null;
  timezone: string;
  items: ScanScheduleItem[];
};

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}
function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
function list(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}
function timezone(value: unknown): string {
  const candidate = text(value) || "UTC";
  try {
    new Intl.DateTimeFormat("en", { timeZone: candidate });
    return candidate;
  } catch {
    return "UTC";
  }
}
function localDate(value: unknown): string | null {
  const valueText = text(value);
  const candidate = valueText?.match(/^\d{4}-\d{2}-\d{2}/)?.[0];
  if (!candidate) return null;
  const parsed = new Date(candidate + "T12:00:00Z");
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === candidate
    ? candidate
    : null;
}
function localTime(value: unknown): string | null {
  const valueText = text(value);
  if (!valueText) return null;
  const match = valueText.match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
  if (!match) return valueText; // Preserve printed TBD or ambiguous times for review.
  let hour = Number(match[1]);
  const minute = Number(match[2]);
  if (minute > 59 || hour > 23 || (match[3] && (hour < 1 || hour > 12))) return valueText;
  if (match[3]) hour = (hour % 12) + (match[3].toUpperCase() === "PM" ? 12 : 0);
  return `${String(hour).padStart(2, "0")}:${match[2]}`;
}
function iso(value: unknown, tz: string): string | null {
  const source = text(value);
  return source ? parseCalendarDateTimeToIso(source, tz) : null;
}

/** Normalize at the OCR/storage boundary; keep missing dates and times explicit. */
export function normalizeScanSchedule(value: unknown): ScanSchedule | null {
  const source = record(value);
  const tz = timezone(source.timezone);
  const schoolMemo = source.kind === "school-memo";
  const usedIds = new Set<string>();
  const items = list(source.items).flatMap((value, index): ScanScheduleItem[] => {
    const row = record(value);
    const title = text(row.title);
    if (!title) return [];
    const rowTz = timezone(row.timezone || tz);
    const day = parseDayCode(text(row.day) || "")?.code || null;
    const storedStart = text(row.startAt || row.start);
    const storedEnd = text(row.endAt || row.end);
    const timedStart =
      storedStart?.includes("T") && row.allDay !== true
        ? formatCalendarDateTimeInTimeZone(storedStart, rowTz)
        : null;
    const timedEnd =
      storedEnd?.includes("T") && row.allDay !== true
        ? formatCalendarDateTimeInTimeZone(storedEnd, rowTz)
        : null;
    const date =
      localDate(row.date) ||
      (row.type !== "practice" ? localDate(timedStart || storedStart) : null);
    const printedEndDate = localDate(row.endDate);
    const endDate = date && printedEndDate && printedEndDate >= date ? printedEndDate : null;
    const startTime = localTime(row.startTime || timedStart?.slice(11, 16));
    const endTime = localTime(row.endTime || timedEnd?.slice(11, 16));
    const datedStart =
      date && startTime && /^\d{2}:\d{2}$/.test(startTime) ? `${date}T${startTime}:00` : null;
    const datedEnd =
      date && endTime && /^\d{2}:\d{2}$/.test(endTime) ? `${endDate || date}T${endTime}:00` : null;
    // Weekly sessions have no invented next occurrence or infinite recurrence.
    const weekly = row.type === "practice" && day && !date;
    const dateOnly = schoolMemo && !datedStart && !timedStart;
    let id =
      text(row.id) ||
      (schoolMemo ? `memo-${globalThis.crypto.randomUUID()}` : `schedule-${index + 1}`);
    // Assign once at the boundary; IDs are retained through edits, reordering and saving.
    if (usedIds.has(id)) id = `memo-${globalThis.crypto.randomUUID()}`;
    usedIds.add(id);
    const itemType = ["practice", "game", "test", "deadline", "event", "closure"].includes(
      String(row.type),
    )
      ? (row.type as ScanScheduleItemType)
      : "game";
    return [
      {
        id,
        type: itemType,
        title,
        group: text(row.group),
        day,
        date,
        ...(schoolMemo || "endDate" in row ? { endDate } : {}),
        ...(typeof row.yearInferred === "boolean" ? { yearInferred: row.yearInferred } : {}),
        ...("sourceText" in row ? { sourceText: text(row.sourceText) } : {}),
        ...(typeof row.calendarSelected === "boolean"
          ? { calendarSelected: row.calendarSelected }
          : {}),
        startTime,
        endTime,
        startAt:
          weekly || row.allDay === true || dateOnly
            ? null
            : iso(datedStart || row.startAt || row.start, rowTz),
        endAt:
          weekly || row.allDay === true || dateOnly
            ? null
            : iso(datedEnd || row.endAt || row.end, rowTz),
        timezone: rowTz,
        locationText: text(row.locationText || row.location || row.venue),
        opponent: text(row.opponent),
        homeAway: row.homeAway === "home" || row.homeAway === "away" ? row.homeAway : null,
        notes: text(row.notes || row.description),
        status: text(row.status) || "scheduled",
      },
    ];
  });
  return items.length || schoolMemo
    ? {
        ...(schoolMemo
          ? { kind: "school-memo" as const, issueDate: localDate(source.issueDate) }
          : {}),
        title: text(source.title) || (schoolMemo ? "School memo" : "Team schedule"),
        timeframe: text(source.timeframe),
        timezone: tz,
        items,
      }
    : null;
}

/** Every upload entry point uses this adapter, before narrowing the OCR response. */
export function scanScheduleFromOcr(value: unknown): ScanSchedule | null {
  const source = record(value);
  const canonical = normalizeScanSchedule(source.scanSchedule);
  if (canonical) return canonical;
  const practice = record(source.practiceSchedule);
  const games = record(source.schedule);
  const fields = record(source.fieldsGuess);
  const tz = timezone(practice.timezone || games.timezone || fields.timezone);
  const practiceItems = list(practice.groups).flatMap((value) => {
    const group = record(value);
    const groupName = text(group.name) || "Team";
    return list(group.sessions).flatMap((value) => {
      const session = record(value);
      if (session.hasPractice === false) return [];
      return [
        {
          ...session,
          type: "practice",
          title: `${groupName} Practice`,
          group: groupName,
          locationText: session.location || group.location || fields.location || fields.venue,
          notes: [text(group.note), text(session.note)].filter(Boolean).join(" · "),
        },
      ];
    });
  });
  // 'events' and 'schedule.games' are parallel views of the same rows. Prefer
  // the complete events, while filling additional opponent/venue metadata.
  const rawGames = list(games.games);
  const events = list(source.events);
  const gameRows = events.length
    ? [
        ...events.map((event, index) => ({ ...record(rawGames[index]), ...record(event) })),
        ...rawGames.slice(events.length),
      ]
    : rawGames;
  const gameItems = gameRows.map((value) => {
    const row = record(value);
    const opponent = text(row.opponent);
    const homeAway =
      row.homeAway || (row.home === true ? "home" : row.home === false ? "away" : null);
    return {
      ...row,
      type: "game",
      homeAway,
      title:
        text(row.title) ||
        (opponent
          ? `${text(games.homeTeam) || "Team"} ${homeAway === "away" ? "at" : "vs"} ${opponent}`
          : "Game"),
      date: row.date,
      startAt: row.allDay === true ? null : row.start,
      endAt: row.end,
      startTime: row.time || row.startTime,
      locationText: row.location || row.venue || row.address,
    };
  });
  return normalizeScanSchedule({
    title: practice.title || games.title || fields.title,
    timeframe: practice.timeframe || games.season,
    timezone: tz,
    items: [...practiceItems, ...gameItems],
  });
}

/** Keep list/dashboard timing in sync with the reviewed schedule. */
export function scanScheduleHistoryFields(schedule: ScanSchedule) {
  if (schedule.kind === "school-memo") {
    // A memo aggregates dates. Its issue date is not another calendar event.
    return {
      startAt: null,
      startISO: null,
      start: null,
      endAt: null,
      endISO: null,
      end: null,
      timezone: schedule.timezone,
      tz: schedule.timezone,
      timeFound: false,
      allDay: false,
      scheduleLine: `${schedule.items.length} dates`,
    };
  }
  const firstDated = schedule.items.find((item) => item.startAt);
  const start = firstDated?.startAt || null;
  const end = firstDated?.endAt || null;
  return {
    startAt: start,
    startISO: start,
    start,
    endAt: end,
    endISO: end,
    end,
    timezone: schedule.timezone,
    tz: schedule.timezone,
    timeFound: Boolean(start),
    allDay: false,
    scheduleLine: schedule.timeframe || schedule.items.length + " sessions and games",
  };
}

/** The source model keeps unknown times unknown, even when exported as all-day. */
export type ScanScheduleCalendarEvent = Omit<NormalizedEvent, "end"> & {
  end: string | null;
  uid: string;
};

/** Saved IDs, rather than a title/date hash, keep exports stable after corrections. */
export function scanScheduleCalendarUid(itemId: string, parentEventId?: string | null): string {
  const identity = [parentEventId || "scan", itemId].join(":");
  const escaped = encodeURIComponent(identity).replace(
    /[!'()*]/g,
    (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
  );
  return `${escaped}@envitefy.com`;
}

export function scanScheduleCalendarEvent(
  item: ScanScheduleItem,
  schedule: ScanSchedule,
  parentEventId?: string | null,
): ScanScheduleCalendarEvent | null {
  if (/^cancel(?:led|ed)$/i.test(item.status) || !item.id || !item.title.trim()) return null;
  const date = localDate(item.date);
  const timedStart = item.startAt && iso(item.startAt, item.timezone || schedule.timezone);
  const allDay = !timedStart;
  if (!timedStart && !date) return null;
  const rangeEnd = localDate(item.endDate);
  const start = timedStart || date!;
  const timedEnd = item.endAt && iso(item.endAt, item.timezone || schedule.timezone);
  const end = allDay
    ? addCalendarDays(rangeEnd && rangeEnd >= date! ? rangeEnd : date!, 1)
    : timedEnd && Date.parse(timedEnd) > Date.parse(start)
      ? timedEnd
      : null;
  if (allDay && !end) return null;
  const notes = [item.notes];
  if (
    allDay &&
    item.startTime &&
    !/^\d{2}:\d{2}$/.test(item.startTime) &&
    !item.notes?.includes(item.startTime)
  )
    notes.push(`Time: ${item.startTime}`);
  if (allDay && schedule.kind === "school-memo" && !item.startTime)
    notes.push("Time not specified in the memo.");
  return {
    title: item.title,
    start,
    end,
    allDay,
    timezone: item.timezone || schedule.timezone,
    location: item.locationText || "",
    description: notes.filter(Boolean).join("\n\n"),
    recurrence: null,
    reminders: [],
    uid: scanScheduleCalendarUid(item.id, parentEventId),
  };
}

export const WEEKDAY_LABELS: Record<string, string> = {
  MO: "Monday",
  TU: "Tuesday",
  WE: "Wednesday",
  TH: "Thursday",
  FR: "Friday",
  SA: "Saturday",
  SU: "Sunday",
};
export function scanScheduleWhen(
  item: ScanScheduleItem,
  schedule?: Pick<ScanSchedule, "kind">,
): string {
  const day = item.day ? `Every ${WEEKDAY_LABELS[item.day] || item.day}` : null;
  const formatDate = (value: string) =>
    new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    }).format(new Date(`${value}T12:00:00Z`));
  const date = item.date
    ? [
        formatDate(item.date),
        item.endDate && item.endDate > item.date ? formatDate(item.endDate) : null,
      ]
        .filter(Boolean)
        .join("–")
    : null;
  const clock = (value: string | null) => {
    if (!value || !/^\d{2}:\d{2}$/.test(value)) return value;
    const hour = Number(value.slice(0, 2));
    return `${hour % 12 || 12}:${value.slice(3)} ${hour >= 12 ? "PM" : "AM"}`;
  };
  let time = [clock(item.startTime), clock(item.endTime)].filter(Boolean).join("–");
  if (!time && item.startAt)
    time = new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: item.timezone,
    }).format(new Date(item.startAt));
  if (!time && schedule?.kind === "school-memo") {
    return [
      date || "Date not provided",
      item.type === "closure" || item.endDate ? null : "Time not provided",
    ]
      .filter(Boolean)
      .join(" · ");
  }
  return [date || day || "Date TBD", time || "Time TBD"].join(" · ");
}
