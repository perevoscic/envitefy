import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import {
  classifyCreateText,
  customCategoryForGuess,
  discoveryTargetForSport,
  isLikelyUrl,
} from "./create-intent";
import { hasSupportedHolidayOccasion, normalizeCreateClassification } from "./classify-source";
import { defaultCreationTemplate } from "./default-creation-template";
import { isSchoolMemoText } from "../school-memo";

const schoolMemo = readFileSync(new URL("../../../scripts/fixtures/school-memo.txt", import.meta.url), "utf8");

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

  test("a school memo keeps its document purpose despite incidental occasions", () => {
    expect(isSchoolMemoText(schoolMemo)).toBe(true);
    expect(classifyCreateText(schoolMemo)).toEqual({ category: "school", schoolTemplate: "weekly-memo", sport: null, confidence: "high", alternatives: [] });
    expect(classifyCreateText(`${schoolMemo}\nChristmas rehearsal December 15\nWelcome to the new school year!`).category).toBe("school");
    expect(isSchoolMemoText("School New Year's Eve Celebration\nDecember 31 at 6 PM")).toBe(false);
    expect(isSchoolMemoText("Company weekly memo\nNew Year's Eve office party")).toBe(false);
    expect(isSchoolMemoText("High School Football Team Weekly Memo\nPractice Monday\nGame Friday")).toBe(false);
    expect(normalizeCreateClassification({ category: "holidays-seasonal", sport: "none", occasion: "new-years-day", occasionEvidence: "Bible Test", confident: true, alternatives: [] }, schoolMemo)?.category).toBe("school");
  });

  test("a named holiday survives recognition only with matching observed evidence", () => {
    const source = "School New Year's Eve Celebration\nDecember 31 at 6 PM";
    expect(normalizeCreateClassification({ category: "holidays-seasonal", sport: "none", occasion: "new-years-eve", occasionEvidence: "School New Year's Eve Celebration", confident: true, alternatives: [] }, source)).toMatchObject({ category: "holidays-seasonal", occasion: "new-years-eve", confidence: "high", occasionEvidence: "School New Year's Eve Celebration" });
    for (const [evidence, text] of [["New Year's Day", "Team night out"], ["Team night out", "Team night out"], ["Welcome to a new year of school", "Welcome to a new year of school"]]) {
      expect(hasSupportedHolidayOccasion("new-years-day", evidence, text)).toBe(false);
    }
    expect(normalizeCreateClassification({ category: "holidays-seasonal", sport: "none", occasion: "new-years-day", occasionEvidence: "Team night out", confident: true, alternatives: [] }, "Team night out")).toMatchObject({ occasion: null, confidence: "low" });
  });

  test("broad holiday recognition cannot pick the first New Year design", () => {
    const designs = [{ id: "new-year" }, { id: "christmas" }];
    expect(defaultCreationTemplate(designs, { category: "holidays-seasonal", sport: null })).toBeUndefined();
    expect(defaultCreationTemplate(designs, { category: "holidays-seasonal", sport: null }, "christmas")).toEqual(designs[1]);
    expect(defaultCreationTemplate([designs[1]], { category: "holidays-seasonal", sport: null, occasion: "christmas" })).toEqual(designs[1]);
    expect(defaultCreationTemplate([{ id: "school" }], { category: "general", sport: null })).toEqual({ id: "school" });
  });
});
