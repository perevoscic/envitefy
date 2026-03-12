import assert from "node:assert/strict";
import test from "node:test";

import {
  __testUtils,
  computeGymBuilderStatuses,
  extractDiscoveryText,
  mapParseResultToGymData,
} from "./meet-discovery";

const {
  deriveDateRangeFromText,
  classifyMeetDateCandidates,
  normalizeParseResult,
  sanitizeDiscoveryParseResult,
  mergeCoachFeesFromAdmission,
  routeCoachDeadlines,
  deriveScheduleFromTextFallback,
  mergeScheduleWithFallback,
  supplementScheduleWithFallback,
  mergeScheduleAwardFlags,
  extractScheduleLegendNotes,
  isStaleDerivedSchedule,
  collectDiscoveryCandidates,
  setUrlDiscoveryTestHooks,
  resetUrlDiscoveryTestHooks,
} = __testUtils;

test("sanitizeDiscoveryParseResult suppresses schedule grids and reroutes invalid gear facts", () => {
  const sanitized = sanitizeDiscoveryParseResult(
    normalizeParseResult({
      eventType: "gymnastics_meet",
      documentProfile: "meet_packet",
      title: "Florida Crown Championships",
      dates: "March 13-15, 2026",
      startAt: null,
      endAt: null,
      timezone: "America/New_York",
      venue: "Coral Springs Gymnasium",
      address: "123 Main St, Coral Springs, FL 33065",
      hostGym: "USA Competitions",
      admission: [],
      athlete: {},
      meetDetails: {
        operationalNotes: [
          "Visit Lauderdale is a sponsor and encourages visitors to tag #VisitLauderdale.",
          "360 Gymnastics FL 360 Gymnastics FL Alpha Gymnastics Christi's Gymnastics.",
          "Athlete cards will be distributed after competition for recording scores.",
        ],
      },
      logistics: {},
      policies: {},
      coachInfo: {},
      contacts: [],
      deadlines: [],
      gear: {
        uniform: "Coral Springs Gymnasium: The temperature inside the venue is chilly and beyond our control. Please come prepared.",
        checklist: [
          "Admission tickets purchased in advance to avoid price increase and expedite check-in.",
          "Athlete card for recording scores after competition.",
          "Grips",
        ],
      },
      volunteers: {},
      communications: {},
      links: [],
      unmappedFacts: [],
    })!
  );

  assert.equal(sanitized.gear.uniform, null);
  assert.deepEqual(sanitized.gear.checklist, ["Grips"]);
  assert.deepEqual(sanitized.meetDetails.operationalNotes, [
    "Athlete cards will be distributed after competition for recording scores.",
  ]);
  assert.ok(
    sanitized.unmappedFacts.some(
      (fact) =>
        fact.category === "venue_detail" &&
        /temperature inside the venue is chilly/i.test(fact.detail)
    )
  );
  assert.ok(
    sanitized.unmappedFacts.some(
      (fact) =>
        fact.category === "admission_policy" &&
        /Admission tickets purchased in advance/i.test(fact.detail)
    )
  );
  assert.ok(
    sanitized.unmappedFacts.some(
      (fact) => fact.category === "meet_detail" && /Athlete card/i.test(fact.detail)
    )
  );
  assert.ok(
    !sanitized.unmappedFacts.some((fact) => /Visit Lauderdale|360 Gymnastics FL/i.test(fact.detail))
  );
});

const emptyQualitySignals = {
  controlRatio: 0,
  englishLikeRatio: 1,
  longTokenRatio: 0,
  nonTextRatio: 0,
  readableLines: 4,
  tokenCount: 12,
  nonAsciiRatio: 0,
  looksLikePdfInternals: false,
};

test("deriveDateRangeFromText handles month ranges with OCR spacing", () => {
  assert.deepEqual(deriveDateRangeFromText("March 20 -22, 2026"), {
    label: "March 20 -22, 2026",
    startDate: "2026-03-20",
    endDate: "2026-03-22",
  });
  assert.deepEqual(deriveDateRangeFromText("March 6-8, 2026"), {
    label: "March 6-8, 2026",
    startDate: "2026-03-06",
    endDate: "2026-03-08",
  });
  assert.deepEqual(deriveDateRangeFromText("February 20 - 22, 2026"), {
    label: "February 20 - 22, 2026",
    startDate: "2026-02-20",
    endDate: "2026-02-22",
  });
});

test("date classifier prioritizes meet dates and demotes updated or posted stamps", () => {
  const analysis = classifyMeetDateCandidates(`
2026 State Information
Updated February 23, 2026
Posted 3/4/26
When: March 20 -22, 2026
Late fee deadline March 1, 2026
`);

  assert.equal(analysis.primary?.startDate, "2026-03-20");
  assert.equal(analysis.primary?.endDate, "2026-03-22");
  assert.match(analysis.primary?.label || "", /March 20-22, 2026/i);
  assert.ok(
    analysis.ignored.some((item) => /Updated February 23, 2026/i.test(item.line)),
    "expected updated stamp to be demoted"
  );
  assert.ok(
    analysis.ignored.some((item) => /Posted 3\/4\/26/i.test(item.line)),
    "expected posted stamp to be demoted"
  );
});

test("spectator admission stays public while coach fees route into coachInfo", () => {
  const normalized = normalizeParseResult({
    eventType: "gymnastics_meet",
    documentProfile: "registration_packet",
    title: "State Meet",
    dates: "March 20-22, 2026",
    startAt: null,
    endAt: null,
    timezone: "America/Chicago",
    venue: "State Arena",
    address: "123 Main St, Chicago, IL 60601",
    hostGym: "State Gym",
    admission: [
      { label: "Adults", price: "$20", note: "Cash only" },
      { label: "Athlete Entry Fee", price: "$125", note: "Per gymnast" },
      { label: "Team Fee", price: "$50", note: "Per team" },
      { label: "Late Entry Fee", price: "$25", note: "After March 1" },
    ],
    athlete: {},
    meetDetails: {},
    logistics: {},
    policies: {},
    coachInfo: {},
    contacts: [],
    deadlines: [
      { label: "Entry Deadline", date: "2026-03-01", note: "Register in MeetMaker" },
      { label: "Public RSVP", date: "2026-03-10", note: "Optional" },
    ],
    gear: {},
    volunteers: {},
    communications: {},
    links: [],
    unmappedFacts: [],
  });
  assert.ok(normalized);

  const routed = routeCoachDeadlines(mergeCoachFeesFromAdmission(normalized!));

  assert.deepEqual(
    routed.admission.map((item) => item.label),
    ["Adults"]
  );
  assert.deepEqual(
    routed.coachInfo.entryFees.map((item) => item.label),
    ["Athlete Entry Fee"]
  );
  assert.deepEqual(
    routed.coachInfo.teamFees.map((item) => item.label),
    ["Team Fee"]
  );
  assert.deepEqual(
    routed.coachInfo.lateFees.map((item) => item.label),
    ["Late Entry Fee"]
  );
  assert.deepEqual(
    routed.coachInfo.deadlines.map((item) => item.label),
    ["Entry Deadline"]
  );
  assert.deepEqual(
    routed.deadlines.map((item) => item.label),
    ["Public RSVP"]
  );
});

test("collectDiscoveryCandidates prioritizes packet-style links over site chrome", () => {
  const rootUrl = new URL("https://usacompetitions.com/florida-crown-championship/");
  const html = `
    <a href="/about-us/">About Us</a>
    <a href="/contact/">Contact</a>
    <a href="/wp-content/uploads/2026/03/packet.pdf">Schedule &amp; Info Packet</a>
    <a href="/wp-content/uploads/2026/03/rosters.pdf">Rosters</a>
    <a href="/wp-content/uploads/2026/03/rotations.pdf">Rotation Sheets</a>
    <a href="https://www.facebook.com/USACompetitions">Facebook</a>
  `;

  const candidates = collectDiscoveryCandidates(html, rootUrl, 0);
  const topThreeLabels = candidates.slice(0, 3).map((item: any) => item.label);

  assert.equal(topThreeLabels[0], "Schedule & Info Packet");
  assert.ok(topThreeLabels.includes("Rosters"));
  assert.ok(topThreeLabels.includes("Rotation Sheets"));
  assert.ok(!topThreeLabels.includes("About Us"));
  assert.ok(!topThreeLabels.includes("Contact"));
});

test("extractDiscoveryText crawls one same-host HTML hop and preserves external links", async (t) => {
  const rootUrl = "https://usacompetitions.com/florida-crown-championship/";
  const detailsUrl = "https://usacompetitions.com/details/";
  const packetUrl = "https://usacompetitions.com/docs/packet.pdf";
  const rosterUrl = "https://usacompetitions.com/docs/roster.pdf";
  const mapUrl = "https://usacompetitions.com/maps/garage-map.jpg";
  const externalTicketUrl = "https://usa-competitions.square.site/product/admission";
  const deepUrl = "https://usacompetitions.com/deep/";
  const fetchCalls: string[] = [];

  t.after(() => resetUrlDiscoveryTestHooks());
  setUrlDiscoveryTestHooks({
    fetchWithLimit: async (url: string) => {
      fetchCalls.push(url);
      if (url === rootUrl) {
        const text = `
          <html>
            <head>
              <title>Florida Crown Championships</title>
              <meta name="description" content="March 13-15, 2026 at Coral Springs Gymnasium" />
            </head>
            <body>
              March 13-15, 2026 at Coral Springs Gymnasium.
              <a href="/docs/packet.pdf">Schedule &amp; Info Packet</a>
              <a href="/details/">Venue Details</a>
              <a href="${externalTicketUrl}">Purchase Admission Here!</a>
              <a href="/contact/">Contact</a>
            </body>
          </html>
        `;
        return { contentType: "text/html", buffer: Buffer.from(text), text };
      }
      if (url === detailsUrl) {
        const text = `
          <html>
            <head><title>Venue Details</title></head>
            <body>
              Parking and arrival details.
              <a href="/docs/roster.pdf">Rosters</a>
              <a href="/maps/garage-map.jpg">Parking Map</a>
              <a href="/deep/">Deep Link</a>
            </body>
          </html>
        `;
        return { contentType: "text/html", buffer: Buffer.from(text), text };
      }
      if (url === packetUrl) {
        return {
          contentType: "application/pdf",
          buffer: Buffer.from("packet pdf text"),
          text: "",
        };
      }
      if (url === rosterUrl) {
        return {
          contentType: "application/pdf",
          buffer: Buffer.from("roster pdf text"),
          text: "",
        };
      }
      if (url === mapUrl) {
        return {
          contentType: "image/jpeg",
          buffer: Buffer.from("parking map text"),
          text: "",
        };
      }
      throw new Error(`Unexpected fetch: ${url}`);
    },
    extractTextFromPdf: async (buffer: Buffer) => ({
      text: `PDF:${buffer.toString("utf8")}`,
      usedOcr: false,
      coachPageHints: [],
      textQuality: "good",
      qualitySignals: emptyQualitySignals,
    }),
    extractTextFromImage: async (buffer: Buffer) => `IMG:${buffer.toString("utf8")}`,
    extractGymLayoutImageFromPdf: async () => ({
      dataUrl: null,
      facts: [],
      zones: [],
      page: null,
    }),
    openAiExtractGymLayoutZones: async () => [],
    toOptimizedImageDataUrl: async () => null,
  });

  const result = await extractDiscoveryText({ type: "url", url: rootUrl });

  assert.match(result.extractedText, /Florida Crown Championships/i);
  assert.match(result.extractedText, /PDF:packet pdf text/);
  assert.match(result.extractedText, /PDF:roster pdf text/);
  assert.match(result.extractedText, /IMG:parking map text/);
  assert.ok(!fetchCalls.includes(deepUrl), "expected crawler to stop after one same-host HTML hop");
  assert.deepEqual(
    result.extractionMeta.crawledPages,
    [
      { url: rootUrl, title: "Florida Crown Championships", depth: 0 },
      { url: detailsUrl, title: "Venue Details", depth: 1 },
    ]
  );
  assert.deepEqual(
    result.extractionMeta.linkedAssets,
    [
      { url: packetUrl, contentType: "application/pdf" },
      { url: rosterUrl, contentType: "application/pdf" },
      { url: mapUrl, contentType: "image/jpeg" },
    ]
  );
  assert.ok(
    result.extractionMeta.discoveredLinks?.some(
      (item: any) =>
        item.url === externalTicketUrl &&
        item.kind === "external" &&
        item.followed === false &&
        /Purchase Admission Here/i.test(item.label)
    )
  );
  assert.ok(
    result.extractionMeta.discoveredLinks?.some(
      (item: any) => item.url === detailsUrl && item.kind === "html" && item.followed === true
    )
  );
});

test("extractDiscoveryText dedupes repeated assets and tolerates fetch failures", async (t) => {
  const rootUrl = "https://usacompetitions.com/event/";
  const childUrl = "https://usacompetitions.com/child/";
  const packetUrl = "https://usacompetitions.com/docs/packet.pdf";
  const missingUrl = "https://usacompetitions.com/docs/missing.pdf";
  const fetchCalls: string[] = [];

  t.after(() => resetUrlDiscoveryTestHooks());
  setUrlDiscoveryTestHooks({
    fetchWithLimit: async (url: string) => {
      fetchCalls.push(url);
      if (url === rootUrl) {
        const text = `
          <html><head><title>Event</title></head><body>
            <a href="/docs/packet.pdf">Packet</a>
            <a href="/child/">Child Page</a>
          </body></html>
        `;
        return { contentType: "text/html", buffer: Buffer.from(text), text };
      }
      if (url === childUrl) {
        const text = `
          <html><head><title>Child</title></head><body>
            <a href="/docs/packet.pdf">Packet Duplicate</a>
            <a href="/docs/missing.pdf">Missing FAQ</a>
          </body></html>
        `;
        return { contentType: "text/html", buffer: Buffer.from(text), text };
      }
      if (url === packetUrl) {
        return {
          contentType: "application/pdf",
          buffer: Buffer.from("deduped packet text"),
          text: "",
        };
      }
      if (url === missingUrl) {
        throw new Error("404");
      }
      throw new Error(`Unexpected fetch: ${url}`);
    },
    extractTextFromPdf: async (buffer: Buffer) => ({
      text: `PDF:${buffer.toString("utf8")}`,
      usedOcr: false,
      coachPageHints: [],
      textQuality: "good",
      qualitySignals: emptyQualitySignals,
    }),
    extractTextFromImage: async () => "",
    extractGymLayoutImageFromPdf: async () => ({
      dataUrl: null,
      facts: [],
      zones: [],
      page: null,
    }),
    openAiExtractGymLayoutZones: async () => [],
    toOptimizedImageDataUrl: async () => null,
  });

  const result = await extractDiscoveryText({ type: "url", url: rootUrl });

  assert.match(result.extractedText, /PDF:deduped packet text/);
  assert.equal(
    fetchCalls.filter((url) => url === packetUrl).length,
    1,
    "expected duplicate asset URLs to be fetched once"
  );
  assert.ok(
    result.extractionMeta.discoveredLinks?.some(
      (item: any) => item.url === missingUrl && item.followed === false
    )
  );
});

test("extractDiscoveryText core mode skips gymnastics enrichment branches", async (t) => {
  const layoutCalls: string[] = [];
  const rootUrl = "https://usacompetitions.com/event/";
  const packetUrl = "https://usacompetitions.com/docs/packet.pdf";

  t.after(() => resetUrlDiscoveryTestHooks());
  setUrlDiscoveryTestHooks({
    fetchWithLimit: async (url: string) => {
      if (url === rootUrl) {
        const text = `<html><body><a href="/docs/packet.pdf">Packet</a></body></html>`;
        return { contentType: "text/html", buffer: Buffer.from(text), text };
      }
      if (url === packetUrl) {
        return {
          contentType: "application/pdf",
          buffer: Buffer.from("schedule packet"),
          text: "",
        };
      }
      throw new Error(`Unexpected fetch: ${url}`);
    },
    extractTextFromPdf: async () => ({
      text: "Friday Schedule\nSession FR1\nStretch/Warmup: 8:00 AM",
      usedOcr: false,
      coachPageHints: [],
      textQuality: "good",
      qualitySignals: emptyQualitySignals,
      pages: [
        {
          num: 1,
          text: "Friday Schedule\nSession FR1\nStretch/Warmup: 8:00 AM",
        },
      ],
    }),
    extractTextFromImage: async () => "",
    extractGymLayoutImageFromPdf: async () => {
      layoutCalls.push("layout");
      return {
        dataUrl: "data:image/png;base64,abc",
        facts: ["Gym A"],
        zones: [],
        page: 0,
      };
    },
    openAiExtractGymLayoutZones: async () => [],
    toOptimizedImageDataUrl: async () => null,
  });

  const result = await extractDiscoveryText(
    { type: "url", url: rootUrl },
    { workflow: "gymnastics", mode: "core" }
  );

  assert.equal(layoutCalls.length, 0);
  assert.deepEqual(result.extractionMeta.schedulePageImages, []);
  assert.equal(result.extractionMeta.schedulePageTexts?.length, 1);
});

test("extractDiscoveryText football workflow skips gymnastics-only artifacts", async (t) => {
  const layoutCalls: string[] = [];
  const rootUrl = "https://football.example.com/event/";
  const packetUrl = "https://football.example.com/docs/packet.pdf";

  t.after(() => resetUrlDiscoveryTestHooks());
  setUrlDiscoveryTestHooks({
    fetchWithLimit: async (url: string) => {
      if (url === rootUrl) {
        const text = `<html><body><a href="/docs/packet.pdf">Packet</a></body></html>`;
        return { contentType: "text/html", buffer: Buffer.from(text), text };
      }
      if (url === packetUrl) {
        return {
          contentType: "application/pdf",
          buffer: Buffer.from("football packet"),
          text: "",
        };
      }
      throw new Error(`Unexpected fetch: ${url}`);
    },
    extractTextFromPdf: async () => ({
      text: "Season schedule\nOpponent\nKickoff",
      usedOcr: false,
      coachPageHints: [],
      textQuality: "good",
      qualitySignals: emptyQualitySignals,
      pages: [{ num: 1, text: "Season schedule\nOpponent\nKickoff" }],
    }),
    extractTextFromImage: async () => "",
    extractGymLayoutImageFromPdf: async () => {
      layoutCalls.push("layout");
      return {
        dataUrl: "data:image/png;base64,abc",
        facts: ["Gym A"],
        zones: [],
        page: 0,
      };
    },
    openAiExtractGymLayoutZones: async () => [],
    toOptimizedImageDataUrl: async () => null,
  });

  const result = await extractDiscoveryText(
    { type: "url", url: rootUrl },
    { workflow: "football", mode: "core" }
  );

  assert.equal(layoutCalls.length, 0);
  assert.deepEqual(result.extractionMeta.schedulePageImages, []);
  assert.deepEqual(result.extractionMeta.schedulePageTexts, []);
  assert.deepEqual(result.extractionMeta.gymLayoutFacts, []);
});

test("mapParseResultToGymData preserves existing manual schedule content", async () => {
  const mapped = await mapParseResultToGymData(
    normalizeParseResult({
      eventType: "gymnastics_meet",
      documentProfile: "athlete_session",
      title: "State Meet",
      dates: "March 20-22, 2026",
      startAt: null,
      endAt: null,
      timezone: "America/Chicago",
      venue: "State Arena",
      address: "123 Main St, Chicago, IL 60601",
      hostGym: "State Gym",
      admission: [],
      athlete: {},
      meetDetails: {},
      logistics: {},
      policies: {},
      coachInfo: {},
      contacts: [],
      deadlines: [],
      gear: {},
      volunteers: {},
      communications: {},
      schedule: {
        venueLabel: "Parsed Venue",
        supportEmail: "parsed@example.com",
        notes: [],
        days: [
          {
            date: "Friday, March 20, 2026",
            shortDate: "Friday • Mar 20",
            sessions: [
              {
                code: "FR1",
                group: "Bronze",
                startTime: "8:00 AM",
                clubs: [{ name: "Parsed Club", teamAwardEligible: true, athleteCount: 10 }],
              },
            ],
          },
        ],
      },
      links: [],
      unmappedFacts: [],
    })!,
    {
      advancedSections: {
        schedule: {
          enabled: true,
          venueLabel: "Manual Venue",
          supportEmail: "manual@example.com",
          notes: ["Manual note"],
          days: [
            {
              id: "manual-day",
              date: "Saturday, March 21, 2026",
              shortDate: "Saturday • Mar 21",
              sessions: [
                {
                  id: "manual-session",
                  code: "SA1",
                  label: "Session SA1",
                  group: "Silver",
                  startTime: "10:45 AM",
                  warmupTime: "",
                  note: "",
                  clubs: [
                    {
                      id: "manual-club",
                      name: "Manual Club",
                      teamAwardEligible: false,
                      athleteCount: 8,
                      divisionLabel: "",
                    },
                  ],
                },
              ],
            },
          ],
        },
      },
    }
  );

  assert.equal(mapped.advancedSections.schedule.venueLabel, "Manual Venue");
  assert.equal(mapped.advancedSections.schedule.supportEmail, "manual@example.com");
  assert.equal(mapped.advancedSections.schedule.days[0]?.sessions[0]?.clubs[0]?.name, "Manual Club");
});

test("mergeScheduleWithFallback restores missing schedule sessions and days", () => {
  const merged = mergeScheduleWithFallback(
    {
      venueLabel: "Coral Springs Gymnasium",
      supportEmail: "info@usacompetitions.com",
      notes: [],
      days: [
        {
          date: "Friday, March 13, 2026",
          shortDate: "Friday • Mar 13",
          sessions: [],
        },
      ],
    },
    {
      venueLabel: null,
      supportEmail: null,
      notes: [],
      days: [
        {
          date: "Friday, March 13, 2026",
          shortDate: "Friday • Mar 13",
          sessions: [
            {
              code: "FR1",
              group: null,
              startTime: null,
              warmupTime: null,
              note: null,
              clubs: [],
            },
          ],
        },
        {
          date: "Saturday, March 14, 2026",
          shortDate: "Saturday • Mar 14",
          sessions: [
            {
              code: "SA1",
              group: null,
              startTime: null,
              warmupTime: null,
              note: null,
              clubs: [],
            },
          ],
        },
        {
          date: "Sunday, March 15, 2026",
          shortDate: "Sunday • Mar 15",
          sessions: [
            {
              code: "SU1",
              group: null,
              startTime: null,
              warmupTime: null,
              note: null,
              clubs: [],
            },
          ],
        },
      ],
    }
  );

  assert.equal(merged.days.length, 3);
  assert.equal(merged.days[0]?.sessions[0]?.code, "FR1");
  assert.equal(merged.days[1]?.sessions[0]?.code, "SA1");
  assert.equal(merged.days[2]?.sessions[0]?.code, "SU1");
});

test("deriveScheduleFromTextFallback keeps days separate and parses session times from extracted grid text", () => {
  const fallback = deriveScheduleFromTextFallback(`
-- 1 of 3 --
Session FR4 \tSession FR5
LEVELS 6/7 \tLEVELS 8/9/10/PLATINUM/DIAMOND/SAPPHIRE
Stretch/warmup: 4:00pm \tStretch/warmup: 6:45PM
360 Gymnastics FL \t360 Gymnastics FL \t360 Gymnastics FL \tAlpha Gymnastics Christi's Gymnastics
Friday, March 13, 2026
Questions? Email us ASAP at info@usacompetitions.com
Session FR1 \tSession FR2 \tSession FR3
BRONZE \tSILVER \tLEVEL 6
Stretch/warmup: 8:00am \tStretch/warmup: 10:45am \tStretch/warmup: 1:15pm
Browns Gym \t360 Gymnastics FL \tChristi's Gymnastics

-- 2 of 3 --
Session SA1 \tSession SA2 \tSession SA3
LEVELS 1/2/BRONZE \tLEVELS 3/SILVER \tLEVELS 4/5/GOLD
Stretch/warmup: 8:00am \tStretch/warmup: 10:45AM \tStretch/warmup: 1:30PM
Academia Atenia Christi's Gymnastics \tGym World Naples \tFGTC \tTNT Wellington
Saturday, March 14, 2026
Session SA4 \tSession SA5
GOLD/PLATINUM \tGOLD
Stretch/warmup: 4:15PM \tStretch/warmup: 7:00PM
360 Gymnastics FL \tGymnastics USA \tChristi's Gymnastics

-- 3 of 3 --
Session SU1 \tSession SU2
BRONZE \tSILVER
Stretch/warmup: 10:00am \tStretch/warmup: 12:45pm
Alpha Gymnastics \tFGTC
Sunday, March 15, 2026
Session SU3 \tSession SU4
SILVER \tGOLD
Stretch/warmup: 3:00pm \tStretch/warmup: 5:30pm
Alpha Gymnastics \tAlpha Gymnastics
Gymnastics Du Sol
`);

  assert.equal(fallback.supportEmail, "info@usacompetitions.com");
  assert.equal(fallback.days.length, 3);
  assert.equal(fallback.days[0]?.date, "Friday, March 13, 2026");
  assert.equal(fallback.days[1]?.date, "Saturday, March 14, 2026");
  assert.equal(fallback.days[2]?.date, "Sunday, March 15, 2026");
  assert.equal(fallback.days[0]?.sessions[0]?.code, "FR4");
  assert.equal(fallback.days[0]?.sessions[0]?.startTime, "4:00pm");
  assert.equal(fallback.days[0]?.sessions[1]?.group, "LEVELS 8/9/10/PLATINUM/DIAMOND/SAPPHIRE");
  assert.equal(fallback.days[0]?.sessions[4]?.code, "FR3");
  assert.equal(fallback.days[1]?.sessions[0]?.code, "SA1");
  assert.equal(fallback.days[1]?.sessions[3]?.startTime, "4:15PM");
  assert.equal(fallback.days[2]?.sessions[3]?.code, "SU4");
  assert.equal(fallback.days[2]?.sessions[3]?.clubs.at(-1)?.name, "Gymnastics Du Sol");
});

test("deriveScheduleFromTextFallback keeps nested FR4 and FR5 division subcolumns attached to the correct session", () => {
  const fallback = deriveScheduleFromTextFallback(`
-- 1 of 1 --
Session FR4 \tSession FR5
LEVELS 6/7 \tLEVELS 8/9/10/PLATINUM/DIAMOND/SAPPHIRE
Stretch/warmup: 4:00pm \tStretch/warmup: 6:45PM
LEVEL 6 \tLEVEL 7 \tLEVEL 8 \tPLATINUM \tDIAMOND
Alpha Gymnastics \tBrowns Gym \t360 Gymnastics FL \tWorld Class Miami \tTNT Wellington
\t\tLEVEL 9 \tLEVEL 10 \tSAPPHIRE
\t\t360 Gymnastics FL \tGymnastics Du Sol \tAlpha Gymnastics
Friday, March 13, 2026
  `);

  assert.equal(fallback.days.length, 1);
  assert.equal(fallback.days[0]?.sessions[0]?.code, "FR4");
  assert.equal(fallback.days[0]?.sessions[0]?.group, "LEVELS 6/7");
  assert.equal(fallback.days[0]?.sessions[0]?.startTime, "4:00pm");
  assert.deepEqual(
    fallback.days[0]?.sessions[0]?.clubs.map((club) => [club.name, club.divisionLabel]),
    [
      ["Alpha Gymnastics", "LEVEL 6"],
      ["Browns Gym", "LEVEL 7"],
    ]
  );
  assert.equal(
    fallback.days[0]?.sessions[1]?.group,
    "LEVELS 8/9/10/PLATINUM/DIAMOND/SAPPHIRE"
  );
  assert.equal(fallback.days[0]?.sessions[1]?.startTime, "6:45PM");
  assert.deepEqual(
    fallback.days[0]?.sessions[1]?.clubs.map((club) => [club.name, club.divisionLabel]),
    [
      ["360 Gymnastics FL", "LEVEL 8"],
      ["World Class Miami", "PLATINUM"],
      ["TNT Wellington", "DIAMOND"],
      ["360 Gymnastics FL", "LEVEL 9"],
      ["Gymnastics Du Sol", "LEVEL 10"],
      ["Alpha Gymnastics", "SAPPHIRE"],
    ]
  );
});

test("mergeScheduleWithFallback fills in missing session timing and clubs from fallback", () => {
  const merged = mergeScheduleWithFallback(
    {
      venueLabel: "Coral Springs Gymnasium",
      supportEmail: "info@usacompetitions.com",
      notes: [],
      days: [
        {
          date: "Friday, March 13, 2026",
          shortDate: "Friday • Mar 13",
          sessions: [
            {
              code: "FR1",
              group: null,
              startTime: null,
              warmupTime: null,
              note: null,
              clubs: [{ name: "Browns Gym", teamAwardEligible: null, athleteCount: null, divisionLabel: null }],
            },
          ],
        },
      ],
    },
    {
      venueLabel: null,
      supportEmail: null,
      notes: [],
      days: [
        {
          date: "Friday, March 13, 2026",
          shortDate: "Friday • Mar 13",
          sessions: [
            {
              code: "FR1",
              group: "BRONZE",
              startTime: "8:00am",
              warmupTime: "8:00am",
              note: "Stretch/warmup",
              clubs: [{ name: "Browns Gym", teamAwardEligible: true, athleteCount: 12, divisionLabel: "Bronze A" }],
            },
          ],
        },
      ],
    }
  );

  assert.equal(merged.days[0]?.sessions[0]?.group, "BRONZE");
  assert.equal(merged.days[0]?.sessions[0]?.startTime, "8:00am");
  assert.equal(merged.days[0]?.sessions[0]?.clubs[0]?.name, "Browns Gym");
  assert.equal(merged.days[0]?.sessions[0]?.clubs[0]?.teamAwardEligible, true);
  assert.equal(merged.days[0]?.sessions[0]?.clubs[0]?.athleteCount, 12);
  assert.equal(merged.days[0]?.sessions[0]?.clubs[0]?.divisionLabel, "Bronze A");
});

test("mergeScheduleWithFallback merges undated schedule days into the dated day when session codes overlap", () => {
  const merged = mergeScheduleWithFallback(
    {
      venueLabel: "Coral Springs Gymnasium",
      supportEmail: "info@usacompetitions.com",
      notes: [],
      days: [
        {
          date: "",
          shortDate: "",
          sessions: [
            {
              code: "FR1",
              group: "BRONZE",
              startTime: "8:00am",
              warmupTime: "8:00am",
              note: "Stretch/warmup",
              clubs: [{ name: "Browns Gym", teamAwardEligible: null, athleteCount: null, divisionLabel: null }],
            },
            {
              code: "FR2",
              group: "SILVER",
              startTime: "10:45am",
              warmupTime: "10:45am",
              note: "Stretch/warmup",
              clubs: [{ name: "360 Gymnastics FL", teamAwardEligible: null, athleteCount: null, divisionLabel: null }],
            },
          ],
        },
      ],
    },
    {
      venueLabel: null,
      supportEmail: null,
      notes: [],
      days: [
        {
          date: "Friday, March 13, 2026",
          shortDate: "Friday • Mar 13",
          sessions: [
            {
              code: "FR1",
              group: "BRONZE",
              startTime: "8:00am",
              warmupTime: "8:00am",
              note: "Stretch/warmup",
              clubs: [],
            },
            {
              code: "FR2",
              group: "SILVER",
              startTime: "10:45am",
              warmupTime: "10:45am",
              note: "Stretch/warmup",
              clubs: [],
            },
          ],
        },
      ],
    }
  );

  assert.equal(merged.days.length, 1);
  assert.equal(merged.days[0]?.date, "Friday, March 13, 2026");
  assert.equal(merged.days[0]?.shortDate, "Friday • Mar 13");
  assert.equal(merged.days[0]?.sessions[0]?.clubs[0]?.name, "Browns Gym");
  assert.equal(merged.days[0]?.sessions[1]?.clubs[0]?.name, "360 Gymnastics FL");
});

test("supplementScheduleWithFallback repairs missing visual session metadata without flattening duplicate club names across divisions", () => {
  const repaired = supplementScheduleWithFallback(
    {
      venueLabel: "Coral Springs Gymnasium",
      supportEmail: "info@usacompetitions.com",
      notes: [],
      days: [
        {
          date: "Friday, March 13, 2026",
          shortDate: "Friday • Mar 13",
          sessions: [
            {
              code: "FR4",
              group: "LEVELS 6/7 LEVELS 8/9/10/PLATINUM/DIAMOND/SAPPHIRE",
              startTime: null,
              warmupTime: null,
              note: null,
              clubs: [],
            },
            {
              code: "FR5",
              group: null,
              startTime: null,
              warmupTime: null,
              note: null,
              clubs: [],
            },
          ],
        },
      ],
    },
    {
      venueLabel: "Coral Springs Gymnasium",
      supportEmail: "info@usacompetitions.com",
      notes: [],
      days: [
        {
          date: "Friday, March 13, 2026",
          shortDate: "Friday • Mar 13",
          sessions: [
            {
              code: "FR4",
              group: "LEVELS 6/7",
              startTime: "4:00pm",
              warmupTime: "4:00pm",
              note: "Stretch/warmup",
              clubs: [
                { name: "Alpha Gymnastics", teamAwardEligible: null, athleteCount: null, divisionLabel: "LEVEL 6" },
                { name: "Browns Gym", teamAwardEligible: null, athleteCount: null, divisionLabel: "LEVEL 7" },
              ],
            },
            {
              code: "FR5",
              group: "LEVELS 8/9/10/PLATINUM/DIAMOND/SAPPHIRE",
              startTime: "6:45PM",
              warmupTime: "6:45PM",
              note: "Stretch/warmup",
              clubs: [
                { name: "360 Gymnastics FL", teamAwardEligible: null, athleteCount: null, divisionLabel: "LEVEL 8" },
                { name: "360 Gymnastics FL", teamAwardEligible: null, athleteCount: null, divisionLabel: "LEVEL 9" },
                { name: "Gymnastics Du Sol", teamAwardEligible: null, athleteCount: null, divisionLabel: "LEVEL 10" },
              ],
            },
          ],
        },
      ],
    }
  );

  assert.equal(repaired.tableRepairApplied, true);
  assert.equal(repaired.fallbackMetadataApplied, true);
  assert.equal(repaired.schedule.days[0]?.sessions[0]?.group, "LEVELS 6/7");
  assert.equal(repaired.schedule.days[0]?.sessions[0]?.startTime, "4:00pm");
  assert.equal(repaired.schedule.days[0]?.sessions[1]?.group, "LEVELS 8/9/10/PLATINUM/DIAMOND/SAPPHIRE");
  assert.equal(repaired.schedule.days[0]?.sessions[1]?.startTime, "6:45PM");
  assert.deepEqual(
    repaired.schedule.days[0]?.sessions[1]?.clubs.map((club) => [club.name, club.divisionLabel]),
    [
      ["360 Gymnastics FL", "LEVEL 8"],
      ["360 Gymnastics FL", "LEVEL 9"],
      ["Gymnastics Du Sol", "LEVEL 10"],
    ]
  );
});

test("supplementScheduleWithFallback attaches undated visual days to the dated fallback day instead of creating blank tabs", () => {
  const repaired = supplementScheduleWithFallback(
    {
      venueLabel: "Coral Springs Gymnasium",
      supportEmail: "info@usacompetitions.com",
      notes: [],
      days: [
        {
          date: "",
          shortDate: "",
          sessions: [
            {
              code: "FR1",
              group: "BRONZE",
              startTime: "8:00am",
              warmupTime: "8:00am",
              note: "Stretch/warmup",
              clubs: [{ name: "Browns Gym", teamAwardEligible: null, athleteCount: null, divisionLabel: null }],
            },
            {
              code: "FR2",
              group: "SILVER",
              startTime: "10:45am",
              warmupTime: "10:45am",
              note: "Stretch/warmup",
              clubs: [{ name: "360 Gymnastics FL", teamAwardEligible: null, athleteCount: null, divisionLabel: null }],
            },
          ],
        },
      ],
    },
    {
      venueLabel: "Coral Springs Gymnasium",
      supportEmail: "info@usacompetitions.com",
      notes: [],
      days: [
        {
          date: "Friday, March 13, 2026",
          shortDate: "Friday • Mar 13",
          sessions: [
            {
              code: "FR1",
              group: "BRONZE",
              startTime: "8:00am",
              warmupTime: "8:00am",
              note: "Stretch/warmup",
              clubs: [],
            },
            {
              code: "FR2",
              group: "SILVER",
              startTime: "10:45am",
              warmupTime: "10:45am",
              note: "Stretch/warmup",
              clubs: [],
            },
          ],
        },
      ],
    }
  );

  assert.equal(repaired.schedule.days.length, 1);
  assert.equal(repaired.schedule.days[0]?.date, "Friday, March 13, 2026");
  assert.equal(repaired.schedule.days[0]?.shortDate, "Friday • Mar 13");
  assert.equal(repaired.schedule.days[0]?.sessions[0]?.clubs[0]?.name, "Browns Gym");
  assert.equal(repaired.schedule.days[0]?.sessions[1]?.clubs[0]?.name, "360 Gymnastics FL");
});

test("extractScheduleLegendNotes preserves the pink and black award legend", () => {
  const notes = extractScheduleLegendNotes(`
Clubs in PINK are competing for Individual & Team awards
Clubs in black are competing for Individual awards only
  `);

  assert.deepEqual(notes, [
    "Clubs in pink are competing for Individual & Team awards.",
    "Clubs in black are competing for Individual awards only.",
  ]);
});

test("mergeScheduleAwardFlags fills team award eligibility from image-derived matches", () => {
  const merged = mergeScheduleAwardFlags(
    {
      venueLabel: "Coral Springs Gymnasium",
      supportEmail: "info@usacompetitions.com",
      notes: [],
      days: [
        {
          date: "Sunday, March 15, 2026",
          shortDate: "Sunday • Mar 15",
          sessions: [
            {
              code: "SU4",
              group: "GOLD",
              startTime: "5:30pm",
              warmupTime: null,
              note: null,
              clubs: [
                { name: "Alpha Gymnastics", teamAwardEligible: null, athleteCount: null, divisionLabel: null },
                { name: "World Class Miami", teamAwardEligible: null, athleteCount: null, divisionLabel: null },
              ],
            },
          ],
        },
      ],
    },
    [
      {
        date: "Sunday, March 15, 2026",
        sessions: [
          {
            code: "SU4",
            clubs: [
              { name: "Alpha Gymnastics", teamAwardEligible: true },
              { name: "World Class Miami", teamAwardEligible: false },
            ],
          },
        ],
      },
    ]
  );

  assert.equal(merged.days[0]?.sessions[0]?.clubs[0]?.teamAwardEligible, true);
  assert.equal(merged.days[0]?.sessions[0]?.clubs[1]?.teamAwardEligible, false);
});

test("isStaleDerivedSchedule flags one-day code-only schedules", () => {
  const stale = isStaleDerivedSchedule(
    {
      enabled: true,
      days: [
        {
          id: "fri",
          date: "Friday, March 13, 2026",
          shortDate: "Friday • Mar 13",
          sessions: [
            { id: "fr1", code: "FR1", label: "Session FR1", group: "", startTime: "", warmupTime: "", note: "", clubs: [] },
            { id: "sa1", code: "SA1", label: "Session SA1", group: "", startTime: "", warmupTime: "", note: "", clubs: [] },
            { id: "su1", code: "SU1", label: "Session SU1", group: "", startTime: "", warmupTime: "", note: "", clubs: [] },
          ],
        },
      ],
    },
    `
Friday, March 13, 2026
Saturday, March 14, 2026
Sunday, March 15, 2026
    `
  );

  assert.equal(stale, true);
});

test("mapParseResultToGymData keeps code-only fallback sessions", async () => {
  const mapped = await mapParseResultToGymData(
    normalizeParseResult({
      eventType: "gymnastics_meet",
      documentProfile: "athlete_session",
      title: "State Meet",
      dates: "March 20-22, 2026",
      startAt: null,
      endAt: null,
      timezone: "America/Chicago",
      venue: "State Arena",
      address: "123 Main St, Chicago, IL 60601",
      hostGym: "State Gym",
      admission: [],
      athlete: {},
      meetDetails: {},
      logistics: {},
      policies: {},
      coachInfo: {},
      contacts: [],
      deadlines: [],
      gear: {},
      volunteers: {},
      communications: {},
      schedule: {
        venueLabel: "State Arena",
        supportEmail: "info@example.com",
        notes: [],
        days: [
          {
            date: "Friday, March 20, 2026",
            shortDate: "Friday • Mar 20",
            sessions: [
              {
                code: "FR1",
                group: null,
                startTime: null,
                warmupTime: null,
                note: null,
                clubs: [],
              },
            ],
          },
        ],
      },
      links: [],
      unmappedFacts: [],
    })!,
    {}
  );

  assert.equal(mapped.advancedSections.schedule.days[0]?.sessions[0]?.code, "FR1");
});

test("mapParseResultToGymData replaces stale derived schedule shells on repair", async () => {
  const mapped = await mapParseResultToGymData(
    normalizeParseResult({
      eventType: "gymnastics_meet",
      documentProfile: "athlete_session",
      title: "Florida Crown Championships",
      dates: "March 13-15, 2026",
      startAt: null,
      endAt: null,
      timezone: "America/New_York",
      venue: "Coral Springs Gymnasium",
      address: "123 Main St, Coral Springs, FL 33065",
      hostGym: "USA Competitions",
      admission: [],
      athlete: {},
      meetDetails: {},
      logistics: {},
      policies: {},
      coachInfo: {},
      contacts: [],
      deadlines: [],
      gear: {},
      volunteers: {},
      communications: {},
      schedule: {
        venueLabel: "Coral Springs Gymnasium",
        supportEmail: "info@usacompetitions.com",
        notes: ["Clubs in pink are competing for Individual & Team awards."],
        days: [
          {
            date: "Friday, March 13, 2026",
            shortDate: "Friday • Mar 13",
            sessions: [
              {
                code: "FR1",
                group: "BRONZE",
                startTime: "8:00am",
                warmupTime: "8:00am",
                note: "Stretch/warmup",
                clubs: [{ name: "Browns Gym", teamAwardEligible: true, athleteCount: 12, divisionLabel: null }],
              },
            ],
          },
          {
            date: "Saturday, March 14, 2026",
            shortDate: "Saturday • Mar 14",
            sessions: [
              {
                code: "SA1",
                group: "LEVELS 1/2/BRONZE",
                startTime: "8:00am",
                warmupTime: "8:00am",
                note: "Stretch/warmup",
                clubs: [{ name: "Academia Atenia", teamAwardEligible: false, athleteCount: null, divisionLabel: null }],
              },
            ],
          },
        ],
      },
      links: [],
      unmappedFacts: [],
    })!,
    {
      discoverySource: {
        extractedText: `
Friday, March 13, 2026
Saturday, March 14, 2026
Sunday, March 15, 2026
        `,
      },
      advancedSections: {
        schedule: {
          enabled: true,
          days: [
            {
              id: "old-fri",
              date: "Friday, March 13, 2026",
              shortDate: "Friday • Mar 13",
              sessions: [
                { id: "fr1", code: "FR1", label: "Session FR1", group: "", startTime: "", warmupTime: "", note: "", clubs: [] },
                { id: "sa1", code: "SA1", label: "Session SA1", group: "", startTime: "", warmupTime: "", note: "", clubs: [] },
                { id: "su1", code: "SU1", label: "Session SU1", group: "", startTime: "", warmupTime: "", note: "", clubs: [] },
              ],
            },
          ],
        },
      },
    },
    {
      sourceType: "file",
      usedOcr: false,
      linkedAssets: [],
      discoveredLinks: [],
      crawledPages: [],
      scheduleDiagnostics: {
        selectedSchedulePages: [1, 2, 3],
        extractedDateLines: [
          "Friday, March 13, 2026",
          "Saturday, March 14, 2026",
          "Sunday, March 15, 2026",
        ],
        parsedFromTextDayCount: 3,
        parsedFromImageDayCount: 0,
        finalDayCount: 3,
        usedImageTableExtraction: false,
        usedTextFallback: true,
        usedImageAwardExtraction: false,
        staleStoredScheduleDetected: false,
      },
    }
  );

  assert.equal(mapped.advancedSections.schedule.days.length, 2);
  assert.equal(mapped.advancedSections.schedule.days[0]?.sessions[0]?.startTime, "8:00am");
  assert.equal(mapped.advancedSections.schedule.days[1]?.sessions[0]?.code, "SA1");
});

test("computeGymBuilderStatuses marks schedule ready when sessions exist", () => {
  const statuses = computeGymBuilderStatuses({
    title: "State Meet",
    date: "2026-03-20",
    timezone: "America/Chicago",
    venue: "State Arena",
    address: "123 Main St, Chicago, IL 60601",
    advancedSections: {
      schedule: {
        enabled: true,
        days: [
          {
            id: "fri",
            date: "Friday, March 20, 2026",
            shortDate: "Friday • Mar 20",
            sessions: [
              {
                id: "fri-1",
                code: "FR1",
                group: "Bronze",
                startTime: "8:00 AM",
                clubs: [{ id: "club-1", name: "Alpha Gym", teamAwardEligible: true }],
              },
            ],
          },
        ],
      },
    },
  });

  assert.equal(statuses.operations.schedule, "ready");
});
