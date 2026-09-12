import { describe, expect, test } from "bun:test";
import { TEMPLATE_KEYS } from "./feature-visibility";
import {
  findActiveCreateEventItem,
  getTemplateLinks,
  isCreateEventRoute,
  matchesCreateEventHrefPath,
} from "./navigation-config";

const sportsLink = (preferences?: {
  primarySport: string | null;
  enabledSports: string[];
  setupCompleted: boolean;
}) =>
  getTemplateLinks(TEMPLATE_KEYS, ["snap"], preferences).filter(
    (link) => link.section === "sports",
  );

describe("personalized sports navigation", () => {
  test("shows Football and a generic Sports item before setup", () => {
    expect(sportsLink()).toMatchObject([{ label: "Football", href: "/event/football" }, { label: "Sports", href: "/event/sport-events" }]);
  });

  test("keeps Football beside the primary sport for single and multi-sport accounts", () => {
    expect(
      sportsLink({
        primarySport: "lacrosse",
        enabledSports: ["lacrosse"],
        setupCompleted: true,
      }),
    ).toMatchObject([{ label: "Football", href: "/event/football" }, { label: "Lacrosse", href: "/event/sport-events?sport=lacrosse" }]);
    expect(
      sportsLink({
        primarySport: "basketball",
        enabledSports: ["basketball", "lacrosse", "gymnastics"],
        setupCompleted: true,
      }),
    ).toMatchObject([{ label: "Football", href: "/event/football" }, { label: "Basketball", href: "/event/sport-events?sport=basketball" }]);
  });

  test("routes a gymnastics primary to its specialized builder", () => {
    expect(
      sportsLink({
        primarySport: "gymnastics",
        enabledSports: ["gymnastics"],
        setupCompleted: true,
      }),
    ).toMatchObject([{ label: "Football", href: "/event/football" }, { label: "Gymnastics", href: "/event/gymnastics" }]);
  });

  test("hides sports navigation when Sports is disabled", () => {
    expect(getTemplateLinks(["birthdays"], ["snap"], undefined)).toHaveLength(1);
    expect(getTemplateLinks([], ["snap"], undefined)).toEqual([]);
  });
});

describe("create event route matching", () => {
  test("matches category launchers and their customize routes", () => {
    expect(matchesCreateEventHrefPath("/event/gymnastics", "/event/gymnastics")).toBe(true);
    expect(matchesCreateEventHrefPath("/event/gymnastics/customize", "/event/gymnastics")).toBe(
      true,
    );
    expect(matchesCreateEventHrefPath("/event/birthdays", "/event/birthdays/customize")).toBe(true);
    expect(
      matchesCreateEventHrefPath(
        "/event/sport-events/customize",
        "/event/sport-events?sport=lacrosse",
      ),
    ).toBe(true);
  });

  test("recognizes all enabled builder route families", () => {
    for (const path of [
      "/event/birthdays",
      "/event/birthdays/customize",
      "/event/weddings",
      "/event/weddings/customize",
      "/event/baby-showers",
      "/event/baby-showers/customize",
      "/event/gender-reveal",
      "/event/gender-reveal/customize",
      "/event/sport-events",
      "/event/sport-events/customize?sport=soccer",
      "/event/gymnastics",
      "/event/gymnastics/customize?edit=meet-id",
    ]) {
      expect(isCreateEventRoute(path)).toBe(true);
    }
  });

  test("selects the personalized sports row when a specialized sports route has no row", () => {
    const items = [
      { label: "Weddings", href: "/event/weddings" },
      { label: "Sports", href: "/event/sport-events" },
    ];

    expect(findActiveCreateEventItem("/event/gymnastics", items)?.label).toBe("Sports");
    expect(findActiveCreateEventItem("/event/gymnastics/customize", items)?.label).toBe(
      "Sports",
    );
  });

  test("prefers an exact sports row over the personalized sports fallback", () => {
    const items = [
      { label: "Soccer", href: "/event/soccer/customize" },
      { label: "Sports", href: "/event/sport-events" },
    ];

    expect(findActiveCreateEventItem("/event/soccer/customize", items)?.label).toBe(
      "Soccer",
    );
  });

  test("does not classify saved event and registry routes as builders", () => {
    for (const path of [
      "/event",
      "/event/summer-party-123",
      "/event/weddings/couple-id/registry",
      "/smart-signup-form/form-id",
    ]) {
      expect(isCreateEventRoute(path)).toBe(false);
    }
  });
});


describe("restored football navigation", () => {
  test("uses one dedicated entry for a football primary", () => {
    expect(sportsLink({ primarySport: "football", enabledSports: ["football"], setupCompleted: true }))
      .toMatchObject([{ label: "Football", href: "/event/football" }]);
  });
  test("supports football-only visibility and old editor links", () => {
    expect(getTemplateLinks(["football_season"], ["snap"]))
      .toMatchObject([{ label: "Football", href: "/event/football" }]);
    expect(isCreateEventRoute("/event/football-season/customize?edit=saved-id")).toBe(true);
    expect(findActiveCreateEventItem("/event/football-season/customize", [{label:"Football", href:"/event/football"}])?.label).toBe("Football");
    expect(getTemplateLinks([], ["snap"])).toEqual([]);
  });
});
