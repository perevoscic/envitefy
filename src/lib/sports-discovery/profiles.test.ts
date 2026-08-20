import { describe, expect, test } from "bun:test";
import { SPORT_EVENT_PRESETS } from "@/lib/sport-event-presets";
import { getSportActivityProfile, SPORT_ACTIVITY_PROFILES } from "./profiles";

describe("sport activity profiles", () => {
  test("covers every sport offered by the shared Sport Events launcher", () => {
    for (const preset of SPORT_EVENT_PRESETS) {
      expect(getSportActivityProfile(preset.key)?.key).toBe(preset.key);
    }
  });

  test("declares a supported default archetype for every profile", () => {
    for (const profile of SPORT_ACTIVITY_PROFILES) {
      expect(profile.supportedArchetypes).toContain(profile.defaultArchetype);
      expect(profile.requiredFields).toContain("title");
    }
  });
});
