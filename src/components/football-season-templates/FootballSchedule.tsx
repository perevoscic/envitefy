"use client";

import { CalendarDays, CalendarPlus, CloudSun, MapPin, Navigation, Ticket } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import CalendarAction from "@/components/CalendarAction";
import {
  type FootballGame,
  type FootballHome,
  footballDirections,
  footballGameContextKey,
  footballGameLocation,
  footballLink,
  footballMatchup,
  footballSchoolMatchup,
  footballSeniorNightNotes,
  hasFootballGame,
  isFootballOffWeek,
} from "@/lib/football-games";
import {
  formatFootballGameDate,
  groupFootballGames,
  normalizeFootballGameDate,
} from "@/lib/football-schedule-dates";
import { footballTeamLabel } from "@/lib/football-team-name";
import { buildCalendarLinks } from "@/utils/calendar-links";
import FootballText from "./FootballPageText";
import FootballSectionTabs, { useFootballSectionTabs } from "./FootballSectionTabs";

function ScheduleDate({ value, season }: { value?: string; season?: string }) {
  const gameDate = normalizeFootballGameDate(value, season);
  if (!gameDate)
    return <span>{value?.trim() || <FootballText fallback="Date to be confirmed" />}</span>;
  return <time dateTime={gameDate}>{formatFootballGameDate(value, season)}</time>;
}

export default function FootballSchedule({
  games,
  cardClassName = "rounded-2xl border border-current/20 p-5",
  navigationClassName,
  activeTabClassName = "rounded-full border border-current/40 bg-current/10 px-4 py-2 text-sm font-bold",
  idleTabClassName = "rounded-full border border-transparent px-4 py-2 text-sm font-semibold opacity-75 hover:bg-current/10",
  upcomingOnly = false,
  gameHref,
  ...home
}: FootballHome & {
  games: FootballGame[];
  cardClassName?: string;
  upcomingOnly?: boolean;
  gameHref?: string;
  navigationClassName?: string;
  activeTabClassName?: string;
  idleTabClassName?: string;
}) {
  const visibleGames = games.filter(hasFootballGame);
  const offWeeks = games
    .filter(isFootballOffWeek)
    .sort((a, b) =>
      normalizeFootballGameDate(a.date, home.season).localeCompare(
        normalizeFootballGameDate(b.date, home.season),
      ),
    );
  const [now, setNow] = useState(() => Date.now());
  const groups = groupFootballGames(visibleGames, home, now);
  const views = [
    {
      id: "upcoming-games",
      label: "Upcoming",
      count: groups.upcoming.length,
      games: groups.upcoming,
      empty: "No upcoming games scheduled.",
    },
    {
      id: "past-games",
      label: "Past games",
      count: groups.past.length,
      games: groups.past,
      empty: "No past games yet.",
    },
    ...(groups.undated.length
      ? [
          {
            id: "undated-games",
            label: "Date to confirm",
            count: groups.undated.length,
            games: groups.undated,
            empty: "",
          },
        ]
      : []),
  ];
  const tabs = useFootballSectionTabs(views, false);
  useEffect(() => {
    const refresh = () => setNow(Date.now());
    const interval = window.setInterval(refresh, 60_000);
    window.addEventListener("focus", refresh);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
    };
  }, []);
  if (!visibleGames.length && !offWeeks.length) return null;
  const buttonClass =
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-current/30 px-4 py-2 text-sm font-semibold hover:bg-current/10 focus-visible:outline-2 focus-visible:outline-offset-2";
  const planningButtonClass =
    "inline-flex min-h-11 min-w-0 w-full items-center justify-center gap-1.5 rounded-full border border-current/30 px-2 py-2 text-xs font-semibold hover:bg-current/10 focus-visible:outline-2 focus-visible:outline-offset-2 @sm/game-card:w-auto @sm/game-card:gap-2 @sm/game-card:px-4 @sm/game-card:text-sm";
  return (
    <div className="@container">
      {!upcomingOnly ? (
        <FootballSectionTabs
          tabs={tabs}
          ariaLabel="Game schedule periods"
          shellClassName={navigationClassName}
          activeClassName={activeTabClassName}
          idleClassName={idleTabClassName}
        />
      ) : null}
      {(upcomingOnly ? views.slice(0, 1) : views).map((view) => (
        <div
          key={view.id}
          {...(upcomingOnly ? {} : tabs.panelProps(view.id))}
          className={upcomingOnly ? "" : "mt-4"}
        >
          {!view.games.length ? (
            <p className="py-5 text-sm opacity-85">
              <FootballText fallback={view.empty} />
            </p>
          ) : null}
          <div
            className={`grid grid-cols-1 gap-4 ${view.games.length > 1 ? "@3xl:grid-cols-2" : ""}`}
          >
            {view.games.map((game) => {
              const score = game.score?.trim();
              const matchup = footballMatchup(game, home.teamName, home.teamMascot);
              const gameDate = normalizeFootballGameDate(game.date, home.season);
              const dateContent = <ScheduleDate value={game.date} season={home.season} />;
              if (view.id === "past-games") {
                return (
                  <article key={game.id} className={`min-w-0 ${cardClassName}`}>
                    <h3 className="break-words text-xl font-bold">{matchup}</h3>
                    <p className="mt-2 flex flex-wrap items-center gap-2 text-sm font-semibold">
                      <CalendarDays size={16} aria-hidden="true" />
                      {dateContent}
                    </p>
                    <p className="mt-3 text-lg font-bold tabular-nums">
                      {score ? (
                        <span
                          data-result={game.result || undefined}
                          className={
                            game.result === "W"
                              ? "inline-block rounded-md bg-emerald-100 px-2 py-0.5 text-emerald-800"
                              : game.result === "L"
                                ? "inline-block rounded-md bg-red-100 px-2 py-0.5 text-red-800"
                                : undefined
                          }
                        >
                          <FootballText
                            fallback={
                              game.result ? { W: "Win", L: "Loss", T: "Tie" }[game.result] : "Score"
                            }
                          />{" "}
                          · {score}
                        </span>
                      ) : (
                        <FootballText fallback="Score unavailable" />
                      )}
                    </p>
                  </article>
                );
              }
              const schools = footballSchoolMatchup(game, home.teamName);
              const {
                venue,
                address,
                venueSource: knownVenueSource,
              } = footballGameLocation(game, home);
              const directions = game.homeAway === "away" ? footballDirections(game, home) : null;
              const context =
                game.context?.key === footballGameContextKey(game, home) ? game.context : null;
              const weather =
                context?.weather &&
                Date.now() - Date.parse(context.weather.checkedAt) < 3 * 60 * 60 * 1000
                  ? context.weather
                  : null;
              const tickets = footballLink(game.ticketsLink);
              const venueSource = footballLink(game.venueLookup?.venueSource || knownVenueSource);
              const ticketsSource = footballLink(game.venueLookup?.ticketsSource);
              const seniorNightNotes = footballSeniorNightNotes(game);
              const start = gameDate ? gameDate + (game.time ? `T${game.time}` : "") : null;
              const links = start
                ? buildCalendarLinks({
                    title: schools,
                    startIso: start,
                    endIso: start,
                    allDay: !game.time,
                    timezone: home.timezone,
                    location: [venue, address].filter(Boolean).join(", "),
                    description: game.notes || "",
                    reminders: null,
                    recurrence: null,
                  })
                : null;
              const homeTeam =
                game.homeAway === "away"
                  ? footballTeamLabel(game.opponent, game.opponentMascot, home.teamName)
                  : game.homeAway === "home"
                    ? footballTeamLabel(home.teamName, home.teamMascot)
                    : "";
              const time = /^\d{1,2}:\d{2}$/.test(game.time || "")
                ? new Date(`2000-01-01T${game.time}`).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  })
                : game.time;
              return (
                <article key={game.id} className={`@container/game-card min-w-0 ${cardClassName}`}>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    {game.homeAway ? (
                      <span className="rounded-full border border-current/25 px-3 py-1 font-semibold">
                        {game.homeAway === "neutral" ? (
                          <FootballText fallback="Neutral site" />
                        ) : homeTeam ? (
                          <>
                            <FootballText fallback="Home:" /> {homeTeam}
                          </>
                        ) : game.homeAway === "away" ? (
                          <FootballText fallback="Away game" />
                        ) : (
                          <FootballText fallback="Home game" />
                        )}
                      </span>
                    ) : null}
                    {game.result || score ? (
                      <span className="font-bold">
                        <FootballText
                          fallback={
                            game.result ? { W: "Win", L: "Loss", T: "Tie" }[game.result] : "Score"
                          }
                        />
                        {score ? ` · ${score}` : ""}
                      </span>
                    ) : null}
                  </div>
                  <h3 className="mt-3 break-words text-xl font-bold">{gameHref ? <Link href={gameHref} className="underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2">{matchup}</Link> : matchup}</h3>
                  <p className="mt-2 flex flex-wrap items-center gap-2 text-sm font-semibold">
                    <CalendarDays size={16} aria-hidden="true" />
                    {dateContent}
                    {time ? <span>· {time}</span> : null}
                  </p>
                  {venue ? (
                    <div className="mt-3 flex items-start gap-2">
                      <MapPin className="mt-0.5 shrink-0" size={17} aria-hidden="true" />
                      <p className="font-semibold">{venue}</p>
                    </div>
                  ) : null}
                  {weather ? (
                    <p className="mt-3 flex items-center gap-2 text-sm">
                      <CloudSun size={17} aria-hidden="true" />
                      {weather.summary} · {Math.round(weather.tempF)}°F at game time
                    </p>
                  ) : null}
                  {game.conference ? (
                    <p className="mt-3 text-sm font-semibold">
                      <FootballText fallback="Conference game" />
                    </p>
                  ) : null}
                  {game.broadcast ? (
                    <p className="mt-2 text-sm">
                      <FootballText fallback="Broadcast:" /> {game.broadcast}
                    </p>
                  ) : null}
                  {game.notes && !seniorNightNotes ? (
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">{game.notes}</p>
                  ) : null}
                  {directions || links || tickets ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {tickets ? (
                        <FootballText
                          fallback="Buy tickets"
                          renderText={(caption) => (
                            <a
                              href={tickets}
                              target="_blank"
                              rel="noreferrer noopener"
                              className={buttonClass}
                              aria-label={`Buy tickets for ${matchup}`}
                            >
                              <Ticket size={16} aria-hidden="true" />
                              {caption || "Buy tickets"}
                            </a>
                          )}
                        />
                      ) : null}
                      {directions || links ? (
                        <div
                          className={`grid w-full min-w-0 gap-2 ${directions && links ? "grid-cols-2" : "grid-cols-1"} @sm/game-card:flex @sm/game-card:w-auto`}
                        >
                          {directions ? (
                            <FootballText
                              fallback="Get directions"
                              renderText={(caption) => (
                                <a
                                  href={directions}
                                  target="_blank"
                                  rel="noreferrer noopener"
                                  className={planningButtonClass}
                                  aria-label={`Get directions to ${venue || address} for ${matchup}`}
                                  title={caption || "Get directions"}
                                >
                                  <Navigation className="shrink-0" size={16} aria-hidden="true" />
                                  <span className="min-w-0 break-words @sm/game-card:hidden">
                                    {!caption || caption === "Get directions"
                                      ? "Directions"
                                      : caption}
                                  </span>
                                  <span className="hidden @sm/game-card:inline">
                                    {caption || "Get directions"}
                                  </span>
                                </a>
                              )}
                            />
                          ) : null}
                          {links ? (
                            <CalendarAction links={links} className={planningButtonClass}>
                              {(label) => (
                                <>
                                  <CalendarPlus className="shrink-0" size={16} aria-hidden="true" />
                                  <span className="min-w-0 break-words @sm/game-card:hidden">
                                    {label === "Add to calendar"
                                      ? "Calendar"
                                      : label.replace(/^Add to /, "")}
                                  </span>
                                  <span className="hidden @sm/game-card:inline">{label}</span>
                                </>
                              )}
                            </CalendarAction>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                  {venueSource || ticketsSource || seniorNightNotes ? (
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                      {venueSource ? (
                        <FootballText
                          fallback="Stadium details"
                          renderText={(caption) => (
                            <a
                              className="inline-flex min-h-9 items-center underline underline-offset-4"
                              href={venueSource}
                              target="_blank"
                              rel="noreferrer noopener"
                            >
                              {caption || "Stadium details"}
                            </a>
                          )}
                        />
                      ) : null}
                      {ticketsSource ? (
                        <FootballText
                          fallback="Official ticket information"
                          renderText={(caption) => (
                            <a
                              className="inline-flex min-h-9 items-center underline underline-offset-4"
                              href={ticketsSource}
                              target="_blank"
                              rel="noreferrer noopener"
                            >
                              {caption || "Official ticket information"}
                            </a>
                          )}
                        />
                      ) : null}
                      {seniorNightNotes ? (
                        <span className="inline-flex min-h-9 items-center whitespace-pre-wrap font-semibold">
                          {seniorNightNotes}
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        </div>
      ))}
      {offWeeks.length ? (
        <aside
          aria-label="Open weeks"
          className="mt-4 rounded-xl border border-current/15 px-4 py-3 text-sm"
        >
          <ul className="space-y-2">
            {offWeeks.map((week) => (
              <li key={week.id} className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="font-semibold">
                  <FootballText fallback="Open week" />
                </span>
                <span>
                  · <ScheduleDate value={week.date} season={home.season} />
                </span>
                <span className="opacity-80">
                  · <FootballText fallback="No game scheduled" />
                </span>
              </li>
            ))}
          </ul>
        </aside>
      ) : null}
    </div>
  );
}
