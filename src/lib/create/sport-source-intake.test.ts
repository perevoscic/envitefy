import { afterEach, expect, test } from "bun:test";
import { discoveryDocumentFromCreateSource, prepareSportsSourceIntake, sportsGuessForExtraction, sportSourceIntakeDeps } from "./sport-source-intake";
import type { ReadCreateSourceResult } from "./read-source";
import type { CreateClassification } from "./create-intent";

const original = { ...sportSourceIntakeDeps };
afterEach(() => Object.assign(sportSourceIntakeDeps, original));
const classification: CreateClassification = { category: "sports", sport: "gymnastics", confidence: "high", alternatives: [] };
const source: ReadCreateSourceResult = {
  text: "Page 1\nGymnastics meet. Session 1 at 9 AM.\nPage 2\nSession 2 at noon. No outside food.",
  images: [], pageCount: 2, usedOcr: true,
  pages: [{ pageNumber: 1, text: "Gymnastics meet. Session 1 at 9 AM." }, { pageNumber: 2, text: "Session 2 at noon. No outside food." }],
  links: [{ url: "https://meet.example/hotel?group=team", label: "Team hotel", pageNumber: 2 }],
};

test("confident sports prepare directly while ambiguous and non-sports corrections retain review", () => {
  expect(sportsGuessForExtraction(classification)?.sport).toBe("gymnastics");
  expect(sportsGuessForExtraction({ ...classification, confidence: "low" })).toBeNull();
  expect(sportsGuessForExtraction(classification, "birthdays")).toBeNull();
  expect(sportsGuessForExtraction({ ...classification, confidence: "low", sport: null }, "football")?.sport).toBe("football");
  expect(sportsGuessForExtraction(classification, "sport-events", "tennis")?.sport).toBe("tennis");
  expect(sportsGuessForExtraction(classification, "sport-events", "invented-sport")).toBeNull();
});

test("ordered schedule text and hidden link destinations survive the trusted handoff", () => {
  const doc = discoveryDocumentFromCreateSource(source, [new File(["pdf"], "packet.pdf", { type: "application/pdf" })]);
  expect(doc.sourceType).toBe("pdf");
  expect(doc.pageCount).toBe(2);
  expect(doc.pages).toEqual(source.pages!);
  expect(doc.extractionMeta.extractedText).toContain("No outside food.");
  expect(doc.extractionMeta.reusedCreateSource).toBe(true);
  expect(doc.links[0].url).toBe("https://meet.example/hotel?group=team");
  expect(doc.ocrUsed).toBe(true);
});

test("the first upload is handed to durable storage on the server with the same intake identity", async () => {
  const file = new File(["original PDF bytes"], "meet.pdf", { type: "application/pdf" });
  let calls = 0;
  sportSourceIntakeDeps.intake = (async params => {
    calls++;
    const form = params.sourceForm!;
    expect(params.request.body).toBeNull();
    expect(await (form.get("file") as File).text()).toBe("original PDF bytes");
    expect(form.get("clientIntakeId")).toBe("original-intake");
    expect(form.get("workflow")).toBe("gymnastics");
    expect(form.get("pageTemplateId")).toBeTruthy();
    expect(params.document?.pages).toEqual(source.pages!);
    expect(params.document?.extractionMeta.extractedText).toBe(source.text);
    expect(params.userId).toBe("owner-1");
    return { ok: true, eventId: "stored-event" };
  }) as typeof sportSourceIntakeDeps.intake;
  expect(await prepareSportsSourceIntake({ userId: "owner-1", clientIntakeId: "original-intake", source, guess: classification, files: [file], text: "Session 2 moved to 1 PM", signal: new AbortController().signal })).toBe("stored-event");
  expect(calls).toBe(1);
});

test("URL handoffs retain the validated URL and leave deeper specialty crawling enabled", async () => {
  sportSourceIntakeDeps.intake = (async params => {
    expect(params.validatedUrl).toBe("https://meet.example/schedule");
    expect(params.document).toBeUndefined();
    expect((await params.request.json()).url).toBe("https://meet.example/schedule");
    return { ok: true, eventId: "url-event" };
  }) as typeof sportSourceIntakeDeps.intake;
  await prepareSportsSourceIntake({ userId: "owner-1", clientIntakeId: "original-intake", source: { ...source, url: "https://meet.example/schedule" }, guess: classification, files: [], text: "", url: "https://meet.example/schedule", signal: new AbortController().signal });
});

test("aborting before intake never creates a late shell", async () => {
  sportSourceIntakeDeps.intake = async () => { throw new Error("Must not create"); };
  const controller = new AbortController();
  controller.abort(new Error("Host cancelled"));
  await expect(prepareSportsSourceIntake({ userId: "owner-1", clientIntakeId: "original-intake", source, guess: classification, files: [], text: "", signal: controller.signal })).rejects.toThrow("Host cancelled");
});
