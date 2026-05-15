import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { enrichOcrVenueAddress } from "./place-enrichment.ts";

const repoRoot = process.cwd();

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
