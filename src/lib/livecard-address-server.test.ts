import assert from "node:assert/strict";
import { test } from "node:test";
import { searchBuilderLocation } from "./livecard-location-server";
import { locationTimezone } from "./livecard-location-timezone";

// Synthetic provider response: the coordinates are in Seattle. No live lookup is made.
const feature = () => ({
  properties: {
    mapbox_id: "synthetic-address-1",
    feature_type: "address",
    name: "62 Cedar Grove Drive",
    full_address: "62 Cedar Grove Drive, Seattle, Washington 98101, United States",
    context: {
      address: { address_number: "62" },
      place: { name: "Seattle" },
      region: { name: "Washington", region_code: "WA" },
      country: { name: "United States", country_code: "US" },
    },
    coordinates: { latitude: 47.6062, longitude: -122.3321, accuracy: "rooftop" },
    match_code: {
      address_number: "matched",
      street: "matched",
      place: "unmatched",
      confidence: "medium",
    },
  },
});
const input = {
  query: "62 Ceder Grove Dr",
  date: "2026-09-26",
  timezone: "America/Chicago",
  id: "home",
};

async function withMapbox(
  run: (
    requests: URL[],
    setResponse: (features: unknown[], status?: number) => void,
  ) => Promise<void>,
) {
  const keys = [
    "MAPBOX_API_KEY",
    "MAPBOX_ACCESS_TOKEN",
    "GOOGLE_MAPS_API_KEY",
    "GOOGLE_PLACES_API_KEY",
    "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY",
    "OPENAI_API_KEY",
  ];
  const saved = keys.map((key) => process.env[key]);
  const previousFetch = globalThis.fetch;
  keys.forEach((key) => {
    delete process.env[key];
  });
  process.env.MAPBOX_API_KEY = "test-mapbox-key";
  let features: unknown[] = [feature()];
  let status = 200;
  const requests: URL[] = [];
  globalThis.fetch = (async (value: string | URL | Request) => {
    const url = new URL(String(value));
    assert.equal(
      url.hostname,
      "api.mapbox.com",
      "addresses never depend on Google or public-venue web research",
    );
    assert.equal(url.searchParams.get("access_token"), "test-mapbox-key");
    assert.equal(url.searchParams.get("permanent"), "true");
    assert.equal(url.searchParams.get("autocomplete"), "false");
    assert.equal(url.searchParams.get("types"), "address");
    assert.equal(
      url.searchParams.has("proximity"),
      false,
      "the host's location cannot bias a match",
    );
    requests.push(url);
    return Response.json({ features }, { status });
  }) as typeof fetch;
  try {
    await run(requests, (next, nextStatus = 200) => {
      features = next;
      status = nextStatus;
    });
  } finally {
    globalThis.fetch = previousFetch;
    keys.forEach((key, i) => {
      if (saved[i] === undefined) delete process.env[key];
      else process.env[key] = saved[i];
    });
  }
}

test("a unique geocoded street address resolves without a city, Google key, or venue website", async () => {
  await withMapbox(async (requests) => {
    const result = await searchBuilderLocation(input);
    assert.equal(requests.length, 1);
    assert.equal(requests[0].searchParams.get("q"), input.query);
    assert.equal(result.location?.id, "home");
    assert.equal(result.location?.address, feature().properties.full_address);
    assert.equal(result.location?.placeId, "mapbox:synthetic-address-1");
    assert.equal(
      result.location?.timezone,
      "America/Los_Angeles",
      "use provider coordinates, not the host timezone",
    );
    assert.equal(result.location?.resolution, "verified");
  });
});

test("provider-backed spelling and suffix corrections retain the exact house number and supplied city", async () => {
  await withMapbox(async (_requests, respond) => {
    assert.ok(
      (await searchBuilderLocation({ ...input, query: "62 Cedar Grove Dr, Seattle, WA 98101" }))
        .location,
    );
    assert.equal(
      (await searchBuilderLocation({ ...input, query: "63 Ceder Grove Dr" })).location,
      null,
    );
    assert.equal((await searchBuilderLocation({ ...input, city: "Chicago" })).location, null);
    assert.equal(
      (await searchBuilderLocation({ ...input, query: "62 Completely Different Dr" })).location,
      null,
    );
    const approximate = feature();
    approximate.properties.match_code.address_number = "plausible";
    approximate.properties.coordinates.accuracy = "interpolated";
    respond([approximate]);
    assert.equal(
      (await searchBuilderLocation(input)).location,
      null,
      "interpolation is not a confirmed property",
    );
  });
});

test("multiple matching addresses remain choices; selecting one rechecks its provider identity", async () => {
  await withMapbox(async (requests, respond) => {
    const other = feature();
    other.properties.mapbox_id = "synthetic-address-2";
    other.properties.context.place.name = "Elsewhere";
    other.properties.full_address = "62 Cedar Grove Drive, Elsewhere, Washington";
    respond([feature(), other]);
    const result = await searchBuilderLocation(input);
    assert.equal(result.location, null);
    assert.equal(result.candidates.length, 2);
    respond([other]);
    const selected = await searchBuilderLocation({
      ...input,
      placeId: result.candidates[1].placeId,
    });
    assert.equal(requests.at(-1)?.searchParams.get("q"), "synthetic-address-2");
    assert.equal(selected.location?.address, other.properties.full_address);
    respond([feature()]);
    assert.equal(
      (await searchBuilderLocation({ ...input, placeId: "mapbox:synthetic-address-2" })).location,
      null,
      "a different result cannot replace the selected address",
    );
  });
});

test("lower-confidence corrections ask for a choice and cannot automatically publish", async () => {
  await withMapbox(async (_requests, respond) => {
    const uncertain = feature();
    uncertain.properties.match_code.confidence = "low";
    respond([uncertain]);
    const result = await searchBuilderLocation(input);
    assert.equal(result.location, null);
    assert.equal(result.candidates.length, 1);
  });
});

test("an outage is distinct from no matching address and never launches venue research", async () => {
  await withMapbox(async (_requests, respond) => {
    respond([], 503);
    await assert.rejects(searchBuilderLocation(input), /temporarily unavailable/);
    respond([]);
    const result = await searchBuilderLocation(input);
    assert.equal(result.location, null);
    assert.match(result.message, /city or ZIP/);
  });
});

test("coordinate timezones handle split-timezone states and invalid points", () => {
  assert.equal(locationTimezone(30.376, -86.313), "America/Chicago");
  assert.equal(locationTimezone(25.7617, -80.1918), "America/New_York");
  assert.equal(locationTimezone(NaN, -80), "");
  assert.equal(locationTimezone(91, 0), "");
  assert.equal(locationTimezone(0, 181), "");
});
