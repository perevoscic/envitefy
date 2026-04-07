import assert from "node:assert/strict";
import test from "node:test";

import {
  buildLiveCardRsvpOutboundHref,
  formatLiveCardRsvpDraftBody,
  parseLiveCardRsvpContact,
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
  assert.match(body, /RSVP for Summer Party: Yes/);
  assert.match(body, /Live card: https:\/\/example\.com\/card\/abc\/summer-party/);
});

test("buildLiveCardRsvpOutboundHref returns mailto with encoded subject and body", () => {
  const href = buildLiveCardRsvpOutboundHref({
    rsvpContact: "host@example.com",
    eventTitle: "Gala",
    responseLabel: "Maybe",
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
    shareUrl: "https://example.com/card/y/brunch",
  });
  assert.ok(href.startsWith("sms:+15552345678?body="));
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
