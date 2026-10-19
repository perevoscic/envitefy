import { describe, expect, test } from "bun:test";
import {
  classifyCreateText,
  customCategoryForGuess,
  discoveryTargetForSport,
  isLikelyUrl,
} from "./create-intent";
import { normalizeCreateClassification } from "./classify-source";

describe("Create page routing", () => {
  test("recognizes clear occasions in a description", () => {
    expect(classifyCreateText("Maya's 7th birthday, unicorn theme, May 3")).toMatchObject({
      category: "birthdays",
      confidence: "high",
    });
    expect(classifyCreateText("Our wedding ceremony and reception").category).toBe("weddings");
    expect(classifyCreateText("Baby shower for Jess, mom-to-be").category).toBe("baby-showers");
  });

  test("routes named sports, including links, to the sport", () => {
    const result = classifyCreateText("https://school.org/athletics/basketball-schedule-2027");
    expect(result).toMatchObject({ category: "sports", sport: "basketball", confidence: "high" });
    expect(classifyCreateText("Spring soccer season schedule").sport).toBe("soccer");
  });

  test("asks when the description is unclear or mixed", () => {
    expect(classifyCreateText("Get together at the park on Saturday").confidence).toBe("low");
    expect(classifyCreateText("Football themed birthday party").confidence).toBe("low");
  });

  test("retains private and specialized source types without relabeling them general", () => {
    expect(classifyCreateText("ENT appointment May 3").category).toBe("medical-appointments");
    expect(classifyCreateText("Haircut appointment May 3").category).toBe("appointments");
    expect(classifyCreateText("Olivia's bridal shower").category).toBe("bridal-showers");
    expect(classifyCreateText("Volunteer shifts and sign-up sheet").category).toBe("signup-forms");
    expect(() => discoveryTargetForSport("not-a-sport")).toThrow("supported sport");
  });

  test("maps guesses to editors and import pipelines", () => {
    expect(customCategoryForGuess({ category: "sports", sport: "dance" })).toBe("dance-ballet");
    expect(customCategoryForGuess({ category: "sports", sport: "tennis" })).toBe("sport-events");
    expect(customCategoryForGuess({ category: "birthdays", sport: null })).toBe("birthdays");
    expect(discoveryTargetForSport("gymnastics").builderHref("e1")).toBe("/event/gymnastics/customize?edit=e1&new=1");
    expect(discoveryTargetForSport("football").workflow).toBe("football");
    expect(discoveryTargetForSport("tennis")).toMatchObject({ workflow: "sports", activityProfile: "tennis" });
    expect(discoveryTargetForSport("tennis").builderHref("e1")).toContain("sport=tennis");
  });

  test("accepts only web links as links", () => {
    expect(isLikelyUrl("https://example.com/team")).toBe(true);
    expect(isLikelyUrl("javascript:alert(1)")).toBe(false);
    expect(isLikelyUrl("birthday at https://x.com")).toBe(false);
  });

  test("model answers are validated before routing", () => {
    expect(normalizeCreateClassification({ category: "sports", sport: "none", confident: true, alternatives: [] })).toBeNull();
    expect(
      normalizeCreateClassification({
        category: "sports",
        sport: "volleyball",
        confident: false,
        alternatives: [
          { category: "sports", sport: "volleyball" },
          { category: "unknown", sport: "none" },
          { category: "general", sport: "none" },
        ],
      }),
    ).toEqual({
      category: "sports",
      sport: "volleyball",
      confidence: "low",
      alternatives: [{ category: "general", sport: null }],
    });
  });
});
