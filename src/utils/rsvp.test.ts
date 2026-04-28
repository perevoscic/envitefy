import assert from "node:assert/strict";
import test from "node:test";

import {
  cleanRsvpContactLabel,
  isGenericRsvpContactLabel,
  stripLeadingHostArticle,
} from "./rsvp.ts";

test("cleanRsvpContactLabel removes generic question and text instructions", () => {
  assert.equal(cleanRsvpContactLabel("Questions? Text (555) 014-2277"), "");
  assert.equal(cleanRsvpContactLabel("Questions? Text"), "");
  assert.equal(isGenericRsvpContactLabel("Questions? Text"), true);
});

test("cleanRsvpContactLabel keeps real RSVP names after instruction words", () => {
  assert.equal(cleanRsvpContactLabel("RSVP to Maria at 555-123-4567"), "Maria");
  assert.equal(cleanRsvpContactLabel("Text Coach Maria at (555) 014-2277"), "Coach Maria");
  assert.equal(cleanRsvpContactLabel("Contact information: Coach Maria"), "Coach Maria");
  assert.equal(
    cleanRsvpContactLabel("Hosted by the Neighborhood Rec Group"),
    "Neighborhood Rec Group",
  );
});

test("stripLeadingHostArticle removes leading the from host display names", () => {
  assert.equal(stripLeadingHostArticle("the Neighborhood Rec Group"), "Neighborhood Rec Group");
  assert.equal(stripLeadingHostArticle("The Smith Family"), "Smith Family");
  assert.equal(stripLeadingHostArticle("Neighborhood Rec Group"), "Neighborhood Rec Group");
});
