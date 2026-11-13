import { appendGymnasticsScheduleDays, createGymnasticsScheduleDay, gymnasticsScheduleDayDate, gymnasticsScheduleRangeDates } from "./gymnastics-schedule-range";

export type ImportedScheduleSession = {
  code: string; label: string; group: string; startTime: string; warmupTime: string;
  note: string; clubs: string[];
};
export type ImportedScheduleDay = { isoDate: string; sessions: ImportedScheduleSession[] };
export type ScheduleImport = { days: ImportedScheduleDay[]; source: { fileName: string; text: string } };

const text = (value: unknown) => typeof value === "string" ? value.trim() : "";
export function normalizeScheduleImport(value: unknown): ImportedScheduleDay[] {
  const raw = value as { days?: unknown } | null;
  if (!Array.isArray(raw?.days) || raw.days.length > 366) throw new Error("No readable schedule was found. Try a clearer photo or a schedule PDF.");
  const days = raw.days.map(day => {
    if (!day || !Array.isArray(day.sessions) || day.sessions.length > 100) throw new Error("The schedule could not be read completely. Try a smaller file.");
    return { isoDate: gymnasticsScheduleRangeDates("day", text(day.isoDate))[0] || "",
      sessions: day.sessions.map((session: any) => ({ code: text(session?.code), label: text(session?.label),
        group: text(session?.group), startTime: text(session?.startTime), warmupTime: text(session?.warmupTime),
        note: text(session?.note), clubs: Array.isArray(session?.clubs) ? [...new Set<string>(session.clubs.map(text).filter(Boolean))] : [],
      })),
    };
  });
  if (!days.length || !days.some(day => day.isoDate || day.sessions.length)) throw new Error("No readable schedule was found. Try a clearer photo or a schedule PDF.");
  return days;
}

const signature = (session: ImportedScheduleSession) => JSON.stringify([
  session.code || "", session.label || "", session.group || "", session.startTime || "", session.warmupTime || "", session.note || "",
  (session.clubs || []).map(club => typeof club === "string" ? club : (club as { name: string }).name).sort(),
].map(value => typeof value === "string" ? value.trim().toLowerCase() : value));

/** Add reviewed rows to the latest editor state, retaining authored IDs and metadata. */
export function appendImportedSchedule<T extends { days?: any[]; notes?: string[]; importSources?: Array<ScheduleImport["source"] & { id: string }> }>(current: T, imported: ScheduleImport, createId: () => string) {
  const reviewed = normalizeScheduleImport(imported);
  if (reviewed.some(day => !day.isoDate)) throw new Error("Choose a date for every imported day before adding it.");
  // Store the transcript once per import rather than repeating a packet on every session.
  const importSources = [...(current.importSources || [])];
  let source = importSources.find(source => source.fileName === imported.source.fileName && source.text === imported.source.text);
  if (!source) { source = { ...imported.source, id: createId() }; importSources.push(source); }
  const sourceReference = { fileName: source.fileName, importId: source.id };
  const days = appendGymnasticsScheduleDays(current.days || [], reviewed.map(day => day.isoDate), createId).map(day => ({ ...day }));
  for (const incoming of reviewed) {
    const day = days.find(day => gymnasticsScheduleDayDate(day) === incoming.isoDate)!;
    const sessions = [...(day.sessions || [])];
    const known = new Set(sessions.map(signature));
    for (const session of incoming.sessions) {
      if (known.has(signature(session))) continue;
      known.add(signature(session));
      sessions.push({ ...session, id: createId(), clubs: session.clubs.map(name => ({ id: createId(), name,
        teamAwardEligible: null, athleteCount: null, divisionLabel: "" })), source: sourceReference });
    }
    day.sessions = sessions;
    // Keep the source for dated days that have no sessions, too.
    if (!day.source) day.source = sourceReference;
  }
  return { ...current, enabled: true, days, importSources };
}

export const importedDayLabel = (day: ImportedScheduleDay, index: number) => day.isoDate
  ? createGymnasticsScheduleDay(day.isoDate, "review").shortDate : `Day ${index + 1} · Choose date`;
