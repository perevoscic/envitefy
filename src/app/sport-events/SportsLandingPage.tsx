"use client";

import { ArrowRight, CalendarDays, FileUp, LayoutPanelTop, Trophy } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import LandingHeroMedia from "@/components/landing/LandingHeroMedia";
import SignedOutPageChrome from "@/components/navigation/SignedOutPageChrome";
import { landingHeroGalleries } from "@/lib/landing-hero-galleries";
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
    <div className="min-h-screen bg-[#f8faf7] pb-24 text-[#17111e] md:pb-0">
      <SignedOutPageChrome
        activeBottomNavLabel="Create"
        brandHref="/"
        topNavVariant="transparent-dark"
      />

      <main>
        <section className="relative isolate flex min-h-[100svh] items-end overflow-hidden">
          <LandingHeroMedia images={landingHeroGalleries.sports} />
          <div className="relative z-[1] mx-auto grid w-full max-w-7xl items-end gap-10 px-5 pb-[calc(7.5rem+env(safe-area-inset-bottom))] pt-32 sm:px-8 md:pb-14 lg:grid-cols-[minmax(0,1fr)_minmax(26rem,0.68fr)] lg:px-10">
            <div className="max-w-4xl text-white">
              <div className="mb-8 hidden max-w-xl items-center justify-between rounded-full border border-white/20 bg-black/25 px-3 py-2 shadow-[0_14px_44px_rgba(0,0,0,0.22)] backdrop-blur-md sm:flex">
                {sportsBuilderSteps.map((step, index) => (
                  <div
                    key={step}
                    className="flex min-w-0 items-center gap-2 text-xs font-semibold sm:text-sm"
                  >
                    <span
                      className={
                        index === 0
                          ? "flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-[#17111e]"
                          : "flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/15 text-white"
                      }
                    >
                      {index + 1}
                    </span>
                    <span className={index === 0 ? "hidden text-white sm:inline" : "hidden sm:inline"}>
                      {step}
                    </span>
                  </div>
                ))}
              </div>
              <p className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)]">
                Sports event pages
              </p>
              <h1 className="max-w-3xl text-4xl font-black leading-[0.96] tracking-normal !text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.55)] sm:text-6xl">
                One workflow for game day, meets, tournaments, and team events.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)] sm:text-lg">
                Use the specialized Gymnastics flow for meet packets. For football, baseball,
                basketball, soccer, volleyball, and other games, start from the shared sports
                template and customize the sport details.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href={primaryHref}
                  className="inline-flex min-h-12 items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-[#17111e] shadow-[0_22px_54px_rgba(0,0,0,0.22)] transition hover:-translate-y-0.5"
                >
                  Build {selectedSport.routeLabel}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link
                  href="/event/gymnastics?auth=signup"
                  className="inline-flex min-h-12 items-center rounded-full border border-white/28 bg-white/12 px-6 py-3 text-sm font-bold text-white backdrop-blur-md transition hover:bg-white/18"
                >
                  Gymnastics meet workflow
                </Link>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-white/22 bg-white/90 p-4 text-[#17111e] shadow-[0_30px_90px_rgba(9,4,19,0.34)] backdrop-blur-xl">
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
                      <span
                        className={
                          style.id === selectedStyle ? "text-xs text-white/70" : "text-xs text-[#746b80]"
                        }
                      >
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
    </div>
  );
}
