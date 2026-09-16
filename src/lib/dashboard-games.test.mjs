import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";
import * as gamesModule from "./dashboard-games.ts";

const now = Date.parse("2026-09-16T12:00:00Z");
const source = (games, overrides = {}) => ({
  id: "season", title: "South Walton football", public_slug: "seahawks-2026",
  home: { teamName: "South Walton", season: "2026", timezone: "America/Chicago", homeVenue: "Home stadium", homeAddress: "Home address" },
  games, ...overrides,
});

test("undated season pages contribute dated upcoming games, sorted across schedules", () => {
  const items = gamesModule.dashboardGamesFromSources([
    source([
      { id: "later", date: "Oct 9", opponent: "Walton", homeAway: "away", venue: "Away stadium", address: "Away address", time: "19:00", ticketsLink: "https://tickets.example/game" },
      { id: "past", date: "Sep 11", opponent: "Visitors" },
      { id: "final", date: "Oct 16", opponent: "Visitors", result: "W" },
      { id: "off", date: "Sep 18", opponent: "Bye week" },
      { id: "undated", opponent: "Visitors" },
      { id: "canceled", date: "Sep 18", opponent: "Visitors", status: "cancelled" },
      { id: "today-past", date: "Sep 16", time: "06:00", opponent: "Visitors" },
      { id: "today", date: "Sep 16", time: "19:00", opponent: "Visitors" },
      null,
    ]),
    source([{ id: "other", date: "9/25/2026", opponent: "Vikings" }], { id: "other-season" }),
  ], now);
  assert.deepEqual(items.map((item) => item.id), ["season:today", "other-season:other", "season:later"]);
  assert.equal(items[2].game.venue, "Away stadium");
  assert.equal(items[2].game.address, "Away address");
  assert.equal(items[2].game.ticketsLink, "https://tickets.example/game");
  assert.equal(items[2].eventHref, "/event/seahawks-2026?tab=event#games");
  assert.equal(items[1].game.time, "", "missing kickoff stays missing");
  assert.equal(gamesModule.upcomingDashboardGames(items, Date.parse("2026-10-10T12:00:00Z")).length, 0);
});

test("game identities include the parent event and duplicate source rows do not duplicate fixtures", () => {
  const row = source([{ id: "game", opponent: "Visitors", date: "9/18/2026" }]);
  const items = gamesModule.dashboardGamesFromSources([row, row, { ...row, id: "second" }], now);
  assert.deepEqual(items.map((item) => item.id), ["season:game", "second:game"]);
  assert.equal(gamesModule.upcomingDashboardGames(items, now).length, 1);
});

test("duplicate schedules produce one game with combined details and normalized school identities", () => {
  const games = gamesModule.dashboardGamesFromSources([
    source([{ id: "first", opponent: "Pine Forest", date: "Sep 25", homeAway: "home", venue: "Home stadium", notes: "Senior night" }]),
    source([{ id: "second", opponent: "Pine Forest High School", date: "2026-09-25", homeAway: "home", time: "7:30 PM", ticketsLink: "https://tickets.example/game" }], {
      id: "duplicate", home: { teamName: "South Walton High School", season: "2026", timezone: "America/Chicago" },
    }),
  ], now);
  const unique = gamesModule.upcomingDashboardGames(games, now);
  assert.equal(unique.length, 1);
  assert.equal(unique[0].game.venue, "Home stadium");
  assert.equal(unique[0].game.notes, "Senior night");
  assert.equal(unique[0].game.time, "19:30");
  assert.equal(unique[0].game.ticketsLink, "https://tickets.example/game");
  assert.deepEqual(gamesModule.upcomingDashboardGames(unique, now), unique);
});

test("deduplication preserves different matchups, dates, doubleheaders and schools sharing a mascot", () => {
  const fixtures = [
    { id: "early", opponent: "Pine Forest", date: "Sep 25", time: "13:00" },
    { id: "late", opponent: "Pine Forest", date: "Sep 25", time: "19:00" },
    { id: "other-team", opponent: "Gulf Breeze", date: "Sep 25", time: "19:00" },
    { id: "next-week", opponent: "Pine Forest", date: "Oct 2", time: "19:00" },
  ];
  const games = gamesModule.dashboardGamesFromSources([
    source(fixtures), source(fixtures, { id: "copy" }),
    source([fixtures[1]], { id: "different-school", home: { teamName: "Seattle Seahawks", teamMascot: "Seahawks", season: "2026", timezone: "America/Chicago" } }),
  ], now);
  assert.equal(gamesModule.upcomingDashboardGames(games, now).length, 5);
});

test("the same fixture saved from both teams' perspectives appears once", () => {
  const games = gamesModule.dashboardGamesFromSources([
    source([{ id: "away", opponent: "Walton", date: "Oct 2", homeAway: "away" }]),
    source([{ id: "home", opponent: "South Walton Seahawks", date: "Oct 2", homeAway: "home" }], {
      id: "walton", home: { teamName: "Walton High School", season: "2026" },
    }),
  ], now);
  assert.equal(gamesModule.upcomingDashboardGames(games, now).length, 1);
});

test("different sports between the same schools stay separate", () => {
  const fixture = [{ id: "game", opponent: "Visitors", date: "Sep 25" }];
  const games = gamesModule.dashboardGamesFromSources([
    source(fixture, { sport: "sport_football_season" }),
    source(fixture, { id: "duplicate-football", sport: "football" }),
    source(fixture, { id: "basketball", sport: "basketball" }),
  ], now);
  assert.deepEqual(gamesModule.upcomingDashboardGames(games, now).map((item) => item.sport).sort(), ["basketball", "football"]);
});

test("kickoffs preserve supplied times and sort across time zones without turning all-day games into midnight kickoffs", () => {
  const items = gamesModule.dashboardGamesFromSources([
    source([{ id: "chicago", date: "Sep 18", time: "7:30 PM", opponent: "Visitors" }]),
    source([{ id: "new-york", date: "Sep 18", time: "8:00 PM", opponent: "Visitors" }], { id: "east", home: { season: "2026", timezone: "America/New_York" } }),
    source([{ id: "timestamp", start: "2026-09-19T01:00:00Z", opponent: "Visitors" }]),
    source([{ id: "all-day", start: "2026-09-18T00:00:00Z", allDay: true, opponent: "Visitors" }]),
  ], now);
  assert.deepEqual(items.map((item) => item.game.id), ["all-day", "new-york", "chicago", "timestamp"]);
  assert.equal(items[0].game.time, "");
  assert.equal(items[2].game.time, "19:30");
  assert.equal(items[3].game.date, "2026-09-18");
  assert.equal(items[3].game.time, "20:00");
});

test("printed dates need a supplied year and legacy scan date objects preserve home/away", () => {
  const items = gamesModule.dashboardGamesFromSources([
    source([{ opponent: "Visitors", date: "Sep 18" }], { home: {} }),
    source([{ opponent: "Falcons", date: { year: 2026, month: 9, day: 18 }, home: false }], { id: "scan", public_slug: null }),
    source([{ opponent: "Bad date", date: "2026-02-30" }]),
    source("invalid"),
  ], now);
  assert.equal(items.length, 1);
  assert.equal(items[0].game.date, "2026-09-18");
  assert.equal(items[0].game.homeAway, "away");
  assert.equal(items[0].eventHref, "/event/scan?tab=event#games");
});

test("games query checks owner or active recipient access and does not require an event start date", async () => {
  const { outputText } = ts.transpileModule(readFileSync(new URL("./dashboard-games-query.ts", import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const module = { exports: {} };
  new Function("require", "module", "exports", outputText)((name) => {
    if (name === "./dashboard-games.ts") return gamesModule;
    if (name === "@/lib/db") return { query: async (sql, values) => {
      assert.deepEqual(values, ["viewer"]);
      assert.match(sql, /eh\.user_id = \$1 or exists/);
      assert.match(sql, /es\.recipient_user_id = \$1/);
      assert.match(sql, /es\.status in \('pending', 'accepted'\) and es\.revoked_at is null/);
      assert.match(sql, /not in \('draft', 'archived', 'canceled', 'cancelled'\)/);
      assert.match(sql, /draftStatus/);
      assert.doesNotMatch(sql, /limit|startAt|event_start_at|eh\.data as/i);
      assert.match(sql, /when jsonb_typeof\(eh\.data#>'\{advancedSections,games,games\}'\) = 'array' then/);
      return { rows: [source([{ id: "fixture", opponent: "Visitors", date: "2026-09-18" }])] };
    } };
    throw new Error(name);
  }, module, module.exports);
  const result = await module.exports.loadDashboardGames("viewer", now);
  assert.equal(result.length, 1);
});

test("dashboard retains event results if games fail and removes declined schedule games", async () => {
  const route = readFileSync(new URL("../app/api/dashboard/route.ts", import.meta.url), "utf8");
  const source = route.slice(route.indexOf("async function computeDashboardPayload("), route.indexOf("function getOrCreateRefresh("));
  const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
  const games = gamesModule.dashboardGamesFromSources([
    sourceFixture("declined"), sourceFixture("accepted"),
  ], now);
  function sourceFixture(id) {
    return { ...sourceRow, id };
  }
  function createCompute(loadGames) {
    const deps = {
      loadDashboardGames: loadGames,
      upcomingDashboardGames: gamesModule.upcomingDashboardGames,
      listDashboardEventsForUser: async () => ({ events: [], diagnostics: { sourceRowCount: 0 } }),
      buildDashboardCollections: () => ({ allDrafts: [], drafts: [], upcoming: [], nextEvent: null, upcomingIn7DaysCount: 0, upcomingIn30DaysCount: 0 }),
      buildDashboardEmptyReason: () => null,
      canShowOwnerRsvpDashboard: () => false,
      loadDashboardOverview: async () => ({ unavailable: [] }),
      buildSetupHealth: () => [],
      query: async (_sql, values) => {
        assert.deepEqual(new Set(values[0]), new Set(["declined", "accepted"]));
        return { rows: [{ event_id: "declined", response: "no" }] };
      },
      DASHBOARD_EVENT_QUERY_LIMIT: 120,
      DASHBOARD_DEBUG: false,
    };
    return new Function(...Object.keys(deps), `${compiled}\nreturn computeDashboardPayload;`)(...Object.values(deps));
  }
  const result = await createCompute(async () => games)("viewer", "viewer@example.com");
  assert.deepEqual(result.games.map((item) => item.eventId), ["accepted"]);
  assert.equal(result.gamesUnavailable, false);
  const failed = await createCompute(async () => { throw new Error("Games unavailable"); })("viewer", "viewer@example.com");
  assert.equal(failed.ok, true);
  assert.equal(failed.gamesUnavailable, true);
  assert.deepEqual(failed.upcoming, []);
});

const sourceRow = source([{ id: "game", opponent: "Visitors", date: "2026-09-18" }]);
