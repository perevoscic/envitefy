import { resolveFootballTeamName, resolveFootballTitle } from "./football-team-name";

type Source = Record<string, unknown>;
const record = (value: unknown): Source =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Source) : {};
const text = (value: unknown) => (typeof value === "string" ? value.trim() : "");

/** Source facts replace demo values. Appearance is deliberately outside this projection. */
export function footballEditorFields(source: Source) {
  const extra = { ...record(source.extra), ...record(source.customFields) };
  delete extra.advancedSections;
  const title = resolveFootballTitle(text(source.title), text(extra.team));
  extra.team = resolveFootballTeamName(text(extra.team), title);
  const access = record(source.accessControl);
  return {
    title,
    date: text(source.date),
    time: text(source.time),
    endDate: text(source.endDate),
    endTime: text(source.endTime),
    timezone: text(source.timezone) || text(source.tz),
    city: text(source.city),
    state: text(source.state),
    venue: text(source.venue),
    details: text(source.details) || text(source.description),
    rsvpEnabled: source.rsvpEnabled === true,
    rsvpDeadline: text(source.rsvpDeadline),
    passcodeRequired: access.requirePasscode === true,
    passcode: "",
    extra: Object.fromEntries(
      Object.entries(extra).filter(([, value]) => typeof value === "string"),
    ) as Record<string, string>,
  };
}
