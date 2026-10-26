import { afterEach, expect, test } from "bun:test";
import { createExtractionDeps, extractCreateInformation } from "./extract-information";
import { emptyCustomEventDetails } from "@/lib/event-custom-design";
import { readFileSync } from "node:fs";

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

test("school memos hand off after authorization without generic event planning or sports shells", async () => {
  const sourceText = readFileSync(new URL("../../../scripts/fixtures/school-memo.txt", import.meta.url), "utf8");
  const file = new File([sourceText], "school-memo.pdf", { type: "application/pdf" });
  const stages: string[] = [];
  let authorized = 0;
  createExtractionDeps.read = async (input) => {
    expect(input.files?.[0]).toBe(file);
    return { text: sourceText, images: [], pageCount: 2 };
  };
  createExtractionDeps.classify = async () => ({ category: "general", sport: null, confidence: "high", alternatives: [] });
  createExtractionDeps.information = async () => { throw new Error("A school memo must not become a public Event Page"); };
  const result = await extractCreateInformation({ files: [file], text: "Keep all school dates." }, new AbortController().signal, async (classification) => {
    authorized++;
    expect(classification.category).toBe("general");
    return true;
  }, {
    onStage: stage => stages.push(stage),
    prepareSports: async () => { throw new Error("A school memo must not create a sports shell"); },
  });
  expect(authorized).toBe(1);
  expect(result).toMatchObject({ destination: "snap", sourceText });
  expect(result.information).toBeUndefined();
  expect(stages).toEqual(["reading", "classifying"]);
  const denied = await extractCreateInformation({ files: [file] }, new AbortController().signal, async () => false);
  expect(denied.accessRequired).toBe(true);
  expect(denied.destination).toBeUndefined();
});

test("an intentional General Event or different Event Page category can reuse school source facts", async () => {
  createExtractionDeps.read = async () => ({ text: "School weekly memo. Math classes and reading homework.", images: [], pageCount: 1 });
  createExtractionDeps.classify = async () => ({ category: "general", sport: null, confidence: "high", alternatives: [] });
  createExtractionDeps.information = async (input) => ({ version: 1, kind: "information", category: input.category, design: { version: 1, name: "Event information", description: "", layout: "editorial", font: "editorial", colors: { page: "#ffffff", surface: "#ffffff", ink: "#111111", accent: "#123456" } }, details: { ...emptyCustomEventDetails(), title: "School fundraiser" } });
  for (const category of ["general", "special-events"] as const) {
    const result = await extractCreateInformation({ category }, new AbortController().signal);
    expect(result.destination).toBeUndefined();
    expect(result.information?.category).toBe(category);
  }
});

test("the authorized sports handoff reuses the single server read and skips generic page planning", async () => {
  const source = { text: "Gymnastics meet October 25: Session 1 at 9 AM, Session 2 at noon.", images: ["data:image/jpeg;base64,AA=="], pageCount: 1 };
  let reads = 0;
  const stages: string[] = [];
  createExtractionDeps.read = async () => { reads++; return source; };
  createExtractionDeps.classify = async () => ({ category: "sports", sport: "gymnastics", confidence: "high", alternatives: [] });
  createExtractionDeps.information = async () => { throw new Error("Generic information planning must not run for a specialty import"); };
  const result = await extractCreateInformation({ files: [new File(["photo"], "meet.jpg")] }, new AbortController().signal, async () => true, {
    onStage: stage => stages.push(stage),
    prepareSports: async (evidence, classification) => {
      expect(evidence).toBe(source);
      expect(classification.sport).toBe("gymnastics");
      return "retained-meet";
    },
  });
  expect(reads).toBe(1);
  expect(result.discoveryEventId).toBe("retained-meet");
  expect(result.sourceText).toBe(source.text);
  expect(result.information).toBeUndefined();
  expect(stages).toEqual(["reading", "classifying"]);
});

test("restricted sports never prepare a durable import", async () => {
  createExtractionDeps.read = async () => ({ text: "Gymnastics meet October 25 at City Gym", images: [], pageCount: 1 });
  createExtractionDeps.classify = async () => ({ category: "sports", sport: "gymnastics", confidence: "high", alternatives: [] });
  const result = await extractCreateInformation({}, new AbortController().signal, async () => false, {
    prepareSports: async () => { throw new Error("Unavailable categories must not create a shell"); },
  });
  expect(result.accessRequired).toBe(true);
  expect(result.discoveryEventId).toBeUndefined();
});
