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
import {
  GymMeetScheduleAwardLegend,
  GymMeetScheduleColorLegendEntry,
  GymMeetScheduleColorRef,
  GymMeetScheduleInfo,
} from "./types";
import {
  buildScheduleLegendEntryKey,
  resolveScheduleLegendEntries,
  resolveScheduleTextColor,
} from "./scheduleColors";

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
    const weekday = new Intl.DateTimeFormat("en-US", { weekday: "short" })
      .format(parsed)
      .replace(".", "")
      .toUpperCase();
    const monthDay = new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    })
      .format(parsed)
      .replace(",", "")
      .toUpperCase();
    return `${weekday} • ${monthDay}`;
  }
  return safeString(day.shortDate || day.date || day.isoDate || "Schedule Day");
};

const normalizeSchedule = (value: unknown): GymMeetScheduleInfo => {
  const schedule = (value && typeof value === "object" ? value : {}) as Record<string, any>;
  const days = Array.isArray(schedule.days) ? schedule.days : [];
  const normalizeColorRef = (item: any): GymMeetScheduleColorRef | null => {
    if (!item || typeof item !== "object") return null;
    const legendId = safeString(item?.legendId) || undefined;
    const textColorHex = safeString(item?.textColorHex) || undefined;
    const confidence =
      typeof item?.confidence === "number" && Number.isFinite(item.confidence)
        ? item.confidence
        : null;
    if (!legendId && !textColorHex && confidence == null) return null;
    return { legendId, textColorHex, confidence };
  };
  return {
    enabled: schedule.enabled !== false,
    venueLabel: safeString(schedule.venueLabel),
    supportEmail: safeString(schedule.supportEmail),
    notes: (Array.isArray(schedule.notes) ? schedule.notes : [])
      .map((item) => safeString(item))
      .filter(Boolean),
    colorLegend: (Array.isArray(schedule.colorLegend) ? schedule.colorLegend : [])
      .map(
        (item: any): GymMeetScheduleColorLegendEntry => ({
          id: safeString(item?.id) || undefined,
          target:
            safeString(item?.target) === "session" || safeString(item?.target) === "club"
              ? (safeString(item?.target) as "session" | "club")
              : undefined,
          colorHex: safeString(item?.colorHex) || null,
          colorLabel: safeString(item?.colorLabel) || undefined,
          meaning: safeString(item?.meaning),
          sourceText: safeString(item?.sourceText) || undefined,
          teamAwardEligible:
            typeof item?.teamAwardEligible === "boolean" ? item.teamAwardEligible : null,
        })
      )
      .filter(
        (item) =>
          item.meaning ||
          item.colorHex ||
          item.colorLabel ||
          typeof item.teamAwardEligible === "boolean"
      ),
    awardLegend: (Array.isArray(schedule.awardLegend) ? schedule.awardLegend : [])
      .map(
        (item: any): GymMeetScheduleAwardLegend => ({
          colorHex: safeString(item?.colorHex) || null,
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
            color: normalizeColorRef(session?.color),
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
                color: normalizeColorRef(club?.color),
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
    color?: GymMeetScheduleColorRef | null;
  }>;
};

const groupSessionClubsByDivision = (
  clubs: Array<{
    id: string;
    name: string;
    teamAwardEligible?: boolean | null;
    athleteCount?: number | null;
    divisionLabel?: string;
    color?: GymMeetScheduleColorRef | null;
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

const extractSessionTimeValue = (value: string | undefined) => {
  const text = safeString(value);
  if (!text) return "";
  const match = text.match(/\b\d{1,2}:\d{2}\s*(?:am|pm)?\b/i);
  return match?.[0] || text;
};

const buildSessionTimingRows = (startTime: string, warmupTime?: string) => {
  const stretchTime = extractSessionTimeValue(startTime);
  const warmup = extractSessionTimeValue(warmupTime);
  const rows = [];
  if (stretchTime) rows.push({ label: "Stretch", value: stretchTime });
  if (warmup) rows.push({ label: "Warm-up", value: warmup });
  if (rows.length > 0) return rows;
  return [];
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
  const hasVisibleClubs = useMemo(
    () => filteredSessions.some((session) => session.clubs.length > 0),
    [filteredSessions]
  );

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
  const legendEntries = useMemo(
    () => resolveScheduleLegendEntries(normalizedSchedule, hasTeamAwardTrue, hasTeamAwardFalse),
    [normalizedSchedule, hasTeamAwardTrue, hasTeamAwardFalse]
  );
  const showLegend = legendEntries.length > 0;

  if (!normalizedSchedule.enabled || days.length === 0 || !activeDay) {
    return null;
  }

  const cardClass =
    appearance?.cardClass ||
    "rounded-[24px] border border-zinc-800 bg-[#0e0e0e] px-5 py-5 shadow-lg";
  const summaryCardClass = appearance?.summaryCardClass || cardClass;
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

  const renderClubList = (clubs: typeof filteredSessions[number]["clubs"]) => (
    (() => {
      const grouped = groupSessionClubsByDivision(clubs);
      const renderClubRow = (
        club: (typeof filteredSessions)[number]["clubs"][number],
        includeDivisionLabel: boolean
      ) => {
        const clubTextColor = resolveScheduleTextColor(club.color);
        return (
          <div key={club.id} className="flex items-center justify-between gap-3 py-1">
            <span
              className={clubTextClass}
              style={clubTextColor ? { color: clubTextColor } : undefined}
            >
              {formatClubName(club, { includeDivisionLabel })}
            </span>
            {club.teamAwardEligible === true ? (
              <span className="rounded bg-black/5 p-1 shadow-sm">
                <Trophy size={12} style={clubTextColor ? { color: clubTextColor } : undefined} />
              </span>
            ) : null}
          </div>
        );
      };

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
              className="flex items-center gap-2 text-xs font-semibold"
              style={
                resolveScheduleTextColor(club.color)
                  ? { color: resolveScheduleTextColor(club.color) as string }
                  : undefined
              }
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
                  className="flex items-center gap-2 text-xs font-semibold"
                  style={
                    resolveScheduleTextColor(club.color)
                      ? { color: resolveScheduleTextColor(club.color) as string }
                      : undefined
                  }
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
              className="rounded-full border border-current/10 bg-black/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em]"
              style={
                resolveScheduleTextColor(club.color)
                  ? {
                      color: resolveScheduleTextColor(club.color) as string,
                      borderColor: `${resolveScheduleTextColor(club.color)}66`,
                    }
                  : undefined
              }
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
                  className="rounded-full border border-current/10 bg-black/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em]"
                  style={
                    resolveScheduleTextColor(club.color)
                      ? {
                          color: resolveScheduleTextColor(club.color) as string,
                          borderColor: `${resolveScheduleTextColor(club.color)}66`,
                        }
                      : undefined
                  }
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
        const timingRows = buildSessionTimingRows(session.startTime, session.warmupTime);
        const showSessionClubs = session.clubs.length > 0;
        const sessionTextColor = resolveScheduleTextColor(session.color);
        return (
          <article
            key={session.id}
            className={joinClasses("flex flex-col overflow-hidden transition-colors", cardClass)}
          >
            <div className="border-b border-current/10 p-6">
              <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <span
                      className="rounded-full border border-current/10 bg-black/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] opacity-70"
                      style={sessionTextColor ? { color: sessionTextColor } : undefined}
                    >
                      {session.label || session.code || "Session"}
                    </span>
                  </div>
                  <h3
                    className={joinClasses(
                      sessionHeadingClass(session.group || session.code || "Session"),
                      sessionTitleClass
                    )}
                    style={
                      sessionTextColor
                        ? { ...(sessionTitleStyle || {}), color: sessionTextColor }
                        : sessionTitleStyle
                    }
                  >
                    {session.group || session.code || "Session"}
                  </h3>
                  <div
                    className={joinClasses("mt-3 h-1 w-12 bg-current opacity-60", accentClass)}
                    style={sessionTextColor ? { color: sessionTextColor } : undefined}
                  />
                </div>
                {timingRows.length > 0 ? (
                  <div
                    className={joinClasses(
                      "space-y-2 text-xs font-semibold leading-snug sm:min-w-[148px] sm:text-right md:text-sm",
                      accentClass
                    )}
                  >
                    {timingRows.map((timingRow, timingIndex) => (
                      <div
                        key={`${session.id}-grid-timing-${timingIndex + 1}`}
                        className="flex items-start gap-2 sm:justify-end"
                      >
                        <Clock size={15} strokeWidth={2.5} className="mt-0.5 shrink-0" />
                        <span className="break-words">
                          <span className="opacity-75">{timingRow.label}:</span>{" "}
                          <span className="font-bold">{timingRow.value}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
              {safeString(session.note) ? (
                <div className="text-sm font-medium leading-snug opacity-70">
                  {session.note}
                </div>
              ) : null}
            </div>

            {showSessionClubs ? (
              <div className="flex-1 space-y-4 p-6">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] opacity-60">
                  <Users size={14} />
                  Registered Clubs
                </div>
                {renderClubList(session.clubs)}
              </div>
            ) : null}
          </article>
        );
      })}
    </div>
  );

  const renderTimelineView = () => (
    <div className="space-y-5">
      {filteredSessions.map((session, index) => {
        const timingRows = buildSessionTimingRows(session.startTime, session.warmupTime);
        const showSessionClubs = session.clubs.length > 0;
        const sessionTextColor = resolveScheduleTextColor(session.color);
        return (
          <div
            key={session.id}
            className="grid gap-4 md:grid-cols-[112px_24px_minmax(0,1fr)] md:gap-6"
          >
            <div className="space-y-1 md:pt-2 md:text-right">
              {(timingRows.length > 0
                ? timingRows.map((row) => `${row.label} ${row.value}`)
                : ["TBD"]
              ).map((line, timingIndex) => (
                <div
                  key={`${session.id}-timing-${timingIndex + 1}`}
                  className={joinClasses(
                    timingIndex === 0 ? "text-base font-black md:text-lg" : "text-[10px] font-black uppercase tracking-[0.16em] opacity-55",
                    accentClass
                  )}
                >
                  {line}
                </div>
              ))}
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
                  <span
                    className="rounded-full border border-current/10 bg-black/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] opacity-70"
                    style={sessionTextColor ? { color: sessionTextColor } : undefined}
                  >
                    {session.label || session.code || "Session"}
                  </span>
                  <h3
                    className={joinClasses(
                      "mt-3",
                      sessionHeadingClass(session.group || session.code || "Session"),
                      sessionTitleClass
                    )}
                    style={
                      sessionTextColor
                        ? { ...(sessionTitleStyle || {}), color: sessionTextColor }
                        : sessionTitleStyle
                    }
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

              {showSessionClubs ? (
                <>
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] opacity-60">
                    <Users size={14} />
                    Participating Clubs
                  </div>
                  {renderTimelineClubList(session.clubs)}
                </>
              ) : null}
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
            {hasVisibleClubs ? <th className="px-4 py-4">Participating Gym Clubs</th> : null}
          </tr>
        </thead>
        <tbody>
          {filteredSessions.map((session) => (
            <tr key={session.id} className={tableRowClass}>
              <td className="px-4 py-4 align-top">
                <span
                  className="text-sm font-black"
                  style={
                    resolveScheduleTextColor(session.color)
                      ? { color: resolveScheduleTextColor(session.color) as string }
                      : undefined
                  }
                >
                  {session.label || session.code || "Session"}
                </span>
              </td>
              <td className="px-4 py-4 align-top">
                <div className="space-y-1">
                  {(buildSessionTimingRows(session.startTime, session.warmupTime).length > 0
                    ? buildSessionTimingRows(session.startTime, session.warmupTime).map(
                        (row) => `${row.label}: ${row.value}`
                      )
                    : ["TBD"]
                  ).map((line, timingIndex) => (
                    <div
                      key={`${session.id}-table-timing-${timingIndex + 1}`}
                      className={
                        timingIndex === 0
                          ? "text-sm font-semibold"
                          : "text-[10px] font-black uppercase tracking-[0.16em] opacity-55"
                      }
                    >
                      {line}
                    </div>
                  ))}
                </div>
              </td>
              <td className="px-4 py-4 align-top">
                <span
                  className="text-sm font-semibold"
                  style={
                    resolveScheduleTextColor(session.color)
                      ? { color: resolveScheduleTextColor(session.color) as string }
                      : undefined
                  }
                >
                  {session.group || session.code || "Session"}
                </span>
              </td>
              {hasVisibleClubs ? (
                <td className="px-4 py-4 align-top">
                  {session.clubs.length > 0 ? renderCompactClubCell(session.clubs) : null}
                </td>
              ) : null}
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
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
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
                      "relative whitespace-nowrap",
                      isActive ? navActiveClass : navIdleClass
                    )}
                  >
                    <span>{formatScheduleDayLabel(day)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {viewModes.map((mode) => {
              const Icon = mode.icon;
              const isActive = viewMode === mode.id;
              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setViewMode(mode.id)}
                  aria-label={mode.label}
                  title={mode.label}
                  className={isActive ? navActiveClass : navIdleClass}
                >
                  <span className="inline-flex items-center">
                    <Icon size={14} />
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <label className="relative block w-full xl:max-w-[240px]">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 opacity-55"
            size={16}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search clubs"
            className="w-full rounded-xl border border-current/10 bg-black/10 py-3 pl-9 pr-4 text-sm font-medium outline-none transition-colors placeholder:opacity-50 focus:border-current/25"
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
          {(["session", "club"] as const).map((target) => {
            const targetEntries = legendEntries.filter((entry) => (entry.target || "club") === target);
            if (!targetEntries.length) return null;
            return (
              <div key={target} className="flex flex-wrap items-center gap-4">
                <span className={joinClasses("opacity-60", legendTextClass)}>
                  {target === "session" ? "Session Colors" : "Club Colors"}
                </span>
                {targetEntries.map((entry, entryIndex) => (
                  <div
                    key={buildScheduleLegendEntryKey(entry, entryIndex)}
                    className={joinClasses("flex items-center gap-3", legendTextClass)}
                  >
                    {entry.colorHex ? (
                      <div
                        className="h-4 w-4 rounded border border-current/10"
                        style={{ backgroundColor: entry.colorHex }}
                      />
                    ) : (
                      <div className="h-4 w-4 rounded border-2 border-current/20 bg-white/90" />
                    )}
                    <span>{entry.meaning || "Schedule color"}</span>
                  </div>
                ))}
              </div>
            );
          })}
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
