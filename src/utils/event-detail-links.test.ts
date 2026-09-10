import assert from "node:assert/strict";
import test from "node:test";
import { splitEventDetailLinks } from "./event-detail-links.ts";

test("phone and fax keep their visible formatting and use dialable numbers", () => {
  for (const label of ["Phone", "Fax"]) {
    assert.deepEqual(splitEventDetailLinks("(555) 797-6191", label), [
      { text: "(555) 797-6191", kind: "phone", href: "tel:5557976191" },
    ]);
  }
  assert.equal(
    splitEventDetailLinks("+1 (555) 797-6191 ext. 42", "Phone")[0].href,
    "tel:+15557976191;ext=42",
  );
  assert.equal(splitEventDetailLinks("+44 20 7946 0958", "Phone")[0].href, "tel:+442079460958");
  assert.equal(splitEventDetailLinks("5550100", "Phone")[0].href, "tel:5550100");
});

test("mixed contact notes preserve all text and make each contact independently actionable", () => {
  const text =
    "Phone: (555) 555-0100; Fax: (555) 555-0101. Email care+visits@example.com or visit https://example.com/info.";
  const segments = splitEventDetailLinks(text);
  assert.equal(segments.map((part) => part.text).join(""), text);
  assert.deepEqual(
    segments.filter((part) => part.href).map((part) => part.href),
    [
      "tel:5555550100",
      "tel:5555550101",
      "mailto:care+visits@example.com",
      "https://example.com/info",
    ],
  );
});

test("addresses retain the suite, city, state and ZIP code for maps", () => {
  const address = "249 EXAMPLE BAYOU LOOP STE 301, SANTA ROSA BEACH, FL 32459-7194";
  assert.deepEqual(splitEventDetailLinks(address, "Where"), [{ text: address, kind: "address" }]);
  assert.deepEqual(splitEventDetailLinks(`Meet at ${address}; bring your referral.`), [
    { text: "Meet at " },
    { text: address, kind: "address" },
    { text: "; bring your referral." },
  ]);
  assert.equal(splitEventDetailLinks("10 Downing Street, London", "Address")[0].kind, "address");
});

test("dates, ZIPs, patient IDs, and location placeholders stay as text", () => {
  for (const [text, label] of [
    ["1436431", "Patient ID"],
    ["1234567890", "Patient ID"],
    ["123-456-7890", "Patient ID"],
    ["2026-11-02", "Date"],
    ["32459-7194", "ZIP"],
    ["Location TBD", "Where"],
    ["Patient ID: 1234567890", "Notes"],
  ]) {
    assert.deepEqual(splitEventDetailLinks(text, label), [{ text }]);
  }
});
