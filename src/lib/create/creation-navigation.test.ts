import { expect, test } from "bun:test";
import { TEMPLATE_DEFINITIONS } from "../../config/feature-visibility";
import { creationChoicesFromLinks, creationGuessFromHref } from "./creation-navigation";

test("Baby and Bridal Shower preferences resolve to distinct event types through legacy routes", () => {
  const links = TEMPLATE_DEFINITIONS.filter((item) =>
    ["baby_showers", "bridal_showers"].includes(item.key),
  );
  expect(creationChoicesFromLinks(links).map((item) => item.guess)).toEqual([
    { category: "baby-showers", sport: null },
    { category: "bridal-showers", sport: null },
  ]);
  expect(creationGuessFromHref("/event/bridal-showers")).toEqual({
    category: "bridal-showers",
    sport: null,
  });
});

test("route aliases cannot duplicate manual choices or replace preferred order", () => {
  const choices = creationChoicesFromLinks([
    { href: "/event/baby-showers", label: "Baby Showers" },
    { href: "/event/baby-showers/customize", label: "Same baby editor" },
    { href: "/event/baby-showers/customize?occasion=bridal-shower", label: "Bridal Showers" },
    { href: "/event/bridal-showers", label: "Same bridal gallery" },
    { href: "/event/football", label: "Football" },
    { href: "/event/football-season/customize", label: "Same football editor" },
  ]);
  expect(choices.map((item) => item.label)).toEqual(["Baby Showers", "Bridal Showers", "Football"]);
  expect(new Set(choices.map((item) => `${item.guess.category}:${item.guess.sport}`)).size).toBe(
    choices.length,
  );
});

test("sports aliases retain their actual sport while product and unrelated links are excluded", () => {
  expect(creationGuessFromHref("/event/sport-events?sport=dance-ballet")).toEqual({
    category: "sports",
    sport: "dance",
  });
  expect(creationGuessFromHref("/event/dance-ballet/customize")).toEqual({
    category: "sports",
    sport: "dance",
  });
  expect(creationGuessFromHref("/event/soccer/customize")).toEqual({
    category: "sports",
    sport: "soccer",
  });
  expect(creationGuessFromHref("/event/sport-events")).toEqual({ category: "sports", sport: null });
  expect(creationGuessFromHref("/event/anniversaries")).toEqual({
    category: "anniversaries",
    sport: null,
  });
  expect(creationGuessFromHref("/event/general")).toEqual({ category: "general", sport: null });
  expect(creationGuessFromHref("/signup-forms/templates")).toBeNull();
  expect(creationGuessFromHref("/settings")).toBeNull();
});
