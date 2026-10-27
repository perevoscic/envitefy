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

test("school memos stay in Create after authorization without generic planning or sports shells", async () => {
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
  expect(result.destination).toBeUndefined();
  expect(result.classification).toMatchObject({ category: "school", schoolTemplate: "weekly-memo" });
  expect(result.information?.details.schoolTemplate).toBe("weekly-memo");
  expect(result.sourceText).toBe(sourceText);
  expect(result.information?.category).toBe("general");
  expect(result.information?.details.scanSchedule?.items).toHaveLength(6);
  expect(result.information?.details.venue).toBe("");
  expect(result.information?.details.location).toBe("");
  expect(result.information?.details.date).toBe("");
  expect(result.information?.details.sections.map(section => section.title)).toContain("Science");
  expect(result.information?.details.sections.map(section => section.title)).toContain("At Home Partnership Tips");
  expect(result.information?.details.sections.map(section => section.body).join("\n")).toContain("Binders are taken home and returned to school daily.");
  expect(stages).toEqual(["reading", "classifying", "extracting_details"]);
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

test.each([
  ["field-trip", "Grade 3 class field trip November 6. School bus leaves at 9 AM. Bring lunch."],
  ["school-celebration", "Oak Elementary School Spirit Day November 6. Wear school colors."],
  ["parent-meeting", "Oak School parent-teacher conferences November 6. Agenda: student progress."],
])("school upload %s stays in the Create planner with supported school sections", async (kind, sourceText) => {
  const { classifyCreateText } = await import("./create-intent");
  createExtractionDeps.read = async () => ({ text: sourceText, images: [], pageCount: 1 });
  createExtractionDeps.classify = async () => classifyCreateText(sourceText);
  createExtractionDeps.information = async input => {
    expect(input.prompt).toContain(`School & classroom ${kind}`);
    return { version: 1, kind: "information", category: "general", design: { version: 1, name: "School", description: "", layout: "editorial", font: "editorial", colors: { page: "#ffffff", surface: "#ffffff", ink: "#111111", accent: "#607e68" } }, details: { ...emptyCustomEventDetails(), title: "School activity", description: sourceText } };
  };
  const result = await extractCreateInformation({ text: sourceText }, new AbortController().signal, async () => true);
  expect(result.destination).toBeUndefined();
  expect(result.classification.category).toBe("school");
  expect(result.information?.details.schoolTemplate).toBe(kind);
  expect(result.information?.details.sections.length).toBeGreaterThan(0);
  expect(result.information?.details.scanSchedule).toBeUndefined();
});

test("school uploads restore PDF letter spacing without changing the source transcript or calendar dates", async () => {
  const { schoolMemoTypographyDeps } = await import("../school-memo-typography.server");
  const previous = schoolMemoTypographyDeps.complete;
  const spaced = '“. . . . R e p e n t , f o r t h e k i n g d o m o f h e a v e n h a s c o m e n e a r.”\nM a t t h e w 3 : 2\nT e s t : F r i d a y O c t o b e r 3 0 t h';
  const clean = '“....Repent, for the kingdom of heaven has come near.”\nMatthew 3:2\n\nTest: Friday October 30th';
  const sourceText = `School Weekly Memo\nOctober 26th\nImportant Reminders:\nBible Test Friday October 30th\nSpelling Test Friday October 30th\nBible - memory verse and multiple choice test\n\n${spaced}`;
  createExtractionDeps.read = async () => ({ text: sourceText, images: [], pageCount: 1 });
  createExtractionDeps.classify = async () => ({ category: "school", schoolTemplate: "weekly-memo", sport: null, confidence: "high", alternatives: [] });
  schoolMemoTypographyDeps.complete = async input => { expect(input).toBe(sourceText); return input.replace(spaced, clean); };
  try {
    const result = await extractCreateInformation({ text: sourceText, timezone: "America/Chicago" }, new AbortController().signal);
    expect(result.sourceText).toBe(sourceText);
    const bible = result.information?.details.sections.find(section => section.title === "Bible");
    expect(bible?.body).toContain(clean);
    expect(bible?.body).not.toContain("M a t t h e w");
    expect(result.information?.details.scanSchedule?.items.map(item => item.date)).toEqual(["2026-10-30", "2026-10-30"]);
  } finally { schoolMemoTypographyDeps.complete = previous; }
});

test.each(["timeout", "changed wording"])("memo import retains source notes and dates when typography fails: %s", async failure => {
  const { schoolMemoTypographyDeps } = await import("../school-memo-typography.server");
  const previous = schoolMemoTypographyDeps.complete;
  const sourceText = `School Weekly Memo\nOctober 26th\nImportant Reminders:\nBible Test Friday October 30th\nSpelling Test Friday October 30th\nBible - R e a d t h e v e r s e\nScience - Bring your workbook.`;
  createExtractionDeps.read = async () => ({ text: sourceText, images: [], pageCount: 1 });
  createExtractionDeps.classify = async () => ({ category: "school", schoolTemplate: "weekly-memo", sport: null, confidence: "high", alternatives: [] });
  schoolMemoTypographyDeps.complete = async () => {
    if (failure === "timeout") throw new Error("Typography timed out");
    return "Invented replacement notes";
  };
  try {
    const result = await extractCreateInformation({ text: sourceText, timezone: "America/Chicago" }, new AbortController().signal);
    expect(result.sourceText).toBe(sourceText);
    expect(result.information?.details.sections.find(section => section.title === "Bible")?.body).toBe("R e a d t h e v e r s e");
    expect(result.information?.details.sections.find(section => section.title === "Science")?.body).toBe("Bring your workbook.");
    expect(result.information?.details.scanSchedule?.items.map(item => item.date)).toEqual(["2026-10-30", "2026-10-30"]);
    expect(result.information?.details.schoolTemplate).toBe("weekly-memo");
  } finally { schoolMemoTypographyDeps.complete = previous; }
});

test("a rejected whole-memo typography repair can recover using smaller sections", async () => {
  const { schoolMemoTypographyDeps } = await import("../school-memo-typography.server");
  const previous = schoolMemoTypographyDeps.complete;
  const spaced = "S t u d y t h e v e r s e";
  const sourceText = `School Weekly Memo\nOctober 26th\nImportant Reminders:\nBible Test Friday October 30th\nSpelling Test Friday October 30th\nBible - ${spaced}`;
  createExtractionDeps.read = async () => ({ text: sourceText, images: [], pageCount: 1 });
  createExtractionDeps.classify = async () => ({ category: "school", schoolTemplate: "weekly-memo", sport: null, confidence: "high", alternatives: [] });
  const calls: string[] = [];
  schoolMemoTypographyDeps.complete = async input => {
    calls.push(input);
    return input === spaced ? "Study the verse" : "Changed source wording";
  };
  try {
    const result = await extractCreateInformation({ text: sourceText }, new AbortController().signal);
    expect(result.sourceText).toBe(sourceText);
    expect(result.information?.details.sections.find(section => section.title === "Bible")?.body).toBe("Study the verse");
    expect(calls).toEqual([sourceText, spaced]);
  } finally { schoolMemoTypographyDeps.complete = previous; }
});
