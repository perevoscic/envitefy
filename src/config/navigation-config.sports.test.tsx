import { describe, expect, test } from "bun:test";
import { TEMPLATE_KEYS } from "./feature-visibility";
import {
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
