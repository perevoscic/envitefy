import assert from "node:assert/strict";
import test from "node:test";

import { buildGymMeetDiscoveryContent } from "./buildGymMeetDiscoveryContent";
import { normalizeGymMeetEventData } from "./normalizeGymMeetEventData";

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
  assert.equal(findSection(discovery, "registration"), undefined);
  assert.ok(findSection(discovery, "coaches"));
  assert.ok(findSection(discovery, "traffic-parking"));
  assert.equal(findSection(discovery, "results"), undefined);
  assert.equal(findSection(discovery, "documents"), undefined);
  assert.equal(findSection(discovery, "hotels"), undefined);
  assert.match(JSON.stringify(findSection(discovery, "meet-details")), /Live scoring available online/);
  assert.match(JSON.stringify(findSection(discovery, "coaches")), /Athlete Entry Fee|MeetMaker/);
  assert.match(JSON.stringify(findSection(discovery, "traffic-parking")), /Host Hotel/);
});

test("payment instructions do not leak into the hero header", () => {
  const model = normalizeGymMeetEventData({
    eventData: {
      createdVia: "meet-discovery",
      title: "38th Annual Gasparilla Classic",
      hostGym: "PAYMENT: Check: Make Payable to Lightning City Gymnastics",
      details:
        "PAYMENT: Check: Make Payable to Lightning City Gymnastics, 1284 NW 87th Ct. Rd, Ocala, FL",
    },
    eventTitle: "38th Annual Gasparilla Classic",
    navItems: [],
    rosterAthletes: [],
  });

  assert.equal(model.hostGym, "");
  assert.equal(model.detailsText, "");
});

test("schedule section renders between coaches and venue details when populated", () => {
  const discovery = buildGymMeetDiscoveryContent({
    eventData: {
      discoverySource: {
        parseResult: {
          admission: [{ label: "Adults", price: "$20", note: "" }],
          contacts: [{ role: "Meet Director", email: "director@example.com" }],
          links: [],
        },
        extractionMeta: {},
        extractedText: "",
      },
    },
    customFields: { admission: "Adults: $20" },
    advancedSections: {
      meet: {},
      logistics: { gymLayoutLabel: "Assigned gym location: Hall B" },
      coaches: { enabled: true, signIn: "Sign in at the scoring table." },
      schedule: {
        enabled: true,
        venueLabel: "Greater Fort Lauderdale / Broward County Convention Center",
        supportEmail: "director@example.com",
        days: [
          {
            id: "fri",
            date: "Friday, March 13, 2026",
            shortDate: "Friday • Mar 13",
            sessions: [
              {
                id: "fri-1",
                code: "FR1",
                label: "Session FR1",
                group: "Bronze",
                startTime: "8:00 AM",
                clubs: [
                  { id: "club-1", name: "Browns Gym", teamAwardEligible: true },
                  { id: "club-2", name: "Twisters Canada", teamAwardEligible: false },
                ],
              },
            ],
          },
        ],
      },
    },
    venue: "Coral Springs Gymnasium",
    address: "123 Main St, Coral Springs, FL 33065",
  });

  const schedule = findSection(discovery, "schedule");
  const orderedIds = discovery.sections.map((section: any) => section.id);

  assert.ok(schedule);
  assert.ok(findBlock(schedule, "schedule-board"));
  assert.equal(schedule?.hideSectionHeading, true);
  assert.deepEqual(
    orderedIds.filter((id: string) =>
      ["admission", "coaches", "schedule", "venue-details"].includes(id)
    ),
    ["admission", "coaches", "schedule", "venue-details"]
  );
});

test("schedule section stays hidden when no usable schedule sessions exist", () => {
  const discovery = buildGymMeetDiscoveryContent({
    eventData: {
      discoverySource: {
        parseResult: { links: [] },
        extractionMeta: {},
        extractedText: "",
      },
    },
    customFields: {},
    advancedSections: {
      meet: {},
      logistics: { gymLayoutLabel: "Assigned gym location: Hall B" },
      coaches: {},
      schedule: {
        enabled: true,
        days: [{ id: "fri", date: "Friday, March 13, 2026", shortDate: "Friday • Mar 13", sessions: [] }],
      },
    },
    venue: "Coral Springs Gymnasium",
    address: "123 Main St, Coral Springs, FL 33065",
  });

  assert.equal(findSection(discovery, "schedule"), undefined);
});

test("schedule section renders when only session codes are present", () => {
  const discovery = buildGymMeetDiscoveryContent({
    eventData: {
      discoverySource: {
        parseResult: { links: [] },
        extractionMeta: {},
        extractedText: "",
      },
    },
    customFields: {},
    advancedSections: {
      meet: {},
      logistics: {},
      coaches: {},
      schedule: {
        enabled: true,
        days: [
          {
            id: "fri",
            date: "Friday, March 13, 2026",
            shortDate: "Friday • Mar 13",
            sessions: [{ id: "fri-1", code: "FR1", clubs: [] }],
          },
        ],
      },
    },
    venue: "Coral Springs Gymnasium",
    address: "123 Main St, Coral Springs, FL 33065",
  });

  assert.ok(findSection(discovery, "schedule"));
});

test("resource links drive documents, hotels, and results without rewriting event-specific rotation links", () => {
  const discovery = buildGymMeetDiscoveryContent({
    eventData: {
      discoverySource: {
        parseResult: {
          meetDetails: {
            rotationSheetsInfo: "Rotation sheets will be posted online before the event.",
          },
          coachInfo: {
            signIn: "Coaches sign in at the scoring table.",
            links: [
              {
                label: "Rotation Sheets Portal",
                url: "https://legacy.example.com/rotation-sheets",
              },
            ],
          },
          links: [
            {
              label: "Master Rotation Sheet",
              url: "https://old.example.com/master-rotation-sheet",
            },
            { label: "Official Results", url: "https://example.com/results" },
            { label: "Purchase Admission Here", url: "https://tickets.example.com/admission" },
            { label: "Parking Map", url: "https://example.com/parking-map" },
          ],
        },
        extractionMeta: {
          resourceLinks: [
            {
              kind: "rotation_sheet",
              status: "available",
              label: "Event Rotation Sheet",
              url: "https://usacompetitions.com/docs/event-rotation-sheet.pdf",
            },
            {
              kind: "results_live",
              status: "available",
              label: "Live Scoring",
              url: "https://results.scorecatonline.com/state-2026",
            },
            {
              kind: "packet",
              status: "available",
              label: "State Packet",
              url: "https://usacompetitions.com/docs/state-packet.pdf",
            },
            {
              kind: "hotel_booking",
              status: "available",
              label: "Host Hotel Booking",
              url: "https://api.groupbook.io/booking/state-host-hotel",
            },
            {
              kind: "photo_video",
              status: "available",
              label: "Photo / Video Order Form",
              url: "https://form.jotform.com/state-photo-video",
            },
          ],
        },
        extractedText: "",
      },
    },
    customFields: {},
    advancedSections: {
      meet: {
        rotationSheetsInfo: "Rotation sheets will be posted online before the event.",
        scoresLink: "https://results.scorecatonline.com/state-2026",
      },
      coaches: {
        enabled: true,
      },
      logistics: {
        hotelInfo: "Book nearby rooms early.",
        parkingLinks: [{ label: "Parking Map", url: "https://example.com/parking-map" }],
      },
    },
    venue: "State Arena",
    address: "123 Main St, Chicago, IL 60601",
  });

  const _documents = findSection(discovery, "documents");
  const coaches = findSection(discovery, "coaches");
  const _admission = findSection(discovery, "admission");
  const trafficParking = findSection(discovery, "traffic-parking");
  const allContent = JSON.stringify(discovery.sections);

  assert.ok(findSection(discovery, "meet-details"));
  assert.ok(coaches);
  assert.ok(trafficParking);
  assert.match(allContent, /https:\/\/usacompetitions\.com\/docs\/event-rotation-sheet\.pdf/i);
  assert.match(allContent, /https:\/\/usacompetitions\.com\/docs\/state-packet\.pdf/i);
  assert.match(allContent, /https:\/\/api\.groupbook\.io\/booking\/state-host-hotel/i);
  assert.match(allContent, /https:\/\/tickets\.example\.com\/admission/i);
  assert.match(JSON.stringify(trafficParking), /https:\/\/example\.com\/parking-map/i);
  assert.match(allContent, /https:\/\/results\.scorecatonline\.com\/state-2026/i);
  assert.doesNotMatch(allContent, /https:\/\/usacompetitions\.com\/rotation-sheets\//i);
});

test("rotation hub with not_posted shows neutral status instead of a wrong PDF", () => {
  const discovery = buildGymMeetDiscoveryContent({
    eventData: {
      discoverySource: {
        parseResult: {
          meetDetails: {
            rotationSheetsInfo: "Rotation sheets will be posted online before the event.",
          },
          links: [
            {
              label: "Wrong Rotation PDF",
              url: "https://legacy.example.com/wrong-rotation.pdf",
            },
          ],
        },
        extractionMeta: {
          resourceLinks: [
            {
              kind: "rotation_hub",
              status: "not_posted",
              label: "Rotation Sheets",
              url: "https://usacompetitions.com/rotation-sheets/",
            },
          ],
        },
        extractedText: "",
      },
    },
    customFields: {},
    advancedSections: {
      meet: {
        rotationSheetsInfo: "Rotation sheets will be posted online before the event.",
      },
      logistics: {},
      coaches: {},
    },
    venue: "State Arena",
    address: "123 Main St, Chicago, IL 60601",
  });

  const allContent = JSON.stringify(discovery.sections);

  assert.match(allContent, /Not yet posted/i);
  assert.match(allContent, /https:\/\/usacompetitions\.com\/rotation-sheets\//i);
  assert.doesNotMatch(allContent, /https:\/\/legacy\.example\.com\/wrong-rotation\.pdf/i);
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

test("normalizeGymMeetEventData strips discovery-generated description text", () => {
  const model = normalizeGymMeetEventData({
    eventData: {
      createdVia: "meet-discovery",
      details: [
        "March 13-15, 2026",
        "On-site Adult (Ages 12+): $26: Debit/credit card only; cash not accepted.",
        "Arrival guidance: Arrive 30 minutes early.",
        "Parents should bring a refillable water bottle.",
      ].join("\n"),
      advancedSections: {
        meet: {
          arrivalGuidance: "Arrive 30 minutes early.",
        },
      },
    },
    eventTitle: "Florida Crown Championships",
    navItems: [],
    rosterAthletes: [],
  });

  assert.equal(model.detailsText, "Parents should bring a refillable water bottle.");
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

test("coach deadline cards render month day year instead of raw ISO dates", () => {
  const discovery = buildGymMeetDiscoveryContent({
    eventData: {
      discoverySource: {
        parseResult: {
          coachInfo: {
            deadlines: [
              { label: "Entry deadline", date: "2026-03-01" },
              { label: "Scratch deadline", date: "2026-03-05" },
            ],
          },
        },
        extractionMeta: {},
        extractedText: "",
      },
    },
    customFields: {},
    advancedSections: {
      meet: {},
      logistics: {},
      coaches: {
        enabled: true,
        deadlines: [
          { label: "Entry deadline", date: "2026-03-01" },
          { label: "Scratch deadline", date: "2026-03-05" },
        ],
      },
    },
    venue: "Coral Springs Gymnasium",
    address: "2501 Coral Springs Drive, Coral Springs, FL 33065",
  });

  const coaches = findSection(discovery, "coaches");
  const registrationBlock = (coaches?.blocks || []).find(
    (block: any) => block.id === "registration-cards"
  );
  const values = (registrationBlock?.cards || []).map((card: any) => card.value);

  assert.ok(values.includes("Mar 1, 2026"));
  assert.ok(values.includes("Mar 5, 2026"));
  assert.ok(!values.includes("2026-03-01"));
  assert.ok(!values.includes("2026-03-05"));
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

test("venue details stay venue-only and absorb the venue map blocks", () => {
  const discovery = buildGymMeetDiscoveryContent({
    eventData: {
      discoverySource: {
        parseResult: {
          meetDetails: {
            arrivalGuidance: "Sessions can begin up to 30 minutes early.",
            registrationInfo: "Athletes check in at registration before entering the competition area.",
            rotationSheetsInfo:
              "Rotation sheets will be posted online the week before the event and a copy will be available at the floor music table each session.",
            awardsInfo:
              "Awards ceremonies take place immediately following every session.",
          },
          gear: {
            uniform:
              "Coral Springs Gymnasium: The temperature inside the venue is chilly and beyond our control. Please come prepared.",
            checklist: [
              "Admission tickets purchased in advance to avoid price increase and expedite check-in.",
              "Athlete card for recording scores after competition.",
            ],
          },
          unmappedFacts: [
            {
              category: "venue_detail",
              detail:
                "Coral Springs Gymnasium: The temperature inside the venue is chilly and beyond our control. Please come prepared.",
            },
          ],
          links: [{ label: "Admission", url: "https://tickets.example.com/admission" }],
        },
        extractionMeta: {
          gymLayoutImageDataUrl: "data:image/png;base64,abc123",
        },
        extractedText: [
          "-- 1 of 6 --",
          "Arrival Guidance: Sessions can begin up to 30 minutes early.",
          "Registration: Athletes check in at registration before entering the competition area.",
          "Rotation Sheets will be posted online the week before the event.",
          "-- 2 of 6 --",
          "Session FR A",
          "360 Gymnastics FL 360 Gymnastics FL 360 Gymnastics FL Alpha Gymnastics Christi's Gymnastics",
          "Twisters Canada Top Gymnastics FL Top Gymnastics FL ZGA",
          "-- 3 of 6 --",
          "Meet Site: Coral Springs Gymnasium",
          "Coral Springs Gymnasium phone numbers are 954-345-2201 and 954-345-2107.",
          "On-Site Admission Prices",
          "On-site admission is credit/debit card only; cash is not accepted.",
          "Coral Springs Gymnasium: The temperature inside the venue is chilly and beyond our control. Please come prepared.",
          "-- 4 of 6 --",
          "Visit Lauderdale is a sponsor and encourages visitors to tag #VisitLauderdale.",
        ].join("\n"),
      },
    },
    customFields: {},
    advancedSections: {
      meet: {
        assignedGym: "Gym B",
      },
      logistics: {
        gymLayoutLabel: "Assigned gym location: Gym B",
      },
      coaches: {},
      gear: {},
    },
    venue: "Coral Springs Gymnasium",
    address: "123 Main St, Coral Springs, FL 33065",
  });

  const meetDetails = findSection(discovery, "meet-details");
  const admission = findSection(discovery, "admission");
  const venueDetails = findSection(discovery, "venue-details");
  const venueMap = findSection(discovery, "venue-map");
  const trafficParking = findSection(discovery, "traffic-parking");
  const meetOverviewBlock = findBlock(meetDetails, "meet-overview-cards");
  const gearBlock = findBlock(meetDetails, "gear");
  const venueImageBlock = findBlock(venueDetails, "gym-layout-image");
  const venueMapBlock = findBlock(venueDetails, "venue-map-address");
  const allContent = JSON.stringify(discovery.sections);

  assert.ok(meetDetails);
  assert.ok(admission);
  assert.ok(venueDetails);
  assert.equal(trafficParking, undefined);
  assert.equal(venueMap, undefined);
  assert.equal(meetOverviewBlock?.title, undefined);
  assert.equal(gearBlock, undefined);
  assert.ok(venueImageBlock);
  assert.equal(venueMapBlock, undefined);
  assert.match(JSON.stringify(admission), /Admission tickets purchased in advance/i);
  assert.match(JSON.stringify(admission), /credit\/debit card only; cash is not accepted/i);
  assert.match(JSON.stringify(meetDetails), /Athlete card for recording scores after competition/i);
  assert.match(JSON.stringify(venueDetails), /Coral Springs Gymnasium phone numbers are 954-345-2201 and 954-345-2107/i);
  assert.match(JSON.stringify(venueDetails), /"label":"Assigned Gym","value":"Gym B"/i);
  assert.match(JSON.stringify(venueDetails), /"title":"Venue Map"/i);
  assert.doesNotMatch(JSON.stringify(venueDetails), /Athletes check in at registration/i);
  assert.doesNotMatch(JSON.stringify(venueDetails), /temperature inside the venue is chilly/i);
  assert.doesNotMatch(JSON.stringify(venueDetails), /Twisters Canada|Top Gymnastics FL|ZGA/i);
  assert.doesNotMatch(allContent, /360 Gymnastics FL|Alpha Gymnastics|Christi's Gymnastics/i);
  assert.doesNotMatch(allContent, /Twisters Canada|Top Gymnastics FL|ZGA/i);
  assert.doesNotMatch(allContent, /Visit Lauderdale is a sponsor/i);
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
  assert.doesNotMatch(JSON.stringify(meetDetails), /"label":"Announcement"/i);
  assert.doesNotMatch(JSON.stringify(meetDetails), /2026-03-10T1[23]:00:00\.000Z/i);
});

test("club_participation announcement fragments are suppressed", () => {
  const discovery = buildGymMeetDiscoveryContent({
    eventData: {
      discoverySource: {
        parseResult: {
          communications: {
            announcements: [
              {
                title: "club_participation",
                body: "club_participation 360 Gymnastics FL Alpha Gymnastics Christi's Gymnastics.",
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
      announcements: {
        announcements: [
          {
            id: "announcement-1",
            text: "club_participation 360 Gymnastics FL Alpha Gymnastics Christi's Gymnastics.",
            priority: "normal",
          },
        ],
      },
    },
    venue: "State Arena",
    address: "123 Main St, Chicago, IL 60601",
  });

  assert.doesNotMatch(JSON.stringify(discovery.sections), /club_participation|360 Gymnastics FL|Alpha Gymnastics|Christi's Gymnastics/i);
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
