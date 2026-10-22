import { parseCalendarDateTimeToIso } from "./calendar-date-time";
import { getTemplateCategory, type TemplateCategory } from "./template-categories";
import type { TemplateHistoryPayload } from "./template-draft-handoff";
import type { EditorSnapshot } from "./template-draft-storage";
import { normalizeEventPageComposition } from "./event-page-composition";
import { buildGymnasticsEventDateTimes } from "./gymnastics-event-dates";
import { getDeliveredThemedEventDesign, getThemedEventTheme } from "./event-page-themed-designs";

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
  const timezone = String(data.timezone || data.tz || (category === "gymnastics" ? "" : browserTimezone));
  const text = (value: (typeof data)[string]) => (typeof value === "string" ? value : "");
  const localStart = data.date
    ? `${text(data.date)}${data.time ? `T${text(data.time)}` : ""}`
    : text(data.startAt || data.startISO || data.start);
  const localEnd =
    data.endDate || data.endTime
      ? `${text(data.endDate || data.date)}${data.endTime ? `T${text(data.endTime)}` : ""}`
      : text(data.endAt || data.endISO || data.end);
  const gymnasticsDates = category === "gymnastics"
    ? buildGymnasticsEventDateTimes({ ...data, timezone })
    : null;
  const start = gymnasticsDates ? gymnasticsDates.startISO : parseCalendarDateTimeToIso(localStart, timezone);
  const end = gymnasticsDates ? gymnasticsDates.endISO : parseCalendarDateTimeToIso(localEnd, timezone);
  const record = (value: unknown): Record<string, unknown> => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
  const designText = (value: unknown) => typeof value === "string" ? value : "";
  const savedTheme = record(data.theme);
  const themed = getDeliveredThemedEventDesign(designText(snapshot.activeTemplateId || data.bodyDesignId || data.templateId || savedTheme.themeId));
  const chosenThemeId = designText(snapshot.themeId || savedTheme.themeId || savedTheme.id) || themed?.id;
  const themedFields = themed ? {
    bodyDesignId: themed.id,
    ...(category === "bridal-showers" ? { templateId: themed.id, occasion: "bridal-shower" } : {}),
    themeId: chosenThemeId,
    theme: { ...(chosenThemeId === themed.id ? getThemedEventTheme(themed) : {}), ...savedTheme },
    fontFamily: designText(data.fontFamily || savedTheme.fontFamily) || themed.font,
    heroImage: designText(data.heroImage || data.hero || record(data.images).hero) || themed.artwork,
  } : {};
  return {
    title,
    data: {
      ...(category === "signup-forms"
        ? {
            signupForm: { ...data, timezone },
            venue: data.venue,
            location: data.location,
            description: data.description,
            allDay: data.allDay,
          }
        : { ...data, ...themedFields }),
      title,
      ...(gymnasticsDates ? { allDay: gymnasticsDates.allDay, gymnasticsDateVersion: 1 } : {}),
      ...(category !== "signup-forms" && snapshot.pageComposition ? { eventPageComposition: normalizeEventPageComposition(snapshot.pageComposition) } : {}),
      category: info.historyCategory,
      primaryOutput: category === "signup-forms" ? "signup_form" : "event_page",
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
