const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const test = require("node:test");
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (request, parent, ...rest) {
  return originalResolve.call(
    this,
    request.startsWith("@/") ? path.join(process.cwd(), "src", request.slice(2)) : request,
    parent,
    ...rest,
  );
};
const originalLoad = Module._load;
Module._load = function (request, parent, main) {
  if (request === "@/lib/event-access")
    return { normalizeAccessControlPayload: async (value) => value };
  if (request === "lucide-react") {
    const file = path.join(process.cwd(), "node_modules/lucide-react/dist/cjs/lucide-react.js");
    const mod = new Module(file, parent);
    mod.paths = Module._nodeModulePaths(path.dirname(file));
    mod._compile(fs.readFileSync(file, "utf8"), file);
    return mod.exports;
  }
  return originalLoad.call(this, request, parent, main);
};
for (const extension of [".ts", ".tsx"])
  Module._extensions[extension] = (mod, file) =>
    mod._compile(
      ts.transpileModule(fs.readFileSync(file, "utf8"), {
        fileName: file,
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          jsx: ts.JsxEmit.ReactJSX,
          target: ts.ScriptTarget.ES2022,
          esModuleInterop: true,
        },
      }).outputText,
      file,
    );

const { footballEditorFields } = require("./football-editor-data.ts");
Module._extensions[".css"] = (mod) => { mod.exports = new Proxy({}, { get: (_, key) => key === "__esModule" ? false : String(key) }); };
const { resolveFootballTeamName, footballTeamLabel } = require("./football-team-name.ts");
const { default: FootballSectionTabs, useFootballSectionTabs } = require("../components/football-season-templates/FootballSectionTabs.tsx");
const {
  mapParseResultToFootballData,
  buildDefaultFootballDiscoveryData,
} = require("./football-discovery.ts");
const {
  footballDirections,
  footballMatchup,
  footballGameContextKey,
} = require("./football-games.ts");
const { footballWebsiteText, isPublicSourceAddress } = require("./football-source.ts");
const { resolveFootballDiscoveryTemplateSelection } = require("./discovery/template-selection.ts");
const FootballSchedule =
  require("../components/football-season-templates/FootballSchedule.tsx").default;
const HeroImageEditor = require("../components/events/HeroImageEditor.tsx").default;
const FootballHero = require("../components/football-season-templates/FootballHero.tsx").default;
const { logisticsSection } = require("../components/event-templates/FootballSeasonTemplate.tsx");
const { enrichFootballGames, selectFootballDrivingRoute } = require("./football-game-context.ts");
const { validateFootballVenueFacts, applyFootballVenueFacts } = require("./football-venue-lookup.ts");
const { mergeFootballGameDetails } = require("./football-games.ts");
const { requestFootballGameDetails, updateFootballGameDetails } = require("./football-game-details-client.ts");
const { normalizeFootballGameDate, groupFootballGames, footballToday } = require("./football-schedule-dates.ts");
const { readFootballResponse, footballErrorMessage } = require("./football-response.ts");

test("import dates retain printed dates and normalize only with a known year", async () => {
  assert.equal(normalizeFootballGameDate("2026-08-14T00:00:00Z"), "2026-08-14");
  assert.equal(normalizeFootballGameDate("08/14/2026"), "2026-08-14");
  assert.equal(normalizeFootballGameDate("Fri, Aug 14", "2026"), "2026-08-14");
  assert.equal(normalizeFootballGameDate("September 19th, 2026"), "2026-09-19");
  assert.equal(normalizeFootballGameDate("Jan 8", "2026-27"), "2027-01-08");
  assert.equal(normalizeFootballGameDate("Aug 14"), "");
  assert.equal(normalizeFootballGameDate("2026-02-30"), "");
  assert.equal(normalizeFootballGameDate("Janitor 5 2026"), "");
  const data = await mapParseResultToFootballData({ ...emptyParse(), season: "2026", games: [{ opponent: "Visitors", date: "8/14" }] });
  assert.equal(data.advancedSections.games.games[0].date, "2026-08-14");
  const partial = await mapParseResultToFootballData({ ...emptyParse(), games: [{ opponent: "Visitors", date: "Aug 14" }] });
  assert.equal(partial.advancedSections.games.games[0].date, "Aug 14");
});

test("upcoming games exclude past results and undated fixtures, with chronological ordering", () => {
  const now = Date.parse("2026-09-12T18:00:00Z");
  const games = [
    { id: "later", opponent: "Later", date: "Sep 25" },
    { id: "past", opponent: "Past", date: "2026-08-14T00:00:00Z" },
    { id: "today", opponent: "Today", date: "9/12/2026", time: "19:00" },
    { id: "this-morning", opponent: "Earlier today", date: "9/12/2026", time: "08:00" },
    { id: "earlier", opponent: "Earlier", date: "2026-09-19" },
    { id: "final", opponent: "Final", result: "W", date: "2026-09-19" },
    { id: "unknown", opponent: "Undated" },
  ];
  const grouped = groupFootballGames(games, { season: "2026", timezone: "America/Chicago" }, now);
  assert.deepEqual(grouped.upcoming.map((game) => game.id), ["today", "earlier", "later"]);
  assert.deepEqual(grouped.past.map((game) => game.id), ["final", "this-morning", "past"]);
  assert.deepEqual(grouped.undated.map((game) => game.id), ["unknown"]);
  assert.equal(games[0].date, "Sep 25", "grouping must not mutate saved dates");
  assert.equal(footballToday("America/Chicago", Date.parse("2026-09-13T01:00:00Z")), "2026-09-12");
});

test("schedule defaults to upcoming and renders dated past games in a separate hidden panel", () => {
  const markup = renderToStaticMarkup(React.createElement(FootballSchedule, {
    teamName: "South Walton Seahawks", season: "2026", games: [
      { id: "future", opponent: "Future visitors", date: "2099-09-19" },
      { id: "past", opponent: "Lawton Chiles", date: "Aug 14", result: "W", score: "35-18" },
      { id: "undated", opponent: "Undated visitors" },
    ],
  }));
  assert.match(markup, /aria-label="Game schedule periods"/);
  assert.match(markup, /aria-selected="true"[^>]*>[\s\S]*?Upcoming \(1\)/);
  assert.match(markup, /id="[^"]*-panel-past-games"[^>]*hidden=""/);
  assert.match(markup, /id="[^"]*-panel-undated-games"[^>]*hidden=""/);
  assert.match(markup, /<time dateTime="2026-08-14">Fri, Aug 14, 2026<\/time>/);
  assert.match(markup, /Past games \(1\)/);
  assert.match(markup, /Date to confirm \(1\)/);
});

test("prefill and retained legacy messages never expose HTML or raw JSON parsing errors", async () => {
  const fallback = "Try again; your current details are kept.";
  for (const contentType of ["text/html", "application/json"]) {
    await assert.rejects(readFootballResponse(new Response("<!DOCTYPE html>", { headers: { "Content-Type": contentType } }), fallback), { message: fallback });
  }
  assert.equal(footballErrorMessage("Unexpected token '<', '<!DOCTYPE' is not valid JSON", fallback), fallback);
  assert.equal(footballErrorMessage(new SyntaxError("Unexpected end of JSON input"), fallback), fallback);
  assert.deepEqual(await readFootballResponse(Response.json({ data: { title: "Season" } }), fallback), { data: { title: "Season" } });
});

test("HTML and expired-session lookup failures produce actionable messages", async () => {
  const savedFetch = global.fetch;
  try {
    global.fetch = async () => new Response("<!DOCTYPE html><h1>Gateway timeout</h1>", { status: 504, headers: { "Content-Type": "text/html" } });
    await assert.rejects(requestFootballGameDetails({ games: [], home: {} }, "venues", new AbortController().signal), (error) => {
      assert.match(error.message, /Details already found are kept/);
      assert.doesNotMatch(error.message, /Unexpected token|DOCTYPE|JSON/);
      return true;
    });
    global.fetch = async () => new Response('{"error":"Unauthorized"}', { status: 401, headers: { "Content-Type": "application/json" } });
    await assert.rejects(requestFootballGameDetails({ games: [], home: {} }, "venues", new AbortController().signal), /Sign in again.*Keep this editor open/);
  } finally { global.fetch = savedFetch; }
});

test("game context API returns JSON for server failures and bounds slow batches", async () => {
  const loader = Module._load;
  const routePath = path.join(process.cwd(), "src/app/api/football/game-context/route.ts");
  let failAuth = true;
  Module._load = function (request, parent, main) {
    if (request === "@/lib/auth") return { getAuthenticatedRequestUser: async () => {
      if (failAuth) throw new Error("Private database connection detail");
      return { ok: true };
    } };
    return loader.call(this, request, parent, main);
  };
  const savedError = console.error;
  console.error = () => {};
  try {
    const { POST } = require(routePath);
    let response = await POST(new Request("http://localhost/api/football/game-context", { method: "POST", body: "{}" }));
    assert.equal(response.status, 503);
    assert.match(response.headers.get("content-type"), /application\/json/);
    assert.doesNotMatch(JSON.stringify(await response.json()), /Private database/);
    failAuth = false;
    response = await POST(new Request("http://localhost/api/football/game-context", { method: "POST", body: JSON.stringify({ phase: "travel", home: {}, games: Array.from({ length: 5 }, (_, i) => ({ id: String(i) })) }) }));
    assert.equal(response.status, 400);
    assert.match(response.headers.get("content-type"), /application\/json/);
  } finally { Module._load = loader; console.error = savedError; delete require.cache[routePath]; }
});

test("game enrichment publishes tickets and directions before routes and retains successful batches", async () => {
  const savedFetch = global.fetch;
  const sourceHome = { teamName: "South Walton Seahawks" };
  const home = { ...sourceHome, homeVenue: "Home stadium", homeAddress: "645 Greenway Trail, Santa Rosa Beach, FL 32459" };
  const games = Array.from({ length: 5 }, (_, index) => ({ id: `away-${index}`, opponent: `School ${index}`, homeAway: "away" }));
  let current = games;
  const updates = [];
  const phases = [];
  global.fetch = async (_url, options) => {
    const body = JSON.parse(options.body);
    phases.push([body.phase, body.games.length]);
    if (body.phase === "venues") return Response.json({ home, games: body.games.map((game, index) => ({ ...game, venue: `Stadium ${index}`, address: `${index + 1} Away Road`, ticketsLink: "https://gofan.co/app/school/FL19831" })) });
    assert.equal(body.phase, "travel");
    assert.ok(current.every((game) => game.ticketsLink && footballDirections(game, home)), "ticket/direction updates must be committed before requesting routes");
    if (body.games[0].id === "away-4") return new Response("<!DOCTYPE html>", { status: 504, headers: { "Content-Type": "text/html" } });
    return Response.json({ home, games: body.games.map((game) => ({ ...game, context: { key: footballGameContextKey(game, home), miles: 61.6, minutes: 98, routeVersion: 2 } })) });
  };
  try {
    const result = await updateFootballGameDetails({ games, home: sourceHome, signal: new AbortController().signal, onProgress: () => {}, onUpdate: (update) => {
      updates.push(update);
      current = current.map((game) => {
        const original = update.previous.games.find((item) => item.id === game.id);
        const found = update.games.find((item) => item.id === game.id);
        return original && found ? mergeFootballGameDetails(game, original, found) : game;
      });
    } });
    assert.deepEqual(phases, [["venues", 5], ["travel", 4], ["travel", 1]]);
    assert.equal(updates.length, 2);
    assert.equal(current[0].context.miles, 61.6);
    assert.equal(current[4].ticketsLink, "https://gofan.co/app/school/FL19831");
    assert.equal(result.errors.length, 1);
    assert.equal(result.games[0].context.miles, 61.6);
    assert.equal(games[0].address, undefined, "input/source facts remain unchanged");
  } finally { global.fetch = savedFetch; }
});

test("verified school directory fills direct Hudl/GoFan links without waiting for AI search", async () => {
  const source = require("./football-source.ts");
  const { lookupFootballVenues } = require("./football-venue-lookup.ts");
  const originalSource = source.fetchFootballSource;
  const savedFetch = global.fetch;
  const pages = [];
  source.fetchFootballSource = async (url) => {
    pages.push(url);
    let html = "";
    if (url.includes("swh.walton")) html = '<p>645 Greenway Trail, Santa Rosa Beach, FL 32459</p><a href="https://fan.hudl.com/usa/fl/santa-rosa-beach/organization/8951/south-walton-high-school">Hudl Livestream & Tickets</a>';
    if (url.includes("gbh.santarosa")) html = "675 Gulf Breeze Parkway, Gulf Breeze, FL 32561";
    if (url.includes("okaloosa")) html = "400 Hollywood Blvd. SW, Fort Walton Beach, FL 32548";
    if (url.includes("nfhsnetwork.com/schools/gulf-breeze")) html = '<a href="https://gofan.co/app/school/FL19831?utm_source=nfhs-network">Tickets</a>';
    if (url.includes("nfhsnetwork.com/schools/fort-walton")) html = '<a href="https://gofan.co/app/school/FL19830?utm_source=nfhs-network">Tickets</a>';
    return { url, buffer: Buffer.from(html) };
  };
  global.fetch = async () => { throw new Error("Directory lookup must not request OpenAI"); };
  try {
    const result = await lookupFootballVenues([
      { id: "home", opponent: "Lawton Chiles", homeAway: "home" },
      { id: "gulf", opponent: "Gulf Breeze", homeAway: "away" },
      { id: "fort", opponent: "Fort Walton Beach", homeAway: "away" },
    ], { teamName: "South Walton Seahawks" }, { allowSearch: false });
    assert.match(result.home.homeAddress, /645 Greenway/);
    assert.match(result.games[0].ticketsLink, /fan\.hudl\.com/);
    assert.equal(result.games[1].ticketsLink, "https://gofan.co/app/school/FL19831");
    assert.equal(result.games[2].ticketsLink, "https://gofan.co/app/school/FL19830");
    assert.equal(result.games[2].venue, "Steve Riggs Stadium");
    for (const game of result.games) {
      assert.ok(footballDirections(game, result.home));
      assert.equal(game.venueLookup.schoolTickets, true);
    }
    assert.equal(pages.length, 5);
    const markup = renderToStaticMarkup(React.createElement(FootballSchedule, { ...result.home, games: result.games }));
    assert.equal((markup.match(/>Buy tickets<\/a>/g) || []).length, 3);
    assert.doesNotMatch(markup, /google\.com\/search|Find tickets/);
  } finally { source.fetchFootballSource = originalSource; global.fetch = savedFetch; }
});

test("stadium mileage compares road alternatives instead of selecting the interstate detour", () => {
  const route = selectFootballDrivingRoute([
    { distance: 107.6 * 1609.344, duration: 109 * 60, legs: [{ summary: "US 331, I 10 West" }] },
    { distance: 61.8 * 1609.344, duration: 122 * 60, legs: [{ summary: "US 331, US 98" }] },
    { distance: -1, duration: 2 },
  ]);
  assert.equal(route.miles, 61.8);
  assert.equal(route.minutes, 122);
  assert.equal(route.routeSummary, "US 331, US 98");
  assert.equal(route.routeVersion, 2);
  assert.deepEqual(selectFootballDrivingRoute([]), {});
});

test("football drives use Google Maps first and compare Mapbox alternatives if it is unavailable", async () => {
  const savedFetch = global.fetch;
  const savedGoogle = process.env.GOOGLE_MAPS_API_KEY;
  const savedMapbox = process.env.MAPBOX_ACCESS_TOKEN;
  process.env.GOOGLE_MAPS_API_KEY = "test";
  process.env.MAPBOX_ACCESS_TOKEN = "test";
  const game = { id: "away", homeAway: "away", opponent: "Gulf Breeze", address: "675 Gulf Breeze Parkway, Gulf Breeze, FL 32561" };
  const stadium = { teamName: "South Walton Seahawks", homeAddress: "645 Greenway Trail, Santa Rosa Beach, FL 32459" };
  const calls = [];
  global.fetch = async (url, options) => {
    calls.push(String(url));
    assert.match(String(url), /routes.googleapis.com/);
    assert.equal(JSON.parse(options.body).origin.address, stadium.homeAddress);
    return new Response(JSON.stringify({ routes: [
      { distanceMeters: 107.8 * 1609.344, duration: "6600s", description: "I-10 W" },
      { distanceMeters: 61.6 * 1609.344, duration: "5880s", description: "US-98 W" },
    ] }), { status: 200 });
  };
  try {
    const [resolved] = await enrichFootballGames([game], stadium);
    assert.equal(resolved.context.miles, 61.6);
    assert.equal(resolved.context.minutes, 98);
    assert.equal(resolved.context.routeProvider, "google");
    assert.equal(calls.length, 1);
    global.fetch = async (url) => {
      const value = String(url);
      if (value.includes("routes.googleapis")) return new Response("{}", { status: 503 });
      if (value.includes("geocoding")) return new Response(JSON.stringify({ features: [{ relevance: 1, center: [-86.1, 30.3] }] }));
      assert.equal(new URL(value).searchParams.get("alternatives"), "true");
      return new Response(JSON.stringify({ routes: [
        { distance: 107.6 * 1609.344, duration: 109 * 60 },
        { distance: 61.8 * 1609.344, duration: 122 * 60, legs: [{ summary: "US 98" }] },
      ] }));
    };
    const [fallback] = await enrichFootballGames([game], stadium);
    assert.equal(fallback.context.miles, 61.8);
    assert.equal(fallback.context.routeProvider, "mapbox");
  } finally {
    global.fetch = savedFetch;
    if (savedGoogle === undefined) delete process.env.GOOGLE_MAPS_API_KEY; else process.env.GOOGLE_MAPS_API_KEY = savedGoogle;
    if (savedMapbox === undefined) delete process.env.MAPBOX_ACCESS_TOKEN; else process.env.MAPBOX_ACCESS_TOKEN = savedMapbox;
  }
});

test("venue lookup requires retrieved evidence and rejects unrelated fixture tickets", async () => {
  const source = "https://school.example/football";
  const ticket = "https://gofan.co/app/school/FL123";
  const input = { identityConfirmed: true, venue: "School Stadium", address: "123 Field Lane, Town, FL 32000", venueSource: source, ticketsSource: source, ticketsLink: ticket };
  const read = async () => `Source URL: ${source}\nSchool Stadium, 123 Field Lane, Town, FL 32000. Buy tickets: ${ticket}`;
  const facts = await validateFootballVenueFacts(input, new Set([source]), read);
  assert.equal(facts.address, input.address);
  assert.equal(facts.ticketsLink, ticket);
  assert.equal((await validateFootballVenueFacts(input, new Set(), read)).address, "");
  assert.equal((await validateFootballVenueFacts({ ...input, identityConfirmed: false }, new Set([source]), read)).ticketsLink, "");
  assert.equal((await validateFootballVenueFacts({ ...input, address: "999 Invented St, Town, FL 32000" }, new Set([source]), read)).address, "");
  assert.equal((await validateFootballVenueFacts({ ...input, ticketsLink: "https://gofan.co/event/999" }, new Set([source]), async () => "Buy tickets https://gofan.co/event/999")).ticketsLink, "");
  assert.equal((await validateFootballVenueFacts({ ...input, ticketsLink: source }, new Set([source]), async () => `Source URL: ${source}\nEmpty app shell`)).ticketsLink, "");
});

test("host venue enrichment preserves edits and never sends away or neutral games to the home stadium", () => {
  const facts = { venue: "Home Stadium", address: "123 Home St, Town, FL", ticketsLink: "https://home.example/tickets", venueSource: "https://home.example/football", ticketsSource: "https://home.example/football", checkedAt: "2026-09-12T12:00:00Z" };
  const awayFacts = { ...facts, venue: "Away Stadium", address: "456 Away St, Town, FL", ticketsLink: "https://away.example/tickets" };
  const games = [
    { id: "home", homeAway: "home", opponent: "Visitors" },
    { id: "away", homeAway: "away", opponent: "Away Team" },
    { id: "neutral", homeAway: "neutral", opponent: "Other" },
    { id: "unknown", opponent: "Other" },
    { id: "offsite", homeAway: "home", venue: "City Stadium", ticketsLink: "https://custom.example/tickets" },
  ];
  const result = applyFootballVenueFacts(games, { teamName: "Home Team" }, new Map([["home", facts], ["host:awayteam::", awayFacts]]));
  assert.equal(result.home.homeAddress, facts.address);
  assert.equal(result.games[0].ticketsLink, facts.ticketsLink);
  assert.equal(result.games[1].address, awayFacts.address);
  assert.equal(result.games[2].address, undefined);
  assert.equal(result.games[3].address, undefined);
  assert.equal(result.games[4].address, "");
  assert.equal(result.games[4].ticketsLink, games[4].ticketsLink);
  const original = games[1];
  const edited = { ...original, opponent: "New opponent" };
  assert.deepEqual(mergeFootballGameDetails(edited, original, result.games[1]), edited);
  assert.equal(mergeFootballGameDetails({ ...original, notes: "Bring cash" }, original, result.games[1]).notes, "Bring cash");
  assert.equal(mergeFootballGameDetails(original, original, result.games[1]).ticketsLink, awayFacts.ticketsLink);
});

test("each scheduled game displays its own score even without a final result", () => {
  const render = (game) => renderToStaticMarkup(React.createElement(FootballSchedule, {
    teamName: "Home Team",
    games: [{ id: "game", opponent: "Visitors", ...game }],
  }));
  assert.match(render({ score: " 14-7 " }), /Score · 14-7/);
  assert.doesNotMatch(render({ score: "14-7" }), /Win|Loss|Tie/);
  assert.match(render({ score: "0-0" }), /Score · 0-0/);
  assert.match(render({ score: "28-14", result: "W" }), /Score · 28-14/);
  assert.match(render({ result: "L" }), /Score unavailable/);
  assert.doesNotMatch(render({ score: "  " }), /Score ·|0-0|Win|Loss|Tie/);
  const schedule = renderToStaticMarkup(React.createElement(FootballSchedule, {
    games: [{ id: "first", opponent: "First", score: "21-7" }, { id: "second", opponent: "Second" }],
  }));
  const cards = schedule.match(/<article[\s\S]*?<\/article>/g);
  assert.match(cards[0], /Score · 21-7/);
  assert.doesNotMatch(cards[1], /Score ·|21-7|0-0/);
});

test("past game cards show only matchup, date and supplied score, even with full game details", () => {
  const game = {
    id: "past", opponent: "Freeport Bulldogs", opponentMascot: "Bulldogs",
    date: "2020-09-18", time: "19:00", homeAway: "away", result: "W", score: " 0-0 ",
    venue: "Bulldog Stadium", address: "12615 US-331", ticketsLink: "https://school.example/tickets",
    notes: "Arrive early", broadcast: "Sports TV", conference: true,
    venueLookup: { venueSource: "https://school.example/stadium", ticketsSource: "https://school.example/sales", schoolTickets: true },
  };
  game.context = {
    key: footballGameContextKey(game, home), miles: 28, minutes: 42, routeVersion: 2,
    weather: { summary: "Clear", tempF: 75, checkedAt: new Date().toISOString() },
  };
  const markup = renderToStaticMarkup(React.createElement(FootballSchedule, { ...home, games: [game] }));
  const card = markup.match(/<article[\s\S]*?<\/article>/)?.[0];
  assert.ok(card);
  assert.equal(card.replace(/<[^>]+>/g, ""), "Seahawks at BulldogsFri, Sep 18, 2020Score · 0-0");
  assert.doesNotMatch(card, /<a\b|<button\b/);
});

test("ScoreStream previews embed only validated widgets with accessible fallback links", () => {
  const ScoreStreamScoreboard = require("../components/football-season-templates/ScoreStreamScoreboard.tsx").default;
  const { liveScoresSection } = require("../components/event-templates/FootballSeasonTemplate.tsx");
  const render = (value) => renderToStaticMarkup(React.createElement(ScoreStreamScoreboard, { value }));
  assert.equal(render("https://evil.test/"), "");
  assert.equal(liveScoresSection.renderPreview({ state: {} }), null);
  const value = '<iframe src="https://scorestream.com/widgets/scoreboards/vert?userWidgetId=5926" onload="alert(1)"></iframe>';
  const markup = render(value);
  assert.match(markup, /title="Football scores from ScoreStream"/);
  assert.match(markup, /loading="lazy"/);
  assert.match(markup, /sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"/);
  assert.match(markup, /Open scoreboard in ScoreStream/);
  assert.doesNotMatch(markup, /onload|alert\(1\)|srcdoc|<script/);
  const preview = renderToStaticMarkup(liveScoresSection.renderPreview({ state: { scorestreamWidgetUrl: value } }));
  assert.match(preview, /Live scores/);
  assert.match(preview, /userWidgetId=5926/);
});

test("route mileage uses provider road distance and weather uses the game's local hour", async () => {
  const savedFetch = global.fetch;
  const savedMapKey = process.env.MAPBOX_ACCESS_TOKEN;
  const savedWeatherKey = process.env.WEATHERAPI_KEY;
  const day = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
  process.env.MAPBOX_ACCESS_TOKEN = "test";
  process.env.WEATHERAPI_KEY = "test";
  global.fetch = async (url) => {
    const value = String(url);
    const data = value.includes("geocoding") ? { features: [{ relevance: 1, center: [-86.1, 30.3] }] }
      : value.includes("directions") ? { routes: [{ distance: 16093.44, duration: 3600 }] }
      : { forecast: { forecastday: [{ hour: [{ time: `${day} 19:00`, temp_f: 72, condition: { text: "Clear" } }, { time: `${day} 14:00`, temp_f: 90, condition: { text: "Sunny" } }] }] } };
    return new Response(JSON.stringify(data), { status: 200 });
  };
  try {
    const [game] = await enrichFootballGames([{ id: "away", homeAway: "away", opponent: "Freeport", address: "12615 US-331, Freeport, FL", date: day, time: "19:30" }], home);
    assert.equal(game.context.miles, 10); assert.equal(game.context.minutes, 60);
    assert.equal(game.context.weather.tempF, 72);
    global.fetch = async () => { throw new Error("Provider unavailable"); };
    const [unavailable] = await enrichFootballGames([{ id: "away", homeAway: "away", address: "12615 US-331, Freeport, FL", date: day, time: "19:00" }], home);
    assert.equal(unavailable.context.miles, undefined); assert.equal(unavailable.context.weather, undefined);
  } finally {
    global.fetch = savedFetch;
    if (savedMapKey === undefined) delete process.env.MAPBOX_ACCESS_TOKEN; else process.env.MAPBOX_ACCESS_TOKEN = savedMapKey;
    if (savedWeatherKey === undefined) delete process.env.WEATHERAPI_KEY; else process.env.WEATHERAPI_KEY = savedWeatherKey;
  }
});

const emptyParse = () => ({
  title: "South Walton Seahawks Football",
  homeTeam: "South Walton Seahawks",
  games: [],
  roster: { players: [] },
  practice: { blocks: [] },
  logistics: { notes: [] },
  gear: { checklist: [] },
  volunteers: { slots: [] },
  communications: { announcements: [] },
  unmappedFacts: [],
  links: [],
});
const home = {
  teamName: "South Walton Seahawks",
  homeVenue: "Home Stadium",
  homeAddress: "645 Greenway Trail, Santa Rosa Beach, FL 32459",
  timezone: "America/Chicago",
};

test("team fields recover a source-supported mascot without mixing schools or guessing", async () => {
  const title = "South Walton Seahawks Football";
  assert.equal(resolveFootballTeamName("South Walton High School Football", title), "South Walton Seahawks");
  assert.equal(resolveFootballTeamName("South Walton Seahawks", title), "South Walton Seahawks");
  assert.equal(resolveFootballTeamName("Walton High School Football", title), "Walton High School Football");
  assert.equal(resolveFootballTeamName("South Walton High School Football", "South Walton Football Schedule"), "South Walton Seahawks");
  assert.equal(resolveFootballTeamName("Pinecrest High School Football", "Pinecrest Football Schedule"), "Pinecrest High School Football");
  assert.equal(resolveFootballTeamName("Pinecrest High School Football", "Pinecrest 2026 Football"), "Pinecrest High School Football");
  const mapped = await mapParseResultToFootballData({ ...emptyParse(), title, homeTeam: "South Walton High School Football" });
  assert.equal(mapped.customFields.team, "South Walton Seahawks");
  assert.equal(mapped.extra.team, "South Walton Seahawks");
  assert.equal(footballEditorFields({ title, customFields: { team: "South Walton High School Football" } }).extra.team, "South Walton Seahawks");
  assert.equal(footballEditorFields({ title: "South Walton High School Football", extra: { team: "South Walton High School" } }).title, "South Walton Seahawks Football");
});

test("matchup headings use confirmed mascots without a duplicate school matchup", () => {
  const game = { id: "vikings", opponent: "Fort Walton Beach", homeAway: "away" };
  assert.equal(footballMatchup(game, "South Walton High School"), "Seahawks at Vikings");
  assert.equal(footballMatchup({ ...game, homeAway: "home" }, "South Walton Seahawks"), "Seahawks vs Vikings");
  assert.equal(footballMatchup({ ...game, homeAway: "neutral" }, "South Walton"), "Seahawks vs Vikings");
  assert.equal(footballTeamLabel("Fort Walton Beach High School Football"), "Vikings");
  assert.equal(footballTeamLabel("Gulf Breeze High School"), "Dolphins");
  assert.equal(footballTeamLabel("Palm Beach Central"), "Palm Beach Central");
  assert.equal(footballTeamLabel("St. Patrick", "Fighting Irish"), "Fighting Irish");
  assert.equal(footballMatchup({ id: "empty" }, "South Walton"), "Seahawks");
  assert.equal(footballMatchup(game), "Vikings");
  const markup = renderToStaticMarkup(React.createElement(FootballSchedule, {
    games: [game], teamName: "South Walton High School",
  }));
  assert.match(markup, /<h3[^>]*>Seahawks at Vikings<\/h3>/);
  assert.match(markup, /Home: Vikings/);
  assert.doesNotMatch(markup, /South Walton High School at Fort Walton Beach/);
  assert.doesNotMatch(markup, /google\.com\/search|Find tickets|Buy tickets/);
});

test("source-provided mascots survive import and editor projection for other schools", async () => {
  const mapped = await mapParseResultToFootballData({
    ...emptyParse(), homeTeam: "St. Patrick", homeMascot: "Fighting Irish",
    games: [{ opponent: "Bayview", opponentMascot: "Tigers", homeAway: "away" }],
  });
  const fields = footballEditorFields(mapped);
  assert.equal(fields.extra.teamMascot, "Fighting Irish");
  const games = mapped.advancedSections.games.games;
  assert.equal(games[0].opponent, "Bayview");
  assert.equal(games[0].opponentMascot, "Tigers");
  const markup = renderToStaticMarkup(React.createElement(FootballSchedule, {
    games, teamName: fields.extra.team, teamMascot: fields.extra.teamMascot,
  }));
  assert.match(markup, /<h3[^>]*>Fighting Irish at Tigers<\/h3>/);
  assert.doesNotMatch(markup, /St. Patrick at Bayview/);
  const single = await mapParseResultToFootballData({ ...emptyParse(), opponent: "Bayview", opponentMascot: "Tigers" });
  assert.equal(single.advancedSections.games.games[0].opponentMascot, "Tigers");
});

test("football tabs expose one active panel while retaining the other section's content", () => {
  function Fixture() {
    const tabs = useFootballSectionTabs([{ id: "details", label: "Details" }, { id: "games", label: "Game Schedule" }]);
    return React.createElement(React.Fragment, null,
      React.createElement(FootballSectionTabs, { tabs, activeClassName: "selected", idleClassName: "idle" }),
      React.createElement("section", tabs.panelProps("details"), "Team information"),
      React.createElement("section", tabs.panelProps("games"), "Long season schedule"),
    );
  }
  const markup = renderToStaticMarkup(React.createElement(Fixture));
  assert.equal((markup.match(/aria-selected="true"/g) || []).length, 1);
  assert.match(markup, /role="tablist"/);
  assert.match(markup, /role="tabpanel"[^>]*>Team information/);
  assert.match(markup, /role="tabpanel"[^>]*hidden=""[^>]*style="display:none">Long season schedule/);
  assert.match(markup, /aria-controls="[^"]+-panel-games"/);
});

test("prefill replaces Chicago demo facts and preserves sunset layout and custom artwork", async () => {
  const parsed = await mapParseResultToFootballData(
    { ...emptyParse(), city: "Santa Rosa Beach", state: "FL" },
    buildDefaultFootballDiscoveryData(),
  );
  const before = {
    city: "Chicago",
    venue: "Panthers Field",
    date: "2026-09-19",
    time: "14:00",
    hero: "/team.webp",
    fontSize: "large",
  };
  const after = { ...before, ...footballEditorFields(parsed) };
  assert.equal(after.city, "Santa Rosa Beach");
  assert.equal(after.state, "FL");
  assert.equal(after.venue, "");
  assert.equal(after.date, "");
  assert.equal(after.time, "");
  assert.equal(after.hero, "/team.webp");
  assert.equal(after.fontSize, "large");
  assert.equal(after.extra.team, "South Walton Seahawks");
  assert.equal(parsed.advancedSections.games.games.length, 0);
  assert.equal(parsed.advancedSections.logistics.travelMode, "");
  assert.equal(
    resolveFootballDiscoveryTemplateSelection("sunset-arena", "launchpad-editorial"),
    "sunset-arena",
  );
  const markup = renderToStaticMarkup(
    React.createElement(FootballHero, {
      templateId: "sunset-arena",
      title: after.title,
      heroSrc: after.hero,
    }),
  );
  assert.match(markup, /data-football-hero-layout="cinematic"/);
  assert.match(markup, /team.webp/);
});
test("away and unknown games never inherit the home stadium or fabricate opponents", async () => {
  const parsed = await mapParseResultToFootballData({
    ...emptyParse(),
    venue: home.homeVenue,
    address: home.homeAddress,
    games: [
      { opponent: "Freeport Bulldogs", homeAway: "away", ticketsLink: "https://host.example/away-game-tickets" },
      { opponent: "Niceville Eagles", homeAway: "home", ticketsLink: "https://home.example/home-game-tickets" },
      { opponent: "Walton Braves", homeAway: null },
    ],
  });
  const [away, hosted, unclear] = parsed.advancedSections.games.games;
  assert.equal(away.venue, "");
  assert.equal(away.address, "");
  assert.equal(hosted.venue, home.homeVenue);
  assert.equal(hosted.address, home.homeAddress);
  assert.equal(away.ticketsLink, "https://host.example/away-game-tickets");
  assert.equal(hosted.ticketsLink, "https://home.example/home-game-tickets");
  assert.equal(unclear.ticketsLink, "");
  assert.equal(unclear.homeAway, "");
  assert.equal(unclear.venue, "");
  assert.equal(footballDirections(away, home), null);
  assert.equal(footballMatchup(away, home.teamName), "Seahawks at Freeport Bulldogs");
});
test("game cards include both teams, stadium, directions, mileage, weather, tickets and calendar", () => {
  const game = {
    id: "away",
    opponent: "Freeport Bulldogs",
    opponentMascot: "Bulldogs",
    homeAway: "away",
    date: "2026-09-18",
    time: "19:00",
    venue: "Bulldog Stadium",
    address: "12615 US-331, Freeport, FL",
    ticketsLink: "https://school.example/tickets",
  };
  game.context = {
    key: footballGameContextKey(game, home),
    miles: 28.4,
    minutes: 42,
    routeVersion: 2,
    routeSummary: "US 331",
    weather: { summary: "Clear", tempF: 75, checkedAt: new Date().toISOString() },
  };
  const markup = renderToStaticMarkup(
    React.createElement(FootballSchedule, { games: [game], ...home }),
  );
  for (const expected of [
    "Seahawks at Bulldogs",
    "Home: Bulldogs",
    "Bulldog Stadium",
    "28.4 miles",
    "Via US 331",
    "42 min drive",
    "75°F",
    "Add to calendar",
    "Buy tickets",
    "Get directions",
    "From Home Stadium to Bulldog Stadium · one way",
  ])
    assert.ok(markup.includes(expected), expected);
  const cardText = markup.replace(/<[^>]+>/g, "");
  assert.ok(!cardText.includes("South Walton Seahawks at Freeport Bulldogs"));
  assert.ok(!cardText.includes(game.address));
  const directions = new URL(footballDirections(game, home));
  assert.equal(directions.searchParams.get("origin"), home.homeAddress);
  assert.equal(directions.searchParams.get("destination"), game.address);
  for (const homeAway of ["home", "neutral", ""]) {
    const hostedMarkup = renderToStaticMarkup(React.createElement(FootballSchedule, {
      games: [{ ...game, homeAway }], ...home,
    }));
    assert.doesNotMatch(hostedMarkup, /Get directions|google\.com\/maps\/dir/);
    assert.ok(!hostedMarkup.replace(/<[^>]+>/g, "").includes(game.address));
    assert.match(hostedMarkup, /Bulldog Stadium/);
    assert.match(hostedMarkup, /Buy tickets/);
    assert.match(hostedMarkup, /Add to calendar/);
  }
  const changed = renderToStaticMarkup(
    React.createElement(FootballSchedule, {
      games: [{ ...game, address: "Another stadium" }],
      ...home,
    }),
  );
  assert.doesNotMatch(changed, /28.4 miles|75°F/);
  const staleRoute = renderToStaticMarkup(React.createElement(FootballSchedule, { games: [{ ...game, context: { ...game.context, routeVersion: 1 } }], ...home }));
  assert.doesNotMatch(staleRoute, /28.4 miles/);
  const withoutTickets = renderToStaticMarkup(
    React.createElement(FootballSchedule, {
      games: [{ ...game, ticketsLink: "javascript:alert(1)" }],
      ...home,
    }),
  );
  assert.doesNotMatch(withoutTickets, /Buy tickets|javascript:/);
  assert.match(withoutTickets, /Get directions/);
});
test("empty sections are omitted, hero replacement remains available", () => {
  assert.equal(
    renderToStaticMarkup(
      React.createElement(FootballSchedule, { games: [{ id: "empty" }], ...home }),
    ),
    "",
  );
  assert.equal(logisticsSection.renderPreview({ state: {} }), null);
  const logistics = renderToStaticMarkup(
    logisticsSection.renderPreview({ state: { ticketsLink: "https://school.example/tickets" } }),
  );
  assert.match(logistics, /Get tickets/);
  const hero = renderToStaticMarkup(
    React.createElement(HeroImageEditor, { value: "/our-photo.webp", onChange() {} }),
  );
  assert.match(hero, /Change hero image/);
  assert.match(hero, /Use template image/);
});
test("website import preserves schedule rows and links and rejects private destinations", () => {
  const text = footballWebsiteText(
    '<style>hidden</style><table><tr><td>South Walton</td><td>at Freeport</td><td>Sep 18, 2026</td></tr></table><a href="/tickets">Tickets</a><script>ignore me()</script>',
    "https://school.example/football",
  );
  assert.match(text, /South Walton at Freeport Sep 18, 2026/);
  assert.match(text, /https:\/\/school.example\/tickets/);
  assert.doesNotMatch(text, /hidden|ignore me/);
  for (const address of [
    "127.0.0.1",
    "10.0.0.1",
    "192.168.1.1",
    "169.254.169.254",
    "::1",
    "::ffff:127.0.0.1",
    "fe80::1",
    "fc00::1",
  ])
    assert.equal(isPublicSourceAddress(address), false, address);
  assert.equal(isPublicSourceAddress("8.8.8.8"), true);
});
test("the prefill endpoint and editor never create a draft or change templates while parsing", () => {
  const route = fs.readFileSync(
    path.join(process.cwd(), "src/app/api/football/prefill/route.ts"),
    "utf8",
  );
  assert.match(route, /if \(!user.ok\)/);
  assert.match(route, /openAiOnly: true/);
  assert.doesNotMatch(route, /insertEvent|createDiscoveryShell|uploadDiscoveryInputToBlob/);
  const editor = fs.readFileSync(
    path.join(process.cwd(), "src/app/event/football-season/customize/page.tsx"),
    "utf8",
  );
  const parse = editor.slice(
    editor.indexOf("const handleDiscoverParse"),
    editor.indexOf("const renderDiscoverEditor"),
  );
  assert.doesNotMatch(parse, /router.push|setPageTemplateId|\/api\/history|\/api\/discovery/);
});
