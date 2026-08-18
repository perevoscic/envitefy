"use client";

import {
  ArrowRight,
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  CloudSun,
  MapPin,
  Megaphone,
  QrCode,
  ShieldCheck,
  Ticket,
  Trophy,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import LandingHeroMedia from "@/components/landing/LandingHeroMedia";
import SignedOutPageChrome from "@/components/navigation/SignedOutPageChrome";
import { landingHeroGalleries } from "@/lib/landing-hero-galleries";
import {
  buildSportEventCustomizeHref,
  getSportEventPreset,
  SPORT_EVENT_PRESETS,
  type SportEventPreset,
} from "@/lib/sport-event-presets";

const styleOptions = [
  {
    id: "stadium",
    label: "Stadium",
    description: "Big-game contrast and Friday-night energy.",
  },
  {
    id: "club",
    label: "Club",
    description: "A clean team hub for families and players.",
  },
  {
    id: "tournament",
    label: "Tournament",
    description: "Built around schedules, venues, and updates.",
  },
] as const;

const sportsStories = [
  {
    src: "/images/landing/sports/sports-editorial-football.webp",
    alt: "Youth football game under stadium lights",
    label: "Game nights",
    title: "Turn the matchup into a moment",
    body: "Kickoff, tickets, parking, arrival notes, and the latest update—all before families leave home.",
  },
  {
    src: "/images/landing/sports/sports-editorial-basketball.webp",
    alt: "Community basketball game in a packed gym",
    label: "Indoor events",
    title: "Get everyone to the right door",
    body: "Share gym entrances, tipoff times, livestreams, team notes, and last-minute changes.",
  },
  {
    src: "/images/landing/sports/sports-editorial-baseball.webp",
    alt: "Youth baseball game at sunset",
    label: "Season schedules",
    title: "Keep every field in reach",
    body: "Give families one dependable place for field maps, weather notes, schedules, and calendar saves.",
  },
] as const;

const sportsFaqs = [
  {
    question: "Can I use Envitefy for a full season?",
    answer:
      "Yes. Build a season page with the schedule, venues, team notes, calendar actions, and updates in one shareable link.",
  },
  {
    question: "Can I upload a flyer or schedule?",
    answer:
      "Yes. Start from an image, screenshot, PDF, or existing schedule instead of retyping every detail.",
  },
  {
    question: "Can families RSVP or mark player availability?",
    answer:
      "Yes. Collect attendance and availability while keeping event details on the same public page.",
  },
  {
    question: "What happens when a time or field changes?",
    answer:
      "Update the published page so the same team link always carries the current plan, then send an update or reminder.",
  },
  {
    question: "Does Envitefy support tournaments and multi-game days?",
    answer:
      "Yes. Use the tournament direction for schedules, multiple locations, parking, admissions, and day-of updates.",
  },
] as const;

function GameDayPreview({
  sport,
  compact = false,
}: {
  sport: SportEventPreset;
  compact?: boolean;
}) {
  return (
    <div
      className={`overflow-hidden border border-white/20 bg-[#0b152a]/90 text-white shadow-[0_34px_100px_rgba(2,8,20,0.48)] backdrop-blur-xl ${
        compact ? "rounded-[1.8rem] p-5 sm:p-6" : "rounded-[2rem] p-5 sm:p-7"
      }`}
    >
      <div className="flex items-start justify-between gap-5">
        <div>
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.23em] text-[#f5c963]">
            Live game-day page
          </p>
          <h2 className="mt-2 text-2xl font-black leading-tight !text-white sm:text-3xl">
            Hawthorne {sport.shortLabel}
          </h2>
          <p className="mt-1.5 text-sm text-white/54">{sport.opponentPlaceholder}</p>
        </div>
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#f5c963] text-[#10182b]">
          <Trophy className="h-5 w-5" aria-hidden="true" />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 divide-x divide-white/12 border-y border-white/12 py-4 text-center">
        <div>
          <p className="text-xl font-bold">7:30</p>
          <p className="mt-1 text-[0.58rem] font-bold uppercase tracking-[0.15em] text-white/38">
            start
          </p>
        </div>
        <div>
          <p className="text-xl font-bold">42</p>
          <p className="mt-1 text-[0.58rem] font-bold uppercase tracking-[0.15em] text-white/38">
            coming
          </p>
        </div>
        <div>
          <p className="text-xl font-bold text-[#f5c963]">6</p>
          <p className="mt-1 text-[0.58rem] font-bold uppercase tracking-[0.15em] text-white/38">
            pending
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-2.5">
        <div className="flex items-center gap-3 rounded-2xl bg-white/7 px-4 py-3">
          <Clock3 className="h-4 w-4 text-[#9eb7ff]" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold">Players arrive at 6:30 PM</p>
            <p className="mt-0.5 text-xs text-white/42">Warm-up begins at 6:45</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl bg-white/7 px-4 py-3">
          <MapPin className="h-4 w-4 text-[#9eb7ff]" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold">{sport.venuePlaceholder}</p>
            <p className="mt-0.5 text-xs text-white/42">Gate B · parking in the east lot</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-[#f5c963]/22 bg-[#f5c963]/10 px-4 py-3">
          <Megaphone className="h-4 w-4 text-[#f5c963]" aria-hidden="true" />
          <p className="text-sm font-semibold">Updated today · start time moved 30 min</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="flex items-center justify-center gap-2 rounded-full bg-white px-4 py-3 text-xs font-bold text-[#10182b]">
          <CalendarDays className="h-4 w-4" aria-hidden="true" />
          Save game
        </div>
        <div className="flex items-center justify-center gap-2 rounded-full border border-white/18 bg-white/8 px-4 py-3 text-xs font-bold">
          <MapPin className="h-4 w-4" aria-hidden="true" />
          Directions
        </div>
      </div>
    </div>
  );
}

export default function SportsLandingPage() {
  const search = useSearchParams();
  const selectedSport = getSportEventPreset(search?.get("sport"));
  const selectedStyle = search?.get("style") || "stadium";
  const primaryHref = `${buildSportEventCustomizeHref(selectedSport.key, selectedStyle)}&auth=signup`;

  return (
    <div className="min-h-screen bg-[#f7f8f5] pb-24 text-[#121b2d] md:pb-0">
      <SignedOutPageChrome
        activeBottomNavLabel="Create"
        brandHref="/"
        topNavVariant="transparent-dark"
      />

      <main>
        <section className="relative isolate flex min-h-[100svh] items-end overflow-hidden">
          <LandingHeroMedia images={landingHeroGalleries.sports} />
          <div className="relative z-[1] mx-auto grid w-full max-w-7xl items-end gap-10 px-5 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-32 sm:px-8 md:pb-16 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,0.54fr)] lg:px-10">
            <div className="max-w-4xl text-white">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/24 bg-black/18 px-4 py-2 text-[0.68rem] font-bold uppercase tracking-[0.2em] text-white/90 backdrop-blur-md">
                <ShieldCheck className="h-3.5 w-3.5 text-[#f5d77f]" aria-hidden="true" />
                The team link that stays current
              </div>
              <h1 className="mt-6 max-w-4xl text-[3rem] font-black leading-[0.96] !text-white drop-shadow-[0_5px_28px_rgba(0,0,0,0.55)] sm:text-6xl lg:text-[5rem]">
                Every game-day detail. One link the whole team can trust.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-white/88 drop-shadow-[0_2px_14px_rgba(0,0,0,0.88)] sm:text-lg sm:leading-8">
                Schedules, venues, attendance, tickets, weather, and live updates—organized for
                players, families, coaches, and fans.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href={primaryHref}
                  className="inline-flex min-h-12 items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-[#111a2c] shadow-[0_22px_54px_rgba(0,0,0,0.26)] transition hover:-translate-y-0.5"
                >
                  Build {selectedSport.routeLabel}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link
                  href="/snap?auth=signup"
                  className="inline-flex min-h-12 items-center rounded-full border border-white/32 bg-white/10 px-6 py-3 text-sm font-bold text-white backdrop-blur-md transition hover:bg-white/18"
                >
                  Upload a schedule
                </Link>
              </div>
              <div className="mt-9 flex max-w-xl items-center divide-x divide-white/22">
                {[
                  ["42", "coming"],
                  ["6", "pending"],
                  ["1", "live update"],
                ].map(([value, label], index) => (
                  <div key={label} className={index === 0 ? "pr-6" : "px-6"}>
                    <p className="text-2xl font-bold leading-none text-white sm:text-3xl">
                      {value}
                    </p>
                    <p className="mt-1.5 text-[0.62rem] font-bold uppercase tracking-[0.17em] text-white/60">
                      {label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="hidden w-full max-w-[25rem] justify-self-end md:block">
              <GameDayPreview sport={selectedSport} compact />
            </div>
          </div>
        </section>

        <section className="overflow-hidden bg-[#f7f8f5] px-5 py-20 sm:px-8 sm:py-28 lg:px-10">
          <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
            <div className="max-w-xl">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#4269a9]">
                More than a schedule
              </p>
              <h2 className="mt-5 text-4xl font-black leading-[1.04] text-[#121b2d] sm:text-5xl lg:text-6xl">
                Keep the focus on the team, not the logistics.
              </h2>
              <p className="mt-6 text-lg leading-8 text-[#647084]">
                When every parent has the same current plan, coaches answer fewer messages and
                families arrive ready. Envitefy turns scattered game details into one useful page.
              </p>
              <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-[#dce2e9] pt-7">
                {[
                  [CalendarDays, "Schedules and calendar"],
                  [MapPin, "Fields and directions"],
                  [Users, "Attendance counts"],
                  [Bell, "Updates and reminders"],
                ].map(([Icon, label]) => {
                  const FeatureIcon = Icon as typeof CalendarDays;
                  return (
                    <div
                      key={String(label)}
                      className="flex items-center gap-3 text-sm font-semibold text-[#27344a]"
                    >
                      <FeatureIcon className="h-4 w-4 text-[#4269a9]" aria-hidden="true" />
                      {String(label)}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="relative min-h-[36rem] sm:min-h-[43rem]">
              <div className="absolute left-0 top-0 h-[74%] w-[70%] overflow-hidden rounded-[2rem]">
                <Image
                  src="/images/landing/sports/sports-editorial-sideline.webp"
                  alt="Coach speaking to a youth team on the sideline"
                  fill
                  sizes="(max-width: 1024px) 70vw, 40vw"
                  className="object-cover"
                />
              </div>
              <div className="absolute bottom-0 right-0 h-[53%] w-[58%] overflow-hidden rounded-[2rem] border-[0.65rem] border-[#f7f8f5]">
                <Image
                  src="/images/landing/sports/sports-editorial-gear.webp"
                  alt="Organized game-day equipment on a team bench"
                  fill
                  sizes="(max-width: 1024px) 58vw, 32vw"
                  className="object-cover"
                />
              </div>
              <div className="absolute right-[2%] top-[8%] max-w-[14rem] rounded-2xl bg-white/95 p-4 shadow-[0_24px_60px_rgba(18,27,45,0.16)] backdrop-blur">
                <p className="text-xl font-black text-[#18243a]">Time changed</p>
                <p className="mt-1 text-xs font-semibold leading-5 text-[#6c7689]">
                  Everyone still opens the same link.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="relative isolate overflow-hidden bg-[#09162b] px-5 py-20 text-white sm:px-8 sm:py-28 lg:px-10">
          <Image
            src="/images/landing/sports/sports-editorial-operations.webp"
            alt=""
            fill
            sizes="100vw"
            className="-z-20 object-cover opacity-40"
          />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#071326] via-[#071326]/93 to-[#071326]/54" />
          <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[minmax(0,0.9fr)_minmax(22rem,0.66fr)]">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#f5d77f]">
                Built for the change
              </p>
              <h2 className="mt-5 text-4xl font-black leading-[1.03] !text-white sm:text-5xl lg:text-6xl">
                Game day moves. Your page moves with it.
              </h2>
              <p className="mt-6 max-w-xl text-lg leading-8 text-white/68">
                Move a field, delay the start, add a gate note, or publish a weather update. The
                same link becomes the live source of truth.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                {["Live updates", "Weather notes", "Targeted reminders", "Calendar changes"].map(
                  (item) => (
                    <span
                      key={item}
                      className="rounded-full border border-white/18 bg-white/8 px-4 py-2 text-sm font-semibold text-white/82"
                    >
                      {item}
                    </span>
                  ),
                )}
              </div>
            </div>
            <GameDayPreview sport={selectedSport} />
          </div>
        </section>

        <section className="bg-[#edf1f5] px-5 py-20 sm:px-8 sm:py-28 lg:px-10">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#4269a9]">
                Any field. Any court.
              </p>
              <h2 className="mt-5 text-4xl font-black leading-tight text-[#121b2d] sm:text-5xl">
                Give every event its own game-day energy.
              </h2>
            </div>
            <div className="mt-14 grid gap-5 lg:grid-cols-3">
              {sportsStories.map((story, index) => (
                <article
                  key={story.label}
                  className={index === 1 ? "lg:translate-y-10" : undefined}
                >
                  <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem]">
                    <Image
                      src={story.src}
                      alt={story.alt}
                      fill
                      sizes="(max-width: 1024px) 100vw, 33vw"
                      className="object-cover transition duration-700 hover:scale-[1.03]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#071326]/92 via-[#071326]/5 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-7 text-white">
                      <p className="text-xs font-bold uppercase tracking-[0.23em] text-[#f5d77f]">
                        0{index + 1} · {story.label}
                      </p>
                      <h3 className="mt-3 text-3xl font-black leading-tight !text-white">
                        {story.title}
                      </h3>
                      <p className="mt-3 max-w-sm text-sm leading-6 text-white/82">{story.body}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#f7f8f5] px-5 py-20 sm:px-8 sm:py-28 lg:px-10">
          <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,0.86fr)]">
            <div className="relative min-h-[39rem] overflow-hidden rounded-[2.25rem]">
              <Image
                src="/images/landing/sports/sports-editorial-arrival.webp"
                alt="Coach welcoming families and athletes to a tournament"
                fill
                sizes="(max-width: 1024px) 100vw, 52vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#071326]/88 via-transparent to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-7 text-white sm:p-9">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#f5d77f]">
                  Pick the sport. Make it yours.
                </p>
                <p className="mt-3 max-w-lg text-3xl font-black leading-tight !text-white sm:text-4xl">
                  Start close to finished, then add the details only your team needs.
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#4269a9]">
                Build your page
              </p>
              <h2 className="mt-5 text-4xl font-black leading-tight text-[#121b2d] sm:text-5xl">
                Choose a sport and a look.
              </h2>
              <p className="mt-5 leading-7 text-[#667286]">
                Envitefy starts with relevant labels, details, and visual directions for the event
                you are organizing.
              </p>

              <div className="mt-7">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#718099]">
                  Sport
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {SPORT_EVENT_PRESETS.map((sport) => (
                    <Link
                      key={sport.key}
                      href={`/sports?sport=${sport.key}&style=${selectedStyle}`}
                      className={
                        sport.key === selectedSport.key
                          ? "rounded-full bg-[#14233d] px-4 py-2.5 text-sm font-bold text-white"
                          : "rounded-full border border-[#d7dee6] bg-white px-4 py-2.5 text-sm font-semibold text-[#455268] transition hover:border-[#7893bd]"
                      }
                    >
                      {sport.shortLabel}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="mt-7">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#718099]">Look</p>
                <div className="mt-3 grid gap-2">
                  {styleOptions.map((style) => (
                    <Link
                      key={style.id}
                      href={`/sports?sport=${selectedSport.key}&style=${style.id}`}
                      className={
                        style.id === selectedStyle
                          ? "flex items-center gap-4 rounded-2xl border border-[#14233d] bg-[#14233d] px-4 py-3.5 text-white"
                          : "flex items-center gap-4 rounded-2xl border border-[#dce2e9] bg-white px-4 py-3.5 text-[#354157] transition hover:border-[#8ba0bf]"
                      }
                    >
                      <span
                        className={
                          style.id === selectedStyle
                            ? "grid h-7 w-7 place-items-center rounded-full bg-white text-[#14233d]"
                            : "grid h-7 w-7 place-items-center rounded-full bg-[#edf1f5] text-transparent"
                        }
                      >
                        <Check className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <span>
                        <span className="block text-sm font-bold">{style.label}</span>
                        <span
                          className={
                            style.id === selectedStyle
                              ? "text-xs text-white/58"
                              : "text-xs text-[#778297]"
                          }
                        >
                          {style.description}
                        </span>
                      </span>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href={primaryHref}
                  className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#14233d] px-6 py-3 text-sm font-bold text-white shadow-[0_18px_50px_rgba(20,35,61,0.22)] transition hover:-translate-y-0.5"
                >
                  Build {selectedSport.routeLabel}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link
                  href="/event/gymnastics?auth=signup"
                  className="inline-flex min-h-12 items-center rounded-full border border-[#cfd7e1] bg-white px-6 py-3 text-sm font-bold text-[#334057]"
                >
                  Gymnastics workflow
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#edf1f5] px-5 py-20 sm:px-8 sm:py-24 lg:px-10">
          <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[minmax(0,0.65fr)_minmax(0,1fr)]">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#4269a9]">
                Before the whistle
              </p>
              <h2 className="mt-5 text-4xl font-black leading-tight text-[#121b2d] sm:text-5xl">
                Sports page questions, answered.
              </h2>
              <div className="mt-7 flex flex-wrap gap-2">
                {[
                  [CloudSun, "Weather"],
                  [Ticket, "Tickets"],
                  [QrCode, "Easy sharing"],
                ].map(([Icon, label]) => {
                  const DetailIcon = Icon as typeof CloudSun;
                  return (
                    <span
                      key={String(label)}
                      className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-2 text-xs font-bold text-[#455268]"
                    >
                      <DetailIcon className="h-3.5 w-3.5 text-[#4269a9]" aria-hidden="true" />
                      {String(label)}
                    </span>
                  );
                })}
              </div>
            </div>
            <div className="divide-y divide-[#cbd4df] border-y border-[#cbd4df]">
              {sportsFaqs.map((faq) => (
                <details key={faq.question} className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-lg font-bold text-[#27344a]">
                    {faq.question}
                    <ChevronDown
                      className="h-5 w-5 shrink-0 text-[#5575a9] transition group-open:rotate-180"
                      aria-hidden="true"
                    />
                  </summary>
                  <p className="max-w-2xl pb-1 pt-4 leading-7 text-[#697589]">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section
          className="relative isolate min-h-[34rem] overflow-hidden bg-cover bg-center px-5 py-24 sm:px-8 lg:px-10"
          style={{
            backgroundImage: "url('/images/landing/sports/sports-editorial-finale.webp')",
          }}
        >
          <div className="absolute inset-0 -z-10 bg-[#071326]/66" />
          <div className="mx-auto flex min-h-[22rem] max-w-4xl flex-col items-center justify-center text-center text-white">
            <p className="text-xs font-bold uppercase tracking-[0.26em] text-[#f5d77f]">
              Ready for game day
            </p>
            <h2 className="mt-5 text-4xl font-black leading-tight !text-white sm:text-6xl">
              Make the plan feel like part of the team.
            </h2>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/76">
              Publish one page for the event, then keep players and families current from first
              reminder to final whistle.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href={primaryHref}
                className="inline-flex min-h-12 items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-[#111a2c] transition hover:-translate-y-0.5"
              >
                Build {selectedSport.routeLabel}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href="/snap?auth=signup"
                className="inline-flex min-h-12 items-center rounded-full border border-white/35 bg-white/10 px-6 py-3 text-sm font-bold text-white backdrop-blur"
              >
                Upload an existing schedule
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
