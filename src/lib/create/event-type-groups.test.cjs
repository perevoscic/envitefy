const assert = require("node:assert/strict");
const test = require("node:test");
const loadTs = require("../../../scripts/lib/event-messages-test-loader.cjs");
const { manualEventTypeChoices, eventTypeGroup, eventTypeChoiceSearchText } = loadTs("src/lib/create/event-type-groups.ts");

const choices = [
  { category: "birthdays", sport: null },
  { category: "general", sport: null },
  { category: "sports", sport: "gymnastics" },
  { category: "birthdays", sport: null },
];
const access = (allowedProducts, allowedCategories = ["birthdays"]) => ({ policy: "restricted", allowedProducts, allowedCategories });

test("the scratch list offers forms under their product grant without adding event page categories", () => {
  assert.deepEqual(manualEventTypeChoices(choices, access(["event_page", "signup_form"])), [
    { category: "birthdays", sport: null }, { category: "signup-forms", sport: null },
  ]);
  assert.deepEqual(manualEventTypeChoices(choices, access(["signup_form"], ["birthdays", "general", "gymnastics"])), [
    { category: "signup-forms", sport: null },
  ]);
  assert.deepEqual(manualEventTypeChoices(choices, access(["event_page"])), [{ category: "birthdays", sport: null }]);
  assert.deepEqual(manualEventTypeChoices(choices, access(["snap"])), []);
  assert.deepEqual(manualEventTypeChoices(choices), []);
});

test("form choices use the existing broad group and support ordinary signup searches", () => {
  const form = { category: "signup-forms", sport: null };
  assert.equal(eventTypeGroup(form), "gatherings");
  for (const query of ["signup", "sign up", "sign-up", "volunteer", "potluck"]) {
    assert.ok(eventTypeChoiceSearchText(form).toLowerCase().includes(query), query);
  }
});
