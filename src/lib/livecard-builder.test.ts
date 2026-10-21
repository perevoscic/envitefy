import assert from "node:assert/strict";
import test from "node:test";
import {
  createLiveCardForm,
  LIVE_CARD_EVENT_PLACEHOLDERS,
  LIVE_CARD_HOLIDAY_OCCASIONS,
  liveCardDateTime,
  liveCardDesignKey,
  liveCardRegistryUrl,
  mergeLiveCardProposal,
  readLiveCardForm,
  validateLiveCard,
} from "./livecard-builder.ts";
import {
  creationAllowed,
  liveCardCreationCategories,
  resolveCreationAccess,
} from "./creation-access.ts";

test("artwork needs design direction while the occasion remains optional", () => {
  const form = {
    ...createLiveCardForm("America/Chicago"),
    eventType: "Birthday" as const,
    design: "Pink movie night",
  };
  assert.deepEqual(validateLiveCard(form, "design"), {});
  assert.ok(validateLiveCard(form, "publish").date);
  assert.ok(validateLiveCard(form, "publish").title);
  assert.deepEqual(validateLiveCard({ ...form, eventType: "" }, "design"), {});
  assert.equal(validateLiveCard({ ...form, eventType: "" }, "prepare").eventType, undefined);
  assert.equal(validateLiveCard({ ...form, eventType: "" }, "publish").eventType, undefined);
  assert.deepEqual(Object.keys(validateLiveCard(createLiveCardForm(), "design")), [
    "design",
  ]);
  assert.equal(form.rsvpEnabled, false);
  assert.equal(form.registryEnabled, false);
});

test("new cards omit an opening line and use a general occasion without inferring one", () => {
  const form = createLiveCardForm();
  assert.equal(form.headlineIntro, "");
  assert.equal(form.eventType, "General event");
  for (const eventType of [undefined, "", "Unrecognized occasion"]) {
    const restored = readLiveCardForm({ title: "Mia's birthday", design: "Birthday balloons", eventType });
    assert.equal(restored?.eventType, "General event");
    assert.equal(restored?.headlineIntro, "");
  }
});

test("restoring optional wording and occasion preserves saved values and category authorization", () => {
  const saved = readLiveCardForm({ headlineIntro: "You're invited", eventType: "Birthday" });
  assert.equal(saved?.headlineIntro, "You're invited");
  assert.equal(saved?.eventType, "Birthday");
  assert.equal(readLiveCardForm({ headlineIntro: "" })?.headlineIntro, "");

  const imported = readLiveCardForm({ eventType: "", creationCategory: "gymnastics" });
  assert.equal(imported?.eventType, "General event");
  assert.equal(imported?.creationCategory, "gymnastics");
  assert.deepEqual(liveCardCreationCategories(imported), ["gymnastics"]);
  const restricted = resolveCreationAccess({ policy: "restricted", categories: ["general"], products: ["live_card"] });
  assert.equal(creationAllowed(restricted, "live_card", liveCardCreationCategories(imported)[0]), false);
});

test("holiday occasions survive restore without inferring dates or changing category access", () => {
  for (const eventType of LIVE_CARD_HOLIDAY_OCCASIONS) {
    const original = { ...createLiveCardForm("America/Chicago"), eventType, title: "Our gathering", headlineIntro: "Come together", date: "2030-09-24", design: "Keep my chosen colors" };
    const restored = readLiveCardForm(JSON.parse(JSON.stringify(original)));
    assert.ok(restored, eventType);
    assert.equal(restored.eventType, eventType);
    assert.equal(restored.title, original.title);
    assert.equal(restored.headlineIntro, original.headlineIntro);
    assert.equal(restored.date, original.date);
    assert.equal(restored.design, original.design);
    assert.equal(readLiveCardForm({ eventType })?.date, "", "occasion names never supply calendar dates");
    assert.deepEqual(liveCardCreationCategories(restored), ["general"]);
    assert.deepEqual(liveCardCreationCategories({ ...restored, creationCategory: "gymnastics" }), ["gymnastics"]);
    assert.ok(LIVE_CARD_EVENT_PLACEHOLDERS[eventType].title.includes(eventType));
    assert.deepEqual(validateLiveCard(original, "design"), {});
  }
});

test("generation quality stays high by default and preserves an explicit medium selection", () => {
  const form = createLiveCardForm();
  assert.equal(form.generationQuality, "high");
  const saved = JSON.parse(JSON.stringify({ ...form, generationQuality: "medium" }));
  assert.equal(readLiveCardForm(saved)?.generationQuality, "medium");
  for (const generationQuality of [undefined, null, "", "low", "high", "MEDIUM", 1]) {
    assert.equal(readLiveCardForm({ generationQuality })?.generationQuality, "high");
  }
});

test("reviewed proposals preserve concurrent edits, selected format and location timezone together", () => {
  const before = createLiveCardForm("America/Chicago");
  const proposed = {
    ...before,
    title: "Suggested title",
    date: "2026-09-26",
    timezone: "America/New_York",
  };
  const current = {
    ...before,
    title: "My title",
    format: "digital_flyer" as const,
    locations: [{ ...before.locations[0], address: "My address" }],
  };
  const merged = mergeLiveCardProposal(current, before, proposed);
  assert.equal(merged.title, "My title");
  assert.equal(merged.date, "2026-09-26");
  assert.equal(merged.format, "digital_flyer");
  assert.equal(merged.timezone, "America/Chicago");
  assert.deepEqual(merged.locations, current.locations);
});

test("classic invitation artwork becomes stale when a printed detail changes", () => {
  const form = { ...createLiveCardForm(), format: "digital_flyer" as const, title: "Party" };
  for (const change of [
    { date: "2026-09-26" },
    { startTime: "16:00" },
    { overview: "Join us" },
    { rsvpEnabled: true },
    { registryEnabled: true },
  ]) {
    assert.notEqual(liveCardDesignKey(form), liveCardDesignKey({ ...form, ...change }));
  }
  assert.equal(
    liveCardDesignKey(form),
    liveCardDesignKey({ ...form, brief: "More input", hostEmail: "hidden@example.com" }),
  );
});

test("publishing needs a confirmed location and timezone, while version-one addresses remain usable", () => {
  const form = createLiveCardForm();
  assert.ok(validateLiveCard(form, "publish").locations);
  form.locations[0].address = "123 Main St";
  assert.ok(validateLiveCard(form, "publish").locations);
  form.locations[0].resolution = "verified";
  assert.ok(validateLiveCard(form, "publish").timezone);
  const restored = readLiveCardForm({
    title: "Old card",
    timezone: "America/Chicago",
    locations: [{ id: "primary", address: "123 Main St" }],
  });
  assert.equal(restored?.format, "live_card");
  assert.equal(restored?.locations[0].resolution, "manual");
  assert.equal(restored?.locations[0].timezone, "America/Chicago");
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

test("enabled RSVP requires a valid host phone while email remains optional", () => {
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
    rsvpEnabled: true,
    hostName: "Mia",
  };
  for (const phase of ["prepare", "publish"] as const) {
    for (const format of ["live_card", "digital_flyer"] as const) {
      const enabled = { ...form, format };
      for (const hostPhone of ["", "   ", "123", "call me", "1234567890123456"]) {
        assert.ok(validateLiveCard({ ...enabled, hostPhone }, phase).hostPhone);
        assert.ok(
          validateLiveCard({ ...enabled, hostPhone, hostEmail: "mia@example.com" }, phase)
            .hostPhone,
          "email cannot replace the required phone number",
        );
      }
      for (const hostPhone of ["8505550199", "+1 (850) 555-0199", "+44 20 7946 0958"]) {
        assert.deepEqual(validateLiveCard({ ...enabled, hostPhone }, phase), {});
      }
      assert.deepEqual(validateLiveCard({ ...enabled, rsvpEnabled: false }, phase), {});
    }
  }
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

test("final preparation accepts venue names while publication still requires resolved locations", () => {
  const form = {
    ...createLiveCardForm("America/New_York"),
    title: "Party",
    eventType: "Birthday" as const,
    design: "Dinosaurs",
    date: "2026-03-08",
    startTime: "02:30",
  };
  form.locations[0].query = "AMC Grand Boulevard";
  assert.deepEqual(
    validateLiveCard(form, "prepare"),
    {},
    "browser-zone DST must not block finding the venue timezone",
  );
  assert.ok(validateLiveCard(form, "publish").locations);
  assert.ok(
    validateLiveCard({ ...form, locations: [{ ...form.locations[0], query: " " }] }, "prepare")
      .locations,
  );
});
