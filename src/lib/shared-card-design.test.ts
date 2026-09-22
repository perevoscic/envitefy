import assert from "node:assert/strict";
import { test } from "node:test";
import { createLiveCardForm, liveCardDesignKey, sharedCardDesignKey } from "./livecard-builder.ts";
import {
  layoutSharedCard,
  readSharedCardDesign,
  sharedCardContent,
  type SharedCardDesign,
} from "./shared-card-design.ts";

const design: SharedCardDesign = {
  version: 1,
  backgroundUrl: "/background.webp",
  font: "classic",
  ink: "#522335",
  accent: "#876035",
  surface: "#fff4ec",
};
const measure = (text: string, size: number) => text.length * size * 0.51;

test("shared background survives format, title, contact, location and time changes; visual changes invalidate it", () => {
  const form = {
    ...createLiveCardForm(),
    title: "Livia's Birthday",
    eventType: "Birthday" as const,
    design: "Pink curtains",
  };
  const key = sharedCardDesignKey(form);
  const changed = {
    ...form,
    title: "Livia's 11th Birthday",
    headlineIntro: "Join us",
    format: "digital_flyer" as const,
    startTime: "19:30",
    date: "2026-09-26",
    hostName: "Mia",
    locations: [{ ...form.locations[0], address: "New address" }],
  };
  assert.equal(sharedCardDesignKey(changed), key);
  assert.notEqual(sharedCardDesignKey({ ...form, design: "Blue curtains" }), key);
  assert.notEqual(sharedCardDesignKey({ ...form, referenceUrl: "/new.webp" }), key);
  assert.notEqual(
    liveCardDesignKey(changed),
    liveCardDesignKey(form),
    "legacy baked images keep their factual invalidation",
  );
});

test("headline is identical in both outputs and event-local details only enter the invitation", () => {
  const content = sharedCardContent({
    title: "Livia's Birthday",
    headlineIntro: "You're invited",
    eventDetails: {
      eventDate: "2026-09-26",
      startTime: "16:00",
      venueName: "AMC Boulevard 10",
      location: "465 Grand Blvd",
      rsvpEnabled: true,
      rsvpName: "Mia",
      rsvpContact: "mia@example.com",
    },
  });
  const live = layoutSharedCard(design, content, "live_card", measure);
  const invite = layoutSharedCard(design, content, "digital_flyer", measure);
  assert.deepEqual(invite.lines.slice(0, live.lines.length), live.lines);
  assert.equal(
    live.lines.some((line) => line.text.includes("4:00 PM")),
    false,
  );
  assert.ok(invite.lines.some((line) => line.text.includes("4:00 PM")));
  assert.ok(invite.lines.some((line) => line.text.includes("mia@example.com")));
  assert.equal(live.overflow, false);
  assert.equal(invite.overflow, false);
  const updated = sharedCardContent({
    title: "Livia's Birthday",
    eventDetails: { startTime: "19:30" },
  });
  assert.ok(updated.paragraphs.includes("7:30 PM"));
  assert.ok(!updated.paragraphs.some((text) => text.includes("CST")));
});

test("long titles wrap without losing words; excess invitation copy reports overflow", () => {
  const title = "A wonderful birthday celebration for our friends and family";
  const layout = layoutSharedCard(
    design,
    { intro: "You're invited", title, paragraphs: [] },
    "live_card",
    measure,
  );
  assert.equal(
    layout.lines
      .slice(1)
      .map((line) => line.text)
      .join(" "),
    title,
  );
  assert.equal(layout.overflow, false);
  assert.ok(
    layout.lines.every((line) => line.y < 1050),
    "headline stays clear of bottom controls",
  );
  const long = "Many event details. ".repeat(400);
  assert.equal(
    layoutSharedCard(design, { intro: "", title, paragraphs: [long] }, "digital_flyer", measure)
      .overflow,
    true,
  );
});

test("overnight invitations print the end date in the event location's time zone", () => {
  const content = sharedCardContent({
    title: "Overnight celebration",
    eventDetails: {
      eventDate: "2026-09-26",
      startTime: "22:00",
      endTime: "01:00",
      calendarEndISO: "2026-09-27T06:00:00.000Z",
      timezone: "America/Chicago",
    },
  });
  assert.match(content.paragraphs[0], /Saturday, September 26, 2026/);
  assert.match(content.paragraphs[0], /10:00 PM – Sunday, September 27, 2026, 1:00 AM/);
});

test("metadata parsing rejects unsafe backgrounds and normalizes typography and colors", () => {
  assert.equal(
    readSharedCardDesign({ ...design, backgroundUrl: "javascript:alert(1)" }),
    undefined,
  );
  assert.equal(readSharedCardDesign({ ...design, backgroundUrl: "//evil.test/bg" }), undefined);
  assert.equal(readSharedCardDesign({ ...design, version: 0 }), undefined);
  assert.equal(
    readSharedCardDesign({ ...design, ink: "red;position:fixed", font: "unavailable" })?.font,
    "classic",
  );
  assert.equal(
    sharedCardContent({
      title: "Party",
      headlineIntro: "",
      eventDetails: { rsvpEnabled: false, rsvpContact: "hidden@example.com", registryLink: "" },
    }).paragraphs.length,
    0,
  );
});
