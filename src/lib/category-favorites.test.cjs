const test = require("node:test");
const assert = require("node:assert/strict");
const load = require("../../scripts/lib/event-messages-test-loader.cjs");
const favorites = load("src/lib/category-favorites.ts");
const { resolveCreationAccess } = load("src/lib/creation-access.ts");
const { isCreateEventRoute } = load("src/config/navigation-config.tsx");

test("favorites preserve distinct collection identities and saved order without accepting destinations", () => {
  assert.deepEqual(
    favorites.normalizePinnedCategoryIds([
      "school",
      "general",
      "gymnastics",
      "school",
      "https://example.test",
      "/event/weddings",
      null,
    ]),
    ["school", "general", "gymnastics"],
  );
  assert.equal(
    new Set(favorites.CATEGORY_FAVORITES.map((item) => item.id)).size,
    favorites.CATEGORY_FAVORITES.length,
  );
  const standard = resolveCreationAccess();
  const pins = favorites.categoryFavoritesFor(["gymnastics", "school", "birthdays"], standard);
  assert.deepEqual(
    pins.map((item) => item.href),
    ["/event/gymnastics", "/event/school", "/event/birthdays"],
  );
});

test("signup context selects a separate permitted creation default without automatically pinning favorites", () => {
  assert.deepEqual(favorites.resolvePinnedCategoryIds(undefined, "gymnastics"), []);
  assert.deepEqual(favorites.resolvePinnedCategoryIds(undefined, "legacy", "gymnastics"), []);
  assert.deepEqual(favorites.resolvePinnedCategoryIds([], "gymnastics", "gymnastics"), []);
  assert.deepEqual(favorites.resolvePinnedCategoryIds(["school"], "gymnastics"), ["school"]);
  assert.deepEqual(favorites.resolvePinnedCategoryIds(undefined, "football"), []);
  const standard = resolveCreationAccess();
  assert.equal(
    favorites.defaultCreationCategoryFor("gymnastics", null, standard)?.id,
    "gymnastics",
  );
  assert.equal(
    favorites.defaultCreationCategoryFor("legacy", "gymnastics", standard)?.id,
    "gymnastics",
  );
  assert.equal(favorites.defaultCreationCategoryFor("unknown", null, standard), null);
  assert.equal(
    favorites.defaultCreationCategoryFor(
      "gymnastics",
      null,
      resolveCreationAccess({
        policy: "restricted",
        categories: ["weddings"],
        products: ["event_page"],
      }),
    ),
    null,
  );
  assert.equal(
    favorites.defaultCreationCategoryFor(
      "gymnastics",
      null,
      resolveCreationAccess({
        policy: "restricted",
        categories: ["gymnastics"],
        products: ["snap"],
      }),
    ),
    null,
  );
});

test("favorite visibility follows current product and category grants, including shared collections and sports", () => {
  const restricted = resolveCreationAccess({
    policy: "restricted",
    categories: ["general", "soccer"],
    products: ["event_page"],
  });
  assert.deepEqual(
    favorites.filterPinnedCategoryIds(
      ["school", "birthdays", "soccer", "gymnastics", "general", "basketball"],
      restricted,
    ),
    ["school", "soccer", "general"],
  );
  assert.deepEqual(
    favorites.filterPinnedCategoryIds(
      ["gymnastics"],
      resolveCreationAccess({
        policy: "restricted",
        categories: ["gymnastics"],
        products: ["snap"],
      }),
    ),
    [],
  );
  const otherSports = resolveCreationAccess({
    policy: "restricted",
    categories: ["sport-events"],
    products: ["event_page"],
  });
  assert.deepEqual(
    favorites.filterPinnedCategoryIds(
      ["soccer", "gymnastics", "basketball", "sport-events"],
      otherSports,
    ),
    ["basketball", "sport-events"],
  );
  const formsOnly = resolveCreationAccess({
    policy: "restricted",
    categories: [],
    products: ["signup_form"],
  });
  assert.deepEqual(
    favorites.filterPinnedCategoryIds(["signup-forms", "school", "gymnastics"], formsOnly),
    ["signup-forms"],
  );
  assert.deepEqual(
    favorites.categoryFavoritesFor(["signup-forms"], formsOnly).map((item) => item.href),
    ["/signup-forms/templates"],
  );
  assert.deepEqual(favorites.filterPinnedCategoryIds(["signup-forms"], restricted), []);
});

test("query-aware active favorites do not highlight different collections or sports", () => {
  const active = (path, query = "") =>
    favorites.CATEGORY_FAVORITES.filter((item) =>
      favorites.isCategoryFavoriteActive(item, path, new URLSearchParams(query)),
    ).map((item) => item.id);
  assert.deepEqual(active("/event/general", "collection=school"), ["school"]);
  assert.deepEqual(active("/event/school"), ["school"]);
  assert.deepEqual(
    active("/event/general/customize", "collection=graduations&templateId=graduation"),
    ["graduations"],
  );
  assert.deepEqual(active("/event/general"), ["general"]);
  assert.deepEqual(active("/event/sport-events", "sport=soccer"), ["soccer"]);
  assert.deepEqual(active("/event/sport-events/customize", "sport=dance"), ["dance-ballet"]);
  assert.deepEqual(active("/event/sport-events"), ["sport-events"]);
  assert.deepEqual(active("/bridal-showers/templates"), ["bridal-showers"]);
  assert.deepEqual(active("/bridal-showers/templates/design-id/customize"), ["bridal-showers"]);
  assert.deepEqual(active("/bridal-showers/templates/private-saved-event"), []);
  assert.deepEqual(active("/event/baby-showers/customize", "occasion=bridal-shower"), [
    "bridal-showers",
  ]);
  assert.deepEqual(active("/event/baby-showers"), ["baby-showers"]);
  assert.deepEqual(active("/event/general", "collection=holidays-seasonal&occasion=veterans-day"), ["holidays-seasonal:veterans-day"]);
  assert.deepEqual(active("/event/general/customize", "collection=holidays-seasonal&occasion=fall-harvest"), ["holidays-seasonal:fall-harvest"]);
  assert.deepEqual(active("/event/general", "collection=holidays-seasonal"), ["holidays-seasonal"]);
  assert.deepEqual(active("/event/private-saved-event"), []);
  assert.deepEqual(active("/signup-forms/templates"), ["signup-forms"]);
  assert.equal(isCreateEventRoute("/bridal-showers/templates"), true);
  assert.equal(isCreateEventRoute("/bridal-showers/templates/design-id/customize"), true);
  assert.equal(isCreateEventRoute("/bridal-showers/templates/private-saved-event"), false);
});

test("Create and landing targets resolve exact permitted holiday, collection and sport favorites", () => {
  const id = target => favorites.categoryFavoriteFor(target)?.id;
  assert.equal(id({ category: "holidays-seasonal", occasion: "veterans-day" }), "holidays-seasonal:veterans-day");
  assert.equal(id({ category: "general", collection: "holidays-seasonal", occasion: "fall-harvest" }), "holidays-seasonal:fall-harvest");
  assert.equal(id({ category: "sports", sport: "dance" }), "dance-ballet");
  assert.equal(id({ category: "sport-events", sport: "soccer" }), "soccer");
  assert.equal(id({ category: "sports" }), "sport-events");
  assert.equal(id({ category: "general", collection: "graduations" }), "graduations");
  assert.equal(id({ category: "baby-showers", occasion: "bridal-shower" }), "bridal-showers");
  assert.equal(id({ category: "holidays-seasonal", occasion: "invalid" }), undefined);
  const target = favorites.categoryFavoriteFor({ category: "holidays-seasonal", occasion: "veterans-day" });
  assert.equal(target.href, "/event/general?collection=holidays-seasonal&occasion=veterans-day");
  assert.deepEqual(favorites.filterPinnedCategoryIds([target.id], resolveCreationAccess({
    policy: "restricted", products: ["event_page"], categories: ["gymnastics"],
  })), []);
});
