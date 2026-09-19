import { parseCalendarDateTimeToIso } from "@/lib/calendar-date-time";
import type { SignupForm } from "@/types/signup";

export function formatSignupDateRange(
  form: Pick<SignupForm, "start" | "end" | "timezone" | "allDay">,
) {
  if (!form.start) return "Date to be announced";
  try {
    const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(form.start);
    const parse = (value: string) =>
      new Date(
        /^\d{4}-\d{2}-\d{2}$/.test(value)
          ? `${value}T12:00:00Z`
          : parseCalendarDateTimeToIso(value, form.timezone) || value,
      );
    const start = parse(form.start);
    const end = form.end ? parse(form.end) : null;
    const formatter = new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      ...(!dateOnly && !form.allDay
        ? ({ hour: "numeric", minute: "2-digit", timeZoneName: "short" } as const)
        : {}),
      timeZone: dateOnly ? "UTC" : form.timezone || "UTC",
    });
    // Node and browsers use different ICU spacing (thin/nonbreaking spaces).
    // Keep server and client markup identical without losing the event timezone.
    return (
      end && end > start ? formatter.formatRange(start, end) : formatter.format(start)
    ).replace(/\s+/g, " ");
  } catch {
    return form.start;
  }
}
