import { test } from "node:test";
import assert from "node:assert/strict";
import { applyBuilderExtraction, applyOverviewProofread } from "./livecard-assistance";
import { createLiveCardForm } from "./livecard-builder";

test("Overview proofreading fixes wording without changing event fields or accepting unrelated model edits", () => {
  const before = {
    ...createLiveCardForm(),
    title: "Livia's birthday",
    date: "2026-09-26",
    overview: "We is meeting at 4 PM. Bring you're ticket. Email mia@example.com.",
  };
  const form = applyOverviewProofread(before, {
    overview: "We are meeting at 4 PM. Bring your ticket. Email mia@example.com.",
    title: "Wrong title",
    date: "2027-01-01",
    locations: [],
  });
  assert.equal(form.overview, "We are meeting at 4 PM. Bring your ticket. Email mia@example.com.");
  assert.deepEqual({ ...form, overview: before.overview }, before);
});

test("Overview proofreading rejects changed numeric facts, times, contacts, links and missing output", () => {
  const before = {
    ...createLiveCardForm(),
    overview: "Meet at 4 PM. Email mia@example.com. See https://example.com/event.",
  };
  for (const overview of [
    before.overview.replace("4", "5"),
    before.overview.replace("PM", "AM"),
    before.overview.replace("mia@", "other@"),
    before.overview.replace("/event", "/new"),
    "",
    undefined,
  ])
    assert.throws(() => applyOverviewProofread(before, { overview }));
  assert.equal(
    applyOverviewProofread(before, { overview: before.overview }).overview,
    before.overview,
  );
});

test("description extracts venue and city without inventing the street address", () => {
  const message =
    "Livia's birthday at AMC Grand Boulevard in Miramar Beach on September 26, 2026 at 4 PM. Pink movie theme.";
  const { form } = applyBuilderExtraction(
    createLiveCardForm(),
    {
      title: "Livia's Birthday",
      eventType: "Birthday",
      design: "Pink movie theme",
      date: "2026-09-26",
      startTime: "16:00",
      locations: [
        {
          venue: "AMC Grand Boulevard",
          city: "Miramar Beach",
          address: "",
          query: "AMC Grand Boulevard, Miramar Beach",
        },
      ],
      evidence: [
        { field: "eventType", quote: "birthday" },
        { field: "date", quote: "September 26, 2026" },
        { field: "startTime", quote: "4 PM" },
        { field: "locations", quote: "AMC Grand Boulevard in Miramar Beach" },
      ],
    },
    message,
  );
  assert.equal(form.date, "2026-09-26");
  assert.equal(form.startTime, "16:00");
  assert.equal(form.locations[0].venue, "AMC Grand Boulevard");
  assert.equal(form.locations[0].city, "Miramar Beach");
  assert.equal(form.locations[0].address, "");
  assert.equal(form.locations[0].resolution, "unresolved");
});

test("unsupported factual suggestions and fabricated citations cannot replace host facts", () => {
  const before = {
    ...createLiveCardForm(),
    title: "Livia's birthday",
    date: "2026-09-26",
    hostEmail: "mia@example.com",
  };
  const { form } = applyBuilderExtraction(
    before,
    {
      title: "Wedding",
      date: "2027-03-01",
      hostEmail: "wrong@example.com",
      rsvpEnabled: true,
      evidence: [{ field: "date", quote: "March 1" }],
    },
    "Please help with my event",
  );
  assert.equal(form.title, before.title);
  assert.equal(form.date, before.date);
  assert.equal(form.hostEmail, before.hostEmail);
  assert.equal(form.rsvpEnabled, false);
});

test("location evidence for an indexed venue and city carries the original location forward", () => {
  const { form } = applyBuilderExtraction(
    createLiveCardForm(),
    {
      locations: [
        {
          venue: "AMC Grand Boulevard",
          city: "Miramar Beach",
          address: "",
          query: "AMC Grand Boulevard, Miramar Beach",
        },
      ],
      evidence: [
        { field: "locations[0].venue", quote: "AMC Grand Boulevard" },
        { field: "locations[0].city", quote: "Miramar Beach" },
      ],
    },
    "At AMC Grand Boulevard in Miramar Beach",
  );
  assert.equal(form.locations[0].venue, "AMC Grand Boulevard");
  assert.equal(form.locations[0].city, "Miramar Beach");
});

test("an appearance-only instruction cannot change event facts even in a faulty model response", () => {
  const before = {
    ...createLiveCardForm(),
    title: "Livia's birthday",
    date: "2026-09-26",
    overview: "A movie with friends",
    rsvpEnabled: true,
  };
  const message = "Make the background blue";
  const { form } = applyBuilderExtraction(
    before,
    {
      title: "Wedding",
      design: "Blue background",
      date: "2027-01-01",
      overview: "A wedding",
      rsvpEnabled: false,
      locations: [{ venue: "New place" }],
      evidence: ["title", "date", "locations", "rsvpEnabled"].map((field) => ({
        field,
        quote: message,
      })),
    },
    message,
  );
  assert.equal(form.design, "Blue background");
  for (const field of ["title", "date", "overview", "rsvpEnabled", "locations"] as const)
    assert.deepEqual(form[field], before[field]);
});

test("an explicit correction changes the date while preserving the verified location", () => {
  const before = createLiveCardForm("America/Chicago");
  before.title = "Livia's birthday";
  before.locations[0] = {
    ...before.locations[0],
    venue: "AMC",
    address: "123 Main St",
    city: "Chicago",
    timezone: "America/Chicago",
    placeId: "abc",
    resolution: "verified",
  };
  const { form } = applyBuilderExtraction(
    before,
    { date: "2026-10-04", evidence: [{ field: "date", quote: "October 4, 2026" }] },
    "Change the date to October 4, 2026",
  );
  assert.equal(form.date, "2026-10-04");
  assert.deepEqual(form.locations, before.locations);
});
