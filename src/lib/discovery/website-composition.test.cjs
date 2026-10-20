const assert = require("node:assert/strict");
const test = require("node:test");
const loadTs = require("../../../scripts/lib/event-messages-test-loader.cjs");

const website = {
  version: 1,
  eventYear: 2027,
  sources: [],
  coverage: [
    {
      section: "schedule",
      status: "unavailable",
      sourceUrls: ["https://meet.test/schedule"],
      reason: "Not yet published",
    },
  ],
  participatingClubs: [
    {
      name: "Coastal Gym",
      location: "Atlanta, GA",
      year: 2027,
      sourceUrl: "https://meet.test/competing-teams",
    },
  ],
  attractions: [
    {
      name: "City Aquarium",
      description: "Explore the exhibits.",
      url: "https://aquarium.test/tickets?offer=meet",
      sourceUrl: "https://meet.test/plan-your-visit",
    },
  ],
  schedule: {
    status: "not_posted",
    notice: "2027 schedule not yet published.",
    links: [{ label: "Official schedule", url: "https://meet.test/schedule" }],
  },
};

test("website mappings and coverage persist with the builder and travel state, rather than stale source data", async () => {
  const source = {
    input: { type: "url", url: "https://meet.test/overview" },
    customHostField: "retained",
    websiteImport: { stale: true },
  };
  const { runDiscoveryComposePublicStage } = loadTs("src/lib/discovery/compose-public.ts", {
    "@/lib/db": {
      getEventHistoryById: async () => ({ data: { title: "2027 Meet", discoverySource: source } }),
    },
    "@/lib/discovery/cancel": { throwIfDiscoveryCancelled: () => {} },
    "@/lib/discovery/map": {
      themeDiscoveryData: (_discovery, _currentData, mappedData) => mappedData,
      buildGymBuilderDraft: ({ mappedData, reviewFlags }) => ({
        event: mappedData,
        venue: {},
        advancedSections: {},
        canonicalLinks: {},
        reviewFlags,
      }),
    },
    "@/lib/football-discovery": {},
    "@/lib/sports-discovery": {},
    "@/lib/meet-discovery": {
      mapParseResultToGymData: async (_parse, data) => ({
        ...data,
        venue: "Competition Center",
        address: "2000 Convention Center Concourse",
      }),
      buildGymDiscoveryPublicPageArtifacts: () => ({
        publicPageSections: {},
        publishAssessment: { state: "auto_publish", reasons: [] },
      }),
    },
  });
  const result = await runDiscoveryComposePublicStage({
    eventId: "fixture",
    workflow: "gymnastics",
    document: { extractionMeta: { websiteImport: website } },
    enrichment: { parseResult: {}, travelAccommodation: { hotels: [] } },
    canonicalParse: { issues: [] },
  });
  const saved = JSON.parse(
    JSON.stringify({
      ...result.builderDraft.event,
      ...result.eventDataPatch,
      publicArtifacts: result.publicArtifacts,
    }),
  );
  assert.deepEqual(saved.discoverySource.websiteImport, website);
  assert.deepEqual(saved.discoverySource.travelAccommodation, { hotels: [] });
  assert.equal(saved.discoverySource.customHostField, "retained");
  assert.equal(saved.venue, "Competition Center");
  assert.equal(
    saved.publicArtifacts.sections.scheduleAvailability.body,
    "2027 schedule not yet published.",
  );
  assert.deepEqual(saved.publicArtifacts.sections.participatingClubs.bullets, [
    "Coastal Gym — Atlanta, GA",
  ]);
  assert.equal(
    saved.publicArtifacts.sections.attractions.links[0].url,
    "https://aquarium.test/tickets?offer=meet",
  );
});

test("reused gymnastics URL text still runs website discovery, while file reads remain reusable", async () => {
  let calls = 0;
  const { runDiscoveryExtractStage } = loadTs("src/lib/discovery/extract.ts", {
    "@/lib/discovery/cancel": { throwIfDiscoveryCancelled: () => {} },
    "@/lib/discovery-file-hydration": {},
    "@/lib/meet-discovery": {
      createDiscoveryPerformance: () => ({}),
      resolveDiscoveryBudget: () => 1000,
      isDiscoveryDebugArtifactsEnabled: () => false,
      extractDiscoveryText: async () => {
        calls++;
        return {
          extractedText: "2027 Meet information from related website pages.",
          extractionMeta: { websiteImport: website, usedOcr: false },
        };
      },
    },
  });
  const original = {
    sourceType: "url",
    pages: [],
    extractionMeta: {
      sourceReadVersion: 1,
      reusedCreateSource: true,
      extractedText: "This is the previously read single source page.",
    },
  };
  const url = await runDiscoveryExtractStage({
    workflow: "gymnastics",
    source: { type: "url", url: "https://meet.test/overview" },
    document: original,
  });
  assert.equal(calls, 1);
  assert.deepEqual(url.document.extractionMeta.websiteImport, website);
  await runDiscoveryExtractStage({
    workflow: "gymnastics",
    source: { type: "file" },
    document: { ...original, sourceType: "pdf" },
  });
  assert.equal(calls, 1, "a previously completed file read must not be repeated");
});
