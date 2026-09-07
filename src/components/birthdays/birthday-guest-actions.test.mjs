import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const actions = readFileSync(new URL("./BirthdayGuestActions.tsx", import.meta.url), "utf8");
const renderer = readFileSync(new URL("./BirthdayRenderer.tsx", import.meta.url), "utf8");

test("birthday sharing uses the published invitation and provides a copy fallback", () => {
  assert.match(actions, /new URL\(event\.shareUrl, window\.location\.origin\)/);
  assert.match(actions, /\/event\/\$\{encodeURIComponent\(eventId\)\}/);
  assert.match(actions, /navigator\.share\(/);
  assert.match(actions, /navigator\.clipboard\.writeText\(shareUrl\)/);
  assert.match(actions, /Publish your invitation to get a shareable link/);
  assert.doesNotMatch(actions, /window\.location\.href/);
  assert.match(actions, /setManualShareUrl\(shareUrl\)/);
});

test("birthday calendar actions use real provider links and do not invent a party duration", () => {
  for (const provider of ["appleInline", "google", "outlook"]) {
    assert.ok(actions.includes(`href={links.${provider}}`));
  }
  assert.match(actions, /startIso: event\.date/);
  assert.match(actions, /const fallbackEnd = allDay \? end\.toISOString\(\)\.slice\(0, 10\) : event\.date/);
  assert.match(actions, /\? event\.end : fallbackEnd/);
  assert.match(actions, /Date\.parse\(event\.end\) > Date\.parse\(event\.date\)/);
  assert.doesNotMatch(actions, /setHours|setMinutes|60 \* 60|90 \* 60/);
  assert.match(actions, /buildGoogleMapsDirectionsHref\(actions\.destination\)/);
});

test("birthday actions live in themed date, venue, and RSVP controls with no injected strip", () => {
  const hero = readFileSync(new URL("./BirthdayExperienceHero.tsx", import.meta.url), "utf8");
  const body = readFileSync(new URL("./BirthdayExperienceBody.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(renderer, /GuestActionsContext|\{guestActions\}/);
  assert.doesNotMatch(actions, /aria-label="Plan your visit"|rounded-full|bg-white\/85/);
  assert.match(hero, /<BirthdayCalendarDate>/);
  assert.match(hero, /<BirthdayVenueLink>/);
  assert.match(hero, /CTA_CLASSES\[theme\.experience\.ctaTreatment\]/);
  assert.match(body, /guestNotes\.map/);
  const footers = [...renderer.matchAll(/<footer\b[\s\S]*?<\/footer>/g)];
  assert.equal(footers.length, 2);
  for (const [footer] of footers) {
    assert.match(footer, /EnvitefyEventBranding category=\{BIRTHDAY_DESIGN_BY_ID\.get\(theme\.id\)\?\.occasion === "Anniversary" \? "Anniversaries" : "Birthdays"\}/);
    assert.doesNotMatch(footer, /<button|Share Link|Add to Calendar|Snapped with|Snap your now/);
  }
  assert.match(renderer, /This is a preview\. Publish your invitation so guests can RSVP/);
});
