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
mock.module("@/lib/db", () => ({
  getEventHistoryById: async () => storedEvent,
  updateEventHistoryData: async (_id, data) => { storedEvent = { ...storedEvent, data }; return storedEvent; },
  updateEventHistoryTitle: async (_id, title) => { storedEvent = { ...storedEvent, title }; },
  insertEventHistory: async ({ title, data }) => { storedEvent = { ...storedEvent, title, data }; return storedEvent; },
  insertEventDiscovery: async () => ({ id: "test-discovery" }),
  getEventDiscoveryByEventId: async () => null,
  deleteEventHistoryById: async () => {},
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
