import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);
const row = (id, data = {}) => ({ id, title: "Calendar appointment", data: {
  startISO: "2026-11-02T08:10:00", endISO: "2026-11-02T09:10:00", timezone: "America/Chicago", ...data,
} });

function harness() {
  const h = { account: { ok: true, userId: "owner-a" }, records: new Map(), queries: [], events: new Map(), failEvents: false };
  h.events.set("owner-a", [row("event-a")]);
  h.events.set("owner-b", [row("event-b")]);
  const cache = new Map();
  function load(relativePath) {
    const filename = path.resolve(relativePath);
    if (cache.has(filename)) return cache.get(filename);
    const { outputText } = ts.transpileModule(readFileSync(filename, "utf8"), {
      compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
    });
    const module = { exports: {} };
    vm.runInNewContext(outputText, {
      module, exports: module.exports, URL, Date,
      require: (name) => {
        if (name === "@/lib/auth") return { getAuthenticatedRequestUser: async () => h.account };
        if (name === "@/lib/absolute-url") return { absoluteUrl: async (value = "") => `https://envitefy.com${value}` };
        if (name === "@/lib/db") return { query: async (sql, values = []) => {
          h.queries.push({ sql, values });
          if (sql.includes("CREATE TABLE")) return { rows: [] };
          if (sql.includes("INSERT INTO apple_calendar_subscriptions")) {
            if (!h.records.has(values[0])) h.records.set(values[0], { user_id: values[0], token: values[1], last_fetched_at: null });
            return { rows: [h.records.get(values[0])] };
          }
          if (sql.includes("DELETE FROM apple_calendar_subscriptions")) {
            h.records.delete(values[0]); return { rows: [] };
          }
          if (sql.includes("UPDATE apple_calendar_subscriptions")) {
            const record = h.records.get(values[0]);
            if (record?.token === values[1]) record.last_fetched_at = new Date();
            return { rows: [] };
          }
          if (sql.includes("FROM apple_calendar_subscriptions WHERE token")) {
            const record = [...h.records.values()].find(item => item.token === values[0]);
            return { rows: record ? [{ user_id: record.user_id }] : [] };
          }
          if (sql.includes("FROM apple_calendar_subscriptions WHERE user_id")) {
            const record = h.records.get(values[0]); return { rows: record ? [record] : [] };
          }
          if (sql.includes("FROM event_history")) {
            assert.match(sql, /WHERE user_id = \$1/);
            assert.doesNotMatch(sql, /SELECT \*|SELECT.*data,/i);
            if (h.failEvents) throw new Error("Database unavailable");
            return { rows: h.events.get(values[0]) || [] };
          }
          throw new Error(`Unexpected SQL: ${sql}`);
        } };
        if (name.startsWith("@/")) return load(`src/${name.slice(2)}.ts`);
        if (name.startsWith(".")) return load(path.resolve(path.dirname(filename), `${name}.ts`));
        return require(name);
      },
    });
    cache.set(filename, module.exports);
    return module.exports;
  }
  h.manage = load("src/app/api/calendars/apple/route.ts");
  h.feed = load("src/app/api/calendars/apple/feed/[token]/route.ts");
  h.buildFeed = load("src/lib/apple-calendar-feed.ts").buildAppleCalendarFeed;
  h.request = () => new Request("https://envitefy.com/api/calendars/apple");
  h.readFeed = (token) => h.feed.GET(h.request(), { params: Promise.resolve({ token }) });
  h.prepare = async () => (await h.manage.POST(h.request())).json();
  return h;
}

test("viewing Apple setup does not create a subscription or expose a feed token", async () => {
  const h = harness();
  const response = await h.manage.GET(h.request());
  assert.deepEqual(await response.json(), { ready: false, connected: false });
  assert.equal(h.records.size, 0);
  assert.equal(h.queries.length, 1);
  assert.match(response.headers.get("cache-control"), /private, no-store/);
});

test("setup returns a stable private link and reports connected only after a successful feed fetch", async () => {
  const h = harness();
  const prepared = await h.prepare();
  assert.match(prepared.feedUrl, /^https:\/\/envitefy.com\/api\/calendars\/apple\/feed\/[a-f0-9]{64}$/);
  assert.equal(prepared.subscribeUrl, prepared.feedUrl.replace("https:", "webcal:"));
  assert.equal(prepared.connected, false);
  assert.equal((await h.prepare()).feedUrl, prepared.feedUrl);
  const token = prepared.feedUrl.split("/").at(-1);
  const response = await h.readFeed(token);
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /text\/calendar/);
  assert.match(await response.text(), /UID:event-a@envitefy.com/);
  const status = await (await h.manage.GET(h.request())).json();
  assert.deepEqual(status, { ready: true, connected: true });
  assert.equal(status.token, undefined);
});

test("each private link includes only its owner's events and reflects subsequent saved changes", async () => {
  const h = harness();
  const a = await h.prepare();
  h.account = { ok: true, userId: "owner-b" };
  const b = await h.prepare();
  assert.notEqual(a.feedUrl, b.feedUrl);
  const aToken = a.feedUrl.split("/").at(-1);
  const aBody = await (await h.readFeed(aToken)).text();
  assert.match(aBody, /UID:event-a@envitefy.com/);
  assert.doesNotMatch(aBody, /event-b/);
  h.events.set("owner-a", [{ ...row("event-a"), title: "Changed appointment" }]);
  assert.match(await (await h.readFeed(aToken)).text(), /SUMMARY:Changed appointment/);
});

test("disconnect revokes the old link while preserving other users' subscriptions", async () => {
  const h = harness();
  const a = await h.prepare();
  h.account = { ok: true, userId: "owner-b" };
  const b = await h.prepare();
  await h.manage.DELETE(h.request());
  assert.equal((await h.readFeed(b.feedUrl.split("/").at(-1))).status, 404);
  assert.equal((await h.readFeed(a.feedUrl.split("/").at(-1))).status, 200);
  assert.notEqual((await h.prepare()).feedUrl, b.feedUrl);
});

test("unauthenticated management and invalid feed tokens never query event data", async () => {
  const h = harness();
  h.account = { ok: false };
  for (const method of ["GET", "POST", "DELETE"]) {
    assert.equal((await h.manage[method](h.request())).status, 401);
  }
  assert.equal(h.queries.length, 0);
  assert.equal((await h.readFeed("invalid")).status, 404);
  assert.equal(h.queries.length, 0);
  assert.equal((await h.readFeed("a".repeat(64))).status, 404);
  assert.equal(h.queries.some(({ sql }) => sql.includes("event_history")), false);
});

test("a failed feed read returns a retryable error without marking the subscription connected", async () => {
  const h = harness();
  const prepared = await h.prepare();
  h.failEvents = true;
  assert.equal((await h.readFeed(prepared.feedUrl.split("/").at(-1))).status, 503);
  assert.equal((await (await h.manage.GET(h.request())).json()).connected, false);
});

test("feed skips drafts, cancelled and undated events and preserves timed and all-day dates", () => {
  const h = harness();
  const text = h.buildFeed([
    row("timed"), row("draft", { draftStatus: "draft" }), row("cancelled", { status: "cancelled" }),
    row("undated", { startISO: null }), row("all-day", { startISO: "2026-11-02", endISO: "2026-11-03", allDay: true }),
    { ...row("escaped"), title: "Title\nLOCATION:injected" },
  ], "https://envitefy.com");
  assert.match(text, /DTSTART:20261102T141000Z/);
  assert.match(text, /DTSTART;VALUE=DATE:20261102/);
  assert.match(text, /DTEND;VALUE=DATE:20261103/);
  assert.doesNotMatch(text, /UID:(draft|cancelled|undated)@/);
  assert.doesNotMatch(text, /\r\nLOCATION:injected/);
  assert.equal((text.match(/BEGIN:VEVENT/g) || []).length, 3);
});
