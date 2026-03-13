import Link from "next/link";
import {
  CalendarClock,
  CircleCheckBig,
  ExternalLink,
  Hotel,
  MapPinned,
  Ticket,
} from "lucide-react";

const summaryCards = [
  { label: "Schedule", value: "5 sessions" },
  { label: "Venue", value: "Downtown Tampa" },
  { label: "Hotels", value: "3 travel links" },
  { label: "Docs", value: "Packet + map + results" },
];

const moduleCards = [
  {
    icon: CalendarClock,
    title: "Schedule",
    copy: "Warm-up, march-in, competition start, and awards laid out in parent-friendly order.",
  },
  {
    icon: MapPinned,
    title: "Venue",
    copy: "Address, entry flow, map details, and where families should head first.",
  },
  {
    icon: Hotel,
    title: "Travel",
    copy: "Hotel block notes, travel planning, and stay information for out-of-town meets.",
  },
  {
    icon: Ticket,
    title: "Spectator Info",
    copy: "Admission timing, ticket instructions, and practical details that reduce day-of confusion.",
  },
];

export default function ExampleMeetHub() {
  return (
    <section
      id="example-meet"
      className="px-4 py-20 sm:px-6 lg:px-8 lg:py-24"
      aria-labelledby="example-meet-heading"
    >
      <div className="mx-auto max-w-7xl rounded-[2.25rem] border border-[#d8e3f0] bg-[linear-gradient(180deg,#f2f8fb_0%,#ffffff_100%)] p-6 shadow-[0_30px_80px_rgba(15,23,42,0.08)] sm:p-8 lg:p-10">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.26em] text-[#4d8fb4]">
              Real meet example
            </p>
            <h2
              id="example-meet-heading"
              className="mt-4 font-['Poppins'] text-4xl font-semibold tracking-[-0.04em] text-[#0b2035] sm:text-5xl"
            >
              Gasparilla Classic Gymnastics Meet
            </h2>
            <p className="mt-5 text-lg leading-8 text-[#587088]">
              This preview shows the kind of page Envitefy can generate from the
              packet and supporting files: a polished hub with practical modules
              families can use during the full weekend.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {summaryCards.map((card) => (
                <div
                  key={card.label}
                  className="rounded-[1.5rem] border border-white/70 bg-white/90 p-4 shadow-[0_12px_30px_rgba(15,23,42,0.05)]"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#84a0b8]">
                    {card.label}
                  </p>
                  <p className="mt-2 text-lg font-semibold text-[#10233f]">
                    {card.value}
                  </p>
                </div>
              ))}
            </div>

            <Link
              href="#final-cta"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#102a43] px-5 py-3.5 text-sm font-semibold text-white shadow-[0_16px_32px_rgba(16,42,67,0.18)] transition hover:-translate-y-0.5 hover:bg-[#0b2237]"
            >
              View Full Example
              <ExternalLink className="h-4 w-4" />
            </Link>
          </div>

          <div className="rounded-[2rem] border border-[#d8e3f0] bg-[#0f2136] p-5 text-white shadow-[0_24px_60px_rgba(15,23,42,0.2)]">
            <div className="flex flex-wrap gap-2">
              {["Meet Details", "Schedule", "Venue Details", "Travel", "Results"].map(
                (item, index) => (
                  <span
                    key={item}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                      index === 0
                        ? "bg-white text-[#10233f]"
                        : "border border-white/10 bg-white/5 text-[#d2ddeb]"
                    }`}
                  >
                    {item}
                  </span>
                ),
              )}
            </div>

            <div className="mt-5 rounded-[1.6rem] bg-white p-5 text-[#10233f]">
              <div className="grid gap-4 md:grid-cols-2">
                {moduleCards.map(({ icon: Icon, title, copy }) => (
                  <article
                    key={title}
                    className="rounded-[1.4rem] border border-[#e1eaf2] bg-[#f7fafc] p-5"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e7f7f4] text-[#0f766e]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                    <p className="mt-3 text-sm leading-6 text-[#587088]">{copy}</p>
                  </article>
                ))}
              </div>

              <div className="mt-4 rounded-[1.4rem] border border-[#e1eaf2] bg-[#f7fafc] p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#0f766e]">
                  <CircleCheckBig className="h-4 w-4" />
                  Results and operational notes can live alongside the family-facing details
                </div>
                <p className="mt-3 text-sm leading-7 text-[#587088]">
                  That matters because coaches and organizers often need to keep
                  packet specifics, travel notes, spectator guidance, and result
                  references connected in one page instead of spread across
                  different tools.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
