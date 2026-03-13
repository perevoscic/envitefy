"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import {
  Clock,
  Info,
  LayoutGrid,
  List,
  Search,
  Table as TableIcon,
  Trophy,
  Users,
} from "lucide-react";
import { GymMeetScheduleAwardLegend, GymMeetScheduleInfo } from "./types";

const safeString = (value: unknown): string =>
  typeof value === "string"
    ? value.trim()
    : value == null
    ? ""
    : String(value).trim();

const formatScheduleDayLabel = (day: {
  shortDate?: string;
  date?: string;
  isoDate?: string;
}) => {
  const candidates = [day.isoDate, day.date, day.shortDate].map((item) => safeString(item));
  for (const candidate of candidates) {
    if (!candidate) continue;
    const parsed = new Date(candidate);
    if (Number.isNaN(parsed.getTime())) continue;
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    })
      .format(parsed)
      .replace(",", " •");
  }
  return safeString(day.shortDate || day.date || day.isoDate || "Schedule Day");
};

const normalizeSchedule = (value: unknown): GymMeetScheduleInfo => {
  const schedule = (value && typeof value === "object" ? value : {}) as Record<string, any>;
  const days = Array.isArray(schedule.days) ? schedule.days : [];
  return {
    enabled: schedule.enabled !== false,
    venueLabel: safeString(schedule.venueLabel),
    supportEmail: safeString(schedule.supportEmail),
    notes: (Array.isArray(schedule.notes) ? schedule.notes : [])
      .map((item) => safeString(item))
      .filter(Boolean),
    awardLegend: (Array.isArray(schedule.awardLegend) ? schedule.awardLegend : [])
      .map(
        (item: any): GymMeetScheduleAwardLegend => ({
          colorLabel: safeString(item?.colorLabel) || undefined,
          meaning: safeString(item?.meaning),
          teamAwardEligible:
            typeof item?.teamAwardEligible === "boolean" ? item.teamAwardEligible : null,
        })
      )
      .filter((item) => item.meaning || typeof item.teamAwardEligible === "boolean"),
    annotations: (Array.isArray(schedule.annotations) ? schedule.annotations : [])
      .map((item: any) => ({
        id: safeString(item?.id) || undefined,
        kind: safeString(item?.kind) || undefined,
        level: safeString(item?.level) || undefined,
        sessionCode: safeString(item?.sessionCode) || undefined,
        date: safeString(item?.date) || undefined,
        time: safeString(item?.time) || undefined,
        text: safeString(item?.text),
      }))
      .filter((item) => item.text),
    assignments: (Array.isArray(schedule.assignments) ? schedule.assignments : [])
      .map((item: any) => ({
        id: safeString(item?.id) || undefined,
        level: safeString(item?.level) || undefined,
        groupLabel: safeString(item?.groupLabel) || undefined,
        sessionCode: safeString(item?.sessionCode) || undefined,
        birthDateRange: safeString(item?.birthDateRange) || undefined,
        divisionLabel: safeString(item?.divisionLabel) || undefined,
        note: safeString(item?.note) || undefined,
      }))
      .filter(
        (item) =>
          item.sessionCode ||
          item.groupLabel ||
          item.birthDateRange ||
          item.divisionLabel ||
          item.note
      ),
    days: days
      .map((day, dayIndex) => ({
        id: safeString(day?.id) || `schedule-day-${dayIndex + 1}`,
        date: safeString(day?.date),
        shortDate: safeString(day?.shortDate),
        isoDate: safeString(day?.isoDate) || undefined,
        sessions: (Array.isArray(day?.sessions) ? day.sessions : [])
          .map((session: any, sessionIndex: number) => ({
            id:
              safeString(session?.id) ||
              `${safeString(day?.id) || `day-${dayIndex + 1}`}-session-${sessionIndex + 1}`,
            code: safeString(session?.code) || undefined,
            label: safeString(session?.label) || `Session ${sessionIndex + 1}`,
            group: safeString(session?.group),
            startTime: safeString(session?.startTime),
            warmupTime: safeString(session?.warmupTime) || undefined,
            note: safeString(session?.note) || undefined,
            clubs: (Array.isArray(session?.clubs) ? session.clubs : [])
              .map((club: any, clubIndex: number) => ({
                id:
                  safeString(club?.id) ||
                  `${safeString(session?.id) || `session-${sessionIndex + 1}`}-club-${clubIndex + 1}`,
                name: safeString(club?.name),
                teamAwardEligible:
                  typeof club?.teamAwardEligible === "boolean"
                    ? club.teamAwardEligible
                    : null,
                athleteCount:
                  typeof club?.athleteCount === "number" && Number.isFinite(club.athleteCount)
                    ? club.athleteCount
                    : null,
                divisionLabel: safeString(club?.divisionLabel) || undefined,
              }))
              .filter((club: any) => club.name),
          }))
          .filter(
            (session: any) =>
              session.code || session.group || session.startTime || session.clubs.length > 0
          ),
      }))
      .filter((day: any) => day.date || day.shortDate || day.sessions.length > 0),
  };
};

const formatClubName = (club: {
  name: string;
  athleteCount?: number | null;
  divisionLabel?: string;
}, options?: { includeDivisionLabel?: boolean }) => {
  const suffixParts = [
    typeof club.athleteCount === "number" && Number.isFinite(club.athleteCount)
      ? `(${club.athleteCount})`
      : "",
    options?.includeDivisionLabel === false ? "" : safeString(club.divisionLabel),
  ].filter(Boolean);
  return suffixParts.length > 0 ? `${club.name} ${suffixParts.join(" • ")}` : club.name;
};

type ScheduleClubGroup = {
  key: string;
  label: string;
  isOther: boolean;
  clubs: Array<{
    id: string;
    name: string;
    teamAwardEligible?: boolean | null;
    athleteCount?: number | null;
    divisionLabel?: string;
  }>;
};

const groupSessionClubsByDivision = (
  clubs: Array<{
    id: string;
    name: string;
    teamAwardEligible?: boolean | null;
    athleteCount?: number | null;
    divisionLabel?: string;
  }>
): { hasDivisionGrouping: boolean; groups: ScheduleClubGroup[] } => {
  const hasDivisionGrouping = clubs.some((club) => safeString(club.divisionLabel));
  if (!hasDivisionGrouping) {
    return {
      hasDivisionGrouping: false,
      groups: [{ key: "all-clubs", label: "", isOther: false, clubs }],
    };
  }

  const groups = new Map<string, ScheduleClubGroup>();
  for (const club of clubs) {
    const label = safeString(club.divisionLabel) || "Other";
    const key = label.toLowerCase();
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        label,
        isOther: label === "Other",
        clubs: [],
      });
    }
    groups.get(key)?.clubs.push(club);
  }

  return {
    hasDivisionGrouping: true,
    groups: [...groups.values()].sort((a, b) => {
      if (a.isOther && !b.isOther) return 1;
      if (!a.isOther && b.isOther) return -1;
      return a.label.localeCompare(b.label);
    }),
  };
};

const extractPrimaryTime = (...values: Array<string | undefined>) => {
  for (const value of values) {
    const text = safeString(value);
    if (!text) continue;
    const match = text.match(/\b\d{1,2}:\d{2}\s*(?:am|pm)?\b/i);
    if (match?.[0]) return match[0];
    return text;
  }
  return "TBD";
};

const resolveLegendEntries = (
  schedule: GymMeetScheduleInfo,
  hasTeamAwardTrue: boolean,
  hasTeamAwardFalse: boolean
): Array<{ key: string; meaning: string; teamAwardEligible: boolean | null }> => {
  const explicitEntries = Array.isArray(schedule.awardLegend) ? schedule.awardLegend : [];
  if (explicitEntries.length > 0) {
    return explicitEntries
      .filter((entry) => entry.meaning || typeof entry.teamAwardEligible === "boolean")
      .map((entry) => ({
        key: `${entry.meaning}|${entry.colorLabel || ""}|${entry.teamAwardEligible ?? ""}`,
        meaning: entry.meaning || "Award category",
        teamAwardEligible:
          typeof entry.teamAwardEligible === "boolean" ? entry.teamAwardEligible : null,
      }));
  }

  const noteEntries = (Array.isArray(schedule.notes) ? schedule.notes : [])
    .map((note) => safeString(note))
    .filter(Boolean)
    .flatMap((note) => {
      const lower = note.toLowerCase();
      if (/individual\s*(?:&|and)\s*team awards?/.test(lower)) {
        return [{ key: note, meaning: note, teamAwardEligible: true }];
      }
      if (/individual awards? only/.test(lower)) {
        return [{ key: note, meaning: note, teamAwardEligible: false }];
      }
      return [];
    });
  if (noteEntries.length > 0) return noteEntries;

  const fallbackEntries = [];
  if (hasTeamAwardTrue) {
    fallbackEntries.push({
      key: "team-awards",
      meaning: "Individual & Team Awards",
      teamAwardEligible: true,
    });
  }
  if (hasTeamAwardFalse) {
    fallbackEntries.push({
      key: "individual-only",
      meaning: "Individual Only",
      teamAwardEligible: false,
    });
  }
  return fallbackEntries;
};

const resolveSessionTimingLabel = (note: string | undefined, startTime: string, warmupTime?: string) => {
  const explicitNote = safeString(note);
  if (explicitNote) return explicitNote;
  if (safeString(startTime) || safeString(warmupTime)) return "Stretch/warmup";
  return "";
};

const sessionHeadingClass = (value: string) => {
  const length = safeString(value).length;
  if (length >= 42) return "text-base leading-snug md:text-lg";
  if (length >= 24) return "text-lg leading-tight md:text-xl";
  return "text-xl leading-tight md:text-2xl";
};

type ScheduleViewMode = "grid" | "timeline" | "compact";

type ScheduleBoardProps = {
  schedule: GymMeetScheduleInfo | unknown;
  preferredClubName?: string;
  appearance?: {
    panelClass?: string;
    cardClass?: string;
    summaryCardClass?: string;
    navShellClass?: string;
    navActiveClass?: string;
    navIdleClass?: string;
    sectionTitleClass?: string;
    sectionTitleStyle?: CSSProperties;
    accentClass?: string;
    sectionMutedClass?: string;
    primaryButtonClass?: string;
    secondaryButtonClass?: string;
    sessionTitleClass?: string;
    sessionTitleStyle?: CSSProperties;
    clubTextClass?: string;
    legendTextClass?: string;
    tableShellClass?: string;
    tableHeadClass?: string;
    tableRowClass?: string;
  };
};

const joinClasses = (...values: Array<string | false | null | undefined>) =>
  values.filter(Boolean).join(" ");

const viewModes: Array<{
  id: ScheduleViewMode;
  label: string;
  icon: typeof LayoutGrid;
}> = [
  { id: "grid", label: "Grid", icon: LayoutGrid },
  { id: "timeline", label: "Timeline", icon: List },
  { id: "compact", label: "Table", icon: TableIcon },
];

export default function ScheduleBoard({
  schedule,
  preferredClubName: _preferredClubName,
  appearance,
}: ScheduleBoardProps) {
  const normalizedSchedule = useMemo(() => normalizeSchedule(schedule), [schedule]);
  const days = normalizedSchedule.days;
  const [activeDayId, setActiveDayId] = useState(days[0]?.id || "");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ScheduleViewMode>("grid");

  useEffect(() => {
    if (!days.some((day) => day.id === activeDayId)) {
      setActiveDayId(days[0]?.id || "");
    }
  }, [activeDayId, days]);

  const activeDay = useMemo(
    () => days.find((day) => day.id === activeDayId) || days[0] || null,
    [activeDayId, days]
  );

  const filteredSessions = useMemo(() => {
    if (!activeDay) return [];
    const query = searchQuery.trim().toLowerCase();
    if (!query) return activeDay.sessions;
    return activeDay.sessions
      .map((session) => ({
        ...session,
        clubs: session.clubs.filter((club) => club.name.toLowerCase().includes(query)),
      }))
      .filter((session) => session.clubs.length > 0);
  }, [activeDay, searchQuery]);

  const hasTeamAwardTrue = useMemo(
    () =>
      days.some((day) =>
        day.sessions.some((session) =>
          session.clubs.some((club) => club.teamAwardEligible === true)
        )
      ),
    [days]
  );
  const hasTeamAwardFalse = useMemo(
    () =>
      days.some((day) =>
        day.sessions.some((session) =>
          session.clubs.some((club) => club.teamAwardEligible === false)
        )
      ),
    [days]
  );
  const showLegend = hasTeamAwardTrue || hasTeamAwardFalse;

  if (!normalizedSchedule.enabled || days.length === 0 || !activeDay) {
    return null;
  }

  const cardClass =
    appearance?.cardClass ||
    "rounded-[24px] border border-zinc-800 bg-[#0e0e0e] px-5 py-5 shadow-lg";
  const summaryCardClass = appearance?.summaryCardClass || cardClass;
  const navShellClass =
    appearance?.navShellClass ||
    "rounded-[24px] border border-zinc-800 bg-black px-2 py-2";
  const navActiveClass =
    appearance?.navActiveClass ||
    "rounded-full bg-white/10 px-4 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-white";
  const navIdleClass =
    appearance?.navIdleClass ||
    "rounded-full px-4 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400 transition hover:text-zinc-200";
  const sectionTitleClass = appearance?.sectionTitleClass || "text-white";
  const sectionTitleStyle = appearance?.sectionTitleStyle;
  const accentClass = appearance?.accentClass || "text-[#c5a039]";
  const sectionMutedClass = appearance?.sectionMutedClass || "bg-white/5 text-zinc-200";
  const sessionTitleClass = appearance?.sessionTitleClass || sectionTitleClass;
  const sessionTitleStyle = appearance?.sessionTitleStyle || sectionTitleStyle;
  const clubTextClass = appearance?.clubTextClass || "text-sm font-semibold";
  const legendTextClass =
    appearance?.legendTextClass || "text-[10px] font-black uppercase tracking-[0.16em]";
  const primaryButtonClass =
    appearance?.primaryButtonClass ||
    "inline-flex items-center justify-center gap-2 rounded-full bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-black transition hover:opacity-90";
  const secondaryButtonClass =
    appearance?.secondaryButtonClass ||
    "inline-flex items-center justify-center gap-2 rounded-full border border-current/10 bg-black/5 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] transition hover:bg-black/10";
  const tableShellClass =
    appearance?.tableShellClass ||
    "overflow-x-auto rounded-[24px] border border-current/10 bg-black/5";
  const tableHeadClass =
    appearance?.tableHeadClass ||
    "border-b border-current/10 text-[10px] font-black uppercase tracking-[0.18em] opacity-60";
  const tableRowClass =
    appearance?.tableRowClass || "border-t border-current/10 transition-colors hover:bg-black/5";
  const legendEntries = resolveLegendEntries(normalizedSchedule, hasTeamAwardTrue, hasTeamAwardFalse);

  const renderClubList = (clubs: typeof filteredSessions[number]["clubs"]) => (
    (() => {
      const grouped = groupSessionClubsByDivision(clubs);
      const renderClubRow = (
        club: (typeof filteredSessions)[number]["clubs"][number],
        includeDivisionLabel: boolean
      ) => (
        <div key={club.id} className="flex items-center justify-between gap-3 py-1">
          <span
            className={joinClasses(
              clubTextClass,
              club.teamAwardEligible === true ? "text-[#f472b6]" : ""
            )}
          >
            {formatClubName(club, { includeDivisionLabel })}
          </span>
          {club.teamAwardEligible === true ? (
            <span className="rounded bg-[#f472b6]/10 p-1 shadow-sm">
              <Trophy size={12} className="text-[#f472b6]" />
            </span>
          ) : null}
        </div>
      );

      if (!grouped.hasDivisionGrouping) {
        return <div className="grid gap-y-3">{clubs.map((club) => renderClubRow(club, true))}</div>;
      }

      return (
        <div className="space-y-4">
          {grouped.groups.map((group) => (
            <section key={group.key} className="rounded-2xl border border-current/10 bg-black/5 p-4">
              <div className="mb-3 text-[10px] font-black uppercase tracking-[0.18em] opacity-65">
                {group.label}
              </div>
              <div className="grid gap-y-3">
                {group.clubs.map((club) => renderClubRow(club, false))}
              </div>
            </section>
          ))}
        </div>
      );
    })()
  );

  const renderTimelineClubList = (clubs: typeof filteredSessions[number]["clubs"]) => {
    const grouped = groupSessionClubsByDivision(clubs);
    if (!grouped.hasDivisionGrouping) {
      return (
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {clubs.map((club) => (
            <div
              key={club.id}
              className={joinClasses(
                "flex items-center gap-2 text-xs font-semibold",
                club.teamAwardEligible === true ? "text-[#f472b6]" : ""
              )}
            >
              <span>{formatClubName(club)}</span>
              {club.teamAwardEligible === true ? <Trophy size={11} /> : null}
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {grouped.groups.map((group) => (
          <section key={group.key} className="space-y-2">
            <div className="text-[10px] font-black uppercase tracking-[0.18em] opacity-60">
              {group.label}
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {group.clubs.map((club) => (
                <div
                  key={club.id}
                  className={joinClasses(
                    "flex items-center gap-2 text-xs font-semibold",
                    club.teamAwardEligible === true ? "text-[#f472b6]" : ""
                  )}
                >
                  <span>{formatClubName(club, { includeDivisionLabel: false })}</span>
                  {club.teamAwardEligible === true ? <Trophy size={11} /> : null}
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    );
  };

  const renderCompactClubCell = (clubs: typeof filteredSessions[number]["clubs"]) => {
    const grouped = groupSessionClubsByDivision(clubs);
    if (!grouped.hasDivisionGrouping) {
      return (
        <div className="flex flex-wrap gap-2">
          {clubs.map((club) => (
            <span
              key={club.id}
              className={joinClasses(
                "rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em]",
                club.teamAwardEligible === true
                  ? "border-[#f472b6]/40 bg-[#f472b6]/10 text-[#f472b6]"
                  : "border-current/10 bg-black/5"
              )}
            >
              {formatClubName(club)}
            </span>
          ))}
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {grouped.groups.map((group) => (
          <section key={group.key} className="space-y-2">
            <div className="text-[10px] font-black uppercase tracking-[0.16em] opacity-60">
              {group.label}
            </div>
            <div className="flex flex-wrap gap-2">
              {group.clubs.map((club) => (
                <span
                  key={club.id}
                  className={joinClasses(
                    "rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em]",
                    club.teamAwardEligible === true
                      ? "border-[#f472b6]/40 bg-[#f472b6]/10 text-[#f472b6]"
                      : "border-current/10 bg-black/5"
                  )}
                >
                  {formatClubName(club, { includeDivisionLabel: false })}
                </span>
              ))}
            </div>
          </section>
        ))}
      </div>
    );
  };

  const renderGridView = () => (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {filteredSessions.map((session) => {
        const timingLabel = resolveSessionTimingLabel(
          session.note,
          session.startTime,
          session.warmupTime
        );
        const timingValue = extractPrimaryTime(session.startTime, session.warmupTime);
        return (
          <article
            key={session.id}
            className={joinClasses("flex flex-col overflow-hidden transition-colors", cardClass)}
          >
            <div className="border-b border-current/10 p-6">
              <div className="mb-5 flex items-center justify-between gap-3">
                <span className="rounded-full border border-current/10 bg-black/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] opacity-70">
                  {session.label || session.code || "Session"}
                </span>
              </div>
              <h3
                className={joinClasses(
                  sessionHeadingClass(session.group || session.code || "Session"),
                  sessionTitleClass
                )}
                style={sessionTitleStyle}
              >
                {session.group || session.code || "Session"}
              </h3>
              <div className={joinClasses("mb-4 mt-3 h-1 w-12 bg-current opacity-60", accentClass)} />
              {timingLabel ? (
                <div
                  className={joinClasses(
                    "flex items-start gap-2 text-xs font-semibold leading-snug md:text-sm",
                    accentClass
                  )}
                >
                  <Clock size={15} strokeWidth={2.5} className="mt-0.5 shrink-0" />
                  <span className="break-words">
                    <span className="opacity-75">{timingLabel}:</span>{" "}
                    <span className="font-bold">{timingValue}</span>
                  </span>
                </div>
              ) : null}
            </div>

            <div className="flex-1 space-y-4 p-6">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] opacity-60">
                <Users size={14} />
                Registered Clubs
              </div>
              {renderClubList(session.clubs)}
            </div>
          </article>
        );
      })}
    </div>
  );

  const renderTimelineView = () => (
    <div className="space-y-5">
      {filteredSessions.map((session, index) => {
        const timingValue = extractPrimaryTime(session.startTime, session.warmupTime);
        const warmupLabel = safeString(session.warmupTime);
        return (
          <div
            key={session.id}
            className="grid gap-4 md:grid-cols-[112px_24px_minmax(0,1fr)] md:gap-6"
          >
            <div className="space-y-1 md:pt-2 md:text-right">
              <div className={joinClasses("text-base font-black md:text-lg", accentClass)}>
                {timingValue}
              </div>
              {warmupLabel ? (
                <div className="text-[10px] font-black uppercase tracking-[0.16em] opacity-55">
                  Warmup {warmupLabel}
                </div>
              ) : null}
            </div>

            <div className="relative hidden md:flex justify-center">
              {index < filteredSessions.length - 1 ? (
                <span className="absolute bottom-[-1.75rem] top-4 w-px bg-current/15" />
              ) : null}
              <span
                className={joinClasses(
                  "relative mt-2 h-4 w-4 rounded-full border-4 border-current bg-white/80",
                  accentClass
                )}
              />
            </div>

            <article className={joinClasses("space-y-4", cardClass)}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <span className="rounded-full border border-current/10 bg-black/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] opacity-70">
                    {session.label || session.code || "Session"}
                  </span>
                  <h3
                    className={joinClasses(
                      "mt-3",
                      sessionHeadingClass(session.group || session.code || "Session"),
                      sessionTitleClass
                    )}
                    style={sessionTitleStyle}
                  >
                    {session.group || session.code || "Session"}
                  </h3>
                </div>
                {safeString(session.note) ? (
                  <span
                    className={joinClasses(
                      "rounded-full border border-current/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em]",
                      sectionMutedClass
                    )}
                  >
                    {session.note}
                  </span>
                ) : null}
              </div>

              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] opacity-60">
                <Users size={14} />
                Participating Clubs
              </div>
              {renderTimelineClubList(session.clubs)}
            </article>
          </div>
        );
      })}
    </div>
  );

  const renderCompactTableView = () => (
    <div className={tableShellClass}>
      <table className="min-w-full border-collapse text-left">
        <thead className={tableHeadClass}>
          <tr>
            <th className="px-4 py-4">Session</th>
            <th className="px-4 py-4">Time</th>
            <th className="px-4 py-4">Competitive Group</th>
            <th className="px-4 py-4">Participating Gym Clubs</th>
          </tr>
        </thead>
        <tbody>
          {filteredSessions.map((session) => (
            <tr key={session.id} className={tableRowClass}>
              <td className="px-4 py-4 align-top">
                <span className="text-sm font-black">
                  {session.label || session.code || "Session"}
                </span>
              </td>
              <td className="px-4 py-4 align-top">
                <div className="text-sm font-semibold">
                  {extractPrimaryTime(session.startTime, session.warmupTime)}
                </div>
                {safeString(session.warmupTime) ? (
                  <div className="text-[10px] font-black uppercase tracking-[0.16em] opacity-55">
                    Warmup {session.warmupTime}
                  </div>
                ) : null}
              </td>
              <td className="px-4 py-4 align-top">
                <span className="text-sm font-semibold">
                  {session.group || session.code || "Session"}
                </span>
              </td>
              <td className="px-4 py-4 align-top">
                {renderCompactClubCell(session.clubs)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderEmptyState = () => (
    <div
      className={joinClasses(
        "rounded-[32px] border border-dashed py-24 text-center",
        summaryCardClass
      )}
    >
      <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full border border-current/10 bg-black/5">
        <Search size={36} className="opacity-35" />
      </div>
      <h3
        className={joinClasses("text-2xl font-black", sectionTitleClass)}
        style={sectionTitleStyle}
      >
        No Results Found
      </h3>
      <p className="mx-auto mt-3 max-w-md text-sm font-medium opacity-70">
        {searchQuery.trim()
          ? `"${searchQuery}" does not appear on this day.`
          : "No schedule sessions are available for this day."}
      </p>
      {searchQuery.trim() ? (
        <button
          type="button"
          onClick={() => setSearchQuery("")}
          className={joinClasses("mt-8", primaryButtonClass)}
        >
          Reset Search
        </button>
      ) : null}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className={joinClasses("space-y-3", navShellClass)}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="overflow-x-auto">
            <div className="flex min-w-max items-center gap-2">
              {days.map((day) => {
                const isActive = day.id === activeDay.id;
                return (
                  <button
                    key={day.id}
                    type="button"
                    onClick={() => setActiveDayId(day.id)}
                    className={joinClasses(
                      "relative min-w-[152px] whitespace-nowrap",
                      isActive ? navActiveClass : navIdleClass
                    )}
                  >
                    <span>{formatScheduleDayLabel(day)}</span>
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {viewModes.map((mode) => {
            const Icon = mode.icon;
            const isActive = viewMode === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => setViewMode(mode.id)}
                className={isActive ? navActiveClass : navIdleClass}
              >
                <span className="inline-flex items-center gap-2">
                  <Icon size={14} />
                  {mode.label}
                </span>
              </button>
            );
          })}
        </div>

        <label className="relative block w-full lg:max-w-sm">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 opacity-55"
            size={18}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search clubs"
            className="w-full rounded-2xl border border-current/10 bg-black/10 py-4 pl-11 pr-5 text-sm font-medium outline-none transition-colors placeholder:opacity-50 focus:border-current/25"
          />
        </label>
      </div>

      {showLegend ? (
        <div
          className={joinClasses(
            "flex flex-wrap items-center gap-6 rounded-2xl border p-5",
            summaryCardClass
          )}
        >
          {legendEntries.map((entry) => (
            <div
              key={entry.key}
              className={joinClasses("flex items-center gap-3", legendTextClass)}
            >
              <div
                className={
                  entry.teamAwardEligible === true
                    ? "h-4 w-4 rounded bg-[#f472b6] shadow-sm shadow-pink-500/20"
                    : "h-4 w-4 rounded border-2 border-current/20 bg-white/90"
                }
              />
              <span>{entry.meaning}</span>
            </div>
          ))}
          <div className="flex items-center gap-2 text-xs font-medium normal-case tracking-normal opacity-70 md:ml-auto">
            <Info size={14} className={accentClass} />
            Athlete spot counts are shown in parentheses when provided.
          </div>
        </div>
      ) : null}

      {filteredSessions.length === 0 ? renderEmptyState() : null}

      {filteredSessions.length > 0 && viewMode === "grid" ? renderGridView() : null}
      {filteredSessions.length > 0 && viewMode === "timeline" ? renderTimelineView() : null}
      {filteredSessions.length > 0 && viewMode === "compact" ? renderCompactTableView() : null}

      {normalizedSchedule.supportEmail ? (
        <div
          className={joinClasses(
            "flex flex-wrap items-center gap-3 rounded-2xl border px-4 py-3 text-[11px] font-black uppercase tracking-[0.18em]",
            sectionMutedClass
          )}
        >
          <span>Schedule support</span>
          <a href={`mailto:${normalizedSchedule.supportEmail}`} className={secondaryButtonClass}>
            {normalizedSchedule.supportEmail}
          </a>
        </div>
      ) : null}
    </div>
  );
}
