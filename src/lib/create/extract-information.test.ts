import { afterEach, expect, test } from "bun:test";
import { createExtractionDeps, extractCreateInformation } from "./extract-information";
import { emptyCustomEventDetails } from "@/lib/event-custom-design";

const original = { ...createExtractionDeps };
afterEach(() => Object.assign(createExtractionDeps, original));

test("classifies the source independently, retains host corrections and never requests artwork", async () => {
  createExtractionDeps.read = async () => ({ text: "Football schedule: Tigers vs Central May 3 at Old Stadium", images: [], pageCount: 1 });
  createExtractionDeps.classify = async (input) => {
    expect(input.text).toContain("Football schedule");
    expect(input.text).not.toContain("birthday colors");
    return { category: "sports", sport: "football", confidence: "high", alternatives: [] };
  };
  createExtractionDeps.information = async (input) => {
    expect(input.mode).toBe("information");
    expect(input.informationText).toContain("Old Stadium");
    expect(input.prompt).toContain("Venue changed to Riverside Park; use birthday colors.");
    return { version: 1, kind: "information", category: input.category, design: { version: 1, name: "Event information", description: "", layout: "editorial", font: "editorial", colors: { page: "#ffffff", surface: "#ffffff", ink: "#111111", accent: "#123456" } }, details: { ...emptyCustomEventDetails(), title: "Tigers vs Central", venue: "Riverside Park" } };
  };
  const result = await extractCreateInformation({ text: "Venue changed to Riverside Park; use birthday colors.", category: "general" }, new AbortController().signal);
  expect(result.classification.category).toBe("sports");
  expect(result.information.category).toBe("general");
  expect(result.information.details.venue).toBe("Riverside Park");
  expect(result.sourceText).toContain("Old Stadium");
});

test("denied recognized categories return recognition without paid information planning", async () => {
  createExtractionDeps.read = async () => ({ text: "Wedding at Riverside Park", images: [], pageCount: 1 });
  createExtractionDeps.classify = async () => ({ category: "weddings", sport: null, confidence: "high", alternatives: [] });
  createExtractionDeps.information = async () => { throw new Error("Must not plan an unavailable category"); };
  const result = await extractCreateInformation({ text: "A wedding" }, new AbortController().signal, async () => false);
  expect(result.accessRequired).toBe(true);
  expect(result.classification.category).toBe("weddings");
  expect(result.information).toBeUndefined();
});

test("medical sources remain in Snap without entering the public Event Page planner", async () => {
  createExtractionDeps.read = async () => ({ text: "Medical appointment with ENT on May 3", images: [], pageCount: 1 });
  createExtractionDeps.classify = async () => ({ category: "medical-appointments", sport: null, confidence: "high", alternatives: [] });
  createExtractionDeps.information = async () => { throw new Error("Must not plan a medical Event Page"); };
  const result = await extractCreateInformation({ text: "Medical appointment" }, new AbortController().signal);
  expect(result.destination).toBe("snap");
  expect(result.information).toBeUndefined();
});
