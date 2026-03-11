import assert from "node:assert/strict";
import test from "node:test";

import { buildGymMeetDiscoveryContent } from "./buildGymMeetDiscoveryContent";

test("mixed packet content keeps public admission and adds a Coaches tab", () => {
  const discovery = buildGymMeetDiscoveryContent({
    eventData: {
      discoverySource: {
        parseResult: {
          admission: [{ label: "Adults", price: "$20", note: "Cash only" }],
          meetDetails: {
            doorsOpen: "Doors open at 7:00 AM.",
            resultsInfo: "Live scoring available online.",
          },
          logistics: {
            parking: "Complimentary parking in lot A.",
            parkingLinks: [{ label: "Parking Map", url: "https://example.com/parking-map" }],
            parkingPricingLinks: [{ label: "Garage Rates", url: "https://example.com/rates" }],
          },
          coachInfo: {
            signIn: "Coaches sign in at the scoring table.",
            paymentInstructions: "Checks payable to State Gym.",
            entryFees: [{ label: "Athlete Entry Fee", amount: "$125", note: "Per gymnast" }],
            lateFees: [{ label: "Late Fee", amount: "$25", trigger: "After March 1", note: "" }],
            contacts: [],
            deadlines: [],
            links: [{ label: "MeetMaker", url: "https://example.com/meetmaker" }],
            notes: [],
          },
          links: [
            { label: "Rotation Sheets", url: "https://example.com/rotation" },
            { label: "Results", url: "https://example.com/results" },
          ],
        },
        extractionMeta: {
          coachPageHints: [{ page: 2, heading: "Coaches Information", excerpt: "Sign-in and late fees." }],
        },
        extractedText: "",
      },
      links: [{ label: "Parking Map", url: "https://example.com/parking-map" }],
    },
    customFields: { admission: "Adults: $20" },
    advancedSections: {
      logistics: {
        parking: "Complimentary parking in lot A.",
        parkingLinks: [{ label: "Parking Map", url: "https://example.com/parking-map" }],
        parkingPricingLinks: [{ label: "Garage Rates", url: "https://example.com/rates" }],
      },
      coaches: {
        enabled: true,
        paymentInstructions: "Checks payable to State Gym.",
        entryFees: [{ label: "Athlete Entry Fee", amount: "$125", note: "Per gymnast" }],
        teamFees: [],
        lateFees: [{ label: "Late Fee", amount: "$25", trigger: "After March 1", note: "" }],
        deadlines: [],
        contacts: [],
        links: [{ label: "MeetMaker", url: "https://example.com/meetmaker" }],
        notes: [],
      },
      meet: {
        resultsInfo: "Live scoring available online.",
      },
    },
    date: "2026-03-20",
    venue: "State Arena",
    address: "123 Main St, Chicago, IL 60601",
    description: "",
  });

  assert.ok(discovery.tabs.some((tab) => tab.id === "coaches"));
  assert.deepEqual(
    discovery.admissionSales.admissionCards.map((item) => item.label),
    ["Adults"]
  );
  assert.deepEqual(
    discovery.coaches.entryFees.map((item) => item.label),
    ["Athlete Entry Fee"]
  );
  assert.deepEqual(
    discovery.coaches.lateFees.map((item) => item.label),
    ["Late Fee"]
  );
});

test("no coach content means no Coaches tab", () => {
  const discovery = buildGymMeetDiscoveryContent({
    eventData: {
      discoverySource: {
        parseResult: {
          admission: [{ label: "Adults", price: "$20", note: "" }],
          meetDetails: { doorsOpen: "Doors open at 8:00 AM." },
          logistics: {},
          coachInfo: {},
          links: [],
        },
        extractionMeta: {},
        extractedText: "Doors open at 8:00 AM.",
      },
    },
    customFields: { admission: "Adults: $20" },
    advancedSections: { logistics: {}, meet: {}, coaches: { enabled: false } },
    date: "2026-03-20",
    venue: "State Arena",
    address: "123 Main St, Chicago, IL 60601",
    description: "",
  });

  assert.ok(!discovery.tabs.some((tab) => tab.id === "coaches"));
  assert.equal(discovery.coaches.hasContent, false);
});

test("meet details excludes admission fee and pass lines", () => {
  const discovery = buildGymMeetDiscoveryContent({
    eventData: {
      discoverySource: {
        parseResult: {
          admission: [
            { label: "Day Pass", price: "Children 5 and under: Free", note: "" },
            { label: "All Session Pass", price: "Adult: $25", note: "Cash only" },
          ],
          meetDetails: {
            operationalNotes: [
              "Day Pass - Children 5 and under: Free: Includes session access.",
              "All Session Pass - Adult: $25 cash only.",
              "Doors open at 8:00 AM.",
            ],
            doorsOpen: "Doors open at 8:00 AM.",
          },
          logistics: {},
          coachInfo: {},
          links: [],
        },
        extractionMeta: {},
        extractedText:
          "Day Pass - Children 5 and under: Free: Includes session access.\nAll Session Pass - Adult: $25 cash only.\nDoors open at 8:00 AM.",
      },
    },
    customFields: {},
    advancedSections: { logistics: {}, meet: {}, coaches: { enabled: false } },
    date: "2026-03-20",
    venue: "State Arena",
    address: "123 Main St, Chicago, IL 60601",
    detailsText:
      "Day Pass - Children 5 and under: Free: Includes session access.\nAll Session Pass - Adult: $25 cash only.\nDoors open at 8:00 AM.",
  });

  assert.deepEqual(
    discovery.meetDetails.lines.map((item) => item.text),
    ["Doors open at 8:00 AM."]
  );
  assert.deepEqual(
    discovery.admissionSales.admissionCards.map((item) => item.label),
    ["Day Pass", "All Session Pass"]
  );
});
