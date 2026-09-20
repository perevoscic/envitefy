"use client";

import { CalendarPlus } from "lucide-react";
import { useCalendarAction } from "@/components/CalendarAction";
import { CALENDAR_PROVIDER_NAMES, type CalendarProvider } from "@/lib/calendar-preference";
import { type CalendarHandoffEvent } from "@/utils/calendar-handoff";
import { buildCalendarLinks } from "@/utils/calendar-links";

const providers: CalendarProvider[] = ["google", "apple", "microsoft"];

export default function CalendarHandoff({ handoff }: { handoff: CalendarHandoffEvent | null }) {
  const links = handoff ? buildCalendarLinks(handoff.event) : null;
  const calendar = useCalendarAction({ links });
  const event = handoff?.event;
  const when = event ? new Intl.DateTimeFormat("en-US", {
    dateStyle: "full",
    ...(event.allDay ? {} : { timeStyle: "short" as const }),
    timeZone: event.allDay ? "UTC" : event.timezone,
  }).format(new Date(event.startIso)) : "";

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#f7f5fb] px-4 py-8 text-[#2f2550]">
      <section className="w-full max-w-md rounded-3xl border border-[#ddd4f8] bg-white p-6 shadow-sm sm:p-8" aria-labelledby="calendar-heading">
        <CalendarPlus className="mb-5 size-9 text-[#6b3cff]" aria-hidden="true" />
        <h1 id="calendar-heading" className="text-2xl font-semibold">Add to calendar</h1>
        {handoff && event ? (
          <>
            <h2 className="mt-6 break-words text-xl font-semibold">{event.title}</h2>
            <p className="mt-2 text-sm leading-6">{when}{event.allDay ? " · All day" : ` · ${event.timezone}`}</p>
            {event.location ? <p className="mt-1 break-words text-sm leading-6">{event.location}</p> : null}
            <button type="button" onClick={() => calendar.select(handoff.provider)} className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#6b3cff] px-4 py-3 font-semibold text-white hover:bg-[#5429d6] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-600">
              <CalendarPlus className="size-5 shrink-0" aria-hidden="true" />
              Open {CALENDAR_PROVIDER_NAMES[handoff.provider]}
            </button>
            <p className="mt-3 text-sm leading-6 text-[#6b617d]">Review the event in your calendar, then save it.</p>
            {calendar.fallbackOptions}
            <div className="mt-6 border-t border-[#ddd4f8] pt-4">
              <p className="text-sm text-[#6b617d]">Use another calendar</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {providers.filter(provider => provider !== handoff.provider).map(provider => (
                  <button key={provider} type="button" onClick={() => calendar.select(provider)} className="min-h-11 rounded-xl border border-[#ddd4f8] px-3 py-2 text-sm font-medium hover:bg-[#f7f2ff] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600">
                    {CALENDAR_PROVIDER_NAMES[provider]}
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : <p className="mt-4 leading-7">This calendar link is incomplete. Open the event invitation and choose Add to calendar again.</p>}
        <p className="mt-8 text-center text-xs text-[#6b617d]">Envitefy</p>
      </section>
    </main>
  );
}
