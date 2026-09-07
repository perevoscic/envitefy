import { describe, expect, mock, test } from "bun:test";
import { resolveGymDiscoveryTemplateSelection } from "./template-selection";

describe("gymnastics template selection through discovery", () => {
  test("keeps the chosen layout when parsing or enrichment suggests the default", () => {
    expect(resolveGymDiscoveryTemplateSelection("cyber-athlete", "launchpad-editorial")).toBe("cyber-athlete");
    expect(resolveGymDiscoveryTemplateSelection("paper-proto", "bento-box")).toBe("paper-proto");
  });
  test("uses a valid suggestion for older events and safely handles invalid input", () => {
    expect(resolveGymDiscoveryTemplateSelection(null, "swiss-grid")).toBe("swiss-grid");
    expect(resolveGymDiscoveryTemplateSelection("invalid", "invalid")).toBe("launchpad-editorial");
    expect(resolveGymDiscoveryTemplateSelection(undefined)).toBe("launchpad-editorial");
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
    userId: null, workflow: "gymnastics", title: "Test meet", pageTemplateId: "cyber-athlete", pipeline,
    source: { type: "url", url: "https://example.com/meet", createdAt: "2028-09-21", updatedAt: "2028-09-21" },
  });
  expect(storedEvent.data.pageTemplateId).toBe("cyber-athlete");
  const parsedDraft = buildEmptyGymBuilderDraft();
  parsedDraft.event.pageTemplateId = "launchpad-editorial";
  const snapshot = {
    workflow: "gymnastics", eventId: storedEvent.id, title: storedEvent.title,
    discoveryId: "test-discovery", status: "draft", pipeline, builderDraft: parsedDraft,
    publicArtifacts: buildEmptyGymPublicArtifacts(storedEvent.title), pageTemplateId: "launchpad-editorial",
  };
  await persistDiscoveryEventSnapshot(snapshot);
  expect(storedEvent.data.pageTemplateId).toBe("cyber-athlete");
  expect(storedEvent.data.builderDraft.event.pageTemplateId).toBe("cyber-athlete");
  // The host changes the style before a later enrichment write completes.
  storedEvent.data.pageTemplateId = "paper-proto";
  await persistDiscoveryEventSnapshot(snapshot);
  expect(storedEvent.data.pageTemplateId).toBe("paper-proto");
  expect(storedEvent.data.builderDraft.event.pageTemplateId).toBe("paper-proto");
});
