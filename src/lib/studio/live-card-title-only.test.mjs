import assert from "node:assert/strict";
import test from "node:test";
import { approvedArtworkText, liveCardCelebrationTitle } from "./artwork-copy.ts";
import { buildProductArtworkPrompt, buildProductCopyPrompt } from "./product-prompts.ts";
import { productContract } from "./product-contract.ts";

const livia = {
  title: "Livia is turning 10",
  category: "Birthday",
  honoreeName: "Livia",
  ageOrMilestone: "10",
  date: "April 4",
  startTime: "4 PM",
  venueName: "AMC Grand Boulevard",
  venueAddress: "Forgotten Island",
  description:
    "Join us to celebrate Livia turning 10 at AMC Grand Boulevard, watching Forgotten Island, then dinner at Pazzo SRBB.",
  timezone: "America/Chicago",
  rsvpEnabled: false,
};

test("Live Card artwork contract is the celebration title, not the event recap", () => {
  assert.equal(liveCardCelebrationTitle(livia), "Livia is turning 10");
  assert.deepEqual(approvedArtworkText(livia, "live_card"), ["Livia is turning 10"]);
  assert.match(productContract("live_card").description, /paint only the approved celebration title/);
  assert.match(productContract("live_card").description, /guest-action buttons/);
});

test("Live Card prompts keep venue, time, movie, and dinner in button dialogs", () => {
  const copyPrompt = buildProductCopyPrompt(livia, undefined, "live_card");
  assert.match(copyPrompt, /Live Card raster lettering is only the celebration title/);
  assert.match(copyPrompt, /guest-action buttons/);
  assert.match(copyPrompt, /AMC Grand Boulevard/);

  const artworkPrompt = buildProductArtworkPrompt(livia, undefined, null, "live_card", 0);
  assert.match(artworkPrompt, /Livia is turning 10/);
  assert.match(artworkPrompt, /Paint only this celebration title/);
  assert.match(artworkPrompt, /Never glue words together/);
  assert.doesNotMatch(artworkPrompt, /Join us to celebrate/);
  assert.doesNotMatch(artworkPrompt, /AMC Grand Boulevard/);
  assert.doesNotMatch(artworkPrompt, /Pazzo SRBB/);
  assert.doesNotMatch(artworkPrompt, /Forgotten Island/);
  assert.doesNotMatch(artworkPrompt, /readable supporting details/);
});
