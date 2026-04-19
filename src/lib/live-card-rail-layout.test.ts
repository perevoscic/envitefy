import assert from "node:assert/strict";
import test from "node:test";
import { getLiveCardRailLayout } from "./live-card-rail-layout.ts";

test("showcase rail uses a centered cluster for six visible actions", () => {
  assert.equal(
    getLiveCardRailLayout({ showcaseMode: true, isClosed: true, buttonCount: 6 }),
    "cluster",
  );
});

test("showcase rail uses spread layout for five visible actions", () => {
  assert.equal(
    getLiveCardRailLayout({ showcaseMode: true, isClosed: true, buttonCount: 5 }),
    "spread",
  );
});

test("showcase rail uses spread layout for four visible actions", () => {
  assert.equal(
    getLiveCardRailLayout({ showcaseMode: true, isClosed: true, buttonCount: 4 }),
    "spread",
  );
});

test("showcase rail falls back to default outside the closed showcase state", () => {
  assert.equal(
    getLiveCardRailLayout({ showcaseMode: false, isClosed: true, buttonCount: 6 }),
    "default",
  );
  assert.equal(
    getLiveCardRailLayout({ showcaseMode: true, isClosed: false, buttonCount: 6 }),
    "default",
  );
});
