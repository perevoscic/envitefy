import assert from "node:assert/strict";
import test from "node:test";

import {
  buildRsvpMailAppChoices,
  getRsvpMailPlatform,
  isRsvpMailtoHref,
  openRsvpMailtoHref,
} from "./rsvp-mailto.ts";

test("isRsvpMailtoHref accepts only mailto links", () => {
  assert.equal(isRsvpMailtoHref("mailto:host@example.com"), true);
  assert.equal(isRsvpMailtoHref(" MAILTO:host@example.com"), true);
  assert.equal(isRsvpMailtoHref("https://example.com"), false);
  assert.equal(isRsvpMailtoHref("sms:+15551234567"), false);
  assert.equal(isRsvpMailtoHref(null), false);
  assert.equal(isRsvpMailtoHref(undefined), false);
  assert.equal(isRsvpMailtoHref(""), false);
});

test("opening missing or non-mail RSVP links is a no-op in a browser", (context) => {
  const original = Object.getOwnPropertyDescriptor(globalThis, "window");
  Object.defineProperty(globalThis, "window", { configurable: true, value: {} });
  context.after(() => {
    if (original) Object.defineProperty(globalThis, "window", original);
    else Reflect.deleteProperty(globalThis, "window");
  });
  for (const href of [null, undefined, "", "https://example.com/rsvp"]) {
    assert.equal(openRsvpMailtoHref(href), false);
  }
});

test("getRsvpMailPlatform distinguishes macOS from touch iPadOS", () => {
  assert.equal(
    getRsvpMailPlatform({
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15",
      platform: "MacIntel",
      maxTouchPoints: 0,
    }),
    "mac",
  );
  assert.equal(
    getRsvpMailPlatform({
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15",
      platform: "MacIntel",
      maxTouchPoints: 5,
    }),
    "ios",
  );
  assert.equal(
    getRsvpMailPlatform({
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
      platform: "iPhone",
      maxTouchPoints: 5,
    }),
    "ios",
  );
});

test("buildRsvpMailAppChoices creates iOS app compose links with mailto fallback", () => {
  const choices = buildRsvpMailAppChoices(
    "mailto:host@example.com?subject=RSVP%20for%20Party&body=Yes%2C%20we%20can%20attend.",
  );

  assert.equal(choices[0]?.href, "mailto:host@example.com?subject=RSVP%20for%20Party&body=Yes%2C%20we%20can%20attend.");
  assert.equal(choices[1]?.href, "googlegmail://co?to=host%40example.com&subject=RSVP+for+Party&body=Yes%2C+we+can+attend.");
  assert.equal(choices[1]?.fallbackHref, choices[0]?.href);
  assert.equal(choices[2]?.href, "ms-outlook://compose?to=host%40example.com&subject=RSVP+for+Party&body=Yes%2C+we+can+attend.");
  assert.equal(choices[2]?.fallbackHref, choices[0]?.href);
});
