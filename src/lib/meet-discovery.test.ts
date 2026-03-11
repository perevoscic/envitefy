import assert from "node:assert/strict";
import test from "node:test";

import { __testUtils, extractDiscoveryText } from "./meet-discovery";

const {
  deriveDateRangeFromText,
  classifyMeetDateCandidates,
  normalizeParseResult,
  sanitizeDiscoveryParseResult,
  mergeCoachFeesFromAdmission,
  routeCoachDeadlines,
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
