"use client";

import { createContext, useContext, type ReactNode } from "react";
import CalendarAction from "@/components/CalendarAction";
import { scanScheduleWhen, type ScanSchedule } from "@/lib/scan-schedule";
import { buildCalendarLinks } from "@/utils/calendar-links";

const ScheduleContext = createContext<ScanSchedule | null>(null);
export function ScannedScheduleProvider({
  schedule,
  children,
}: {
  schedule: ScanSchedule | null;
  children: ReactNode;
}) {
  return <ScheduleContext.Provider value={schedule}>{children}</ScheduleContext.Provider>;
}

export default function ScannedSchedule({
  schedule: suppliedSchedule,
  interactive = true,
}: {
  schedule?: ScanSchedule | null;
  interactive?: boolean;
}) {
  const context = useContext(ScheduleContext);
  const schedule = suppliedSchedule === undefined ? context : suppliedSchedule;
  if (!schedule?.items.length) return null;
  const groups = Array.from(
    new Set(
      schedule.items.map(
        (item) => item.group || (item.type === "practice" ? "Practices" : "Games"),
      ),
    ),
  );
  return (
    <section
      id="schedule"
      aria-label="Schedule"
      className="col-span-full min-w-0 rounded-[2rem] border border-white/60 bg-white p-5 text-slate-950 shadow-sm sm:p-7"
    >
      <h2 className="text-2xl font-semibold">{schedule.title}</h2>
      {schedule.timeframe ? (
        <p className="mt-2 text-base text-slate-700">{schedule.timeframe}</p>
      ) : null}
      <p className="mt-2 text-sm text-slate-600">
        {schedule.items.length} sessions and games · Times in{" "}
        {schedule.timezone.replaceAll("_", " ")}
      </p>
      <div className="mt-6 space-y-6">
        {groups.map((group) => (
          <div key={group}>
            <h3 className="text-lg font-semibold">{group}</h3>
            <ul className="mt-3 space-y-3">
              {schedule.items
                .filter(
                  (item) =>
                    (item.group || (item.type === "practice" ? "Practices" : "Games")) === group,
                )
                .map((item, index) => {
                  const links =
                    item.startAt && item.endAt && item.status !== "cancelled"
                      ? buildCalendarLinks({
                          title: item.title,
                          description: item.notes || "",
                          location: item.locationText || "",
                          startIso: item.startAt,
                          endIso: item.endAt,
                          timezone: item.timezone,
                          allDay: false,
                          recurrence: null,
                          reminders: null,
                        })
                      : null;
                  return (
                    <li
                      key={`${item.id}-${index}`}
                      className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1 basis-52 break-words">
                          <p className="font-semibold">{item.title}</p>
                          <p className="mt-1 text-base">{scanScheduleWhen(item)}</p>
                          {item.opponent || item.homeAway ? (
                            <p className="mt-1 text-sm text-slate-700">
                              {[
                                item.opponent,
                                item.homeAway === "home"
                                  ? "Home"
                                  : item.homeAway === "away"
                                    ? "Away"
                                    : null,
                              ]
                                .filter(Boolean)
                                .join(" · ")}
                            </p>
                          ) : null}
                          <p className="mt-2 text-sm text-slate-700">
                            {item.locationText || "Location TBD"}
                          </p>
                          {item.status !== "scheduled" ? (
                            <p className="mt-2 font-semibold">{item.status}</p>
                          ) : null}
                          {item.notes ? (
                            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">
                              {item.notes}
                            </p>
                          ) : null}
                        </div>
                        {interactive && links ? <CalendarAction links={links} /> : null}
                      </div>
                    </li>
                  );
                })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
