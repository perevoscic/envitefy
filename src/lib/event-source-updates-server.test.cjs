const assert = require("node:assert/strict");
const test = require("node:test");
const load = require("../../scripts/lib/event-messages-test-loader.cjs");

function fixture({ title = "Winter Meet", year = "2027", partial = false } = {}) {
  const reads = [],
    maps = [],
    parsedTexts = [];
  const old = { title: "Winter Meet", startAt: "2027-04-10", date: "2027-04-10" };
  const website = {
    version: 1,
    eventYear: 2027,
    sources: [],
    coverage: partial
      ? [{ section: "hotels", status: "failed", reason: "Hotel page timed out" }]
      : [],
    participatingClubs: [],
    attractions: [],
    schedule: { status: "available", notice: "Schedule posted", links: [] },
  };
  const { checkEventSource } = load("src/lib/event-source-updates.server.ts", {
    "@/lib/sports-discovery": {
      getDiscoveryAdapter: () => ({
        parse: async (params) => {
          parsedTexts.push(params.extractedText);
          return {
            parseResult: { title, startAt: `${year}-04-10`, date: `${year}-04-10` },
          };
        },
        map: async ({ parseResult, currentData }) => {
          maps.push(currentData);
          return { ...parseResult, advancedSections: { schedule: { days: [] } } };
        },
      }),
    },
    "@/lib/meet-discovery": {
      extractDiscoveryText: async (source) => {
        reads.push(source);
        return {
          extractedText: "Official Winter Meet source",
          extractionMeta: { websiteImport: website },
        };
      },
      finalizeMeetParseResult: async (value) => value,
      buildGymDiscoveryPublicPageArtifacts: () => ({
        publicPageSections: { parking: { body: "North lot", visibility: "visible" } },
      }),
    },
    "@/lib/discovery/schedule-enrichment": {
      enrichLinkedMeetSchedules: async () => ({
        imports: [
          {
            days: [
              {
                isoDate: "2027-04-10",
                sessions: [
                  {
                    code: "A1",
                    label: "Gym A",
                    group: "Level 6",
                    startTime: "",
                    warmupTime: "",
                    note: "",
                    clubs: [],
                  },
                ],
              },
            ],
            source: {
              fileName: "schedule.pdf",
              url: "https://example.com/schedule.pdf",
              text: "Winter Meet 2027 Gym A Level 6",
            },
          },
        ],
        documents: partial
          ? [
              {
                url: "https://example.com/other.pdf",
                status: "failed",
                reason: "PDF fetch timed out",
              },
            ]
          : [],
        notes: [],
      }),
    },
    "@/lib/create/extract-information": {
      extractCreateInformation: async () => {
        throw new Error("Sports must use their specialized adapter");
      },
    },
    "@/lib/event-custom-design": { customEventCategory: () => "general" },
    "@/lib/travel-accommodation-enrichment": {
      enrichTravelAccommodation: async () => ({ hotels: [] }),
      buildTravelAccommodationState: (value) => value,
    },
  });
  const discovery = {
    id: "discovery",
    eventId: "original-event",
    workflow: "gymnastics",
    source: {
      type: "url",
      url: "https://example.com/original",
      text: "Host correction: admission is free.",
    },
    debug: { coreParseResult: old },
    document: { extractionMeta: {} },
  };
  return {
    check: () =>
      checkEventSource(
        {
          title: "Host retitled event",
          details: "Host prose",
          timezone: "America/Chicago",
          address: "Verified venue address",
        },
        discovery,
        new AbortController().signal,
      ),
    reads,
    maps,
    parsedTexts,
  };
}
test("checks use the original protected URL, fresh linked schedules and pure mapping without host prose or artwork", async () => {
  const f = fixture({ partial: true });
  const result = await f.check();
  assert.equal(f.reads[0].url, "https://example.com/original");
  assert.match(
    f.parsedTexts[0],
    /HOST-AUTHORED CORRECTIONS AND INSTRUCTIONS[\s\S]*admission is free/,
  );
  assert.equal(result.incoming.advancedSections.schedule.days[0].sessions[0].startTime, "");
  assert.equal(result.incoming.publicPageSections.parking.body, "North lot");
  assert.match(result.warnings.join("\n"), /Hotel page timed out/);
  assert.match(result.warnings.join("\n"), /PDF fetch timed out/);
  assert.equal(
    f.maps.every((value) => !value.details && !value.title && !value.heroImage),
    true,
  );
});
test("next-edition and mismatched-event sources fail before mapping or changes", async () => {
  for (const options of [{ title: "Completely Different Championship" }, { year: "2028" }]) {
    const f = fixture(options);
    await assert.rejects(f.check(), /another event/);
    assert.equal(f.maps.length, 0);
  }
});
