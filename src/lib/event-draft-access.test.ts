import { expect, test } from "bun:test";
import { canReadEventDraft, isEventDraft, legacyDiscoveryDraftSql } from "./event-draft-access";

test("legacy processing and review-ready import shells stay private before explicit publication", () => {
  for (const status of ["processing", "review_ready", "ingested", "needs_review", "failed_extract"]) {
    const data = { createdVia: "meet-discovery-v2", status };
    expect(isEventDraft(data)).toBe(true);
    expect(canReadEventDraft(data, "owner", "guest")).toBe(false);
    expect(canReadEventDraft(data, "owner", "owner")).toBe(true);
  }
  expect(isEventDraft({ createdVia: "meet-discovery-v2", status: "processing", draftStatus: "published" })).toBe(false);
  expect(isEventDraft({ createdVia: "meet-discovery-v2", status: "published" })).toBe(false);
  expect(isEventDraft({ status: "processing" })).toBe(false);
  expect(isEventDraft({ discoverySource: {}, status: "processing" })).toBe(false);
  expect(isEventDraft({ discoverySource: { workflow: "gymnastics" }, draftStatus: "review_ready" })).toBe(true);
  expect(isEventDraft({ discoverySource: { workflow: "sports" }, status: "published", draftStatus: "processing" })).toBe(false);
});

test("cancelled unsaved import shells remain private and compact SQL checks match legacy stages", () => {
  expect(isEventDraft({ createdVia: "meet-discovery-v2", status: "cancelled", draftStatus: "draft" })).toBe(true);
  const sql = legacyDiscoveryDraftSql("eh.data");
  expect(sql).toContain("review_ready");
  expect(sql).toContain("discoverySource,workflow");
  expect(sql).toContain("eh.data->>'draftStatus',''))) in");
  expect(sql).toContain("<> 'published'");
});
