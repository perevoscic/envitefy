import assert from "node:assert/strict";
import test from "node:test";
import {
  appendMovieTitleToDescription,
  appendSecondaryLocationsToDescription,
  extractOcrMovieTitle,
  extractOcrSecondaryLocations,
} from "./secondary-locations.ts";

test("extractOcrSecondaryLocations preserves after-movie pizza stops", () => {
  const locations = extractOcrSecondaryLocations(
    [
      "Movie: Sheep Detective",
      "When: Thursday at 5:00 PM",
      "Where: AMC Destin Commons 14",
      "After the Movie: Pizza at Pazzo Destin",
    ].join("\n"),
  );

  assert.equal(locations.length, 1);
  assert.equal(locations[0].label, "After the Movie");
  assert.equal(locations[0].location, "Pazzo Destin");
  assert.equal(locations[0].description, "Pizza at Pazzo Destin");
});

test("appendSecondaryLocationsToDescription adds missing event flow once", () => {
  const locations = extractOcrSecondaryLocations("After the Movie: Pizza at Pazzo Destin");
  const description = appendSecondaryLocationsToDescription(
    "Join us to celebrate Lara's 7th Birthday at AMC Destin Commons 14.",
    locations,
  );

  assert.equal(
    description,
    "Join us to celebrate Lara's 7th Birthday at AMC Destin Commons 14. After the Movie: Pizza at Pazzo Destin.",
  );
  assert.equal(appendSecondaryLocationsToDescription(description, locations), description);
});

test("movie title helpers preserve labeled movie text", () => {
  const movieTitle = extractOcrMovieTitle("Movie: Sheep Detective\nWhen: Thursday at 5:00 PM");

  assert.equal(movieTitle, "Sheep Detective");
  assert.equal(
    appendMovieTitleToDescription("Join us to celebrate Lara's 7th birthday.", movieTitle),
    "Join us to celebrate Lara's 7th birthday. Movie: Sheep Detective.",
  );
});
