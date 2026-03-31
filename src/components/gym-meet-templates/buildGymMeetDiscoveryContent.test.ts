import assert from "node:assert/strict";
import test from "node:test";

import { buildGymMeetDiscoveryContent } from "./buildGymMeetDiscoveryContent";
import { normalizeGymMeetEventData } from "./normalizeGymMeetEventData";

const findSection = (discovery: any, id: string) =>
  discovery.sections.find((section: any) => section.id === id);
const findBlock = (section: any, id: string) =>
  (section?.blocks || []).find((block: any) => block.id === id);

function withScheduleGridsEnabled<T>(fn: () => T): T {
  const prev = process.env.GYM_DISCOVERY_SCHEDULE_GRID_ENABLED;
  process.env.GYM_DISCOVERY_SCHEDULE_GRID_ENABLED = "1";
  try {
    return fn();
  } finally {
    if (prev === undefined) {
      delete process.env.GYM_DISCOVERY_SCHEDULE_GRID_ENABLED;
    } else {
      process.env.GYM_DISCOVERY_SCHEDULE_GRID_ENABLED = prev;
    }
  }
}

test("USAG packet cover prose yields a meet-details section (not only admission)", () => {
  const discovery = buildGymMeetDiscoveryContent({
    eventData: {
      discoverySource: {
        parseResult: {},
        extractedText: [
          "Team Twisters & USA Competitions is proud to host the 2026 Florida USA Gymnastics Xcel Bronze, Silver & Gold State Championships.",
          "Awards Ceremonies: Individual and All Around awards will take place immediately following the end of each session.",
          "USA Gymnastics Membership",
          "• Coaches: If you did not register attendance via Meet Reservations, you will not be listed on the sanction's official sign-in sheet.",
          "-- 1 of 5 --",
          "Session R01 BRONZE",
          "Session R02 BRONZE",
          "Session R03 BRONZE",
          "Session R04 BRONZE",
        ].join("\n"),
      },
    },
    customFields: {},
    advancedSections: {},
    date: "2026-04-10",
  });
  const meet = findSection(discovery, "meet-details");
  assert.ok(meet?.hasContent, "expected meet-details tab content from narrative packet lines");
  const linesBlock = findBlock(meet, "meet-lines");
  assert.ok(linesBlock?.lines?.length, "expected meet-lines from cover letter + coach membership prose");
});

test("preamble before the first -- N of M -- PDF marker is included in routable extracted text", () => {
  const discovery = buildGymMeetDiscoveryContent({
    eventData: {
      discoverySource: {
        parseResult: {},
        extractedText: [
          "Team Twisters hosts the 2026 State Championships.",
          "Spectator Admissions: Adults (13+): $26.00, Children (5-12): $16.00.",
          "Awards ceremonies follow each session.",
          "-- 1 of 5 --",
          "Session R01 BRONZE",
          "Session R02 BRONZE",
          "Session R03 BRONZE",
          "Session R04 BRONZE",
        ].join("\n"),
      },
    },
    customFields: {},
    advancedSections: {},
    date: "2026-04-10",
  });

  const blob = JSON.stringify(discovery);
  assert.match(blob, /\$26\.00/i, "preamble with pricing must survive page splitting (real PDFs put cover letter before page 1 marker)");
});

test("meet-details is not a ghost tab when only results links exist (communication cards live on results section)", () => {
  const discovery = buildGymMeetDiscoveryContent({
    eventData: {
      discoverySource: {
        parseResult: {
          links: [
            { label: "Host Hotels", url: "https://example.com/hotels" },
            { label: "USA Competitions results", url: "https://usacompetitions.net/event/123" },
          ],
        },
        extractedText: "",
      },
    },
    customFields: {},
    advancedSections: {},
    date: "2026-03-20",
  });

  assert.equal(
    findSection(discovery, "meet-details"),
    undefined,
    "meet-details must not claim hasContent from communicationCards; those blocks are only on results"
  );
  const results = findSection(discovery, "results");
  assert.ok(results?.hasContent);
  assert.ok(findBlock(results, "results-cards"));
});

test("traffic-parking stays visible with map-only content when address is set and logistics parking fields are empty", () => {
  const discovery = buildGymMeetDiscoveryContent({
    eventData: {
      discoverySource: {
        parseResult: {
          logistics: {},
        },
        extractedText: "",
      },
    },
    customFields: {},
    advancedSections: {
      logistics: {},
    },
    date: "2026-03-20",
    venue: "State Arena",
    address: "123 Main St, Chicago, IL 60601",
  });

  const traffic = findSection(discovery, "traffic-parking");
  assert.ok(traffic, "expected traffic-parking section");
  assert.equal(traffic.hasContent, true);
  const mapBlock = findBlock(traffic, "parking-map");
  assert.ok(mapBlock, "expected parking-map block");
  assert.equal(mapBlock.type, "map");
  assert.equal(mapBlock.address, "123 Main St, Chicago, IL 60601");
});

test("mixed packet content keeps rich operational sections separate while preserving results", () => {
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
  assert.equal(findSection(discovery, "coaches"), undefined);
  assert.ok(findSection(discovery, "traffic-parking"));
  assert.ok(findSection(discovery, "results"));
  const documentsSection = findSection(discovery, "documents");
  assert.equal(documentsSection, undefined);
  assert.equal(findSection(discovery, "hotels"), undefined);
  assert.match(JSON.stringify(findSection(discovery, "results")), /Live scoring available online/);
  assert.doesNotMatch(JSON.stringify(findSection(discovery, "traffic-parking")), /Host Hotel|MeetMaker/i);
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

test("discovery hero summary excludes arrival guidance cards", () => {
  const model = normalizeGymMeetEventData({
    eventData: {
      createdVia: "meet-discovery",
      eventTitle: "Florida Crown",
      advancedSections: {
        meet: {
          doorsOpen: "7:15 AM",
          arrivalGuidance: "Use the north entrance and arrive 30 minutes early.",
          resultsInfo: "Live scoring available online.",
        },
      },
      discoverySource: {
        parseResult: {},
      },
    },
    eventTitle: "Florida Crown",
    navItems: [],
    rosterAthletes: [],
  });

  assert.deepEqual(
    model.summaryItems.map((item) => item.label),
    ["Doors Open"]
  );
});

test("normalizeGymMeetEventData passes unstripped details into discovery for Meet Details prose", () => {
  const model = normalizeGymMeetEventData({
    eventData: {
      createdVia: "meet-discovery",
      eventTitle: "Florida Crown",
      details:
        "Doors open: 7:15 AM\nArrival guidance: Allow 30 minutes for parking.\nSpectator Admission: Adult $20",
      venue: "Coral Springs Gymnasium",
      address: "123 Main St, Coral Springs, FL",
    },
    eventTitle: "Florida Crown",
    navItems: [],
    rosterAthletes: [],
  });

  assert.equal(model.detailsText, "");
  const meet = findSection(model.discovery, "meet-details");
  assert.ok(meet);
  assert.match(JSON.stringify(meet), /7:15\s*AM/i);
  assert.match(JSON.stringify(meet), /30 minutes for parking/i);
});

test("detailsTextForDiscovery alone can populate doors open when hero detailsText is empty", () => {
  const discovery = buildGymMeetDiscoveryContent({
    eventData: {
      discoverySource: {
        parseResult: {},
        extractionMeta: {},
        extractedText: "",
      },
    },
    customFields: {},
    advancedSections: { meet: {}, logistics: {}, coaches: {} },
    venue: "Arena",
    address: "1 Main St",
    detailsText: "",
    detailsTextForDiscovery: "Doors open: 7:15 AM\nGuest services is in the east hall.",
  });
  const meet = findSection(discovery, "meet-details");
  assert.ok(meet);
  assert.match(JSON.stringify(meet), /7:15\s*AM/i);
});

test("schedule and session assignments render ahead of venue details when populated", () => {
  const discovery = withScheduleGridsEnabled(() =>
    buildGymMeetDiscoveryContent({
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
          assignments: [
            {
              id: "assign-1",
              level: "Level 9",
              groupLabel: "Group 1",
              birthDateRange: "7/3/2010 — 10/27/2011",
              sessionCode: "SU2",
            },
          ],
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
    })
  );

  const schedule = findSection(discovery, "schedule");
  const assignments = findSection(discovery, "session-assignments");
  const orderedIds = discovery.sections.map((section: any) => section.id);

  assert.ok(schedule);
  assert.ok(assignments);
  assert.ok(findBlock(schedule, "schedule-board"));
  assert.ok(findBlock(assignments, "session-assignment-cards"));
  assert.equal(schedule?.hideSectionHeading, true);
  assert.deepEqual(
    orderedIds.filter((id: string) =>
      ["admission", "coaches", "schedule", "session-assignments", "venue-details"].includes(id)
    ),
    ["schedule", "session-assignments", "admission", "coaches", "venue-details"]
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
  const discovery = withScheduleGridsEnabled(() =>
    buildGymMeetDiscoveryContent({
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
    })
  );

  assert.ok(findSection(discovery, "schedule"));
});

test("resource links route only approved public links into hotels and results", () => {
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
            {
              kind: "apparel_form",
              status: "available",
              label: "Apparel Sizing Form",
              url: "https://forms.office.com/state-apparel-sizing",
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

  const resources = findSection(discovery, "documents");
  const coaches = findSection(discovery, "coaches");
  const _admission = findSection(discovery, "admission");
  const trafficParking = findSection(discovery, "traffic-parking");
  const hotels = findSection(discovery, "hotels");
  const results = findSection(discovery, "results");
  const allContent = JSON.stringify(discovery.sections);

  assert.ok(findSection(discovery, "meet-details"));
  assert.ok(resources);
  assert.equal(coaches, undefined);
  assert.ok(trafficParking);
  assert.ok(hotels);
  assert.ok(results);
  assert.match(JSON.stringify(resources), /https:\/\/form\.jotform\.com\/state-photo-video/i);
  assert.match(JSON.stringify(resources), /https:\/\/forms\.office\.com\/state-apparel-sizing/i);
  assert.match(JSON.stringify(hotels), /https:\/\/api\.groupbook\.io\/booking\/state-host-hotel/i);
  assert.match(JSON.stringify(results), /https:\/\/results\.scorecatonline\.com\/state-2026/i);
  assert.doesNotMatch(JSON.stringify(trafficParking), /https:\/\/example\.com\/parking-map/i);
  assert.doesNotMatch(allContent, /https:\/\/usacompetitions\.com\/docs\/event-rotation-sheet\.pdf/i);
  assert.doesNotMatch(allContent, /https:\/\/usacompetitions\.com\/docs\/state-packet\.pdf/i);
  assert.doesNotMatch(allContent, /https:\/\/usacompetitions\.com\/rotation-sheets\//i);
});

test("session assignment verification notes stay in their own section", () => {
  const discovery = withScheduleGridsEnabled(() =>
    buildGymMeetDiscoveryContent({
      eventData: {
        discoverySource: {
          parseResult: {
            links: [],
          },
          extractionMeta: {},
          extractedText: [
            "Session assignments are listed on club rosters, posted at usacompetitions.com",
            "***If there is an incorrect session assignment listed on your roster, email info@usacompetitions.com ASAP***",
          ].join("\n"),
        },
      },
      customFields: {},
      advancedSections: {
        meet: {},
        logistics: {},
        coaches: {},
        schedule: {
          enabled: true,
          assignments: [
            {
              id: "assign-1",
              level: "XCEL GOLD",
              groupLabel: "Group 1",
              birthDateRange: "9/30/2017 — Younger",
              sessionCode: "B1",
            },
          ],
          days: [],
        },
      },
      venue: "State Arena",
      address: "123 Main St, Chicago, IL 60601",
    })
  );

  const assignments = findSection(discovery, "session-assignments");

  assert.ok(assignments);
  assert.match(JSON.stringify(assignments), /Group 1/);
  assert.match(JSON.stringify(assignments), /incorrect session assignment/i);
  assert.equal(findSection(discovery, "documents")?.label, undefined);
});

test("schedule and session assignments stay hidden when GYM_DISCOVERY_SCHEDULE_GRID_ENABLED is unset", () => {
  const prev = process.env.GYM_DISCOVERY_SCHEDULE_GRID_ENABLED;
  delete process.env.GYM_DISCOVERY_SCHEDULE_GRID_ENABLED;
  try {
    const discovery = buildGymMeetDiscoveryContent({
      eventData: {
        discoverySource: {
          parseResult: { links: [] },
          extractionMeta: {},
          extractedText:
            "Session assignments are listed on club rosters. Incorrect session assignment email info@example.com",
        },
      },
      customFields: {},
      advancedSections: {
        meet: {},
        logistics: {},
        coaches: {},
        schedule: {
          enabled: true,
          assignments: [
            {
              id: "assign-1",
              level: "Level 4",
              groupLabel: "Group 1",
              sessionCode: "B1",
            },
          ],
          days: [
            {
              id: "fri",
              date: "Friday, March 13, 2026",
              shortDate: "Friday • Mar 13",
              sessions: [
                {
                  id: "fri-1",
                  code: "FR1",
                  group: "Gold",
                  startTime: "8:00 AM",
                  clubs: [{ id: "c1", name: "Test Gym" }],
                },
              ],
            },
          ],
        },
      },
      venue: "Arena",
      address: "1 Main St",
    });
    assert.equal(findSection(discovery, "schedule"), undefined);
    assert.equal(findSection(discovery, "session-assignments"), undefined);
  } finally {
    if (prev === undefined) {
      delete process.env.GYM_DISCOVERY_SCHEDULE_GRID_ENABLED;
    } else {
      process.env.GYM_DISCOVERY_SCHEDULE_GRID_ENABLED = prev;
    }
  }
});

test("parking resource links render under Traffic and Parking without a Resources tab", () => {
  const discovery = buildGymMeetDiscoveryContent({
    eventData: {
      discoverySource: {
        parseResult: { links: [] },
        extractionMeta: {
          resourceLinks: [
            {
              kind: "parking",
              status: "posted",
              label: "Parking lots and garages map",
              url: "https://maps.example.com/parking",
            },
            {
              kind: "parking",
              status: "posted",
              label: "Pay by phone parking",
              url: "https://park.example.com/pay",
            },
          ],
        },
        extractedText: "",
      },
    },
    customFields: {},
    advancedSections: {
      meet: {},
      logistics: {},
      coaches: {},
    },
    venue: "Convention Center",
    address: "100 Center Dr",
  });

  const traffic = findSection(discovery, "traffic-parking");
  assert.ok(traffic);
  assert.match(JSON.stringify(traffic), /maps\.example\.com\/parking/i);
  assert.equal(findSection(discovery, "documents"), undefined);
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

test("lightweight results stay in the results section without leaking into admission", () => {
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
  const admission = findSection(discovery, "admission");

  assert.ok(results);
  assert.equal(
    findSection(discovery, "meet-details"),
    undefined,
    "results copy and links belong on the results section, not an empty meet-details shell"
  );
  assert.match(JSON.stringify(results), /Live scoring available online/);
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

test("normalizeGymMeetEventData strips packet intro boilerplate from discovery details", () => {
  const model = normalizeGymMeetEventData({
    eventData: {
      createdVia: "meet-discovery",
      details: [
        "Team Twisters & USA Competitions is proud to host the 2026 Florida USA Gymnastics Xcel Bronze, Silver & Gold State Championships. Please review the following items enclosed in this packet:",
        "Parents should bring a refillable water bottle.",
      ].join("\n"),
    },
    eventTitle: "2026 Florida USA Gymnastics Xcel Bronze, Silver & Gold State Championships",
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

  assert.ok(results);
  assert.ok(meetDetails);
  assert.match(JSON.stringify(results), /Results 1|Results 2|Results 3/);
  assert.match(JSON.stringify(results), /results\/1|results\/2|results\/3/);
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
  const results = findSection(discovery, "results");
  const admissionCopy = JSON.stringify(
    (admission?.blocks || []).filter((block: any) => block.type !== "link-list")
  );
  const resultsCopy = JSON.stringify(
    (results?.blocks || [])
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
  assert.ok(results);
  assert.doesNotMatch(JSON.stringify(results), /Spectator pre-sale available now/i);
  assert.doesNotMatch(admissionCopy, /USACompetitions\.com/i);
  assert.doesNotMatch(resultsCopy, /USACompetitions\.com/i);
});

test("normalized logistics policies, hotel notes, and bare-domain results links render in dedicated sections", () => {
  const discovery = buildGymMeetDiscoveryContent({
    eventData: {
      discoverySource: {
        parseResult: {
          meetDetails: {
            resultsInfo: "Live scoring available at USACompetitions.com.",
          },
          logistics: {
            hotel: "Book rooms at GroupBook.com/state-host-hotel.",
          },
        },
        extractionMeta: {},
        extractedText: "",
      },
    },
    customFields: {},
    advancedSections: {
      meet: {
        resultsInfo: "Live scoring available at USACompetitions.com.",
      },
      logistics: {
        hotelInfo: "Book rooms at GroupBook.com/state-host-hotel.",
        policyFood: "Outside food is not permitted in the competition hall.",
        policyHydration: "Bring a refillable water bottle.",
        policyAnimals: "Only trained service animals are permitted.",
        policySafety: "No throwing objects in spectator seating.",
      },
      coaches: {},
    },
    venue: "Coral Springs Gymnasium",
    address: "123 Main St, Coral Springs, FL 33065",
  });

  const results = findSection(discovery, "results");
  const hotels = findSection(discovery, "hotels");
  const safety = findSection(discovery, "safety-policy");

  assert.ok(results);
  assert.match(JSON.stringify(results), /Live scoring available/i);
  assert.match(JSON.stringify(results), /https:\/\/usacompetitions\.com\//i);
  assert.ok(hotels);
  assert.match(JSON.stringify(hotels), /Book rooms/i);
  assert.match(JSON.stringify(hotels), /https:\/\/groupbook\.com\/state-host-hotel/i);
  assert.ok(safety);
  assert.match(JSON.stringify(safety), /Outside food is not permitted|Bring a refillable water bottle|service animals|throwing objects/i);
});

test("normalized operational-note noise stays out of meet details and coach notes", () => {
  const discovery = buildGymMeetDiscoveryContent({
    eventData: {
      discoverySource: {
        parseResult: {
          meetDetails: {
            operationalNotes: [
              "Gym A\tGym B",
              "B1\tW04",
              "8:00 AM\t12:30 PM",
            ],
          },
          coachInfo: {
            notes: ["Coaches sign in at the registration table."],
          },
        },
        extractionMeta: {},
        extractedText: "",
      },
    },
    customFields: {},
    advancedSections: {
      meet: {
        operationalNotes: [
          "Gym A\tGym B",
          "B1\tW04",
          "8:00 AM\t12:30 PM",
        ],
      },
      logistics: {},
      coaches: {
        enabled: true,
        notes: ["Coaches sign in at the registration table."],
      },
    },
    venue: "Coral Springs Gymnasium",
    address: "123 Main St, Coral Springs, FL 33065",
  });

  const meetDetails = findSection(discovery, "meet-details");
  const coaches = findSection(discovery, "coaches");

  assert.doesNotMatch(JSON.stringify(meetDetails || {}), /Gym A|B1|W04|12:30 PM/);
  assert.match(JSON.stringify(coaches), /Coaches sign in at the registration table/i);
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
  const arrivalMapBlock = trafficParking ? findBlock(trafficParking, "parking-map") : null;
  const allContent = JSON.stringify(discovery.sections);

  assert.ok(meetDetails);
  assert.ok(admission);
  assert.ok(venueDetails);
  assert.ok(trafficParking);
  assert.equal(trafficParking.hasContent, true);
  assert.ok(arrivalMapBlock);
  assert.equal(arrivalMapBlock.type, "map");
  assert.equal(arrivalMapBlock.address, "123 Main St, Coral Springs, FL 33065");
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

test("public-page-v2 discovery renders attendee sections and suppresses schedule/coaches", () => {
  const discovery = buildGymMeetDiscoveryContent({
    eventData: {
      discoverySource: {
        pipelineVersion: "gym-public-v2",
        parseResult: {
          admission: [{ label: "Adults", price: "$20", note: "Cashless" }],
          meetDetails: {
            resultsInfo: "Live scoring is available online.",
          },
          logistics: {
            parkingLinks: [{ label: "Parking Map", url: "https://example.com/parking" }],
          },
          communications: {
            announcements: [{ title: "Arrival", body: "Arrive early for parking." }],
          },
          links: [{ label: "Packet", url: "https://example.com/packet.pdf" }],
        },
        publicPageSections: {
          meetDetails: {
            title: "Meet Details",
            body: "This page brings together the key venue, parking, and document details for the meet.",
            bullets: ["Doors open at 7:15 AM"],
            visibility: "visible",
          },
          venue: {
            title: "Venue Details",
            body: "Coral Springs Gymnasium, 123 Main St, Coral Springs, FL 33065.",
            bullets: [],
            visibility: "visible",
          },
          parking: {
            title: "Parking",
            body: "Parking details were not listed in the packet. Follow on-site signage.",
            bullets: [],
            visibility: "visible",
          },
          traffic: {
            title: "Traffic",
            body: "Allow extra arrival time near the venue before the event begins.",
            bullets: [],
            visibility: "visible",
          },
          spectatorInfo: {
            title: "Spectator Info",
            body: "Adults: $20. Cashless on site.",
            bullets: [],
            visibility: "visible",
          },
          travel: {
            title: "Travel",
            body: "Host hotels are posted on the event site.",
            bullets: [],
            visibility: "visible",
          },
          documents: {
            title: "Documents",
            links: [{ label: "Packet", url: "https://example.com/packet.pdf" }],
            visibility: "hidden",
            hideReason: "No public-safe documents survived filtering.",
          },
        },
      },
    },
    customFields: {},
    advancedSections: {
      meet: {},
      logistics: {},
      coaches: { enabled: true, signIn: "Legacy coach sign-in" },
      schedule: {
        enabled: true,
        days: [{ id: "fri", date: "Friday", shortDate: "Fri", sessions: [{ id: "s1", label: "S1", group: "Gold", startTime: "8:00 AM", clubs: [] }] }],
      },
    },
    venue: "Coral Springs Gymnasium",
    address: "123 Main St, Coral Springs, FL 33065",
  });

  assert.ok(findSection(discovery, "meet-details"));
  assert.ok(findSection(discovery, "traffic-parking"));
  assert.equal(findSection(discovery, "documents"), undefined);
  assert.equal(findSection(discovery, "announcements"), undefined);
  assert.equal(findSection(discovery, "schedule"), undefined);
  assert.equal(findSection(discovery, "coaches"), undefined);
  assert.match(JSON.stringify(findSection(discovery, "traffic-parking")), /Follow on-site signage|arrival time/i);
});

test("legacy gymnastics discovery without pipeline version still suppresses schedule/coaches", () => {
  const discovery = buildGymMeetDiscoveryContent({
    eventData: {
      createdVia: "meet-discovery",
      discoverySource: {
        workflow: "gymnastics",
        parseResult: {
          admission: [{ label: "Adults", price: "$20", note: "Cashless" }],
          meetDetails: {
            doorsOpen: "Doors open at 7:15 AM",
            arrivalGuidance: "Arrive early for parking.",
          },
          logistics: {
            parking: "Use the north garage.",
            trafficAlerts: "Expect delays before doors open.",
            hotel: "Host hotels are posted online.",
          },
          links: [{ label: "Packet", url: "https://example.com/packet.pdf" }],
        },
      },
      details:
        "This event page brings together venue guidance, parking, documents, and attendee updates.",
    },
    customFields: {},
    advancedSections: {
      meet: {},
      logistics: {},
      coaches: { enabled: true, signIn: "Legacy coach sign-in" },
      schedule: {
        enabled: true,
        days: [{ id: "fri", date: "Friday", shortDate: "Fri", sessions: [{ id: "s1", label: "S1", group: "Gold", startTime: "8:00 AM", clubs: [] }] }],
      },
    },
    venue: "Coral Springs Gymnasium",
    address: "123 Main St, Coral Springs, FL 33065",
  });

  assert.ok(findSection(discovery, "meet-details"));
  assert.ok(findSection(discovery, "traffic-parking"));
  assert.equal(findSection(discovery, "schedule"), undefined);
  assert.equal(findSection(discovery, "coaches"), undefined);
  assert.match(JSON.stringify(findSection(discovery, "meet-details")), /venue guidance|Doors open/i);
});

test("mixed public packet hides weak sections, merges admission variants, and limits quick access to approved links", () => {
  const eventData = {
    createdVia: "meet-discovery",
    eventTitle: "2026 Florida USA Gymnastics Xcel Bronze, Silver & Gold State Championships",
    venue: "Alachua County Sports & Events Center",
    address: "4870 Celebration Pointe Ave, Gainesville, FL 32608",
    discoverySource: {
      pipelineVersion: "gym-public-v2",
      parseResult: {
        admission: [
          { label: "Adults (13+)", price: "$26.00", note: "Cash Price is $1.00 less." },
          { label: "Children (5-12)", price: "$16.00", note: "Cash Price is $1.00 less." },
          { label: "Under 5", price: "Free", note: "" },
          { label: "Coach Hospitality", price: "Provided", note: "" },
        ],
        meetDetails: {
          doorsOpen: "Doors open at 7:15 AM.",
          arrivalGuidance:
            "Make sure athlete birth dates are correct in Meet Reservations before arrival.",
          awardsInfo: "Awards ceremonies follow each session.",
          registrationInfo: "Verify athlete session assignment before arrival.",
          resultsInfo: "Live scoring available at USACompetitions.com.",
        },
        logistics: {
          hotel: "Host hotels are available for traveling families.",
          parking: "",
          trafficAlerts: "",
        },
        communications: {
          announcements: [{ title: "Arrival", body: "Venue details are posted on the packet." }],
        },
      },
      extractionMeta: {
        resourceLinks: [
          {
            kind: "hotel_booking",
            status: "available",
            label: "Host Hotels",
            url: "https://example.com/hotels",
          },
          {
            kind: "results_hub",
            status: "available",
            label: "USACompetitions.com Results",
            url: "https://example.com/results",
          },
          {
            kind: "team_divisions",
            status: "available",
            label: "Session Assignments",
            url: "https://example.com/session-assignments",
          },
          {
            kind: "packet",
            status: "available",
            label: "Schedule & Info Packet",
            url: "https://example.com/info-packet.pdf",
          },
        ],
      },
      publicPageSections: {
        meetDetails: {
          title: "Meet Details",
          body: "Team Twisters and USA Competitions welcome families to the state championships. Awards ceremonies follow each session.",
          bullets: [],
          visibility: "visible",
        },
        parking: {
          title: "Parking",
          body: "Parking details were not listed in the packet. Plan to arrive early and follow on-site signage for spectator parking and drop-off.",
          bullets: [],
          visibility: "visible",
        },
        traffic: {
          title: "Traffic",
          body: "Allow extra arrival time near the venue before the event begins.",
          bullets: [],
          visibility: "visible",
        },
        venue: {
          title: "Venue Details",
          body: "Alachua County Sports & Events Center, 4870 Celebration Pointe Ave, Gainesville, FL 32608.",
          bullets: [
            "Alachua County Sports & Events Center",
            "4870 Celebration Pointe Ave, Gainesville, FL 32608",
          ],
          visibility: "visible",
        },
        spectatorInfo: {
          title: "Spectator Info",
          body: "Adults (13+): $26 card, $25 cash. Children (5-12): $16 card, $15 cash. Under 5: free.",
          bullets: [],
          visibility: "visible",
        },
        travel: {
          title: "Hotels & Travel",
          body: "Host hotels are available for traveling families.",
          bullets: [],
          visibility: "visible",
        },
        documents: {
          title: "Documents",
          links: [],
          visibility: "hidden",
          hideReason: "No public-safe documents survived filtering.",
        },
      },
    },
    customFields: {},
    advancedSections: { meet: {}, logistics: {}, coaches: {} },
  };

  const discovery = buildGymMeetDiscoveryContent({
    eventData,
    customFields: {},
    advancedSections: { meet: {}, logistics: {}, coaches: {} },
    venue: eventData.venue,
    address: eventData.address,
  });
  const admission = findSection(discovery, "admission");
  const hotels = findSection(discovery, "hotels");
  const results = findSection(discovery, "results");
  const traffic = findSection(discovery, "traffic-parking");

  const admissionCards = (findBlock(admission, "admission-cards")?.cards || []).map((card: any) => ({
    label: card.label,
    value: card.value,
    body: card.body,
  }));

  assert.deepEqual(admissionCards, [
    { label: "Adults (13+)", value: "Card $26", body: "Cash $25" },
    { label: "Children (5-12)", value: "Card $16", body: "Cash $15" },
    { label: "Under 5", value: "Free", body: "" },
  ]);
  assert.ok(findSection(discovery, "meet-details"));
  assert.ok(traffic);
  assert.ok(hotels);
  assert.ok(results);
  assert.equal(findSection(discovery, "documents"), undefined);
  assert.equal(findSection(discovery, "announcements"), undefined);
  assert.doesNotMatch(JSON.stringify(discovery), /session-assignments|info-packet\.pdf/i);
  assert.doesNotMatch(JSON.stringify(traffic), /https:\/\/example\.com\/session-assignments/i);
  assert.match(JSON.stringify(hotels), /https:\/\/example\.com\/hotels/i);
  assert.match(JSON.stringify(results), /https:\/\/example\.com\/results/i);
  const venue = findSection(discovery, "venue-details");
  assert.ok(venue);
  assert.equal(findBlock(venue, "venue-details-body"), undefined);
  assert.equal(findBlock(venue, "venue-details-bullets"), undefined);
  assert.ok(findBlock(venue, "venue-map"));

  const model = normalizeGymMeetEventData({
    eventData,
    eventTitle: eventData.eventTitle,
    navItems: [],
    rosterAthletes: [],
  });
  assert.ok(!model.summaryItems.some((item) => item.label === "Arrival"));
  assert.deepEqual(model.quickLinks, [
    { label: "Host Hotels", url: "https://example.com/hotels" },
    { label: "USACompetitions.com Results", url: "https://example.com/results" },
  ]);
});

test("admission discount notes do not overwrite actual prices or mark child tickets free", () => {
  const discovery = buildGymMeetDiscoveryContent({
    eventData: {
      createdVia: "meet-discovery",
      discoverySource: {
        pipelineVersion: "gym-public-v2",
        parseResult: {
          admission: [
            { label: "Adults (13+)", price: "$26.00", note: "Cash Price is $1.00 less." },
            { label: "Children (5-12)", price: "$16.00", note: "Cash Price is $1.00 less. Under 5 free." },
            { label: "Under 5", price: "Free", note: "" },
          ],
          meetDetails: {},
          logistics: {},
          communications: {},
        },
      },
    },
    customFields: {},
    advancedSections: { meet: {}, logistics: {}, coaches: {} },
  });

  const admission = findSection(discovery, "admission");
  const admissionCards = (findBlock(admission, "admission-cards")?.cards || []).map((card: any) => ({
    label: card.label,
    value: card.value,
    body: card.body,
  }));

  assert.deepEqual(admissionCards, [
    { label: "Adults (13+)", value: "Card $26", body: "Cash $25" },
    { label: "Children (5-12)", value: "Card $16", body: "Cash $15" },
    { label: "Under 5", value: "Free", body: "" },
  ]);
});

test("legacy discovery admission cards also preserve card prices over cash discounts", () => {
  const discovery = buildGymMeetDiscoveryContent({
    eventData: {
      createdVia: "meet-discovery",
      discoverySource: {
        parseResult: {
          admission: [
            { label: "Adults (13+)", price: "$26.00", note: "Cash Price is $1.00 less." },
            { label: "Children (5-12)", price: "$16.00", note: "Cash Price is $1.00 less." },
            { label: "Under 5", price: "Free", note: "" },
          ],
          meetDetails: {},
          logistics: {},
          communications: {},
        },
        extractedText: "",
      },
    },
    customFields: {},
    advancedSections: { meet: {}, logistics: {}, coaches: {} },
  });

  const admission = findSection(discovery, "admission");
  const admissionCards = (findBlock(admission, "admission-cards")?.cards || []).map((card: any) => ({
    label: card.label,
    value: card.value,
    body: card.body,
  }));

  assert.deepEqual(admissionCards, [
    { label: "Adults (13+)", value: "Card $26", body: "Cash $25" },
    { label: "Children (5-12)", value: "Card $16", body: "Cash $15" },
    { label: "Under 5", value: "Free", body: "" },
  ]);
});

test("legacy discovery recovers credit-card and cash pricing from source lines when parsed admission rows are malformed", () => {
  const discovery = buildGymMeetDiscoveryContent({
    eventData: {
      createdVia: "meet-discovery",
      discoverySource: {
        parseResult: {
          admission: [
            { label: "Adults (13+)", price: "$25", note: "Credit Card Price" },
            { label: "Children (5-12)", price: "$15", note: "Credit Card Price (under 5 yrs. free)" },
            { label: "Adults (13+)", price: "$25", note: "Cash Price" },
            { label: "Children (5-12)", price: "$15", note: "Cash Price" },
          ],
          meetDetails: {},
          logistics: {},
          communications: {},
        },
        extractedText: [
          "Spectator Admissions",
          "Credit Card Price",
          "$26 / Adult (13 + up)",
          "$16 / Child (5-12)",
          "(under 5 yrs. free)",
          "Cash Price",
          "$25 / Adult (13 + up)",
          "$15 / Child (5-12)",
        ].join("\n"),
      },
    },
    customFields: {},
    advancedSections: { meet: {}, logistics: {}, coaches: {} },
  });

  const admission = findSection(discovery, "admission");
  const admissionCards = (findBlock(admission, "admission-cards")?.cards || []).map((card: any) => ({
    label: card.label,
    value: card.value,
    body: card.body,
  }));

  assert.deepEqual(admissionCards, [
    { label: "Adults (13+)", value: "Card $26", body: "Cash $25" },
    { label: "Children (5-12)", value: "Card $16", body: "Cash $15" },
    { label: "Under 5", value: "Free", body: "" },
  ]);
});

test("session eligibility notes from parsed admission rows move to meet details instead of admission", () => {
  const discovery = buildGymMeetDiscoveryContent({
    eventData: {
      createdVia: "meet-discovery",
      discoverySource: {
        parseResult: {
          admission: [
            {
              label: "Adults (13+)",
              price: "$26.00",
              note: "If an athlete competes in the wrong session (based on birthday), they are ineligible for awards and scores may not count toward team total.",
            },
            { label: "Children (5-12)", price: "$16.00", note: "Cash Price is $1.00 less." },
          ],
          meetDetails: {},
          logistics: {},
          communications: {},
        },
        extractedText: "",
      },
    },
    customFields: {},
    advancedSections: { meet: {}, logistics: {}, coaches: {} },
  });

  const admission = findSection(discovery, "admission");
  const meetDetails = findSection(discovery, "meet-details");
  const blobAdmission = JSON.stringify(admission || {});
  const blobMeetDetails = JSON.stringify(meetDetails || {});

  assert.doesNotMatch(blobAdmission, /wrong session|team total|ineligible for awards/i);
  assert.match(blobMeetDetails, /wrong session|team total|ineligible for awards/i);
});

test("public hotel section drops duplicate travel copy when it only repeats the hotel link label", () => {
  const discovery = buildGymMeetDiscoveryContent({
    eventData: {
      eventTitle: "Florida Crown Championships",
      title: "Florida Crown Championships",
      venue: "Coral Springs Gymnasium",
      address: "123 Main St, Coral Springs, FL",
      createdVia: "meet-discovery",
      discoverySource: {
        pipelineVersion: "gym-public-v2",
        parseResult: {
          admission: [],
          meetDetails: {},
          logistics: {},
          communications: {},
        },
        extractionMeta: {
          resourceLinks: [
            {
              kind: "hotel_booking",
              status: "available",
              audience: "public_attendee",
              label: "Host Hotels",
              url: "https://example.com/hotels",
            },
          ],
        },
        publicPageSections: {
          meetDetails: { title: "Meet Details", body: "Welcome families.", bullets: [], visibility: "visible" },
          travel: {
            title: "Hotels & Travel",
            body: "Host Hotels",
            bullets: [],
            visibility: "visible",
          },
          documents: { title: "Documents", links: [], visibility: "hidden" },
          spectatorInfo: { title: "Spectator Info", body: "", bullets: [], visibility: "hidden" },
          venue: { title: "Venue Details", body: "", bullets: [], visibility: "hidden" },
          parking: { title: "Parking", body: "", bullets: [], visibility: "hidden" },
          traffic: { title: "Traffic", body: "", bullets: [], visibility: "hidden" },
        },
      },
    },
    customFields: {},
    advancedSections: { meet: {}, logistics: {}, coaches: {} },
  });

  const hotels = findSection(discovery, "hotels");

  assert.ok(hotels);
  assert.equal(findBlock(hotels, "hotels-body"), undefined);
  assert.deepEqual(findBlock(hotels, "hotel-links")?.links, [
    { label: "Host Hotels", url: "https://example.com/hotels" },
  ]);
});

test("public hotel section drops low-signal host hotels copy even when the fallback link label differs", () => {
  const discovery = buildGymMeetDiscoveryContent({
    eventData: {
      eventTitle: "Florida Crown Championships",
      title: "Florida Crown Championships",
      venue: "Coral Springs Gymnasium",
      address: "123 Main St, Coral Springs, FL",
      createdVia: "meet-discovery",
      discoverySource: {
        pipelineVersion: "gym-public-v2",
        parseResult: {
          admission: [],
          meetDetails: {},
          logistics: {},
          communications: {},
        },
        extractionMeta: {
          resourceLinks: [
            {
              kind: "travel_accommodation",
              status: "available",
              audience: "public_attendee",
              label: "Host Hotels",
              url: "https://example.com/hotels",
            },
          ],
        },
        publicPageSections: {
          meetDetails: {
            title: "Meet Details",
            body: "Welcome families.",
            bullets: [],
            visibility: "visible",
          },
          travel: {
            title: "Hotels & Travel",
            body: "Host Hotels",
            bullets: [],
            visibility: "visible",
            fallbackLink: "https://example.com/hotels",
          },
          documents: { title: "Documents", links: [], visibility: "hidden" },
          spectatorInfo: { title: "Spectator Info", body: "", bullets: [], visibility: "hidden" },
          venue: { title: "Venue Details", body: "", bullets: [], visibility: "hidden" },
          parking: { title: "Parking", body: "", bullets: [], visibility: "hidden" },
          traffic: { title: "Traffic", body: "", bullets: [], visibility: "hidden" },
        },
      },
    },
    customFields: {},
    advancedSections: { meet: {}, logistics: {}, coaches: {} },
  });

  const hotels = findSection(discovery, "hotels");

  assert.ok(hotels);
  assert.equal(findBlock(hotels, "hotels-body"), undefined);
  assert.deepEqual(findBlock(hotels, "hotel-links")?.links, [
    { label: "Host Hotels", url: "https://example.com/hotels" },
  ]);
});

test("structured travel hotels render as hotel cards with fallback link", () => {
  const discovery = buildGymMeetDiscoveryContent({
    eventData: {
      eventTitle: "Florida Crown Championships",
      title: "Florida Crown Championships",
      venue: "Coral Springs Gymnasium",
      address: "123 Main St, Coral Springs, FL",
      createdVia: "meet-discovery",
      discoverySource: {
        pipelineVersion: "gym-public-v2",
        parseResult: {
          admission: [],
          meetDetails: {},
          logistics: {},
          communications: {},
        },
        extractionMeta: {
          resourceLinks: [
            {
              kind: "travel_accommodation",
              status: "available",
              audience: "public_attendee",
              label: "Host Hotels",
              url: "https://example.com/hotels",
            },
          ],
        },
        publicPageSections: {
          meetDetails: { title: "Meet Details", body: "Welcome families.", bullets: [], visibility: "visible" },
          travel: {
            title: "Hotels & Travel",
            body: "",
            bullets: [],
            visibility: "visible",
            fallbackLink: "https://example.com/hotels",
            items: [
              {
                name: "Fort Lauderdale Marriott Coral Springs",
                distanceFromVenue: "5 miles",
                groupRate: "$189.00 + tax",
                parking: "Complimentary",
                breakfast: "Available for purchase",
                reservationDeadline: "2026-02-12",
                bookingUrl: "https://example.com/book-marriott",
              },
            ],
          },
          documents: { title: "Documents", links: [], visibility: "hidden" },
          spectatorInfo: { title: "Spectator Info", body: "", bullets: [], visibility: "hidden" },
          venue: { title: "Venue Details", body: "", bullets: [], visibility: "hidden" },
          parking: { title: "Parking", body: "", bullets: [], visibility: "hidden" },
          traffic: { title: "Traffic", body: "", bullets: [], visibility: "hidden" },
        },
      },
    },
    customFields: {},
    advancedSections: { meet: {}, logistics: {}, coaches: {} },
  });

  const hotels = findSection(discovery, "hotels");
  const cards = findBlock(hotels, "hotel-cards");

  assert.ok(hotels?.hasContent);
  assert.equal(cards?.type, "card-grid");
  assert.match(JSON.stringify(cards), /Fort Lauderdale Marriott Coral Springs/);
  assert.match(JSON.stringify(cards), /\$189\.00 \+ tax/);
  assert.match(JSON.stringify(cards), /https:\/\/example\.com\/book-marriott/);
  assert.deepEqual(findBlock(hotels, "hotel-links")?.links, [
    { label: "Host Hotels", url: "https://example.com/hotels" },
  ]);
});

test("quick access collapses duplicate labels even when discovery finds multiple urls", () => {
  const eventData = {
    eventTitle: "Florida Crown Championships",
    title: "Florida Crown Championships",
    venue: "Coral Springs Gymnasium",
    address: "123 Main St, Coral Springs, FL",
    createdVia: "meet-discovery",
    discoverySource: {
      pipelineVersion: "gym-public-v2",
      parseResult: {
        admission: [],
        meetDetails: {},
        logistics: {},
        communications: {},
      },
      extractionMeta: {
        resourceLinks: [
          {
            kind: "hotel_booking",
            status: "available",
            label: "Host Hotels",
            url: "https://example.com/hotels",
          },
          {
            kind: "hotel_booking",
            status: "available",
            label: "Host Hotels",
            url: "https://example.com/hotels?source=packet",
          },
          {
            kind: "results_hub",
            status: "available",
            label: "Official Results",
            url: "https://example.com/results",
          },
          {
            kind: "results_live",
            status: "available",
            label: "Official Results",
            url: "https://example.com/results/live",
          },
        ],
      },
      publicPageSections: {
        meetDetails: { title: "Meet Details", body: "Welcome families.", bullets: [], visibility: "visible" },
        travel: {
          title: "Hotels & Travel",
          body: "Use the host hotel booking page.",
          bullets: [],
          visibility: "visible",
        },
        documents: {
          title: "Documents",
          links: [
            { label: "Photo / Video Order Form", url: "https://pci.jotform.com/photo-video" },
            { label: "Apparel Sizing Form", url: "https://forms.office.com/apparel" },
          ],
          visibility: "visible",
        },
        spectatorInfo: { title: "Spectator Info", body: "", bullets: [], visibility: "hidden" },
        venue: { title: "Venue Details", body: "", bullets: [], visibility: "hidden" },
        parking: { title: "Parking", body: "", bullets: [], visibility: "hidden" },
        traffic: { title: "Traffic", body: "", bullets: [], visibility: "hidden" },
      },
    },
    customFields: {},
    advancedSections: { meet: {}, logistics: {}, coaches: {} },
  };

  const model = normalizeGymMeetEventData({
    eventData,
    eventTitle: eventData.eventTitle,
    navItems: [],
    rosterAthletes: [],
  });

  assert.deepEqual(model.quickLinks, [
    { label: "Host Hotels", url: "https://example.com/hotels" },
    { label: "Official Results", url: "https://example.com/results" },
  ]);
});

test("quick access prioritizes parking, hotels, documents, then results", () => {
  const eventData = {
    eventTitle: "Eastern Nationals",
    title: "Eastern Nationals",
    venue: "Palm Beach County Convention Center",
    address: "650 Okeechobee Blvd, West Palm Beach, FL 33401",
    createdVia: "meet-discovery",
    discoverySource: {
      pipelineVersion: "gym-public-v2",
      parseResult: {
        admission: [],
        meetDetails: {},
        logistics: {},
        communications: {},
      },
      extractionMeta: {
        resourceLinks: [
          {
            kind: "parking",
            status: "available",
            label: "Parking Garage Directions",
            url: "https://static.usagym.org/parking.jpg",
          },
          {
            kind: "hotel_booking",
            status: "available",
            label: "Hotel Reservations",
            url: "https://app.eventpipe.com/hotel-booking",
          },
          {
            kind: "photo_video",
            status: "available",
            label: "Photo / Video Order Form",
            url: "https://pci.jotform.com/photo-video",
          },
          {
            kind: "apparel_form",
            status: "available",
            label: "Apparel Sizing Form",
            url: "https://forms.office.com/apparel",
          },
          {
            kind: "results_hub",
            status: "available",
            label: "Official Results",
            url: "https://example.com/results",
          },
        ],
      },
      publicPageSections: {
        meetDetails: { title: "Meet Details", body: "Welcome families.", bullets: [], visibility: "visible" },
        parking: { title: "Parking", body: "Use the parking garage.", bullets: [], visibility: "visible" },
        traffic: { title: "Traffic", body: "", bullets: [], visibility: "hidden" },
        travel: { title: "Hotels & Travel", body: "Reserve nearby rooms.", bullets: [], visibility: "visible" },
        documents: { title: "Documents", links: [], visibility: "hidden" },
        spectatorInfo: { title: "Spectator Info", body: "", bullets: [], visibility: "hidden" },
        venue: { title: "Venue Details", body: "", bullets: [], visibility: "hidden" },
      },
    },
    customFields: {},
    advancedSections: { meet: {}, logistics: {}, coaches: {} },
  };

  const model = normalizeGymMeetEventData({
    eventData,
    eventTitle: eventData.eventTitle,
    navItems: [],
    rosterAthletes: [],
  });

  assert.deepEqual(model.quickLinks, [
    { label: "Parking Garage Directions", url: "https://static.usagym.org/parking.jpg" },
    { label: "Hotel Reservations", url: "https://app.eventpipe.com/hotel-booking" },
    { label: "Photo / Video Order Form", url: "https://pci.jotform.com/photo-video" },
    { label: "Apparel Sizing Form", url: "https://forms.office.com/apparel" },
    { label: "Official Results", url: "https://example.com/results" },
  ]);
});
