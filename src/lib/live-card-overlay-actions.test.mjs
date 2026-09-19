import assert from "node:assert/strict";
import test from "node:test";
import { resolveLiveCardOverlayActions } from "./live-card-overlay-actions.ts";

test("guided Live Cards honor explicit RSVP switches without removing default buttons", () => {
  assert.deepEqual(resolveLiveCardOverlayActions({ category: "Birthday", hasLocation: true, rsvpEnabled: false }), ["details", "location", "calendar"]);
  assert.deepEqual(resolveLiveCardOverlayActions({ category: "Game Day", hasLocation: true, rsvpEnabled: true, hasRegistry: true }), ["rsvp", "details", "location", "calendar", "registry"]);
});

test("birthday Live Cards keep RSVP, Overview, Location, and Calendar on the artwork overlay", () => {
  assert.deepEqual(
    resolveLiveCardOverlayActions({
      category: "Birthday",
      hasLocation: true,
    }),
    ["rsvp", "details", "location", "calendar"],
  );
});

test("chat no-rsvp and missing calendar links do not strip RSVP or Calendar chrome", () => {
  assert.deepEqual(
    resolveLiveCardOverlayActions({
      category: "Birthday",
      hasLocation: true,
      hasRegistry: false,
    }),
    ["rsvp", "details", "location", "calendar"],
  );
});

test("Registry appears only when a gift link exists", () => {
  assert.deepEqual(
    resolveLiveCardOverlayActions({
      category: "Birthday",
      hasLocation: true,
      hasRegistry: true,
    }),
    ["rsvp", "details", "location", "calendar", "registry"],
  );
});

test("Game Day omits RSVP but still shows Calendar", () => {
  assert.deepEqual(
    resolveLiveCardOverlayActions({
      category: "Game Day",
      hasLocation: true,
    }),
    ["details", "location", "calendar"],
  );
});

test("Open House uses Property, Realtor, Location, and Calendar", () => {
  assert.deepEqual(
    resolveLiveCardOverlayActions({
      category: "Open House",
      openHouse: true,
      hasLocation: true,
      hasOpenHouseAgent: true,
    }),
    ["details", "rsvp", "location", "calendar"],
  );
});
