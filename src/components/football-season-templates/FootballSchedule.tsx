"use client";

import { CalendarDays, Car, CloudSun, MapPin, Navigation, Ticket } from "lucide-react";
import { useEffect, useState } from "react";
import FootballSectionTabs, { useFootballSectionTabs } from "./FootballSectionTabs";
import { groupFootballGames, normalizeFootballGameDate } from "@/lib/football-schedule-dates";
import CalendarAction from "@/components/CalendarAction";
import { buildCalendarLinks } from "@/utils/calendar-links";
import {
  footballDirections,
  FOOTBALL_ROUTE_VERSION,
  footballGameContextKey,
  footballGameLocation,
  footballLink,
  footballMatchup,
  footballSchoolMatchup,
  hasFootballGame,
  type FootballGame,
  type FootballHome,
} from "@/lib/football-games";
import { footballTeamLabel } from "@/lib/football-team-name";
import FootballText from "./FootballPageText";

export default function FootballSchedule({
  games,
  cardClassName = "rounded-2xl border border-current/20 p-5",
  ...home
}: FootballHome & { games: FootballGame[]; cardClassName?: string }) {
  const visibleGames = games.filter(hasFootballGame);
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
  if (!visibleGames.length) return null;
  const buttonClass =
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-current/30 px-4 py-2 text-sm font-semibold hover:bg-current/10 focus-visible:outline-2 focus-visible:outline-offset-2";
  return (
    <div className="@container">
      <FootballSectionTabs
        tabs={tabs}
        ariaLabel="Game schedule periods"
        activeClassName="rounded-full border border-current/40 bg-current/10 px-4 py-2 text-sm font-bold"
        idleClassName="rounded-full border border-transparent px-4 py-2 text-sm font-semibold opacity-75 hover:bg-current/10"
      />
      {views.map((view) => (
        <div key={view.id} {...tabs.panelProps(view.id)} className="mt-4">
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
              const date = gameDate ? new Date(`${gameDate}T12:00:00Z`) : null;
              const dateContent = date ? (
                <time dateTime={gameDate}>
                  {date.toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    timeZone: "UTC",
                  })}
                </time>
              ) : (
                <span>
                  {game.date?.trim() || <FootballText fallback="Date to be confirmed" />}
                </span>
              );
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
                        <>
                          <FootballText fallback="Score" /> · {score}
                        </>
                      ) : (
                        <FootballText fallback="Score unavailable" />
                      )}
                    </p>
                  </article>
                );
              }
              const schools = footballSchoolMatchup(game, home.teamName);
              const { venue, address } = footballGameLocation(game, home);
              const directions = game.homeAway === "away" ? footballDirections(game, home) : null;
              const context =
                game.context?.key === footballGameContextKey(game, home) ? game.context : null;
              const weather =
                context?.weather &&
                Date.now() - Date.parse(context.weather.checkedAt) < 3 * 60 * 60 * 1000
                  ? context.weather
                  : null;
              const tickets = footballLink(game.ticketsLink);
              const venueSource = footballLink(game.venueLookup?.venueSource);
              const ticketsSource = footballLink(game.venueLookup?.ticketsSource);
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
                  ? footballTeamLabel(game.opponent, game.opponentMascot)
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
                <article key={game.id} className={`min-w-0 ${cardClassName}`}>
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
                  <h3 className="mt-3 break-words text-xl font-bold">{matchup}</h3>
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
                  {game.homeAway === "away" &&
                  context?.miles != null &&
                  context.routeVersion === FOOTBALL_ROUTE_VERSION ? (
                    <div className="mt-4 flex items-start gap-3 rounded-xl border border-current/20 p-3">
                      <Car className="mt-0.5 shrink-0" size={18} aria-hidden="true" />
                      <div className="min-w-0 text-sm">
                        <p className="font-bold">
                          {context.miles.toLocaleString("en-US", { maximumFractionDigits: 1 })}{" "}
                          miles
                          {context.minutes != null
                            ? ` · about ${Math.floor(context.minutes / 60) ? `${Math.floor(context.minutes / 60)} hr ` : ""}${context.minutes % 60} min drive`
                            : ""}
                        </p>
                        {context.routeSummary ? (
                          <p className="mt-1 font-semibold">Via {context.routeSummary}</p>
                        ) : null}
                        <p className="mt-1 leading-relaxed opacity-85">
                          From {home.homeVenue || "home stadium"} to {venue || "away stadium"} · one
                          way
                        </p>
                      </div>
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
                  {game.notes ? (
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
                      {directions ? (
                        <FootballText
                          fallback="Get directions"
                          renderText={(caption) => (
                            <a
                              href={directions}
                              target="_blank"
                              rel="noreferrer noopener"
                              className={buttonClass}
                              aria-label={`Get directions to ${venue || address} for ${matchup}`}
                            >
                              <Navigation size={16} aria-hidden="true" />
                              {caption || "Get directions"}
                            </a>
                          )}
                        />
                      ) : null}
                      {links ? <CalendarAction links={links} className={buttonClass} /> : null}
                    </div>
                  ) : null}
                  {tickets && game.venueLookup?.schoolTickets ? (
                    <p className="mt-2 text-xs leading-relaxed opacity-85">
                      <FootballText fallback="Opens the host school's ticket page. Choose your game to see availability." />
                    </p>
                  ) : null}
                  {venueSource || ticketsSource ? (
                    <div className="mt-2 flex flex-wrap gap-x-4 text-xs">
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
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
