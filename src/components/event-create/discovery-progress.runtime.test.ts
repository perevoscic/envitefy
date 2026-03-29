import assert from "node:assert/strict";
import test from "node:test";

import {
  GYMNASTICS_URL_PARSE_START_PROGRESS,
  GYMNASTICS_URL_PARSE_TAIL_LABEL,
  GYMNASTICS_URL_PARSE_TAIL_PROGRESS,
  getDiscoveryStageLabel,
  resolveGymnasticsUrlParseProgress,
} from "./discovery-progress.ts";

test("gymnastics URL parse progress stays determinate during the early parse ramp", () => {
  const initial = resolveGymnasticsUrlParseProgress(0);
  const early = resolveGymnasticsUrlParseProgress(9_000);

  assert.equal(initial.progress, GYMNASTICS_URL_PARSE_START_PROGRESS);
  assert.equal(initial.indeterminate, false);
  assert.equal(initial.label, getDiscoveryStageLabel("gymnastics-url", initial.progress));

  assert.equal(early.indeterminate, false);
  assert.ok(early.progress > initial.progress);
  assert.ok(early.progress < GYMNASTICS_URL_PARSE_TAIL_PROGRESS);
  assert.equal(early.label, getDiscoveryStageLabel("gymnastics-url", early.progress));
});

test("gymnastics URL parse progress switches into a stable live tail after the cap", () => {
  const tail = resolveGymnasticsUrlParseProgress(60_000);
  const later = resolveGymnasticsUrlParseProgress(90_000);

  assert.equal(tail.progress, GYMNASTICS_URL_PARSE_TAIL_PROGRESS);
  assert.equal(tail.indeterminate, true);
  assert.equal(tail.label, GYMNASTICS_URL_PARSE_TAIL_LABEL);
  assert.deepEqual(later, tail);
});

test("upload and football flows keep their existing determinate late-stage labels", () => {
  assert.equal(getDiscoveryStageLabel("gymnastics-upload", 90), "Checking parking and arrival...");
  assert.equal(getDiscoveryStageLabel("football-url", 94), "Checking bus arrival notes...");
});
