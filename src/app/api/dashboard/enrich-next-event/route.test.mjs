import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";
import * as dashboardData from "../../../../lib/dashboard-data.ts";
import * as travelCache from "../../../../lib/dashboard-travel-cache.ts";

const { outputText } = ts.transpileModule(
  readFileSync(new URL("./route.ts", import.meta.url), "utf8"),
  {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  },
);
let sequence = 0;
function harness({
  profile = { home: { lat: 41.88, lng: -87.63 } },
  destination = true,
  mapToken = "test-token",
  duration = 1500,
} = {}) {
  const state = { userId: "first", profile, duration, requests: [], sql: [] };
  const event = {
    id: `event-${++sequence}`,
    startAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    locationLat: destination ? 42 : null,
    locationLng: destination ? -88 : null,
    locationText: null,
  };
  const timing = {
    enabled: false,
    time: (_name, fn) => fn(),
    applyHeader: () => {},
    toObject: () => ({}),
  };
  const dependencies = {
    "next/server": { NextResponse: { json: (body, init) => Response.json(body, init) } },
    "@/lib/auth": { getAuthenticatedRequestUser: async () => ({ ok: true, userId: state.userId }) },
    "@/lib/db": {
      query: async (sql) => {
        state.sql.push(sql);
        if (sql.includes("select feature_visibility"))
          return { rows: [{ feature_visibility: state.profile }] };
        if (sql.includes("from event_metrics_cache"))
          return {
            rows: [
              {
                event_id: event.id,
                travel_minutes: 90,
                travel_updated_at: new Date().toISOString(),
                weather_summary: null,
                weather_temp: null,
                weather_updated_at: null,
              },
            ],
          };
        return { rows: [] };
      },
    },
    "@/lib/dashboard-data": dashboardData,
    "@/lib/dashboard-travel-cache": travelCache,
    "@/lib/dashboard-query": {
      listDashboardEventsForUser: async () => ({ events: [event] }),
      buildDashboardCollections: (events) => ({ upcoming: events }),
    },
    "@/lib/server-timing": {
      createServerTimingTracker: () => timing,
      isTimingRequested: () => false,
    },
  };
  const loaded = { exports: {} };
  new Function("require", "module", "exports", "process", "fetch", outputText)(
    (name) => {
      assert.ok(dependencies[name], name);
      return dependencies[name];
    },
    loaded,
    loaded.exports,
    { env: { MAPBOX_ACCESS_TOKEN: mapToken, WEATHERAPI_KEY: "test-weather" } },
    async (url) => {
      state.requests.push(String(url));
      if (String(url).includes("/geocoding/"))
        return Response.json({ features: [{ center: [-87.63, 41.88] }] });
      assert.match(String(url), /api\.mapbox\.com\/directions/);
      return Response.json({ routes: [{ duration: state.duration, distance: 18000 }] });
    },
  );
  return {
    state,
    event,
    post: async (body = {}) => {
      const response = await loaded.exports.POST(
        new Request("http://localhost/api/dashboard/enrich-next-event", {
          method: "POST",
          body: JSON.stringify({ eventId: event.id, ...body }),
          headers: { "Content-Type": "application/json" },
        }),
      );
      assert.equal(response.status, 200);
      return response.json();
    },
  };
}

test("automatic travel uses the profile origin beyond 72 hours and ignores shared drive metrics", async () => {
  const app = harness();
  const result = await app.post();
  assert.equal(result.metrics.travelMinutes, 25);
  assert.equal(result.metrics.travelDistanceKm, 18);
  assert.equal(result.metrics.travelOriginLabel, "home");
  assert.equal(result.meta.originSource, "profile");
  assert.equal(result.meta.travelStatus, "ready");
  assert.equal(result.meta.weatherWindowEligible, false);
  assert.equal(app.state.requests.length, 1);
  assert.match(app.state.requests[0], /driving\/-87\.63,41\.88;-88,42/);
  assert.ok(!app.state.sql.some((sql) => sql.includes("insert into event_metrics_cache")));
});

test("missing or malformed body coordinates fall back to a real profile origin, never zero-zero", async () => {
  const app = harness();
  for (const origin of [
    {},
    { originLat: null, originLng: null },
    { originLat: "", originLng: false },
    { originLat: [], originLng: {} },
    { originLat: 91, originLng: 181 },
  ]) {
    const result = await app.post(origin);
    assert.equal(result.meta.originSource, "profile");
    assert.equal(result.metrics.travelMinutes, 25);
  }
  assert.equal(app.state.requests.length, 1);
});

test("a saved profile address can supply the automatic origin without browser coordinates", async () => {
  const app = harness({ profile: { homeAddress: "Test home address" } });
  const result = await app.post();
  assert.equal(result.meta.originSource, "profile-geocoded");
  assert.equal(result.metrics.travelMinutes, 25);
  assert.equal(app.state.requests.length, 2);
});

test("automatic drive caches vary by account, origin and venue; refresh bypasses the cached estimate", async () => {
  const app = harness();
  const location = { originLat: 40, originLng: -87, originLabel: "current location" };
  assert.equal((await app.post(location)).meta.travelUsedCache, false);
  assert.equal((await app.post(location)).meta.travelUsedCache, true);
  assert.equal(app.state.requests.length, 1);
  app.state.userId = "second";
  assert.equal((await app.post(location)).meta.travelUsedCache, false);
  assert.equal((await app.post({ ...location, originLat: 39 })).meta.travelUsedCache, false);
  app.event.locationLat = 43;
  const changed = await app.post(location);
  assert.equal(changed.meta.travelUsedCache, false);
  assert.equal(changed.metrics.travelOriginLabel, "current location");
  app.state.duration = 1800;
  assert.equal((await app.post({ ...location, forceTravel: true })).metrics.travelMinutes, 30);
  assert.equal(app.state.requests.length, 5);
});

test("missing origins and venues produce actionable statuses without invented drive times", async () => {
  for (const profile of [
    null,
    { home: { lat: null, lng: null } },
    { home: { lat: [], lng: [] } },
    { home: { lat: 190, lng: 300 } },
  ]) {
    const app = harness({ profile });
    const result = await app.post();
    assert.equal(result.metrics.travelMinutes, null);
    assert.equal(result.meta.travelStatus, "needs-origin");
    assert.equal(app.state.requests.length, 0);
  }
  const app = harness({ destination: false });
  assert.equal((await app.post()).meta.travelStatus, "needs-destination");
  assert.equal(app.state.requests.length, 0);
});

test("unavailable routing and empty provider durations are not presented as a drive estimate", async () => {
  for (const options of [{ mapToken: null }, { duration: null }, { duration: -1 }]) {
    const app = harness(options);
    const result = await app.post();
    assert.equal(result.metrics.travelMinutes, null);
    assert.equal(result.meta.travelStatus, "unavailable");
  }
});

test("travel cache expires after one hour", () => {
  const now = Date.now();
  const key = travelCache.dashboardTravelCacheKey(
    "first",
    "expiry",
    { lat: 1, lng: 2 },
    { lat: 3, lng: 4 },
  );
  travelCache.cacheDashboardDriveEstimate(key, {
    minutes: 25,
    distanceKm: 18,
    updatedAt: new Date(now).toISOString(),
  });
  assert.equal(travelCache.getDashboardDriveEstimate(key, now + 59 * 60 * 1000).minutes, 25);
  assert.equal(travelCache.getDashboardDriveEstimate(key, now + 60 * 60 * 1000), null);
});

test("an event outside the user's upcoming collection cannot be enriched", async () => {
  const app = harness();
  assert.equal((await app.post({ eventId: "another-account-event" })).metrics, null);
  assert.equal(app.state.requests.length, 0);
});
