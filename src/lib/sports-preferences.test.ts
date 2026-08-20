import { describe, expect, test } from "bun:test";
import {
  inferSportFromRecentEvents,
  isOwnedSportInferenceRecord,
  normalizeSportPreferences,
  syncSportsVisibilityKeys,
} from "./sports-preferences";

describe("sport preference normalization", () => {
  test("drops invalid values, removes duplicates, and keeps primary enabled", () => {
    expect(
      normalizeSportPreferences({
        primarySport: "basketball",
        enabledSports: ["basketball", "BASKETBALL", "not-a-sport", "gymnastics"],
        setupCompleted: true,
      }),
    ).toEqual({
      primarySport: "basketball",
      enabledSports: ["basketball", "gymnastics"],
      setupCompleted: true,
    });
  });

  test("repairs a missing primary and does not complete an empty setup", () => {
    expect(
      normalizeSportPreferences({
        primarySport: "invalid",
        enabledSports: ["lacrosse", "tennis"],
        setupCompleted: true,
      }),
    ).toEqual({
      primarySport: "lacrosse",
      enabledSports: ["lacrosse", "tennis"],
      setupCompleted: true,
    });
    expect(normalizeSportPreferences({ setupCompleted: true })).toEqual({
      primarySport: null,
      enabledSports: [],
      setupCompleted: false,
    });
  });

  test("turning Sports off removes creation keys without erasing saved sports", () => {
    const preferences = normalizeSportPreferences({
      primarySport: "gymnastics",
      enabledSports: ["gymnastics", "lacrosse"],
      setupCompleted: true,
    });
    expect(
      syncSportsVisibilityKeys(["birthdays", "gymnastics", "sport_events"], preferences, false),
    ).toEqual(["birthdays"]);
    expect(preferences.enabledSports).toEqual(["gymnastics", "lacrosse"]);
  });
});

describe("sport inference", () => {
  test("ignores invited and shared records", () => {
    expect(isOwnedSportInferenceRecord({ ownership: "invited" })).toBe(false);
    expect(isOwnedSportInferenceRecord({ ownership: "imported" })).toBe(false);
    expect(isOwnedSportInferenceRecord({ invitedFromScan: true })).toBe(false);
    expect(isOwnedSportInferenceRecord({ shared: "true" })).toBe(false);
  });

  test("uses frequency first and most recent activity as the tie breaker", () => {
    expect(
      inferSportFromRecentEvents([
        { data: { activityProfile: "soccer" }, created_at: "2026-08-18T00:00:00Z" },
        { data: { activityProfile: "basketball" }, created_at: "2026-08-20T00:00:00Z" },
        { data: { activityProfile: "soccer" }, created_at: "2026-08-19T00:00:00Z" },
        {
          data: { activityProfile: "basketball", ownership: "invited" },
          created_at: "2026-08-21T00:00:00Z",
        },
      ]),
    ).toBe("soccer");

    expect(
      inferSportFromRecentEvents([
        { data: { activityProfile: "soccer" }, created_at: "2026-08-18T00:00:00Z" },
        { data: { activityProfile: "basketball" }, created_at: "2026-08-20T00:00:00Z" },
      ]),
    ).toBe("basketball");
  });
});
