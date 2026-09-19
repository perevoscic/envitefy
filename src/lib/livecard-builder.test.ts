import assert from "node:assert/strict";
import test from "node:test";
import {
  createLiveCardForm,
  liveCardDateTime,
  liveCardDesignKey,
  liveCardRegistryUrl,
  readLiveCardForm,
  validateLiveCard,
} from "./livecard-builder.ts";

test("artwork can start before any scheduling or optional guest details exist", () => {
  const form = {
    ...createLiveCardForm("America/Chicago"),
    title: "Livia's Birthday",
    eventType: "Birthday" as const,
    design: "Pink movie night",
  };
  assert.deepEqual(validateLiveCard(form, "design"), {});
  assert.ok(validateLiveCard(form, "publish").date);
  assert.equal(form.rsvpEnabled, false);
  assert.equal(form.registryEnabled, false);
});

test("only artwork inputs invalidate the generated design", () => {
  const original = {
    ...createLiveCardForm(),
    title: "Movie night",
    eventType: "General event" as const,
    design: "Stars",
  };
  const key = liveCardDesignKey(original);
  assert.equal(
    liveCardDesignKey({
      ...original,
      date: "2026-10-04",
      overview: "New wording",
      rsvpEnabled: true,
      registryEnabled: true,
      locations: [
        { id: "main", label: "", venue: "The theater", address: "123 Main St", time: "", note: "" },
      ],
    }),
    key,
  );
  for (const updated of [
    { ...original, title: "New title" },
    { ...original, design: "Flowers" },
    { ...original, eventType: "Wedding" as const },
    { ...original, referenceUrl: "/reference.webp" },
  ])
    assert.notEqual(liveCardDesignKey(updated), key);
});

test("publishing checks real event dates and optional sections only when enabled", () => {
  const form = {
    ...createLiveCardForm("America/Chicago"),
    title: "Movie night",
    eventType: "General event" as const,
    design: "Stars",
    date: "2026-10-04",
    startTime: "18:00",
    locations: [
      { id: "main", label: "", venue: "Cinema", address: "123 Main St", time: "", note: "" },
    ],
    registryUrl: "javascript:alert(1)",
    hostEmail: "invalid",
  };
  assert.deepEqual(validateLiveCard(form, "publish"), {});
  assert.ok(validateLiveCard({ ...form, rsvpEnabled: true }, "publish").hostName);
  assert.ok(validateLiveCard({ ...form, rsvpEnabled: true }, "publish").hostEmail);
  assert.ok(validateLiveCard({ ...form, registryEnabled: true }, "publish").registryUrl);
  assert.ok(validateLiveCard({ ...form, date: "2026-02-30" }, "publish").startTime);
  assert.ok(validateLiveCard({ ...form, endTime: "17:00" }, "publish").endTime);
  assert.deepEqual(
    validateLiveCard({ ...form, endTime: "01:00", endDate: "2026-10-05" }, "publish"),
    {},
  );
});

test("calendar times use the event timezone and reject ambiguous daylight-saving times", () => {
  assert.equal(
    liveCardDateTime("2026-10-04", "18:00", "America/Chicago"),
    "2026-10-04T23:00:00.000Z",
  );
  assert.equal(liveCardDateTime("2026-03-08", "02:30", "America/Chicago"), null);
  assert.equal(liveCardDateTime("2026-11-01", "01:30", "America/Chicago"), null);
});

test("saved partial forms restore disabled options without fabricated event facts", () => {
  const form = readLiveCardForm({
    title: "Draft",
    hostName: "Mia",
    rsvpEnabled: false,
    registryUrl: "example.com/gifts",
    registryEnabled: false,
    locations: [],
  });
  assert.equal(form?.date, "");
  assert.equal(form?.locations.length, 1);
  assert.equal(form?.hostName, "Mia");
  assert.equal(form?.registryUrl, "example.com/gifts");
  assert.equal(readLiveCardForm(null), null);
});

test("registry links allow only websites", () => {
  assert.equal(liveCardRegistryUrl("example.com/gifts"), "https://example.com/gifts");
  for (const url of [
    "javascript:alert(1)",
    "data:text/html,hello",
    "ftp://example.com",
    "https://user:pass@example.com",
    "",
  ])
    assert.equal(liveCardRegistryUrl(url), null);
});
