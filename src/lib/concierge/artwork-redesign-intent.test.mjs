import test from "node:test";
import assert from "node:assert/strict";
import { isArtworkRedesignRequest } from "./artwork-redesign-intent.ts";

test("regeneration intent survives the exact corrections and typos from chat", () => {
  for (const message of [
    "no, kayseye the kpop band and needoh the viral squishy things. regenerted",
    "this is NOT kayseye the kpop band and needoh the viral squishy things. regenreate",
    "regenerate", "regenerte it", "redo it", "make another flyer", "start over",
  ]) assert.equal(isArtworkRedesignRequest(message), true, message);
});

test("metadata changes and explicit preservation do not force a new design", () => {
  for (const message of ["RSVP is off", "change the address", "registered guests only", "keep the same image", "do not regenerate", "do not regenreate", "don't redesign it"]) {
    assert.equal(isArtworkRedesignRequest(message), false, message);
  }
});
