import { ExternalLink, Hotel, MapPinned, Medal, TimerReset } from "lucide-react";
import styles from "./gymnastics-landing.module.css";

const sessions = [
  ["Session 1", "Bronze / Silver", "7:30 AM"],
  ["Session 2", "Gold / Platinum", "10:45 AM"],
  ["Session 3", "Level 7 / Level 8", "2:15 PM"],
];

const sideCards = [
  {
    title: "Venue",
    copy: "Directions, entrances, parking notes, and spectator guidance all on the same page.",
    icon: MapPinned,
  },
  {
    title: "Hotels",
    copy: "Keep the travel block and booking details attached to the meet instead of buried in a PDF.",
    icon: Hotel,
  },
  {
    title: "Results",
    copy: "Live results stay connected to the rest of the meet information where families expect to look.",
    icon: Medal,
  },
];

export default function ExampleMeet() {
  return (
    <section id="gym-example-meet" className="px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
      <div className={`${styles.container} grid gap-10 lg:grid-cols-[minmax(0,0.78fr)_minmax(620px,1.08fr)] lg:items-start xl:gap-16`}>
        <div className="max-w-[560px] pt-4">
          <p className="text-sm font-semibold uppercase tracking-[0.26em] text-[#4f46e5]">
            Example meet page
          </p>
          <h2 className="mt-4 text-4xl font-bold tracking-[-0.045em] text-[#17153f] sm:text-5xl">
            A generated meet page should look like a real gymnastics meet, not a placeholder.
          </h2>
          <p className="mt-6 text-lg leading-8 text-[#55627f]">
            This preview is centered on the way gymnastics families actually
            move through meet weekend: sessions first, then venue details,
            hotels, results, and spectator guidance.
          </p>

          <div className="mt-10 rounded-[2rem] border border-[#dde2ee] bg-white p-6 shadow-[0_18px_48px_rgba(23,27,70,0.06)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8d95b3]">
              Meet snapshot
            </p>
            <div className="mt-5 space-y-4">
              <div className="flex items-center justify-between border-b border-[#eef1f7] pb-4">
                <span className="text-sm text-[#5b6683]">Meet</span>
                <span className="text-sm font-semibold text-[#171b46]">Gasparilla Classic Gymnastics Meet</span>
              </div>
              <div className="flex items-center justify-between border-b border-[#eef1f7] pb-4">
                <span className="text-sm text-[#5b6683]">Venue</span>
                <span className="text-sm font-semibold text-[#171b46]">Tampa Convention Hall B</span>
              </div>
              <div className="flex items-center justify-between border-b border-[#eef1f7] pb-4">
                <span className="text-sm text-[#5b6683]">Sessions</span>
                <span className="text-sm font-semibold text-[#171b46]">5 posted sessions</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#5b6683]">Audience</span>
                <span className="text-sm font-semibold text-[#171b46]">Parents, athletes, coaches</span>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-[2.4rem] border border-[#25285e] bg-[linear-gradient(180deg,#1e2258_0%,#171b46_100%)] p-5 shadow-[0_34px_90px_rgba(23,27,70,0.22)] sm:p-6 lg:p-7">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#c8cdef]">
                Gasparilla Classic Gymnastics Meet
              </p>
              <h3 className="mt-2 text-3xl font-[750] text-white">
                One page for sessions, venue, hotels, results, and spectator info
              </h3>
            </div>
            <a
              href="#gym-start-meet"
              className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/12"
            >
              Start your meet
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {["Sessions", "Venue", "Hotels", "Results", "Spectator Info"].map(
              (tab, index) => (
                <span
                  key={tab}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                    index === 0
                      ? "bg-[#d4af37] text-[#3d2f06]"
                      : "border border-white/10 bg-white/6 text-[#e5e8ff]"
                  }`}
                >
                  {tab}
                </span>
              ),
            )}
          </div>

          <div className="mt-6 rounded-[1.9rem] bg-white p-5 text-[#1d2447]">
            <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
              <div className="rounded-[1.5rem] bg-[#f7f8fd] p-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-white p-3 text-[#4f46e5] shadow-[0_8px_20px_rgba(23,27,70,0.07)]">
                    <TimerReset className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.23em] text-[#8d95b3]">
                      Sessions
                    </p>
                    <p className="text-lg font-semibold text-[#171b46]">
                      Saturday session lineup
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  {sessions.map(([session, levels, time]) => (
                    <div
                      key={session}
                      className="grid items-center gap-3 rounded-[1.25rem] bg-white px-4 py-4 shadow-[0_8px_20px_rgba(23,27,70,0.05)] sm:grid-cols-[1fr_auto]"
                    >
                      <div>
                        <p className="text-base font-semibold text-[#1f2a4d]">{session}</p>
                        <p className="mt-1 text-sm text-[#687390]">{levels}</p>
                      </div>
                      <span className="text-sm font-medium text-[#364360]">{time}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4">
                {sideCards.map(({ title, copy, icon: Icon }, index) => (
                  <article
                    key={title}
                    className={`rounded-[1.35rem] p-4 ${
                      index === 1 ? "bg-[#fdf7e8]" : "bg-[#f8f8fe]"
                    }`}
                  >
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
                        index === 1
                          ? "bg-[#efe0ab] text-[#775d17]"
                          : "bg-white text-[#4f46e5]"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <h4 className="mt-4 text-xl font-semibold text-[#171b46]">{title}</h4>
                    <p className="mt-2 text-sm leading-6 text-[#5f6a86]">{copy}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
