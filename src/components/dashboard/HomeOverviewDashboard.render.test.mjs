import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import * as dashboardData from "../../lib/dashboard-data.ts";
import * as dashboardOverview from "../../lib/dashboard-overview.ts";
import * as thumbnailFocus from "../../lib/thumbnail-focus.ts";
import * as dashboardGames from "../../lib/dashboard-games.ts";
import * as footballGames from "../../lib/football-games.ts";
import * as footballDates from "../../lib/football-schedule-dates.ts";
import * as footballTeams from "../../lib/football-team-name.ts";
import * as calendarLinks from "../../utils/calendar-links.ts";

const require = createRequire(import.meta.url);
function loadComponent(filename, selectedFilter = "all") {
  const { outputText } = ts.transpileModule(readFileSync(new URL(filename, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  });
  const componentModule = { exports: {} };
  new Function("require", "module", "exports", outputText)((name) => {
    if (name === "react") return { ...React, useState: (initial) => React.useState(initial === "all" ? selectedFilter : initial) };
    if (name === "lucide-react") return new Proxy({}, { get: () => () => null });
    if (name === "@/lib/dashboard-data") return dashboardData;
    if (name === "@/lib/dashboard-overview") return dashboardOverview;
    if (name === "@/lib/thumbnail-focus") return thumbnailFocus;
    if (name === "@/lib/dashboard-games") return dashboardGames;
    if (name === "@/lib/football-games") return footballGames;
    if (name === "@/lib/football-schedule-dates") return footballDates;
    if (name === "@/lib/football-team-name") return footballTeams;
    if (name === "@/utils/calendar-links") return calendarLinks;
    if (name === "./DashboardGames") return loadComponent("./DashboardGames.tsx");
    if (name === "@/components/football-season-templates/FootballSchedule") return loadComponent("../football-season-templates/FootballSchedule.tsx");
    if (name === "./FootballSectionTabs") return loadComponent("../football-season-templates/FootballSectionTabs.tsx");
    if (name === "./FootballPageText") return { default: ({ fallback, renderText }) => renderText ? renderText(fallback) : fallback, useFootballPageText: () => ({}) };
    if (name === "@/components/CalendarAction") return { default: ({ links }) => React.createElement("a", { href: links.google }, "Add to calendar") };
    if (name === "./DashboardOverviewSections") return loadComponent("./DashboardOverviewSections.tsx");
    if (name === "./DashboardReviewDialog") return loadComponent("./DashboardReviewDialog.tsx");
    if (name === "@/components/ui/flip-clock") return { FlipClock: () => null };
    if (name === "@/components/icons/LiveCardIcon") return loadComponent("../icons/LiveCardIcon.tsx");
    if (name.startsWith("@/components/")) return { default: () => null };
    return require(name);
  }, componentModule, componentModule.exports);
  return componentModule.exports;
}
const HomeOverviewDashboard = loadComponent("./HomeOverviewDashboard.tsx").default;
const { DashboardReviewDetails } = loadComponent("./DashboardReviewDialog.tsx");
const emptyData = {
  nextEvent: null,
  upcoming: [],
  snapshot: { upcomingCount30Days: 0, upcomingCount7Days: 0, nextEventInDays: null },
  metricsEligibility: { weatherEligible: false, travelWindowEligible: false },
};
function render(props = {}, filter = "all") {
  const Component = filter === "all" ? HomeOverviewDashboard : loadComponent("./HomeOverviewDashboard.tsx", filter).default;
  return renderToStaticMarkup(React.createElement(Component, {
    viewerName: "Ruslan", data: null, metrics: null, enrichMeta: null,
    metricsLoading: false, loading: false, error: null,
    onRetry: () => {}, onForceTravel: () => {}, ...props,
  }));
}

test("Home shows loading before the first request starts and while it is pending", () => {
  for (const loading of [false, true]) {
    const html = render({ loading });
    assert.match(html, /Loading your events/);
    assert.doesNotMatch(html, /Nothing is scheduled yet/);
  }
});

test("Home offers retry after a failed load without claiming the account is empty", () => {
  const html = render({ error: "Your events are taking longer to load. Please try again." });
  assert.match(html, /Your events couldn’t load/);
  assert.match(html, /Try again/);
  assert.match(html, /role="alert"/);
  assert.doesNotMatch(html, /Nothing is scheduled yet/);
});

test("Home shows the empty state only after a successful empty response", () => {
  assert.match(render({ data: emptyData }), /Nothing is scheduled yet/);
});

test("Home keeps loaded events visible during a refresh failure and lists the rest after the spotlight", () => {
  const event = (id, startAt) => ({ id, title: id, startAt, ownership: "owned" });
  const nearest = event("Nearest wedding", "2030-09-25T12:00:00Z");
  const later = event("Later birthday", "2031-04-19T18:00:00Z");
  const html = render({
    data: { ...emptyData, nextEvent: nearest, upcoming: [nearest, later] },
    error: "Refresh failed", loading: true,
  });
  assert.ok(html.indexOf("Nearest wedding") < html.indexOf("Filter upcoming events"));
  assert.ok(html.indexOf("Filter upcoming events") < html.indexOf("Later birthday"));
  assert.doesNotMatch(html, /upcoming-events-heading|>Upcoming Events</);
  assert.doesNotMatch(html, /Nothing is scheduled yet|Your events couldn’t load/);
});

test("event filter bubbles count the complete list by ownership, excluding the spotlight", () => {
  const event = (id, ownership) => ({ id, title: id, ownership, startAt: "2030-09-25T12:00:00Z" });
  const spotlight = event("spotlight", "invited");
  const remaining = Array.from({ length: 9 }, (_, index) => event(`event-${index}`, index < 4 ? "invited" : index < 8 ? "owned" : undefined));
  const html = render({ data: { ...emptyData, nextEvent: spotlight, upcoming: [spotlight, ...remaining] } });
  assert.match(html, /aria-pressed="true" aria-label="All, 9 events"/);
  assert.match(html, /aria-label="My events, 5 events"/);
  assert.match(html, /aria-label="Invited events, 4 events"/);
  assert.match(html, /Show all 9 events/);
  assert.doesNotMatch(html, /upcoming-events-heading|>Upcoming Events</);
  const ownOnly = render({ data: { ...emptyData, nextEvent: spotlight, upcoming: [spotlight, event("own", "owned")] } });
  assert.match(ownOnly, /aria-label="All, 1 event"/);
  assert.match(ownOnly, /aria-label="My events, 1 event"/);
  assert.match(ownOnly, /aria-label="Invited events, 0 events"/);
});

test("Games counts individual fixtures even when a saved season has no dated event card", () => {
  const games = dashboardGames.dashboardGamesFromSources([{
    id: "season", public_slug: "seahawks-season", title: "Seahawks football season",
    home: { season: "2099", teamName: "South Walton", timezone: "America/Chicago" },
    games: Array.from({ length: 5 }, (_, index) => ({
      id: `g-${index}`, opponent: `Visitors ${index}`, date: `2099-10-${10 + index}`,
      homeAway: "away", venue: "Away stadium", address: "123 Away Road", time: "19:00",
      ticketsLink: "https://tickets.example/game",
    })),
  }]);
  const data = { ...emptyData, games };
  const initial = render({ data });
  assert.match(initial, /Your next games are ready/);
  assert.doesNotMatch(initial, /Nothing is scheduled yet/);
  assert.match(initial, /aria-label="All, 0 events"/);
  assert.match(initial, /aria-label="Games, 5 games"/);
  const html = render({ data }, "games");
  assert.match(html, /aria-pressed="true" aria-label="Games, 5 games"/);
  assert.match(html, /Visitors 0/);
  assert.match(html, /Visitors 3/);
  assert.doesNotMatch(html, /Visitors 4|Game schedule periods|No other upcoming/);
  assert.match(html, /Show all 5 games/);
  assert.match(html, /href="\/event\/seahawks-season\?tab=event#games"/);
  assert.doesNotMatch(html, /Seahawks football season/);
  assert.match(html, /Add to calendar/);
  assert.match(html, /https:\/\/tickets.example\/game/);
  assert.match(html, /Get directions to Away stadium/);
});

test("Games renders duplicate cached schedule entries once and counts unique fixtures", () => {
  const games = dashboardGames.dashboardGamesFromSources([
    { id: "season-one", title: "First saved schedule", public_slug: null, home: { teamName: "South Walton", season: "2099" }, games: [{ id: "one", opponent: "Pine Forest", date: "2099-09-25", homeAway: "home" }] },
    { id: "season-two", title: "Second saved schedule", public_slug: null, home: { teamName: "South Walton High School", season: "2099" }, games: [{ id: "two", opponent: "Pine Forest High School", date: "2099-09-25", homeAway: "home" }] },
  ]);
  const html = render({ data: { ...emptyData, games } }, "games");
  assert.match(html, /aria-label="Games, 1 game"/);
  assert.equal((html.match(/<h3/g) || []).length, 1);
  assert.doesNotMatch(html, /First saved schedule|Second saved schedule/);
});

test("Games distinguishes an empty schedule from a failed load", () => {
  const empty = render({ data: { ...emptyData, games: [] } }, "games");
  assert.match(empty, /No upcoming games in your saved schedules/);
  const failed = render({ data: { ...emptyData, games: [], gamesUnavailable: true } }, "games");
  assert.match(failed, /aria-label="Games, unavailable"/);
  assert.match(failed, /Your games couldn’t load/);
  assert.match(failed, /Try again/);
  assert.doesNotMatch(failed, /No upcoming games/);
});

test("Home keeps drafts and sign-up needs while omitting Guest responses", () => {
  const nextEvent = { id: "picnic", title: "School picnic", startAt: "2030-09-25T12:00:00Z", endAt: null, ownership: "owned", locationText: "Park", mapsUrl: "https://maps.example/park" };
  const overview = {
    attention: [{ id: "venue", eventId: "school", eventTitle: "School night", kind: "venue", label: "Add event location", href: "/edit/school" }],
    conflicts: [], editLinks: { picnic: "/edit/picnic" }, unavailable: [],
    drafts: { count: 1, items: [{ id: "draft", title: "Garden birthday", startAt: null, updatedAt: null, href: "/chat?thread=saved" }] },
    guests: [{ eventId: "picnic", title: "School picnic", going: 4, maybe: 1, declined: 2, awaitingShared: 3 }],
    signups: [{ eventId: "picnic", title: "School picnic", filled: 2, capacity: 3, remaining: 1, unlimitedSlots: 0, sections: [{ id: "snacks", title: "Snacks", remaining: 1, unlimitedSlots: 0 }] }],
  };
  const html = render({ data: { ...emptyData, nextEvent, upcoming: [nextEvent], overview } });
  assert.match(html, /Continue creating/);
  assert.match(html, /Date to be decided/);
  const review = renderToStaticMarkup(React.createElement(DashboardReviewDetails, { kind: "attention", overview }));
  assert.match(review, /href="\/edit\/school"/);
  assert.doesNotMatch(html, /id="dashboard-attention"|href="#dashboard-attention"/);
  assert.match(html, /href="\/chat\?thread=saved"/);
  assert.doesNotMatch(html, /Guest responses|dashboard-guests|3 shared invitations awaiting a reply|7 Replies/);
  assert.match(html, /1 open/);
  assert.match(html, /Forecast available closer to the event/);
  assert.doesNotMatch(html, /72h Window|Open Route/);
});

test("the second summary tile counts conflicts separately from other review actions", () => {
  const overview = {
    attention: [{ id: "rsvp", eventId: "birthday", eventTitle: "Birthday party", kind: "rsvp", label: "Review RSVP details", href: "/event/birthday" }],
    conflicts: [{ id: "overlap", first: { id: "first", title: "School picnic", startAt: "2030-09-25T12:00:00Z" }, second: { id: "second", title: "Wedding", startAt: "2030-09-25T12:30:00Z" } }],
    guests: [], signups: [], drafts: { count: 0, items: [] }, editLinks: {}, unavailable: [],
  };
  const html = render({ data: { ...emptyData, overview } });
  assert.ok(html.indexOf("Next 7 days") < html.indexOf("Schedule conflicts"));
  assert.ok(html.indexOf("Schedule conflicts") < html.indexOf("Needs attention"));
  assert.match(html, /1 conflict/);
  assert.match(html, /1 to review/);
  assert.doesNotMatch(html, /2 to review|id="dashboard-attention"/);
  const conflicts = renderToStaticMarkup(React.createElement(DashboardReviewDetails, { kind: "conflicts", overview }));
  assert.match(conflicts, /href="\/event\/first"/);
  assert.match(conflicts, /href="\/event\/second"/);
  assert.match(conflicts, /School picnic|Wedding/);
  assert.doesNotMatch(conflicts, /Review RSVP details/);
  const attention = renderToStaticMarkup(React.createElement(DashboardReviewDetails, { kind: "attention", overview }));
  assert.match(attention, /Review RSVP details/);
  assert.doesNotMatch(attention, /School picnic|Wedding/);
  const unavailable = renderToStaticMarkup(React.createElement(DashboardReviewDetails, { kind: "attention", overview: { ...overview, attention: [], unavailable: ["event details"] } }));
  assert.match(unavailable, /Some event details couldn’t load/);
  assert.doesNotMatch(unavailable, /all caught up/);
});

test("travel controls show total mileage and drive time without departure or update notes", () => {
  const nextEvent = { id: "event", title: "Event", startAt: "2030-09-25T12:00:00Z", endAt: null, ownership: "owned", locationText: "Park" };
  const html = render({ data: { ...emptyData, nextEvent, upcoming: [nextEvent] }, enrichMeta: { hasOrigin: false } });
  assert.match(html, /<button[^>]*aria-describedby="[^"]+"[^>]*>Use my location<\/button>/);
  assert.match(html, /Use your location to estimate drive time and total miles/);
  assert.match(html, /Your browser will ask for permission if needed/);
  const enriched = render({ data: { ...emptyData, nextEvent, upcoming: [nextEvent] }, metrics: { eventId: "event", travelMinutes: 85, travelDistanceKm: 132.8, travelUpdatedAt: "2030-09-18T22:32:00Z", travelOriginLabel: "current location", weatherTemp: 78, weatherSummary: "Sunny" } });
  assert.match(enriched, /1 hr 25 min/);
  assert.match(enriched, /82.5 miles total/);
  assert.match(enriched, /From current location/);
  assert.doesNotMatch(enriched, /Plan your drive/);
  assert.doesNotMatch(enriched, /Use my location|Your browser will ask for permission/);
  assert.doesNotMatch(enriched, /Leave around|Includes 10 min|Traffic may change|Updated/);
  assert.match(enriched, /78°F/);
  assert.match(enriched, /Sunny/);
});

test("drive time handles short trips and whole hours, with no invented mileage when distance is missing", () => {
  const nextEvent = { id: "event", title: "Event", startAt: "2030-09-25T12:00:00Z", endAt: null, ownership: "owned", locationText: "Park" };
  for (const [travelMinutes, expected] of [[25, "25 min"], [60, "1 hr"], [120, "2 hr"], [135, "2 hr 15 min"]]) {
    const html = render({ data: { ...emptyData, nextEvent, upcoming: [nextEvent] }, metrics: { eventId: "event", travelMinutes, travelDistanceKm: null, travelOriginLabel: "current location" } });
    assert.ok(html.includes(`>${expected}</p>`));
    assert.match(html, /Distance unavailable/);
    assert.doesNotMatch(html, /0 miles total/);
  }
});

test("a profile-based estimate offers current location and a pending request disables the action", () => {
  const nextEvent = { id: "event", title: "Event", startAt: "2030-09-25T12:00:00Z", endAt: null, ownership: "owned", locationText: "Park" };
  const data = { ...emptyData, nextEvent, upcoming: [nextEvent] };
  const html = render({ data, enrichMeta: { hasOrigin: true }, metrics: { eventId: "event", travelMinutes: 25, travelOriginLabel: "home" } });
  assert.match(html, /Use your current location to update this drive estimate/);
  assert.match(html, />Use my location<\/button>/);
  const pending = render({ data, metricsLoading: true });
  assert.match(pending, /Getting your drive estimate/);
  assert.match(pending, /<button[^>]*disabled=""[^>]*aria-busy="true"[^>]*>Updating…<\/button>/);
  assert.doesNotMatch(pending, /Your browser will ask for permission/);
});

test("Home shows travel failure feedback and ignores another event's cached estimate", () => {
  const nextEvent = { id: "new-event", title: "New event", startAt: "2030-09-25T12:00:00Z", endAt: null, ownership: "owned", locationText: "Park" };
  const html = render({ data: { ...emptyData, nextEvent, upcoming: [nextEvent] }, metrics: { eventId: "old-event", travelMinutes: 90, weatherTemp: 90 }, travelError: "Couldn’t update the drive estimate. Please try again." });
  assert.match(html, /Couldn’t update the drive estimate/);
  assert.doesNotMatch(html, /90 min|90°F|Leave around/);
});
