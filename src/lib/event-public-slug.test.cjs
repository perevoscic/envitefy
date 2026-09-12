const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const ts = require("typescript");
const { randomUUID } = require("node:crypto");

function loadSource(file, mocks = {}) {
  const filename = path.resolve(file);
  const code = ts.transpileModule(fs.readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {};
  new Function("require", "exports", code)((name) => {
    if (name in mocks) return mocks[name];
    if (name.startsWith(".") || name.startsWith("@/")) {
      let next = name.startsWith("@/") ? path.join(process.cwd(), "src", name.slice(2)) : path.resolve(path.dirname(filename), name);
      if (!path.extname(next)) next += ".ts";
      return loadSource(next, mocks);
    }
    return require(name);
  }, exports);
  return exports;
}
const slugs = loadSource("src/utils/event-public-slug.ts");
const { suggestFootballPublicSlug } = loadSource("src/lib/football-custom-url.ts");

test("custom URLs normalize readable names and reject unusable or reserved addresses", () => {
  assert.deepEqual(slugs.validateCustomEventPublicSlug("Seahawks at Vikings 2026"), { slug: "seahawks-at-vikings-2026", error: null });
  for (const input of ["", "!!!", "football", "football-season", "schedule", "manual", "new", "event", "a".repeat(97), "https://example.com/game", "game?x=1", "../game", `game-${randomUUID()}`, 23]) {
    assert.ok(slugs.validateCustomEventPublicSlug(input).error, String(input));
  }
});

test("URL suggestions use short matchup names for one game and season names for schedules", () => {
  const input = { teamName: "South Walton High School", season: "2026", games: [{ id: "1", opponent: "Fort Walton Beach", homeAway: "away", date: "2026-09-18" }] };
  assert.equal(suggestFootballPublicSlug(input), "seahawks-at-vikings-2026");
  assert.equal(suggestFootballPublicSlug({ ...input, games: [...input.games, { id: "2", opponent: "Bayview" }] }), "seahawks-football-2026");
});

function databaseFixture() {
  let rows = new Map();
  let aliases = new Map();
  let tail = Promise.resolve();
  let failUpdate = false;
  const statements = [];
  const result = (row) => ({ rows: row ? [structuredClone(row)] : [] });
  async function query(sql, args = []) {
    const statement = sql.replace(/\s+/g, " ").trim().toLowerCase();
    statements.push(statement);
    if (statement.startsWith("select exists")) {
      const [slug, except] = args;
      return result({ taken: [...rows.values()].some(row => row.public_slug === slug && row.id !== except) || (aliases.has(slug) && aliases.get(slug) !== except) });
    }
    if (statement.startsWith("select id, user_id")) return result(rows.get(args[0]));
    if (statement.startsWith("insert into event_history")) {
      if (rows.has(args[0])) return result();
      const row = { id: args[0], user_id: args[1], title: args[2], data: JSON.parse(args[3]), public_slug: args[4] };
      rows.set(row.id, row);
      return result(row);
    }
    if (statement.startsWith("insert into event_public_slug_aliases")) {
      if (!aliases.has(args[0])) aliases.set(args[0], args[1]);
      return result();
    }
    if (statement.startsWith("update event_history")) {
      if (failUpdate) throw new Error("simulated write failure");
      const row = rows.get(args[0]);
      row.public_slug = args[1];
      row.data = { ...(args[2] ? JSON.parse(args[2]) : row.data), publicSlug: args[1] };
      row.title = args[3] ?? row.title;
      return result(row);
    }
    if (statement.startsWith("delete from event_public_slug_aliases")) {
      if (aliases.get(args[1]) === args[0]) aliases.delete(args[1]);
      return result();
    }
    throw new Error(`Unhandled query: ${statement}`);
  }
  async function withClient(work) {
    let release;
    let snapshot;
    const client = { async query(sql, args) {
      if (sql === "begin") return result();
      if (sql.includes("pg_advisory_xact_lock")) {
        const previous = tail;
        tail = new Promise(resolve => { release = resolve; });
        await previous;
        snapshot = structuredClone({ rows, aliases });
        return result();
      }
      if (sql === "rollback") { rows = snapshot.rows; aliases = snapshot.aliases; release(); return result(); }
      if (sql === "commit") { release(); return result(); }
      return query(sql, args);
    } };
    return work(client);
  }
  // Run the actual persistence functions with a transactional database double.
  const source = fs.readFileSync("src/lib/db.ts", "utf8");
  const section = source.slice(source.indexOf("function addPublicSlugToData"), source.indexOf("export async function getEventHistoryById"));
  const code = ts.transpileModule(section, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const dependencies = {
    ...slugs, randomUUID, query, withClient, ensureEventPublicSlugSchema: async () => {},
    sanitizeJsonValueForPostgres: structuredClone, normalizeCanonicalStartFields: () => {},
    getEventHistoryById: async id => rows.get(id),
  };
  const api = {};
  new Function(...Object.keys(dependencies), "exports", code)(...Object.values(dependencies), api);
  return { api, row: id => rows.get(id), alias: slug => aliases.get(slug), failNextUpdate: () => { failUpdate = true; }, statements };
}

test("publishing reserves the exact chosen URL and rejects duplicates without inserting an event", async () => {
  const db = databaseFixture();
  const row = await db.api.insertEventHistory({ userId: "owner", title: "Football", publicSlug: "seahawks-at-vikings-2026", data: { status: "published" } });
  assert.equal(row.public_slug, "seahawks-at-vikings-2026");
  assert.equal(row.data.publicSlug, row.public_slug);
  await assert.rejects(db.api.insertEventHistory({ title: "Other", publicSlug: row.public_slug, data: {} }), /already in use/);
  assert.equal(db.statements.filter(sql => sql.startsWith("insert into event_history")).length, 1);
  const automatic = await db.api.insertEventHistory({ title: "seahawks at vikings 2026", data: {} });
  assert.equal(automatic.public_slug, "seahawks-at-vikings-2026-2");
});

test("renaming saves content and URL together and preserves old links as reserved aliases", async () => {
  const db = databaseFixture();
  const row = await db.api.insertEventHistory({ title: "Original", publicSlug: "old-football-link", data: { status: "draft" } });
  const updated = await db.api.updateEventHistoryPublicSlug({ id: row.id, publicSlug: "seahawks-at-vikings-2026", title: "Seahawks at Vikings", data: { status: "published", games: ["fixture"] } });
  assert.equal(updated.title, "Seahawks at Vikings");
  assert.equal(updated.data.status, "published");
  assert.equal(db.alias("old-football-link"), row.id);
  assert.equal(await db.api.isEventPublicSlugAvailable("old-football-link"), false);
  assert.equal(await db.api.isEventPublicSlugAvailable("old-football-link", row.id), true);
  await assert.rejects(db.api.insertEventHistory({ title: "Other", publicSlug: "old-football-link", data: {} }), /already in use/);
  await db.api.updateEventHistoryPublicSlug({ id: row.id, publicSlug: "old-football-link" });
  assert.equal(db.row(row.id).public_slug, "old-football-link");
  assert.equal(db.alias("old-football-link"), undefined);
});

test("failed updates roll back both the URL and its alias, and concurrent claims have one winner", async () => {
  const db = databaseFixture();
  const row = await db.api.insertEventHistory({ title: "Original", publicSlug: "original-game", data: { status: "draft" } });
  db.failNextUpdate();
  await assert.rejects(db.api.updateEventHistoryPublicSlug({ id: row.id, publicSlug: "new-game", data: { status: "published" } }), /simulated/);
  assert.equal(db.row(row.id).public_slug, "original-game");
  assert.equal(db.row(row.id).data.status, "draft");
  assert.equal(db.alias("original-game"), undefined);
  const competing = databaseFixture();
  const responses = await Promise.allSettled([1, 2].map(() => competing.api.insertEventHistory({ title: "Game", publicSlug: "same-game", data: {} })));
  assert.equal(responses.filter(item => item.status === "fulfilled").length, 1);
  assert.equal(responses.filter(item => item.status === "rejected").length, 1);
});

test("availability checks require authentication and ownership, and never save a draft", async () => {
  let authenticated = true;
  let owned = true;
  const calls = [];
  const endpoint = loadSource("src/app/api/events/public-slug/route.ts", {
    "@/lib/auth": { getAuthenticatedRequestUser: async () => authenticated ? { ok: true, userId: "owner" } : { ok: false } },
    "@/lib/db": {
      getEventHistoryOwnerById: async () => ({ user_id: owned ? "owner" : "other" }),
      isEventPublicSlugAvailable: async (...args) => { calls.push(args); return args[0] !== "taken-game"; },
    },
  });
  const get = query => endpoint.GET(new Request(`http://localhost/api/events/public-slug?${query}`));
  authenticated = false;
  assert.equal((await get("slug=test-game")).status, 401);
  authenticated = true;
  assert.equal((await get("slug=football")).status, 400);
  owned = false;
  assert.equal((await get(`slug=test-game&eventId=${randomUUID()}`)).status, 403);
  assert.equal(calls.length, 0);
  owned = true;
  const id = randomUUID();
  assert.deepEqual(await (await get(`slug=Seahawks%20at%20Vikings%202026&eventId=${id}`)).json(), { slug: "seahawks-at-vikings-2026", available: true });
  assert.deepEqual(calls[0], ["seahawks-at-vikings-2026", id]);
  assert.equal((await (await get("slug=taken-game")).json()).available, false);
});

test("explicit draft saves retain a chosen URL without changing the published address", async () => {
  const originalFetch = global.fetch;
  const originalWindow = global.window;
  const writes = [];
  try {
    global.window = { dispatchEvent() {} };
    global.fetch = async (_url, options) => {
      if (!options.method) return Response.json({ id: "existing", data: { title: "Published game", status: "published", publicSlug: "old-game-link" } });
      writes.push(JSON.parse(options.body));
      return Response.json({ id: "existing" });
    };
    const { saveManualEventProgress } = loadSource("src/lib/manual-event-progress.ts", {
      "./template-draft-storage": { retainDraftMedia: async () => {}, replaceDraftMedia: structuredClone },
    });
    await saveManualEventProgress({ eventId: "existing", snapshot: { data: { title: "New game title", publicSlugInput: "seahawks-at-vikings-2026" } }, category: "sport_football_season", path: "/event/football/customize", clientDraftId: randomUUID() });
    assert.equal(writes.length, 1);
    assert.equal(writes[0].publicSlug, undefined);
    assert.equal(writes[0].data.publicSlug, "old-game-link");
    assert.equal(writes[0].data.manualEditor.snapshot.data.publicSlugInput, "seahawks-at-vikings-2026");
  } finally {
    global.fetch = originalFetch;
    global.window = originalWindow;
  }
});
