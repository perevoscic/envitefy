import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const schema = readFileSync("src/features/event-pages/schemas/eventBlueprint.schema.ts", "utf8");
const renderer = readFileSync("src/features/event-pages/renderer/SectionRenderer.tsx", "utf8");
const route = readFileSync("src/app/e/[slug]/page.tsx", "utf8");
const db = readFileSync("src/lib/db.ts", "utf8");
const prompt = readFileSync("src/features/event-pages/ai/generateEventBlueprint.ts", "utf8");
const conciergeV2Storage = readFileSync("src/lib/concierge-v2/storage.ts", "utf8");
const presets = readFileSync("src/features/event-pages/ai/blueprintPresets.ts", "utf8");

test("dynamic event page schema includes required section and action registries", () => {
  for (const section of [
    "hero",
    "quick_details",
    "schedule_timeline",
    "location",
    "rsvp",
    "registry",
    "travel",
    "people",
    "checklist",
    "faq",
    "announcement",
    "forms",
    "gallery",
    "links",
    "team_notes",
  ]) {
    assert.match(schema, new RegExp(`"${section}"`));
  }
  for (const action of ["save_to_calendar", "get_directions", "rsvp", "share_page"]) {
    assert.match(schema, new RegExp(`"${action}"`));
  }
});

test("renderer uses a bounded section registry instead of arbitrary JSX", () => {
  assert.match(renderer, /section\.type === "hero"/);
  assert.match(renderer, /section\.type === "quick_details"/);
  assert.match(renderer, /section\.type === "schedule_timeline"/);
  assert.match(renderer, /section\.type === "rsvp"/);
  assert.doesNotMatch(renderer, /dangerouslySetInnerHTML/);
  assert.doesNotMatch(renderer, /eval\(/);
});

test("public dynamic route validates stored blueprints and falls back deterministically", () => {
  assert.match(route, /validateEventPageBlueprint/);
  assert.match(route, /generateDeterministicEventBlueprint/);
  assert.match(route, /getEventPageBySlug/);
});

test("database layer stores versioned dynamic event pages", () => {
  assert.match(db, /create table if not exists dynamic_event_pages/);
  assert.match(db, /create table if not exists dynamic_event_page_versions/);
  assert.doesNotMatch(db, /create table if not exists event_pages \(/);
  assert.match(db, /insertEventPageVersion/);
  assert.match(db, /publishEventPage/);
});

test("AI blueprint prompt bans raw React and arbitrary CSS", () => {
  assert.match(prompt, /Do not return React/);
  assert.match(prompt, /raw CSS/);
  assert.match(prompt, /strict JSON/);
});

test("Concierge V2 apply publishes dynamic event page blueprints", () => {
  assert.match(conciergeV2Storage, /generateDeterministicEventBlueprint/);
  assert.match(conciergeV2Storage, /upsertEventPageDraft/);
  assert.match(conciergeV2Storage, /publishEventPage/);
  assert.match(conciergeV2Storage, /const eventPath = `\/e\/\$\{encodeURIComponent/);
  assert.match(conciergeV2Storage, /legacyEventPath/);
});

test("legacy verticals migrate through blueprint presets instead of React templates", () => {
  for (const mode of [
    "gymnastics_meet",
    "wedding_weekend",
    "shower_or_registry_event",
    "sports_team_event",
    "simple_social_event",
  ]) {
    assert.match(presets, new RegExp(`mode: "${mode}"`));
  }
  assert.match(presets, /defaultSections/);
  assert.doesNotMatch(presets, /tsx|React\.createElement|dangerouslySetInnerHTML/);
});
