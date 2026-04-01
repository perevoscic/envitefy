import { CalendarDays, MapPinned, Trophy } from "lucide-react";

type Props = {
  className?: string;
};

const sessionRows = [
  { label: "Coach check-in", value: "7:20 AM" },
  { label: "Warm-up", value: "7:45 AM" },
] as const;

const quickTabs = ["Sessions", "Venue", "Documents", "Updates"] as const;

export default function GymnasticsMeetPreview({ className = "" }: Props) {
  return (
    <div
      className={`relative flex min-h-[500px] items-start justify-center overflow-x-clip pb-2 pt-2 sm:min-h-[540px] ${className}`}
    >
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/2 h-[160%] w-[160%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-tr from-indigo-200/70 via-violet-100/60 to-transparent blur-3xl" />
        <div className="absolute -left-8 top-10 h-56 w-56 rounded-full bg-violet-300/25 blur-3xl" />
        <div className="absolute -right-8 bottom-10 h-60 w-60 rounded-full bg-indigo-300/20 blur-3xl" />
      </div>

      <div className="relative w-full max-w-[560px]">
        <div className="absolute inset-x-8 -bottom-6 top-8 rounded-[2.2rem] border border-white/70 bg-white/60 shadow-[0_24px_60px_rgba(91,58,191,0.08)] backdrop-blur" />

        <div className="relative overflow-hidden rounded-[2.5rem] border border-[#e6dbff] bg-white p-4 shadow-[0_32px_90px_rgba(91,58,191,0.14)] sm:p-5">
          <div className="flex items-center justify-between gap-3 px-2 pb-4">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#d5c6ff]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#eadfff]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#f3eeff]" />
            </div>
            <span className="rounded-full border border-[#ebe1ff] bg-[#faf7ff] px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#6b53c4]">
              Live meet page
            </span>
          </div>

          <div className="rounded-[1.9rem] bg-[linear-gradient(180deg,#f7f2ff_0%,#ffffff_100%)] p-5 text-[#1d1738]">
            <div className="rounded-[1.5rem] bg-[linear-gradient(135deg,#7550ff_0%,#9b73ff_60%,#cebaff_100%)] p-5 text-white shadow-[0_18px_42px_rgba(117,80,255,0.24)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-white/82">
                    Summit Invitational
                  </p>
                  <h2
                    className="mt-2 text-[1.8rem] font-semibold leading-tight tracking-[-0.04em] sm:text-[2.15rem]"
                    style={{
                      fontFamily:
                        'var(--font-montserrat), var(--font-sans), sans-serif',
                    }}
                  >
                    One page for the full meet weekend
                  </h2>
                </div>
                <span className="rounded-full bg-white/16 px-3 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-white">
                  Meet ready
                </span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {quickTabs.map((tab, index) => (
                  <span
                    key={tab}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                      index === 0
                        ? "bg-white text-[#5f42d5]"
                        : "bg-white/14 text-white"
                    }`}
                  >
                    {tab}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[1.35rem] border border-[#ebe3ff] bg-white p-4 shadow-[0_10px_24px_rgba(91,58,191,0.05)]">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f4eeff] text-[#6d52cc]">
                    <CalendarDays className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8d83af]">
                      Session 2
                    </p>
                    <p className="text-sm font-semibold text-[#241d46]">
                      Level 7 and Xcel Gold
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-2">
                  {sessionRows.map((row) => (
                    <div
                      key={row.label}
                      className="rounded-2xl bg-[#faf8ff] px-4 py-3"
                    >
                      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9a91b8]">
                        {row.label}
                      </p>
                      <p className="mt-1.5 text-sm font-semibold text-[#2c2354]">
                        {row.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div className="rounded-[1.35rem] border border-[#ebe3ff] bg-white p-4 shadow-[0_10px_24px_rgba(91,58,191,0.05)]">
                  <div className="flex items-center gap-2 text-[#6d52cc]">
                    <MapPinned className="h-4 w-4" />
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8d83af]">
                      Venue + parking
                    </p>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-[#241d46]">
                    Aurora Convention Hall
                  </p>
                  <p className="mt-1.5 text-sm leading-6 text-[#675f83]">
                    Maps, parking notes, and entry guidance stay attached to the
                    same link.
                  </p>
                </div>

                <div className="rounded-[1.35rem] border border-[#ebe3ff] bg-white p-4 shadow-[0_10px_24px_rgba(91,58,191,0.05)]">
                  <div className="flex items-center gap-2 text-[#6d52cc]">
                    <Trophy className="h-4 w-4" />
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8d83af]">
                      Results links
                    </p>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-[#241d46]">
                    Add updates and post-session links as the weekend moves.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
