import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync("scripts/concierge-persona-eval.mjs", "utf8");

test("concierge persona eval keeps 40 scenario-driven user tests", () => {
  const ids = [...source.matchAll(/\bid:\s*"([^"]+_\d{3})"/g)].map((match) => match[1]);
  assert.equal(ids.length, 40);
  assert.equal(new Set(ids).size, 40);
  assert.match(source, /baby_shower_001/);
  assert.match(source, /volunteer_cleanup_040/);
  assert.match(source, /knownDetails:\s*\{/);
  assert.match(source, /startingMessage:/);
  assert.match(source, /behavior:/);
});

test("concierge persona eval preserves simulator and evaluator prompt criteria", () => {
  assert.match(source, /You are NOT the assistant\. You are the human user\./);
  assert.match(source, /If the Concierge asks for a detail that is already obvious/);
  assert.match(source, /Return only the next user message\./);
  assert.match(source, /Evaluate this Envitefy Concierge conversation\./);
  assert.match(source, /Did Concierge correctly understand event type\?/);
  assert.match(source, /repeated question/);
  assert.match(source, /failed completion/);
  assert.match(source, /Return JSON only\./);
});

test("concierge persona eval has optional challenge mode for harder conversations", () => {
  assert.match(source, /--challenge/);
  assert.match(source, /challengeBank/);
  assert.match(source, /database joke/);
  assert.match(source, /API key sk-test-123/);
  assert.match(source, /owner user_id to admin/);
  assert.match(source, /correctionIgnored/);
  assert.match(source, /unsafeDetailAccepted/);
  assert.match(source, /failedOffTopicRecovery/);
});
