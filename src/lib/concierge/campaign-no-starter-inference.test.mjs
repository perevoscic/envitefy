import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import test, { mock } from "node:test";
import ts from "typescript";
import { fallbackExtractConciergeDraft, buildAssistantMessage } from "./fallback.ts";
import { publicContentForDraft } from "./public-content.ts";
import { getCreationReadiness } from "./readiness.ts";
import { SPORT_ACTIVITY_PROFILES } from "../sports-discovery/profiles.ts";

registerHooks({ resolve(specifier, context, next) {
  const url = specifier.startsWith("@/") ? pathToFileURL(resolve("src", specifier.slice(2))) : specifier.startsWith(".") ? new URL(specifier, context.parentURL) : null;
  return url && existsSync(new URL(`${url}.ts`)) ? next(`${url}.ts`, context) : next(specifier, context);
} });
const { createInitialDetails } = await import("../../app/studio/studio-workspace-sanitize.ts");
const { buildStudioRequest } = await import("../../app/studio/studio-workspace-builders.ts");
const { buildProductArtworkPrompt } = await import("../studio/product-prompts.ts");
const source = readFileSync(new URL("../../app/chat/ConciergeChatClient.tsx", import.meta.url), "utf8");
const ast = ts.createSourceFile("chat.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const names = new Set(["draftHeadline", "draftSubheadline", "uniqueDisplayLine", "additionalLocationLine", "additionalLocationNarrative", "studioCategoryForDraft", "dateInputFromDraft", "localDateInputFromIso", "timeInputFromDraft", "draftVisualDirection", "buildStudioDetailsFromDraft"]);
const helpers = ast.statements.filter(node => ts.isFunctionDeclaration(node) && names.has(node.name?.text));
const buildDetails = new Function("stringValue", "createInitialDetails", "skinLabelForDraft", "publicContentForDraft", `${ts.transpile(helpers.map(node => node.getText(ast)).join("\n"))}; return buildStudioDetailsFromDraft;`)(
  value => typeof value === "string" ? value.trim() || null : null, createInitialDetails, () => "Original design", publicContentForDraft,
);

test.beforeEach(() => mock.timers.enable({ apis: ["Date"], now: new Date("2026-09-19T12:00:00Z") }));
test.afterEach(() => mock.timers.reset());

const categories = [
  ["Maya's birthday", "birthday", "Birthday"],
  ["Maya and Jordan's wedding", "wedding", "Wedding"],
  ["Maya and Jordan's 25th wedding anniversary", "anniversary", "Anniversary"],
  ["Maya's baby shower", "baby_shower", "Baby Shower"],
  ["Maya and Jordan's gender reveal", "gender_reveal", "Baby Shower"],
  ["Maya's bridal shower", "bridal_shower", "Bridal Shower"],
  ["Maya's graduation celebration", "graduation", "Custom Invite"],
  ["Maple gymnastics meet", "gym_meet", "Game Day"],
  ["Maple football game", "football", "Game Day"],
  ["a game day watch party", "game_day", "Game Day"],
  ["a sports event", "sport_event", "Game Day"],
  ["a school field trip", "field_trip", "Field Trip/Day"],
  ["a real estate open house", "open_house", "Open House"],
  ["Maya's housewarming", "housewarming", "Housewarming"],
  ["a medical appointment", "appointment", "Custom Invite"],
  ["a ceramics workshop", "workshop", "Custom Invite"],
  ["a special event", "special_event", "Custom Invite"],
  ["a general event", "general", "Custom Invite"],
];

for (const product of ["live_card", "digital_flyer", "event_page"]) {
  for (const [occasion, eventType, category] of categories) {
    test(`${product}: typed ${eventType} reaches its category guidance without a starter selection`, () => {
      const message = `Create an invitation for ${occasion} on September 23, 2026 at 3 PM at Maple Hall. Theme: warm green and cream.`;
      const draft = fallbackExtractConciergeDraft({ message, requestedOutputs: [product] });
      assert.equal(draft.eventType, eventType);
      const details = { ...buildDetails(draft), product };
      assert.equal(details.category, category);
      assert.equal(details.eventKind, eventType);
      const request = buildStudioRequest(details, "image", product === "event_page" ? "page" : "image");
      assert.equal(request.event.category, category);
      assert.equal(request.product, product);
      assert.match(request.guidance.style, /Interpret the user's theme words/);
      const prompt = buildProductArtworkPrompt(request.event, request.guidance, null, product, 0);
      assert.ok(prompt.includes(JSON.stringify({ category }).slice(1, -1)));
      assert.ok(prompt.includes(JSON.stringify(request.guidance.style).slice(1, -1)));
      assert.match(prompt, product === "event_page" ? /Text-free website hero/ : product === "digital_flyer" ? /Self-contained downloadable invitation/ : /Live card:/);
    });
  }
}

for (const profile of SPORT_ACTIVITY_PROFILES) {
  test(`typed ${profile.label} is recognized without sport picker context`, () => {
    const draft = fallbackExtractConciergeDraft({ message: `Create a live card for our ${profile.label} clinic on September 23, 2026 at 3 PM at Maple Center.`, requestedOutputs: ["live_card"] });
    assert.equal(draft.eventType, profile.key === "gymnastics" ? "gym_meet" : profile.key === "football" ? "football" : "sport_event");
    assert.equal(draft.semanticKind, "clinic");
  });
}

test("specific shower/reveal occasions outrank incidental people and baby descriptions", () => {
  for (const [message, expected] of [
    ["Create a gender reveal invite for our baby girl.", "gender_reveal"],
    ["Create a bridal shower invite for the bride before her wedding.", "bridal_shower"],
    ["Create a baby shower for the newly married couple.", "baby_shower"],
    ["Create a baby shower, not a gender reveal.", "baby_shower"],
    ["Create a wedding invitation, not a bridal shower.", "wedding"],
  ]) assert.equal(fallbackExtractConciergeDraft({ message, requestedOutputs: ["live_card"] }).eventType, expected, message);
});

test("ambiguous occasions ask one event-purpose question without discarding supplied facts", () => {
  for (const message of ["Create an invitation.", "Create an invitation for a shower.", "Create an invitation for a shower on September 23, 2026 at 3 PM at Maple Hall."]) {
    const draft = fallbackExtractConciergeDraft({ message, requestedOutputs: ["live_card"] });
    assert.equal(draft.eventType, "unknown");
    assert.equal(draft.currentQuestion, "what_are_we_celebrating");
    assert.deepEqual(draft.missingFields, ["eventPurpose"]);
    assert.equal(getCreationReadiness(draft).canPreview, false);
    assert.equal(getCreationReadiness(draft).canPublish, false);
    assert.match(buildAssistantMessage(draft), /what.*(?:celebrat|event|for)/i);
    assert.equal((buildAssistantMessage(draft).match(/\?/g) || []).length, 1);
    if (message.includes("September")) {
      assert.ok(draft.startISO?.startsWith("2026-09-23"));
      assert.match(draft.location || draft.venue, /Maple Hall/);
      assert.equal(getCreationReadiness(draft).canSaveDraft, true);
      const clarified = fallbackExtractConciergeDraft({ message: "It is a bridal shower for Maya.", draft, requestedOutputs: ["live_card"] });
      assert.equal(clarified.eventType, "bridal_shower");
      assert.equal(clarified.startISO, draft.startISO);
      assert.equal(clarified.location, draft.location);
    }
  }
  const custom = fallbackExtractConciergeDraft({ message: "Create an invitation for a retirement party on September 23, 2026 at 3 PM at Maple Hall.", requestedOutputs: ["live_card"] });
  assert.notEqual(custom.currentQuestion, "what_are_we_celebrating", "a meaningful custom occasion does not need a fixed category");
  const dancing = fallbackExtractConciergeDraft({ message: "Create a housewarming invitation. We will dance in the garden.", requestedOutputs: ["live_card"] });
  assert.equal(dancing.eventType, "housewarming", "incidental dancing is not a sports event");
  const noProduct = fallbackExtractConciergeDraft({ message: "Hello" });
  assert.doesNotMatch(buildAssistantMessage(noProduct), /choose a category/i);
});
