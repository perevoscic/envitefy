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

test("scan event page payload can rescue Kona title date and venue from OCR text", () => {
  const payload = buildScanEventPageHistoryPayload({
    source: "upload",
    scanAttemptId: "scan-kona-raw-1",
    ocr: {
      category: "General Events",
      ocrText: [
        "Kona Ice Is Coming",
        "Gateway Academy",
        "Tuesday, May 19",
        "9:30 AM - 1:40 PM",
        "Klassic $4",
        "King $5",
        "Blue Raspberry",
        "Watermelon Wave",
      ].join("\n"),
      fieldsGuess: {
        title: "Event from flyer",
        description: "",
        start: null,
        location: "",
        venue: "Gateway Academy",
        rsvp: null,
      },
    },
  });

  assert.equal(payload.title, "Kona Ice Is Coming — Gateway Academy");
  assert.match(String(payload.data.scheduleLine), /May 19, 2026/);
  assert.match(String(payload.data.scheduleLine), /9:30 AM/);
  assert.equal(payload.data.venue, "Gateway Academy");
  assert.equal(payload.data.location, undefined);
  assert.equal(payload.data.locationLabel, "Gateway Academy");
});

test("scan event page payload keeps Kona visit sentence out of venue and where", () => {
  const payload = buildScanEventPageHistoryPayload({
    source: "upload",
    scanAttemptId: "scan-kona-narrative-location-1",
    ocr: {
      category: "General Events",
      ocrText: [
        "Kona Ice Is Coming",
        "Gateway Academy",
        "Tuesday, May 19",
        "9:30 AM - 1:40 PM",
        "Klassic $4",
        "Blue Raspberry",
        "Watermelon Wave",
      ].join("\n"),
      fieldsGuess: {
        title: "Kona Ice Is Coming — Gateway Academy",
        description: "Kona Ice visits Gateway Academy on Tuesday, May 19 from 9:30 AM to 1:40 PM.",
        start: "2026-05-19T09:30:00",
        end: "2026-05-19T13:40:00",
        venue: "Kona Ice visits Gateway Academy on Tuesday",
        location: "Kona Ice visits Gateway Academy on Tuesday",
        rsvp: "Host",
      },
    },
  });

  assert.equal(payload.data.venue, "Gateway Academy");
  assert.equal(payload.data.location, undefined);
  assert.equal(payload.data.locationLabel, "Gateway Academy");
  assert.equal(payload.data.rsvp, undefined);
  assert.deepEqual(
    payload.data.skinSections?.filter((section) => section.label === "RSVP"),
    [],
  );
});

test("scan event page payload handles similar vendor school flyers without Kona-specific wording", () => {
  const payload = buildScanEventPageHistoryPayload({
    source: "upload",
    scanAttemptId: "scan-vendor-school-1",
    ocr: {
      category: "General Events",
      ocrText: [
        "Cool Treats Is Coming",
        "Sunrise Elementary",
        "Wednesday, June 10",
        "10:15 AM - 2:00 PM",
        "Small Cup $3",
        "Large Cup $5",
        "Toppings Bar $1",
        "Flavors",
        "Cherry Blast",
        "Mango Tango",
        "Cotton Candy",
        "Lemon Lime",
        "Contact: 850.555.1212",
      ].join("\n"),
      fieldsGuess: {
        title: "Cool Treats Is Coming — Sunrise Elementary — Cool Treats will be at Sunrise Elementary on Wednesday",
        description: "Cool Treats will be at Sunrise Elementary on Wednesday, June 10 from 10:15 AM to 2:00 PM.",
        start: "2026-06-10T10:15:00",
        end: "2026-06-10T14:00:00",
        venue: "Cool Treats will be at Sunrise Elementary on Wednesday",
        location: "Cool Treats will be at Sunrise Elementary on Wednesday",
        rsvp: "RSVP: 850.555.1212",
      },
    },
  });

  assert.equal(payload.title, "Cool Treats Is Coming — Sunrise Elementary");
  assert.equal(payload.data.venue, "Sunrise Elementary");
  assert.equal(payload.data.location, undefined);
  assert.equal(payload.data.locationLabel, "Sunrise Elementary");
  assert.equal(payload.data.rsvp, undefined);
  assert.equal(payload.data.rsvpPhone, undefined);
  assert.match(
    payload.data.ocrFacts?.find((fact) => fact.label === "Menu Prices")?.value || "",
    /Small Cup \$3/,
  );
  assert.match(
    payload.data.ocrFacts?.find((fact) => fact.label === "Flavors")?.value || "",
    /Cherry Blast/,
  );
  assert.deepEqual(
    payload.data.skinSections?.filter((section) => section.label === "RSVP"),
    [],
  );
});

test("scan event page payload applies provider-enriched addresses without hardcoding", () => {
  const payload = buildScanEventPageHistoryPayload({
    source: "upload",
    scanAttemptId: "scan-kona-enriched-1",
    ocr: {
      category: "General Events",
      ocrText: [
        "Kona Ice Is Coming",
        "Gateway Academy",
        "Tuesday, May 19",
        "9:30 AM - 1:40 PM",
        "KONA ICE OF SOUTH WALTON COUNTY",
      ].join("\n"),
      fieldsGuess: {
        title: "Event from flyer",
        description: "Kona Ice is coming to Gateway Academy on May 19 from 9:30 AM to 1:40 PM.",
        start: null,
        location: "On Tuesday",
        venue: "On Tuesday",
        rsvp: "Host",
      },
    },
    locationEnrichment: {
      address: "122 Poinciana Blvd, Miramar Beach, FL 32550",
      provider: "google_places",
      query: "Gateway Academy Walton County",
      placeName: "Gateway Academy",
      placeId: "provider-place-id",
    },
  });

  assert.equal(payload.data.venue, "Gateway Academy");
  assert.equal(payload.data.location, "122 Poinciana Blvd, Miramar Beach, FL 32550");
  assert.equal(payload.data.rsvp, undefined);
  assert.deepEqual(payload.data.locationEnrichment, {
    address: "122 Poinciana Blvd, Miramar Beach, FL 32550",
    provider: "google_places",
    query: "Gateway Academy Walton County",
    placeName: "Gateway Academy",
    placeId: "provider-place-id",
  });
  assert.equal(
    payload.data.locationLabel,
    "Gateway Academy, 122 Poinciana Blvd, Miramar Beach, FL 32550",
  );
});

test("scan event page payload preserves after-movie pizza details", () => {
  const payload = buildScanEventPageHistoryPayload({
    source: "upload",
    scanAttemptId: "scan-birthday-movie-1",
    ocr: {
      category: "Birthdays",
      ocrText: [
        "Lara is Turning 7!",
        "Movie: Sheep Detective",
        "When: Thursday at 5:00 PM",
        "Where: AMC Destin Commons 14",
        "After the Movie: Pizza at Pazzo Destin",
      ].join("\n"),
      fieldsGuess: {
        title: "Lara's 7th Birthday",
        description: "Join us to celebrate Lara's 7th Birthday at AMC Destin Commons 14.",
        start: "2026-05-21T17:00:00",
        venue: "AMC Destin Commons 14",
        location: null,
      },
    },
  });

  assert.match(String(payload.data.description), /Movie: Sheep Detective/);
  assert.match(String(payload.data.description), /After the Movie: Pizza at Pazzo Destin/);
  assert.deepEqual(payload.data.additionalLocations, [
    {
      label: "After the Movie",
      location: "Pazzo Destin",
      description: "Pizza at Pazzo Destin",
    },
  ]);
  assert.match(
    payload.data.skinSections?.find((section) => section.label === "After the Movie")?.value || "",
    /Pizza at Pazzo Destin/,
  );
});

test("scan event page payload rejects model-invented RSVP and venue sentences", () => {
  const payload = buildScanEventPageHistoryPayload({
    source: "upload",
    scanAttemptId: "scan-kona-model-noise-1",
    ocr: {
      category: "General Events",
      ocrText: [
        "Kona Ice Is Coming!",
        "Gateway Academy",
        "Tuesday, May 19",
        "9:30 AM - 1:40 PM",
        "Contact: 850.567.5057 | wscott@kona-ice.com | www.kona-ice.com",
      ].join("\n"),
      fieldsGuess: {
        title: "Kona Ice Is Coming! — Gateway Academy — Kona Ice will be at Gateway Academy on Tuesday",
        description: "Kona Ice will be at Gateway Academy on Tuesday, May 19 from 9:30 AM to 1:40 PM.",
        start: "2026-05-19T09:30:00",
        end: "2026-05-19T13:40:00",
        location: "May 19 from 9:30 to 1:40.",
        venue: "Kona Ice will be at Gateway Academy on Tuesday",
        rsvp: "RSVP: 850.567.5057",
      },
    },
  });

  assert.equal(payload.title, "Kona Ice Is Coming! — Gateway Academy");
  assert.equal(payload.data.venue, "Gateway Academy");
  assert.equal(payload.data.location, undefined);
  assert.equal(payload.data.locationLabel, "Gateway Academy");
  assert.equal(payload.data.rsvp, undefined);
  assert.equal(payload.data.rsvpPhone, undefined);
  assert.deepEqual(
    payload.data.skinSections?.filter((section) => section.label === "RSVP"),
    [],
  );
});
