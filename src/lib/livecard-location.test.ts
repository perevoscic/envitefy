import assert from "node:assert/strict";
import { test } from "node:test";
import { type BuilderPlace, chooseBuilderPlace, isOnlineEventLocation } from "./livecard-location";
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
  assert.equal(chooseBuilderPlace([place], "AMC Grand", ""), null);
  assert.equal(chooseBuilderPlace([place], "AMC", "Chicago"), null);
  assert.equal(chooseBuilderPlace([place], "AMC", "Miramar Beach", "123 Main St"), null);
  assert.equal(chooseBuilderPlace([place], "", "", "465 Grand Blvd, Miramar Beach"), place);
  const regional = { ...place, region: "Florida" };
  assert.equal(chooseBuilderPlace([regional], "AMC", "Miramar Beach, Florida"), regional);
});

test("specific venue names resolve without requiring a city; ambiguous branches remain choices", () => {
  assert.equal(chooseBuilderPlace([place], "AMC Grand Boulevard", ""), place);
  assert.equal(chooseBuilderPlace([place], place.venue, ""), place);
  assert.equal(chooseBuilderPlace([place], "AMC", ""), null);
  assert.equal(chooseBuilderPlace([place], "Unlisted venue", ""), null);
  const otherBranch = {
    ...place,
    placeId: "amc-2",
    address: "10 Main St, Destin, FL",
    city: "Destin",
  };
  assert.equal(chooseBuilderPlace([place, otherBranch], place.venue, ""), null);
  assert.equal(chooseBuilderPlace([place, otherBranch], place.venue, "Miramar Beach"), place);
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
    const venueOnly = await searchBuilderLocation({
      query: "AMC Grand Boulevard",
      date: "2026-09-26",
      timezone: "America/Los_Angeles",
    });
    assert.equal(venueOnly.location?.address, place.address);
    assert.equal(venueOnly.location?.timezone, "America/Chicago");
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

test("deferred results preserve newer queries, unrelated edits, and removed locations", async () => {
  const { mergeResolvedLocation } = await import("./livecard-location");
  const { createLiveCardForm } = await import("./livecard-builder");
  const before = createLiveCardForm("America/Los_Angeles");
  before.locations[0].query = "AMC Grand Boulevard";
  const resolved = {
    ...before.locations[0],
    ...place,
    timezone: "America/Chicago",
    resolution: "verified" as const,
  };
  const edited = {
    ...before,
    title: "Keep this title",
    locations: [{ ...before.locations[0], note: "Bring a jacket" }],
  };
  const merged = mergeResolvedLocation(edited, before.locations[0], resolved);
  assert.equal(merged.title, "Keep this title");
  assert.equal(merged.locations[0].note, "Bring a jacket");
  assert.equal(merged.timezone, "America/Chicago");
  const changed = { ...edited, locations: [{ ...edited.locations[0], query: "Different venue" }] };
  assert.equal(mergeResolvedLocation(changed, before.locations[0], resolved), changed);
  const removed = { ...edited, locations: [] };
  assert.equal(mergeResolvedLocation(removed, before.locations[0], resolved), removed);
});

test("researched addresses and timezones require cited pages that actually support both facts", async () => {
  const { validateResearchedVenue } = await import("./livecard-venue-research");
  const facts = {
    identityConfirmed: true,
    venue: "AMC Grand Boulevard",
    address: "465 Grand Boulevard, Miramar Beach, FL",
    city: "Miramar Beach",
    timezone: "America/Chicago",
    sourceUrl: "https://venue.example/location",
    timezoneSourceUrl: "https://time.example/city",
  };
  const citations = new Set([facts.sourceUrl, facts.timezoneSourceUrl]);
  const pages = async (url: string) =>
    url === facts.sourceUrl
      ? `${facts.venue} ${facts.address}`
      : "Miramar Beach uses America/Chicago";
  assert.equal(
    (await validateResearchedVenue(facts, citations, pages, "stop"))?.timezone,
    "America/Chicago",
  );
  assert.equal(
    await validateResearchedVenue({ ...facts, identityConfirmed: false }, citations, pages, "stop"),
    null,
  );
  assert.equal(await validateResearchedVenue(facts, new Set(), pages, "stop"), null);
  assert.equal(
    await validateResearchedVenue(
      { ...facts, address: "999 Other Street, Miramar Beach" },
      citations,
      pages,
      "stop",
    ),
    null,
  );
  assert.equal(
    await validateResearchedVenue(facts, citations, async () => `${facts.address} EST`, "stop"),
    null,
  );
  assert.equal(
    await validateResearchedVenue(
      { ...facts, timezone: "Invented/Zone" },
      citations,
      pages,
      "stop",
    ),
    null,
  );
});

test("geocoder corroboration requires the exact supplied street number, street and city", async () => {
  const { geocodeResearchedAddress } = await import("./livecard-venue-research");
  const originalFetch = globalThis.fetch;
  const token = process.env.MAPBOX_ACCESS_TOKEN;
  process.env.MAPBOX_ACCESS_TOKEN = "test-token";
  let numberMatches = true;
  globalThis.fetch = (async (input: string | URL | Request) => {
    const url = new URL(String(input));
    assert.equal(
      url.searchParams.get("permanent"),
      "true",
      "stored address results use permanent geocoding",
    );
    return Response.json({
      features: [
        {
          properties: {
            feature_type: "address",
            full_address: place.address,
            match_code: {
              address_number: numberMatches ? "matched" : "plausible",
              street: "matched",
              place: "matched",
              confidence: "low",
            },
          },
        },
      ],
    });
  }) as typeof fetch;
  try {
    assert.equal(
      await geocodeResearchedAddress("465 Grand Boulevard", "Miramar Beach"),
      place.address,
    );
    numberMatches = false;
    assert.equal(await geocodeResearchedAddress("465 Grand Boulevard", "Miramar Beach"), null);
    numberMatches = true;
    assert.equal(await geocodeResearchedAddress("465 Grand Boulevard", "Chicago"), null);
    assert.equal(await geocodeResearchedAddress("999 Other Street", "Miramar Beach"), null);
  } finally {
    globalThis.fetch = originalFetch;
    if (token === undefined) delete process.env.MAPBOX_ACCESS_TOKEN;
    else process.env.MAPBOX_ACCESS_TOKEN = token;
  }
});
