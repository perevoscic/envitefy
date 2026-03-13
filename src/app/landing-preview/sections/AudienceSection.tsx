import {
  Dumbbell,
  Flag,
  PersonStanding,
  Sparkles,
  Trophy,
  Waves,
} from "lucide-react";

const audienceCards = [
  {
    icon: Dumbbell,
    title: "Gymnastics Meets",
    copy: "Strong fit for packets, schedules, venue diagrams, results, and spectator logistics.",
  },
  {
    icon: Waves,
    title: "Swim Meets",
    copy: "Useful when families need a clearer page than the original heat sheets and meet notes.",
  },
  {
    icon: Flag,
    title: "Track Meets",
    copy: "Good for organizing event timing, venue info, parking, and day-of reminders in one place.",
  },
  {
    icon: Sparkles,
    title: "Cheer Competitions",
    copy: "Keep arrival guidance, schedules, spectator details, and event documents in a single hub.",
  },
  {
    icon: Trophy,
    title: "Tournaments",
    copy: "Works for broader team events when multiple logistics and documents need a cleaner presentation.",
  },
  {
    icon: PersonStanding,
    title: "Busy Families",
    copy: "Even outside sports, families can still use Envitefy for birthdays, weddings, and uploads that should be easier to share.",
  },
];

export default function AudienceSection() {
  return (
    <section
      className="px-4 py-20 sm:px-6 lg:px-8 lg:py-24"
      aria-labelledby="audience-heading"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.26em] text-[#4d8fb4]">
            Who uses Envitefy
          </p>
          <h2
            id="audience-heading"
            className="mt-4 font-['Poppins'] text-4xl font-semibold tracking-[-0.04em] text-[#0b2035] sm:text-5xl"
          >
            Built for parents first, credible enough for organizers
          </h2>
          <p className="mt-5 text-lg leading-8 text-[#587088]">
            The tone and layout need to work for sports families, but they also
            need to feel polished enough that a coach or organizer would be
            comfortable sharing the link publicly.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {audienceCards.map(({ icon: Icon, title, copy }) => (
            <article
              key={title}
              className="rounded-[1.9rem] border border-[#d7e2ec] bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef6fb] text-[#0f766e]">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-xl font-semibold tracking-[-0.02em] text-[#10233f]">
                {title}
              </h3>
              <p className="mt-3 text-sm leading-7 text-[#587088]">{copy}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
