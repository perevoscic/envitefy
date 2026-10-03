import assert from "node:assert/strict";
import test from "node:test";
import { parseEventWeatherTarget } from "./event-weather.ts";
import { getEventWeather } from "./event-weather-server.ts";

test("weather requests reject invalid dates, times and locations without replacing missing facts", () => {
  assert.deepEqual(parseEventWeatherTarget({ location: " Beach ", date: "2026-10-05", time: "09:30" }), { location: "Beach", date: "2026-10-05", time: "09:30" });
  assert.deepEqual(parseEventWeatherTarget({ location: "", date: "", time: "" }), { location: "", date: "", time: "" });
  for (const patch of [{ date: "2026-02-30" }, { time: "24:00" }, { date: "tomorrow" }, { location: "x".repeat(1001) }, { location: "Beach\nPark" }, { time: null }]) {
    assert.equal(parseEventWeatherTarget({ location: "Beach", date: "2026-10-05", time: "09:30", ...patch }), null);
  }
});

test("weather uses the venue's local day and event hour, caches lookups, and never substitutes current weather", async (t) => {
  t.mock.timers.enable({ apis: ["Date"], now: Date.parse("2026-10-03T23:00:00Z") });
  const oldKey = process.env.WEATHERAPI_KEY;
  process.env.WEATHERAPI_KEY = "test-key";
  t.after(() => { if (oldKey === undefined) delete process.env.WEATHERAPI_KEY; else process.env.WEATHERAPI_KEY = oldKey; });
  const day = { condition: { text: "Partly cloudy" }, avgtemp_f: 77, avgtemp_c: 25, maxtemp_f: 82, maxtemp_c: 28, mintemp_f: 68, mintemp_c: 20, daily_chance_of_rain: 35, maxwind_mph: 14, maxwind_kph: 23 };
  const payload = {
    location: { name: "Panama City Beach", region: "Florida", localtime: "2026-10-03 18:00" },
    current: { temp_f: 99, condition: { text: "Wrong current weather" } },
    forecast: { forecastday: [{ date: "2026-10-05", day, hour: [
      { time: "2026-10-05 08:00", temp_f: 70, temp_c: 21, condition: { text: "Wrong hour" } },
      { time: "2026-10-05 09:00", temp_f: 75, temp_c: 24, condition: { text: "Sunny" }, chance_of_rain: 0, wind_mph: 0, wind_kph: 0 },
    ] }] },
  };
  let calls = 0;
  t.mock.method(globalThis, "fetch", async (url) => {
    calls++;
    assert.equal(url.hostname, "api.weatherapi.com");
    assert.equal(url.searchParams.get("days"), "3");
    assert.equal(url.searchParams.get("q"), "30.123,-85.789");
    return Response.json(payload);
  });
  const target = { location: "30.123,-85.789", date: "2026-10-05", time: "09:30" };
  const [result, simultaneous] = await Promise.all([getEventWeather(target), getEventWeather(target)]);
  assert.equal(calls, 1);
  assert.deepEqual(result, simultaneous);
  assert.equal(result.status, "available");
  assert.equal(result.tempF, 75);
  assert.equal(result.tempC, 24);
  assert.equal(result.summary, "Sunny");
  assert.equal(result.time, "09:00");
  assert.equal(result.rainChance, 0);
  assert.equal(result.windMph, 0);
  assert.equal(result.location, "Panama City Beach, Florida");
  assert.deepEqual(await getEventWeather(target), result);
  assert.equal(calls, 1);
  const daily = await getEventWeather({ ...target, time: "" });
  assert.equal(daily.tempF, 77);
  assert.equal(daily.time, null);
  assert.equal(daily.rainChance, 35);
  assert.equal((await getEventWeather({ ...target, date: "2026-10-04" })).status, "outside_window");
  assert.equal((await getEventWeather({ ...target, time: "10:00" })).status, "unavailable");
  const before = calls;
  assert.equal((await getEventWeather({ ...target, date: "2026-11-01" })).status, "outside_window");
  assert.equal((await getEventWeather({ ...target, date: "2026-09-01" })).status, "past");
  assert.equal((await getEventWeather({ ...target, location: "" })).status, "missing_details");
  assert.equal(calls, before);
});

test("missing metrics stay absent and provider failures produce an unavailable state", async (t) => {
  t.mock.timers.enable({ apis: ["Date"], now: Date.parse("2026-10-03T23:00:00Z") });
  const oldKey = process.env.WEATHERAPI_KEY;
  process.env.WEATHERAPI_KEY = "test-key";
  t.after(() => { if (oldKey === undefined) delete process.env.WEATHERAPI_KEY; else process.env.WEATHERAPI_KEY = oldKey; });
  const target = { location: "30.124,-85.789", date: "2026-10-05", time: "" };
  t.mock.method(globalThis, "fetch", async () => Response.json({ location: {}, forecast: { forecastday: [{ date: target.date, day: { condition: { text: "Cloudy" }, avgtemp_f: null } }] } }));
  const result = await getEventWeather(target);
  assert.equal(result.status, "available");
  for (const metric of ["tempF", "tempC", "highF", "lowC", "rainChance", "windMph"]) assert.equal(result[metric], null);
  globalThis.fetch.mock.mockImplementation(async () => { throw new Error("Provider timed out"); });
  assert.equal((await getEventWeather({ ...target, location: "30.125,-85.789" })).status, "unavailable");
});
