import { expect, test } from "bun:test";
import { mergeDiscoveryEditorRefresh } from "./merge-discovery-editor-refresh";
test("an image from an earlier import design never merges into a host's redesigned theme", () => {
  const previous = { importedTheme: { id: "original", colors: "blue" } };
  const current = { importedTheme: { id: "redesign", colors: "gold" } };
  const incoming = { importedTheme: { id: "original", colors: "blue", artworkUrl: "https://assets.test/original.webp" } };
  expect(mergeDiscoveryEditorRefresh(current, previous, incoming)).toEqual(current);
});

test("background enrichment preserves wording edits and intentional clears while adding untouched details", () => {
  const previous = { title: "Meet", venue: "Arena", address: "Old address", extra: { admission: "", team: "Team A" } };
  const current = { ...previous, title: "Our meet", venue: "", extra: { ...previous.extra, team: "Team B" } };
  const incoming = { title: "Enriched meet", venue: "New arena", address: "Verified address", extra: { admission: "$10", team: "Team A" } };
  expect(mergeDiscoveryEditorRefresh(current, previous, incoming)).toEqual({
    title: "Our meet", venue: "", address: "Verified address", extra: { admission: "$10", team: "Team B" },
  });
});

test("nested section edits and reordered arrays survive successive server snapshots", () => {
  const previous = { meet: { session: "1", notes: "" }, logistics: { parking: "" }, items: ["A", "B"] };
  const current = { meet: { session: "2", notes: "" }, logistics: { parking: "" }, items: ["B", "A"] };
  const incoming = { meet: { session: "1", notes: "Doors open at 8" }, logistics: { parking: "North lot" }, items: ["A", "B", "C"] };
  const first = mergeDiscoveryEditorRefresh(current, previous, incoming);
  expect(first).toEqual({ meet: { session: "2", notes: "Doors open at 8" }, logistics: { parking: "North lot" }, items: ["B", "A"] });
  expect(mergeDiscoveryEditorRefresh(first, incoming, { ...incoming, logistics: { parking: "South lot" } }).logistics.parking).toBe("South lot");
});
