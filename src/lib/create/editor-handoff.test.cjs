const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const test = require("node:test");
const ts = require("typescript");
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (request, parent, ...rest) { return originalResolve.call(this, request.startsWith("@/") ? path.resolve("src", request.slice(2)) : request, parent, ...rest); };
for (const extension of [".ts", ".tsx"]) Module._extensions[extension] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, "utf8"), { fileName: filename, compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText, filename);
const { emptyCustomEventDetails } = require("../event-custom-design.ts");
const { hydrateCreationValue, creationComposition, creationNativePayload, creationSignupForm, creationLiveCardForm } = require("./editor-handoff.ts");
const { getCreationTemplates } = require("./template-selection.ts");
const { galleryCreationGuess } = require("./gallery-intake.ts");
const info = { version: 1, kind: "information", category: "birthdays", design: { version: 1, name: "Imported", description: "", layout: "banner", font: "editorial", colors: { page: "#ffffff", surface: "#ffffff", ink: "#000000", accent: "#675cf4" } }, details: { ...emptyCustomEventDetails(), title: "Maya's 7th birthday", date: "2027-05-03", time: "14:30", venue: "Riverside Park", location: "123 River Rd", description: "Bring a picnic blanket.", host: "Lee", rsvpEnabled: true, rsvpPhone: "5551234567", sections: [{ title: "Arrival", body: "Use the east entrance." }], registryLinks: [{ label: "Gift list", url: "https://example.com/gifts" }] } };

test("native hydration keeps structural design state and replaces sample facts without inventing missing details", () => {
  const initial = { childName: "Emma", age: 5, date: "2030-01-01", city: "Chicago", state: "IL", partyDetails: { activities: "Sample game", theme: "Princess", notes: "Sample" }, theme: { font: "playfair" }, hosts: [{ name: "Sample host" }], registries: [], gallery: [{ url: "sample.jpg" }], rsvp: { deadline: "2030-01-01" }, images: { hero: "approved-art.jpg" } };
  const before = structuredClone(initial), hydrated = hydrateCreationValue("birthdays", "data", initial, info, "rainbow_confetti_splash");
  assert.deepEqual(initial, before);
  assert.equal(hydrated.headlineTitle, info.details.title);
  assert.equal(hydrated.childName, "Maya"); assert.equal(hydrated.age, 7);
  assert.equal(hydrated.date, "2027-05-03"); assert.equal(hydrated.address, "123 River Rd");
  assert.equal(hydrated.city, ""); assert.equal(hydrated.state, "");
  assert.equal(hydrated.partyDetails.activities, ""); assert.deepEqual(hydrated.gallery, []);
  assert.equal(hydrated.images.hero, "approved-art.jpg");
  assert.equal(hydrated.theme.font, "playfair");
  assert.equal(hydrated.rsvp.deadline, "");
  assert.deepEqual(hydrated.registries[0], { id: 1, ...info.details.registryLinks[0] });
  assert.equal(creationComposition(info).sections[0].body, "Use the east entrance.");
  assert.match(creationComposition(info).sections[1].body, /5551234567/);
  const payload = creationNativePayload({ title: "Current edited title", data: { start: "incorrect-host-zone" } }, { data: { ...hydrated, timezone: "America/New_York", date: "2027-05-03", time: "14:30" } });
  assert.equal(payload.title, "Current edited title"); assert.equal(payload.data.start, "2027-05-03T18:30:00.000Z");
  assert.equal(payload.data.end, null); assert.equal(payload.data.rsvpPhone, "5551234567");
});
test("gymnastics shared saves keep the nested builder event on the same venue-local dates", () => {
  const fields = { date: "2027-01-16", time: "08:00", endDate: "2027-01-16", endTime: "10:00", timezone: "America/Los_Angeles" };
  const draft = { event: { title: "Preserved meet", startISO: "browser-zone-error" }, venue: { venue: "Arena" }, advancedSections: { meet: { doorsOpen: "7 AM" } } };
  const payload = { title: "Preserved meet", data: { category: "gymnastics", builderDraft: draft } };
  const saved = creationNativePayload(payload, { data: fields });
  assert.equal(saved.data.startISO, "2027-01-16T16:00:00.000Z");
  assert.equal(saved.data.endISO, "2027-01-16T18:00:00.000Z");
  assert.equal(saved.data.builderDraft.event.startISO, saved.data.startISO);
  assert.equal(saved.data.builderDraft.event.endISO, saved.data.endISO);
  assert.equal(saved.data.builderDraft.event.gymnasticsDateVersion, 1);
  assert.deepEqual(saved.data.builderDraft.venue, draft.venue);
  assert.deepEqual(saved.data.builderDraft.advancedSections, draft.advancedSections);
  assert.equal(draft.event.startISO, "browser-zone-error", "normalization never mutates the editor's captured payload");
  const allDay = creationNativePayload(payload, { data: { ...fields, date: "2026-03-06", time: "", endDate: "2026-03-08", endTime: "" } });
  assert.equal(allDay.data.startISO, "2026-03-06");
  assert.equal(allDay.data.endISO, "2026-03-09");
  assert.equal(allDay.data.builderDraft.event.allDay, true);
});
test("each recommended native design resolves to the matching actual catalog and sport", () => {
  for (const guess of [{ category: "birthdays", sport: null }, { category: "weddings", sport: null }, { category: "general", sport: null }, { category: "sports", sport: "football" }, { category: "sports", sport: "gymnastics" }, { category: "sports", sport: "soccer" }, { category: "signup-forms", sport: null }]) {
    const designs = getCreationTemplates(guess);
    assert.ok(designs.length > 0, JSON.stringify(guess));
    assert.ok(designs.every(design => design.id && design.title && design.href.startsWith("/") && /^(\/|https:\/\/)/.test(design.imageUrl)));
    if (guess.sport === "soccer") assert.ok(designs.every(design => design.id.startsWith("soccer--")));
    if (guess.sport === "football") assert.ok(designs.every(design => design.href.startsWith("/event/football/customize")));
  }
});
test("gallery intake preserves each sport context and keeps an unspecified sport unresolved", () => {
  for (const [category, sport] of Object.entries({ gymnastics: "gymnastics", football: "football", soccer: "soccer", cheerleading: "cheerleading", "dance-ballet": "dance", "sport-events": null })) assert.deepEqual(galleryCreationGuess(category), { category: "sports", sport });
  assert.deepEqual(galleryCreationGuess("birthdays"), { category: "birthdays", sport: null });
});
test("explicit product adapters preserve source facts while importing no participants or generated artwork", () => {
  const signup = creationSignupForm(info, getCreationTemplates({ category: "signup-forms", sport: null })[0].id);
  assert.equal(signup.title, info.details.title); assert.equal(signup.sections[0].kind, "info");
  assert.deepEqual(signup.sections[0].slots, []); assert.deepEqual(signup.responses, []);
  const card = creationLiveCardForm(info);
  assert.equal(card.title, info.details.title); assert.equal(card.eventType, "Birthday");
  assert.equal(card.creationCategory, "birthdays");
  assert.equal(card.locations[0].address, "123 River Rd"); assert.equal(card.locations[0].resolution, "unresolved");
  assert.equal(card.design, ""); assert.match(card.instructions, /Use the east entrance/);
  const sportsCard = creationLiveCardForm({ ...info, category: "gymnastics" });
  const { readLiveCardForm } = require("../livecard-builder.ts");
  assert.equal(sportsCard.creationCategory, "gymnastics");
  assert.equal(readLiveCardForm(sportsCard).creationCategory, "gymnastics", "source category survives the card form boundary");
});
