import assert from "node:assert/strict";
import test from "node:test";
import { buildParkingDirectionsQuery } from "./directions.ts";

test("buildParkingDirectionsQuery searches parking across the street near venue address", () => {
  assert.equal(
    buildParkingDirectionsQuery({
      parkingText: "Overflow parking is available across the street on Driftwood Road.",
      venueName: "Pompano Joe's Beach Access",
      location: "2375 Hwy 2378, Miramar Beach, FL 32550",
    }),
    "parking across the street on Driftwood Road near 2375 Hwy 2378, Miramar Beach, FL 32550",
  );
});

test("buildParkingDirectionsQuery falls back to venue when address missing", () => {
  assert.equal(
    buildParkingDirectionsQuery({
      parkingText: "Park on Driftwood Road",
      venueName: "Pompano Joe's Beach Access",
      location: "",
    }),
    "parking on Driftwood Road near Pompano Joe's Beach Access",
  );
});

test("buildParkingDirectionsQuery uses venue + city when only city is known", () => {
  assert.equal(
    buildParkingDirectionsQuery({
      parkingText: "Overflow parking is available across the street on Driftwood Road.",
      venueName: "Pompano Joe's Beach Access",
      location: "Miramar Beach, FL 32550",
    }),
    "parking across the street on Driftwood Road near Pompano Joe's Beach Access, Miramar Beach, FL 32550",
  );
});

test("buildParkingDirectionsQuery returns empty when no road is present", () => {
  assert.equal(
    buildParkingDirectionsQuery({
      parkingText: "Please carpool if you can.",
      venueName: "Pompano Joe's Beach Access",
      location: "2375 Hwy 2378, Miramar Beach, FL 32550",
    }),
    "",
  );
});
