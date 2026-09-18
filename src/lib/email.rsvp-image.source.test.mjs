import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./email.ts", import.meta.url), "utf8");

test("RSVP confirmation email can render a hosted event image", () => {
  assert.match(source, /eventImageUrl\?: string \| null/);
  assert.match(source, /eventImageAlt\?: string \| null/);
  assert.match(source, /<img src="\$\{escapeHtml\(eventImageUrl\)\}"/);
  assert.match(
    source,
    /Your RSVP for <strong>\$\{escapeHtml\(params\.eventTitle\)\}<\/strong> is saved\.[\s\S]*\$\{eventImageBlock\}/,
  );
});

test("RSVP confirmation email rejects non-http image sources", () => {
  const rsvpSource = source.slice(
    source.indexOf("export async function sendRsvpConfirmationEmail"),
    source.indexOf("export async function sendSignupConfirmationEmail"),
  );
  assert.match(rsvpSource, /\^https\?:\\\/\\\/.*params\.eventImageUrl\.trim\(\)/);
  assert.doesNotMatch(rsvpSource, /base64/);
});

test("RSVP confirmation email uses provider calendar choices without a duplicate CTA", () => {
  assert.match(source, /Choose your calendar:/);
  assert.doesNotMatch(source, />Add to Calendar<\/a>/);
});
