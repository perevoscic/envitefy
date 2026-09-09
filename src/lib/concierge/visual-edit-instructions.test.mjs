import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import ts from "typescript";
import { fallbackExtractConciergeDraft } from "./fallback.ts";
import { shouldRegenerateGeneratedDraftImageForEdit } from "./artwork-change.ts";
import { extractVisualDirection, hasVisualChangeWords, normalizeArtworkEditLanguage, requestedArtworkRequirements } from "./visual-direction.ts";

const correction = "NO band memebrer, maket erhe text to bu cursvie in Livia is trunin 10";
const base = () => fallbackExtractConciergeDraft({ message: "Create a birthday live card for Livia turning 10 on September 26 2099 at 3pm at AMC Grand Boulevard. Use a Katseye and NeeDoh studio theme. No RSVP." });

test("the reported correction preserves the subject exclusion and cursive instruction despite typos", () => {
  const before = base();
  const after = fallbackExtractConciergeDraft({ message: correction, draft: before });
  assert.equal(hasVisualChangeWords(correction), true);
  assert.match(extractVisualDirection(correction), /NO band member/);
  assert.match(after.theme, /NO band member/);
  assert.match(after.theme, /cursive/);
  assert.equal(after.title, before.title);
  assert.equal(after.honoreeName, "Livia");
  assert.equal(after.ageOrMilestone, "10");
  assert.equal(after.location, before.location);
  assert.equal(shouldRegenerateGeneratedDraftImageForEdit({ userMessage: correction, previousDraft: before, nextDraft: before, artworkTextMode: "headline" }), true);
  const later = fallbackExtractConciergeDraft({ message: "Change the time to 4pm", draft: after });
  assert.equal(later.theme, after.theme);
});

test("subject removals and font-only changes redraw while guest counts do not", () => {
  for (const message of ["No band members", "Remove the band memebers", "Make the headline cursive", "Use a cursive font", "Remove the portraits"]) {
    assert.equal(hasVisualChangeWords(message), true, message);
  }
  assert.equal(hasVisualChangeWords("20 people"), false);
  assert.equal(hasVisualChangeWords("Change the start time to 4pm"), false);
  assert.deepEqual(requestedArtworkRequirements("No cursive. Add band members."), []);
});

test("full chat edit prompt carries both required visible changes without replacing the headline with typos", () => {
  const client = fs.readFileSync(new URL("../../app/chat/ConciergeChatClient.tsx", import.meta.url), "utf8");
  const helpers = client.slice(client.indexOf("function quoteDraftEditValue"), client.indexOf("function refreshGeneratedDraftInviteMetadata"));
  const build = new Function("stringValue", "normalizeArtworkEditLanguage", "requestedArtworkRequirements", `${ts.transpile(helpers)}; return buildGeneratedDraftImageEditPrompt;`)(
    (value) => typeof value === "string" ? value.trim() : null,
    normalizeArtworkEditLanguage, requestedArtworkRequirements,
  );
  const draft = base();
  const prompt = build({ userMessage: correction, previousDraft: draft, nextDraft: draft });
  assert.match(prompt, /Remove every band member/);
  assert.match(prompt, /entire birthday headline.*cursive\/script/);
  assert.match(prompt, /spelling mistakes.*not replacement invitation copy/);
  assert.match(prompt, /unless a new lettering style was requested/);
  assert.doesNotMatch(prompt, /Replace only the visible title text/);
});
