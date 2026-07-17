import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { enrichOcrVenueAddress } from "./place-enrichment.ts";

const repoRoot = process.cwd();

test("normalizeOcrLocationFields rejects parking notes and prefers enrichment", async () => {
  const { normalizeOcrLocationFields, flyerHasPrintedStreetAddress } = await import(
    "./field-normalization.ts"
  );

  const withoutEnrichment = normalizeOcrLocationFields({
    venue: "Pompano Joe's Beach Access",
    location: "Parking: Overflow parking is available across the street on Driftwood Road.",
    hostName: "U.S. Gold Gymnastics",
  });
  assert.equal(withoutEnrichment.venue, "Pompano Joe's Beach Access");
  assert.equal(withoutEnrichment.location, null);

  const withEnrichment = normalizeOcrLocationFields({
    venue: "Pompano Joe's Beach Access",
    location: "Parking: Overflow parking is available across the street on Driftwood Road.",
    enrichedLocation: "2375 Highway 98, Miramar Beach, FL 32550",
    hostName: "U.S. Gold Gymnastics",
  });
  assert.equal(withEnrichment.location, "2375 Highway 98, Miramar Beach, FL 32550");

  assert.equal(
    flyerHasPrintedStreetAddress({
      location: "Parking: Overflow parking is available across the street on Driftwood Road.",
      ocrText: "Pompano Joes Beach Access",
    }),
    false,
  );
  assert.equal(
    flyerHasPrintedStreetAddress({
      location: null,
      ocrText: "Meet at 123 Main Street, Destin, FL 32541",
    }),
    true,
  );
});

test("enrichOcrVenueAddress skips when flyer already prints a street address", async () => {
  const queries = [];
  const result = await enrichOcrVenueAddress({
    venue: "City Beach Pavilion",
    location: null,
    context: "Join us at City Beach Pavilion\n500 Ocean Ave, Destin, FL 32541",
    lookupPlaceAddress: async (query) => {
      queries.push(query);
      return {
        address: "999 Wrong St, Destin, FL 32541",
        provider: "google_places",
        query,
        placeName: "City Beach Pavilion",
      };
    },
  });
  assert.equal(result, null);
  assert.equal(queries.length, 0);
});

test("enrichOcrVenueAddress matches beach-access venues to shorter place names", async () => {
  const queries = [];
  const result = await enrichOcrVenueAddress({
    venue: "Pompano Joe's Beach Access",
    location: "Parking: Overflow parking is available across the street on Driftwood Road.",
    context: "Team Beach Day\nPompano Joes Beach Access\nDriftwood Road",
    lookupPlaceAddress: async (query) => {
      queries.push(query);
      return {
        address: "2375 Hwy 98, Miramar Beach, FL 32550",
        provider: "google_places",
        query,
        placeName: "Public Beach Access - #49 @ Pompano Joe's",
        placeId: "test-pompano",
      };
    },
  });

  assert.equal(result?.address, "2375 Hwy 98, Miramar Beach, FL 32550");
  assert.ok(
    queries.some((query) => /Pompano Joe'?s$/i.test(query) || /Pompano Joe'?s\b/i.test(query)),
  );
});

test("enrichOcrVenueAddress uses provider lookup for missing venue addresses", async () => {
  const queries = [];
  const result = await enrichOcrVenueAddress({
    venue: "Gateway Academy",
    location: "On Tuesday",
    context: "Kona Ice Is Coming\nGateway Academy\nKONA ICE OF SOUTH WALTON COUNTY",
    lookupPlaceAddress: async (query) => {
      queries.push(query);
      return {
        address: "122 Poinciana Blvd, Miramar Beach, FL 32550",
        provider: "google_places",
        query,
        placeName: "Gateway Academy",
        placeId: "test-place-id",
      };
    },
  });

  assert.equal(result?.address, "122 Poinciana Blvd, Miramar Beach, FL 32550");
  assert.equal(result?.provider, "google_places");
  assert.ok(queries.some((query) => /Gateway Academy/.test(query)));
});

test("OCR location normalization has no venue-specific address constants", () => {
  const source = fs.readFileSync(path.join(repoRoot, "src/lib/ocr/field-normalization.ts"), "utf8");

  assert.doesNotMatch(source, /Gateway Academy/i);
  assert.doesNotMatch(source, /Poinciana/i);
  assert.doesNotMatch(source, /Miramar Beach/i);
});

test("normalizeOcrLocationFields extracts venue from narrative venue candidates", async () => {
  const { normalizeOcrLocationFields } = await import("./field-normalization.ts");

  const normalized = normalizeOcrLocationFields({
    venue: "Kona Ice will be at Gateway Academy on Tuesday",
    location: "May 19 from 9:30 to 1:40.",
    context: "Kona Ice Is Coming!\nGateway Academy\nTuesday, May 19",
  });

  assert.equal(normalized.venue, "Gateway Academy");
  assert.equal(normalized.location, null);
  assert.equal(normalized.locationLine, "Gateway Academy");
});
