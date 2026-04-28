import assert from "node:assert/strict";
import test from "node:test";

import { extractHostedByFromFlyerText, extractRsvpDetails } from "./text.ts";

test("extractRsvpDetails keeps question text phone from becoming a contact name", () => {
  const flyerText = [
    "All Skill Levels Welcome",
    "Free to Play",
    "Bring water and both light & dark shirts",
    "Questions? Text (555) 014-2277",
    "Hosted by the Neighborhood Rec Group",
  ].join("\n");

  const details = extractRsvpDetails(flyerText);

  assert.equal(details.contact, "RSVP: (555) 014-2277");
  assert.equal(details.url, null);
  assert.equal(details.deadline, null);
  assert.equal(extractHostedByFromFlyerText(flyerText), "Neighborhood Rec Group");
});
