import { describe, expect, test } from "bun:test";
import { detectSportActivity } from "./detect";

describe("sport activity detection", () => {
  test("honors an explicit sport selection", () => {
    const result = detectSportActivity({
      activityHint: "basketball",
      text: "Tournament schedule, court assignments, and tipoff times",
    });
    expect(result.profile).toBe("basketball");
    expect(result.archetype).toBe("tournament");
    expect(result.confidence).toBe(1);
    expect(result.needsConfirmation).toBe(false);
  });

  test("detects baseball season schedules", () => {
    const result = detectSportActivity({
      text: "2027 Baseball Season Schedule. First pitch and ballpark assignments are listed below.",
    });
    expect(result.profile).toBe("baseball");
    expect(result.archetype).toBe("season_schedule");
    expect(result.parserFamily).toBe("game");
  });

  test("detects dance recitals as showcases", () => {
    const result = detectSportActivity({
      text: "Spring Dance Recital performance order for solos and studio routines",
    });
    expect(result.profile).toBe("dance");
    expect(result.archetype).toBe("showcase_clinic");
    expect(result.parserFamily).toBe("meet");
  });

  test("marks documents with no sport signal for confirmation", () => {
    const result = detectSportActivity({ text: "Community event information and directions" });
    expect(result.source).toBe("fallback");
    expect(result.needsConfirmation).toBe(true);
  });
});
