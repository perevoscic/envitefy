import assert from "node:assert/strict";
import test from "node:test";

import { buildGymMeetDiscoveryContent } from "./buildGymMeetDiscoveryContent";

const findSection = (discovery: any, id: string) =>
  discovery.sections.find((section: any) => section.id === id);
const findBlock = (section: any, id: string) =>
  (section?.blocks || []).find((block: any) => block.id === id);

test("mixed packet content keeps rich operational sections separate but merges light results and hotels", () => {
  const discovery = buildGymMeetDiscoveryContent({
    eventData: {
      discoverySource: {
        parseResult: {
          admission: [{ label: "Adults", price: "$20", note: "Cash only" }],
          meetDetails: {
            doorsOpen: "Doors open at 7:00 AM.",
            registrationInfo: "Registration opens at 6:30 AM.",
            resultsInfo: "Live scoring available online.",
          },
          logistics: {
            parking: "Complimentary parking in lot A.",
            parkingLinks: [{ label: "Parking Map", url: "https://example.com/parking-map" }],
          },
          coachInfo: {
            signIn: "Coaches sign in at the scoring table.",
            paymentInstructions: "Checks payable to State Gym.",
            entryFees: [{ label: "Athlete Entry Fee", amount: "$125", note: "Per gymnast" }],
            lateFees: [{ label: "Late Fee", amount: "$25", trigger: "After March 1" }],
            links: [{ label: "MeetMaker", url: "https://example.com/meetmaker" }],
          },
          links: [
            { label: "Results", url: "https://example.com/results" },
            { label: "Purchase Admission Here", url: "https://tickets.example.com/admission" },
            { label: "Schedule & Info Packet", url: "https://example.com/info-packet.pdf" },
          ],
        },
        extractionMeta: {
          coachPageHints: [{ page: 2, heading: "Coaches Information", excerpt: "Sign-in and late fees." }],
          discoveredLinks: [
            { label: "Official Results", url: "https://example.com/results" },
            { label: "Host Hotel", url: "https://example.com/hotel" },
          ],
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
      },
      coaches: {
        enabled: true,
        paymentInstructions: "Checks payable to State Gym.",
        entryFees: [{ label: "Athlete Entry Fee", amount: "$125", note: "Per gymnast" }],
        lateFees: [{ label: "Late Fee", amount: "$25", trigger: "After March 1" }],
        links: [{ label: "MeetMaker", url: "https://example.com/meetmaker" }],
      },
      meet: {
        resultsInfo: "Live scoring available online.",
      },
    },
    date: "2026-03-20",
    venue: "State Arena",
    address: "123 Main St, Chicago, IL 60601",
  });

  assert.ok(findSection(discovery, "admission"));
  assert.ok(findSection(discovery, "registration"));
  assert.ok(findSection(discovery, "coaches"));
  assert.ok(findSection(discovery, "traffic-parking"));
  assert.equal(findSection(discovery, "results"), undefined);
  assert.equal(findSection(discovery, "documents"), undefined);
  assert.equal(findSection(discovery, "hotels"), undefined);
  assert.match(JSON.stringify(findSection(discovery, "meet-details")), /Live scoring available online/);
  assert.match(JSON.stringify(findSection(discovery, "traffic-parking")), /Host Hotel/);
});

test("lightweight results merge into meet details without leaking into admission", () => {
  const discovery = buildGymMeetDiscoveryContent({
    eventData: {
      discoverySource: {
        parseResult: {
          admission: [{ label: "Adults", price: "$20", note: "" }],
          meetDetails: { resultsInfo: "Live scoring available online." },
          links: [
            { label: "Results", url: "https://example.com/results" },
            { label: "Purchase Admission Here", url: "https://example.com/admission" },
          ],
        },
        extractionMeta: {},
        extractedText: "",
      },
    },
    customFields: { admission: "Adults: $20" },
    advancedSections: { logistics: {}, meet: { resultsInfo: "Live scoring available online." }, coaches: {} },
    date: "2026-03-20",
    venue: "State Arena",
    address: "123 Main St, Chicago, IL 60601",
  });

  const results = findSection(discovery, "results");
  const meetDetails = findSection(discovery, "meet-details");
  const admission = findSection(discovery, "admission");

  assert.equal(results, undefined);
  assert.ok(meetDetails);
  assert.match(JSON.stringify(meetDetails), /Live scoring available online/);
  assert.ok(admission);
  assert.doesNotMatch(JSON.stringify(admission), /Live scoring available online/);
  assert.doesNotMatch(JSON.stringify(admission), /https:\/\/example\.com\/results/);
  assert.equal(findSection(discovery, "coaches"), undefined);
});

test("public registration info stays in meet details while admission remains separate", () => {
  const discovery = buildGymMeetDiscoveryContent({
    eventData: {
      discoverySource: {
        parseResult: {
          admission: [{ label: "Adults", price: "$20", note: "" }],
          meetDetails: { registrationInfo: "Registration opens at 7:00 AM." },
          links: [{ label: "Purchase Admission Here", url: "https://example.com/admission" }],
        },
        extractionMeta: {},
        extractedText: "",
      },
    },
    customFields: { admission: "Adults: $20" },
    advancedSections: { logistics: {}, meet: {}, coaches: {} },
    venue: "State Arena",
    address: "123 Main St, Chicago, IL 60601",
  });

  const meetDetails = findSection(discovery, "meet-details");
  const admission = findSection(discovery, "admission");

  assert.equal(findSection(discovery, "registration"), undefined);
  assert.ok(admission);
  assert.ok(meetDetails);
  assert.match(JSON.stringify(meetDetails), /Registration opens at 7:00 AM/i);
});

test("no coach content means no coaches section", () => {
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
  });

  assert.equal(findSection(discovery, "coaches"), undefined);
});

test("schema and json-ld noise are filtered out of user-facing sections", () => {
  const discovery = buildGymMeetDiscoveryContent({
    eventData: {
      discoverySource: {
        parseResult: {
          meetDetails: {
            operationalNotes: ["Doors open at 8:00 AM."],
          },
          links: [{ label: "Schedule & Info Packet", url: "https://example.com/packet.pdf" }],
        },
        extractionMeta: {},
        extractedText: [
          '{"@context":"https://schema.org","@graph":[{"@type":"WebPage"}]}',
          '"breadcrumb":{"@id":"https://example.com/#breadcrumb"}',
          "Doors open at 8:00 AM.",
        ].join("\n"),
      },
    },
    customFields: {},
    advancedSections: { logistics: {}, meet: {}, coaches: {} },
    date: "2026-03-20",
    venue: "State Arena",
    address: "123 Main St, Chicago, IL 60601",
    detailsText: "Doors open at 8:00 AM.",
  });

  assert.doesNotMatch(JSON.stringify(discovery.sections), /schema\.org|@context|breadcrumb/i);
});

test("packet and faq links merge into meet details when sparse", () => {
  const discovery = buildGymMeetDiscoveryContent({
    eventData: {
      discoverySource: {
        parseResult: {
          links: [
            { label: "Schedule & Info Packet", url: "https://example.com/packet.pdf" },
            { label: "FAQ", url: "https://example.com/faq.pdf" },
          ],
        },
        extractionMeta: {},
        extractedText: "",
      },
    },
    customFields: {},
    advancedSections: { logistics: {}, meet: {}, coaches: {} },
    venue: "State Arena",
    address: "123 Main St, Chicago, IL 60601",
  });

  const documents = findSection(discovery, "documents");
  const admission = findSection(discovery, "admission");
  const meetDetails = findSection(discovery, "meet-details");

  assert.equal(documents, undefined);
  assert.equal(admission, undefined);
  assert.ok(meetDetails);
  assert.match(JSON.stringify(meetDetails), /packet\.pdf|faq\.pdf/i);
});

test("rich results merge into meet details communication cards", () => {
  const discovery = buildGymMeetDiscoveryContent({
    eventData: {
      discoverySource: {
        parseResult: {
          admission: [{ label: "Adults", price: "$20", note: "" }],
          meetDetails: {
            doorsOpen: "Doors open at 7:00 AM.",
            registrationInfo: "Registration opens at 6:30 AM.",
          },
          logistics: {
            parking: "Park in lot A.",
            hotel: "Book nearby rooms early.",
          },
          coachInfo: {
            signIn: "Sign in at the judges table.",
            entryFees: [
              { label: "Session 1", amount: "$100" },
              { label: "Session 2", amount: "$105" },
              { label: "Session 3", amount: "$110" },
            ],
            deadlines: [
              { label: "Entry deadline", date: "2026-03-01" },
              { label: "Scratch deadline", date: "2026-03-05" },
            ],
          },
          links: [
            { label: "Results 1", url: "https://example.com/results/1" },
            { label: "Results 2", url: "https://example.com/results/2" },
            { label: "Results 3", url: "https://example.com/results/3" },
            { label: "Purchase Admission Here", url: "https://example.com/admission" },
            { label: "Venue Map", url: "https://example.com/venue-map" },
            { label: "Hotel Booking", url: "https://example.com/hotel" },
            { label: "FAQ", url: "https://example.com/faq.pdf" },
          ],
        },
        extractionMeta: {},
        extractedText: "",
      },
    },
    customFields: { admission: "Adults: $20" },
    advancedSections: {
      logistics: {
        parking: "Park in lot A.",
        hotelInfo: "Book nearby rooms early.",
      },
      meet: {},
      coaches: {
        enabled: true,
        entryFees: [
          { label: "Session 1", amount: "$100" },
          { label: "Session 2", amount: "$105" },
          { label: "Session 3", amount: "$110" },
        ],
        deadlines: [
          { label: "Entry deadline", date: "2026-03-01" },
          { label: "Scratch deadline", date: "2026-03-05" },
        ],
      },
    },
    venue: "State Arena",
    address: "123 Main St, Chicago, IL 60601",
  });

  const results = findSection(discovery, "results");
  const meetDetails = findSection(discovery, "meet-details");

  assert.equal(results, undefined);
  assert.ok(meetDetails);
  assert.match(JSON.stringify(meetDetails), /Results 1|Results 2|Results 3/);
  assert.match(JSON.stringify(meetDetails), /results\/1|results\/2|results\/3/);
});

test("spectator presale announcements route into admission and linked domains stay out of copy", () => {
  const discovery = buildGymMeetDiscoveryContent({
    eventData: {
      discoverySource: {
        parseResult: {
          communications: {
            announcements: [
              {
                title: "Spectator Admission",
                body: "Spectator pre-sale available now at USACompetitions.com.",
              },
            ],
          },
          meetDetails: {
            resultsInfo: "Live scoring available online at USACompetitions.com.",
          },
          links: [
            { label: "USA Competitions", url: "https://www.usacompetitions.com/admission" },
            { label: "Official Results", url: "https://www.usacompetitions.com/results" },
          ],
        },
        extractionMeta: {
          discoveredLinks: [
            { label: "USA Competitions", url: "https://www.usacompetitions.com/admission" },
            { label: "Official Results", url: "https://www.usacompetitions.com/results" },
          ],
        },
        extractedText: "",
      },
    },
    customFields: {},
    advancedSections: { logistics: {}, meet: {}, coaches: {} },
    venue: "Coral Springs Gymnasium",
    address: "123 Main St, Coral Springs, FL 33065",
  });

  const admission = findSection(discovery, "admission");
  const meetDetails = findSection(discovery, "meet-details");
  const admissionCopy = JSON.stringify(
    (admission?.blocks || []).filter((block: any) => block.type !== "link-list")
  );
  const meetDetailsCopy = JSON.stringify(
    (meetDetails?.blocks || [])
      .filter((block: any) => block.type !== "link-list")
      .map((block: any) =>
        block?.type === "card-grid"
          ? {
              ...block,
              cards: (block.cards || []).map((card: any) => ({
                ...card,
                action: card?.action ? { ...card.action, url: "" } : undefined,
              })),
            }
          : block
      )
  );

  assert.ok(admission);
  assert.match(JSON.stringify(admission), /Spectator pre-sale available now/i);
  assert.match(JSON.stringify(admission), /USA Competitions/);
  assert.ok(meetDetails);
  assert.doesNotMatch(JSON.stringify(meetDetails), /Spectator pre-sale available now/i);
  assert.doesNotMatch(admissionCopy, /USACompetitions\.com/i);
  assert.doesNotMatch(meetDetailsCopy, /USACompetitions\.com/i);
});

test("operational routing keeps public meet facts out of announcements", () => {
  const discovery = buildGymMeetDiscoveryContent({
    eventData: {
      discoverySource: {
        parseResult: {
          meetDetails: {
            arrivalGuidance: "Arrive 45 minutes before your session.",
            registrationInfo: "Registration is at guest services near the east hall.",
            rotationSheetsInfo: "Rotation sheets will be available Friday night online.",
            awardsInfo: "Awards will begin immediately after each session.",
          },
          coachInfo: {
            floorAccess:
              "Coaches not in Meet Reservations and without verifiable Pro member status must pay admission and may only be in spectator areas.",
          },
          communications: {
            announcements: [
              {
                title: "Spectator Admission",
                body: "Spectator pre-sale available now online.",
              },
            ],
          },
          contacts: [
            { role: "Meet Director", name: "Shane Cummings", email: "info@", phone: "" },
            {
              role: "Director of Operations",
              name: "Sharyn Strickland",
              phone: "877-341-9007",
            },
            { role: "Assistant Event Coordinator", name: "Taylor Aucoin" },
            { role: "Floor Manager", name: "Gary Anderson" },
            {
              role: "Venue Contact",
              name: "Coral Springs Gymnasium",
              phone: "954-345-2201 / 954-345-2107",
            },
            {
              role: "Coach Registration Contact",
              name: "Coach Admin",
              email: "coach@example.com",
            },
          ],
          unmappedFacts: [
            {
              category: "venue_contact",
              detail: "Coral Springs Gymnasium phone numbers are 954-345-2201 and 954-345-2107.",
              confidence: "high",
            },
            {
              category: "policy",
              detail: "On-site admission is credit/debit card only; cash is not accepted.",
              confidence: "high",
            },
            {
              category: "marketing",
              detail: "Visit Lauderdale is a sponsor of the event.",
              confidence: "high",
            },
            {
              category: "club_participation",
              detail: "Multiple clubs are participating this weekend.",
              confidence: "high",
            },
            {
              category: "document_version",
              detail: "The schedule document is marked as final posting on March 8, 2026.",
              confidence: "high",
            },
          ],
          links: [
            { label: "Admission", url: "https://tickets.example.com/admission" },
            { label: "Meet Packet", url: "https://example.com/packet.pdf" },
          ],
        },
        extractionMeta: {},
        extractedText:
          "On-site admission is credit/debit card only; cash is not accepted.\nCoaches not in Meet Reservations and without verifiable Pro member status must pay admission and may only be in spectator areas.",
      },
    },
    customFields: {},
    advancedSections: { meet: {}, logistics: {}, coaches: {} },
    venue: "Coral Springs Gymnasium",
    address: "123 Main St, Coral Springs, FL 33065",
  });

  const meetDetails = findSection(discovery, "meet-details");
  const admission = findSection(discovery, "admission");
  const coaches = findSection(discovery, "coaches");
  const venueDetails = findSection(discovery, "venue-details");
  const allContent = JSON.stringify(discovery.sections);

  assert.ok(meetDetails);
  assert.ok(admission);
  assert.ok(coaches);
  assert.ok(venueDetails);

  assert.match(JSON.stringify(meetDetails), /Rotation sheets will be available Friday night online/i);
  assert.match(JSON.stringify(meetDetails), /Awards will begin immediately after each session/i);
  assert.match(JSON.stringify(meetDetails), /Shane Cummings/i);
  assert.match(JSON.stringify(meetDetails), /Sharyn Strickland/i);
  assert.match(JSON.stringify(meetDetails), /Taylor Aucoin/i);
  assert.match(JSON.stringify(meetDetails), /Gary Anderson/i);
  assert.doesNotMatch(JSON.stringify(meetDetails), /Spectator pre-sale available now online/i);
  assert.equal(findBlock(meetDetails, "announcements"), undefined);

  assert.match(JSON.stringify(admission), /Spectator pre-sale available now online/i);
  assert.match(JSON.stringify(admission), /credit\/debit card only; cash is not accepted/i);

  assert.match(
    JSON.stringify(coaches),
    /Coaches not in Meet Reservations and without verifiable Pro member status/i
  );

  assert.match(JSON.stringify(venueDetails), /954-345-2201/i);
  assert.match(JSON.stringify(venueDetails), /954-345-2107/i);

  assert.doesNotMatch(allContent, /Visit Lauderdale is a sponsor/i);
  assert.doesNotMatch(allContent, /Multiple clubs are participating/i);
  assert.doesNotMatch(allContent, /final posting on March 8, 2026/i);
  assert.doesNotMatch(allContent, /info@/i);
});

test("persisted generated announcements are suppressed while transient updates remain", () => {
  const discovery = buildGymMeetDiscoveryContent({
    eventData: {
      discoverySource: {
        parseResult: {
          meetDetails: {
            rotationSheetsInfo: "Rotation sheets will be posted online before the event.",
          },
          links: [],
        },
        extractionMeta: {},
        extractedText: "",
      },
    },
    customFields: {},
    advancedSections: {
      meet: {
        rotationSheetsInfo:
          "Rotation sheets will be posted online before the event.",
      },
      logistics: {},
      coaches: {},
      announcements: {
        announcements: [
          {
            id: "announcement-1",
            text: "venue_contact Coral Springs Gymnasium phone numbers are 954-345-2201 and 954-345-2107.",
            priority: "normal",
            createdAt: "2026-03-10T12:00:00.000Z",
          },
          {
            id: "announcement-2",
            text: "Rotation sheets availability Rotation sheets will be posted online before the event.",
            priority: "normal",
            createdAt: "2026-03-10T12:00:00.000Z",
          },
          {
            id: "announcement-3",
            text: "Session 2 families should arrive 20 minutes earlier due to parking delays.",
            priority: "urgent",
            createdAt: "2026-03-10T13:00:00.000Z",
          },
        ],
      },
    },
    venue: "Coral Springs Gymnasium",
    address: "123 Main St, Coral Springs, FL 33065",
  });

  const meetDetails = findSection(discovery, "meet-details");
  const announcementsBlock = findBlock(meetDetails, "announcements");
  const serialized = JSON.stringify(meetDetails);

  assert.ok(meetDetails);
  assert.match(serialized, /Rotation sheets will be posted online before the event/i);
  assert.match(serialized, /Session 2 families should arrive 20 minutes earlier/i);
  assert.ok(announcementsBlock);
  assert.doesNotMatch(serialized, /venue_contact Coral Springs Gymnasium phone numbers/i);
});

test("uploaded gear and general announcements stay visible inside meet details", () => {
  const discovery = buildGymMeetDiscoveryContent({
    eventData: {
      discoverySource: {
        parseResult: {
          gear: {
            uniform: "Red competition leotard with silver warm-up jacket.",
            checklist: ["Grips", "Water bottle"],
          },
          communications: {
            announcements: [
              {
                title: "Parent Reminder",
                body: "Arrive with athlete hair already done.",
              },
            ],
          },
          links: [],
        },
        extractionMeta: {},
        extractedText: "",
      },
    },
    customFields: {},
    advancedSections: {
      meet: {},
      logistics: {},
      coaches: {},
      gear: {
        enabled: false,
        leotardOfDay: "Red competition leotard with silver warm-up jacket.",
        hairMakeupNotes: "Hair in a tight bun.",
        musicFileLink: "https://example.com/floor-music.mp3",
        items: [{ id: "gear-1", name: "Grips" }],
      },
    },
    venue: "State Arena",
    address: "123 Main St, Chicago, IL 60601",
  });

  const meetDetails = findSection(discovery, "meet-details");

  assert.ok(meetDetails);
  assert.match(JSON.stringify(meetDetails), /Red competition leotard/i);
  assert.match(JSON.stringify(meetDetails), /Hair in a tight bun/i);
  assert.match(JSON.stringify(meetDetails), /Grips/i);
  assert.match(JSON.stringify(meetDetails), /Parent Reminder/i);
  assert.match(JSON.stringify(meetDetails), /floor-music\.mp3/i);
});

test("builder announcements render inside the meet details tab", () => {
  const discovery = buildGymMeetDiscoveryContent({
    eventData: {
      discoverySource: {
        parseResult: {
          meetDetails: {
            doorsOpen: "Doors open at 7:15 AM.",
          },
          links: [],
        },
        extractionMeta: {},
        extractedText: "",
      },
    },
    customFields: {},
    advancedSections: {
      meet: {},
      logistics: {},
      coaches: {},
      announcements: {
        announcements: [
          {
            id: "announcement-1",
            text: "Spectator admission pre-sale closes Thursday at 8:00 PM.",
            priority: "normal",
            createdAt: "2026-03-10T12:00:00.000Z",
          },
          {
            id: "announcement-2",
            text: "Session 2 families should arrive 20 minutes earlier due to parking delays.",
            priority: "urgent",
            createdAt: "2026-03-10T13:00:00.000Z",
          },
        ],
      },
    },
    venue: "State Arena",
    address: "123 Main St, Chicago, IL 60601",
  });

  const meetDetails = findSection(discovery, "meet-details");

  assert.ok(meetDetails);
  assert.match(JSON.stringify(meetDetails), /Spectator admission pre-sale closes Thursday at 8:00 PM/i);
  assert.match(JSON.stringify(meetDetails), /Session 2 families should arrive 20 minutes earlier/i);
  assert.match(JSON.stringify(meetDetails), /Urgent Update/i);
  assert.doesNotMatch(JSON.stringify(meetDetails), /2026-03-10T1[23]:00:00\.000Z/i);
});

test("duplicate announcement ids are normalized to unique card keys", () => {
  const discovery = buildGymMeetDiscoveryContent({
    eventData: {
      discoverySource: {
        parseResult: {
          meetDetails: {
            doorsOpen: "Doors open at 7:15 AM.",
          },
          links: [],
        },
        extractionMeta: {},
        extractedText: "",
      },
    },
    customFields: {},
    advancedSections: {
      meet: {},
      logistics: {},
      coaches: {},
      announcements: {
        announcements: [
          {
            id: "announcement-2",
            text: "Spectator admission pre-sale closes Thursday at 8:00 PM.",
            priority: "normal",
            createdAt: "2026-03-10T12:00:00.000Z",
          },
          {
            id: "announcement-2",
            text: "Session 2 families should arrive 20 minutes earlier due to parking delays.",
            priority: "urgent",
            createdAt: "2026-03-10T13:00:00.000Z",
          },
        ],
      },
    },
    venue: "State Arena",
    address: "123 Main St, Chicago, IL 60601",
  });

  const meetDetails = findSection(discovery, "meet-details");
  const cardKeys = (meetDetails?.blocks || [])
    .flatMap((block: any) => (block?.type === "card-grid" && Array.isArray(block.cards) ? block.cards : []))
    .map((card: any) => card.key)
    .filter((key: string) => /^announcement-2(?:-\d+)?$/.test(key));

  assert.deepEqual(cardKeys, ["announcement-2", "announcement-2-2"]);
  assert.equal(new Set(cardKeys).size, cardKeys.length);
});
