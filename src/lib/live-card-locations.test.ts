import assert from "node:assert/strict";
import test from "node:test";

import {
  buildLiveCardDirectionsHref,
  buildLiveCardLocationActions,
  getLiveCardPrimaryLocationLabel,
} from "./live-card-locations.ts";

test("buildLiveCardLocationActions extracts a primary venue and a lunch destination", () => {
  const actions = buildLiveCardLocationActions({
    location: "AMC Boulevard 10 465 Grand Boulevard, Miramar Beach, FL",
    detailsDescription:
      "Popcorn, Drinks and a lot of Fun!\nWe are going to watch the movie Sheep Detective, then lunch at Pazzo Santa Rosa Beach",
  });

  assert.equal(actions.length, 2);
  assert.deepEqual(actions.map((action) => action.label), [
    "AMC Boulevard 10",
    "Pazzo Santa Rosa Beach",
  ]);
  assert.equal(actions[0]?.source, "primary");
  assert.equal(actions[1]?.source, "details");
  assert.match(actions[0]?.mapQuery || "", /AMC Boulevard 10 465 Grand Boulevard/);
  assert.equal(
    getLiveCardPrimaryLocationLabel({
      location: "AMC Boulevard 10 465 Grand Boulevard, Miramar Beach, FL",
    }),
    "AMC Boulevard 10",
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

test("buildLiveCardLocationActions dedupes detail destinations that repeat the primary venue", () => {
  const actions = buildLiveCardLocationActions({
    location: "AMC Boulevard 10 465 Grand Boulevard, Miramar Beach, FL",
    detailsDescription: "Movie first, then lunch at AMC Boulevard 10.",
  });

  assert.equal(actions.length, 1);
  assert.equal(actions[0]?.label, "AMC Boulevard 10");
});

test("buildLiveCardLocationActions ignores generic detail destinations", () => {
  const actions = buildLiveCardLocationActions({
    location: "AMC Boulevard 10 465 Grand Boulevard, Miramar Beach, FL",
    detailsDescription: "We will watch the movie first, then lunch at the movie theater.",
  });

  assert.equal(actions.length, 1);
  assert.equal(actions[0]?.label, "AMC Boulevard 10");
});

test("buildLiveCardDirectionsHref builds a Google directions destination URL", () => {
  assert.equal(
    buildLiveCardDirectionsHref("Pazzo Santa Rosa Beach"),
    "https://www.google.com/maps/dir/?api=1&destination=Pazzo%20Santa%20Rosa%20Beach",
  );
});
