import assert from "node:assert/strict";
import test from "node:test";
import { EVENT_EXTRACTION_SCHEMA, EVENT_EXTRACTION_RESPONSE_SCHEMA } from "./extraction-contract.ts";

test("compact wire schema expands to the exact original extraction contract", () => {
  function expand(value) {
    if (Array.isArray(value)) return value.map(expand);
    if (!value || typeof value !== "object") return value;
    if (value.$ref) {
      assert.equal(value.$ref, "#/$defs/fieldEvidence");
      return expand(EVENT_EXTRACTION_RESPONSE_SCHEMA.$defs.fieldEvidence);
    }
    return Object.fromEntries(Object.entries(value).filter(([key]) => key !== "$defs")
      .map(([key, child]) => [key, expand(child)]));
  }
  assert.deepEqual(expand(EVENT_EXTRACTION_RESPONSE_SCHEMA), EVENT_EXTRACTION_SCHEMA);
  assert.ok(JSON.stringify(EVENT_EXTRACTION_RESPONSE_SCHEMA).length < JSON.stringify(EVENT_EXTRACTION_SCHEMA).length * 0.7);
});
