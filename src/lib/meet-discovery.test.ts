import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import { GYM_DISCOVERY_SCHEDULE_GRID_ENABLED } from "./meet-discovery/constants";
import {
  __testUtils,
  buildGymDiscoveryPublicPageArtifacts,
  buildDiscoveryEvidence,
  computeGymBuilderStatuses,
  extractDiscoveryText,
  mapParseResultToGymData,
  parseMeetFromExtractedText,
} from "./meet-discovery";

const {
  deriveDateRangeFromText,
  classifyMeetDateCandidates,
  sanitizeHostGymValue,
  normalizeParseResult,
  normalizeParseClassification,
  inferHeuristicParseClassification,
  selectParsePromptProfiles,
  selectEvidenceForParseProfile,
  mergeParseResultsByProfile,
  sanitizeDiscoveryParseResult,
  mergeCoachFeesFromAdmission,
  routeCoachDeadlines,
  backfillDeterministicParseFields,
  computeParseCompletenessSnapshot,
  computeMappedCompletenessSnapshot,
  determineCompletenessSparsity,
  resolveDiscoveryEventTitle,
  deriveScheduleFromTextFallback,
  deriveScheduleFromExtractedText,
  alignScheduleDatesToEventRange,
  deriveDateRangeFromScheduleDays,
  parseNarrativeScheduleSessionsFromPage,
  parseScheduleAnnotationsFromPages,
  parseScheduleAssignmentsFromPages,
  classifySchedulePageText,
  selectScheduleSegments,
  shouldUseVisualScheduleRepair,
  mergeScheduleWithFallback,
  supplementScheduleWithFallback,
  isStaleDerivedSchedule,
  parseResourceStatusFromLabel,
  classifyResourceLink,
  buildEventFingerprint,
  scoreEventResourceMatch,
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

test("sanitizeHostGymValue strips packet intro prose from host gym text", () => {
  assert.equal(
    sanitizeHostGymValue(
      "Team Twisters & USA Competitions is proud to host the 2026 Florida USA Gymnastics Level 7/9/10 State Championships. Please review the following items enclosed in this packet:"
    ),
    "Team Twisters & USA Competitions"
  );
  assert.equal(
    sanitizeHostGymValue(
      "Recognized at the Awards Ceremony following the last L9 session on Sunday"
    ),
    null
  );
});

test("resolveDiscoveryEventTitle rejects packet section headings in favor of fallback titles", () => {
  assert.equal(
    resolveDiscoveryEventTitle(
      "Club and General Information",
      "2026 Florida USA Gymnastics Xcel Bronze, Silver & Gold State Championships"
    ),
    "2026 Florida USA Gymnastics Xcel Bronze, Silver & Gold State Championships"
  );
});

test("normalizeParseResult ignores legacy schedule color fields while keeping plain schedule data", () => {
  const normalized = normalizeParseResult({
    eventType: "gymnastics_meet",
    documentProfile: "meet_overview",
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
    links: [],
    unmappedFacts: [],
    schedule: {
      venueLabel: "Main arena",
      supportEmail: "info@usacompetitions.com",
      notes: [],
      colorLegend: [{ id: "club-pink", target: "club", colorHex: "#F472B6" }],
      awardLegend: [{ colorHex: "#F472B6", meaning: "Individual & Team Awards" }],
      annotations: [],
      assignments: [],
      days: [
        {
          date: "Friday, March 13, 2026",
          shortDate: "Friday • Mar 13",
          sessions: [
            {
              code: "FR1",
              group: "Bronze",
              startTime: "8:00 AM",
              warmupTime: "8:15 AM",
              note: null,
              color: { legendId: "session-bronze", textColorHex: "#c81e78", confidence: 0.91 },
              clubs: [
                {
                  name: "Browns Gym",
                  teamAwardEligible: true,
                  athleteCount: 24,
                  divisionLabel: null,
                  color: { legendId: "club-pink", textColorHex: "#f472b6", confidence: 0.98 },
                },
              ],
            },
          ],
        },
      ],
    },
  });

  assert.ok(normalized);
  assert.equal("colorLegend" in (normalized?.schedule || {}), false);
  assert.equal("awardLegend" in (normalized?.schedule || {}), false);
  assert.equal("color" in (normalized?.schedule.days[0]?.sessions[0] || {}), false);
  assert.equal("color" in (normalized?.schedule.days[0]?.sessions[0]?.clubs[0] || {}), false);
  assert.equal(normalized?.schedule.days[0]?.sessions[0]?.clubs[0]?.teamAwardEligible, true);
});

test("normalizeParseResult does not coerce titles containing 7/9/10 into calendar timestamps", () => {
  const normalized = normalizeParseResult({
    eventType: "gymnastics_meet",
    documentProfile: "meet_overview",
    title: "2026 Florida USA Gymnastics Level 7/9/10 State Championships",
    dates: "March 20-22, 2026",
    startAt: "2026 Florida USA Gymnastics Level 7/9/10 State Championships",
    endAt: "Level 7/9/10 Florida State Championships 2026",
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
    links: [],
    unmappedFacts: [],
  });

  assert.equal(normalized?.startAt, null);
  assert.equal(normalized?.endAt, null);
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

const pdfFixtureCache = new Map<string, Promise<Awaited<ReturnType<typeof extractDiscoveryText>>>>();

function loadPdfFixture(relPath: string) {
  if (!pdfFixtureCache.has(relPath)) {
    pdfFixtureCache.set(
      relPath,
      (async () => {
        const buffer = fs.readFileSync(path.join(process.cwd(), relPath));
        return extractDiscoveryText(
          {
            type: "file",
            fileName: path.basename(relPath),
            mimeType: "application/pdf",
            sizeBytes: buffer.length,
            dataUrl: `data:application/pdf;base64,${buffer.toString("base64")}`,
          },
          {
            workflow: "gymnastics",
            mode: "enrich",
          }
        );
      })()
    );
  }
  return pdfFixtureCache.get(relPath)!;
}

type MeetDiscoveryExtractionMeta = NonNullable<Parameters<typeof mapParseResultToGymData>[2]>;

function buildExtractionMeta(overrides: Record<string, any> = {}): MeetDiscoveryExtractionMeta {
  return {
    sourceType: "file" as const,
    usedOcr: false,
    linkedAssets: [],
    discoveredLinks: [],
    resourceLinks: [],
    crawledPages: [],
    pageTitle: "",
    textQuality: "good" as const,
    qualitySignals: emptyQualitySignals,
    coachPageHints: [],
    schedulePageTexts: [],
    schedulePageImages: [],
    ...overrides,
  } as MeetDiscoveryExtractionMeta;
}

test("buildGymDiscoveryPublicPageArtifacts strips ops-only fields and creates attendee sections", () => {
  const parseResult = normalizeParseResult({
    eventType: "gymnastics_meet",
    documentProfile: "parent_packet",
    title: "Florida Crown Championships",
    dates: "March 13-15, 2026",
    timezone: "America/New_York",
    venue: "Coral Springs Gymnasium",
    address: "123 Main St, Coral Springs, FL 33065",
    hostGym: "USA Competitions",
    admission: [{ label: "Adults", price: "$20", note: "Cashless" }],
    athlete: { session: "Session 4", team: "Alpha Gymnastics" },
    meetDetails: {
      warmup: "7:00 AM",
      marchIn: "7:30 AM",
      rotationOrder: "Vault > Bars > Beam > Floor",
      doorsOpen: "Doors open at 7:15 AM",
      arrivalGuidance: "Arrive 30 minutes early",
      facilityLayout: "Guest services is in the east hall",
      resultsInfo: "Live scoring is available online",
      operationalNotes: ["Bring athlete card to check-in"],
    },
    logistics: {
      parking: "Park in the north garage",
      trafficAlerts: "Expect heavy traffic from 6:45-8:15 AM",
      parkingLinks: [{ label: "Parking Map", url: "https://example.com/parking" }],
      parkingPricingLinks: [],
    },
    policies: { food: "Outside food is not permitted", misc: [] },
    coachInfo: {
      signIn: "Coaches sign in at the scorer table",
      contacts: [{ role: "Coach", email: "coach@example.com" }],
      entryFees: [{ label: "Entry", amount: "$120" }],
    },
    schedule: {
      venueLabel: "Main hall",
      days: [{ date: "Friday", shortDate: "Fri", sessions: [{ code: "S1", label: "S1", group: "Gold", startTime: "8:00 AM", clubs: [] }] }],
    },
    links: [{ label: "Packet", url: "https://example.com/packet.pdf" }],
  });
  assert.ok(parseResult);
  const artifacts = buildGymDiscoveryPublicPageArtifacts({
    parseResult,
    extractionMeta: buildExtractionMeta({
      resourceLinks: [{ kind: "packet", status: "posted", label: "Packet", url: "https://example.com/packet.pdf" }],
    }),
  });

  assert.equal(artifacts.pipelineVersion, "gym-public-v2");
  assert.equal(artifacts.parseResult.athlete.session, null);
  assert.equal(artifacts.parseResult.coachInfo.signIn, null);
  assert.equal(artifacts.parseResult.schedule.days.length, 0);
  assert.equal(artifacts.parseResult.meetDetails.warmup, null);
  assert.match(artifacts.publicPageSections.meetDetails?.body || "", /Florida Crown Championships|Doors open/i);
  assert.match(artifacts.publicPageSections.parking?.body || "", /north garage|Parking details/i);
  assert.match(artifacts.publicPageSections.traffic?.body || "", /traffic|arrival/i);
  assert.equal(artifacts.publicPageSections.meetDetails?.visibility, "visible");
  assert.equal(artifacts.publicPageSections.documents?.visibility, "hidden");
  assert.equal(artifacts.publishAssessment.state, "auto_publish");
});

test("mapParseResultToGymData uses public-page-v2 summaries and suppresses schedule/coaches", async () => {
  const parseResult = normalizeParseResult({
    eventType: "gymnastics_meet",
    documentProfile: "parent_packet",
    title: "Florida Crown Championships",
    dates: "March 13-15, 2026",
    startAt: "2026-03-13T12:00:00.000Z",
    timezone: "America/New_York",
    venue: "Coral Springs Gymnasium",
    address: "123 Main St, Coral Springs, FL 33065",
    meetDetails: {
      doorsOpen: "Doors open at 7:15 AM",
      arrivalGuidance: "Arrive 30 minutes early",
      operationalNotes: ["Bring athlete card to check-in"],
    },
    logistics: {
      parking: "Park in the north garage",
      trafficAlerts: "Expect heavy traffic from 6:45-8:15 AM",
      hotel: "Host hotels are posted on the event site",
      parkingLinks: [{ label: "Parking Map", url: "https://example.com/parking" }],
      parkingPricingLinks: [],
    },
    links: [{ label: "Packet", url: "https://example.com/packet.pdf" }],
  });
  assert.ok(parseResult);

  const mapped = await mapParseResultToGymData(
    parseResult,
    {
      discoverySource: {
        pipelineVersion: "gym-public-v2",
        extractedText: parentPacketFixture,
      },
    },
    buildExtractionMeta({
      resourceLinks: [{ kind: "packet", status: "posted", label: "Packet", url: "https://example.com/packet.pdf" }],
    })
  );

  assert.match(mapped.details || "", /Florida Crown Championships|Doors open/i);
  assert.equal(mapped.advancedSections.coaches.enabled, false);
  assert.equal(mapped.advancedSections.schedule.enabled, false);
  assert.deepEqual(mapped.advancedSections.roster.athletes, []);
  assert.match(mapped.advancedSections.logistics.parking || "", /north garage|Parking details/i);
});

const parentPacketFixture = `
2026 Florida Crown Championships
March 13-15, 2026
Coral Springs Gymnasium
Doors Open 7:15 AM
Spectator Admission: Adult $20 / Child $10 / Weekend Pass $45
Parking is available in the north garage. Expect heavy traffic near the venue from 6:45-8:15 AM.
Guest services is located in the east hall. Outside food is not permitted.
Service animals are allowed in accordance with venue policy.
`;

const registrationPacketFixture = `
2026 Florida Crown Championships
Hosted by USA Competitions
Entry Fee: $145 per athlete
Team Fee: $60 per team
Late Fee: $25 after February 28, 2026
Refund requests must be submitted by March 1, 2026.
All entries must be submitted in Meet Maker.
Coach sign-in opens at 6:30 AM. Floor music must be uploaded before the session.
Meet Director: Jamie Coach jamie@example.com 555-333-2222
`;

const athleteSessionFixture = `
2026 Florida Crown Championships
March 13-15, 2026
Session A - Level 8 Seniors
Stretch 7:30 AM
Warm Up 7:45 AM
March In 8:05 AM
Awards immediately following Session A in Awards Hall
Assigned Gym: Arena B
Rotation Order: Vault, Bars, Beam, Floor
`;

const mixedPacketFixture = `
2026 Florida Crown Championships
March 13-15, 2026
Entry Fee: $145 per athlete
Late Fee: $25 after February 28, 2026
Coach sign-in opens at 6:30 AM.
Spectator Admission: Adult $20 / Child $10
Parking is available in the north garage.
Session A - Level 8 Seniors
Stretch 7:30 AM
March In 8:05 AM
`;

test("heuristic classifier separates parent, registration, athlete, and mixed fixture types", () => {
  const cases = [
    {
      text: parentPacketFixture,
      meta: buildExtractionMeta({ pageTitle: "Parent Packet" }),
      expectedProfile: "parent_packet",
      expectedFlags: { parentPacketHeavy: true, registrationHeavy: false, scheduleHeavy: false, mixed: false },
      expectedPrompts: ["parent_public"],
    },
    {
      text: registrationPacketFixture,
      meta: buildExtractionMeta({
        pageTitle: "Registration Packet",
        coachPageHints: [{ page: 2, heading: "Coach Information", excerpt: "Coach sign-in opens at 6:30 AM." }],
      }),
      expectedProfile: "registration_packet",
      expectedFlags: { parentPacketHeavy: false, registrationHeavy: true, scheduleHeavy: false, mixed: false },
      expectedPrompts: ["registration_coach"],
    },
    {
      text: athleteSessionFixture,
      meta: buildExtractionMeta({
        pageTitle: "Session A Schedule",
        schedulePageTexts: [{ pageNumber: 3, text: athleteSessionFixture }],
      }),
      expectedProfile: "athlete_session",
      expectedFlags: { parentPacketHeavy: false, registrationHeavy: false, scheduleHeavy: true, mixed: false },
      expectedPrompts: GYM_DISCOVERY_SCHEDULE_GRID_ENABLED ? ["athlete_session"] : ["overview_core"],
    },
    {
      text: mixedPacketFixture,
      meta: buildExtractionMeta({
        pageTitle: "Mixed Packet",
        coachPageHints: [{ page: 2, heading: "Coach Information", excerpt: "Coach sign-in opens at 6:30 AM." }],
        schedulePageTexts: [{ pageNumber: 4, text: "Session A\nStretch 7:30 AM\nMarch In 8:05 AM" }],
      }),
      expectedProfile: "registration_packet",
      expectedFlags: { parentPacketHeavy: true, registrationHeavy: true, scheduleHeavy: false, mixed: true },
      expectedPrompts: ["registration_coach", "parent_public"],
    },
  ] as const;

  for (const fixture of cases) {
    const evidence = buildDiscoveryEvidence(fixture.text, fixture.meta);
    const classification = inferHeuristicParseClassification(evidence, fixture.meta);
    assert.equal(classification.eventType, "gymnastics_meet");
    assert.equal(classification.documentProfile, fixture.expectedProfile);
    assert.deepEqual(classification.contentMix, fixture.expectedFlags);
    assert.deepEqual(selectParsePromptProfiles(classification), fixture.expectedPrompts);
  }
});

test("selectEvidenceForParseProfile narrows evidence and excerpts per targeted extractor", () => {
  const extractionMeta = buildExtractionMeta({
    pageTitle: "Mixed Packet",
    coachPageHints: [{ page: 2, heading: "Coach Information", excerpt: "Coach sign-in opens at 6:30 AM." }],
    schedulePageTexts: [{ pageNumber: 4, text: "Session A\nStretch 7:30 AM\nMarch In 8:05 AM" }],
  });
  const evidence = buildDiscoveryEvidence(mixedPacketFixture, extractionMeta);

  const parent = selectEvidenceForParseProfile(
    "parent_public",
    mixedPacketFixture,
    evidence,
    extractionMeta
  );
  assert.ok(parent.evidenceLabels.includes("spectator"));
  assert.ok(parent.evidenceLabels.includes("traffic"));
  assert.ok(!parent.evidenceLabels.includes("coachPageHints"));
  assert.ok(parent.excerpts.some((item) => /Spectator Admission|Parking/i.test(item.text)));

  const registration = selectEvidenceForParseProfile(
    "registration_coach",
    mixedPacketFixture,
    evidence,
    extractionMeta
  );
  assert.ok(registration.evidenceLabels.includes("coachPageHints"));
  assert.ok(registration.evidenceLabels.includes("registration"));
  assert.ok(registration.excerpts.some((item) => /Entry Fee|Coach sign-in/i.test(item.text)));

  const athlete = selectEvidenceForParseProfile(
    "athlete_session",
    mixedPacketFixture,
    evidence,
    extractionMeta
  );
  assert.ok(athlete.evidenceLabels.includes("schedulePages"));
  assert.ok(athlete.excerpts.some((item) => /Session A|Stretch 7:30 AM|March In/i.test(item.text)));
});

test("mergeParseResultsByProfile uses deterministic precedence across targeted outputs", () => {
  const overview = normalizeParseResult({
    eventType: "gymnastics_meet",
    documentProfile: "meet_overview",
    title: "Florida Crown Championships",
    dates: "March 13-15, 2026",
    timezone: "America/New_York",
    venue: "Coral Springs Gymnasium",
    address: "123 Main St, Coral Springs, FL 33065",
    links: [{ label: "Main packet", url: "https://example.com/packet.pdf" }],
    athlete: {},
    meetDetails: { resultsInfo: "Live scoring on MeetScoresOnline" },
    logistics: {},
    policies: {},
    coachInfo: {},
    contacts: [],
    deadlines: [],
    gear: {},
    volunteers: {},
    communications: {},
    unmappedFacts: [],
  })!;
  const registration = normalizeParseResult({
    eventType: "gymnastics_meet",
    documentProfile: "registration_packet",
    title: "",
    dates: "",
    athlete: {},
    meetDetails: { registrationInfo: "Use Meet Maker for entries." },
    logistics: {},
    policies: {},
    coachInfo: {
      signIn: "Coach sign-in opens at 6:30 AM.",
      entryFees: [{ label: "Entry Fee", amount: "$145", note: null }],
      contacts: [{ role: "Meet Director", name: "Jamie Coach", email: "jamie@example.com", phone: null }],
    },
    contacts: [],
    deadlines: [],
    gear: {},
    volunteers: {},
    communications: {},
    links: [],
    unmappedFacts: [],
  })!;
  const athlete = normalizeParseResult({
    eventType: "gymnastics_meet",
    documentProfile: "athlete_session",
    title: "",
    dates: "",
    athlete: {
      session: "Session A",
      assignedGym: "Arena B",
    },
    meetDetails: {
      warmup: "7:45 AM",
      marchIn: "8:05 AM",
      rotationOrder: "Vault, Bars, Beam, Floor",
    },
    logistics: {},
    policies: {},
    coachInfo: {},
    contacts: [],
    deadlines: [],
    gear: {},
    volunteers: {},
    communications: {},
    links: [],
    unmappedFacts: [],
  })!;
  const merged = mergeParseResultsByProfile([
    { profile: "registration_coach", result: registration },
    { profile: "athlete_session", result: athlete },
    { profile: "overview_core", result: overview },
  ]);

  assert.equal(merged.title, "Florida Crown Championships");
  assert.equal(merged.venue, "Coral Springs Gymnasium");
  assert.equal(merged.meetDetails.registrationInfo, "Use Meet Maker for entries.");
  assert.equal(merged.coachInfo.signIn, "Coach sign-in opens at 6:30 AM.");
  assert.equal(merged.athlete.assignedGym, "Arena B");
  assert.equal(merged.meetDetails.rotationOrder, "Vault, Bars, Beam, Floor");
  assert.equal(merged.links[0]?.url, "https://example.com/packet.pdf");
});

test("normalizeParseClassification repairs invalid classifier payloads to stable enums", () => {
  const normalized = normalizeParseClassification({
    eventType: "not-real",
    documentProfile: "weird",
    confidence: "0.91",
    contentMix: {
      scheduleHeavy: 1,
      registrationHeavy: 0,
      parentPacketHeavy: true,
      mixed: false,
    },
  });
  assert.deepEqual(normalized, {
    eventType: "unknown",
    documentProfile: "unknown",
    confidence: 0.91,
    contentMix: {
      scheduleHeavy: true,
      registrationHeavy: false,
      parentPacketHeavy: true,
      mixed: false,
    },
  });
});

test("completeness audit helpers backfill core fields and identify sparse stage", async () => {
  const extractionMeta = buildExtractionMeta({
    pageTitle: "2026 Florida Crown Championships",
  });
  const evidence = buildDiscoveryEvidence(parentPacketFixture, extractionMeta);
  const raw = normalizeParseResult({
    eventType: "gymnastics_meet",
    documentProfile: "parent_packet",
    title: "",
    dates: "",
    athlete: {},
    meetDetails: {
      operationalNotes: ["Visit Lauderdale is a sponsor and encourages visitors to tag #VisitLauderdale."],
    },
    logistics: {},
    policies: {},
    coachInfo: {},
    contacts: [],
    deadlines: [],
    gear: {
      uniform: "Venue is chilly inside. Bring a jacket.",
    },
    volunteers: {},
    communications: {},
    links: [],
    unmappedFacts: [],
  })!;
  const rawSnapshot = computeParseCompletenessSnapshot(raw);
  const sanitized = sanitizeDiscoveryParseResult(raw);
  const sanitizedSnapshot = computeParseCompletenessSnapshot(sanitized);
  const backfilled = backfillDeterministicParseFields(
    sanitized,
    evidence,
    "2026 Florida Crown Championships"
  );
  const backfilledSnapshot = computeParseCompletenessSnapshot(backfilled);

  assert.ok(backfilledSnapshot.core.score > sanitizedSnapshot.core.score);
  assert.equal(determineCompletenessSparsity(6, 0.1, 0.1, 0.1), "extraction");
  assert.equal(determineCompletenessSparsity(1, 0.8, 0.4, 0.4), "sanitization");
  assert.equal(determineCompletenessSparsity(1, 0.8, 0.8, 0.3), "mapping");

  const mappedMeta = buildExtractionMeta({
    pageTitle: "2026 Florida Crown Championships",
  });
  const mapped = await mapParseResultToGymData(
    sanitized,
    {
      discoverySource: {
        extractedText: parentPacketFixture,
        extractionMeta: mappedMeta,
      },
      advancedSections: {},
    },
    mappedMeta
  );
  const mappedSnapshot = computeMappedCompletenessSnapshot(mapped);
  assert.ok(mappedSnapshot.core.score > 0);
  assert.ok(mappedMeta.parseDiagnostics?.completeness);
  assert.ok(
    mappedMeta.parseDiagnostics?.completeness?.sectionScores?.core?.backfilled >=
      rawSnapshot.core.score
  );
});

test("fixture PDFs expose packet-aware resource links and schedule pages from file extraction", async () => {
  const parent = await loadPdfFixture("docs/2026wgaspparentinfo.pdf");
  const men = await loadPdfFixture("docs/2026gaspinfomen.pdf");
  const xcel = await loadPdfFixture(
    "docs/Xcel-BSG-State-2026-Info-Schedule-Updated-3.22-Afternoon.pdf"
  );
  const state710 = await loadPdfFixture("docs/2026-7.9.10-State-Info-3.4.264.pdf");
  const crown = await loadPdfFixture("docs/2026-FL-Crown-Event-Schedule-Info-Packet-3.8.26.pdf");

  assert.ok(
    (parent.extractionMeta.resourceLinks ?? []).filter((item: any) => item.kind === "parking")
      .length >= 3
  );
  assert.ok(
    parent.extractionMeta.resourceLinks?.some((item: any) =>
      /location of lots and garages|rates|pay by mobile app|pay by phone parking/i.test(
        item.label
      )
    )
  );

  assert.equal((men.extractionMeta.schedulePageTexts || []).length, 0);

  if (GYM_DISCOVERY_SCHEDULE_GRID_ENABLED) {
    assert.ok((xcel.extractionMeta.schedulePageTexts || []).length >= 2);
  } else {
    assert.equal((xcel.extractionMeta.schedulePageTexts || []).length, 0);
  }
  assert.ok(
    xcel.extractionMeta.resourceLinks?.some((item: any) => item.kind === "hotel_booking")
  );

  assert.ok(
    state710.extractionMeta.resourceLinks?.some((item: any) => item.kind === "rotation_hub")
  );
  assert.ok(
    state710.extractionMeta.resourceLinks?.some((item: any) => item.kind === "hotel_booking")
  );

  if (GYM_DISCOVERY_SCHEDULE_GRID_ENABLED) {
    assert.ok((crown.extractionMeta.schedulePageTexts || []).length >= 3);
  } else {
    assert.equal((crown.extractionMeta.schedulePageTexts || []).length, 0);
  }
  assert.ok(
    crown.extractionMeta.resourceLinks?.some((item: any) => item.kind === "admission")
  );
  assert.ok(
    crown.extractionMeta.resourceLinks?.some((item: any) => item.kind === "hotel_booking")
  );
  assert.ok(
    crown.extractionMeta.resourceLinks?.some((item: any) => item.kind === "rotation_hub")
  );
});

test("xcel mixed fixture classifies attendee-safe resource routing and hides ops links", async () => {
  const xcel = await loadPdfFixture(
    "docs/Xcel-BSG-State-2026-Info-Schedule-Updated-3.22-Afternoon.pdf"
  );
  const resourceLinks = Array.isArray(xcel.extractionMeta.resourceLinks)
    ? xcel.extractionMeta.resourceLinks
    : [];

  assert.ok(
    resourceLinks.some(
      (item: any) =>
        item.kind === "hotel_booking" &&
        item.audience === "public_attendee" &&
        item.renderTarget === "hotels"
    )
  );
  assert.ok(
    resourceLinks.some(
      (item: any) =>
        ["results_hub", "results_live", "results_pdf"].includes(item.kind) &&
        item.audience === "public_attendee" &&
        item.renderTarget === "results"
    )
  );
  assert.ok(
    resourceLinks.every((item: any) =>
      item.kind === "team_divisions" || item.kind === "roster"
        ? item.renderTarget === "hidden"
        : true
    )
  );
  assert.ok(
    resourceLinks.every((item: any) =>
      item.kind === "packet" && !/faq|program|guide/i.test(item.label)
        ? item.renderTarget === "hidden"
        : true
    )
  );
});

test("fixture PDFs classify into parent, registration, and mixed schedule-plus-coach packet shapes", async () => {
  const parent = await loadPdfFixture("docs/2026wgaspparentinfo.pdf");
  const men = await loadPdfFixture("docs/2026gaspinfomen.pdf");
  const xcel = await loadPdfFixture(
    "docs/Xcel-BSG-State-2026-Info-Schedule-Updated-3.22-Afternoon.pdf"
  );
  const state710 = await loadPdfFixture("docs/2026-7.9.10-State-Info-3.4.264.pdf");
  const crown = await loadPdfFixture("docs/2026-FL-Crown-Event-Schedule-Info-Packet-3.8.26.pdf");

  const parentClassification = inferHeuristicParseClassification(
    buildDiscoveryEvidence(parent.extractedText, parent.extractionMeta),
    parent.extractionMeta
  );
  assert.equal(parentClassification.documentProfile, "parent_packet");
  assert.deepEqual(selectParsePromptProfiles(parentClassification), ["parent_public"]);

  const menClassification = inferHeuristicParseClassification(
    buildDiscoveryEvidence(men.extractedText, men.extractionMeta),
    men.extractionMeta
  );
  assert.equal(menClassification.documentProfile, "registration_packet");
  assert.deepEqual(selectParsePromptProfiles(menClassification), ["registration_coach"]);

  for (const fixture of [xcel, state710, crown]) {
    const classification = inferHeuristicParseClassification(
      buildDiscoveryEvidence(fixture.extractedText, fixture.extractionMeta),
      fixture.extractionMeta
    );
    assert.equal(classification.contentMix.mixed, true);
    if (GYM_DISCOVERY_SCHEDULE_GRID_ENABLED) {
      assert.equal(classification.contentMix.scheduleHeavy, true);
      assert.deepEqual(selectParsePromptProfiles(classification), [
        "athlete_session",
        "registration_coach",
      ]);
    } else {
      assert.deepEqual(selectParsePromptProfiles(classification), [
        "overview_core",
        "registration_coach",
      ]);
    }
  }
});

test("fixture-derived backfills reject posting metadata and section headings", async () => {
  const crown = await loadPdfFixture("docs/2026-FL-Crown-Event-Schedule-Info-Packet-3.8.26.pdf");
  const xcel = await loadPdfFixture(
    "docs/Xcel-BSG-State-2026-Info-Schedule-Updated-3.22-Afternoon.pdf"
  );

  const crownEvidence = buildDiscoveryEvidence(crown.extractedText, crown.extractionMeta);
  assert.equal(crownEvidence.dateAnalysis.primaryCandidate?.label, "March 13-15, 2026");

  const xcelFallbackTitle =
    "2026 Florida USA Gymnastics Xcel Bronze, Silver & Gold State Championships";
  const backfilled = backfillDeterministicParseFields(
    normalizeParseResult({
      eventType: "gymnastics_meet",
      documentProfile: "meet_overview",
      title: "Club and General Information",
      dates: "",
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
      schedule: {},
      links: [],
      unmappedFacts: [],
    })!,
    buildDiscoveryEvidence(xcel.extractedText, xcel.extractionMeta),
    xcelFallbackTitle
  );

  assert.equal(backfilled.title, xcelFallbackTitle);
});

test("fixture-derived schedule parsing keeps assignments for mixed packets and stays blank for registration-only docs", async (t) => {
  if (!GYM_DISCOVERY_SCHEDULE_GRID_ENABLED) {
    t.skip("Set GYM_DISCOVERY_SCHEDULE_GRID_ENABLED=1 for PDF schedule fixture coverage");
    return;
  }
  const men = await loadPdfFixture("docs/2026gaspinfomen.pdf");
  const xcel = await loadPdfFixture(
    "docs/Xcel-BSG-State-2026-Info-Schedule-Updated-3.22-Afternoon.pdf"
  );
  const state710 = await loadPdfFixture("docs/2026-7.9.10-State-Info-3.4.264.pdf");
  const crown = await loadPdfFixture("docs/2026-FL-Crown-Event-Schedule-Info-Packet-3.8.26.pdf");

  const menSchedule = await deriveScheduleFromExtractedText(
    men.extractedText,
    men.extractionMeta
  );
  assert.equal(menSchedule.schedule.days.length, 0);
  assert.equal((menSchedule.schedule.assignments ?? []).length, 0);

  const xcelSchedule = await deriveScheduleFromExtractedText(
    xcel.extractedText,
    xcel.extractionMeta
  );
  assert.ok(xcelSchedule.schedule.days.length > 0);
  assert.ok((xcelSchedule.schedule.assignments ?? []).length > 0);

  const state710Schedule = await deriveScheduleFromExtractedText(
    state710.extractedText,
    state710.extractionMeta
  );
  assert.ok(state710Schedule.schedule.days.length > 0);
  assert.ok((state710Schedule.schedule.assignments ?? []).length > 0);

  const crownSchedule = await deriveScheduleFromExtractedText(
    crown.extractedText,
    crown.extractionMeta
  );
  assert.ok(crownSchedule.schedule.days.length > 0);
});

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

test("resource helpers classify statuses, kinds, and reject conflicting hub dates", () => {
  assert.deepEqual(parseResourceStatusFromLabel("Rotation Sheets (Not yet posted)"), {
    status: "not_posted",
    cleanedLabel: "Rotation Sheets",
    availabilityText: "Not yet posted",
    availabilityDate: null,
  });
  assert.equal(
    classifyResourceLink(
      "Official Results",
      "https://results.scorecatonline.com/meet/2026-level-7-9-10-state",
      "text/html"
    ),
    "results_live"
  );
  assert.equal(
    classifyResourceLink(
      "Team Divisions PDF",
      "https://usacompetitions.com/docs/team-divisions.pdf",
      "application/pdf"
    ),
    "team_divisions"
  );
  assert.equal(
    classifyResourceLink(
      "Schedule & Info",
      "https://usacompetitions.com/docs/state-info.pdf",
      "application/pdf"
    ),
    "packet"
  );
  assert.equal(
    classifyResourceLink(
      "Rosters",
      "https://usacompetitions.com/docs/rosters.pdf",
      "application/pdf"
    ),
    "roster"
  );

  const fingerprint = buildEventFingerprint(
    new URL("https://usacompetitions.com/2026-level-7-9-10-state-championships/"),
    "2026 Level 7/9/10 State Championships",
    "March 20-22, 2026",
    "March 20-22, 2026 Coral Springs Gymnasium Coral Springs, FL"
  );
  const match = scoreEventResourceMatch(
    fingerprint,
    "Official Results March 13-15, 2026 Florida Crown Championships",
    "Official Results",
    "https://usacompetitions.com/results/florida-crown"
  );
  assert.equal(match.hardReject, true);
  assert.match(match.reason, /conflicting dates/i);
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

test("mergeScheduleWithFallback ignores legacy schedule color metadata while preserving plain schedule content", () => {
  const merged = mergeScheduleWithFallback(
    {
      venueLabel: null,
      supportEmail: null,
      notes: [],
      colorLegend: [
        {
          id: "club-pink",
          target: "club",
          colorHex: "#f472b6",
          colorLabel: null,
          meaning: null,
          sourceText: null,
          teamAwardEligible: null,
        },
      ],
      awardLegend: [
        {
          colorHex: "#f472b6",
          colorLabel: null,
          meaning: "Individual & Team Awards",
          teamAwardEligible: null,
        },
      ],
      annotations: [],
      assignments: [],
      days: [
        {
          date: "Friday, March 13, 2026",
          shortDate: "Friday • Mar 13",
          sessions: [
            {
              code: "FR1",
              group: "Bronze",
              startTime: "8:00 AM",
              warmupTime: null,
              note: null,
              color: { legendId: "session-bronze", textColorHex: "#c81e78", confidence: 0.9 },
              clubs: [],
            },
          ],
        },
      ],
    },
    {
      venueLabel: null,
      supportEmail: null,
      notes: [],
      colorLegend: [],
      awardLegend: [],
      annotations: [],
      assignments: [],
      days: [
        {
          date: "Friday, March 13, 2026",
          shortDate: "Friday • Mar 13",
          sessions: [
            {
              code: "FR1",
              group: "Bronze",
              startTime: "8:00 AM",
              warmupTime: null,
              note: null,
              clubs: [
                {
                  name: "Browns Gym",
                  teamAwardEligible: true,
                  athleteCount: 24,
                  divisionLabel: null,
                  color: { legendId: "club-pink", textColorHex: "#f472b6", confidence: 0.96 },
                },
              ],
            },
          ],
        },
      ],
    }
  );

  assert.equal("colorLegend" in merged, false);
  assert.equal("awardLegend" in merged, false);
  assert.equal("color" in (merged.days[0]?.sessions[0] || {}), false);
  assert.equal("color" in (merged.days[0]?.sessions[0]?.clubs[0] || {}), false);
  assert.equal(merged.days[0]?.sessions[0]?.clubs[0]?.teamAwardEligible, true);
});

test("normalizeParseResult ignores legacy color fields on schedule reparses", () => {
  const normalized = normalizeParseResult({
    eventType: "gymnastics_meet",
    documentProfile: "meet_overview",
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
    links: [],
    unmappedFacts: [],
    schedule: {
      venueLabel: "Main arena",
      supportEmail: "info@usacompetitions.com",
      notes: [],
      colorLegend: [
        {
          id: "club-pink",
          target: "club",
          colorHex: "#F472B6",
          colorLabel: "Pink",
          meaning: "Individual & Team Awards",
          sourceText: "Clubs in pink are competing for Individual & Team awards.",
          teamAwardEligible: true,
        },
      ],
      awardLegend: [],
      annotations: [],
      assignments: [],
      days: [
        {
          date: "Friday, March 13, 2026",
          shortDate: "Friday • Mar 13",
          sessions: [
            {
              code: "FR1",
              group: "Bronze",
              startTime: "8:00 AM",
              warmupTime: "8:15 AM",
              note: null,
              color: { legendId: "session-bronze", textColorHex: "#c81e78", confidence: 0.91 },
              clubs: [
                {
                  name: "Browns Gym",
                  teamAwardEligible: true,
                  athleteCount: 24,
                  divisionLabel: null,
                  color: { legendId: "club-pink", textColorHex: "#f472b6", confidence: 0.98 },
                },
              ],
            },
          ],
        },
      ],
    },
  });

  assert.ok(normalized);
  assert.equal("colorLegend" in (normalized?.schedule || {}), false);
  assert.equal("awardLegend" in (normalized?.schedule || {}), false);
  assert.equal("color" in (normalized?.schedule.days[0]?.sessions[0] || {}), false);
  assert.equal("color" in (normalized?.schedule.days[0]?.sessions[0]?.clubs[0] || {}), false);
  assert.equal(normalized?.schedule.days[0]?.sessions[0]?.clubs[0]?.teamAwardEligible, true);
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

test("extractDiscoveryText persists canonical resource links, fetches trusted externals, and rejects conflicting hub results", async (t) => {
  const rootUrl = "https://usacompetitions.com/2026-level-7-9-10-state-championships/";
  const packetUrl = "https://usacompetitions.com/docs/state-packet.pdf";
  const rosterUrl = "https://usacompetitions.com/docs/state-roster.pdf";
  const divisionsUrl = "https://usacompetitions.com/docs/team-divisions.pdf";
  const resultsHubUrl = "https://usacompetitions.com/results/";
  const rotationHubUrl = "https://usacompetitions.com/rotation-sheets/";
  const hotelUrl = "https://api.groupbook.io/booking/state-host-hotel";
  const photoUrl = "https://form.jotform.com/host/state-photo-video";
  const wrongResultsUrl = "https://results.scorecatonline.com/florida-crown-results";
  const unrelatedExternalUrl = "https://example.org/random-hotel";
  const fetchCalls: string[] = [];

  t.after(() => resetUrlDiscoveryTestHooks());
  setUrlDiscoveryTestHooks({
    fetchWithLimit: async (url: string) => {
      fetchCalls.push(url);
      if (url === rootUrl) {
        const text = `
          <html>
            <head><title>2026 Level 7/9/10 State Championships</title></head>
            <body>
              March 20-22, 2026
              Coral Springs Gymnasium
              <a href="/docs/state-packet.pdf">State Packet (Posted Mar 4th)</a>
              <a href="/docs/state-roster.pdf">Athlete & Coach Registration Roster</a>
              <a href="/docs/team-divisions.pdf">Team Divisions</a>
              <a href="${hotelUrl}">Host Hotel Booking</a>
              <a href="${photoUrl}">Photo / Video Order Form</a>
              <a href="/results/">Official Results</a>
              <a href="/rotation-sheets/">Rotation Sheets (Not yet posted)</a>
              <a href="${unrelatedExternalUrl}">Random External</a>
            </body>
          </html>
        `;
        return { contentType: "text/html", buffer: Buffer.from(text), text };
      }
      if (url === resultsHubUrl) {
        const text = `
          <html>
            <head><title>Results Hub</title></head>
            <body>
              <a href="${wrongResultsUrl}">March 13-15, 2026 Results</a>
            </body>
          </html>
        `;
        return { contentType: "text/html", buffer: Buffer.from(text), text };
      }
      if (url === rotationHubUrl) {
        const text = `
          <html>
            <head><title>Rotation Sheets</title></head>
            <body>
              Rotation sheets hub. No event PDF posted yet.
            </body>
          </html>
        `;
        return { contentType: "text/html", buffer: Buffer.from(text), text };
      }
      if (url === packetUrl || url === rosterUrl || url === divisionsUrl) {
        return {
          contentType: "application/pdf",
          buffer: Buffer.from(`pdf:${url}`),
          text: "",
        };
      }
      if (url === hotelUrl) {
        const text = `
          <html>
            <head><title>State Host Hotel</title></head>
            <body>
              Groupbook reservation deadline March 1, 2026. Host hotel: Riverside Hotel, 620 Main St, Coral Springs, FL.
            </body>
          </html>
        `;
        return { contentType: "text/html", buffer: Buffer.from(text), text };
      }
      if (url === photoUrl) {
        const text = `
          <html><head><title>State Meet Photo Orders</title></head><body>Photo and video ordering form.</body></html>
        `;
        return { contentType: "text/html", buffer: Buffer.from(text), text };
      }
      if (url === wrongResultsUrl) {
        const text = `
          <html><head><title>Florida Crown Results</title></head><body>March 13-15, 2026 Florida Crown Championships.</body></html>
        `;
        return { contentType: "text/html", buffer: Buffer.from(text), text };
      }
      throw new Error(`Unexpected fetch: ${url}`);
    },
    extractTextFromPdf: async (buffer: Buffer) => ({
      text: buffer.toString("utf8"),
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
  const resourceLinks = result.extractionMeta.resourceLinks || [];

  assert.ok(resourceLinks.some((item: any) => item.kind === "packet" && item.url === packetUrl));
  assert.ok(resourceLinks.some((item: any) => item.kind === "roster" && item.url === rosterUrl));
  assert.ok(
    resourceLinks.some((item: any) => item.kind === "team_divisions" && item.url === divisionsUrl)
  );
  assert.ok(
    resourceLinks.some((item: any) => item.kind === "hotel_booking" && item.url === hotelUrl)
  );
  assert.ok(resourceLinks.some((item: any) => item.kind === "photo_video" && item.url === photoUrl));
  assert.ok(resourceLinks.some((item: any) => item.kind === "results_hub" && item.url === resultsHubUrl));
  assert.ok(
    resourceLinks.some(
      (item: any) =>
        item.kind === "rotation_hub" &&
        item.url === rotationHubUrl &&
        item.status === "not_posted"
    )
  );
  assert.ok(
    !resourceLinks.some((item: any) => item.kind === "results_live" && item.url === wrongResultsUrl)
  );
  assert.ok(!fetchCalls.includes(unrelatedExternalUrl), "expected non-whitelisted external links to stay unfetched");
  assert.match(result.extractedText, /Groupbook reservation deadline March 1, 2026/i);
  assert.match(result.extractedText, /Photo and video ordering form/i);
});

test("extractDiscoveryText contextualizes generic click-here resource links and keeps media resources out of photo-video", async (t) => {
  const rootUrl = "https://usagym.org/events/2026-mens-eastern-national-championships/";
  const parkingUrl = "https://static.usagym.org/PDFs/Men/events/24eastern_parking.jpg";
  const photoUrl = "https://pci.jotform.com/form/260264120380142";
  const hotelUrl = "https://app.eventpipe.com/event/3a7535fa-4825-4591-a651-76088cdf701c/book/";
  const apparelUrl =
    "https://forms.office.com/Pages/ResponsePage.aspx?id=tsdG2kR_OkyBTuWoxa1Dv4DHFmJf-E5EnPHQicjWXmtUOEw5S1FGMVJCUzA0N0xVUlhVRlYwVjRUNi4u";
  const mediaUrl = "https://usagym.org/pressbox/";

  t.after(() => resetUrlDiscoveryTestHooks());
  setUrlDiscoveryTestHooks({
    fetchWithLimit: async (url: string) => {
      if (url === rootUrl) {
        const text = `
          <html>
            <head><title>2026 Men’s Eastern National Championships</title></head>
            <body>
              <div class="pageSectionHeader">Parking</div>
              <p>Paid Parking Garage<br /><a href="${parkingUrl}">Click here</a> for directions to the parking garage.</p>
              <hr />
              <div class="pageSectionHeader">Photo/Video</div>
              <p>EBS Productions will be onsite taking pictures and videos. Please <a href="${photoUrl}">click here</a> to view the order form.</p>
              <hr />
              <div class="pageSectionHeader">Hotel Information</div>
              <p><a href="${hotelUrl}">Click here</a> to make hotel reservations.</p>
              <hr />
              <div class="pageSectionHeader">Apparel Sizing Form</div>
              <p><a href="${apparelUrl}">Click here</a> to complete the sizing e-form.</p>
              <hr />
              <div class="pageSectionHeader">Links</div>
              <p><a href="${mediaUrl}">Media Resources</a></p>
            </body>
          </html>
        `;
        return { contentType: "text/html", buffer: Buffer.from(text), text };
      }
      if (url === parkingUrl) {
        return {
          contentType: "image/jpeg",
          buffer: Buffer.from("parking map text"),
          text: "",
        };
      }
      if (url === photoUrl) {
        const text = `<html><head><title>Photo Orders</title></head><body>Photo and video ordering form.</body></html>`;
        return { contentType: "text/html", buffer: Buffer.from(text), text };
      }
      if (url === hotelUrl) {
        const text = `<html><head><title>Hotel Reservations</title></head><body>Book hotel reservations for traveling families.</body></html>`;
        return { contentType: "text/html", buffer: Buffer.from(text), text };
      }
      throw new Error(`Unexpected fetch: ${url}`);
    },
    extractTextFromPdf: async (buffer: Buffer) => ({
      text: buffer.toString("utf8"),
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
  const resourceLinks = result.extractionMeta.resourceLinks || [];

  assert.ok(
    resourceLinks.some(
      (item: any) =>
        item.kind === "parking" &&
        item.url === parkingUrl &&
        item.label === "Parking Garage Directions"
    )
  );
  assert.ok(
    resourceLinks.some(
      (item: any) =>
        item.kind === "photo_video" &&
        item.url === photoUrl &&
        item.label === "Photo / Video Order Form"
    )
  );
  assert.ok(
    resourceLinks.some(
      (item: any) =>
        item.kind === "hotel_booking" &&
        item.url === hotelUrl &&
        item.label === "Hotel Reservations"
    )
  );
  assert.ok(
    resourceLinks.some(
      (item: any) =>
        item.kind === "apparel_form" &&
        item.url === apparelUrl &&
        item.label === "Apparel Sizing Form"
    )
  );
  assert.ok(
    !resourceLinks.some(
      (item: any) => item.url === mediaUrl && item.kind === "photo_video"
    )
  );
  assert.match(result.extractedText, /IMG:parking map text/);
  assert.match(result.extractedText, /Book hotel reservations for traveling families/i);
});

test("extractDiscoveryText ignores raw JSON-LD blobs when scoring URL extraction quality", async (t) => {
  const rootUrl = "https://usacompetitions.com/2026-level-7-9-10-state-championships/";

  t.after(() => resetUrlDiscoveryTestHooks());
  setUrlDiscoveryTestHooks({
    fetchWithLimit: async (url: string) => {
      if (url !== rootUrl) throw new Error(`Unexpected fetch: ${url}`);
      const text = `
        <html>
          <head>
            <title>2026 Level 7/9/10 State Championships - USA Competitions</title>
            <meta
              name="description"
              content="USA Competitions proudly hosts the 2026 USA Gymnastics Women's Level 7/9/10 State Championships in Coral Springs, Florida."
            />
            <script type="application/ld+json">
              {
                "@context": "https://schema.org",
                "@graph": [
                  {
                    "@type": "WebPage",
                    "name": "2026 Level 7/9/10 State Championships - USA Competitions",
                    "description": "USA Competitions proudly hosts the 2026 USA Gymnastics Women's Level 7/9/10 State Championships in Coral Springs, Florida.",
                    "url": "https://usacompetitions.com/2026-level-7-9-10-state-championships/"
                  }
                ]
              }
            </script>
          </head>
          <body>
            <h1>2026 Level 7/9/10 State Championships</h1>
            <p>March 20-22, 2026</p>
            <p>Coral Springs Gymnasium</p>
            <p>Level 7/9/10 Florida State Championships 2026</p>
          </body>
        </html>
      `;
      return { contentType: "text/html", buffer: Buffer.from(text), text };
    },
  });

  const result = await extractDiscoveryText({ type: "url", url: rootUrl });

  assert.notEqual(result.extractionMeta.textQuality, "poor");
  assert.equal(result.extractionMeta.qualitySignals?.looksLikePdfInternals, false);
  assert.ok(!result.extractedText.includes('{"@context"'));
  assert.match(result.extractedText, /2026 Level 7\/9\/10 State Championships/i);
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

test("parseResourceStatusFromLabel captures future posting dates from labels", () => {
  const parsed = parseResourceStatusFromLabel(
    "Rotation Sheets (will be posted by April 7th)",
    { referenceYear: "2026" }
  );

  assert.equal(parsed.status, "not_posted");
  assert.equal(parsed.cleanedLabel, "Rotation Sheets");
  assert.equal(parsed.availabilityText, "will be posted by April 7th");
  assert.equal(parsed.availabilityDate, "2026-04-07");
});

test("extractDiscoveryText merges Playwright-discovered resources and child-page text", async (t) => {
  const rootUrl = "https://usacompetitions.com/2026-xcel-bsg-state-championships/";
  const scheduleUrl = "https://usacompetitions.com/wp-content/uploads/2026/03/state-info.pdf";
  const divisionsUrl = "https://usacompetitions.com/team-divisions/";
  const photoUrl = "https://form.jotform.com/host/state-photo-video";

  t.after(() => resetUrlDiscoveryTestHooks());
  setUrlDiscoveryTestHooks({
    fetchWithLimit: async (url: string) => {
      if (url === rootUrl) {
        const text = `
          <html>
            <head><title>2026 Xcel State Championships</title></head>
            <body>April 10-12, 2026 Gainesville, FL</body>
          </html>
        `;
        return { contentType: "text/html", buffer: Buffer.from(text), text };
      }
      if (url === scheduleUrl) {
        return {
          contentType: "application/pdf",
          buffer: Buffer.from("browser discovered schedule packet"),
          text: "",
        };
      }
      if (url === photoUrl) {
        const text = `
          <html><head><title>Photo Orders</title></head><body>Photo and video ordering form.</body></html>
        `;
        return { contentType: "text/html", buffer: Buffer.from(text), text };
      }
      if (url === divisionsUrl) {
        const text = `
          <html><head><title>Team Divisions</title></head><body>Will be posted March 30th.</body></html>
        `;
        return { contentType: "text/html", buffer: Buffer.from(text), text };
      }
      throw new Error(`Unexpected fetch: ${url}`);
    },
    collectBrowserData: async () => ({
      candidates: [
        {
          label: "Schedule & Info (Updated March 27th)",
          url: scheduleUrl,
          sourceUrl: rootUrl,
          depth: 0,
          sameHost: true,
          contentType: "application/pdf",
          openedVia: "anchor",
          discoveryMethod: "playwright",
        },
        {
          label: "Team Divisions (will be posted March 30th)",
          url: divisionsUrl,
          sourceUrl: rootUrl,
          depth: 0,
          sameHost: true,
          contentType: "text/html",
          openedVia: "button",
          discoveryMethod: "playwright",
        },
        {
          label: "Photo / Video Order Form",
          url: photoUrl,
          sourceUrl: rootUrl,
          depth: 0,
          sameHost: false,
          contentType: "text/html",
          openedVia: "popup",
          discoveryMethod: "playwright",
        },
      ],
      pages: [
        {
          url: divisionsUrl,
          title: "Team Divisions",
          depth: 1,
          text: "Team divisions will be posted March 30th.",
          sourceUrl: rootUrl,
        },
      ],
    }),
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
  const resourceLinks = result.extractionMeta.resourceLinks || [];

  assert.match(result.extractedText, /Team divisions will be posted March 30th/i);
  assert.match(result.extractedText, /PDF:browser discovered schedule packet/);
  assert.ok(
    resourceLinks.some(
      (item: any) =>
        item.kind === "team_divisions" &&
        item.status === "not_posted" &&
        item.availabilityDate === "2026-03-30" &&
        item.discoveryMethod === "playwright"
    )
  );
  assert.ok(
    resourceLinks.some(
      (item: any) =>
        item.kind === "photo_video" &&
        item.url === photoUrl &&
        item.discoveryMethod === "playwright"
    )
  );
});

test("extractDiscoveryText warns once and continues when Playwright Chromium is unavailable", async (t) => {
  const rootUrl = "https://usacompetitions.com/2026-xcel-bsg-state-championships/";
  const originalWarn = console.warn;
  const warnCalls: Array<{ message: string; detail: any }> = [];

  t.after(() => {
    console.warn = originalWarn;
    resetUrlDiscoveryTestHooks();
  });

  console.warn = ((message?: unknown, detail?: unknown) => {
    warnCalls.push({ message: String(message || ""), detail });
  }) as typeof console.warn;

  setUrlDiscoveryTestHooks({
    fetchWithLimit: async (url: string) => {
      if (url !== rootUrl) throw new Error(`Unexpected fetch: ${url}`);
      const text = `
        <html>
          <head><title>2026 Xcel State Championships</title></head>
          <body>April 10-12, 2026 Gainesville, FL</body>
        </html>
      `;
      return { contentType: "text/html", buffer: Buffer.from(text), text };
    },
    collectBrowserData: async () => {
      throw new Error(
        "browserType.launch: Executable doesn't exist at /Users/test/.cache/ms-playwright/chromium\nPlease run the following command to download new browsers: npx playwright install"
      );
    },
    extractTextFromPdf: async (buffer: Buffer) => ({
      text: buffer.toString("utf8"),
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

  assert.match(result.extractedText, /April 10-12, 2026 Gainesville, FL/);
  assert.equal(warnCalls.length, 1);
  assert.match(warnCalls[0]?.message || "", /playwright browser discovery unavailable, skipping/);
});

test("extractDiscoveryText passes remaining budget to fetched asset PDF parses", async (t) => {
  const rootUrl = "https://usacompetitions.com/2026-xcel-bsg-state-championships/";
  const packetUrl = "https://usacompetitions.com/wp-content/uploads/2026/03/state-info.pdf";
  const originalDateNow = Date.now;
  let now = 0;
  const receivedBudgets: number[] = [];

  t.after(() => {
    Date.now = originalDateNow;
    resetUrlDiscoveryTestHooks();
  });

  Date.now = () => now;

  setUrlDiscoveryTestHooks({
    fetchWithLimit: async (url: string) => {
      if (url === rootUrl) {
        const text = `
          <html>
            <head><title>2026 Xcel State Championships</title></head>
            <body><a href="/wp-content/uploads/2026/03/state-info.pdf">Schedule &amp; Info</a></body>
          </html>
        `;
        return { contentType: "text/html", buffer: Buffer.from(text), text };
      }
      if (url === packetUrl) {
        now += 500;
        return {
          contentType: "application/pdf",
          buffer: Buffer.from("shared deadline packet"),
          text: "",
        };
      }
      throw new Error(`Unexpected fetch: ${url}`);
    },
    extractTextFromPdf: async (_buffer: Buffer, options?: { budgetMs?: number }) => {
      receivedBudgets.push(Number(options?.budgetMs || 0));
      now += 200;
      return {
        text: "PDF:shared deadline packet",
        usedOcr: false,
        coachPageHints: [],
        textQuality: "good",
        qualitySignals: emptyQualitySignals,
      };
    },
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

  await extractDiscoveryText(
    { type: "url", url: rootUrl },
    { budgetMs: 1_500, workflow: "gymnastics", mode: "core" }
  );

  assert.equal(receivedBudgets.length, 1);
  assert.equal(receivedBudgets[0], 1_000);
});

test("extractDiscoveryText stops lower-priority URL follow-ups once the shared crawl deadline is exhausted", async (t) => {
  const rootUrl = "https://usacompetitions.com/2026-xcel-bsg-state-championships/";
  const packetUrl = "https://usacompetitions.com/wp-content/uploads/2026/03/state-info.pdf";
  const rosterUrl = "https://usacompetitions.com/wp-content/uploads/2026/03/rosters.pdf";
  const hotelUrl = "https://api.groupbook.io/group/usag-state-2026";
  const resultsHubUrl = "https://usacompetitions.com/results/";
  const originalDateNow = Date.now;
  const originalLog = console.log;
  let now = 0;
  const fetchCalls: string[] = [];
  const logMessages: string[] = [];

  t.after(() => {
    Date.now = originalDateNow;
    console.log = originalLog;
    resetUrlDiscoveryTestHooks();
  });

  Date.now = () => now;
  console.log = ((message?: unknown) => {
    logMessages.push(String(message || ""));
  }) as typeof console.log;

  setUrlDiscoveryTestHooks({
    fetchWithLimit: async (url: string) => {
      fetchCalls.push(url);
      if (url === rootUrl) {
        const text = `
          <html>
            <head><title>2026 Xcel State Championships</title></head>
            <body>
              <a href="/wp-content/uploads/2026/03/state-info.pdf">Schedule &amp; Info</a>
              <a href="/wp-content/uploads/2026/03/rosters.pdf">Rosters</a>
              <a href="https://api.groupbook.io/group/usag-state-2026">Host Hotels</a>
              <a href="/results/">Results</a>
            </body>
          </html>
        `;
        return { contentType: "text/html", buffer: Buffer.from(text), text };
      }
      if (url === packetUrl || url === rosterUrl) {
        now += 100;
        return {
          contentType: "application/pdf",
          buffer: Buffer.from(url === packetUrl ? "packet" : "roster"),
          text: "",
        };
      }
      if (url === hotelUrl || url === resultsHubUrl) {
        throw new Error(`Follow-up should have been skipped for ${url}`);
      }
      throw new Error(`Unexpected fetch: ${url}`);
    },
    extractTextFromPdf: async (buffer: Buffer) => {
      now += 700;
      return {
        text: `PDF:${buffer.toString("utf8")}`,
        usedOcr: false,
        coachPageHints: [],
        textQuality: "good",
        qualitySignals: emptyQualitySignals,
      };
    },
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

  const result = await extractDiscoveryText(
    { type: "url", url: rootUrl },
    { budgetMs: 1_500, workflow: "gymnastics", mode: "core" }
  );

  assert.match(result.extractedText, /PDF:packet/);
  assert.match(result.extractedText, /PDF:roster/);
  assert.deepEqual(fetchCalls, [rootUrl, packetUrl, rosterUrl]);
  assert.ok(
    logMessages.some((message) => /budget exhausted, skipping remaining follow-ups/.test(message))
  );
});

test("extractDiscoveryText merges PDF annotation links into resources and follows same-host child pages", async (t) => {
  const rootUrl = "https://usacompetitions.com/2026-xcel-bsg-state-championships/";
  const packetUrl = "https://usacompetitions.com/wp-content/uploads/2026/03/state-info.pdf";
  const divisionsUrl = "https://usacompetitions.com/team-divisions/";
  const hotelUrl = "https://api.groupbook.io/group/usag-state-2026";
  let hotelFetchCount = 0;

  t.after(() => resetUrlDiscoveryTestHooks());
  setUrlDiscoveryTestHooks({
    fetchWithLimit: async (url: string) => {
      if (url === rootUrl) {
        const text = `
          <html>
            <head><title>2026 Xcel State Championships</title></head>
            <body>
              <a href="/wp-content/uploads/2026/03/state-info.pdf">Schedule &amp; Info</a>
              April 10-12, 2026 Gainesville, FL
            </body>
          </html>
        `;
        return { contentType: "text/html", buffer: Buffer.from(text), text };
      }
      if (url === packetUrl) {
        return {
          contentType: "application/pdf",
          buffer: Buffer.from("packet with hidden links"),
          text: "",
        };
      }
      if (url === divisionsUrl) {
        const text = `
          <html>
            <head><title>Team Divisions</title></head>
            <body>Team divisions for the 2026 Xcel State Championships.</body>
          </html>
        `;
        return { contentType: "text/html", buffer: Buffer.from(text), text };
      }
      if (url === hotelUrl) {
        hotelFetchCount += 1;
        const text = `
          <html>
            <head><title>Groupbook Hotel Block</title></head>
            <body>Groupbook room block available until March 31, 2026.</body>
          </html>
        `;
        return { contentType: "text/html", buffer: Buffer.from(text), text };
      }
      throw new Error(`Unexpected fetch: ${url}`);
    },
    extractTextFromPdf: async (buffer: Buffer) => ({
      text: `PDF:${buffer.toString("utf8")}`,
      usedOcr: false,
      coachPageHints: [],
      textQuality: "good",
      qualitySignals: emptyQualitySignals,
      annotationLinks: [
        {
          url: divisionsUrl,
          label: "Team Divisions",
          pageNumber: 1,
          source: "pdf_annotation",
        },
        {
          url: hotelUrl,
          label: null,
          pageNumber: 1,
          source: "pdf_annotation",
        },
        {
          url: hotelUrl,
          label: null,
          pageNumber: 2,
          source: "pdf_annotation",
        },
      ],
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
  const resourceLinks = result.extractionMeta.resourceLinks || [];

  assert.match(result.extractedText, /PDF:packet with hidden links/i);
  assert.match(result.extractedText, /Team divisions for the 2026 Xcel State Championships/i);
  assert.match(result.extractedText, /Groupbook room block available until March 31, 2026/i);
  assert.ok(
    resourceLinks.some(
      (item: any) =>
        item.kind === "team_divisions" &&
        item.url === divisionsUrl &&
        item.origin === "linked_asset"
    )
  );
  assert.ok(
    resourceLinks.some(
      (item: any) =>
        item.kind === "hotel_booking" &&
        item.url === hotelUrl &&
        item.origin === "linked_asset"
    )
  );
  assert.equal(hotelFetchCount, 1, "expected trusted external PDF annotation URL to be fetched once");
});

test("parseMeetFromExtractedText keeps a deterministic title when quality gate skips model parsing", async () => {
  const parsed = await parseMeetFromExtractedText(
    [
      "Source URL: https://usacompetitions.com/2026-level-7-9-10-state-championships/",
      "March 20-22, 2026",
      "Coral Springs Gymnasium",
      "Level 7/9/10",
      "Florida State Championships 2026",
    ].join("\n"),
    {
      sourceType: "url",
      usedOcr: false,
      linkedAssets: [],
      discoveredLinks: [],
      resourceLinks: [],
      crawledPages: [],
      pageTitle: "2026 Level 7/9/10 State Championships - USA Competitions",
      textQuality: "poor",
      qualitySignals: {
        ...emptyQualitySignals,
        looksLikePdfInternals: true,
      },
    }
  );

  assert.equal(parsed.modelUsed, "quality-gate");
  assert.equal(parsed.parseResult.title, "2026 Level 7/9/10 State Championships");
});

test("mapParseResultToGymData replaces URL ingest hostname titles with extracted page titles", async () => {
  const mapped = await mapParseResultToGymData(
    normalizeParseResult({
      eventType: "gymnastics_meet",
      documentProfile: "unknown",
      title: "",
      dates: "",
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
      links: [],
      unmappedFacts: [],
    })!,
    {
      title: "usacompetitions.com Meet",
      discoverySource: {
        extractedText: "March 20-22, 2026\nCoral Springs Gymnasium\nLevel 7/9/10\nFlorida State Championships 2026",
        extractionMeta: {
          sourceType: "url",
          usedOcr: false,
          linkedAssets: [],
          discoveredLinks: [],
          resourceLinks: [],
          crawledPages: [],
          pageTitle: "2026 Level 7/9/10 State Championships - USA Competitions",
          textQuality: "good",
          qualitySignals: emptyQualitySignals,
        },
      },
      advancedSections: {},
    }
  );

  assert.equal(mapped.title, "2026 Level 7/9/10 State Championships");
});

test("mapParseResultToGymData keeps future-posted resources out of normal links and exposes pending resources", async () => {
  const mapped = await mapParseResultToGymData(
    normalizeParseResult({
      eventType: "gymnastics_meet",
      documentProfile: "meet_overview",
      title: "2026 Xcel State Championships",
      dates: "April 10-12, 2026",
      startAt: null,
      endAt: null,
      timezone: "America/New_York",
      venue: "Alachua County Sports & Events Center",
      address: "4870 Celebration Pointe Ave, Gainesville, FL 32608",
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
      links: [],
      unmappedFacts: [],
    })!,
    {
      title: "usacompetitions.com Meet",
      discoverySource: {
        extractedText: "2026 Xcel State Championships",
      },
    },
    {
      sourceType: "url",
      usedOcr: false,
      linkedAssets: [],
      discoveredLinks: [],
      resourceLinks: [
        {
          kind: "packet",
          status: "available",
          label: "Schedule & Info",
          url: "https://usacompetitions.com/docs/state-info.pdf",
          sourceUrl: "https://usacompetitions.com/2026-xcel-bsg-state-championships/",
          origin: "root",
          contentType: "application/pdf",
          followed: true,
          matchScore: 10,
          matchReason: "root_direct_resource",
          availabilityText: "updated March 27th",
          availabilityDate: "2026-03-27",
          discoveryMethod: "playwright",
        },
        {
          kind: "team_divisions",
          status: "not_posted",
          label: "Team Divisions",
          url: "https://usacompetitions.com/team-divisions/",
          sourceUrl: "https://usacompetitions.com/2026-xcel-bsg-state-championships/",
          origin: "root",
          contentType: "text/html",
          followed: true,
          matchScore: 10,
          matchReason: "root_direct_resource",
          availabilityText: "will be posted March 30th",
          availabilityDate: "2026-03-30",
          discoveryMethod: "playwright",
        },
      ],
      crawledPages: [],
      pageTitle: "2026 Xcel State Championships",
      textQuality: "good",
      qualitySignals: emptyQualitySignals,
      schedulePageImages: [],
      schedulePageTexts: [],
    }
  );

  assert.ok(
    mapped.links.some(
      (item: any) => item.url === "https://usacompetitions.com/docs/state-info.pdf"
    )
  );
  assert.ok(
    !mapped.links.some(
      (item: any) => item.url === "https://usacompetitions.com/team-divisions/"
    )
  );
  assert.deepEqual(mapped.advancedSections.meet.pendingResources, [
    {
      id: "pending-resource-1",
      kind: "team_divisions",
      label: "Team Divisions",
      availabilityText: "will be posted March 30th",
      availabilityDate: "2026-03-30",
      url: "https://usacompetitions.com/team-divisions/",
      sourceUrl: "https://usacompetitions.com/2026-xcel-bsg-state-championships/",
      lastSeenAt: mapped.advancedSections.meet.pendingResources[0].lastSeenAt,
    },
  ]);
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
  assert.equal(
    result.extractionMeta.schedulePageTexts?.length,
    GYM_DISCOVERY_SCHEDULE_GRID_ENABLED ? 1 : 0,
  );
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

test("mapParseResultToGymData deterministically promotes canonical resource links", async () => {
  const mapped = await mapParseResultToGymData(
    normalizeParseResult({
      eventType: "gymnastics_meet",
      documentProfile: "meet_overview",
      title: "2026 Level 7/9/10 State Championships",
      dates: "March 20-22, 2026",
      startAt: null,
      endAt: null,
      timezone: "America/Chicago",
      venue: "Coral Springs Gymnasium",
      address: "123 Main St, Coral Springs, FL 33065",
      hostGym: "USA Competitions",
      admission: [],
      athlete: {},
      meetDetails: {},
      logistics: {
        hotel: "Stay at the Riverside Hotel. Book before March 1.",
      },
      policies: {},
      coachInfo: {},
      contacts: [],
      deadlines: [],
      gear: {},
      volunteers: {},
      communications: {},
      links: [],
      unmappedFacts: [],
      schedule: { days: [] },
    })!,
    {},
    {
      sourceType: "url",
      usedOcr: false,
      linkedAssets: [],
      resourceLinks: [
        {
          kind: "results_live",
          status: "available",
          label: "Live Scoring",
          url: "https://results.scorecatonline.com/state-2026",
          sourceUrl: "https://usacompetitions.com/2026-level-7-9-10-state-championships/",
          origin: "hub_descendant",
          contentType: "text/html",
          followed: true,
          matchScore: 9,
          matchReason: "date_overlap, title_tokens:4",
        },
        {
          kind: "packet",
          status: "available",
          label: "State Packet",
          url: "https://usacompetitions.com/docs/state-packet.pdf",
          sourceUrl: "https://usacompetitions.com/2026-level-7-9-10-state-championships/",
          origin: "root",
          contentType: "application/pdf",
          followed: true,
          matchScore: 10,
          matchReason: "root_direct_resource",
        },
        {
          kind: "roster",
          status: "available",
          label: "Roster",
          url: "https://usacompetitions.com/docs/state-roster.pdf",
          sourceUrl: "https://usacompetitions.com/2026-level-7-9-10-state-championships/",
          origin: "root",
          contentType: "application/pdf",
          followed: true,
          matchScore: 10,
          matchReason: "root_direct_resource",
        },
        {
          kind: "team_divisions",
          status: "available",
          label: "Team Divisions",
          url: "https://usacompetitions.com/docs/team-divisions.pdf",
          sourceUrl: "https://usacompetitions.com/2026-level-7-9-10-state-championships/",
          origin: "root",
          contentType: "application/pdf",
          followed: true,
          matchScore: 10,
          matchReason: "root_direct_resource",
        },
        {
          kind: "photo_video",
          status: "available",
          label: "Photo / Video Order Form",
          url: "https://form.jotform.com/host/state-photo-video",
          sourceUrl: "https://usacompetitions.com/2026-level-7-9-10-state-championships/",
          origin: "root",
          contentType: "text/html",
          followed: true,
          matchScore: 10,
          matchReason: "root_direct_resource",
        },
        {
          kind: "hotel_booking",
          status: "available",
          label: "Host Hotel Booking",
          url: "https://api.groupbook.io/booking/state-host-hotel",
          sourceUrl: "https://usacompetitions.com/2026-level-7-9-10-state-championships/",
          origin: "root",
          contentType: "text/html",
          followed: true,
          matchScore: 10,
          matchReason: "root_direct_resource",
        },
      ],
      discoveredLinks: [],
      crawledPages: [],
      pageTitle: "2026 Level 7/9/10 State Championships",
      gymLayoutImageDataUrl: null,
      gymLayoutFacts: [],
      gymLayoutZones: [],
      gymLayoutPage: null,
      coachPageHints: [],
      textQuality: "good",
      qualitySignals: emptyQualitySignals,
      schedulePageImages: [],
      schedulePageTexts: [],
    } as any
  );

  assert.equal(mapped.advancedSections.meet.scoresLink, "https://results.scorecatonline.com/state-2026");
  assert.equal(
    mapped.advancedSections.logistics.hotelInfo,
    "Stay at the Riverside Hotel. Book before March 1."
  );
  assert.ok(
    mapped.advancedSections.logistics.additionalDocuments.some(
      (item: any) => item.url === "https://usacompetitions.com/docs/state-packet.pdf"
    )
  );
  assert.ok(
    mapped.advancedSections.logistics.additionalDocuments.some(
      (item: any) => item.url === "https://form.jotform.com/host/state-photo-video"
    )
  );
  assert.ok(
    mapped.links.some((item: any) => item.url === "https://api.groupbook.io/booking/state-host-hotel")
  );
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
  assert.equal(fallback.days[0]?.sessions[0]?.code, "FR1");
  assert.equal(fallback.days[0]?.sessions[0]?.startTime, "8:00am");
  assert.equal(fallback.days[0]?.sessions[1]?.group, "SILVER");
  assert.equal(fallback.days[0]?.sessions[4]?.code, "FR5");
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

test("deriveScheduleFromTextFallback preserves non-club session detail rows as session notes", () => {
  const fallback = deriveScheduleFromTextFallback(`
-- 1 of 1 --
Friday, April 10, 2026
Session W01 \tSession B01
SILVER \tGOLD
8:00 AM \t8:00 AM
1/17/2018 & Younger \tGr: 1,24,37,38,57,64
  `);

  assert.equal(fallback.days.length, 1);
  assert.equal(fallback.days[0]?.date, "Friday, April 10, 2026");
  assert.equal(fallback.days[0]?.sessions[0]?.code, "B01");
  assert.equal(fallback.days[0]?.sessions[0]?.note, "Gr: 1,24,37,38,57,64");
  assert.equal(fallback.days[0]?.sessions[1]?.code, "W01");
  assert.equal(fallback.days[0]?.sessions[1]?.note, "1/17/2018 & Younger");
  assert.deepEqual(fallback.days[0]?.sessions[0]?.clubs, []);
  assert.deepEqual(fallback.days[0]?.sessions[1]?.clubs, []);
});

test("classifySchedulePageText separates grid, narrative, and assignment packets", () => {
  assert.equal(
    classifySchedulePageText(
      "Session FR1\tSession FR2\nBRONZE\tSILVER\nStretch/warmup: 8:00am\tStretch/warmup: 10:45am\nBrowns Gym\tAlpha Gym"
    ).kind,
    "grid"
  );
  assert.equal(
    classifySchedulePageText(
      "Friday, March 20\nSession FR1 Level 7 8:00am Stretch\nAge groups: 10, 2, 24, 8, 12 8:15am Warm-up. Competition to follow"
    ).kind,
    "narrative"
  );
  assert.equal(
    classifySchedulePageText(
      "AGE GROUPS AND SESSION ASSIGNMENTS\nLEVEL 7\nGroup 2 6/18/2015 — 11/3/2015 FR1"
    ).kind,
    "assignment"
  );
});

test("selectScheduleSegments keeps narrative and assignment pages out of grid parsing", () => {
  const selected = selectScheduleSegments([
    {
      pageNumber: 1,
      text: "Session FR1 Level 7 8:00am Stretch\nAge groups: 10, 2, 24, 8, 12 8:15am Warm-up. Competition to follow",
    },
    {
      pageNumber: 2,
      text: "LEVEL 7\nAge Group Birth Date Divisions Session\nGroup 2 6/18/2015 — 11/3/2015 FR1",
    },
    {
      pageNumber: 3,
      text: "Spectator Admissions\nAdults $26\nChildren $11",
    },
  ]);

  assert.deepEqual(
    selected.map((item) => [item.pageNumber, item.kind]),
    [
      [1, "narrative"],
      [2, "assignment"],
    ]
  );
});

test("classifySchedulePageText recognizes organizer-agnostic tabular schedule and assignment pages", () => {
  assert.equal(
    classifySchedulePageText(
      [
        "Friday, January 9, 2026",
        "Gym A\tGym B",
        "B1\tW04",
        "Bronze\tXcel Platinum",
        "8:00 AM\t12:30 PM",
        "North Stars\tMetro Gym",
      ].join("\n")
    ).kind,
    "grid"
  );
  assert.equal(
    classifySchedulePageText(
      [
        "AGE GROUP / DIVISION / SESSION",
        "Level 4",
        "Group 1\t7/01/2014 - 6/30/2015\tJunior A\tB1",
        "Group 2\t7/01/2013 - 6/30/2014\tJunior B\tW04",
      ].join("\n")
    ).kind,
    "assignment"
  );
  assert.equal(
    classifySchedulePageText(
      [
        "Friday, January 9",
        "Session 3 Level 7 8:00am Stretch",
        "Age groups: 4, 7, 12 8:15am Warm-up. Competition to follow",
      ].join("\n")
    ).kind,
    "narrative"
  );
});

test("deriveScheduleFromExtractedText builds day sessions from tabular schedule candidates", async () => {
  const derived = await deriveScheduleFromExtractedText(
    "",
    {
      sourceType: "file",
      usedOcr: false,
      linkedAssets: [],
      discoveredLinks: [],
      crawledPages: [],
      schedulePageImages: [],
      schedulePageTexts: [
        {
          pageNumber: 1,
          text: [
            "Friday, January 9, 2026",
            "Gym A\tGym B",
            "B1\tW04",
            "Bronze\tXcel Platinum",
            "8:00 AM\t12:30 PM",
            "North Stars\tMetro Gym",
          ].join("\n"),
        },
      ],
      textQuality: "good",
      qualitySignals: emptyQualitySignals,
    }
  );

  assert.equal(derived.schedule.days.length, 1);
  assert.equal(derived.schedule.days[0]?.sessions[0]?.code, "B1");
  assert.equal(derived.schedule.days[0]?.sessions[0]?.startTime, "8:00 AM");
  assert.equal(derived.schedule.days[0]?.sessions[1]?.code, "W04");
  assert.equal(derived.schedule.days[0]?.sessions[1]?.clubs[0]?.name, "Metro Gym");
});

test("deriveScheduleFromExtractedText keeps assignment rows even when there are no grid pages", async () => {
  const derived = await deriveScheduleFromExtractedText(
    "",
    {
      sourceType: "file",
      usedOcr: false,
      linkedAssets: [],
      discoveredLinks: [],
      crawledPages: [],
      schedulePageImages: [],
      schedulePageTexts: [
        {
          pageNumber: 2,
          text: [
            "AGE GROUP / DIVISION / SESSION",
            "Level 4",
            "Group 1\t7/01/2014 - 6/30/2015\tJunior A\tB1",
            "Group 2\t7/01/2013 - 6/30/2014\tJunior B\tW04",
          ].join("\n"),
        },
      ],
      textQuality: "good",
      qualitySignals: emptyQualitySignals,
    }
  );

  assert.deepEqual(
    (derived.schedule.assignments ?? []).map((item) => [
      item.level,
      item.groupLabel,
      item.birthDateRange,
      item.divisionLabel,
      item.sessionCode,
    ]),
    [
      ["Level 4", "Group 1", "7/01/2014 - 6/30/2015", "Junior A", "B1"],
      ["Level 4", "Group 2", "7/01/2013 - 6/30/2014", "Junior B", "W04"],
    ]
  );
});

test("shouldUseVisualScheduleRepair keeps image repair enabled when text parsing found only empty session shells", () => {
  assert.equal(
    shouldUseVisualScheduleRepair(
      {
        venueLabel: null,
        supportEmail: null,
        notes: [],
        annotations: [],
        assignments: [],
        days: [
          {
            date: "Thursday, April 9, 2026",
            shortDate: "Thu • Apr 9",
            sessions: [
              {
                code: "B01",
                group: "Gold",
                startTime: "8:00 AM",
                warmupTime: "8:00 AM",
                note: "Stretch/warmup",
                clubs: [],
              },
              {
                code: "B02",
                group: "Gold",
                startTime: "11:30 AM",
                warmupTime: "11:30 AM",
                note: "Stretch/warmup",
                clubs: [],
              },
            ],
          },
        ],
      },
      {
        venueLabel: null,
        supportEmail: null,
        notes: [],
        annotations: [],
        assignments: [],
        days: [
          {
            date: "Thursday, April 9, 2026",
            shortDate: "Thu • Apr 9",
            sessions: [
              {
                code: "B01",
                group: "Gold",
                startTime: "8:00 AM",
                warmupTime: "8:00 AM",
                note: "Stretch/warmup",
                clubs: [],
              },
            ],
          },
        ],
      },
      [
        {
          pageNumber: 1,
          text: [
            "Thursday, April 9, 2026",
            "B01\tB02",
            "Gold\tGold",
            "8:00 AM\t11:30 AM",
            "North Stars\tMetro Gym",
          ].join("\n"),
        },
      ]
    ),
    true
  );
});

test("alignScheduleDatesToEventRange shifts consistently offset schedule days onto the meet range", () => {
  const aligned = alignScheduleDatesToEventRange(
    {
      venueLabel: null,
      supportEmail: null,
      notes: [],
      annotations: [],
      assignments: [],
      days: [
        {
          date: "Thursday, April 9, 2026",
          shortDate: "Thu • Apr 9",
          sessions: [{ code: "B01", group: "Gold", startTime: "8:00 AM", warmupTime: "8:00 AM", note: "Stretch/warmup", clubs: [] }],
        },
        {
          date: "Friday, April 10, 2026",
          shortDate: "Fri • Apr 10",
          sessions: [{ code: "B02", group: "Gold", startTime: "11:30 AM", warmupTime: "11:30 AM", note: "Stretch/warmup", clubs: [] }],
        },
        {
          date: "Saturday, April 11, 2026",
          shortDate: "Sat • Apr 11",
          sessions: [{ code: "B03", group: "Gold", startTime: "2:45 PM", warmupTime: "2:45 PM", note: "Stretch/warmup", clubs: [] }],
        },
      ],
    },
    {
      label: "April 10-12, 2026",
      startDate: "2026-04-10",
      endDate: "2026-04-12",
    }
  );

  assert.deepEqual(
    aligned.days.map((day) => [day.date, day.shortDate]),
    [
      ["April 10, 2026", "Friday • Apr 10"],
      ["April 11, 2026", "Saturday • Apr 11"],
      ["April 12, 2026", "Sunday • Apr 12"],
    ]
  );
  assert.deepEqual(deriveDateRangeFromScheduleDays(aligned), {
    label: "April 10-12, 2026",
    startDate: "2026-04-10",
    endDate: "2026-04-12",
  });
});

test("parseNarrativeScheduleSessionsFromPage extracts narrative schedule sessions without club leakage", () => {
  const schedule = parseNarrativeScheduleSessionsFromPage(
    {
      pageNumber: 1,
      text: `
Friday, March 20
Session FR1 Level 7 8:00am Stretch
Age groups: 10, 2, 24, 8, 12 8:15am Warm-up. Competition to follow
Session FR2 Level 7 11:30am Stretch
Age groups: 3, 21, 6, 11, 20 11:45am Warm-up. Competition to follow
Saturday, March 21
Session SA1 Level 7 8:00am Stretch
Age groups: 15, 4, 9, 25, 14 8:15am Warm-up. Competition to follow
      `,
    },
    "2026"
  );

  assert.equal(schedule.days.length, 2);
  assert.equal(schedule.days[0]?.date, "Friday, March 20, 2026");
  assert.equal(schedule.days[0]?.sessions[0]?.code, "FR1");
  assert.equal(schedule.days[0]?.sessions[0]?.group, "Level 7");
  assert.equal(schedule.days[0]?.sessions[0]?.startTime, "8:00am");
  assert.equal(schedule.days[0]?.sessions[0]?.warmupTime, "8:15am");
  assert.equal(schedule.days[0]?.sessions[0]?.note, "Age groups: 10, 2, 24, 8, 12");
  assert.deepEqual(schedule.days[0]?.sessions[0]?.clubs, []);
  assert.equal(schedule.days[1]?.sessions[0]?.code, "SA1");
});

test("parseScheduleAnnotationsFromPages keeps award prose out of awardLegend and captures schedule rules", () => {
  const annotations = parseScheduleAnnotationsFromPages(
    [
      {
        pageNumber: 1,
        text: `
**SENIOR RECOGNITION CEREMONIES**
LEVEL 7: Recognized at the Awards Ceremony for any graduating L7 Senior
Friday, March 20
Session FR1 Level 7 8:00am Stretch
Saturday, March 21
**Level 7 Team awards at approx. 11:30am, following session SA1**
LEVEL 10's
The final Level 10 schedule will be released no later than Monday, March 16th.
        `,
      },
    ],
    "2026"
  );

  assert.equal(annotations.length, 3);
  assert.deepEqual(
    annotations.map((item) => [item.kind, item.level, item.sessionCode, item.date, item.time]),
    [
      ["senior_recognition", "Level 7", null, null, null],
      ["team_awards", "Level 7", "SA1", "Saturday, March 21, 2026", "11:30am"],
      ["schedule_note", "Level 10", null, "Saturday, March 21, 2026", null],
    ]
  );
});

test("parseScheduleAssignmentsFromPages extracts assignment rows without inventing clubs", () => {
  const assignments = parseScheduleAssignmentsFromPages([
    {
      pageNumber: 2,
      text: `
LEVEL 7
Age Group Birth Date Divisions Session
Group 2 6/18/2015 — 11/3/2015 FR1
Group 24 11/21/2009 — 11/9/2010 FR1
LEVEL 9
Age Group Birth Date Divisions Session
Middle 7/3/2010 — 10/27/2011 SU2
      `,
    },
  ]);

  assert.deepEqual(
    assignments.map((item) => [item.level, item.groupLabel, item.birthDateRange, item.sessionCode]),
    [
      ["Level 7", "Group 2", "6/18/2015 — 11/3/2015", "FR1"],
      ["Level 7", "Group 24", "11/21/2009 — 11/9/2010", "FR1"],
      ["Level 9", "Middle", "7/3/2010 — 10/27/2011", "SU2"],
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

test("supplementScheduleWithFallback replaces clearly leaked club lists with fallback session clubs", () => {
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
              code: "FR1",
              group: "BRONZE / SILVER / LEVEL 6",
              startTime: "8:00am",
              warmupTime: "8:00am",
              note: "Stretch/warmup",
              clubs: [
                { name: "Browns Gym", teamAwardEligible: null, athleteCount: null, divisionLabel: null },
                { name: "360 Gymnastics FL", teamAwardEligible: null, athleteCount: null, divisionLabel: null },
                { name: "Christi's Gymnastics", teamAwardEligible: null, athleteCount: null, divisionLabel: null },
              ],
            },
            {
              code: "FR2",
              group: "SILVER",
              startTime: "10:45am",
              warmupTime: "10:45am",
              note: "Stretch/warmup",
              clubs: [],
            },
            {
              code: "FR3",
              group: "LEVEL 6",
              startTime: "1:15pm",
              warmupTime: "1:15pm",
              note: "Stretch/warmup",
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
            {
              code: "FR3",
              group: "LEVEL 6",
              startTime: "1:15pm",
              warmupTime: "1:15pm",
              note: "Stretch/warmup",
              clubs: [{ name: "Christi's Gymnastics", teamAwardEligible: null, athleteCount: null, divisionLabel: null }],
            },
          ],
        },
      ],
    }
  );

  assert.equal(repaired.tableRepairApplied, true);
  assert.equal(repaired.fallbackMetadataApplied, true);
  assert.equal(repaired.schedule.days[0]?.sessions[0]?.group, "BRONZE");
  assert.deepEqual(
    repaired.schedule.days[0]?.sessions[0]?.clubs.map((club) => club.name),
    ["Browns Gym"]
  );
  assert.deepEqual(
    repaired.schedule.days[0]?.sessions[1]?.clubs.map((club) => club.name),
    ["360 Gymnastics FL"]
  );
  assert.deepEqual(
    repaired.schedule.days[0]?.sessions[2]?.clubs.map((club) => club.name),
    ["Christi's Gymnastics"]
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

test("mergeScheduleWithFallback keeps plain club award flags without restoring legacy color metadata", () => {
  const merged = mergeScheduleWithFallback(
    {
      venueLabel: "Coral Springs Gymnasium",
      supportEmail: "info@usacompetitions.com",
      notes: [],
      colorLegend: [
        {
          id: "club-pink",
          target: "club",
          colorHex: "#f472b6",
          colorLabel: null,
          meaning: null,
          sourceText: null,
          teamAwardEligible: null,
        },
      ],
      awardLegend: [
        {
          colorHex: "#f472b6",
          colorLabel: null,
          meaning: "Individual & Team Awards",
          teamAwardEligible: null,
        },
      ],
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
                { name: "Alpha Gymnastics", teamAwardEligible: true, athleteCount: null, divisionLabel: null },
                { name: "World Class Miami", teamAwardEligible: false, athleteCount: null, divisionLabel: null },
              ],
            },
          ],
        },
      ],
    },
    {
      venueLabel: "Coral Springs Gymnasium",
      supportEmail: "info@usacompetitions.com",
      notes: [],
      annotations: [],
      assignments: [],
      days: [],
    }
  );

  assert.equal("colorLegend" in merged, false);
  assert.equal("awardLegend" in merged, false);
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

test("mapParseResultToGymData keeps code-only fallback sessions", async (t) => {
  if (!GYM_DISCOVERY_SCHEDULE_GRID_ENABLED) {
    t.skip("Set GYM_DISCOVERY_SCHEDULE_GRID_ENABLED=1 to exercise schedule mapping");
    return;
  }
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

test("mapParseResultToGymData replaces stale derived schedule shells on repair", async (t) => {
  if (!GYM_DISCOVERY_SCHEDULE_GRID_ENABLED) {
    t.skip("Set GYM_DISCOVERY_SCHEDULE_GRID_ENABLED=1 to exercise schedule mapping");
    return;
  }
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

test("mapParseResultToGymData preserves schedule annotations and assignments", async (t) => {
  if (!GYM_DISCOVERY_SCHEDULE_GRID_ENABLED) {
    t.skip("Set GYM_DISCOVERY_SCHEDULE_GRID_ENABLED=1 to exercise schedule mapping");
    return;
  }
  const mapped = await mapParseResultToGymData(
    normalizeParseResult({
      eventType: "gymnastics_meet",
      documentProfile: "meet_overview",
      title: "State Meet",
      dates: "March 20-22, 2026",
      startAt: null,
      endAt: null,
      timezone: "America/New_York",
      venue: "Coral Springs Gymnasium",
      address: "2501 Coral Springs Drive, Coral Springs, FL 33065",
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
        notes: [],
        awardLegend: [],
        annotations: [
          {
            kind: "team_awards",
            level: "Level 7",
            sessionCode: "SA1",
            date: "Saturday, March 21, 2026",
            time: "11:30am",
            text: "Level 7 Team awards at approx. 11:30am, following session SA1",
          },
        ],
        assignments: [
          {
            level: "Level 9",
            groupLabel: "Middle",
            sessionCode: "SU2",
            birthDateRange: "7/3/2010 — 10/27/2011",
            divisionLabel: null,
            note: null,
          },
        ],
        days: [
          {
            date: "Sunday, March 22, 2026",
            shortDate: "Sunday • Mar 22",
            sessions: [
              {
                code: "SU2",
                group: "Level 9",
                startTime: "11:30am",
                warmupTime: "11:50am",
                note: "Born 7/3/2010 — 10/27/2011",
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

  assert.equal(mapped.advancedSections.schedule.annotations[0]?.sessionCode, "SA1");
  assert.equal(mapped.advancedSections.schedule.assignments[0]?.sessionCode, "SU2");
  assert.equal(mapped.advancedSections.schedule.assignments[0]?.birthDateRange, "7/3/2010 — 10/27/2011");
});

test("mapParseResultToGymData does not map packet intro prose into host gym fields", async () => {
  const mapped = await mapParseResultToGymData(
    normalizeParseResult({
      eventType: "gymnastics_meet",
      documentProfile: "meet_overview",
      title: "State Meet",
      dates: "March 20-22, 2026",
      startAt: null,
      endAt: null,
      timezone: "America/New_York",
      venue: "Coral Springs Gymnasium",
      address: "2501 Coral Springs Drive, Coral Springs, FL 33065",
      hostGym:
        "Team Twisters & USA Competitions is proud to host the 2026 Florida USA Gymnastics Level 7/9/10 State Championships. Please review the following items enclosed in this packet:",
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
        venueLabel: "",
        supportEmail: "",
        notes: [],
        awardLegend: [],
        annotations: [],
        assignments: [],
        days: [],
      },
      links: [],
      unmappedFacts: [],
    })!,
    {}
  );

  assert.equal(mapped.hostGym, "Team Twisters & USA Competitions");
  assert.equal(mapped.customFields.team, "Team Twisters & USA Competitions");
});

test("mapParseResultToGymData keeps date-only packets blank-time and blank-timezone", async () => {
  const mapped = await mapParseResultToGymData(
    normalizeParseResult({
      eventType: "gymnastics_meet",
      documentProfile: "meet_overview",
      title: "Winter Classic",
      dates: "January 9-11, 2026",
      startAt: "2026-01-09",
      endAt: "2026-01-11",
      timezone: null,
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
        venueLabel: "",
        supportEmail: "",
        notes: [],
        awardLegend: [],
        annotations: [],
        assignments: [],
        days: [],
      },
      links: [],
      unmappedFacts: [],
    })!,
    {}
  );

  assert.equal(mapped.date, "2026-01-09");
  assert.equal(mapped.time, "00:00");
  assert.equal(mapped.startISO, "2026-01-09T00:00:00.000Z");
  assert.equal(mapped.endISO, "2026-01-11T00:00:00.000Z");
  assert.equal(mapped.timezone, null);
});

test("mapParseResultToGymData filters schedule-grid noise from operational notes and infers bare-domain links", async () => {
  const mapped = await mapParseResultToGymData(
    normalizeParseResult({
      eventType: "gymnastics_meet",
      documentProfile: "meet_overview",
      title: "Winter Classic",
      dates: "January 9-11, 2026",
      startAt: null,
      endAt: null,
      timezone: null,
      venue: "State Arena",
      address: "123 Main St, Chicago, IL 60601",
      hostGym: "State Gym",
      admission: [],
      athlete: {},
      meetDetails: {
        resultsInfo: "Live scoring available at USACompetitions.com.",
        rotationSheetsInfo: "Rotation sheets will be posted on MeetScoresOnline.com.",
        operationalNotes: [
          "Gym A\tGym B",
          "B1\tW04",
          "8:00 AM\t12:30 PM",
          "Please review the following items enclosed in this packet:",
          "Coaches sign in at the registration table.",
          "Doors open at 7:00 AM.",
        ],
      },
      logistics: {
        hotel: "Book rooms at GroupBook.com/state-host-hotel.",
      },
      policies: {},
      coachInfo: {
        signIn: "Coaches sign in at the registration table.",
      },
      contacts: [],
      deadlines: [],
      gear: {},
      volunteers: {},
      communications: {},
      schedule: {
        venueLabel: "",
        supportEmail: "",
        notes: [],
        awardLegend: [],
        annotations: [],
        assignments: [],
        days: [],
      },
      links: [],
      unmappedFacts: [],
    })!,
    {},
    {
      sourceType: "file",
      usedOcr: false,
      linkedAssets: [],
      discoveredLinks: [],
      resourceLinks: [],
      crawledPages: [],
      gymLayoutFacts: ["Gym B is on the west side concourse."],
      gymLayoutPage: null,
      textQuality: "good",
      qualitySignals: emptyQualitySignals,
      schedulePageImages: [],
      schedulePageTexts: [],
    }
  );

  assert.deepEqual(mapped.advancedSections.meet.operationalNotes, [
    "Gym A\tGym B",
    "Doors open at 7:00 AM.",
  ]);
  assert.ok(
    mapped.links.some((item: any) => item.url === "https://usacompetitions.com/")
  );
  assert.ok(
    mapped.links.some((item: any) => item.url === "https://groupbook.com/state-host-hotel")
  );
});

test("mapParseResultToGymData tolerates missing inferred links when building top-level links", async () => {
  const mapped = await mapParseResultToGymData(
    normalizeParseResult({
      eventType: "gymnastics_meet",
      documentProfile: "meet_overview",
      title: "Winter Classic",
      dates: "January 9-11, 2026",
      startAt: null,
      endAt: null,
      timezone: null,
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
        venueLabel: "",
        supportEmail: "",
        notes: [],
        awardLegend: [],
        annotations: [],
        assignments: [],
        days: [],
      },
      links: [{ label: "Packet", url: "https://example.com/packet.pdf" }],
      unmappedFacts: [],
    })!,
    {}
  );

  assert.deepEqual(mapped.links, [
    {
      label: "Packet",
      url: "https://example.com/packet.pdf",
    },
  ]);
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
