import type {
  PracticeGroupOutput,
  PracticeScheduleOutput,
  PracticeSessionOutput,
} from "./types";

export const DAY_NAME_TO_INDEX: Record<string, { index: number; code: string }> = {
  sunday: { index: 0, code: "SU" },
  sun: { index: 0, code: "SU" },
  mon: { index: 1, code: "MO" },
  monday: { index: 1, code: "MO" },
  tue: { index: 2, code: "TU" },
  tues: { index: 2, code: "TU" },
  tuesday: { index: 2, code: "TU" },
  wed: { index: 3, code: "WE" },
  weds: { index: 3, code: "WE" },
  wednesday: { index: 3, code: "WE" },
  thu: { index: 4, code: "TH" },
  thur: { index: 4, code: "TH" },
  thurs: { index: 4, code: "TH" },
  thursday: { index: 4, code: "TH" },
  fri: { index: 5, code: "FR" },
  friday: { index: 5, code: "FR" },
  sat: { index: 6, code: "SA" },
  saturday: { index: 6, code: "SA" },
};

type PracticeHeuristicGroup = {
  name: string;
  note: string | null;
  values: Array<{ label: string; note: string | null }>;
};

export function parseDayCode(day?: string | null): { index: number; code: string } | null {
  if (!day) return null;
  const key = day.trim().toLowerCase();
  if ((DAY_NAME_TO_INDEX as any)[key]) return DAY_NAME_TO_INDEX[key];
  const short = key.slice(0, 3);
  if ((DAY_NAME_TO_INDEX as any)[short]) return DAY_NAME_TO_INDEX[short];
  const upper = day.trim().toUpperCase();
  switch (upper) {
    case "MON":
      return DAY_NAME_TO_INDEX.mon;
    case "TUE":
    case "TUES":
      return DAY_NAME_TO_INDEX.tue;
    case "WED":
      return DAY_NAME_TO_INDEX.wed;
    case "THU":
    case "THUR":
    case "THURS":
      return DAY_NAME_TO_INDEX.thu;
    case "FRI":
      return DAY_NAME_TO_INDEX.fri;
    case "SAT":
      return DAY_NAME_TO_INDEX.sat;
    case "SUN":
      return DAY_NAME_TO_INDEX.sun;
    default:
      return null;
  }
}

export function parseTimeTo24h(value?: string | null): { hour: number; minute: number } | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const twelveHour = trimmed.match(/^(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?|am|pm)?$/i);
  if (twelveHour) {
    let hour = Number(twelveHour[1]);
    const minute = Number(twelveHour[2] || "0");
    const mer = (twelveHour[3] || "").toLowerCase();
    if (mer.includes("p") && hour < 12) hour += 12;
    if (mer.includes("a") && hour === 12) hour = 0;
    return { hour: hour % 24, minute: minute % 60 };
  }
  const twentyFour = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (twentyFour) {
    const hour = Number(twentyFour[1]);
    const minute = Number(twentyFour[2]);
    if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) return { hour, minute };
  }
  return null;
}

export function parseTimeRange(text?: string | null): {
  start?: { hour: number; minute: number } | null;
  end?: { hour: number; minute: number } | null;
} {
  if (!text) return { start: null, end: null };
  const cleaned = text.replace(/–|—/g, "-");
  const rangeMatch = cleaned.match(
    /(\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?|am|pm)?)[^\d]{1,4}(\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?|am|pm)?)/i,
  );
  if (rangeMatch) {
    return {
      start: parseTimeTo24h(rangeMatch[1]),
      end: parseTimeTo24h(rangeMatch[2]),
    };
  }
  return { start: parseTimeTo24h(cleaned), end: null };
}

function getLocalNowInTimezone(tz: string): Date {
  const now = new Date();
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).formatToParts(now);
    const obj: Record<string, string> = {};
    for (const part of parts) {
      if (part.type !== "literal") obj[part.type] = part.value;
    }
    return new Date(
      Number(obj.year || now.getFullYear()),
      Number(obj.month || now.getMonth() + 1) - 1,
      Number(obj.day || now.getDate()),
      Number(obj.hour || now.getHours()),
      Number(obj.minute || now.getMinutes()),
      Number(obj.second || now.getSeconds()),
    );
  } catch {
    return new Date(now);
  }
}

function toLocalFloatingISO(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export function buildNextOccurrence(
  baseTz: string,
  dayIndex: number,
  startHour: number,
  startMinute: number,
  endHour: number,
  endMinute: number,
): { start: string; end: string } {
  const nowLocal = getLocalNowInTimezone(baseTz);
  const currentDay = nowLocal.getDay();
  const delta = (dayIndex - currentDay + 7) % 7;
  const startDate = new Date(nowLocal);
  startDate.setHours(0, 0, 0, 0);
  startDate.setDate(startDate.getDate() + delta);
  startDate.setHours(startHour, startMinute, 0, 0);
  if (delta === 0 && startDate <= nowLocal) {
    startDate.setDate(startDate.getDate() + 7);
  }
  const endDate = new Date(startDate);
  endDate.setHours(endHour, endMinute, 0, 0);
  if (endDate <= startDate) {
    endDate.setDate(endDate.getDate() + 1);
  }
  return { start: toLocalFloatingISO(startDate), end: toLocalFloatingISO(endDate) };
}

export function normalizeDayToken(rawToken: string): string {
  return rawToken.toLowerCase().replace(/[^a-z]/g, "");
}

export function isDayToken(rawToken: string): boolean {
  return Boolean(DAY_NAME_TO_INDEX[normalizeDayToken(rawToken)]);
}

function isOffToken(value: string): boolean {
  return /\boff\b|closed|rest/i.test(value.toLowerCase());
}

function looksLikeGroupName(line: string): boolean {
  if (!line) return false;
  const trimmed = line.trim();
  if (!trimmed || isDayToken(trimmed)) return false;
  const lower = trimmed.toLowerCase();
  if (isOffToken(lower)) return false;
  if (/schedule|calendar|mon\b|tue\b|wed\b|thu\b|fri\b|sat\b|sun\b/i.test(lower)) return false;
  if (/\d/.test(trimmed) && !/(level|group|team|squad|class|academy|session)/i.test(lower)) {
    return false;
  }
  if (/\d{1,2}\s*[:-]/.test(trimmed)) return false;
  return /[A-Za-z]/.test(trimmed);
}

export function parsePracticeTimeRange(value: string): {
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  note: string | null;
} | null {
  const lower = value.toLowerCase().trim();
  if (!lower || isOffToken(lower)) return null;

  const normalized = lower.replace(/\s+/g, " ");
  const noteParts: string[] = [];
  let timePart = normalized;
  const noteMatch = normalized.match(/(?:\d|:|am|pm|\s|-)+\s*(.*)$/i);
  if (noteMatch?.[1]) {
    const remainder = noteMatch[1].trim();
    if (remainder && !/^(?:am|pm)$/i.test(remainder)) {
      noteParts.push(remainder);
      timePart = normalized
        .slice(0, noteMatch.index! + noteMatch[0].length - remainder.length)
        .trim();
    }
  }

  const range = timePart.match(
    /(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?|am|pm)?\s*[-–—]\s*(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?|am|pm)?/,
  );
  if (!range) {
    const single = timePart.match(/(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?|am|pm)?/);
    if (!single) return null;
    const startHourRaw = Number(single[1]);
    const startMinuteRaw = Number(single[2] || 0);
    const mer = (single[3] || "").toLowerCase();
    const { hour: startHour, minute: startMinute } = convertTo24Hour(
      startHourRaw,
      startMinuteRaw,
      mer || null,
    );
    const end = new Date(0, 0, 0, startHour, startMinute + 90);
    return {
      startHour,
      startMinute,
      endHour: end.getHours(),
      endMinute: end.getMinutes(),
      note: noteParts.length ? noteParts.join(" ") : null,
    };
  }

  const startHourRaw = Number(range[1]);
  const startMinuteRaw = Number(range[2] || 0);
  const startMer = (range[3] || "").toLowerCase();
  const endHourRaw = Number(range[4]);
  const endMinuteRaw = Number(range[5] || 0);
  const endMer = (range[6] || "").toLowerCase();

  const { hour: startHour, minute: startMinute } = convertTo24Hour(
    startHourRaw,
    startMinuteRaw,
    startMer || null,
  );
  const { hour: endHour, minute: endMinute } = convertTo24Hour(
    endHourRaw,
    endMinuteRaw,
    endMer || null,
    startHour,
  );

  return {
    startHour,
    startMinute,
    endHour,
    endMinute,
    note: noteParts.length ? noteParts.join(" ") : null,
  };
}

function convertTo24Hour(
  hour: number,
  minute: number,
  meridiem: string | null,
  fallbackCompareHour?: number,
): { hour: number; minute: number } {
  let h = hour % 12;
  if (meridiem) {
    if (/p/.test(meridiem) && h < 12) h += 12;
    if (/a/.test(meridiem) && hour === 12) h = 0;
  } else if (typeof fallbackCompareHour === "number") {
    if (fallbackCompareHour >= 12 && hour < 12 && hour <= 7) {
      h += 12;
    }
  } else if (hour <= 7) {
    h += 12;
  }
  return { hour: h, minute };
}

export function parsePracticeScheduleHeuristics(
  lines: string[],
  timezone: string,
): {
  title: string | null;
  timeframe: string | null;
  groups: PracticeGroupOutput[];
} | null {
  const normalizedLines = lines.map((l) => l.trim()).filter(Boolean);
  if (!normalizedLines.length) return null;

  let headerStart = -1;
  let headerEnd = -1;
  const dayOrder: string[] = [];
  for (let i = 0; i < normalizedLines.length; i++) {
    const token = normalizedLines[i];
    if (isDayToken(token)) {
      if (dayOrder.length === 0) headerStart = i;
      const mapKey = normalizeDayToken(token);
      const code = DAY_NAME_TO_INDEX[mapKey]?.code;
      if (code && dayOrder[dayOrder.length - 1] !== code) {
        dayOrder.push(code);
      }
    } else if (dayOrder.length) {
      headerEnd = i - 1;
      break;
    }
  }

  if (dayOrder.length < 3) return null;
  if (headerEnd < headerStart) headerEnd = headerStart + dayOrder.length - 1;

  const groups: PracticeHeuristicGroup[] = [];
  const groupKeywords = /(group|level|team|squad|class|crew|cohort|practice)/i;

  const collectValue = (startIdx: number): { value: string; consumed: number } => {
    let combined = normalizedLines[startIdx];
    let consumed = 1;
    let idx = startIdx + 1;
    while (idx < normalizedLines.length) {
      const next = normalizedLines[idx];
      if (!next) {
        idx++;
        consumed++;
        continue;
      }
      if (isDayToken(next)) break;
      if (looksLikeGroupName(next) && groupKeywords.test(next.toLowerCase())) break;
      if (/\d{1,2}:\d{2}/.test(next) && /\d{1,2}:\d{2}/.test(combined)) break;
      if (/\boff\b/i.test(next) && /\boff\b/i.test(combined)) {
        combined = "OFF";
        idx++;
        consumed++;
        continue;
      }
      if (!/\d/.test(next)) {
        combined = `${combined} ${next}`.trim();
        idx++;
        consumed++;
        continue;
      }
      break;
    }
    return { value: combined.trim(), consumed };
  };

  let idx = headerEnd + 1;
  while (idx < normalizedLines.length) {
    const token = normalizedLines[idx];
    if (!token || isDayToken(token)) {
      idx++;
      continue;
    }
    if (!looksLikeGroupName(token) && !groupKeywords.test(token.toLowerCase())) {
      idx++;
      continue;
    }

    const groupName = token.trim();
    idx++;
    const values: Array<{ label: string; note: string | null }> = [];
    for (let dayIdx = 0; dayIdx < dayOrder.length && idx < normalizedLines.length; ) {
      const candidate = normalizedLines[idx];
      if (!candidate) {
        idx++;
        continue;
      }
      if (
        looksLikeGroupName(candidate) &&
        groupKeywords.test(candidate.toLowerCase()) &&
        values.length === 0
      ) {
        break;
      }
      if (isDayToken(candidate)) {
        idx++;
        continue;
      }
      const { value, consumed } = collectValue(idx);
      idx += consumed;
      const noteMatch = value.match(
        /(.*?)(?:\s+(rec|conditioning|team gym|team\s+gym|open gym|weights))$/i,
      );
      let label = value;
      let note: string | null = null;
      if (noteMatch?.[2]) {
        label = noteMatch[1].trim();
        note = noteMatch[2].trim();
      }
      values.push({ label: label || "OFF", note });
      dayIdx++;
    }
    if (!values.length) continue;
    groups.push({ name: groupName, note: null, values });
  }

  if (!groups.length) return null;

  const builtGroups = groups.map((group) => {
    const sessions: PracticeSessionOutput[] = [];
    const events: any[] = [];

    group.values.forEach((entry, idxValue) => {
      const dayCode = dayOrder[idxValue] || dayOrder[0];
      const parsed = parsePracticeTimeRange(entry.label);
      if (!parsed) {
        sessions.push({
          day: dayCode,
          display: `${dayCode} ${entry.label}`.trim(),
          hasPractice: false,
          note: entry.note,
        });
        return;
      }
      const dayInfo = DAY_NAME_TO_INDEX[normalizeDayToken(dayCode)] || {
        index: idxValue,
        code: dayCode,
      };
      const occurrence = buildNextOccurrence(
        timezone,
        dayInfo.index,
        parsed.startHour,
        parsed.startMinute,
        parsed.endHour,
        parsed.endMinute,
      );
      const pad = (n: number) => String(n).padStart(2, "0");
      sessions.push({
        day: dayCode,
        display: `${dayCode} ${pad(parsed.startHour)}:${pad(parsed.startMinute)}-${pad(parsed.endHour)}:${pad(parsed.endMinute)}`,
        hasPractice: true,
        start: occurrence.start,
        end: occurrence.end,
        startTime: `${pad(parsed.startHour)}:${pad(parsed.startMinute)}`,
        endTime: `${pad(parsed.endHour)}:${pad(parsed.endMinute)}`,
        note: entry.note || parsed.note,
      });
      const descriptionParts = [group.name];
      descriptionParts.push(
        `${dayCode} ${pad(parsed.startHour)}:${pad(parsed.startMinute)}-${pad(parsed.endHour)}:${pad(parsed.endMinute)}`,
      );
      if (entry.note || parsed.note) descriptionParts.push(entry.note || parsed.note || "");
      events.push({
        title: `${group.name} Practice`,
        start: occurrence.start,
        end: occurrence.end,
        allDay: false,
        timezone,
        location: "",
        description: descriptionParts.filter(Boolean).join(" · "),
        recurrence: `RRULE:FREQ=WEEKLY;BYDAY=${dayCode}`,
        reminders: [{ minutes: 1440 }],
        category: "Sport Events",
      });
    });

    return {
      name: group.name,
      note: group.note,
      sessions,
      events,
    };
  });

  return {
    title: normalizedLines.find((line) => /schedule/i.test(line)) || null,
    timeframe: normalizedLines.find((line) => /\d{4}\s*-\s*\d{4}/.test(line)) || null,
    groups: builtGroups,
  };
}

export function createEmptyPracticeSchedule(timezone: string): PracticeScheduleOutput {
  return {
    detected: false,
    title: null,
    timeframe: null,
    timezone,
    groups: [],
  };
}
