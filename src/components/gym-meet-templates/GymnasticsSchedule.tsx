"use client";

import { useCallback, useState } from "react";
import { Clock3, Pencil, Trash2, UsersRound } from "lucide-react";
import { gymnasticsScheduleEmptyMessage, type GymnasticsSchedulePeriod } from "@/lib/gymnastics-schedule-range";
import { useEventSectionBuilder } from "@/components/events/EventSectionBuilder";
import { useEventPageReadOnly } from "@/components/events/EventPageReadOnlyContext";
import GymnasticsScheduleCalendar from "./GymnasticsScheduleCalendar";
import type { GymMeetScheduleInfo } from "./types";
import styles from "../event-templates/gymnastics-schedule-editor.module.css";

export default function GymnasticsSchedule({ schedule }: { schedule?: GymMeetScheduleInfo }) {
  const builder = useEventSectionBuilder();
  const readOnly = useEventPageReadOnly();
  const [selectedDayId, setSelectedDayId] = useState<string>();
  const [activePeriodKind, setActivePeriodKind] = useState<GymnasticsSchedulePeriod["kind"]>();
  const showDay = useCallback((dayId: string | undefined, kind: GymnasticsSchedulePeriod["kind"] | undefined) => {
    setSelectedDayId(dayId);
    setActivePeriodKind(kind);
  }, []);
  if (
    !schedule ||
    schedule.enabled === false ||
    !Array.isArray(schedule.days) ||
    !schedule.days.length
  )
    return null;
  const editing = Boolean(builder && !readOnly);
  const selectedDay = schedule.days.find((day) => day.id === selectedDayId) || schedule.days[0];
  const editDay = (day: GymMeetScheduleInfo["days"][number]) => {
    setSelectedDayId(day.id);
    if (editing)
      builder?.edit({
        id: "schedule",
        label: "Schedule",
        editorId: `schedule:day:${encodeURIComponent(day.id)}`,
      });
  };
  return (
    <section className={`${styles.scheduleSection} rounded-2xl border border-current/15 p-5 sm:p-7`} aria-label="Meet schedule">
      <h2 className="mb-5 text-2xl font-semibold">Schedule</h2>
      <GymnasticsScheduleCalendar
        schedule={schedule}
        selectedDayId={selectedDay?.id}
        showDaySummary={false}
        onActiveDayChange={showDay}
        editing={editing}
        onSelectDay={editDay}
        onAddPeriod={
          editing
            ? () => builder?.edit({ id: "schedule", label: "Schedule", editorId: "schedule:add" })
            : undefined
        }
        onRemovePeriod={
          editing
            ? (period) =>
                builder?.edit({
                  id: "schedule",
                  label: "Schedule",
                  editorId: `schedule:remove:${encodeURIComponent(period.id)}`,
                })
            : undefined
        }
      />
      {selectedDay && (
        <div className={`${styles.selectedDay} ${activePeriodKind === "day" ? styles.exposedDay : ""}`}>
          {activePeriodKind !== "day" && (
            <div className={styles.itemHeading}>
              <h3 className="text-lg font-semibold">
                {selectedDay.shortDate || selectedDay.date || selectedDay.isoDate || "Date to confirm"}
              </h3>
              {editing && (
                <div className={styles.itemActions}>
                  <button
                    type="button"
                    className={styles.dayIcon}
                    title="Edit day"
                    aria-label={`${selectedDay.shortDate || selectedDay.date || "Selected day"} · Edit day`}
                    onClick={() => editDay(selectedDay)}
                  >
                    <Pencil size={18} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className={styles.dayIcon}
                    title="Remove day"
                    aria-label={`Remove day: ${selectedDay.shortDate || selectedDay.date || "Selected day"}`}
                    onClick={() =>
                      builder?.edit({
                        id: "schedule",
                        label: "Schedule",
                        editorId: `schedule:remove-day:${encodeURIComponent(selectedDay.id)}`,
                      })
                    }
                  >
                    <Trash2 size={18} aria-hidden="true" />
                  </button>
                </div>
              )}
            </div>
          )}
          {!selectedDay.sessions?.length && (
            <p className="mb-3 text-sm">{gymnasticsScheduleEmptyMessage(selectedDay)}</p>
          )}
          <div className={styles.sessionGrid}>
            {(selectedDay.sessions || []).map((session) => (
              <article key={session.id} className={styles.sessionCard}>
                <div className={styles.itemHeading}>
                  <h4 className={styles.sessionTitle}>{session.label || session.code || "Session"}</h4>
                  {editing && (
                    <div className={styles.itemActions}>
                      <button
                        type="button"
                        className={styles.dayIcon}
                        title="Edit session"
                        aria-label={`${session.label || session.code || "Session"} · Edit session`}
                        onClick={() =>
                          builder?.edit({
                            id: "schedule",
                            label: "Schedule",
                            editorId: `schedule:session:${encodeURIComponent(selectedDay.id)}/${encodeURIComponent(session.id)}`,
                          })
                        }
                      >
                        <Pencil size={18} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className={styles.dayIcon}
                        title="Remove session"
                        aria-label={`Remove session: ${session.label || session.code || "Session"}`}
                        onClick={() =>
                          builder?.edit({
                            id: "schedule",
                            label: "Schedule",
                            editorId: `schedule:remove-session:${encodeURIComponent(selectedDay.id)}/${encodeURIComponent(session.id)}`,
                          })
                        }
                      >
                        <Trash2 size={18} aria-hidden="true" />
                      </button>
                    </div>
                  )}
                </div>
                {session.group && <p className={styles.sessionGroup}>{session.group}</p>}
                {(session.startTime || session.warmupTime) && (
                  <div className={styles.sessionTiming}>
                    <span className={styles.timeIcon}><Clock3 size={20} aria-hidden="true" /></span>
                    <div>
                      {session.startTime && <p className={styles.sessionTime}>{session.startTime}</p>}
                      {session.warmupTime && <p className={styles.sessionWarmup}>Warm-up: {session.warmupTime}</p>}
                    </div>
                  </div>
                )}
                {session.note && <p className={styles.sessionNote}>{session.note}</p>}
                {!!session.clubs?.length && (
                  <div className={styles.sessionClubs}>
                    <p className={styles.clubsHeading}><UsersRound size={16} aria-hidden="true" /> Clubs</p>
                    <ul>
                      {session.clubs.map((club) => (
                        <li key={club.id}>
                          {club.name}
                          {club.divisionLabel ? ` · ${club.divisionLabel}` : ""}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </article>
            ))}
          </div>
        </div>
      )}
      {!!schedule.notes?.length && (
        <div className="mt-5 space-y-2">
          {schedule.notes.map((note) => (
            <p key={note} className="text-sm">
              {note}
            </p>
          ))}
        </div>
      )}
    </section>
  );
}
