import assert from "node:assert/strict";
import test from "node:test";
import {
  shouldSkipOpenAiForCreationRequest,
  shouldSkipOpenAiForEventAction,
} from "./fast-paths.ts";

test("event assistant fast path covers deterministic asset, RSVP deadline, and tone requests", () => {
  assert.equal(shouldSkipOpenAiForEventAction("Create a WhatsApp version"), true);
  assert.equal(shouldSkipOpenAiForEventAction("RSVP by June 1"), true);
  assert.equal(shouldSkipOpenAiForEventAction("Make it more elegant"), true);
  assert.equal(
    shouldSkipOpenAiForEventAction("Change the ceremony details based on Sarah's note"),
    false,
  );
});

test("creation intake fast path covers greetings, starter chips, output chips, and OCR results", () => {
  assert.equal(
    shouldSkipOpenAiForCreationRequest({ request: { message: "hi", action: "message" } }),
    true,
  );
  assert.equal(
    shouldSkipOpenAiForCreationRequest({ request: { message: "Birthday", action: "chip" } }),
    true,
  );
  assert.equal(
    shouldSkipOpenAiForCreationRequest({
      request: { message: "Game Day", action: "starter_category" },
    }),
    true,
  );
  assert.equal(
    shouldSkipOpenAiForCreationRequest({
      request: { message: "Gym Meet", action: "chip" },
    }),
    true,
  );
  assert.equal(
    shouldSkipOpenAiForCreationRequest({
      request: { message: "Make this a live card", action: "chip" },
    }),
    true,
  );
  assert.equal(
    shouldSkipOpenAiForCreationRequest({
      request: { message: "Seed a draft from this upload.", action: "ocr_result" },
    }),
    true,
  );
  assert.equal(
    shouldSkipOpenAiForCreationRequest({
      request: { message: "Use a black tie tone but keep the ceremony details", action: "message" },
    }),
    false,
  );
});
