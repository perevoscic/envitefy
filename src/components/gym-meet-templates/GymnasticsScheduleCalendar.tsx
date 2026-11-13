"use client";

import { useEffect, useRef, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import {
  gymnasticsScheduleDayDate,
  gymnasticsSchedulePeriods,
  gymnasticsScheduleEmptyMessage,
  type GymnasticsSchedulePeriod,
} from "@/lib/gymnastics-schedule-range";
import styles from "../event-templates/gymnastics-schedule-editor.module.css";

type CalendarDay = {
  id: string;
  date?: string;
  shortDate?: string;
  isoDate?: string;
  sessions?: unknown[];
  source?: unknown;
};

export default function GymnasticsScheduleCalendar<T extends CalendarDay>({
  schedule,
  onSelectDay,
  selectedDayId,
  editing = false,
  onPeriodChange,
  onRemovePeriod,
  onAddPeriod,
  showDaySummary = true,
  onActiveDayChange,
}: {
  schedule: { days: T[]; periods?: GymnasticsSchedulePeriod[] };
  onSelectDay: (day: T) => void;
  selectedDayId?: string;
  editing?: boolean;
  onPeriodChange?: () => void;
  onRemovePeriod?: (period: { id: string; kind: "day" | "week" | "month"; label: string }) => void;
  onAddPeriod?: () => void;
  showDaySummary?: boolean;
  onActiveDayChange?: (dayId: string | undefined, kind: GymnasticsSchedulePeriod["kind"] | undefined) => void;
}) {
  const periods = gymnasticsSchedulePeriods(schedule);
  const latestPeriod = schedule.periods?.at(-1);
  const latestId = latestPeriod ? `${latestPeriod.kind}:${latestPeriod.startDate}` : undefined;
  const initialId = periods.find(item => item.days.some(day => day.id === schedule.days[0]?.id))?.id;
  const [selection, setSelection] = useState({ id: initialId, periods: schedule.periods });
  const selectedPeriod = selection.periods === schedule.periods ? selection.id : latestId;
  const period = periods.find((item) => item.id === selectedPeriod) || periods[0];
  const firstDayId = period?.days[0]?.id;
  const periodId = period?.id;
  const periodKind = period?.kind;
  const selectionValid = Boolean(period?.days.some(day => day.id === selectedDayId));
  useEffect(() => {
    onActiveDayChange?.(firstDayId, periodKind);
  }, [firstDayId, periodId, periodKind, selectionValid, onActiveDayChange]);
  const periodRail = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const rail = periodRail.current;
    const active = rail?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (rail && active) rail.scrollLeft = Math.max(0, active.offsetLeft - rail.offsetLeft);
  }, [period?.id]);
  if (!period) return null;
  const byDate = new Map(period.days.map((day) => [gymnasticsScheduleDayDate(day), day]));
  const firstDate = period.dates[0];
  const offset =
    period.kind === "month" && firstDate ? new Date(`${firstDate}T12:00:00Z`).getUTCDay() : 0;
  const dayLabel = (day: T) => day.date || day.shortDate || day.isoDate || "Date to confirm";
  const inlineDay = !showDaySummary && period.kind === "day";
  return (
    <div className={styles.calendar}>
      {(periods.length > 1 || onAddPeriod || inlineDay) && (
        <div className={styles.periodBar}>
          <div
            ref={periodRail}
            className={styles.periods}
            role="group"
            aria-label="Schedule periods"
          >
            {periods.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={period.id === item.id}
                onClick={() => {
                  setSelection({ id: item.id, periods: schedule.periods });
                  onPeriodChange?.();
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
          {inlineDay && editing && <div className={styles.dayTools}>
            <button type="button" className={styles.dayIcon} title="Edit day"
              aria-label={`Edit ${dayLabel(period.days[0])}`} onClick={() => onSelectDay(period.days[0])}>
              <Pencil size={18} aria-hidden="true" />
            </button>
            {onRemovePeriod && <button type="button" className={styles.dayIcon} title="Remove day"
              aria-label={`Remove day: ${period.days[0].shortDate || period.days[0].date || period.label}`} onClick={() => onRemovePeriod(period)}>
              <Trash2 size={18} aria-hidden="true" />
            </button>}
          </div>}
          {onAddPeriod && (
            <button
              type="button"
              className={styles.addPeriod}
              aria-label="Add to schedule"
              onClick={onAddPeriod}
            >
              +
            </button>
          )}
        </div>
      )}
      {!inlineDay && <div className={styles.calendarHeading}>
        <div className={styles.calendarTitle}>
          <h3>{period.label}</h3>
          {onRemovePeriod && (
            <button
              type="button"
              className={styles.removeItem}
              onClick={() => onRemovePeriod(period)}
              aria-label={`Remove ${period.kind}: ${!showDaySummary && period.kind === "day" ? period.days[0].shortDate || period.days[0].date || period.label : period.label}`}
            >
              Remove {period.kind}
            </button>
          )}
        </div>
        {editing && (showDaySummary || period.kind !== "day") && <p>Choose a day to edit its sessions.</p>}
      </div>}
      {period.kind === "day" ? showDaySummary ? (
        <div className={styles.singleDay}>
          {period.days.map((day) => (
            <button
              key={day.id}
              type="button"
              onClick={() => onSelectDay(day)}
              aria-label={`${editing ? "Edit" : "View"} ${dayLabel(day)}`}
            >
              <strong>{day.shortDate || day.date || "Date to confirm"}</strong>
              <span>
                {day.sessions?.length
                  ? `${day.sessions.length} session${day.sessions.length === 1 ? "" : "s"}`
                  : gymnasticsScheduleEmptyMessage(day)}
              </span>
            </button>
          ))}
        </div>
      ) : null : (
        <div className={styles.calendarGrid} aria-label={period.label}>
          {period.kind === "month" &&
            ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((label) => (
              <span key={label} className={styles.weekday}>
                {label}
              </span>
            ))}
          {Array.from({ length: offset }, (_, index) => (
            <span key={`spacer-${index}`} aria-hidden="true" />
          ))}
          {period.dates.map((date) => {
            const day = byDate.get(date);
            const numericDay = Number(date.slice(-2));
            return day ? (
              <button
                key={date}
                type="button"
                onClick={() => onSelectDay(day)}
                aria-label={`${editing ? "Edit" : "View"} ${dayLabel(day)}`}
                aria-pressed={selectedDayId === day.id}
                className={styles.calendarDay}
              >
                {period.kind === "week" && (
                  <span className={styles.weekday}>
                    {new Intl.DateTimeFormat("en-US", { timeZone: "UTC", weekday: "short" }).format(
                      new Date(`${date}T12:00:00Z`),
                    )}
                  </span>
                )}
                <strong>{numericDay}</strong>
                {!!day.sessions?.length && (
                  <span
                    className={styles.sessionDot}
                    aria-label={`${day.sessions.length} sessions`}
                  />
                )}
              </button>
            ) : (
              <span key={date} className={styles.missingDay}>
                {numericDay}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
