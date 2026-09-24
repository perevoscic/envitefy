import assert from "node:assert/strict";
import test from "node:test";
import { LIVE_CARD_EVENT_TYPES } from "./livecard-builder.ts";
import {
  LIVE_CARD_DESIGN_SUGGESTIONS,
  pickLiveCardDesignSuggestions,
} from "./livecard-design-suggestions.ts";

test("every selectable category has 50 distinct design prompts, with balanced girl/boy banks", () => {
  for (const category of LIVE_CARD_EVENT_TYPES) {
    const bank = LIVE_CARD_DESIGN_SUGGESTIONS[category];
    assert.equal(bank.length, 50, category);
    assert.equal(new Set(bank.map((idea) => idea.id)).size, 50, category);
    assert.equal(new Set(bank.map((idea) => idea.prompt)).size, 50, category);
    const girls = bank.filter((idea) => idea.audience === "girl");
    const boys = bank.filter((idea) => idea.audience === "boy");
    if (["Birthday", "Baby shower", "Gender reveal", "Graduation"].includes(category)) {
      assert.equal(girls.length, 25, category);
      assert.equal(boys.length, 25, category);
    }
  }
});

test("repeated draws stay category-specific, varied, balanced and never repeat the preceding scenes", () => {
  let seed = 57;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 2 ** 32;
  };
  for (const category of LIVE_CARD_EVENT_TYPES) {
    const bank = LIVE_CARD_DESIGN_SUGGESTIONS[category];
    const original = JSON.stringify(bank);
    const seen = new Set<string>();
    let previous = pickLiveCardDesignSuggestions(category, [], random);
    for (let draw = 0; draw < 200; draw++) {
      const next = pickLiveCardDesignSuggestions(
        category,
        previous.map((idea) => idea.id),
        random,
      );
      assert.equal(next.length, 4, category);
      assert.equal(new Set(next.map((idea) => idea.theme)).size, 4, category);
      assert.ok(
        next.every((idea) => bank.includes(idea)),
        category,
      );
      assert.ok(
        next.every((idea) => !previous.some((old) => old.theme === idea.theme)),
        category,
      );
      if (bank.some((idea) => idea.audience === "girl")) {
        assert.equal(
          next.filter((idea) => idea.audience === "girl").length,
          2,
          category,
        );
        assert.equal(
          next.filter((idea) => idea.audience === "boy").length,
          2,
          category,
        );
      }
      for (const idea of next) seen.add(idea.id);
      previous = next;
    }
    assert.equal(seen.size, 50, `all ${category} ideas are reachable`);
    assert.equal(JSON.stringify(bank), original, "drawing never mutates the saved bank");
  }
});
