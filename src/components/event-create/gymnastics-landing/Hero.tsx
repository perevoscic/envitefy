"use client";

import { MoveRight, Upload } from "lucide-react";
import styles from "./gymnastics-landing.module.css";

type HeroProps = {
  onGoToStart: () => void;
  onOpenBuilder: () => void;
};

const heroTabs = ["Sessions", "Rotations", "Venue", "Hotels", "Results"];

const evidenceNotes = [
  "Session schedule and warm-up times",
  "Venue notes, doors, and parking",
  "Hotel block, packet, and documents",
];

const sessionRows = [
  ["Coach check-in", "7:20 AM"],
  ["General stretch", "7:45 AM"],
  ["Competition starts", "8:00 AM"],
  ["Awards", "11:40 AM"],
];

export default function Hero({ onGoToStart, onOpenBuilder }: HeroProps) {
  return (
    <section className="relative px-4 pb-18 pt-8 sm:px-6 lg:px-8 lg:pb-24 lg:pt-12">
      <div className={styles.heroArc} aria-hidden="true" />
      <div className={`${styles.beamLine} ${styles.beamLineLeft}`} aria-hidden="true" />
      <div className={`${styles.beamLine} ${styles.beamLineRight}`} aria-hidden="true" />

      <div className={`${styles.container} grid gap-10 lg:grid-cols-[minmax(0,0.92fr)_minmax(560px,0.98fr)] lg:items-center xl:gap-16`}>
        <div className="max-w-[720px]">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#d8d9eb] bg-white/90 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.32em] text-[#4c4b82] shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
            <span className="h-2 w-2 rounded-full bg-[#d4af37]" />
            Built for gymnastics meets
          </div>

          <h1 className="mt-7 max-w-[14ch] text-[clamp(3.7rem,7vw,6.6rem)] font-[800] leading-[0.9] text-[#171b46]">
            Turn Gymnastics Meet Information Into a Shareable Event Page
          </h1>

          <p className="mt-6 max-w-[60ch] text-lg leading-8 text-[#55607d] sm:text-xl">
            Upload your meet schedule, sessions, venue details, hotels, and
            documents once. Envitefy turns them into one polished meet hub for
            parents, athletes, coaches, and spectators.
          </p>

          <div className="mt-9">
            <button
              type="button"
              onClick={onGoToStart}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#171b46] px-7 py-4 text-sm font-semibold text-white shadow-[0_22px_46px_rgba(23,27,70,0.24)] transition hover:-translate-y-0.5 hover:bg-[#121538]"
            >
              <Upload className="h-4 w-4" />
              Upload Meet Info
            </button>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-[#616d8b]">
            <span>Prefer full control?</span>
            <button
              type="button"
              onClick={onOpenBuilder}
              className="inline-flex items-center gap-2 font-semibold text-[#7f5d16] transition hover:text-[#5e440c]"
            >
              Open Visual Builder
              <MoveRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            {heroTabs.map((chip, index) => (
              <span
                key={chip}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${
                  index === 1
                    ? "bg-[#efe2b7] text-[#6d5210]"
                    : "border border-[#d9deef] bg-white/80 text-[#30405e]"
                }`}
              >
                {chip}
              </span>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="absolute left-6 top-12 hidden h-[82%] w-[24%] rounded-[2rem] border border-[#dfe3f0] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(245,247,252,0.86))] shadow-[0_18px_48px_rgba(23,27,70,0.08)] lg:block" />

          <div className="relative ml-auto max-w-[760px]">
            <div className="absolute -left-2 top-6 z-20 w-[34%] rounded-[2rem] border border-[#dfdfeb] bg-white/96 p-5 shadow-[0_18px_50px_rgba(23,27,70,0.1)] backdrop-blur lg:-left-8 lg:top-14">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#8188a2]">
                    Upload packet
                  </p>
                  <p className="mt-2 text-xl font-semibold text-[#171b46]">
                    Meet information
                  </p>
                </div>
                <div className="rounded-2xl bg-[#f3f1fb] p-3 text-[#4c4b82]">
                  <Upload className="h-4 w-4" />
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {evidenceNotes.map((note) => (
                  <div
                    key={note}
                    className="rounded-[1.25rem] border border-[#eceef6] bg-[#fafbff] px-4 py-3 text-sm leading-6 text-[#59657f]"
                  >
                    {note}
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-[1.2rem] border border-dashed border-[#d6d9e6] bg-[#f6f7fb] px-4 py-3 text-sm font-semibold text-[#364463]">
                PDF, JPG, PNG
              </div>
            </div>

            <div className="rounded-[2.4rem] border border-[#25285e] bg-[linear-gradient(180deg,#1e2258_0%,#171b46_100%)] p-5 pl-[24%] shadow-[0_34px_90px_rgba(23,27,70,0.24)] sm:p-6 sm:pl-[22%] lg:pl-[21%]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#c9ceef]">
                    Generated meet page
                  </p>
                  <h2 className="mt-2 max-w-[12ch] text-3xl font-[750] leading-tight text-white sm:text-[2.1rem]">
                    Gasparilla Classic Gymnastics Meet
                  </h2>
                </div>
                <span className="rounded-full border border-white/12 bg-white/8 px-3 py-2 text-xs font-semibold text-[#f4f5ff]">
                  Parent-ready hub
                </span>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
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

              <div className="mt-6 rounded-[1.8rem] bg-white p-5 text-[#1d2447]">
                <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
                  <div className="rounded-[1.45rem] bg-[#f6f7fc] p-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8690ab]">
                      Session 3
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-[#171b46]">
                      Level 7 and Xcel Platinum
                    </p>
                    <div className="mt-5 space-y-3">
                      {sessionRows.map(([label, time]) => (
                        <div
                          key={label}
                          className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-[0_6px_18px_rgba(23,27,70,0.05)]"
                        >
                          <span className="text-sm font-medium text-[#34415f]">{label}</span>
                          <span className="text-sm text-[#667391]">{time}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-4">
                    <article className="rounded-[1.35rem] bg-[#f8f8fe] p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8690ab]">
                        Venue
                      </p>
                      <p className="mt-2 text-lg font-semibold text-[#171b46]">
                        Convention Hall B
                      </p>
                      <p className="mt-2 text-sm leading-6 text-[#64708b]">
                        Parking map, entry doors, and parent seating notes.
                      </p>
                    </article>
                    <article className="rounded-[1.35rem] bg-[#fdf7e8] p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#92732a]">
                        Hotels + docs
                      </p>
                      <p className="mt-2 text-lg font-semibold text-[#3e3211]">
                        Block closes Jan 18
                      </p>
                      <p className="mt-2 text-sm leading-6 text-[#75632b]">
                        Hotel sheet, packet PDF, and results link in one place.
                      </p>
                    </article>
                  </div>
                </div>
              </div>

              <p className="mt-4 text-sm text-[#d9def8]">
                Upload once. Publish one clean meet page.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
