import { describe, expect, mock, test } from "bun:test";
import { resolveGymDiscoveryTemplateSelection } from "./template-selection";

describe("gymnastics template selection through discovery", () => {
  test("keeps the chosen layout when parsing or enrichment suggests the default", () => {
    expect(resolveGymDiscoveryTemplateSelection("neon-runway", "airborne-atlas")).toBe("neon-runway");
    expect(resolveGymDiscoveryTemplateSelection("petal-poise", "copper-grip")).toBe("petal-poise");
  });
  test("uses a valid suggestion for older events and safely handles invalid input", () => {
    expect(resolveGymDiscoveryTemplateSelection(null, "tidal-tumble")).toBe("tidal-tumble");
    expect(resolveGymDiscoveryTemplateSelection("invalid", "invalid")).toBe("airborne-atlas");
    expect(resolveGymDiscoveryTemplateSelection(undefined)).toBe("airborne-atlas");
  });
});

let storedEvent = { id: "test-meet", title: "Test meet", user_id: null, data: {} };
let concurrentSave = false;
let cancelled = false;
mock.module("@/lib/db", () => ({
  getEventHistoryById: async () => storedEvent,
  updateEventHistoryData: async (_id, data) => { storedEvent = { ...storedEvent, data }; return storedEvent; },
  updateEventHistoryTitle: async (_id, title) => { storedEvent = { ...storedEvent, title }; },
  insertEventHistory: async ({ title, data }) => { storedEvent = { ...storedEvent, title, data }; return storedEvent; },
  insertEventDiscovery: async () => ({ id: "test-discovery" }),
  getEventDiscoveryByEventId: async () => null,
  deleteEventHistoryById: async () => {},
  prepareEventHistoryData: (data) => data,
  query: async (_sql, [_id, data, expected, title]) => {
    if (concurrentSave || cancelled || JSON.stringify(storedEvent.data) !== expected) return { rows: [] };
    storedEvent = { ...storedEvent, title, data: JSON.parse(data) };
    return { rows: [storedEvent] };
  },
}));

const { createDiscoveryShell, persistDiscoveryEventSnapshot } = await import("./persist");
const { buildEmptyGymBuilderDraft, buildEmptyGymPublicArtifacts, createDiscoveryPipelineState } = await import("./shared");

test("intake shell, parsed draft, and enrichment retain the selected design in stored and builder data", async () => {
  const pipeline = createDiscoveryPipelineState({ processingStage: "ingested" });
  await createDiscoveryShell({
    userId: null, workflow: "gymnastics", title: "Test meet", pageTemplateId: "neon-runway", pipeline,
    source: { type: "url", url: "https://example.com/meet", createdAt: "2028-09-21", updatedAt: "2028-09-21" },
  });
  expect(storedEvent.data.pageTemplateId).toBe("neon-runway");
  expect(storedEvent.data.status).toBe("draft");
  expect(storedEvent.data.draftStatus).toBe("draft");
  const parsedDraft = buildEmptyGymBuilderDraft();
  parsedDraft.event.pageTemplateId = "airborne-atlas";
  const snapshot = {
    workflow: "gymnastics", eventId: storedEvent.id, title: storedEvent.title,
    discoveryId: "test-discovery", status: "draft", pipeline, builderDraft: parsedDraft,
    publicArtifacts: buildEmptyGymPublicArtifacts(storedEvent.title), pageTemplateId: "airborne-atlas",
  };
  await persistDiscoveryEventSnapshot(snapshot);
  expect(storedEvent.data.pageTemplateId).toBe("neon-runway");
  expect(storedEvent.data.builderDraft.event.pageTemplateId).toBe("neon-runway");
  // The host changes the style before a later enrichment write completes.
  storedEvent.data.pageTemplateId = "petal-poise";
  await persistDiscoveryEventSnapshot(snapshot);
  expect(storedEvent.data.pageTemplateId).toBe("petal-poise");
  expect(storedEvent.data.builderDraft.event.pageTemplateId).toBe("petal-poise");
});

test("slow enrichment cannot overwrite an explicit editor save or cancellation", async () => {
  const original = { ...storedEvent, data: { ...storedEvent.data, manualEditor: { snapshot: { data: { title: "Host edited title" } } }, title: "Host edited title", venue: "Host venue", status: "published", draftStatus: "published" } };
  storedEvent = original;
  const snapshot = { workflow: "gymnastics", eventId: storedEvent.id, title: "Old extracted title", discoveryId: "test-discovery", status: "review_ready", pipeline: createDiscoveryPipelineState(), builderDraft: buildEmptyGymBuilderDraft(), publicArtifacts: buildEmptyGymPublicArtifacts("Old title") };
  await persistDiscoveryEventSnapshot(snapshot);
  expect(storedEvent.data.title).toBe("Host edited title");
  expect(storedEvent.data.venue).toBe("Host venue");
  expect(storedEvent.data.status).toBe("published");
  concurrentSave = true;
  const unchanged = JSON.stringify(storedEvent);
  await persistDiscoveryEventSnapshot(snapshot);
  expect(JSON.stringify(storedEvent)).toBe(unchanged);
  concurrentSave = false;
  cancelled = true;
  await persistDiscoveryEventSnapshot(snapshot);
  expect(JSON.stringify(storedEvent)).toBe(unchanged);
  cancelled = false;
});
