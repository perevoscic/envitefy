import assert from "node:assert/strict";
import test from "node:test";

import {
  buildLiveCardRsvpOutboundHref,
  formatLiveCardRsvpDraftBody,
  parseLiveCardRsvpContact,
  shouldShowLiveCardDescriptionSection,
} from "./live-card-rsvp.ts";

test("parseLiveCardRsvpContact prefers email when present", () => {
  assert.deepEqual(parseLiveCardRsvpContact("Host <host@example.com>"), {
    kind: "email",
    address: "host@example.com",
  });
});

test("parseLiveCardRsvpContact detects sms-capable phone strings", () => {
  const parsed = parseLiveCardRsvpContact("Text (555) 123-4567");
  assert.equal(parsed.kind, "sms");
  assert.match(parsed.address, /5551234567/);
});

test("formatLiveCardRsvpDraftBody includes response title and live card URL", () => {
  const body = formatLiveCardRsvpDraftBody({
    eventTitle: "Summer Party",
    responseLabel: "Yes",
    shareUrl: "https://example.com/card/abc/summer-party",
  });
  assert.match(body, /Yes, we can attend Summer Party/);
  assert.match(body, /Event link: https:\/\/example\.com\/card\/abc\/summer-party/);
});

test("formatLiveCardRsvpDraftBody uses category-specific birthday replies", () => {
  const body = formatLiveCardRsvpDraftBody({
    eventTitle: "Ava's 7th Birthday",
    responseLabel: "No",
    responseKey: "no",
    category: "Birthday",
    hostName: "Mia",
    senderName: "Jordan Lee",
    shareUrl: "",
  });
  assert.match(body, /Hi Mia/);
  assert.match(body, /This is Jordan Lee/);
  assert.match(body, /wonderful birthday celebration/);
});

test("formatLiveCardRsvpDraftBody uses category-specific wedding replies", () => {
  const body = formatLiveCardRsvpDraftBody({
    eventTitle: "Elena and Marcus",
    responseLabel: "Yes",
    responseKey: "yes",
    category: "Wedding",
    shareUrl: "",
  });
  assert.match(body, /honored to celebrate Elena and Marcus/);
});

test("buildLiveCardRsvpOutboundHref returns mailto with encoded subject and body", () => {
  const href = buildLiveCardRsvpOutboundHref({
    rsvpContact: "host@example.com",
    eventTitle: "Gala",
    responseLabel: "Maybe",
    responseKey: "maybe",
    category: "Wedding",
    shareUrl: "https://example.com/card/x/gala",
  });
  assert.ok(href.startsWith("mailto:host@example.com?"));
  assert.ok(href.includes("subject="));
  assert.ok(href.includes("body="));
  assert.ok(decodeURIComponent(href).includes("Maybe"));
  assert.ok(decodeURIComponent(href).includes("https://example.com/card/x/gala"));
});

test("buildLiveCardRsvpOutboundHref returns sms with body query", () => {
  const href = buildLiveCardRsvpOutboundHref({
    rsvpContact: "+1 555 234 5678",
    eventTitle: "Brunch",
    responseLabel: "No",
    responseKey: "no",
    category: "Birthday",
    shareUrl: "https://example.com/card/y/brunch",
  });
  assert.ok(href.startsWith("sms:+15552345678?body="));
  assert.ok(decodeURIComponent(href).includes("birthday celebration"));
});

test("buildLiveCardRsvpOutboundHref returns empty string for unusable contact", () => {
  assert.equal(
    buildLiveCardRsvpOutboundHref({
      rsvpContact: "ask mom",
      eventTitle: "TBD",
      responseLabel: "Yes",
      shareUrl: "https://example.com/card/z/tbd",
    }),
    "",
  );
});

test("shouldShowLiveCardDescriptionSection is true only when host message is non-empty", () => {
  assert.equal(shouldShowLiveCardDescriptionSection(""), false);
  assert.equal(shouldShowLiveCardDescriptionSection("   "), false);
  assert.equal(shouldShowLiveCardDescriptionSection("See you there"), true);
});
