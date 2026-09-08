import { parseCalendarDateTimeToIso } from "./calendar-date-time";
import { getTemplateCategory, type TemplateCategory } from "./template-categories";
import type { EditorSnapshot } from "./template-draft-storage";
import type { TemplateHistoryPayload } from "./template-draft-handoff";

/** Incomplete drafts retain their fields without inventing missing event times. */
export function buildTemplateDraftPayload(
  snapshot: EditorSnapshot,
  category: TemplateCategory,
  browserTimezone: string,
): TemplateHistoryPayload {
  const raw = snapshot.data || snapshot.form;
  const data = raw && !Array.isArray(raw) && typeof raw === "object" ? raw : {};
  const info = getTemplateCategory(category)!;
  const title = String(
    data.title ||
      data.eventTitle ||
      data.childName ||
      (data.partner1 ? `${data.partner1} & ${data.partner2 || ""}` : "") ||
      `${info.name} draft`,
  );
  const timezone = String(data.timezone || data.tz || browserTimezone);
  const text = (value: (typeof data)[string]) => (typeof value === "string" ? value : "");
  const localStart = data.date
    ? `${text(data.date)}${data.time ? `T${text(data.time)}` : ""}`
    : text(data.startAt || data.startISO || data.start);
  const localEnd =
    data.endDate || data.endTime
      ? `${text(data.endDate || data.date)}${data.endTime ? `T${text(data.endTime)}` : ""}`
      : text(data.endAt || data.endISO || data.end);
  const start = parseCalendarDateTimeToIso(localStart, timezone);
  const end = parseCalendarDateTimeToIso(localEnd, timezone);
  return {
    title,
    data: {
      ...data,
      ...(category === "signup-forms" ? { signupForm: data } : {}),
      title,
      category: info.historyCategory,
      startAt: start,
      startISO: start,
      start,
      endAt: end,
      endISO: end,
      end,
      timezone,
      tz: timezone,
    },
  };
}
