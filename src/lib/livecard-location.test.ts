import { test } from "node:test";
import assert from "node:assert/strict";
import { chooseBuilderPlace, isOnlineEventLocation, type BuilderPlace } from "./livecard-location";
import { resolveBuilderPlace, searchBuilderLocation } from "./livecard-location-server";

const place: BuilderPlace = {
  placeId: "amc-1",
  venue: "AMC Grand Boulevard 10",
  address: "465 Grand Boulevard, Miramar Beach, FL 32550, USA",
  city: "Miramar Beach",
  latitude: 30.376,
  longitude: -86.313,
};
test("venue selection needs a unique geographical match and honors supplied address conflicts", () => {
  assert.equal(chooseBuilderPlace([place], "AMC Grand Boulevard", "Miramar Beach"), place);
  assert.equal(
    chooseBuilderPlace([place, { ...place, placeId: "amc-2" }], "AMC", "Miramar Beach"),
    null,
  );
  assert.equal(chooseBuilderPlace([place], "AMC", ""), null);
  assert.equal(chooseBuilderPlace([place], "AMC", "Chicago"), null);
  assert.equal(chooseBuilderPlace([place], "AMC", "Miramar Beach", "123 Main St"), null);
  assert.equal(chooseBuilderPlace([place], "", "", "465 Grand Blvd, Miramar Beach"), place);
  const regional = { ...place, region: "Florida" };
  assert.equal(chooseBuilderPlace([regional], "AMC", "Miramar Beach, Florida"), regional);
});

test("place resolution uses provider coordinates and IANA timezone; timezone failure retains the address", async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.GOOGLE_MAPS_API_KEY;
  process.env.GOOGLE_MAPS_API_KEY = "test-key";
  let timezoneFails = false;
  const calls: URL[] = [];
  const raw = {
    id: place.placeId,
    displayName: { text: place.venue },
    formattedAddress: place.address,
    location: { latitude: place.latitude, longitude: place.longitude },
    addressComponents: [{ types: ["locality"], longText: place.city }],
  };
  globalThis.fetch = (async (input: string | URL | Request) => {
    const url = new URL(
      typeof input === "string" ? input : input instanceof URL ? input.href : input.url,
    );
    calls.push(url);
    if (url.hostname === "maps.googleapis.com")
      return Response.json(
        timezoneFails
          ? { status: "REQUEST_DENIED" }
          : { status: "OK", timeZoneId: "America/Chicago" },
      );
    return Response.json(url.pathname.endsWith("places:searchText") ? { places: [raw] } : raw);
  }) as typeof fetch;
  try {
    const found = await searchBuilderLocation({
      query: "AMC Grand Boulevard Miramar Beach",
      venue: "AMC Grand Boulevard",
      city: "Miramar Beach",
      date: "2026-09-26",
      timezone: "America/Los_Angeles",
    });
    assert.equal(found.location?.address, place.address);
    assert.equal(found.location?.timezone, "America/Chicago");
    assert.equal(found.location?.resolution, "verified");
    assert.equal(calls[2].searchParams.get("location"), "30.376,-86.313");
    assert.equal(
      calls[2].searchParams.get("timestamp"),
      String(Date.parse("2026-09-26T12:00:00Z") / 1000),
    );
    timezoneFails = true;
    const fallback = await resolveBuilderPlace(place.placeId, "bad-date");
    assert.equal(fallback.address, place.address);
    assert.equal(fallback.timezone, "");
    assert.notEqual(calls.at(-1)?.searchParams.get("timestamp"), "NaN");
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.GOOGLE_MAPS_API_KEY;
    else process.env.GOOGLE_MAPS_API_KEY = originalKey;
  }
});

test("online meetings retain their link and organizer-selected local timezone", async () => {
  const result = await searchBuilderLocation({
    query: "https://zoom.us/j/123",
    date: "2026-09-26",
    timezone: "Europe/London",
  });
  assert.equal(result.location?.resolution, "online");
  assert.equal(result.location?.timezone, "Europe/London");
  assert.equal(isOnlineEventLocation("javascript:alert(1)"), false);
});
