import { Clock3, ExternalLink, Hotel, MapPinned, Medal, Users } from "lucide-react";

const summary = [
  { label: "Sessions", value: "5" },
  { label: "Coaches", value: "42 gyms" },
  { label: "Hotels", value: "3 links" },
  { label: "Docs", value: "Packet + map" },
];

const cards = [
  {
    title: "Sessions",
    copy: "Session timing, levels, warm-up flow, and awards timing structured in one place.",
    icon: Clock3,
  },
  {
    title: "Venue",
    copy: "Directions, entrances, parking notes, and spectator guidance for meet day.",
    icon: MapPinned,
  },
  {
    title: "Hotels",
    copy: "Travel block details and stay planning without making families open another PDF.",
    icon: Hotel,
  },
  {
    title: "Results",
    copy: "Links to live results and post-meet follow-up where parents expect to find them.",
    icon: Medal,
  },
];

export default function ExampleMeet() {
  return (
    <section
      id="gym-example-meet"
      className="px-4 py-20 sm:px-6 lg:px-8 lg:py-24"
    >
      <div className="mx-auto max-w-7xl rounded-[2.3rem] border border-[#dbe0f1] bg-[linear-gradient(180deg,#ffffff_0%,#f7f8ff_100%)] p-6 shadow-[0_28px_70px_rgba(30,27,75,0.08)] sm:p-8 lg:p-10">
        <div className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.26em] text-[#4f46e5]">
              Example meet page
            </p>
            <h2 className="mt-4 font-[var(--font-gym-display)] text-4xl font-bold tracking-[-0.045em] text-[#17153f] sm:text-5xl">
              Gasparilla Classic Gymnastics Meet
            </h2>
            <p className="mt-5 text-lg leading-8 text-[#55627f]">
              A real gymnastics landing should show what the generated page can
              feel like: organized, elegant, and actually useful for families on
              meet weekend.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {summary.map((item) => (
                <div
                  key={item.label}
                  className="rounded-[1.4rem] border border-[#e2e6f6] bg-white p-4"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8d95b3]">
                    {item.label}
                  </p>
                  <p className="mt-2 text-lg font-semibold text-[#1e1b4b]">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-[1.6rem] border border-[#e2e6f6] bg-white p-5">
              <div className="flex items-center gap-3 text-[#1e1b4b]">
                <Users className="h-5 w-5 text-[#4f46e5]" />
                <p className="text-base font-semibold">
                  Coaches, parents, and spectators all land in the same place
                </p>
              </div>
              <p className="mt-3 text-sm leading-7 text-[#586581]">
                That means fewer repeated questions, fewer screenshot chains,
                and a more polished experience for your gymnastics gym or meet.
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-[2rem] border border-[#231f65] bg-[#1e1b4b] p-5 text-white shadow-[0_32px_80px_rgba(30,27,75,0.22)]">
            <div className="flex flex-wrap gap-2">
              {["Meet Overview", "Sessions", "Venue", "Hotels", "Results", "Spectator Info"].map(
                (tab, index) => (
                  <span
                    key={tab}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                      index === 1
                        ? "bg-[#d4af37] text-[#3a2f05]"
                        : "border border-white/10 bg-white/5 text-[#e2e5ff]"
                    }`}
                  >
                    {tab}
                  </span>
                ),
              )}
            </div>

            <div className="mt-5 rounded-[1.6rem] bg-white p-5 text-[#1a2242]">
              <div className="rounded-[1.35rem] bg-[#f6f7ff] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8d95b3]">
                  Session lineup
                </p>
                <div className="mt-4 space-y-3">
                  {[
                    ["Session 1", "Bronze / Silver", "7:30 AM"],
                    ["Session 2", "Gold / Platinum", "10:45 AM"],
                    ["Session 3", "Level 7 / Level 8", "2:15 PM"],
                  ].map(([session, levels, time]) => (
                    <div
                      key={session}
                      className="grid items-center gap-2 rounded-2xl border border-white bg-white px-4 py-3 sm:grid-cols-[1fr_auto]"
                    >
                      <div>
                        <p className="text-sm font-semibold text-[#223058]">{session}</p>
                        <p className="mt-1 text-xs text-[#677493]">{levels}</p>
                      </div>
                      <span className="text-sm font-medium text-[#3c4a72]">{time}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {cards.map(({ title, copy, icon: Icon }) => (
                  <article
                    key={title}
                    className="rounded-[1.3rem] border border-[#e2e6f6] bg-white p-4"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#efeeff] text-[#4f46e5]">
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <h3 className="mt-4 font-[var(--font-gym-display)] text-lg font-bold text-[#1e1b4b]">
                      {title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-[#5d6a87]">{copy}</p>
                  </article>
                ))}
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 text-sm text-[#d8dcff]">
              <ExternalLink className="h-4 w-4 text-[#d4af37]" />
              One published meet page instead of scattered files
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
