import { ThemeKey, ThemeWindow } from "./types";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function endOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

function addDays(base: Date, days: number): Date {
  return new Date(base.getTime() + days * MS_PER_DAY);
}

function nthWeekdayOfMonth(year: number, month: number, weekday: number, occurrence: number): Date {
  if (occurrence < 1) throw new Error("occurrence must be >= 1");
  const firstOfMonth = new Date(year, month, 1);
  const firstWeekday = firstOfMonth.getDay();
  const offset = (weekday - firstWeekday + 7) % 7;
  const day = 1 + offset + (occurrence - 1) * 7;
  return new Date(year, month, day);
}

function getThanksgiving(year: number): Date {
  // 4th Thursday in November
  return nthWeekdayOfMonth(year, 10, 4, 4);
}

function getLaborDay(year: number): Date {
  // 1st Monday in September
  return nthWeekdayOfMonth(year, 8, 1, 1);
}

function computeEasterSunday(year: number): Date {
  // Anonymous Gregorian algorithm
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 3=March, 4=April
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function createWindow(key: ThemeKey, start: Date, end: Date): ThemeWindow {
  return {
    key,
    label: key,
    start: startOfDay(start),
    end: endOfDay(end),
  };
}

function buildWindowsForYear(year: number): ThemeWindow[] {
  const thanksgiving = getThanksgiving(year);
  const laborDay = getLaborDay(year);
  const easter = computeEasterSunday(year);

  const halloweenStart = new Date(year, 9, 1);
  const halloweenEnd = new Date(year, 9, 31);

  const thanksgivingStart = new Date(year, 10, 1);
  const thanksgivingEnd = thanksgiving;

  const christmasStart = addDays(thanksgiving, 1);
  const christmasEnd = new Date(year, 11, 25);

  const newYearsStart = new Date(year, 11, 26);
  const newYearsEnd = new Date(year + 1, 0, 1);

  const valentines = new Date(year, 1, 14);
  const valentinesStart = addDays(valentines, -14);

  const stPatricks = new Date(year, 2, 17);
  const stPatricksStart = addDays(stPatricks, -7);

  const easterStart = addDays(easter, -14);

  const childrensDay = new Date(year, 5, 14);
  const childrensDayStart = addDays(childrensDay, -7);

  const independenceDay = new Date(year, 6, 4);
  const independenceDayStart = addDays(independenceDay, -7);

  const laborDayStart = addDays(laborDay, -10);

  return [
    createWindow("halloween", halloweenStart, halloweenEnd),
    createWindow("thanksgiving", thanksgivingStart, thanksgivingEnd),
    createWindow("christmas", christmasStart, christmasEnd),
    createWindow("new-years", newYearsStart, newYearsEnd),
    createWindow("valentines", valentinesStart, valentines),
    createWindow("st-patricks", stPatricksStart, stPatricks),
    createWindow("easter", easterStart, easter),
    createWindow("childrens-day", childrensDayStart, childrensDay),
    createWindow("independence-day", independenceDayStart, independenceDay),
    createWindow("labor-day", laborDayStart, laborDay),
  ];
}

export function getThemeWindowsForYear(year: number): ThemeWindow[] {
  return buildWindowsForYear(year);
}

export function findActiveThemeWindow(date: Date): ThemeWindow | null {
  const target = startOfDay(date);
  const year = target.getFullYear();
  const candidateYears = [year - 1, year, year + 1];
  const windows: ThemeWindow[] = [];
  for (const candidate of candidateYears) {
    windows.push(...buildWindowsForYear(candidate));
  }
  windows.sort((a, b) => a.start.getTime() - b.start.getTime());
  for (const window of windows) {
    if (target >= window.start && target <= window.end) {
      return window;
    }
  }
  return null;
}

export function resolveThemeForDate(date: Date): ThemeKey {
  const window = findActiveThemeWindow(date);
  return window?.key ?? "general";
}

export function getNextWindowAfter(date: Date): ThemeWindow | null {
  const target = startOfDay(date);
  const year = target.getFullYear();
  const candidateYears = [year, year + 1];
  const future: ThemeWindow[] = [];
  for (const candidate of candidateYears) {
    future.push(...buildWindowsForYear(candidate));
  }
  future.sort((a, b) => a.start.getTime() - b.start.getTime());
  for (const window of future) {
    if (window.start > target) {
      return window;
    }
  }
  return null;
}

