import { describe, expect, test } from "bun:test";
import { TEMPLATE_KEYS } from "./feature-visibility";
import { getTemplateLinks } from "./navigation-config";

const sportsLink = (preferences?: {
  primarySport: string | null;
  enabledSports: string[];
  setupCompleted: boolean;
}) =>
  getTemplateLinks(TEMPLATE_KEYS, ["snap"], preferences).filter(
    (link) => link.section === "sports",
  );

describe("personalized sports navigation", () => {
  test("shows one generic Sports item before setup", () => {
    expect(sportsLink()).toMatchObject([{ label: "Sports", href: "/event/sport-events" }]);
  });

  test("shows only the primary sport for single and multi-sport accounts", () => {
    expect(
      sportsLink({
        primarySport: "lacrosse",
        enabledSports: ["lacrosse"],
        setupCompleted: true,
      }),
    ).toMatchObject([{ label: "Lacrosse", href: "/event/sport-events?sport=lacrosse" }]);
    expect(
      sportsLink({
        primarySport: "basketball",
        enabledSports: ["basketball", "lacrosse", "gymnastics"],
        setupCompleted: true,
      }),
    ).toMatchObject([{ label: "Basketball", href: "/event/sport-events?sport=basketball" }]);
  });

  test("routes a gymnastics primary to its specialized builder", () => {
    expect(
      sportsLink({
        primarySport: "gymnastics",
        enabledSports: ["gymnastics"],
        setupCompleted: true,
      }),
    ).toMatchObject([{ label: "Gymnastics", href: "/event/gymnastics" }]);
  });

  test("hides sports navigation when Sports is disabled", () => {
    expect(getTemplateLinks(["birthdays"], ["snap"], undefined)).toHaveLength(1);
    expect(getTemplateLinks([], ["snap"], undefined)).toEqual([]);
  });
});
