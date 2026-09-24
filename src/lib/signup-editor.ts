import {
  formatCalendarDateInTimeZone,
  formatCalendarDateTimeInTimeZone,
} from "@/lib/calendar-date-time";
import type { SignupForm } from "@/types/signup";

/** Move both ends together in event-local wall time, including across DST changes. */
export function changeSignupStart(form: SignupForm, start: string): SignupForm {
  const next = { ...form, start: start || null };
  if (!start || !form.start || !form.end) return next;
  const allDay = Boolean(form.allDay || /^\d{4}-\d{2}-\d{2}$/.test(form.start));
  const format = allDay ? formatCalendarDateInTimeZone : formatCalendarDateTimeInTimeZone;
  const previousStart = format(form.start, form.timezone);
  const previousEnd = format(form.end, form.timezone);
  if (!previousStart || !previousEnd) return next;
  // UTC is used only for arithmetic on local calendar fields, never as the event timezone.
  const wallTime = (value: string) => Date.parse(`${value.length === 10 ? `${value}T00:00:00` : value}Z`);
  const duration = wallTime(previousEnd) - wallTime(previousStart);
  const movedEnd = wallTime(start) + duration;
  if (!Number.isFinite(movedEnd) || duration < 0 || (!allDay && duration === 0)) return next;
  return { ...next, end: new Date(movedEnd).toISOString().slice(0, allDay ? 10 : 16) };
}

/** Copies content and design only; a new form never inherits participants or availability. */
export function copySignupForm(form: SignupForm): SignupForm {
  const copy = structuredClone(form);
  return {
    ...copy,
    title: `${copy.title} (copy)`,
    responses: [],
    availability: undefined,
    revision: 0,
    enabled: true,
    settings: { ...copy.settings, signupOpensAt: null, signupClosesAt: null },
  };
}
