import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import ts from "typescript";
import { fallbackExtractConciergeDraft } from "./fallback.ts";
import { normalizeConciergeDraft } from "./extract.ts";
import { buildProductArtworkPrompt, buildProductCopyPrompt } from "../studio/product-prompts.ts";
import { resolveStudioProduct } from "../studio/product-contract.ts";

const exactLines = ["Ready, set, celebrate!", "No gifts, please."];
const opening = `Nora is turning 7. Create a birthday invitation on October 30, 2099 at 2 PM at Maple Community Center, Austin, TX. Please keep the exact lines '${exactLines[0]}' and '${exactLines[1]}'. Rainbow theme.`;

function journey(output) {
  let draft = fallbackExtractConciergeDraft({ message: opening, requestedOutputs: [output] });
  for (const message of [
    "It ends at 4 PM. The RSVP contact is Priya at mom.birthday@example.invalid.",
    "Will people be able to RSVP from the link?",
    "Change the location to Oak Community Hall, Austin, TX.",
    "Keep this same event and every approved line. Make the artwork dark blue with larger letters.",
  ]) draft = fallbackExtractConciergeDraft({ message, draft, requestedOutputs: [output] });
  return draft;
}

for (const output of ["live_card", "digital_flyer", "event_page"]) {
  test(`${output}: exact guest lines survive logistics, questions, corrections, artwork and faulty model copy`, () => {
    const fallback = journey(output);
    assert.equal(fallback.copyStatus, "ready");
    assert.equal(fallback.previewCopy.body, exactLines.join("\n\n"));
    const normalized = normalizeConciergeDraft({ previewCopy: { body: "A generic replacement invitation." } }, fallback, {
      message: "It ends at 4 PM.", previousDraft: fallback,
    });
    assert.equal(normalized.copyStatus, "ready");
    assert.equal(normalized.previewCopy.body, fallback.previewCopy.body);
  });
}

test("quoted exact guest wording supports bilingual lines and explicit replacements without changing the title", () => {
  const draft = fallbackExtractConciergeDraft({
    message: "Create a baby shower flyer for Mia. Please use both exact lines: 'A little sunshine is on the way' and 'Un rayito de sol viene en camino'.",
    requestedOutputs: ["digital_flyer"],
  });
  assert.equal(draft.previewCopy.body, "A little sunshine is on the way\n\nUn rayito de sol viene en camino");
  const next = fallbackExtractConciergeDraft({ draft, message: "Replace the exact line 'A little sunshine is on the way' with 'Our little sunshine is on the way'." });
  assert.equal(next.previewCopy.body, "Our little sunshine is on the way\n\nUn rayito de sol viene en camino");
  assert.equal(next.title, draft.title);
});

test("quotes in design notes and later unrelated instructions never become guest wording", () => {
  const draft = fallbackExtractConciergeDraft({
    message: "Create a birthday flyer for Nora, turning 7. The theme is 'rainbow sparkle'. Please keep the exact line 'Ready, set, celebrate!'. Set the location to 'Oak Hall'.",
    requestedOutputs: ["digital_flyer"],
  });
  assert.equal(draft.previewCopy.body, "Ready, set, celebrate!");
  assert.doesNotMatch(draft.previewCopy.body, /rainbow sparkle|Oak Hall/);
});

test("the actual chat generation details mark exact guest copy approved for the studio prompts", () => {
  const source = fs.readFileSync(new URL("../../app/chat/ConciergeChatClient.tsx", import.meta.url), "utf8");
  const ast = ts.createSourceFile("chat.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const names = new Set(["draftHeadline", "draftSubheadline", "uniqueDisplayLine", "additionalLocationLine", "additionalLocationNarrative", "studioCategoryForDraft", "dateInputFromDraft", "localDateInputFromIso", "timeInputFromDraft", "draftVisualDirection", "buildStudioDetailsFromDraft"]);
  const helpers = ast.statements.filter(node => ts.isFunctionDeclaration(node) && names.has(node.name?.text));
  assert.equal(helpers.length, names.size);
  const build = new Function("stringValue", "createInitialDetails", "skinLabelForDraft", `${ts.transpile(helpers.map(node => node.getText(ast)).join("\n"))}; return buildStudioDetailsFromDraft;`)(
    value => typeof value === "string" ? value.trim() || null : null, () => ({}), () => "Birthday",
  );
  let detailsStatement;
  function visit(node) {
    if (ts.isFunctionDeclaration(node) && node.name?.text === "generateStudioInviteForDraft") {
      detailsStatement = node.body.statements.find(statement => ts.isVariableStatement(statement) && statement.declarationList.declarations.some(declaration => declaration.name.getText(ast) === "details"));
    }
    ts.forEachChild(node, visit);
  }
  visit(ast);
  assert.ok(detailsStatement);
  const buildGenerationDetails = new Function("buildStudioDetailsFromDraft", "resolveStudioProduct", "draftToGenerate", `${ts.transpile(detailsStatement.getText(ast))}; return details;`);
  for (const output of ["live_card", "digital_flyer", "event_page"]) {
    const details = buildGenerationDetails(build, resolveStudioProduct, journey(output));
    assert.equal(details.approvedWording, exactLines.join("\n\n"));
    assert.match(details.detailsDescription, /Ready, set, celebrate!/);
    const event = { title: details.eventTitle, category: details.category, description: details.detailsDescription, approvedWording: details.approvedWording };
    const prompt = buildProductCopyPrompt(event, undefined, output);
    for (const line of exactLines) assert.ok(prompt.includes(line));
    const artwork = buildProductArtworkPrompt(event, undefined, null, output, 0);
    for (const line of exactLines) assert.ok(artwork.includes(line));
    if (output === "event_page") assert.match(artwork, /No visible words/);
  }
});
