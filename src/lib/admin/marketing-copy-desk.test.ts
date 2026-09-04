import test from "node:test";
import assert from "node:assert/strict";
import {
  buildMarketingCopyDesk,
  storedPlatformPacksFromCopyDesk,
} from "./marketing-copy-desk.ts";

const sharedCaptionRun = {
  channels: ["instagram", "facebook", "tiktok", "youtube"],
  request: {
    input: {
      campaignName: "Birthday Invite Delay",
      audience: "busy parents",
      objective: "get hosts to start an Envitefy birthday page tonight",
      productName: "Envitefy",
      targetVertical: "Birthday",
      callToAction: "Create the birthday page in minutes",
      assetType: "social-image",
    },
  },
  brief: {
    singleAudience: "busy parents planning a birthday this week",
    callToAction: "Create the birthday page in minutes",
  },
  socialCopy: {
    hook: "the invite is still on the fridge",
    endCard: "start your event page",
    frames: [
      {
        frameNumber: 1,
        text: "still texting the details",
        voiceover: "One link replaces the scattered birthday texts.",
      },
    ],
  },
};

function packMap(desk: ReturnType<typeof buildMarketingCopyDesk>) {
  return new Map(desk.packs.map((pack) => [pack.channel, pack]));
}

function fieldValue(
  desk: ReturnType<typeof buildMarketingCopyDesk>,
  channel: string,
  key: string,
) {
  return packMap(desk).get(channel)?.fields.find((field) => field.key === key)?.value || "";
}

test("a shared caption still yields four adapted platform packs", () => {
  const desk = buildMarketingCopyDesk(sharedCaptionRun);
  const instagram = fieldValue(desk, "instagram", "caption");
  const facebook = fieldValue(desk, "facebook", "postBody");
  const tiktok = fieldValue(desk, "tiktok", "caption");
  const youtubeTitle = fieldValue(desk, "youtube", "title");
  const youtubeDescription = fieldValue(desk, "youtube", "description");

  assert.equal(desk.available, true);
  assert.equal(desk.source, "adapted");
  assert.deepEqual(
    desk.packs.map((pack) => pack.channel),
    ["instagram", "facebook", "tiktok", "youtube"],
  );
  assert.ok(instagram.length > 0);
  assert.ok(facebook.length > instagram.length);
  assert.ok(tiktok.length > 0);
  assert.ok(tiktok.length < facebook.length);
  assert.notEqual(instagram, facebook);
  assert.notEqual(instagram, tiktok);
  assert.notEqual(facebook, tiktok);
  assert.notEqual(youtubeTitle, instagram);
  assert.notEqual(youtubeDescription, instagram);
  assert.match(youtubeTitle, /Envitefy/);
  assert.match(facebook, /envitefy\.com/i);
  assert.match(fieldValue(desk, "instagram", "hashtags"), /#envitefy/);
  assert.match(fieldValue(desk, "instagram", "hashtags"), /#birthdayparty/);
  assert.equal(fieldValue(desk, "instagram", "altText"), "");
  assert.equal(fieldValue(desk, "youtube", "tags"), "");
});

test("instagram keeps hashtags separate and only surfaces generated alt text", () => {
  const withoutAlt = buildMarketingCopyDesk(sharedCaptionRun);
  assert.equal(
    withoutAlt.packs
      .find((pack) => pack.channel === "instagram")
      ?.fields.some((field) => field.key === "altText"),
    false,
  );

  const withAlt = buildMarketingCopyDesk({
    ...sharedCaptionRun,
    socialCopy: {
      ...sharedCaptionRun.socialCopy,
      altText: "Parent holding a phone with an Envitefy birthday live card",
    },
  });
  assert.equal(
    fieldValue(withAlt, "instagram", "altText"),
    "Parent holding a phone with an Envitefy birthday live card",
  );
  assert.doesNotMatch(fieldValue(withAlt, "instagram", "caption"), /#envitefy/);
  assert.match(withAlt.packs.find((pack) => pack.channel === "instagram")?.copyAll || "", /Alt text:/);
});

test("youtube tags appear only when the run already generated them", () => {
  const withTags = buildMarketingCopyDesk({
    ...sharedCaptionRun,
    socialCopy: {
      ...sharedCaptionRun.socialCopy,
      youtubeTags: "envitefy, birthday invite, rsvp",
    },
  });
  assert.equal(fieldValue(withTags, "youtube", "tags"), "envitefy, birthday invite, rsvp");
  assert.match(withTags.packs.find((pack) => pack.channel === "youtube")?.copyAll || "", /Tags:/);
});

test("selected channels filter the copy desk and default to all four when none were recorded", () => {
  const filtered = buildMarketingCopyDesk({
    ...sharedCaptionRun,
    channels: ["tiktok", "youtube"],
  });
  assert.deepEqual(
    filtered.packs.map((pack) => pack.channel),
    ["tiktok", "youtube"],
  );

  const missingChannels = buildMarketingCopyDesk({
    socialCopy: sharedCaptionRun.socialCopy,
    request: { input: { productName: "Envitefy" } },
  });
  assert.deepEqual(
    missingChannels.packs.map((pack) => pack.channel),
    ["instagram", "facebook", "tiktok", "youtube"],
  );
});

test("copy-all concatenates a platform pack without duplicating empty fields", () => {
  const desk = buildMarketingCopyDesk(sharedCaptionRun);
  const instagram = desk.packs.find((pack) => pack.channel === "instagram");
  assert.ok(instagram);
  assert.match(instagram.copyAll, /One link replaces the scattered birthday texts/);
  assert.match(instagram.copyAll, /Hashtags:/);
  assert.doesNotMatch(instagram.copyAll, /Alt text:/);
});

test("stored platform packs fill missing fields without hiding adapted channels", () => {
  const desk = buildMarketingCopyDesk({
    ...sharedCaptionRun,
    socialCopy: {
      ...sharedCaptionRun.socialCopy,
      platformPacks: {
        instagram: {
          caption: "Stored IG caption for the fridge invite.",
          hashtags: "#envitefy #birthdayparty",
        },
      },
    },
  });
  assert.equal(fieldValue(desk, "instagram", "caption"), "Stored IG caption for the fridge invite.");
  assert.equal(fieldValue(desk, "instagram", "hashtags"), "#envitefy #birthdayparty");
  assert.ok(fieldValue(desk, "facebook", "postBody").length > 0);
  assert.ok(fieldValue(desk, "tiktok", "caption").length > 0);
});

test("preferStoredPacks false keeps the live caption editor in charge", () => {
  const desk = buildMarketingCopyDesk({
    ...sharedCaptionRun,
    preferStoredPacks: false,
    socialCopy: {
      ...sharedCaptionRun.socialCopy,
      platformPacks: {
        instagram: { caption: "Stored IG caption that should be ignored." },
      },
    },
  });
  assert.notEqual(fieldValue(desk, "instagram", "caption"), "Stored IG caption that should be ignored.");
  assert.match(fieldValue(desk, "instagram", "caption"), /One link replaces the scattered birthday texts/);
});

test("copy desk stays unavailable until a run has copy", () => {
  const desk = buildMarketingCopyDesk({
    request: { input: { campaignName: "Empty", channels: ["instagram"] } },
  });
  assert.equal(desk.available, false);
  assert.deepEqual(desk.packs, []);
});

test("stored platform packs can be written back from a built copy desk", () => {
  const desk = buildMarketingCopyDesk(sharedCaptionRun);
  const stored = storedPlatformPacksFromCopyDesk(desk);
  assert.ok(stored.instagram.caption);
  assert.ok(stored.instagram.hashtags);
  assert.ok(stored.facebook.postBody);
  assert.ok(stored.tiktok.caption);
  assert.ok(stored.youtube.title);
  assert.ok(stored.youtube.description);
  assert.equal(stored.instagram.altText, undefined);
  assert.equal(stored.youtube.tags, undefined);
});
