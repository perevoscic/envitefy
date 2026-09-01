import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pageSource = await readFile(new URL("./page.tsx", import.meta.url), "utf8");
const componentSource = await readFile(
  new URL("../../components/ui/faqs-component.tsx", import.meta.url),
  "utf8",
);

test("the full FAQ reflects the current customer-facing product", () => {
  for (const expected of [
    "Envitefy Concierge",
    "My events and Invited events",
    "smart sign-up forms",
    "automatic waitlists",
    "access code",
    "Google Calendar",
    "Apple Calendar",
    "Outlook",
    "general-purpose Envitefy foundation model",
  ]) {
    assert.match(pageSource, new RegExp(expected, "i"));
  }
});

test("the full FAQ removes stale account tiers and the inaccurate co-management claim", () => {
  assert.doesNotMatch(pageSource, /Snap accounts/i);
  assert.doesNotMatch(pageSource, /Gymnastics accounts/i);
  assert.doesNotMatch(pageSource, /snap-gymnastics-access/);
  assert.doesNotMatch(pageSource, /co-manage events/i);
  assert.doesNotMatch(pageSource, /stay synced on every change/i);
});

test("FAQ disclosures work before client hydration", () => {
  assert.doesNotMatch(componentSource, /^"use client";/m);
  assert.match(componentSource, /<details/);
  assert.match(componentSource, /<summary/);
  assert.match(componentSource, /touch-manipulation/);
  assert.match(componentSource, /focus-visible:ring-2/);
  assert.doesNotMatch(componentSource, /<Accordion/);
});
