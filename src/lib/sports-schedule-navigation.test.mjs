import assert from "node:assert/strict";
import test from "node:test";
import { getSportsScheduleSummary, formatSportsScheduleSummary } from "./sports-schedule-navigation.ts";

const fixtures = [{ opponent: "First opponent" }, { opponent: "Second opponent" }];

test("each requested sport uses its own fixture terminology, including track aliases", () => {
  for (const [sport, label] of [
    ["football", "Games"], ["basketball", "Games"], ["baseball", "Games"],
    ["gymnastics", "Meets"], ["swimming", "Meets"], ["track", "Meets"],
    ["track-field", "Meets"], ["sport_track_field", "Meets"],
    ["soccer", "Matches"], ["tennis", "Matches"], ["volleyball", "Matches"],
    ["football club", "Matches"],
  ]) {
    const summary = getSportsScheduleSummary({ sport, schedule: { games: fixtures } });
    assert.equal(summary?.itemsLabel, label, sport);
    assert.equal(summary?.itemCount, 2, sport);
  }
});

test("editor, imported and projected schedules preserve counts without duplicate copies or off weeks", () => {
  const games = [...fixtures, { opponent: "Bye" }, { opponent: "Open week" }, { id: "empty" }];
  const full = {
    category: "football-season", extra: { season: "2026" },
    advancedSections: { games: { games } },
    discoverySource: { parseResult: { games } },
  };
  const expected = { sport: "Football", itemsLabel: "Games", itemCount: 2, season: "2026" };
  assert.deepEqual(getSportsScheduleSummary(full), expected);
  assert.deepEqual(getSportsScheduleSummary({ category: "football", customFields: { season: "2026", advancedSections: full.advancedSections } }), expected);
  assert.deepEqual(getSportsScheduleSummary({ category: "football", season: "2026", discoverySource: full.discoverySource }), expected);
  assert.deepEqual(getSportsScheduleSummary({ sidebarSports: { sportHints: [null, "football-season"], season: "2026", entries: games } }), expected);
  assert.equal(formatSportsScheduleSummary(expected), "Football · 2026 · 2 games");
});

test("standalone games, meet sessions and non-sport events stay out of Schedules", () => {
  assert.equal(getSportsScheduleSummary({ category: "football", games: [fixtures[0]] }, "Seahawks vs Dolphins"), null);
  assert.equal(getSportsScheduleSummary({ category: "gymnastics", advancedSections: { schedule: { sessions: [{ title: "Morning" }, { title: "Afternoon" }] } } }, "State Meet"), null);
  assert.equal(getSportsScheduleSummary({ category: "gymnastics", advancedSections: { schedule: { sessions: [{ title: "Morning" }, { title: "Afternoon" }] } } }, "State Meet Schedule"), null);
  assert.equal(getSportsScheduleSummary({ category: "wedding", games: fixtures }, "Reception"), null);
  assert.equal(getSportsScheduleSummary({ sport: "soccer", scanSchedule: { items: fixtures.map((fixture) => ({ ...fixture, type: "practice" })) } }, "Weekly practices"), null);
});

test("explicit season schedules need no invented dates, and singular item labels remain grammatical", () => {
  const summary = getSportsScheduleSummary({ sport: "tennis", eventArchetype: "season_schedule", matches: [fixtures[0]] });
  assert.equal(formatSportsScheduleSummary(summary), "Tennis · 1 match");
  assert.equal(getSportsScheduleSummary({ sport: "swimming", eventArchetype: "season_schedule" })?.itemCount, 0);
  assert.equal(getSportsScheduleSummary({ sport: "baseball", games: fixtures, created_at: "2026-09-15" })?.season, "");
});
