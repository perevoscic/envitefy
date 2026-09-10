import assert from "node:assert/strict";
import test from "node:test";
import {
  combinePhoneAndFaxCards,
  extractLabeledContactNumbers,
  withMissingContactNumbers,
} from "./contact-numbers.ts";
import { filterRenderedOcrFacts, mergeOcrFacts } from "./facts.ts";
import { extractCommonOcrFactsFromFlyerText } from "./text.ts";

test("adjacent printed phone and fax numbers retain their labels and parentheses", () => {
  const text = "Sample Clinic Phone: (555) 010-0100Fax:(555) 010-0101 Patient ID: 1234567890";
  const expected = [
    { label: "Phone", value: "(555) 010-0100" },
    { label: "Fax", value: "(555) 010-0101" },
  ];
  assert.deepEqual(extractLabeledContactNumbers(text), expected);
  assert.deepEqual(
    extractCommonOcrFactsFromFlyerText(text).filter((fact) =>
      ["Phone", "Fax"].includes(fact.label),
    ),
    expected,
  );
});

test("a fax-only document does not invent a phone number", () => {
  const text = "Fax: (555) 010-0101";
  assert.deepEqual(extractLabeledContactNumbers(text), [{ label: "Fax", value: "(555) 010-0101" }]);
  assert.deepEqual(extractCommonOcrFactsFromFlyerText(text), [
    { label: "Fax", value: "(555) 010-0101" },
  ]);
  assert.deepEqual(extractLabeledContactNumbers("Patient ID: 1234567890 DOB: 05/22/2019"), []);
  assert.deepEqual(extractCommonOcrFactsFromFlyerText("Patient ID: 1234567890 DOB: 05/22/2019"), []);
});

test("labelled contact extraction preserves country codes, extensions and printed formatting", () => {
  assert.deepEqual(
    extractLabeledContactNumbers("Telephone: +1 (555) 010-0100 ext. 42; Fax no.: 555.010.0101"),
    [
      { label: "Phone", value: "+1 (555) 010-0100 ext. 42" },
      { label: "Fax", value: "555.010.0101" },
    ],
  );
});

test("saved text fills a missing phone without replacing existing facts or exposing other source fields", () => {
  const facts = [{ label: "Fax", value: "(555) 010-0101" }];
  const result = withMissingContactNumbers(
    facts,
    "Phone: (555) 010-0100 Fax: (555) 010-0999 Patient ID: SAMPLE-123 DOB: 05/22/2019",
  );
  assert.deepEqual(result, [...facts, { label: "Phone", value: "(555) 010-0100" }]);
  assert.equal(facts.length, 1);
});

test("a shared phone/fax number keeps both purposes through duplicate filtering", () => {
  const facts = [
    { label: "Phone", value: "(555) 010-0100" },
    { label: "Fax", value: "(555) 010-0100" },
  ];
  assert.deepEqual(mergeOcrFacts(facts), facts);
  assert.deepEqual(filterRenderedOcrFacts(facts, [facts[0].value]), facts);
});

test("one combined card keeps Phone before Fax at the original contact position", () => {
  const cards = [
    { label: "Patient", values: ["SAMPLE PERSON"] },
    { label: "Fax", values: ["(555) 010-0101"] },
    { label: "Phone", values: ["(555) 010-0100"] },
    { label: "Appointment provider", values: ["Sample Clinic"] },
  ];
  const result = combinePhoneAndFaxCards(cards);
  assert.equal(result.length, 3);
  assert.equal(result[0], cards[0]);
  assert.deepEqual(result[1], {
    label: "Phone & Fax",
    values: [],
    contacts: [
      { label: "Phone", value: "(555) 010-0100" },
      { label: "Fax", value: "(555) 010-0101" },
    ],
  });
  assert.equal(result[2], cards[3]);
  assert.equal(cards.length, 4);
  assert.deepEqual(combinePhoneAndFaxCards([cards[1]]), [cards[1]]);
});
