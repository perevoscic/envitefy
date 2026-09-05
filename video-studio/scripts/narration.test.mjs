import test from "node:test";
import assert from "node:assert/strict";
import {
  alignmentToCaptions,
  captionsToSrt,
  narrationCacheKey,
  sceneTiming,
} from "./narration-utils.mjs";

test("character alignment keeps word timing and punctuation", () => {
  const text = "Hi,  all!";
  const result = alignmentToCaptions({
    characters: [...text],
    character_start_times_seconds: [...text].map((_, i) => i / 10),
    character_end_times_seconds: [...text].map((_, i) => (i + 1) / 10),
  });
  assert.deepEqual(
    result.map(({ text, startMs, endMs }) => ({ text, startMs, endMs })),
    [
      { text: "Hi,", startMs: 0, endMs: 300 },
      { text: " all!", startMs: 500, endMs: 900 },
    ],
  );
});
test("malformed alignment fails instead of inventing caption timing", () => {
  assert.throws(() =>
    alignmentToCaptions({
      characters: ["a"],
      character_start_times_seconds: [],
      character_end_times_seconds: [1],
    }),
  );
  assert.throws(() =>
    alignmentToCaptions({
      characters: ["a"],
      character_start_times_seconds: [2],
      character_end_times_seconds: [1],
    }),
  );
});
test("scene duration rounds up so narration is never clipped", () => {
  assert.deepEqual(sceneTiming(2.001, 30), { audioOffsetFrames: 5, durationInFrames: 74 });
  assert.throws(() => sceneTiming(Number.NaN, 30));
});
test("voice and script changes invalidate the paid audio cache", () => {
  const request = { voiceId: "a", text: "Hello", model_id: "v2" };
  assert.equal(narrationCacheKey(request), narrationCacheKey({ ...request }));
  assert.notEqual(narrationCacheKey(request), narrationCacheKey({ ...request, voiceId: "b" }));
  assert.notEqual(narrationCacheKey(request), narrationCacheKey({ ...request, text: "Goodbye" }));
});
test("SRT timestamps carry correctly across minutes", () => {
  assert.match(
    captionsToSrt([{ text: " hello", startMs: 59999.7, endMs: 61234 }]),
    /00:01:00,000 --> 00:01:01,234\nhello/,
  );
});
