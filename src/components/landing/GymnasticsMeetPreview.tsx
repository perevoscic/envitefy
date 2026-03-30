"use client";

import {
  CalendarDays,
  Clock3,
  MapPinned,
} from "lucide-react";

type Props = {
  className?: string;
};

const sessionRows = [
  { label: "Coach check-in", value: "7:20 AM" },
  { label: "Warm-up", value: "7:45 AM" },
];

const quickTabs = ["Sessions", "Venue", "Hotels", "Updates"];

export default function GymnasticsMeetPreview({ className = "" }: Props) {
  return (
    <div
      className={`relative flex min-h-[520px] items-start justify-center overflow-x-clip pb-2 pt-2 sm:min-h-[560px] ${className}`}
    >
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/2 h-[160%] w-[160%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-tr from-indigo-200/70 via-violet-100/60 to-transparent blur-3xl" />
        <div className="absolute -left-8 top-10 h-56 w-56 rounded-full bg-violet-300/25 blur-3xl" />
        <div className="absolute -right-8 bottom-10 h-60 w-60 rounded-full bg-indigo-300/20 blur-3xl" />
      </div>

      <div className="relative w-full max-w-[560px]">
        <div className="absolute -left-4 top-10 hidden h-[70%] w-[30%] rounded-[2rem] border border-white/70 bg-white/70 shadow-[0_24px_60px_rgba(23,27,70,0.08)] backdrop-blur lg:block" />

        <div className="relative ml-auto overflow-hidden rounded-[2.5rem] border border-[#2b2d66] bg-[linear-gradient(180deg,#1e2258_0%,#171b46_100%)] p-4 shadow-[0_36px_100px_rgba(23,27,70,0.28)] sm:p-5">
          <div className="mt-4 grid gap-4">
            <div className="rounded-[1.9rem] border border-white/[0.12] bg-white p-5 text-[#1b204a] shadow-[0_18px_50px_rgba(15,23,42,0.14)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#6a7092]">
                    Public meet page
                  </p>
                  <h2 className="mt-2 text-[1.8rem] font-semibold leading-tight tracking-[-0.04em] text-[#171b46] sm:text-[2.15rem]">
                    Summit Invitational
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-[#65708f]">
                    Session times, venue notes, and hotel info in one polished
                    hub.
                  </p>
                </div>
                <span className="rounded-full bg-[#efe2b7] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6f5511]">
                  Meet ready
                </span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {quickTabs.map((tab, index) => (
                  <span
                    key={tab}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                      index === 0
                        ? "bg-[#171b46] text-white"
                        : "border border-[#dfe3f1] bg-white text-[#44506c]"
                    }`}
                  >
                    {tab}
                  </span>
                ))}
              </div>

              <div className="mt-5 rounded-[1.5rem] bg-[linear-gradient(180deg,#f8f8fe_0%,#eef1fb_100%)] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-[0_10px_24px_rgba(79,70,229,0.28)]">
                      <CalendarDays className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#7c84a4]">
                        Session 2
                      </p>
                      <p className="text-base font-semibold text-[#171b46]">
                        Level 7 and Xcel Gold
                      </p>
                    </div>
                  </div>
                  <Clock3 className="hidden h-5 w-5 text-[#c6cbe2] sm:block" />
                </div>

                <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                  {sessionRows.map((row) => (
                    <div
                      key={row.label}
                      className="rounded-2xl bg-white px-4 py-3 shadow-[0_8px_22px_rgba(23,27,70,0.05)]"
                    >
                      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9aa2bc]">
                        {row.label}
                      </p>
                      <p className="mt-1.5 text-sm font-semibold text-[#2c3557]">
                        {row.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 rounded-[1.45rem] bg-[#fdf7ea] p-4">
                <div className="flex items-center gap-2">
                  <MapPinned className="h-[18px] w-[18px] text-[#b47d16]" />
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#b48c3a]">
                    Venue + travel
                  </p>
                </div>
                <p className="mt-2 text-base font-semibold text-[#3f3112]">
                  Aurora Convention Hall
                </p>
                <p className="mt-1.5 text-sm leading-6 text-[#73622d]">
                  Parking map, entry notes, and hotel block in one place.
                </p>
              </div>
            </div>
          </div>

        </div>

        <div
          className="glass-panel absolute -right-3 top-[18%] z-30 flex max-w-[230px] items-center gap-3 rounded-xl border border-white/60 bg-white/[0.78] px-4 py-3 shadow-xl backdrop-blur"
          style={{ animation: "gymFloat 6s ease-in-out infinite" }}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#efe2b7] text-[#6f5511]">
            <MapPinned className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
              Live update
            </p>
            <p className="text-xs font-semibold text-slate-800">
              Parking map included
            </p>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .glass-panel {
          background: rgba(255, 255, 255, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.6);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }

        @keyframes gymFloat {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-16px);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .glass-panel {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
