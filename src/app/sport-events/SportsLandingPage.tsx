"use client";

import { ArrowRight, CalendarDays, FileUp, LayoutPanelTop, Trophy } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import SignedOutPageChrome from "@/components/navigation/SignedOutPageChrome";
import {
  buildSportEventCustomizeHref,
  getSportEventPreset,
  SPORT_EVENT_PRESETS,
} from "@/lib/sport-event-presets";

const sportsBuilderSteps = [
  "Choose sport",
  "Choose look",
  "Upload info",
  "Preview & publish",
];

const styleOptions = [
  {
    id: "stadium",
    label: "Stadium",
    description: "Dark lights, matchup energy, and big-game contrast.",
  },
  {
    id: "club",
    label: "Club",
    description: "Clean team-page layout for leagues, clubs, and parents.",
  },
  {
    id: "tournament",
    label: "Tournament",
    description: "Built for schedules, brackets, parking, and updates.",
  },
];

export default function SportsLandingPage() {
  const search = useSearchParams();
  const selectedSport = getSportEventPreset(search?.get("sport"));
  const selectedStyle = search?.get("style") || "stadium";
  const primaryHref = `${buildSportEventCustomizeHref(selectedSport.key, selectedStyle)}&auth=signup`;

  return (
    <main className="min-h-screen bg-[#f8faf7] pb-24 text-[#17111e] md:pb-0">
      <SignedOutPageChrome activeBottomNavLabel="Create" topNavVariant="default" />

      <section className="mx-auto flex min-h-[calc(100svh-4rem)] w-full max-w-7xl flex-col px-4 pb-10 pt-24 sm:px-6 lg:px-8">
        <div className="mx-auto mb-8 flex w-full max-w-4xl items-center justify-between rounded-full border border-[#211a30]/20 bg-white px-3 py-2 shadow-[0_14px_44px_rgba(26,19,40,0.08)]">
          {sportsBuilderSteps.map((step, index) => (
            <div key={step} className="flex min-w-0 items-center gap-2 text-xs font-semibold sm:text-sm">
              <span
                className={
                  index === 0
                    ? "flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#5f55ff] text-white"
                    : "flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#e6e1d6] text-[#625d54]"
                }
              >
                {index + 1}
              </span>
              <span className={index === 0 ? "hidden text-[#2921d7] sm:inline" : "hidden sm:inline"}>
                {step}
              </span>
            </div>
          ))}
        </div>

        <div className="grid flex-1 gap-8 lg:grid-cols-[minmax(0,0.92fr)_minmax(26rem,0.68fr)] lg:items-center">
          <div>
            <p className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-[#5f55ff]">
              Sports event pages
            </p>
            <h1 className="max-w-3xl text-4xl font-black leading-[0.96] tracking-normal text-[#17111e] sm:text-6xl">
              One workflow for game day, meets, tournaments, and team events.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[#51495c] sm:text-lg">
              Use the specialized Gymnastics flow for meet packets. For football, baseball,
              basketball, soccer, volleyball, and other games, start from the shared sports
              template and customize the sport details.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={primaryHref}
                className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#17111e] px-6 py-3 text-sm font-bold text-white shadow-[0_18px_42px_rgba(23,17,30,0.2)] transition hover:-translate-y-0.5"
              >
                Build {selectedSport.routeLabel}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href="/event/gymnastics?auth=signup"
                className="inline-flex min-h-12 items-center rounded-full border border-[#d9d1e8] bg-white px-6 py-3 text-sm font-bold text-[#2b2140] transition hover:-translate-y-0.5"
              >
                Gymnastics meet workflow
              </Link>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-[#e4ddf2] bg-white p-4 shadow-[0_24px_90px_rgba(38,29,55,0.12)]">
            <div className="rounded-[1.25rem] bg-[#111827] p-4 text-white">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#f6d477]">
                    Selected
                  </p>
                  <h2 className="text-2xl font-black">{selectedSport.routeLabel}</h2>
                </div>
                <Trophy className="h-8 w-8 text-[#f6d477]" aria-hidden="true" />
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-white/10 p-3">
                  <LayoutPanelTop className="mb-3 h-5 w-5 text-[#b9c5ff]" aria-hidden="true" />
                  <p className="text-sm font-bold">Looks</p>
                  <p className="mt-1 text-xs text-white/70">Pick a game-day visual system.</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-3">
                  <FileUp className="mb-3 h-5 w-5 text-[#b9c5ff]" aria-hidden="true" />
                  <p className="text-sm font-bold">Info</p>
                  <p className="mt-1 text-xs text-white/70">Add flyer, schedule, or manual details.</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-3">
                  <CalendarDays className="mb-3 h-5 w-5 text-[#b9c5ff]" aria-hidden="true" />
                  <p className="text-sm font-bold">Publish</p>
                  <p className="mt-1 text-xs text-white/70">Share the live page with guests.</p>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <h3 className="mb-3 text-sm font-bold text-[#2b2140]">Popular sports</h3>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {SPORT_EVENT_PRESETS.map((sport) => (
                  <Link
                    key={sport.key}
                    href={`/sport-events?sport=${sport.key}&style=${selectedStyle}`}
                    className={
                      sport.key === selectedSport.key
                        ? "rounded-xl border border-[#5f55ff] bg-[#f0eeff] px-3 py-2 text-sm font-bold text-[#2921d7]"
                        : "rounded-xl border border-[#ebe6f5] bg-[#fbfafc] px-3 py-2 text-sm font-semibold text-[#433a4f] transition hover:border-[#cfc7ff] hover:bg-[#f5f2ff]"
                    }
                  >
                    {sport.shortLabel}
                  </Link>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <h3 className="mb-3 text-sm font-bold text-[#2b2140]">Look direction</h3>
              <div className="grid gap-2">
                {styleOptions.map((style) => (
                  <Link
                    key={style.id}
                    href={`/sport-events?sport=${selectedSport.key}&style=${style.id}`}
                    className={
                      style.id === selectedStyle
                        ? "rounded-xl border border-[#17111e] bg-[#17111e] px-4 py-3 text-white"
                        : "rounded-xl border border-[#ebe6f5] bg-white px-4 py-3 text-[#433a4f] transition hover:border-[#cfc7ff]"
                    }
                  >
                    <span className="block text-sm font-bold">{style.label}</span>
                    <span className={style.id === selectedStyle ? "text-xs text-white/70" : "text-xs text-[#746b80]"}>
                      {style.description}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
