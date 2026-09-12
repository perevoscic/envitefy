import type { GymMeetScheduleInfo } from "./types";

export default function GymnasticsSchedule({ schedule }: { schedule?: GymMeetScheduleInfo }) {
  if (
    !schedule ||
    schedule.enabled === false ||
    !Array.isArray(schedule.days) ||
    !schedule.days.length
  )
    return null;
  return (
    <section className="rounded-2xl border border-current/15 p-5 sm:p-7" aria-label="Meet schedule">
      <h2 className="mb-5 text-2xl font-semibold">Schedule</h2>
      <div className="space-y-5">
        {schedule.days.map((day) => (
          <div key={day.id}>
            <h3 className="mb-3 text-lg font-semibold">
              {day.shortDate || day.date || day.isoDate || "Date to confirm"}
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {(day.sessions || []).map((session) => (
                <article key={session.id} className="rounded-xl border border-current/15 p-4">
                  <h4 className="font-semibold">{session.label || session.code || "Session"}</h4>
                  {session.group ? <p className="mt-1 text-sm">{session.group}</p> : null}
                  {session.startTime ? (
                    <p className="mt-2 font-semibold">{session.startTime}</p>
                  ) : null}
                  {session.warmupTime ? (
                    <p className="mt-1 text-sm">Warm-up: {session.warmupTime}</p>
                  ) : null}
                  {session.note ? (
                    <p className="mt-2 whitespace-pre-wrap text-sm">{session.note}</p>
                  ) : null}
                  {session.clubs?.length ? (
                    <ul className="mt-3 space-y-1 text-sm">
                      {session.clubs.map((club) => (
                        <li key={club.id}>
                          {club.name}
                          {club.divisionLabel ? ` · ${club.divisionLabel}` : ""}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </article>
              ))}
            </div>
          </div>
        ))}
      </div>
      {schedule.notes?.length ? (
        <div className="mt-5 space-y-2">
          {schedule.notes.map((note) => (
            <p key={note} className="text-sm">
              {note}
            </p>
          ))}
        </div>
      ) : null}
    </section>
  );
}
