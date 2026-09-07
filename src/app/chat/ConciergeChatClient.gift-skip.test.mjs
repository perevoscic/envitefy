import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import ts from "typescript";
import { buildAssistantMessage, fallbackExtractConciergeDraft } from "../../lib/concierge/fallback.ts";
import { getCreationReadiness } from "../../lib/concierge/readiness.ts";

const client = fs.readFileSync(new URL("./ConciergeChatClient.tsx", import.meta.url), "utf8");
const giftHelpers = client.slice(
  client.indexOf("const GIFT_FRIENDLY_DRAFT_EVENT_TYPES"),
  client.indexOf("function giftRegistryNounForDraft"),
);
const shouldOfferGiftRegistry = new Function(
  "getCreationReadiness",
  `${ts.transpile(giftHelpers)}; return shouldOfferGiftRegistryForDraft;`,
)(getCreationReadiness);

function birthdayDraft() {
  let draft = fallbackExtractConciergeDraft({
    message: "Birthday Live Card",
    requestedOutputs: ["live_card"],
    action: "starter_category",
    starterCategory: "Birthday",
  });
  for (const message of [
    "Livia, 10, grand Boulevard amc, the forgotten island movie theme",
    "she like katseyes and needoh. no rsvp",
  ]) draft = fallbackExtractConciergeDraft({ message, draft });
  return draft;
}

test("gift controls wait for unanswered date and time before offering an optional link", () => {
  let draft = birthdayDraft();
  assert.equal(draft.currentQuestion, "date");
  assert.equal(getCreationReadiness(draft).canPreview, true);
  assert.equal(shouldOfferGiftRegistry(draft), false);

  draft = fallbackExtractConciergeDraft({ message: "September 26 2099", draft });
  assert.equal(draft.currentQuestion, "time");
  assert.equal(shouldOfferGiftRegistry(draft), false);

  draft = fallbackExtractConciergeDraft({ message: "3pm", draft });
  assert.equal(draft.currentQuestion, null);
  assert.equal(shouldOfferGiftRegistry(draft), true);

  draft = fallbackExtractConciergeDraft({ message: "Skip gift link", draft });
  assert.equal(shouldOfferGiftRegistry(draft), false);
  assert.doesNotMatch(buildAssistantMessage(draft), /What date is|What date should|What time should it start/i);
});

test("first and repeated gift skips keep the unanswered schedule question and captured facts", () => {
  let draft = birthdayDraft();
  for (const step of ["date", "time"]) {
    if (step === "time") {
      draft = fallbackExtractConciergeDraft({ message: "September 26 2099", draft });
    }
    for (let attempt = 0; attempt < 2; attempt += 1) {
      draft = fallbackExtractConciergeDraft({ message: "Skip gift link", draft });
      assert.equal(draft.currentQuestion, step);
      assert.ok(draft.missingFields.includes(step));
      assert.equal(draft.giftPromptDismissed, true);
      assert.equal(draft.honoreeName, "Livia");
      assert.equal(draft.location, "grand Boulevard amc");
      assert.equal(draft.rsvpEnabled, false);
      assert.match(
        buildAssistantMessage(draft),
        step === "date" ? /What date is Livia’s birthday celebration\?|rough date works/ : /What time should it start\?|rough time is enough/,
      );
    }
  }
  draft = fallbackExtractConciergeDraft({ message: "3pm", draft });
  draft = fallbackExtractConciergeDraft({ message: "Skip gift link", draft });
  assert.equal(buildAssistantMessage(draft), "Already skipped — we’re good there.");
});

test("active chat composer omits preview promotion and persistent product choices", () => {
  const composer = client.slice(client.indexOf("const composer ="), client.indexOf("const readyActions ="));
  assert.match(composer, /\{isEmptyState \? \(\s*<div\s*role="group"\s*aria-label="Choose product format"/);
  assert.doesNotMatch(client, /Generate draft preview|Review the design first|shouldShowReadyActions/);
  assert.match(client, /canGenerateProduct && draft && isGenerateConfirmationMessage\(value\)/);
});
