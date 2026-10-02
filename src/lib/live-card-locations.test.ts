import assert from "node:assert/strict";
import test from "node:test";

import {
  buildLiveCardOnlineLocations,
  buildLiveCardDirectionsHref,
  buildLiveCardLocationActions,
  getLiveCardPrimaryLocationLabel,
  getLiveCardLocationAddress,
} from "./live-card-locations.ts";

test("online locations preserve joining tokens and never become physical directions", () => {
  const details = { venueName: "Online Event", location: "https://example.com/join?token=abc#room", additionalLocations: [{ venue: "Afterparty", address: "https://example.com/after" }, { venue: "Duplicate", address: "https://example.com/join?token=abc#room" }] };
  assert.deepEqual(buildLiveCardOnlineLocations(details), [{ label: "Online Event", url: details.location }, { label: "Afterparty", url: "https://example.com/after" }]);
  assert.deepEqual(buildLiveCardLocationActions(details), []);
  for (const location of ["javascript:alert(1)", "data:text/html,test", "https://user:password@example.com", "123 Main Street"]) {
    assert.deepEqual(buildLiveCardOnlineLocations({ location }), []);
  }
});

test("buildLiveCardLocationActions extracts a primary venue and a lunch destination", () => {
  const actions = buildLiveCardLocationActions({
    location: "AMC Boulevard 10 465 Grand Boulevard, Miramar Beach, FL",
    detailsDescription:
      "Popcorn, Drinks and a lot of Fun!\nWe are going to watch the movie Sheep Detective, then lunch at Pazzo Santa Rosa Beach",
  });

  assert.equal(actions.length, 2);
  assert.deepEqual(
    actions.map((action) => action.label),
    ["Movie at AMC Boulevard 10", "Lunch at Pazzo Santa Rosa Beach"],
  );
  assert.deepEqual(
    actions.map((action) => action.shortName),
    ["AMC", "Pazzo"],
  );
  assert.equal(actions[0]?.source, "primary");
  assert.equal(actions[1]?.source, "details");
  assert.equal(actions[0]?.mapQuery, "AMC Boulevard 10, 465 Grand Boulevard, Miramar Beach, FL");
  assert.equal(
    getLiveCardPrimaryLocationLabel({
      location: "AMC Boulevard 10 465 Grand Boulevard, Miramar Beach, FL",
    }),
    "Movie at AMC Boulevard 10",
  );
});

test("getLiveCardPrimaryLocationLabel falls back to an address-only location", () => {
  assert.equal(
    getLiveCardPrimaryLocationLabel({
      location: "465 Grand Boulevard, Miramar Beach, FL",
    }),
    "465 Grand Boulevard, Miramar Beach, FL",
  );
});

test("buildLiveCardLocationActions displays venue label while directions use address", () => {
  const actions = buildLiveCardLocationActions({
    locationLine: "Nana's and Nanu's Pool",
    location: "206 Dawson Rd, Santa Rosa Beach, FL 32459",
  });

  assert.equal(actions.length, 1);
  assert.equal(actions[0]?.label, "Nana's and Nanu's Pool");
  assert.match(actions[0]?.mapQuery || "", /Nana's and Nanu's Pool/);
  assert.match(actions[0]?.mapQuery || "", /206 Dawson Rd/);
});

test("buildLiveCardLocationActions dedupes detail destinations that repeat the primary venue", () => {
  const actions = buildLiveCardLocationActions({
    location: "AMC Boulevard 10 465 Grand Boulevard, Miramar Beach, FL",
    detailsDescription: "Movie first, then lunch at AMC Boulevard 10.",
  });

  assert.equal(actions.length, 1);
  assert.equal(actions[0]?.label, "Movie at AMC Boulevard 10");
});

test("buildLiveCardLocationActions ignores generic detail destinations", () => {
  const actions = buildLiveCardLocationActions({
    location: "AMC Boulevard 10 465 Grand Boulevard, Miramar Beach, FL",
    detailsDescription: "We will watch the movie first, then lunch at the movie theater.",
  });

  assert.equal(actions.length, 1);
  assert.equal(actions[0]?.label, "Movie at AMC Boulevard 10");
});

test("buildLiveCardLocationActions titles a movie venue and a dinner stop", () => {
  const actions = buildLiveCardLocationActions({
    venueName: "AMC Grand Blvd",
    location: "AMC Grand Blvd, Miramar Beach, FL",
    additionalLocations: [
      {
        label: "Dinner",
        venue: "Pazzo",
        location: "Santa Rosa Beach, FL",
      },
    ],
  });

  assert.deepEqual(
    actions.map((action) => action.label),
    ["Movie at AMC Grand Blvd", "Dinner at Pazzo SRB"],
  );
  assert.deepEqual(
    actions.map((action) => action.shortName),
    ["AMC", "Pazzo"],
  );
});

test("buildLiveCardDirectionsHref builds a preferred directions URL", () => {
  assert.equal(
    buildLiveCardDirectionsHref("Pazzo Santa Rosa Beach"),
    "https://www.google.com/maps/search/?api=1&query=Pazzo%20Santa%20Rosa%20Beach",
  );
});

test("location panels show saved street addresses without repeating the place heading", () => {
  const actions = buildLiveCardLocationActions({
    venueName: "AMC Grand Blvd",
    location: "465 Grand Boulevard, Miramar Beach, FL 32550",
    additionalLocations: [{ label: "Dinner", venue: "Pazzo SRB", location: "111 North Highway 393, Unit 301, Santa Rosa Beach, FL 32459" }],
  });
  assert.equal(getLiveCardLocationAddress(actions[0]), "465 Grand Boulevard, Miramar Beach, FL 32550");
  assert.equal(getLiveCardLocationAddress(actions[1]), "111 North Highway 393, Unit 301, Santa Rosa Beach, FL 32459");
  assert.equal(getLiveCardLocationAddress(buildLiveCardLocationActions({ venueName: "AMC Grand Blvd" })[0]), "");
});
