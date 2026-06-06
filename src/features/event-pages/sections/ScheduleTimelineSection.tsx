import type { EventSection } from "../schemas/eventBlueprint.schema";
import { formatScheduleTime, SectionFrame } from "./section-utils";

export function ScheduleTimelineSection({ section }: { section: EventSection }) {
  const schedule = section.schedule || [];
  return (
    <SectionFrame section={section} id="schedule">
      <div className="grid gap-[var(--event-page-card-gap)]">
        {schedule.map((item) => {
          const time = formatScheduleTime(item.startAt, item.timezone);
          return (
            <article key={item.id} className="grid gap-3 rounded-[calc(var(--event-page-radius)*0.75)] border border-[var(--event-page-border)] p-4 sm:grid-cols-[10rem_1fr]">
              <div className="text-sm font-black text-[var(--event-page-primary)]">{time || item.group || "Schedule"}</div>
              <div>
                <h3 className="text-lg font-black">{item.title}</h3>
                {item.locationText ? <p className="mt-1 text-sm font-bold text-[var(--event-page-muted)]">{item.locationText}</p> : null}
                {item.notes ? <p className="mt-2 text-sm leading-6 text-[var(--event-page-muted)]">{item.notes}</p> : null}
              </div>
            </article>
          );
        })}
      </div>
    </SectionFrame>
  );
}
