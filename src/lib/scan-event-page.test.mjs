import assert from "node:assert/strict";
import test from "node:test";
import { buildScanEventPageHistoryPayload } from "./scan-event-page.ts";

test("scan event page payload publishes invite scans without requiring a date", () => {
  const payload = buildScanEventPageHistoryPayload({
    source: "upload",
    scanAttemptId: "scan-test-1",
    ocr: {
      category: "Birthday",
      ocrText: "You're invited to Mia's birthday party. Join us for cake.",
      fieldsGuess: {
        title: "Mia's Birthday Party",
        description: "Join us for cake.",
        location: "",
      },
    },
  });

  assert.equal(payload.title, "Mia's Birthday Party");
  assert.equal(payload.ownership, "invited");
  assert.equal(payload.data.createdVia, "ocr-birthday-skin");
  assert.equal(payload.data.invitedFromScan, true);
  assert.equal(payload.data.startISO, null);
  assert.equal(payload.data.scheduleLine, "Date TBD");
  assert.equal(payload.data.locationLabel, "Location TBD");
  assert.deepEqual(payload.data.requestedOutputs, ["event_page", "live_card"]);
  assert.equal(payload.data.publicEvent?.renderer, undefined);
});

test("scan event page payload keeps schedule-like scans as owned events", () => {
  const payload = buildScanEventPageHistoryPayload({
    source: "camera",
    scanAttemptId: "scan-test-2",
    ocr: {
      category: "Gymnastics",
      ocrText: "Spring gymnastics practice schedule at Main Gym.",
      fieldsGuess: {
        title: "Spring Practice Schedule",
        start: "2026-06-01T18:00:00.000Z",
        end: "2026-06-01T19:30:00.000Z",
        timeFound: true,
        venue: "Main Gym",
        location: "123 Center St",
        description: "Spring gymnastics practice schedule.",
      },
    },
  });

  assert.equal(payload.ownership, "owned");
  assert.equal(payload.data.createdVia, "ocr");
  assert.equal(payload.data.invitedFromScan, false);
  assert.equal(payload.data.sourceContext?.type, "snap");
  assert.equal(payload.data.sourceContext?.detectedSourceIntent, "authoring_source");
  assert.equal(payload.data.startISO, "2026-06-01T18:00:00.000Z");
  assert.equal(payload.data.endISO, "2026-06-01T19:30:00.000Z");
  assert.equal(payload.data.locationLabel, "Main Gym, 123 Center St");
});

test("scan event page payload rescues obvious invite details from raw OCR text", () => {
  const payload = buildScanEventPageHistoryPayload({
    source: "upload",
    scanAttemptId: "scan-test-3",
    ocr: {
      category: "General Events",
      ocrText: [
        "Graduation Party 2026",
        "Friday, May 15th",
        "3487 Scenic Highway 98 Destin, FL",
        "(near Crab Trap)",
        "from 2-6 pm",
        "rsvp to Liz at",
        "850-687-2596",
      ].join("\n"),
      fieldsGuess: {
        title: "Event from flyer",
        description: "Join us for Event from flyer.",
        start: null,
        location: "Location TBD",
      },
    },
  });

  assert.equal(payload.title, "Graduation Party 2026");
  assert.equal(payload.data.category, "Graduations");
  assert.equal(payload.data.createdVia, "ocr-invite-skin");
  assert.match(String(payload.data.scheduleLine), /May 15, 2026/);
  assert.match(String(payload.data.scheduleLine), /2:00 PM/);
  assert.match(String(payload.data.locationLabel), /3487 Scenic Highway 98/);
  assert.match(String(payload.data.locationLabel), /Destin, FL/);
  assert.equal(payload.data.timezone, "America/Chicago");
  assert.equal(payload.data.startISO, "2026-05-15T19:00:00.000Z");
  assert.equal(payload.data.endISO, "2026-05-15T23:00:00.000Z");
  assert.equal(payload.data.rsvp, "RSVP: Liz 850-687-2596");
  assert.equal(payload.data.rsvpName, "Liz");
  assert.equal(payload.data.rsvpPhone, "850-687-2596");
  assert.doesNotMatch(String(payload.data.goodToKnow), /Event from flyer/);
});

test("scan event page payload keeps Kona menu details out of location and RSVP", () => {
  const payload = buildScanEventPageHistoryPayload({
    source: "upload",
    scanAttemptId: "scan-kona-1",
    ocr: {
      category: "General Events",
      ocrText: [
        "Kona Ice Is Coming",
        "Gateway Academy",
        "Tuesday, May 19",
        "9:30 AM - 1:40 PM",
        "Klassic $4",
        "King $5",
        "Color Changing $6, $4 Refill",
        "Kowabunga $7, $4 Refill",
        "Kollectable $8, $4 Refill",
        "TopZ Sour Powder $1",
        "FLAVORWAVE",
        "Blue Raspberry",
        "Tiger's Blood",
        "Groovy Grape",
        "Island Rush",
        "Lucky Lime",
        "Monster Mango",
        "Ninja Cherry",
        "Pina Colada",
        "Strawberry Treasure",
        "Watermelon Wave",
        "We hope you have a very fun, safe summer!",
      ].join("\n"),
      fieldsGuess: {
        title: "Kona Ice Is Coming — Gateway Academy",
        start: "2026-05-19T09:30:00",
        end: "2026-05-19T13:40:00",
        timeFound: true,
        venue: "Gateway Academy",
        location:
          "4; King $5; Color Changing $6, $4 Refill; Kowabunga $7, $4 Refill; Kollectable $8, $4 Refill; TopZ Sour Powder $1",
        description: "Kona Ice is coming to Gateway Academy on May 19 from 9:30 AM to 1:40 PM.",
        rsvp: "Host",
        goodToKnow: null,
      },
    },
  });

  assert.equal(payload.ownership, "owned");
  assert.equal(payload.data.location, undefined);
  assert.equal(payload.data.venue, "Gateway Academy");
  assert.equal(payload.data.locationLabel, "Gateway Academy");
  assert.equal(payload.data.rsvp, undefined);
  assert.equal(payload.data.rsvpName, undefined);
  assert.equal(payload.data.goodToKnow, undefined);
  assert.equal(payload.data.thingsToDo, undefined);
  assert.deepEqual(
    payload.data.skinSections?.filter((section) => section.label === "RSVP"),
    [],
  );
  assert.match(
    payload.data.ocrFacts?.find((fact) => fact.label === "Menu Prices")?.value || "",
    /Klassic \$4/,
  );
  assert.match(
    payload.data.ocrFacts?.find((fact) => fact.label === "Flavors")?.value || "",
    /Watermelon Wave/,
  );
});
